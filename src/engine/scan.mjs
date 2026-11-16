/**
 * Scan orchestration.
 *
 * The pipeline is deliberately small and ordered:
 *   collect bounded files → classify each file → select rules that apply → detect →
 *   evaluate the support gate → collapse hits per site → attach decisions → summarise.
 *
 * Nothing here writes to the scanned tree, nothing calls the network, and a single
 * unreadable file never aborts the run: it becomes a reported skip.
 */

import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { classifyFile, readProjectFacts } from './classify.mjs';
import { findCoveringDecision, isExpired } from './decisions.mjs';
import { runDetector } from './detectors/index.mjs';
import { excerpt } from './redact.mjs';
import { evaluateGate, isDemotable, resolveTargets } from './targets.mjs';
import { collectFiles } from './walk.mjs';

export const REPORT_SCHEMA_VERSION = 1;
export const TOOL_NAME = 's-eidos';
export const TOOL_VERSION = '0.1.0';

/** Severity order used for deterministic sorting. */
export const SEVERITY_ORDER = Object.freeze({ critical: 0, high: 1, medium: 2, low: 3, info: 4 });

/** Hard caps that keep a report parseable by a human and by a model. */
export const REPORT_LIMITS = Object.freeze({ maxFindings: 500, maxSkippedListed: 50 });

/**
 * @typedef {object} ScanRequest
 * @property {string} root absolute path the targets are resolved against
 * @property {string[]} targets explicit paths
 * @property {object} catalog validated catalog document
 * @property {string} [preset] support preset name
 * @property {Record<string, unknown>[]} [decisions] decision records already read
 * @property {string} [today] ISO date used for staleness and decision expiry
 * @property {string[]} [onlyRules] restrict to these rule ids
 * @property {Partial<typeof import('./walk.mjs').DEFAULT_LIMITS>} [limits]
 * @property {AbortSignal} [signal]
 */

/**
 * @param {object} rule
 * @param {{ language: string, framework: string, kind: string }} file
 * @returns {boolean}
 */
function ruleAppliesToFile(rule, file) {
  const applies = rule.appliesTo ?? {};
  const languages = Array.isArray(applies.languages) ? applies.languages : [];
  const frameworks = Array.isArray(applies.frameworks) ? applies.frameworks : [];
  const kinds = Array.isArray(applies.fileKinds) ? applies.fileKinds : [];

  const languageOk =
    languages.includes(file.language) ||
    // A framework image/attribute rule may target JSX/TSX through either name.
    (file.language === 'tsx' && languages.includes('tsx')) ||
    (file.language === 'jsx' && languages.includes('jsx'));
  if (!languageOk) return false;

  const frameworkOk =
    frameworks.includes(file.framework) || (file.framework === 'plain' && frameworks.includes('plain'));
  if (!frameworkOk) return false;

  return kinds.includes(file.kind);
}

/**
 * @param {string} root
 * @returns {Promise<{ dependencies: Record<string, string>, hasAppDirectory: boolean }>}
 */
async function readProject(root) {
  let packageJsonText;
  try {
    packageJsonText = await readFile(join(root, 'package.json'), 'utf8');
  } catch {
    packageJsonText = undefined;
  }
  // A Next.js App Router project is recognised by its `app/` directory; anything else is not.
  const hasAppDirectory = await stat(join(root, 'app'))
    .then((info) => info.isDirectory())
    .catch(() => false);
  return readProjectFacts({ packageJsonText, hasAppDirectory });
}

/**
 * Aggregate skipped paths into reason counts plus a bounded sample.
 * A count is never printed without the reasons behind it.
 *
 * @param {{ path: string, reason: string }[]} skipped
 * @returns {{ total: number, byReason: Record<string, number>, sample: { path: string, reason: string }[], truncated: boolean }}
 */
function summariseSkips(skipped) {
  /** @type {Record<string, number>} */
  const byReason = {};
  for (const entry of skipped) byReason[entry.reason] = (byReason[entry.reason] ?? 0) + 1;
  return {
    total: skipped.length,
    byReason,
    sample: skipped.slice(0, REPORT_LIMITS.maxSkippedListed),
    truncated: skipped.length > REPORT_LIMITS.maxSkippedListed,
  };
}

/**
 * Run a scan.
 *
 * @param {ScanRequest} request
 * @returns {Promise<{ ok: true, report: object } | { ok: false, error: { code: string, message: string, known?: string[] } }>}
 */
export async function scan(request) {
  const { root, targets, catalog } = request;
  const today = request.today ?? new Date().toISOString().slice(0, 10);
  const decisions = Array.isArray(request.decisions) ? request.decisions : [];

  const resolved = resolveTargets(catalog, request.preset);
  if (!resolved.ok) {
    return { ok: false, error: { code: 'bad-preset', message: resolved.message, known: resolved.known } };
  }

  const collected = await collectFiles({ root, targets, limits: request.limits });
  if (!collected.ok) return { ok: false, error: collected.error };

  const project = await readProject(root);

  const requestedRules =
    Array.isArray(request.onlyRules) && request.onlyRules.length > 0 ? new Set(request.onlyRules) : null;

  /** @type {object[]} */
  const findings = [];
  /** @type {string[]} */
  const staleRules = [];
  /** @type {string[]} */
  const detectorFailures = [];

  const staleSet = new Set();
  for (const rule of catalog.rules) {
    const reviewBy = rule.evidence?.reviewBy;
    if (typeof reviewBy === 'string' && reviewBy < today) staleSet.add(rule.id);
  }
  staleRules.push(...[...staleSet].sort());

  for (const file of collected.files) {
    if (request.signal?.aborted === true) break;

    let text;
    try {
      text = await readFile(file.abs, 'utf8');
    } catch {
      continue;
    }

    const classification = classifyFile({ path: file.path, text, project });
    const context = {
      path: file.path,
      text,
      lines: text.split('\n'),
      language: classification.language,
      framework: classification.framework,
    };

    for (const rule of catalog.rules) {
      if (rule.shipped === false) continue;
      if (rule.tier === 'c') continue;
      if (requestedRules !== null && !requestedRules.has(rule.id)) continue;
      if (
        !ruleAppliesToFile(rule, {
          language: classification.language,
          framework: classification.framework,
          kind: file.kind,
        })
      )
        continue;

      const detected = runDetector(rule, context);
      if (!detected.ok) {
        if (!detectorFailures.includes(detected.message)) detectorFailures.push(detected.message);
        continue;
      }
      if (detected.hits.length === 0) continue;

      const gate = evaluateGate(rule, catalog, resolved.targets, project);
      const demote = gate.state === 'demoted' && isDemotable(rule);

      const lines = [...new Set(detected.hits.map((hit) => hit.line))].sort((left, right) => left - right);
      const firstHit = detected.hits[0];
      const site = { ruleId: rule.id, file: file.path };

      const covering = findCoveringDecision(decisions, site, today);

      findings.push({
        id: `${rule.id}:${file.path}:${firstHit.line}`,
        ruleId: rule.id,
        title: rule.title,
        classification: demote ? 'situational' : rule.classification,
        declaredClassification: rule.classification,
        impact: [...rule.impact],
        severity: rule.severity,
        confidence: rule.confidence,
        remediationConfidence: rule.remediationConfidence,
        tier: rule.tier,
        file: file.path,
        line: firstHit.line,
        endLine: firstHit.endLine ?? firstHit.line,
        lines,
        occurrences: detected.hits.length,
        excerpt: excerpt(firstHit.text),
        framework: classification.framework,
        frameworkConfidence: classification.confidence,
        supportGate: rule.supportGate ?? null,
        gateState: gate.state,
        gateNote: gate.note,
        unknownSupport: gate.state === 'unknown',
        why: rule.why,
        evidence: { ...rule.evidence },
        stale: staleSet.has(rule.id),
        standards: rule.standards ?? [],
        falsePositives: [...rule.falsePositives],
        migration: { ...rule.migration },
        autofix: rule.autofix,
        suppressed: covering !== null,
        decision:
          covering === null
            ? null
            : {
                expired: covering.expired,
                reviewBy: covering.decision.reviewBy ?? null,
                reason: covering.decision.reason ?? null,
              },
      });

      if (findings.length >= REPORT_LIMITS.maxFindings) break;
    }

    if (findings.length >= REPORT_LIMITS.maxFindings) {
      collected.truncated = true;
      break;
    }
  }

  findings.sort((left, right) => {
    const severity = (SEVERITY_ORDER[left.severity] ?? 9) - (SEVERITY_ORDER[right.severity] ?? 9);
    if (severity !== 0) return severity;
    if (left.file !== right.file) return left.file < right.file ? -1 : 1;
    if (left.line !== right.line) return left.line - right.line;
    return left.ruleId < right.ruleId ? -1 : left.ruleId > right.ruleId ? 1 : 0;
  });

  const active = findings.filter((finding) => !finding.suppressed);
  const suppressed = findings.length - active.length;

  /** @type {Record<string, number>} */
  const bySeverity = {};
  /** @type {Record<string, number>} */
  const byClassification = {};
  /** @type {Record<string, number>} */
  const byRule = {};
  for (const finding of active) {
    bySeverity[finding.severity] = (bySeverity[finding.severity] ?? 0) + 1;
    byClassification[finding.classification] = (byClassification[finding.classification] ?? 0) + 1;
    byRule[finding.ruleId] = (byRule[finding.ruleId] ?? 0) + 1;
  }

  const expiredDecisions = decisions.filter((decision) => isExpired(decision, today)).length;

  const report = {
    schemaVersion: REPORT_SCHEMA_VERSION,
    tool: { name: TOOL_NAME, version: TOOL_VERSION },
    catalog: {
      version: catalog.catalogVersion,
      asOf: catalog.asOf,
      rules: catalog.rules.length,
      staleRules,
    },
    targets: {
      preset: resolved.targets.preset,
      rank: resolved.targets.rank,
      resolvedFrom: request.preset === undefined ? 'catalog-default' : 'caller',
    },
    scope: {
      root,
      targets: [...targets],
      filesRead: collected.files.length,
      filesSkipped: summariseSkips(collected.skipped),
      truncated: collected.truncated,
    },
    summary: {
      findings: active.length,
      suppressed,
      expiredDecisions,
      bySeverity,
      byClassification,
      byRule,
    },
    findings,
  };

  if (detectorFailures.length > 0) {
    // @ts-expect-error assigned for diagnostics only
    report.diagnostics = { detectorFailures };
  }

  return { ok: true, report };
}
