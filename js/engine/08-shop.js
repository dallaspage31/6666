export class ShopSystem {
  constructor() {
    this.catalog = [];
    this.refreshCount = 0;
  }

  generateCatalog(rng, tier = 1, count = 6) {
    const slots = ['weapon', 'armor', 'motif', 'gem', 'aura'];
    const rarities = ['common', 'uncommon', 'rare', 'epic'];
    const bases = [
      { name: 'Rusty Blade', slot: 'weapon', baseDamage: 3 },
      { name: 'Iron Shield', slot: 'armor', baseArmor: 2 },
      { name: 'Linen Wrap', slot: 'motif', baseHp: 10 },
      { name: 'Shard Core', slot: 'gem', baseCrit: 0.01 },
      { name: 'Warding Charm', slot: 'aura', baseResist: 1 },
      { name: 'Fire Tongue', slot: 'weapon', baseDamage: 5 },
      { name: 'Steel Plate', slot: 'armor', baseArmor: 4 },
      { name: 'Silk Tassel', slot: 'motif', baseHp: 18 },
      { name: 'Frost Gem', slot: 'gem', baseCrit: 0.02 },
      { name: 'Ward Banner', slot: 'aura', baseResist: 2 },
    ];
    const out = [];
    for (let i = 0; i < count; i++) {
      const base = rng.pick(bases);
      const rarity = rng.pick(rarities);
      const price = Math.floor((rarity === 'common' ? 20 : rarity === 'uncommon' ? 50 : rarity === 'rare' ? 150 : 400) * (1 + tier * 0.5));
      out.push({
        id: `shop_${Date.now()}_${i}`,
        name: `${base.name}`,
        slot: base.slot,
        rarity,
        price,
        stats: { ...base },
      });
    }
    this.catalog = out;
    this.refreshCount++;
    return out;
  }

  buy(index, state) {
    const item = this.catalog[index];
    if (!item) return { success: false, reason: 'NO_ITEM' };
    if ((state.hero.gold || 0) < item.price) return { success: false, reason: 'INSUFFICIENT_GOLD' };
    state.hero.gold -= item.price;
    state.inventory.push({ ...item, uid: `${item.id}_${Date.now()}` });
    this.catalog.splice(index, 1);
    return { success: true, item };
  }

  sell(uid, state) {
    const idx = state.inventory.findIndex((i) => i.uid === uid);
    if (idx === -1) return { success: false, reason: 'NOT_FOUND' };
    const item = state.inventory[idx];
    const sellPrice = Math.floor(item.price * 0.5);
    state.hero.gold = (state.hero.gold || 0) + sellPrice;
    state.inventory.splice(idx, 1);
    return { success: true, sellPrice };
  }
}
