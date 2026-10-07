import { SceneObject } from './SceneObject.js';
import { MeshBuilder } from './MeshBuilder.js';

export class Pyramid extends SceneObject {
  constructor(index, position = { x: 5, y: 0, z: -10 }) {
    super({
      id: `pyramid-${index}`,
      type: 'pyramid',
      index,
      name: `Pyramid #${index}`,
      position,
      fill: '#d4a017',
      mesh: MeshBuilder.pyramid(),
      baseHeight: 2,
    });
  }
}
