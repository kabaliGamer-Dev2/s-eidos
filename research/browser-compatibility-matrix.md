# Browser compatibility matrix — support-target presets and gate rows

**Purpose:** resolve a project's declared support target **without network access**, and carry the compatibility rows that the shipped rules' `Support gate` cells actually reference. **Retrieved:** 2026-11-16 (Asia/Calcutta).

Scope note: this file is not a general compatibility database. It contains (a) the offline preset resolver, (b) the five platform rows consumed by shipped rules, and (c) the validation method. The full matrix in the specialist input stays its own artifact; framework-version gates live in `framework-guidance.md` §1, not here. Version numbers below are read from the two structured sources registered in `source-register.md` §1 (`api.webstatus.dev/v1/features/` and the MDN browser-compat-data JSON base), whose `Notes` enumerate every feature id and file path consulted; Baseline status is a `web-features` fact, never a self-confirmation by the same dashboard.

## 1. Presets — resolvable offline, mirroring Browserslist semantics

Presets are defined by **observable version floors** or by the Baseline computation — never by adjectives. `today` is injected at evaluation time, never stored.

| Preset id | Observable definition | Browserslist / resolver query | Use when | Mandatory caveat |
|---|---|---|---|---|
| `baseline-widely-available` | `feature.baseline.status == "widely"` (i.e. `low_date + 30 mo ≤ today`) | `baseline widely available` | **Default.** Consumer sites, unknown analytics | Safest feature set, but not a runtime-safety guarantee (Baseline excludes a11y/perf/security) |
| `baseline-newly-available` | `status ∈ {newly, widely}` | `baseline newly available` | Greenfield, modern device fleet | Every use may be <30 months old; each needs a documented fallback |
| `baseline-year-YYYY` | feature became newly available on/before YYYY-12-31 | `baseline 2024` (valid 2015→current) | Regulated/enterprise refresh cadence | Older year ⇒ larger legacy surface; still check per feature |
| `last-2-versions` | each engine's current stable **and** previous major, resolved at pin time | explicit engine list, e.g. `chrome >= <n-1>, firefox >= <n-1>, safari >= <N-1>` — numbers resolved at pin time and **`UNVERIFIED`** in this document | Fast-updating users, no iOS long tail | Drifts every 4–6 weeks; must be re-resolved and re-stamped, never stored as a constant. Excludes users one release behind — a large real cohort |
| `safari-16-plus` | `safari >= 16` **and** `ios_saf >= 16` | `safari >= 16, ios_saf >= 16` | Orgs floored on older iPad/macOS fleets | A version floor is **not** a feature set; iOS Safari ≠ macOS Safari versions |
| `evergreen-desktop` | latest stable Chrome/Edge/Firefox + current Safari, mobile excluded | `last 1 chrome version, last 1 firefox version, last 1 safari version` | Internal dashboards/admin tools | Excludes all mobile and webviews; never a default for public sites |
| `enterprise-chromium-lts` | Chromium stable − 4 majors (≈6 months), Edge locked to the same floor | `chrome >= <n-4>, edge >= <n-4>` | Enterprise-managed desktop only | Firefox/Safari still need floors; "Chromium-only" is a policy statement, not a target |
| `no-js-baseline` | page fully usable with scripting disabled; CSS limited to `baseline-widely-available`; JS is enhancement only | `baseline widely available` + a CI render test with JS disabled | Content sites, SEO-critical, regulated a11y | "Works without JS" cannot be expressed as a Browserslist query — needs a rendering test |

**Project declaration the analyzer reads** (no network, no evaluation of repository code):

```jsonc
{ "target": "baseline-widely-available",
  "engines": { "chrome": ">=132", "firefox": ">=128", "safari": ">=17.4" },  // required only when target == "custom"
  "noJsFloor": true, "allowedRisk": "low",
  "exceptions": [ { "feature": "popover", "allow": "newly", "fallbackRequired": true,
                    "evidence": "current-web-practices.md#4-3", "reviewBy": "2027-05-16" } ],
  "evidenceBase": { "retrieved": "2026-11-16", "reviewBy": "2027-02-16" } }
```

Resolution order: `exceptions` → `target` → hard fails (a feature absent from every engine in the declared set is never recommendable, regardless of exceptions).

**Why not a single `modern: true` boolean:** availability is per feature; partial implementations defeat binaries; CSS degrades silently while JS throws; Baseline ≠ quality; targets are product decisions; the core set excludes OS webviews.

## 2. Gate rows referenced by shipped rules

Five rows are needed by the catalog: `aspect-ratio` and `loading` gate `IMG-002`/`IMG-003`, `:focus-visible` gates the remedy text of `CSS-001`, and `inert`/`fetchpriority` are **remediation-only** rows — no finding depends on them, but `ARI-001` and `IMG-003` name them in their remediation and therefore may not recommend them outside the preset where they are available.

Legend: `C`/`F`/`S` = first shipping version in Chromium (desktop; Android mirrors unless noted), Firefox, WebKit/Safari (iOS mirrors unless noted). All rows **Retrieved 2026-11-16**. Confidence `H` = read directly from a primary source; `M` = derived from two read facts.

| Feature (definition) | C | F | S | Baseline | Gate semantics in the catalog | Detection idiom | Fallback when the gate fails | Conf |
|---|---|---|---|---|---|---|---|---|
| `aspect-ratio` — CSS property (`css/properties/aspect-ratio.json`) | 88 | 89 | 15 | **Widely** (high 2024-03-20) | `IMG-002` may name `aspect-ratio` as the remedy only when the preset resolves it newly/widely | `CSS.supports('aspect-ratio','1/1')` | padding-top percentage box (changes layout maths); otherwise report only | H |
| `loading="lazy"` — `img` attribute (`html/elements/img.json`) | 77 | 121 | 16.4 | **Widely** (high 2026-06-19) | `IMG-003` is emitted only when the preset resolves lazy loading newly/widely; below that the attribute is inert and the finding is suppressed | `'loading' in HTMLImageElement.prototype` | `IntersectionObserver` loader; hero stays eager regardless | H |
| `:focus-visible` — selector (`css/selectors/focus-visible.json`) | 86 | 85 | 15.4 | **Widely** (high 2024-09-14) | `CSS-001` may recommend a `:focus-visible` replacement only when the preset resolves it newly/widely; otherwise the message must fall back to `:focus` | `CSS.supports('selector(:focus-visible)')` | `:focus` + a pointer-set class; removing an outline without any replacement is an a11y regression, never the remedy | H |
| `inert` — HTML attribute (`html/elements/…`, interaction) | 102 | 112 | 15.5 | **Widely** (high 2025-10-11) | `ARI-001` remediation may name `inert` **only** when the preset resolves it newly/widely; older iOS gets `hidden`/`display:none` + a focus trap | `'inert' in HTMLElement.prototype` | `aria-hidden` + `tabindex="-1"` sweep + focus trap; `aria-hidden` alone does **not** stop focus | H |
| `fetchpriority` — `img` attribute (html + fetch) | 103 | 132 | 17.2 | **Newly** (2024-10-29) | `IMG-003` remediation may mention it as a hint only where the preset resolves it newly/widely | `'fetchPriority' in HTMLImageElement.prototype` | `<link rel=preload>`; never make LCP speed depend on it | H |

**Preserved qualifiers:** `:focus-visible` has a prefixed Firefox history (`:-moz-focusring` from 4) — the historical prefix is not a support claim for the unprefixed selector. `fetchpriority` has **Firefox Android WPT = 0** while desktop = 1, so a desktop-only assumption breaks on mobile (see `current-web-practices.md` trap 11). `inert` was only widely available from 2025-10-11: QSB §1.4.2's "check target" instruction is preserved here as the gate, not discarded.

**Framework-level gates are not rows here.** React/Next/TypeScript version gates are resolved from installed package metadata and documented in `framework-guidance.md` §1 and §3.1; no platform row is allowed to stand in for a framework version.

## 3. Validation method (what runs, in order)

| Step | Check | Failure action |
|---|---|---|
| 1 | Every row carries `retrieved` and `reviewBy`; TTL by volatility class (shipping 30 d ⇒ **2026-12-16**, policy/spec 180 d ⇒ **2027-05-15**, derived inherits shortest input) | row is `stale`; excluded from ranking, not merely footnoted |
| 2 | Version read from a Tier-A structured source (BCD JSON / webstatus per-engine `version_added`); status from a **different** class (`web-features`/prose) | claim rejected, marked `UNVERIFIED` |
| 3 | `widely` recomputed as `low_date + 30 months ≤ today` at read time | never store or hand-write the badge string |
| 4 | `partial_implementation`, `prefixed`, `flag_required`, `version_removed` preserved verbatim; ranges never collapsed | bare "yes" is a data-loss bug |
| 5 | Presets resolved with **pinned tables + injected `today`**; no fetch, no repository-code evaluation | unresolved preset ⇒ rule suppressed, never guessed |
| 6 | `last-2-versions`/`enterprise-chromium-lts` engine numbers re-resolved and re-stamped at pin time | stale constant = blocked recommendation |
| 7 | Field-level diff on structured sources (`CHANGED` ⇒ confidence downgraded one step; `DEAD` ⇒ record blocked); `UNREACHABLE` is not evidence change | a blocked row is never replaced by a model-memory best guess |
| 8 | CI invariants: `widely ⇒ low_date != null`; `partial_implementation` non-empty ⇒ `confidence ≤ M` and `fallback != null`; `flag_required` ⇒ rendered text contains "flag"; `detection.runnable == false` ⇒ no recommendation | build fails |
| 9 | Prohibited strings in any support field: "modern browsers", "evergreen", "everywhere", "all browsers", bare "since <year>", "~N %" without provenance | build fails |

## 4. `UNVERIFIED` items (preserved from the input; none silently dropped)

| Item | Why unresolved | What closes it |
|---|---|---|
| `clamp()` versions + Baseline | no web-features id matched; BCD type entry not fetched | read `css/types/…` |
| `autocomplete` token set; `<input type=…>` support | no feature id models per-token support | BCD `html/elements/input.json` + per-token entries |
| `AbortController`, `URLSearchParams`, `Intl.NumberFormat`, `Intl.supportedValuesOf` | feature ids not resolved | BCD read per entry |
| CSP `strict-dynamic`, `require-trusted-types-for`, COOP/COEP/CORP | header-level BCD paths not fetched | BCD `http/headers/…` + vendor release notes |
| Top-level await Safari version | dashboard reports 27 while its own WPT field reports 1.0 | WebKit release notes for the claimed version |
| All **Node.js** version cells | no nodejs.org / changelog read in the platform pass | Node docs per API before any SSR recommendation |
| Streaming SSR / React 19 APIs | framework docs not cited in the platform pass | react.dev + Next release notes (now covered in `framework-guidance.md`) |
| `last-2-versions` and `enterprise-chromium-lts` engine numbers | resolved at pin time by definition | pin-time resolution + re-stamp |
| `credentialless` COEP support | not read | MDN COEP + caniuse |
| Soft-navigation CrUX graduation date | experimental, announced 2026-10 | re-check before any release note mentions it |
| Directives ignored in a `<meta>`-delivered CSP | CSP3 §3.3 not read | CSP3 read |
| `<video>`/`<track>` caption UI behaviour | WPT ≈0.58 Firefox/Safari vs ≈0.95 Chromium | UA-level testing; caption rendering is not scriptable |

**Resolved-here markers:** QSB's `inert` and `popover` items were `UNVERIFIED` in that input; this file and `current-web-practices.md` now carry dated webstatus rows for both. The QSB caveat text is preserved as a gate (`ARI-001` remediation) and as a trap (`current-web-practices.md` #3), not discarded. `color-scheme` is **not** `UNVERIFIED`: it is a granularity conflict (BCD property Chrome 81 vs feature Chrome 98) resolved by storing the definition source.
