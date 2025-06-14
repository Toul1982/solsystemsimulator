import * as THREE from 'three';

export default class BaseBody {
    constructor({ bodyConfig, environmentMap, texture }) {
        this.config = bodyConfig;
        this.environmentMap = environmentMap;
        this.texture = texture;
        
        const geometry = new THREE.SphereGeometry(this.config.radius, 32, 32);
        const material = this._createMaterial();

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.name = this.config.name;

        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
    }

    _createMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.6,
            metalness: 0.1,
            // envMap: this.environmentMap
        });
    }
    
    _createAtmosphere(sizeFactor, color, opacity) {
        const atmosphereGeo = new THREE.SphereGeometry(this.config.radius * sizeFactor, 32, 32);
        const atmosphereMat = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: opacity,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            roughness: 0.1,
            metalness: 0.0,
            // envMap: this.environmentMap
        });
        return new THREE.Mesh(atmosphereGeo, atmosphereMat);
    }

    // --- NY METOD FÖR EN MJUK, AVTONANDE GLOW ---
    _createGlow(sizeFactor, color) {
        const glowGeo = new THREE.SphereGeometry(this.config.radius * sizeFactor, 40, 40);
        
        // Detta är ett specialmaterial som använder GLSL-kod (shader-kod)
        const glowMat = new THREE.ShaderMaterial({
            uniforms: {
                // Färgen på glorian, kan ändras dynamiskt
                'glowColor': { type: 'c', value: new THREE.Color(color) }
            },
            // Vertex shadern positionerar geometrin
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            // Fragment shadern bestämmer färgen och opaciteten
            fragmentShader: `
                uniform vec3 glowColor;
                varying vec3 vNormal;
                void main() {
                    // Beräknar en "fresnel"-effekt: ju mer vinkelrätt vi ser på ytan, desto lägre värde.
                    float fresnel = 1.0 - dot(normalize(vNormal), vec3(0, 0, 1.0));
                    // Använder potensen för att göra övergången skarpare närmare kanten
                    float alpha = pow(fresnel, 3.0); 
                    // Sätter pixelns färg och opacitet
                    gl_FragColor = vec4(glowColor, alpha);
                }
            `,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false // Viktigt för korrekta transparenseffekter
        });

        return new THREE.Mesh(glowGeo, glowMat);
    }
    // --- SLUT PÅ NY METOD ---

    getMesh() {
        return this.mesh;
    }
}