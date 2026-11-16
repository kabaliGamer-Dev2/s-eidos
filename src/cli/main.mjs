/**
 * CLI implementation.
 *
 * Kept separate from the launcher so that tests can drive it in-process: under some
 * sandboxes a child process cannot be spawned at all, and a test suite that needs one is
 * not a test suite that runs everywhere.
 *
 * `main` never calls `process.exit` and never writes to a global stream directly: it takes
 * an `io` object and returns an exit code.
 */

import { parseArgs } from 'node:util';

import {
  DECISIONS_DIRECTORY,
  TOOL_VERSION,
  decisionsPath,
  findRule,
  loadCatalog,
  readDecisions,
  renderJson,
  renderMarkdown,
  renderText,
  scan,
  writeDecisions,
} from '../engine/index.mjs';
import { SEVERITY_ORDER } from '../engine/scan.mjs';

export const EXIT = Object.freeze({ ok: 0, findings: 1, usage: 2 });

export const USAGE = `s-eidos ${TOOL_VERSION} — evidence-backed front-end pattern review

Usage
  s-eidos audit <path...> [options]     review explicitly named files or directories
  s-eidos rules [options]               list the rule catalog
  s-eidos explain <ruleId>              show one rule in full
  s-eidos decisions list                list decision records
  s-eidos decisions add [options]       record a decision (the only write this tool makes)
  s-eidos decisions prune [options]     remove expired decision records
  s-eidos version
  s-eidos help

audit options
  --format <text|json|md>     output form (default text)
  --targets <preset>          support target preset (default: the catalog default)
  --rule <id[,id]>            restrict to these rule ids
  --fail-on <severity>        exit 1 when a finding at or above this severity is present
  --stamp                     add generatedAt to the JSON report (off by default, so output is reproducible)
  --color <auto|always|never> colour for the text format (default auto)

decisions add options
  --rule <id>                 rule the decision is about (required)
  --path <path>               limit the decision to this path prefix (omit for the whole repository)
  --decision <kind>           accepted | deferred | false-positive (default accepted)
  --reason <text>             why the finding is not being acted on (required, 8+ characters)
  --review-by <YYYY-MM-DD>    when the decision must be looked at again (required)
  --yes                       actually write; without it the command only prints the plan

Notes
  S-Eidos never scans the working directory implicitly: name your paths.
  Nothing is written to your code. Evidence is reported with its retrieval date.
`;

/** Thrown for a usage or runtime problem that should end the command. */
export class CliExit extends Error {
  /** @param {number} code @param {string} message @param {boolean} [alreadyPrinted] */
  constructor(code, message, alreadyPrinted = false) {
    super(message);
    this.name = 'CliExit';
    this.code = code;
    this.alreadyPrinted = alreadyPrinted;
  }
}

/**
 * @typedef {object} CliIo
 * @property {(text: string) => void} out
 * @property {(text: string) => void} err
 * @property {string} cwd
 * @property {boolean} [isTTY]
 * @property {Record<string, string | undefined>} [env]
 * @property {() => string} [today]
 */

/**
 * @param {string} message
 * @returns {never}
 */
function usageError(message) {
  throw new CliExit(EXIT.usage, `s-eidos: ${message}\n\n${USAGE}`);
}

/** @returns {Promise<object>} */
async function requireCatalog() {
  const loaded = await loadCatalog();
  if (!loaded.ok) throw new CliExit(EXIT.findings, `${loaded.message}\n`, true);
  return loaded.catalog;
}

/** @param {string[]} values @returns {string[]} */
function splitIds(values) {
  /** @type {string[]} */
  const ids = [];
  for (const value of values) {
    for (const part of value.split(',')) {
      const trimmed = part.trim();
      if (trimmed !== '') ids.push(trimmed);
    }
  }
  return ids;
}

/** @param {string} text @returns {number} */
function severityRank(text) {
  const rank = SEVERITY_ORDER[text];
  if (rank === undefined) {
    usageError(`unknown severity "${text}"; expected one of ${Object.keys(SEVERITY_ORDER).join(', ')}`);
  }
  return rank;
}

/**
 * Run one command.
 *
 * @param {string[]} argv arguments after the program name
 * @param {CliIo} io
 * @returns {Promise<number>} exit code
 */
export async function main(argv, io) {
  const today = io.today ?? (() => new Date().toISOString().slice(0, 10));

  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        format: { type: 'string' },
        targets: { type: 'string' },
        rule: { type: 'string', multiple: true },
        'fail-on': { type: 'string' },
        stamp: { type: 'boolean', default: false },
        color: { type: 'string' },
        json: { type: 'boolean', default: false },
        classification: { type: 'string' },
        severity: { type: 'string' },
        path: { type: 'string' },
        decision: { type: 'string' },
        reason: { type: 'string' },
        'review-by': { type: 'string' },
        help: { type: 'boolean', default: false },
        yes: { type: 'boolean', default: false },
      },
    });
  } catch (error) {
    usageError(error instanceof Error ? error.message : String(error));
  }

  const { values, positionals } = parsed;
  const command = positionals[0];

  if (values.help === true || command === undefined || command === 'help') {
    io.out(USAGE);
    return EXIT.ok;
  }

  if (command === 'version') {
    io.out(`s-eidos ${TOOL_VERSION}\n`);
    return EXIT.ok;
  }

  if (command === 'rules') {
    const catalog = await requireCatalog();
    const rules = catalog.rules.filter((entry) => {
      if (values.classification !== undefined && entry.classification !== values.classification) return false;
      if (values.severity !== undefined && entry.severity !== values.severity) return false;
      return true;
    });

    if (values.json === true) {
      io.out(
        `${JSON.stringify({ catalogVersion: catalog.catalogVersion, asOf: catalog.asOf, rules }, null, 2)}\n`,
      );
      return EXIT.ok;
    }

    io.out(`S-Eidos catalog ${catalog.catalogVersion} (as of ${catalog.asOf}) — ${rules.length} rule(s)\n\n`);
    for (const rule of rules) {
      io.out(
        `${rule.id}  ${String(rule.classification).padEnd(13)} ${String(rule.severity).padEnd(9)} ${rule.title}\n`,
      );
      io.out(`          ${rule.evidence.url}\n`);
    }
    return EXIT.ok;
  }

  if (command === 'explain') {
    const id = positionals[1];
    if (id === undefined) usageError('explain needs a rule id, e.g. "s-eidos explain SEM-001"');
    const catalog = await requireCatalog();
    const rule = findRule(catalog, id);
    if (rule === undefined) {
      io.err(`No such rule: ${id}\n`);
      return EXIT.usage;
    }
    if (values.json === true) {
      io.out(`${JSON.stringify(rule, null, 2)}\n`);
      return EXIT.ok;
    }
    io.out(`${rule.id} — ${rule.title}\n\n`);
    io.out(`classification   ${rule.classification}\n`);
    io.out(`impact           ${rule.impact.join(', ')}\n`);
    io.out(`severity         ${rule.severity}\n`);
    io.out(`confidence       finding ${rule.confidence} · remediation ${rule.remediationConfidence}\n`);
    io.out(`tier             ${rule.tier}\n`);
    io.out(`autofix          ${rule.autofix}\n`);
    io.out(`why              ${rule.why}\n`);
    io.out(`detects          ${rule.detectionHint}\n`);
    io.out(`evidence         ${rule.evidence.url}\n`);
    io.out(
      `                 ${rule.evidence.authority} · retrieved ${rule.evidence.retrieved} · review by ${rule.evidence.reviewBy}\n`,
    );
    io.out('do not flag when\n');
    for (const condition of rule.falsePositives) io.out(`  - ${condition}\n`);
    io.out(`migration\n  before: ${rule.migration.before}\n  after:  ${rule.migration.after}\n`);
    if (rule.migration.notes !== undefined) io.out(`  ${rule.migration.notes}\n`);
    return EXIT.ok;
  }

  if (command === 'decisions') {
    const subcommand = positionals[1] ?? 'list';
    const catalog = await requireCatalog();
    const current = await readDecisions(io.cwd);

    if (current.problems.length > 0) {
      for (const problem of current.problems) io.err(`${problem}\n`);
      return EXIT.usage;
    }

    if (subcommand === 'list') {
      if (current.decisions.length === 0) {
        io.out('No decision records. Nothing is suppressed.\n');
        return EXIT.ok;
      }
      io.out(`${current.decisions.length} decision record(s) in ${DECISIONS_DIRECTORY}/decisions.json\n\n`);
      for (const entry of current.decisions) {
        const scope = entry.scope?.kind === 'path' ? String(entry.scope.path) : '(whole repository)';
        const expired = typeof entry.reviewBy === 'string' && entry.reviewBy < today() ? ' EXPIRED' : '';
        io.out(
          `${String(entry.ruleId)}  ${String(entry.decision)}  review by ${String(entry.reviewBy)}${expired}\n`,
        );
        io.out(`  scope: ${scope}\n  reason: ${String(entry.reason)}\n`);
      }
      return EXIT.ok;
    }

    if (subcommand === 'add') {
      // `--rule` is declared `multiple: true`, so it always arrives as an array.
      const ruleId = Array.isArray(values.rule) ? values.rule[0] : values.rule;
      if (ruleId === undefined) usageError('decisions add needs --rule <id>');
      if (values.reason === undefined) usageError('decisions add needs --reason "why" (8+ characters)');
      if (values['review-by'] === undefined) usageError('decisions add needs --review-by <YYYY-MM-DD>');
      if (findRule(catalog, ruleId) === undefined) usageError(`no such rule: ${ruleId}`);

      const entry = {
        ruleId,
        decision: values.decision ?? 'accepted',
        scope: values.path === undefined ? { kind: 'rule' } : { kind: 'path', path: values.path },
        reason: values.reason,
        recordedAt: today(),
        reviewBy: values['review-by'],
      };

      if (values.yes !== true) {
        io.out('About to append one decision record:\n\n');
        io.out(`${JSON.stringify(entry, null, 2)}\n\n`);
        io.out('Re-run with --yes to write it. Nothing has been written.\n');
        return EXIT.ok;
      }

      const written = await writeDecisions(io.cwd, [...current.decisions, entry]);
      if (!written.ok) {
        io.err(`could not write ${written.path}: ${written.message ?? ''}\n`);
        return EXIT.findings;
      }
      io.out(`Recorded ${ruleId} in ${decisionsPath(io.cwd)}\n`);
      return EXIT.ok;
    }

    if (subcommand === 'prune') {
      const keep = current.decisions.filter(
        (entry) => !(typeof entry.reviewBy === 'string' && entry.reviewBy < today()),
      );
      const removed = current.decisions.length - keep.length;
      if (removed === 0) {
        io.out('No expired decision records.\n');
        return EXIT.ok;
      }
      if (values.yes !== true) {
        io.out(`Would remove ${removed} expired record(s). Re-run with --yes.\n`);
        return EXIT.ok;
      }
      const written = await writeDecisions(io.cwd, keep);
      if (!written.ok) {
        io.err(`could not write ${written.path}\n`);
        return EXIT.findings;
      }
      io.out(`Removed ${removed} expired record(s).\n`);
      return EXIT.ok;
    }

    usageError(`unknown decisions subcommand "${subcommand}"`);
  }

  if (command === 'audit') {
    const targets = positionals.slice(1);
    if (targets.length === 0) {
      usageError(
        'audit needs at least one explicit path. S-Eidos never scans the working directory implicitly.',
      );
    }

    const catalog = await requireCatalog();
    const decisions = await readDecisions(io.cwd);

    const result = await scan({
      root: io.cwd,
      targets,
      catalog,
      preset: values.targets,
      decisions: decisions.decisions,
      today: today(),
      onlyRules: values.rule === undefined ? undefined : splitIds(values.rule),
    });

    if (!result.ok) {
      io.err(
        `${result.error.message}${result.error.known ? `\nKnown presets: ${result.error.known.join(', ')}` : ''}\n`,
      );
      return EXIT.usage;
    }

    const format = values.format ?? 'text';
    if (format === 'json') {
      io.out(renderJson(result.report, { stamp: values.stamp === true }));
    } else if (format === 'md') {
      io.out(`${renderMarkdown(result.report)}\n`);
    } else if (format === 'text') {
      const color =
        values.color === 'always'
          ? true
          : values.color === 'never'
            ? false
            : io.isTTY === true && io.env?.NO_COLOR === undefined;
      io.out(`${renderText(result.report, { color })}\n`);
    } else {
      usageError(`unknown format "${format}"; expected text, json or md`);
    }

    if (values['fail-on'] !== undefined) {
      const threshold = severityRank(values['fail-on']);
      const breached = result.report.findings.some((finding) => {
        if (finding.suppressed) return false;
        const rank = SEVERITY_ORDER[finding.severity];
        return rank !== undefined && rank <= threshold;
      });
      return breached ? EXIT.findings : EXIT.ok;
    }

    return EXIT.ok;
  }

  usageError(`unknown command "${command}"`);
}
