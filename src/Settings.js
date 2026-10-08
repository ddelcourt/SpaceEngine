export class Settings {
  constructor() {
    this.schema = {
      view: {
        aspectRatio: { type: 'select', default: 'Fill', options: ['Fill', '16:9', '4:3', '4:1', '1:1', '21:9'] },
        fov: { type: 'number', default: 75, min: 30, max: 110, step: 1 },
        near: { type: 'number', default: 0.05, min: 0.01, max: 1.0, step: 0.01 },
        far: { type: 'number', default: 500, min: 100, max: 1000, step: 1 },
        gridFadeDistance: { type: 'number', default: 50, min: 10, max: 100, step: 1 },
      },
      movement: {
        speed: { type: 'number', default: 9, min: 1, max: 20, step: 1 },
        lookSensitivity: { type: 'number', default: 1, min: 0.1, max: 3.0, step: 0.05 },
      },
      objects: {
        count: {
          cube:     { type: 'number', default: 1, min: 0, max: 25, step: 1 },
          pyramid:  { type: 'number', default: 1, min: 0, max: 25, step: 1 },
          cone:     { type: 'number', default: 1, min: 0, max: 25, step: 1 },
          sphere:   { type: 'number', default: 1, min: 0, max: 25, step: 1 },
          cylinder: { type: 'number', default: 1, min: 0, max: 25, step: 1 },
        },
      },
      interaction: {
        hotspot: { type: 'number', default: 0.5, min: 0.2, max: 2.0, step: 0.1 },
      },
      debug: {
        enabled: { type: 'boolean', default: false },
      },
      ui: {
        paneOpen: { type: 'boolean', default: true },
        sectionsOpen: { type: 'object', default: { view: true, movement: true, objects: true, interaction: true, debug: true } },
      },
    };

    this.values = this.flattenDefaults();
    this.listeners = [];
  }

  flattenDefaults() {
    const output = {};
    const walk = (node, path = []) => {
      if (!node || typeof node !== 'object') return;
      if ('default' in node && 'type' in node) {
        output[path.join('.')] = node.default;
        return;
      }
      for (const [key, value] of Object.entries(node)) {
        walk(value, [...path, key]);
      }
    };
    walk(this.schema);
    return output;
  }

  get(path) {
    return this.values[path];
  }

  set(path, value) {
    const normalized = this.normalizeValue(path, value);
    this.values[path] = normalized;
    this.listeners.forEach((listener) => listener(path, normalized));
    return normalized;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((entry) => entry !== listener);
    };
  }

  normalizeValue(path, value) {
    const schemaNode = this.resolveSchema(path);
    if (!schemaNode) return value;

    if (schemaNode.type === 'boolean') return Boolean(value);

    if (schemaNode.type === 'number') {
      const numberValue = Number(value);
      if (!Number.isFinite(numberValue)) return schemaNode.default;
      if (typeof schemaNode.min === 'number') {
        return Math.max(schemaNode.min, Math.min(schemaNode.max ?? numberValue, numberValue));
      }
      return numberValue;
    }

    if (schemaNode.type === 'select') {
      const options = schemaNode.options ?? [];
      return options.includes(value) ? value : schemaNode.default;
    }

    if (schemaNode.type === 'object') {
      return value && typeof value === 'object' ? value : schemaNode.default;
    }

    return value;
  }

  resolveSchema(path) {
    let current = this.schema;
    const segments = path.split('.');

    for (const segment of segments) {
      if (!current || typeof current !== 'object' || !(segment in current)) {
        return undefined;
      }
      current = current[segment];
    }

    if (current && typeof current === 'object' && 'default' in current && 'type' in current) {
      return current;
    }

    return undefined;
  }

  reset() {
    this.values = this.flattenDefaults();
    this.listeners.forEach((listener) => listener('*', this.values));
  }
}
