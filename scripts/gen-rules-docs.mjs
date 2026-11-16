#!/usr/bin/env node
/**
 * Generate `docs/rules/` from the catalog.
 *
 * The rule reference is generated rather than hand-written so it cannot drift from the
 * catalog that the engine actually loads. `--check` fails when a committed file differs.
 */

import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { loadCatalog } from '../src/engine/index.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const outputDirectory = join(root, 'docs', 'rules');

/** @param {string} value @returns {string} */
const cell = (value) => String(value).replace(/\|/g, '\\|');

/**
 * @param {object} rule
 * @returns {string}
 */
function renderRule(rule) {
  const gate =
    rule.supportGate === null
      ? 'Applies regardless of the declared target.'
      : rule.supportGate.kind === 'browser-feature'
        ? `Requires the \`${rule.supportGate.feature}\` feature at \`${rule.supportGate.requires}\` or newer.`
        : `Requires ${rule.supportGate.framework} \`${rule.supportGate.requires}\`.`;

  const lines = [
    `# ${rule.id} — ${rule.title}`,
    '',
    '> Generated from `rules/catalog.json` by `scripts/gen-rules-docs.mjs`. Do not edit by hand.',
    '',
    `**Classification:** \`${rule.classification}\`  `,
    `**Impact:** ${rule.impact.map((impact) => `\`${impact}\``).join(', ')}  `,
    `**Severity:** \`${rule.severity}\`  `,
    `**Confidence:** finding \`${rule.confidence}\`, remediation \`${rule.remediationConfidence}\`  `,
    `**Detectability tier:** \`${rule.tier}\`  `,
    `**Autofix:** \`${rule.autofix}\``,
    '',
    '## Why it matters',
    '',
    rule.why,
    '',
    '## What is detected',
    '',
    rule.detectionHint,
    '',
    '## Do not flag when',
    '',
    ...rule.falsePositives.map((condition) => `- ${condition}`),
    '',
    '## Migration',
    '',
    '```text',
    `before: ${rule.migration.before}`,
    `after:  ${rule.migration.after}`,
    '```',
    '',
  ];

  if (rule.migration.notes !== undefined) {
    lines.push(rule.migration.notes, '');
  }

  lines.push(
    '## Support',
    '',
    gate,
    '',
    '## Evidence',
    '',
    `- [${rule.evidence.title}](${rule.evidence.url}) — ${rule.evidence.authority}`,
    `- Retrieved: ${rule.evidence.retrieved}`,
    `- Review by: ${rule.evidence.reviewBy}`,
    '',
  );

  if (rule.standards !== undefined && rule.standards.length > 0) {
    lines.push(
      '## References',
      '',
      ...rule.standards.map((entry) => `- ${entry.framework} ${entry.id}`),
      '',
      '_A reference points at a standard for context. It is not a conformance claim._',
      '',
    );
  }

  return lines.join('\n');
}

/**
 * @param {object} catalog
 * @returns {string}
 */
function renderIndex(catalog) {
  const lines = [
    '# Rule reference',
    '',
    '> Generated from `rules/catalog.json` by `scripts/gen-rules-docs.mjs`. Do not edit by hand.',
    '',
    `Catalog \`${catalog.catalogVersion}\`, as of ${catalog.asOf}. ${catalog.rules.length} rule(s).`,
    '',
    '| Rule | Title | Classification | Impact | Severity | Confidence | Tier | Autofix |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const rule of catalog.rules) {
    lines.push(
      `| [\`${rule.id}\`](${rule.id}.md) | ${cell(rule.title)} | ${rule.classification} | ${rule.impact.join(', ')} | ${rule.severity} | ${rule.confidence} | ${rule.tier} | ${rule.autofix} |`,
    );
  }

  lines.push(
    '',
    '## How to read this table',
    '',
    '- `Classification` says what kind of statement the rule makes; `deprecated` is used only where a cited source says so.',
    '- `Impact` says why a change would pay. It is independent of classification.',
    '- `Confidence` is a judgement about matches, not measured calibration; every rule page lists the conditions under which it must not be flagged.',
    '- `Tier` `a` is a reliable lexical match, `b` a bounded heuristic. No tier `c` rule ships in this version.',
    '- `Autofix` records a policy this version does **not** execute. Nothing is applied automatically.',
    '',
  );

  return lines.join('\n');
}

/**
 * @param {{ check: boolean }} options
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
export async function generate({ check }) {
  const loaded = await loadCatalog();
  if (!loaded.ok) return { ok: false, message: loaded.message };
  const catalog = loaded.catalog;

  /** @type {Map<string, string>} */
  const expected = new Map();
  expected.set('index.md', renderIndex(catalog));
  for (const rule of catalog.rules) expected.set(`${rule.id}.md`, renderRule(rule));

  if (check) {
    const problems = [];
    /** @type {string[]} */
    let existing;
    try {
      existing = await readdir(outputDirectory);
    } catch {
      return { ok: false, message: `${outputDirectory} does not exist; run \`npm run docs:rules\`` };
    }
    if (existing.length === 0) problems.push(`${outputDirectory} is empty`);
    for (const [name, content] of expected) {
      let actual;
      try {
        actual = await readFile(join(outputDirectory, name), 'utf8');
      } catch {
        problems.push(`${name} is missing`);
        continue;
      }
      if (actual !== content) problems.push(`${name} is out of date`);
    }
    for (const name of existing) {
      if (name.endsWith('.md') && !expected.has(name))
        problems.push(`${name} exists but is not in the catalog`);
    }
    return problems.length === 0
      ? { ok: true, message: `docs/rules is up to date (${expected.size} file(s))` }
      : { ok: false, message: problems.join('\n') };
  }

  await mkdir(outputDirectory, { recursive: true });
  const existing = await readdir(outputDirectory).catch(() => []);
  for (const [name, content] of expected) await writeFile(join(outputDirectory, name), content, 'utf8');
  for (const name of existing) {
    if (name.endsWith('.md') && !expected.has(name)) await unlink(join(outputDirectory, name));
  }
  return { ok: true, message: `wrote ${expected.size} file(s) to docs/rules` };
}

const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  const result = await generate({ check: process.argv.includes('--check') });
  if (!result.ok) {
    process.stderr.write(`${result.message}\n`);
    process.exit(1);
  }
  process.stdout.write(`${result.message}\n`);
}
