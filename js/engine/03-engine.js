import { DeterministicRNG } from './01-rng.js';
import { GameState } from './02-state.js';

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
      enemy.update(dt);
      this.processCombat(enemy, dt);
    }
    this.cleanupDeadEnemies(wave);
  }

  processCombat(enemy, dt) {
    const hero = this.state.hero;
    const now = performance.now();

    if (now - enemy.lastAttack >= enemy.attackInterval) {
      const damage = Math.max(1, enemy.damage - hero.baseArmor);
      hero.hp -= damage;
      enemy.lastAttack = now;
    }

    if (now - hero.lastAttack >= hero.baseAttackInterval) {
      const isCrit = Math.random() < hero.critChance;
      const damage = (isCrit ? hero.baseAttackDamage * hero.critDamage : hero.baseAttackDamage) - enemy.armor;
      enemy.hp -= Math.max(1, damage);
      hero.lastAttack = now;
      if (hero.lifeSteal > 0) {
        hero.hp = Math.min(hero.maxHp, hero.hp + damage * hero.lifeSteal);
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
}
