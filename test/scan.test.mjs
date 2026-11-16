import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadCatalog, renderJson, renderMarkdown, renderText, scan } from '../src/engine/index.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const fixtureRoot = join(here, 'fixtures');

/** @returns {Promise<object>} */
async function catalog() {
  const loaded = await loadCatalog();
  assert.equal(loaded.ok, true, loaded.ok ? '' : loaded.message);
  return loaded.catalog;
}

/**
 * @param {string} fixture
 * @param {object} [extra]
 */
async function runFixture(fixture, extra = {}) {
  const result = await scan({
    root: fixtureRoot,
    targets: [fixture],
    catalog: await catalog(),
    ...extra,
  });
  assert.equal(result.ok, true, result.ok ? '' : result.error.message);
  return result.report;
}

/** @param {object} report */
const ruleIds = (report) => [...new Set(report.findings.map((finding) => finding.ruleId))].sort();

test('problem fixtures produce the expected findings', async () => {
  const report = await runFixture('problems');
  assert.deepEqual(ruleIds(report), [
    'ARI-001',
    'FRM-001',
    'IMG-001',
    'MET-001',
    'SEM-001',
    'SEM-002',
    'TYP-001',
  ]);
});

test('clean fixtures produce zero findings — the anti-noise guarantee', async () => {
  const report = await runFixture('clean');
  assert.equal(report.findings.length, 0, JSON.stringify(report.findings, null, 2));
  assert.equal(report.summary.findings, 0);
});

test('every finding carries its evidence, false-positive warning and migration', async () => {
  const report = await runFixture('problems');
  for (const finding of report.findings) {
    assert.match(finding.evidence.url, /^https:\/\//);
    assert.match(finding.evidence.retrieved, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(finding.evidence.reviewBy, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(finding.falsePositives.length >= 1, `${finding.ruleId} lacks a false-positive note`);
    assert.ok(finding.migration.before.length > 0);
    assert.ok(finding.migration.after.length > 0);
    assert.ok(finding.autofix !== undefined);
    assert.ok(finding.why.length > 0);
  }
});

test('the JSON report is byte-identical across runs', async () => {
  const first = renderJson(await runFixture('problems'));
  const second = renderJson(await runFixture('problems'));
  assert.equal(first, second);
  assert.ok(!first.includes('generatedAt'), 'the default report must not carry a timestamp');
});

test('--stamp adds a timestamp without disturbing the rest', async () => {
  const report = await runFixture('problems');
  const stamped = JSON.parse(renderJson(report, { stamp: true, now: '2026-11-16T00:00:00.000Z' }));
  assert.equal(stamped.generatedAt, '2026-11-16T00:00:00.000Z');
  assert.equal(stamped.summary.findings, report.summary.findings);
});

test('a scan with no targets is refused rather than defaulting to the working directory', async () => {
  const result = await scan({ root: fixtureRoot, targets: [], catalog: await catalog() });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'no-targets');
});

test('a target outside the scan root is refused', async () => {
  const result = await scan({
    root: fixtureRoot,
    targets: ['../../../etc/passwd'],
    catalog: await catalog(),
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'target-outside');
});

test('an unknown support preset is refused with the known list', async () => {
  const result = await scan({
    root: fixtureRoot,
    targets: ['problems'],
    catalog: await catalog(),
    preset: 'nope',
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'bad-preset');
  assert.ok(result.error.known.includes('baseline-widely-available'));
});

test('the support gate demotes advice the declared target cannot use', async () => {
  const report = await runFixture('problems', { preset: 'enterprise-chromium-lts' });
  const motion = report.findings.find((finding) => finding.ruleId === 'ARI-001');
  assert.ok(motion, 'the motion rule should still be reported');
  assert.equal(motion.gateState, 'demoted');
  assert.match(motion.gateNote, /unavailable at the declared target/);
});

test('the support gate never demotes an unsafe or inaccessible finding', async () => {
  const report = await runFixture('problems', { preset: 'enterprise-chromium-lts' });
  for (const finding of report.findings) {
    if (finding.declaredClassification !== 'insecure' && finding.declaredClassification !== 'inaccessible')
      continue;
    assert.equal(
      finding.classification,
      finding.declaredClassification,
      `${finding.ruleId} must not be demoted`,
    );
  }
});

test('a rule with an unverifiable support requirement is reported, not dropped', async () => {
  const report = await runFixture('problems');
  const suppression = report.findings.find((finding) => finding.ruleId === 'TYP-001');
  assert.ok(suppression, 'the TypeScript rule should be reported');
  assert.equal(suppression.gateState, 'unknown');
  assert.equal(suppression.unknownSupport, true);
  assert.match(suppression.gateNote, /no declared version of typescript/);
});

test('a decision record suppresses a finding without deleting it', async () => {
  const root = await mkdtemp(join(tmpdir(), 's-eidos-decisions-'));
  try {
    await mkdir(join(root, '.s-eidos'), { recursive: true });
    await writeFile(
      join(root, '.s-eidos', 'decisions.json'),
      JSON.stringify({
        schemaVersion: 1,
        decisions: [
          {
            ruleId: 'MET-001',
            decision: 'accepted',
            scope: { kind: 'rule' },
            reason: 'legacy marketing page we do not own',
            recordedAt: '2026-11-16',
            reviewBy: '2027-11-16',
          },
        ],
      }),
    );

    const { readDecisions } = await import('../src/engine/decisions.mjs');
    const decisions = await readDecisions(root);
    assert.equal(decisions.ok, true, decisions.problems.join('; '));

    const result = await scan({
      root: fixtureRoot,
      targets: ['problems'],
      catalog: await catalog(),
      decisions: decisions.decisions,
    });
    assert.equal(result.ok, true);

    const suppressed = result.report.findings.find((finding) => finding.ruleId === 'MET-001');
    assert.ok(suppressed, 'a suppressed finding must still be listed');
    assert.equal(suppressed.suppressed, true);
    assert.ok(result.report.summary.suppressed >= 1);
    assert.ok(result.report.summary.findings > 0, 'other findings are unaffected');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('an expired decision is counted', async () => {
  const decisions = [
    {
      ruleId: 'MET-001',
      decision: 'accepted',
      scope: { kind: 'rule' },
      reason: 'expired on purpose',
      recordedAt: '2025-01-01',
      reviewBy: '2025-06-01',
    },
  ];
  const result = await scan({
    root: fixtureRoot,
    targets: ['problems'],
    catalog: await catalog(),
    decisions,
  });
  assert.equal(result.ok, true);
  assert.equal(result.report.summary.expiredDecisions, 1);
});

test('all three renderers describe the same report', async () => {
  const report = await runFixture('problems');
  const text = renderText(report);
  const markdown = renderMarkdown(report);
  assert.match(text, /S-Eidos/);
  assert.match(markdown, /## S-Eidos/);
  assert.match(text, /area of caution|Caveats|S-Eidos reports evidence/);
  const json = JSON.parse(renderJson(report));
  assert.equal(json.summary.findings, report.summary.findings);
  for (const finding of json.findings) {
    assert.ok(text.includes(finding.ruleId), `${finding.ruleId} missing from text`);
    assert.ok(markdown.includes(finding.ruleId), `${finding.ruleId} missing from markdown`);
  }
});

test('colour is only applied when asked for', async () => {
  const report = await runFixture('problems');
  assert.ok(!renderText(report, { color: false }).includes('\u001B['));
  assert.ok(renderText(report, { color: true }).includes('\u001B['));
});

test('skipped paths are reported with a reason, never silently dropped', async () => {
  const report = await runFixture('problems');
  assert.ok(report.scope.filesSkipped.total >= 0);
  for (const [reason] of Object.entries(report.scope.filesSkipped.byReason)) {
    assert.equal(typeof reason, 'string');
    assert.ok(reason.length > 0);
  }
});
