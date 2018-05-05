import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import AppBar from 'material-ui/AppBar';
import Tabs, { Tab } from 'material-ui/Tabs';
import Typography from 'material-ui/Typography';
import { connect } from 'react-redux'

import Toolbar from 'material-ui/Toolbar';

import { setSidebarWindowIndex } from '../../redux/actions/items'

import Audio from './audio'

import AddResourceOptions from './newitem'
import AddLayerOptions from './newlayer'

import AudioReactiveTypeList from './audioreactivetypes'
import ResourceList from "./items"
import LayerList from './layers'

import Item from './item'
import Layer from './layer'

function TabContainer(props) {
  return (
    <Typography component="div" style={{ padding: 8 }}>
      {props.children}
    </Typography>
  );
}

TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
};

const styles = theme => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
    height: "100%"
  },
});


class SidebarContainer extends React.Component {
    static INDEXES = {
        
        EFFECTSCONTAINER: 1,
        LAYERS: 0,
        LAYER: 7,
        ADDRESOURCEOPTIONS: 3,
        ADDLAYEROPTIONS: 4,
        AUDIOREACTIVETYPELIST: 6,
        ITEMS: 8,
        ITEM: 5,
        AUDIO: 2,
    }
    
    state = {
        tabValue: 0,
        contentValue: 0,
    };

    handleChange = (event, value) => {
        setSidebarWindowIndex(value)
    };

    render() {
        const { classes } = this.props;
        const value = this.props.sideBarWindowIndex
        const tabStyle = { minWidth: "30px", maxWidth: "100px" }
        if(value <= 2)
            this.tabValue = value

        const INDEXES = SidebarContainer.INDEXES
        return (
            <div className={classes.root}>
                <AppBar position="static" >
                    <Tabs value={this.tabValue} onChange={this.handleChange} fullWidth>
                        <Tab label="Layers" style={tabStyle} href="#basic-tabs" />
                        <Tab label="Effects" style={tabStyle}/>
                        <Tab label="Audio" style={tabStyle}/>
                    </Tabs>
                </AppBar>

                {value > 2 && 
                <AppBar position="static" color="default" style={{height: 30, minHeight: 30}}>
                        <Typography variant="title" color="inherit">
                            {this.props.selectedLayer.name}
                        </Typography>
                </AppBar>
            }
                

                {value === INDEXES.EFFECTSCONTAINER &&     <TabContainer  idxs={INDEXES}>effects will go here</TabContainer>}
                {value === INDEXES.ADDRESOURCEOPTIONS &&   <AddResourceOptions idxs={INDEXES}></AddResourceOptions>}
                {value === INDEXES.ADDLAYEROPTIONS &&      <AddLayerOptions idxs={INDEXES}></AddLayerOptions>}
                {value === INDEXES.AUDIOREACTIVETYPELIST && <AudioReactiveTypeList idxs={INDEXES}></AudioReactiveTypeList>}
                
                {value === INDEXES.ITEMS &&         <ResourceList idxs={INDEXES}></ResourceList>}
                {value === INDEXES.ITEM &&                 <Item idxs={INDEXES} item={this.props.selectedItem}></Item>}
                {value === INDEXES.LAYERS &&            <LayerList idxs={INDEXES}></LayerList>}
                {value === INDEXES.LAYER &&                 <Layer idxs={INDEXES} item={this.props.selectedItem}></Layer>}
                {value === INDEXES.AUDIO &&                 <Audio idxs={INDEXES} ></Audio>}
            </div>
        );
    }
}

SidebarContainer.propTypes = {
  classes: PropTypes.object.isRequired,
};

const mapStateToProps = state => {
    return {
        selectedItem: state.items.selectedItem,
        items: state.items.items,
        sideBarWindowIndex: state.items.sideBarWindowIndex,
        selectedLayer: state.items.selectedLayer
    }
}

export default connect(mapStateToProps)(withStyles(styles)(SidebarContainer));