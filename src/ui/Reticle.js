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

  // Position reticle at the centre of the scene canvas (pixels from viewport origin).
  setCenter(cx, cy) {
    if (!this.element) return;
    this.element.style.left = `${cx}px`;
    this.element.style.top = `${cy}px`;
    this.element.style.transform = 'translate(-50%, -50%)';
  }
}
