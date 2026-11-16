import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { loadCatalog, defaultCatalogPath, staleRules, findRule } from '../src/engine/index.mjs';
import { CLASSIFICATIONS, IMPACTS, validateCatalog, formatProblems } from '../rules/schema.mjs';

/** @returns {Promise<object>} the shipped catalog */
async function shipped() {
  const loaded = await loadCatalog();
  assert.equal(loaded.ok, true, loaded.ok ? '' : loaded.message);
  return loaded.catalog;
}

test('the shipped catalog is valid', async () => {
  const catalog = await shipped();
  assert.equal(catalog.schemaVersion, 1);
  assert.match(catalog.catalogVersion, /^\d+\.\d+\.\d+$/);
  assert.match(catalog.asOf, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(catalog.rules.length > 0);
});

test('every rule id is unique and uses a declared domain prefix', async () => {
  const catalog = await shipped();
  const ids = catalog.rules.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length, 'rule ids must be unique');
  for (const id of ids) assert.match(id, /^[A-Z]{3}-\d{3}$/);
});

test('a rule may only claim "deprecated" when it names the source that says so', () => {
  const base = {
    schemaVersion: 1,
    catalogVersion: '0.0.0',
    asOf: '2026-11-16',
    supportPresets: { 'baseline-widely-available': { title: 'x', rank: 4, default: true } },
    features: {},
    rules: [
      {
        id: 'SEM-001',
        title: 'example',
        classification: 'deprecated',
        impact: ['maintainability'],
        severity: 'low',
        confidence: 'high',
        remediationConfidence: 'high',
        tier: 'a',
        detector: 'suppression-comment',
        detectorParams: {},
        appliesTo: { languages: ['js'], frameworks: ['plain'], fileKinds: ['script'] },
        supportGate: null,
        evidence: {
          url: 'https://example.com/doc',
          title: 'doc',
          authority: 'example.com',
          retrieved: '2026-11-16',
          reviewBy: '2027-11-16',
        },
        why: 'because',
        detectionHint: 'a shape',
        falsePositives: ['when it is fine'],
        migration: { before: 'a', after: 'b' },
        autofix: 'none',
        suppressible: true,
      },
    ],
  };

  const withoutSource = validateCatalog(structuredClone(base));
  assert.equal(withoutSource.ok, false);
  assert.ok(withoutSource.problems.some((problem) => problem.path.endsWith('deprecatedBySource')));

  base.rules[0].deprecatedBySource = 'MDN says so';
  const withSource = validateCatalog(base);
  assert.equal(withSource.ok, true, formatProblems(withSource.problems));
});

test('a rule must list at least one false-positive condition', () => {
  const catalog = {
    schemaVersion: 1,
    catalogVersion: '0.0.0',
    asOf: '2026-11-16',
    supportPresets: { p: { title: 'p', rank: 1, default: true } },
    features: {},
    rules: [
      {
        id: 'SEM-001',
        title: 'example',
        classification: 'obsolete',
        impact: ['correctness'],
        severity: 'low',
        confidence: 'high',
        remediationConfidence: 'high',
        tier: 'a',
        detector: 'suppression-comment',
        detectorParams: {},
        appliesTo: { languages: ['js'], frameworks: ['plain'], fileKinds: ['script'] },
        supportGate: null,
        evidence: {
          url: 'https://example.com/doc',
          title: 'doc',
          authority: 'example.com',
          retrieved: '2026-11-16',
          reviewBy: '2027-11-16',
        },
        why: 'because',
        detectionHint: 'a shape',
        falsePositives: [],
        migration: { before: 'a', after: 'b' },
        autofix: 'none',
        suppressible: true,
      },
    ],
  };
  const result = validateCatalog(catalog);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((problem) => problem.path.endsWith('falsePositives')));
});

test('a support gate may only name a declared feature', () => {
  const catalog = {
    schemaVersion: 1,
    catalogVersion: '0.0.0',
    asOf: '2026-11-16',
    supportPresets: { p: { title: 'p', rank: 1, default: true } },
    features: {},
    rules: [
      {
        id: 'ARI-001',
        title: 'example',
        classification: 'situational',
        impact: ['accessibility'],
        severity: 'low',
        confidence: 'medium',
        remediationConfidence: 'high',
        tier: 'b',
        detector: 'unguarded-motion',
        detectorParams: {},
        appliesTo: { languages: ['css'], frameworks: ['plain'], fileKinds: ['style'] },
        supportGate: { kind: 'browser-feature', feature: 'not-declared', requires: 'p' },
        evidence: {
          url: 'https://example.com/doc',
          title: 'doc',
          authority: 'example.com',
          retrieved: '2026-11-16',
          reviewBy: '2027-11-16',
        },
        why: 'because',
        detectionHint: 'a shape',
        falsePositives: ['when it is fine'],
        migration: { before: 'a', after: 'b' },
        autofix: 'none',
        suppressible: true,
      },
    ],
  };
  const result = validateCatalog(catalog);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((problem) => problem.path.includes('supportGate.feature')));
});

test('every shipped rule carries a dated citation and a future review date', async () => {
  const catalog = await shipped();
  for (const rule of catalog.rules) {
    assert.match(rule.evidence.url, /^https:\/\//, `${rule.id} needs an https evidence URL`);
    assert.match(rule.evidence.retrieved, /^\d{4}-\d{2}-\d{2}$/, `${rule.id} needs a retrieval date`);
    assert.match(rule.evidence.reviewBy, /^\d{4}-\d{2}-\d{2}$/, `${rule.id} needs a review date`);
    assert.ok(
      rule.evidence.reviewBy > rule.evidence.retrieved,
      `${rule.id} review date must follow retrieval`,
    );
  }
});

test('the shipped catalog uses only the declared classifications and impacts', async () => {
  const catalog = await shipped();
  for (const rule of catalog.rules) {
    assert.ok(CLASSIFICATIONS.includes(rule.classification), `${rule.id}: ${rule.classification}`);
    for (const impact of rule.impact) assert.ok(IMPACTS.includes(impact), `${rule.id}: ${impact}`);
  }
});

test('no shipped rule requires data-flow analysis', async () => {
  const catalog = await shipped();
  for (const rule of catalog.rules) {
    if (rule.shipped === false) continue;
    assert.notEqual(rule.tier, 'c', `${rule.id} is tier c and must not ship`);
  }
});

test('stale rules are detected by review date', async () => {
  const catalog = await shipped();
  const none = staleRules(catalog, '2026-01-01');
  assert.equal(none.length, 0, 'nothing is stale before its review date');
  const later = staleRules(catalog, '2099-01-01');
  assert.equal(later.length, catalog.rules.length, 'everything is stale far in the future');
});

test('findRule looks up by id and misses cleanly', async () => {
  const catalog = await shipped();
  assert.equal(findRule(catalog, 'MET-001')?.id, 'MET-001');
  assert.equal(findRule(catalog, 'XXX-999'), undefined);
});

test('the catalog on disk is the file the engine loads', async () => {
  const path = defaultCatalogPath();
  const raw = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(raw.catalogVersion, (await shipped()).catalogVersion);
});
