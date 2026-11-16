import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, '..');
const fixtureRoot = join(here, 'fixtures');

test('no engine, host or script module imports a network API', async () => {
  /** @type {string[]} */
  const offenders = [];
  /** @type {string[]} */
  const files = [];

  /**
   * @param {string} directory
   */
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!entry.name.endsWith('.mjs') && !entry.name.endsWith('.js')) continue;
      files.push(full);
    }
  }

  for (const directory of ['src', 'bin', 'scripts']) await walk(join(root, directory));
  files.push(join(root, 'index.js'));

  const NETWORK = /\b(?:node:)?(?:https?|net|tls|dns)\b|fetch\s*\(|XMLHttpRequest|WebSocket/;
  for (const file of files) {
    // The link checker is the one deliberate exception: it exists to test citations.
    if (file.endsWith('check-links.mjs')) continue;
    const text = await readFile(file, 'utf8');
    if (NETWORK.test(text)) offenders.push(file.slice(root.length + 1));
  }

  assert.deepEqual(offenders, [], `these modules must not reference a network API: ${offenders.join(', ')}`);
});

test('a scan completes while fetch is booby-trapped', async () => {
  const { loadCatalog, scan } = await import('../src/engine/index.mjs');

  const originalFetch = globalThis.fetch;
  let calls = 0;
  // @ts-expect-error deliberately replacing the global to prove it is never used
  globalThis.fetch = () => {
    calls += 1;
    throw new Error('the engine must never call fetch');
  };

  try {
    const loaded = await loadCatalog();
    assert.equal(loaded.ok, true, loaded.ok ? '' : loaded.message);

    const result = await scan({ root: fixtureRoot, targets: ['problems'], catalog: loaded.catalog });
    assert.equal(result.ok, true, result.ok ? '' : result.error.message);
    assert.ok(result.report.summary.findings > 0, 'the scan must actually do its work');
    assert.equal(calls, 0, 'fetch was called during a scan');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('the tool half answers without any network access', async () => {
  const { apply } = await import('../index.js');

  /** @type {object[]} */
  const tools = [];
  const ctx = {
    tools: {
      register: (tool) => {
        tools.push(tool);
        return () => {};
      },
    },
    skills: { register: () => () => {} },
    effect: (run) => {
      run();
      return () => {};
    },
  };
  await apply(ctx);

  const originalFetch = globalThis.fetch;
  let calls = 0;
  // @ts-expect-error see above
  globalThis.fetch = () => {
    calls += 1;
    throw new Error('the tool must never call fetch');
  };

  try {
    const value = await tools[0].execute(
      { paths: ['problems'] },
      { agent: { session: { header: { cwd: fixtureRoot } } } },
    );
    assert.equal(value.ok, true, JSON.stringify(value.error));
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
