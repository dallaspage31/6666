import type { CombatElement } from './combat-types'
import { HERO_RARITY_CONFIGS, HERO_RARITIES, type HeroRarity } from './hero-rarity'
import type { Item, ItemAffix, ItemSlot, StatKey } from './progression'

const prefixes = ['Ember', 'Warden', 'Moonlit', 'Stormforged', 'Verdant', 'Dread']
const bases: Record<ItemSlot, string[]> = {
  weapon: ['Blade', 'Longbow', 'Grimoire', 'Scepter'],
  armor: ['Cuirass', 'Mantle', 'Raiment', 'Bulwark'],
  ring: ['Band', 'Loop', 'Signet', 'Circlet'],
  artifact: ['Idol', 'Talisman', 'Relic', 'Shard'],
}
const suffixes = ['of Echoes', 'of Ruin', 'of the Dawn', 'of Giants', 'of Focus']
const elements: CombatElement[] = ['physical', 'fire', 'ice', 'nature', 'shadow', 'holy']
const slots: ItemSlot[] = ['weapon', 'armor', 'ring', 'artifact']
const statKeys: StatKey[] = ['hp', 'atk', 'def', 'spd']
const affixKinds: Array<ItemAffix['kind']> = ['percent-atk', 'crit', 'lifesteal', 'hp-regen', 'element-dmg']

function seeded(wave: number, offset: number): number {
  const value = Math.sin(wave * 12.9898 + offset * 78.233) * 43758.5453
  return value - Math.floor(value)
}

function rollRarity(wave: number, isBoss: boolean, index: number): HeroRarity {
  const weights = HERO_RARITIES.map((rarity, rarityIndex) =>
    HERO_RARITY_CONFIGS[rarity].dropRate *
    (1 + Math.max(0, wave - 1) * rarityIndex * 0.12) *
    (isBoss ? 1 + rarityIndex * 0.4 : 1)
  )
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let roll = seeded(wave, index) * total
  for (let i = weights.length - 1; i >= 0; i--) {
    roll -= weights[i]
    if (roll <= 0) return HERO_RARITIES[i]
  }
  return 'Common'
}

export function rollLoot(wave: number, difficulty: string, isBoss: boolean): Item[] {
  const count = isBoss ? 2 : seeded(wave, 7) > 0.7 ? 2 : seeded(wave, 8) > 0.35 ? 1 : 0
  const items: Item[] = []
  for (let index = 0; index < count; index++) {
    let rarity = rollRarity(wave, isBoss, index)
    if (isBoss && !['Rare', 'Epic', 'Legendary', 'Cosmic'].includes(rarity)) rarity = 'Rare'
    const rarityIndex = HERO_RARITIES.indexOf(rarity)
    const slot = slots[Math.floor(seeded(wave, 10 + index) * slots.length)]
    const multiplier = HERO_RARITY_CONFIGS[rarity].xpMultiplier
    const scale = Math.max(1, wave) * multiplier * (difficulty === 'hard' ? 1.15 : difficulty === 'nightmare' ? 1.3 : 1)
    const mainStat = statKeys[(rarityIndex + index) % statKeys.length]
    const baseStats: Record<StatKey, number> = { hp: 0, atk: 0, def: 0, spd: 0 }
    baseStats[mainStat] = Math.max(1, Math.floor((mainStat === 'hp' ? 14 : 2) * scale))
    const affixCount = Math.min(4, Math.floor(rarityIndex / 2) + (rarityIndex > 3 ? 1 : 0))
    const affixes = Array.from({ length: affixCount }, (_, affixIndex) => {
      const kind = affixKinds[(rarityIndex + affixIndex + index) % affixKinds.length]
      return {
        kind,
        label: kind === 'percent-atk' ? '+% atk' : `+ ${kind.replace('-', ' ')}`,
        value: Math.max(1, Math.floor((kind === 'percent-atk' ? 2 : 1) * multiplier)),
      }
    })
    const sockets = Math.min(4, Math.floor(rarityIndex / 2))
    items.push({
      id: `item-${wave}-${index}-${Date.now()}-${Math.floor(seeded(wave, 20 + index) * 100000)}`,
      name: `${prefixes[(wave + index) % prefixes.length]} ${bases[slot][(wave + rarityIndex) % bases[slot].length]} ${suffixes[(index + rarityIndex) % suffixes.length]}`,
      slot,
      rarity,
      element: elements[(wave + index + rarityIndex) % elements.length],
      baseStats,
      affixes,
      sockets,
      socketedRunes: Array(sockets).fill(null),
      equippedByHeroId: null,
    })
  }
  return items
}
