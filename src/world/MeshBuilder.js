export class MeshBuilder {
  static cube() {
    return {
      render: (p) => {
        p.box(2, 2, 2);
      },
    };
  }

  static pyramid() {
    const s = 1 / Math.sqrt(5);  // 1/√5 for normalized face normals
    return {
      render: (p) => {
        p.beginShape(p.TRIANGLES);

        // Front face (-Z side): outward normal points -Z, +Y
        p.normal(0, 2 * s, -4 * s);
        p.vertex(-1, -1, -1);
        p.normal(0, 2 * s, -4 * s);
        p.vertex(1, -1, -1);
        p.normal(0, 2 * s, -4 * s);
        p.vertex(0, 1, 0);

        // Right face (+X side): outward normal points +X, +Y
        p.normal(4 * s, 2 * s, 0);
        p.vertex(1, -1, -1);
        p.normal(4 * s, 2 * s, 0);
        p.vertex(1, -1, 1);
        p.normal(4 * s, 2 * s, 0);
        p.vertex(0, 1, 0);

        // Back face (+Z side): outward normal points +Z, +Y
        p.normal(0, 2 * s, 4 * s);
        p.vertex(1, -1, 1);
        p.normal(0, 2 * s, 4 * s);
        p.vertex(-1, -1, 1);
        p.normal(0, 2 * s, 4 * s);
        p.vertex(0, 1, 0);

        // Left face (-X side): outward normal points -X, +Y
        p.normal(-4 * s, 2 * s, 0);
        p.vertex(-1, -1, 1);
        p.normal(-4 * s, 2 * s, 0);
        p.vertex(-1, -1, -1);
        p.normal(-4 * s, 2 * s, 0);
        p.vertex(0, 1, 0);

        // Base (facing -Y)
        p.normal(0, -1, 0);
        p.vertex(-1, -1, -1);
        p.normal(0, -1, 0);
        p.vertex(-1, -1, 1);
        p.normal(0, -1, 0);
        p.vertex(1, -1, 1);

        p.normal(0, -1, 0);
        p.vertex(-1, -1, -1);
        p.normal(0, -1, 0);
        p.vertex(1, -1, 1);
        p.normal(0, -1, 0);
        p.vertex(1, -1, -1);

        p.endShape();
      },
    };
  }

  static cone() {
    return {
      render: (p) => {
        p.cone(1, 3, 20, 1, true);
      },
    };
  }

  static sphere() {
    return {
      render: (p) => {
        p.sphere(1.5, 20, 20);
      },
    };
  }

  static cylinder() {
    return {
      render: (p) => {
        p.cylinder(1, 2, 20, 1, true, true);
      },
    };
  }
}
