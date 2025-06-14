import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import LightingManager from "./LightingManager.js";
import PlanetVisualsManager from "./PlanetVisualsManager.js";

// LabelManager-klassen (inga ändringar)
class LabelManager {
    constructor(camera, renderer) { this.camera = camera; this.renderer = renderer; this.labelsContainer = document.getElementById('labels-container'); this.labels = new Map(); this.tempVector = new THREE.Vector3(); this.projectedCenter = new THREE.Vector3(); this.projectedEdge = new THREE.Vector3(); }
    createLabel(planetName) { let labelDiv = document.createElement('div'); labelDiv.className = 'planet-label'; labelDiv.textContent = planetName; this.labelsContainer.appendChild(labelDiv); this.labels.set(planetName, labelDiv); return labelDiv; }
    updateLabelPosition(planetName, object3D, planetRadiusWorld) { const labelDiv = this.labels.get(planetName); if (!labelDiv) return; object3D.getWorldPosition(this.projectedCenter); const directionToCamera = new THREE.Vector3().subVectors(this.camera.position, this.projectedCenter).normalize(); this.projectedEdge.copy(this.projectedCenter).add(directionToCamera.multiplyScalar(planetRadiusWorld)); this.projectedCenter.project(this.camera); this.projectedEdge.project(this.camera); if (this.projectedCenter.z > 1 || this.projectedCenter.x < -1 || this.projectedCenter.x > 1 || this.projectedCenter.y < -1 || this.projectedCenter.y > 1) { labelDiv.style.display = 'none'; return; } const x = (this.projectedCenter.x * 0.5 + 0.5) * this.renderer.domElement.clientWidth; const y_edge = (-this.projectedEdge.y * 0.5 + 0.5) * this.renderer.domElement.clientHeight; const pixelRadius = Math.hypot(x - ((this.projectedEdge.x * 0.5 + 0.5) * this.renderer.domElement.clientWidth), y_edge - ((this.projectedCenter.y * 0.5 + 0.5) * this.renderer.domElement.clientHeight)); const minPixelRadiusToShowLabel = 2; const maxPixelRadiusToShowLabel = 60; if (pixelRadius < minPixelRadiusToShowLabel || pixelRadius > maxPixelRadiusToShowLabel) { labelDiv.style.display = 'none'; } else { labelDiv.style.display = 'block'; labelDiv.style.left = `${x}px`; labelDiv.style.top = `${y_edge - labelDiv.offsetHeight - 5}px`; } }
}

export default class SceneManager {
  constructor(canvas, auScale, environmentMap) {
    this.scene = new THREE.Scene();
    this.environmentMap = environmentMap; 
    if (this.environmentMap) { this.scene.background = this.environmentMap; }

    this.camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1e5);
    this.initialCameraPosition = new THREE.Vector3(0, auScale * 1.5, auScale * 3.5);
    this.camera.position.copy(this.initialCameraPosition);
    this.initialControlsTarget = new THREE.Vector3(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.copy(this.initialControlsTarget);

    this.lightingManager = new LightingManager(this.scene, auScale);
    this.textureLoader = new THREE.TextureLoader();
    this.planetVisualsManager = new PlanetVisualsManager(this.scene, this.textureLoader, this.environmentMap);
    this.labelManager = new LabelManager(this.camera, this.renderer);

    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 15000; i++) starPos.push((Math.random() - 0.5) * 8000, (Math.random() - 0.5) * 8000, (Math.random() - 0.5) * 8000);
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1 })));

    this.meshes = new Map();
    this.orbits = new Map(); // Kommer nu att innehålla trail-objekt
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectedMesh = null;
    this.isFollowing = false;
    this.followTargetMesh = null;
    
    this.moonMesh = null;
    this.moonPivot = null;

    canvas.addEventListener('click', (e) => this._onCanvasClick(e), false);
    document.getElementById('toggle-follow').addEventListener('click', () => this._onToggleFollowClick());
    window.addEventListener("resize", () => this._onWindowResize());
  }

  update(simulationState) {
    this._createMissingVisuals(simulationState);
    this._createMoonIfReady();
    this._updateBodyTransforms(simulationState);
    this._updateMoonOrbit();
    this._updateCameraAndControls();
    this.renderer.render(this.scene, this.camera);
  }

  _createMissingVisuals(simulationState) {
    for (const bodyState of simulationState) {
      if (!this.meshes.has(bodyState.name)) {
        const mesh = this.planetVisualsManager.createBodyVisual(bodyState);
        this.scene.add(mesh);
        this.meshes.set(bodyState.name, mesh);

        if (bodyState.name === "Sun") {
          mesh.add(this.lightingManager.sunLight);
        }

        if (bodyState.name !== "Sun") {
          this.labelManager.createLabel(bodyState.name);
          // Anropa den nya metoden för att skapa ett tomt spår
          this._createOrbitTrail(bodyState.name);
        }
      }
    }
  }

  // --- NY METOD för att skapa ett spår ---
  _createOrbitTrail(name) {
      const trail = {
          points: [],
          maxPoints: 8000, // Hur många punkter spåret ska bestå av
          geometry: new THREE.BufferGeometry(),
          material: new THREE.LineBasicMaterial({ color: 0x555555 }),
      };

      // Skapa en start-buffer med tillräckligt med utrymme
      const initialPositions = new Float32Array(trail.maxPoints * 3);
      trail.geometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));

      const line = new THREE.Line(trail.geometry, trail.material);
      line.frustumCulled = false; // Förhindrar att spåret försvinner när det är delvis utanför bild

      this.scene.add(line);
      this.orbits.set(name, trail);
  }

  _createMoonIfReady() {
    const earthMesh = this.meshes.get('Earth');
    if (earthMesh && !this.moonPivot) {
      this.moonPivot = new THREE.Group();
      const tiltInRadians = THREE.MathUtils.degToRad(5.1);
      this.moonPivot.rotation.x = tiltInRadians;
      earthMesh.add(this.moonPivot);
      
      const moonConfig = { name: "Moon", radius: 0.5 };
      this.moonMesh = this.planetVisualsManager.createBodyVisual(moonConfig);
      
      const orbitRadius = 4.5;
      this.moonMesh.position.set(orbitRadius, 0, 0);
      
      this.moonPivot.add(this.moonMesh);
      this.labelManager.createLabel("Moon");
    }
  }

  _updateBodyTransforms(simulationState) {
    for (const bodyState of simulationState) {
      const mesh = this.meshes.get(bodyState.name);
      if (!mesh) continue;

      mesh.position.set(bodyState.pos.x, bodyState.pos.y, bodyState.pos.z);

      // --- NY KOD: Lägg till ny position i spåret ---
      const trail = this.orbits.get(bodyState.name);
      if (trail) {
          trail.points.push(bodyState.pos.x, bodyState.pos.y, bodyState.pos.z);
          // Om spåret är för långt, ta bort den äldsta punkten
          if (trail.points.length > trail.maxPoints * 3) {
              trail.points.splice(0, 3);
          }
          const positionAttribute = trail.geometry.getAttribute('position');
          positionAttribute.set(trail.points);
          positionAttribute.needsUpdate = true; // Viktigt! Talar om för Three.js att uppdatera geometrin.
          trail.geometry.setDrawRange(0, trail.points.length / 3);
      }
      // --- SLUT PÅ NY KOD ---

      switch (bodyState.name) {
        case "Venus":   mesh.rotation.y -= 0.0005; break;
        case "Jupiter": mesh.rotation.y += 0.005;  break;
        case "Mars":    mesh.rotation.y += 0.002;  break;
        case "Earth":
          mesh.rotation.y += 0.002;
          const cloudMesh = mesh.getObjectByName("earth_clouds");
          if (cloudMesh) {
            cloudMesh.rotation.y += 0.0005; 
          }
          break;
        default:
          mesh.rotation.y += 0.001;
          break;
      }
      
      if (bodyState.name !== "Sun") {
        this.labelManager.updateLabelPosition(bodyState.name, mesh, bodyState.radius);
      }
    }
  }

  _updateMoonOrbit() {
    if (this.moonPivot) {
      this.moonPivot.rotation.y += 0.01;
      this.moonMesh.rotation.y += 0.005; 
      const moonRadius = this.moonMesh.geometry.parameters.radius;
      this.labelManager.updateLabelPosition("Moon", this.moonMesh, moonRadius);
    }
  }

  _updateCameraAndControls() {
      if (this.isFollowing && this.followTargetMesh) {
          this.controls.target.copy(this.followTargetMesh.position);
      }
      this.controls.update();
  }
  
  // Metoder för interaktivitet
  _onCanvasClick(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const allMeshes = Array.from(this.meshes.values());
    if(this.moonMesh) allMeshes.push(this.moonMesh);
    const intersects = this.raycaster.intersectObjects(allMeshes);
    if (this.selectedMesh) { this._resetMaterial(this.selectedMesh); this.selectedMesh = null; }
    const firstIntersect = intersects.find(i => i.object.name !== 'Sun' && i.object.type !== 'Line');
    if (firstIntersect) {
        const clickedMesh = firstIntersect.object;
        this.selectedMesh = clickedMesh;
        if (this.selectedMesh.material && this.selectedMesh.material.color) {
            this.selectedMesh.userData.originalColor = this.selectedMesh.material.color.getHex();
            this.selectedMesh.material.color.set(0x00ff00);
        }
    } else {
        if (this.isFollowing) { this.isFollowing = false; this.followTargetMesh = null; this.controls.target.copy(this.initialControlsTarget); }
    }
  }

  _onToggleFollowClick() {
      if (!this.selectedMesh) { this.isFollowing = false; return; }
      this.isFollowing = !this.isFollowing;
      if (this.isFollowing) { this.followTargetMesh = this.selectedMesh; } 
      else { this.followTargetMesh = null; this.controls.target.copy(this.initialControlsTarget); }
  }

  _resetMaterial(mesh) {
      if (mesh && mesh.userData.originalColor !== undefined) {
          mesh.material.color.set(mesh.userData.originalColor);
          delete mesh.userData.originalColor;
      }
  }

  _onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}