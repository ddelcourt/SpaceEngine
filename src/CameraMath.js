export class CameraMath {
  static forward(yaw, pitch) {
    const cosPitch = Math.cos(pitch);
    return {
      x: Math.sin(yaw) * cosPitch,
      y: -Math.sin(pitch),
      z: -Math.cos(yaw) * cosPitch,
    };
  }

  static horizontalForward(yaw) {
    return {
      x: Math.sin(yaw),
      y: 0,
      z: -Math.cos(yaw),
    };
  }

  static right(yaw) {
    return {
      x: Math.cos(yaw),
      y: 0,
      z: Math.sin(yaw),
    };
  }

  static normalize(x, y, z) {
    const length = Math.hypot(x, y, z) || 1;
    return {
      x: x / length,
      y: y / length,
      z: z / length,
    };
  }
}
