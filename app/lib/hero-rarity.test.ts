import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  HERO_RARITIES,
  HERO_RARITY_CONFIGS,
  getRarityConfig,
  getRarityMultiplier,
  rollRarity,
} from './hero-rarity'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('HERO_RARITY_CONFIGS', () => {
  it('covers every rarity and keys configs by their own rarity', () => {
    expect(Object.keys(HERO_RARITY_CONFIGS).sort()).toEqual([...HERO_RARITIES].sort())
    for (const rarity of HERO_RARITIES) {
      expect(HERO_RARITY_CONFIGS[rarity].rarity).toBe(rarity)
    }
  })

  it('increases stats and decreases drop rate as rarity rises', () => {
    for (let i = 1; i < HERO_RARITIES.length; i++) {
      const prev = HERO_RARITY_CONFIGS[HERO_RARITIES[i - 1]]
      const curr = HERO_RARITY_CONFIGS[HERO_RARITIES[i]]
      expect(curr.baseHp).toBeGreaterThan(prev.baseHp)
      expect(curr.baseAtk).toBeGreaterThan(prev.baseAtk)
      expect(curr.xpMultiplier).toBeGreaterThan(prev.xpMultiplier)
      expect(curr.dropRate).toBeLessThan(prev.dropRate)
    }
  })

  it('has drop rates summing to at most 1, leaving Common as the fallback', () => {
    const total = HERO_RARITIES.reduce((sum, r) => sum + HERO_RARITY_CONFIGS[r].dropRate, 0)
    expect(total).toBeLessThanOrEqual(1)
    expect(total).toBeGreaterThan(0.9)
  })
})

describe('getRarityConfig / getRarityMultiplier', () => {
  it('returns the config and its xp multiplier', () => {
    expect(getRarityConfig('Epic').baseDef).toBe(15)
    expect(getRarityMultiplier('Cosmic')).toBe(5.0)
    expect(getRarityMultiplier('Common')).toBe(1.0)
  })
})

describe('rollRarity', () => {
  it.each([
    [0, 'Common'],
    [0.39, 'Common'],
    [0.4, 'Uncommon'],
    [0.64, 'Uncommon'],
    [0.7, 'Rare'],
    [0.85, 'Epic'],
    [0.89, 'Legendary'],
    [0.925, 'Cosmic'],
  ])('maps roll %s to %s', (roll, expected) => {
    vi.spyOn(Math, 'random').mockReturnValue(roll)
    expect(rollRarity()).toBe(expected)
  })

  it('falls back to Common when the roll exceeds the cumulative drop rate', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999)
    expect(rollRarity()).toBe('Common')
  })
})
