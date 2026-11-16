/**
 * Panel view model.
 *
 * Pure functions only: filtering, grouping and formatting. Keeping them out of the React
 * components means the panel's behaviour can be tested without a DOM, and the components
 * stay thin enough to read in one screen.
 */

/**
 * The classification order the panel lists first. Harmful-regardless-of-age comes before
 * matters-of-timing, because that is the order a reader should act in.
 */
export const CLASSIFICATION_ORDER = Object.freeze([
  'insecure',
  'inaccessible',
  'deprecated',
  'obsolete',
  'unsupported',
  'situational',
  'legacy',
]);

export const SEVERITY_ORDER = Object.freeze(['critical', 'high', 'medium', 'low', 'info']);

/**
 * @param {object} catalog
 * @returns {{ version: string, asOf: string, rules: number, stale: number, byClassification: Record<string, number> }}
 */
export function catalogSummary(catalog) {
  /** @type {Record<string, number>} */
  const byClassification = {};
  let stale = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (const rule of catalog.rules) {
    byClassification[rule.classification] = (byClassification[rule.classification] ?? 0) + 1;
    if (typeof rule.evidence?.reviewBy === 'string' && rule.evidence.reviewBy < today) stale += 1;
  }
  return {
    version: catalog.catalogVersion,
    asOf: catalog.asOf,
    rules: catalog.rules.length,
    stale,
    byClassification,
  };
}

/**
 * @param {object} rule
 * @returns {boolean}
 */
const isShipped = (rule) => rule.shipped !== false;

/**
 * Filter the catalog for display.
 *
 * @param {object} catalog
 * @param {{ query?: string, classification?: string, severity?: string }} filter
 * @returns {object[]}
 */
export function filterRules(catalog, filter = {}) {
  const query = String(filter.query ?? '')
    .trim()
    .toLowerCase();
  const classification = filter.classification ?? '';
  const severity = filter.severity ?? '';

  const rules = catalog.rules.filter((rule) => {
    if (!isShipped(rule)) return false;
    if (classification !== '' && rule.classification !== classification) return false;
    if (severity !== '' && rule.severity !== severity) return false;
    if (query === '') return true;
    const haystack = [rule.id, rule.title, rule.why, ...rule.impact, rule.evidence?.authority ?? '']
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });

  return rules.sort((left, right) => {
    const byClass =
      CLASSIFICATION_ORDER.indexOf(left.classification) - CLASSIFICATION_ORDER.indexOf(right.classification);
    if (byClass !== 0) return byClass;
    const bySeverity = SEVERITY_ORDER.indexOf(left.severity) - SEVERITY_ORDER.indexOf(right.severity);
    if (bySeverity !== 0) return bySeverity;
    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
  });
}

/**
 * The command a person can run for one rule, or for the catalog as a whole.
 *
 * @param {string} [ruleId]
 * @returns {string}
 */
export function commandFor(ruleId) {
  return ruleId === undefined
    ? 'node bin/s-eidos.mjs audit <path> --format text'
    : `node bin/s-eidos.mjs explain ${ruleId}`;
}

/**
 * The tool call an agent can make.
 *
 * @param {string} [ruleId]
 * @returns {string}
 */
export function toolCallFor(ruleId) {
  return ruleId === undefined
    ? 's_eidos_audit({ paths: ["src"] })'
    : `s_eidos_audit({ paths: ["src"], rules: ["${ruleId}"] })`;
}

/**
 * Glyph and colour token for a classification, so the panel never hard-codes a colour.
 *
 * @param {string} classification
 * @returns {{ token: string, mark: string, label: string }}
 */
export function classificationStyle(classification) {
  switch (classification) {
    case 'insecure':
      return { token: '--dsw-alias-state-error-primary', mark: '\u25CF', label: classification };
    case 'inaccessible':
      return { token: '--dsw-alias-state-error-primary', mark: '\u25CF', label: classification };
    case 'deprecated':
      return { token: '--dsw-alias-state-warn-primary', mark: '\u25C6', label: classification };
    case 'obsolete':
      return { token: '--dsw-alias-state-warn-primary', mark: '\u25C6', label: classification };
    case 'unsupported':
      return { token: '--dsw-alias-state-warn-primary', mark: '\u25C7', label: classification };
    case 'situational':
      return { token: '--dsw-alias-state-idle-primary', mark: '\u25CB', label: classification };
    case 'legacy':
      return { token: '--dsw-alias-state-idle-primary', mark: '\u25CB', label: classification };
    default:
      return { token: '--dsw-alias-label-secondary', mark: '\u2022', label: classification };
  }
}

/**
 * @param {string} severity
 * @returns {string} a CSS var() expression, never a literal colour
 */
export function severityColor(severity) {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'var(--dsw-alias-state-error-primary)';
    case 'medium':
      return 'var(--dsw-alias-state-warn-primary)';
    case 'low':
      return 'var(--dsw-alias-state-idle-primary)';
    default:
      return 'var(--dsw-alias-label-secondary)';
  }
}

/**
 * The fields the detail view shows, in reading order, so the component only maps over data.
 *
 * @param {object} rule
 * @param {(key: string) => string} t
 * @returns {{ key: string, label: string, value: string }[]}
 */
export function ruleFacts(rule, t) {
  const gate =
    rule.supportGate === null
      ? t('noSupportGate')
      : rule.supportGate.kind === 'browser-feature'
        ? `${rule.supportGate.feature} \u2265 ${rule.supportGate.requires}`
        : `${rule.supportGate.framework} ${rule.supportGate.requires}`;

  return [
    { key: 'classification', label: t('classification'), value: rule.classification },
    { key: 'impact', label: t('impact'), value: rule.impact.join(', ') },
    { key: 'severity', label: t('severity'), value: rule.severity },
    { key: 'confidence', label: t('confidence'), value: rule.confidence },
    { key: 'remediationConfidence', label: t('remediationConfidence'), value: rule.remediationConfidence },
    { key: 'supportGate', label: t('supportGate'), value: gate },
    { key: 'autofix', label: t('autofix'), value: rule.autofix === 'none' ? t('autofixNone') : rule.autofix },
  ];
}

/**
 * Is this rule past its review date?
 *
 * @param {object} rule
 * @param {string} [today]
 * @returns {boolean}
 */
export function isStale(rule, today = new Date().toISOString().slice(0, 10)) {
  return typeof rule.evidence?.reviewBy === 'string' && rule.evidence.reviewBy < today;
}
