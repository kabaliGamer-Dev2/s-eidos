# Compatibility & Standards Evidence Layer

**Owner:** modern-web-researcher · **Retrieved:** 2026-11-16 · **Applies to:** modern-alternative recommendation engine
**Policy:** primary sources only. Nothing in this file is asserted from memory. Unread facts are `UNVERIFIED`.

## 0. How this was built (reproducibility)

| Source class | Exact artifact used | What it gives |
|---|---|---|
| MDN browser-compat-data (BCD) raw JSON | `raw.githubusercontent.com/mdn/browser-compat-data/main/<path>.json` (12 files; paths listed in §5) | `version_added`, `version_removed`, `partial_implementation`, `alternative_name`, `prefix` |
| web-platform-dx Web Platform Dashboard API | `api.webstatus.dev/v1/features/<feature_id>` (25 ids) | `baseline.status`, `baseline.low_date`, `baseline.high_date`, per-engine version **and release date**, WPT interop score, Chrome daily usage share |
| web.dev Baseline | `web.dev/baseline` | Baseline stage definitions, core browser set |
| MDN Glossary | `/en-US/docs/Glossary/Baseline/Compatibility` | Badge vocabulary, explicit non-guarantees |
| web.dev + Browserslist | `web.dev/articles/use-baseline-with-browserslist` (updated 2025-09-17) | Implementable target queries |
| caniuse | `raw.githubusercontent.com/Fyrd/caniuse/main/features-json/requestidlecallback.json` | Cross-check of the Safari gap (flags `n d #2` = behind experimental flag) |

Derived values are marked **`(derived)`** and are never presented as read facts. Confidence: **H** = read directly from a primary source; **M** = computed from two read facts (e.g. "all engines ≥ date X, therefore >30 months elapsed"); **L** = single source or inference; **✗** = conflict/UNVERIFIED.

---

# 1. Baseline / support policy model

## 1.1 Vocabulary, per the official source

| Term | Official definition (verbatim intent) | Source | Retrieved |
|---|---|---|---|
| **Baseline** | Identifies availability of web platform features across popular browsers — APIs, CSS properties, JS syntax — as *widely available* or *newly available*; anything else is *limited availability*. | MDN Glossary | 2026-11-16 |
| **Baseline newly available** | "The feature is supported by all of the core browsers, and is therefore interoperable." Works "in at least the latest stable version of each of the Baseline browsers, but may not work with older browsers and devices." | web.dev/baseline; MDN | 2026-11-16 |
| **Baseline widely available** | "30 months have passed since the newly interoperable date" / "consistent history of support in each of the Baseline browsers for at least 2.5 years". | web.dev/baseline; MDN | 2026-11-16 |
| **Limited availability** | Not yet supported across browsers ("prior to being Newly available"). Also covers features that are standardised and shipping in *some* engines only. | web.dev/baseline | 2026-11-16 |
| **Deprecated / deprecated to be removed** | Available in ≥1 browser but should not be used; or scheduled for removal. Distinct from limited. | MDN Glossary | 2026-11-16 |
| **Core browser set** | Chrome (desktop + Android), Edge (desktop), Firefox (desktop + Android), Safari (macOS + iOS). | web.dev/baseline; MDN | 2026-11-16 |

**Machine-checkable meaning used by this project** (do not paraphrase in UI):
- `newly` = every engine in the core set reports `version_added != false`; `low_date` = date of the *last* engine to ship.
- `widely` = `high_date = low_date + 30 months` ≤ today.
- `limited` = at least one core engine has no shipping implementation.

## 1.2 What Baseline explicitly does NOT cover (MDN, retrieved 2026-11-16)

Baseline "is not a substitute for accessibility, usability, performance, security, or other testing" and may not tell you about: older devices/browser releases, browsers outside the definition (**OS web views**), and **assistive technology**. Any recommendation that touches a11y, perf or security therefore needs evidence *beyond* a Baseline badge.

## 1.3 Strengths and failure modes of each citable source

| Source | Strengths | Failure modes you must handle |
|---|---|---|
| **MDN BCD** (structured) | Per-entry `version_added`/`version_removed`; encodes `partial_implementation`, `alternative_name` (prefixes), `prefix`, `notes`, `impl_url`; stable JSON paths; CC0. | *Entry granularity ≠ feature granularity* (see §1.4). `mirror` inheritance hides the real version unless the parent is read. Some entries are absent entirely (`requestIdleCallback` has no `api/window/…` file at the guessed path) — absence is not disproof. Does not itself carry Baseline dates. |
| **caniuse** | Human-readable, includes `n d #N` (disabled-by-default-flag) states and per-note explanations; good for "why does Safari report it as unsupported". | **Lags releases**; coarse version buckets (`15.2-15.3`); `y` can hide semantics changes; no partial-implementation flag granularity; usage % is global and stale. Its *notes* are often the only place a flag requirement is written down. |
| **Vendor release notes** (Chrome Platform Status / WebKit / Firefox Release Notes) | Authoritative for "shipped in version X" and for intent (origin trials, deprecations). | Prose; no stable IDs; must be pinned to a version + date; frequently amended after publication. |
| **web-platform-dx web-features / webstatus.dev** | One curated *feature* (not property) with `baseline.status`, `low_date`, `high_date`, per-engine date, plus **WPT interop score** and **usage share**. Ideal for the matrix. | **Derived data can be wrong** (worked example in §1.4). Feature ids are not guessable (`text-wrap-pretty` exists, `clamp` does not). Dates move as engines ship. |
| **Specs** (WHATWG/W3C/TC39/CSSWG) | Says what is *specified*, what is *UA-discretionary*, what is *at risk*. | Specified ≠ shipping ≠ interoperable. Never cite a spec as support evidence. |

**Rule derived from the above:** a support claim needs *one* source for the version and *a second, different-class* source for the status. Never let a dashboard be both.

## 1.4 Feature granularity — the trap that silently corrupts recommendations

Same platform string, two different official answers:

| Query | MDN BCD | web-features / webstatus | Why they differ |
|---|---|---|---|
| `color-scheme` | `css/properties/color-scheme.json`: Chrome **81**, Firefox **96**, Safari **13** | feature `color-scheme`: Chrome **98** (2022-02-01), Firefox 96, Safari 13; Baseline widely 2024-08-03 | The BCD entry is the *property*; the feature aggregates the property **plus** the `light`/`dark`/`only` value behaviour and `light dark` handling. |

A tool that stores one number per "feature name" will emit contradictory advice. **Store `(feature_key, definition_source, definition_version)`.**

Second worked example (integrity check that fired during this research): `top-level-await` via webstatus reports **Safari 27 (2026-09-14)**, while its own WPT field reports Safari score **1.0** — engines do not score 100% on a feature they do not implement. The Safari version is therefore treated as an unresolved data anomaly (`UNVERIFIED`, §5), not as fact. This is the single best argument for the conflict procedure in `citation-discipline.md` §6.

## 1.5 Support-target model (implementable presets)

Presets are defined by **observable** version floors or by the Baseline computation — never by adjectives. `today` is injected at evaluation time, never hard-coded.

| Preset id | Observable definition | Browserslist / resolver query | Use when | Mandatory caveat |
|---|---|---|---|---|
| `baseline-widely-available` | `feature.baseline.status == "widely"` at evaluation date (i.e. `low_date + 30mo ≤ today`) | `baseline widely available` | **Default.** Consumer sites, unknown analytics. | Safest *feature* set, but not a runtime-safety guarantee (§1.2). |
| `baseline-newly-available` | `status in {"newly","widely"}` | `baseline newly available` | Greenfield, modern device fleet, marketing sites. | Each feature may be <30 months old; every use needs a documented fallback. |
| `baseline-year-2024` (and any `baseline-year-YYYY`) | feature became newly available on/before 2024-12-31 | `baseline 2024` (valid 2015→current) | Regulated/enterprise refresh cadence. | Older year = larger legacy surface; check per-feature anyway. |
| `last-2-versions` | each engine's current stable **and** previous major, resolved from release notes at pin time; Safari counts `N` and `N-1` | explicit engine list, e.g. `chrome >= <n-1>, firefox >= <n-1>, safari >= <N-1>` — numbers resolved at pin time, `UNVERIFIED` in this doc | Product with fast-updating users, no iOS long tail. | Drifts every 4–6 weeks; **must** be re-resolved and re-stamped, never stored as a constant. Excludes users who lag one release, which is a large real cohort. |
| `safari-16-plus` | `safari >= 16` **and** `ios_saf >= 16` | `safari >= 16, ios_saf >= 16` | Orgs whose floor is an older iPad/macOS fleet. | A version floor is **not** a feature set; every feature still needs `version_added ≤ 16` per engine. iOS Safari ≠ macOS Safari versions. |
| `evergreen-desktop` | latest stable Chrome/Edge/Firefox + current Safari; mobile excluded | `last 1 chrome version, last 1 firefox version, last 1 safari version` | Internal dashboards/admin tools. | Excludes all mobile and all webviews — never a default for public sites. |
| `enterprise-chromium-lts` | Chromium stable minus 4 major releases (≈6 months), Edge locked to same floor | `chrome >= <n-4>, edge >= <n-4>` | Enterprise-managed desktop only. | Firefox/Safari still need floors; "Chromium-only" is a policy statement, not a target. |
| `no-js-baseline` | Page is fully usable with scripting disabled; CSS limited to `baseline-widely-available`; every JS feature is enhancement-only | `baseline widely available` + CI check with JS disabled | Content sites, SEO-critical, regulated a11y. | Cannot express "works without JS" as a browserslist query — needs a rendering test. |

### 1.5.1 Project declaration (schema the tool should read)

```jsonc
{
  "target": "baseline-widely-available",     // preset id, or "custom"
  "engines": { "chrome": ">=132", "firefox": ">=128", "safari": ">=17.4" }, // required if target=="custom"
  "noJsFloor": true,                          // renderable without JS
  "allowedRisk": "low",                      // low | medium | high — caps which traps may be recommended
  "exceptions": [                            // per-feature overrides, each MUST carry evidence
    { "feature": "popover", "allow": "newly", "fallbackRequired": true,
      "evidence": "feature-flags.md#popover", "reviewBy": "2027-05-16" }
  ],
  "evidenceBase": { "retrieved": "2026-11-16", "reviewBy": "2027-02-16" }
}
```
Resolution order: `exceptions` → `target` → hard fails (a feature absent from every engine in the declared set is never recommendable, regardless of exceptions).

### 1.5.2 Why a single `modern: true` boolean is wrong

1. **Availability is per feature, not per site.** `:has()` (widely, 2026-06-19) and `text-wrap: pretty` (limited, no Firefox) are both "modern CSS".
2. **Partial implementations defeat binaries.** Nesting is *partially* implemented in Chrome 112–119 and Safari 16.5–17.1 (nested rules starting with a type selector fail — BCD). A boolean says "supported"; users get broken layout.
3. **Failure modes differ by technology.** Unsupported CSS degrades silently; unsupported JS throws and can abort a bundle. Same "unsupported" verdict, wildly different cost.
4. **Baseline ≠ quality.** MDN states Baseline says nothing about a11y, usability, performance or security. `:has()` being widely available says nothing about invalidation cost on a 10k-node list.
5. **Targets are product decisions, not platform facts.** A B2B intranet pinned to managed Chromium and a consumer checkout must not share one flag.
6. **The core set excludes OS webviews and embedded browsers** — the environments most likely to lag in enterprise and in-app browsers.

---

# 2. Compatibility matrix

Legend: `C`/`F`/`S` = first shipping version in Chromium (desktop; Android mirrors unless noted), Firefox, WebKit/Safari (iOS mirrors unless noted). `—` = not implemented. `(derived)` = computed, not read. All rows **Retrieved 2026-11-16**.

## 2A. CSS

| Feature | Spec / doc | Chromium | Firefox | WebKit/Safari | Node | Baseline | Detection | Fallback | Risks | Retrieved | Conf |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Cascade layers `@layer` | css-cascade-5 | 99 | 97 | 15.4 | n/a | **Widely** (high 2024-09-14) | `typeof CSSLayerBlockRule !== 'undefined'` | Plain source order + specificity; no layer semantics | Layer order is file-order-dependent; a later import can silently reorder | 2026-11-16 | H |
| Nesting (`&`) | css-nesting-1 | 120 (partial 112–119) | 117 | 17.2 (partial 16.5–17.1) | n/a | **Widely** (high 2026-06-11) | `CSS.supports('selector(&)')` | Flatten selectors at build time | Partial impls **fail nested rules that start with a type selector** (BCD note) | 2026-11-16 | H |
| `:has()` | selectors-4 | 105 | 121 | 15.4 | n/a | **Widely** (high 2026-06-19) | `CSS.supports('selector(:has(*))')` | Ancestor class toggled in JS; `.js-has-x` pattern | Chrome daily usage ≈0.57 (webstatus), so "new" advice is often wrong; invalidation cost is implementation-defined — measure, never assert | 2026-11-16 | H |
| Container queries (size) | css-conditional-5 | 105 | 110 | 16 | n/a | **Widely** (high 2025-08-14) | `CSS.supports('container-type: inline-size')` | Media queries + a JS `ResizeObserver` layout shim | Container must not be size-contained in a way that changes the layout you are querying | 2026-11-16 | H |
| Container style queries | css-conditional-5 | 111 | 151 | 18 | n/a | **Newly** (2026-05-19) | No one-line form: apply a probe style-query rule and read `getComputedStyle` | Class/attribute selectors on a wrapper | Safari: **document element cannot be a container** (BCD/WebKit bug 271040). Firefox only since 151 | 2026-11-16 | H |
| `color-scheme` | css-color-adjust-1 | 81 (property) / 98 (feature) | 96 | 13 | n/a | **Widely** (2024-08-03) | `CSS.supports('color-scheme','dark')` | Author-defined dark palette via a class | Granularity trap (§1.4); does not by itself theme form controls or scrollbars consistently | 2026-11-16 | H |
| `oklch()` | css-color-4 | 111 | 113 | 15.4 | n/a | **Widely** (derived: oldest engine 15.4 = 2022-03) | `CSS.supports('color','oklch(0% 0 0)')` | `rgb()`/`hsl()` fallback declared first | Out-of-gamut colours are mapped differently per engine; do not ship colour-critical UI without a fallback | 2026-11-16 | H |
| `color()` (profiled) | css-color-4 | 111 | 113 | 15 (partial 10.1–15: only `srgb`, `display-p3`) | n/a | **Widely** (derived) | `CSS.supports('color','color(display-p3 0 0 0)')` | `rgb()` fallback | Partial-range history means "supported" hides which profiles | 2026-11-16 | H |
| `text-wrap: balance` | css-text-4 | 114 | 121 | 17.5 | n/a | **Newly** (2024-05-13) | `CSS.supports('text-wrap','balance')` | Normal wrapping; constrain width instead | UA may ignore balancing past an implementation limit — never rely on an exact line count | 2026-11-16 | H |
| `text-wrap: pretty` | css-text-4 | 117 | — | 26 | n/a | **Limited** | `CSS.supports('text-wrap','pretty')` | `balance` or nothing | **No Firefox implementation**; WPT Firefox 0 | 2026-11-16 | H |
| Logical properties | css-logical-1 | 89 | 66 | 15 | n/a | **Widely** (high 2024-03-20) | `CSS.supports('margin-inline-start','1px')` | Physical props per `dir` | `writing-mode` + logical props interact; test vertical modes | 2026-11-16 | H |
| `@starting-style` | css-transitions-2 | 117 | 129 | 17.5 | n/a | **Newly** (2024-08-06) | Proxy: `CSS.supports('transition-behavior','allow-discrete')` (heuristic) | One-frame class toggle via `requestAnimationFrame` | Only affects first style change / discrete-property transitions — not a general entry-animation API | 2026-11-16 | M |
| `view-transition-name` / View Transitions | css-view-transitions-1 | 111 | 144 | 18 | n/a | **Newly** (2025-10-14) | `'startViewTransition' in document` | Cross-fade via CSS `opacity`/`transform`; no snapshot morph | Newest engine is Firefox 144; **back/forward cache + cross-document** behaviour is where implementations diverge; Chrome Android WPT ≈0.25 vs desktop ≈0.97 | 2026-11-16 | H |
| `popover` attribute / Popover API | html.spec WHATWG popover | 116 | 125 | 17 / **iOS 18.3** | n/a | **Newly** (2025-01-27) | `'popover' in HTMLElement.prototype && typeof HTMLElement.prototype.showPopover === 'function'` | `<dialog>`+`showModal()`, or a JS overlay with manual focus trap | iOS floor is **18.3** — not 17; light-dismiss, top-layer and anchor behaviour differ from hand-rolled overlays | 2026-11-16 | H |
| Subgrid | css-grid-2 | 117 | 71 | 16 | n/a | **Widely** (2026-03-15) | `CSS.supports('grid-template-columns','subgrid')` | Nested grids with duplicated track definitions | Chrome daily usage ≈0.007 (webstatus); "modern" advice here is rarely the bottleneck | 2026-11-16 | H |
| `aspect-ratio` | css-sizing-4 | 88 | 89 | 15 | n/a | **Widely** (high 2024-03-20) | `CSS.supports('aspect-ratio','1/1')` | Padding-top percentage box | Interacts with replaced elements' intrinsic ratio (image `auto`/`attr`) | 2026-11-16 | H |
| `clamp()` | css-values-4 | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | n/a | **UNVERIFIED** (no web-features id; not in fetched set) | `CSS.supports('width','clamp(1px,2vw,3px)')` | min/max pair or media query | Do **not** cite a version until read from BCD `css/types/…` | 2026-11-16 | ✗ |
| `:focus-visible` | selectors-4 | 86 | 85 (`:-moz-focusring` from 4) | 15.4 | n/a | **Widely** (high 2024-09-14) | `CSS.supports('selector(:focus-visible)')` | `:focus` + `.no-focus-ring` class set on pointer events | Removing focus outlines without a replacement is an a11y regression, not a support issue | 2026-11-16 | H |
| `prefers-reduced-motion` | mediaqueries-5 | 74 | 63 | 10.1 | n/a | **Widely** (high 2022-07-15) | `matchMedia('(prefers-reduced-motion: reduce)')` | Assume motion is allowed only if no query support; still offer a manual toggle | This is a *preference*, not a *capability* — must never be used to skip essential UI | 2026-11-16 | H |
| `light-dark()` | css-color-5 | 123 | 120 | 17.5 | n/a | **Newly** (derived: newest engine 17.5 = 2024-05) | `CSS.supports('color','light-dark(#000,#fff)')` | Two rulesets under `color-scheme` + media query | Requires `color-scheme` to be set on the same element subtree; silent failure otherwise | 2026-11-16 | M |

## 2B. HTML

| Feature | Spec / doc | Chromium | Firefox | WebKit/Safari | Node | Baseline | Detection | Fallback | Risks | Retrieved | Conf |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `<dialog>` + `showModal()` | html.spec interactive-elements | 37 | 98 | 15.4 | n/a | **Widely** (derived: newest 15.4 = 2022-03) | `typeof HTMLDialogElement === 'function' && 'showModal' in HTMLDialogElement.prototype` | `<div role="dialog">` + focus trap + `inert` on background | `show()` vs `showModal()` differ in focus/top-layer/backdrop; `cancel`/`close` event ordering differs across engines | 2026-11-16 | H |
| `dialog[closedby]` | html.spec | 134 | 141 | 27.3 | n/a | not asserted | `'closedBy' in HTMLDialogElement.prototype` | JS `lightdismiss` handler | Very new; do not pair with a "widely available" claim | 2026-11-16 | H |
| `inert` | html.spec interaction | 102 | 112 | 15.5 | n/a | **Widely** (high 2025-10-11) | `'inert' in HTMLElement.prototype` | `aria-hidden` + `tabindex="-1"` sweep + focus trap | Widely only since 2025-10-11; `aria-hidden` alone does not stop focus | 2026-11-16 | H |
| `<details name>` (exclusive accordion) | html.spec | 120 | 130 | 17.2 | n/a | **Newly** (2024-09-03) | `'name' in HTMLDetailsElement.prototype` | JS `toggle` listener closing siblings | Behaviour of *initial* open state with duplicate names is the usual bug | 2026-11-16 | H |
| `loading="lazy"` | html.spec urls-and-fetching | 77 | 121 | 16.4 | n/a | **Widely** (high 2026-06-19) | `'loading' in HTMLImageElement.prototype` | `IntersectionObserver` loader | Firefox support only from 121; lazy-loading an LCP image delays LCP — keep hero eager | 2026-11-16 | H |
| `fetchpriority` | html.spec + fetch.spec | 103 | 132 | 17.2 | n/a | **Newly** (2024-10-29) | `'fetchPriority' in HTMLImageElement.prototype` | `<link rel=preload>` | Firefox **Android** WPT = 0 while desktop = 1 — desktop-only assumption breaks on mobile | 2026-11-16 | H |
| `<picture>`/`srcset`/`sizes` | html.spec embedded-content | 38 | 38 | 10.1 | n/a | **Widely** (high 2019-09-27) | `'srcset' in HTMLImageElement.prototype` | Single `src` with CSS `image-set()` | `sizes` miscalculation silently picks the wrong candidate — no error surfaces | 2026-11-16 | H |
| `<video>` / `<track>` captions | html.spec media | 3 | 3.5 | 3.1 | n/a | **Widely** (high 2018-01-29) for `<video>`; captions track is UA/UI-level | `'track' in HTMLMediaElement.prototype` | Burned-in captions or a custom transcript panel | Caption rendering is UA UI, not a scriptable surface; the aggregate `<video>` WPT score is ≈0.58 in Firefox and Safari vs ≈0.95 in Chromium — do not assume identical track/UI behaviour | 2026-11-16 | M |
| Declarative shadow DOM (`shadowrootmode`) | html.spec scripting | 111 | 123 | 16.4 | n/a | **Widely** (high 2026-08-20) | `'shadowRootMode' in HTMLTemplateElement.prototype` | JS `attachShadow()` + `innerHTML` | Requires server-side serialisation; streaming DSD out of order is unsupported in some parsers | 2026-11-16 | H |
| `autocomplete` token set | html.spec forms | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | n/a | **UNVERIFIED** | No reliable token-level detection; presence of the IDL attribute proves nothing | Plain `name` + `type`; server-side validation | Token *set* support varies per engine (field-name tokens vs `one-time-code` vs `webauthn`); never claim "autocomplete works" from attribute presence | 2026-11-16 | ✗ |
| `<input type=date|time|email|url|…>` | html.spec forms | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | n/a | **UNVERIFIED** | `const i=document.createElement('input'); i.type='date'; i.type==='date'` (type sanitisation test) | Text input + pattern + JS picker | Engines fall back to `type=text` silently; the detection idiom is mandatory, not optional | 2026-11-16 | ✗ |

## 2C. JS / Web APIs

| Feature | Spec / doc | Chromium | Firefox | WebKit/Safari | Node | Baseline | Detection | Fallback | Risks | Retrieved | Conf |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `fetch` | fetch.spec | 42 | 39 | 10.1 | `UNVERIFIED` | **Widely** (high 2019-09-27) | `typeof fetch === 'function'` | `XMLHttpRequest` | `AbortSignal` + streaming + `keepalive` all vary; feature is not atomic | 2026-11-16 | H |
| `AbortController` / `AbortSignal` | dom.spec | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | **UNVERIFIED** (not fetched; feature id not resolved) | `typeof AbortController === 'function'` | Manual `aborted` flag + `cancelToken`-style pattern | Do not cite a version for this row until read | 2026-11-16 | ✗ |
| `AbortSignal.timeout()` | dom.spec | 124 | 100 | 16 | `UNVERIFIED` | **Widely** (high **2026-10-18**) | `typeof AbortSignal.timeout === 'function'` | `AbortController` + `setTimeout` | Only *just* became widely available (Chrome floor is high, 124); `TimeoutError` instanceof checks differ from manual aborts | 2026-11-16 | H |
| `structuredClone()` | html.spec structured-data | 98 | 94 | 15.4 | `UNVERIFIED` (Node has a global — verify nodejs.org before SSR use) | **Widely** (high 2024-09-14) | `typeof structuredClone === 'function'` | `JSON.parse(JSON.stringify())` (**loses** `Date`, `Map`, `Set`, cycles) | The fallback is not semantically equivalent — document what is dropped | 2026-11-16 | H |
| `URL` / `URLSearchParams` | url.spec | 32 / `UNVERIFIED` | 19 / `UNVERIFIED` | 7 / `UNVERIFIED` | `UNVERIFIED` | **Widely** (high 2018-01-29) for `URL`; `URLSearchParams` **UNVERIFIED** | `typeof URL === 'function'` | String parsing (never — this is the bug source) | `URL` WPT scores are only ~0.6 in Chromium/Firefox vs 0.97 Safari: parse edge cases diverge; do not treat URL parsing as fully interoperable | 2026-11-16 | M |
| `Intl.Segmenter` | ecma402 | 87 | **125** | 14.1 | `UNVERIFIED` | **Widely** (high **2026-10-16**) | `typeof Intl.Segmenter === 'function'` | `Array.from(str)` (code points, **not** graphemes) + a grapheme splitter library | Firefox only from 125; grapheme/word boundaries follow ICU version, so cluster counts can differ per engine/OS | 2026-11-16 | H |
| `Intl.ListFormat` | ecma402 | 72 | 78 | 14.1 | `UNVERIFIED` | **Widely** (high 2023-10-26) | `typeof Intl.ListFormat === 'function'` | Hand-written joiner per locale | Locale data availability differs (`Intl.*.supportedLocalesOf`) — a supported constructor can still lack the locale | 2026-11-16 | H |
| `Intl.NumberFormat` | ecma402 | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | **UNVERIFIED** (no feature id resolved) | `typeof Intl.NumberFormat === 'function'` | Manual formatting (never for currency) | Options (`notation`, `roundingMode`, `signDisplay`) are the real differentiator, not the constructor | 2026-11-16 | ✗ |
| `IntersectionObserver` | IntersectionObserver | 58 | 55 | 12.1 | n/a | **Widely** (high 2021-09-25) | `'IntersectionObserver' in window` | Scroll/resize listener + `getBoundingClientRect` | Threshold/rootMargin rounding differs; ~58% of Chrome page loads already use it | 2026-11-16 | H |
| `ResizeObserver` | resize-observer-1 | 64 | 69 | 13.1 | n/a | **Widely** (high 2023-01-28) | `'ResizeObserver' in window` | `window.resize` + `getBoundingClientRect` | "ResizeObserver loop completed with undelivered notifications" is a real error path; guard writes | 2026-11-16 | H |
| `requestIdleCallback` | W3C requestidlecallback | 47 | 55 | **none** (experimental-flag only) | n/a | **Limited** | `'requestIdleCallback' in window` | `setTimeout(fn, 0)` chunking or `scheduler.postTask` when available | No Safari implementation at all; caniuse flags Safari `n d #2` = behind the Experimental WebKit Features flag. **~56% of Chrome page loads use it**, so it appears "safe" everywhere in telemetry | 2026-11-16 | H |
| `scheduler.postTask` (Scheduler API) | WICG scheduling-apis | 129 | 142 | **none** | n/a | **Limited** | `typeof globalThis.scheduler?.postTask === 'function'` | `MessageChannel`-based yielding; `setTimeout` | Safari WPT 0. Priority inversion if you `await` inside the callback | 2026-11-16 | H |
| `Element.moveBefore()` | dom.spec | 133 | 144 | **none** | n/a | **Limited** | `typeof Element.prototype.moveBefore === 'function'` | `insertBefore` (loses iframe/state, re-runs custom element callbacks) | No WebKit implementation (WPT 0.13); recommend only behind detection with a state-loss fallback | 2026-11-16 | H |
| `Array.prototype.at()` | ecma262 | 92 | 90 | 15.4 | `UNVERIFIED` | **Widely** (high 2024-09-14) | `typeof [].at === 'function'` | `arr[arr.length-1]` | Negative index on strings uses code units — identical trap as `[]` | 2026-11-16 | H |
| `findLast` / `findLastIndex` | ecma262 | 97 | 104 | 15.4 | `UNVERIFIED` | **Widely** (high 2025-02-23) | `typeof [].findLast === 'function'` | Reverse loop | Firefox floor 104 is the constraint, not Chrome | 2026-11-16 | H |
| Top-level await | ecma262 | 89 | 89 | **data conflict** (dashboard: 27; WPT: 1.0) | `UNVERIFIED` | **UNVERIFIED** — see §1.4 | Not runtime-detectable: requires a separate module graph / build target | Bundle to an async entry; avoid TLA in shared chunks | Build-time feature: detection idiom does not exist, so a "safe with feature detection" rule cannot apply. Bundlers also forbid TLA in CJS deps | 2026-11-16 | ✗ |
| `Intl.supportedValuesOf` | ecma402 | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | **UNVERIFIED** | `typeof Intl.supportedValuesOf === 'function'` | Hard-coded fallback lists | Never use it to decide whether a locale works — it lists calendars/timezones, not full locale data | 2026-11-16 | ✗ |
| Sanitizer API / `setHTML()` | html.spec html-sanitization | **146** | **148** | **none** | n/a | **Limited** | `typeof Element.prototype.setHTML === 'function'` | A maintained sanitiser (DOMPurify) + Trusted Types where available | Safari WPT ≈0.04; Firefox ≈0.35. **Not Baseline.** Treating it as "the safe innerHTML" is the highest-severity trap in this table | 2026-11-16 | H |
| Trusted Types | W3C trusted-types | 83 | **148** | **26** | n/a | **Newly** (2026-02-24) | `typeof window.trustedTypes !== 'undefined'` | Escape/validate at sink; CSP `require-trusted-types-for` only where enforced | Enforcement is policy-driven: in engines without TT, `require-trusted-types-for` is **ignored (fail-open)**. Newly available, not widely | 2026-11-16 | H |
| Streams (`ReadableStream`) | streams.spec | 67 | 102 | 14.1 | `UNVERIFIED` | **Widely** (high 2024-12-28) | `typeof ReadableStream === 'function'` | Buffer the whole response | Streaming SSR depends on this + `TextDecoder` + server flush behaviour; Backpressure/`TransformStream` semantics are the usual divergence | 2026-11-16 | H |

## 2D. Security headers (no client-side detection)

| Feature | Spec / doc | Chromium | Firefox | WebKit/Safari | Node | Baseline | Detection | Fallback | Risks | Retrieved | Conf |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CSP (core) | w3c webappsec-csp | 25 | 23 | 7 | n/a | **Widely** (high 2019-02-02) | Server header; verify with `Content-Security-Policy-Report-Only` | n/a — a missing header is a config error, not a browser gap | Aggregate feature. Per-directive support is **not** implied by this row | 2026-11-16 | H |
| `strict-dynamic` | CSP3 | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | n/a | **UNVERIFIED** | Not detectable client-side; use `report-only` + violation reports | Nonce-based allowlist (works with `strict-dynamic` too) | In engines ignoring it, the directive is skipped and the allowlist still applies — behaviour differs before/after adoption | 2026-11-16 | ✗ |
| `require-trusted-types-for` | CSP3 + TT | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | n/a | **UNVERIFIED** | Only meaningful where `window.trustedTypes` exists | Keep sinks escaped; ship TT progressively | **Fail-open**: browsers without TT ignore the directive, so "we set the header" ≠ "we are protected" | 2026-11-16 | ✗ |
| COOP / COEP / CORP | html.spec cross-origin-* | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | n/a | **UNVERIFIED** | `crossOriginIsolated === true` (covers COOP+COEP, not CORP) | Feature works without `SharedArrayBuffer`/high-res timers | Headers are ignored when unsupported; COEP breaks third-party embeds without CORP — a rollout hazard, not a support question | 2026-11-16 | ✗ |

**Framework-level row: dropped.** Streaming SSR / React 19-era APIs could not be cited from the framework's own docs within this pass, so per the brief they are omitted rather than inferred. The platform prerequisites (`Streams`, `fetch`) are verified above; any framework claim must be added with its own `react.dev` / `nextjs.org` citation and a `reviewBy` date.

---

# 3. Trap list — features that look safe and are not

| # | Feature | The trap | Correct guidance | Citation |
|---|---|---|---|---|
| 1 | `requestIdleCallback` | Appears everywhere (Chrome daily usage ≈0.56) because Chrome/Firefox ship it — **Safari has no implementation**, only an experimental flag. Code paths built on it simply never run on iOS. | Never recommend as "the" idle scheduler. Use `scheduler.postTask` when detected, else `setTimeout`/`MessageChannel` chunking. If used, treat the callback as optional and never put required work in it. | webstatus `requestidlecallback` (`limited`, Safari WPT 0); caniuse note `#2` "Can be enabled in Experimental (WebKit) Features" |
| 2 | Sanitizer API / `setHTML()` | Sounds like the standard answer to "safe HTML"; it is **limited** — Chrome 146, Firefox 148, **no Safari**. | Keep a maintained sanitiser (e.g. DOMPurify) as the default path; use `setHTML` only behind `typeof Element.prototype.setHTML === 'function'` and only as an *additional* layer. | webstatus `sanitizer` (`limited`; Safari WPT 0.04, Firefox 0.35) |
| 3 | `Element.moveBefore()` | Sold as "move DOM without losing state"; **no WebKit implementation** (WPT 0.13). | Gate on `typeof Element.prototype.moveBefore === 'function'`; fallback `insertBefore` **must** re-initialise iframe/media/custom-element state or the app silently loses it. | webstatus `move-before` (`limited`) |
| 4 | Popover API | Widely described as the modern replacement for menus/tooltips; only **newly available since 2025-01-27** because **iOS shipped it in 18.3**. | Do not blanket-replace existing overlays. Pair with a `<dialog>`- or JS-based fallback; verify light-dismiss and top-layer stacking per engine. | webstatus `popover` (`newly`, low 2025-01-27; Safari iOS 18.3) |
| 5 | View Transitions | Demos look universally supported (Chrome since 111, Safari 18); **Firefox only from 144 (2025-10-14)** → newly available. Navigation/back-forward semantics and mobile interop are the weak spots. | Use as progressive enhancement only: wrap in `'startViewTransition' in document`, keep the un-animated path complete, and never move required state into the transition callback. | webstatus `view-transitions` (`newly` 2025-10-14; Chrome Android WPT ≈0.25) |
| 6 | Trusted Types / `require-trusted-types-for` | Teams assume enabling the CSP directive is protection. It is **fail-open**: engines without TT ignore the directive. TT itself only became newly available **2026-02-24** (Firefox 148, Safari 26). | Defense in depth: keep escaping/sanitising at every sink. Ship TT with `report-only` first and read violations; treat Safari <26 and Firefox <148 as unprotected. | webstatus `trusted-types` (`newly` 2026-02-24) |
| 7 | `scheduler.postTask` | Promoted as the modern yielding primitive; **Safari has no implementation** (WPT 0). | Detect and fall back; never let task *ordering* correctness depend on priority hints. | webstatus `scheduler` (`limited`, Safari WPT 0) |
| 8 | `text-wrap: pretty` | Grouped with `balance` in articles, but **Firefox does not implement it at all**. | Only use where a no-op is acceptable; do not use it to fix widows as a correctness requirement. | webstatus `text-wrap-pretty` (`limited`, Firefox WPT 0) |
| 9 | `text-wrap: balance` | "Supported" hides UA discretion: engines may stop balancing past an implementation limit. | Treat as cosmetic. Never compute layout or line counts from it; verify visually at 320–1440px. | webstatus `text-wrap-balance` (`newly` 2024-05-13); CSS Text 4 |
| 10 | CSS Nesting | "Supported since Chrome 112" is wrong in practice: **112–119 and Safari 16.5–17.1 are partial** — nested rules starting with a type selector fail. | Pin the *fully* supporting versions (Chrome 120, Safari 17.2) or flatten at build time. Never infer nesting support from an engine's major-version marketing. | BCD `css/selectors/nesting.json` (`partial_implementation: true`, Chrome 112–119, Safari 16.5–17.1) |
| 11 | Container **style** queries | Newly available only since **2026-05-19** (Firefox 151); Safari cannot use the document element as a container. | Prefer size queries; for style queries, gate on a computed-style probe and keep a class-based fallback. | webstatus `container-style-queries`; BCD `css/at-rules/container.json` (WebKit bug 271040 note) |
| 12 | `:has()` performance folklore | Two wrong directions: "avoid `:has()`, it's slow" (it is widely available; Chrome daily usage ≈0.57) and "`:has()` is free" (invalidation cost is implementation-defined). | Measure on the real DOM with a trace; keep `:has()` selectors shallow and avoid them on hot, deeply-mutating lists. Neither claim should be emitted without a measurement. | webstatus `has` (`widely`, usage ≈0.57) |
| 13 | `color-scheme` version confusion | BCD says Chrome 81; the *feature* says Chrome 98. A tool quoting one number will contradict the other. | Record which definition you used; recommend `color-scheme: light dark` only with tested control/scrollbar theming. | BCD `css/properties/color-scheme.json` vs webstatus `color-scheme` |
| 14 | `fetchpriority` | Desktop Firefox 132 support reads as "supported", but **Firefox Android WPT is 0**. | Treat as a hint, not a contract; keep the LCP path fast without it. | webstatus `fetch-priority` (Firefox Android WPT 0) |
| 15 | Top-level await | Widely cited as safe since 2021; the dashboard says Safari 27 while its own WPT field says Safari 1.0 — a contradiction, and TLA cannot be feature-detected at runtime anyway. | Never auto-migrate a bundle to TLA. Require an explicit build-target change + async entry graph, and resolve the version conflict before citing it. | webstatus `top-level-await` (conflict); §1.4 |
| 16 | `AbortSignal.timeout()` | Reads as "old news"; only became **widely available 2026-10-18** because Chrome's floor is 124. | Keep the `AbortController` + `setTimeout` fallback when the project's floor predates Chrome 124. | webstatus `abortsignal-timeout` (`widely`, high 2026-10-18) |
| 17 | `details name` exclusive accordions | Neat one-liner; newly available 2024-09-03, and initial `open` state on duplicate names is where implementations disagree. | Ship JS sibling-closing fallback if the target includes Safari <17.2 / Firefox <130. | webstatus `details-name` (`newly`) |
| 18 | `inert` | Everyone "knows" it is ancient; **widely available only since 2025-10-11**. | Do not rely on it alone for focus containment on older iOS; pair with a focus trap. | webstatus `inert` (`widely`, high 2025-10-11) |

---

# 4. UNVERIFIED / open items (blocking for any recommendation that needs them)

| Item | Why unresolved | What would close it |
|---|---|---|
| `clamp()` versions + Baseline | No web-features id matched; BCD path not fetched | BCD `css/types/…` entry read |
| `autocomplete` token set, `<input type=…>` | No feature id; per-token support is not modelled by any single source | BCD `html/elements/input.json` + per-token entries |
| `AbortController`, `URLSearchParams`, `Intl.NumberFormat`, `Intl.supportedValuesOf` | Feature ids not resolved in this pass | BCD read per entry |
| CSP `strict-dynamic`, `require-trusted-types-for`, COOP/COEP/CORP | Header-level, per-directive BCD paths not fetched | BCD `http/headers/…` + vendor release notes |
| Top-level await Safari version | Dashboard/WPT self-contradiction | WebKit release notes for the claimed version |
| All **Node.js** version cells | No nodejs.org / Node changelog read in this pass | Node docs per API before any SSR recommendation |
| Streaming SSR / React 19 APIs | Framework docs not cited | `react.dev` + framework release notes |

# 5. Exact source URLs read (all retrieved 2026-11-16)

- Policy: `https://web.dev/baseline` · `https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility` · `https://web.dev/articles/use-baseline-with-browserslist`
- BCD JSON read: `css/selectors/has.json` · `css/selectors/nesting.json` · `css/selectors/focus-visible.json` · `css/at-rules/layer.json` · `css/at-rules/container.json` · `css/at-rules/starting-style.json` · `css/properties/color-scheme.json` · `css/properties/view-transition-name.json` · `css/properties/text-wrap.json` · `css/properties/aspect-ratio.json` · `css/types/color.json` · `html/elements/dialog.json` (base `https://raw.githubusercontent.com/mdn/browser-compat-data/main/`)
- webstatus features read (25): `has, cascade-layers, nesting, container-queries, container-style-queries, subgrid, prefers-reduced-motion, logical-properties, text-wrap-balance, text-wrap-pretty, starting-style, view-transitions, color-scheme, aspect-ratio, focus-visible, popover, inert, details-name, loading-lazy, fetch-priority, declarative-shadow-dom, requestidlecallback, scheduler, move-before, array-at, array-findlast, structured-clone, intl-segmenter, intl-list-format, url, fetch, streams, abortsignal-timeout, sanitizer, trusted-types, top-level-await, csp, srcset, video` (base `https://api.webstatus.dev/v1/features/`)
- caniuse: `https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/requestidlecallback.json`
- Curated feature list definition: `https://github.com/web-platform-dx/web-features`
