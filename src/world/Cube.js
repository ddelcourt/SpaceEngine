import { SceneObject } from './SceneObject.js';
import { MeshBuilder } from './MeshBuilder.js';

export class Cube extends SceneObject {
  constructor(index, position = { x: -5, y: 0, z: -10 }) {
    super({
      id: `cube-${index}`,
      type: 'cube',
      index,
      name: `Cube #${index}`,
      position,
      fill: '#ff6f61',
      mesh: MeshBuilder.cube(),
      baseHeight: 2,
    });
  }
}
