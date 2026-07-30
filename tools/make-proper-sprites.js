import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'fs';

mkdirSync('assets/art/backgrounds', { recursive: true });

async function makeSprite(path, size, draw) {
  const buf = Buffer.alloc(size * size * 4);
  for (let i = 3; i < buf.length; i += 4) buf[i] = 0;

  function setPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (y * size + x) * 4;
    buf[idx] = r;
    buf[idx + 1] = g;
    buf[idx + 2] = b;
    buf[idx + 3] = a;
  }

  draw(setPixel, size);

  const final = await sharp(buf, { raw: { width: size, height: size, channels: 4 } }).png().toBuffer();
  writeFileSync(path, final);
}

function noise(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ (t >>> 14);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function createAssets() {
  const pad = 8;

  const bossColors = [
    { file: 'assets/art/bosses/iron_golem.png', base: [120, 110, 100] },
    { file: 'assets/art/bosses/shadow_wyrm.png', base: [60, 40, 100] },
    { file: 'assets/art/bosses/moss_guardian.png', base: [40, 120, 60] },
  ];

  for (const { file, base } of bossColors) {
    const rng = noise(file.length);
    await makeSprite(file, 256, (set, s) => {
      const cx = s / 2;
      const cy = s / 2;
      const r = s / 2 - pad;
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < r) {
            const fade = 1 - Math.min(1, Math.max(0, (dist - (r - 8)) / 8));
            const variation = (rng() - 0.5) * 40;
            const alpha = dist < r - 8 ? 200 + Math.floor(rng() * 55) : Math.floor(255 * fade);
            set(x, y,
              Math.min(255, Math.max(0, base[0] + variation + (x - cx) * 0.3)) | 0,
              Math.min(255, Math.max(0, base[1] + variation + (y - cy) * 0.3)) | 0,
              Math.min(255, Math.max(0, base[2] + variation)) | 0,
              alpha
            );
          }
        }
      }
    });
  }

  const bgColors = [
    { file: 'assets/art/backgrounds/mossroad_day.png', base: [30, 70, 30] },
    { file: 'assets/art/backgrounds/mossroad_night.png', base: [15, 20, 35] },
  ];

  for (const { file, base } of bgColors) {
    const rng = noise(file.length + 1);
    await makeSprite(file, 256, (set, s) => {
      const cx = s / 2;
      const cy = s / 2;
      const r = s / 2 - pad;
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < r) {
            const fade = 1 - Math.min(1, Math.max(0, (dist - (r - 8)) / 8));
            const variation = (rng() - 0.5) * 30;
            const alpha = dist < r - 8 ? 200 + Math.floor(rng() * 55) : Math.floor(255 * fade);
            set(x, y,
              Math.min(255, Math.max(0, base[0] + variation + dx * 0.2)) | 0,
              Math.min(255, Math.max(0, base[1] + variation + dy * 0.2)) | 0,
              Math.min(255, Math.max(0, base[2] + variation)) | 0,
              alpha
            );
          }
        }
      }
    });
  }

  console.log('varied sprites created');
}

createAssets();
