export class SettingsStore {
  constructor(settings) {
    this.settings = settings;
    this.key = 'spaceEngine.settings.v1';
    this._debounceTimer = null;

    // Probe storage availability immediately so callers can read isAvailable
    try {
      const probe = '__se_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      this.isAvailable = true;
    } catch {
      this.isAvailable = false;
    }
  }

  // Subscribe to settings changes for debounced auto-save and install
  // pagehide / visibilitychange flush. Call once after load().
  init() {
    if (!this.isAvailable) return;

    this.settings.subscribe(() => {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => this.save(), 300);
    });

    const flush = () => {
      clearTimeout(this._debounceTimer);
      this.save();
    };

    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
  }

  // Load persisted values directly into settings.values (no subscriber fired).
  // Returns true if stored data was found and applied.
  load() {
    if (!this.isAvailable) return false;

    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return false;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return false;

      this._migrate(parsed.version ?? 0, parsed);

      const stored = parsed.values ?? {};

      // Apply only known schema keys; unknown stored keys are silently dropped.
      for (const path of Object.keys(this.settings.values)) {
        if (!Object.prototype.hasOwnProperty.call(stored, path)) continue;
        this.settings.values[path] = this.settings.normalizeValue(path, stored[path]);
      }

      return true;
    } catch (err) {
      console.warn('[SettingsStore] Load failed, using defaults:', err);
      return false;
    }
  }

  save() {
    if (!this.isAvailable) return false;

    try {
      localStorage.setItem(this.key, JSON.stringify({
        version: 1,
        values: this.settings.values,
      }));
      return true;
    } catch (err) {
      console.warn('[SettingsStore] Save failed:', err);
      this.isAvailable = false;
      return false;
    }
  }

  // Migrate data from older stored versions. No-op for now.
  _migrate(_version, _data) {}
}
