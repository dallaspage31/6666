import { describe, expect, it } from 'vitest'

import { CRAFTING_RECIPES, canCraft, craft, getRecipeById } from './crafting'

describe('getRecipeById', () => {
  it('returns the matching recipe', () => {
    expect(getRecipeById('recipe_iron_sword')?.resultItemId).toBe('item_iron_sword')
  })

  it('returns undefined for an unknown id', () => {
    expect(getRecipeById('nope')).toBeUndefined()
  })
})

describe('CRAFTING_RECIPES', () => {
  it('has unique ids and at least one material per recipe', () => {
    const ids = CRAFTING_RECIPES.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const recipe of CRAFTING_RECIPES) {
      expect(recipe.materials.length).toBeGreaterThan(0)
      expect(recipe.resultCount).toBeGreaterThan(0)
    }
  })
})

describe('canCraft', () => {
  const recipe = getRecipeById('recipe_steel_set')!

  it('is true when every material meets the required quantity', () => {
    expect(canCraft(recipe, { item_iron_ore: 5, item_iron_sword: 1 })).toBe(true)
    expect(canCraft(recipe, { item_iron_ore: 50, item_iron_sword: 9 })).toBe(true)
  })

  it('is false when a material is missing or short', () => {
    expect(canCraft(recipe, { item_iron_ore: 5 })).toBe(false)
    expect(canCraft(recipe, { item_iron_ore: 4, item_iron_sword: 1 })).toBe(false)
    expect(canCraft(recipe, {})).toBe(false)
  })
})

describe('craft', () => {
  it('reports failure for an unknown recipe without touching the inventory', () => {
    const inventory = { item_iron_ore: 3 }
    const result = craft('missing_recipe', inventory)
    expect(result.result).toBe('failure')
    expect(result.itemsCrafted).toEqual([])
    expect(result.xpGained).toBe(0)
    expect(inventory).toEqual({ item_iron_ore: 3 })
  })

  it('reports insufficient materials without consuming anything', () => {
    const inventory = { item_iron_ore: 2 }
    const result = craft('recipe_iron_sword', inventory)
    expect(result.result).toBe('insufficient-materials')
    expect(result.goldSpent).toBe(0)
    expect(inventory).toEqual({ item_iron_ore: 2 })
  })

  it('consumes materials and returns the crafted items on success', () => {
    const inventory = { item_iron_ore: 5 }
    const result = craft('recipe_iron_sword', inventory)
    expect(result.result).toBe('success')
    expect(result.itemsCrafted).toEqual(['item_iron_sword'])
    expect(result.materialsConsumed).toEqual(['item_iron_ore'])
    expect(result.xpGained).toBe(25)
    expect(result.goldSpent).toBe(5)
    expect(inventory).toEqual({ item_iron_ore: 2 })
  })

  it('deletes inventory entries that are fully consumed', () => {
    const inventory = { item_iron_ore: 3 }
    craft('recipe_iron_sword', inventory)
    expect(inventory).toEqual({})
  })

  it('emits one entry per resultCount for multi-output recipes', () => {
    const result = craft('recipe_health_potion', { item_iron_ore: 1 })
    expect(result.itemsCrafted).toEqual([
      'item_health_potion',
      'item_health_potion',
      'item_health_potion',
    ])
  })

  it('consumes every material of a multi-material recipe', () => {
    const inventory = { item_dragon_scale: 4, item_steel_helm: 2, item_iron_ore: 3 }
    const result = craft('recipe_phoenix_gauntlets', inventory)
    expect(result.result).toBe('success')
    expect(inventory).toEqual({ item_dragon_scale: 2, item_steel_helm: 1 })
  })
})
