import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function checkDesktop() {
  const root = join(__dirname, '..');
  const files = readdirSync(root, { recursive: false });
  const issues = [];
  if (!files.includes('index.html')) issues.push('missing index.html');
  if (!files.includes('package.json')) issues.push('missing package.json');
  console.log('DESKTOP_CHECK');
  if (issues.length > 0) {
    for (const i of issues) console.log('  WARN: ' + i);
  } else {
    console.log('  OK');
  }
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  checkDesktop();
}
