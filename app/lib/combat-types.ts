export type CombatRole = 'tank' | 'damage' | 'support' | 'controller'
export type CombatElement = 'physical' | 'fire' | 'ice' | 'nature' | 'shadow' | 'holy'

export type CombatAction = 'attack' | 'defend' | 'special' | 'pet-ability' | 'rune-buff'

export type CombatResult = 'victory' | 'defeat' | 'timeout'

export type CombatPhase = 'wave-intro' | 'active' | 'wave-complete' | 'boss-intro' | 'boss-active' | 'complete'

export interface Combatant {
  id: string
  name: string
  role: CombatRole
  hp: number
  maxHp: number
  atk: number
  def: number
  spd: number
  alive: boolean
}

export interface HeroCombatant extends Combatant {
  heroId: string
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Cosmic'
  level: number
  equipment: string[]
  runes: string[]
  petId: string | null
}

export interface MonsterCombatant extends Combatant {
  monsterId: string
  wave: number
  isBoss: boolean
}

export interface PetCombatant extends Combatant {
  petId: string
  ability: string
}

export interface CombatTurn {
  turnNumber: number
  phase: CombatPhase
  actions: CombatActionEntry[]
}

export interface CombatActionEntry {
  combatantId: string
  action: CombatAction
  targetId: string | null
  damage: number
  healing: number
  buffs: BuffEntry[]
}

export interface BuffEntry {
  sourceId: string
  type: string
  value: number
  duration: number
}

export interface CombatLogEntry {
  turn: number
  text: string
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'kill' | 'wave-start' | 'wave-end'
}

export interface CombatState {
  id: string
  phase: CombatPhase
  turnNumber: number
  heroes: HeroCombatant[]
  monsters: MonsterCombatant[]
  pets: PetCombatant[]
  log: CombatLogEntry[]
  result: CombatResult | null
}