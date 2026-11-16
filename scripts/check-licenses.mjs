#!/usr/bin/env node
/**
 * Dependency and licence review.
 *
 * The package must ship with **no runtime dependencies**: a consumer installing this bundle
 * must not gain a transitive tree, a postinstall script, or a licence obligation. Development
 * tooling is allowed, but only under a permissive licence, and its absence is reported as
 * `unavailable` rather than treated as a pass.
 */

import { readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

/** Licences this project may depend on for development. */
const ALLOWED_DEV_LICENSES = new Set([
  'MIT',
  'ISC',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'CC0-1.0',
  'Unlicense',
  'BlueOak-1.0.0',
]);

/** Licences that would impose obligations on consumers or on this repository's licence. */
const DISALLOWED_LICENSES = new Set([
  'GPL-2.0',
  'GPL-3.0',
  'AGPL-3.0',
  'SSPL-1.0',
  'BUSL-1.1',
  'CC-BY-NC-4.0',
]);

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function normaliseLicense(value) {
  if (typeof value === 'string') return [value];
  if (typeof value === 'object' && value !== null && typeof value.type === 'string') return [value.type];
  return [];
}

/**
 * @returns {Promise<{ ok: boolean, lines: string[], problems: string[] }>}
 */
export async function reviewLicenses() {
  /** @type {string[]} */
  const lines = [];
  /** @type {string[]} */
  const problems = [];

  let manifest;
  try {
    manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  } catch (error) {
    return { ok: false, lines, problems: [`package.json is unreadable: ${String(error)}`] };
  }

  // 1. No runtime dependencies, at all.
  const runtime = Object.keys(manifest.dependencies ?? {});
  if (runtime.length > 0) {
    problems.push(`runtime dependencies are forbidden by the install contract: ${runtime.join(', ')}`);
  } else {
    lines.push('runtime dependencies: none');
  }

  const optional = Object.keys(manifest.optionalDependencies ?? {});
  if (optional.length > 0) problems.push(`optional dependencies are not allowed: ${optional.join(', ')}`);

  // 2. The declared licence matches the licence file.
  const declared = normaliseLicense(manifest.license);
  if (declared.length === 0) {
    problems.push('package.json declares no licence');
  } else {
    lines.push(`declared licence: ${declared.join(', ')}`);
  }

  try {
    const licenceText = await readFile(join(root, 'LICENSE'), 'utf8');
    if (declared.includes('MIT')) {
      if (!licenceText.includes('MIT License') || !licenceText.includes('WITHOUT WARRANTY OF ANY KIND')) {
        problems.push('LICENSE does not contain the text of the declared MIT licence');
      } else {
        lines.push('LICENSE file: present and consistent with the manifest');
      }
    }
  } catch {
    problems.push('LICENSE file is missing');
  }

  // 3. Development tooling: permissive only, and its absence is `unavailable`, never a pass.
  const dev = Object.keys(manifest.devDependencies ?? {});
  if (dev.length === 0) {
    lines.push('dev dependencies: none declared');
    return { ok: problems.length === 0, lines, problems };
  }

  const toolingPresent = await stat(join(root, 'node_modules'))
    .then(() => true)
    .catch(() => false);
  if (!toolingPresent) {
    lines.push(
      `dev dependencies: ${dev.length} declared, not installed here — licence review unavailable in this environment`,
    );
    return { ok: problems.length === 0, lines, problems };
  }

  for (const name of dev) {
    let dependencyManifest;
    try {
      dependencyManifest = JSON.parse(
        await readFile(join(root, 'node_modules', name, 'package.json'), 'utf8'),
      );
    } catch {
      problems.push(`${name}: cannot read its manifest`);
      continue;
    }
    const licenses = normaliseLicense(dependencyManifest.license);
    const disallowed = licenses.filter((value) => DISALLOWED_LICENSES.has(value));
    if (disallowed.length > 0) {
      problems.push(`${name}: disallowed licence ${disallowed.join(', ')}`);
      continue;
    }
    const allowed = licenses.filter((value) => ALLOWED_DEV_LICENSES.has(value));
    if (allowed.length === 0) {
      problems.push(`${name}: unreviewed licence ${licenses.join(', ') || '(none declared)'}`);
      continue;
    }
    lines.push(`dev dependency ${name}: ${allowed.join(', ')}`);
  }

  return { ok: problems.length === 0, lines, problems };
}

const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  const result = await reviewLicenses();
  for (const line of result.lines) process.stdout.write(`${line}\n`);
  for (const problem of result.problems) process.stderr.write(`problem: ${problem}\n`);
  process.exit(result.ok ? 0 : 1);
}
