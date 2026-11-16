# Prioritized shortlist — what to ship first

- **Retrieved:** 2026-11-16 (Asia/Calcutta)
- **Author:** `legacy-pattern-analyst`
- **Input:** `pattern-catalog.md` (164 rows). This file is the *shipping order*, not a second catalog.
- **Status:** recommendation only. Nothing built, nothing published.

## 1. Scoring method (so the ranking is reproducible and arguable)

Each candidate is scored 1–5 on the four factors the brief names, then summed to /20. Equal weights are
deliberate: weighting harm above detectability would promote rules the tool cannot implement without false
positives, which is the failure mode this project exists to avoid.

| Factor | 1 | 5 |
|---|---|---|
| **F** — frequency in AI output | rare, only in legacy codebases | appears in most generated components |
| **H** — harm when real | cosmetic | blocks task completion or is a security hole |
| **D** — static detectability | needs whole-program dataflow | decidable from one AST node |
| **S** — safety of remediation | fix can silently change behaviour | fix is provably behaviour-preserving |

Tie-break order: **D**, then **S**, then **H**. A high-`D`/high-`S` rule ships before a higher-harm rule that
needs taint analysis, because a noisy rule erodes trust in all the other rules.

## 2. Recommended shipping order — 22 rules

| # | ID | Rule | F | H | D | S | Score | One-line justification |
|---|---|---|---|---|---|---|---|---|
| 1 | JS-05 | `javascript:` URL in `href`/`src` | 3 | 5 | 5 | 5 | 18 | Regex-decidable, always wrong, and the autofix to `#` plus a real handler is provably safe. |
| 2 | IMG-03 | `<img>` without `width`/`height` | 5 | 3 | 5 | 4 | 17 | Near-universal in generated markup and a direct CLS lever, decidable per element once `next/image fill` and `aspect-ratio` are excluded. |
| 3 | MET-01 | `user-scalable=no` / `maximum-scale=1` | 3 | 4 | 5 | 5 | 17 | A one-line WCAG 1.4.4 blocker with a mechanical, zero-risk fix. |
| 4 | TYP-02 | `@ts-ignore` instead of `@ts-expect-error` | 5 | 2 | 5 | 5 | 17 | Textbook AI habit, pure token substitution, and the fix self-cleans by design. |
| 5 | MOT-01 | No `prefers-reduced-motion` guard on large motion | 5 | 3 | 5 | 4 | 17 | Generated pages animate heavily and omit the guard; adding a media block is additive and reversible. |
| 6 | SEM-01 | Clickable `div` with no role or keyboard handler | 5 | 4 | 4 | 3 | 16 | The single most common accessibility defect in AI output, and `<button type="button">` is a near-verbatim replacement. |
| 7 | SEM-10 | `<iframe>` without `title` | 3 | 3 | 5 | 5 | 16 | Trivially detectable, trivially fixable, and emits in nearly every embedded-map or video snippet. |
| 8 | FRM-03 | `autocomplete="off"` on auth fields | 4 | 3 | 5 | 4 | 16 | MDN states `off` does not stop password managers, so the attribute buys nothing and breaks autofill. |
| 9 | NXT-11 | Secret behind `NEXT_PUBLIC_` | 3 | 5 | 4 | 4 | 16 | Name-pattern detection on env vars; a real credential leak, and the fix is to move it server-side. |
| 10 | ARI-01 | `aria-hidden="true"` on focusable content | 4 | 5 | 4 | 2 | 15 | MDN carries an explicit warning; the fix is right but changes DOM behaviour, so it stays detect-only. |
| 11 | FRM-01 | Input with no associated label | 4 | 4 | 4 | 3 | 15 | High-frequency and unambiguously harmful, but design-system wrappers must be excluded before shipping. |
| 12 | IMG-01 | `<img>` with no `alt` | 5 | 4 | 4 | 2 | 15 | Very frequent; kept below IMG-03 because the correct `alt` depends on content and cannot be invented. |
| 13 | FOC-03 | `outline: none` with no replacement | 5 | 4 | 4 | 2 | 15 | Generated CSS resets do this constantly; the rule must confirm no replacement style exists in the same block. |
| 14 | ARI-05 | Positive `tabindex` | 3 | 3 | 5 | 4 | 15 | MDN warns against values above 0; zero ambiguity and a safe strip-to-0 fix. |
| 15 | MED-01 | `<video>` with no captions track | 4 | 5 | 5 | 1 | 15 | High harm and easy to detect, but captions must be authored — the rule reports, never fixes. |
| 16 | MED-03 | Media element with no `controls` | 3 | 3 | 5 | 4 | 15 | Decidable per element once decorative background video is excluded. |
| 17 | REA-04 | Derived state computed in `useEffect` | 5 | 3 | 4 | 2 | 14 | react.dev names this exact anti-pattern; the render-time rewrite is safe only after confirming the derivation is pure. |
| 18 | NXT-05 | `Date.now()`/`Math.random()` in render | 4 | 4 | 4 | 2 | 14 | Deterministic hydration failures with a clear console signature, but the correct fix depends on intent. |
| 19 | JS-09 | `fetch` with no `res.ok` check | 5 | 3 | 4 | 2 | 14 | Extremely common; a 404 silently parsed as data is a real user-facing bug, and the wrapper fix is local. |
| 20 | JS-04 | `eval` / `new Function` | 2 | 5 | 5 | 2 | 14 | Low frequency but maximum harm and perfect detectability; also the gate for any future CSP work. |
| 21 | NXT-03 | Raw `<img>` inside a Next.js app | 4 | 2 | 4 | 4 | 14 | Framework-idiom drift, safe to report, and cheap to fix with `next/image`. |
| 22 | REA-10 | Controlled input with no `onChange` | 4 | 3 | 4 | 3 | 14 | A read-only field the user cannot edit; deterministic and locally fixable. |

**Deliberately not in the first 22 despite high harm:** `JS-02` (innerHTML, score 13), `REA-09`
(`dangerouslySetInnerHTML`, 13), `BLD-08` (client-only authz, 12), `FRM-05` (unlinked errors, 12),
`JS-11` (`postMessage` origin, 12). All five need taint or whole-module analysis. Shipping them before the
taint model exists is how a conservative tool loses its conservative reputation; they belong in phase 2, once
the "untrusted source → sink" model in §4 has fixtures.

## 3. Rejected as default rules

| ID | Pattern | Why it must not be default-on |
|---|---|---|
| SEM-07 | Multiple `h1` / no `h1` | HTML permits multiple `h1`; nested `<article>`s legitimately each own one. This is HTTP-and-SEO folklore from the HTML4 era, not a defect. |
| JS-13 | `target="_blank"` without `rel="noopener"` | Modern engines imply `noopener`, so the finding is almost always noise. `noreferrer` is a privacy decision, not a security fix. |
| JS-22 | `==` loose equality | `x == null` is the idiomatic null-or-undefined check. Style preference dressed as correctness. |
| REA-07 | `useMemo`/`useCallback` on trivial values | No measured harm, and React Compiler makes the judgement version-dependent. |
| AIA-01 | Wrapper that only forwards props | Legitimate at API boundaries, for stable public surfaces, and for future error/context injection. |
| AIA-05 | Dependency for a few lines of logic | Subjective; a well-maintained library often beats hand-rolled edge cases. |
| SEM-04 | `<table>` for layout | Data tables and layout tables are not reliably separable statically, and the harm is low. |
| JS-21 | `var` in new code | Fails the project's own premise: never flag code merely for being old. |
| CSS-01 | `100vh` hero | Correct or incorrect only given a mobile target and current viewport-unit support; requires config the tool does not have. |
| ARI-02 | Redundant role on a native element | Harmless; validators mention it, users never notice it. |
| CSS-06 | `!important` above a threshold | Utility and override layers use it by convention. A count is not a defect. |
| MED-04 | Single legacy codec, no fallback | MP4/H.264 alone is a defensible universal choice, not an error. |
| MET-06 | JSON-LD `@type` mismatch | Needs schema validation and network access to the Rich Results rules; not a static-analysis problem. |

**Deferred, not rejected** — blocked on a `targets`/`browserslist` input: `AIA-06`, `IMG-04`, `CSS-03`,
`CSS-09`, `FOC-01` (needs `inert` support), `BLD-06`, `NXT-08`, `NXT-09`.

## 4. Pre-conditions before rule #1 ships

1. **`targets` config exists.** Eight rows are undecidable without it (see deferred list). Without it the tool
   cannot honour "never flag merely for being old", because "old" is a function of the target.
2. **Framework detection runs first.** `IMG-03` must not fire inside a `next/image` component, `FRM-01` must
   not fire inside a design-system `Field`, `FOC-01` must accept `<dialog>`.
3. **Every rule ships with positive *and* negative fixtures.** For #1–#22 that is 44 fixtures minimum. The
   negative fixture is the contract: it encodes the false-positive condition from the catalog.
4. **`safe` ≠ `default-on`.** Only the 13 `safe` rows may auto-edit, and even those must be opt-in for the
   first release.
