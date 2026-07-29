export class GameAssets {
  constructor() {
    this.cache = new Map();
    this.manifest = new Map();
    this.loaded = new Set();
    this.errors = [];
  }

  register(key, url) {
    this.manifest.set(key, url);
  }

  registerBatch(entries) {
    for (const [key, url] of Object.entries(entries)) {
      this.register(key, url);
    }
  }

  async loadActivePack(classId, regionId) {
    const urls = [];
    if (classId) {
      urls.push(this.manifest.get(`class_${classId}`));
    }
    if (regionId) {
      urls.push(this.manifest.get(`region_${regionId}_bg`));
    }
    const unique = [...new Set(urls.filter(Boolean))];
    await Promise.all(unique.map((u) => this.load(u)));
  }

  async load(url) {
    if (this.loaded.has(url)) return this.cache.get(url);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(url, img);
        this.loaded.add(url);
        resolve(img);
      };
      img.onerror = () => {
        this.errors.push(url);
        reject(new Error(`Failed to load asset: ${url}`));
      };
      img.src = url;
    });
  }

  get(key) {
    return this.cache.get(this.manifest.get(key)) || null;
  }

  clear() {
    this.cache.clear();
    this.loaded.clear();
  }
}
