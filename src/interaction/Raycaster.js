import { CameraMath } from '../CameraMath.js';

export class Raycaster {
  constructor(cameraRig, world, settings) {
    this.cameraRig = cameraRig;
    this.world = world;
    this.settings = settings;
  }

  update() {
    const origin = {
      x: this.cameraRig.position.x,
      y: this.cameraRig.position.y,
      z: this.cameraRig.position.z,
    };
    const dir = CameraMath.forward(this.cameraRig.yaw, this.cameraRig.pitch);
    const maxDist = 30.0;
    const hotspot = this.settings.get('interaction.hotspot') ?? 1.0;

    let nearest = null;
    for (const object of this.world.objects) {
      const hit = this._raycastObject(origin, dir, object, maxDist, hotspot);
      if (hit && (!nearest || hit.distance < nearest.distance)) {
        nearest = { ...hit, object };
      }
    }

    return nearest;
  }

  _raycastObject(origin, dir, object, maxDist, hotspot = 1.0) {
    const dx = object.position.x - origin.x;
    const dy = object.position.y + object.baseHeight / 2 - origin.y;
    const dz = object.position.z - origin.z;
    const radius = (1.75 + object.baseHeight * 0.5) * hotspot;

    const b = 2 * (
      dir.x * dx +
      dir.y * dy +
      dir.z * dz
    );
    const c = dx * dx + dy * dy + dz * dz - radius * radius;
    const discriminant = b * b - 4 * c;

    if (discriminant < 0) return null;

    const sqrtD = Math.sqrt(discriminant);
    const t1 = (b - sqrtD) / 2;
    const t2 = (b + sqrtD) / 2;
    const hitT = t1 > 0 ? t1 : t2 > 0 ? t2 : -1;
    const distance = hitT;

    if (distance <= 0 || distance > maxDist) return null;

    const point = {
      x: origin.x + dir.x * distance,
      y: origin.y + dir.y * distance,
      z: origin.z + dir.z * distance,
    };

    return { distance, point };
  }
}
