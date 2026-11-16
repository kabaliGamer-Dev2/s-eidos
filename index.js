/**
 * S-Eidos — DeepSeek Harness host half.
 *
 * Registers one tool and one skill:
 *   - `s_eidos_audit` reviews explicitly named paths and returns a report in which every
 *     finding carries a classification, severity, confidence, the support constraint that
 *     makes it valid, a false-positive warning, a migration sketch and a dated citation.
 *   - `s-eidos-audit` is the workflow skill: when to call the tool, how to read a report,
 *     and what the tool refuses to do.
 *
 * It writes nothing to the scanned workspace, makes no network call, and is inert in a
 * profile that has no tool service.
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadCatalog, scan } from './src/engine/index.mjs';
import { renderText } from './src/engine/report.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const SKILL_DIRECTORY = join(here, 'skills', 's-eidos-audit');
const SKILL_PATH = join(SKILL_DIRECTORY, 'SKILL.md');

/** Bundle row name, shared with the package name. */
export const name = 's-eidos';

/** Services this plugin needs; the skill service is optional at runtime. */
export const inject = ['tools', 'skills'];

const TOOL_DESCRIPTION = [
  'Review explicit files or directories for front-end patterns that are risky, inaccessible, obsolete,',
  'or a poor fit for the framework they are written in, and get back a finding per site carrying the',
  'evidence behind it. Use this before claiming code is modern, before a refactor, or when reviewing',
  'a change written by an agent.',
  'Every finding states its classification (deprecated, obsolete, legacy, situational, unsupported,',
  'insecure or inaccessible), its severity, its confidence, the support constraint under which the',
  'advice is valid, the conditions under which it must NOT be flagged, a minimal migration, and a',
  'primary-source URL with the date it was retrieved.',
  'The review is read-only: it never edits, formats or deletes anything, and it makes no network call.',
  'Pass paths relative to the session workspace. The tool never scans the whole workspace on its own.',
].join(' ');

const PATHS_DESCRIPTION = [
  'One to sixteen paths, relative to the session workspace, naming exactly what to review.',
  "A directory is walked within the tool's caps. Naming a path is required: the review never",
  'defaults to the workspace root.',
].join(' ');

const TARGETS_DESCRIPTION = [
  'The support policy the advice is judged against: baseline-widely-available (default),',
  'baseline-newly-available, safari-16-plus, safari-18-plus, last-2-versions, evergreen-desktop,',
  'modern-2026 or enterprise-chromium-lts. A finding whose modern alternative the target cannot use',
  'is reported as situational rather than presented as a defect.',
].join(' ');

const RULES_DESCRIPTION = 'Restrict the review to these rule ids, for example ["SEM-002", "MET-001"].';

const FORMAT_DESCRIPTION = 'summary returns a readable digest; json returns the full report value.';

/**
 * Render the bounded model-facing summary of a scan.
 *
 * @param {object} value the canonical tool value
 * @returns {{ type: 'text', text: string }[]}
 */
function renderScanResult(value) {
  if (value.ok !== true) {
    const message =
      typeof value.error?.message === 'string' ? value.error.message : 'the review could not run';
    const known = Array.isArray(value.error?.known) ? ` Known values: ${value.error.known.join(', ')}.` : '';
    return [{ type: 'text', text: `${message}${known}` }];
  }

  if (value.format === 'json') {
    return [{ type: 'text', text: JSON.stringify(value.report, null, 2) }];
  }

  const report = value.report;
  const text = renderText(report, { color: false });

  // The report body can be long; the model gets the head plus an explicit accounting of what
  // was left out, so a truncated digest never reads as a complete one.
  const limit = 12_000;
  if (text.length <= limit) return [{ type: 'text', text }];

  const head = text.slice(0, limit);
  const shown = head.split('\n').length;
  return [
    {
      type: 'text',
      text: `${head}\n\n[truncated: ${text.split('\n').length - shown} further line(s) omitted. Call again with fewer paths, narrow --rule selection, or ask for format "json" to receive the full value.]`,
    },
  ];
}

/** @type {object} */
const scanTool = {
  name: 's_eidos_audit',
  description: TOOL_DESCRIPTION,
  parameters: {
    type: 'object',
    properties: {
      paths: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 16,
        description: PATHS_DESCRIPTION,
      },
      targets: { type: 'string', description: TARGETS_DESCRIPTION },
      rules: { type: 'array', items: { type: 'string' }, description: RULES_DESCRIPTION },
      format: { type: 'string', enum: ['summary', 'json'], description: FORMAT_DESCRIPTION },
    },
    required: ['paths'],
    additionalProperties: false,
  },
  output: {
    schema: { type: 'object' },
    render: (_args, value) => renderScanResult(value),
  },
  /**
   * @param {{ paths: string[], targets?: string, rules?: string[], format?: 'summary'|'json' }} args
   * @param {{ signal?: AbortSignal, agent?: { session?: { header?: { cwd?: string } } } }} exec
   * @returns {Promise<object>} canonical value
   */
  async execute(args, exec) {
    exec?.signal?.throwIfAborted?.();

    // The session workspace, as the host reports it. The process directory is only a last
    // resort and is named as such in the error path, never silently substituted for a
    // workspace the host refused to report.
    const reported = exec?.agent?.session?.header?.cwd;
    const root = typeof reported === 'string' && reported.trim() !== '' ? reported : process.cwd();

    const catalogResult = await loadCatalog();
    if (!catalogResult.ok) {
      return { ok: false, error: { code: 'catalog', message: catalogResult.message } };
    }

    const result = await scan({
      root,
      targets: args.paths,
      catalog: catalogResult.catalog,
      preset: args.targets,
      onlyRules: args.rules,
      signal: exec?.signal,
    });

    if (!result.ok) {
      return {
        ok: false,
        error: { code: result.error.code, message: result.error.message, known: result.error.known },
      };
    }

    return {
      ok: true,
      format: args.format === 'json' ? 'json' : 'summary',
      workspace: root,
      report: result.report,
    };
  },
};

/**
 * @param {object} ctx host plugin context
 * @returns {Promise<void>}
 */
export async function apply(ctx) {
  const tools = ctx?.tools;
  if (tools === undefined || tools === null || typeof tools.register !== 'function') {
    // A profile without the tool service stays clean; the CLI still works.
    return;
  }

  ctx.effect(() => tools.register(scanTool), 's-eidos: s_eidos_audit');

  const skills = ctx?.skills;
  if (skills === undefined || skills === null || typeof skills.register !== 'function') return;

  let content;
  try {
    content = await readFile(SKILL_PATH, 'utf8');
  } catch {
    // Without its body the skill would be an empty promise; register nothing.
    return;
  }

  const registration = {
    name: 's-eidos-audit',
    description:
      'Review front-end code for risky, inaccessible, obsolete or framework-misaligned patterns with evidence: ' +
      'when to call s_eidos_audit, how to read a finding, and what the review will not do.',
    content,
    source: 'bundled',
    path: SKILL_PATH,
    resourceBase: { kind: 'directory', path: SKILL_DIRECTORY },
    invocation: { modelInvocable: true, userInvocable: true },
    whenToUse:
      'Before claiming existing front-end code is modern, before a refactor, or when reviewing agent-written components.',
  };

  ctx.effect(() => skills.register(registration), 's-eidos: skill');
}
