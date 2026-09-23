// Entrypoint bridge for runtimes executing 'node server.js'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distServer = path.join(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(distServer)) {
  await import('./dist/server.cjs');
} else {
  await import('./server.ts');
}

