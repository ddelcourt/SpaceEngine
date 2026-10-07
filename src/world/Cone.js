import { SceneObject } from './SceneObject.js';
import { MeshBuilder } from './MeshBuilder.js';

export class Cone extends SceneObject {
  constructor(index, position = { x: -5, y: 0, z: -20 }) {
    super({
      id: `cone-${index}`,
      type: 'cone',
      index,
      name: `Cone #${index}`,
      position,
      fill: '#4ea8de',
      mesh: MeshBuilder.cone(),
      baseHeight: 3,
    });
  }
}
