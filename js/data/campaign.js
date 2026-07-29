export const CAMPAIGN_REGIONS = {
  mossroad: { name: 'Mossroad', stages: 12, color: '#22b14c' },
  shadowfen: { name: 'Shadowfen', stages: 12, color: '#4a4a6a' },
  ember_marsh: { name: 'Ember Marsh', stages: 12, color: '#b7410e' },
  crystal_rove: { name: 'Crystal Rove', stages: 12, color: '#3f48cc' },
  ashfall_plains: { name: 'Ashfall Plains', stages: 12, color: '#8a5a3a' },
  iron_mire: { name: 'Iron Mire', stages: 12, color: '#5a5a5a' },
  gloom_weald: { name: 'Gloom Weald', stages: 12, color: '#2d1b4e' },
  forge_heart: { name: 'Forge Heart', stages: 12, color: '#ff6a00' },
};

export function getCampaignStage(stageNumber) {
  const regionKeys = Object.keys(CAMPAIGN_REGIONS);
  const regionIndex = Math.floor((stageNumber - 1) / 12) % regionKeys.length;
  const regionId = regionKeys[regionIndex];
  const region = CAMPAIGN_REGIONS[regionId];
  const stageInRegion = ((stageNumber - 1) % 12) + 1;
  const isBoss = stageInRegion === 12;

  return {
    stageNumber,
    regionId,
    regionName: region.name,
    regionColor: region.color,
    stageInRegion,
    isBoss,
    waves: isBoss
      ? [{ enemies: [{ id: `boss_${stageNumber}`, hp: 500 + stageNumber * 50, maxHp: 500 + stageNumber * 50, damage: 20 + stageNumber * 5, armor: 10, attackInterval: 2000, lastAttack: 0 }] }]
      : [
          { enemies: Array.from({ length: 2 + Math.floor(stageNumber / 5) }, (_, i) => ({
            id: `enemy_${stageNumber}_${i}`,
            hp: 20 + stageNumber * 8,
            maxHp: 20 + stageNumber * 8,
            damage: 3 + stageNumber * 1.5,
            armor: 0,
            attackInterval: 1200,
            lastAttack: 0,
          })) },
        ],
  };
}

export function getTotalCampaignStages() {
  return 120;
}
