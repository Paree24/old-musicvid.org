
importScripts("Demux3.js")
let Module = Demuxer()

Module["onRuntimeInitialized"] = () => { 
    postMessage({action: "loaded"})
};


function getNextFrame() {
    var buf;
    var size = 0, data = 0;
    var size_p   = Module._malloc(4)

    var buffer_p = 0;
    buffer_p = Module._get_next_frame(size_p)
    var bufferSize = Module.HEAP32[size_p >> 2]
    initBuffer = false;

    var s = new Uint8Array( Module.HEAPU8.subarray(buffer_p, buffer_p + bufferSize) )
    Module._free(buffer_p)
    return s
} 

function extractAudio() {
    var size_p   = Module._malloc(4)
    var left_buffer_p = 0, right_buffer_p = 0;
    buffer_p = Module._extract_audio(left_buffer_p, right_buffer_p, size_p)
    var bufferSize = Module.HEAP32[size_p >> 2]
    
    console.log(bufferSize / 4)
    const right = new Float32Array( Module.HEAPU8.buffer, left_buffer_p, Math.floor(bufferSize / 4)) // shouldnt be needed, but y'know
    const left = new Float32Array( Module.HEAPU8.buffer, right_buffer_p,  Math.floor(bufferSize / 4))
    
    postMessage({action: "audio_extracted"})
    postMessage(left, [left.buffer])
    postMessage(right, [right.buffer])
    
    Module._free(left_buffer_p)
    Module._free(right_buffer_p)
}


var initBuffer = false
onmessage = (e) => {
    const { data } = e
    if(initBuffer) {
        try {
            var buffer_p = Module._malloc(data.length)
            var video_info_p = Module._malloc(4 * 6)

            Module.HEAPU8.set(data, buffer_p)
            Module._init_muxer(buffer_p, data.length, video_info_p)
            const info = new Int32Array(Module.HEAPU8.buffer, video_info_p, 6)  
            postMessage({action: "init", info: info})
        }finally {
            //Module._free(buffer_p)
            initBuffer = false;
        }

        return;
    }

    switch(data.action) {
        case "init":
            initBuffer = true;
            break;
        case "get_frame":
            const d = getNextFrame()
            postMessage({action: "frame_decoded"})
            postMessage(d, [d.buffer]);
            break;
        case "close":
            close(data.data)
            break;
        case "set_frame": 
            Module._set_frame(data.value)
            break;
        case "extract_audio":
            extractAudio()
            break;
        default:
            console.log("unknown command: ", data.action)
    }
}