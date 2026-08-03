export type RuneBranch = 'Power' | 'Defense' | 'Growth'

export interface Rune {
  id: string
  branch: RuneBranch
  name: string
  tier: number
  stat: string
  value: number
  cost: number
  description: string
}

export const RUNE_BRANCHES: RuneBranch[] = ['Power', 'Defense', 'Growth']

export const RUNE_BRANCH_COLORS: Record<RuneBranch, string> = {
  Power: 'text-red-400 border-red-500 bg-red-950/40',
  Defense: 'text-blue-400 border-blue-500 bg-blue-950/40',
  Growth: 'text-green-400 border-green-500 bg-green-950/40',
}

export const RUNES: Rune[] = [
  {
    id: 'rune-p1',
    branch: 'Power',
    name: 'Fury',
    tier: 1,
    stat: 'atk',
    value: 5,
    cost: 1,
    description: '+5 Attack',
  },
  {
    id: 'rune-p2',
    branch: 'Power',
    name: 'Might',
    tier: 2,
    stat: 'atk',
    value: 12,
    cost: 2,
    description: '+12 Attack',
  },
  {
    id: 'rune-p3',
    branch: 'Power',
    name: 'Dominance',
    tier: 3,
    stat: 'atk',
    value: 25,
    cost: 4,
    description: '+25 Attack',
  },
  {
    id: 'rune-p4',
    branch: 'Power',
    name: 'Annihilation',
    tier: 4,
    stat: 'atk',
    value: 45,
    cost: 7,
    description: '+45 Attack',
  },
  {
    id: 'rune-d1',
    branch: 'Defense',
    name: 'Barrier',
    tier: 1,
    stat: 'def',
    value: 5,
    cost: 1,
    description: '+5 Defense',
  },
  {
    id: 'rune-d2',
    branch: 'Defense',
    name: 'Fortitude',
    tier: 2,
    stat: 'def',
    value: 12,
    cost: 2,
    description: '+12 Defense',
  },
  {
    id: 'rune-d3',
    branch: 'Defense',
    name: 'Invincibility',
    tier: 3,
    stat: 'def',
    value: 25,
    cost: 4,
    description: '+25 Defense',
  },
  {
    id: 'rune-d4',
    branch: 'Defense',
    name: 'Aegis',
    tier: 4,
    stat: 'def',
    value: 45,
    cost: 7,
    description: '+45 Defense',
  },
  {
    id: 'rune-g1',
    branch: 'Growth',
    name: 'Vitality',
    tier: 1,
    stat: 'hp',
    value: 20,
    cost: 1,
    description: '+20 HP',
  },
  {
    id: 'rune-g2',
    branch: 'Growth',
    name: 'Endurance',
    tier: 2,
    stat: 'hp',
    value: 50,
    cost: 2,
    description: '+50 HP',
  },
  {
    id: 'rune-g3',
    branch: 'Growth',
    name: 'Regeneration',
    tier: 3,
    stat: 'hp',
    value: 100,
    cost: 4,
    description: '+100 HP',
  },
  {
    id: 'rune-g4',
    branch: 'Growth',
    name: 'Eternal Life',
    tier: 4,
    stat: 'hp',
    value: 200,
    cost: 7,
    description: '+200 HP',
  },
  {
    id: 'rune-g5',
    branch: 'Growth',
    name: 'Swiftness',
    tier: 1,
    stat: 'spd',
    value: 3,
    cost: 1,
    description: '+3 Speed',
  },
  {
    id: 'rune-g6',
    branch: 'Growth',
    name: 'Agility',
    tier: 2,
    stat: 'spd',
    value: 8,
    cost: 2,
    description: '+8 Speed',
  },
  {
    id: 'rune-g7',
    branch: 'Growth',
    name: 'Velocity',
    tier: 3,
    stat: 'spd',
    value: 18,
    cost: 4,
    description: '+18 Speed',
  },
  {
    id: 'rune-g8',
    branch: 'Growth',
    name: 'Lightning',
    tier: 4,
    stat: 'spd',
    value: 35,
    cost: 7,
    description: '+35 Speed',
  },
]

export const BRANCH_TIERS: Record<RuneBranch, number> = {
  Power: 4,
  Defense: 4,
  Growth: 4,
}

export const TOTAL_RUNE_POINTS = 20
