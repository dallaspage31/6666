export type HeroRarity =
  'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Cosmic'

export interface HeroRarityConfig {
  rarity: HeroRarity
  baseHp: number
  baseAtk: number
  baseDef: number
  baseSpd: number
  xpMultiplier: number
  dropRate: number
  color: string
  textColor: string
  borderColor: string
}

export const HERO_RARITY_CONFIGS: Record<HeroRarity, HeroRarityConfig> = {
  Common: {
    rarity: 'Common',
    baseHp: 100,
    baseAtk: 10,
    baseDef: 5,
    baseSpd: 3,
    xpMultiplier: 1.0,
    dropRate: 0.4,
    color: 'bg-gray-500',
    textColor: 'text-gray-300',
    borderColor: 'border-gray-500',
  },
  Uncommon: {
    rarity: 'Uncommon',
    baseHp: 120,
    baseAtk: 13,
    baseDef: 7,
    baseSpd: 4,
    xpMultiplier: 1.3,
    dropRate: 0.25,
    color: 'bg-green-600',
    textColor: 'text-green-200',
    borderColor: 'border-green-500',
  },
  Rare: {
    rarity: 'Rare',
    baseHp: 150,
    baseAtk: 18,
    baseDef: 10,
    baseSpd: 5,
    xpMultiplier: 1.7,
    dropRate: 0.15,
    color: 'bg-blue-600',
    textColor: 'text-blue-200',
    borderColor: 'border-blue-500',
  },
  Epic: {
    rarity: 'Epic',
    baseHp: 200,
    baseAtk: 25,
    baseDef: 15,
    baseSpd: 6,
    xpMultiplier: 2.2,
    dropRate: 0.08,
    color: 'bg-purple-600',
    textColor: 'text-purple-200',
    borderColor: 'border-purple-500',
  },
  Legendary: {
    rarity: 'Legendary',
    baseHp: 300,
    baseAtk: 35,
    baseDef: 20,
    baseSpd: 7,
    xpMultiplier: 3.0,
    dropRate: 0.04,
    color: 'bg-orange-600',
    textColor: 'text-orange-200',
    borderColor: 'border-orange-500',
  },
  Cosmic: {
    rarity: 'Cosmic',
    baseHp: 500,
    baseAtk: 50,
    baseDef: 30,
    baseSpd: 10,
    xpMultiplier: 5.0,
    dropRate: 0.01,
    color: 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500',
    textColor: 'text-white',
    borderColor: 'border-transparent',
  },
}

export const HERO_RARITIES: HeroRarity[] = [
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
  'Cosmic',
]

export function getRarityConfig(rarity: HeroRarity): HeroRarityConfig {
  return HERO_RARITY_CONFIGS[rarity]
}

export function getRarityMultiplier(rarity: HeroRarity): number {
  return HERO_RARITY_CONFIGS[rarity].xpMultiplier
}

export function rollRarity(): HeroRarity {
  const roll = Math.random()
  let cumulative = 0
  for (const rarity of HERO_RARITIES) {
    cumulative += HERO_RARITY_CONFIGS[rarity].dropRate
    if (roll < cumulative) {
      return rarity
    }
  }
  return 'Common'
}
