import React, { PureComponent } from 'react'

import LabeledFieldWrapper from './labeledfieldwrapper'

const inputStyles = {
    Number: {marginRight: 10, width: 50, minWidth: 50, marginLeft: 5},
    String: { minWidth: "25%", marginRight: 10, marginLeft: 5},
    Link: { width: 50, marginLeft: 10 },
    Boolean: {marginLeft: 10, height: 12, width: 12, marginTop: 5, marginRight: 14},
    List : {marginRight: 10}
}


export default class CustomInput extends PureComponent {

    render() {

        

        const {  keyVal, type, value, disabled, name, options, min, max, step } = this.props
        const key = keyVal

        return (
    
            <div key={key} style={{width: "100%", borderBottom: "1px solid #e0e0e0"}}>
                {type === "Number" && 
                    <LabeledFieldWrapper {...this.props}>
                        <input 
                            onKeyUp={(event) => event.stopPropagation()} 
                            onChange={this.props.handleChange({type, key, min, max})}
                            value={value} 
                            disabled={disabled === true}   
                            style={inputStyles[type]}
                            type={"number"}
                            min={(min !== undefined) ? min : Number.NEGATIVE_INFINITY}
                            max={(max !== undefined) ? max : Number.POSITIVE_INFINITY}
                            step={step || 1}
                        >
                        </input>
                    </LabeledFieldWrapper>
                }

                {type === "String" &&
                    <LabeledFieldWrapper {...this.props}>
                        <input 
                            onKeyUp={(event) => event.stopPropagation()} 
                            onChange={this.props.handleChange({type, key})}
                            value={value} 
                            disabled={disabled === true}   
                            style={inputStyles[type]}
                            type={"text"}
                        >
                        </input>
                    </LabeledFieldWrapper>
                }

                {(type === "Link") && <LinkField value={value} keyVal={keyVal}></LinkField>}
                {type === "List" && <LabeledFieldWrapper {...this.props} >
                    <select style={inputStyles[type]} value={name} onChange={this.props.handleChange({type: type, key: key})}>
                        {options.map(e => <option key={e}  value={e}>{e}</option>)}
                    </select>
                    </LabeledFieldWrapper>
                }

                {(type === "Boolean") && 
                    <LabeledFieldWrapper {...this.props}>
                        <input 
                            type="checkbox"
                            checked={value}
                            onChange={this.props.handleChange({type: type, key: key, prev: value})} 
                            disabled={disabled === true}    
                            style={inputStyles[type]}>
                        </input>
                    </LabeledFieldWrapper>
                }
            </div>
        )
    }
}


class LinkField extends PureComponent {
    render() {
        return(
            <div key={this.props.keyVal} style={{display: "flex", flexDirection: "row", marginTop: 10, marginleft: 10}}>
                <a href={String(this.props.value)}>{this.props.keyVal}</a>
            </div>
        )
    }
}