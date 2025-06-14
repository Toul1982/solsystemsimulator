// -------------------------------------------------
//   N-BODY  ENGINE   (pure JS, no Cannon)
//   Integrator: velocity-Verlet (leap-frog)
// -------------------------------------------------
export default class NBodyEngine {
  constructor({ G = 1, fixedDt = 1 / 120 } = {}) {
    this.G = G;
    this.fixedDt = fixedDt;
    /** @type {Body[]} */
    this.bodies = [];
  }

  /** @param {BodyConfig[]} cfgs */
  init(cfgs) {
    this.bodies = cfgs.map((cfg) => ({
      name: cfg.name,
      mass: cfg.mass,
      radius: cfg.radius,
      static: !!cfg.staticBody,
      // pos & vel som Three.Vector3-lika objekt
      pos: { x: cfg.pos[0], y: cfg.pos[1], z: cfg.pos[2] },
      vel: { x: cfg.vel[0], y: cfg.vel[1], z: cfg.vel[2] },
      acc: { x: 0, y: 0, z: 0 },  // initieras senare
    }));
    // räkna första accelerationen
    this._updateAccelerations();
  }

  /** kallad många ggr per render-frame */
  step(mult = 1) {
    const dt = this.fixedDt * mult;
    const bodies = this.bodies;

    // 1) v(t+½dt)  = v(t) + a(t) * ½dt
    for (const b of bodies) if (!b.static) {
      b.vel.x += b.acc.x * (0.5 * dt);
      b.vel.y += b.acc.y * (0.5 * dt);
      b.vel.z += b.acc.z * (0.5 * dt);
    }

    // 2) x(t+dt)   = x(t) + v(t+½dt) * dt
    for (const b of bodies) if (!b.static) {
      // KORRIGERAD BUGG HÄR: Tidigare stod det b.acc.y och b.acc.z
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;
      b.pos.z += b.vel.z * dt;
    }

    // 3) a(t+dt)   = f(x(t+dt))
    this._updateAccelerations();

    // 4) v(t+dt)   = v(t+½dt) + a(t+dt) * ½dt
    for (const b of bodies) if (!b.static) {
      b.vel.x += b.acc.x * (0.5 * dt);
      b.vel.y += b.acc.y * (0.5 * dt);
      b.vel.z += b.acc.z * (0.5 * dt);
    }
  }

  /** render-lager kallar för att hämta snapshot */
  getState() {
    return this.bodies.map((b) => ({
      name: b.name,
      radius: b.radius,
      pos: { ...b.pos },
    }));
  }

  // ---------- PRIVATE ----------
  _updateAccelerations() {
    const { G, bodies } = this;
    // nollställ
    for (const b of bodies) b.acc.x = b.acc.y = b.acc.z = 0;

    // parvis gravitation
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const A = bodies[i], B = bodies[j];
        const dx = B.pos.x - A.pos.x;
        const dy = B.pos.y - A.pos.y;
        const dz = B.pos.z - A.pos.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        const dist = Math.sqrt(distSq) + 1e-9;
        const factor = (G / (distSq * dist));

        // accelerations-skala
        const ax = factor * dx;
        const ay = factor * dy;
        const az = factor * dz;

        if (!A.static) {
          A.acc.x += ax * B.mass;
          A.acc.y += ay * B.mass;
          A.acc.z += az * B.mass;
        }
        if (!B.static) {
          B.acc.x -= ax * A.mass;
          B.acc.y -= ay * A.mass;
          B.acc.z -= az * A.mass;
        }
      }
    }
  }
}

/**
 * @typedef {Object} BodyConfig
 * @prop {string}  name
 * @prop {number}  mass
 * @prop {number}  radius
 * @prop {number[]} pos  [x,y,z]
 * @prop {number[]} vel  [vx,vy,vz]
 * @prop {boolean=} staticBody
 */