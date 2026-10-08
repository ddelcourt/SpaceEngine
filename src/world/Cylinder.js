import { SceneObject } from './SceneObject.js';
import { MeshBuilder } from './MeshBuilder.js';

export class Cylinder extends SceneObject {
  constructor(index, position = { x: -5, y: 0, z: -30 }) {
    super({
      id: `cylinder-${index}`,
      type: 'cylinder',
      index,
      name: `Cylinder #${index}`,
      position,
      fill: '#f4a261',
      mesh: MeshBuilder.cylinder(),
      baseHeight: 2,
    });
  }
}
