import { describe, expect, it } from 'vitest'

import {
  BOSS_CONFIGS,
  COMBAT_TIMERS,
  DIFFICULTIES,
  MAX_WAVE,
  WAVE_CONFIGS,
} from './combat-config'

describe('DIFFICULTIES', () => {
  it('keeps normal as the neutral baseline', () => {
    expect(DIFFICULTIES.normal).toMatchObject({
      hpMultiplier: 1.0,
      atkMultiplier: 1.0,
      defMultiplier: 1.0,
      xpMultiplier: 1.0,
      goldMultiplier: 1.0,
    })
  })

  it('scales enemy strength up and player defence down as difficulty rises', () => {
    const ordered = ['easy', 'normal', 'hard', 'nightmare'].map((key) => DIFFICULTIES[key])
    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i].hpMultiplier).toBeGreaterThan(ordered[i - 1].hpMultiplier)
      expect(ordered[i].atkMultiplier).toBeGreaterThan(ordered[i - 1].atkMultiplier)
      expect(ordered[i].defMultiplier).toBeLessThan(ordered[i - 1].defMultiplier)
      expect(ordered[i].xpMultiplier).toBeGreaterThan(ordered[i - 1].xpMultiplier)
    }
  })
})

describe('WAVE_CONFIGS', () => {
  it('covers waves 1..MAX_WAVE in order', () => {
    expect(WAVE_CONFIGS).toHaveLength(MAX_WAVE)
    WAVE_CONFIGS.forEach((wave, index) => {
      expect(wave.waveNumber).toBe(index + 1)
    })
  })

  it('matches monsterCount to the monsterIds list', () => {
    for (const wave of WAVE_CONFIGS) {
      expect(wave.monsterIds).toHaveLength(wave.monsterCount)
    }
  })

  it('increases scaling and rewards with each wave', () => {
    for (let i = 1; i < WAVE_CONFIGS.length; i++) {
      expect(WAVE_CONFIGS[i].hpScale).toBeGreaterThan(WAVE_CONFIGS[i - 1].hpScale)
      expect(WAVE_CONFIGS[i].atkScale).toBeGreaterThan(WAVE_CONFIGS[i - 1].atkScale)
      expect(WAVE_CONFIGS[i].xpReward).toBeGreaterThan(WAVE_CONFIGS[i - 1].xpReward)
      expect(WAVE_CONFIGS[i].goldReward).toBeGreaterThanOrEqual(WAVE_CONFIGS[i - 1].goldReward)
      expect(WAVE_CONFIGS[i].monsterCount).toBeGreaterThanOrEqual(WAVE_CONFIGS[i - 1].monsterCount)
    }
  })
})

describe('BOSS_CONFIGS', () => {
  it('places bosses on existing waves and keys them by wave number', () => {
    for (const [key, boss] of Object.entries(BOSS_CONFIGS)) {
      expect(boss.waveNumber).toBe(Number(key))
      expect(boss.waveNumber).toBeLessThanOrEqual(MAX_WAVE)
      expect(WAVE_CONFIGS.some((wave) => wave.waveNumber === boss.waveNumber)).toBe(true)
    }
  })

  it('rewards more than the matching wave and scales up with depth', () => {
    for (const boss of Object.values(BOSS_CONFIGS)) {
      const wave = WAVE_CONFIGS[boss.waveNumber - 1]
      expect(boss.xpReward).toBeGreaterThan(wave.xpReward)
      expect(boss.goldReward).toBeGreaterThan(wave.goldReward)
    }
    expect(BOSS_CONFIGS[10].hpMultiplier).toBeGreaterThan(BOSS_CONFIGS[5].hpMultiplier)
  })
})

describe('COMBAT_TIMERS', () => {
  it('uses positive durations with the boss intro the longest', () => {
    for (const value of Object.values(COMBAT_TIMERS)) {
      expect(value).toBeGreaterThan(0)
    }
    expect(COMBAT_TIMERS.bossIntroMs).toBeGreaterThan(COMBAT_TIMERS.waveIntroMs)
  })
})
