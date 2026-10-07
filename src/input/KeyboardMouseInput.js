export class KeyboardMouseInput {
  constructor(p, settings) {
    this.p = p;
    this.settings = settings;
    this.mouseLookX = 0;
    this.mouseLookY = 0;
    this.shouldSelect = false;
    this.pointerLocked = false;
    this.keys = new Set();
    this.bound = false;
  }

  attach() {
    if (!this.p.canvas || this.bound) return;

    const canvas = this.p.canvas;

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Escape') {
        if (document.pointerLockElement === canvas) {
          document.exitPointerLock();
        }
        return;
      }

      if (event.code === 'Enter') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
        return;
      }

      this.keys.add(event.code);
      if (event.code === 'KeyE') {
        this.shouldSelect = true;
      }
    });

    document.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });

    document.addEventListener('mousemove', (event) => {
      if (document.pointerLockElement === canvas) {
        this.mouseLookX += event.movementX;
        this.mouseLookY += event.movementY;
      }
    });

    canvas.addEventListener('click', () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      } else {
        this.shouldSelect = true;
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === canvas;
    });

    this.bound = true;
  }

  getIntent() {
    let moveX = 0;
    let moveZ = 0;

    if (this.keys.has('KeyW')) moveZ += 1;
    if (this.keys.has('KeyS')) moveZ -= 1;
    if (this.keys.has('KeyA')) moveX -= 1;
    if (this.keys.has('KeyD')) moveX += 1;

    const lookDX = this.mouseLookX;
    const lookDY = this.mouseLookY;
    const select = this.shouldSelect;

    this.mouseLookX = 0;
    this.mouseLookY = 0;
    this.shouldSelect = false;

    return {
      moveX,
      moveZ,
      lookDX,
      lookDY,
      select,
    };
  }
}
