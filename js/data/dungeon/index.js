export const DUNGEON_RULESET = {
  id: 'dungeon',
  name: 'Dungeon',
  maxFloors: 50,
  permadeath: true,
  eliteChance: 0.3,
  rewardScale: 1.5,
};

export function getDungeonFloor(floor) {
  return {
    floor,
    enemies: [],
    eliteChance: DUNGEON_RULESET.eliteChance,
    rewardScale: DUNGEON_RULESET.rewardScale,
  };
}
