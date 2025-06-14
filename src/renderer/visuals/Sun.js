// Solsystemsimulator/src/renderer/visuals/Sun.js
import * as THREE from 'three';
import BaseBody from './BaseBody.js';

export default class Sun extends BaseBody {
    constructor(params) {
        super(params);
        this.mesh.castShadow = false; // Solen ska inte kasta skugga på sig själv
        this.mesh.receiveShadow = false;
    }

    // Skapa ett självlysande material med texturen
    _createMaterial() {
        // MeshBasicMaterial påverkas inte av ljus, perfekt för en stjärna.
        return new THREE.MeshBasicMaterial({ 
            map: this.texture, // Använd texturen du laddade
        });
    }
}