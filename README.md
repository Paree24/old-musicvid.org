# WasmVideoEncoder
A video encoder for the browser using FFmpeg with WebAssembly in super early development

[Demo website](https://alexvestin.github.io/WasmVideoEncoder/)


Currently encodes raw image and audio data, and muxes into a mp4/mp3 format.

Wasm: 1985KB, JS: 25KB (or 730KB respectively 10KB when zipped!)

### Example usage
Example usage in src/Canvas.js

### TODOs
- Fix/Add build to project
- Better animations demo
- Custom sound for demo
- Offscreen Canvas example for demo
- Fix worker memory usage ( reads the canvas faster than it encodes -> frames stack up -> memory out of bounds ) 
- input checking
- smaller wasm/js
- better README
- h265/vp9/vp8/other codec support
- benchmarks
- interleaved audio/video writing
- C code clean-up

### LICENSE
- ffmpeg/mp4 is under GPL
- mp3 is under LGPL
- The rest is MIT


### Build
Makefile & patches from ffmpeg.js / videoencoder.js
