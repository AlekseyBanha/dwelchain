import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const client = resolve(dist, 'client');

await rm(dist, { recursive: true, force: true });
await mkdir(client, { recursive: true });
await mkdir(resolve(dist, 'server'), { recursive: true });

for (const file of ['index.html', 'catalog.html', 'property.html', 'map.html', 'design-system.html', 'auth.html', 'account.html', 'property-editor.html']) {
  await cp(resolve(root, file), resolve(client, file));
}

await cp(resolve(root, 'assets'), resolve(client, 'assets'), { recursive: true });
await cp(resolve(root, 'worker', 'index.js'), resolve(dist, 'server', 'index.js'));

console.log('Dwelchain static build ready in dist/');
