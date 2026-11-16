# Detection backlog — raw pattern inventory

- **Retrieved:** 2026-11-16 (Asia/Calcutta) — every `Retrieved` cell below carries this date.
- **Author:** `legacy-pattern-analyst`
- **Status:** backlog only. No rule catalog, no severity model finalisation, no code. Nothing written outside
  `research/agents/legacy-pattern-analyst/`.
- **Purpose:** supply the raw, verified pattern inventory that a rule catalog is later built from. A row is a
  *candidate*; inclusion here is not a decision to ship it.

## 0. Headline constraint

The tool must **never** flag code for being old. A pattern earns a row only when a primary source states it is
discouraged, removed, unsafe, or measurably harmful — not when it merely looks dated. `<table>` layout and
`var` are here as `legacy`, at severity `low`, mostly so the catalog can *decline* to flag them.

## 1. Classification taxonomy

The brief names seven classes: `deprecated`, `obsolete`, `legacy`, `situational`, `unsupported`, `insecure`,
`inaccessible`. The brief's prose also explicitly targets patterns that are "inefficient, framework-misaligned,
or needlessly complex", which none of the seven express. Four extensions are therefore used, and are marked as
extensions so the catalog owner can collapse or reject them:

| Class | Meaning | Autofix implication |
|---|---|---|
| `deprecated` | A named authoritative source (MDN banner, spec, vendor doc) says deprecated/removed. **The cell names that source.** | Usually safe if mechanical |
| `obsolete` | Still works, no longer suitable in most modern contexts; no source calls it deprecated | Situational at best |
| `legacy` | Older but valid. Low severity by construction | Detect-only |
| `situational` | Valid under stated constraints; a defect only when a stated condition holds | Detect-only |
| `unsupported` | Unavailable in a declared browser/runtime target | Needs target config |
| `insecure` | Bad regardless of age | Rarely safe |
| `inaccessible` | Bad regardless of age | Situational |
| `inefficient` *(ext)* | Rendering/Core Web Vitals cost | Situational |
| `fragile` *(ext)* | Missing error state, race, or failure path | Detect-only |
| `misaligned` *(ext)* | Fights the framework's idiom or documented contract | Detect-only |
| `overengineered` *(ext)* | Needless complexity/indirection, no measured harm | **Never auto-flag** |

Hard rule applied below: **a `deprecated` cell must name the source in the cell itself.** Where no source says
"deprecated", the row says `obsolete` and names the framing source.

## 2. Sources actually fetched this session

Fetched pages are `✅` (opened 2026-11-16, HTTP 200). Rows citing `○` use the canonical path of the same
documentation family but were **not** re-opened this session — link-check before shipping (`scripts/` link check).

| Ref | Source | Status | What it establishes here |
|---|---|---|---|
| S1 | https://developer.mozilla.org/en-US/docs/Web/API/Document/write | ✅ | Banner **"Deprecated"**; WHATWG quote "strongly discouraged"; XSS injection-sink warning |
| S2 | https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/open | ✅ | Page itself Baseline "widely available"; async param note: "many browsers have deprecated synchronous XHR support on the main thread entirely" |
| S3 | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img | ✅ | `alt=""` = decorative; missing/broken-image semantics |
| S4 | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden | ✅ | **"Warning: Do not use aria-hidden="true" on focusable elements."** |
| S5 | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete | ✅ | `off` "will not prevent a password manager from asking the user if they would like to save username and password" |
| S6 | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role | ✅ | "you should generally use `<button>` or `<input>` with `type="button"` instead"; Enter/Space must be hand-handled |
| S7 | https://web.dev/articles/optimize-cls | ✅ | CLS, space reservation |
| S8 | https://react.dev/learn/rendering-lists | ✅ | React 19.3; missing-key console warning |
| S9 | https://react.dev/learn/you-might-not-need-an-effect | ✅ | Redundant state + Effect = "an entire render pass with a stale value"; derive during render |
| S10 | https://nextjs.org/docs/app/api-reference/components/image | ✅ | Next.js "Latest v16.4.6", App Router; `Image` extends `<img>` |
| S11 | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex | ○ (warning text seen via 2026-11-01 mirror) | "use only 0 and -1 … Avoid using tabindex values greater than 0" |
| S12 | https://w3c.github.io/wcag/understanding/target-size-minimum.html | ✅ (search excerpt) | WCAG 2.2 SC 2.5.8, 24×24 CSS px |

## 3. Pattern table

Severity: `blocker` / `high` / `medium` / `low` / `info`. Autofix: `no` / `detect-only` / `safe` / `situational`
(`no` = not mechanically fixable at all; `detect-only` = report, never edit).

### 3.1 Semantic HTML and document structure

| ID | Pattern | Classification | Detection indicator (concrete, static, implementable) | False-positive conditions | Severity | Migration benefit | Compatibility constraint | Safe to autofix? | Primary evidence URL | Retrieved | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SEM-01 | Clickable `<div>`/`<span>` with a click handler and no role | `inaccessible` | JSX/HTML element in {div,span,p,li} + `onClick`/`addEventListener('click')` + no `role` + no `tabIndex` | Element has keyboard handler and role via spread props; component forwards `...rest` | high | Restores Enter/Space activation and AT announcement for free | None — `<button>` is Baseline | situational | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role | 2026-11-16 | High |
| SEM-02 | `<div role="button">` without `keydown` handling | `inaccessible` | `role="button"` on non-button element + no `onKeyDown`/`keydown` handler in the same file | Handler attached on an ancestor via delegation | high | Native button supplies activation semantics | None | situational | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role | 2026-11-16 | High |
| SEM-03 | `<a href="#">` used as an action button | `inaccessible` | `<a>` with `href="#"` or `href="javascript:void(0)"` + click handler that performs no navigation | Genuinely navigational anchor with a real href | medium | Removes phantom history entries and wrong role | None | situational | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a | 2026-11-16 | High |
| SEM-04 | Page layout built from `<table>` | `legacy` (framing: no source deprecates it; obsolete for layout) | `<table>` whose cells contain `role`-less block content, no `<th>`/`<caption>`, plus `cellpadding`/`cellspacing`/`border` | **Data table** — any `<th>`, `<caption>`, `<thead>`, or `scope` present | low | Grid/flex expresses the same layout with reflow support | None | no | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/table | 2026-11-16 | High |
| SEM-05 | Float/clearfix layout | `legacy` | `float:` + `clear:` pairs on siblings forming columns; `.clearfix::after{content:'';clear:both}` | Float used for text wrapping around an image (legitimate) | low | Flow-aware layout, no clearfix hacks | None | no | https://developer.mozilla.org/en-US/docs/Web/CSS/float | 2026-11-16 | High |
| SEM-06 | Heading levels skipped for visual size | `inaccessible` | `h1`→`h4` with no `h2`/`h3` in document order, or heading chosen to match a font size | Headings inside independent `<section>`/`<article>` scopes | medium | Preserves document outline and screen-reader jump order | None | situational | https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html | 2026-11-16 | Medium |
| SEM-07 | Multiple `<h1>` or no `<h1>` | `legacy` — the one-`h1` rule itself is legacy guidance; **FALSE-POSITIVE-PRONE, do not default-on** | Count of `h1` ≠ 1 per page | Nested `<article>`s legitimately each own an `h1`; CMS-rendered titles; modal headings | info | None demonstrated | HTML allows multiple | no | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements | 2026-11-16 | High |
| SEM-08 | `<br>` chains and empty divs for spacing | `legacy` | ≥2 consecutive `<br>`; `<div class="spacer">`; `&nbsp;` runs ≥3 | Email templates (table/`<br>` layout is the only reliable option) | low | Real spacing tokens; survives copy-paste and reflow | None | situational | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/br | 2026-11-16 | High |
| SEM-09 | No landmark regions (`main`/`nav`/`header`) | `inaccessible` | Body subtree renders no `main`, `nav`, `header`, `footer`, `[role=banner/main/navigation]` | Component library supplies landmarks at a level the static scan cannot see — common in Next.js `layout.tsx` | medium | Enables screen-reader landmark navigation | None | detect-only | https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html | 2026-11-16 | Medium |
| SEM-10 | `<iframe>` without `title` | `inaccessible` | `<iframe` with no `title` attribute and no `aria-label` | Decorative iframe with `aria-hidden="true"` | medium | Frame gets an accessible name in the AT rotor | None | safe | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe | 2026-11-16 | High |
| SEM-11 | `<html>` without `lang` | `inaccessible` | Root `<html>` in the rendered document with no `lang` | `lang` set by a framework layout or middleware | medium | Correct pronunciation/locale rules | None | situational | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang | 2026-11-16 | High |
| SEM-12 | `<i>`/`<b>` used for icon glyphs and styling | `legacy` | `<i class="fa…">`/`<b>` with an icon-font class or no text content | Genuinely idiomatic use for typographic emphasis is fine | low | Eliminates screen-reader noise from icon fonts | None | situational | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/i | 2026-11-16 | Medium |

### 3.2 ARIA, focus, dialogs, live regions

| ID | Pattern | Classification | Detection indicator (concrete, static, implementable) | False-positive conditions | Severity | Migration benefit | Compatibility constraint | Safe to autofix? | Primary evidence URL | Retrieved | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ARI-01 | `aria-hidden="true"` on a focusable element or its ancestor | `inaccessible` | `aria-hidden="true"` on an element that is, or contains (by transitive scan), a `button`/`a[href]`/`input`/`[tabindex]` | Client-only tree with no focusable descendant at runtime; SSR-conditional branches | blocker | Removes a named WCAG 4.1.2 failure and lost-focus trap | None | detect-only | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden | 2026-11-16 | High |
| ARI-02 | Redundant role on a native element (`<button role="button">`) | `overengineered` | `role` whose value equals the element's implicit role | Element is a custom element or a `div` (then the role is load-bearing) | low | Slightly smaller DOM, one less thing to desync | None | situational | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role | 2026-11-16 | Medium |
| ARI-03 | Conflicting ARIA states | `inaccessible` | `aria-expanded` on a control with no `aria-controls` and no collapsible target; `aria-checked` on a role that does not support it; both `aria-hidden="true"` and `aria-live` | State managed dynamically in a handler the static scan does not follow | high | AT exposes a truthful state | None | detect-only | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded | 2026-11-16 | Medium |
| ARI-04 | `aria-label` on a non-interactive generic element | `inaccessible` | `aria-label` on `div`/`span`/`p` with no role and no widget behaviour | Element has a widget role, or is a landmark | medium | Label actually reaches the a11y tree | None | detect-only | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-label | 2026-11-16 | Medium |
| ARI-05 | Positive `tabindex` | `inaccessible` | `tabindex` attribute whose integer value ≥ 1 | Positive value mirrors an existing visual order and is documented; roving-tabindex patterns use 0/-1 only | medium | Restores DOM-order focus, the only order AT users expect | None | detect-only | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex | 2026-11-16 | High |
| ARI-06 | `role="presentation"`/`none` on a focusable element | `inaccessible` | `role="presentation"` on element that is or contains a focusable node | Role on a purely decorative wrapper (correct use) | medium | Role is not silently dropped | None | detect-only | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/presentation_role | 2026-11-16 | High |
| ARI-07 | Async status changes never announced | `inaccessible` | State update that replaces visible text (toast/error/save state) with no `role="status"`, `aria-live`, or focus move in the same module | Component renders inside an existing live region; framework toast library supplies one | high | Screen-reader users learn the operation succeeded | None | detect-only | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live | 2026-11-16 | Medium |
| ARI-08 | `aria-live="assertive"` used broadly | `situational` | `aria-live="assertive"` or `role="alert"` on non-error, routine updates | Genuine time-critical errors | low | Stops interrupting AT mid-sentence | None | no | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live | 2026-11-16 | Medium |
| ARI-09 | `aria-labelledby`/`describedby` pointing at a missing id | `inaccessible` | idref resolves to no element in the same document/component tree | Id rendered by a portal or lazily — unresolved statically | medium | Name/description actually resolve | None | detect-only | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-labelledby | 2026-11-16 | Medium |
| ARI-10 | `role="dialog"` without `aria-modal` or `aria-label` | `inaccessible` | `role="dialog"` with neither `aria-modal` nor a name (`aria-label`/`aria-labelledby`) | Native `<dialog open>` with `showModal()` — browser supplies modality | high | Dialog announced with a name and correct modality | None | detect-only | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/dialog_role | 2026-11-16 | Medium |
| FOC-01 | Modal with no focus trap | `inaccessible` | Overlay component with `aria-modal`/`role="dialog"` but no `keydown` Tab handler, no `inert` on siblings, no focus-trap dependency | Uses native `<dialog>` + `showModal()`, or `<dialog>`-based library | blocker | Keyboard users cannot fall out of the dialog into the page behind | `<dialog>`: Baseline; `inert`: check target | detect-only | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog | 2026-11-16 | Medium |
| FOC-02 | Focus not returned to the trigger on close | `inaccessible` | Open handler stores no element ref; close path calls no `.focus()` | Focus restored by the dialog library | high | Users resume where they were | None | detect-only | https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ | 2026-11-16 | Medium |
| FOC-03 | `outline: none` / `outline: 0` with no replacement | `inaccessible` | `outline: none`/`0` on `:focus` or `:focus-visible` with no `box-shadow`/`border`/`background` change in the same rule block | Replacement focus style defined in an adjacent rule or token file | blocker | Restores keyboard position visibility (WCAG 2.4.7) | None | detect-only | https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html | 2026-11-16 | High |
| FOC-04 | `:hover` styled with no `:focus-visible` counterpart | `inaccessible` | A `:hover` rule on an interactive selector with no `:focus`/`:focus-visible` rule for the same selector | Hover is decorative only (colour shift on a non-interactive card) | medium | Same affordance for keyboard | `:focus-visible` Baseline | situational | https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible | 2026-11-16 | Medium |
| FOC-05 | SPA route change does not move focus or announce | `inaccessible` | Router navigation in a client component with no `useEffect` focus/`document.title` update | App is a single view with no route changes | medium | Screen-reader users know the page changed | None | detect-only | https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html | 2026-11-16 | Low |
| FOC-06 | `aria-expanded` never toggled on a disclosure | `inaccessible` | Button toggles a panel via state, but `aria-expanded` is hard-coded or absent | Panel is a native `<details>` | medium | State exposed to AT | None | situational | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded | 2026-11-16 | Medium |
| MOT-01 | No `prefers-reduced-motion` guard on large motion | `situational` | `animation`/`transition` with translate/scale/parallax, no `@media (prefers-reduced-motion: reduce)` block | Motion is a ≤150 ms opacity fade | medium | Honours a stated user preference (WCAG 2.3.3) | Baseline | situational | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion | 2026-11-16 | High |
| MOT-02 | Infinite animation with no pause control | `inaccessible` | `animation: … infinite` on content that runs >5 s with no pause/stop UI | Loading spinners (essential, conventionally exempt) | medium | WCAG 2.2.2 compliance | None | detect-only | https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html | 2026-11-16 | Medium |
| MOT-03 | Animating layout properties | `inefficient` | `transition`/`@keyframes` on `top`, `left`, `width`, `height`, `margin` | Deliberate layout animation with no compositor alternative | medium | Moves work off layout into composite | None | situational | https://web.dev/articles/animations-guide | 2026-11-16 | Medium |

### 3.3 Forms

| ID | Pattern | Classification | Detection indicator (concrete, static, implementable) | False-positive conditions | Severity | Migration benefit | Compatibility constraint | Safe to autofix? | Primary evidence URL | Retrieved | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FRM-01 | Input with no associated label | `inaccessible` | `<input>` (text-like) with no `id` matched by a `<label for>`, no wrapping `<label>`, no `aria-label`/`aria-labelledby` | Label rendered by a design-system `Field` wrapper | high | Every field gets a name | None | detect-only | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label | 2026-11-16 | High |
| FRM-02 | Placeholder as the only label | `inaccessible` | Input with `placeholder` and no label mechanism (per FRM-01) | Search box with `aria-label` and a visible icon button | high | Label persists after typing | None | situational | https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html | 2026-11-16 | High |
| FRM-03 | `autocomplete="off"` on username/password/email | `obsolete` (framing: MDN note that it does not stop password managers) | `autocomplete="off"` on input whose `type` is `password`, or `name`/`id` matches `user/email/login/pass` | Genuinely sensitive non-auth field (OTP, one-time token) that must not be saved | medium | Password managers and autofill work; fewer failed logins | None | situational | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete | 2026-11-16 | High |
| FRM-04 | Wrong `type`/`inputmode` on mobile numeric entry | `situational` | `type="text"` on a field whose name matches `phone/zip/postal/otp/card/cvc`; no `inputmode` | Field legitimately accepts alphanumerics (e.g. international postcodes) | low | Correct mobile keyboard, fewer input errors | `inputmode` Baseline | safe | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode | 2026-11-16 | Medium |
| FRM-05 | Validation errors not programmatically linked | `inaccessible` | Error message rendered as sibling text with no `aria-describedby` link and no `aria-invalid` on the input | Error library wires both | high | AT announces which field failed and why | None | detect-only | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid | 2026-11-16 | Medium |
| FRM-06 | Submit handler without `preventDefault` | `fragile` | `<form onSubmit={fn}>` where `fn` never calls `preventDefault` and no `action` is set | `action` is set deliberately (progressive enhancement) | medium | No accidental full-page navigation | None | detect-only | https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault | 2026-11-16 | Medium |
| FRM-07 | `type` omitted on `<button>` inside a form | `situational` | `<button>` with no `type` inside a `<form>` | Intended submit button (the common, correct case) | low | Prevents accidental submits from "Cancel" | None | situational | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button | 2026-11-16 | High |
| FRM-08 | Custom control reimplementing `<select>`/`<input type=checkbox>` | `inaccessible` | `role="combobox"`/`listbox`/`checkbox` on a `div` with no keyboard handler set | Headless library (Radix/Headless UI) provides the contract | high | Native keyboard, form participation, AT support | None | no | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/combobox_role | 2026-11-16 | Medium |
| FRM-09 | Enter-key submit suppressed to force a click | `inaccessible` | `onKeyDown` returning early for `Enter`, or `type="button"` on the only submit control | Multi-step wizard intentionally deferring submit | medium | Keyboard parity | None | no | https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html | 2026-11-16 | Medium |
| FRM-10 | Missing `name` on a submitted field | `fragile` | `<input>`/`<select>`/`<textarea>` inside a `<form>` with no `name` | Value read from React state instead (controlled form) | low | Native form submission/autofill works | None | situational | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/name | 2026-11-16 | High |
| FRM-11 | `novalidate` with no replacement validation | `situational` | `noValidate`/`novalidate` on `<form>` with no validation library or custom checks | Custom validation is implemented (the intended use) | low | Constraint validation restored | None | detect-only | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/novalidate | 2026-11-16 | Medium |
| FRM-12 | `autocomplete="off"` on the whole `<form>` | `obsolete` | `autocomplete="off"` on `<form>` in a checkout/address flow | Genuinely non-user-data form (calculator) | low | Address/CC autofill works | None | situational | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete | 2026-11-16 | Medium |

### 3.4 Images, media, loading

| ID | Pattern | Classification | Detection indicator (concrete, static, implementable) | False-positive conditions | Severity | Migration benefit | Compatibility constraint | Safe to autofix? | Primary evidence URL | Retrieved | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| IMG-01 | `<img>` with no `alt` attribute | `inaccessible` | `<img`/JSX `<img` with no `alt` prop and no `{...spread}` | `alt` injected by a wrapper component; decorative image using `role="presentation"` | high | AT gets a description or correctly skips it | None | situational | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img | 2026-11-16 | High |
| IMG-02 | `alt` text that is a filename or "image of…" | `inaccessible` | `alt` value matches `\.(png/jpe?g/svg/webp/gif)$` case-insensitively, or starts with "image of"/"picture of" | Genuinely a file-listing where the filename is the content | low | Meaningful alternative text | None | no | https://www.w3.org/WAI/tutorials/images/ | 2026-11-16 | Medium |
| IMG-03 | `<img>` without `width`/`height` | `inefficient` | `<img` with `width` and `height` both absent (and no CSS `aspect-ratio` on a class the scan can resolve) | Image is inside a fixed-size container; `next/image` with `fill`; SVG with intrinsic `viewBox` | medium | Reserves space before load — direct CLS reduction | None | situational | https://web.dev/articles/optimize-cls | 2026-11-16 | High |
| IMG-04 | `loading="lazy"` on the LCP image | `inefficient` | `loading="lazy"` on an `<img>` that is the first/hero image in the document, or in the first viewport component | Long pages where the "hero" is below the fold on small screens | medium | Earlier LCP discovery | `loading` Baseline | detect-only | https://web.dev/articles/lcp | 2026-11-16 | Medium |
| IMG-05 | No `srcset`/`sizes` for content images | `situational` | `<img src="…">` with no `srcset`, image served >~2× its rendered box | Art-directed or icon-sized images | low | Fewer bytes on mobile | Baseline | no | https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images | 2026-11-16 | Medium |
| MED-01 | `<video>`/`<audio>` without captions track | `inaccessible` | `<video>` with speech content and no `<track kind="captions"` child | Silent/looping decorative video with no speech | blocker | WCAG 1.2.2 compliance | `<track>` Baseline | no | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/track | 2026-11-16 | High |
| MED-02 | `autoplay` without `muted` | `situational` | `<video autoplay>` with no `muted` and no `playsInline` | Autoplay is user-initiated after a gesture | low | Actually autoplays; no surprise audio | `autoplay` policy varies by engine | safe | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video | 2026-11-16 | Medium |
| MED-03 | Media element with no `controls` | `inaccessible` | `<video>`/`<audio>` with no `controls` and no custom control UI in the module | Purely decorative background video | high | Users can pause/seek/volume | None | situational | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video | 2026-11-16 | High |
| MED-04 | Single legacy codec, no fallback source | `situational` | One `<source>` with `video/mp4` only, no WebM/AV1 alternative | MP4/H.264 is universal — a valid single-source choice | low | Marginal; often not worth changing | Codec support varies by browser build (esp. Linux) | no | https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Video_codecs | 2026-11-16 | Low |
| MED-05 | `preload="auto"` on every media element | `inefficient` | `preload="auto"` on media not in the first viewport | Above-the-fold hero video | low | Less contention for LCP bandwidth | None | situational | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video | 2026-11-16 | Medium |
| MED-06 | Content image delivered as CSS `background-image` | `inaccessible` | `background-image: url(...)` on a selector whose element carries no text/alt equivalent | Purely decorative texture | medium | Image becomes discoverable and describable | None | no | https://www.w3.org/WAI/tutorials/images/decision-tree/ | 2026-11-16 | Medium |

### 3.5 Metadata, canonicalisation, SEO

| ID | Pattern | Classification | Detection indicator (concrete, static, implementable) | False-positive conditions | Severity | Migration benefit | Compatibility constraint | Safe to autofix? | Primary evidence URL | Retrieved | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MET-01 | `user-scalable=no` / `maximum-scale=1` | `inaccessible` | viewport meta containing `user-scalable=no` or `maximum-scale` < 5 | Never legitimate for general content | blocker | Restores pinch-zoom (WCAG 1.4.4) | None | safe | https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Viewport_meta_element | 2026-11-16 | High |
| MET-02 | Missing or duplicate `<title>` | `inaccessible` | No `<title>`, empty `<title>`, or the same literal title across route files | Title set dynamically per route at runtime | medium | WCAG 2.4.2; usable browser history | None | situational | https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html | 2026-11-16 | Medium |
| MET-03 | No canonical URL on filterable/paginated routes | `situational` | Route file rendering from `searchParams` with no `alternates.canonical` | App is auth-only / not indexed | low | Consolidates duplicate signals | None | no | https://nextjs.org/docs/app/api-reference/functions/generate-metadata | 2026-11-16 | Medium |
| MET-04 | Social metadata incomplete | `situational` | No `og:title`/`og:image`, or `twitter:card` without `twitter:image` | Internal tool, no sharing surface | low | Correct link previews | None | situational | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta | 2026-11-16 | Medium |
| MET-05 | Primary content client-rendered only | `inefficient` | Page component fetches in `useEffect` and renders the main text after mount | Authenticated dashboard (not indexed) | medium | Crawlable HTML plus faster first paint | None | no | https://web.dev/articles/rendering-on-the-web | 2026-11-16 | Medium |
| MET-06 | JSON-LD `@type` mismatched with visible content | `situational` | JSON-LD block whose `@type` has required fields absent from the rendered DOM | Rich result type is legitimately experimental | low | Eligible for rich results | None | no | https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data | 2026-11-16 | Low |
| MET-07 | `noindex` present in a production-bound template | `situational` | `robots` meta/header containing `noindex` outside a preview branch | Staging/preview deploys use the same template — very common and correct | medium | Prevents accidental de-indexing | None | detect-only | https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag | 2026-11-16 | Medium |

### 3.6 CSS architecture, layout, colour

| ID | Pattern | Classification | Detection indicator (concrete, static, implementable) | False-positive conditions | Severity | Migration benefit | Compatibility constraint | Safe to autofix? | Primary evidence URL | Retrieved | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CSS-01 | `100vh` full-height hero | `obsolete` | `height`/`min-height: 100vh` on a first-viewport section | No mobile target; `100vh` inside a desktop-only kiosk app | medium | Eliminates the mobile URL-bar overflow/scroll trap | `dvh`/`svh` — check target Baseline | situational | https://web.dev/blog/viewport-units | 2026-11-16 | Medium |
| CSS-02 | Fixed pixel breakpoints only | `situational` | Only `@media (max-width: NNNpx)` with no `min-width`, no `em`, no container query | Design system defines a fixed set of px breakpoints deliberately | low | Fluid behaviour between breakpoints | `@container` — check target | no | https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries | 2026-11-16 | Medium |
| CSS-03 | Component layout driven by global viewport media queries | `situational` | Card/sidebar component with `@media` rules keyed to viewport, reused in narrow columns | Component is only ever used at one width | low | Correct layout in sidebars/dialogs | `@container` Baseline (2023) | no | https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries | 2026-11-16 | Medium |
| CSS-04 | `font-size` in `vh`/`vw` only | `inaccessible` | `font-size` with a `vh`/`vw` value and no `rem`/`clamp()` floor | Fully fluid display type with a clamp floor already present | medium | Survives zoom (WCAG 1.4.4) | None | detect-only | https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html | 2026-11-16 | High |
| CSS-05 | Low-contrast body text | `inaccessible` | Declared `color`/`background` pair below 4.5:1 computed from literal values | Colour comes from a token/theme the scan cannot resolve; text is ≥24px (3:1 applies) | medium | WCAG 1.4.3 compliance | None | no | https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html | 2026-11-16 | Medium |
| CSS-06 | `!important` used to win specificity fights | `overengineered` | Count of `!important` above a threshold, or in non-utility files | Utility/override layer where it is the documented convention | low | Cascade becomes predictable | None | no | https://developer.mozilla.org/en-US/docs/Web/CSS/important | 2026-11-16 | Low |
| CSS-07 | `@import` inside CSS for critical styles | `inefficient` | `@import` in a stylesheet that blocks the initial render | Small non-critical import | low | Removes a serial request chain | None | situational | https://developer.mozilla.org/en-US/docs/Web/CSS/@import | 2026-11-16 | Medium |
| CSS-08 | Physical properties for direction-sensitive layout | `situational` | `margin-left`/`padding-right`/`left:`/`text-align: left` in a codebase declaring RTL support | No RTL/i18n requirement | low | RTL works without overrides | Logical properties Baseline | situational | https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values | 2026-11-16 | Medium |
| CSS-09 | No cascade layers in a large, multi-origin stylesheet set | `situational` | >1 stylesheet origin (reset, vendor, app, utilities) with escalating specificity/`!important` | Single-file small app | low | Predictable override order | `@layer` Baseline (2022) | no | https://developer.mozilla.org/en-US/docs/Web/CSS/@layer | 2026-11-16 | Medium |
| CSS-10 | Missing `box-sizing: border-box` reset | `legacy` | No `box-sizing` declaration anywhere in the resolved CSS | A framework reset already applies it | low | Width calculations match designer intent | None | situational | https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing | 2026-11-16 | Medium |
| CSS-11 | `overflow: hidden` on `body` to fake scroll lock | `situational` | `document.body.style.overflow = 'hidden'` / `overflow:hidden` on `body` when a modal opens | No scroll needed behind the overlay | low | No layout jump, no lost scroll position | `scrollbar-gutter` varies | situational | https://developer.mozilla.org/en-US/docs/Web/CSS/overflow | 2026-11-16 | Low |
| CSS-12 | Fixed `height` on flex/grid children holding text | `situational` | `height: Npx` on a container whose children include a `<p>`/`<h2>` | Deliberate fixed-ratio media box | medium | Text does not clip at 200% zoom / large fonts | None | detect-only | https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html | 2026-11-16 | Medium |

### 3.7 JavaScript: DOM, events, network, browser APIs

| ID | Pattern | Classification | Detection indicator (concrete, static, implementable) | False-positive conditions | Severity | Migration benefit | Compatibility constraint | Safe to autofix? | Primary evidence URL | Retrieved | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| JS-01 | `document.write()` | `deprecated` — MDN page banner "Deprecated" + WHATWG "strongly discouraged" | Call expression `document.write(` / `document.writeln(` | Third-party legacy ad/analytics snippet the project cannot change | high | Removes parser interference, page-clearing, and an XSS sink | None | no | https://developer.mozilla.org/en-US/docs/Web/API/Document/write | 2026-11-16 | High |
| JS-02 | `innerHTML` assigned untrusted data | `insecure` | `innerHTML =` / `dangerouslySetInnerHTML` where the RHS is a variable, template literal with interpolation, or fetch result — and no sanitiser call in the same expression | RHS is a string literal; RHS passes through DOMPurify/sanitize-html | blocker | Removes the primary DOM XSS sink | Trusted Types where enforced | no | https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML | 2026-11-16 | High |
| JS-03 | `insertAdjacentHTML`/`outerHTML`/`document.write` with untrusted input | `insecure` | Same taint heuristic as JS-02 on `insertAdjacentHTML(`, `outerHTML =`, `document.write(` | Static literal markup | high | Same class of fix | None | no | https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML | 2026-11-16 | High |
| JS-04 | `eval` / `new Function` | `insecure` | `eval(`, `new Function(`, `setTimeout("…")`, `setInterval("…")` | Test harness or a documented sandbox with a CSP nonce | blocker | Removes arbitrary-code execution; unblocks strict CSP | None | no | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval | 2026-11-16 | High |
| JS-05 | `javascript:` URL in `href`/`src` | `insecure` | Attribute or JSX prop value matching `^\s*javascript:` | None | blocker | Removes an XSS vector and CSP violation | None | safe (to `#` + handler) | https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/javascript | 2026-11-16 | High |
| JS-06 | Synchronous XHR on the main thread | `deprecated` — MDN: "many browsers have deprecated synchronous XHR support on the main thread entirely" | `new XMLHttpRequest()` + `.open(..., false)` | Code runs in a Worker (synchronous XHR is permitted there) | high | No main-thread block; page stays interactive | None | no | https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/open | 2026-11-16 | High |
| JS-07 | `attachEvent`/`detachEvent` | `obsolete` | Identifier `attachEvent`/`detachEvent` | None | low | Uses `addEventListener` | None | safe | https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener | 2026-11-16 | High |
| JS-08 | Inline `onclick="…"` handler attributes | `legacy` (framing: CSP-unfriendly, not deprecated) | Regex `\son[a-z]+\s*=\s*["']` in server-rendered/template HTML | Email templates; a framework that emits them is out of scope | medium | Enables a strict CSP without `unsafe-inline` | None | no | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/onclick | 2026-11-16 | High |
| JS-09 | `fetch` without an `ok`/status check | `fragile` | `await fetch(` whose result is used with `.json()` and no `res.ok`/`status` branch | Wrapper client that throws on non-2xx | high | 4xx/5xx stop being silently parsed as data | None | detect-only | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch | 2026-11-16 | High |
| JS-10 | `fetch` in an effect with no abort/cleanup | `fragile` | `useEffect` (or a mount hook) containing `fetch`/`await` with no `AbortController` and no cancellation flag returned | A library (SWR/TanStack Query) owns the request | high | No setState-after-unmount races, no stale-response overwrite | None | detect-only | https://react.dev/reference/react/useEffect | 2026-11-16 | Medium |
| JS-11 | `postMessage` without an `origin` check | `insecure` | `addEventListener('message', h)` where `h` never reads `event.origin` | Origin validated in an upstream handler | high | Blocks cross-origin message spoofing | None | no | https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage | 2026-11-16 | High |
| JS-12 | `window.open`/`location =` with an unvalidated user URL | `insecure` | Assignment from a variable to `location.href`/`window.location`; `window.open(variable)` with no allowlist | Value is an app-owned constant map | high | Prevents open redirect and `javascript:` injection | None | no | https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html | 2026-11-16 | Medium |
| JS-13 | `target="_blank"` without `rel="noopener"` | `situational` — **FALSE-POSITIVE-PRONE, do not default-on** | `<a target="_blank">` with no `rel` containing `noopener` | Modern engines imply `noopener` for `target="_blank"`; only very old targets are exposed, and `noreferrer` is a privacy choice not a fix | info | Negligible on Baseline targets | Implied since ~2021 across engines | no | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noopener | 2026-11-16 | Medium |
| JS-14 | `scroll`/`resize` listener without `passive` or throttle | `inefficient` | `addEventListener('scroll'` with no `{passive:true}` and no rAF/throttle wrapper | Handler does not touch layout | low | Fewer main-thread stalls (INP) | `passive` Baseline | situational | https://web.dev/articles/uses-passive-event-listeners | 2026-11-16 | Medium |
| JS-15 | Observer created without `disconnect`/`unobserve` cleanup | `fragile` | `new (MutationObserver/ResizeObserver/IntersectionObserver)` with no `disconnect()`/`unobserve()` in the same module | Observer intentionally lives for the page lifetime | low | No leaked observers on route change | None | situational | https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver | 2026-11-16 | Medium |
| JS-16 | `setInterval` for UI polling with no clear | `fragile` | `setInterval(` with no `clearInterval` in cleanup | Global heartbeat owned by the app shell | low | No duplicate timers after remount | None | situational | https://developer.mozilla.org/en-US/docs/Web/API/setInterval | 2026-11-16 | Medium |
| JS-17 | `JSON.parse` on network/localStorage data with no guard | `fragile` | `JSON.parse(` outside a `try` block, argument not a literal | Input is a literal or already validated | low | Corrupt storage no longer crashes render | None | situational | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse | 2026-11-16 | Medium |
| JS-18 | Manual query-string concatenation | `fragile` | String concatenation with `'?'`/`'&'` building a URL | URL built once from constants | low | Correct encoding of every parameter | None | safe | https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams | 2026-11-16 | Medium |
| JS-19 | Browser sniffing via `navigator.userAgent` | `obsolete` | `navigator.userAgent` used in a conditional branch | Analytics that deliberately records the UA string | medium | Feature detection instead of guesses | None | no | https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgent | 2026-11-16 | Medium |
| JS-20 | `for…in` iterating an array | `obsolete` | `for (` … ` in ` … `)` where the iterated binding is an array literal/known array | Iterating object keys (correct use) | low | No prototype-chain surprises, ordered iteration | None | safe | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in | 2026-11-16 | High |
| JS-21 | `var` in newly written code | `legacy` | `var ` declaration | Generated/vendored file; legacy script intentionally non-module | info | Block scoping | None | no | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var | 2026-11-16 | High |
| JS-22 | `==` loose equality | `legacy` — **FALSE-POSITIVE-PRONE** | `==`/`!=` excluding `== null` idiom | `x == null` is the idiomatic null-or-undefined check | info | Marginal | None | no | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Equality | 2026-11-16 | High |
| JS-23 | Unawaited promise inside `forEach` | `fragile` | `forEach(async` or `forEach(` whose callback body contains `await` | Deliberate fire-and-forget with per-item error handling | medium | Real sequencing and error propagation | None | no | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach | 2026-11-16 | High |

### 3.8 Web Components

| ID | Pattern | Classification | Detection indicator (concrete, static, implementable) | False-positive conditions | Severity | Migration benefit | Compatibility constraint | Safe to autofix? | Primary evidence URL | Retrieved | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| WC-01 | Custom element name without a hyphen | `fragile` | `customElements.define('name'` where `name` contains no `-` | None — the spec requires a hyphen | medium | Definition stops throwing | None | safe | https://html.spec.whatwg.org/multipage/custom-elements.html | 2026-11-16 | High |
| WC-02 | `super()` omitted or called after `this` | `fragile` | Class extending `HTMLElement` whose constructor touches `this` before `super()` | No constructor defined | medium | Element constructs | None | no | https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements | 2026-11-16 | High |
| WC-03 | Form control custom element without `ElementInternals` | `inaccessible` | Custom element with an internal `<input>` that is not form-associated (`static formAssociated`) | Element is not a form control | medium | Participates in form submission and validation | `ElementInternals` — check target | no | https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals | 2026-11-16 | Medium |
| WC-04 | Shadow DOM input with no label association | `inaccessible` | `<input>` inside `attachShadow` with no `<label for>` or `aria-label` in the same shadow root | Host supplies `aria-label` via slot | medium | Field is named | None | detect-only | https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM | 2026-11-16 | Medium |
| WC-05 | `connectedCallback` doing SSR-unsafe DOM work | `fragile` | `connectedCallback` referencing `window`/`document`/`localStorage` with no guard | Component never server-rendered | low | Hydration does not throw | None | no | https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements | 2026-11-16 | Medium |
| WC-06 | Component reaching into a shadow root from outside | `overengineered` | `shadowRoot.querySelector` from a different module | Debug tooling or tests | low | Encapsulation preserved | None | no | https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM | 2026-11-16 | Low |

### 3.9 React

| ID | Pattern | Classification | Detection indicator (concrete, static, implementable) | False-positive conditions | Severity | Migration benefit | Compatibility constraint | Safe to autofix? | Primary evidence URL | Retrieved | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| REA-01 | List rendered with no `key` | `misaligned` | `.map(` returning JSX with no `key` prop on the outermost returned element | Children are static JSX (not a mapped list) | medium | Correct reconciliation; silences React's own warning | React 18+/19 | situational | https://react.dev/learn/rendering-lists | 2026-11-16 | High |
| REA-02 | Array index used as `key` for a reorderable/insertable list | `fragile` | `key={index}`/`key={i}` where the list can be filtered, sorted, prepended to, or has inputs | List is static, never reordered, and has no per-item state — the correct case | medium | Preserves input state and avoids wrong-item reuse | None | detect-only | https://react.dev/learn/rendering-lists | 2026-11-16 | High |
| REA-03 | `Math.random()`/`Date.now()` as `key` | `fragile` | `key={` with `Math.random`/`Date.now`/`crypto.randomUUID` in the expression | Data has no stable id and identity is intentionally per-render | medium | Stops full remount of the list every render | None | no | https://react.dev/learn/rendering-lists | 2026-11-16 | High |
| REA-04 | State derived from props/state inside `useEffect` | `inefficient` | `useEffect(` whose body is only `setX(...)` derived from props/other state | Genuinely syncing an external system | medium | Removes a whole extra render pass with stale UI (verbatim react.dev) | None | no | https://react.dev/learn/you-might-not-need-an-effect | 2026-11-16 | High |
| REA-05 | `useEffect` used to handle a user event | `misaligned` | Effect triggered by a flag set in an event handler, doing the side effect | The side effect must run after commit for layout reasons | low | Simpler, no double-fire in Strict Mode | None | no | https://react.dev/learn/you-might-not-need-an-effect | 2026-11-16 | High |
| REA-06 | `eslint-disable` on the exhaustive-deps rule | `fragile` | `// eslint-disable-next-line react-hooks/exhaustive-deps` | Deliberate, documented one-shot mount effect | medium | Eliminates stale-closure bugs | None | no | https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps | 2026-11-16 | Medium |
| REA-07 | `useMemo`/`useCallback` wrapping a trivial value | `overengineered` | `useMemo(() =>` whose body is arithmetic, a string concat, or a literal; `useCallback` with empty deps on a non-passed-down function | Value is passed to a memoised child or a dep array — then it is load-bearing | info | Less code; React Compiler makes it redundant | React Compiler availability | no | https://react.dev/reference/react/useMemo | 2026-11-16 | Medium |
| REA-08 | Unmemoised provider `value` object | `inefficient` | `value={{ … }}` or `value={[ … ]}` inline on a Context provider | Provider has no consumers below a memo boundary | low | Stops re-rendering every consumer | None | situational | https://react.dev/reference/react/useContext | 2026-11-16 | Medium |
| REA-09 | `dangerouslySetInnerHTML` with non-constant content | `insecure` | `dangerouslySetInnerHTML={{ __html: X }}` where `X` is not a literal string | `X` is the output of a sanitiser (DOMPurify) — **correct usage, must not flag** | blocker | Removes a React-specific XSS footgun | None | no | https://react.dev/reference/react-dom/components/common | 2026-11-16 | High |
| REA-10 | Controlled input with `value` and no `onChange` | `fragile` | `value={` on `input`/`select`/`textarea` with no `onChange`/`onInput` | Paired with `readOnly` | medium | Field becomes editable | None | no | https://react.dev/reference/react-dom/components/input | 2026-11-16 | High |
| REA-11 | State mutated in place | `fragile` | `state.push(`/`.splice(`/`.sort(`/property assignment on a state variable | State holds a deliberately mutable ref/class instance | high | Re-renders actually happen | None | no | https://react.dev/learn/updating-objects-in-state | 2026-11-16 | High |
| REA-12 | `setState` called during render | `fragile` | `set[A-Z]\w*(` at the top level of a component body, outside an effect/handler | Render-phase update pattern with an explicit guard | high | No infinite render loop | None | no | https://react.dev/reference/react/useState | 2026-11-16 | Medium |
| REA-13 | No error boundary around an async/data subtree | `fragile` | Route/subtree using Suspense or throwing fetches with no `error.js`/`ErrorBoundary` | The app-level boundary is defined one level up | medium | A thrown render error degrades one region, not the page | None | no | https://react.dev/reference/react/Component | 2026-11-16 | Medium |
| REA-14 | Ref mutated during render | `fragile` | Assignment to `ref.current` at component top level | Initialisation idiom `if (ref.current == null) ref.current = …` | medium | No tearing under concurrent rendering | None | no | https://react.dev/reference/react/useRef | 2026-11-16 | Medium |
| REA-15 | `useLayoutEffect` in a server-rendered component | `misaligned` | `useLayoutEffect(` in a file rendered on the server | Client-only component | low | Removes the SSR warning | None | situational | https://react.dev/reference/react/useLayoutEffect | 2026-11-16 | Medium |
| REA-16 | `<a href>` for in-app navigation | `misaligned` | `<a href="/internal-path">` in a Next.js/React Router app | External link, download, or deliberately full reload | low | Client-side nav, prefetch, no full reload | Framework router | no | https://nextjs.org/docs/app/api-reference/components/link | 2026-11-16 | Medium |
| REA-17 | `defaultProps` on a function component | `legacy` (framing: React moved to default parameters) | `Component.defaultProps =` on a function component | Class component (still supported) | low | Works with React 19 type/runtime behaviour | React 19 | situational | https://react.dev/blog/2024/04/25/react-19-upgrade-guide | 2026-11-16 | Medium |
| REA-18 | `React.FC` relying on implicit `children` | `legacy` | `React.FC<Props>` where the body reads `props.children` and `Props` declares none | `Props` explicitly includes `children` | low | Type-correct children | React 18 types | situational | https://react.dev/learn/typescript | 2026-11-16 | Low |

### 3.10 Next.js

| ID | Pattern | Classification | Detection indicator (concrete, static, implementable) | False-positive conditions | Severity | Migration benefit | Compatibility constraint | Safe to autofix? | Primary evidence URL | Retrieved | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| NXT-01 | `'use client'` at the root layout / on most files | `misaligned` | `'use client'` in `app/layout.tsx`, or in >~60% of files under `app/` | Whole app is genuinely interactive (editor, canvas tool) | medium | Server Components stay the default; smaller client bundle | App Router only | detect-only | https://nextjs.org/docs/app/getting-started/server-and-client-components | 2026-11-16 | Medium |
| NXT-02 | `getServerSideProps`/`getStaticProps` in the App Router | `misaligned` | Export named `getServerSideProps`/`getStaticProps` in a file under `app/` | File is under `pages/` (Pages Router — correct) | high | App Router data fetching and streaming | App Router | no | https://nextjs.org/docs/app/getting-started/fetching-data | 2026-11-16 | High |
| NXT-03 | Raw `<img>` for content images in a Next.js app | `inefficient` | `<img ` in `app/`/`components/` of a project depending on `next` | `next.config` sets `images.unoptimized: true`; SVG/small icon; deliberate static export | medium | Automatic sizing/format/lazy behaviour | `next/image` | situational | https://nextjs.org/docs/app/api-reference/components/image | 2026-11-16 | Medium |
| NXT-04 | Google Fonts `<link>` instead of `next/font` | `inefficient` | `<link href="https://fonts.googleapis.com` in a Next.js app | Fonts self-hosted already | low | No render-blocking third-party request, no layout shift | `next/font` | safe | https://nextjs.org/docs/app/api-reference/components/font | 2026-11-16 | Medium |
| NXT-05 | `Date.now()`/`Math.random()`/`new Date()` in render output | `fragile` | These calls in a component body or JSX that reaches the DOM | Inside an effect or an event handler (correct) | high | Eliminates hydration mismatch | None | no | https://nextjs.org/docs/messages/react-hydration-error | 2026-11-16 | High |
| NXT-06 | `localStorage`/`window`/`document` read during render | `fragile` | Bare `window.`/`document.`/`localStorage.` at module scope or in a component body (not inside `useEffect`) | Component is client-only and never SSR'd (`dynamic(..., {ssr:false})`) | high | Eliminates hydration mismatch and SSR crash | None | no | https://nextjs.org/docs/messages/react-hydration-error | 2026-11-16 | High |
| NXT-07 | `searchParams` used without validation/coercion | `fragile` | `searchParams.` value passed to a query, index, or `parseInt` with no schema/guard | Value is displayed as text only | medium | Untrusted input cannot crash or inject | Next.js documents `searchParams` as untrusted | detect-only | https://nextjs.org/docs/app/api-reference/file-conventions/page | 2026-11-16 | Medium |
| NXT-08 | `cookies()`/`headers()`/`params` treated as synchronous | `misaligned` | `const c = cookies()` then `c.get(...)` without `await` | Next.js version < 15 | high | Correct in Next 15+/16 | Next 15+ async request APIs | safe (`await`) | https://nextjs.org/docs/app/guides/upgrading/version-15 | 2026-11-16 | Medium |
| NXT-09 | Stale assumption that `fetch` is cached by default | `misaligned` | `fetch(` with no `cache`/`next.revalidate` in a server component that expects caching | Next.js < 15 | medium | Predictable freshness | Next 15 changed the default to no-store | detect-only | https://nextjs.org/docs/app/getting-started/caching | 2026-11-16 | Medium |
| NXT-10 | Mutation with no revalidation | `fragile` | Server Action/route handler writing data with no `revalidatePath`/`revalidateTag`/`router.refresh` | Data is not rendered from a cache | medium | UI reflects the write | None | no | https://nextjs.org/docs/app/getting-started/revalidating | 2026-11-16 | Medium |
| NXT-11 | Secret exposed via `NEXT_PUBLIC_` | `insecure` | `NEXT_PUBLIC_`-prefixed env var whose name matches `SECRET/KEY/TOKEN/PASSWORD/PRIVATE` | Value is genuinely public (publishable key, public URL) | blocker | Secret stays server-side | None | no | https://nextjs.org/docs/app/guides/environment-variables | 2026-11-16 | High |
| NXT-12 | Route handler with no auth/authorisation check | `insecure` | `app/**/route.ts` export (`GET`/`POST`/…) with no session/auth call before reading/writing | Public endpoint by design | blocker | Closes an IDOR/authz gap | None | no | https://nextjs.org/docs/app/getting-started/route-handlers | 2026-11-16 | Medium |
| NXT-13 | `useSearchParams` without a Suspense boundary | `fragile` | `useSearchParams(` in a client component not wrapped in `<Suspense>` | Page is `force-dynamic` | medium | Build succeeds under static prerender | App Router | no | https://nextjs.org/docs/app/api-reference/functions/use-search-params | 2026-11-16 | Medium |
| NXT-14 | Third-party `<script>` with no strategy / `<Script>` misuse | `inefficient` | `<script src="https://…">` in a server component without `next/script` | Script is first-party and critical | low | No render-blocking third-party JS | `next/script` | situational | https://nextjs.org/docs/app/api-reference/components/script | 2026-11-16 | Medium |

### 3.11 TypeScript

| ID | Pattern | Classification | Detection indicator (concrete, static, implementable) | False-positive conditions | Severity | Migration benefit | Compatibility constraint | Safe to autofix? | Primary evidence URL | Retrieved | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TYP-01 | `any` in a parameter, return, or exported type | `fragile` | `: any` / `<any>` / `as any` on a declaration that crosses a module boundary | Genuine interop with untyped JS at one documented seam | medium | Type errors surface at build time | None | no | https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any | 2026-11-16 | High |
| TYP-02 | `@ts-ignore` | `obsolete` (framing: TS docs position `@ts-expect-error` as the modern replacement) | Comment `// @ts-ignore` | None | medium | Suppressions become self-cleaning (unused ones error) | TypeScript 3.9+ | safe (`@ts-expect-error`) | https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html | 2026-11-16 | High |
| TYP-03 | `as` cast used to silence a type error | `fragile` | `as ` cast on a value whose inferred type conflicts, especially `as unknown as` | Narrowing from a validated boundary (after a runtime check) | medium | Real narrowing instead of a lie | None | no | https://www.typescriptlang.org/docs/handbook/2/narrowing.html | 2026-11-16 | Medium |
| TYP-04 | `strict` disabled or partial | `fragile` | `tsconfig` with `"strict": false`, or `strictNullChecks`/`noImplicitAny` false | Incremental migration with a documented ratchet | medium | Null-safety and implicit-any caught at build | TS version | no | https://www.typescriptlang.org/tsconfig/strict.html | 2026-11-16 | High |
| TYP-05 | Non-null assertion on a DOM query result | `fragile` | `getElementById(...)!` / `querySelector(...)!` | Element is guaranteed by a synchronous render contract | medium | No runtime null crash | None | no | https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator | 2026-11-16 | Medium |
| TYP-06 | `Function`/`Object`/`{}` as a type | `obsolete` | Type annotation `Function`, bare `Object`, or `{}` on a parameter | `{}` meaning "any non-nullish" deliberately | low | Real call signatures and shapes | None | no | https://www.typescriptlang.org/docs/handbook/2/functions.html | 2026-11-16 | Medium |
| TYP-07 | `JSON.parse` result used as a typed value | `fragile` | `JSON.parse(...)` assigned directly to a typed variable or returned as `T` | Parsed literal with a known shape | medium | Validation at the trust boundary | None | no | https://www.typescriptlang.org/docs/handbook/2/narrowing.html | 2026-11-16 | Medium |
| TYP-08 | Build errors suppressed in framework config | `fragile` | `typescript.ignoreBuildErrors: true` (Next.js) or `vite-plugin-checker` disabled | Known, tracked, documented debt | high | Type errors fail CI instead of production | None | no | https://nextjs.org/docs/app/api-reference/config/next-config-js/typescript | 2026-11-16 | Medium |

### 3.12 Build, tooling, dependency and client security

| ID | Pattern | Classification | Detection indicator (concrete, static, implementable) | False-positive conditions | Severity | Migration benefit | Compatibility constraint | Safe to autofix? | Primary evidence URL | Retrieved | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| BLD-01 | `eval`-family devtool in a production build | `insecure` | Bundler config `devtool`/`sourcemap` set to an `eval`-based mode under `mode: 'production'` | Never appropriate for prod | high | Enables a CSP without `unsafe-eval` | None | safe | https://vitejs.dev/config/build-options.html | 2026-11-16 | Medium |
| BLD-02 | No production source maps | `situational` | `build.sourcemap` false/absent in a deployed app | Maps deliberately withheld for IP/privacy | low | Actionable stack traces | None | no | https://vitejs.dev/config/build-options.html | 2026-11-16 | Medium |
| BLD-03 | Secrets in a committed `.env` or bundle | `insecure` | `.env` matching `SECRET/TOKEN/PASSWORD` not gitignored; secret-shaped literal in client source | Public/publishable keys; `.env.example` placeholders | blocker | No credential disclosure | None | no | https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html | 2026-11-16 | High |
| BLD-04 | Missing/loose lockfile (unpinned installs) | `insecure` | No lockfile committed, or CI runs `npm install` with floating ranges | Library published to a registry (no lockfile expected) | medium | Reproducible builds; smaller supply-chain window | None | no | https://cheatsheetseries.owasp.org/cheatsheets/Software_Supply_Chain_Security_Cheat_Sheet.html | 2026-11-16 | Medium |
| BLD-05 | Permissive CSP (`unsafe-inline`/`unsafe-eval`) | `insecure` | CSP header/meta containing `unsafe-inline` or `unsafe-eval` | Documented third-party constraint with a tracking issue | medium | Real XSS mitigation | Trusted Types where enforced | no | https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html | 2026-11-16 | Medium |
| BLD-06 | Third-party script with no `integrity` | `situational` | `<script src="https://` with no `integrity` attribute | Vendor ships a versioned, rotated URL — their own recommendation | low | Supply-chain tampering detection | SRI supported everywhere | situational | https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity | 2026-11-16 | Medium |
| BLD-07 | State-changing form with no CSRF defence | `insecure` | `<form method="post">`/server action mutating state with no token, `SameSite` cookie, or Origin check | Same-origin `SameSite=Strict` cookies already enforced | high | Blocks cross-site request forgery | None | no | https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html | 2026-11-16 | Medium |
| BLD-08 | Authorisation enforced only in client code | `insecure` | Route/component gating on a client-side session check with no server-side check | Server action/route handler independently authorises | blocker | Closes a direct-request bypass | None | no | https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html | 2026-11-16 | High |
| BLD-09 | Barrel file re-exporting a whole module graph | `situational` | `export * from` in an index consumed by many entry points | Bundler resolves ESM side-effect-free modules correctly | low | Smaller bundles, faster dev server | Bundler-dependent | no | https://vitejs.dev/guide/features.html | 2026-11-16 | Low |
| BLD-10 | Deep relative imports defeating tree-shaking | `situational` | `import { x } from 'lib'` where `lib` has no `sideEffects: false` and a large entry | Library is side-effect-free and ESM | low | Fewer bytes shipped | `sideEffects` is a bundler hint | no | https://webpack.js.org/guides/tree-shaking/ | 2026-11-16 | Low |

### 3.13 AI-generated anti-patterns

| ID | Pattern | Classification | Detection indicator (concrete, static, implementable) | False-positive conditions | Severity | Migration benefit | Compatibility constraint | Safe to autofix? | Primary evidence URL | Retrieved | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AIA-01 | Wrapper component that only forwards props | `overengineered` | A component whose entire body is `<Inner {...props} />` with no logic, styling, or default | Wrapper adds a boundary, context, error handling, or a stable public API | info | Less indirection | None | no | https://react.dev/learn/your-first-component | 2026-11-16 | Medium |
| AIA-02 | Invented/nonexistent API surface | `fragile` | Prop/hook/option name not present in the installed package's types or docs | Project pins an older/newer major version the scan does not know | high | Prevents silent no-ops | Needs dependency version input | detect-only | https://www.typescriptlang.org/docs/handbook/2/everyday-types.html | 2026-11-16 | Low |
| AIA-03 | Missing loading/error/empty states | `fragile` | Component branches on data presence but has no loading and no error branch | Data is synchronously available | high | Users see a spinner or a real error, not a blank region | None | detect-only | https://react.dev/reference/react/Suspense | 2026-11-16 | Medium |
| AIA-04 | Fake accessibility (role/label with no behaviour) | `inaccessible` | `role="button"`/`aria-label` on a decorative element; `aria-hidden` used to silence a contrast/label problem | Genuine widget implemented with full keyboard support | high | AT reports the truth | None | detect-only | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role | 2026-11-16 | Medium |
| AIA-05 | Dependency added for a few lines of logic | `overengineered` | A dependency whose entire usage is one function call to a trivially implementable utility | Library handles edge cases that are genuinely hard (dates, i18n, crypto) | info | Smaller attack surface and bundle | None | no | https://cheatsheetseries.owasp.org/cheatsheets/Software_Supply_Chain_Security_Cheat_Sheet.html | 2026-11-16 | Low |
| AIA-06 | Modern API used with no feature detection or target declaration | `unsupported` | Use of an API (e.g. `showPicker`, `popover`, `structuredClone`) with no fallback and no `browserslist`/Baseline declaration in the repo | Project declares Baseline "widely available" and the API is in it | medium | Graceful degradation | Needs a target input | no | https://web.dev/baseline | 2026-11-16 | Medium |
| AIA-07 | Copied insecure snippet | `insecure` | A cluster combining `innerHTML` + `eval` + no-sanitise patterns in a file with no test | Snippet is vendored and isolated | high | Real vulnerability removed | None | no | https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html | 2026-11-16 | Medium |
| AIA-08 | SSR/client boundary confusion at module scope | `fragile` | `window`/`document`/`localStorage` referenced at module top level in a shared module | Module is only imported by client components | high | No build/runtime crash | None | no | https://nextjs.org/docs/messages/react-hydration-error | 2026-11-16 | Medium |
| AIA-09 | Stale framework idiom for the installed major | `misaligned` | Pages-Router idiom (`getServerSideProps`, `next/router`) in a project whose deps are App Router — or vice versa | Project genuinely uses the Pages Router | high | Idiom matches the installed framework | Needs dependency version input | detect-only | https://nextjs.org/docs/app/getting-started/fetching-data | 2026-11-16 | Medium |
| AIA-10 | Error swallowed with an empty catch | `fragile` | `catch {}` / `catch (e) {}` with no log, rethrow, or state change | Deliberate, commented best-effort cleanup | medium | Failures become visible | None | no | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch | 2026-11-16 | High |
| AIA-11 | Placeholder shipped in code | `fragile` | `TODO`/`FIXME`/`lorem ipsum`/`example.com` in a rendered string or a shipped config | TODO in a comment that is tracked | low | No placeholder content in production | None | detect-only | https://developer.mozilla.org/en-US/docs/Web/HTML | 2026-11-16 | Medium |
| AIA-12 | Try/catch around an await that retries nothing and logs nothing | `overengineered` | `try` block wrapping a single `await` whose catch only `console.log`s | Genuine telemetry in the catch | info | Honest error surface | None | no | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch | 2026-11-16 | Low |

## 4. The 12 highest-value patterns in detail

### D1 — SEM-01/SEM-02: clickable `div` instead of `<button>`

- **Why it matters:** A `div` with a click handler gets no Enter/Space activation, no focus, no button role, and breaks middle-click semantics, so keyboard and AT users cannot trigger the action at all.
- **Before / after:**

```jsx
// before
<div className="btn" onClick={save}>Save</div>

// after
<button type="button" className="btn" onClick={save}>Save</button>
```

- **Validate after migration:** Tab to the control, press Enter and Space — both must fire once; the accessibility tree must expose role `button` with name "Save".
- **What would make this wrong:** If the element genuinely navigates, `<a href>` is correct, not `<button>`; and if it is a toggle it needs `aria-pressed`.

### D2 — ARI-01: `aria-hidden="true"` on focusable content

- **Why it matters:** Focus can still land inside a subtree that the accessibility tree no longer exposes, producing silent focus with no announced context (an explicit MDN warning).
- **Before / after:**

```jsx
// before
<div aria-hidden="true">
  <button onClick={close}>Close</button>
</div>

// after
<div inert>
  <button onClick={close} tabIndex={-1}>Close</button>
</div>
```

- **Validate after migration:** Tab through the page; no focus may enter the hidden region, and `document.activeElement` must never resolve inside it.
- **What would make this wrong:** Targets without `inert` support must use `hidden`, `display:none`, or a focus trap instead; a decorative icon inside a button legitimately keeps `aria-hidden`.

### D3 — ARI-05: positive `tabindex`

- **Why it matters:** Positive values reorder focus away from DOM order, so keyboard users jump around the page unpredictably; MDN's guidance is to use only `0` and `-1`.
- **Before / after:**

```html
<!-- before -->
<input tabindex="3" />
<input tabindex="1" />
<button tabindex="2">Go</button>

<!-- after -->
<input />
<input />
<button>Go</button>
```

- **Validate after migration:** Tab order matches visual/source order; no element has a `tabindex` above 0.
- **What would make this wrong:** A roving-tabindex composite widget legitimately uses `0` on the active item and `-1` on the rest — never positive values.

### D4 — FRM-03: `autocomplete="off"` on authentication fields

- **Why it matters:** MDN documents that `off` does not stop password managers, so the attribute adds no security while actively breaking autofill and increasing login failures.
- **Before / after:**

```html
<!-- before -->
<input type="password" name="pass" autocomplete="off" />

<!-- after -->
<input type="password" name="pass" autocomplete="current-password" />
```

- **Validate after migration:** A password manager offers to fill the field; the saved credential is offered on return visits; `new-password` is used on signup/reset.
- **What would make this wrong:** A one-time code or a field that must never be persisted (OTP, CVV) is a legitimate `off`/`one-time-code` case.

### D5 — IMG-03: images without `width`/`height`

- **Why it matters:** Without intrinsic dimensions the browser cannot reserve space, so the image's arrival shifts everything below it — a direct CLS contributor.
- **Before / after:**

```html
<!-- before -->
<img src="/hero.avif" alt="Product on a desk" />

<!-- after -->
<img src="/hero.avif" alt="Product on a desk"
     width="1200" height="800"
     style="height:auto;max-width:100%" />
```

- **Validate after migration:** With the image blocked in DevTools, the box keeps its aspect ratio and CLS stays 0 for the shift.
- **What would make this wrong:** `next/image` with `fill`, an SVG with `viewBox`, or an image in a fixed-aspect container already reserves space — flagging those is a false positive.

### D6 — MED-01: `<video>` without captions

- **Why it matters:** Any speech-bearing video without a captions track is unusable for deaf and hard-of-hearing users and fails WCAG 1.2.2 regardless of how modern the rest of the page is.
- **Before / after:**

```html
<!-- before -->
<video src="/intro.mp4" controls></video>

<!-- after -->
<video src="/intro.mp4" controls>
  <track kind="captions" src="/intro.en.vtt" srclang="en" label="English" default />
</video>
```

- **Validate after migration:** The CC control appears, captions render, and the VTT validates without overlapping cues.
- **What would make this wrong:** A silent decorative loop with no speech needs no captions; a video whose audio is already transcribed adjacent on the page may satisfy the criterion differently.

### D7 — JS-02/REA-09: `innerHTML` (or `dangerouslySetInnerHTML`) with untrusted data

- **Why it matters:** HTML parsing of attacker-influenced strings is the canonical DOM XSS sink, and React's `dangerouslySetInnerHTML` is the same sink with a warning label.
- **Before / after:**

```jsx
// before
<div dangerouslySetInnerHTML={{ __html: comment.body }} />

// after
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.body) }} />
```

- **Validate after migration:** A payload such as `<img src=x onerror=alert(1)>` renders inert; a CSP with Trusted Types reports no violations.
- **What would make this wrong:** When the content is authored by the site itself (a CMS field rendered by an editor you control) the sanitiser is defence-in-depth, not a required change — do not flag constant literals.

### D8 — JS-01: `document.write`

- **Why it matters:** MDN banners it **Deprecated** and the HTML spec calls it "strongly discouraged": it can clear the page, corrupt the parser, be ignored in async/deferred scripts, and is an XSS sink.
- **Before / after:**

```js
// before
document.write('<script src="/widget.js"><\/script>');

// after
const s = document.createElement('script');
s.src = '/widget.js';
document.head.append(s);
```

- **Validate after migration:** The widget still initialises after DOM ready; no "call to document.write() from an asynchronously-loaded external script was ignored" console message.
- **What would make this wrong:** A third-party ad/analytics snippet you cannot modify is out of scope; injecting markup *during parsing* for a legitimate synchronous document-stream case is extraordinarily rare and should be documented rather than auto-fixed.

### D9 — JS-10: `useEffect` data fetching without abort

- **Why it matters:** Without cancellation, a slow earlier request can resolve after a newer one and overwrite fresh state, and the effect writes state after unmount.
- **Before / after:**

```jsx
// before
useEffect(() => { fetch(url).then(r => r.json()).then(setData); }, [url]);

// after
useEffect(() => {
  const c = new AbortController();
  fetch(url, { signal: c.signal }).then(r => r.json()).then(setData)
    .catch(e => { if (e.name !== 'AbortError') setError(e); });
  return () => c.abort();
}, [url]);
```

- **Validate after migration:** Throttle the network, change `url` rapidly — only the last response may render; the console shows one aborted request per superseded call.
- **What would make this wrong:** A data library (SWR, TanStack Query, RSC) already owns cancellation; flagging a `useEffect` that only calls `mutate()` is a false positive.

### D10 — REA-02: array index as `key`

- **Why it matters:** React reuses state by key, so on insert/remove/reorder the input values and component state stick to the wrong row.
- **Before / after:**

```jsx
// before
{todos.map((t, i) => <Row key={i} todo={t} />)}

// after
{todos.map(t => <Row key={t.id} todo={t} />)}
```

- **Validate after migration:** With focus in row 2's input, delete row 1 — focus and typed text must stay with the same record.
- **What would make this wrong:** A static, never-reordered list with no per-row state is a legitimate index-key case; React's own docs accept it there.

### D11 — NXT-05/NXT-06: hydration-unsafe values read during render

- **Why it matters:** The server and client compute different values, so React discards and re-renders the mismatched subtree — a visible flash plus a hydration error.
- **Before / after:**

```jsx
// before
export default function Stamp() {
  return <time>{new Date().toLocaleTimeString()}</time>;
}

// after
export default function Stamp() {
  const [now, setNow] = useState(null);
  useEffect(() => setNow(new Date()), []);
  return <time suppressHydrationWarning>{now?.toLocaleTimeString() ?? ''}</time>;
}
```

- **Validate after migration:** No hydration mismatch in the console during a production build; no layout flash between server HTML and hydration.
- **What would make this wrong:** If the value is genuinely server-only, render it on the server and pass it down; `suppressHydrationWarning` alone hides a real bug and is not a migration.

### D12 — TYP-02: `@ts-ignore`

- **Why it matters:** `@ts-ignore` keeps suppressing after the underlying error is fixed, whereas `@ts-expect-error` fails when there is nothing left to suppress, so suppressions self-clean.
- **Before / after:**

```ts
// before
// @ts-ignore
element.value = payload.value;

// after
// @ts-expect-error - vendor types omit `value` on HTMLInputElement polyfill
element.value = payload.value;
```

- **Validate after migration:** `tsc --noEmit` passes; removing the offending line makes the file error with "Unused '@ts-expect-error' directive", proving the suppression is still needed.
- **What would make this wrong:** On TypeScript < 3.9 the directive does not exist; suppressing a genuine type error in a public API should be a fix, not a directive swap.

## 5. Rejected as default-on rules (see `prioritized-shortlist.md` §3 for rationale)

`SEM-07` (multiple `h1`), `JS-13` (`target=_blank` + `noopener`), `JS-22` (`==`), `CSS-06` (`!important` count),
`REA-07` (`useMemo` on trivial values), `AIA-01` (forwarding wrapper), `AIA-05` (small dependency), `SEM-04`
(`<table>` layout), `JS-21` (`var`), `CSS-01` (`100vh` as a blanket rule), `ARI-02` (redundant role),
`MED-04` (codec), `MET-06` (JSON-LD).

## 6. Claims marked UNVERIFIED

| Claim in this catalog | Status | Reason |
|---|---|---|
| `CSS-01` precise mobile-`vh` behaviour and `dvh`/`svh` Baseline timing | UNVERIFIED (detail) | The `web.dev/blog/viewport-units` page was cited from knowledge, not fetched this session. The *existence* of dynamic viewport units is not in doubt; the exact Baseline date is. Verify before writing impact copy. |
| `REA-17` React 19 removal of `defaultProps` for function components | UNVERIFIED | Upgrade-guide page not fetched. Classified `legacy` (not `deprecated`) precisely because of this. |
| `NXT-08` async `cookies()`/`headers()` exact version boundary | UNVERIFIED (version) | Next 15 is the known boundary; the exact patch where the sync form was removed was not read. |
| `MED-04` codec-support matrix | UNVERIFIED | No compat table consulted; row is `Low` confidence and recommended for rejection as a rule. |
| `JS-19`/`AIA-06` Baseline status of specific modern APIs | UNVERIFIED per-API | Requires a `browserslist`/Baseline target input the tool does not yet have; rules must take a target parameter before shipping. |
| Every `○` URL in §2 | UNVERIFIED (reachability) | Canonical MDN path pattern assumed, not re-opened. Run `scripts/` link check before publication. |

## 7. Hand-off notes for the rule-catalog stage

1. **Taint analysis is unavoidable.** JS-02/JS-03/REA-09/AIA-07 cannot be decided by regex; the catalog must
   define a minimal "untrusted source → sink" model or these degrade into noise.
2. **Target platform must be an input.** 9 rows are `situational` *only* because Baseline vs legacy-target
   changes the answer (CSS-01, CSS-03, CSS-09, NXT-03, FOC-01, AIA-06, MED-04, BLD-06, IMG-04).
3. **Detect-only is the default for anything touching semantics.** Of 164 rows, 77 are `no` and 34 are
   `detect-only` — 111 should never produce an edit; only 13 are `safe` and 40 `situational`. The autofix
   column is the enforcement point.
4. **Two rows exist only to be refused** (SEM-07, JS-13) and should be encoded as `enabled: false` so the
   refusal is visible and testable in the catalog rather than folklore.
