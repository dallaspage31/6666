import type { CombatElement } from './combat-types'
import type { HeroRarity } from './hero-rarity'

export type RuneStat = 'hp' | 'atk' | 'def' | 'spd'

export interface Rune {
  id: string
  name: string
  rarity: HeroRarity
  stat: RuneStat
  value: number
  element?: CombatElement
}

export const RUNE_CATALOG: Rune[] = [
  { id: 'rune-vitality', name: 'Rune of Vitality', rarity: 'Common', stat: 'hp', value: 18 },
  { id: 'rune-might', name: 'Rune of Might', rarity: 'Uncommon', stat: 'atk', value: 4 },
  { id: 'rune-guard', name: 'Rune of Guarding', rarity: 'Rare', stat: 'def', value: 5 },
  { id: 'rune-swift', name: 'Rune of Swiftness', rarity: 'Epic', stat: 'spd', value: 3 },
]

export function scaleRune(rune: Rune, level: number): Rune {
  return { ...rune, value: rune.value + Math.floor(Math.max(0, level - 1) * rune.value * 0.08) }
}
