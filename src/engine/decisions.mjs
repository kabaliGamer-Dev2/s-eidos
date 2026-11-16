/**
 * Decision records.
 *
 * A suppressed finding is a decision, not an absence. Every record must say why it exists
 * and when it should be looked at again, so that a dismissed finding cannot quietly become
 * permanent policy. The tool only ever writes this one file, and only when the user runs a
 * command that explicitly says so.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const DECISIONS_DIRECTORY = '.s-eidos';
export const DECISIONS_FILENAME = 'decisions.json';
export const DECISIONS_SCHEMA_VERSION = 1;
export const MINIMUM_REASON_LENGTH = 8;

/** @typedef {'accepted'|'deferred'|'false-positive'} DecisionKind */
export const DECISION_KINDS = Object.freeze(['accepted', 'deferred', 'false-positive']);

/**
 * @param {string} root
 * @returns {string}
 */
export function decisionsPath(root) {
  return join(root, DECISIONS_DIRECTORY, DECISIONS_FILENAME);
}

/**
 * Validate one decision record.
 * @param {unknown} entry
 * @returns {string[]} problems (empty when valid)
 */
export function validateDecision(entry) {
  /** @type {string[]} */
  const problems = [];
  if (typeof entry !== 'object' || entry === null) return ['a decision must be an object'];

  const record = /** @type {Record<string, unknown>} */ (entry);

  if (typeof record.ruleId !== 'string' || !/^[A-Z]{3}-\d{3}$/.test(record.ruleId)) {
    problems.push('ruleId must look like SEM-001');
  }
  if (!DECISION_KINDS.includes(/** @type {string} */ (record.decision))) {
    problems.push(`decision must be one of ${DECISION_KINDS.join(', ')}`);
  }
  if (typeof record.reason !== 'string' || record.reason.trim().length < MINIMUM_REASON_LENGTH) {
    problems.push(`reason is required and must be at least ${MINIMUM_REASON_LENGTH} characters`);
  }
  if (typeof record.reviewBy !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(record.reviewBy)) {
    problems.push('reviewBy is required and must be an ISO date (YYYY-MM-DD)');
  }
  if (typeof record.recordedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(record.recordedAt)) {
    problems.push('recordedAt must be an ISO date (YYYY-MM-DD)');
  }

  const scope = record.scope;
  if (typeof scope !== 'object' || scope === null) {
    problems.push('scope is required');
  } else {
    const typed = /** @type {Record<string, unknown>} */ (scope);
    if (typed.kind === 'path') {
      if (typeof typed.path !== 'string' || typed.path.trim() === '')
        problems.push('scope.path must be a non-empty string');
    } else if (typed.kind === 'rule') {
      // A rule-wide decision is allowed and needs no further fields.
    } else {
      problems.push('scope.kind must be "path" or "rule"');
    }
  }

  return problems;
}

/**
 * Read the decisions file, tolerating absence.
 *
 * @param {string} root
 * @returns {Promise<{ ok: boolean, decisions: Record<string, unknown>[], problems: string[] }>}
 */
export async function readDecisions(root) {
  const file = decisionsPath(root);
  let raw;
  try {
    raw = await readFile(file, 'utf8');
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') {
      return { ok: true, decisions: [], problems: [] };
    }
    return { ok: false, decisions: [], problems: [`cannot read ${file}: ${String(error)}`] };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, decisions: [], problems: [`${file} is not valid JSON`] };
  }

  if (typeof parsed !== 'object' || parsed === null || !Array.isArray(parsed.decisions)) {
    return { ok: false, decisions: [], problems: [`${file} must be an object with a "decisions" array`] };
  }

  /** @type {string[]} */
  const problems = [];
  if (parsed.schemaVersion !== DECISIONS_SCHEMA_VERSION) {
    problems.push(
      `unsupported decisions schemaVersion ${String(parsed.schemaVersion)}; expected ${DECISIONS_SCHEMA_VERSION}`,
    );
  }

  /** @type {Record<string, unknown>[]} */
  const decisions = [];
  for (const [index, entry] of parsed.decisions.entries()) {
    const entryProblems = validateDecision(entry);
    if (entryProblems.length > 0) {
      problems.push(`decisions[${index}]: ${entryProblems.join('; ')}`);
      continue;
    }
    decisions.push(entry);
  }

  return { ok: problems.length === 0, decisions, problems };
}

/**
 * Write the decisions file atomically (write beside, then rename).
 *
 * @param {string} root
 * @param {Record<string, unknown>[]} decisions
 * @returns {Promise<{ ok: boolean, path: string, message?: string }>}
 */
export async function writeDecisions(root, decisions) {
  const file = decisionsPath(root);
  const payload = `${JSON.stringify({ schemaVersion: DECISIONS_SCHEMA_VERSION, decisions }, null, 2)}\n`;
  try {
    await mkdir(dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    await writeFile(temporary, payload, 'utf8');
    await rename(temporary, file);
    return { ok: true, path: file };
  } catch (error) {
    return { ok: false, path: file, message: String(error) };
  }
}

/**
 * @param {Record<string, unknown>} decision
 * @param {string} today ISO date
 * @returns {boolean}
 */
export function isExpired(decision, today) {
  const reviewBy = typeof decision.reviewBy === 'string' ? decision.reviewBy : '';
  return reviewBy !== '' && reviewBy < today;
}

/**
 * Does a decision cover this finding?
 *
 * @param {Record<string, unknown>[]} decisions
 * @param {{ ruleId: string, file: string }} finding
 * @param {string} today ISO date
 * @returns {{ decision: Record<string, unknown>, expired: boolean } | null}
 */
export function findCoveringDecision(decisions, finding, today) {
  for (const decision of decisions) {
    if (decision.ruleId !== finding.ruleId) continue;
    const scope = /** @type {Record<string, unknown>} */ (decision.scope ?? {});
    if (scope.kind === 'path') {
      const prefix = String(scope.path ?? '');
      const matches = finding.file === prefix || finding.file.startsWith(`${prefix.replace(/\/$/, '')}/`);
      if (!matches) continue;
    }
    return { decision, expired: isExpired(decision, today) };
  }
  return null;
}
