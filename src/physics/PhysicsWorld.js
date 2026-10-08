// Bounding-sphere radii used for 3D collision detection.
// These match the spec's XZ collider sizes and extend that into 3D.
const RADII = {
  cube:     1.2,   // half-diagonal of 2×2 base
  pyramid:  1.2,
  cone:     1.0,
  sphere:   1.5,   // exact spec radius
  cylinder: 1.0,
};

// +Y = UP in this engine. Floor is at Y = 0. Objects in the sky have positive Y.
const GRAVITY        = 22;   // U/s² — subtracted from velocity.y each frame
const SLEEP_VEL      = 0.08; // U/s linear threshold to put a body to sleep
const SLEEP_ANG      = 0.05; // rad/s angular threshold
const SLEEP_FRAMES   = 30;   // consecutive frames below threshold → sleep

// ─── PhysicsBody ────────────────────────────────────────────────────────────

export class PhysicsBody {
  constructor({
    objectType  = 'sphere',
    position    = { x: 0, y: 0, z: 0 },
    mass        = 1,
    restitution = 0.26,
    friction    = 0.35,
    linDamping  = 0.004,
    angDamping  = 0.10,
  } = {}) {
    this.position = { x: position.x, y: position.y ?? 0, z: position.z };
    this.velocity = { x: 0, y: 0, z: 0 };

    // Euler angles driven by angular velocity (used for rendering)
    this.rotation        = { x: 0, y: 0, z: 0 };
    this.angularVelocity = { x: 0, y: 0, z: 0 };

    this.radius      = RADII[objectType] ?? 1.0;
    this.mass        = mass;
    this.invMass     = mass > 0 ? 1 / mass : 0;
    this.isStatic    = mass === 0;
    this.restitution = restitution;
    this.friction    = friction;
    this.linDamping  = linDamping;
    this.angDamping  = angDamping;

    // active=false: body exists but is not yet simulated (startup queue)
    this.active      = false;
    this._sleepCount = 0;
    this.sleeping    = false;

    // Reference back to the owning SceneObject (set externally)
    this.sceneObject = null;
  }

  // World-space sphere centre. +Y = up, so centre is above the base by one radius.
  get cx() { return this.position.x; }
  get cy() { return this.position.y + this.radius; }
  get cz() { return this.position.z; }
}

// ─── PhysicsWorld ────────────────────────────────────────────────────────────

export class PhysicsWorld {
  constructor() {
    this.bodies = [];
  }

  add(body) {
    this.bodies.push(body);
    return body;
  }

  remove(body) {
    this.bodies = this.bodies.filter(b => b !== body);
  }

  step(dt) {
    const active = this.bodies.filter(b => b.active && !b.isStatic && !b.sleeping);

    for (const b of active) {
      // Gravity pulls downward (-Y)
      b.velocity.y -= GRAVITY * dt;

      // Integrate position
      b.position.x += b.velocity.x * dt;
      b.position.y += b.velocity.y * dt;
      b.position.z += b.velocity.z * dt;

      // Angular integration
      b.rotation.x += b.angularVelocity.x * dt;
      b.rotation.y += b.angularVelocity.y * dt;
      b.rotation.z += b.angularVelocity.z * dt;

      // Horizontal damping (let gravity/bounce govern vertical)
      b.velocity.x *= (1 - b.linDamping);
      b.velocity.z *= (1 - b.linDamping);
      b.angularVelocity.x *= (1 - b.angDamping);
      b.angularVelocity.y *= (1 - b.angDamping);
      b.angularVelocity.z *= (1 - b.angDamping);

      this._groundCollision(b);
    }

    // Body-body collision — include sleeping bodies so a fast one can wake them
    const simulated = this.bodies.filter(b => b.active && !b.isStatic);
    for (let i = 0; i < simulated.length; i++) {
      for (let j = i + 1; j < simulated.length; j++) {
        this._bodyCollision(simulated[i], simulated[j]);
      }
    }

    // Sleep check + sync back to SceneObjects
    for (const b of simulated) {
      this._sleepCheck(b);
      if (b.sceneObject) this._syncToObject(b);
    }
  }

  _groundCollision(b) {
    if (b.position.y > 0) return; // still above floor

    b.position.y = 0;

    if (b.velocity.y >= 0) return; // already moving upward (away from floor)

    // Bounce
    b.velocity.y = -b.velocity.y * b.restitution;

    // Ground friction on horizontal velocity
    const hSpeed = Math.hypot(b.velocity.x, b.velocity.z);
    if (hSpeed > 0.01) {
      const frict = Math.min(b.friction * Math.abs(b.velocity.y), hSpeed);
      b.velocity.x -= (b.velocity.x / hSpeed) * frict;
      b.velocity.z -= (b.velocity.z / hSpeed) * frict;
    }

    // Rolling spin from landing horizontal speed (very subtle — ÷20 vs naive cross product)
    if (hSpeed > 0.5) {
      b.angularVelocity.x += b.velocity.z * 0.012;
      b.angularVelocity.z -= b.velocity.x * 0.012;
    }

    // Kill tiny bounces — settle directly on floor
    if (b.velocity.y < 0.5) {
      b.velocity.y = 0;
    }
  }

  _bodyCollision(a, b) {
    const dx = b.cx - a.cx;
    const dy = b.cy - a.cy;
    const dz = b.cz - a.cz;
    const distSq = dx * dx + dy * dy + dz * dz;
    const minDist = a.radius + b.radius;

    if (distSq >= minDist * minDist || distSq < 1e-6) return;

    const dist = Math.sqrt(distSq);
    const nx = dx / dist;
    const ny = dy / dist;
    const nz = dz / dist;

    // Positional correction — push bodies apart
    const overlap  = minDist - dist;
    const totalInv = a.invMass + b.invMass;
    if (totalInv < 1e-6) return;

    const corrA = overlap * (a.invMass / totalInv);
    const corrB = overlap * (b.invMass / totalInv);

    a.position.x -= nx * corrA;
    a.position.y -= ny * corrA;
    a.position.z -= nz * corrA;
    b.position.x += nx * corrB;
    b.position.y += ny * corrB;
    b.position.z += nz * corrB;

    // Don't push bodies below the floor
    if (a.position.y < 0) a.position.y = 0;
    if (b.position.y < 0) b.position.y = 0;

    // Wake sleeping bodies
    if (a.sleeping) { a.sleeping = false; a._sleepCount = 0; }
    if (b.sleeping) { b.sleeping = false; b._sleepCount = 0; }

    // Impulse response
    const rvx  = b.velocity.x - a.velocity.x;
    const rvy  = b.velocity.y - a.velocity.y;
    const rvz  = b.velocity.z - a.velocity.z;
    const vRel = rvx * nx + rvy * ny + rvz * nz;

    if (vRel > 0) return; // separating, skip

    const e = Math.min(a.restitution, b.restitution);
    const j = -(1 + e) * vRel / totalInv;

    a.velocity.x -= j * a.invMass * nx;
    a.velocity.y -= j * a.invMass * ny;
    a.velocity.z -= j * a.invMass * nz;
    b.velocity.x += j * b.invMass * nx;
    b.velocity.y += j * b.invMass * ny;
    b.velocity.z += j * b.invMass * nz;

    // Spin from collision impact — kept very subtle (÷20 vs naive j*0.3)
    const spin = j * 0.015;
    a.angularVelocity.x -= spin * a.invMass * nz;
    a.angularVelocity.z += spin * a.invMass * nx;
    b.angularVelocity.x += spin * b.invMass * nz;
    b.angularVelocity.z -= spin * b.invMass * nx;
    a.angularVelocity.y += spin * a.invMass * (nx + nz) * 0.3;
    b.angularVelocity.y -= spin * b.invMass * (nx + nz) * 0.3;
  }

  _sleepCheck(b) {
    const lin    = Math.hypot(b.velocity.x, b.velocity.y, b.velocity.z);
    const ang    = Math.hypot(b.angularVelocity.x, b.angularVelocity.y, b.angularVelocity.z);
    const onFloor = b.position.y <= 0.01;

    if (onFloor && lin < SLEEP_VEL && ang < SLEEP_ANG) {
      b._sleepCount++;
      if (b._sleepCount >= SLEEP_FRAMES) {
        b.sleeping = true;
        b.velocity.x = 0; b.velocity.y = 0; b.velocity.z = 0;
        b.angularVelocity.x = 0; b.angularVelocity.y = 0; b.angularVelocity.z = 0;
        b.position.y = 0;
      }
    } else {
      b._sleepCount = 0;
    }
  }

  _syncToObject(b) {
    const obj     = b.sceneObject;
    obj.position.x = b.position.x;
    obj.position.y = b.position.y;
    obj.position.z = b.position.z;
    obj.rotationX  = b.rotation.x;
    obj.rotationY  = b.rotation.y;
    obj.rotationZ  = b.rotation.z;
  }
}

