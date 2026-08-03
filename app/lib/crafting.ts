export type CraftingResult =
  'success' | 'partial' | 'failure' | 'insufficient-materials'

export interface CraftingRecipe {
  id: string
  name: string
  resultItemId: string
  resultCount: number
  materials: CraftingMaterial[]
  xpReward: number
  goldCost: number
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Cosmic'
}

export interface CraftingMaterial {
  itemId: string
  quantity: number
}

export interface CraftingResultDetail {
  recipeId: string
  result: CraftingResult
  itemsCrafted: string[]
  materialsConsumed: string[]
  xpGained: number
  goldSpent: number
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'recipe_iron_sword',
    name: 'Forge Iron Sword',
    resultItemId: 'item_iron_sword',
    resultCount: 1,
    materials: [{ itemId: 'item_iron_ore', quantity: 3 }],
    xpReward: 25,
    goldCost: 5,
    rarity: 'Common',
  },
  {
    id: 'recipe_steel_set',
    name: 'Steel Armor Set',
    resultItemId: 'item_steel_armor',
    resultCount: 1,
    materials: [
      { itemId: 'item_iron_ore', quantity: 5 },
      { itemId: 'item_iron_sword', quantity: 1 },
    ],
    xpReward: 60,
    goldCost: 15,
    rarity: 'Common',
  },
  {
    id: 'recipe_shadow_blade',
    name: 'Refine Shadow Blade',
    resultItemId: 'item_shadow_blade',
    resultCount: 1,
    materials: [
      { itemId: 'item_iron_sword', quantity: 2 },
      { itemId: 'item_iron_ore', quantity: 4 },
    ],
    xpReward: 100,
    goldCost: 30,
    rarity: 'Rare',
  },
  {
    id: 'recipe_dragon_plate',
    name: 'Forge Dragon Plate',
    resultItemId: 'item_dragon_plate',
    resultCount: 1,
    materials: [
      { itemId: 'item_dragon_scale', quantity: 3 },
      { itemId: 'item_steel_armor', quantity: 1 },
    ],
    xpReward: 200,
    goldCost: 80,
    rarity: 'Epic',
  },
  {
    id: 'recipe_phoenix_gauntlets',
    name: 'Craft Phoenix Gauntlets',
    resultItemId: 'item_phoenix_gauntlets',
    resultCount: 1,
    materials: [
      { itemId: 'item_dragon_scale', quantity: 2 },
      { itemId: 'item_steel_helm', quantity: 1 },
      { itemId: 'item_iron_ore', quantity: 3 },
    ],
    xpReward: 350,
    goldCost: 150,
    rarity: 'Legendary',
  },
  {
    id: 'recipe_cosmic_crown',
    name: 'Assemble Cosmic Crown',
    resultItemId: 'item_cosmic_crown',
    resultCount: 1,
    materials: [
      { itemId: 'item_star_fragment', quantity: 2 },
      { itemId: 'item_dragon_scale', quantity: 1 },
      { itemId: 'item_phoenix_gauntlets', quantity: 1 },
    ],
    xpReward: 600,
    goldCost: 300,
    rarity: 'Cosmic',
  },
  {
    id: 'recipe_health_potion',
    name: 'Brew Health Potion',
    resultItemId: 'item_health_potion',
    resultCount: 3,
    materials: [{ itemId: 'item_iron_ore', quantity: 1 }],
    xpReward: 10,
    goldCost: 2,
    rarity: 'Common',
  },
  {
    id: 'recipe_mana_crystal',
    name: 'Condense Mana Crystal',
    resultItemId: 'item_mana_crystal',
    resultCount: 2,
    materials: [{ itemId: 'item_star_fragment', quantity: 1 }],
    xpReward: 30,
    goldCost: 10,
    rarity: 'Uncommon',
  },
]

export function getRecipeById(id: string): CraftingRecipe | undefined {
  return CRAFTING_RECIPES.find((recipe) => recipe.id === id)
}

export function canCraft(
  recipe: CraftingRecipe,
  inventory: Record<string, number>,
): boolean {
  return recipe.materials.every(
    (mat) => (inventory[mat.itemId] ?? 0) >= mat.quantity,
  )
}

export function craft(
  recipeId: string,
  inventory: Record<string, number>,
): CraftingResultDetail {
  const recipe = getRecipeById(recipeId)
  if (!recipe) {
    return {
      recipeId,
      result: 'failure',
      itemsCrafted: [],
      materialsConsumed: [],
      xpGained: 0,
      goldSpent: 0,
    }
  }

  if (!canCraft(recipe, inventory)) {
    return {
      recipeId,
      result: 'insufficient-materials',
      itemsCrafted: [],
      materialsConsumed: [],
      xpGained: 0,
      goldSpent: 0,
    }
  }

  for (const mat of recipe.materials) {
    inventory[mat.itemId] = (inventory[mat.itemId] ?? 0) - mat.quantity
    if (inventory[mat.itemId] <= 0) {
      delete inventory[mat.itemId]
    }
  }

  const itemsCrafted: string[] = []
  for (let i = 0; i < recipe.resultCount; i++) {
    itemsCrafted.push(recipe.resultItemId)
  }

  return {
    recipeId,
    result: 'success',
    itemsCrafted,
    materialsConsumed: recipe.materials.map((m) => m.itemId),
    xpGained: recipe.xpReward,
    goldSpent: recipe.goldCost,
  }
}
