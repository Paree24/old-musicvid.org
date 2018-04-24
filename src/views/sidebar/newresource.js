import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import List, { ListItem, ListItemSecondaryAction, ListItemText } from 'material-ui/List';
import Avatar from 'material-ui/Avatar';

import Button from 'material-ui/Button'

import FolderIcon from 'material-ui-icons/Folder';
import DeleteIcon from 'material-ui-icons/Delete';
import IconButton from 'material-ui/IconButton';

import { createItem, setSidebarWindowIndex } from '../../redux/actions/items'
import items from "../canvas/three/items"
import { connect } from 'react-redux'

const styles = theme => ({
  root: {
    width: '100%',
    maxWidth: 330,
    backgroundColor: theme.palette.background.paper,
  },
});

class AddResourceOptions extends React.Component {
    back = () => {
        setSidebarWindowIndex(0)
    };


    componentDidMount() {

        let add = (type, input) => {
            let file = input.files[0]
            let name = input.files[0].name
            createItem({type, file, name})
        }

        this.uploadImage.onchange = () => {
            add("IMAGE", this.uploadImage)
        }

        this.uploadSound.onchange = () => {
            add("SOUND", this.uploadSound)
        }
    }

    add = (e) => {
        switch(e) {
            case 0:
                this.uploadSound.click()
                break;
            case 1:
                this.uploadImage.click()
                break;
            case 2:
                break;
            case 3:
                console.log("add 2d text")
                break;
            case 4:
                setSidebarWindowIndex(5)
                break;
            default:
                console.log("unknown click type")
        }
    }

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <input accept="audio/*" type="file" ref={(ref) => this.uploadSound = ref} style={{ display: 'none' }} />
        <input accept="image/*" type="file" ref={(ref) => this.uploadImage = ref} style={{ display: 'none' }} />
        <input accept="video/*" type="file" ref={(ref) => this.uploadVideo = ref} style={{ display: 'none' }} />
                        
        <List>
            <ListItem dense button className={classes.listItem}>
                <ListItemText primary={`Add sound`} onClick={() => this.add(0)}/>
            </ListItem>

            <ListItem dense button className={classes.listItem}>
                <ListItemText primary={`Add background image`} onClick={() => this.add(1)}/>
            </ListItem>

            <ListItem dense button className={classes.listItem} onClick={() => this.add(2)}>
                <ListItemText primary={`Add Video`} />
            </ListItem>
            
            <ListItem dense button className={classes.listItem} onClick={() => this.add(3)}>
                <ListItemText primary={`Foreground text`} />
            </ListItem>


            <ListItem dense button className={classes.listItem} onClick={() => this.add(4)}>
                <ListItemText primary={`3D items`} />
            </ListItem>

          <ListItem dense button className={classes.listItem}>
            <Button variant="raised" fullWidth onClick={this.back}>
                Back
            </Button>
            </ListItem>
        </List>
      </div>
    );
  }
}

AddResourceOptions .propTypes = {
  classes: PropTypes.object.isRequired,
};

const mapStateToProps = state => {
    return {
        items: state.items.items
    }
}

export default connect(mapStateToProps)(withStyles(styles)(AddResourceOptions ))