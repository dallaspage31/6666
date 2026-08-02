import type { CombatElement } from './combat-types'
import { MAX_WAVE, WAVE_CONFIGS } from './combat-config'

export const REGION_COUNT = 10
export const STAGES_PER_REGION = 12

export interface CampaignStage {
  id: number
  region: number
  stage: number
  name: string
  biome: string
  monsterIds: string[]
  xpReward: number
  goldReward: number
  element: CombatElement
}

export interface CampaignRegion {
  id: number
  name: string
  biome: string
  stages: CampaignStage[]
}

const BIOMES = ['Verdant Wilds', 'Ember Reach', 'Frozen Crown', 'Moonlit Marsh', 'Astral Ruins', 'Sunken Vale', 'Obsidian Gate', 'Storm Coast', 'Hallowed Steppe', 'Void Frontier']
const REGION_NAMES = ['Greenwake', 'Ashenfall', 'Frostholm', 'Duskmire', 'Stargrave', 'Tidebreak', 'Blackglass', 'Tempest Reach', 'Dawnmarch', 'The Threshold']

export function getCampaignStage(id: number): CampaignStage {
  const safeId = Math.max(1, Math.min(REGION_COUNT * STAGES_PER_REGION, Math.floor(id)))
  const region = Math.ceil(safeId / STAGES_PER_REGION)
  const stage = safeId - (region - 1) * STAGES_PER_REGION
  const pattern = WAVE_CONFIGS[(safeId - 1) % WAVE_CONFIGS.length]
  const scale = 1 + Math.floor((safeId - 1) / MAX_WAVE) * 0.35 + stage * 0.025
  return {
    id: safeId,
    region,
    stage,
    name: `Stage ${safeId}: ${REGION_NAMES[region - 1]} ${stage}`,
    biome: BIOMES[region - 1],
    monsterIds: pattern.monsterIds.slice(0, Math.min(8, pattern.monsterIds.length)),
    xpReward: Math.floor(pattern.xpReward * scale),
    goldReward: Math.floor(pattern.goldReward * scale),
    element: (['nature', 'fire', 'ice', 'shadow', 'holy'] as CombatElement[])[(region - 1) % 5],
  }
}

export function getCampaignRegions(): CampaignRegion[] {
  return Array.from({ length: REGION_COUNT }, (_, index) => ({
    id: index + 1,
    name: REGION_NAMES[index],
    biome: BIOMES[index],
    stages: Array.from({ length: STAGES_PER_REGION }, (_, stageIndex) => getCampaignStage(index * STAGES_PER_REGION + stageIndex + 1)),
  }))
}
