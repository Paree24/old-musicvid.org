import React from 'react';

import Button from '@material-ui/core/Button'
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import Delete from '@material-ui/icons/Delete';

import { connect } from 'react-redux'
import { setSidebarWindowIndex, selectEffect, removeEffect } from '@redux/actions/items'


class EffectList extends React.Component {
    back = () => {
        setSidebarWindowIndex(this.props.idxs.LAYER)
    }

    removeItem = (effect) => {
        removeEffect(effect)
    }

    render() {
        const {  passes } = this.props;

        return (
            <div>
                <div style={{display: "flex", flexFlow: "row wrap", flexDirection: "row"}}>
                    {passes.map( (pass, i) => {
                        return( 
                            <div key={pass.id} style={{width: "100%", display: "flex", flexDirection: "row", textAlign: "right", overflow: "hidden",}}>
                                <Button disabled={pass.renderPass} disableRipple variant="raised" fullWidth onClick={() => selectEffect(pass.id)}> {pass.name} </Button>
                                <div style={{display: "flex", flexDirection: "row"}}>

                                    <Button style={{minWidth: 10, width: 10}} disabled={i <= 2 || passes[i-1].renderPass} disableRipple>
                                        <KeyboardArrowUp ></KeyboardArrowUp>
                                    </Button>
                                    <Button style={{minWidth: 10, width: 10}} disabled={i <= 2 || i === passes.length - 1} disableRipple>
                                        <KeyboardArrowDown ></KeyboardArrowDown>
                                    </Button>

                                    <Button style={{minWidth: 10, width: 10}} disabled={pass.renderPass} onClick={() => this.removeItem(pass)}>
                                        <Delete></Delete>
                                    </Button>
                                </div>
                            </div>
                        )
                    } 
                    )}
                </div>
            </div>
        );
    }
}


const mapStateToProps = state => {
    return {
        passes: state.items.passes,
        postProcessingEnabled: state.globals.postProcessingEnabled
    }
}

export default connect(mapStateToProps)(EffectList)