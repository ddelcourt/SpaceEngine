// Dark midnight-blue sky background colour.
const SKY_R = 14, SKY_G = 18, SKY_B = 35;

// Stars are placed on a sphere of this radius around the camera each frame,
// so they appear infinitely distant regardless of player position.
const STAR_RADIUS = 200;

// Three brightness layers: [count, strokeWeight, r, g, b]
const LAYERS = [
  { count: 620, weight: 1.5, r: 155, g: 155, b: 195 }, // dim, cool-white
  { count: 150, weight: 2.5, r: 210, g: 210, b: 240 }, // medium
  { count:  30, weight: 4.0, r: 245, g: 245, b: 255 }, // bright
];

function pointsOnSphere(count, radius) {
  const flat = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const sinPhi = Math.sin(phi);
    flat[i * 3]     = radius * sinPhi * Math.cos(theta);
    flat[i * 3 + 1] = radius * Math.cos(phi);
    flat[i * 3 + 2] = radius * sinPhi * Math.sin(theta);
  }
  return flat;
}

export class Sky {
  constructor() {
    this._layers = LAYERS.map(({ count, weight, r, g, b }) => ({
      weight, r, g, b,
      pts: pointsOnSphere(count, STAR_RADIUS),
    }));
  }

  draw(p) {
    p.background(SKY_R, SKY_G, SKY_B);
  }

  drawStars(p, cameraPos) {
    p.push();
    p.translate(cameraPos.x, cameraPos.y, cameraPos.z);
    p.noFill();
    for (const { weight, r, g, b, pts } of this._layers) {
      p.strokeWeight(weight);
      p.stroke(r, g, b);
      p.beginShape(p.POINTS);
      for (let i = 0; i < pts.length; i += 3) {
        p.vertex(pts[i], pts[i + 1], pts[i + 2]);
      }
      p.endShape();
    }
    p.pop();
  }
}
