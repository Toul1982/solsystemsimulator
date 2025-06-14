import * as THREE from "three";
import BaseBody from "./visuals/BaseBody.js";
import Sun from "./visuals/Sun.js";
import Earth from "./visuals/Earth.js";
import Saturn from "./visuals/Saturn.js";
import GenericPlanet from "./visuals/GenericPlanet.js";

export default class PlanetVisualsManager {
    constructor(scene, textureLoader, environmentMap) {
        this.scene = scene;
        this.textureLoader = textureLoader;
        this.environmentMap = environmentMap;

        // Ladda alla texturer på ett ställe vid start.
        // Se till att filnamn och filändelser (.png eller .jpg) stämmer exakt
        // med filerna i din /public/texture/ mapp.
        this.textures = {
            'clouds':  this.textureLoader.load('/texture/clouds.png'),
            'Sun':     this.textureLoader.load('/texture/Sun.png'),
            'Mercury': this.textureLoader.load('/texture/Merkurius.png'),
            'Venus':   this.textureLoader.load('/texture/Venus.png'),
            'Earth':   this.textureLoader.load('/texture/Jorden.png'),
            'Mars':    this.textureLoader.load('/texture/Mars.png'),
            'Jupiter': this.textureLoader.load('/texture/Jupiter.png'),
            'Saturn':  this.textureLoader.load('/texture/Saturn.png'),
            'Uranus':  this.textureLoader.load('/texture/Uranus.png'),
            'Neptune': this.textureLoader.load('/texture/Neptunus.png'),
            'Moon':    null, // Månen har ingen textur i din mapp, så den blir grå
            'ring':    this.textureLoader.load('/texture/ring.png')
        };
    }

    /**
     * Skapar visuella objekt för en himlakropp genom att delegera till rätt klass.
     * @param {Object} bodyConfig - Objekt med kroppens konfiguration.
     * @returns {THREE.Mesh} Den färdigkonfigurerade meshen för kroppen.
     */
    createBodyVisual(bodyConfig) {
        let body;
        const planetName = bodyConfig.name;

        // Förbered ett gemensamt "params"-objekt som skickas till varje klass.
        const params = {
            bodyConfig,
            environmentMap: this.environmentMap,
            // Slå upp och skicka med rätt textur från listan. Om ingen finns, skicka null.
            texture: this.textures[planetName] || null 
        };

        // Välj vilken klass som ska användas baserat på planetens namn.
        switch (planetName) {
            case "Sun":
                body = new Sun(params);
                break;

case "Earth":
    params.cloudTexture = this.textures.clouds; // Skicka med molntexturen
    body = new Earth(params);
    break;
            
            case "Saturn":
                // För Saturnus behöver vi även skicka med ring-texturen.
                // Huvudtexturen (params.texture) är redan tillagd.
                params.ringTexture = this.textures.ring;
                body = new Saturn(params);
                break;
            
            // För planeter som använder GenericPlanet men har atmosfär.
            case "Venus":
            case "Jupiter":
                body = new GenericPlanet(params, true); // true = har atmosfär
                break;

            // För alla andra planeter/kroppar som inte har specialregler.
            case "Mercury":
            case "Moon":
            case "Mars":
            default:
                body = new GenericPlanet(params, false); // false = har inte atmosfär
                break;
        }

        // Hämta den färdiga 3D-modellen från klassen och returnera den.
        const mesh = body.getMesh();
        mesh.userData.bodyState = bodyConfig;
        return mesh;
    }
}