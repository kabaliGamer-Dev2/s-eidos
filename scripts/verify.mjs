#!/usr/bin/env node
/**
 * Every local check in one command.
 *
 * The checks run in-process where they can, because a sandbox may forbid spawning a child
 * process. The test suite is separate (`npm test`) only because Node's test runner isolates
 * per file by default; `verify --with-tests` adds it for environments that allow spawning.
 *
 * Outcomes are recorded as passed | failed | unavailable | skipped. A check that could not
 * run is never reported as passing.
 */

import { execFile } from 'node:child_process';
import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { build } from './build-client.mjs';
import { reviewLicenses } from './check-licenses.mjs';
import { scanForSecrets } from './check-secrets.mjs';
import { generate } from './gen-rules-docs.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const run = promisify(execFile);

/** @param {string} path @returns {Promise<boolean>} */
const exists = (path) =>
  access(path)
    .then(() => true)
    .catch(() => false);

/**
 * @typedef {{ name: string, outcome: 'passed'|'failed'|'unavailable'|'skipped', detail: string }} CheckResult
 */

/**
 * @param {string} name
 * @param {() => Promise<{ ok: boolean, detail: string } | { unavailable: string }>} run_check
 * @returns {Promise<CheckResult>}
 */
async function check(name, run_check) {
  try {
    const result = await run_check();
    if ('unavailable' in result) return { name, outcome: 'unavailable', detail: result.unavailable };
    return { name, outcome: result.ok ? 'passed' : 'failed', detail: result.detail };
  } catch (error) {
    return { name, outcome: 'failed', detail: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * @param {object} options
 * @param {boolean} options.withTests
 * @param {boolean} options.offline
 * @returns {Promise<CheckResult[]>}
 */
export async function verify(options) {
  /** @type {CheckResult[]} */
  const results = [];

  results.push(
    await check('client bundle is current', async () => {
      const built = await build();
      const { readFile } = await import('node:fs/promises');
      const committed = await readFile(join(root, 'client.js'), 'utf8').catch(() => '');
      return committed === built
        ? { ok: true, detail: `${built.length} bytes` }
        : { ok: false, detail: 'client.js drifts from src/client — run `npm run build`' };
    }),
  );

  results.push(
    await check('rule reference is current', async () => {
      const result = await generate({ check: true });
      return { ok: result.ok, detail: result.message };
    }),
  );

  results.push(
    await check('no credential-shaped strings', async () => {
      const result = await scanForSecrets();
      return { ok: result.ok, detail: result.message };
    }),
  );

  results.push(
    await check('licence and dependency policy', async () => {
      const result = await reviewLicenses();
      return result.ok
        ? { ok: true, detail: result.lines.join(' · ') }
        : { ok: false, detail: result.problems.join(' · ') };
    }),
  );

  results.push(
    await check('catalog validates and every rule has evidence', async () => {
      const { loadCatalog } = await import('../src/engine/index.mjs');
      const loaded = await loadCatalog();
      if (!loaded.ok) return { ok: false, detail: loaded.message };
      return {
        ok: true,
        detail: `${loaded.catalog.rules.length} rule(s), catalog ${loaded.catalog.catalogVersion}`,
      };
    }),
  );

  results.push(
    await check('every module parses', async () => {
      const { checkSyntax } = await import('./check-syntax.mjs');
      const result = await checkSyntax();
      if (result.unavailable !== undefined) return { unavailable: result.unavailable };
      return result.ok
        ? { ok: true, detail: `${result.checked} module(s)` }
        : {
            ok: false,
            detail: result.failures.map((failure) => `${failure.path}: ${failure.message}`).join('; '),
          };
    }),
  );

  results.push(
    await check('lint', async () => {
      const entry = join(root, 'node_modules', 'eslint', 'bin', 'eslint.js');
      if (!(await exists(entry))) return { unavailable: 'eslint is not installed; run `npm install`' };
      try {
        await run(process.execPath, [entry, '.'], { cwd: root, encoding: 'utf8' });
        return { ok: true, detail: 'no findings' };
      } catch (error) {
        const failure = /** @type {{ code?: string|number, stdout?: string, stderr?: string }} */ (error);
        if (failure.code === 'EPERM' || failure.code === 'EACCES') {
          return { unavailable: 'this environment forbids spawning the linter' };
        }
        return {
          ok: false,
          detail: String(failure.stdout ?? failure.stderr ?? 'lint failed').slice(0, 2000),
        };
      }
    }),
  );

  results.push(
    await check('format', async () => {
      const entry = join(root, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
      if (!(await exists(entry))) return { unavailable: 'prettier is not installed; run `npm install`' };
      try {
        const { stdout } = await run(process.execPath, [entry, '--check', '**/*.{mjs,js,json,yml,yaml}'], {
          cwd: root,
          encoding: 'utf8',
        });
        return { ok: true, detail: stdout.includes('All matched files') ? 'all files formatted' : 'clean' };
      } catch (error) {
        const failure = /** @type {{ code?: string|number, stderr?: string }} */ (error);
        if (failure.code === 'EPERM' || failure.code === 'EACCES') {
          return { unavailable: 'this environment forbids spawning the formatter' };
        }
        return { ok: false, detail: String(failure.stderr ?? 'format check failed').slice(0, 2000) };
      }
    }),
  );

  results.push(
    await check('citation links resolve', async () => {
      const { checkLinks } = await import('./check-links.mjs');
      const result = await checkLinks({ offline: options.offline });
      const detail = options.offline
        ? 'offline mode: links not requested'
        : `${result.checked} checked, ${result.failed.length} dead, ${result.unverified.length} unverified`;
      return result.ok ? { ok: true, detail } : { ok: false, detail };
    }),
  );

  if (options.withTests) {
    results.push(
      await check('test suite', async () => {
        try {
          const { stdout } = await run(
            process.execPath,
            ['--test', '--test-isolation=none', 'test/*.test.mjs'],
            {
              cwd: root,
              encoding: 'utf8',
              shell: false,
            },
          );
          const pass = /\bpass (\d+)/.exec(stdout)?.[1] ?? '?';
          return { ok: true, detail: `${pass} test(s) passed` };
        } catch (error) {
          if (error instanceof Error && 'code' in error && error.code === 'EPERM') {
            return { unavailable: 'this environment forbids spawning the test runner; run `npm test`' };
          }
          return { ok: false, detail: 'the test suite failed' };
        }
      }),
    );
  } else {
    results.push({
      name: 'test suite',
      outcome: 'skipped',
      detail: 'run `npm test`, or `verify --with-tests`',
    });
  }

  return results;
}

const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  const results = await verify({
    withTests: process.argv.includes('--with-tests'),
    offline: process.argv.includes('--offline'),
  });

  const width = Math.max(...results.map((result) => result.name.length));
  for (const result of results) {
    process.stdout.write(`${result.outcome.padEnd(12)} ${result.name.padEnd(width)}  ${result.detail}\n`);
  }

  const failed = results.filter((result) => result.outcome === 'failed');
  const passed = results.filter((result) => result.outcome === 'passed').length;
  process.stdout.write(`\n${passed}/${results.length} passed, ${failed.length} failed\n`);
  process.exit(failed.length === 0 ? 0 : 1);
}
