import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const prototypeDir = path.join(root, 'Dwelchain-frontend-prototype');
const viewsDir = path.join(root, 'resources', 'views', 'pages');
const publicAssetsDir = path.join(root, 'public', 'assets');

const pageMap = {
  'index.html': 'home.blade.php',
  'catalog.html': 'catalog.blade.php',
  'map.html': 'map.blade.php',
  'property.html': 'property.blade.php',
  'auth.html': 'auth.blade.php',
  'account.html': 'account.blade.php',
  'property-editor.html': 'property-editor.blade.php',
  'design-system.html': 'design-system.blade.php',
};

const routeReplacements = [
  [/href="index\.html"/g, 'href="{{ url(\'/\') }}"'],
  [/href="index\.html#/g, 'href="{{ url(\'/\') }}#'],
  [/href="catalog\.html"/g, 'href="{{ url(\'/catalog\') }}"'],
  [/href="catalog\.html\?/g, 'href="{{ url(\'/catalog\') }}?'],
  [/href="map\.html"/g, 'href="{{ url(\'/map\') }}"'],
  [/href="map\.html\?/g, 'href="{{ url(\'/map\') }}?'],
  [/href="property\.html"/g, 'href="{{ url(\'/property\') }}"'],
  [/href="property\.html\?/g, 'href="{{ url(\'/property\') }}?'],
  [/href="auth\.html"/g, 'href="{{ url(\'/auth\') }}"'],
  [/href="auth\.html\?/g, 'href="{{ url(\'/auth\') }}?'],
  [/href="account\.html"/g, 'href="{{ url(\'/account\') }}"'],
  [/href="account\.html\?/g, 'href="{{ url(\'/account\') }}?'],
  [/href="property-editor\.html"/g, 'href="{{ url(\'/property-editor\') }}"'],
  [/href="property-editor\.html\?/g, 'href="{{ url(\'/property-editor\') }}?'],
  [/href="design-system\.html"/g, 'href="{{ url(\'/design-system\') }}"'],
];

const jsRouteReplacements = [
  [/index\.html/g, '/'],
  [/catalog\.html/g, '/catalog'],
  [/map\.html/g, '/map'],
  [/property\.html/g, '/property'],
  [/auth\.html/g, '/auth'],
  [/account\.html/g, '/account'],
  [/property-editor\.html/g, '/property-editor'],
  [/design-system\.html/g, '/design-system'],
];

function convertHtmlToBlade(html) {
  let content = html;
  content = content.replace(/(href|src)="assets\/([^"?]+)(\?[^"]*)?"/g, (_, attr, assetPath, query = '') => {
    return `${attr}="{{ asset('assets/${assetPath}') }}${query}"`;
  });
  for (const [pattern, replacement] of routeReplacements) {
    content = content.replace(pattern, replacement);
  }
  return content;
}

function convertJs(js) {
  let content = js;
  for (const [pattern, replacement] of jsRouteReplacements) {
    content = content.replace(pattern, replacement);
  }
  // Root-relative asset paths so they work from any route.
  content = content.replace(/(['"`])assets\//g, '$1/assets/');
  return content;
}

function convertJson(json) {
  return json.replace(/"assets\//g, '"/assets/');
}

await mkdir(viewsDir, { recursive: true });

for (const [sourceName, targetName] of Object.entries(pageMap)) {
  const source = await readFile(path.join(prototypeDir, sourceName), 'utf8');
  const converted = convertHtmlToBlade(source);
  await writeFile(path.join(viewsDir, targetName), converted, 'utf8');
  console.log(`view: ${targetName}`);
}

const jsDir = path.join(publicAssetsDir, 'js');
for (const file of await readdir(jsDir)) {
  if (!file.endsWith('.js')) continue;
  const filePath = path.join(jsDir, file);
  const source = await readFile(filePath, 'utf8');
  await writeFile(filePath, convertJs(source), 'utf8');
  console.log(`js: ${file}`);
}

const dataDir = path.join(publicAssetsDir, 'data');
for (const file of await readdir(dataDir)) {
  if (!file.endsWith('.json')) continue;
  const filePath = path.join(dataDir, file);
  const source = await readFile(filePath, 'utf8');
  await writeFile(filePath, convertJson(source), 'utf8');
  console.log(`data: ${file}`);
}

console.log('done');
