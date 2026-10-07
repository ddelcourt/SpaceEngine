import { CircleCollider } from './CircleCollider.js';
import { AABBCollider } from './AABBCollider.js';

export class CollisionSystem {
  resolve(player, targetX, targetZ, world) {
    const radius = player.radius;
    const minBounds = -49.5 + radius;
    const maxBounds = 49.5 - radius;

    let nextX = Math.min(maxBounds, Math.max(minBounds, targetX));
    let nextZ = Math.min(maxBounds, Math.max(minBounds, targetZ));

    if (world && this.hasObstacleCollision(nextX, player.position.z, radius, world)) {
      nextX = Math.min(maxBounds, Math.max(minBounds, player.position.x));
    }

    if (world && this.hasObstacleCollision(nextX, nextZ, radius, world)) {
      nextZ = Math.min(maxBounds, Math.max(minBounds, player.position.z));
    }

    return { x: nextX, z: nextZ };
  }

  hasObstacleCollision(x, z, radius, world) {
    if (!world || !world.objects) {
      return false;
    }

    const playerCollider = new CircleCollider(x, z, radius);

    for (const object of world.objects) {
      const halfExtent = Math.max(1.1, object.baseHeight * 0.6);
      const objectCollider = new AABBCollider(
        object.position.x,
        object.position.z,
        halfExtent,
        halfExtent
      );

      if (playerCollider.intersects(objectCollider)) {
        return true;
      }
    }

    return false;
  }
}
