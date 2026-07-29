export const ETERNAL_RULESET = {
  id: 'eternal',
  name: 'Eternal',
  infinite: true,
  heatScaling: 1.02,
  rewardDecay: 0.98,
  affixCount: 4,
};

export function getEternalDepth(depth) {
  const affixes = [];
  for (let i = 0; i < ETERNAL_RULESET.affixCount; i++) {
    affixes.push({ id: `eternal_affix_${depth}_${i}`, tier: Math.min(5, Math.floor(depth / 10)) });
  }
  return {
    depth,
    affixes,
    rewardScale: Math.pow(ETERNAL_RULESET.rewardDecay, depth),
    heat: Math.pow(ETERNAL_RULESET.heatScaling, depth),
  };
}
