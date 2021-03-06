import React from 'react';

import RaisedButton from '@material-ui/core/Button'
import { connect } from 'react-redux'
import { createSound, setAudioItemView, setSidebarWindowIndex, selectAudio, removeSound } from '@redux/actions/items'
import Delete from '@material-ui/icons/Delete'
import withHeader from '../../HOC/withheader'
import AudioItem from './audioitem'
import List from '@material-ui/core/List';
import ListItemText from '@material-ui/core/ListItemText'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItem from '@material-ui/core/ListItem';

class Audio extends React.Component {

    componentDidMount() {
        setAudioItemView(0)
        this.fileInputRef.onchange = () => {
            let file = this.fileInputRef.files[0]
            if(file) {
                let name =  this.fileInputRef.files[0].name
                createSound({type:"SOUND", file, name})
            }
        }
    }

    itemBack = () => {
        setAudioItemView(0)
    }

    onClick = (index) => {
        selectAudio({itemId: this.props.audioItems[index].id})
    }

    back = () => {
        setSidebarWindowIndex(this.props.idxs.ITEMS)
    }

    render() {
        const { audioItems } = this.props;
        const item = audioItems[this.props.audioIdx]

        console.log(item, this.props.audioIdx, audioItems, this.props.audioItemView)

        return (
            <div>
                <input accept="audio/*" type="file" ref={(ref) => this.fileInputRef = ref} style={{ display: 'none' }} />
                {this.props.audioItemView === 0 &&
                    <div>
                        <List>
                            {audioItems.map((item, i) => (
                                <ListItem disableRipple key={item.name} dense button onClick={() => this.onClick(i)}>
                                    <ListItemText primary={item.name} />
                                    <ListItemSecondaryAction>
                                        <Delete style={{cursor: "pointer"}}color="secondary" onClick={() => removeSound(item.id)}></Delete>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                        <RaisedButton fullWidth onClick={() => this.fileInputRef.click()}>load audio</RaisedButton>
                    </div>
                } 
                {this.props.audioItemView === 1  && <AudioItem item={item} onBack={this.itemBack}></AudioItem>} 
            </div>
        );
    }
}


const mapStateToProps = state => {
    return {
        audioItems: state.items.audioItems,
        audioIdx: state.items.audioIdx,
        audioItemView: state.items.audioItemView
    }
}



export default connect(mapStateToProps)(withHeader((Audio)))