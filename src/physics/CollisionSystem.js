import { CircleCollider } from './CircleCollider.js';
import { AABBCollider } from './AABBCollider.js';

// Impulse applied to a physics body when the player walks into it.
// Proportional to player speed; the player is treated as infinitely massive.
const PUSH_BASE      = 4;    // U/s baseline impulse even at low speed
const PUSH_SPEED_MUL = 1.2;  // speed multiplier on top of baseline
// Detection margin beyond the physics body radius so the push triggers
// before the player visually overlaps the object.
const PUSH_MARGIN    = 1.0;

export class CollisionSystem {
  resolve(player, targetX, targetZ, world, physicsWorld) {
    const radius = player.radius;
    const minBounds = -49.5 + radius;
    const maxBounds =  49.5 - radius;

    let nextX = Math.min(maxBounds, Math.max(minBounds, targetX));
    let nextZ = Math.min(maxBounds, Math.max(minBounds, targetZ));

    const speed = Math.hypot(
      targetX - player.position.x,
      targetZ - player.position.z,
    ) / (player._lastDt ?? 0.016);

    if (physicsWorld) {
      // Push mode: player has infinite mass — objects yield, player never blocks.
      // Impulses are applied inside _collide; boundary clamping above still holds.
      this._collide(nextX, player.position.z, radius, world, physicsWorld, speed);
      this._collide(nextX, nextZ,             radius, world, physicsWorld, speed);
      return { x: nextX, z: nextZ };
    }

    // No physics world: classic sliding collision.
    if (world && this._collide(nextX, player.position.z, radius, world, null, 0)) {
      nextX = Math.min(maxBounds, Math.max(minBounds, player.position.x));
    }
    if (world && this._collide(nextX, nextZ, radius, world, null, 0)) {
      nextZ = Math.min(maxBounds, Math.max(minBounds, player.position.z));
    }

    return { x: nextX, z: nextZ };
  }

  // Returns true if there is an obstacle at (x, z).
  // When physicsWorld is provided, uses a sphere test against the physics
  // body radius + PUSH_MARGIN so the push triggers before visual overlap.
  _collide(x, z, radius, world, physicsWorld, playerSpeed) {
    if (!world?.objects) return false;

    let hit = false;

    if (physicsWorld) {
      // Physics push path: XZ sphere test against each body's actual radius.
      for (const body of physicsWorld.bodies) {
        if (!body.sceneObject || body.isStatic) continue;
        const dx   = body.position.x - x;
        const dz   = body.position.z - z;
        const dist = Math.hypot(dx, dz);
        const threshold = body.radius + radius + PUSH_MARGIN;
        if (dist >= threshold) continue;

        hit = true;
        const len     = dist || 1;
        const impulse = PUSH_BASE + playerSpeed * PUSH_SPEED_MUL;
        body.velocity.x  += (dx / len) * impulse;
        body.velocity.z  += (dz / len) * impulse;
        body.sleeping     = false;
        body._sleepCount  = 0;
      }
      return hit;
    }

    // Classic AABB path (no physics world).
    const playerCollider = new CircleCollider(x, z, radius);
    for (const object of world.objects) {
      const halfExtent = Math.max(1.1, object.baseHeight * 0.6);
      const objectCollider = new AABBCollider(
        object.position.x, object.position.z, halfExtent, halfExtent,
      );
      if (playerCollider.intersects(objectCollider)) hit = true;
    }
    return hit;
  }

  // Legacy alias used by any callers that pass no physicsWorld.
  hasObstacleCollision(x, z, radius, world) {
    return this._collide(x, z, radius, world, null, 0);
  }
}
