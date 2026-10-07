import { Collider } from './Collider.js';

export class AABBCollider extends Collider {
  constructor(centerX, centerZ, halfWidth, halfDepth) {
    super('aabb');
    this.centerX = centerX;
    this.centerZ = centerZ;
    this.halfWidth = halfWidth;
    this.halfDepth = halfDepth;
    this.minX = centerX - halfWidth;
    this.maxX = centerX + halfWidth;
    this.minZ = centerZ - halfDepth;
    this.maxZ = centerZ + halfDepth;
  }

  intersects(other) {
    if (!other) return false;

    if (other.type === 'aabb') {
      return !(
        this.maxX < other.minX ||
        this.minX > other.maxX ||
        this.maxZ < other.minZ ||
        this.minZ > other.maxZ
      );
    }

    const closestX = Math.max(this.minX, Math.min(other.x, this.maxX));
    const closestZ = Math.max(this.minZ, Math.min(other.z, this.maxZ));
    const dx = other.x - closestX;
    const dz = other.z - closestZ;
    return dx * dx + dz * dz <= other.radius * other.radius;
  }
}
