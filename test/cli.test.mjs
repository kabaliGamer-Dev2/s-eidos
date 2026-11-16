import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { CliExit, main } from '../src/cli/main.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));

/**
 * Drive the CLI in-process. No child process is spawned: several sandboxes forbid it, and
 * a suite that needs one is not a suite that runs everywhere.
 *
 * @param {string[]} args
 * @returns {Promise<{ code: number, stdout: string, stderr: string }>}
 */
async function runCli(args) {
  let stdout = '';
  let stderr = '';
  const io = {
    out: (text) => {
      stdout += text;
    },
    err: (text) => {
      stderr += text;
    },
    cwd: here,
    isTTY: false,
    env: {},
    today: () => '2026-11-16',
  };
  try {
    const code = await main(args, io);
    return { code, stdout, stderr };
  } catch (error) {
    if (error instanceof CliExit) {
      if (error.alreadyPrinted !== true && error.message !== '') stderr += error.message;
      return { code: error.code, stdout, stderr };
    }
    throw error;
  }
}

test('version and help are available and exit 0', async () => {
  const version = await runCli(['version']);
  assert.equal(version.code, 0);
  assert.match(version.stdout, /^s-eidos \d+\.\d+\.\d+/);

  const help = await runCli(['help']);
  assert.equal(help.code, 0);
  assert.match(help.stdout, /s-eidos audit/);
});

test('audit refuses to run without an explicit path', async () => {
  const result = await runCli(['audit']);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /never scans the working directory implicitly/);
});

test('an unknown option is rejected, not ignored', async () => {
  const result = await runCli(['audit', 'fixtures/clean', '--fix']);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /--fix|Unknown option/);
});

test('audit --format json returns a machine-readable report', async () => {
  const result = await runCli(['audit', 'fixtures/problems', '--format', 'json']);
  assert.equal(result.code, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.tool.name, 's-eidos');
  assert.ok(report.summary.findings > 0);
  assert.ok(Array.isArray(report.findings));
});

test('audit --format md returns a markdown report', async () => {
  const result = await runCli(['audit', 'fixtures/problems', '--format', 'md']);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /## S-Eidos/);
});

test('the text report is the default and contains no colour when not a TTY', async () => {
  const result = await runCli(['audit', 'fixtures/problems']);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /S-Eidos/);
  assert.ok(!result.stdout.includes('\u001B['));
});

test('--fail-on turns findings into a non-zero exit', async () => {
  const clean = await runCli(['audit', 'fixtures/clean', '--fail-on', 'critical']);
  assert.equal(clean.code, 0, clean.stderr);

  const problem = await runCli(['audit', 'fixtures/problems', '--fail-on', 'critical']);
  assert.equal(problem.code, 1, 'a critical finding must breach the gate');
});

test('--fail-on accepts only known severities', async () => {
  const result = await runCli(['audit', 'fixtures/problems', '--fail-on', 'enormous']);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /unknown severity/);
});

test('--rule narrows the scan to the named rules', async () => {
  const result = await runCli(['audit', 'fixtures/problems', '--format', 'json', '--rule', 'MET-001']);
  assert.equal(result.code, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.deepEqual([...new Set(report.findings.map((finding) => finding.ruleId))], ['MET-001']);
});

test('rules lists the catalog and explain documents one rule', async () => {
  const rules = await runCli(['rules']);
  assert.equal(rules.code, 0);
  assert.match(rules.stdout, /MET-001/);

  const explained = await runCli(['explain', 'MET-001']);
  assert.equal(explained.code, 0);
  assert.match(explained.stdout, /viewport/i);
  assert.match(explained.stdout, /https:\/\//);
  assert.match(explained.stdout, /do not flag when/);

  const missing = await runCli(['explain', 'NOPE-999']);
  assert.equal(missing.code, 2);
});

test('an unknown target preset is a usage error that names the known ones', async () => {
  const result = await runCli(['audit', 'fixtures/problems', '--targets', 'nope']);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /Known presets/);
});

test('decisions add writes nothing without --yes', async () => {
  const result = await runCli([
    'decisions',
    'add',
    '--rule',
    'MET-001',
    '--reason',
    'fixture page we do not own',
    '--review-by',
    '2027-01-01',
  ]);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Nothing has been written/);
});

test('decisions add refuses a missing reason', async () => {
  const result = await runCli(['decisions', 'add', '--rule', 'MET-001', '--review-by', '2027-01-01']);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /--reason/);
});

test('decisions add refuses an unknown rule id', async () => {
  const result = await runCli([
    'decisions',
    'add',
    '--rule',
    'NOPE-999',
    '--reason',
    'not a real rule',
    '--review-by',
    '2027-01-01',
  ]);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /no such rule/);
});
