import { Collider } from './Collider.js';

export class CircleCollider extends Collider {
  constructor(x, z, radius) {
    super('circle');
    this.x = x;
    this.z = z;
    this.radius = radius;
  }

  intersects(other) {
    if (!other) return false;

    if (other.type === 'circle') {
      const dx = this.x - other.x;
      const dz = this.z - other.z;
      return dx * dx + dz * dz <= (this.radius + other.radius) ** 2;
    }

    const closestX = Math.max(other.minX, Math.min(this.x, other.maxX));
    const closestZ = Math.max(other.minZ, Math.min(this.z, other.maxZ));
    const dx = this.x - closestX;
    const dz = this.z - closestZ;
    return dx * dx + dz * dz <= this.radius * this.radius;
  }
}
