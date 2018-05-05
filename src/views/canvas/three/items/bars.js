
import * as THREE from 'three'
import { MeshItem } from './item';

export default class Bars extends MeshItem {
    constructor(config) {
        super(config)
        this.bins = new THREE.Group()

        this.config.type = "BARS"
        this.config.name = "Bars"
        this.defaultConfig.strength = {value: 1, type: "Number", tooltip: "Exaggeration in the y axis", editable: true}
        this.defaultConfig.decreaseSpeed = {value: 0.5, type: "Number", tooltip: "Amount bars will decrease in height each tick", editable: true}
        this.defaultConfig.deltaRequired = {value: 0.12, type: "Number", tooltip: "Delta from previous tick needed to push the bars up (prevents flicker)", editable: true}       
        this.defaultConfig.color = {value: "FFFFFF", type: "String", tooltip: "", editable: true}
        this.defaultConfig.scale = {value: 0.5, type: "Number", tooltip: "", editable: true}


        for(var i = 0; i < 32; i++) {
            var geometry = new THREE.BoxGeometry( 1, 1, 1 );
            var material = new THREE.MeshBasicMaterial( {color: "0xFFFFFF"} );
            var cube = new THREE.Mesh( geometry, material );

            cube.position.x = i+(i*0.5) - 24;
            this.bins.add(cube)
        }

        this.strength = 1
        this.getConfig(this.defaultConfig)
        this.mesh = this.bins
        this.addItem()
    }

    getCompoundBoundingBox = (items) => {
        var box = null;
        items.forEach((e) => {});

        return box;
    }


    move = (x, y, z) => {
        this.bins.children.forEach((e, i) => {
            e.position.x = x + i+(i*0.5) - 24;
            e.translateZ(z);
        })

        this.centerY = y
    }

    updateConfig = (config) => {
        this.bins.children.forEach(e => {
            e.material.color.setHex("0x" + config.color)
        })

        if(this.config.centerX !== config.centerX || this.config.centerY !== config.centerY ||  this.config.centerZ !== config.centerZ) {
            this.move(config.centerX, config.centerY, config.centerZ)
        }

        this.config = config
    }

    animate = (time, frequencyBins) => {
        const { deltaRequired, decreaseSpeed, strength, scale, centerY } = this.config

        this.bins.children.forEach( (e,i) => {
            let o = e.scale.y
            let n = (frequencyBins[i] / 3) * strength * scale

            o = n > (o + deltaRequired) ? n : (o - decreaseSpeed) >= 0 ? (o-decreaseSpeed) : 0.001;
      
            e.scale.set(scale , o, scale); 
            e.position.y = centerY + o/2 
        })
    }
}
