import * as THREE from 'three';
import BaseBody from './BaseBody.js';

const ATMOSPHERE_DATA = {
    "Venus":   { factor: 1.05, color: 0xdd9900 },
    "Jupiter": { factor: 1.03, color: 0xffeeaa }
};

export default class GenericPlanet extends BaseBody {
    constructor(params, hasAtmosphere) {
        super(params); 
        
        const planetName = this.config.name;

        // Använd den mjukare "glow"-effekten för atmosfären
        if (hasAtmosphere && ATMOSPHERE_DATA[planetName]) {
            const data = ATMOSPHERE_DATA[planetName];
            const glowMesh = this._createGlow(data.factor, data.color);
            this.mesh.add(glowMesh);
        }
    }

    _createMaterial() {
        const planetName = this.config.name;

        let roughnessValue = 0.7;
        let metalnessValue = 0.1;

        switch (planetName) {
            case "Mars":
                roughnessValue = 0.9;
                metalnessValue = 0.2;
                break;
            case "Venus":
                roughnessValue = 0.4;
                metalnessValue = 0.1;
                break;
            case "Mercury":
                roughnessValue = 0.8;
                metalnessValue = 0.1;
                break;
        }

        const materialParams = {
            color: 0xffffff,
            roughness: roughnessValue,
            metalness: metalnessValue,
        };

        if (this.texture) {
            materialParams.map = this.texture;
            // --- NYTT: Subtil "egen glöd" ---
            // Gör att texturen alltid är svagt synlig, även på nattsidan.
            materialParams.emissiveMap = this.texture;
            materialParams.emissive = new THREE.Color(0x222222); // Mörkgrå för en svag effekt
        } else {
            materialParams.color = 0xaaaaaa; // Fallback för Månen
        }
        
        return new THREE.MeshStandardMaterial(materialParams);
    }
}