/**
 * Framework adapter: decide what kind of file the analyzer is looking at, and how sure it is.
 *
 * Framework-specific rules are the reason this project exists, and a framework rule that
 * fires on a plain file is the fastest way to lose a user's trust. So classification is
 * explicit, evidence-carrying and graded: every decision names the evidence that produced
 * it, and conflicting evidence lowers confidence instead of picking a winner silently.
 */

/** @typedef {{ kind: string, value: string }} Evidence */
/**
 * @typedef {object} Classification
 * @property {string} language css | html | js | jsx | ts | tsx | vue | svelte | astro | json …
 * @property {string} framework plain | react | next-app | next-pages | vue | svelte | astro | web-component
 * @property {'high'|'medium'|'low'} confidence
 * @property {Evidence[]} evidence
 */

const REACT_IMPORT = /(?:from\s+|require\(\s*)['"](?:react|react-dom)(?:\/[^'"]*)?['"]/;
const NEXT_IMPORT = /(?:from\s+|require\(\s*|import\(\s*)['"]next(?:\/[^'"]*)?['"]/;
const VUE_IMPORT = /(?:from\s+|require\(\s*)['"]vue(?:-router|-x)?['"]/;
const SVELTE_IMPORT = /(?:from\s+|require\(\s*)['"]svelte(?:\/[^'"]*)?['"]/;
const CUSTOM_ELEMENT = /customElements\.define\s*\(/;
const USE_CLIENT = /^\s*['"]use client['"]\s*;?\s*$/m;
const USE_SERVER = /^\s*['"]use server['"]\s*;?\s*$/m;
const JSX_HINT = /<[A-Za-z][\w.:-]*[\s/>]/;

/**
 * @param {string} from
 * @returns {string}
 */
const extensionOf = (from) => {
  const dot = from.lastIndexOf('.');
  return dot === -1 ? '' : from.slice(dot + 1).toLowerCase();
};

/**
 * Classify one file.
 *
 * @param {object} request
 * @param {string} request.path repository-relative path
 * @param {string} request.text file contents
 * @param {{ dependencies?: Record<string, string>, hasAppDirectory?: boolean }} [request.project]
 * @returns {Classification}
 */
export function classifyFile({ path, text, project = {} }) {
  const extension = extensionOf(path);
  /** @type {Evidence[]} */
  const evidence = [];
  /** @type {string[]} */
  const frameworks = [];

  const language =
    extension === 'html' || extension === 'htm'
      ? 'html'
      : extension === 'css' || extension === 'scss' || extension === 'less'
        ? 'css'
        : extension === ''
          ? 'unknown'
          : extension;

  evidence.push({ kind: 'extension', value: extension || '(none)' });

  const dependencies = project.dependencies ?? {};
  const hasNext = Object.hasOwn(dependencies, 'next');
  const hasReact = Object.hasOwn(dependencies, 'react') || hasNext;

  if (hasNext) {
    const nextFramework = project.hasAppDirectory ? 'next-app' : 'next-pages';
    frameworks.push(nextFramework);
    evidence.push({ kind: 'dependency', value: `next (${nextFramework})` });
  } else if (hasReact) {
    frameworks.push('react');
    evidence.push({ kind: 'dependency', value: 'react' });
  }

  if (NEXT_IMPORT.test(text)) {
    frameworks.push('next-app');
    evidence.push({ kind: 'import', value: 'next/*' });
  }
  if (REACT_IMPORT.test(text)) {
    frameworks.push('react');
    evidence.push({ kind: 'import', value: 'react' });
  }
  if (VUE_IMPORT.test(text) || extension === 'vue') {
    frameworks.push('vue');
    evidence.push({ kind: extension === 'vue' ? 'extension' : 'import', value: 'vue' });
  }
  if (SVELTE_IMPORT.test(text) || extension === 'svelte') {
    frameworks.push('svelte');
    evidence.push({ kind: extension === 'svelte' ? 'extension' : 'import', value: 'svelte' });
  }
  if (extension === 'astro') {
    frameworks.push('astro');
    evidence.push({ kind: 'extension', value: 'astro' });
  }
  if (USE_CLIENT.test(text) || USE_SERVER.test(text)) {
    frameworks.push('next-app');
    evidence.push({ kind: 'directive', value: USE_CLIENT.test(text) ? 'use client' : 'use server' });
  }
  if (CUSTOM_ELEMENT.test(text)) {
    frameworks.push('web-component');
    evidence.push({ kind: 'call', value: 'customElements.define' });
  }

  const unique = [...new Set(frameworks)];
  /** @type {string} */
  let framework;
  /** @type {'high'|'medium'|'low'} */
  let confidence = 'high';

  if (unique.length === 0) {
    framework = 'plain';
    // A .tsx file with no JSX and no React import is ambiguous: it may be a utility module.
    if ((extension === 'tsx' || extension === 'jsx') && !JSX_HINT.test(text)) {
      confidence = 'low';
      evidence.push({ kind: 'ambiguity', value: 'jsx extension without JSX or a framework import' });
    }
  } else if (unique.length === 1) {
    framework = unique[0];
  } else {
    // Several frameworks claim the file. Prefer the most specific, and say so.
    const precedence = ['next-app', 'next-pages', 'react', 'vue', 'svelte', 'astro', 'web-component'];
    framework = precedence.find((candidate) => unique.includes(candidate)) ?? unique[0];
    confidence = 'medium';
    evidence.push({ kind: 'conflict', value: `multiple candidates: ${unique.join(', ')}` });
  }

  // A markup-language mismatch is worth flagging: it usually means a template file.
  const languageFamily = language === 'tsx' || language === 'jsx' ? 'markup' : language;
  if (languageFamily === 'ts' || languageFamily === 'js') {
    // Nothing further: a script may legitimately contain JSX-free framework code.
  }

  return { language, framework, confidence, evidence };
}

/**
 * Read project facts from a package.json and directory listing, tolerating absence.
 *
 * @param {{ packageJsonText?: string, hasAppDirectory?: boolean }} input
 * @returns {{ dependencies: Record<string, string>, hasAppDirectory: boolean }}
 */
export function readProjectFacts({ packageJsonText, hasAppDirectory = false }) {
  /** @type {Record<string, string>} */
  let dependencies = {};
  if (typeof packageJsonText === 'string' && packageJsonText.trim() !== '') {
    try {
      const parsed = JSON.parse(packageJsonText);
      dependencies = {
        ...(parsed.dependencies ?? {}),
        ...(parsed.devDependencies ?? {}),
        ...(parsed.peerDependencies ?? {}),
      };
    } catch {
      // An unparsable manifest is not an error here: the adapter simply has less evidence.
      dependencies = {};
    }
  }
  return { dependencies, hasAppDirectory };
}

/**
 * Compare a declared version against a semver range of the form ">=X.Y".
 * Returns true, false, or undefined when the comparison cannot be made.
 *
 * @param {string | undefined} declaredVersion
 * @param {string} range
 * @returns {boolean | undefined}
 */
export function satisfiesMinimum(declaredVersion, range) {
  const wanted = /^>=\s*(\d+)(?:\.(\d+))?/.exec(range);
  const found =
    declaredVersion === undefined ? null : /(\d+)(?:\.(\d+))?/.exec(declaredVersion.replace(/^[^\d]*/, ''));
  if (wanted === null || found === null) return undefined;
  const wantedMajor = Number(wanted[1]);
  const wantedMinor = Number(wanted[2] ?? 0);
  const foundMajor = Number(found[1]);
  const foundMinor = Number(found[2] ?? 0);
  if (foundMajor !== wantedMajor) return foundMajor > wantedMajor;
  return foundMinor >= wantedMinor;
}
