#include "muxer.h"
#include <libavcodec/avcodec.h>
#include <libavformat/avformat.h>

#include <libavformat/avio.h>
#include <libavutil/imgutils.h>
#include <libswresample/swresample.h>
#include <libavutil/opt.h>

struct buffer_data {
    uint8_t *buf;
    int size;
    uint8_t *ptr;
    size_t room; ///< size left in the buffer
};

AVFormatContext *ofmt_ctx = NULL;
AVIOContext *avio_ctx = NULL;
uint8_t *avio_ctx_buffer = NULL;
size_t avio_ctx_buffer_size = 4096;
int i, ret = 0;
struct buffer_data bd = { 0 };
const size_t bd_buf_size = 1024;
const char* codec_name1 = "libx264";

//VIDEO
AVFrame *video_frame, *audio_frame;
int frameIdx = 0;
AVStream *video_stream = NULL;
AVStream *audio_stream = NULL;

AVPacket *pkt;
AVPacket *audio_pkt;

static struct SwsContext *sws_context = NULL;
static struct SwsContext *audio_swr_ctx = NULL;
AVCodecContext *video_ctx, *audio_ctx;


int have_audio = 0;

//AUDIO
int frame_bytes, audio_idx, bytes_read, dst_nb_samples; 
int src_sample_rate, src_bit_rate, src_nr_channels, src_size;
uint8_t* src_buf_left;
uint8_t* src_buf_right;


static int64_t seek (void *opaque, int64_t offset, int whence) {
    struct buffer_data *bd = (struct buffer_data *)opaque;
    switch(whence){
        case SEEK_SET:
            bd->ptr = bd->buf + offset;
            return bd->ptr;
            break;
        case SEEK_CUR:
            bd->ptr += offset;
            break;
        case SEEK_END:
            bd->ptr = (bd->buf + bd->size) + offset;
            return bd->ptr;
            break;
        case AVSEEK_SIZE:
            return bd->size;
            break;
        default:
           return -1;
    }
    return 1;
}

static int write_packet(void *opaque, uint8_t *buf, int buf_size) {
    
    struct buffer_data *bd = (struct buffer_data *)opaque;
    while (buf_size > bd->room) {
        int64_t offset = bd->ptr - bd->buf;
        bd->buf = av_realloc_f(bd->buf, 2, bd->size);
        if (!bd->buf)
            return AVERROR(ENOMEM);
        bd->size *= 2;
        bd->ptr = bd->buf + offset;
        bd->room = bd->size - offset;
    }
    //printf("write packet pkt_size:%d used_buf_size:%zu buf_size:%zu buf_room:%zu\n", buf_size, bd->ptr-bd->buf, bd->size, bd->room);

    memcpy(bd->ptr, buf, buf_size);
    bd->ptr  += buf_size;
    bd->room -= buf_size;
    
    //free(buf);
    return buf_size;
}

static void muxer_encode(AVFrame *frame, AVCodecContext* cod, AVStream* out, AVPacket* p) {    
    ret = avcodec_send_frame(cod, frame);

    if (ret < 0) {
        //printf(stderr, "Error sending a frame for encoding\n");
        exit(1);
    }

    while (ret >= 0) {
        ret = avcodec_receive_packet(cod, p);
        if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF){
            av_packet_unref(p);
            return;
        }
        else if (ret < 0) {
            //printf(stderr, "Error during encoding\n");
            exit(1);
        }

        //log_packet(ofmt_ctx, pkt, "write");
        
    }
}


void muxer_add_frame(uint8_t* data, int dts, int pts, int size){ 
    pkt->data = data;
    pkt->size = size;
    pkt->dts = dts;
    pkt->pts = pts;

    pkt->stream_index = video_stream->index;      
    av_packet_rescale_ts(pkt, video_ctx->time_base, video_stream->time_base);
    av_write_frame(ofmt_ctx, pkt);
    //av_packet_unref(p);
}

void write_header() {
    ret = avformat_write_header(ofmt_ctx, NULL);
    if (ret < 0) {
        //printf(stderr, "Error occurred: %s\n", av_err2str(ret));
        //printf(stderr, "Error occurred when opening output file\n");
        exit(1);
    } 
}

void muxer_video_init(int w, int h, int fps, int br, int preset_idx){
    AVOutputFormat* of = av_guess_format("mp4", 0, 0);
    bd.ptr  = bd.buf = av_malloc(bd_buf_size);

    if (!bd.buf) {
        ret = AVERROR(ENOMEM);
    }
    bd.size = bd.room = bd_buf_size;
    
    avio_ctx_buffer = av_malloc(avio_ctx_buffer_size);
    if (!avio_ctx_buffer) {
        ret = AVERROR(ENOMEM);
        exit(1);
    }
    avio_ctx = avio_alloc_context(avio_ctx_buffer, avio_ctx_buffer_size, 1, &bd, NULL, &write_packet, &seek);
    if (!avio_ctx) {
        ret = AVERROR(ENOMEM);
        exit(1);
    }

    ret = avformat_alloc_output_context2(&ofmt_ctx, of, NULL, NULL);
    if (ret < 0) {
        //printf(stderr, "Could not create output context\n");
        exit(1);
    }
    
    AVCodec* video_codec = avcodec_find_encoder_by_name(codec_name1);
    if (!video_codec) {
        //printf(stderr, "Codec '%s' not found\n", codec_name);
        exit(1);
    }
   
    video_ctx = avcodec_alloc_context3(video_codec);
    video_ctx->width = w;
    video_ctx->height = h;
    video_ctx->time_base.num = 1;
    video_ctx->time_base.den = fps;
    video_ctx->bit_rate = br; 
    
    video_ctx->gop_size = 10;
    video_ctx->max_b_frames = 1;
    video_ctx->pix_fmt = AV_PIX_FMT_YUV420P;



    pkt = av_packet_alloc();
    if(!pkt){
        //printf("errror packer\n");
        exit(1);
    }
        
    video_stream = avformat_new_stream(ofmt_ctx, NULL);  
    if(!video_stream){
        //printf(stderr, "error making stream\n");
        exit(1);
    }
    
    ofmt_ctx->pb = avio_ctx;
    ofmt_ctx->flags |= AVFMT_FLAG_CUSTOM_IO;

    ofmt_ctx->oformat = of;
    video_stream->codec->codec_tag = 0;

    video_stream->time_base = video_ctx->time_base;
    video_stream->id = ofmt_ctx->nb_streams-1;
    ret = avcodec_parameters_from_context(video_stream->codecpar, video_ctx);
} 

int close_stream() {
    
    av_write_trailer(ofmt_ctx);
    /* close output */
    avformat_free_context(ofmt_ctx);
    av_freep(&avio_ctx->buffer);
    av_free(avio_ctx);
    free(src_buf_left);
    free(src_buf_right);

    return bd.size - bd.room + 2;
}   

uint8_t* get_buffer() {
    return bd.buf;
}

void free_buffer(){
    av_free(bd.buf);
}

static AVFrame *alloc_audio_frame() {
    AVFrame *audio_frame = av_frame_alloc();
    int ret;

    if (!audio_frame) {
        //printf(stderr, "Error allocating an audio frame\n");
        exit(1);
    }

    audio_frame->format           = audio_ctx->sample_fmt;
    audio_frame->channel_layout   = audio_ctx->channel_layout;
    audio_frame->sample_rate      = audio_ctx->sample_rate;
    audio_frame->nb_samples       = audio_ctx->frame_size;

    ret = av_frame_get_buffer(audio_frame, 4);
    if (ret < 0) {
        //printf(stderr, "Error allocating an audio buffer\n");
        exit(1);
    }
    
    return audio_frame;
}

static int check_sample_fmt(const AVCodec *codec, enum AVSampleFormat sample_fmt){
    const enum AVSampleFormat *p = codec->sample_fmts;
    while (*p != AV_SAMPLE_FMT_NONE) {
        if (*p == sample_fmt)
            return 1;
        p++;
    }
    return 0;
}
int count = 0; 
void write_audio_frame() {
    while(bytes_read + (audio_frame->nb_samples * sizeof(float) + 1) < src_size ) { 
        int ret;
        ret = av_frame_make_writable(audio_frame);
        if(ret < 0){
            //printf("error\n");
            exit(1);
        }
        
        audio_frame->data[0] = src_buf_left + bytes_read;
        audio_frame->data[1] = src_buf_right + bytes_read;
        bytes_read += audio_frame->nb_samples * 4;

        dst_nb_samples = av_rescale_rnd (
            swr_get_delay(audio_swr_ctx, audio_ctx->sample_rate) + audio_frame->nb_samples, 
            src_sample_rate, 
            audio_ctx->sample_rate,
            AV_ROUND_UP
        );   

        ret = swr_convert (
            audio_swr_ctx,
            audio_frame->data, 
            dst_nb_samples,
            (const uint8_t **)audio_frame->data, 
            audio_frame->nb_samples
        );

        if(ret < 0){
            //printf("error converting \n");
            exit(1);
        }
            
        audio_frame->pts = av_rescale_q(
            frame_bytes, 
            (AVRational){1, audio_ctx->sample_rate}, 
            audio_ctx->time_base
        );

        frame_bytes += dst_nb_samples;
        muxer_encode(audio_frame, audio_ctx, audio_stream, audio_pkt);
    }
}

void open_audio(float* left, float* right, int size, int sample_rate, int nr_channels, int bit_rate){
    //printf("size: %d sample_rate: %d channels: %d bitrate: %d \n", size,sample_rate, nr_channels,bit_rate);
    src_sample_rate = sample_rate;
    src_bit_rate = bit_rate;
    src_nr_channels = nr_channels;
    src_size = size * sizeof(float);
    
    src_buf_left = (uint8_t*)left;
    src_buf_right = (uint8_t*)right;
    
    AVCodec* ac = avcodec_find_encoder(AV_CODEC_ID_MP3);
    audio_stream = avformat_new_stream(ofmt_ctx, NULL);
    audio_stream->id = ofmt_ctx->nb_streams-1;
    audio_ctx = avcodec_alloc_context3(ac);

    audio_ctx->bit_rate = bit_rate;
    audio_ctx->sample_rate = sample_rate;
    if (ac->supported_samplerates) {
        audio_ctx->sample_rate = ac->supported_samplerates[0];
        for (i = 0; ac->supported_samplerates[i]; i++) {
            if (ac->supported_samplerates[i] == sample_rate)
                audio_ctx->sample_rate = sample_rate;
        }
    }
    audio_ctx->channels = nr_channels;
    audio_ctx->channel_layout = AV_CH_LAYOUT_STEREO;
    if (ac->channel_layouts) {
        audio_ctx->channel_layout = ac->channel_layouts[0];
        for (i = 0; ac->channel_layouts[i]; i++) {
            if (ac->channel_layouts[i] == AV_CH_LAYOUT_STEREO)
                audio_ctx->channel_layout = AV_CH_LAYOUT_STEREO;
        }
    }
    audio_ctx->channels  = av_get_channel_layout_nb_channels(audio_ctx->channel_layout);
    audio_ctx->channel_layout = AV_CH_LAYOUT_STEREO;
    audio_ctx->sample_fmt = AV_SAMPLE_FMT_S16P;

    audio_stream->time_base = (AVRational){1, audio_ctx->sample_rate};

    ret = avcodec_open2(audio_ctx, ac, NULL);
    if (ret < 0) {
        //printf(stderr, "Could not open audio codec: %s\n", av_err2str(ret));
        exit(1);
    }

    audio_frame = alloc_audio_frame();

    ret = avcodec_parameters_from_context(audio_stream->codecpar, audio_ctx);
    if (ret < 0) {
        //printf(stderr, "Could not copy the stream parameters\n");
        exit(1);
    }

    audio_swr_ctx = swr_alloc();
    if (!audio_swr_ctx) {
        //printf(stderr, "Could not allocate resampler context\n");
        exit(1);
    }

    av_opt_set_int       (audio_swr_ctx, "in_channel_count",   nr_channels,               0);
    av_opt_set_int       (audio_swr_ctx, "in_sample_rate",     sample_rate,               0);
    av_opt_set_sample_fmt(audio_swr_ctx, "in_sample_fmt",      AV_SAMPLE_FMT_FLTP,        0);
    av_opt_set_int       (audio_swr_ctx, "out_channel_count",  audio_ctx->channels,       0);
    av_opt_set_int       (audio_swr_ctx, "out_sample_rate",    audio_ctx->sample_rate,    0);
    av_opt_set_sample_fmt(audio_swr_ctx, "out_sample_fmt",     audio_ctx->sample_fmt,     0);

    if ((ret = swr_init(audio_swr_ctx)) < 0) {
        //printf(stderr, "Failed to initialize the resampling context\n");
        exit(1);
    }
    audio_pkt = av_packet_alloc();

    if(!audio_pkt){
        exit(1);
    }

    frame_bytes = audio_idx = bytes_read = 0;    
    dst_nb_samples = av_rescale_rnd (
        audio_frame->nb_samples, 
        src_sample_rate, 
        audio_ctx->sample_rate,
        AV_ROUND_UP
    );   

    have_audio = 1;
}