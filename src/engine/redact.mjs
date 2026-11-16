/**
 * Redaction and excerpting.
 *
 * Reports are read by humans, pasted into issues, and — in an agent environment — fed back
 * into a model's context. A scanner that quotes a repository verbatim can leak a credential
 * into a log or a prompt. So excerpts are constructed already safe: one line, bounded,
 * comments stripped, and secret-shaped values replaced before anything else sees them.
 */

const MAX_EXCERPT = 120;

/** Values that look like credentials, replaced wherever they appear in an excerpt. */
const SECRET_PATTERNS = Object.freeze([
  // key = "value" / key: 'value' / token=value
  [
    /\b(api[_-]?key|apikey|secret|token|password|passwd|pwd|auth|credential|private[_-]?key)\b(\s*[:=]\s*)(['"`])[^'"`\s]{6,}\3/gi,
    '$1$2$3[redacted]$3',
  ],
  // Bare cloud/provider token shapes.
  [/\b(sk|pk|rk)-[A-Za-z0-9_-]{16,}/g, '[redacted]'],
  [/\bgh[pousr]_[A-Za-z0-9]{16,}/g, '[redacted]'],
  [/\bAKIA[0-9A-Z]{12,}/g, '[redacted]'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/g, '[redacted]'],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/g, '[redacted]'],
  // A long opaque literal assigned to anything, which is usually a key.
  [/(['"`])[A-Za-z0-9+/=_-]{40,}\1/g, '"[redacted]"'],
]);

/**
 * Remove a trailing line comment from one line of code, without pretending to be a parser.
 * This is a heuristic: it only strips a comment introduced after code, and never touches
 * a string that merely contains "//" followed by no space.
 *
 * @param {string} line
 * @returns {string}
 */
export function stripTrailingComment(line) {
  const trimmed = line.trimStart();
  // A line that is only a comment keeps its text: the comment is the finding.
  if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('<!--')) return line;

  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];

    if (character === '\\') {
      index += 1;
      continue;
    }
    if (!inDouble && !inTemplate && character === "'") inSingle = !inSingle;
    else if (!inSingle && !inTemplate && character === '"') inDouble = !inDouble;
    else if (!inSingle && !inDouble && character === '`') inTemplate = !inTemplate;
    else if (!inSingle && !inDouble && !inTemplate) {
      if (character === '/' && next === '/' && line[index + 2] !== '/') {
        return line.slice(0, index).trim() === '' ? line : line.slice(0, index);
      }
      if (character === '*' && next === '/' && index > 0) {
        return line.slice(0, index - 1).trim() === '' ? line : line.slice(0, index - 1);
      }
    }
  }
  return line;
}

/**
 * Collapse whitespace so an excerpt is always one line.
 * @param {string} text
 * @returns {string}
 */
const collapse = (text) => text.replace(/\s+/g, ' ').trim();

/**
 * Build a safe one-line excerpt for a finding.
 *
 * @param {string} rawLine the source line
 * @param {{ keepComments?: boolean }} [options]
 * @returns {string}
 */
export function excerpt(rawLine, options = {}) {
  const keepComments = options.keepComments === true;
  let text = typeof rawLine === 'string' ? rawLine : '';
  if (!keepComments) text = stripTrailingComment(text);
  text = collapse(text);
  text = redact(text);
  if (text.length <= MAX_EXCERPT) return text;
  return `${text.slice(0, MAX_EXCERPT - 1)}…`;
}

/**
 * Replace secret-shaped values in arbitrary text.
 *
 * @param {string} text
 * @returns {string}
 */
export function redact(text) {
  let output = String(text ?? '');
  for (const [pattern, replacement] of SECRET_PATTERNS) {
    output = output.replace(pattern, replacement);
  }
  return output;
}

/**
 * Does this text contain something that looks like a credential?
 * Used by tests and by the report's self-check.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function looksLikeSecret(text) {
  // A value already replaced by the redactor is not a live credential.
  const probe = String(text ?? '').replace(/\[redacted\]/g, '');
  return SECRET_PATTERNS.some(([pattern]) => {
    const regex = new RegExp(pattern.source, pattern.flags.replace('g', ''));
    return regex.test(probe);
  });
}
