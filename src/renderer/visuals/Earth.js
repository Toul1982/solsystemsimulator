import * as THREE from 'three';
import BaseBody from './BaseBody.js';

export default class Earth extends BaseBody {
    constructor(params) {
        const { bodyConfig, environmentMap, texture, cloudTexture } = params;
        super({ bodyConfig, environmentMap, texture });

        this.cloudTexture = cloudTexture;
        this.cloudMesh = this._createCloudMesh();
        this.mesh.add(this.cloudMesh);

        // Använd den mjukare "glow"-effekten för atmosfären
        const glowMesh = this._createGlow(1.03, 0x55aaff);
        this.mesh.add(glowMesh);
    }
    
    _createMaterial() {
        const material = new THREE.MeshStandardMaterial({
            map: this.texture,
            color: 0xffffff,
            roughness: 0.4,
            metalness: 0.1,
        });
        
        // --- NYTT: Subtil "egen glöd" för jorden ---
        material.emissiveMap = this.texture;
        material.emissive = new THREE.Color(0x222222); // Samma svaga glöd som andra planeter
        
        return material;
    }

    _createCloudMesh() {
        const cloudGeo = new THREE.SphereGeometry(this.config.radius * 1.01, 32, 32);
        const cloudMat = new THREE.MeshPhongMaterial({
            map: this.cloudTexture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
        });
        const mesh = new THREE.Mesh(cloudGeo, cloudMat);
        mesh.name = "earth_clouds";
        return mesh;
    }
}