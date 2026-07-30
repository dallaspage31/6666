import { DeterministicRNG } from './01-rng.js';

export class OfflineSolver {
  constructor(state) {
    this.state = state;
  }

  solve(offlineSeconds) {
    if (offlineSeconds <= 0) return null;
    const capped = Math.min(offlineSeconds, 8 * 3600);
    const hero = this.state.hero;
    const stage = this.state.getStageData();

    const effectiveDPS = (hero.baseAttackDamage || 10)
      * (1 + (hero.critChance || 0) * ((hero.critDamage || 1.5) - 1));

    const enemyEHP = stage?.waves?.[0]?.enemies?.[0]
      ? Math.max(1, (stage.waves[0].enemies[0].hp || 20) - (stage.waves[0].enemies[0].armor || 0))
      : 20;

    const encounterDuration = enemyEHP / Math.max(1, effectiveDPS);
    const encountersPerSecond = 1 / Math.max(0.5, encounterDuration);
    const totalEncounters = Math.floor(capped * encountersPerSecond);

    const goldPerEncounter = (stage?.rewardScale || 1) * 10;
    const totalGold = Math.floor(totalEncounters * goldPerEncounter);
    const itemsFound = Math.floor(totalEncounters / 5);
    const meaningfulItems = Math.min(itemsFound, Math.floor(capped / 60));

    const depthAdvanced = Math.floor(totalEncounters / 10);
    const stoppedAtDepth = depthAdvanced;

    return {
      offlineSeconds: capped,
      depthAdvanced,
      stoppedAtDepth,
      totalGold,
      itemsFound,
      meaningfulItems,
      lowRaritySalvaged: itemsFound - meaningfulItems,
    };
  }

  static format(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }
}
