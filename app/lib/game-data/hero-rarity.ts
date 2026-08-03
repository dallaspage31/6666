export type HeroClass = 'Knight' | 'Mage' | 'Archer' | 'Priest' | 'Assassin'

export interface HeroStats {
  class: HeroClass
  hp: number
  atk: number
  def: number
  spd: number
  description: string
  color: string
}

export const HERO_CLASSES: Record<HeroClass, HeroStats> = {
  Knight: {
    class: 'Knight',
    hp: 120,
    atk: 25,
    def: 35,
    spd: 12,
    description: 'A stalwart defender with high HP and defense.',
    color: 'text-blue-400 border-blue-500',
  },
  Mage: {
    class: 'Mage',
    hp: 70,
    atk: 55,
    def: 15,
    spd: 18,
    description: 'A wielder of arcane power with devastating attacks.',
    color: 'text-purple-400 border-purple-500',
  },
  Archer: {
    class: 'Archer',
    hp: 85,
    atk: 40,
    def: 20,
    spd: 30,
    description: 'A swift marksman with unmatched speed and range.',
    color: 'text-green-400 border-green-500',
  },
  Priest: {
    class: 'Priest',
    hp: 90,
    atk: 20,
    def: 25,
    spd: 15,
    description: 'A holy warrior who supports allies with healing magic.',
    color: 'text-yellow-400 border-yellow-500',
  },
  Assassin: {
    class: 'Assassin',
    hp: 75,
    atk: 45,
    def: 12,
    spd: 35,
    description: 'A deadly shadow who strikes from the darkness.',
    color: 'text-red-400 border-red-500',
  },
}

export const HERO_CLASS_LIST: HeroClass[] = [
  'Knight',
  'Mage',
  'Archer',
  'Priest',
  'Assassin',
]
