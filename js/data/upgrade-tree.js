export const UPGRADE_TREE = {
  strength: {
    id: 'strength',
    name: 'Strength',
    icon: '💪',
    maxRank: 50,
    costBase: 10,
    costScale: 1.15,
    effect: { field: 'baseAttackDamage', type: 'flat', value: 2 },
  },
  armor: {
    id: 'armor',
    name: 'Armor Training',
    icon: '🛡️',
    maxRank: 50,
    costBase: 10,
    costScale: 1.15,
    effect: { field: 'baseArmor', type: 'flat', value: 1 },
  },
  vitality: {
    id: 'vitality',
    name: 'Vitality',
    icon: '❤️',
    maxRank: 50,
    costBase: 10,
    costScale: 1.15,
    effect: { field: 'maxHp', type: 'flat', value: 10 },
  },
  precision: {
    id: 'precision',
    name: 'Precision',
    icon: '🎯',
    maxRank: 20,
    costBase: 25,
    costScale: 1.2,
    effect: { field: 'critChance', type: 'percent', value: 0.02 },
  },
  critical: {
    id: 'critical',
    name: 'Critical Power',
    icon: '⚡',
    maxRank: 20,
    costBase: 30,
    costScale: 1.25,
    effect: { field: 'critDamage', type: 'percent', value: 0.1 },
  },
  attack_speed: {
    id: 'attack_speed',
    name: 'Attack Speed',
    icon: '⚔️',
    maxRank: 20,
    costBase: 20,
    costScale: 1.18,
    effect: { field: 'baseAttackInterval', type: 'reduction', value: 0.05 },
  },
  gold_find: {
    id: 'gold_find',
    name: 'Gold Find',
    icon: '🪙',
    maxRank: 30,
    costBase: 15,
    costScale: 1.2,
    effect: { field: 'goldFind', type: 'percent', value: 0.05 },
  },
  xp_boost: {
    id: 'xp_boost',
    name: 'XP Boost',
    icon: '📖',
    maxRank: 20,
    costBase: 20,
    costScale: 1.22,
    effect: { field: 'xpBonus', type: 'percent', value: 0.05 },
  },
  life_steal: {
    id: 'life_steal',
    name: 'Life Steal',
    icon: '🩸',
    maxRank: 10,
    costBase: 50,
    costScale: 1.5,
    effect: { field: 'lifeSteal', type: 'percent', value: 0.02 },
  },
};

export function getUpgradeCost(id, currentRank) {
  const defn = UPGRADE_TREE[id];
  if (!defn) return Infinity;
  if (currentRank >= defn.maxRank) return Infinity;
  return Math.floor(defn.costBase * Math.pow(defn.costScale, currentRank));
}

export function applyUpgradeEffect(state, id, rank) {
  const defn = UPGRADE_TREE[id];
  if (!defn) return;
  const hero = state.hero;
  const effect = defn.effect;
  const totalValue = effect.value * rank;

  switch (effect.field) {
    case 'baseAttackDamage':
      hero.baseAttackDamage = (hero.baseAttackDamage || 0) + totalValue;
      break;
    case 'baseArmor':
      hero.baseArmor = (hero.baseArmor || 0) + totalValue;
      break;
    case 'maxHp':
      hero.maxHp = (hero.maxHp || 100) + totalValue;
      hero.hp = Math.min(hero.hp + totalValue, hero.maxHp);
      break;
    case 'critChance':
      hero.critChance = Math.min(1, (hero.critChance || 0.05) + totalValue);
      break;
    case 'critDamage':
      hero.critDamage = (hero.critDamage || 1.5) + totalValue;
      break;
    case 'baseAttackInterval':
      hero.baseAttackInterval = Math.max(100, (hero.baseAttackInterval || 1000) * (1 - totalValue));
      break;
    case 'goldFind':
      hero.goldFind = (hero.goldFind || 0) + totalValue;
      break;
    case 'xpBonus':
      hero.xpBonus = (hero.xpBonus || 0) + totalValue;
      break;
    case 'lifeSteal':
      hero.lifeSteal = Math.min(1, (hero.lifeSteal || 0) + totalValue);
      break;
  }
}
