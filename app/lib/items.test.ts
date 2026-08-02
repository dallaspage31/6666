import { describe, expect, it } from 'vitest'

import {
  ITEM_DATABASE,
  ItemRarity,
  RARITY_COLORS,
  RARITY_MULTIPLIERS,
  getEquipmentBySlot,
  getItemById,
  getItemsByRarity,
} from './items'

const rarities = Object.keys(RARITY_MULTIPLIERS) as ItemRarity[]

describe('ITEM_DATABASE', () => {
  it('has unique ids', () => {
    const ids = ITEM_DATABASE.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives equipment a slot and everything else none', () => {
    for (const item of ITEM_DATABASE) {
      if (item.type === 'equipment') {
        expect(item.slot).not.toBeNull()
      } else {
        expect(item.slot).toBeNull()
      }
    }
  })
})

describe('rarity tables', () => {
  it('define a multiplier and colour for every rarity', () => {
    expect(Object.keys(RARITY_COLORS).sort()).toEqual([...rarities].sort())
  })

  it('increase monotonically with rarity', () => {
    const ordered: ItemRarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Cosmic']
    for (let i = 1; i < ordered.length; i++) {
      expect(RARITY_MULTIPLIERS[ordered[i]]).toBeGreaterThan(RARITY_MULTIPLIERS[ordered[i - 1]])
    }
  })
})

describe('getItemById', () => {
  it('finds an existing item', () => {
    expect(getItemById('item_shadow_blade')?.name).toBe('Shadow Blade')
  })

  it('returns undefined for an unknown id', () => {
    expect(getItemById('item_nope')).toBeUndefined()
  })
})

describe('getItemsByRarity', () => {
  it('returns only items of that rarity', () => {
    const epics = getItemsByRarity('Epic')
    expect(epics.length).toBeGreaterThan(0)
    expect(epics.every((item) => item.rarity === 'Epic')).toBe(true)
  })

  it('partitions the database across all rarities', () => {
    const total = rarities.reduce((sum, r) => sum + getItemsByRarity(r).length, 0)
    expect(total).toBe(ITEM_DATABASE.length)
  })
})

describe('getEquipmentBySlot', () => {
  it('returns equipment for the requested slot only', () => {
    const helmets = getEquipmentBySlot('Helmet')
    expect(helmets.map((item) => item.id)).toEqual(['item_steel_helm', 'item_cosmic_crown'])
    expect(helmets.every((item) => item.type === 'equipment')).toBe(true)
  })

  it('returns an empty array for slots with no equipment', () => {
    expect(getEquipmentBySlot('Cape')).toEqual([])
  })
})
