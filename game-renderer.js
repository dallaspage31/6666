import { getMutationKit } from './js/data/mutation-kits.js';

export class GameRenderer {
  constructor(canvas, assets) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assets = assets || null;
    this.width = canvas.width;
    this.height = canvas.height;
    this.laneY = 0;
    this.heroY = 0;
    this.hitStop = 0;
    this.particles = [];
    this.fxs = [];
    this.lastFrame = 0;
    this.resize();
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    if (typeof window === 'undefined') return;
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

  sprite(key, fallbackRadius, color) {
    const img = this.assets?.get(key);
    if (img && img.complete && img.naturalWidth > 0) {
      return { type: 'sprite', img, w: img.naturalWidth, h: img.naturalHeight };
    }
    return { type: 'primitive', radius: fallbackRadius || 14, color: color || '#b7410e' };
  }

  drawSprite(ctx, entry, x, y, scale = 1) {
    if (entry.type === 'sprite') {
      const w = entry.w * scale;
      const h = entry.h * scale;
      ctx.drawImage(entry.img, x - w / 2, y - h, w, h);
    } else {
      ctx.fillStyle = entry.color;
      ctx.beginPath();
      ctx.arc(x, y, entry.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  addParticle(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 120,
        vy: (Math.random() - 0.5) * 120 - 40,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 0.6 + Math.random() * 0.4,
        radius: 2 + Math.random() * 2,
        color,
      });
    }
  }

  addWorldFx(x, y, color, count = 4) {
    this.fxs.push({ x, y, color, count, life: 0.3, maxLife: 0.3 });
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.fxs.length - 1; i >= 0; i--) {
      const f = this.fxs[i];
      f.life -= dt;
      if (f.life <= 0) this.fxs.splice(i, 1);
    }
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawFxs(ctx) {
    for (const f of this.fxs) {
      const t = 1 - f.life / f.maxLife;
      ctx.globalAlpha = Math.max(0, 1 - t);
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.count * 6 * t, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawHero(ctx, state) {
    const x = this.width * 0.2;
    const y = this.heroY;
    const classId = state.hero.classId || 'unknown';
    const key = `class_${classId}`;
    const entry = this.sprite(key, 18, classId === 'guardian' ? '#ffcc00' : '#00ccff');
    ctx.save();
    ctx.globalAlpha = this.hitStop > 0 ? 0.8 : 1.0;
    this.drawSprite(ctx, entry, x, y, 0.9);
    ctx.strokeStyle = classId === 'guardian' ? '#ffcc00' : '#00ccff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
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
      const key = enemy.aspect ? `boss_${enemy.aspect}` : `enemy_${enemy.id.split('_').slice(-1)}`;
      const entry = this.sprite(key, 14, '#b7410e');
      this.drawSprite(ctx, entry, x, y, 0.8);

      if (enemy.modifier) {
        const kit = getMutationKit(enemy.modifier);
        if (kit) {
          ctx.save();
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = kit.palette.secondary;
          ctx.beginPath();
          ctx.arc(x, y - 30, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(Math.max(0, Math.floor(enemy.hp)), x, y - 24);
    });
  }

  drawHUD(ctx, state, w, h) {
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP ${Math.max(0, Math.floor(state.hero.hp))}/${state.hero.maxHp}`, 10, h - 10);
    ctx.textAlign = 'right';
    const stageLabel = state.getStageData()?.depth != null
      ? `D${state.getStageData().depth}`
      : `S${state.progression.currentStageNumber}`;
    ctx.fillText(stageLabel, w - 10, h - 10);
    if (state.frontier?.active) {
      ctx.fillStyle = '#ffcc00';
      ctx.textAlign = 'center';
      ctx.fillText(`Frontier ${stageLabel} · ${state.frontier.biome} · ${state.frontier.template}`, w / 2, h - 10);
    }
  }

  render(state) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f0f13';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, this.laneY);
    ctx.lineTo(w, this.laneY);
    ctx.stroke();

    this.drawHero(ctx, state);
    this.drawEnemies(ctx, state);
    this.updateParticles(0.016);
    this.drawParticles(ctx);
    this.drawFxs(ctx);
    this.drawHUD(ctx, state, w, h);
  }
}
