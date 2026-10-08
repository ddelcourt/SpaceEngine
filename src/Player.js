import { CameraMath } from './CameraMath.js';
import { CollisionSystem } from './physics/CollisionSystem.js';

export class Player {
  constructor(settings, cameraRig, world = null, collisionSystem = null, physicsWorld = null) {
    this.settings = settings;
    this.cameraRig = cameraRig;
    this.world = world;
    this.collisionSystem = collisionSystem ?? new CollisionSystem();
    this.physicsWorld = physicsWorld;
    this.position = { x: 0, y: 1.8, z: 12 };
    this.radius = 0.5;
    this.yaw = 0;
    this.pitch = 0;
    this.velocity = { x: 0, z: 0 };
    this._lastDt = 0.016;
  }

  update(intent, dt) {
    this._lastDt = dt;
    const lookSensitivity = this.settings.get('movement.lookSensitivity') || 1;
    this.yaw -= intent.lookDX * 0.002 * lookSensitivity;
    this.pitch += intent.lookDY * 0.002 * lookSensitivity;
    this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch));

    const forward = CameraMath.horizontalForward(this.yaw);
    const right = CameraMath.right(this.yaw);
    const moveX = intent.moveX;
    const moveZ = intent.moveZ;

    let dx = -right.x * moveX + forward.x * moveZ;
    let dz = -right.z * moveX + forward.z * moveZ;

    const magnitude = Math.hypot(dx, dz) || 1;
    if (magnitude > 0) {
      dx /= magnitude;
      dz /= magnitude;
    }

    const speed = this.settings.get('movement.speed');
    const stepX = dx * speed * dt;
    const stepZ = dz * speed * dt;

    const maxStepDistance = this.radius / 2;
    const stepCount = Math.max(1, Math.ceil(Math.max(Math.abs(stepX), Math.abs(stepZ)) / maxStepDistance));

    for (let index = 0; index < stepCount; index += 1) {
      const subStepX = stepX / stepCount;
      const subStepZ = stepZ / stepCount;
      const nextPosition = this.collisionSystem.resolve(
        this,
        this.position.x + subStepX,
        this.position.z + subStepZ,
        this.world,
        this.physicsWorld,
      );

      this.position.x = nextPosition.x;
      this.position.z = nextPosition.z;
    }

    this.cameraRig.position.x = this.position.x;
    this.cameraRig.position.z = this.position.z;
    this.cameraRig.position.y = this.position.y;
    this.cameraRig.yaw = this.yaw;
    this.cameraRig.pitch = this.pitch;
  }
}
