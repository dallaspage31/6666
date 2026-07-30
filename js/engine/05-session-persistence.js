export class SessionPersistence {
  constructor(prefix = 'TF_SAVE_v6_') {
    this.prefix = prefix;
    this.memory = new Map();
  }

  save(state) {
    const payload = JSON.stringify(state);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.prefix, payload);
      localStorage.setItem(this.prefix + 'ts', String(Date.now()));
    } else {
      this.memory.set(this.prefix, payload);
    }
    return payload;
  }

  load() {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(this.prefix);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    const raw = this.memory.get(this.prefix);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  clear() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.prefix);
      localStorage.removeItem(this.prefix + 'ts');
    } else {
      this.memory.delete(this.prefix);
    }
  }
}
