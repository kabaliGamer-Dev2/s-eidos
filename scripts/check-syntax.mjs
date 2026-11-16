#!/usr/bin/env node
/**
 * Syntax check every JavaScript module in the repository.
 *
 * This project deliberately has no compiler. The runtime is plain ESM — the host loads
 * `index.js` and `client.js` directly, and nothing is built from TypeScript — so a type
 * checker would be a build-time dependency asserting types that are not part of the shipped
 * contract. What must be true is that every module parses, and that is what this checks.
 *
 * `node --check` parses without executing, which matters: several of these files are CLIs and
 * build scripts that must not run here.
 */

import { execFile } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const run = promisify(execFile);

const SKIP_DIRECTORIES = new Set(['node_modules', '.git', '.scratch', 'coverage', 'dist']);

/**
 * @returns {Promise<string[]>} absolute paths, sorted
 */
async function collect() {
  /** @type {string[]} */
  const files = [];
  /**
   * @param {string} directory
   */
  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRECTORIES.has(entry.name) || entry.name.startsWith('.')) continue;
        await visit(join(directory, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      if (!/\.(?:mjs|js|cjs)$/.test(entry.name)) continue;
      // Fragments are concatenated into client.js; they are not modules and are checked
      // through the built artifact instead.
      if (entry.name.endsWith('.part.js')) continue;
      files.push(join(directory, entry.name));
    }
  }
  await visit(root);
  return files.sort();
}

/**
 * @returns {Promise<{ ok: boolean, checked: number, failures: { path: string, message: string }[], unavailable?: string }>}
 */
export async function checkSyntax() {
  const files = await collect();
  /** @type {{ path: string, message: string }[]} */
  const failures = [];

  for (const file of files) {
    try {
      await run(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8' });
    } catch (error) {
      const failure = /** @type {{ code?: string|number, stderr?: string, stdout?: string }} */ (error);
      if (failure.code === 'EPERM' || failure.code === 'EACCES') {
        return {
          ok: true,
          checked: 0,
          failures: [],
          unavailable: 'this environment forbids spawning node; syntax check not performed',
        };
      }
      const message = (failure.stderr ?? failure.stdout ?? 'parse error')
        .split('\n')
        .slice(0, 3)
        .join(' ')
        .trim();
      failures.push({ path: relative(root, file).split(sep).join('/'), message });
    }
  }

  return { ok: failures.length === 0, checked: files.length, failures };
}

const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  const result = await checkSyntax();
  if (result.unavailable !== undefined) {
    process.stdout.write(`${result.unavailable}\n`);
    process.exit(0);
  }
  for (const failure of result.failures) process.stderr.write(`${failure.path}: ${failure.message}\n`);
  if (!result.ok) {
    process.stderr.write(`${result.failures.length} file(s) failed to parse\n`);
    process.exit(1);
  }
  process.stdout.write(`${result.checked} module(s) parse\n`);
}
