import { SaveSanitizer } from './06-save-sanitizer.js';

export class SaveSystem {
  static SCHEMA = 6;
  static KEY = 'TF_SAVE_v6_';

  static serialize(state) {
    return JSON.stringify({
      v: this.SCHEMA,
      ts: Date.now(),
      hero: state.hero,
      progression: state.progression,
      inventory: state.inventory,
      equipment: state.equipment,
      forgeEconomy: state.forgeEconomy,
      frontier: state.frontier,
      cosmetics: state.cosmetics,
      afkProfiles: state.afkProfiles,
      settings: state.settings,
    });
  }

  static deserialize(raw) {
    const data = JSON.parse(raw);
    if (data.v !== this.SCHEMA) throw new Error(`Schema mismatch: ${data.v}`);
    return data;
  }

  static exportSave(state) {
    const json = this.serialize(state);
    return this.KEY + btoa(json);
  }

  static async importSave(code) {
    const prefix = this.KEY;
    if (!code.startsWith(prefix)) throw new Error('Invalid save code');
    const json = atob(code.slice(prefix.length));
    const sanitized = SaveSanitizer.sanitize(json);
    if (sanitized.dirty) {
      console.warn('Save was sanitized during import');
    }
    return SaveSystem.deserialize(sanitized.data);
  }

  static saveToStorage(state) {
    const safe = SaveSanitizer.sanitize(this.serialize(state));
    localStorage.setItem(this.KEY, safe.data);
    return safe.dirty ? 'sanitized' : 'ok';
  }

  static loadFromStorage() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return null;
    const sanitized = SaveSanitizer.sanitize(raw);
    return sanitized.data;
  }
}
