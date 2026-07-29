export class SaveSanitizer {
  static WHITELIST = {
    itemSlot: ['weapon', 'armor', 'motif', 'gem', 'aura', 'ring', 'amulet'],
    rarity: ['common', 'uncommon', 'rare', 'epic', 'mythic', 'eternal'],
    itemBaseId: /^[a-z0-9_-]+$/,
    weaponMotifPath: /^weapons\/[a-z0-9_-]+$/,
    armorMotifPath: /^armor\/[a-z0-9_-]+$/,
    affix: /^[a-z0-9_-]+$/,
    uidChars: /^[a-zA-Z0-9_-]+$/,
    uidMaxLength: 64,
    inventoryMax: 200,
    heroNumericBounds: {
      level: { min: 1, max: 9999 },
      hp: { min: 0, max: 1e18 },
      maxHp: { min: 1, max: 1e18 },
      baseAttackDamage: { min: 0, max: 1e18 },
      baseArmor: { min: 0, max: 1e9 },
    },
  };

  static sanitize(raw) {
    if (typeof raw !== 'string') return null;
    let dirty = false;
    const data = JSON.parse(raw);
    const safe = JSON.parse(JSON.stringify(data));

    if (safe.hero) {
      for (const [key, bounds] of Object.entries(this.WHITELIST.heroNumericBounds)) {
        if (safe.hero[key] != null) {
          safe.hero[key] = Math.max(bounds.min, Math.min(bounds.max, Number(safe.hero[key]) || bounds.min));
          if (safe.hero[key] !== data.hero[key]) dirty = true;
        }
      }
    }

    if (Array.isArray(safe.inventory)) {
      if (safe.inventory.length > this.WHITELIST.inventoryMax) {
        safe.inventory = safe.inventory.slice(0, this.WHITELIST.inventoryMax);
        dirty = true;
      }
      safe.inventory = safe.inventory.map((item, i) => {
        if (!this.WHITELIST.itemSlot.includes(item.slot)) return null;
        if (!this.WHITELIST.rarity.includes(item.rarity)) return null;
        if (!this.WHITELIST.itemBaseId.test(item.baseId)) return null;
        if (item.uid && !this.WHITELIST.uidChars.test(item.uid)) item.uid = `sanitized_${i}`;
        if (item.name && /<script|on\w+=|javascript:/i.test(item.name)) item.name = 'Sanitized Item';
        if (item.affixes && Array.isArray(item.affixes)) {
          item.affixes = item.affixes.filter((a) => this.WHITELIST.affix.test(a));
        }
        return item;
      }).filter(Boolean);
      if (safe.inventory.length !== data.inventory?.length) dirty = true;
    }

    if (safe.equipment) {
      for (const slot of Object.keys(safe.equipment)) {
        if (!this.WHITELIST.itemSlot.includes(slot)) delete safe.equipment[slot];
      }
    }

    if (safe.frontier) {
      if (typeof safe.frontier.depth !== 'number') safe.frontier.depth = 1;
      if (!['push', 'farm', 'safePush', 'greedy'].includes(safe.frontier.policy)) {
        safe.frontier.policy = 'push';
      }
    }

    return { data: safe, dirty };
  }
}
