import BaseItem from "./item";
import * as THREE from 'three'

export default class BackgroundImage extends BaseItem {
    constructor(name, config, sceneConfig) {
        super(name) 

        this.mesh = {}
        var fr = new FileReader()
        fr.onload = () => {
            var image = fr.result
            var texture = new THREE.TextureLoader().load(image)
            var backgroundMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 2, 0),
                new THREE.MeshBasicMaterial({map: texture})
            );

            this.mesh = backgroundMesh
            this.mesh.name = String(this.config.id) 
        }
        
        fr.readAsDataURL(config.file) 
        this.config = this.getConfig(this.defaultConfig)
    }

    updateConfig = (config) => {
        this.config = this.getConfig(config)
    }

}
