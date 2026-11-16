import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { build } from '../scripts/build-client.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, '..');

/** @param {string} path */
const read = (path) => readFile(join(root, path), 'utf8');

test('the committed client bundle matches its sources', async () => {
  const expected = await build();
  const committed = await read('client.js');
  assert.equal(committed, expected, 'client.js is out of date; run `npm run build`');
});

test('the client bundle is a single self-registering module', async () => {
  const client = await read('client.js');
  assert.match(client, /window\.__ModuleLoader__\.load\(/);
  assert.match(client, /id: 's-eidos'/);
  assert.match(client, /factory\(require\)/);
  assert.equal((client.match(/__ModuleLoader__\.load\(/g) ?? []).length, 1);
});

test('the client bundle registers the left sidebar entry and the page it opens', async () => {
  const client = await read('client.js');
  assert.match(client, /'sidebar\.panellist'/);
  assert.match(client, /name: 'main'/);
  assert.match(client, /key: PANEL_ID/);
  // One id must address both halves, or selecting the row throws in the host.
  assert.match(client, /const PANEL_ID = 's-eidos'/);
  assert.match(client, /id: PANEL_ID/);
});

test('the client bundle imports no Harness Client package and no primitive library', async () => {
  const client = await read('client.js');
  assert.ok(!client.includes('@deepseek-ai/dsh-client-ui-primitives'), 'must not import primitives');
  const requires = [...client.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)].map((match) => match[1]);
  assert.deepEqual(requires, ['react'], `only React may be required, found: ${requires.join(', ')}`);
});

test('the client bundle writes no DOM outside its components', async () => {
  const client = await read('client.js');
  assert.ok(!client.includes('document.body'));
  assert.ok(!client.includes('createElementFast'));
  assert.ok(!client.includes('innerHTML'));
  assert.ok(!client.includes('<style'));
});

test('the client bundle makes no network call and reads no host state', async () => {
  const client = await read('client.js');
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'localStorage', 'process.env']) {
    assert.ok(!client.includes(forbidden), `client bundle must not contain ${forbidden}`);
  }
});

test('the client bundle carries the catalog data it displays', async () => {
  const client = await read('client.js');
  const catalog = JSON.parse(await read('rules/catalog.json'));
  for (const rule of catalog.rules) {
    assert.ok(client.includes(rule.id), `${rule.id} missing from the built bundle`);
  }
});

test('the icon is a self-contained drawing within the size limit', async () => {
  const icon = await read('icon.svg');
  const info = await stat(join(root, 'icon.svg'));
  assert.ok(info.size <= 256 * 1024, 'icon must be under 256 KiB');
  assert.match(icon, /viewBox="0 0 36 36"/);
  for (const forbidden of ['<script', '<style', '<image', 'foreignObject', '<text', 'xlink:href', 'onload']) {
    assert.ok(!icon.includes(forbidden), `icon must not contain ${forbidden}`);
  }
});

test('the detail document is exactly one image line and the image exists', async () => {
  const detail = (await read('docs/DETAIL.md')).trim();
  const lines = detail.split('\n').filter((line) => line.trim() !== '');
  assert.equal(lines.length, 1, 'the detail document holds one feature image and nothing else');
  assert.match(lines[0], /^!\[[^\]]{10,}\]\(preview\.svg\)$/);

  const preview = await read('docs/preview.svg');
  assert.match(preview, /width="640" height="300"/);
  for (const forbidden of ['<script', '<style', '<image', 'foreignObject', '<text', 'onload']) {
    assert.ok(!preview.includes(forbidden), `preview must not contain ${forbidden}`);
  }
});

test('the bundle manifest declares the patch, the client entry and its exports', async () => {
  const manifest = JSON.parse(await read('package.json'));
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml');
  assert.equal(manifest.dsh.client.platform, 'web');
  assert.ok(Array.isArray(manifest.dsh.client.inject));
  assert.equal(manifest.exports['./client'], './client.js');
  assert.equal(manifest.exports['./icon'], './icon.svg');
  assert.equal(manifest.exports['./locale/*.json'], './locale/*.json');
  for (const required of ['index.js', 'client.js', 'cordis.patch.yml', 'icon.svg']) {
    assert.ok(manifest.files.includes(required), `${required} must be shipped`);
  }
  assert.equal(manifest.dependencies, undefined, 'a runtime dependency would break the install contract');
});

test('the patch inserts exactly one row named after the package', async () => {
  const patch = await read('cordis.patch.yml');
  const manifest = JSON.parse(await read('package.json'));
  assert.match(patch, /- insert:/);
  assert.match(patch, new RegExp(`name: ${manifest.name}`));
  assert.match(patch, /id: s-eidos/);
  assert.equal((patch.match(/- id:/g) ?? []).length, 1);
});

test('the locale file carries the display metadata the host requires', async () => {
  const locale = JSON.parse(await read('locale/en.json'));
  assert.equal(typeof locale.meta.title, 'string');
  assert.ok(locale.meta.title.length > 0);
  assert.equal(typeof locale.meta.description, 'string');
  assert.ok(locale.meta.description.length > 60, 'the description must explain what the plugin does');
  assert.equal(locale.meta.detail, 'docs/DETAIL.md');
  assert.equal(typeof locale.panel, 'string');
});

test('every locale key the panel asks for exists in the dictionary', async () => {
  const client = await read('client.js');
  const locale = JSON.parse(await read('locale/en.json'));
  const requested = new Set([...client.matchAll(/\bT\('([a-zA-Z]+)'\)/g)].map((match) => match[1]));
  for (const key of requested) {
    assert.equal(typeof locale[key], 'string', `locale is missing "${key}"`);
  }
  assert.ok(requested.size >= 15);
});

test('shipped files reference only paths that exist', async () => {
  const manifest = JSON.parse(await read('package.json'));
  const entries = await readdir(root);

  for (const entry of manifest.files) {
    if (entry.includes('*')) continue;
    const top = entry.split('/')[0];
    assert.ok(entries.includes(top), `files entry "${entry}" does not exist`);
  }
});
