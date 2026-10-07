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
    const radius = Math.max(this.baseHeight * 0.65, 1.0);
    const thickness = 0.08;
    const y = this.position.y + 0.08;

    p.push();
    p.translate(this.position.x, y, this.position.z);
    p.noStroke();
    if (this.state === 'SELECTED') {
      p.emissiveMaterial(0, 255, 80);
    } else {
      p.emissiveMaterial(180, 180, 180);
    }

    p.beginShape(p.QUADS);
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      p.vertex(Math.cos(a1) * radius,           0, Math.sin(a1) * radius);
      p.vertex(Math.cos(a2) * radius,           0, Math.sin(a2) * radius);
      p.vertex(Math.cos(a2) * (radius + thickness), 0, Math.sin(a2) * (radius + thickness));
      p.vertex(Math.cos(a1) * (radius + thickness), 0, Math.sin(a1) * (radius + thickness));
    }
    p.endShape();
    p.pop();
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
