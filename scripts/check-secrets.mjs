#!/usr/bin/env node
/**
 * Secret scan.
 *
 * The repository must never contain a credential. This walks the shipped source (not the
 * research archive, which quotes no secrets, and not `node_modules`) and reports anything
 * that looks like a live secret.
 *
 * Two documented exceptions exist, both deliberate: the fixture that *tests* the redactor must
 * contain secret-shaped strings, and a pattern-definition file must contain the regular
 * expressions themselves. Both are listed here by exact path with a reason, so an exception is
 * deliberate rather than discovered later.
 */

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const SKIP_DIRECTORIES = new Set(['.git', 'node_modules', '.scratch', 'coverage', 'dist', '.s-eidos']);
const TEXT_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.ts',
  '.tsx',
  '.html',
  '.css',
  '.svg',
  '.txt',
]);
const MAX_FILE_BYTES = 512 * 1024;

/** Paths allowed to contain secret-shaped strings, each with the reason it must. */
const ALLOWED_PATHS = new Map([
  ['test/redact.test.mjs', 'exercises the redactor with synthetic credential shapes'],
  ['src/engine/redact.mjs', 'defines the credential patterns the redactor applies'],
  ['scripts/check-secrets.mjs', 'defines the patterns this scan applies'],
]);

/**
 * Patterns that indicate a real credential rather than an example.
 *
 * The generic key/value pattern requires the value to contain both a digit and a letter and
 * to be at least 20 characters: without that, ordinary code such as a theme token
 * (`token: '--dsw-alias-state-error-primary'`) reads as a credential, and a scanner that
 * cries wolf on its own source will be ignored on the day it is right.
 */
const PATTERNS = [
  [/\bsk-[A-Za-z0-9]{24,}/g, 'provider API key'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/g, 'GitHub token'],
  [/\bAKIA[0-9A-Z]{16}\b/g, 'AWS access key id'],
  [/\bxox[baprs]-[A-Za-z0-9-]{20,}/g, 'Slack token'],
  [/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g, 'JWT'],
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, 'private key block'],
  [
    /\b(?:password|passwd|secret|token|api[_-]?key|access[_-]?key)\s*[:=]\s*['"](?=[^'"\n]{20,}['"])(?=[^'"\n]*\d)(?=[^'"\n]*[A-Za-z])[^'"\n]+['"]/gi,
    'hard-coded credential',
  ],
];

/**
 * @returns {Promise<string[]>} relative paths of candidate files
 */
async function walk() {
  /** @type {string[]} */
  const files = [];
  /**
   * @param {string} directory
   */
  async function visit(directory) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRECTORIES.has(entry.name) || entry.name.startsWith('.')) continue;
        await visit(join(directory, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      const dot = entry.name.lastIndexOf('.');
      const extension = dot === -1 ? '' : entry.name.slice(dot).toLowerCase();
      if (!TEXT_EXTENSIONS.has(extension)) continue;
      files.push(join(directory, entry.name));
    }
  }
  await visit(root);
  return files;
}

/**
 * @returns {Promise<{ ok: boolean, findings: { path: string, line: number, kind: string }[], scanned: number, message: string }>}
 */
export async function scanForSecrets() {
  /** @type {{ path: string, line: number, kind: string }[]} */
  const findings = [];
  const files = await walk();

  for (const file of files) {
    const relativePath = relative(root, file).split(sep).join('/');
    if (ALLOWED_PATHS.has(relativePath)) continue;

    let text;
    try {
      const content = await readFile(file, 'utf8');
      if (content.length > MAX_FILE_BYTES) continue;
      text = content;
    } catch {
      continue;
    }

    const lines = text.split('\n');
    for (const [line, value] of lines.entries()) {
      for (const [pattern, kind] of PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(value)) findings.push({ path: relativePath, line: line + 1, kind });
      }
    }
  }

  const allowed = [...ALLOWED_PATHS.keys()];
  return {
    ok: findings.length === 0,
    findings,
    scanned: files.length,
    message:
      findings.length === 0
        ? `no credential-shaped string in ${files.length} file(s); ${allowed.length} documented exception(s)`
        : `${findings.length} credential-shaped string(s) found`,
  };
}

const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  const result = await scanForSecrets();
  for (const finding of result.findings) {
    process.stderr.write(`${finding.path}:${finding.line}: ${finding.kind}\n`);
  }
  if (!result.ok) {
    process.stderr.write(`${result.message}\n`);
    process.exit(1);
  }
  process.stdout.write(`${result.message}\n`);
}
