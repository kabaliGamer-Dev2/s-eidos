#!/usr/bin/env node
/**
 * Lot of evidence, and evidence rots. This checks that every URL the catalog cites, and every
 * URL in the research source register, still resolves.
 *
 * A dead citation is a correctness bug in a tool whose only value is evidence, so this is a
 * failing check for `404`/`410`. Rate limits and transient network failures are reported as
 * `unverified` rather than as failures: a blocked request is not a dead source.
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const CONCURRENCY = 6;
const TIMEOUT_MS = 15_000;
const ATTEMPTS = 2;

/**
 * URLs that are recorded on purpose but are not navigable pages, so a 404 says nothing about
 * whether the citation is sound. Each needs a reason: an unexplained exception is how a dead
 * link survives a check.
 */
const NOT_A_PAGE = new Map([
  [
    'https://developer.chrome.com/docs/ai/modern-web-guidance',
    'recorded in the research notes as the stale URL from the original brief, which returns 404',
  ],
  [
    'https://api.webstatus.dev/v1/features/',
    'an API base endpoint used to look up a feature by id, not a document',
  ],
  ['https://raw.githubusercontent.com/mdn/browser-compat-data/main/', 'a repository base path, not a file'],
]);

/**
 * @param {string} url
 * @returns {Promise<{ url: string, status: number | 'error' | 'timeout', ok: boolean, note?: string }>}
 */
async function checkOne(url) {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': 's-eidos-link-check (+https://github.com/)' },
      });
      // Read nothing: the status line is all this needs, and the body may be large.
      void response.body?.cancel?.();
      if (response.status === 404 || response.status === 410) {
        return { url, status: response.status, ok: false };
      }
      if (response.status === 429) {
        return { url, status: 429, ok: true, note: 'rate limited; unverified' };
      }
      return {
        url,
        status: response.status,
        ok: response.status < 500,
        note: response.status >= 500 ? 'server error; unverified' : undefined,
      };
    } catch (error) {
      if (attempt === ATTEMPTS) {
        const timedOut = error instanceof Error && error.name === 'AbortError';
        return {
          url,
          status: timedOut ? 'timeout' : 'error',
          ok: true,
          note: 'unverified; the request did not complete',
        };
      }
    } finally {
      clearTimeout(timer);
    }
  }
  return { url, status: 'error', ok: true, note: 'unverified' };
}

/**
 * Every URL the catalog and the research register mention.
 * @returns {Promise<string[]>}
 */
async function collectUrls() {
  const urls = new Set();

  const catalog = JSON.parse(await readFile(join(root, 'rules', 'catalog.json'), 'utf8'));
  for (const rule of catalog.rules) urls.add(rule.evidence.url);
  for (const feature of Object.values(catalog.features ?? {})) {
    if (typeof feature.doc === 'string') urls.add(feature.doc);
  }

  for (const register of ['research/source-register.md']) {
    let text;
    try {
      text = await readFile(join(root, register), 'utf8');
    } catch {
      continue;
    }
    for (const match of text.matchAll(/https?:\/\/[^\s|)\]"'<>]+/g)) {
      const url = match[0].replace(/[.,;:]+$/, '');
      if (url.startsWith('https://')) urls.add(url);
    }
  }

  return [...urls].sort();
}

/**
 * @param {{ offline?: boolean }} [options]
 * @returns {Promise<{ ok: boolean, checked: number, failed: { url: string, status: unknown }[], unverified: { url: string, note: string }[] }>}
 */
export async function checkLinks(options = {}) {
  const all = await collectUrls();
  const skipped = all.filter((url) => NOT_A_PAGE.has(url));
  const urls = all.filter((url) => !NOT_A_PAGE.has(url));
  if (options.offline === true) {
    return {
      ok: true,
      checked: 0,
      failed: [],
      unverified: urls.map((url) => ({ url, note: 'offline mode' })),
      skipped,
    };
  }

  /** @type {{ url: string, status: unknown, ok: boolean, note?: string }[]} */
  const results = [];
  for (let index = 0; index < urls.length; index += CONCURRENCY) {
    const batch = urls.slice(index, index + CONCURRENCY);
    results.push(...(await Promise.all(batch.map((url) => checkOne(url)))));
  }

  return {
    ok: results.every((result) => result.ok),
    checked: results.length,
    failed: results.filter((result) => !result.ok).map(({ url, status }) => ({ url, status })),
    unverified: results.filter((result) => result.note !== undefined).map(({ url, note }) => ({ url, note })),
    skipped,
  };
}

const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  const offline = process.argv.includes('--offline');
  const result = await checkLinks({ offline });
  for (const failure of result.failed)
    process.stderr.write(`dead: ${failure.url} (${String(failure.status)})\n`);
  for (const note of result.unverified) process.stdout.write(`unverified: ${note.url} — ${note.note}\n`);
  for (const url of result.skipped) process.stdout.write(`not a page: ${url} — ${NOT_A_PAGE.get(url)}\n`);
  process.stdout.write(
    `checked ${result.checked} URL(s); ${result.failed.length} dead, ${result.unverified.length} unverified, ${result.skipped.length} not a page\n`,
  );
  process.exit(result.ok ? 0 : 1);
}
