const SECTIONS = [
  {
    title: 'View',
    fields: [
      { key: 'view.fov',              label: 'Field of View' },
      { key: 'view.near',             label: 'Near Clip' },
      { key: 'view.far',              label: 'Far Clip' },
      { key: 'view.gridFadeDistance', label: 'Grid Fade' },
    ],
  },
  {
    title: 'Movement',
    fields: [
      { key: 'movement.speed',           label: 'Speed' },
      { key: 'movement.lookSensitivity', label: 'Look Sensitivity' },
    ],
  },
  {
    title: 'Objects',
    fields: [
      { key: 'objects.count.cube',    label: 'Cubes' },
      { key: 'objects.count.pyramid', label: 'Pyramids' },
      { key: 'objects.count.cone',    label: 'Cones' },
      { key: 'objects.count.sphere',  label: 'Spheres' },
    ],
  },
  {
    title: 'Interaction',
    fields: [
      { key: 'interaction.hotspot', label: 'Selection Hotspot' },
    ],
  },
  {
    title: 'Debug',
    fields: [
      { key: 'debug.enabled', label: 'Show Debug' },
    ],
  },
];

export class ControlPane {
  constructor(p, settings) {
    this.p = p;
    this.settings = settings;
    this.element = null;
    this.hint = null;
    this.visible = true;
    this.valueEls = new Map();
  }

  mount() {
    if (this.element) return this.element;

    const pane = document.createElement('aside');
    pane.className = 'se-pane';

    const title = document.createElement('p');
    title.className = 'se-title';
    title.textContent = 'Space Engine';
    pane.appendChild(title);

    for (const section of SECTIONS) {
      const sectionEl = document.createElement('div');
      sectionEl.className = 'se-section';

      const heading = document.createElement('p');
      heading.className = 'se-section-title';
      heading.textContent = section.title;
      sectionEl.appendChild(heading);

      for (const field of section.fields) {
        sectionEl.appendChild(this.buildField(field));
      }

      pane.appendChild(sectionEl);
    }

    document.body.appendChild(pane);
    this.element = pane;

    this.mountHint();
    this.bindTabKey();

    return pane;
  }

  buildField({ key, label }) {
    const value = this.settings.get(key);
    const schema = this.settings.resolveSchema(key);
    const fieldEl = document.createElement('div');
    fieldEl.className = 'se-field';

    if (schema?.type === 'boolean') {
      const row = document.createElement('div');
      row.className = 'se-checkbox-row';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'se-checkbox';
      input.checked = Boolean(value);
      input.addEventListener('change', () => this.settings.set(key, input.checked));

      const labelEl = document.createElement('label');
      labelEl.className = 'se-label';
      labelEl.textContent = label;

      row.appendChild(input);
      row.appendChild(labelEl);
      fieldEl.appendChild(row);
    } else {
      const header = document.createElement('div');
      header.className = 'se-field-header';

      const labelEl = document.createElement('span');
      labelEl.className = 'se-label';
      labelEl.textContent = label;

      const valueEl = document.createElement('span');
      valueEl.className = 'se-value';
      valueEl.textContent = this.formatValue(value);
      this.valueEls.set(key, valueEl);

      header.appendChild(labelEl);
      header.appendChild(valueEl);
      fieldEl.appendChild(header);

      const input = document.createElement('input');
      input.type = 'range';
      input.className = 'se-slider';
      input.min = String(schema?.min ?? 0);
      input.max = String(schema?.max ?? 100);
      input.step = '0.1';
      input.value = String(value);
      this.updateFill(input);

      input.addEventListener('input', () => {
        const num = Number(input.value);
        this.settings.set(key, num);
        valueEl.textContent = this.formatValue(num);
        this.updateFill(input);
      });

      fieldEl.appendChild(input);
    }

    return fieldEl;
  }

  updateFill(input) {
    const min = Number(input.min);
    const max = Number(input.max);
    const val = Number(input.value);
    const pct = ((val - min) / (max - min)) * 100;
    input.style.setProperty('--fill', `${pct.toFixed(1)}%`);
  }

  formatValue(value) {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? String(value) : value.toFixed(1);
    }
    return String(value);
  }

  mountHint() {
    const hint = document.createElement('div');
    hint.className = 'se-hint';
    hint.textContent = 'Tab — toggle panel';
    document.body.appendChild(hint);
    this.hint = hint;
  }

  bindTabKey() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  toggle() {
    this.visible = !this.visible;
    this.element.classList.toggle('se-pane--hidden', !this.visible);
    this.hint.classList.toggle('se-hint--hidden', this.visible);
  }
}

