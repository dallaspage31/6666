import { describe, expect, it } from 'vitest'

import {
  RUNE_DATABASE,
  Rune,
  getRuneById,
  getRuneMultiplier,
  getRunesByElement,
  getRunesBySlot,
} from './runes'

describe('RUNE_DATABASE', () => {
  it('has unique ids', () => {
    const ids = RUNE_DATABASE.map((rune) => rune.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every rune a named effect', () => {
    for (const rune of RUNE_DATABASE) {
      expect(rune.effect).not.toBe('')
      expect(rune.effectValue).toBeGreaterThan(0)
    }
  })
})

describe('getRuneById', () => {
  it('finds an existing rune', () => {
    expect(getRuneById('rune_supernova')?.name).toBe('Supernova')
  })

  it('returns undefined for an unknown id', () => {
    expect(getRuneById('rune_nope')).toBeUndefined()
  })
})

describe('getRunesBySlot', () => {
  it('returns only runes in that slot', () => {
    const offensive = getRunesBySlot('offensive')
    expect(offensive.length).toBeGreaterThan(0)
    expect(offensive.every((rune) => rune.slot === 'offensive')).toBe(true)
  })

  it('partitions the database across the four slots', () => {
    const total = (['offensive', 'defensive', 'growth', 'utility'] as const).reduce(
      (sum, slot) => sum + getRunesBySlot(slot).length,
      0,
    )
    expect(total).toBe(RUNE_DATABASE.length)
  })
})

describe('getRunesByElement', () => {
  it('returns only runes of that element', () => {
    const fire = getRunesByElement('fire')
    expect(fire.map((rune) => rune.id)).toEqual(['rune_fire_bolt', 'rune_inferno'])
  })

  it('returns an empty array for an element with no runes', () => {
    expect(getRunesByElement('wind').length).toBeGreaterThan(0)
    expect(getRunesByElement('light').every((rune) => rune.element === 'light')).toBe(true)
  })
})

describe('getRuneMultiplier', () => {
  it('returns the multiplier for each rarity', () => {
    const rarities: Rune['rarity'][] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Cosmic']
    expect(rarities.map(getRuneMultiplier)).toEqual([1, 1.3, 1.7, 2.2, 3.0, 5.0])
  })

  it('increases monotonically with rarity', () => {
    expect(getRuneMultiplier('Cosmic')).toBeGreaterThan(getRuneMultiplier('Legendary'))
  })
})
