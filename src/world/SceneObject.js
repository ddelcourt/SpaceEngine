export class SceneObject {
  constructor({
    id,
    type,
    index,
    name,
    position = { x: 0, y: 0, z: 0 },
    scale = 1,
    fill = '#ffffff',
    mesh = null,
    baseHeight = 1,
  }) {
    this.id = id ?? `${type}-${index}`;
    this.type = type;
    this.index = index;
    this.name = name ?? `${type.charAt(0).toUpperCase()}${type.slice(1)} #${index}`;
    this.position = {
      x: position.x ?? 0,
      y: position.y ?? 0,
      z: position.z ?? 0,
    };
    this.rotationY = 0;
    this.rotationX = 0;
    this.rotationZ = 0;
    this.scale = scale;
    this.fill = fill;
    this.mesh = mesh;
    this.baseHeight = baseHeight;
    this.state = 'IDLE';
    this.metadata = {};
  }

  draw(p) {
    if (!this.mesh) return;

    p.push();
    p.translate(this.position.x, this.position.y + this.baseHeight / 2, this.position.z);
    p.rotateY(this.rotationY);
    p.rotateX(this.rotationX);
    p.rotateZ(this.rotationZ);
    p.scale(this.scale);
    p.noStroke();

    if (this.state === 'SELECTED') {
      p.ambientMaterial(0, 255, 0);
      p.specularMaterial(100, 255, 100);
      p.shininess(80);
      p.emissiveMaterial(0, 120, 0);
    } else if (this.state === 'HOVER') {
      p.ambientMaterial(this.fill);
      p.specularMaterial(240, 240, 240);
      p.shininess(40);
      p.emissiveMaterial(60, 60, 60);
    } else {
      p.ambientMaterial(this.fill);
      p.specularMaterial(this.fill);
      p.shininess(18);
      p.emissiveMaterial(0, 0, 0);
    }

    this.mesh.render(p, this);
    p.pop();

    if (this.state === 'SELECTED' || this.state === 'HOVER') {
      this._drawRing(p);
    }
  }

  _drawRing(p) {
    const segments = 40;
    const baseRadius = Math.max(this.baseHeight * 0.65, 1.0);
    const thickness = 0.08;
    const y = this.position.y + 0.08;

    if (this.state === 'SELECTED') {
      // Ripple ring only — expands outward and fades, like a map-pin ping
      const phase = (p.millis() * 0.00025) % 1.0;
      const rippleR = baseRadius + phase * 1.8;
      const g = Math.round((1.0 - phase) * 255);
      p.push();
      p.translate(this.position.x, y, this.position.z);
      p.noStroke();
      p.ambientMaterial(0, g, 0);
      p.emissiveMaterial(0, g, 0);
      this._ringQuads(p, rippleR, 0.35 + phase * 0.2, segments);
      p.pop();
    } else {
      p.push();
      p.translate(this.position.x, y, this.position.z);
      p.noStroke();
      p.emissiveMaterial(180, 180, 180);
      this._ringQuads(p, baseRadius, thickness, segments);
      p.pop();
    }
  }

  _ringQuads(p, radius, thickness, segments) {
    p.beginShape(p.QUADS);
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      p.vertex(Math.cos(a1) * radius,               0, Math.sin(a1) * radius);
      p.vertex(Math.cos(a2) * radius,               0, Math.sin(a2) * radius);
      p.vertex(Math.cos(a2) * (radius + thickness), 0, Math.sin(a2) * (radius + thickness));
      p.vertex(Math.cos(a1) * (radius + thickness), 0, Math.sin(a1) * (radius + thickness));
    }
    p.endShape();
  }

  setIndex(index) {
    this.index = index;
    this.id = `${this.type}-${index}`;
    this.name = `${this.type.charAt(0).toUpperCase()}${this.type.slice(1)} #${index}`;
  }

  setPosition(x, z) {
    this.position.x = x;
    this.position.z = z;
  }
}
