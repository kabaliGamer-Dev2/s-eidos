/**
 * Detectors.
 *
 * A detector is a small, bounded function that reports candidate sites for one rule. It
 * never decides classification, severity or whether a finding is valid — that belongs to
 * the rule record and the gate. Keeping detection dumb and metadata rich is what makes the
 * catalog reviewable by someone who is not reading code.
 *
 * Rules of the road for every detector here:
 *  - no nested quantifiers and no backtracking traps (a rule must not be able to hang a build);
 *  - bounded output per file;
 *  - no filesystem access, no network, no `eval`;
 *  - when in doubt, report nothing: a missed finding is cheaper than a false one.
 */

/** Maximum candidates one detector may return for one file. */
export const MAX_HITS_PER_FILE = 200;

/**
 * @typedef {{ line: number, endLine?: number, text: string, note?: string }} Hit
 * @typedef {{ path: string, text: string, lines: string[], language: string, framework: string }} DetectorContext
 */

/**
 * Index a character offset back to a 1-based line number.
 * @param {string} text
 * @param {number} offset
 * @returns {number}
 */
function lineOf(text, offset) {
  let line = 1;
  for (let index = 0; index < offset && index < text.length; index += 1) {
    if (text.charCodeAt(index) === 10) line += 1;
  }
  return line;
}

/**
 * Find opening tags of one element name and return their raw text with line spans.
 * Bounded: a tag must close within 2000 characters, which keeps a malformed document from
 * turning this into a scan of the whole file per match.
 *
 * @param {string} text
 * @param {string} element
 * @returns {{ start: number, raw: string, line: number, endLine: number }[]}
 */
function findOpeningTags(text, element) {
  const results = [];
  const pattern = new RegExp(`<${element}\\b`, 'gi');
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (results.length >= MAX_HITS_PER_FILE) break;
    const close = text.indexOf('>', match.index);
    if (close === -1 || close - match.index > 2000) continue;
    const raw = text.slice(match.index, close + 1);
    results.push({
      start: match.index,
      raw,
      line: lineOf(text, match.index),
      endLine: lineOf(text, close),
    });
  }
  return results;
}

/**
 * @param {string} raw
 * @param {string} attribute
 * @returns {boolean}
 */
function hasAttribute(raw, attribute) {
  return new RegExp(`(?:^|\\s)${attribute}(?:\\s*=|\\s|/|$)`, 'i').test(raw);
}

/**
 * @param {string} raw
 * @param {string} attribute
 * @returns {string | null}
 */
function attributeValue(raw, attribute) {
  const match = new RegExp(
    `(?:^|\\s)${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{?\\s*["'\`]([^"'\`]*)["'\`])`,
    'i',
  ).exec(raw);
  if (match === null) return null;
  return match[1] ?? match[2] ?? match[3] ?? null;
}

/**
 * @param {DetectorContext} context
 * @param {Record<string, unknown>} params
 * @returns {Hit[]}
 */
function attributeMissing({ text, lines }, params) {
  const element = String(params.element ?? '');
  const attributes = Array.isArray(params.attributes) ? params.attributes.map(String) : [];
  if (element === '' || attributes.length === 0) return [];

  /** @type {Hit[]} */
  const hits = [];
  for (const tag of findOpeningTags(text, element)) {
    // A tag that closes itself with no attributes is still a real element in HTML.
    if (attributes.some((attribute) => hasAttribute(tag.raw, attribute))) continue;
    // Spread props and framework bindings mean we cannot see the final attributes.
    if (/\{\s*\.\.\./.test(tag.raw)) continue;
    hits.push({
      line: tag.line,
      endLine: tag.endLine,
      text: lines[tag.line - 1] ?? tag.raw,
    });
  }
  return hits;
}

/**
 * @param {DetectorContext} context
 * @param {Record<string, unknown>} params
 * @returns {Hit[]}
 */
function unsafeUrlScheme({ text, lines }, params) {
  const schemes = Array.isArray(params.schemes) ? params.schemes.map(String) : ['javascript:'];
  if (schemes.length === 0) return [];

  /** @type {Hit[]} */
  const hits = [];
  const attribute =
    /(?:^|[\s{])(?:href|src|action|xlink:href)\s*[:=]\s*\{?\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/gi;
  let match;
  while ((match = attribute.exec(text)) !== null) {
    if (hits.length >= MAX_HITS_PER_FILE) break;
    const value = (match[1] ?? match[2] ?? match[3] ?? '').trim().toLowerCase();
    if (!schemes.some((scheme) => value.startsWith(scheme))) continue;
    const line = lineOf(text, match.index);
    hits.push({ line, text: lines[line - 1] ?? match[0] });
  }
  return hits;
}

/**
 * @param {DetectorContext} context
 * @param {Record<string, unknown>} params
 * @returns {Hit[]}
 */
function elementMissingDimensions({ text, lines }, params) {
  const element = String(params.element ?? 'img');
  const attributes = Array.isArray(params.attributes) ? params.attributes.map(String) : ['width', 'height'];

  /** @type {Hit[]} */
  const hits = [];
  for (const tag of findOpeningTags(text, element)) {
    if (attributes.every((attribute) => hasAttribute(tag.raw, attribute))) continue;
    // next/image with fill, a framework image component, or a spread makes the rendered
    // markup unknowable from this file.
    if (/\b(?:fill|priority)\b/.test(tag.raw)) continue;
    if (/\{\s*\.\.\./.test(tag.raw)) continue;
    if (/style=\{\{[^}]*aspectRatio/.test(tag.raw)) continue;
    hits.push({ line: tag.line, endLine: tag.endLine, text: lines[tag.line - 1] ?? tag.raw });
  }
  return hits;
}

/**
 * @param {DetectorContext} context
 * @param {Record<string, unknown>} params
 * @returns {Hit[]}
 */
function viewportZoomLocked({ text, lines }, params) {
  const minimumScale = Number(params.minimumScale ?? 5);

  /** @type {Hit[]} */
  const hits = [];
  for (const tag of findOpeningTags(text, 'meta')) {
    if (!/name\s*=\s*["']?viewport/i.test(tag.raw)) continue;
    const content = attributeValue(tag.raw, 'content') ?? tag.raw;

    if (/user-scalable\s*=\s*no/i.test(content)) {
      hits.push({ line: tag.line, text: lines[tag.line - 1] ?? tag.raw, note: 'user-scalable=no' });
      continue;
    }
    const scale = /maximum-scale\s*=\s*([\d.]+)/i.exec(content);
    if (scale !== null && Number(scale[1]) < minimumScale) {
      hits.push({ line: tag.line, text: lines[tag.line - 1] ?? tag.raw, note: `maximum-scale=${scale[1]}` });
    }
  }
  return hits;
}

/**
 * @param {DetectorContext} context
 * @param {Record<string, unknown>} params
 * @returns {Hit[]}
 */
function unguardedMotion({ text, lines }, params) {
  const properties = Array.isArray(params.properties) ? params.properties.map(String) : [];
  const minimum = Number(params.minimumDeclarations ?? 2);
  if (properties.length === 0) return [];
  if (/prefers-reduced-motion/i.test(text)) return [];

  const pattern = new RegExp(`\\b(?:${properties.join('|')})\\b`, 'i');
  /** @type {Hit[]} */
  const hits = [];
  let count = 0;
  let firstLine = null;

  for (const [index, line] of lines.entries()) {
    if (!pattern.test(line)) continue;
    count += 1;
    if (firstLine === null) firstLine = index + 1;
  }

  if (count < minimum || firstLine === null) return [];
  hits.push({
    line: firstLine,
    text: lines[firstLine - 1] ?? '',
    note: `${count} motion declarations and no prefers-reduced-motion block`,
  });
  return hits;
}

/**
 * @param {DetectorContext} context
 * @param {Record<string, unknown>} params
 * @returns {Hit[]}
 */
function autocompleteDisabledAuth({ text, lines }, params) {
  const hintPattern = String(params.hintPattern ?? 'pass|pwd|user|email|login|account');
  const hint = new RegExp(hintPattern, 'i');

  /** @type {Hit[]} */
  const hits = [];
  for (const tag of findOpeningTags(text, 'input')) {
    const autocomplete = attributeValue(tag.raw, 'autocomplete');
    if (autocomplete === null || autocomplete.toLowerCase() !== 'off') continue;

    const type = (attributeValue(tag.raw, 'type') ?? '').toLowerCase();
    const name = attributeValue(tag.raw, 'name') ?? '';
    const id = attributeValue(tag.raw, 'id') ?? '';

    if (type === 'password' || hint.test(name) || hint.test(id)) {
      hits.push({ line: tag.line, endLine: tag.endLine, text: lines[tag.line - 1] ?? tag.raw });
    }
  }
  return hits;
}

/**
 * @param {DetectorContext} context
 * @param {Record<string, unknown>} params
 * @returns {Hit[]}
 */
function suppressionComment({ lines }, params) {
  const directive = String(params.directive ?? '@ts-ignore');
  const replacement = String(params.replacement ?? '@ts-expect-error');

  /** @type {Hit[]} */
  const hits = [];
  for (const [index, line] of lines.entries()) {
    if (!line.includes(directive)) continue;
    if (line.includes(replacement)) continue;
    hits.push({ line: index + 1, text: line });
    if (hits.length >= MAX_HITS_PER_FILE) break;
  }
  return hits;
}

/** Registry of every detector the catalog may name. */
export const DETECTORS = Object.freeze({
  'attribute-missing': attributeMissing,
  'unsafe-url-scheme': unsafeUrlScheme,
  'element-missing-dimensions': elementMissingDimensions,
  'viewport-zoom-locked': viewportZoomLocked,
  'unguarded-motion': unguardedMotion,
  'autocomplete-disabled-auth': autocompleteDisabledAuth,
  'suppression-comment': suppressionComment,
});

/**
 * Run one rule's detector over one file.
 *
 * @param {object} rule
 * @param {DetectorContext} context
 * @returns {{ ok: true, hits: Hit[] } | { ok: false, message: string }}
 */
export function runDetector(rule, context) {
  const detector = DETECTORS[rule.detector];
  if (detector === undefined) {
    return { ok: false, message: `rule ${rule.id} names the unknown detector "${rule.detector}"` };
  }
  const hits = detector(context, rule.detectorParams ?? {});
  return { ok: true, hits: hits.slice(0, MAX_HITS_PER_FILE) };
}
