import { DeterministicRNG } from './01-rng.js';
import { GameState } from './02-state.js';

const POLICIES = ['push', 'farm', 'safePush', 'greedy'];

export class FrontierDirector {
  constructor(state, rng) {
    this.state = state;
    this.rng = rng;
    this.templates = [
      'vanguard_clash', 'swarm_rush', 'shield_wall', 'ranged_nest',
      'elite_escort', 'healer_core', 'twin_threat', 'attrition_field', 'checkpoint_guardian',
    ];
    this.modifiers = [
      'frenzied', 'armored', 'volatile', 'regenerating', 'reinforcements',
      'elemental_storm', 'darkness', 'treasure_bound',
    ];
    this.bossAspects = ['fury', 'fortress', 'legion', 'void', 'fortune'];
    this.biomes = ['shadowfen', 'ember_marsh', 'crystal_rove', 'ashfall_plains', 'iron_mire'];
  }

  materializeStage(depth) {
    const seed = this.state.frontier.seed;
    const channels = ['template', 'modifier', 'biome', 'boss_aspect'];
    const recipe = {};
    for (const ch of channels) {
      const r = new DeterministicRNG(seed + depth * 7 + ch.charCodeAt(0));
      if (ch === 'template') recipe.template = r.pick(this.templates);
      else if (ch === 'modifier') recipe.modifier = r.pick(this.modifiers);
      else if (ch === 'biome') recipe.biome = r.pick(this.biomes);
      else if (ch === 'boss_aspect') recipe.bossAspect = r.pick(this.bossAspects);
    }
    recipe = this.scaleDepth(recipe, depth);
    return this.buildStageContract(recipe, depth);
  }

  scaleDepth(recipe, depth) {
    const exponent = 1 + Math.log10(Math.max(depth, 1)) * 0.15;
    const mantissa = 1 + (depth % 997) / 997 * 0.5;
    const scale = Number.isFinite(mantissa * Math.pow(1.08, depth))
      ? mantissa * Math.pow(1.08, depth)
      : 1e308;
    recipe.hpScale = Math.min(scale, 1e18);
    recipe.damageScale = Math.min(Math.pow(1.06, depth), 1e18);
    recipe.rewardScale = Math.min(Math.pow(1.05, depth), 1e18);
    recipe.mantissa = mantissa;
    recipe.exponent = exponent;
    return recipe;
  }

  buildStageContract(recipe, depth) {
    const waves = [];
    for (let w = 0; w < 3 + (depth % 2); w++) {
      waves.push({
        enemies: this.spawnWave(recipe, depth, w),
      });
    }
    waves.push({
      enemies: [this.spawnBoss(recipe, depth)],
    });
    return {
      depth,
      template: recipe.template,
      modifier: recipe.modifier,
      biome: recipe.biome,
      bossAspect: recipe.bossAspect,
      waves,
      hpScale: recipe.hpScale,
      damageScale: recipe.damageScale,
      rewardScale: recipe.rewardScale,
    };
  }

  spawnWave(recipe, depth, waveIndex) {
    const count = 2 + Math.min(Math.floor(depth / 10), 12);
    const enemies = [];
    const r = new DeterministicRNG(this.state.frontier.seed + depth * 13 + waveIndex);
    for (let i = 0; i < count; i++) {
      enemies.push({
        id: `frontier_${depth}_${waveIndex}_${i}`,
        hp: Math.floor(20 * recipe.hpScale),
        maxHp: Math.floor(20 * recipe.hpScale),
        damage: Math.floor(3 * recipe.damageScale),
        armor: 0,
        attackInterval: 1200,
        lastAttack: 0,
      });
    }
    return enemies;
  }

  spawnBoss(recipe, depth) {
    return {
      id: `frontier_boss_${depth}`,
      hp: Math.floor(200 * recipe.hpScale),
      maxHp: Math.floor(200 * recipe.hpScale),
      damage: Math.floor(12 * recipe.damageScale),
      armor: 5,
      attackInterval: 2000,
      lastAttack: 0,
      aspect: recipe.bossAspect,
    };
  }

  completeWave() {
    const depth = this.state.frontier.depth;
    const policy = this.state.frontier.policy;
    const handled = this.writeFrontierResult(true, depth);
    if (handled) return;
    if (policy === 'push') this.state.frontier.depth++;
    else if (policy === 'farm') this.state.frontier.farmDepth = depth;
    else if (policy === 'safePush') {
      if (depth % 10 === 0) {
        this.state.frontier.checkpointDepth = depth;
      } else {
        this.state.frontier.depth++;
      }
    } else if (policy === 'greedy') {
      this.state.frontier.depth++;
      this.state.frontier.heat = (this.state.frontier.heat || 0) + 1;
    }
  }

  writeFrontierResult(success, depth) {
    if (this.state.frontier.committed) return true;
    this.state.frontier.committed = true;
    if (!success) {
      this.state.frontier.depth = this.state.frontier.checkpointDepth || 1;
      this.state.frontier.heat = 0;
    }
    this.state.frontier.committed = false;
    return false;
  }

  leaveExpedition() {
    this.state.frontier = null;
    this.state.progression.currentStageNumber = Math.min(
      this.state.progression.highestUnlockedStage,
      this.state.progression.currentStageNumber
    );
  }

  getFrontierStageData(depth) {
    return this.materializeStage(depth);
  }

  getNextFrontierDepth() {
    if (!this.state.frontier) return 1;
    return this.state.frontier.depth;
  }
}
