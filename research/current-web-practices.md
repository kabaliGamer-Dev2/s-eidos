# Current web platform — support policy, detection idioms, fallbacks, traps

**Purpose:** the only platform layer the catalog needs: how a support claim is made, how a feature is detected, what fallback a recommendation must name, and the traps that would make advice wrong. **Retrieved:** 2026-11-16 (Asia/Calcutta).

No shipped rule in `legacy-pattern-catalog.md` is a web-platform token rule; this file exists so the *remediation text* attached to a framework finding cannot contradict current platform reality. Feature ids below are resolved under the base URLs registered in `source-register.md` §1 (`api.webstatus.dev/v1/features/`, `raw.githubusercontent.com/mdn/browser-compat-data/main/`), whose `Notes` enumerate every id and path read.

## 1. Baseline / support policy — machine-checkable meaning

| Term | Meaning used by the tool | Source |
|---|---|---|
| **newly available** | every engine in the core set reports `version_added != false`; `low_date` = date the last engine shipped | https://web.dev/baseline |
| **widely available** | `high_date = low_date + 30 months ≤ today` (recompute at read time; never cache the badge string) | https://web.dev/baseline |
| **limited availability** | at least one core engine has no shipping implementation | https://web.dev/baseline |
| **core browser set** | Chrome desktop+Android, Edge desktop, Firefox desktop+Android, Safari macOS+iOS | https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility |
| **deprecated** | available in ≥1 browser but should not be used, or scheduled for removal — distinct from limited | MDN glossary (as above) |

**What Baseline explicitly does not cover** (and therefore what a Baseline badge may never be used to justify): accessibility, usability, performance, security, older devices/browser releases, **OS web views**, and **assistive technology**. "Baseline, therefore safe" is a defect, not a finding.

**Two-source rule.** A version and a status never come from the same class of source: version from BCD JSON or webstatus per-engine `version_added`; status from `web-features`/`baseline.status` or first-party prose. A dashboard may not confirm itself.

**Granularity trap (worked example).** `color-scheme` is Chrome **81** as a *property* (BCD `css/properties/color-scheme.json`) and Chrome **98** as a *feature* (webstatus). Store `(feature_key, definition_source, granularity_note)`. A tool with one number per name emits contradictory advice.

**Target resolution is offline.** Presets and their Browserslist mirrors live in `browser-compatibility-matrix.md`; `today` is injected at evaluation time, never hardcoded. No network call is permitted, so every preset is a pinned table plus arithmetic.

## 2. Detection idioms (what a recommendation may tell the user to guard on)

| Feature | Idiom | Limit it encodes |
|---|---|---|
| CSS declarations | `CSS.supports('aspect-ratio','1/1')` | Assertion about the *declaration*, not about layout behaviour |
| Cascade layers | `typeof CSSLayerBlockRule !== 'undefined'` | Layer order is file-order dependent |
| `@container` (size) | `CSS.supports('container-type: inline-size')` | The container must not be size-contained in a way that changes the queried layout |
| Popover | `'popover' in HTMLElement.prototype && typeof HTMLElement.prototype.showPopover === 'function'` | iOS floor 18.3; light-dismiss/top-layer behaviour differs from hand-rolled overlays |
| `inert` | `'inert' in HTMLElement.prototype` | Widely only since 2025-10-11 |
| Lazy loading | `'loading' in HTMLImageElement.prototype` | Attribute support ≠ safe to lazy-load an LCP candidate |
| Input types | `const i = document.createElement('input'); i.type = 'date'; i.type === 'date'` | **Mandatory**: engines silently fall back to `text`; never test `'date' in i` |
| Sanitizer | `typeof Element.prototype.setHTML === 'function'` | Layer only; must never replace a maintained sanitiser |
| Reduced motion | `matchMedia('(prefers-reduced-motion: reduce)')` | A preference, not a capability; never used to skip essential UI |
| **No one-line detection** | Container **style** queries (computed-style probe rule), top-level await (build target, not runtime), `<track>` caption UI (UA behaviour) | Must be stated as "build-time / needs manual verification" |

## 3. Fallbacks a recommendation must name

| Situation | Required fallback | Trap |
|---|---|---|
| Unsupported **CSS** | silent degradation — the element still renders, wrong layout | Never describe a CSS fallback as "safe"; it changes the design |
| Unsupported **JS/DOM API** | feature guard + alternative path, or the code throws and can abort a bundle | Different cost from CSS: a missing method is a hard failure |
| `structuredClone` | `JSON.parse(JSON.stringify(x))` is **not equivalent** — loses `Date`, `Map`, `Set`, cycles | Silent data loss; document what is dropped or refuse the substitution |
| `text-wrap: balance`/`pretty` | normal wrapping; constrain measure instead | Cosmetic; never compute line counts or layout from it |
| Popover / `showPopover` | `<dialog>`+`showModal()` or a JS overlay with a focus trap | Only newly available; do not blanket-replace working overlays |
| `requestIdleCallback` | `scheduler.postTask` when available, else `MessageChannel`/`setTimeout` chunking | Never place required work in the idle callback (see trap 1) |
| View Transitions | keep the un-animated path complete; never move required state into the transition callback | Navigation semantics and mobile interop are the weak spots |

## 4. Traps — 14 places where "modern" advice is wrong

| # | Feature | The trap | Correct guidance | Evidence |
|---|---|---|---|---|
| 1 | `requestIdleCallback` | Appears safe because Chrome/Firefox ship it; **Safari has no implementation at all** (experimental flag only). About 56 % of Chrome page loads use it, so telemetry says it is universal | Never "the" idle scheduler; treat the callback as optional and never put required work in it | webstatus `requestidlecallback` (limited, Safari WPT 0); caniuse note `#2` "Can be enabled in Experimental (WebKit) Features" |
| 2 | Sanitizer API / `setHTML()` | Sounds like the standard answer to "safe HTML"; it is **limited** — Chrome 146, Firefox 148, **no Safari** (Safari WPT ≈0.04) | Keep DOMPurify (or equivalent) as the default path; `setHTML` only behind a guard and only as an additional layer | webstatus `sanitizer` |
| 3 | Popover API | Described as the modern replacement for menus/tooltips, but only **newly available since 2025-01-27** because **iOS shipped it in 18.3** | Do not blanket-replace overlays; pair with a `<dialog>`/JS fallback and verify light-dismiss/top-layer per engine | webstatus `popover` (low 2025-01-27; iOS 18.3) |
| 4 | `:has()` | Both directions are wrong: "avoid it, it is slow" (it is **widely available**, high 2026-06-19; Chrome daily usage ≈0.57) and "`:has()` is free" (invalidation cost is implementation-defined) | **"Adopt `:has()`" is not a modernization** — it is already widespread. Neither performance claim may be emitted without a measurement on the real DOM | webstatus `has` (widely, usage ≈0.57) |
| 5 | `inert` | Everyone "knows" it is ancient; **widely available only since 2025-10-11** | Never the sole focus-containment remedy on older iOS; pair with a focus trap or `hidden` | webstatus `inert` (widely, high 2025-10-11) |
| 6 | `AbortSignal.timeout()` | Reads as old news; became **widely available only 2026-10-18** (Chrome floor 124) | Keep `AbortController` + `setTimeout` when the project floor predates Chrome 124 | webstatus `abortsignal-timeout` |
| 7 | CSS Nesting | "Supported since Chrome 112" is wrong in practice: **112–119 and Safari 16.5–17.1 are partial**; nested rules starting with a type selector fail | Pin the fully supporting versions (Chrome 120, Safari 17.2) or flatten at build time; never infer support from a major version | BCD `css/selectors/nesting.json` (`partial_implementation: true`) |
| 8 | Container **style** queries | Newly available only **2026-05-19** (Firefox 151); Safari cannot use the document element as a container (WebKit bug 271040) | Prefer size queries; gate style queries on a computed-style probe and keep a class-based fallback | webstatus `container-style-queries`; BCD `css/at-rules/container.json` |
| 9 | `text-wrap: pretty` | Grouped with `balance` in articles, but **Firefox does not implement it** (WPT 0) | Only where a no-op is acceptable; never as a correctness requirement | webstatus `text-wrap-pretty` (limited) |
| 10 | View Transitions | Demos look universal (Chrome 111, Safari 18); **Firefox only from 144 (2025-10-14)**; Chrome Android WPT ≈0.25 | Progressive enhancement only; keep the un-animated path complete | webstatus `view-transitions` (newly 2025-10-14) |
| 11 | `fetchpriority` | Desktop Firefox 132 reads as "supported", but **Firefox Android WPT is 0** | Treat as a hint, not a contract; the LCP path must be fast without it | webstatus `fetch-priority` |
| 12 | Top-level await | Widely cited as safe since 2021; the dashboard says Safari 27 while its own WPT field says Safari score 1.0 — a contradiction, and TLA cannot be feature-detected at runtime | Never auto-migrate to TLA; require a build-target change + async entry graph; resolve the anomaly before citing it — **`UNVERIFIED`** | webstatus `top-level-await` (data conflict) |
| 13 | Trusted Types | Teams assume `require-trusted-types-for` is protection. It is **fail-open**: engines without TT ignore the directive; TT itself only newly available **2026-02-24** (Firefox 148, Safari 26) | Defense in depth: escape/sanitise at every sink, ship TT report-only first, treat Safari <26 / Firefox <148 as unprotected | https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API |
| 14 | `loading="lazy"` | Only **widely available since 2026-06-19** (Firefox 121, Safari 16.4) — and lazy on the first-viewport image **delays LCP** | Keep the hero eager; this is why `IMG-003` is support-gated and reports "likely to delay LCP" with no number | webstatus `loading-lazy`; https://web.dev/articles/lcp |

**Two general traps that outrank the table.** (a) A support claim with no version, no date and no fallback is a defect (citation discipline forbids "modern browsers", "all evergreen browsers", "should work", "~95 %"). (b) A percentage without provenance is a defect: usage shares and WPT scores are snapshots, not properties of the feature, and must be shown with their retrieval date or omitted.

## 5. `UNVERIFIED` items carried forward from the platform research

| Item | Status | Consequence |
|---|---|---|
| `clamp()` versions / Baseline | **UNVERIFIED** — no web-features id matched; BCD type entry not read | never cite a version for `clamp()` |
| `autocomplete` token set; per-`<input type=…>` support | **UNVERIFIED** — no single source models per-token support | no rule may claim "autocomplete works" from attribute presence |
| `AbortController`, `URLSearchParams`, `Intl.NumberFormat`, `Intl.supportedValuesOf` versions | **UNVERIFIED** — entries not read | no version cited |
| CSP `strict-dynamic`, `require-trusted-types-for`, COOP/COEP/CORP | **UNVERIFIED** — header-level BCD paths not fetched | advisory text only, never a support claim |
| Top-level await Safari version | **UNVERIFIED** — dashboard/WPT self-contradiction | never cited |
| Node.js version cells | **UNVERIFIED** — no nodejs.org page read in the platform pass | framework layer reads `engines.node` from installed metadata instead |
| Streaming SSR / React 19 platform prerequisites | **UNVERIFIED** — framework docs not cited for platform rows | `Streams` and `fetch` are verified individually; no framework claim is inferred |
| `credentialless` COEP support | **UNVERIFIED** | never recommended unconditionally |
| Per-API Baseline status for individual modern APIs (the `JS-19`/`AIA-06` class) | **UNVERIFIED per-API** — each needs a target input before it can be asserted | no "this API is unsupported" finding ships; only the preset-gated rows in `browser-compatibility-matrix.md` §2 |
| Codec-support matrix (the `MED-04` class) | **UNVERIFIED** — no compat table consulted; the row was `Low` confidence in the input | no codec rule exists, and "add WebM/AV1" is never asserted as a remedy |
| `<video>`/`<track>` caption UI behaviour | WPT aggregate ≈0.58 Firefox/Safari vs ≈0.95 Chromium — diverges | caption rendering is UA UI, not a scriptable surface |
| Soft-navigation CrUX experimental metrics | **UNVERIFIED** graduation date | must not be encoded in any rule |
