# Quality, accessibility, performance, security and remediation baseline

- **Owner:** `quality-security-auditor` (specialist agent)
- **Retrieved:** 2026-11-16 (Asia/Calcutta) — every URL below was opened on this date unless its row in §10 says `CITED`.
- **Status:** standards definition, pre-implementation. No code written, nothing installed or published.
- **Purpose:** the requirements the detector/codemod must satisfy before any rule ships. Written so a maintainer can implement *and test* each item.

## 0. How to read this document

Every claim carries one of three labels.

| Label | Meaning |
|---|---|
| **FACT** | Stated by a primary source cited inline. Quoted or closely paraphrased. |
| **REC** | Recommendation of this document. Traceable to a FACT, but the *policy* is ours. |
| **UNVERIFIED** | Plausible, useful, and **not** confirmed against a primary source this session. Must be resolved before it becomes a shipped rule. |

Rule and requirement identifiers are stable (`A11Y-…`, `PERF-…`, `SEC-…`, `PRIV-…`, `CODEMOD-…`, `TM-…`, `TEST-…`, `SUP-…`). Cite them in issues, tests, and rule manifests.

**Two governing decisions, made here because everything else depends on them:**

1. **The tool is a source analyzer, not a browser.** It reads files. It never executes repository code, never boots a dev server, never measures a metric. Any rule requiring layout, style resolution, script execution, or user interaction is out of scope and must be reported as *out of scope*, not approximated. (§2.2, §1.3c)
2. **No rule may assert conformance.** Reports say "potential barrier, SC 1.4.3, needs human confirmation". They never say "WCAG failure" or "this page passes". A static tool cannot establish conformance — see §1.2.

---

## 1. Accessibility review standard

### 1.1 Conformance targets to cite

| Target | Version / status | Use in this project | URL |
|---|---|---|---|
| **WCAG 2.2** | W3C **Recommendation, 12 December 2024** | The normative conformance target. Cite SC numbers and levels from this document. | https://www.w3.org/TR/WCAG22/ |
| Understanding WCAG 2.2 | WAI informative explanations, continuously updated (2.5.8 page footer: "Updated 02 November 2026") | Where to get the *exceptions* and *intent* text a rule must respect. Informative, not normative. | https://www.w3.org/WAI/WCAG22/Understanding/ |
| **WAI-ARIA 1.2** | W3C Recommendation | Normative for role/state/property semantics. | https://www.w3.org/TR/wai-aria-1.2/ |
| **ARIA Authoring Practices Guide (APG)** | WAI guidance | **Pattern reference, not a conformance requirement.** A page can conform to WCAG while diverging from APG, and vice-versa. Rules must cite APG as "recommended pattern", never as a failure. | https://www.w3.org/WAI/ARIA/apg/ |

**FACT:** WCAG 2.2 removed **4.1.1 Parsing** ("WCAG 2.2 has removed one success criterion, 4.1.1 Parsing") and is backwards compatible with 2.0/2.1. The AG WG "recommends that sites adopt WCAG 2.2 as their new conformance target" — [WCAG 2.2, *Comparison with WCAG 2.1*](https://www.w3.org/TR/WCAG22/#comparison-with-wcag-2-1).

**FACT — new success criteria in 2.2 and their levels** (same source):

| SC | Name | Level |
|---|---|---|
| 2.4.11 | Focus Not Obscured (Minimum) | AA |
| 2.4.12 | Focus Not Obscured (Enhanced) | AAA |
| 2.4.13 | Focus Appearance | AAA |
| 2.5.7 | Dragging Movements | AA |
| 2.5.8 | Target Size (Minimum) | AA |
| 3.2.6 | Consistent Help | A |
| 3.3.7 | Redundant Entry | A |
| 3.3.8 | Accessible Authentication (Minimum) | AA |
| 3.3.9 | Accessible Authentication (Enhanced) | AAA |

**REC — default target.** The tool reports against **WCAG 2.2 level AA**. AAA-only criteria (2.3.3 Animation from Interactions, 1.4.6, 2.4.13, 2.5.5, 3.3.9) may be surfaced but **must be labelled "AAA — advisory"** and must never contribute to a "blocking" count. Mis-labelling a AAA criterion as AA failure is the single most common credibility loss for tools in this category.

### 1.2 What automation can and cannot detect — be blunt

**FACT:** "All automated tools, including WAVE, have limitations—not all conformance failures can be automatically detected. *Absence of detected errors does not indicate that a page is accessible or conformant.*" — [WebAIM Million 2026, Methodology](https://webaim.org/projects/million/#method).

**FACT:** In the same study, **95.9% of one million home pages had automatically detectable WCAG 2 A/AA failures**; WebAIM states that because *only* automatically detectable failures were counted, "the rate of full WCAG 2 A/AA conformance was certainly lower than 4.1%" ([§WCAG Conformance](https://webaim.org/projects/million/#wcag)). Two conclusions follow, and they point in opposite directions:

- Automated detection is **not** sufficient — it misses the majority of failures and cannot certify anything.
- Automated detection is **not** useless — six issue types account for **96% of all detected errors**, and `low contrast 83.9%`, `missing alt 53.1%`, `missing form labels 51%`, `empty links 46.3%`, `empty buttons 30.6%`, `missing lang 13.5%` have been the top six "for the last 7 years" ([§Detected Errors](https://webaim.org/projects/million/#errors)).

**REC — the honest capability statement** the tool must print in `--help` and in every report header:

> This tool detects a subset of WCAG 2.2 barriers that are visible in source. It cannot verify conformance, cannot evaluate rendered contrast, focus order, or assistive-technology behaviour, and a clean report does not mean the interface is accessible. Conformance requires manual testing against WCAG 2.2 by a qualified evaluator.

**FACT — why the ceiling is structural, not an implementation gap.** WCAG success criteria are "written as testable statements that are not technology-specific" and "designed to apply broadly ... and to be testable with a combination of automated testing **and human evaluation**" ([WCAG 2.2 Abstract](https://www.w3.org/TR/WCAG22/#abstract)). Criteria such as 1.3.2 Meaningful Sequence, 2.4.3 Focus Order, 3.3.3 Error Suggestion, and 1.1.1 for non-decorative images depend on author intent and rendered state; no static analysis of a template can recover intent.

**REC — make the residual manual work explicit.** Each report ends with a fixed "not checked here" list naming the criteria the tool will never cover (at minimum 1.1.1 semantics, 1.2.x media, 1.3.2, 1.3.3, 1.4.1, 1.4.4, 1.4.10, 2.1.1 keyboard operability of custom widgets, 2.1.2 traps, 2.4.3, 2.4.11, 2.5.7, 3.2.1, 3.2.2, 3.3.1–3.3.4, 3.3.8, 4.1.3 announcements). Users must not infer coverage from silence.

**UNVERIFIED — numeric precision.** Deque publishes an "automated accessibility coverage" study commonly summarised as "automation catches ~57% of issues". The pages at `deque.com` load their content via client-side JS and returned no body text to this session's fetcher, so **the 57% figure is not verified here and must not be quoted**. Use the WebAIM framing (qualitative limitation + top-six concentration) instead; it is directly quotable.

### 1.3 The checklist a static analyzer may legitimately implement

Three buckets. A rule's bucket is **not** a property of the rule alone; it also depends on what the file makes visible (§1.3.4).

#### (a) Reliably detectable from source — may be `default: true`

"Reliable" here means: given a well-formed parse of the file, the signal is present or absent with no cross-file or runtime information needed, and the remedy is unambiguous. It does **not** mean "is a WCAG failure".

| ID | Signal | Criterion | Why reliable |
|---|---|---|---|
| A11Y-101 | `<html>` element (or framework document shell) with no `lang` attribute | 3.1.1 (A) | Presence check on the root element |
| A11Y-102 | `<img>` with no `alt` attribute at all (distinct from `alt=""`) | 1.1.1 (A) | Attribute presence; `alt=""` is a *valid* decorative signal and must never be flagged |
| A11Y-103 | `<input type="image">` without `alt` | 1.1.1 (A) | As above |
| A11Y-104 | `<iframe>` / `<frame>` without `title` | 4.1.2 (A) | Attribute presence |
| A11Y-105 | Duplicate `id` values within one document/component file | 4.1.1 removed in 2.2 — **report as "breaks `for`/`aria-labelledby` targets", not as a WCAG failure** | Exact string comparison |
| A11Y-106 | `<label for="x">` where no element in the same file has `id="x"` **and** the file contains the whole form | 1.3.1 / 3.3.2 (A) | Same-file resolution only; must bail out if the form is componentised |
| A11Y-107 | Positive `tabindex` (`tabindex="1"`+) | 2.4.3 (A) — *only* as "advisory: positive tabindex overrides DOM order" | Integer parse; the WCAG failure still depends on order |
| A11Y-108 | `<a>` with `href` absent **and** used as an action (has `onclick`) | 4.1.2 (A) | Structural; remedy is "use `<button>`" |
| A11Y-109 | `role="presentation"`/`none` on a focusable element | 1.3.1 / 4.1.2 | Contradiction detectable in the same element |
| A11Y-110 | `aria-hidden="true"` on an element that is also focusable (`tabindex`, `href`, form control) | 4.1.2 (A) | Contradiction detectable in the same element |
| A11Y-111 | `<marquee>`, `<blink>` | 2.2.2 (A) | Deprecated elements; unambiguous |
| A11Y-112 | `autoplay` on `<video>`/`<audio>` without `muted`, or without `controls` | 1.4.2 (A) | Attribute combination |

#### (b) Detectable with heuristics — `default: false`, opt-in, confidence-tagged

Each of these ships with a written statement of the assumption it makes, and reports `confidence: low|medium` plus "verify manually".

| ID | Signal | Criterion | The assumption that can be wrong |
|---|---|---|---|
| A11Y-201 | `outline: none` / `outline: 0` on `:focus`/`:focus-visible` with no alternative indicator in the same rule block | 2.4.7 (AA) | Focus may be indicated by `box-shadow`, `border`, background change, or a parent rule |
| A11Y-202 | `role="dialog"` without `aria-modal`, `aria-labelledby`, or a native `<dialog>` | 4.1.2 / APG | Name may be supplied by a wrapper, or by an `aria-label` set at runtime |
| A11Y-203 | `<div role="button">` with no `tabindex` and no `keydown`/`keyup` handler in the same component | 2.1.1 (A) | Handler may be attached by a parent via event delegation, or by a directive/HOC |
| A11Y-204 | Interactive element whose only content is an `<svg>`/`<i>` with no `aria-label`, `title`, or text child | 4.1.2 (A) | The icon component may render a text node; the accessible name may come from `aria-labelledby` elsewhere |
| A11Y-205 | Animation/transition (CSS `animation`, `transition` > 200 ms, or JS `scrollIntoView({behavior:'smooth'})`) with no `@media (prefers-reduced-motion: reduce)` in the same stylesheet | **2.3.3 is AAA** | Not an AA failure. Also: the query may live in another stylesheet or a design-token layer |
| A11Y-206 | `aria-live` region wrapped around content whose text comes from a template expression | 4.1.3 (AA) | Correct announcement depends on insert vs. update, and on `aria-atomic`/`aria-relevant` |
| A11Y-207 | `<table>` used for layout (no `<th>`, no `caption`, contains nested blocks) | 1.3.1 (A) | Genuinely ambiguous; must be low-confidence only |
| A11Y-208 | Heading level jump (`h2` → `h4`) within one file | 1.3.1 / 2.4.6 | Levels may be normalised by a layout wrapper; in component code the surrounding levels are unknown |
| A11Y-209 | Fixed `px` width/height on a control below 24×24 | 2.5.8 (AA) | Padding, `min-height`, transforms, and the 5 official exceptions (spacing, equivalent, inline, UA control, essential) all change the answer |
| A11Y-210 | `tabindex="0"` on a static container with no role | 4.1.2 / 2.4.3 | Scroll containers legitimately take focus; a role may be applied by a directive |
| A11Y-211 | `<a href="#">` or `href="javascript:void(0)"` | 4.1.2 (A) + SEC-302 | May be a deliberate placeholder in docs/demos |
| A11Y-212 | Form error text rendered in a `role="alert"` sibling but no `aria-describedby` link from the input | 3.3.1 (A) | Live announcement may make the link unnecessary; the description may be wired by a form library |

#### (c) Must **not** be automated — false-positive factories

Do not implement these, even as "low confidence". They require human judgement, rendered state, or assistive-technology observation. If a maintainer insists, the answer is no with this table as the reason.

| Tempting rule | Why it must not ship |
|---|---|
| "Contrast ratio of `color` vs `background-color` is < 4.5:1" | WCAG's definition is the ratio of *relative luminance* of the text colour against **the background actually painted behind it**. Static CSS cannot resolve the cascade, CSS custom properties set at runtime or by media query, `currentColor`, `inherit`, `opacity`, compositing, `background-image`, gradients, `mix-blend-mode`, or the style of ancestors. See §1.4.7. |
| "Image has `alt` text, therefore 1.1.1 passes" / "alt text looks too short" | Judging equivalence of a text alternative to an image is an editorial act; automated length heuristics punish correct `alt=""` and correct short alternatives |
| "Focus order is wrong" | Requires a rendered layout and a tab walk |
| "Heading structure is correct" | Page-level judgement across components and layout slots |
| "This custom widget is keyboard operable" | Requires execution |
| "`aria-label` is present, so 4.1.2 passes" | An accessible name is necessary, not sufficient; role/state/value must also be right |
| "Reading order is wrong because DOM order differs from visual order" | Visual order requires layout |
| "Text is too long / reading level too high" (3.1.5) | Content judgement |
| "Element is invisible" | Visibility is computed style + paint |
| "This animated GIF flashes" (2.3.1) | Requires frame analysis; out of scope by design |
| "Target is 23×23 so 2.5.8 fails" | Ignores all five normative exceptions; see §1.4.8 |

#### Reliability depends on file kind — the core idea

The same pattern is tier (a) in one file and tier (c) in another. Encode this, do not hand-wave it.

| File kind | Example | Effect |
|---|---|---|
| **Literal markup** | `.html`, `.astro` static block, server template with literal children | Attribute/content facts are visible → tier (a) allowed |
| **Component with opaque children** | JSX/TSX, Vue SFC, Svelte | A child component *may* render a name, a text node, or focusable content → demote to tier (b) unless the file itself proves otherwise |
| **Non-renderable** | test files, stories, docs, fixtures, generated code | Never run a11y rules (they measure the wrong artefact) |

**REC (`A11Y-001`).** A rule manifest must declare `reliability: a|b|c` *and* the `fileKinds` it applies to. The engine must refuse to emit a tier-(a) finding for a file kind the rule does not list. This single constraint removes the majority of predictable false positives from component-based repositories.

### 1.4 Area-by-area requirements

**1.4.1 Keyboard and focus.** Static analysis may check contradictions (`A11Y-109`, `A11Y-110`, positive `tabindex`, `role="button"` without keyboard affordance). It may **not** assert that a widget is operable, that focus is visible, or that focus is not obscured (2.4.11 is AA and is *entirely* a rendered-state question — a sticky header covering a focused control). Codemod: **focus management is tier (c)**. Adding `tabindex`, moving focus, or inserting a focus trap changes behaviour and must never be auto-applied (§5.3).

**1.4.2 Dialogs.** Prefer the native `<dialog>` element with `showModal()` over hand-rolled `role="dialog"`, because focus containment, `Escape`, and inertness of the background come from the platform. Advisory rule (`A11Y-202`) may flag `role="dialog"` with no name source. Do not flag a missing `aria-modal` on a native `<dialog>` opened with `showModal()` — the platform already makes the rest inert. **UNVERIFIED:** the exact APG dialog focus-return requirements are pattern guidance; do not encode them as failures.

**1.4.3 Popovers.** The `popover` attribute and `popovertarget` give light-dismiss and top-layer behaviour without JS, and are the recommended remedy when a rule detects a hand-rolled dropdown. **UNVERIFIED — browser baseline:** confirm Baseline status of `popover`/`popovertarget` (MDN) before recommending it unconditionally; a recommendation must state the minimum browser set.

**1.4.4 Live regions.** Only tier (b). Emit at most: "status text is rendered into a container that is not a live region and receives no focus — confirm it is announced (4.1.3)". Never suggest a specific `aria-live` value as a codemod: `polite` vs `assertive` vs `role="status"` vs `role="alert"`, plus `aria-atomic`/`aria-relevant`, is a judgement about urgency and update granularity.

**1.4.5 Reduced motion.** Coverage is **AAA (2.3.3)** — label accordingly. Detection is stylesheet-local (see `A11Y-205`). Never inject a reduced-motion media query as a codemod: blanket-disabling transitions breaks expected affordances and can hide state changes.

**1.4.6 Form labelling and errors.**
- Tier (a): `alt`-style presence facts — an `<input>` with no `id`, no `aria-label`, no `aria-labelledby`, and no wrapping `<label>`, *in a file that contains the whole form*.
- Tier (b): error-to-field association (`aria-describedby`), `aria-invalid` presence, `role="alert"` on error containers.
- Tier (c): whether the error *message* is helpful (3.3.3), whether submission is reversible (3.3.4), whether re-entry is avoided (3.3.7 — needs flow state), whether authentication blocks paste/password managers (3.3.8 — needs runtime).
- **REC:** never auto-insert `aria-required`/`required` from a `*` in a label; the visual convention is not a reliable specification of the constraint.

**1.4.7 Contrast — why static contrast checks are unreliable.** This is the most requested rule and the most damaging to get wrong. WCAG defines contrast via `(L1 + 0.05) / (L2 + 0.05)` on **relative luminance** of the text and of the background *as presented* ([WCAG 2.2 §1.4.3 and glossary "contrast ratio"](https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio)). A source-level checker cannot establish "as presented" because the answer depends on:

1. **Cascade and specificity** — the winning declaration may come from a framework layer, `@layer`, `!important`, or a component library file the rule never read.
2. **Custom properties** — `color: var(--fg)` where `--fg` is defined per theme, per component, or **set by JavaScript at runtime**; `var()` fallback chains.
3. **Inheritance** — `color` inherits; a text node's colour may be declared three ancestors up, or be `currentColor`.
4. **Compositing** — `opacity` on the element or an ancestor blends text and background together; `mix-blend-mode`, `backdrop-filter`, `filter: brightness()` change the effective pair.
5. **Background provenance** — transparent background over an ancestor background, an image, a gradient, a video, or a `background-attachment: fixed` layer.
6. **State and media** — `:hover`/`:focus`/`:disabled` (disabled is exempt), `prefers-color-scheme: dark`, `forced-colors`, print.
7. **Non-text cases** — 1.4.11 Non-text Contrast (3:1) covers control boundaries and meaningful graphics; the "boundary" may be a border, an icon, or a shadow.

**REC (`A11Y-301`).** Do not ship any contrast ratio computation. Ship instead: (i) a *style-usage* rule that reports hard-coded hex colours used for text in JSX/CSS (a design-token hygiene finding, not an a11y finding), and (ii) a report line stating that contrast requires rendered evaluation with the axe DevTools/Chrome DevTools contrast picker or a manual check against 1.4.3/1.4.11. Rationale is empirical: contrast was the **#1 detected issue (83.9% of home pages)** in the WebAIM Million ([§Low Contrast Text](https://webaim.org/projects/million/#contrast)) — i.e. the domain where detection *is* possible with rendered styles, and precisely where a source-only approximation would be wrong most often.

**1.4.8 Target size (2.5.8).** **FACT — normative text:** the target must be "at least 24 by 24 CSS pixels", except when any of five exceptions applies: **Spacing** (a 24 CSS-pixel-diameter circle centred on each undersized target's bounding box must not intersect another target or another undersized target's circle), **Equivalent**, **Inline** (in a sentence / constrained by line-height), **User Agent Control**, **Essential**; 2.5.5 (Enhanced) uses **44 by 44** ([Understanding SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)). Also FACT from the same page: the requirement is "independent of the zoom factor", and does not apply to targets "while they are obscured by content displayed as a result of a user interaction" (open combobox, modal, cookie banner) but does apply to targets in new content appearing on top.
**REC:** size is a layout fact → tier (b) at best, and only for literal `width`/`height` values under 24 px with no padding/min-size in the same rule. Report as "undersized by declaration — confirm the spacing exception", never "fails 2.5.8".

### 1.5 Report language requirements (a11y)

**REC — `A11Y-002`.** Every accessibility finding must render as:

```
<rule-id>  <severity>  <criterion>  <file>:<line>
  Potential barrier: <one sentence, describes the user impact>
  Detected: <the literal construct, redacted per §4.2>
  Why this may be a false positive: <mandatory field>
  Verify by: <a manual step a human can perform>
```

The "why this may be a false positive" field is **mandatory and non-empty** for tiers (b): if the rule author cannot state it, the rule is not ready. This is the cheapest available defence against the credibility collapse that follows a confident wrong finding.

---

## 2. Performance and Core Web Vitals standard

### 2.1 Current metrics and official thresholds

**FACT — the Core Web Vitals set is LCP, INP, CLS.** Thresholds, read directly from Google's own `web-vitals` library export (`CLSThresholds`, `INPThresholds`, `LCPThresholds`):

| Metric | Good | Needs improvement | Poor | Source |
|---|---|---|---|---|
| **Largest Contentful Paint (LCP)** | ≤ **2500 ms** | 2500–4000 ms | > 4000 ms | [`LCPThresholds = [2500, 4000]`](https://github.com/GoogleChrome/web-vitals#rating-thresholds) |
| **Interaction to Next Paint (INP)** | ≤ **200 ms** | 200–500 ms | > 500 ms | [`INPThresholds = [200, 500]`](https://github.com/GoogleChrome/web-vitals#rating-thresholds) |
| **Cumulative Layout Shift (CLS)** | ≤ **0.1** | 0.1–0.25 | > 0.25 | [`CLSThresholds = [0.1, 0.25]`](https://github.com/GoogleChrome/web-vitals#rating-thresholds) |

**FACT — evaluation basis.** The INP article states the threshold is applied to **the 75th percentile of page loads in the field, segmented by mobile and desktop** ([web.dev INP](https://web.dev/articles/inp)). Same page: INP is "a stable Core Web Vitals metric", it "observes the latency of all interactions ... and reports a single value", and only **click, tap, and keyboard** interactions are observed (pointer-move, scroll, and zoom are excluded).

**FACT — FID is retired.** INP replaced First Input Delay on **12 March 2024**; FID was removed from Chrome's field-data tools in September 2024 ([web.dev `inp-cwv-launch`](https://web.dev/blog/inp-cwv-launch); corroborated by [Google Search Central, 2023 announcement](https://developers.google.com/search/blog/2023/05/introducing-inp)). **REC:** the rule catalogue must contain **no** FID rule. A rule that recommends optimising "FID" is a defect.

**FACT — supplementary, not core.** FCP and TTFB are listed under "Other metrics" in the same library ([README](https://github.com/GoogleChrome/web-vitals#other-metrics)). **REC:** may be *mentioned* as diagnostics; must never be reported as a "Core Web Vitals failure".

**FACT — measurement coverage caveat.** `onCLS()` is listed as supported in **Chromium only**, while `onLCP()`, `onINP()`, `onFCP()`, `onTTFB()` are Chromium/Firefox/Safari; and the APIs "have no visibility into `<iframe>` content", so `onCLS()` measures DCLS rather than CLS on pages with iframes ([README §Browser Support / §Limitations](https://github.com/GoogleChrome/web-vitals)). **REC:** any doc text explaining CLS must not claim browser-uniform measurability.

**FACT — in flight, not stable.** Chrome added **experimental soft-navigation** Core Web Vitals to CrUX in **October 2026**, with Search Console following "after a targeted May 2027 graduation" (secondary reporting: [Search Engine Journal, 2026-10-12](https://www.searchenginejournal.com/google-experimental-soft-navigation-metrics-crux/592820/)); the primary announcement is [web.dev, 13 October 2026](https://web.dev/blog/crux-experimental-soft-navs). **REC:** record it as *experimental* and do **not** encode SPA soft-navigation scoring into rules. **UNVERIFIED:** the exact graduation date and the final metric definitions — re-check before any release note mentions it.

### 2.2 Static vs. runtime — the hard boundary

| Question | Answerable from source? | Rule |
|---|---|---|
| Does an `<img>` declare `width`/`height` or `aspect-ratio`? | Yes | May flag; this is a *cause* of CLS |
| Does a `<script src>` in `<head>` lack `async`/`defer`/`type=module`? | Yes | May flag as render-blocking |
| Is a third-party origin loaded before first paint? | Yes (ordering within the document) | May flag |
| Does a font declaration lack `font-display` and lack `preload`? | Yes | May flag |
| Does a barrel file import a whole library synchronously into the entry chunk? | Yes (import graph) | May flag |
| **What is LCP?** | **No** | Forbidden. Never estimate |
| **What is INP?** | **No** | Forbidden |
| **What is CLS?** | **No** — depends on layout, fonts, injection timing, viewport | Forbidden. May only flag *known causes* |
| Is the bundle "too big"? | Partly — chunk sizes exist only after a build | Forbidden unless a build artefact is supplied by the user |

**REC (`PERF-001`).** The words "LCP", "INP", "CLS" may appear in a finding **only** as `risk: contributes to CLS` / `risk: likely to delay LCP`, and never with a number, unit, or predicted score. A finding must not contain a fabricated measurement. Violations of this are a release blocker: it is the tool's most likely route to being wrong in a way users cannot detect.

**REC (`PERF-002`).** No simulated throttling, no synthetic "before/after" estimates, no lighthouse-in-a-box. If a user wants measurement, the tool prints the exact commands to run (`npx lighthouse <url> --only-categories=performance`, or the `web-vitals` snippet) and labels any pasted result as **lab data**, distinct from field data.

### 2.3 Source-detectable performance problems (checklist)

| ID | Signal | Confidence | Note |
|---|---|---|---|
| PERF-101 | `<img>` without `width`/`height` (and without `aspect-ratio` in a `style`/class the rule can see) | High | Primary CLS cause |
| PERF-102 | `<img>`/`<iframe>` above the fold with `loading="lazy"` | High | Deliberate anti-pattern: delays LCP; requires "above the fold" heuristic → document the assumption |
| PERF-103 | LCP-candidate image without `fetchpriority="high"` | Low | Advisory only |
| PERF-104 | Render-blocking third-party `<script>` in `<head>` (no `async`/`defer`/`type=module`) | High | Ordering is visible in the document |
| PERF-105 | Synchronous third-party embed (`<script>` injected by an analytics snippet) on the critical path | Low | Detection is pattern-matching on vendor snippets |
| PERF-106 | `@font-face` without `font-display` | High | Plus: font not preloaded, font not self-hosted, no `unicode-range` subsetting |
| PERF-107 | Google Fonts `<link>` with render-blocking CSS and no `preconnect` | Medium | Vendor-specific; keep as a separate rule so it can be disabled |
| PERF-108 | Static `import` of a heavy module used only in an event handler / route | High | Suggest `await import()` — **never** auto-apply (§5.3) |
| PERF-109 | Barrel-file re-export chain (`export * from`) pulling a package into the entry chunk | Medium | Requires import-graph analysis; must state that tree-shaking may still remove it |
| PERF-110 | `moment`/`lodash` full import in a bundler app | Medium | Vendor-specific; recommend per-method imports or a modern replacement |
| PERF-111 | Inline `<script>` in `<head>` doing synchronous DOM work | Medium | Blocks parsing |
| PERF-112 | `<link rel="preload">` missing for the LCP image / font actually used | Low | Advisory |
| PERF-113 | `document.write()` in a parser-blocking position | High | Also a security sink (`SEC-305`) |
| PERF-114 | Large data or config inlined as a JS literal in the entry chunk | Medium | Flag by byte size of the literal |

### 2.4 Bundle assumptions the rules may state (and must not overstate)

- **FACT-adjacent, REC to verify per instance:** tree-shaking of a dependency requires ESM (`import`/`export`) plus a bundler that can prove the unused exports are side-effect free; `"sideEffects": false` in the dependency's `package.json` is that proof, and it is a **claim by the package author**, not a fact. A wrongly-set `false` silently drops CSS imports and polyfills. **REC:** the tool may *report* that a dependency declares `sideEffects: false`, and must not assert "your bundle drops X".
- **Barrel files** (`index.ts` re-exporting many modules) defeat per-module elimination when the bundler cannot prove purity; the remedy is deep imports or explicit named exports. Cite as advisory.
- **Dynamic `import()`** moves code to a separate chunk but adds a network round-trip; recommending it for above-the-fold code is wrong.
- **Long tasks:** only observable at runtime (`PerformanceObserver` for `longtask`, or the Long Animation Frame API). Static proxies (`while` loops, huge synchronous `JSON.parse`, nested array work in render) are **tier (c)**: too many false positives, no way to bound input size statically.
- **Layout shift causes that are source-visible:** missing image/iframe dimensions, fonts swapping without `font-display`, injecting a banner/snackbar/cookie notice above existing content after paint, and content inserted before a focused/user-read region. **REC:** rules name *causes*, never scores.
- **Third-party loading strategies** the tool may recommend, in order: self-host; `defer`/`async`; load on interaction (`preconnect` + `import()` on intent); `partytown`-style off-main-thread; then remove. **UNVERIFIED:** effectiveness ordering is vendor guidance, not a W3C measurement; label as guidance.

---

## 3. Client-side security standard (OWASP-aligned)

### 3.1 Standards map — cite the current versions

| Standard | Version to cite | URL |
|---|---|---|
| **OWASP Top 10:2025** | Released 2025; top-level index now redirects to `/2025/` | https://top10.owasp.org/2025/ |
| **OWASP ASVS** | **5.0.0, published 30 May 2025** | https://asvs.owasp.org/ |
| **OWASP WSTG** | **4.2** is the current versioned release; **5.0 in development** (do not cite 5.0 as released) | https://owasp.org/www-project-web-security-testing-guide/ |

**FACT — OWASP Top 10:2025 categories** (verbatim titles, from https://top10.owasp.org/2025/):

1. A01 Broken Access Control
2. A02 Security Misconfiguration
3. A03 **Software Supply Chain Failures**
4. A04 Cryptographic Failures
5. A05 Injection
6. A06 Insecure Design
7. A07 Authentication Failures
8. A08 Software or Data Integrity Failures
9. A09 Security Logging and Alerting Failures
10. A10 **Mishandling of Exceptional Conditions**

**REC:** note the 2025 changes that matter for a front-end tool: **A03 Software Supply Chain Failures is new**, and **A10 Mishandling of Exceptional Conditions is new** — so "the client leaks stack traces / fails open on error" is now a first-class category, not a footnote. Rules map to `A0x:2025` explicitly; a rule citing "A03:2017" (Sensitive Data Exposure) is stale and must be rejected in review.

**ASVS citation form** (FACT, from asvs.owasp.org): requirements are `<chapter>.<section>.<requirement>` and documents should cite `v<version>-<chapter>.<section>.<requirement>`, e.g. `v5.0.0-1.2.5`. **REC:** every security rule that maps to ASVS cites the fully-versioned form. In ASVS 5.0.0, chapter 1 is **Encoding and Sanitization** (FACT, same page, §"How To Reference ASVS Requirements").

### 3.2 Injection / XSS — DOM sinks

**FACT (classification):** Trusted Types' own taxonomy — HTML sinks (`Element.innerHTML`, `document.write()`), JavaScript sinks (`eval()`, `HTMLScriptElement.text`), JavaScript-URL sinks (`HTMLScriptElement.src`) — [MDN Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API).

Rule set to implement, each with the *dangerous* form precisely defined so that literals are not flagged:

| ID | Sink | Dangerous form (flag) | Safe form (never flag) |
|---|---|---|---|
| SEC-301 | `innerHTML` / `outerHTML` | RHS contains a non-literal expression, concatenation, or template interpolation | A single string literal / template literal with **no** `${…}` |
| SEC-302 | `insertAdjacentHTML` | any non-literal second argument | literal |
| SEC-303 | `document.write` / `writeln` | any use in application code | (none — deprecation is not a security exception) |
| SEC-304 | `eval` / `new Function` / `setTimeout(<string>)` / `setInterval(<string>)` | any use | none; `new Function` with only literals is still a CSP blocker |
| SEC-305 | `srcdoc` attribute | any non-literal | literal |
| SEC-306 | `javascript:` URL in `href`/`src`/`action`/`formaction` | any occurrence after normalisation | — |
| SEC-307 | Attribute-injection API: `setAttribute('on*', …)` | any | — |
| SEC-308 | `Range.createContextualFragment` | non-literal | literal |
| SEC-309 | Framework escape hatches | React `dangerouslySetInnerHTML`, Vue `v-html`, Svelte `{@html}`, Angular `bypassSecurityTrustHtml/Script/Url/ResourceUrl`, lit `unsafeHTML` | same, when the value is a literal *and* a comment documents why |
| SEC-310 | jQuery `.html()` / `.append()` with HTML string | non-literal | literal, or `.text()` |
| SEC-311 | `location` / `location.href` / `window.open` assignment from a non-literal source | non-literal | relative literal |

**REC (`SEC-001`) — the literal rule is not optional.** `el.innerHTML = '<b>ok</b>'` is safe and flagging it is a false positive. Therefore SEC-301/302/308 must be **AST-based** (does the argument contain an interpolation/identifier?) and never regex-on-text. This one requirement eliminates most of the class's false positives *and* most of its ReDoS exposure.

**REC (`SEC-002`) — taint is required for severity.** Without data-flow, `innerHTML = sanitize(html)` and `innerHTML = userInput` look identical. Implement a **local, intra-file, one-hop taint check**: is any identifier in the expression assigned from a known source (`location.*`, `document.URL`, `document.referrer`, `window.name`, `postMessage` event data, `localStorage`, a function parameter named/typed as user data, an `await fetch()` result)? Emit:
- `high` — non-literal AND tainted within the file;
- `medium` — non-literal, taint unknown;
- `info` — non-literal, but a sanitiser call wraps it (`DOMPurify.sanitize`, `sanitize-html`, `escapeHtml`).

**REC:** never claim a sanitiser is safe. It is "a sanitiser call we recognise"; the config may be wrong (`DOMPurify` with `ADD_TAGS:['script']`, `ALLOW_UNKNOWN_PROTOCOLS`).

### 3.3 Unsafe rendering of user content

Beyond sinks: rendering user-controlled strings into contexts that are not HTML but are still active — `style` attributes, `class` names, `url(...)`, `innerText` into `srcdoc`, template engines with `| safe`/`{{{ }}}`, Markdown renderers with `html: true`. **REC:** ship these as tier (b) "review" findings with the *context* named. Do not auto-sanitise (§5.3): a Markdown renderer that suddenly escapes raw HTML breaks the product.

### 3.4 URL handling

- **`javascript:`** — normalise before matching: trim, strip C0 controls and whitespace (including `\t\n\r` and NUL), lowercase, and decode one level of HTML entities and percent-encoding. `JaVaScRiPt:` and `&#106;avascript:` are the same sink. **REC:** flag if the normalised form matches `^javascript:` on a non-literal-URL attribute. The *right* remedy is `new URL(value, location.origin)` + scheme allowlist (`http:`, `https:`, `mailto:`, `tel:`), not a blocklist.
- **`data:`** — `data:text/html` and `data:image/svg+xml` execute in some navigations; `data:` in `href` is a script-execution vector. Flag non-literal `data:` URLs. Note also that CSP `img-src data:` is a deliberate trade-off, not automatically a bug.
- **`target="_blank"` + `rel`** — **FACT, and a false positive to avoid:** "Setting `target="_blank"` on `<a>`, `<area>` and `<form>` elements implicitly provides the same `rel` behavior as setting `rel="noopener"`" ([MDN `rel="noopener"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noopener)). Therefore **`target="_blank"` without `rel` is not a vulnerability in current browsers.** It is a hardening recommendation for legacy browsers and, separately, a *referrer-leakage* question (`noreferrer`), which is a privacy rule (`SEC-315`), severity `info`, `default: false`.
- **SEC-316** — `window.open(url, '_blank')` returns a handle; `opener` propagation here is governed by the same implicit rules. **UNVERIFIED:** the precise spec text for `window.open`'s opener default — do not assert it; treat as advisory and cite MDN only after reading the `Window.open` page.

### 3.5 CSP

- **FACT — status.** CSP Level 3 is a **W3C Working Draft, 27 October 2026** ("Publication as a Working Draft does not imply endorsement"; the document "is inappropriate to cite ... as other than a work in progress") — https://www.w3.org/TR/CSP3/. **REC:** cite CSP3 as the definition of `'strict-dynamic'` (§8.2), `'unsafe-hashes'` (§8.3), and **Strict CSP** (§8.5), and say so plainly rather than implying a Recommendation exists.
- **FACT — CSP is not a first line of defence.** The spec's own introduction: "CSP is not intended as a first line of defense against content injection vulnerabilities. Instead, CSP is best used as defense-in-depth. It reduces the harm that a malicious injection can cause, but it is not a replacement for careful input validation and output encoding" ([CSP3 §1](https://www.w3.org/TR/CSP3/#intro)). **REC:** quote this in the report whenever a finding recommends CSP — otherwise users treat a nonce as a fix for an XSS sink.
- **`'strict-dynamic'`** — allows script loaded by an already-trusted script to load more script, which lets nonce/hash-based policies survive bundler-injected tags; the *consequence the tool must state* is that host allowlists (`https:` / `*.cdn.com`) are then ignored for script, so the policy no longer constrains third-party script origins. Recommend `'strict-dynamic'` **with** nonce/hash **and** Trusted Types, not as a standalone fix.
- **`require-trusted-types-for 'script'`** — with this directive, "passing strings into injection sinks will result in a `TypeError`" ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API)); `trusted-types` restricts which policy names may be created. **FACT:** the default policy exists specifically to *find* remaining string sinks (it is called automatically for string arguments), which is exactly the migration tool a codemod should recommend before rewriting sinks.
- **Rule shape:** `CSP-101` missing `object-src 'none'`/`base-uri`; `CSP-102` `'unsafe-inline'` + `'unsafe-eval'` present; `CSP-103` `script-src` with only host allowlists (no nonce/hash/'strict-dynamic'); `CSP-104` `require-trusted-types-for` absent while string sinks exist in the same repo (a *repo-level* correlation, `info`); `CSP-105` policy only delivered via `<meta>` where header delivery is possible (`frame-ancestors`, `report-uri` are ignored in `<meta>`). **UNVERIFIED:** the exact set of directives ignored in `<meta>` — verify against CSP3 §3.3 before shipping `CSP-105`.
- **REC:** CSP is usually delivered by a server/framework config. The tool must state whether it found a policy *in this repository* (e.g. `next.config.*` headers, `vercel.json`, `netlify.toml`, nginx conf, `middleware.ts`) or found none — "no policy in repo" is not "no policy in production".

### 3.6 Trusted Types — current status (a fact that changed recently)

**FACT:** the Trusted Types API is **Baseline 2026 — "Newly available"**, described by MDN as working "across the latest devices and browser versions" **since February 2026** ([MDN Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API), retrieved 2026-11-16).
**REC:** any internal note, doc, or rule description claiming "Trusted Types is Chromium-only" is **outdated and must be corrected before release**. Rules may recommend `require-trusted-types-for 'script'` as a forward-looking hardening measure without a browser-support caveat, but should still note that enforcement breaks existing string sinks — hence migration order: report-only → default policy logging → rewrite sinks → enforce.

### 3.7 Secrets in client bundles

- **FACT-level principle:** anything the bundler inlines into client code is public. Build-time public prefixes exist precisely to mark values intended for the browser: Next.js `NEXT_PUBLIC_`, Vite `VITE_`, Astro `PUBLIC_`, CRA `REACT_APP_`, Gatsby `GATSBY_`, Nuxt `NUXT_PUBLIC`/`publicRuntimeConfig`. **REC:** cite each framework's own env docs per rule; the prefix list must live in a versioned data file, not in rule code, because the frameworks change it.
- **Detection rules:** `SEC-320` non-public secret-shaped name (`*_SECRET`, `*_TOKEN`, `*_PRIVATE_KEY`, `DATABASE_URL`, `STRIPE_SECRET*`, `*_API_KEY`) referenced in a file that is in the client bundle (path heuristics + `'use client'` + `process.env` in client component); `SEC-321` a literal secret pattern (provider-prefixed keys, PEM blocks, JWTs) anywhere in the repo; `SEC-322` `.env*` file committed (presence check only, never read values into the report).
- **REC (`PRIV-003`) — the tool must never print a secret it finds.** Report `SEC-321` as: rule id, file, line, *pattern name*, length, and a **truncated salted hash** (§4.2). Never the value, never a prefix/suffix. A scanner that echoes the secret into CI logs has made the leak worse; that is a `TM-06` threat in the threat model.

### 3.8 Authentication and authorisation boundaries

- **REC (`SEC-330`).** A client-side check is a UX affordance, never authorisation. Any rule that detects permission logic in client code (`if (user.role === 'admin')`, `canEdit && <DeleteButton/>`, `localStorage.getItem('isAdmin')`) reports: "client-side only — must be enforced server-side (A01:2025 Broken Access Control; ASVS v5.0.0 chapter on authorisation)". Severity `medium`, `default: false` (it fires on every admin UI ever written), and the message must not imply the code is wrong — the *absence* of a server check is what is wrong and the tool cannot see the server.
- **Corollary:** the tool must not offer a codemod for this class at all. There is nothing to rewrite locally.

### 3.9 CSRF basics for cookie-authenticated forms

State that cookie-based sessions need: `SameSite=Lax|Strict` (with `None; Secure` only when genuinely required), an anti-CSRF token checked server-side, and/or an `Origin`/`Sec-Fetch-Site` check. **REC:** static rules are limited to `SEC-340` "state-changing request issued as `GET` (form `method` missing or `get` on a destructive action)" and `SEC-341` "`fetch`/`XHR` to a same-site endpoint with `credentials: 'include'` and no CSRF header/token visible in the same file" — both `default: false`, both phrased as questions. **REC:** default `SameSite` semantics differ by browser and by "Lax-by-default"; **UNVERIFIED** — verify the current default against MDN's `Set-Cookie` page before asserting it in any message.

### 3.10 Third-party script trust

Rules: `SEC-350` `<script src>` without `integrity` when the origin is not first-party (SRI is impossible for dynamically-generated URLs — say so); `SEC-351` script tag injected by a vendor snippet with no `crossorigin`; `SEC-352` tag-manager container on a page handling authentication/PII (report as a *supply-chain trust boundary*, A03/A08:2025, not a bug). **REC:** SRI + `crossorigin` + pinned version is the recommendation; "remove the tag" is not offered as a codemod.

### 3.11 `postMessage`

`SEC-360` — `addEventListener('message', handler)` whose handler does not compare `event.origin` (and `event.source`) against an allowlist **before** using `event.data`. **FACT-level reasoning:** the message event is attacker-triggerable from any window that can obtain a reference to this one; origin is the only trustworthy identity claim. Rules: flag missing origin check (`high` if `event.data` reaches a sink or storage), flag `postMessage(..., '*')` with a payload containing tokens/PII (`medium`). Never auto-fix: the correct allowlist is a deployment fact.

### 3.12 Dependency and supply-chain risk

Covered operationally in §8. Rule-level:
`SEC-370` dependency name within edit distance 1–2 of a popular package (typosquat heuristic — `default: false`, and *always* accompanied by "verify the publisher"); `SEC-371` package with a `postinstall`/`preinstall`/`prepare` script (read from `node_modules/*/package.json` only if the user opts in to reading installed trees); `SEC-372` lockfile present but `package.json` ranges allow major drift (`^`/`*`/`latest`); `SEC-373` lockfile missing `integrity`/`resolved` fields; `SEC-374` install from a URL/tarball/git ref rather than a registry version. Map all to **A03:2025** and **A08:2025**.
**FACT:** npm supports publishing with a signed **provenance attestation** from CI ([docs.npmjs.com, *Generating provenance statements*](https://docs.npmjs.com/generating-provenance-statements/), URL retrieved 2026-11-16; the page body is JS-rendered and returned no text to this session, so the *flags and verification command* are **UNVERIFIED** here and must be read from that page before being encoded in a rule or doc).

### 3.13 Security headers

Headers are almost always delivered by infrastructure, so source detection is *advisory*: look in known config files and report "not found in this repository".

| Header | Recommended value | Purpose | Verification |
|---|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (+ `preload` only if submitted) | Force HTTPS for future requests | CITED — MDN `Strict-Transport-Security` |
| `Cross-Origin-Opener-Policy` | `same-origin` | Severs `window.opener`-based cross-origin interaction; required for cross-origin isolation | CITED — MDN `Cross-Origin-Opener-Policy` |
| `Cross-Origin-Embedder-Policy` | `require-corp` (or `credentialless`) | Enables cross-origin isolation together with COOP; `require-corp` means every cross-origin subresource must opt in via CORP or CORS | CITED — MDN `Cross-Origin-Embedder-Policy`; **UNVERIFIED:** `credentialless` support matrix |
| `Cross-Origin-Resource-Policy` | `same-origin` / `same-site` / `cross-origin` on *responses* | Opts a resource into being embeddable under COEP | CITED — MDN `Cross-Origin-Resource-Policy` |
| `X-Content-Type-Options` | `nosniff` | Stops MIME sniffing | CITED — MDN |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits URL leakage | CITED — MDN |
| `Permissions-Policy` | deny unused features | Reduces capability surface | CITED — MDN |

**REC (`SEC-380`).** A header rule fires only on a file type it can substantiate (`next.config.*`, `vercel.json`, `netlify.toml`, `_headers`, `nginx.conf`, `web.config`, `middleware.ts`, `server.*`). If none is found the finding is one line: "no header configuration detected in this repository — headers may be set upstream". Never a per-page failure.

---

## 4. Privacy and data-flow posture for a local analysis tool

### 4.1 "No telemetry by default" — as testable invariants

**REC (`PRIV-001`).** The following must hold and be *tested*, not merely documented:

| Invariant | How it is enforced |
|---|---|
| No network calls of any kind | Test harness monkeypatches `http`, `https`, `net`, `dns`, `fetch`, `WebSocket` and asserts **zero** calls during a full scan of a fixture repo. Also a CI job runs the CLI with egress blocked and requires exit 0. |
| No analytics, no crash reporting, no error upload | No dependency may be added that opens a socket; `dependencies` must stay empty (see §8). |
| No remote rule updates | Rules ship in the package (`rules/*.json`). A `--update-rules`-style flag must not exist. If ever added: explicit, documented, opt-in, with the URL shown and a checksum verified. |
| No phone-home on version check | The CLI prints the local version only. |
| No secrets in reports | §4.2 redaction, enforced by a report-schema test that scans generated reports for the fixture's planted secrets and fails on a match. |
| No writes outside the repo | Every path is resolved and asserted to be inside the repo root before any write (also `TM-03`). |
| No reading of files outside the repo, except the tool's own package | Path containment check; symlinks not followed by default (`TM-02`). |

**REC:** the README states the guarantee in one sentence, and `SECURITY.md` explains what would have to change for it to stop being true. Users of a tool that rewrites code need that in writing.

### 4.2 Redaction policy — what may appear in a report

| Element | Allowed | Prohibited |
|---|---|---|
| Path | Repo-relative, forward slashes (`src/app/Card.tsx`) | Absolute paths, drive letters, `C:\Users\<name>`, home directories, network shares |
| Location | `line`, `column`, `endLine` | Byte offsets alone (unusable), full-file ranges |
| Excerpt | **≤ 120 characters, single line**, with leading whitespace collapsed | Multi-line blocks, whole functions, whole files |
| String literals in the excerpt | Redacted if longer than 16 chars or matching a secret pattern → `"***"` | Any literal that looks like a credential, URL with a query string, or email |
| Comments | **Excluded by default**; `--include-comments` opt-in, and still redacted | Comments are the highest-density place for planted secrets and TODOs with names |
| Fingerprint | `HMAC-SHA256(repo_salt, rule_id + "\0" + relpath + "\0" + normalized_excerpt)[0:16]` | Hash of the whole file; any reversible encoding; unsalted hash of a short secret (a raw SHA-256 of a 20-char key is brute-forceable) |
| `repo_salt` | Random per report run, stored in the report, documented as *not* a secret | Derived from machine name, username, or time |
| Env values | **Never**, under any flag | — |
| Counts/aggregates | Allowed (findings per rule, per directory) | Per-author or per-commit attribution |

**REC (`PRIV-002`).** The redactor is a single module used by *every* output path (console, JSON, SARIF, HTML). A finding object is constructed already-redacted; there is no "raw" mode. Any `--verbose` that widens the excerpt must still enforce the 120-char/1-line limit and must re-run the secret detector on the excerpt before printing.

**REC — excerpt rule of thumb:** prefer *structure over content*. `img element with 3 attributes (src, class, loading)` identifies the construct without quoting the user's text. Content is quoted only when it is the defect (e.g. an `alt` value that duplicates the filename) and even then truncated.

### 4.3 If opt-in telemetry is ever added

Not now. If added, all of the following are prerequisites, not options:

1. **Off by default; no prompt at install.** A `--telemetry` flag or an explicit `mwc telemetry enable` command that prints exactly what will be sent.
2. **Documented data flow** — one page listing every field, its type, its purpose, retention, and endpoint host. Versioned with the tool.
3. **Content-free payload** — rule ids, counts, tool version, OS family (not version), Node major, duration buckets. **Never** paths, excerpts, hashes of excerpts, dependency names, or repo names.
4. **Local-only default** with a visible reminder on the enable command, and a `--telemetry-status` verb.
5. **No silent re-enable** after upgrade; consent is per-major-version and revocable in one command.
6. **Air-gap mode** (`MWC_OFFLINE=1`) that hard-disables every code path touching the network, including future ones, and is honoured before argument parsing.

---

## 5. Safe remediation policy — the codemod contract

The tool may modify user code. These rules are the contract. Each is testable; each has an ID.

### 5.1 Modes and flags

| Mode | Trigger | Behaviour |
|---|---|---|
| **detect** | default | Read-only. Never writes. |
| **preview** | `--fix` (alone) | Computes edits, prints unified diff, writes nothing. **This is what `--fix` means.** |
| **apply** | `--fix --apply` | Writes, after all preconditions in §5.2 pass |
| **revert** | `--fix --apply --revert <journal>` | Restores from the backup journal (§5.7) |

**REC (`CODEMOD-001`).** `--fix` must never imply writing. Requiring *two* explicit flags (`--fix --apply`) is deliberate friction; it converts an accident into a decision. In a non-interactive context (no TTY) `--apply` additionally requires `--yes` — otherwise exit `2` with an explanation, because a CI pipeline is exactly where an accidental rewrite is most expensive.

**REC (`CODEMOD-002`).** Every applied change prints: file, rule id, one-line before → after, and the backup journal path. The exit code is `0` only if all verifications in §5.4 ran **and** passed; `3` if applied but verification was partial; `4` if applied and verification failed.

### 5.2 Preconditions — refuse before touching a byte

| ID | Refuse when | Detection |
|---|---|---|
| CODEMOD-101 | Any target file fails to parse | Full parse with the language's parser; never "regex-parse" |
| CODEMOD-102 | File is generated | Header markers (`@generated`, `DO NOT EDIT`, `auto-generated`), or path matches `dist/`, `build/`, `out/`, `.next/`, `coverage/`, `*.min.*`, `vendor/`, `third_party/` |
| CODEMOD-103 | File is vendored / not ours | `node_modules/`, `vendor/`, `Pods/`, `packages` with a foreign `LICENSE`, submodule (`.git` file, not dir) |
| CODEMOD-104 | Lockfile | `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lockb`, `composer.lock`, `Cargo.lock` |
| CODEMOD-105 | Minified | No line longer than 500 chars heuristic **and** average line length > 200 |
| CODEMOD-106 | File is a symlink | `lstat` — and never follow it for write |
| CODEMOD-107 | Working tree is dirty **in an overlapping path** | `git status --porcelain`; refuse if any target path is modified/untracked/staged |
| CODEMOD-108 | Not a git repository | Refuse `--apply` entirely: without git there is no trustworthy rollback. Offer `--apply --no-vcs --backup-dir <dir>` as an explicit, logged override |
| CODEMOD-109 | Ambiguity: two rules produce overlapping edits to the same range | Conflict detection before write; refuse both, report |
| CODEMOD-110 | Unsupported syntax in the construct (decorators, JSX in `.js`, experimental syntax) | Parser error subclass "unsupported", distinct from "invalid" |
| CODEMOD-111 | File exceeds a size budget (default 1 MiB) or line budget | Prevents accidental rewrite of data files |
| CODEMOD-112 | Edit would change line count by more than N where the rule does not intend to | Guard against formatter storms |

**REC:** refusals are *reported*, not silently skipped: `refused: CODEMOD-102 (generated) src/generated/api.ts`. Silence reads as "checked and clean".

### 5.3 Refuse even when the rule matches — semantic traps

This table is the heart of the policy. Each row is a case where the syntactic pattern matches and the fix is still wrong.

| Match | Why the fix is wrong | Allowed action |
|---|---|---|
| `innerHTML = x` → `textContent = x` | If `x` is intentional HTML (a rendered Markdown body, a CMS field, a `<b>` from an i18n string), `textContent` **removes visible content** — a silent feature regression | Report only. If a sanitiser call is already present, do nothing. Offer `insertAdjacentText`/`textContent` only when the literal contains no markup **and** the variable name/type suggests text (`text`, `label`, `name`) — and even then, preview only |
| `eval` / `new Function` | Often in a template engine, a test harness, a feature-flag evaluator, or a sandbox that expects it; removal changes semantics | Report only |
| Adding `alt=""` | Blank alt **declares the image decorative** — if it conveys information, this makes accessibility *worse* while making the linter green | Report only; the message must say "if decorative, use `alt=""`; if informative, write a text alternative" |
| Adding `aria-label` | Invents a user-facing name in the wrong language, duplicating visible text (violating 2.5.3 Label in Name) | Report only |
| Moving focus / adding a focus trap / adding `tabindex` | Focus order is a rendered, human-judged property | Forbidden |
| Adding `aria-live` | Wrong politeness hides or spams announcements | Report only |
| Adding `prefers-reduced-motion` block | Can remove necessary feedback and change perceived performance | Report only |
| Adding `loading="lazy"` | Below-the-fold heuristic; can delay the LCP image | Report only |
| `await import()` for a static import | Breaks top-level usage, changes chunking, can break SSR | Report only |
| Adding `rel="noreferrer"` to `target="_blank"` | Kills analytics attribution and referrer-dependent flows | `info`, preview only |
| Wrapping in `DOMPurify.sanitize` | Adds a dependency and may strip content the product requires | Report only (and never add a dependency) |
| Any change to a lockfile, dependency version, or `package.json` | Supply-chain mutation is outside this tool's remit (§8) | Forbidden |
| Reformatting untouched lines | Creates review noise and merge conflicts | Forbidden — edits must be minimal and whitespace-preserving outside the changed range |

**REC (`CODEMOD-003`) — the "safe fix allowlist".** In v1 the set of auto-applicable edits is deliberately tiny: (i) adding a missing `width`/`height` **only when the intrinsic size is present in the same repo** (an image file the tool can read metadata from) — otherwise report; (ii) adding `type="button"` to a `<button>` inside a form with no `type`; (iii) removing a literal `javascript:void(0)` from an `<a>` and adding `role="button"`+`tabindex="0"`+key handler **never** (this one is report-only, it needs behaviour). Everything else is detect-only. Grow this list only with a §7 fixture set that includes a false-positive fixture.

### 5.4 Post-change verification

Run in this order, stop at the first hard failure, and **record the outcome per command**:

`formatter` → `lint` → `typecheck` → `focused tests` → `build`

**REC (`CODEMOD-004`).**
1. Discover commands from the repo's own `package.json` scripts / config presence. Never invent commands (`npx eslint .` on a non-ESLint repo is a false signal).
2. Never run a script whose name matches an install hook (`postinstall`, `prepare`) or a network-touching script; prefer the narrowest command (single file for formatter/lint, `--filter` for tests).
3. A command that cannot be found or executed is **not** a pass. Record `verification: unavailable (<reason>)` and exit `3`.
4. A verification command that *fails* triggers automatic revert from the journal **only** if `--revert-on-failure` was passed; otherwise the change stays but the exit code is `4` and the report says `verification: FAILED`.
5. Verification must not run with network access by default (`MWC_OFFLINE=1` semantics). A build that needs the network is reported as unverifiable.
6. **Host constraint (FACT, from this workspace's Stage 0 inventory):** the sandbox runs a GUI-subsystem Electron binary on Windows and `.ps1` execution is blocked by policy; child processes that capture another program's output through piped stdio can fail with `EPERM`. Therefore the runner must (a) prefer `stdio: 'inherit'` for formatter/lint/typecheck output, (b) treat `EPERM`/spawn failure as `unavailable`, not as a test failure, and (c) never depend on a shell script existing. Record this in the runner's docs — it is an environment property, not a bug.

### 5.5 Suppression and opt-out design

**REC (`CODEMOD-005`).** Three mechanisms, all auditable, all requiring a reason.

1. **Inline suppression** — grammar is fixed and machine-checked:
   `// mwc-disable-next-line A11Y-102 -- reason: decorative hero image, alt handled by <picture>`
   - Only `disable-next-line` and `disable` (file-scope) exist; no wildcard rule ids; no `disable-line` (off-by-one in generated code).
   - The `-- reason:` segment is **required**, minimum 10 characters, and must not be a placeholder (`todo`, `fixme`, `n/a`, `lgtm`, `-` are rejected).
   - Counted and printed in the summary: `suppressed: 7 (3 without reason → error)`.
2. **Config allowlist** (`mwc.config.json`) — entries have `rule`, `path` glob, `reason`, `owner`, `expires` (ISO date). Expired entries **fail the run** (exit `5`), which is what makes them auditable; an allowlist that never expires is a delete button.
3. **Baseline file** (`mwc-baseline.json`) — records `{rule, path, fingerprint}` using §4.2 fingerprints. Purpose: adopt the tool on a legacy repo without 4 000 findings. Rules: baseline must be committed; new findings still fail; a baseline entry whose fingerprint no longer exists is reported as *stale* and must be pruned (`--prune-baseline`) with the count shown. **Never** baseline by line number alone — it invalidates on every edit and trains users to regenerate.
4. **Nothing is suppressible by environment variable** — env-based suppression is invisible in code review.

### 5.6 Rollback

**A safe rollback is:** a journal file (`.mwc/journal/<timestamp>-<pid>.json`) written **before** the first byte is modified, containing for each file: repo-relative path, SHA-256 of the original, the original content (or a copy under `.mwc/backup/<id>/`), the rule ids applied, the tool version, and the git HEAD at start. Plus:

- Restore is **verify-then-write**: recompute the current file's SHA-256; if it differs from the post-change hash in the journal, **refuse** and report a conflict (someone edited it since) rather than clobbering user work.
- `--revert <journal>` restores exactly the journalled files and leaves everything else alone.
- After a successful revert, delete the journal entry and its backup copy.

**Must never be left behind:** `.bak`/`.orig`/`.rej` files next to source; partially written files (write to a temp file in the same directory, `fsync`, then rename); temp files in the OS temp dir containing user code; a journal without a backup copy (unrevertable); a backup without a journal (garbage that grows forever — cap total backup size, default 50 MiB, and refuse `--apply` if the cap would be exceeded).

**REC (`CODEMOD-006`).** Refuse `--apply` if `.mwc/` cannot be created inside the repo. No fallback to the user's home directory.

---

## 6. Threat model

The full STRIDE analysis, with attack paths, mitigations, residual risk, and per-threat tests, is in **[`threat-model.md`](./threat-model.md)**. Summary of the threat classes and the one-line position for each:

| Class | Position |
|---|---|
| Malicious repo content attacking the scanner | Assume every input is hostile. Bounded reads, no execution, no symlink following, no archive extraction, per-file and per-run time budgets. |
| ReDoS from regex rules | Regex is a last resort. AST first. Where regex is unavoidable: no nested quantifiers, bounded repetition, linear-time validation on a fuzz corpus, per-file timeout. |
| Report leakage (secrets/PII) | Construct findings already-redacted; test with planted secrets; never echo a secret. |
| Supply-chain compromise of the tool | Zero runtime dependencies; lockfile-pinned dev deps; `--ignore-scripts` in CI; provenance/SRI on anything published. |
| Unsafe codemod on a victim repo | Detect-only default; two-flag apply; journal before write; refuse on ambiguity; §5.3 semantic-trap list. |

**ReDoS — the concrete rules** (`TM-REDOS`): (1) forbid nested quantifiers (`(a+)+`), overlapping alternation under a quantifier (`(a|a)*`), and `.*`/`.+` between two unbounded matches; (2) cap repetition (`{0,64}`), not open-ended; (3) never apply a user-supplied or rule-file-supplied regex without compiling through a validator that rejects (1) and (2); (4) every regex rule carries a `redos-fixtures` list of adversarial inputs and a wall-clock assertion (< 50 ms for a 100 KB input) in CI; (5) a global per-file analysis budget (default 2 s) with a hard abort that reports `skipped: timeout`, never a partial result that looks complete. `safe-regex`-style heuristics alone are insufficient — the test corpus is the control.

---

## 7. Test requirements — evidence before a rule ships

### 7.1 Rule manifest (the contract between rule authors and the engine)

**REC (`TEST-001`).** Every rule is data plus a pure function, and declares:

```jsonc
{
  "id": "A11Y-102",
  "title": "img element without alt attribute",
  "criterion": "WCAG 2.2 1.1.1 (A)",
  "reliability": "a",                 // a | b | c  — see §1.3
  "fileKinds": ["html", "jsx-literal"],// engine refuses other kinds
  "default": true,                    // only legal when §7.4 holds
  "severity": "high",
  "falsePositiveNote": "alt='' is decorative and valid; we only flag a missing attribute",
  "codemod": null,                    // or { id, allowed: false, reason: "..." }
  "fixtures": {
    "positive": ["positive/img-no-alt.html"],
    "negative": ["negative/img-with-alt.html", "negative/img-empty-alt-decorative.html"],
    "legacyValid": ["legacy/table-layout-email/img.html"],
    "framework": ["framework/next/image-no-alt.tsx"],
    "unsupportedBrowser": ["browser/ie-conditional-comment.html"]
  },
  "redosFixtures": ["adversarial/img-attr-10k.html"],
  "minConfidence": "high"
}
```

The `falsePositiveNote` is mandatory (see `A11Y-002`); an empty one is a schema error, not a warning.

### 7.2 Fixture taxonomy (six kinds, all mandatory)

| Kind | Purpose | Failure mode it catches |
|---|---|---|
| **positive** | Must flag | Rule does not fire (dead rule) |
| **negative** | Must not flag | Rule over-fires |
| **false-positive / legacy-valid** | Must not flag *and* must not be "fixed": the construct is intentional (email-table layout, `alt=""`, `target="_blank"`, `document.write` in a legacy ad slot, `innerHTML` with a literal) | The rule that fires on correct legacy code — the main cause of adoption failure |
| **framework-specific** | The same defect in the idiom of React/Next/Vue/Svelte/Angular/Astro | Idiom blindness: e.g. `next/image` without `alt`, `<NuxtLink>` instead of `<a>`, `<img src={x} />` in Svelte |
| **unsupported-browser / polyfill** | Code that exists *because* of an old browser (IE conditional comments, `es5-shim` patterns, `nomodule` scripts) | "Modernise this" findings that would break a supported target |
| **domain fixtures** | `a11y/`, `security/`, `perf/`, `hydration/` sub-trees, one per rule family | Coverage gaps that only appear across domains |

**Hydration fixtures** deserve their own set because they are framework- and SSR-specific and have no equivalent in plain HTML. Minimum cases: (i) render output that differs between server and client (`Math.random()`, `Date.now()`, `typeof window`, `navigator.*` read during render); (ii) an event handler attached in a way that is inert before hydration (event delegation, `useEffect`-only wiring) — the *a11y* consequence is a control that looks interactive but is not; (iii) `suppressHydrationWarning` / `v-once` / `{#key}` as deliberate escapes; (iv) serialized state containing non-serialisable values. **REC:** these are tier (b) at most; none may auto-fix, because correct hydration depends on the data flow.

### 7.3 Required evidence per rule (checklist)

- [ ] All six fixture kinds present and passing (the harness fails a rule whose declared fixture path is missing — not "skipped").
- [ ] Golden output: the exact report text for each fixture is snapshotted. Text changes are reviewed diffs, so wording regressions cannot sneak in.
- [ ] Determinism: running the rule twice produces byte-identical output; ordering is stable (sorted by path, then line, then rule id).
- [ ] Redaction test: a fixture with a planted secret + a `C:\Users\…`-style path in a comment, asserting the secret never appears in console, JSON, or SARIF output (`PRIV-003`).
- [ ] ReDoS test: adversarial fixtures complete under the per-rule budget (default 50 ms) and the per-file budget (2 s).
- [ ] Timeout behaviour: an aborted analysis reports `skipped: timeout`, and the report is marked incomplete. Never a silent partial.
- [ ] Idempotence (codemod rules only): applying twice equals applying once; and applying to the *negative* fixtures produces zero edits.
- [ ] If `codemod.allowed: true`: §5.3 semantic-trap fixtures exist showing refusal, and a journal/revert round-trip test passes.
- [ ] Cross-platform path test: findings render identically on Windows and POSIX separators.

### 7.4 What "safe to enable by default" means

**REC (`TEST-002`).** A rule may declare `"default": true` **only if all eight hold.** This is the definition; treat any single failure as disqualifying.

1. **Reliability tier (a)** as defined in §1.3, for every file kind it lists.
2. **Zero false positives** on the project's full fixture corpus *and* on a corpus of real open-source repositories kept for regression (at minimum 10 repos across React/Next/Vue/Svelte/Astro/plain-HTML, vendored read-only under `fixtures/corpus/` with licences recorded). Any finding on those repos must be individually justified in the rule's PR.
3. **Every negative and legacy-valid fixture passes**, including intentional-legacy constructs.
4. **Language is non-assertive**: the message says "potential", names the criterion, and does not claim conformance (`A11Y-002`).
5. **No measurement claim** for perf rules (`PERF-001`), no secret echo for security rules (`PRIV-003`).
6. **`codemod.allowed` is false**, or the codemod is on the §5.3 allowlist with its own trap fixtures.
7. **Suppressible with a reason** and appearing in the baseline mechanism (§5.5), so adoption on a legacy repo does not require a mass edit.
8. **Deterministic and cheap**: under the per-rule time budget at the 95th percentile, no network, no filesystem access outside the repo.

Rules in tier (b) are `default: false` **unconditionally** — no exceptions, no "high confidence heuristic" upgrade path. Tier (c) rules do not exist; a manifest declaring `reliability: "c"` is rejected by the loader.

---

## 8. Supply-chain and licensing review method

### 8.1 Ground truth from this environment (FACT, Stage 0 inventory)

Node `v26.5.1` and npm `11.17.0` are on `PATH`; the DSH runtime is Node `24.21.0`; **the npm cache lives outside the workspace** (`%LOCALAPPDATA%\npm-cache`), so default `npm install`/`npx` fails with `EPERM` on cache writes unless `npm_config_cache` points inside the workspace; `.ps1` execution is blocked by policy; git is `2.55.0`.
**Consequence (`SUP-001`):** the audit must work **without installing anything**. Design for a *zero-runtime-dependency* tool and read dependency metadata from the lockfile and, when present, from an already-installed `node_modules` tree — never by fetching.

### 8.2 What to check, and with what

| Check | Free/local method | Notes |
|---|---|---|
| Inventory of the tree | Parse `package-lock.json` (v2/v3 `packages` map) — no install needed | Yields `name@version`, `resolved`, `integrity`, `dev`, `license` (sometimes) |
| Known vulnerabilities | `npm audit --json` (registry-backed) or `--offline` against a cached advisory set | **UNVERIFIED:** exact `--offline` behaviour in npm 11 — confirm before documenting |
| Registry signatures / provenance | `npm audit signatures` | **UNVERIFIED:** command semantics (see §3.12) |
| Install scripts | Read `scripts.{pre,post}install` from each `node_modules/*/package.json` | The single best signal for supply-chain risk (A03:2025) |
| Licence per package | `license` field; fall back to `LICENSE*` file matching | Write a ~40-line script rather than adding a dependency |
| SPDX identifiers & expressions | Cite [SPDX License List](https://spdx.org/licenses/) | Use `SPDX-License-Identifier:` in our own files; validate expressions |
| Duplicate/phantom deps | `npm ls --all` (needs an install) or lockfile graph walk | Offline: lockfile walk |
| Lockfile drift | Diff `package.json` ranges against lockfile resolutions | Detects `latest`/`*`/git-URL installs (`SEC-372/374`) |
| Maintainer signals | Registry metadata: publish recency, maintainer count, repository link, tarball vs repo, `deprecated` flag | **UNVERIFIED:** exact API fields — read the registry doc first; do not encode guessed field names |

**REC (`SUP-002`).** CI installs with `npm ci --ignore-scripts` and a workspace-local `npm_config_cache`. A dependency that *requires* a postinstall script to function is a design smell for this project and should be rejected rather than accommodated.

### 8.3 Reproducible, offline-reviewable record

**REC (`SUP-003`).** Commit `supply-chain/deps.json`, generated once, containing for every package: `name`, `version`, `resolved`, `integrity` (sha512), `license` (SPDX expression as declared), `dev` flag, `hasInstallScript`, and `direct` flag. Plus `supply-chain/advisories.json` — a dated snapshot of advisory data (`{"generatedAt": "...", "source": "...", "entries": [...]}`) — and a `supply-chain/README.md` stating the date and how to regenerate.

The CI job then:
1. Regenerates `deps.json` from the lockfile and **fails on any diff** (a lockfile change is a reviewable event, not a silent one).
2. Re-evaluates the advisory snapshot **offline** and fails on a new critical/high.
3. Validates every licence against the allowlist expression.
4. Hashes `deps.json` + `advisories.json` into the release artefact so a reviewer can reproduce the exact audit later.

This is the only method that satisfies "reproducible offline" in an environment where the registry may be unreachable and the cache is outside the sandbox.

### 8.4 Licence compatibility for a permissively licensed tool

**Assumption:** the tool itself is released under a permissive licence (MIT or Apache-2.0). **REC:** prefer **MIT** for the code and state it in `LICENSE`; if Apache-2.0 is chosen, the `NOTICE` obligation applies to *our* distribution as well as our dependencies'.

| Dependency licence | Safe to depend on? | Obligation if we do | Verification |
|---|---|---|---|
| **MIT** | Yes | Retain copyright + permission notice | CITED — [opensource.org MIT](https://opensource.org/license/mit) |
| **ISC**, **0BSD**, **BSD-2-Clause**, **BSD-3-Clause** | Yes | Retain notice; BSD-3 adds a no-endorsement clause | CITED — SPDX list names/expressions |
| **Apache-2.0** | Yes | Keep a copy of the licence; **retain `NOTICE`** text if the work includes one; state changes to modified files; patent grant is terminated by patent litigation (§3) | **VERIFIED — full text fetched 2026-11-16** ([apache.org/licenses/LICENSE-2.0.txt](https://www.apache.org/licenses/LICENSE-2.0.txt), §4(a)–(d), §3) |
| **MPL-2.0** | Yes, with care | **File-level** copyleft: distributing *Source Code Form* of covered files (including our modifications to them) must be under MPL-2.0 and recipients must be told how to obtain the licence (§3.1); Executable Form must have Source available (§3.2); a **Larger Work** may be under terms of our choice provided MPL obligations are met for the covered files (§3.3); licence notices must not be removed (§3.4). Patent grant §2.1(b); patent-litigation termination §5.2. MPL is GPL/AGPL/LGPL-compatible via the "Secondary License" definition (§1.12) | **VERIFIED — full text fetched 2026-11-16** ([MPL 2.0](https://www.mozilla.org/media/MPL/2.0/index.txt)) |
| **EPL-2.0** | Yes, with care | Reciprocal at the **file/module** level, plus a patent grant with retaliation; source must be made available for modified covered modules | **CITED — clause-level** ([EPL-2.0](https://www.eclipse.org/legal/epl-2.0/)); full text **not** re-read this session → re-verify before relying on it |
| **GPL-2.0 / GPL-3.0** | **No** as a distributed dependency | Strong copyleft would require the combined work to be GPL; incompatible with shipping a permissive-licensed tool | **CITED — clause-level** ([GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html) §5, §6); re-verify before relying on it |
| **AGPL-3.0** | **No**, and worse than GPL for a dev tool | As GPL **plus** §13: users interacting with the program **over a network** must be offered the Corresponding Source. A scanner run in CI or behind a service is exactly that scenario | **CITED — clause-level** ([AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) §13); re-verify before relying on it |
| **CC0-1.0 / Unlicense** | Yes | None, but **no patent grant** — prefer MIT/Apache-2.0 for anything security-relevant | CITED — SPDX |
| **CC-BY-4.0 / CC-BY-SA-4.0** | Only for docs/data, never code | Attribution (and ShareAlike for -SA), which is viral for derived text | CITED — [creativecommons.org](https://creativecommons.org/licenses/by/4.0/) |
| **No licence / "UNLICENSED"** | **No** | All rights reserved by default; do not copy the code | — |
| **Custom / "SEE LICENSE IN"** | Manual review only | — | — |

**REC (`SUP-004`).** The allowlist is an SPDX **expression** check, not a string match:

`MIT OR ISC OR 0BSD OR BSD-2-Clause OR BSD-3-Clause OR Apache-2.0 OR MPL-2.0`

Deny-by-default; `OR`-expressions pass if **any** branch is allowed; `AND`-expressions require **all** branches allowed; unknown identifiers fail closed. Log the exact expression found so a human can adjudicate.

**REC (`SUP-005`).** Note in the docs that GPL/AGPL as a **dev-only, non-distributed** tool (a formatter or test runner used locally and never shipped in the published artefact) is a different analysis from GPL as a runtime dependency, and that if this project ever ships a bundled/single-file build, the dev-dependency boundary disappears. **This is not legal advice; obtain counsel before shipping anything with a non-permissive dependency in the distributed artefact.**

---

## 9. Summary

**Ten non-negotiables**

1. Detect-only by default; `--fix` alone never writes — writing needs `--fix --apply`, and the preconditions in §5.2.
2. No rule may claim WCAG conformance, and no rule may measure LCP/INP/CLS. Causes and potential barriers only.
3. Every accessibility finding carries a mandatory "why this may be a false positive" and a manual verification step.
4. Reliability tier (a/b/c) is declared in the manifest, and the engine refuses to emit findings outside a rule's declared file kinds.
5. Secrets and PII never enter a report: findings are constructed already redacted; no raw mode; excerpt ≤ 120 chars, one line; comments off by default.
6. Zero network calls, ever, by default — enforced by a test that patches the network modules and a CI job with egress blocked.
7. Zero runtime dependencies; dev dependencies are lockfile-pinned, installed with `--ignore-scripts`, and licence-gated by an SPDX expression allowlist.
8. Codemod writes only inside a git repo, only after a clean-tree check, only with a journal written before the first byte, and only for edits on the §5.3 allowlist.
9. Suppression requires a reason; config allowlist entries expire; expired entries fail the build.
10. Post-change verification is recorded per command — never run ⇒ `unavailable`, never "pass".

**Five most likely ways this tool could cause harm**

1. **A confident wrong `innerHTML` → `textContent` rewrite** that silently deletes rendered content, shipped to a repo whose tests are thin.
2. **A false "contrast/alt/target-size failure"** at scale, training teams to disable the tool — the credibility loss generalises to the true findings.
3. **A secret printed into a CI log or an uploaded report** by a scanner that found one and helpfully quoted it.
4. **A scanner DoS or hang** (ReDoS, a 2 GB minified file, a symlink loop, a zip bomb) that blocks a pipeline or, worse, gets allowlisted away permanently.
5. **A hostile repository** that attacks the developer's machine through the tool: symlink escape writing outside the repo, a malicious fixture triggering dependency installation, or a crafted rule-adjacent file exploiting the parser.

**Unresolved**

- Deque's automated-coverage percentage — pages are JS-rendered; the 57% figure is unverified and must not be quoted (§1.2).
- npm provenance flags and `npm audit signatures` semantics — read `docs.npmjs.com` before encoding (§3.12, §8.2).
- Baseline status of the `popover` attribute; `credentialless` COEP support (§1.4.3, §3.13).
- Directives ignored in a `<meta>`-delivered CSP (§3.5).
- EPL-2.0 / GPL-3.0 / AGPL-3.0 obligation wording read at clause level only (§8.4) — and legal review is required regardless.
- Soft-navigation CrUX graduation date (§2.1).
- Which real-world repositories form the regression corpus, and their licences (§7.4).
- Whether the tool's own output format should be SARIF-only, custom-only, or both.

---

## 10. Sources — retrieval status

All retrieved **2026-11-16** unless marked otherwise.

| Source | URL | Status |
|---|---|---|
| WCAG 2.2 Recommendation (12 Dec 2024) | https://www.w3.org/TR/WCAG22/ | FETCHED (body) |
| Understanding SC 2.5.8 Target Size | https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html | FETCHED (body) |
| WebAIM Million 2026 | https://webaim.org/projects/million/ | FETCHED (body) |
| web.dev — Web Vitals | https://web.dev/articles/vitals | FETCHED (partial) |
| web.dev — INP | https://web.dev/articles/inp | FETCHED (body) |
| web-vitals README (thresholds, support matrix) | https://github.com/GoogleChrome/web-vitals | FETCHED (raw) |
| web.dev — INP becomes a CWV | https://web.dev/blog/inp-cwv-launch | CITED (via mirror + secondary) |
| web.dev — CrUX experimental soft navs (13 Oct 2026) | https://web.dev/blog/crux-experimental-soft-navs | CITED (via secondary) |
| OWASP Top 10:2025 | https://top10.owasp.org/2025/ | FETCHED (body) |
| OWASP ASVS 5.0.0 (30 May 2025) | https://asvs.owasp.org/ | FETCHED (body) |
| OWASP WSTG (4.2 stable; 5.0 in dev) | https://owasp.org/www-project-web-security-testing-guide/ | FETCHED (body) |
| CSP Level 3 (WD, 27 Oct 2026) | https://www.w3.org/TR/CSP3/ | FETCHED (status + TOC) |
| MDN — Trusted Types API (Baseline 2026) | https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API | FETCHED (body) |
| MDN — rel="noopener" (implicit for target=_blank) | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noopener | FETCHED (body) |
| Apache License 2.0 | https://www.apache.org/licenses/LICENSE-2.0.txt | FETCHED (full text) |
| Mozilla Public License 2.0 | https://www.mozilla.org/media/MPL/2.0/index.txt | FETCHED (full text) |
| WAI-ARIA 1.2 | https://www.w3.org/TR/wai-aria-1.2/ | CITED |
| ARIA Authoring Practices Guide | https://www.w3.org/WAI/ARIA/apg/ | CITED |
| Understanding WCAG 2.2 (index) | https://www.w3.org/WAI/WCAG22/Understanding/ | CITED |
| EPL-2.0 | https://www.eclipse.org/legal/epl-2.0/ | CITED (clause-level) |
| GPL-3.0 | https://www.gnu.org/licenses/gpl-3.0.html | CITED (clause-level) |
| AGPL-3.0 | https://www.gnu.org/licenses/agpl-3.0.html | CITED (clause-level) |
| SPDX License List | https://spdx.org/licenses/ | CITED |
| MIT licence text | https://opensource.org/license/mit | CITED |
| npm — provenance statements | https://docs.npmjs.com/generating-provenance-statements/ | URL live; body JS-rendered (no text) |
| MDN — COOP / COEP / CORP / HSTS | `developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/…` | CITED (§3.13) |
| Deque automated coverage | https://www.deque.com/automated-accessibility-coverage-report/ | URL live; body JS-rendered (no text) → figure unverified |

