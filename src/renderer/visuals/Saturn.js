import * as THREE from 'three';
import BaseBody from './BaseBody.js';

export default class Saturn extends BaseBody {
    constructor({ bodyConfig, environmentMap, texture, ringTexture }) {
        super({ bodyConfig, environmentMap, texture });
        
        this.ringTexture = ringTexture;
        
        const atmosphereMesh = this._createAtmosphere(1.03, 0xfff0dd, 0.1);
        this.mesh.add(atmosphereMesh);

        const ringMesh = this._createRingMesh();
        this.mesh.add(ringMesh);
    }

    _createMaterial() {
        return new THREE.MeshStandardMaterial({
            map: this.texture,
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.0,
            envMap: this.environmentMap
        });
    }

    _createRingMesh() {
        const innerRadius = this.config.radius * 1.2;
        const outerRadius = this.config.radius * 2.5;

        const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 64, 8);
        const ringMat = new THREE.MeshStandardMaterial({
            map: this.ringTexture,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide,
            roughness: 0.8,
            metalness: 0.0,
          //  envMap: this.environmentMap //
        });
        
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.castShadow = true;
        ringMesh.receiveShadow = true;

        return ringMesh;
    }
}