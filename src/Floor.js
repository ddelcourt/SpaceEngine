// Ground and grid colours kept together for easy tuning.
const GROUND_R = 10;
const GROUND_G = 10;
const GROUND_B = 12;

export class Floor {
  constructor(p, settings) {
    this.p = p;
    this.settings = settings;
  }

  draw(cameraRig) {
    const p   = this.p;
    const gl  = p.drawingContext;          // underlying WebGLRenderingContext
    const fadeDistance = this.settings.get('view.gridFadeDistance');
    const eye = cameraRig.position;
    const halfSize = 50;
    const lineThickness = 0.05;

    p.push();
    p.noStroke();

    // ── Ground fill ──────────────────────────────────────────────────────────
    // Drawn at exactly Y=0, same plane as the grid lines. Polygon offset pushes
    // its depth fractionally away from the camera so grid lines always win the
    // depth test regardless of viewing angle or distance — no manual Y nudge.
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 1);

    p.fill(GROUND_R, GROUND_G, GROUND_B);
    p.beginShape(p.QUADS);
    p.vertex(-halfSize, 0, -halfSize);
    p.vertex( halfSize, 0, -halfSize);
    p.vertex( halfSize, 0,  halfSize);
    p.vertex(-halfSize, 0,  halfSize);
    p.endShape();

    gl.disable(gl.POLYGON_OFFSET_FILL);

    // ── Grid lines ───────────────────────────────────────────────────────────
    // Drawn at Y=0, no offset — always in front of the polygon-offset fill.
    for (let x = -halfSize; x <= halfSize; x += 1) {
      const alpha = this._alpha(Math.abs(eye.x - x), fadeDistance);
      p.fill(140, 140, 140, alpha);
      p.beginShape(p.QUADS);
      p.vertex(x - lineThickness / 2, 0, -halfSize);
      p.vertex(x + lineThickness / 2, 0, -halfSize);
      p.vertex(x + lineThickness / 2, 0,  halfSize);
      p.vertex(x - lineThickness / 2, 0,  halfSize);
      p.endShape();
    }

    for (let z = -halfSize; z <= halfSize; z += 1) {
      const alpha = this._alpha(Math.abs(eye.z - z), fadeDistance);
      p.fill(140, 140, 140, alpha);
      p.beginShape(p.QUADS);
      p.vertex(-halfSize, 0, z - lineThickness / 2);
      p.vertex(-halfSize, 0, z + lineThickness / 2);
      p.vertex( halfSize, 0, z + lineThickness / 2);
      p.vertex( halfSize, 0, z - lineThickness / 2);
      p.endShape();
    }

    p.pop();
  }

  _alpha(distance, maxDistance) {
    const startFade = maxDistance * 0.4;
    const endFade   = maxDistance * 1.0;
    if (distance <= startFade) return 120;
    if (distance >= endFade)   return 0;
    return Math.round(120 * (1 - (distance - startFade) / (endFade - startFade)));
  }
}



