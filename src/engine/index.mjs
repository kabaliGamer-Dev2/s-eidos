/**
 * Engine entry point.
 *
 * The engine is deliberately host-agnostic: it takes a scan root, explicit targets and a
 * validated catalog, and returns a report value. The DSH plugin, the CLI and the tests all
 * call exactly this, which is why a bug found in one surface is reproducible in another.
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { formatProblems, validateCatalog } from '../../rules/schema.mjs';

export { scan } from './scan.mjs';
export { renderJson, renderMarkdown, renderText } from './report.mjs';
export { SEVERITY_ORDER, REPORT_SCHEMA_VERSION, TOOL_NAME, TOOL_VERSION } from './scan.mjs';
export {
  CLASSIFICATIONS,
  IMPACTS,
  TIERS,
  AUTOFIX,
  DOMAINS,
  validateCatalog,
  formatProblems,
} from '../../rules/schema.mjs';
export {
  readDecisions,
  writeDecisions,
  validateDecision,
  isExpired,
  findCoveringDecision,
  decisionsPath,
  DECISIONS_DIRECTORY,
} from './decisions.mjs';
export { classifyFile } from './classify.mjs';
export { resolveTargets, evaluateGate } from './targets.mjs';

/** Absolute path of the shipped catalog. */
export function defaultCatalogPath() {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', '..', 'rules', 'catalog.json');
}

/**
 * Load and validate the catalog.
 *
 * A catalog that fails validation is a hard error with every problem listed: a
 * partially-understood catalog is more dangerous than none, because a rule could then be
 * applied with the wrong classification or without its evidence.
 *
 * @param {string} [path]
 * @returns {Promise<{ ok: true, catalog: object } | { ok: false, message: string, problems?: import('../../rules/schema.mjs').Problem[] }>}
 */
export async function loadCatalog(path = defaultCatalogPath()) {
  let raw;
  try {
    raw = await readFile(path, 'utf8');
  } catch (error) {
    return { ok: false, message: `cannot read catalog at ${path}: ${String(error)}` };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return { ok: false, message: `catalog at ${path} is not valid JSON: ${String(error)}` };
  }

  const validation = validateCatalog(parsed);
  if (!validation.ok) {
    return {
      ok: false,
      message: formatProblems(validation.problems, path),
      problems: validation.problems,
    };
  }

  return { ok: true, catalog: parsed };
}

/**
 * Rules that are past their review date as of a given day.
 *
 * @param {object} catalog
 * @param {string} today ISO date
 * @returns {object[]}
 */
export function staleRules(catalog, today) {
  return catalog.rules.filter(
    (rule) => typeof rule.evidence?.reviewBy === 'string' && rule.evidence.reviewBy < today,
  );
}

/**
 * Look up one rule by id.
 * @param {object} catalog
 * @param {string} id
 * @returns {object | undefined}
 */
export function findRule(catalog, id) {
  return catalog.rules.find((rule) => rule.id === id);
}
