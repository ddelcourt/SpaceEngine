export class InfoPanel {
  constructor() {
    this.element = null;
    this.fields = {};
    this.visible = false;
  }

  mount() {
    if (this.element) return;

    const panel = document.createElement('aside');
    panel.className = 'se-info-panel se-info-panel--hidden';

    const label = document.createElement('p');
    label.className = 'se-info-label';
    label.textContent = 'Selected';
    panel.appendChild(label);

    const name = document.createElement('p');
    name.className = 'se-info-name';
    panel.appendChild(name);

    const table = document.createElement('div');
    table.className = 'se-info-table';

    const rows = [
      { key: 'type',     label: 'Type' },
      { key: 'pos',      label: 'Position' },
    ];

    for (const { key, label: rowLabel } of rows) {
      const row = document.createElement('div');
      row.className = 'se-info-row';

      const k = document.createElement('span');
      k.className = 'se-info-key';
      k.textContent = rowLabel;

      const v = document.createElement('span');
      v.className = 'se-info-val';

      row.appendChild(k);
      row.appendChild(v);
      table.appendChild(row);
      this.fields[key] = v;
    }

    panel.appendChild(table);
    document.body.appendChild(panel);

    this.element = panel;
    this.nameEl = name;
  }

  update(object, mode = 'selected') {
    if (!this.element) return;

    if (!object) {
      this._hide();
      return;
    }

    this.nameEl.textContent = object.name;
    this.fields.type.textContent = object.type.charAt(0).toUpperCase() + object.type.slice(1);
    this.fields.pos.textContent =
      `${object.position.x.toFixed(1)}, ${object.position.y.toFixed(1)}, ${object.position.z.toFixed(1)}`;

    this.element.classList.toggle('se-info-panel--hover', mode === 'hover');
    this._show();
  }

  _show() {
    if (this.visible) return;
    this.visible = true;
    this.element.classList.remove('se-info-panel--hidden');
  }

  _hide() {
    if (!this.visible) return;
    this.visible = false;
    this.element.classList.add('se-info-panel--hidden');
  }
}
