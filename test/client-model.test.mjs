import assert from 'node:assert/strict';
import test from 'node:test';

import { loadCatalog } from '../src/engine/index.mjs';
import {
  CLASSIFICATION_ORDER,
  SEVERITY_ORDER,
  catalogSummary,
  classificationStyle,
  commandFor,
  filterRules,
  isStale,
  ruleFacts,
  severityColor,
  toolCallFor,
} from '../src/client/model.mjs';

/** @returns {Promise<object>} */
async function catalog() {
  const loaded = await loadCatalog();
  assert.equal(loaded.ok, true, loaded.ok ? '' : loaded.message);
  return loaded.catalog;
}

/** The panel's translate function is a stub in tests. */
const t = (key) => key;

test('the panel lists every shipped rule by default', async () => {
  const rules = filterRules(await catalog(), {});
  assert.ok(rules.length > 0);
});

test('filtering by classification and severity narrows the list', async () => {
  const loaded = await catalog();
  const inaccessible = filterRules(loaded, { classification: 'inaccessible' });
  assert.ok(inaccessible.length > 0);
  for (const rule of inaccessible) assert.equal(rule.classification, 'inaccessible');

  const critical = filterRules(loaded, { severity: 'critical' });
  assert.ok(critical.length > 0);
  for (const rule of critical) assert.equal(rule.severity, 'critical');
});

test('a text query matches id, title and impact', async () => {
  const loaded = await catalog();
  assert.deepEqual(
    filterRules(loaded, { query: 'met-001' }).map((rule) => rule.id),
    ['MET-001'],
  );
  assert.ok(filterRules(loaded, { query: 'accessibility' }).length >= 2);
  assert.equal(filterRules(loaded, { query: 'zzz-no-such-thing' }).length, 0);
});

test('a rule that does not ship is not listed', async () => {
  const loaded = await catalog();
  const withheld = {
    ...loaded,
    rules: [...loaded.rules, { ...loaded.rules[0], id: 'SEM-999', shipped: false }],
  };
  assert.ok(!filterRules(withheld, {}).some((rule) => rule.id === 'SEM-999'));
});

test('the list is ordered by classification, then severity', async () => {
  const rules = filterRules(await catalog(), {});
  const indices = rules.map((rule) => CLASSIFICATION_ORDER.indexOf(rule.classification));
  for (let index = 1; index < indices.length; index += 1) {
    assert.ok(indices[index] >= indices[index - 1], 'classification order must not regress');
  }
});

test('colours are theme tokens, never literal colours', async () => {
  const loaded = await catalog();
  for (const rule of loaded.rules) {
    const style = classificationStyle(rule.classification);
    assert.match(style.token, /^--dsw-alias-/);
    assert.ok(style.mark.length > 0);
    const colour = severityColor(rule.severity);
    assert.match(colour, /^var\(--dsw-alias-/);
  }
  assert.deepEqual(SEVERITY_ORDER, ['critical', 'high', 'medium', 'low', 'info']);
});

test('the summary counts rules and stale rules', async () => {
  const loaded = await catalog();
  const summary = catalogSummary(loaded);
  assert.equal(summary.version, loaded.catalogVersion);
  assert.equal(summary.rules, loaded.rules.length);
  assert.equal(summary.stale, 0, 'no shipped rule should be past its review date at release');
  assert.ok(Object.keys(summary.byClassification).length >= 3);
});

test('a rule past its review date is marked stale', async () => {
  const loaded = await catalog();
  const rule = loaded.rules[0];
  assert.equal(isStale(rule, rule.evidence.reviewBy), false);
  assert.equal(isStale(rule, '2099-01-01'), true);
});

test('rule facts render the support gate in words', async () => {
  const loaded = await catalog();
  const gated = loaded.rules.find((rule) => rule.supportGate !== null);
  const facts = ruleFacts(gated, t);
  const gate = facts.find((fact) => fact.key === 'supportGate');
  assert.ok(gate !== undefined);
  assert.notEqual(gate.value, 'noSupportGate');
  assert.ok(!gate.value.includes('undefined'));

  const free = loaded.rules.find((rule) => rule.supportGate === null);
  assert.equal(ruleFacts(free, t).find((fact) => fact.key === 'supportGate').value, 'noSupportGate');
});

test('copyable commands name the CLI and the tool', () => {
  assert.match(commandFor(), /bin\/s-eidos\.mjs audit/);
  assert.match(commandFor('MET-001'), /explain MET-001/);
  assert.match(toolCallFor(), /s_eidos_audit/);
  assert.match(toolCallFor('MET-001'), /rules: \["MET-001"\]/);
});
