export type RuneElement =
  'fire' | 'water' | 'earth' | 'wind' | 'light' | 'shadow' | 'cosmic'

export type RuneSlot = 'offensive' | 'defensive' | 'growth' | 'utility'

export interface Rune {
  id: string
  name: string
  element: RuneElement
  slot: RuneSlot
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Cosmic'
  statBonus: { atk: number; def: number; hp: number; spd: number }
  effect: string
  effectValue: number
  icon: string
  description: string
}

export interface SocketedRune {
  runeId: string
  socketIndex: number
}

export const RUNE_DATABASE: Rune[] = [
  {
    id: 'rune_fire_bolt',
    name: 'Fire Bolt',
    element: 'fire',
    slot: 'offensive',
    rarity: 'Common',
    statBonus: { atk: 5, def: 0, hp: 0, spd: 0 },
    effect: 'burn',
    effectValue: 10,
    icon: '🔥',
    description: 'Deals fire damage over time.',
  },
  {
    id: 'rune_frost_shield',
    name: 'Frost Shield',
    element: 'water',
    slot: 'defensive',
    rarity: 'Common',
    statBonus: { atk: 0, def: 5, hp: 10, spd: 0 },
    effect: 'freeze',
    effectValue: 0.15,
    icon: '❄️',
    description: 'Creates a frost barrier that slows enemies.',
  },
  {
    id: 'rune_earth_shield',
    name: 'Earth Shield',
    element: 'earth',
    slot: 'defensive',
    rarity: 'Uncommon',
    statBonus: { atk: 0, def: 8, hp: 20, spd: 0 },
    effect: 'absorb',
    effectValue: 0.2,
    icon: '🪨',
    description: 'Absorbs a portion of incoming damage.',
  },
  {
    id: 'rune_wind_step',
    name: 'Wind Step',
    element: 'wind',
    slot: 'utility',
    rarity: 'Uncommon',
    statBonus: { atk: 0, def: 0, hp: 0, spd: 4 },
    effect: 'dodge',
    effectValue: 0.1,
    icon: '💨',
    description: 'Increases dodge chance and movement speed.',
  },
  {
    id: 'rune_light_blessing',
    name: 'Light Blessing',
    element: 'light',
    slot: 'growth',
    rarity: 'Rare',
    statBonus: { atk: 3, def: 3, hp: 15, spd: 1 },
    effect: 'regen',
    effectValue: 5,
    icon: '☀️',
    description: 'Passively regenerates HP each turn.',
  },
  {
    id: 'rune_shadow_strike',
    name: 'Shadow Strike',
    element: 'shadow',
    slot: 'offensive',
    rarity: 'Rare',
    statBonus: { atk: 10, def: 0, hp: 0, spd: 2 },
    effect: 'crit',
    effectValue: 0.25,
    icon: '🌑',
    description: 'Increases critical hit chance significantly.',
  },
  {
    id: 'rune_cosmic_awareness',
    name: 'Cosmic Awareness',
    element: 'cosmic',
    slot: 'growth',
    rarity: 'Epic',
    statBonus: { atk: 5, def: 5, hp: 25, spd: 3 },
    effect: 'all-stats',
    effectValue: 0.15,
    icon: '🌌',
    description: 'Boosts all stats by a percentage.',
  },
  {
    id: 'rune_inferno',
    name: 'Inferno',
    element: 'fire',
    slot: 'offensive',
    rarity: 'Epic',
    statBonus: { atk: 15, def: 0, hp: 0, spd: 0 },
    effect: 'aoe-burn',
    effectValue: 20,
    icon: '🌋',
    description: 'Deals area-of-effect fire damage each turn.',
  },
  {
    id: 'rune_titan_wrath',
    name: 'Titan Wrath',
    element: 'earth',
    slot: 'offensive',
    rarity: 'Legendary',
    statBonus: { atk: 20, def: 10, hp: 30, spd: 0 },
    effect: 'stun',
    effectValue: 0.3,
    icon: '⛰️',
    description: 'Chance to stun enemies on attack.',
  },
  {
    id: 'rune_void_essence',
    name: 'Void Essence',
    element: 'shadow',
    slot: 'utility',
    rarity: 'Legendary',
    statBonus: { atk: 10, def: 10, hp: 20, spd: 5 },
    effect: 'life-steal',
    effectValue: 0.2,
    icon: '🌀',
    description: 'Converts a portion of damage dealt into HP recovered.',
  },
  {
    id: 'rune_absolute_zero',
    name: 'Absolute Zero',
    element: 'water',
    slot: 'defensive',
    rarity: 'Cosmic',
    statBonus: { atk: 5, def: 20, hp: 50, spd: 2 },
    effect: 'invulnerable',
    effectValue: 0.1,
    icon: '🧊',
    description: 'Grants a chance to become invulnerable for one turn.',
  },
  {
    id: 'rune_supernova',
    name: 'Supernova',
    element: 'cosmic',
    slot: 'offensive',
    rarity: 'Cosmic',
    statBonus: { atk: 25, def: 5, hp: 10, spd: 5 },
    effect: 'nuke',
    effectValue: 50,
    icon: '💥',
    description: 'Unleashes devastating cosmic energy on all enemies.',
  },
]

export function getRuneById(id: string): Rune | undefined {
  return RUNE_DATABASE.find((rune) => rune.id === id)
}

export function getRunesBySlot(slot: RuneSlot): Rune[] {
  return RUNE_DATABASE.filter((rune) => rune.slot === slot)
}

export function getRunesByElement(element: RuneElement): Rune[] {
  return RUNE_DATABASE.filter((rune) => rune.element === element)
}

export function getRuneMultiplier(rarity: Rune['rarity']): number {
  const multipliers: Record<Rune['rarity'], number> = {
    Common: 1,
    Uncommon: 1.3,
    Rare: 1.7,
    Epic: 2.2,
    Legendary: 3.0,
    Cosmic: 5.0,
  }
  return multipliers[rarity]
}
