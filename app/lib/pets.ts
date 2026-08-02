import { findById } from './collection'
import type { Rarity } from './rarity'

export type PetAbilityType = 'passive' | 'active' | 'trigger'

export interface PetAbility {
  id: string
  name: string
  type: PetAbilityType
  description: string
  statBonus: { atk: number; def: number; hp: number; spd: number }
  triggerChance: number
  cooldown: number
}

export interface Pet {
  id: string
  name: string
  rarity: Rarity
  level: number
  xp: number
  ability: PetAbility
  icon: string
  description: string
}

export interface PetCombatBonus {
  petId: string
  ownerId: string
  atkBonus: number
  defBonus: number
  hpBonus: number
  spdBonus: number
}

export const PET_DATABASE: Pet[] = [
  {
    id: 'pet_sparrow',
    name: 'Sparrow',
    rarity: 'Common',
    level: 1,
    xp: 0,
    ability: {
      id: 'ability_sparrow_scout',
      name: 'Scout',
      type: 'passive',
      description: 'Increases hero SPD by 2.',
      statBonus: { atk: 0, def: 0, hp: 0, spd: 2 },
      triggerChance: 0,
      cooldown: 0,
    },
    icon: '🐦',
    description: 'A quick little sparrow that scouts ahead.',
  },
  {
    id: 'pet_wolf',
    name: 'Iron Wolf',
    rarity: 'Uncommon',
    level: 1,
    xp: 0,
    ability: {
      id: 'ability_wolf_fang',
      name: 'Fang Bite',
      type: 'active',
      description: 'Bites an enemy for bonus ATK damage.',
      statBonus: { atk: 5, def: 0, hp: 0, spd: 0 },
      triggerChance: 0.3,
      cooldown: 3,
    },
    icon: '🐺',
    description: 'A loyal iron-furred wolf companion.',
  },
  {
    id: 'pet_crystal_lizard',
    name: 'Crystal Lizard',
    rarity: 'Rare',
    level: 1,
    xp: 0,
    ability: {
      id: 'ability_lizard_shield',
      name: 'Crystal Shield',
      type: 'trigger',
      description: 'Grants DEF boost when hero takes damage.',
      statBonus: { atk: 0, def: 8, hp: 10, spd: 0 },
      triggerChance: 0.25,
      cooldown: 5,
    },
    icon: '🦎',
    description: 'A crystalline lizard that shields its allies.',
  },
  {
    id: 'pet_phoenix_chick',
    name: 'Phoenix Chick',
    rarity: 'Epic',
    level: 1,
    xp: 0,
    ability: {
      id: 'ability_phoenix_renewal',
      name: 'Renewal',
      type: 'trigger',
      description: 'Heals the hero when they drop below 30% HP.',
      statBonus: { atk: 0, def: 0, hp: 25, spd: 0 },
      triggerChance: 0.2,
      cooldown: 8,
    },
    icon: '🔥',
    description: 'A fledgling phoenix that heals its allies.',
  },
  {
    id: 'pet_dragon_hatchling',
    name: 'Dragon Hatchling',
    rarity: 'Legendary',
    level: 1,
    xp: 0,
    ability: {
      id: 'ability_dragon_breath',
      name: 'Dragon Breath',
      type: 'active',
      description: 'Unleashes dragon fire dealing massive damage.',
      statBonus: { atk: 15, def: 5, hp: 20, spd: 3 },
      triggerChance: 0.15,
      cooldown: 6,
    },
    icon: '🐲',
    description: 'A mighty dragon hatchling by your side.',
  },
  {
    id: 'pet_star_fox',
    name: 'Star Fox',
    rarity: 'Cosmic',
    level: 1,
    xp: 0,
    ability: {
      id: 'ability_star_aura',
      name: 'Star Aura',
      type: 'passive',
      description: 'All stats increased by 15% while this pet is active.',
      statBonus: { atk: 10, def: 10, hp: 15, spd: 5 },
      triggerChance: 0,
      cooldown: 0,
    },
    icon: '🌟',
    description: 'A fox woven from starlight and cosmic energy.',
  },
]

export function getPetById(id: string): Pet | undefined {
  return findById(PET_DATABASE, id)
}

export function getPetCombatBonus(pet: Pet): PetCombatBonus {
  return {
    petId: pet.id,
    ownerId: '',
    atkBonus: pet.ability.statBonus.atk,
    defBonus: pet.ability.statBonus.def,
    hpBonus: pet.ability.statBonus.hp,
    spdBonus: pet.ability.statBonus.spd,
  }
}