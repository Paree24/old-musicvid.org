#include "avio_write.h"
#include <libavcodec/avcodec.h>
#include <libavformat/avformat.h>
#include <libavformat/avio.h>
#include <libavutil/file.h>
#include <libavutil/timestamp.h>
#include <libavutil/imgutils.h>
#include <libswscale/swscale.h>
#include <libswresample/swresample.h>

#include <libavutil/opt.h>

#define AV_CODEC_FLAG_GLOBAL_HEADER (1 << 22)
#define CODEC_FLAG_GLOBAL_HEADER AV_CODEC_FLAG_GLOBAL_HEADER
#define AVFMT_RAWPICTURE 0x0020

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
const char* codec_name = "libx264";

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

const int NR_COLORS = 4;

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
            printf("none of the above: %d\n", whence);
    }
    return 1;
}

static void log_packet(const AVFormatContext *fmt_ctx, const AVPacket *pkt, const char *tag)
{
    AVRational *time_base = &fmt_ctx->streams[pkt->stream_index]->time_base;
    printf("%s: pts:%s pts_time:%s dts:%s dts_time:%s duration:%s duration_time:%s stream_index:%d\n",
           tag,
           av_ts2str(pkt->pts), av_ts2timestr(pkt->pts, time_base),
           av_ts2str(pkt->dts), av_ts2timestr(pkt->dts, time_base),
           av_ts2str(pkt->duration), av_ts2timestr(pkt->duration, time_base),
           pkt->stream_index);
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

static void encode(AVFrame *frame, AVCodecContext* cod, AVStream* out, AVPacket* p) {    
    ret = avcodec_send_frame(cod, frame);

    if (ret < 0) {
        fprintf(stderr, "Error sending a frame for encoding\n");
        exit(1);
    }

    while (ret >= 0) {
        ret = avcodec_receive_packet(cod, p);
        if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF){
            av_packet_unref(p);
            return;
        }
        else if (ret < 0) {
            fprintf(stderr, "Error during encoding\n");
            exit(1);
        }

        //log_packet(ofmt_ctx, pkt, "write");
        p->stream_index = out->index;      
        av_packet_rescale_ts(p, cod->time_base, out->time_base);
        av_write_frame(ofmt_ctx, p);
        av_packet_unref(p);
    }
}

void flip_vertically(uint8_t *pixels) {
    const size_t width = video_ctx->width;
    const size_t height = video_ctx->height;
    
    const size_t stride = width * NR_COLORS;
    uint8_t *row = malloc(stride);
    uint8_t *low = pixels;
    uint8_t *high = &pixels[(height - 1) * stride];

    for (; low < high; low += stride, high -= stride) {
        memcpy(row, low, stride);
        memcpy(low, high, stride);
        memcpy(high, row, stride);
    }
    free(row);
}

void rgb2yuv420p(uint8_t *destination, uint8_t *rgb, size_t width, size_t height)
{
    size_t image_size = width * height;
    size_t upos = image_size;
    size_t vpos = upos + upos / 4;
    size_t i = 0;
    uint8_t r, g, b;
    

    for( size_t line = 0; line < height; ++line ) {
        if( !(line % 2) ) {
            for( size_t x = 0; x < width; x += 2 )
            {
                r = rgb[NR_COLORS * i];
                g = rgb[NR_COLORS * i + 1];
                b = rgb[NR_COLORS * i + 2];

        
                destination[i++] = ((66*r + 129*g + 25*b) >> 8) + 16;

                destination[upos++] = ((-38*r + -74*g + 112*b) >> 8) + 128;
                destination[vpos++] = ((112*r + -94*g + -18*b) >> 8) + 128;

                r = rgb[NR_COLORS * i];
                g = rgb[NR_COLORS * i + 1];
                b = rgb[NR_COLORS * i + 2];

                destination[i++] = ((66*r + 129*g + 25*b) >> 8) + 16;
            }
        }
        else
        {
            for( size_t x = 0; x < width; x += 1 )
            {
                r = rgb[NR_COLORS * i];
                g = rgb[NR_COLORS * i + 1];
                b = rgb[NR_COLORS * i + 2];

                destination[i++] = ((66*r + 129*g + 25*b) >> 8) + 16;
            }
        }
    }  
}

void add_frame(uint8_t* buffer){ 

    flip_vertically(buffer);
    ret = av_frame_make_writable(video_frame);

    // ~15% faster than sws_scale
    int size = (video_ctx->width * video_ctx->height * 3) / 2;
    uint8_t* yuv_buffer = malloc(size);
    rgb2yuv420p(yuv_buffer, buffer, video_ctx->width, video_ctx->height);
    av_image_fill_arrays (
        (AVPicture*)video_frame->data,
        video_frame->linesize, 
        yuv_buffer, 
        video_frame->format, 
        video_frame->width, 
        video_frame->height, 
        1
    );
    
    
    /*
    const int in_linesize[1] = { NR_COLORS * video_ctx->width };
    sws_scale(
        sws_context, 
        (const uint8_t * const *)&buffer, 
        in_linesize, 
        0, 
        video_ctx->height, 
        video_frame->data, 
        video_frame->linesize
    );
    */

    video_frame->pts = frameIdx++;
    encode(video_frame, video_ctx, video_stream, pkt);
    free(buffer);
    free(yuv_buffer);
}


void write_header() {
    ret = avformat_write_header(ofmt_ctx, NULL);
    if (ret < 0) {
        fprintf(stderr, "Error occurred: %s\n", av_err2str(ret));
        fprintf(stderr, "Error occurred when opening output file\n");
        exit(1);
    } 
}

void open_video(int w, int h, int fps, int br){
    printf("w: %d h: %d fps: %d br: %d \n", w,h,fps,br);
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
        fprintf(stderr, "Could not create output context\n");
        exit(1);
    }
    
    AVCodec* video_codec = avcodec_find_encoder_by_name(codec_name);
    if (!video_codec) {
        fprintf(stderr, "Codec '%s' not found\n", codec_name);
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
    av_opt_set(video_ctx->priv_data, "preset", "ultrafast", 0);
    if(avcodec_open2(video_ctx, video_codec, NULL) < 0) {
        printf("couldnt open codec\n");
        exit(1);
    }

    // Frame initalization
    video_frame = av_frame_alloc();
    video_frame->format = video_ctx->pix_fmt;
    video_frame->width  = w;
    video_frame->height = h;
    ret = av_frame_get_buffer(video_frame, 0);
    if(ret < 0)
        fprintf(stderr, "Error occurred: frame_getbuffer: %s\n", av_err2str(ret));
    //Packet init
    pkt = av_packet_alloc();
    if(!pkt){
        printf("errror packer\n");
        exit(1);
    }
        
    video_stream = avformat_new_stream(ofmt_ctx, NULL);  
    if(!video_stream){
        printf(stderr, "error making stream\n");
        exit(1);
    }
    
    ofmt_ctx->pb = avio_ctx;
    ofmt_ctx->flags |= AVFMT_FLAG_CUSTOM_IO;

    ofmt_ctx->oformat = of;
    video_stream->codec->codec_tag = 0;

    video_stream->time_base = video_ctx->time_base;
    video_stream->id = ofmt_ctx->nb_streams-1;
    ret = avcodec_parameters_from_context(video_stream->codecpar, video_ctx);
    if(ret < 0)
        fprintf(stderr, "Error occurred: %s\n", av_err2str(ret));
    
    sws_context = sws_getContext(
            video_ctx->width, video_ctx->height, 
            AV_PIX_FMT_RGB32,
            video_ctx->width, video_ctx->height, 
            AV_PIX_FMT_YUV420P,
            0, NULL, NULL, NULL
    );

} 

int close_stream() {
    encode(NULL, video_ctx, video_stream, pkt);
    //encode(NULL, audio_ctx, audio_stream);
    
    av_write_trailer(ofmt_ctx);
    /* close output */
    avformat_free_context(ofmt_ctx);
    av_freep(&avio_ctx->buffer);
    av_free(avio_ctx);

    return bd.size;
}   

uint8_t* get_buffer() {
    return bd.buf;
}

void free_buffer(){
    av_free(bd.buf);
    if (ret < 0 && ret != AVERROR_EOF) {
        fprintf(stderr, "Error occurred: %s\n", av_err2str(ret));
    }
}

static AVFrame *alloc_audio_frame() {
    AVFrame *audio_frame = av_frame_alloc();
    int ret;

    if (!audio_frame) {
        fprintf(stderr, "Error allocating an audio frame\n");
        exit(1);
    }

    audio_frame->format           = audio_ctx->sample_fmt;
    audio_frame->channel_layout   = audio_ctx->channel_layout;
    audio_frame->sample_rate      = audio_ctx->sample_rate;
    audio_frame->nb_samples       = audio_ctx->frame_size;

    ret = av_frame_get_buffer(audio_frame, 4);
    if (ret < 0) {
        fprintf(stderr, "Error allocating an audio buffer\n");
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
            printf("error\n");
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
            printf("error converting \n");
            exit(1);
        }
            
        audio_frame->pts = av_rescale_q(
            frame_bytes, 
            (AVRational){1, audio_ctx->sample_rate}, 
            audio_ctx->time_base
        );

        frame_bytes += dst_nb_samples;
        encode(audio_frame, audio_ctx, audio_stream, audio_pkt);
    }
}

void open_audio(float* left, float* right, int size, int sample_rate, int nr_channels, int bit_rate){
    printf("size: %d sample_rate: %d channels: %d bitrate: %d \n", size,sample_rate, nr_channels,bit_rate);
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
        fprintf(stderr, "Could not open audio codec: %s\n", av_err2str(ret));
        exit(1);
    }

    audio_frame = alloc_audio_frame();

    ret = avcodec_parameters_from_context(audio_stream->codecpar, audio_ctx);
    if (ret < 0) {
        fprintf(stderr, "Could not copy the stream parameters\n");
        exit(1);
    }

    audio_swr_ctx = swr_alloc();
    if (!audio_swr_ctx) {
        fprintf(stderr, "Could not allocate resampler context\n");
        exit(1);
    }

    av_opt_set_int       (audio_swr_ctx, "in_channel_count",   nr_channels,               0);
    av_opt_set_int       (audio_swr_ctx, "in_sample_rate",     sample_rate,               0);
    av_opt_set_sample_fmt(audio_swr_ctx, "in_sample_fmt",      AV_SAMPLE_FMT_FLTP,        0);
    av_opt_set_int       (audio_swr_ctx, "out_channel_count",  audio_ctx->channels,       0);
    av_opt_set_int       (audio_swr_ctx, "out_sample_rate",    audio_ctx->sample_rate,    0);
    av_opt_set_sample_fmt(audio_swr_ctx, "out_sample_fmt",     audio_ctx->sample_fmt,     0);

    if ((ret = swr_init(audio_swr_ctx)) < 0) {
        fprintf(stderr, "Failed to initialize the resampling context\n");
        exit(1);
    }
    audio_pkt = av_packet_alloc();
    if(!audio_pkt){
        printf("errror packer\n");
        exit(1);
    }

    frame_bytes = audio_idx = bytes_read = 0;
    av_dump_format(ofmt_ctx, 0, "Memory", 1);
    
    dst_nb_samples = av_rescale_rnd (
        audio_frame->nb_samples, 
        src_sample_rate, 
        audio_ctx->sample_rate,
        AV_ROUND_UP
    );   

    have_audio = 1;
}