export class Reticle {
  constructor() {
    this.element = null;
  }

  mount() {
    if (this.element) return;
    const el = document.createElement('div');
    el.className = 'se-reticle';
    document.body.appendChild(el);
    this.element = el;
  }

  setHover(active) {
    if (!this.element) return;
    this.element.classList.toggle('se-reticle--hover', active);
  }
}
