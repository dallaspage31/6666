import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

export function verifyAssets() {
  const dirs = ['assets/art/units', 'assets/art/vfx', 'assets/art/bosses', 'assets/art/backgrounds', 'assets/art/mossroad/foreground', 'assets/art/mossroad/ambient'];
  const issues = [];
  for (const d of dirs) {
    const full = join(root, d);
    try {
      const files = readdirSync(full).filter((f) => f.endsWith('.png'));
      for (const f of files) {
        const path = join(full, f);
        const size = statSync(path).size;
        if (size < 100) issues.push(`${d}/${f}: suspiciously small (${size} bytes)`);
      }
    } catch (e) {
      issues.push(`${d}: missing`);
    }
  }
  if (issues.length > 0) {
    console.log('ASSET_VERIFY_FAIL');
    for (const i of issues) console.log('  ' + i);
    process.exitCode = 1;
  } else {
    console.log('ASSET_VERIFY_OK');
  }
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  verifyAssets();
}
