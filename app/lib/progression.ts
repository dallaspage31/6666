import type { CombatElement } from './combat-types'
import { HERO_RARITY_CONFIGS, type HeroRarity } from './hero-rarity'
import { scaleRune, type Rune, type RuneStat } from './runes'

export type ItemSlot = 'weapon' | 'armor' | 'ring' | 'artifact'
export type StatKey = 'hp' | 'atk' | 'def' | 'spd'
export type AffixKind = 'percent-atk' | 'crit' | 'lifesteal' | 'hp-regen' | 'element-dmg'

export interface ItemAffix {
  kind: AffixKind
  label: string
  value: number
}

export interface Item {
  id: string
  name: string
  slot: ItemSlot
  rarity: HeroRarity
  element?: CombatElement
  baseStats: Record<StatKey, number>
  affixes: ItemAffix[]
  sockets: number
  socketedRunes: Array<Rune | null>
  equippedByHeroId: string | null
  iconDataUrl?: string
}

export interface HeroProgression {
  heroId: string
  level: number
  currentXp: number
  xpToNext: number
  statPoints: number
  bonusStats: Record<StatKey, number>
}

export interface MetaState {
  gold: number
  forgeTokens: string
  forgeRemainder: number
  essence: number
  heroes: Record<string, HeroProgression>
  inventory: Item[]
  equipped: Record<string, Partial<Record<ItemSlot, string>>>
  campaign: { highestUnlockedStage: number; completedStages: number[]; campaignCompleted: boolean }
  frontier: { bestDepth: number; currentDepth: number; runSeed: string; policy: 'push' | 'farm' | 'safePush' | 'greedy' }
  settings: { volume: number; muted: boolean; reducedMotion: boolean; salvageBelow: HeroRarity; autoMint: boolean }
  lastSaveAt: number
}

export interface EffectiveHeroStats {
  hp: number
  atk: number
  def: number
  spd: number
}

export const META_SAVE_KEY = 'robheroes.save.v1'
export const HERO_NAMES = ['Ironclad', 'Blazefang', 'Windsong', 'Frostweaver', 'Longshot']

export function xpToNextLevel(level: number): number {
  return Math.floor(80 * Math.pow(level, 1.5))
}

function newHero(heroId: string): HeroProgression {
  return { heroId, level: 1, currentXp: 0, xpToNext: xpToNextLevel(1), statPoints: 0, bonusStats: { hp: 0, atk: 0, def: 0, spd: 0 } }
}

function defaultMetaState(): MetaState {
  return {
    gold: 0,
    forgeTokens: '0',
    forgeRemainder: 0,
    essence: 0,
    heroes: Object.fromEntries(HERO_NAMES.map((name) => [`hero-${name}`, newHero(`hero-${name}`)])),
    inventory: [],
    equipped: {},
    campaign: { highestUnlockedStage: 1, completedStages: [], campaignCompleted: false },
    frontier: { bestDepth: 0, currentDepth: 1, runSeed: 'run-1', policy: 'safePush' },
    settings: { volume: 0.7, muted: false, reducedMotion: false, salvageBelow: 'Common', autoMint: false },
    lastSaveAt: Date.now(),
  }
}

export let metaState: MetaState = defaultMetaState()

function normalize(state: MetaState): MetaState {
  const defaults = defaultMetaState()
  const heroes = { ...defaults.heroes, ...state.heroes }
  Object.values(heroes).forEach((hero) => {
    hero.xpToNext = xpToNextLevel(hero.level)
    hero.bonusStats = { ...hero.bonusStats }
    hero.bonusStats.hp ??= 0
    hero.bonusStats.atk ??= 0
    hero.bonusStats.def ??= 0
    hero.bonusStats.spd ??= 0
  })
  return {
    ...defaults,
    ...state,
    forgeTokens: String(state.forgeTokens ?? '0'),
    forgeRemainder: Number(state.forgeRemainder ?? 0),
    heroes,
    inventory: (state.inventory ?? []).map((item) => ({ ...item, socketedRunes: item.socketedRunes ?? Array(item.sockets).fill(null) })),
    equipped: state.equipped ?? {},
    campaign: { ...defaults.campaign, ...state.campaign },
    frontier: { ...defaults.frontier, ...state.frontier },
    settings: { ...defaults.settings, ...state.settings },
    lastSaveAt: Number(state.lastSaveAt ?? Date.now()),
  }
}

export function replaceMetaState(next: MetaState): void {
  metaState = normalize(next)
}

export function loadMetaState(): MetaState {
  if (typeof window === 'undefined') return metaState
  try {
    const saved = window.localStorage.getItem(META_SAVE_KEY)
    if (saved) replaceMetaState(JSON.parse(saved) as MetaState)
  } catch {
    replaceMetaState(defaultMetaState())
  }
  return metaState
}

export function saveMetaState(): void {
  metaState.lastSaveAt = Date.now()
  if (typeof window !== 'undefined') window.localStorage.setItem(META_SAVE_KEY, JSON.stringify(metaState))
}

export function exportSave(): string {
  const json = JSON.stringify(metaState)
  if (typeof window !== 'undefined') return window.btoa(unescape(encodeURIComponent(json)))
  return json
}

export function importSave(code: string): boolean {
  try {
    const json = typeof window !== 'undefined' ? decodeURIComponent(escape(window.atob(code.trim()))) : code
    const parsed = JSON.parse(json) as MetaState
    replaceMetaState(sanitizeMetaState(parsed))
    saveMetaState()
    return true
  } catch {
    return false
  }
}

function sanitizeMetaState(state: MetaState): MetaState {
  const safe = normalize(state)
  const rarities = Object.keys(HERO_RARITY_CONFIGS) as HeroRarity[]
  const slots: ItemSlot[] = ['weapon', 'armor', 'ring', 'artifact']
  const elements: CombatElement[] = ['physical', 'fire', 'ice', 'nature', 'shadow', 'holy']
  safe.gold = Math.min(1e15, Math.max(0, Number(safe.gold) || 0))
  safe.essence = Math.min(1e15, Math.max(0, Number(safe.essence) || 0))
  safe.inventory = safe.inventory.slice(0, 500).map((item) => ({
    ...item,
    name: item.name.replace(/[^\p{L}\p{N} .,'-]/gu, '').slice(0, 80) || 'Recovered Item',
    rarity: rarities.includes(item.rarity) ? item.rarity : 'Common',
    slot: slots.includes(item.slot) ? item.slot : 'artifact',
    element: item.element && elements.includes(item.element) ? item.element : undefined,
    baseStats: { hp: clamp(item.baseStats?.hp), atk: clamp(item.baseStats?.atk), def: clamp(item.baseStats?.def), spd: clamp(item.baseStats?.spd) },
    affixes: (item.affixes ?? []).slice(0, 4).map((affix) => ({ ...affix, value: clamp(affix.value, 1000), label: String(affix.label).slice(0, 40) })),
    sockets: Math.min(4, Math.max(0, Math.floor(item.sockets || 0))),
  }))
  return safe
}

function clamp(value: number, max = 1e6): number {
  return Math.min(max, Math.max(-max, Number(value) || 0))
}

export function addGold(amount: number): void {
  metaState.gold += Math.max(0, Math.floor(amount))
}

export function addEssence(amount: number): void {
  metaState.essence += Math.max(0, Math.floor(amount))
}

export function mintForgeTokens(): number {
  const total = metaState.gold + metaState.forgeRemainder
  const minted = Math.floor(total / 10000)
  metaState.forgeTokens = (BigInt(metaState.forgeTokens) + BigInt(minted)).toString()
  metaState.forgeRemainder = total % 10000
  metaState.gold = 0
  return minted
}

export function addXpToHero(heroId: string, amount: number): number {
  const hero = metaState.heroes[heroId]
  if (!hero) return 0
  hero.currentXp += Math.max(0, Math.floor(amount))
  let levels = 0
  while (hero.currentXp >= hero.xpToNext) {
    hero.currentXp -= hero.xpToNext
    hero.level += 1
    hero.statPoints += 3
    hero.xpToNext = xpToNextLevel(hero.level)
    levels += 1
  }
  return levels
}

export function allocateStatPoint(heroId: string, stat: StatKey): boolean {
  const hero = metaState.heroes[heroId]
  if (!hero || hero.statPoints <= 0) return false
  hero.statPoints -= 1
  hero.bonusStats[stat] += 1
  return true
}

export function computeHeroStats(heroId: string, rarity: HeroRarity): EffectiveHeroStats {
  const progression = metaState.heroes[heroId] ?? newHero(heroId)
  const base = HERO_RARITY_CONFIGS[rarity]
  const growth = Math.max(0, progression.level - 1)
  const stats: EffectiveHeroStats = {
    hp: Math.floor(base.baseHp * (1 + growth * 0.15)) + progression.bonusStats.hp,
    atk: Math.floor(base.baseAtk * (1 + growth * 0.1)) + progression.bonusStats.atk,
    def: Math.floor(base.baseDef * (1 + growth * 0.08)) + progression.bonusStats.def,
    spd: Math.floor(base.baseSpd * (1 + growth * 0.05)) + progression.bonusStats.spd,
  }
  const equipped = metaState.equipped[heroId] ?? {}
  Object.values(equipped).forEach((itemId) => {
    const item = metaState.inventory.find((candidate) => candidate.id === itemId)
    if (!item) return
    addStats(stats, item.baseStats)
    item.affixes.forEach((affix) => {
      if (affix.kind === 'percent-atk') stats.atk += Math.floor(stats.atk * affix.value / 100)
      if (affix.kind === 'hp-regen') stats.hp += Math.floor(affix.value)
    })
    item.socketedRunes.forEach((rune) => {
      if (!rune) return
      const scaled = scaleRune(rune, progression.level)
      stats[scaled.stat] += scaled.value
    })
  })
  return stats
}

function addStats(stats: EffectiveHeroStats, values: Record<StatKey, number>): void {
  stats.hp += values.hp
  stats.atk += values.atk
  stats.def += values.def
  stats.spd += values.spd
}

export function addItems(items: Item[]): void {
  metaState.inventory.push(...items)
}

export function equipItem(itemId: string, heroId: string): boolean {
  const item = metaState.inventory.find((candidate) => candidate.id === itemId)
  if (!item) return false
  const previous = metaState.equipped[heroId]?.[item.slot]
  if (previous) {
    const old = metaState.inventory.find((candidate) => candidate.id === previous)
    if (old) old.equippedByHeroId = null
  }
  metaState.equipped[heroId] = { ...(metaState.equipped[heroId] ?? {}), [item.slot]: item.id }
  item.equippedByHeroId = heroId
  return true
}

export function socketRune(itemId: string, rune: Rune, socketIndex: number): boolean {
  const item = metaState.inventory.find((candidate) => candidate.id === itemId)
  if (!item || socketIndex < 0 || socketIndex >= item.sockets || item.socketedRunes[socketIndex]) return false
  item.socketedRunes[socketIndex] = rune
  return true
}

export function unsocketRune(itemId: string, socketIndex: number): Rune | null {
  const item = metaState.inventory.find((candidate) => candidate.id === itemId)
  if (!item || socketIndex < 0 || socketIndex >= item.sockets) return null
  const rune = item.socketedRunes[socketIndex]
  item.socketedRunes[socketIndex] = null
  return rune
}

export function salvageItem(itemId: string): number {
  const index = metaState.inventory.findIndex((item) => item.id === itemId)
  if (index < 0) return 0
  const item = metaState.inventory[index]
  if (item.equippedByHeroId) delete metaState.equipped[item.equippedByHeroId][item.slot]
  const rarityIndex = Object.keys(HERO_RARITY_CONFIGS).indexOf(item.rarity)
  const essence = 2 + rarityIndex * 4
  addEssence(essence)
  addGold(5 + rarityIndex * 10)
  metaState.inventory.splice(index, 1)
  return essence
}

export function salvageBelowRarity(threshold: HeroRarity): number {
  const rarities = Object.keys(HERO_RARITY_CONFIGS) as HeroRarity[]
  const thresholdIndex = rarities.indexOf(threshold)
  const ids = metaState.inventory.filter((item) => rarities.indexOf(item.rarity) < thresholdIndex).map((item) => item.id)
  ids.forEach(salvageItem)
  return ids.length
}

export function getRuneStatKey(stat: RuneStat): StatKey {
  return stat
}
