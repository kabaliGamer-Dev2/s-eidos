import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadCatalog, scan } from '../src/engine/index.mjs';
import { readDecisions, writeDecisions } from '../src/engine/decisions.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const fixtureRoot = join(here, 'fixtures');

/**
 * Fingerprint every file under a directory: size and modification time.
 * @param {string} directory
 * @returns {Promise<Map<string, string>>}
 */
async function fingerprint(directory) {
  /** @type {Map<string, string>} */
  const entries = new Map();

  /**
   * @param {string} current
   */
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      const info = await stat(full);
      entries.set(relative(directory, full).replaceAll('\\', '/'), `${info.size}:${info.mtimeMs}`);
    }
  }

  await walk(directory);
  return entries;
}

test('a scan writes nothing to the tree it reviews', async () => {
  const before = await fingerprint(fixtureRoot);

  const loaded = await loadCatalog();
  assert.equal(loaded.ok, true, loaded.ok ? '' : loaded.message);
  const result = await scan({ root: fixtureRoot, targets: ['problems', 'clean'], catalog: loaded.catalog });
  assert.equal(result.ok, true);

  const after = await fingerprint(fixtureRoot);
  assert.deepEqual([...after.entries()], [...before.entries()], 'the scan modified the fixtures');
});

test('the only file the tool ever writes is the decisions file, and only on request', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 's-eidos-write-'));
  try {
    await writeFile(join(workspace, 'page.html'), '<!doctype html><html><body></body></html>\n');
    const before = await fingerprint(workspace);

    // A scan of the workspace must not create `.s-eidos/` or touch anything.
    const loaded = await loadCatalog();
    const result = await scan({ root: workspace, targets: ['page.html'], catalog: loaded.catalog });
    assert.equal(result.ok, true);
    assert.deepEqual(
      [...(await fingerprint(workspace).then(async (now) => now.entries()))],
      [...before.entries()],
    );

    // Reading decisions is not a write either.
    const none = await readDecisions(workspace);
    assert.equal(none.ok, true);
    assert.deepEqual(
      [...(await fingerprint(workspace).then(async (now) => now.entries()))],
      [...before.entries()],
    );

    // An explicit write creates exactly one file, in `.s-eidos/`.
    const written = await writeDecisions(workspace, [
      {
        ruleId: 'MET-001',
        decision: 'accepted',
        scope: { kind: 'rule' },
        reason: 'written by the no-write test on purpose',
        recordedAt: '2026-11-16',
        reviewBy: '2027-11-16',
      },
    ]);
    assert.equal(written.ok, true, written.message);

    const files = [...(await fingerprint(workspace)).keys()].sort();
    assert.deepEqual(files, ['.s-eidos/decisions.json', 'page.html']);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
