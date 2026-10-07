export class Floor {
  constructor(p, settings) {
    this.p = p;
    this.settings = settings;
  }

  draw(cameraRig) {
    const p = this.p;
    const fadeDistance = this.settings.get('view.gridFadeDistance');
    const eye = cameraRig.position;
    const halfSize = 50;
    const lineThickness = 0.05;

    p.push();
    p.noStroke();

    // Vertical lines (parallel to Z axis)
    for (let x = -halfSize; x <= halfSize; x += 1) {
      const alpha = this.getAlphaForDistance(Math.abs(eye.x - x), fadeDistance, 0.4, 1.0);
      p.fill(140, 140, 140, alpha);
      p.beginShape(p.QUADS);
      p.vertex(x - lineThickness / 2, 0, -halfSize);
      p.vertex(x + lineThickness / 2, 0, -halfSize);
      p.vertex(x + lineThickness / 2, 0, halfSize);
      p.vertex(x - lineThickness / 2, 0, halfSize);
      p.endShape();
    }

    // Horizontal lines (parallel to X axis)
    for (let z = -halfSize; z <= halfSize; z += 1) {
      const alpha = this.getAlphaForDistance(Math.abs(eye.z - z), fadeDistance, 0.4, 1.0);
      p.fill(140, 140, 140, alpha);
      p.beginShape(p.QUADS);
      p.vertex(-halfSize, 0, z - lineThickness / 2);
      p.vertex(-halfSize, 0, z + lineThickness / 2);
      p.vertex(halfSize, 0, z + lineThickness / 2);
      p.vertex(halfSize, 0, z - lineThickness / 2);
      p.endShape();
    }

    p.pop();
  }

  getAlphaForDistance(distance, maxDistance, visibleRatio, fadeRatio) {
    const startFade = maxDistance * visibleRatio;
    const endFade = maxDistance * fadeRatio;

    if (distance <= startFade) {
      return 120;
    }

    if (distance >= endFade) {
      return 0;
    }

    const t = (distance - startFade) / (endFade - startFade);
    return Math.round(120 * (1 - t));
  }
}
