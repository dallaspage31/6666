import { getCampaignStage, getTotalCampaignStages } from '../data/campaign.js';

export class ProgressionSystem {
  static awardXP(state, amount) {
    state.hero.xp = (state.hero.xp || 0) + amount;
    const threshold = state.hero.level * 100;
    if (state.hero.xp >= threshold) {
      state.hero.xp -= threshold;
      this.levelUp(state);
      return true;
    }
    return false;
  }

  static levelUp(state) {
    state.hero.level++;
    state.hero.maxHp += 10;
    state.hero.hp = state.hero.maxHp;
    state.hero.baseAttackDamage += 2;
    state.hero.baseArmor += 1;
  }

  static ascensionReset(state) {
    const goldKept = state.hero.gold * 0.1;
    state.hero.level = 1;
    state.hero.xp = 0;
    state.hero.hp = 100;
    state.hero.maxHp = 100;
    state.hero.baseAttackDamage = 10;
    state.hero.baseArmor = 0;
    state.hero.gold = goldKept;
    state.progression.currentStageNumber = 1;
    state.progression.currentWaveNumber = 0;
    state.progression.highestUnlockedStage = 1;
    state.inventory = [];
    state.equipment = { weapon: null, armor: null, motif: null, gem: null, aura: null };
  }
}
