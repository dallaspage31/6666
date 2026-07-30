export interface WaveConfig {
  waveNumber: number
  monsterCount: number
  monsterIds: string[]
  hpScale: number
  atkScale: number
  defScale: number
  spdScale: number
  xpReward: number
  goldReward: number
}

export interface BossConfig {
  waveNumber: number
  monsterId: string
  hpMultiplier: number
  atkMultiplier: number
  defMultiplier: number
  xpReward: number
  goldReward: number
}

export interface CombatDifficulty {
  name: string
  hpMultiplier: number
  atkMultiplier: number
  defMultiplier: number
  xpMultiplier: number
  goldMultiplier: number
}

export interface CombatTimers {
  turnTimeoutMs: number
  waveIntroMs: number
  waveOutroMs: number
  bossIntroMs: number
}

export const DIFFICULTIES: Record<string, CombatDifficulty> = {
  easy: {
    name: 'Easy',
    hpMultiplier: 0.75,
    atkMultiplier: 0.75,
    defMultiplier: 1.25,
    xpMultiplier: 0.8,
    goldMultiplier: 0.8,
  },
  normal: {
    name: 'Normal',
    hpMultiplier: 1.0,
    atkMultiplier: 1.0,
    defMultiplier: 1.0,
    xpMultiplier: 1.0,
    goldMultiplier: 1.0,
  },
  hard: {
    name: 'Hard',
    hpMultiplier: 1.5,
    atkMultiplier: 1.3,
    defMultiplier: 0.8,
    xpMultiplier: 1.5,
    goldMultiplier: 1.3,
  },
  nightmare: {
    name: 'Nightmare',
    hpMultiplier: 2.5,
    atkMultiplier: 1.8,
    defMultiplier: 0.6,
    xpMultiplier: 2.5,
    goldMultiplier: 2.0,
  },
}

export const COMBAT_TIMERS: CombatTimers = {
  turnTimeoutMs: 15000,
  waveIntroMs: 2000,
  waveOutroMs: 1500,
  bossIntroMs: 3000,
}

export const WAVE_CONFIGS: WaveConfig[] = [
  { waveNumber: 1, monsterCount: 3, monsterIds: ['grunt', 'grunt', 'scout'], hpScale: 1.0, atkScale: 1.0, defScale: 1.0, spdScale: 1.0, xpReward: 50, goldReward: 10 },
  { waveNumber: 2, monsterCount: 4, monsterIds: ['grunt', 'grunt', 'scout', 'archer'], hpScale: 1.1, atkScale: 1.1, defScale: 1.0, spdScale: 1.05, xpReward: 75, goldReward: 15 },
  { waveNumber: 3, monsterCount: 4, monsterIds: ['grunt', 'scout', 'archer', 'mage'], hpScale: 1.2, atkScale: 1.15, defScale: 1.05, spdScale: 1.1, xpReward: 100, goldReward: 20 },
  { waveNumber: 4, monsterCount: 5, monsterIds: ['grunt', 'grunt', 'archer', 'mage', 'shield'], hpScale: 1.3, atkScale: 1.2, defScale: 1.1, spdScale: 1.1, xpReward: 130, goldReward: 25 },
  { waveNumber: 5, monsterCount: 5, monsterIds: ['scout', 'scout', 'archer', 'mage', 'shield'], hpScale: 1.4, atkScale: 1.25, defScale: 1.15, spdScale: 1.15, xpReward: 160, goldReward: 30 },
  { waveNumber: 6, monsterCount: 6, monsterIds: ['grunt', 'scout', 'archer', 'mage', 'shield', 'brute'], hpScale: 1.5, atkScale: 1.3, defScale: 1.2, spdScale: 1.15, xpReward: 200, goldReward: 40 },
  { waveNumber: 7, monsterCount: 6, monsterIds: ['scout', 'scout', 'archer', 'mage', 'brute', 'brute'], hpScale: 1.6, atkScale: 1.35, defScale: 1.2, spdScale: 1.2, xpReward: 250, goldReward: 50 },
  { waveNumber: 8, monsterCount: 7, monsterIds: ['grunt', 'scout', 'archer', 'mage', 'shield', 'brute', 'healer'], hpScale: 1.7, atkScale: 1.4, defScale: 1.25, spdScale: 1.2, xpReward: 300, goldReward: 60 },
  { waveNumber: 9, monsterCount: 7, monsterIds: ['scout', 'archer', 'mage', 'shield', 'brute', 'healer', 'shadow'], hpScale: 1.8, atkScale: 1.45, defScale: 1.25, spdScale: 1.25, xpReward: 360, goldReward: 70 },
  { waveNumber: 10, monsterCount: 8, monsterIds: ['grunt', 'scout', 'archer', 'mage', 'shield', 'brute', 'healer', 'shadow'], hpScale: 2.0, atkScale: 1.5, defScale: 1.3, spdScale: 1.25, xpReward: 450, goldReward: 90 },
]

export const BOSS_CONFIGS: Record<number, BossConfig> = {
  5: { waveNumber: 5, monsterId: 'boss-warden', hpMultiplier: 3.0, atkMultiplier: 1.5, defMultiplier: 1.5, xpReward: 500, goldReward: 100 },
  10: { waveNumber: 10, monsterId: 'boss-tyrant', hpMultiplier: 5.0, atkMultiplier: 2.0, defMultiplier: 1.8, xpReward: 1000, goldReward: 250 },
}

export const MAX_WAVE = 10
export const BASE_HP = 100
export const BASE_ATK = 10
export const BASE_DEF = 5
export const BASE_SPD = 3