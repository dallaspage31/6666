import { getCampaignStage } from '../data/campaign.js';

export class GameState {
  constructor() {
    this.version = 6;
    this.hero = {
      classId: null,
      level: 1,
      hp: 100,
      maxHp: 100,
      baseAttackDamage: 10,
      baseArmor: 0,
      baseAttackInterval: 1000,
      critChance: 0.05,
      critDamage: 1.5,
      goldFind: 0,
      xpBonus: 0,
      magicResist: 0,
      lifeSteal: 0,
    };
    this.progression = {
      currentStageNumber: 1,
      currentWaveNumber: 0,
      currentRegionId: 'mossroad',
      highestUnlockedStage: 1,
      autoAdvanceEnabled: true,
      campaignCompleted: false,
    };
    this.inventory = [];
    this.equipment = {
      weapon: null,
      armor: null,
      motif: null,
      gem: null,
      aura: null,
    };
    this.forgeEconomy = {
      tokens: '0',
      lifetimeMinted: '0',
      mintRemainder: 0,
      protectedReserve: 0,
      autoMintAtCheckpoint: false,
    };
    this.frontier = null;
    this.cosmetics = {
      equippedCosmetic: null,
      titleFrame: null,
      profileBadge: null,
    };
    this.afkProfiles = [];
    this.settings = {
      reducedMotion: false,
    };
  }

  getStageData() {
    if (this.frontier && this.frontier.active) {
      return GAME.engine.getFrontierStageData(this.frontier.depth);
    }
    return getCampaignStage(this.progression.currentStageNumber);
  }

  getMaxStageNumber() {
    if (this.frontier && this.frontier.active) {
      return this.frontier.depth;
    }
    return this.progression.highestUnlockedStage;
  }

  static fromSave(data) {
    const s = new GameState();
    Object.assign(s, data);
    return s;
  }
}
