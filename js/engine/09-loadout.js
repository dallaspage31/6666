export class LoadoutManager {
  constructor() {
    this.presets = new Map();
    this.active = { weapon: null, armor: null, motif: null, gem: null, aura: null };
  }

  save(name, equipment) {
    this.presets.set(name, { ...equipment });
    return { success: true };
  }

  apply(presetName, state) {
    const preset = this.presets.get(presetName);
    if (!preset) return { success: false, reason: 'NOT_FOUND' };
    state.equipment = { ...preset };
    return { success: true };
  }

  list() {
    return [...this.presets.entries()].map(([name, data]) => ({ name, ...data }));
  }

  equip(slot, itemUid, state) {
    const inventory = state.inventory;
    const item = inventory.find((i) => i.uid === itemUid);
    if (!item || item.slot !== slot) return { success: false, reason: 'INVALID_SLOT' };
    state.equipment[slot] = item;
    return { success: true };
  }

  unequip(slot, state) {
    if (!state.equipment[slot]) return { success: false, reason: 'EMPTY' };
    state.inventory.push(state.equipment[slot]);
    state.equipment[slot] = null;
    return { success: true };
  }
}
