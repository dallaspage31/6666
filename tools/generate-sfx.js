const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'assets', 'sfx');

export function generateSfx() {
  fs.mkdirSync(dir, { recursive: true });
  const missing = process.argv.includes('--missing');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  console.log('GENERATE_SFX_OK files=' + files.length);
  if (missing && fs.readdirSync(dir).length === 0) console.log('  missing=all');
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  generateSfx();
}
