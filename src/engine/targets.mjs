/**
 * Support-target resolution and gating.
 *
 * This is where "never flag code merely for being old" becomes executable rather than a
 * README promise. A rule declares the constraint under which its advice is valid; the
 * project declares its target; the gate decides whether the finding applies, must be
 * demoted to "situational, because your target predates the alternative", or is unknown
 * because the evidence is incomplete. An unknown gate is reported, never silently dropped.
 */

import { satisfiesMinimum } from './classify.mjs';

/**
 * @typedef {{ rank: number, title: string, default: boolean }} SupportPreset
 * @typedef {{ rank: number, title: string, doc: string }} SupportFeature
 * @typedef {{ preset: string, rank: number, known: boolean }} ResolvedTargets
 */

/**
 * Resolve a preset name to its rank, falling back to the catalog default.
 *
 * @param {{ supportPresets: Record<string, SupportPreset> }} catalog
 * @param {string | undefined} presetName
 * @returns {{ ok: true, targets: ResolvedTargets } | { ok: false, message: string, known: string[] }}
 */
export function resolveTargets(catalog, presetName) {
  const presets = catalog.supportPresets ?? {};
  const known = Object.keys(presets);

  if (presetName === undefined) {
    const fallback = known.find((name) => presets[name].default === true);
    if (fallback === undefined)
      return { ok: false, message: 'catalog declares no default support preset', known };
    return { ok: true, targets: { preset: fallback, rank: presets[fallback].rank, known: true } };
  }

  if (!Object.hasOwn(presets, presetName)) {
    return { ok: false, message: `unknown support preset "${presetName}"`, known };
  }
  return { ok: true, targets: { preset: presetName, rank: presets[presetName].rank, known: true } };
}

/**
 * @typedef {object} GateOutcome
 * @property {'applies'|'demoted'|'unknown'} state
 * @property {string | null} note human-readable reason, surfaced with the finding
 */

/**
 * Decide what a rule's support gate means for this project.
 *
 * @param {object} rule
 * @param {{ features: Record<string, SupportFeature> }} catalog
 * @param {ResolvedTargets} targets
 * @param {{ dependencies?: Record<string, string> }} [project]
 * @returns {GateOutcome}
 */
export function evaluateGate(rule, catalog, targets, project = {}) {
  const gate = rule.supportGate;
  if (gate === null || gate === undefined) return { state: 'applies', note: null };

  if (gate.kind === 'browser-feature') {
    const feature = catalog.features?.[gate.feature];
    if (feature === undefined) {
      return {
        state: 'unknown',
        note: `the catalog does not describe the feature "${gate.feature}", so the target constraint could not be checked`,
      };
    }
    if (targets.rank >= feature.rank) return { state: 'applies', note: null };
    return {
      state: 'demoted',
      note: `the modern alternative this rule points at is unavailable at the declared target "${targets.preset}"`,
    };
  }

  if (gate.kind === 'framework-version') {
    const declared = project.dependencies?.[gate.framework];
    if (declared === undefined) {
      return {
        state: 'unknown',
        note: `no declared version of ${gate.framework} was found, so the ${gate.requires} requirement could not be checked`,
      };
    }
    const satisfied = satisfiesMinimum(declared, gate.requires);
    if (satisfied === undefined) {
      return {
        state: 'unknown',
        note: `the declared ${gate.framework} version "${declared}" could not be compared with "${gate.requires}"`,
      };
    }
    return satisfied
      ? { state: 'applies', note: null }
      : {
          state: 'demoted',
          note: `the declared ${gate.framework} version "${declared}" does not satisfy "${gate.requires}"`,
        };
  }

  return { state: 'unknown', note: `unrecognised support gate kind "${gate.kind}"` };
}

/**
 * A gate may only demote a finding that is a matter of taste or timing.
 * A finding that is unsafe or inaccessible regardless of the target is never demoted:
 * the modern alternative being unavailable is not a reason to keep shipping a defect.
 *
 * @param {{ classification: string }} rule
 * @returns {boolean}
 */
export function isDemotable(rule) {
  return rule.classification !== 'insecure' && rule.classification !== 'inaccessible';
}
