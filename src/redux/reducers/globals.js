import update from 'immutability-helper'

export default function playbackReducer(state = {
    time: 0,
    clipDuration: 300,
    fps: 60,
    playing: false,
    frameId: 0,
    disabled: false,
    encoding: false,
    fftSettings: {},
    audioBufferSize: 0.1,
    postProcessingEnabled: false,
    masterVolume: 100,
    exportVideo: false,
    quickConfigs: [],
    fftSize: "2048",
    framesEncoded: 0,
    totalFrames: 0,
    resolution: "1920x1080"

    }, action){
        switch(action.type){
            case "CREATE_QUICK_CONFIG":
                return {...state, quickConfigs: update(state.quickConfigs, {$push: [action.payload] })}
            case "SET_PLAYLIST_LENGTH":
                return {...state, clipDuration: state.clipDuration > action.payload ? state.clipDuration : Math.floor(action.payload + action.payload * 0.05)}
            case "SET_TOTAL_FRAMES":
                return  {...state, totalFrames: action.payload}
            case "SET_FRAMES_ENCODED":
                return  {...state, framesEncoded: action.payload}
            case "SET_GLOBAL_SETTINGS":
                return {...state, ...action.payload, time: 0, playing: false}
            case "SET_EXPORT":
                let fe = action.payload ? state.framesEncoded : 0
                let tf = action.payload ? state.totalFrames : 0
                return {...state, exportVideo: action.payload, framesEncoded: fe, totalFrames: tf}
            case "EDIT_PROJECT_SETTINGS":
                return {...state, [action.payload.key]: action.payload.value}
            case "SET_AUDIO_BUFFER_SIZE":
                return {...state, audioBufferSize: action.payload}
            case "EDIT_FFT": 
                return {...state, fftSettings: {...state.fftSettings, [action.payload.key] : action.payload.value}}
            case "ADD_FFT_SETTINGS":
                return {...state, fftSettings: action.payload}
            case "SET_ENCODING":
                return {...state, encoding: action.payload, frameId: 0, time: 0, disabled: action.payload}
            case "SET_CLIP_DURATION":
                return {...state, clipDuration: action.payload}
            case "SET_DISABLED":
                return {...state, disabled: action.payload}
            case "INCREMENT_FRAME":
                return {...state, frameId: state.frameId + 1}
            case "TOGGLE_PLAYING":
                return {...state, playing: !state.playing}
            case "SET_PLAYING":
                return {...state, playing: action.payload}
            case "SET_TIME":
                const f = Math.floor(action.payload * state.fps + 0.00001)
                return {...state, time: action.payload, frameId: f, lastAction: "SET_TIME"}
            case "INCREMENT_TIME":
                const frameId = Math.floor(action.payload * state.fps + 0.00001)
                return {...state, time: action.payload, frameId: frameId}
            case "SET_FPS":
                return {...state, fps: action.payload}
            default:
                return state
        }
}