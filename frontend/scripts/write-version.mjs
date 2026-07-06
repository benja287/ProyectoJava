import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const buildIdFile = join(root, '.build-id');
const mode = process.argv[2] ?? 'postbuild';

function buildId() {
  return process.env.BUILD_ID || new Date().toISOString();
}

if (mode === 'prebuild') {
  const id = buildId();
  writeFileSync(buildIdFile, id);
  writeFileSync(
    join(root, 'src/environments/build-version.ts'),
    `/** Auto-generado por write-version.mjs — no editar a mano */\nexport const APP_BUILD_ID = '${id}';\n`
  );
  console.log('Build ID generado:', id);
}

if (mode === 'postbuild') {
  const id = existsSync(buildIdFile) ? readFileSync(buildIdFile, 'utf8').trim() : buildId();
  const outDir = join(root, 'dist/jyaa-frontend/browser');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'version.json'), JSON.stringify({ build: id }, null, 2));

  const indexPath = join(outDir, 'index.html');
  if (existsSync(indexPath)) {
    const html = readFileSync(indexPath, 'utf8').replaceAll('__JYAA_BUILD_ID__', id);
    writeFileSync(indexPath, html);
  }

  console.log('version.json e index.html actualizados con build', id);
}
