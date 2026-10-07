export class InputManager {
  constructor(p, settings) {
    this.sources = [];
    this.p = p;
    this.settings = settings;
  }

  addSource(source) {
    this.sources.push(source);
  }

  getIntent() {
    const intent = {
      moveX: 0,
      moveZ: 0,
      lookDX: 0,
      lookDY: 0,
      select: false,
    };

    for (const source of this.sources) {
      const next = source.getIntent();
      intent.moveX += next.moveX;
      intent.moveZ += next.moveZ;
      intent.lookDX += next.lookDX;
      intent.lookDY += next.lookDY;
      intent.select = intent.select || next.select;
    }

    return intent;
  }
}
