const ABILITY_EFFECTS = {
  damage: { type: 'DamageEffect', consumes: true },
  heal: { type: 'HealEffect', consumes: true },
  buff: { type: 'BuffEffect', consumes: false },
  status: { type: 'StatusEffect', consumes: false },
  projectile: { type: 'ProjectileEffect', consumes: true },
  summon: { type: 'SummonEffect', consumes: true },
  armor_shred: { type: 'DamageEffect', consumes: true },
  freeze: { type: 'StatusEffect', consumes: false },
  reflect: { type: 'StatusEffect', consumes: false },
  split: { type: 'ProjectileEffect', consumes: true },
  pierce: { type: 'ProjectileEffect', consumes: true },
  dot: { type: 'StatusEffect', consumes: false },
};

const UPGRADE_MECHANICS = {
  damage_pct: { field: 'baseAttackDamage', apply: (v, base) => base * (1 + v / 100) },
  damage_flat: { field: 'baseAttackDamage', apply: (v, base) => base + v },
  cooldown_reduction: { field: 'baseAttackInterval', apply: (v, base) => Math.max(100, base * (1 - v / 100)) },
  duration_pct: { field: 'duration', apply: (v, base) => base * (1 + v / 100) },
  heal_pct: { field: 'healAmount', apply: (v, base) => base * (1 + v / 100) },
  party_buff: { field: 'partyBuff', apply: (v, base) => base + v },
  armor_shred: { field: 'armorShred', apply: (v, base) => base + v },
  reflect_pct: { field: 'reflectChance', apply: (v, base) => Math.min(1, base + v / 100) },
  split_count: { field: 'splitCount', apply: (v, base) => base + v },
  pierce_count: { field: 'pierceCount', apply: (v, base) => base + v },
  crit_chance: { field: 'critChance', apply: (v, base) => Math.min(1, base + v / 100) },
};

export class AbilityRegistry {
  constructor() {
    this.abilities = new Map();
    this.effects = new Map();
    this.upgrades = new Map();
    this.consumers = new Map();
    this.runtimeHandlers = new Map();
    this.validateRegistry();
  }

  registerAbility(id, defn) {
    if (this.abilities.has(id)) throw new Error(`Duplicate ability: ${id}`);
    this.abilities.set(id, defn);
  }

  registerEffect(id, consumer) {
    if (!ABILITY_EFFECTS[id]) throw new Error(`Unknown effect type: ${id}`);
    if (this.effects.has(id) && this.effects.get(id) !== consumer) {
      throw new Error(`Effect consumer conflict: ${id}`);
    }
    this.effects.set(id, consumer);
    this.consumers.set(id, consumer);
  }

  registerUpgrade(id, defn) {
    if (this.upgrades.has(id)) throw new Error(`Duplicate upgrade: ${id}`);
    this.upgrades.set(id, defn);
  }

  registerRuntimeHandler(effectType, handler) {
    this.runtimeHandlers.set(effectType, handler);
  }

  validateRegistry() {
    const unknown = [...this.effects.keys()].filter((k) => !ABILITY_EFFECTS[k]);
    if (unknown.length) throw new Error(`Unknown effect consumers: ${unknown.join(',')}`);
  }

  getAbility(id) { return this.abilities.get(id); }
  getEffect(id) { return this.effects.get(id); }
  getUpgrade(id) { return this.upgrades.get(id); }

  apply(abilityId, caster, targets, state) {
    const ability = this.abilities.get(abilityId);
    if (!ability) return [];
    const results = [];
    for (const effect of ability.effects || []) {
      const handler = this.runtimeHandlers.get(effect.type) || this.consumers.get(effect.type);
      if (!handler) continue;
      for (const target of targets) {
        const r = handler(state, caster, target, effect);
        results.push({ ability: abilityId, effect: effect.type, targetId: target.id, result: r });
      }
    }
    return results;
  }

  computeUpgrade(upgradeId, value, baseValue) {
    const defn = this.upgrades.get(upgradeId);
    if (!defn) return baseValue;
    const mechanic = UPGRADE_MECHANICS[upgradeId];
    if (!mechanic) return baseValue;
    return mechanic.apply(value, baseValue);
  }
}

export const defaultRegistry = new AbilityRegistry();

defaultRegistry.registerAbility('basic_attack', {
  id: 'basic_attack',
  name: 'Basic Attack',
  effects: [{ type: 'damage', amount: 10 }],
});

defaultRegistry.registerAbility('heavy_slash', {
  id: 'heavy_slash',
  name: 'Heavy Slash',
  effects: [{ type: 'damage', amount: 25 }],
});

defaultRegistry.registerAbility('minor_heal', {
  id: 'minor_heal',
  name: 'Minor Heal',
  effects: [{ type: 'heal', amount: 15 }],
});

defaultRegistry.registerAbility('power_strike', {
  id: 'power_strike',
  name: 'Power Strike',
  effects: [
    { type: 'damage', amount: 20 },
    { type: 'buff', field: 'baseAttackDamage', value: 5, durationMs: 3000 },
  ],
});

defaultRegistry.registerAbility('fireball', {
  id: 'fireball',
  name: 'Fireball',
  effects: [{ type: 'projectile', count: 3 }],
});

defaultRegistry.registerAbility('summon_skeleton', {
  id: 'summon_skeleton',
  name: 'Summon Skeleton',
  effects: [{ type: 'summon', unitDef: { id: 'skeleton', hp: 30, maxHp: 30, damage: 5, armor: 0, attackInterval: 1500 } }],
});
