import { findById, filterBy } from './collection'
import type { Rarity } from './rarity'

export { RARITY_COLORS, RARITY_MULTIPLIERS } from './rarity'

export type ItemSlot = 'Weapon' | 'Helmet' | 'Armor' | 'Gloves' | 'Boots' | 'Belt' | 'Ring' | 'Amulet' | 'Cape' | 'Artifact'

export type ItemRarity = Rarity

export type ItemType = 'equipment' | 'consumable' | 'material'

export interface Item {
  id: string
  name: string
  type: ItemType
  rarity: ItemRarity
  slot: ItemSlot | null
  atk: number
  def: number
  hp: number
  spd: number
  icon: string
  description: string
  setId: string | null
}

export interface EquipmentItem extends Item {
  type: 'equipment'
  slot: ItemSlot
}

export interface ConsumableItem extends Item {
  type: 'consumable'
  slot: null
  effect: string
  magnitude: number
}

export interface MaterialItem extends Item {
  type: 'material'
  slot: null
  craftable: boolean
}

export const ITEM_DATABASE: Item[] = [
  { id: 'item_iron_sword', name: 'Iron Sword', type: 'equipment', rarity: 'Common', slot: 'Weapon', atk: 10, def: 0, hp: 0, spd: 0, icon: '⚔️', description: 'A basic iron blade for beginners.', setId: null },
  { id: 'item_steel_helm', name: 'Steel Helm', type: 'equipment', rarity: 'Common', slot: 'Helmet', atk: 0, def: 8, hp: 20, spd: 0, icon: '🪖', description: 'Sturdy steel helmet offering solid protection.', setId: 'set_steel' },
  { id: 'item_steel_armor', name: 'Steel Armor', type: 'equipment', rarity: 'Common', slot: 'Armor', atk: 0, def: 12, hp: 40, spd: -1, icon: '🛡️', description: 'Weighted steel plate armor.', setId: 'set_steel' },
  { id: 'item_shadow_blade', name: 'Shadow Blade', type: 'equipment', rarity: 'Rare', slot: 'Weapon', atk: 25, def: 0, hp: 0, spd: 3, icon: '🗡️', description: 'A blade forged in shadow, swift and deadly.', setId: null },
  { id: 'item_dragon_plate', name: 'Dragon Plate', type: 'equipment', rarity: 'Epic', slot: 'Armor', atk: 5, def: 30, hp: 80, spd: -2, icon: '🐉', description: 'Armor forged from dragon scales.', setId: 'set_dragon' },
  { id: 'item_phoenix_gauntlets', name: 'Phoenix Gauntlets', type: 'equipment', rarity: 'Legendary', slot: 'Gloves', atk: 15, def: 10, hp: 30, spd: 2, icon: '🧤', description: 'Gauntlets imbued with phoenix flame.', setId: 'set_phoenix' },
  { id: 'item_cosmic_crown', name: 'Cosmic Crown', type: 'equipment', rarity: 'Cosmic', slot: 'Helmet', atk: 20, def: 20, hp: 50, spd: 1, icon: '👑', description: 'A crown forged from starlight itself.', setId: null },
  { id: 'item_health_potion', name: 'Health Potion', type: 'consumable', rarity: 'Common', slot: null, atk: 0, def: 0, hp: 0, spd: 0, icon: '🧪', description: 'Restores 50 HP.', setId: null },
  { id: 'item_mana_crystal', name: 'Mana Crystal', type: 'consumable', rarity: 'Uncommon', slot: null, atk: 0, def: 0, hp: 0, spd: 0, icon: '💎', description: 'Restores 30 SP.', setId: null },
  { id: 'item_iron_ore', name: 'Iron Ore', type: 'material', rarity: 'Common', slot: null, atk: 0, def: 0, hp: 0, spd: 0, icon: '⛏️', description: 'Raw iron ore for crafting.', setId: null },
  { id: 'item_dragon_scale', name: 'Dragon Scale', type: 'material', rarity: 'Epic', slot: null, atk: 0, def: 0, hp: 0, spd: 0, icon: '🐉', description: 'A scale from a ancient dragon.', setId: null },
  { id: 'item_star_fragment', name: 'Star Fragment', type: 'material', rarity: 'Cosmic', slot: null, atk: 0, def: 0, hp: 0, spd: 0, icon: '✨', description: 'A shard of fallen starlight.', setId: null },
]

export function getItemById(id: string): Item | undefined {
  return findById(ITEM_DATABASE, id)
}

export function getItemsByRarity(rarity: ItemRarity): Item[] {
  return filterBy(ITEM_DATABASE, 'rarity', rarity)
}

export function getEquipmentBySlot(slot: ItemSlot): EquipmentItem[] {
  return ITEM_DATABASE.filter((item): item is EquipmentItem => item.type === 'equipment' && item.slot === slot)
}