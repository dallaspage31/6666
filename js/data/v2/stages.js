export const V2_REGIONS = {
  ember_marsh_v2: { id: 'ember_marsh_v2', name: 'Ember Marsh V2', stages: 20, flag: 'ff_v2_world' },
  crystal_rove_v2: { id: 'crystal_rove_v2', name: 'Crystal Rove V2', stages: 20, flag: 'ff_v2_world' },
};

export function getV2Stage(stageNumber) {
  const keys = Object.keys(V2_REGIONS);
  const regionId = keys[(stageNumber - 1) % keys.length];
  return {
    stageNumber,
    regionId,
    regionName: V2_REGIONS[regionId].name,
    waves: [],
  };
}
