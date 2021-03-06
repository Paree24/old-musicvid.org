import { addItem, updateItemConfig } from '@redux/actions/items'
import {setDisabled} from '@redux/actions/globals'

export default class BaseItem {
    constructor(config) {
        setDisabled(true)
        const headerGroup = { 
                title: "Author Information", 
                hide: true,
                items: {
                    artist: {value: "example", type: "String", disabled: false},
                    trackname: {value: "http://example.org", type: "Link", disabled: false},
            }
        }

        const timeGroup = {
            title: "Base Configurations", 
            items: {
                start: {value: 0, type: "Number", tooltip: "Time in seconds when item will be rendered", disableAutomations: true},
                duration: {value: 20, type: "Number", tooltip: "Time in seconds when item won't be rendered anymore", disableAutomations: true},
            }
        }

        this.config = {}
        this.config.defaultConfig = [headerGroup, timeGroup]

        //TODO UUID ?
        this.config.id          = Math.floor(Math.random() * 10000000)
        this.config.offsetLeft  = 0
        this.config.name        = config.name
        this.config.movable     = true
        this.config.automations = []        
        this.config.itemType    = config.type 
        
        this.automations = []
        this.getConfig()
        this._lastTime = -1
    }

    addItem = () => {
        addItem(this.config)
        setDisabled(false)
        this.mesh.name = String(this.config.id)
    }

    updateConfig = (config) => {
        const c = {...config}
        c.defaultConfig.forEach(group => {
            Object.keys(group.items).forEach(key => {
                const { type, max, min } = group.items[key]

                if( type === "Number") {
                    c[key] = this.checkNum(c[key])

                    if(c[key] > max)c[key] = max
                    if(c[key] < min)c[key] = min
                }
            })
        })

        this._updateConfig(c)
    } 
    
    getConfig = () => {
        this.config.defaultConfig.forEach(group => {
            Object.keys(group.items).map((key, index) => {
                this.config[key] = group.items[key].value
            })
        })
    }

    checkNum = (nr) => isNaN(nr) ? 0 :  Number(nr)

    updateAutomations = (time) => {
        const automations = this.automations
        let changed = false
        let config = {...this.config}
        if(automations.length > 0) {
            automations.forEach(e => {
                const index = e.points.findIndex(p => p.time >= time) 
                var newVal = 0
                if(index > 0 ) {
                    const tx = (time - e.points[index - 1].time) / (e.points[index].time - e.points[index-1].time)
                    const valueRange = this.checkNum(e.points[index].value) - this.checkNum(e.points[index-1].value)
                    newVal = this.checkNum(e.points[index - 1].value) + (tx * valueRange)
                }else {
                    newVal = this.checkNum(e.points[e.points.length -1].value)
                }

                if(config[e.name] !== newVal)changed = true
                config[e.name] = newVal
               
            })

            if(changed) {
                this._updateConfig(config)
            }
        }
        
        return {...config}
    }

    incrementTime = (time) => {}

    setTime = (time, _, itemId) => {
        const config = this.updateAutomations(time)
        delete config["automations"]
        if(itemId === config.id && this.automations.length > 0)updateItemConfig(config)
    }

    setSize = (width, height) => {}
    //TODO remove // find better use
    _updateConfig = (config) => { this.config = config }
    _animate = () => {}
    stop = () => {}
    play = () => {}
    setFFTSize = (value) => {}
} 





