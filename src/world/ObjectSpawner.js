import { Cube } from './Cube.js';
import { Pyramid } from './Pyramid.js';
import { Cone } from './Cone.js';
import { Sphere } from './Sphere.js';

const TYPE_FACTORIES = {
  cube: Cube,
  pyramid: Pyramid,
  cone: Cone,
  sphere: Sphere,
};

const TYPE_SEEDS = { cube: 1, pyramid: 2, cone: 3, sphere: 4 };
const SCATTER_RADIUS = 10;

function seededRand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function scatterPosition(type, index) {
  const s = TYPE_SEEDS[type] * 1000 + index;
  const angle = seededRand(s)      * Math.PI * 2;
  const radius = seededRand(s + 1) * SCATTER_RADIUS;
  return {
    x: Math.cos(angle) * radius,
    y: 0,
    z: Math.sin(angle) * radius - 8,
  };
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
    const object = new Factory(index, scatterPosition(type, index));
    this.world.add(object);
    return object;
  }
}

