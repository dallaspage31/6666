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
  damage_pct: { field: 'baseAttackDamage' },
  damage_flat: { field: 'baseAttackDamage' },
  cooldown_reduction: { field: 'baseAttackInterval' },
  duration_pct: { field: 'duration' },
  heal_pct: { field: 'healAmount' },
  party_buff: { field: 'partyBuff' },
  armor_shred: { field: 'armorShred' },
  reflect_pct: { field: 'reflectChance' },
  split_count: { field: 'splitCount' },
  pierce_count: { field: 'pierceCount' },
  crit_chance: { field: 'critChance' },
};

export class AbilityRegistry {
  constructor() {
    this.abilities = new Map();
    this.effects = new Map();
    this.upgrades = new Map();
    this.consumers = new Set();
    this.validateRegistry();
  }

  registerAbility(id, defn) {
    if (this.abilities.has(id)) {
      throw new Error(`Duplicate ability: ${id}`);
    }
    this.abilities.set(id, defn);
  }

  registerEffect(id, consumer) {
    if (!ABILITY_EFFECTS[id]) {
      throw new Error(`Unknown effect type: ${id}`);
    }
    if (this.effects.has(id) && this.effects.get(id) !== consumer) {
      throw new Error(`Effect consumer conflict: ${id}`);
    }
    this.effects.set(id, consumer);
    this.consumers.add(consumer.name || id);
  }

  registerUpgrade(id, defn) {
    if (this.upgrades.has(id)) throw new Error(`Duplicate upgrade: ${id}`);
    this.upgrades.set(id, defn);
  }

  validateRegistry() {
    const unknown = [...this.effects.keys()].filter((k) => !ABILITY_EFFECTS[k]);
    if (unknown.length) throw new Error(`Unknown effect consumers: ${unknown.join(',')}`);
  }

  getAbility(id) { return this.abilities.get(id); }
  getEffect(id) { return this.effects.get(id); }
  getUpgrade(id) { return this.upgrades.get(id); }
}

export const defaultRegistry = new AbilityRegistry();
