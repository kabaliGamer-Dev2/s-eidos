/**
 * Report rendering.
 *
 * Three surfaces, one value. The JSON is the contract; the text and Markdown views are
 * renderings of the same object and may never contain a fact the JSON does not. Every view
 * carries the caveats with the counts: skipped paths, truncation, stale rules, suppressed
 * findings and expired decisions.
 */

/** ANSI colours, applied only when the caller asked for them. */
const COLORS = Object.freeze({
  reset: '\u001B[0m',
  dim: '\u001B[2m',
  bold: '\u001B[1m',
  red: '\u001B[31m',
  yellow: '\u001B[33m',
  blue: '\u001B[34m',
  green: '\u001B[32m',
});

const SEVERITY_COLOR = Object.freeze({
  critical: 'red',
  high: 'red',
  medium: 'yellow',
  low: 'blue',
  info: 'dim',
});

/**
 * @param {boolean} enabled
 * @param {keyof typeof COLORS} color
 * @param {string} text
 * @returns {string}
 */
function paint(enabled, color, text) {
  return enabled ? `${COLORS[color]}${text}${COLORS.reset}` : text;
}

/**
 * @param {Record<string, number>} counts
 * @returns {string}
 */
function countLine(counts) {
  const entries = Object.entries(counts).sort((left, right) => right[1] - left[1]);
  if (entries.length === 0) return '0';
  return entries.map(([key, value]) => `${key} ${value}`).join(' · ');
}

/**
 * Render the caveat block shared by every view.
 * @param {object} report
 * @returns {string[]}
 */
function caveatLines(report) {
  const lines = [];
  const skipped = report.scope.filesSkipped;
  if (skipped.total > 0) {
    const reasons = Object.entries(skipped.byReason)
      .sort((left, right) => right[1] - left[1])
      .map(([reason, count]) => `${reason} ${count}`)
      .join(', ');
    lines.push(`skipped ${skipped.total} path(s): ${reasons}`);
  }
  if (report.scope.truncated) lines.push('the scan hit a cap and stopped early; results are partial');
  if (report.summary.suppressed > 0)
    lines.push(`${report.summary.suppressed} finding(s) suppressed by a decision record`);
  if (report.summary.expiredDecisions > 0)
    lines.push(`${report.summary.expiredDecisions} decision record(s) are past their review date`);
  if (report.catalog.staleRules.length > 0)
    lines.push(`rules past their review date: ${report.catalog.staleRules.join(', ')}`);
  return lines;
}

/**
 * Render a human-readable report.
 *
 * @param {object} report
 * @param {{ color?: boolean }} [options]
 * @returns {string}
 */
export function renderText(report, options = {}) {
  const color = options.color === true;
  const lines = [];

  lines.push(
    paint(
      color,
      'bold',
      `S-Eidos ${report.tool.version} · catalog ${report.catalog.version} (${report.catalog.asOf})`,
    ),
  );
  lines.push(`target: ${report.targets.preset} · ${report.scope.filesRead} file(s) read`);
  lines.push('');

  if (report.summary.findings === 0) {
    lines.push('No findings.');
  } else {
    lines.push(`${report.summary.findings} finding(s) · ${countLine(report.summary.bySeverity)}`);
    lines.push('');

    for (const finding of report.findings) {
      if (finding.suppressed) continue;
      const severity = paint(
        color,
        SEVERITY_COLOR[finding.severity] ?? 'dim',
        finding.severity.toUpperCase(),
      );
      const stale = finding.stale ? paint(color, 'yellow', ' [stale rule]') : '';
      lines.push(`${severity} ${finding.ruleId} ${finding.title}${stale}`);
      lines.push(
        `  ${finding.file}:${finding.line}${finding.occurrences > 1 ? ` (+${finding.occurrences - 1} more hit(s))` : ''}`,
      );
      lines.push(`  ${paint(color, 'dim', 'excerpt:')} ${finding.excerpt}`);
      lines.push(
        `  ${paint(color, 'dim', 'classification:')} ${finding.classification}${finding.classification !== finding.declaredClassification ? ` (declared ${finding.declaredClassification}, demoted by the support gate)` : ''}${finding.impact.length > 0 ? ` · impact ${finding.impact.join(', ')}` : ''}`,
      );
      lines.push(
        `  ${paint(color, 'dim', 'confidence:')} finding ${finding.confidence} · remediation ${finding.remediationConfidence}`,
      );
      if (finding.gateNote !== null) lines.push(`  ${paint(color, 'dim', 'support:')} ${finding.gateNote}`);
      lines.push(`  ${paint(color, 'dim', 'why:')} ${finding.why ?? ''}`.trimEnd());
      lines.push(`  ${paint(color, 'dim', 'do not flag when:')} ${finding.falsePositives.join(' | ')}`);
      lines.push(
        `  ${paint(color, 'dim', 'evidence:')} ${finding.evidence.url} (${finding.evidence.authority}, retrieved ${finding.evidence.retrieved}, review by ${finding.evidence.reviewBy})`,
      );
      lines.push(
        `  ${paint(color, 'dim', 'migration:')} ${finding.migration.before} → ${finding.migration.after}`,
      );
      lines.push(`  ${paint(color, 'dim', 'autofix:')} ${finding.autofix}`);
      lines.push('');
    }
  }

  const caveats = caveatLines(report);
  if (caveats.length > 0) {
    lines.push(paint(color, 'dim', 'Caveats'));
    for (const caveat of caveats) lines.push(`  ${caveat}`);
    lines.push('');
  }

  lines.push(
    paint(color, 'dim', 'S-Eidos reports evidence; it does not decide policy. Age alone is never a defect.'),
  );
  return lines.join('\n');
}

/**
 * Render the machine-readable report.
 *
 * @param {object} report
 * @param {{ stamp?: boolean, now?: string }} [options]
 * @returns {string}
 */
export function renderJson(report, options = {}) {
  const value = { ...report };
  if (options.stamp === true) {
    value.generatedAt = options.now ?? new Date().toISOString();
  }
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Render a Markdown report suitable for a pull-request comment.
 *
 * @param {object} report
 * @returns {string}
 */
export function renderMarkdown(report) {
  const lines = [];
  lines.push(`## S-Eidos — ${report.summary.findings} finding(s)`);
  lines.push('');
  lines.push(
    `Catalog \`${report.catalog.version}\` (${report.catalog.asOf}) · target \`${report.targets.preset}\` · ${report.scope.filesRead} file(s) read`,
  );
  lines.push('');

  if (report.summary.findings === 0) {
    lines.push('No findings.');
  } else {
    lines.push('| Severity | Rule | Location | Classification | Confidence |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const finding of report.findings) {
      if (finding.suppressed) continue;
      const location = `${finding.file}:${finding.line}`;
      lines.push(
        `| ${finding.severity} | \`${finding.ruleId}\` ${finding.title} | \`${location}\` | ${finding.classification} | ${finding.confidence} |`,
      );
    }
    lines.push('');

    lines.push('<details><summary>Evidence and migrations</summary>');
    lines.push('');
    for (const finding of report.findings) {
      if (finding.suppressed) continue;
      lines.push(`### \`${finding.ruleId}\` ${finding.title}`);
      lines.push('');
      lines.push(finding.why ?? '');
      lines.push('');
      lines.push(
        `- Evidence: ${finding.evidence.url} — ${finding.evidence.authority}, retrieved ${finding.evidence.retrieved}, review by ${finding.evidence.reviewBy}`,
      );
      lines.push(`- Do not flag when: ${finding.falsePositives.join('; ')}`);
      lines.push(`- Migration: \`${finding.migration.before}\` → \`${finding.migration.after}\``);
      lines.push(`- Autofix: ${finding.autofix}`);
      lines.push('');
    }
    lines.push('</details>');
  }

  const caveats = caveatLines(report);
  if (caveats.length > 0) {
    lines.push('');
    lines.push('**Caveats**');
    for (const caveat of caveats) lines.push(`- ${caveat}`);
  }

  lines.push('');
  lines.push('_S-Eidos reports evidence; it does not decide policy. Age alone is never a defect._');
  return lines.join('\n');
}
