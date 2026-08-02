import { addGold, addEssence, addItems, metaState, mintForgeTokens, salvageBelowRarity, saveMetaState } from './progression'
import { getFrontierEncounter } from './frontier'
import { rollLoot } from './loot'

export interface OfflineSummary {
  elapsedSeconds: number
  depthGained: number
  gold: number
  essence: number
  itemsKept: number
  stoppedAtDepth: number
}

export function solveOfflineProgress(now = Date.now()): OfflineSummary | null {
  const last = metaState.lastSaveAt ?? now
  const elapsedSeconds = Math.min(12 * 60 * 60, Math.max(0, Math.floor((now - last) / 1000)))
  if (elapsedSeconds < 30) return null
  const seed = metaState.frontier.runSeed || 'offline'
  let depth = Math.max(1, metaState.frontier.bestDepth)
  let gained = 0
  const partyPower = Object.values(metaState.heroes).reduce((sum, hero) => sum + hero.level * 20 + hero.bonusStats.atk * 4, 0)
  const attempts = Math.min(240, Math.floor(elapsedSeconds / 30))
  for (let i = 0; i < attempts; i++) {
    const encounter = getFrontierEncounter(seed, depth + 1)
    if (encounter.scaling.hp > partyPower * 3.5) break
    depth += 1; gained += 1
  }
  const gold = Math.floor(elapsedSeconds * Math.max(1, depth) * 0.4)
  const essence = Math.floor(elapsedSeconds / 120)
  const items = rollLoot(Math.min(depth, 100), 'normal', depth % 10 === 0).slice(0, 3)
  addGold(gold); addEssence(essence); addItems(items)
  if (metaState.settings.salvageBelow !== 'Common') salvageBelowRarity(metaState.settings.salvageBelow)
  if (metaState.settings.autoMint) mintForgeTokens()
  metaState.frontier.bestDepth = Math.max(metaState.frontier.bestDepth, depth)
  metaState.frontier.currentDepth = depth
  metaState.lastSaveAt = now
  saveMetaState()
  return { elapsedSeconds, depthGained: gained, gold, essence, itemsKept: items.length, stoppedAtDepth: depth }
}
