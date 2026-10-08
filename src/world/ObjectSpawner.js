import { Cube } from './Cube.js';
import { Pyramid } from './Pyramid.js';
import { Cone } from './Cone.js';
import { Sphere } from './Sphere.js';
import { Cylinder } from './Cylinder.js';
import { CircleCollider } from '../physics/CircleCollider.js';
import { AABBCollider } from '../physics/AABBCollider.js';
import { PhysicsBody } from '../physics/PhysicsWorld.js';

const TYPE_FACTORIES = {
  cube: Cube,
  pyramid: Pyramid,
  cone: Cone,
  sphere: Sphere,
  cylinder: Cylinder,
};

// First instance of each type always uses its canonical scene position (spec §6).
const FIXED_POSITIONS = {
  cube:     { x: -5, y: 0, z: -10 },
  pyramid:  { x:  5, y: 0, z: -10 },
  cone:     { x: -5, y: 0, z: -20 },
  sphere:   { x:  5, y: 0, z: -20 },
  cylinder: { x:  0, y: 0, z: -30 },
};

// Exact XZ collider specs per type (spec §6).
const TYPE_COLLIDERS = {
  cube:     { shape: 'aabb',   half: 1.0 },
  pyramid:  { shape: 'aabb',   half: 1.0 },
  cone:     { shape: 'circle', radius: 1.0 },
  sphere:   { shape: 'circle', radius: 1.5 },
  cylinder: { shape: 'circle', radius: 1.0 },
};

const MIN_GAP           = 1.5;   // minimum clear gap between object edges (spec §14)
const PLAYER_SPAWN_DIST = 3.0;   // centre-to-centre distance to keep from spawn (spec §14)
const FLOOR_MARGIN      = 3.0;   // distance from floor edge (spec §14)
const FLOOR_HALF        = 50;
const SPAWN_LIMIT       = FLOOR_HALF - FLOOR_MARGIN;  // ±47 U
const MAX_ATTEMPTS      = 150;

// Tight scatter: physics resolves final positions, so objects can start close.
const SCATTER_LIMIT = 10;   // ±10 U XZ from origin
const MIN_XZ_DIST   = 1.0;  // only avoid exact same-spot starts to prevent impulse explosions

const PLAYER_SPAWN_XZ = { x: 0, z: 12 };  // XZ position where the player starts

// Per-session nonce: positions differ between page loads but are
// stable within a session (same index → same position on that load).
const SESSION_SEED = Math.floor(Math.random() * 0xFFFFFF);
const TYPE_SEEDS = { cube: 1, pyramid: 2, cone: 3, sphere: 4, cylinder: 5 };

function seededRand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Returns the actual-size XZ collider for an object already in the world.
function objectCollider(obj) {
  const spec = TYPE_COLLIDERS[obj.type];
  if (!spec) return null;
  if (spec.shape === 'circle') return new CircleCollider(obj.position.x, obj.position.z, spec.radius);
  return new AABBCollider(obj.position.x, obj.position.z, spec.half, spec.half);
}

// Returns a clearance collider for the candidate position — expanded by MIN_GAP
// so that a non-overlapping result guarantees at least MIN_GAP between edges.
function clearanceCollider(type, x, z) {
  const spec = TYPE_COLLIDERS[type];
  if (!spec) return null;
  if (spec.shape === 'circle') return new CircleCollider(x, z, spec.radius + MIN_GAP);
  return new AABBCollider(x, z, spec.half + MIN_GAP, spec.half + MIN_GAP);
}

export class ObjectSpawner {
  constructor(world, settings, physicsWorld = null) {
    this.world = world;
    this.settings = settings;
    this.physicsWorld = physicsWorld;
    this.reconcile();
  }

  reconcile() {
    const desired = Object.fromEntries(
      Object.keys(TYPE_FACTORIES).map(type => [
        type,
        this.settings.get(`objects.count.${type}`) ?? 1,
      ])
    );

    for (const type of Object.keys(TYPE_FACTORIES)) {
      const current = this.world.getByType(type).slice().sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
      const targetCount = Math.max(0, Number(desired[type]) || 0);
      const toRemove = [];

      for (let i = 0; i < current.length; i += 1) {
        if (i < targetCount) {
          if (typeof current[i].setIndex === 'function') current[i].setIndex(i);
        } else {
          toRemove.push(current[i]);
        }
      }

      for (const object of toRemove) {
        this.world.remove(object);
        // Remove matching physics body
        if (this.physicsWorld) {
          const body = this.physicsWorld.bodies.find(b => b.sceneObject === object);
          if (body) this.physicsWorld.remove(body);
        }
      }

      const remaining = this.world.getByType(type).length;
      for (let i = remaining; i < targetCount; i += 1) this.addObject(type, i);
    }
  }

  addObject(type, index) {
    const Factory = TYPE_FACTORIES[type];
    if (!Factory) return null;

    const position = index === 0
      ? { ...FIXED_POSITIONS[type] }
      : this._findFreePosition(type, index);

    const object = new Factory(index, position);
    this.world.add(object);

    // Create a physics body and link it to the scene object
    if (this.physicsWorld) {
      const body = new PhysicsBody({ objectType: type, position });
      body.sceneObject = object;
      body.active      = true; // slider-added objects start active (drop immediately)
      this.physicsWorld.add(body);
    }

    return object;
  }

  _findFreePosition(type, index) {
    // Physics resolves overlaps at runtime — we only need to avoid spawning
    // two objects at the exact same XZ point (which would cause impulse explosions).
    const baseSeed = (TYPE_SEEDS[type] * 99991 + index * 7919 + SESSION_SEED) & 0xFFFFFF;

    for (let attempt = 0; attempt < 20; attempt++) {
      const s = (baseSeed + attempt * 1031) & 0xFFFFFF;
      const x = (seededRand(s)     * 2 - 1) * SCATTER_LIMIT;
      const z = (seededRand(s + 1) * 2 - 1) * SCATTER_LIMIT;
      const tooClose = this.world.objects.some(
        obj => Math.hypot(x - obj.position.x, z - obj.position.z) < MIN_XZ_DIST
      );
      if (!tooClose) return { x, y: 0, z };
    }

    // Fallback: place anywhere in scatter area
    const s = baseSeed & 0xFFFFFF;
    return {
      x: (seededRand(s) * 2 - 1) * SCATTER_LIMIT,
      y: 0,
      z: (seededRand(s + 1) * 2 - 1) * SCATTER_LIMIT,
    };
  }
}


