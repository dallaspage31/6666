export class TalentTree {
  constructor() {
    this.nodes = new Map();
    this.points = 0;
    this.spent = 0;
  }

  define(id, def) {
    this.nodes.set(id, {
      id,
      name: def.name || id,
      icon: def.icon || '?',
      cost: def.cost || 1,
      requires: def.requires || [],
      effect: def.effect || null,
      activated: false,
    });
  }

  spend(points) {
    this.points = Math.max(0, this.points + points);
  }

  canActivate(id) {
    const node = this.nodes.get(id);
    if (!node || node.activated || this.points < node.cost) return false;
    return node.requires.every((r) => this.nodes.get(r)?.activated);
  }

  activate(id) {
    const node = this.nodes.get(id);
    if (!node || !this.canActivate(id)) return false;
    node.activated = true;
    this.points -= node.cost;
    this.spent += node.cost;
    return true;
  }

  deactivate(id) {
    const node = this.nodes.get(id);
    if (!node || !node.activated) return false;
    const dependents = [...this.nodes.values()].filter((n) => n.requires.includes(id) && n.activated);
    if (dependents.length > 0) return false;
    node.activated = false;
    this.points += node.cost;
    this.spent -= node.cost;
    return true;
  }

  applyEffects(state) {
    for (const node of this.nodes.values()) {
      if (!node.activated || !node.effect) continue;
      const hero = state.hero;
      if (!hero) continue;
      for (const [field, delta] of Object.entries(node.effect)) {
        hero[field] = (hero[field] || 0) + delta;
      }
    }
  }
}
