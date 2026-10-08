// Player radius is 0.5U; near must be ≤ radius/10 to avoid clipping.
const NEAR_SAFE_MAX = 0.5 / 10; // 0.05

const SECTIONS = [
  {
    key: 'view',
    title: 'View',
    fields: [
      { key: 'view.aspectRatio',      label: 'Aspect Ratio' },
      { key: 'view.fov',              label: 'Field of View' },
      { key: 'view.near',             label: 'Near Clip' },
      { key: 'view.far',              label: 'Far Clip' },
      { key: 'view.gridFadeDistance', label: 'Grid Fade' },
    ],
  },
  {
    key: 'movement',
    title: 'Movement',
    fields: [
      { key: 'movement.speed',           label: 'Speed' },
      { key: 'movement.lookSensitivity', label: 'Look Sensitivity' },
    ],
  },
  {
    key: 'objects',
    title: 'Objects',
    fields: [
      { key: 'objects.count.cube',     label: 'Cubes' },
      { key: 'objects.count.pyramid',  label: 'Pyramids' },
      { key: 'objects.count.cone',     label: 'Cones' },
      { key: 'objects.count.sphere',   label: 'Spheres' },
      { key: 'objects.count.cylinder', label: 'Cylinders' },
    ],
  },
  {
    key: 'interaction',
    title: 'Interaction',
    fields: [
      { key: 'interaction.hotspot', label: 'Selection Hotspot' },
    ],
  },
  {
    key: 'debug',
    title: 'Debug',
    fields: [
      { key: 'debug.enabled', label: 'Show Debug' },
    ],
  },
];

export class ControlPane {
  constructor(p, settings, settingsStore) {
    this.p = p;
    this.settings = settings;
    this.settingsStore = settingsStore;
    this.element = null;
    this.hint = null;
    this.nearWarningEl = null;
    this.inputEls = new Map();  // key → input/select/checkbox element
    this.valueEls = new Map();  // key → value display span (sliders only)
  }

  mount() {
    if (this.element) return this.element;

    const pane = document.createElement('aside');
    pane.className = 'se-pane';
    if (!this.settings.get('ui.paneOpen')) pane.classList.add('se-pane--hidden');

    // Storage unavailability notice (shown once, non-blocking)
    if (!this.settingsStore.isAvailable) {
      const notice = document.createElement('p');
      notice.className = 'se-storage-notice';
      notice.textContent = "Settings can't be saved in this browser.";
      pane.appendChild(notice);
    }

    const title = document.createElement('p');
    title.className = 'se-title';
    title.textContent = 'Space Engine';
    pane.appendChild(title);

    for (const section of SECTIONS) {
      pane.appendChild(this._buildSection(section));
    }

    const resetBtn = document.createElement('button');
    resetBtn.className = 'se-reset-btn';
    resetBtn.textContent = 'Reset to Defaults';
    resetBtn.addEventListener('click', () => this.settings.reset());
    pane.appendChild(resetBtn);

    document.body.appendChild(pane);
    this.element = pane;

    this._mountHint();
    this._bindTabKey();

    // Keep UI in sync when values change externally (e.g., reset)
    this.settings.subscribe((path, value) => {
      if (path === '*') {
        this._syncAllInputs();
        return;
      }
      if (path === 'view.near') this._updateNearWarning(value);
    });

    this._updateNearWarning(this.settings.get('view.near'));

    return pane;
  }

  _buildSection({ key, title, fields }) {
    const sectionsOpen = this.settings.get('ui.sectionsOpen') ?? {};
    const isOpen = sectionsOpen[key] !== false;

    const section = document.createElement('div');
    section.className = 'se-section';

    const header = document.createElement('button');
    header.className = 'se-section-header';
    header.setAttribute('aria-expanded', String(isOpen));

    const titleSpan = document.createElement('span');
    titleSpan.className = 'se-section-title';
    titleSpan.textContent = title;

    const arrow = document.createElement('span');
    arrow.className = 'se-section-arrow';
    arrow.textContent = isOpen ? '▾' : '▸';

    header.appendChild(titleSpan);
    header.appendChild(arrow);

    const body = document.createElement('div');
    body.className = 'se-section-body';
    if (!isOpen) body.classList.add('se-section-body--collapsed');

    header.addEventListener('click', () => {
      const nowOpen = header.getAttribute('aria-expanded') !== 'true';
      header.setAttribute('aria-expanded', String(nowOpen));
      arrow.textContent = nowOpen ? '▾' : '▸';
      body.classList.toggle('se-section-body--collapsed', !nowOpen);

      const current = { ...(this.settings.get('ui.sectionsOpen') ?? {}) };
      current[key] = nowOpen;
      this.settings.set('ui.sectionsOpen', current);
    });

    if (key === 'view') {
      const warning = document.createElement('p');
      warning.className = 'se-warning se-warning--hidden';
      body.appendChild(warning);
      this.nearWarningEl = warning;
    }

    for (const field of fields) {
      body.appendChild(this._buildField(field));
    }

    section.appendChild(header);
    section.appendChild(body);

    return section;
  }

  _buildField({ key, label }) {
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
      this.inputEls.set(key, input);

    } else if (schema?.type === 'select') {
      const header = document.createElement('div');
      header.className = 'se-field-header';

      const labelEl = document.createElement('span');
      labelEl.className = 'se-label';
      labelEl.textContent = label;

      header.appendChild(labelEl);
      fieldEl.appendChild(header);

      const select = document.createElement('select');
      select.className = 'se-select';

      for (const opt of schema.options ?? []) {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === value) option.selected = true;
        select.appendChild(option);
      }

      select.addEventListener('change', () => this.settings.set(key, select.value));
      fieldEl.appendChild(select);
      this.inputEls.set(key, select);

    } else {
      // Number slider
      const header = document.createElement('div');
      header.className = 'se-field-header';

      const labelEl = document.createElement('span');
      labelEl.className = 'se-label';
      labelEl.textContent = label;

      const valueEl = document.createElement('span');
      valueEl.className = 'se-value';
      valueEl.textContent = this._formatValue(value, schema);
      this.valueEls.set(key, valueEl);

      header.appendChild(labelEl);
      header.appendChild(valueEl);
      fieldEl.appendChild(header);

      const input = document.createElement('input');
      input.type = 'range';
      input.className = 'se-slider';
      input.min = String(schema?.min ?? 0);
      input.max = String(schema?.max ?? 100);
      input.step = String(schema?.step ?? 'any');
      input.value = String(value);
      this._updateFill(input);

      input.addEventListener('input', () => {
        const clamped = this.settings.set(key, Number(input.value));
        valueEl.textContent = this._formatValue(clamped, schema);
        this._updateFill(input);
      });

      fieldEl.appendChild(input);
      this.inputEls.set(key, input);
    }

    return fieldEl;
  }

  _updateNearWarning(nearValue) {
    if (!this.nearWarningEl) return;
    const unsafe = nearValue > NEAR_SAFE_MAX;
    this.nearWarningEl.classList.toggle('se-warning--hidden', !unsafe);
    if (unsafe) {
      this.nearWarningEl.textContent =
        `Near ${nearValue.toFixed(2)} > ${NEAR_SAFE_MAX.toFixed(2)} — may clip objects.`;
    }
  }

  // Refresh all input widgets from current settings values (called after reset).
  _syncAllInputs() {
    for (const [key, input] of this.inputEls) {
      const value = this.settings.get(key);
      const schema = this.settings.resolveSchema(key);
      if (input.type === 'checkbox') {
        input.checked = Boolean(value);
      } else if (input.tagName === 'SELECT') {
        input.value = String(value);
      } else if (input.type === 'range') {
        input.value = String(value);
        this._updateFill(input);
        const valueEl = this.valueEls.get(key);
        if (valueEl) valueEl.textContent = this._formatValue(value, schema);
      }
    }
    this._updateNearWarning(this.settings.get('view.near'));

    // Restore section collapse state
    const sectionsOpen = this.settings.get('ui.sectionsOpen') ?? {};
    this.element?.querySelectorAll('.se-section').forEach((sectionEl, i) => {
      const sectionKey = SECTIONS[i]?.key;
      if (!sectionKey) return;
      const isOpen = sectionsOpen[sectionKey] !== false;
      const headerBtn = sectionEl.querySelector('.se-section-header');
      const body = sectionEl.querySelector('.se-section-body');
      const arrow = sectionEl.querySelector('.se-section-arrow');
      if (headerBtn) headerBtn.setAttribute('aria-expanded', String(isOpen));
      if (arrow) arrow.textContent = isOpen ? '▾' : '▸';
      if (body) body.classList.toggle('se-section-body--collapsed', !isOpen);
    });
  }

  _updateFill(input) {
    const min = Number(input.min);
    const max = Number(input.max);
    const val = Number(input.value);
    const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
    input.style.setProperty('--fill', `${pct.toFixed(1)}%`);
  }

  _formatValue(value, schema) {
    if (typeof value !== 'number') return String(value);
    const step = schema?.step;
    if (step != null) {
      const decimals = String(step).includes('.') ? String(step).split('.')[1].length : 0;
      return value.toFixed(decimals);
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  _mountHint() {
    const hint = document.createElement('div');
    hint.className = 'se-hint';
    hint.textContent = 'Tab — toggle panel';
    document.body.appendChild(hint);
    this.hint = hint;
    // Hint is only shown when pane is closed
    if (this.settings.get('ui.paneOpen') !== false) {
      hint.classList.add('se-hint--hidden');
    }
  }

  _bindTabKey() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  toggle() {
    const nowOpen = !this.settings.get('ui.paneOpen');
    this.settings.set('ui.paneOpen', nowOpen);
    this.element.classList.toggle('se-pane--hidden', !nowOpen);
    this.hint.classList.toggle('se-hint--hidden', nowOpen);
    // Resize is triggered via Engine's settings subscriber
  }
}

