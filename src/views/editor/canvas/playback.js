import React, {PureComponent} from 'react'
import Button from 'material-ui/Button'


import PlayIcon from '@material-ui/icons/PlayCircleOutline'
import StopIcon from '@material-ui/icons/Stop'

import { connect } from 'react-redux'

class PlaybackPanel extends PureComponent {

    convertTime = (sec) => {
        var min = Math.floor(sec/60);
        (min >= 1) ? sec = sec - (min*60) : min = '00';
        
        sec = sec < 10 ? "0" + sec : sec;

        (min.toString().length === 1) ? min = '0'+min : void 0;    
        (sec.toString().length === 1) ? sec = '0'+sec : void 0;    
        return min+':'+sec;
    }
    render() {

        return(
            <div style={{display: "flex", flexDirection: "column", maxWidth: this.props.width}}>
                <svg viewBox= {"0 0 "+String(this.props.width) +" 20"} xmlns="http://www.w3.org/2000/svg" style={{height: 20}}>
                    <line x1="0" y1="10" x2={String((this.props.time / this.props.clipDuration) * this.props.width)} y2="10" stroke="black" />
                </svg>
                
                <div style={{display: "flex", flexDirection: "row"}}>
                    <div style={{position: "absolute", margin: 8, userSelect: "none"}}>
                        {this.convertTime(this.props.time).substring(0, 8)}
                    </div>
                    <div style={{margin: "auto"}}>
                        <PlayIcon onClick={this.props.play}></PlayIcon>
                        <StopIcon onClick={this.props.stop}></StopIcon>
                    </div>


                    <Button disableRipple color="primary" type="raised" onClick={this.props.openFullScreen}>Fullscreen</Button>
                    <Button disableRipple color="secondary" type="raised" onClick={this.props.openEncodingModal}>Export</Button>
                    
                </div>
            </div>

        )
    }
}

const mapStateToProps = state => {
    return {
        clipDuration: state.globals.clipDuration,
        time: state.globals.time
    }
}

export default connect(mapStateToProps)(PlaybackPanel)

//disabled={!this.props.encoderLoaded || this.props.encoding || this.props.streamClosed}