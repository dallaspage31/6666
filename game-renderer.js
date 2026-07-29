export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.laneY = 0;
    this.heroY = 0;
    this.hitStop = 0;
    this.particles = [];
    this.fx = [];
    this.lastFrame = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = rect.width;
    this.height = rect.height;
    this.laneY = this.height * 0.68;
    this.heroY = this.laneY - 40;
  }

  render(state) {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    this.drawBackground(ctx, width, height);
    this.drawLane(ctx, width);
    this.drawEnemies(ctx, state);
    this.drawHero(ctx, state);
    this.drawHUD(ctx, state, width, height);
    this.drawWorldFx(ctx);
  }

  drawBackground(ctx, w, h) {
    ctx.fillStyle = '#1a1f2e';
    ctx.fillRect(0, 0, w, h);
  }

  drawLane(ctx, w) {
    ctx.strokeStyle = '#2a3142';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, this.laneY);
    ctx.lineTo(w, this.laneY);
    ctx.stroke();
  }

  drawHero(ctx, state) {
    const x = this.width * 0.2;
    const y = this.heroY;

    ctx.save();
    ctx.globalAlpha = this.hitStop > 0 ? 0.8 : 1.0;
    ctx.fillStyle = '#22b14c';
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = state.hero.classId === 'guardian' ? '#ffcc00' : '#00ccff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (this.hitStop > 0) this.hitStop -= 16;
  }

  drawEnemies(ctx, state) {
    const stage = state.getStageData();
    if (!stage || !stage.waves) return;
    const active = stage.waves.flatMap((w) => w.enemies).filter((e) => e.hp > 0);
    active.forEach((enemy, i) => {
      const x = this.width * 0.55 + (i % 4) * 60;
      const y = this.laneY - 20 - Math.floor(i / 4) * 50;
      ctx.fillStyle = '#b7410e';
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(Math.max(0, enemy.hp), x, y - 20);
    });
  }

  drawHUD(ctx, state, w, h) {
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP ${Math.max(0, state.hero.hp)}/${state.hero.maxHp}`, 10, h - 10);
    ctx.textAlign = 'right';
    ctx.fillText(`Stage ${state.getStageData()?.depth || state.progression.currentStageNumber}`, w - 10, h - 10);
    if (state.frontier?.active) {
      ctx.fillStyle = '#ffcc00';
      ctx.fillText(`Frontier D${state.frontier.depth} · ${state.frontier.biome}`, w / 2, h - 10);
    }
  }

  drawWorldFx(ctx) {
    for (const f of this.fx) {
      ctx.globalAlpha = f.life;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fill();
      f.life -= 0.02;
      f.x += f.vx;
      f.y += f.vy;
    }
    this.fx = this.fx.filter((f) => f.life > 0);
    ctx.globalAlpha = 1;
  }

  addWorldFx(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
      this.fx.push({
        x, y,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 2 - 0.5,
        size: Math.random() * 4 + 2,
        color,
        life: 1,
      });
    }
  }
}
