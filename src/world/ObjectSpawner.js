import { Cube } from './Cube.js';
import { Pyramid } from './Pyramid.js';
import { Cone } from './Cone.js';
import { Sphere } from './Sphere.js';
import { CircleCollider } from '../physics/CircleCollider.js';
import { AABBCollider } from '../physics/AABBCollider.js';

const TYPE_FACTORIES = {
  cube: Cube,
  pyramid: Pyramid,
  cone: Cone,
  sphere: Sphere,
};

// First instance of each type always uses its canonical scene position (spec §6).
const FIXED_POSITIONS = {
  cube:    { x: -5, y: 0, z: -10 },
  pyramid: { x:  5, y: 0, z: -10 },
  cone:    { x: -5, y: 0, z: -20 },
  sphere:  { x:  5, y: 0, z: -20 },
};

// Exact XZ collider specs per type (spec §6).
const TYPE_COLLIDERS = {
  cube:    { shape: 'aabb',   half: 1.0 },
  pyramid: { shape: 'aabb',   half: 1.0 },
  cone:    { shape: 'circle', radius: 1.0 },
  sphere:  { shape: 'circle', radius: 1.5 },
};

const MIN_GAP           = 1.5;   // minimum clear gap between object edges (spec §14)
const PLAYER_SPAWN_DIST = 3.0;   // centre-to-centre distance to keep from spawn (spec §14)
const FLOOR_MARGIN      = 3.0;   // distance from floor edge (spec §14)
const FLOOR_HALF        = 50;
const SPAWN_LIMIT       = FLOOR_HALF - FLOOR_MARGIN;  // ±47 U
const MAX_ATTEMPTS      = 150;

const PLAYER_SPAWN_XZ = { x: 0, z: 12 };  // XZ position where the player starts

// Per-session nonce: positions differ between page loads but are
// stable within a session (same index → same position on that load).
const SESSION_SEED = Math.floor(Math.random() * 0xFFFFFF);
const TYPE_SEEDS   = { cube: 1, pyramid: 2, cone: 3, sphere: 4 };

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
  constructor(world, settings) {
    this.world = world;
    this.settings = settings;
    this.reconcile();
  }

  reconcile() {
    const desired = {
      cube:    this.settings.get('objects.count.cube')    ?? 1,
      pyramid: this.settings.get('objects.count.pyramid') ?? 1,
      cone:    this.settings.get('objects.count.cone')    ?? 1,
      sphere:  this.settings.get('objects.count.sphere')  ?? 1,
    };

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

      for (const object of toRemove) this.world.remove(object);

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
    return object;
  }

  _findFreePosition(type, index) {
    const baseSeed = (TYPE_SEEDS[type] * 99991 + index * 7919 + SESSION_SEED) & 0xFFFFFF;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const s = (baseSeed + attempt * 1031) & 0xFFFFFF;
      const x = (seededRand(s)     * 2 - 1) * SPAWN_LIMIT;
      const z = (seededRand(s + 1) * 2 - 1) * SPAWN_LIMIT;
      if (this._isFree(type, x, z)) return { x, y: 0, z };
    }

    // All attempts exhausted — fall back to last candidate regardless.
    const s = baseSeed & 0xFFFFFF;
    return { x: (seededRand(s) * 2 - 1) * SPAWN_LIMIT, y: 0, z: (seededRand(s + 1) * 2 - 1) * SPAWN_LIMIT };
  }

  _isFree(type, x, z) {
    // Keep away from player spawn point.
    if (Math.hypot(x - PLAYER_SPAWN_XZ.x, z - PLAYER_SPAWN_XZ.z) < PLAYER_SPAWN_DIST) return false;

    // Check clearance against every object already in the world.
    const candidate = clearanceCollider(type, x, z);
    if (!candidate) return true;

    for (const obj of this.world.objects) {
      const existing = objectCollider(obj);
      if (existing && candidate.intersects(existing)) return false;
    }

    return true;
  }
}


