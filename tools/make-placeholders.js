import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'fs';

const dirs = [
  'assets/art/backgrounds',
  'assets/art/bosses',
  'assets/art/mossroad/foreground',
  'assets/art/mossroad/ambient',
];

for (const d of dirs) {
  try { mkdirSync(d, { recursive: true }); } catch {}
}

async function makePlaceholder(path, size, color) {
  const png = await sharp({
    create: { width: size, height: size, channels: 4, background: color },
  }).png().toBuffer();
  writeFileSync(path, png);
}

await makePlaceholder('assets/art/bosses/iron_golem.png', 256, { r: 90, g: 80, b: 80, alpha: 1 });
await makePlaceholder('assets/art/bosses/shadow_wyrm.png', 256, { r: 40, g: 30, b: 60, alpha: 1 });
await makePlaceholder('assets/art/bosses/moss_guardian.png', 256, { r: 30, g: 100, b: 50, alpha: 1 });
await makePlaceholder('assets/art/backgrounds/mossroad_day.png', 256, { r: 20, g: 40, b: 20, alpha: 1 });
await makePlaceholder('assets/art/backgrounds/mossroad_night.png', 256, { r: 10, g: 15, b: 25, alpha: 1 });

console.log('placeholders created');
