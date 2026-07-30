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
    this.fx = [];
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
        const kit = GAME.assets?.get(`modifier_${enemy.modifier}`) || null;
        if (kit) {
          ctx.save();
          ctx.globalAlpha = 0.4;
          ctx.drawImage(kit, x - 25, y - 40, 50, 20);
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
}
