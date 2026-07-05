import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'dist/jyaa-frontend/browser');
const payload = JSON.stringify({ build: new Date().toISOString() }, null, 2);

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'version.json'), payload);
console.log('version.json generado en', join(outDir, 'version.json'));
