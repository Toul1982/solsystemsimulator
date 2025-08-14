import NBodyEngine from "./engine/NBodyEngine.js";
import SceneManager from "./renderer/SceneManager.js";
import * as THREE from "three";

const canvas = document.getElementById("bg");

// --- konstanter & startdata ---
const G = 1;

// Relativa massor (Jorden = 1)
const MSun = 333000;
const ME = 1;
const MM = 0.0123;
const MMerc = 0.0553;
const MVen  = 0.815;
const MMars = 0.107;
const MJup  = 317.8;
const MSat  = 95.2;

// Visuella radier i simuleringsenheter
const R_Sun_Visual   = 30;
const R_Earth_Actual = 1;
const R_Moon_Actual  = 0.27;
const R_Merc_Actual  = 0.38;
const R_Ven_Actual   = 0.95;
const R_Mars_Actual  = 0.53;
const R_Jup_Actual   = 11.2;
const R_Sat_Actual   = 9.45;

const PLANET_VISUAL_SCALE = 1.5;

const R_Earth = R_Earth_Actual * PLANET_VISUAL_SCALE;
const R_Moon  = R_Moon_Actual * PLANET_VISUAL_SCALE;
const R_Merc  = R_Merc_Actual * PLANET_VISUAL_SCALE;
const R_Ven   = R_Ven_Actual * PLANET_VISUAL_SCALE;
const R_Mars  = R_Mars_Actual * PLANET_VISUAL_SCALE;
const R_Jup   = R_Jup_Actual * PLANET_VISUAL_SCALE;
const R_Sat   = R_Sat_Actual * PLANET_VISUAL_SCALE;


// Skalningsfaktor för avstånd:
const AU_SCALE = 80; // 1 AU = 80 enheter

// Avstånd från solen i AU (Astronomiska Enheter)
const R_ES_AU       = 1.0;
const R_EM          = 2.0;

const R_Merc_Sun_AU = 0.39;
const R_Ven_Sun_AU  = 0.72;
const R_Mars_Sun_AU = 1.52;
const R_Jup_Sun_AU  = 5.2;
const R_Sat_Sun_AU  = 9.58;


// Beräkna hastigheter för cirkulära banor (v = sqrt(G * M_central / r))
const vE    = Math.sqrt(G * MSun / (R_ES_AU * AU_SCALE));
const vM_rel = Math.sqrt(G * ME / R_EM);

const vMerc = Math.sqrt(G * MSun / (R_Merc_Sun_AU * AU_SCALE));
const vVen  = Math.sqrt(G * MSun / (R_Ven_Sun_AU * AU_SCALE));
const vMars = Math.sqrt(G * MSun / (R_Mars_Sun_AU * AU_SCALE));
const vJup  = Math.sqrt(G * MSun / (R_Jup_Sun_AU * AU_SCALE));
const vSat  = Math.sqrt(G * MSun / (R_Sat_Sun_AU * AU_SCALE));


const engine = new NBodyEngine({ G, fixedDt: 1 / 240 });

// Ladda en enkel kubkarta för reflektioner
const cubeTextureLoader = new THREE.CubeTextureLoader();
const environmentMap = cubeTextureLoader.load([
    '/textures/skybox/px.png',
    '/textures/skybox/nx.png',
    '/textures/skybox/py.png',
    '/textures/skybox/ny.png',
    '/textures/skybox/pz.png',
    '/textures/skybox/nz.png'
]);
// Om du inte har texturer ännu, kan du använda en solid färg som envMap/background:
// const environmentMap = null; // Eller new THREE.Color(0x000000); för svart bakgrund


const scene  = new SceneManager(canvas, AU_SCALE, environmentMap);

engine.init([
  { name: "Sun",     mass: MSun,  radius: R_Sun_Visual,  pos: [0, 0, 0],                                 vel: [0, 0, 0], staticBody: true },
  { name: "Mercury", mass: MMerc, radius: R_Merc,    pos: [R_Merc_Sun_AU * AU_SCALE, 0, 0],          vel: [0, -vMerc, 0] },
  { name: "Venus",   mass: MVen,  radius: R_Ven,     pos: [R_Ven_Sun_AU * AU_SCALE, 0, 0],           vel: [0, -vVen, 0] },
  { name: "Earth",   mass: ME,    radius: R_Earth,   pos: [R_ES_AU * AU_SCALE, 0, 0],                vel: [0, -vE, 0] },
 // { name: "Moon",    mass: MM,    radius: R_Moon,    pos: [R_ES_AU * AU_SCALE + R_EM, 0, 0],         vel: [0, -vE + vM_rel, 0] },//
  { name: "Mars",    mass: MMars, radius: R_Mars,    pos: [R_Mars_Sun_AU * AU_SCALE, 0, 0],          vel: [0, -vMars, 0] },
  { name: "Jupiter", mass: MJup,  radius: R_Jup,     pos: [R_Jup_Sun_AU * AU_SCALE, 0, 0],           vel: [0, -vJup, 0] },
  { name: "Saturn",  mass: MSat,  radius: R_Sat,     pos: [R_Sat_Sun_AU * AU_SCALE, 0, 0],           vel: [0, -vSat, 0] }
]);


// --- render-loop ---
const SUB_STEPS = 4;
const fpsLabel = document.getElementById("fps");
let frames = 0, last = performance.now();

let simulationSpeed = 1.0;

// --- KONTROLLER ---
// Gamla knappar för fasta hastigheter
document.getElementById("speed-slow").addEventListener("click", () => simulationSpeed = 0.1);
document.getElementById("speed-normal").addEventListener("click", () => simulationSpeed = 1.0);
document.getElementById("speed-fast").addEventListener("click", () => simulationSpeed = 10.0);
document.getElementById("speed-superfast").addEventListener("click", () => simulationSpeed = 100.0);

// Nya reglage för dynamisk kontroll
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const gSlider = document.getElementById('g-slider');
const gValue = document.getElementById('g-value');

// Sätt startvärden för texten från reglagens default-värde
const initialSpeed = parseFloat(speedSlider.value) / 10.0;
simulationSpeed = initialSpeed;
speedValue.textContent = initialSpeed.toFixed(1);

const initialG = parseFloat(gSlider.value);
engine.G = initialG;
gValue.textContent = initialG.toFixed(1);


// Event listeners för reglagen
speedSlider.addEventListener('input', (event) => {
    const speed = parseFloat(event.target.value) / 10.0; // Skala om 0-200 till 0-20
    simulationSpeed = speed;
    speedValue.textContent = speed.toFixed(1);
});

gSlider.addEventListener('input', (event) => {
    const g = parseFloat(event.target.value);
    engine.G = g;
    gValue.textContent = g.toFixed(1);
});


function loop() {
  for (let i = 0; i < SUB_STEPS; i++) engine.step(simulationSpeed / SUB_STEPS);
  scene.update(engine.getState());

  frames++;
  const now = performance.now();
  if (now - last >= 1000) {
    fpsLabel.textContent = `${frames} fps`;
    frames = 0;
    last = now;
  }
  requestAnimationFrame(loop);
}

loop();