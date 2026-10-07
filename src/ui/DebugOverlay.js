export class DebugOverlay {
  constructor(clock, player, selectionManager) {
    this.clock = clock;
    this.player = player;
    this.selectionManager = selectionManager;
    this.element = null;
    this.fields = {};
  }

  mount() {
    if (this.element) return;

    const el = document.createElement('aside');
    el.className = 'se-debug se-debug--hidden';

    const title = document.createElement('p');
    title.className = 'se-debug-title';
    title.textContent = 'Debug';
    el.appendChild(title);

    const rows = [
      { key: 'fps',      label: 'FPS' },
      { key: 'frame',    label: 'Frame' },
      { key: 'dt',       label: 'dt' },
      null, // divider
      { key: 'pos',      label: 'Position' },
      { key: 'yaw',      label: 'Yaw' },
      { key: 'pitch',    label: 'Pitch' },
      null,
      { key: 'hover',    label: 'Hover' },
      { key: 'selected', label: 'Selected' },
    ];

    for (const row of rows) {
      if (row === null) {
        const sep = document.createElement('div');
        sep.className = 'se-debug-sep';
        el.appendChild(sep);
        continue;
      }

      const line = document.createElement('div');
      line.className = 'se-debug-row';

      const k = document.createElement('span');
      k.className = 'se-debug-key';
      k.textContent = row.label;

      const v = document.createElement('span');
      v.className = 'se-debug-val';
      v.textContent = '—';

      line.appendChild(k);
      line.appendChild(v);
      el.appendChild(line);
      this.fields[row.key] = v;
    }

    document.body.appendChild(el);
    this.element = el;
  }

  setVisible(visible) {
    if (!this.element) return;
    this.element.classList.toggle('se-debug--hidden', !visible);
  }

  update() {
    if (!this.element || this.element.classList.contains('se-debug--hidden')) return;

    const fps = this.clock.getFps();
    const dt = this.clock.getDt();

    this.fields.fps.textContent   = fps.toFixed(1);
    this.fields.frame.textContent = `${(dt * 1000).toFixed(1)} ms`;
    this.fields.dt.textContent    = dt.toFixed(4);

    const { x, y, z } = this.player.position;
    this.fields.pos.textContent   = `${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`;
    this.fields.yaw.textContent   = `${(this.player.yaw   * 180 / Math.PI).toFixed(1)}°`;
    this.fields.pitch.textContent = `${(this.player.pitch * 180 / Math.PI).toFixed(1)}°`;

    this.fields.hover.textContent    = this.selectionManager.hoverTarget?.id    ?? '—';
    this.fields.selected.textContent = this.selectionManager.selectedTarget?.id ?? '—';
  }
}
