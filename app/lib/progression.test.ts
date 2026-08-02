import { describe, expect, it } from 'vitest'

import {
  PRESTIGE_RANKS,
  XP_TABLE,
  calculateXpProgress,
  getLevelConfig,
  getPrestigeRank,
  getXpForLevel,
} from './progression'

describe('XP_TABLE', () => {
  it('is strictly increasing in level and xpRequired', () => {
    for (let i = 1; i < XP_TABLE.length; i++) {
      expect(XP_TABLE[i].level).toBe(XP_TABLE[i - 1].level + 1)
      expect(XP_TABLE[i].xpRequired).toBeGreaterThan(XP_TABLE[i - 1].xpRequired)
    }
  })
})

describe('getLevelConfig', () => {
  it('returns the table entry for tabulated levels', () => {
    expect(getLevelConfig(1).xpRequired).toBe(0)
    expect(getLevelConfig(10)).toEqual(XP_TABLE[9])
  })

  it('extrapolates linearly beyond the last table entry', () => {
    const last = XP_TABLE[XP_TABLE.length - 1]
    const config = getLevelConfig(last.level + 3)
    expect(config).toEqual({
      level: last.level + 3,
      xpRequired: last.xpRequired + 9000,
      hpBonus: last.hpBonus + 30,
      atkBonus: last.atkBonus + 3,
      defBonus: last.defBonus + 3,
      spdBonus: last.spdBonus + 3,
    })
  })
})

describe('getXpForLevel', () => {
  it('matches the table for tabulated levels', () => {
    expect(getXpForLevel(5)).toBe(800)
  })

  it('extrapolates beyond the table and agrees with getLevelConfig', () => {
    expect(getXpForLevel(25)).toBe(getLevelConfig(25).xpRequired)
    expect(getXpForLevel(21)).toBe(33000)
  })
})

describe('getPrestigeRank', () => {
  it('returns the first rank below the second threshold', () => {
    expect(getPrestigeRank(1).name).toBe('Novice')
    expect(getPrestigeRank(4).name).toBe('Novice')
    expect(getPrestigeRank(0).name).toBe('Novice')
  })

  it('returns the highest rank whose minLevel is met', () => {
    expect(getPrestigeRank(5).name).toBe('Apprentice')
    expect(getPrestigeRank(14).name).toBe('Warrior')
    expect(getPrestigeRank(20).rank).toBe(5)
    expect(getPrestigeRank(999)).toBe(PRESTIGE_RANKS[PRESTIGE_RANKS.length - 1])
  })
})

describe('calculateXpProgress', () => {
  it('reports progress as a fraction of the level xp range', () => {
    const { progress, nextLevelXp } = calculateXpProgress(1, 50)
    expect(nextLevelXp).toBe(100)
    expect(progress).toBeCloseTo(0.5)
  })

  it('clamps progress at 1 when xp exceeds the range', () => {
    expect(calculateXpProgress(1, 1000).progress).toBe(1)
  })

  it('reports zero progress with no xp', () => {
    expect(calculateXpProgress(3, 0).progress).toBe(0)
  })
})
