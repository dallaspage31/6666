export interface LevelConfig {
  level: number;
  xpRequired: number;
  hpBonus: number;
  atkBonus: number;
  defBonus: number;
  spdBonus: number;
}

export interface PrestigeRank {
  rank: number;
  name: string;
  minLevel: number;
  xpMultiplier: number;
  unlocks: string[];
}

export const XP_TABLE: LevelConfig[] = [
  {
    level: 1,
    xpRequired: 0,
    hpBonus: 0,
    atkBonus: 0,
    defBonus: 0,
    spdBonus: 0,
  },
  {
    level: 2,
    xpRequired: 100,
    hpBonus: 5,
    atkBonus: 1,
    defBonus: 1,
    spdBonus: 0,
  },
  {
    level: 3,
    xpRequired: 250,
    hpBonus: 10,
    atkBonus: 2,
    defBonus: 1,
    spdBonus: 1,
  },
  {
    level: 4,
    xpRequired: 500,
    hpBonus: 15,
    atkBonus: 2,
    defBonus: 2,
    spdBonus: 1,
  },
  {
    level: 5,
    xpRequired: 800,
    hpBonus: 20,
    atkBonus: 3,
    defBonus: 2,
    spdBonus: 1,
  },
  {
    level: 6,
    xpRequired: 1200,
    hpBonus: 25,
    atkBonus: 3,
    defBonus: 3,
    spdBonus: 2,
  },
  {
    level: 7,
    xpRequired: 1700,
    hpBonus: 30,
    atkBonus: 4,
    defBonus: 3,
    spdBonus: 2,
  },
  {
    level: 8,
    xpRequired: 2300,
    hpBonus: 35,
    atkBonus: 4,
    defBonus: 4,
    spdBonus: 2,
  },
  {
    level: 9,
    xpRequired: 3000,
    hpBonus: 40,
    atkBonus: 5,
    defBonus: 4,
    spdBonus: 3,
  },
  {
    level: 10,
    xpRequired: 4000,
    hpBonus: 50,
    atkBonus: 6,
    defBonus: 5,
    spdBonus: 3,
  },
  {
    level: 11,
    xpRequired: 5200,
    hpBonus: 55,
    atkBonus: 7,
    defBonus: 5,
    spdBonus: 3,
  },
  {
    level: 12,
    xpRequired: 6600,
    hpBonus: 60,
    atkBonus: 7,
    defBonus: 6,
    spdBonus: 4,
  },
  {
    level: 13,
    xpRequired: 8200,
    hpBonus: 65,
    atkBonus: 8,
    defBonus: 6,
    spdBonus: 4,
  },
  {
    level: 14,
    xpRequired: 10000,
    hpBonus: 70,
    atkBonus: 9,
    defBonus: 7,
    spdBonus: 4,
  },
  {
    level: 15,
    xpRequired: 12000,
    hpBonus: 80,
    atkBonus: 10,
    defBonus: 7,
    spdBonus: 5,
  },
  {
    level: 16,
    xpRequired: 14500,
    hpBonus: 85,
    atkBonus: 11,
    defBonus: 8,
    spdBonus: 5,
  },
  {
    level: 17,
    xpRequired: 17500,
    hpBonus: 90,
    atkBonus: 12,
    defBonus: 8,
    spdBonus: 5,
  },
  {
    level: 18,
    xpRequired: 21000,
    hpBonus: 95,
    atkBonus: 13,
    defBonus: 9,
    spdBonus: 6,
  },
  {
    level: 19,
    xpRequired: 25000,
    hpBonus: 100,
    atkBonus: 14,
    defBonus: 9,
    spdBonus: 6,
  },
  {
    level: 20,
    xpRequired: 30000,
    hpBonus: 120,
    atkBonus: 15,
    defBonus: 10,
    spdBonus: 7,
  },
];

export const PRESTIGE_RANKS: PrestigeRank[] = [
  {
    rank: 1,
    name: "Novice",
    minLevel: 1,
    xpMultiplier: 1.0,
    unlocks: ["basic-combat", "starter-hero"],
  },
  {
    rank: 2,
    name: "Apprentice",
    minLevel: 5,
    xpMultiplier: 1.1,
    unlocks: ["rune-slots-1", "pet-slot-1"],
  },
  {
    rank: 3,
    name: "Warrior",
    minLevel: 10,
    xpMultiplier: 1.25,
    unlocks: ["hard-difficulty", "crafting-tier-2"],
  },
  {
    rank: 4,
    name: "Veteran",
    minLevel: 15,
    xpMultiplier: 1.5,
    unlocks: ["rune-slots-2", "pet-slot-2", "epic-crafting"],
  },
  {
    rank: 5,
    name: "Champion",
    minLevel: 20,
    xpMultiplier: 2.0,
    unlocks: [
      "rune-slots-3",
      "pet-slot-3",
      "legendary-crafting",
      "nightmare-difficulty",
    ],
  },
];

export function getLevelConfig(level: number): LevelConfig {
  const config = XP_TABLE.find((c) => c.level === level);
  if (config) return config;
  const last = XP_TABLE[XP_TABLE.length - 1];
  const diff = level - last.level;
  return {
    level,
    xpRequired: last.xpRequired + diff * 3000,
    hpBonus: last.hpBonus + diff * 10,
    atkBonus: last.atkBonus + diff * 1,
    defBonus: last.defBonus + diff * 1,
    spdBonus: last.spdBonus + diff * 1,
  };
}

export function getXpForLevel(level: number): number {
  const config = XP_TABLE.find((c) => c.level === level);
  if (config) return config.xpRequired;
  const last = XP_TABLE[XP_TABLE.length - 1];
  const diff = level - last.level;
  return last.xpRequired + diff * 3000;
}

export function getPrestigeRank(level: number): PrestigeRank {
  let matched = PRESTIGE_RANKS[0];
  for (const rank of PRESTIGE_RANKS) {
    if (level >= rank.minLevel) {
      matched = rank;
    }
  }
  return matched;
}

export function calculateXpProgress(
  currentLevel: number,
  currentXp: number,
): { progress: number; nextLevelXp: number } {
  const currentConfig = getLevelConfig(currentLevel);
  const nextLevelConfig = getLevelConfig(currentLevel + 1);
  const range = nextLevelConfig.xpRequired - currentConfig.xpRequired;
  const progress = range > 0 ? Math.min(currentXp / range, 1) : 1;
  return { progress, nextLevelXp: nextLevelConfig.xpRequired };
}
