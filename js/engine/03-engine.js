import { DeterministicRNG } from './01-rng.js';
import { GameState } from './02-state.js';
import { DamageSystem } from './12-damage.js';
import { applyUpgradeEffect, getUpgradeCost } from '../data/upgrade-tree.js';
import { OfflineSolver } from './07-offline-solver.js';

export class Engine {
  constructor() {
    this.state = new GameState();
    this.rng = new DeterministicRNG(Date.now());
    this.running = false;
    this.dt = 16;
    this.lastTime = 0;
    this.callbacks = {
      tick: [],
      render: [],
      waveComplete: [],
      heroDeath: [],
      levelUp: [],
      itemDrop: [],
      frontierResult: [],
    };
  }

  init(saveData) {
    if (saveData) {
      this.state = GameState.fromSave(saveData);
    }
    this.rng = new DeterministicRNG(this.state.progression.currentStageNumber * 1000 + this.state.hero.level);
    this.attachSystems();
  }

  attachSystems() {
    this.forgeTokens = new ForgeTokens(this.state);
    this.frontierDirector = new FrontierDirector(this.state, this.rng);
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
  }

  loop(timestamp) {
    if (!this.running) return;
    this.dt = Math.max(0, timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    if (this.dt > 0.1) this.dt = 0.1;

    this.update(this.dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (dt <= 0 || Number.isNaN(dt)) return;

    const stage = this.state.getStageData();
    if (!stage) return;

    for (const wave of stage.waves) {
      this.updateWave(wave, dt);
    }

    this.checkWaveCompletion();
  }

  updateWave(wave, dt) {
    for (const enemy of wave.enemies) {
      if (enemy.hp <= 0) continue;
      this.processCombat(enemy, dt);
    }
    this.cleanupDeadEnemies(wave);
  }

  processCombat(enemy, dt) {
    const hero = this.state.hero;
    const now = performance.now();

    if (now - (enemy.lastAttack || 0) >= (enemy.attackInterval || 1000)) {
      const result = DamageSystem.apply(enemy, hero);
      enemy.lastAttack = now;
      GAME.renderer?.addWorldFx?.(GAME.renderer.width * 0.7, GAME.renderer.laneY, '#ff4444', 3);
      if (hero.hp <= 0) {
        this.emit('heroDeath');
        if (this.state.frontier?.active) {
          this.frontierDirector.writeFrontierResult(false, this.state.frontier.depth);
          this.frontierDirector.leaveExpedition();
        }
      }
    }

    if (now - (hero.lastAttack || 0) >= (hero.baseAttackInterval || 1000)) {
      const result = DamageSystem.apply(hero, enemy);
      hero.lastAttack = now;
      const critColor = result.isCrit ? '#ffcc00' : '#22b14c';
      GAME.renderer?.addWorldFx?.(GAME.renderer.width * 0.5, GAME.renderer.laneY, critColor, result.isCrit ? 8 : 3);
      if (enemy.hp <= 0) {
        this.emit('itemDrop', enemy);
      }
    }
  }

  cleanupDeadEnemies(wave) {
    wave.enemies = wave.enemies.filter((e) => e.hp > 0);
  }

  checkWaveCompletion() {
    const stage = this.state.getStageData();
    if (!stage) return;
    const allDead = stage.waves.every((w) => w.enemies.length === 0);
    if (allDead) {
      this.onWaveComplete();
    }
  }

  onWaveComplete() {
    if (this.state.frontier && this.state.frontier.active) {
      this.frontierDirector.completeWave();
    }
    this.state.progression.currentWaveNumber++;
    if (this.state.progression.currentWaveNumber >= 6) {
      this.state.progression.currentWaveNumber = 0;
      this.state.progression.currentStageNumber++;
      this.emit('levelUp');
    }
  }

  on(event, fn) {
    if (this.callbacks[event]) this.callbacks[event].push(fn);
  }

  emit(event, ...args) {
    if (this.callbacks[event]) {
      for (const fn of this.callbacks[event]) fn(...args);
    }
  }

  render() {
    this.emit('render', this.state);
  }

  compressOfflineLoot(drops, settings = {}) {
    const keep = settings.rareKeep || 'KEEP';
    const summary = { total: drops.length, kept: [], gold: 0, salvaged: 0 };
    const top5 = drops
      .filter((d) => ['epic', 'mythic', 'eternal'].includes(d.rarity))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);

    for (const drop of drops) {
      if (top5.includes(drop)) {
        summary.kept.push(drop);
      } else if (drop.rarity === 'rare') {
        if (keep === 'KEEP') summary.kept.push(drop);
        else { summary.gold += 10; summary.salvaged++; }
      } else if (['common', 'uncommon'].includes(drop.rarity)) {
        summary.gold += drop.rarity === 'common' ? 5 : 10;
        summary.salvaged++;
      }
    }
    return summary;
  }

  purchaseUpgrade(id) {
    const currentRank = this.state.hero.upgrades?.[id] || 0;
    const cost = getUpgradeCost(id, currentRank);
    if (cost === Infinity) return { success: false, reason: 'MAX_RANK' };
    if ((this.state.hero.gold || 0) < cost) return { success: false, reason: 'INSUFFICIENT_GOLD' };

    this.state.hero.gold -= cost;
    this.state.hero.upgrades = this.state.hero.upgrades || {};
    this.state.hero.upgrades[id] = currentRank + 1;
    applyUpgradeEffect(this.state, id, this.state.hero.upgrades[id]);
    return { success: true, newRank: this.state.hero.upgrades[id], cost };
  }
}
