export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Cosmic'

export const RARITIES: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Cosmic']

export const RARITY_MULTIPLIERS: Record<Rarity, number> = {
  Common: 1,
  Uncommon: 1.3,
  Rare: 1.7,
  Epic: 2.2,
  Legendary: 3.0,
  Cosmic: 5.0,
}

export const RARITY_COLORS: Record<Rarity, string> = {
  Common: 'bg-gray-500',
  Uncommon: 'bg-green-600',
  Rare: 'bg-blue-600',
  Epic: 'bg-purple-600',
  Legendary: 'bg-orange-600',
  Cosmic: 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500',
}

export const RARITY_TEXT_COLORS: Record<Rarity, string> = {
  Common: 'text-gray-300',
  Uncommon: 'text-green-200',
  Rare: 'text-blue-200',
  Epic: 'text-purple-200',
  Legendary: 'text-orange-200',
  Cosmic: 'text-white',
}

export const RARITY_BORDER_COLORS: Record<Rarity, string> = {
  Common: 'border-gray-500',
  Uncommon: 'border-green-500',
  Rare: 'border-blue-500',
  Epic: 'border-purple-500',
  Legendary: 'border-orange-500',
  Cosmic: 'border-transparent',
}

export const RARITY_BADGE_COLORS: Record<Rarity, string> = {
  Common: 'bg-gray-700 text-gray-300',
  Uncommon: 'bg-green-700 text-green-200',
  Rare: 'bg-blue-700 text-blue-200',
  Epic: 'bg-purple-700 text-purple-200',
  Legendary: 'bg-orange-700 text-orange-200',
  Cosmic: 'bg-gradient-to-r from-pink-600 to-cyan-600 text-white',
}

export function getRarityMultiplier(rarity: Rarity): number {
  return RARITY_MULTIPLIERS[rarity]
}
