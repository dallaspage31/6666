export type GemType =
  'Ruby' | 'Sapphire' | 'Emerald' | 'Topaz' | 'Amethyst' | 'Onyx' | 'Diamond'

export type EngravingType =
  | 'War Mark'
  | 'Bulwark Sigil'
  | 'Vital Glyph'
  | 'Wind Script'
  | 'Hunter Etching'
  | 'Arcane Seal'

export type MaterialType =
  | 'Iron Ore'
  | 'Gold Dust'
  | 'Essence of Life'
  | 'Shadow Fragment'
  | 'Crystal Shard'
  | 'Dragon Scale'
  | 'Star Fragment'

export type ItemType =
  'Weapon' | 'Armor' | 'Accessory' | 'Material' | 'Gem' | 'Engraving' | 'Potion'

export const GEM_TYPES: GemType[] = [
  'Ruby',
  'Sapphire',
  'Emerald',
  'Topaz',
  'Amethyst',
  'Onyx',
  'Diamond',
]

export const ENGRAVING_TYPES: EngravingType[] = [
  'War Mark',
  'Bulwark Sigil',
  'Vital Glyph',
  'Wind Script',
  'Hunter Etching',
  'Arcane Seal',
]

export const GEM_STATS: Record<
  GemType,
  { atk: number; def: number; hp: number; spd: number }
> = {
  Ruby: { atk: 8, def: 0, hp: 0, spd: 0 },
  Sapphire: { atk: 0, def: 8, hp: 0, spd: 0 },
  Emerald: { atk: 0, def: 0, hp: 15, spd: 0 },
  Topaz: { atk: 0, def: 0, hp: 0, spd: 8 },
  Amethyst: { atk: 5, def: 3, hp: 5, spd: 0 },
  Onyx: { atk: 0, def: 5, hp: 10, spd: 0 },
  Diamond: { atk: 10, def: 10, hp: 20, spd: 5 },
}

export const GEM_COLORS: Record<GemType, string> = {
  Ruby: 'text-red-400 border-red-500 bg-red-950/40',
  Sapphire: 'text-blue-400 border-blue-500 bg-blue-950/40',
  Emerald: 'text-green-400 border-green-500 bg-green-950/40',
  Topaz: 'text-yellow-400 border-yellow-500 bg-yellow-950/40',
  Amethyst: 'text-purple-400 border-purple-500 bg-purple-950/40',
  Onyx: 'text-gray-300 border-gray-400 bg-gray-950/40',
  Diamond: 'text-cyan-300 border-cyan-400 bg-cyan-950/40',
}

export const ENGRAVING_STATS: Record<
  EngravingType,
  { atk: number; def: number; hp: number; spd: number }
> = {
  'War Mark': { atk: 12, def: 0, hp: 0, spd: 0 },
  'Bulwark Sigil': { atk: 0, def: 12, hp: 0, spd: 0 },
  'Vital Glyph': { atk: 0, def: 0, hp: 25, spd: 0 },
  'Wind Script': { atk: 0, def: 0, hp: 0, spd: 12 },
  'Hunter Etching': { atk: 6, def: 0, hp: 0, spd: 6 },
  'Arcane Seal': { atk: 8, def: 4, hp: 8, spd: 4 },
}

export const ENGRAVING_COLORS: Record<EngravingType, string> = {
  'War Mark': 'text-red-400 border-red-500 bg-red-950/40',
  'Bulwark Sigil': 'text-blue-400 border-blue-500 bg-blue-950/40',
  'Vital Glyph': 'text-green-400 border-green-500 bg-green-950/40',
  'Wind Script': 'text-yellow-400 border-yellow-500 bg-yellow-950/40',
  'Hunter Etching': 'text-orange-400 border-orange-500 bg-orange-950/40',
  'Arcane Seal': 'text-purple-400 border-purple-500 bg-purple-950/40',
}

export interface CraftingRecipe {
  id: string
  name: string
  resultType: ItemType
  resultSlot: string
  resultRarity: string
  materials: { type: MaterialType; quantity: number }[]
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'cr1',
    name: 'Iron Sword',
    resultType: 'Weapon',
    resultSlot: 'Main Hand',
    resultRarity: 'Uncommon',
    materials: [
      { type: 'Iron Ore', quantity: 3 },
      { type: 'Gold Dust', quantity: 1 },
    ],
  },
  {
    id: 'cr2',
    name: 'Steel Shield',
    resultType: 'Weapon',
    resultSlot: 'Off Hand',
    resultRarity: 'Uncommon',
    materials: [
      { type: 'Iron Ore', quantity: 4 },
      { type: 'Crystal Shard', quantity: 1 },
    ],
  },
  {
    id: 'cr3',
    name: 'Leather Vest',
    resultType: 'Armor',
    resultSlot: 'Chest',
    resultRarity: 'Uncommon',
    materials: [
      { type: 'Essence of Life', quantity: 2 },
      { type: 'Shadow Fragment', quantity: 1 },
    ],
  },
  {
    id: 'cr4',
    name: 'Iron Helm',
    resultType: 'Armor',
    resultSlot: 'Helmet',
    resultRarity: 'Common',
    materials: [{ type: 'Iron Ore', quantity: 2 }],
  },
  {
    id: 'cr5',
    name: 'Gold Ring',
    resultType: 'Accessory',
    resultSlot: 'Ring',
    resultRarity: 'Rare',
    materials: [
      { type: 'Gold Dust', quantity: 5 },
      { type: 'Crystal Shard', quantity: 2 },
    ],
  },
  {
    id: 'cr6',
    name: 'Flame Sword',
    resultType: 'Weapon',
    resultSlot: 'Main Hand',
    resultRarity: 'Rare',
    materials: [
      { type: 'Iron Ore', quantity: 8 },
      { type: 'Star Fragment', quantity: 2 },
    ],
  },
  {
    id: 'cr7',
    name: 'Dragon Scale Armor',
    resultType: 'Armor',
    resultSlot: 'Chest',
    resultRarity: 'Legendary',
    materials: [
      { type: 'Dragon Scale', quantity: 4 },
      { type: 'Star Fragment', quantity: 3 },
    ],
  },
]

export const ALL_MATERIALS: MaterialType[] = [
  'Iron Ore',
  'Gold Dust',
  'Essence of Life',
  'Shadow Fragment',
  'Crystal Shard',
  'Dragon Scale',
  'Star Fragment',
]
