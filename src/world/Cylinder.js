import { SceneObject } from './SceneObject.js';
import { MeshBuilder } from './MeshBuilder.js';

export class Cylinder extends SceneObject {
  constructor(index, position = { x: 0, y: 0, z: -30 }) {
    super({
      id: `cylinder-${index}`,
      type: 'cylinder',
      index,
      name: `Cylinder #${index}`,
      position,
      fill: '#2ec4b6',
      mesh: MeshBuilder.cylinder(),
      baseHeight: 2,
    });
  }
}
