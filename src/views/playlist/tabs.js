import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import AppBar from 'material-ui/AppBar';
import Tabs, { Tab } from 'material-ui/Tabs';
import Typography from 'material-ui/Typography';
import ScrollArea from './scrollarea'

import classes from './playlist.css'
import { connect } from 'react-redux'
import { setSidebarWindowIndex } from '../../redux/actions/items'


const offset = 65

class SimpleTabs extends React.PureComponent {
    state = {
        tabValue: 0,
        contentValue: 0,
        width: 1200,
        height: 2000
    };

    handleChange = (event, value) => {
        this.setState({tabValue: value})
    };

    updateWindowDimensions = () => {
        this.setState({ width: this.wrapperRef.offsetWidth - offset, height: this.wrapperRef.offsetHeight - offset})
    }

    componentDidMount() {
        window.addEventListener('resize', this.updateWindowDimensions);
        this.setState({ width: this.wrapperRef.offsetWidth - offset, height: this.wrapperRef.offsetHeight - offset})
    }

    render() {
        const value = this.props.sideBarWindowIndex
        const tabStyle = { minWidth: "30px", maxWidth: "100px", minHeight: "30px", height: "20px", maxHeight: "20px" }
        if(value <= 2)
            this.tabValue = value

        return (
            <div className={classes.wrapper} ref={ref => this.wrapperRef = ref}>
                <div className={classes.header}>
                    <div className={classes.root}>
                        <AppBar position="static" >
                            <Tabs value={this.state.tabValue} onChange={this.handleChange} fullWidth>
                                <Tab label="Items" style={tabStyle}/>
                                <Tab label="Automations" style={tabStyle}/>
                            </Tabs>
                        </AppBar>
                    </div>
                </div>
                <div className={classes.scrollbarWrapper}>
                    <ScrollArea width={this.state.width} height={this.state.height} items={this.props.items}> </ScrollArea>
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