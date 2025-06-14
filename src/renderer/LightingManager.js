// Solsystemsimulator/src/renderer/LightingManager.js
import * as THREE from "three";

export default class LightingManager {
    constructor(scene, auScale) {
        this.scene = scene;
        this.auScale = auScale;

        // --- LJUS 1: KORREKT OMGIVNINGSLJUS FÖR RYMDEN ---
        // Ett enkelt, riktningslöst ljus som lättar upp de mörkaste skuggorna.
        // Detta simulerar svagt ljus från avlägsna stjärnor.
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Intensitet 0.2 är ett bra startvärde
        this.scene.add(this.ambientLight);


        // --- LJUS 2: SOLEN (HUVUDLJUSKÄLLAN) ---
        // Ett PointLight i solens mitt som strålar ut ljus och skapar dynamiska skuggor.
        this.sunLight = new THREE.PointLight(0xffffff, 10000, 0, 1.5);
        
        this.sunLight.castShadow = true; 

        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 1;
        this.sunLight.shadow.camera.far = auScale * 12;
        this.sunLight.shadow.bias = -0.001;
    }

    update(sunPosition) {
        // Denna metod används inte just nu.
    }
}