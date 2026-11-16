/**
 * Catalog schema validation.
 *
 * The catalog is the single source of truth for every surface (CLI, host tool, panel,
 * generated docs), so it is validated before anything trusts it. This module is a
 * hand-written validator: no dependency, precise messages, and it returns every problem
 * rather than the first one so a catalog edit never hides three more mistakes.
 */

/** Exactly one classification per rule. Order matters for report grouping. */
export const CLASSIFICATIONS = Object.freeze([
  'deprecated',
  'obsolete',
  'legacy',
  'situational',
  'unsupported',
  'insecure',
  'inaccessible',
]);

/** Independent axis: why a change would pay. */
export const IMPACTS = Object.freeze([
  'security',
  'accessibility',
  'performance',
  'maintainability',
  'correctness',
  'compatibility',
  'privacy',
]);

export const SEVERITIES = Object.freeze(['critical', 'high', 'medium', 'low', 'info']);
export const CONFIDENCES = Object.freeze(['high', 'medium', 'low']);
export const TIERS = Object.freeze(['a', 'b', 'c']);
export const AUTOFIX = Object.freeze(['none', 'safe', 'situational']);

/** Domain prefixes; a rule id is `<DOMAIN>-<NNN>` and never renumbered once published. */
export const DOMAINS = Object.freeze({
  SEM: 'semantics and document structure',
  ARI: 'ARIA, focus, keyboard, dialogs, live regions, motion',
  FRM: 'forms, labels, validation, autocomplete, native controls',
  IMG: 'images and media',
  MET: 'metadata, canonical, robots, structured data, SEO rendering',
  CSS: 'cascade, layout, logical properties, container queries, colour, focus styles',
  REA: 'React state, effects, keys, refs, memoisation, hydration, boundaries',
  NXT: 'Next.js routing, server/client boundaries, caching, assets, route handlers',
  TYP: 'TypeScript strictness, unsafe types, DOM types, API contracts',
  BLD: 'build, bundle, environment, testing and CI hygiene',
  AIA: 'AI-generation provenance signals (probabilistic, never a verdict)',
});

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RULE_ID = /^([A-Z]{3})-(\d{3})$/;

/**
 * @typedef {object} Problem
 * @property {string} path dot/bracket path to the offending value
 * @property {string} message what is wrong
 */

class Collector {
  constructor() {
    /** @type {Problem[]} */
    this.problems = [];
  }
  /** @param {string} path @param {string} message */
  add(path, message) {
    this.problems.push({ path, message });
  }
}

/** @param {unknown} value */
const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/** @param {unknown} value @returns {value is string} */
const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

/** @param {unknown} value @param {readonly string[]} allowed */
const isOneOf = (value, allowed) => typeof value === 'string' && allowed.includes(value);

/** @param {unknown} value */
const isIsoDate = (value) => typeof value === 'string' && ISO_DATE.test(value);

/**
 * Validate one rule record.
 * @param {Record<string, unknown>} rule
 * @param {string} path
 * @param {Collector} out
 * @param {Set<string>} declaredFeatures feature ids available for support gates
 */
function validateRule(rule, path, out, declaredFeatures) {
  const need = (/** @type {boolean} */ ok, /** @type {string} */ field, /** @type {string} */ message) => {
    if (!ok) out.add(`${path}.${field}`, message);
  };

  const id = rule.id;
  const idMatch = typeof id === 'string' ? RULE_ID.exec(id) : null;
  if (!idMatch) {
    out.add(`${path}.id`, 'must match <DOMAIN>-<NNN>, e.g. SEM-001');
  } else if (!Object.hasOwn(DOMAINS, idMatch[1])) {
    out.add(`${path}.id`, `unknown domain prefix "${idMatch[1]}"`);
  }

  need(
    isNonEmptyString(rule.title) && String(rule.title).length <= 72,
    'title',
    'must be a non-empty string of at most 72 characters',
  );
  need(
    isOneOf(rule.classification, CLASSIFICATIONS),
    'classification',
    `must be one of ${CLASSIFICATIONS.join(', ')}`,
  );

  if (!Array.isArray(rule.impact) || rule.impact.length === 0) {
    out.add(`${path}.impact`, 'must be a non-empty array');
  } else {
    for (const [index, value] of rule.impact.entries()) {
      if (!isOneOf(value, IMPACTS))
        out.add(`${path}.impact[${index}]`, `must be one of ${IMPACTS.join(', ')}`);
    }
    if (new Set(rule.impact).size !== rule.impact.length)
      out.add(`${path}.impact`, 'must not repeat a value');
  }

  need(isOneOf(rule.severity, SEVERITIES), 'severity', `must be one of ${SEVERITIES.join(', ')}`);
  need(isOneOf(rule.confidence, CONFIDENCES), 'confidence', `must be one of ${CONFIDENCES.join(', ')}`);
  need(
    isOneOf(rule.remediationConfidence, CONFIDENCES),
    'remediationConfidence',
    `must be one of ${CONFIDENCES.join(', ')}`,
  );
  need(isOneOf(rule.tier, TIERS), 'tier', `must be one of ${TIERS.join(', ')}`);
  need(isNonEmptyString(rule.detector), 'detector', 'must name a registered detector');
  need(isPlainObject(rule.detectorParams), 'detectorParams', 'must be an object (use {} when unused)');
  need(isOneOf(rule.autofix, AUTOFIX), 'autofix', `must be one of ${AUTOFIX.join(', ')}`);
  need(typeof rule.suppressible === 'boolean', 'suppressible', 'must be a boolean');

  // A tier-c rule may exist in the catalog only to document why it is deferred.
  need(rule.tier !== 'c' || rule.shipped === false, 'tier', 'a tier "c" rule must set "shipped": false');

  if (!isPlainObject(rule.appliesTo)) {
    out.add(`${path}.appliesTo`, 'must be an object');
  } else {
    for (const key of ['languages', 'frameworks', 'fileKinds']) {
      const value = rule.appliesTo[key];
      if (!Array.isArray(value) || value.length === 0) {
        out.add(`${path}.appliesTo.${key}`, 'must be a non-empty array');
      } else if (!value.every(isNonEmptyString)) {
        out.add(`${path}.appliesTo.${key}`, 'must contain only non-empty strings');
      }
    }
  }

  if (rule.supportGate !== null) {
    if (!isPlainObject(rule.supportGate)) {
      out.add(`${path}.supportGate`, 'must be null or an object');
    } else if (rule.supportGate.kind === 'browser-feature') {
      if (!isNonEmptyString(rule.supportGate.feature)) {
        out.add(`${path}.supportGate.feature`, 'must be a feature id');
      } else if (!declaredFeatures.has(String(rule.supportGate.feature))) {
        out.add(
          `${path}.supportGate.feature`,
          `"${rule.supportGate.feature}" is not declared in the catalog's "features" table`,
        );
      }
      if (!isNonEmptyString(rule.supportGate.requires)) {
        out.add(`${path}.supportGate.requires`, 'must name a support preset');
      }
    } else if (rule.supportGate.kind === 'framework-version') {
      if (!isNonEmptyString(rule.supportGate.framework)) {
        out.add(`${path}.supportGate.framework`, 'must name a framework');
      }
      if (!isNonEmptyString(rule.supportGate.requires)) {
        out.add(`${path}.supportGate.requires`, 'must be a semver range string');
      }
    } else {
      out.add(`${path}.supportGate.kind`, 'must be "browser-feature" or "framework-version"');
    }
  }

  const evidence = rule.evidence;
  if (!isPlainObject(evidence)) {
    out.add(`${path}.evidence`, 'must be an object');
  } else {
    if (!isNonEmptyString(evidence.url) || !/^https:\/\//.test(String(evidence.url))) {
      out.add(`${path}.evidence.url`, 'must be an https URL');
    }
    need(isNonEmptyString(evidence.title), 'evidence.title', 'must be a non-empty string');
    need(isNonEmptyString(evidence.authority), 'evidence.authority', 'must be a non-empty string');
    need(isIsoDate(evidence.retrieved), 'evidence.retrieved', 'must be an ISO date (YYYY-MM-DD)');
    need(isIsoDate(evidence.reviewBy), 'evidence.reviewBy', 'must be an ISO date (YYYY-MM-DD)');
    if (
      isIsoDate(evidence.retrieved) &&
      isIsoDate(evidence.reviewBy) &&
      String(evidence.reviewBy) <= String(evidence.retrieved)
    ) {
      out.add(`${path}.evidence.reviewBy`, 'must be later than "retrieved"');
    }
  }

  need(
    isNonEmptyString(rule.why) && String(rule.why).length <= 320,
    'why',
    'must be a non-empty string of at most 320 characters',
  );
  need(isNonEmptyString(rule.detectionHint), 'detectionHint', 'must be a non-empty string');

  if (!Array.isArray(rule.falsePositives) || rule.falsePositives.length === 0) {
    out.add(`${path}.falsePositives`, 'must list at least one condition; a rule with none is not shippable');
  } else if (!rule.falsePositives.every(isNonEmptyString)) {
    out.add(`${path}.falsePositives`, 'must contain only non-empty strings');
  }

  const migration = rule.migration;
  if (!isPlainObject(migration)) {
    out.add(`${path}.migration`, 'must be an object with "before" and "after"');
  } else {
    need(isNonEmptyString(migration.before), 'migration.before', 'must be a non-empty string');
    need(isNonEmptyString(migration.after), 'migration.after', 'must be a non-empty string');
    if (migration.notes !== undefined && !isNonEmptyString(migration.notes)) {
      out.add(`${path}.migration.notes`, 'when present, must be a non-empty string');
    }
  }

  if (rule.standards !== undefined) {
    if (!Array.isArray(rule.standards)) {
      out.add(`${path}.standards`, 'when present, must be an array');
    } else {
      for (const [index, entry] of rule.standards.entries()) {
        if (!isPlainObject(entry) || !isNonEmptyString(entry.framework) || !isNonEmptyString(entry.id)) {
          out.add(`${path}.standards[${index}]`, 'must be { framework, id }');
        }
      }
    }
  }

  // The project's central epistemic rule, enforced mechanically: nothing may claim
  // "deprecated" unless the rule says which source calls it that.
  if (rule.classification === 'deprecated' && !isNonEmptyString(rule.deprecatedBySource)) {
    out.add(
      `${path}.deprecatedBySource`,
      'a "deprecated" classification requires "deprecatedBySource" naming the source that says so',
    );
  }
  if (rule.classification !== 'deprecated' && rule.deprecatedBySource !== undefined) {
    out.add(`${path}.deprecatedBySource`, 'only a "deprecated" rule may set "deprecatedBySource"');
  }
}

/**
 * Validate a whole catalog document.
 * @param {unknown} catalog
 * @returns {{ ok: boolean, problems: Problem[] }}
 */
export function validateCatalog(catalog) {
  const out = new Collector();

  if (!isPlainObject(catalog)) {
    return { ok: false, problems: [{ path: '', message: 'catalog must be an object' }] };
  }

  if (catalog.schemaVersion !== 1) out.add('schemaVersion', 'must be 1');
  if (!isNonEmptyString(catalog.catalogVersion)) out.add('catalogVersion', 'must be a non-empty string');
  if (!isIsoDate(catalog.asOf)) out.add('asOf', 'must be an ISO date (YYYY-MM-DD)');

  const features = isPlainObject(catalog.features) ? catalog.features : null;
  if (features === null) out.add('features', 'must be an object');

  const presets = isPlainObject(catalog.supportPresets) ? catalog.supportPresets : null;
  if (presets === null) out.add('supportPresets', 'must be an object');

  /** @type {Set<string>} */
  const featureIds = new Set(features ? Object.keys(features) : []);

  if (features) {
    for (const [id, value] of Object.entries(features)) {
      if (!isPlainObject(value)) {
        out.add(`features["${id}"]`, 'must be an object');
        continue;
      }
      if (!isNonEmptyString(value.title)) out.add(`features["${id}"].title`, 'must be a non-empty string');
      if (!isNonEmptyString(value.doc)) out.add(`features["${id}"].doc`, 'must be a documentation URL');
      if (typeof value.rank !== 'number' || !Number.isInteger(value.rank)) {
        out.add(`features["${id}"].rank`, 'must be an integer support rank');
      }
    }
  }

  if (presets) {
    for (const [id, value] of Object.entries(presets)) {
      if (!isPlainObject(value)) {
        out.add(`supportPresets["${id}"]`, 'must be an object');
        continue;
      }
      if (!isNonEmptyString(value.title))
        out.add(`supportPresets["${id}"].title`, 'must be a non-empty string');
      if (typeof value.rank !== 'number' || !Number.isInteger(value.rank)) {
        out.add(`supportPresets["${id}"].rank`, 'must be an integer rank');
      }
      if (typeof value.default !== 'boolean') {
        out.add(`supportPresets["${id}"].default`, 'must be a boolean');
      }
    }
    const defaults = Object.values(presets).filter((value) => isPlainObject(value) && value.default === true);
    if (defaults.length !== 1) out.add('supportPresets', 'exactly one preset must set "default": true');
  }

  if (!Array.isArray(catalog.rules) || catalog.rules.length === 0) {
    out.add('rules', 'must be a non-empty array');
    return { ok: out.problems.length === 0, problems: out.problems };
  }

  const seen = new Set();
  for (const [index, rule] of catalog.rules.entries()) {
    const path = `rules[${index}]`;
    if (!isPlainObject(rule)) {
      out.add(path, 'must be an object');
      continue;
    }
    if (typeof rule.id === 'string') {
      if (seen.has(rule.id)) out.add(`${path}.id`, `duplicate rule id "${rule.id}"`);
      seen.add(rule.id);
    }
    validateRule(rule, path, out, featureIds);
  }

  return { ok: out.problems.length === 0, problems: out.problems };
}

/**
 * Render problems as one human-readable block.
 * @param {Problem[]} problems
 * @param {string} [source]
 * @returns {string}
 */
export function formatProblems(problems, source = 'catalog') {
  const lines = [`${source}: ${problems.length} problem${problems.length === 1 ? '' : 's'}`];
  for (const problem of problems) lines.push(`  ${problem.path || '<root>'}: ${problem.message}`);
  return lines.join('\n');
}
