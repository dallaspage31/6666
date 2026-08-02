import {
  RARITIES,
  RARITY_BORDER_COLORS,
  RARITY_COLORS,
  RARITY_MULTIPLIERS,
  RARITY_TEXT_COLORS,
  type Rarity,
} from './rarity'

export type HeroRarity = Rarity

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

function baseConfig(rarity: HeroRarity): HeroRarityConfig {
  return {
    rarity,
    baseHp: 0,
    baseAtk: 0,
    baseDef: 0,
    baseSpd: 0,
    dropRate: 0,
    xpMultiplier: RARITY_MULTIPLIERS[rarity],
    color: RARITY_COLORS[rarity],
    textColor: RARITY_TEXT_COLORS[rarity],
    borderColor: RARITY_BORDER_COLORS[rarity],
  }
}

export const HERO_RARITY_CONFIGS: Record<HeroRarity, HeroRarityConfig> = {
  Common: { ...baseConfig('Common'), baseHp: 100, baseAtk: 10, baseDef: 5, baseSpd: 3, dropRate: 0.40 },
  Uncommon: { ...baseConfig('Uncommon'), baseHp: 120, baseAtk: 13, baseDef: 7, baseSpd: 4, dropRate: 0.25 },
  Rare: { ...baseConfig('Rare'), baseHp: 150, baseAtk: 18, baseDef: 10, baseSpd: 5, dropRate: 0.15 },
  Epic: { ...baseConfig('Epic'), baseHp: 200, baseAtk: 25, baseDef: 15, baseSpd: 6, dropRate: 0.08 },
  Legendary: { ...baseConfig('Legendary'), baseHp: 300, baseAtk: 35, baseDef: 20, baseSpd: 7, dropRate: 0.04 },
  Cosmic: { ...baseConfig('Cosmic'), baseHp: 500, baseAtk: 50, baseDef: 30, baseSpd: 10, dropRate: 0.01 },
}

export const HERO_RARITIES: HeroRarity[] = RARITIES

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