// Solsystemsimulator/src/renderer/visuals/Sun.js
import * as THREE from 'three';
import BaseBody from './BaseBody.js';

export default class Sun extends BaseBody {
    constructor(params) {
        super(params);
        this.mesh.castShadow = false;
        this.mesh.receiveShadow = false;

        // Använd den mjukare "glow"-effekten för en het stjärna
        const glowMesh = this._createGlow(1.1, 0xffd700); // Ljus guldgul färg
        this.mesh.add(glowMesh);
    }

    _createMaterial() {
        // Solens yta ska vara självlysande och inte påverkas av annan belysning.
        return new THREE.MeshBasicMaterial({
            map: this.texture,
            color: 0xffffff, // Vit färg så att texturen visas korrekt
        });
    }
}