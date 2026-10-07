export class SelectionManager {
  constructor() {
    this.state = 'IDLE';
    this.hoverTarget = null;
    this.selectedTarget = null;
    this.onSelectionChange = null;
  }

  setHover(object) {
    if (this.hoverTarget && this.hoverTarget !== this.selectedTarget) {
      this.hoverTarget.state = 'IDLE';
    }
    this.hoverTarget = object;
    if (object && object !== this.selectedTarget) {
      object.state = 'HOVER';
    }
    if (!this.selectedTarget) {
      this.state = object ? 'HOVER' : 'IDLE';
    }
  }

  select(object) {
    const prev = this.selectedTarget;

    if (prev) {
      prev.state = this.hoverTarget === prev ? 'HOVER' : 'IDLE';
    }

    if (!object || object === prev) {
      this.selectedTarget = null;
      this.state = this.hoverTarget ? 'HOVER' : 'IDLE';
      this._notify(null);
      return;
    }

    this.selectedTarget = object;
    object.state = 'SELECTED';
    this.state = 'SELECTED';
    this._notify(object);
  }

  updateFromRaycast(hit) {
    const object = hit?.object ?? null;
    this.setHover(object);
  }

  _notify(object) {
    if (typeof this.onSelectionChange === 'function') {
      this.onSelectionChange(object);
    }
  }
}
