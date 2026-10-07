import { CameraMath } from './CameraMath.js';

export class CameraRig {
  constructor(p, settings) {
    this.p = p;
    this.settings = settings;
    this.position = { x: 0, y: 1.8, z: 12 };
    this.yaw = 0;
    this.pitch = 0;
  }

  updateProjection() {
    const fovDeg = this.settings.get('view.fov');
    const fovRad = fovDeg * (Math.PI / 180);
    const aspect = this.p.width / this.p.height;
    const near = this.settings.get('view.near');
    const far = this.settings.get('view.far');
    this.p.perspective(fovRad, aspect, near, far);
  }

  update() {
    this.updateProjection();

    const forward = CameraMath.forward(this.yaw, this.pitch);
    const lookDistance = 20;
    const target = {
      x: this.position.x + forward.x * lookDistance,
      y: this.position.y + forward.y * lookDistance,
      z: this.position.z + forward.z * lookDistance,
    };

    this.p.camera(
      this.position.x,
      this.position.y,
      this.position.z,
      target.x,
      target.y,
      target.z,
      0,
      -1,
      0
    );
  }
}
