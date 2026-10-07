export class SettingsStore {
  constructor(settings) {
    this.settings = settings;
    this.key = 'spaceEngine.settings.v1';
  }

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) {
        this.settings.reset();
        this.save();
        return false;
      }

      const parsed = JSON.parse(raw);
      const values = parsed && parsed.values ? parsed.values : {};

      Object.entries(this.settings.values).forEach(([path, defaultValue]) => {
        if (!Object.prototype.hasOwnProperty.call(values, path)) {
          this.settings.values[path] = defaultValue;
          return;
        }

        const candidate = values[path];
        this.settings.values[path] = this.settings.normalizeValue(path, candidate);
      });

      return true;
    } catch (error) {
      console.warn('Unable to load settings:', error);
      this.settings.reset();
      this.save();
      return false;
    }
  }

  save() {
    try {
      const payload = {
        version: 1,
        values: this.settings.values,
      };
      localStorage.setItem(this.key, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.warn('Unable to save settings:', error);
      return false;
    }
  }
}
