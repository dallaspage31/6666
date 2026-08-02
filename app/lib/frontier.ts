import type { FrontierModifier } from './combat-config'
import { FRONTIER_MODIFIERS } from './combat-config'

export type FrontierTemplate = 'Vanguard Clash' | 'Swarm Rush' | 'Shield Wall' | 'Ranged Nest' | 'Elite Escort' | 'Healer Core' | 'Twin Threat' | 'Checkpoint Guardian'
export type BossAspect = 'Fury' | 'Fortress' | 'Legion' | 'Void' | 'Fortune'
export type FrontierPolicy = 'push' | 'farm' | 'safePush' | 'greedy'

export interface FrontierScaling {
  hp: number
  damage: number
  reward: number
  mantissa: number
  exponent: number
}

export interface FrontierEncounter {
  depth: number
  seed: string
  biome: string
  template: FrontierTemplate
  modifiers: FrontierModifier[]
  bossAspect: BossAspect | null
  monsterIds: string[]
  scaling: FrontierScaling
  checkpoint: boolean
}

const templates: FrontierTemplate[] = ['Vanguard Clash', 'Swarm Rush', 'Shield Wall', 'Ranged Nest', 'Elite Escort', 'Healer Core', 'Twin Threat', 'Checkpoint Guardian']
const aspects: BossAspect[] = ['Fury', 'Fortress', 'Legion', 'Void', 'Fortune']
const biomes = ['Verdant Wilds', 'Ember Reach', 'Frozen Crown', 'Moonlit Marsh', 'Astral Ruins', 'Void Frontier']

function hash(seed: string, channel: number): number {
  let h = 2166136261 ^ channel
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 5
  return h >>> 0
}

function random(seed: string, channel: number): number {
  let value = hash(seed, channel) + 0x6d2b79f5
  value = Math.imul(value ^ value >>> 15, value | 1)
  value ^= value + Math.imul(value ^ value >>> 7, value | 61)
  return ((value ^ value >>> 14) >>> 0) / 4294967296
}

export function formatFrontierScale(value: FrontierScaling): string {
  return value.exponent === 0 ? value.mantissa.toFixed(2) : `${value.mantissa.toFixed(1)}e${value.exponent}`
}

export function getFrontierEncounter(runSeed: string, depth: number): FrontierEncounter {
  const safeDepth = Math.max(1, Math.floor(depth))
  const seed = `${runSeed}:${safeDepth}`
  const template = templates[Math.floor(random(seed, 1) * templates.length)]
  const modifierCount = 1 + (random(seed, 2) > 0.65 ? 1 : 0)
  const modifiers = Array.from({ length: modifierCount }, (_, index) => FRONTIER_MODIFIERS[Math.floor(random(seed, 10 + index) * FRONTIER_MODIFIERS.length)])
    .filter((modifier, index, all) => all.indexOf(modifier) === index)
  const checkpoint = safeDepth % 10 === 0
  const bossAspect = checkpoint ? aspects[Math.floor(random(seed, 3) * aspects.length)] : null
  const rawScale = Math.pow(1.085, Math.min(safeDepth, 5000))
  const exponent = Math.floor(Math.log10(rawScale))
  const mantissa = rawScale / Math.pow(10, exponent)
  const monsterIds = template === 'Swarm Rush' ? ['grunt', 'grunt', 'scout', 'scout', 'grunt'] : template === 'Ranged Nest' ? ['archer', 'archer', 'mage', 'archer'] : template === 'Twin Threat' ? ['brute', 'shadow'] : ['grunt', 'shield', 'scout']
  return {
    depth: safeDepth,
    seed,
    biome: biomes[Math.floor(random(seed, 4) * biomes.length)],
    template,
    modifiers,
    bossAspect,
    monsterIds,
    scaling: { hp: Math.min(1e12, rawScale), damage: Math.min(1e10, rawScale * 0.92), reward: Math.min(1e15, rawScale * 1.15), mantissa, exponent },
    checkpoint,
  }
}
