const DROP_HEIGHT  = 30;   // starting Y (above floor; +Y = up in this engine)
const SPAWN_DELAY  = 0.05; // seconds between successive drops

export class DropAnimator {
  constructor(physicsWorld) {
    this._physics = physicsWorld;
    this._queue   = [];  // PhysicsBodies waiting to be activated
    this._timer   = 0;
    this.active   = false;
  }

  // Call once in Engine.setup(). Positions all bodies above the floor and
  // queues them for staggered release.
  init(bodies) {
    this._queue = bodies.slice();
    this._timer = 0; // release first body on the very first update

    for (const body of this._queue) {
      body.active      = false;
      body.sleeping    = false;
      body.position.y  = DROP_HEIGHT;
      body.velocity.x  = 0;
      body.velocity.y  = 0;
      body.velocity.z  = 0;
      // Push the scene object into the sky immediately so the first frame
      // never shows it resting on the floor before physics takes over.
      if (body.sceneObject) body.sceneObject.position.y = DROP_HEIGHT;
    }

    this.active = this._queue.length > 0;
  }

  update(dt) {
    if (!this.active) return;

    this._timer -= dt;
    if (this._timer <= 0 && this._queue.length > 0) {
      this._timer = SPAWN_DELAY;
      const body = this._queue.shift();
      body.active = true;
    }

    if (this._queue.length === 0) this.active = false;
  }
}
