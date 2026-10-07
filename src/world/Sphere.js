import { SceneObject } from './SceneObject.js';
import { MeshBuilder } from './MeshBuilder.js';

export class Sphere extends SceneObject {
  constructor(index, position = { x: 5, y: 0, z: -20 }) {
    super({
      id: `sphere-${index}`,
      type: 'sphere',
      index,
      name: `Sphere #${index}`,
      position,
      fill: '#9b5de5',
      mesh: MeshBuilder.sphere(),
      baseHeight: 3,
    });
  }
}
