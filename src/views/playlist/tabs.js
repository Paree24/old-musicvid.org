import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import AppBar from 'material-ui/AppBar';
import Tabs, { Tab } from 'material-ui/Tabs';

import Button from 'material-ui/Button'

import ScrollArea2 from './scrollarea2'

import classes from './playlist.css'
import { connect } from 'react-redux'


const offset = 65

class SimpleTabs extends React.PureComponent {
    state = {
        tabValue: 0,
        contentValue: 0,
    };


    handleChange = (event, value) => {
        this.setState({tabValue: value})
    };

    

    render() {
        const value = this.props.sideBarWindowIndex
        const tabStyle = { minWidth: "30px", maxWidth: "100px", minHeight: "30px", height: "20px", maxHeight: "20px" }

        if(value <= 2)
            this.tabValue = value

        return (
            <div className={classes.wrapper} >
                <div className={classes.header} style={{minHeight: 30, height: 30}}>
                    <div className={classes.root}>
                        <AppBar position="static" style={{display: "flex", flexDirection: "row", minHeight: 30, height: 30}} >
                            <Tabs style={{marginLeft: "13%"}} value={this.state.tabValue} onChange={this.handleChange} >
                                <Tab label="Items" style={tabStyle}/>
                                <Tab disabled label="Automations" style={tabStyle}/>
                            </Tabs>

                            <div style={{display: "flex", flexDirection: "row", marginLeft: "auto", marginRight: "6%"}}>
                                       
                            </div>
                        </AppBar>
                    </div>
                </div>
                <div className={classes.scrollbarWrapper}>
                    <ScrollArea2 maxNrUnits={600} items={this.props.items}> </ScrollArea2>
                </div>
            </div>
        );
    }
}

SimpleTabs.propTypes = {
  classes: PropTypes.object.isRequired,
};

const mapStateToProps = state => {
    return {
        selectedItem: state.items.selectedItem,
        items: state.items.items,
    }
}

export default connect(mapStateToProps)(withStyles(classes)(SimpleTabs));
