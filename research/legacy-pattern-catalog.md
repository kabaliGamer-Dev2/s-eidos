# Legacy pattern catalog — v0.1 shipped rule set (37 rules)

**Purpose:** the declarative rule table the lexical/structural analyzer is built from; every row is statically detectable without an AST library, and every row carries its classification, impact, support gate and provenance. **Retrieved:** 2026-11-16 (Asia/Calcutta).

## 0. Contract

| Item | Value |
|---|---|
| Rules shipped | **37**, all detectability tier `a` or `b`. Tier `c` is listed separately (§4) and is **not** shippable. |
| Runtime budget | Zero runtime dependencies, plain ESM, no AST library, no network (D-002, D-003). Tier `a` = reliable lexical pass; tier `b` = bounded, documented heuristic with a mandatory false-positive note. |
| Classification | Exactly one of `deprecated`, `obsolete`, `legacy`, `situational`, `unsupported`, `insecure`, `inaccessible` (D-006). No other class exists. |
| Impact | One or more of `security`, `accessibility`, `performance`, `maintainability`, `correctness`, `compatibility`, `privacy`. "Inefficient / overengineered / framework-misaligned" are expressed here, never as a class (D-006). |
| `deprecated` policy | Used **only** where a cited primary source says deprecated/removed. **No shipped rule claims `deprecated`** — the only source-backed `deprecated` patterns in the inputs are web-platform tokens already inside the competitor's 33-rule table (see §3), so claiming the class would buy a duplicate rule. |
| Autofix | `none` / `safe` / `situational`. **Metadata only** — v0.1 applies nothing (D-008). `none` absorbs the input catalog's `no` and `detect-only`. |
| Support gate | The target predicate that must hold before a finding is emitted: a browser preset resolvable from `browser-compatibility-matrix.md`, a framework/runtime version from `framework-guidance.md`, or the file-kind gate from QSB §1.3. `none` = no target condition. |
| Severity | `blocker` / `high` / `medium` / `low` / `info`. A `blocker` is reserved for defects that are unambiguous **and** harmful regardless of target. |
| Confidence | `H` (read from a Tier-A/B source, fresh), `M` (one derived or unverified input, or one `UNVERIFIED` evidence cell), `L` (signal only; never auto-applied, always printed with its caveat). |
| `reviewBy` | TTL by volatility (`citation-discipline.md` §4): framework docs +60 d = **2027-01-15**; vendor/perf prose +90 d = **2027-02-14**; MDN/W3C policy-spec +180 d = **2027-05-15**; shipping data +30 d = **2026-12-16**. Every rule table below carries a `Retrieved` column, uniformly `2026-11-16`. |
| Evidence URLs | Every URL below appears, with status, in `source-register.md` §1. |

## 1. Domain meanings

| Domain | Meaning | Shipped |
|---|---|---|
| `SEM` | Document semantics and control roles (markup/JSX alike) | 2 |
| `ARI` | ARIA, accessible name, focus order | 2 |
| `FRM` | Form controls and submit semantics | 2 |
| `IMG` | Images, media and loading strategy | 3 |
| `MET` | Document metadata and crawlable output | 1 |
| `CSS` | CSS that encodes interaction or reading-order defects | 1 |
| `REA` | React client-runtime idioms (v19.x) | 9 |
| `NXT` | Next.js App/Pages Router idioms (v16.x) | 8 |
| `TYP` | TypeScript and resolved `tsconfig` | 4 |
| `BLD` | Build/tooling config and client-bundle exposure | 2 |
| `AIA` | AI-generation-shaped residue (signals, never authorship verdicts) | 3 |

## 2. Shipped rules

**Selection test applied to every row:** (i) statically decidable at tier `a`/`b` with no AST library and no network; **and** (ii) at least one of — **framework-idiomatic** (all `REA`/`NXT`/`TYP`/`BLD`), **AI-generation-shaped** (`AIA-001/002/003`, `SEM-001`, `NXT-001/003/004`, `TYP-001/003/004`, `IMG-002/003`), or **high-harm** (4 `blocker` + 13 `high`, concentrated in accessible-name/focus defects and client-bundle secret exposure). The five cross-cutting a11y/markup rules are **not** web-platform feature tokens: the competitor's table is anchored to platform features (`dialog`, `field-sizing`, prefixed CSS), while these are document/component semantics carried by a file-kind gate and a mandatory false-positive note. Every token-level rule that table plausibly owns is dropped in §3.

### SEM — document semantics

| ID | Title | Classification | Impact | Detectability tier | Detection indicator | False positives | Severity | Confidence | Support gate | Autofix | Evidence URL | Retrieved | reviewBy |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SEM-001 | Clickable non-interactive element with a click handler and no role/tabIndex | inaccessible | accessibility | a | `div`/`span`/`p`/`li` carrying `onClick` or `addEventListener('click')` and neither `role` nor `tabIndex`/`tabindex` | role/keyboard handler arrives via `{...rest}` spread; delegated handler on an ancestor; the component itself renders `<button>` | high | H | fileKind ∈ {html, jsx-literal} (QSB §1.3) | situational | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role | 2026-11-16 | 2027-05-15 |
| SEM-002 | Anchor used as an action button | inaccessible | accessibility | a | `<a>` with literal `href="#"`, empty `href`, or `javascript:void(0)`, plus a click handler and no navigation | a real in-page target exists for the hash; documentation/demo placeholder in a non-shipped file | medium | H | none | none | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a | 2026-11-16 | 2027-05-15 |

### ARI — ARIA and focus

| ID | Title | Classification | Impact | Detectability tier | Detection indicator | False positives | Severity | Confidence | Support gate | Autofix | Evidence URL | Retrieved | reviewBy |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ARI-001 | `aria-hidden="true"` on focusable content | inaccessible | accessibility | b | `aria-hidden="true"` on an element that is, or transitively contains within the same file, a `button`/`a[href]`/`input`/`[tabindex]` | focusable node only exists in a runtime branch not present in this file; SSR-conditional markup | blocker | H | fileKind ∈ {html, jsx-literal} | none | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden | 2026-11-16 | 2027-05-15 |
| ARI-002 | Positive `tabindex` value | inaccessible | accessibility | a | integer attribute `tabindex` ≥ 1 | a documented deliberate mirror of visual order; roving-tabindex widgets use only 0/-1 | medium | M | none — but the evidence row is `UNVERIFIED (reachability)`, so this row is `reviewBy 2026-12-16` until re-read | situational | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex | 2026-11-16 | 2026-12-16 |

### FRM — forms

| ID | Title | Classification | Impact | Detectability tier | Detection indicator | False positives | Severity | Confidence | Support gate | Autofix | Evidence URL | Retrieved | reviewBy |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FRM-001 | Input without a programmatically associated label | inaccessible | accessibility | b | text-like `input`/`select`/`textarea` with no `id` matched by a `for`, no wrapping `label`, no `aria-label`/`aria-labelledby` | design-system `Field` wrapper supplies the label; the form is componentised so the whole form is not in this file | high | M | fileKind ∈ {html, jsx-literal} **and** the whole form is in the file (QSB A11Y-106) | none | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label | 2026-11-16 | 2027-05-15 |
| FRM-002 | `<button>` without `type` inside a form | situational | correctness | a | `<button>` inside a `<form>` with no `type` attribute/prop | the button is the intended submit control (the common, correct case) | low | H | none | safe | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button | 2026-11-16 | 2027-05-15 |

### IMG — images and loading

| ID | Title | Classification | Impact | Detectability tier | Detection indicator | False positives | Severity | Confidence | Support gate | Autofix | Evidence URL | Retrieved | reviewBy |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| IMG-001 | `<img>` with no `alt` attribute | inaccessible | accessibility | a | `<img>`/`<Image>` with no `alt` and no `{...spread}` | `alt` injected by a wrapper; `alt=""` (decorative) is valid and must never be flagged; `next/image` requires `alt` and fails the build instead | high | H | fileKind ∈ {html, jsx-literal}; suppress inside `next/image` | situational | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img | 2026-11-16 | 2027-05-15 |
| IMG-002 | `<img>` with no intrinsic dimensions | situational | performance | b | `<img>` with no `width`+`height` pair, no `aspect-ratio` in a resolvable class/style, not `next/image` `fill`, not an SVG with `viewBox` | fixed-aspect container already reserves space; dimensions spread from props | medium | H | preset must resolve `aspect-ratio` as newly/widely (BCM §2), because the remedy names it | situational | https://web.dev/articles/optimize-cls | 2026-11-16 | 2027-02-14 |
| IMG-003 | `loading="lazy"` on the first-viewport/hero image | situational | performance | b | `loading="lazy"` on the first image of the document/route, or on the hero component, with no `fetchpriority`/`priority` | hero is below the fold on small screens; `next/image priority` present; the page is a long article with no hero | medium | M | preset must resolve `loading` as newly/widely (Chromium 77 / Firefox 121 / Safari 16.4) | none | https://web.dev/articles/lcp | 2026-11-16 | 2027-02-14 |

### MET — document metadata

| ID | Title | Classification | Impact | Detectability tier | Detection indicator | False positives | Severity | Confidence | Support gate | Autofix | Evidence URL | Retrieved | reviewBy |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MET-001 | Viewport meta blocks zoom | inaccessible | accessibility | a | viewport `content` containing `user-scalable=no` or `maximum-scale` below 5 | none for general content; kiosk/embedded device with a documented exception | blocker | H | none | safe | https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Viewport_meta_element | 2026-11-16 | 2027-05-15 |

### CSS — interaction encoding

| ID | Title | Classification | Impact | Detectability tier | Detection indicator | False positives | Severity | Confidence | Support gate | Autofix | Evidence URL | Retrieved | reviewBy |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CSS-001 | `outline: none` on focus with no replacement | inaccessible | accessibility | b | `outline: none`/`0` on `:focus`/`:focus-visible` with no `box-shadow`, border, background or `outline` change in the same rule block | replacement defined in an adjacent rule or token file; a parent selector restores the ring | high | M | if the remediation names `:focus-visible`, preset must resolve it as newly/widely; otherwise only `:focus` advice | none | https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible | 2026-11-16 | 2027-05-15 |

### REA — React (19.x)

| ID | Title | Classification | Impact | Detectability tier | Detection indicator | False positives | Severity | Confidence | Support gate | Autofix | Evidence URL | Retrieved | reviewBy |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| REA-001 | List rendered without a `key` | situational | correctness | a | `.map(` returning JSX whose outermost element has no `key` prop | children are static JSX, not a mapped list | medium | H | adapter `react-jsx` | none | https://react.dev/learn/rendering-lists | 2026-11-16 | 2027-01-15 |
| REA-002 | Array index used as `key` on a mutable list | situational | correctness | b | `key={index}`/`key={i}` where the list is filtered/sorted/prepended or rows own state/inputs | the list is static, never reordered, and has no per-row state — React's docs accept that case | medium | H | adapter `react-jsx` | none | https://react.dev/learn/rendering-lists | 2026-11-16 | 2027-01-15 |
| REA-003 | Render-time random/time value used as `key` | situational | correctness | a | `key` expression calling `Math.random`, `Date.now`, or `crypto.randomUUID` during render | the key is generated once and stored in state/ref; a deliberate forced reset after submit | medium | H | adapter `react-jsx` | none | https://react.dev/learn/rendering-lists | 2026-11-16 | 2027-01-15 |
| REA-004 | State derived from props/state inside `useEffect` | situational | performance | b | `useEffect` whose body only calls a state setter whose argument derives solely from its deps | the effect syncs a genuine external system; a subscription bridge | medium | H | adapter `react-jsx` | none | https://react.dev/learn/you-might-not-need-an-effect | 2026-11-16 | 2027-01-15 |
| REA-005 | `dangerouslySetInnerHTML` with a non-literal value | insecure | security | b | `__html:` operand is not a single string literal and no recognised sanitiser call wraps it in the same expression | `DOMPurify.sanitize(...)` (or equivalent) wraps it; trusted build-time HTML constant | blocker | H | adapter `react-jsx`; severity downgraded to `info` when a recognised sanitiser is visible — and the message must still say the sanitiser config may be wrong | none | https://react.dev/reference/react-dom/components/common | 2026-11-16 | 2027-01-15 |
| REA-006 | Controlled input with `value` and no `onChange`/`readOnly` | situational | correctness | a | `value` on `input`/`select`/`textarea` with no `onChange`/`onInput` and no `readOnly` | `readOnly` present; `onChange` arrives via spread props; an intentional read-only display | medium | H | adapter `react-jsx` | none | https://react.dev/reference/react-dom/components/input | 2026-11-16 | 2027-01-15 |
| REA-007 | Effect-owned data fetch with no cancellation | situational | correctness | b | `useEffect` (or mount hook) containing `fetch`/`await` with no `AbortController` and no cleanup return | a data library (SWR, TanStack Query, RSC) owns cancellation; fire-and-forget telemetry | high | H | adapter `react-jsx` | none | https://react.dev/reference/react/useEffect | 2026-11-16 | 2027-01-15 |
| REA-008 | `ref.current` read or written during render | situational | correctness | b | `.current` assignment or read at component-body statement level, outside effects/handlers | lazy-init guard `if (ref.current == null) ref.current = …`; measurement in `useLayoutEffect` | medium | M | adapter `react-jsx` | none | https://react.dev/reference/react/useRef | 2026-11-16 | 2027-01-15 |
| REA-009 | React 19 API used below the installed React major | unsupported | compatibility | b | named import from `react` of `use`, `useActionState`, `useOptimistic`, `useFormStatus` (19.0+) or `useEffectEvent` (19.2+) while the resolved installed major is lower | installed version unresolvable; a `preact/compat` or vendor shim provides the API; a monorepo dedupes to a newer copy | high | M | installed `react` major < 19 (or < 19.2 for `useEffectEvent`), read from `node_modules/react/package.json`; skip when unresolved | none | https://react.dev/blog/2024/04/25/react-19-upgrade-guide | 2026-11-16 | 2027-01-15 |

### NXT — Next.js (16.x)

| ID | Title | Classification | Impact | Detectability tier | Detection indicator | False positives | Severity | Confidence | Support gate | Autofix | Evidence URL | Retrieved | reviewBy |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NXT-001 | `'use client'` at the root layout or across most of `app/` | situational | performance | b | `'use client'` in `app/layout.tsx`, or in more than ~60 % of files under `app/` | the app is genuinely interactive throughout (editor, canvas, dashboard); providers legitimately need client state | medium | M | adapter `next-app`; requires a project-level file count, so never reported for a single-file scan | none | https://nextjs.org/docs/app/getting-started/server-and-client-components | 2026-11-16 | 2027-01-15 |
| NXT-002 | Pages-Router data exports inside `app/` | situational | correctness | a | exported `getServerSideProps`/`getStaticProps`/`getStaticPaths` in a file under `app/` | the file is under `pages/` (then the export is correct) | high | H | adapter `next-app`, path-decided — never emitted for `pages/` files | none | https://nextjs.org/docs/app/getting-started/fetching-data | 2026-11-16 | 2027-01-15 |
| NXT-003 | Literal `<img>` for content images in a Next.js app | situational | performance | a | `<img` in `app/` or `components/` of a project whose `package.json` depends on `next`, with no `next/image` import in the file | SVG/icon-sized image; `images.unoptimized: true`; deliberate static export; third-party widget that owns its DOM | medium | H | adapter `next-*` **and** installed `next` present | situational | https://nextjs.org/docs/app/api-reference/components/image | 2026-11-16 | 2027-01-15 |
| NXT-004 | Google Fonts `<link>`/`@import` instead of `next/font` | situational | performance | a | `fonts.googleapis.com` (or `fonts.gstatic.com`) in a `<link>`/`@import` in a Next.js file with no `next/font` import | brand font already self-hosted; an email template living in the repo | low | H | adapter `next-*` | situational | https://nextjs.org/docs/app/api-reference/components/font | 2026-11-16 | 2027-01-15 |
| NXT-005 | Render-time `Date`/`Math.random()` in a server-rendered component | situational | correctness | b | `Date.now()`, `new Date()`, `Math.random()` in a component body or JSX that reaches the DOM | the call is inside `useEffect`/an event handler; the component is client-only (`ssr: false`); the value arrives as a server-provided prop | high | H | adapter `next-*` (SSR + hydration path) | none | https://nextjs.org/docs/messages/react-hydration-error | 2026-11-16 | 2027-01-15 |
| NXT-006 | Browser globals at module scope or in render | situational | correctness | b | bare `window`/`document`/`localStorage` reference at module top level or in a component body, not in an effect/handler and not behind a `typeof window` guard | component is client-only and never SSR'd; the module is imported exclusively by client components | high | H | adapter `next-*` | none | https://nextjs.org/docs/messages/react-hydration-error | 2026-11-16 | 2027-01-15 |
| NXT-007 | Caching assumption not reconciled with `cacheComponents` | situational | correctness | b | `fetch(` in a server component/route with no `cache`/`next.revalidate`/`"use cache"` where the code visibly assumes a populated cache (dedupe, freshness comment, ISR-style comment) | `cacheComponents` is `true` (Cache Components model applies); installed Next < 15 (fetch cached by default); a `"use cache"` directive is present in the segment | medium | M | **mandatory gate:** resolve `cacheComponents` from `next.config.*` **and** the installed `next` major before emitting; no resolution → no finding | none | https://nextjs.org/docs/app/guides/caching-without-cache-components | 2026-11-16 | 2027-01-15 |
| NXT-008 | Synchronous `params`/`searchParams`/`cookies()`/`headers()` access | situational | correctness | a | member access on `params`/`searchParams`, or `cookies()`/`headers()` result use, without `await`/`use(` in an `app/` page/layout/route | the file is a Pages-Router page; the value was already awaited into a local; installed Next < 15 | high | H | installed `next` ≥ 15, adapter `next-app`; Next 16 treats sync access as breaking — **exact patch where sync stopped working is `UNVERIFIED (version)`** | none | https://nextjs.org/docs/app/guides/upgrading/version-16 | 2026-11-16 | 2027-01-15 |

### TYP — TypeScript (7.x and the 6.x line)

| ID | Title | Classification | Impact | Detectability tier | Detection indicator | False positives | Severity | Confidence | Support gate | Autofix | Evidence URL | Retrieved | reviewBy |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TYP-001 | `// @ts-ignore` instead of `@ts-expect-error` | obsolete | maintainability | a | comment token `@ts-ignore` | installed TypeScript < 3.9, where the replacement directive does not exist | medium | H | installed TypeScript ≥ 3.9 | safe | https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html | 2026-11-16 | 2027-02-14 |
| TYP-002 | `strict` family not enabled in the resolved tsconfig | situational | maintainability | a | `strict: false`/absent, or `strictNullChecks`/`noImplicitAny` false, after resolving `extends` | an incremental migration with a documented ratchet and a tracked issue; a JS-only project with no tsconfig | medium | H | `tsconfig.json` present and resolvable; otherwise no finding | none | https://www.typescriptlang.org/tsconfig#strict | 2026-11-16 | 2027-02-14 |
| TYP-003 | `any` crossing a module boundary | situational | maintainability | b | `: any`, `<any>`, or `as any` on an exported function param/return or an exported interface field | a documented interop seam with an untyped dependency, with the seam named in a comment | medium | M | TypeScript adapter active (`.ts`/`.tsx`/`.d.ts` in scope) | none | https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any | 2026-11-16 | 2027-02-14 |
| TYP-004 | Type assertion applied to parsed network/storage data | situational | correctness | b | `as T` whose operand is a `res.json()`, `JSON.parse(...)`, or `localStorage.getItem(...)` result with no schema validation in the expression | a same-repo typed client already validated the payload; the assertion is on a literal | high | H | TypeScript adapter active | none | https://www.typescriptlang.org/docs/handbook/2/narrowing.html | 2026-11-16 | 2027-02-14 |

### BLD — build config and client exposure

| ID | Title | Classification | Impact | Detectability tier | Detection indicator | False positives | Severity | Confidence | Support gate | Autofix | Evidence URL | Retrieved | reviewBy |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BLD-001 | Secret-shaped value behind a public env-var prefix | insecure | security | a | env var whose name starts with a framework public prefix (`NEXT_PUBLIC_`, `VITE_`, `PUBLIC_`, `REACT_APP_`, `GATSBY_`, `NUXT_PUBLIC_`) **and** matches `SECRET`/`TOKEN`/`PASSWORD`/`PRIVATE`/`KEY` | a genuinely publishable key (Stripe publishable key, public site ID, analytics ID) | blocker | H | the file must be client-reachable under the installed framework's prefix rules; prefix list is versioned data, not rule code | none | https://nextjs.org/docs/app/guides/environment-variables | 2026-11-16 | 2027-01-15 |
| BLD-002 | Framework build-error suppression | situational | maintainability | a | `typescript.ignoreBuildErrors: true` or `eslint.ignoreDuringBuilds: true` in `next.config.*` | known, tracked, documented debt with an issue link in the config comment | high | M | `next.config.*` present; equivalent keys for other frameworks are a v0.2 adapter | none | https://nextjs.org/docs/app/api-reference/config/next-config-js/typescript | 2026-11-16 | 2027-01-15 |

### AIA — AI-generation-shaped signals

| ID | Title | Classification | Impact | Detectability tier | Detection indicator | False positives | Severity | Confidence | Support gate | Autofix | Evidence URL | Retrieved | reviewBy |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AIA-001 | Placeholder residue in a shipped string or config | situational | maintainability | b | `TODO`/`FIXME`/`lorem ipsum`/`example.com` inside a rendered string literal or a shipped config value, not inside a comment | the marker is in a tracked comment; `example.com` is deliberate in documentation | low | L | none — signal only; must print its caveat and can never be a blocker | none | https://developer.mozilla.org/en-US/docs/Web/HTML | 2026-11-16 | 2026-12-16 |
| AIA-002 | Error swallowed by an empty catch | situational | correctness | a | `catch {}` or `catch (e) {}` with no log, rethrow, state change, or `/* reason */` comment | deliberate, commented best-effort cleanup; a ignore-list lookup that is intentionally silent | medium | H | none | none | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch | 2026-11-16 | 2027-05-15 |
| AIA-003 | Data-dependent component without loading/error/empty branches | situational | correctness | b | component branches on data presence but has no loading branch and no error branch for the same fetch/store | the route-level boundary supplies both (`error.tsx`, `loading.tsx`, an ancestor `ErrorBoundary`); data is synchronously available | high | M | adapter ∈ {`react-jsx`, `next-*`} | none | https://react.dev/reference/react/Suspense | 2026-11-16 | 2027-01-15 |

## 3. Excluded from v1

| Candidate | Why excluded |
|---|---|
| `document.write()` (JS-01) | Source-backed `deprecated` (MDN banner + WHATWG "strongly discouraged"), but it is a single-token web-platform regex already inside the competitor's 33-rule table (30 inherited). Adding severity does not make a duplicate worth shipping. Kept in the register as evidence. |
| Synchronous XHR (JS-06) | Same occupancy; MDN states browsers deprecated synchronous XHR on the main thread. No framework or target-gating value to add. |
| `attachEvent`/`detachEvent` (JS-07) | Same occupancy; platform trivia with no severity model behind it. |
| `javascript:` URL in `href`/`src` (JS-05) | Same occupancy. The only non-duplicative residue is the anchor-*role* confusion, shipped as SEM-002. |
| `target="_blank"` without `rel` (JS-13) | Known false-positive factory: engines imply `noopener` for `target="_blank"` (MDN); `noreferrer` is a privacy decision, not a fix. Also rejected in D-011. |
| `==` loose equality (JS-22) | `x == null` is the idiomatic nullish check; a style preference dressed as correctness, with no harm model. |
| `var`, `<table>` layout (JS-21, SEM-04) | Violates the project's own premise: never flag code for being old. Table-vs-data-table is not separable statically at acceptable precision. |
| Multiple or missing `<h1>` (SEM-07) | HTML permits multiple `h1` in sectioning contexts; `article` scopes legitimately own one each. Pure false-positive factory. |
| Contrast-ratio computation (CSS-05) | Forbidden by QSB §1.4.7: static CSS cannot resolve the cascade, custom properties, `currentColor`, `opacity`/compositing, gradients, or the actually-painted background. Contrast is also the **#1** detected issue in the WebAIM Million, so an approximation would be wrong exactly where users check. |
| `!important` count (CSS-06) | A count is not a defect; utility/override layers use it by convention. |
| `useMemo`/`useCallback` on trivial values (REA-07, REA-08) | No measured harm, and the judgement flips with React Compiler availability. |
| Inline Context provider `value` literal | Low harm (one re-render web) and version-dependent under React Compiler; excluded in favour of the nine shipped React rules. |
| Reduced-motion guard (MOT-01) | **WCAG 2.3.3 is AAA.** An AAA advisory item must never enter a `blocker`/`high` pipeline (QSB §1.1), and QSB §1.4.5 forbids the codemod. The fact is preserved as policy text in `current-web-practices.md`, not as a finding. |
| `100vh` hero (CSS-01) | Undecidable without a mobile target, and the `dvh`/`svh` Baseline date is **`UNVERIFIED (detail)`**. Deferred with the target input. |
| `autocomplete="off"` on auth fields (FRM-03) | Attribute-token support is **`UNVERIFIED`** (BCM §3), and the area is covered by upstream's forms/autofill guide corpus — occupancy leaves no non-duplicative treatment. |
| Live-region absence (ARI-07) | Correct announcement depends on insert-vs-update, `aria-atomic`/`aria-relevant`, and politeness; QSB §1.4.4 caps it to a review question, which is below our shipping bar. |
| Forwarding-wrapper / tiny-dependency / `Function`-type style rules (AIA-01, AIA-05, TYP-006) | Legitimate at API boundaries or purely stylistic with no harm model; shipping them would invert the "never flag opinion" premise. |
| Taint-dependent rules (`innerHTML` from an untrusted source, `postMessage` origin, client-only authorisation) | Tier `c` (§4). REA-005 ships only the literal-vs-non-literal half, severity-capped, and explicitly does not claim taint. |
| `popover` / `<dialog>` / `:has()` / container-query **adoption** advice | Occupied by the upstream guide corpus; and the traps in `current-web-practices.md` make blanket adoption advice wrong (popover newly available, iOS floor 18.3). |

## 4. Tier c — detected only with data-flow or AST, therefore not shipped

A tier-`c` rule is not "harder"; it is **unsound at this budget** and shipping it would produce the exact false positives the product exists to avoid (D-002). Listed so the exclusion is visible and testable.

| Group | Pattern | Why tier c | What would unlock it |
|---|---|---|---|
| `useEffect` deps | Missing/stale/unstable dependencies (`exhaustive-deps`-class) | Requires free-variable and scope analysis of the effect body | A parser dependency (rejected by D-002) or a scope-only heuristic with its own calibration corpus |
| RSC boundary | Non-serialisable prop passed from a Server to a Client Component | Needs the import graph plus serializer knowledge | Import-graph tier plus a documented serialisable-type table |
| Auth | Authorisation enforced only in client code | The server-side check is not in the scanned tree | Cross-file route/handler analysis; report as a question only |
| API surface | Invented/nonexistent prop or hook (`AIA-02`) | Needs installed package types or docs | Resolved dependency versions plus a type index |
| Injection | Untrusted source → HTML sink (`SEC-001`/`SEC-002` in QSB) | Needs a one-hop taint model | A bounded intra-file source→sink model with its own fixture corpus |
| Bundling | Barrel-import equivalence, lazy-load payoff | Needs the import graph **and** a build artefact | Import graph plus optional build output supplied by the user |
| Measurement | LCP/INP/CLS values, bundle size | Not a static question at all | Runtime/lab measurement, which the tool must never fake (QSB `PERF-001`) |
| Rendered state | Focus order, contrast after cascade, target size, reading order | Requires layout and paint | A browser, i.e. out of scope by design (QSB §1.3c) |
| Design judgement | Over-abstraction, "wrong" component boundaries | No measured harm; opinion | Nothing — do not ship |

## Conflicts

Kept both sides; the resolution is binding for this catalog.

| Topic | Input A | Input B | Resolution |
|---|---|---|---|
| Classification vocabulary | `pattern-catalog.md` proposes four extra classes (`inefficient`, `fragile`, `misaligned`, `overengineered`) | D-006 fixes exactly seven classes plus an `Impact` axis | **D-006 wins.** Extensions are expressed as `Impact` values. This file has no eighth class. |
| Autofix vocabulary | Input catalog uses `no`/`detect-only`/`safe`/`situational` | Brief uses `none`/`safe`/`situational` | `no` **and** `detect-only` map to `none`. D-008 means no value is actionable in v0.1. |
| `@ts-ignore` class | `obsolete` (both inputs) | Could be read as `deprecated` | No cited source says "deprecated"; it says the modern replacement exists. Stays `obsolete`. |
| Next.js caching | `pattern-catalog.md` NXT-09: "Next 15 changed the default to no-store" | `framework-specialist`: two live models gated by `cacheComponents`; new apps enable it | **Both are true.** Two models exist; NXT-007 refuses to emit until `cacheComponents` **and** the installed major are resolved. |
| `inert` availability | QSB §1.4.2: "check target" (`UNVERIFIED`) | `modern-web-researcher`: widely available, high date 2025-10-11 | Dated row wins; `inert` is never used as the sole focus-containment remedy on older iOS. |
| `popover` Baseline | QSB §1.4.3: `UNVERIFIED` | `modern-web-researcher`: newly available 2025-01-27 (iOS floor 18.3) | Dated row wins; recorded in `current-web-practices.md`; no shipped rule recommends popover. |
| Reduced motion | `pattern-catalog.md`: `situational`, medium, actionable | QSB §1.1/§1.4.5: WCAG 2.3.3 is AAA and never codemoddable | QSB wins: excluded as a finding, preserved as policy. |
| Autofix on `next/font` | `pattern-catalog.md` marks NXT-04 `safe` | Font family/weight mapping is not mechanical | Downgraded to `situational`; metadata only, and v0.1 applies nothing. |
| Upstream rule counts | Inventory: "38 registered rule modules" (upstream) | Adjacent: competitor ships "33 regex rules, 30 inherited" | Not a contradiction — modules vs flattened rules. Both cited as-is. |
| Guide counts | Upstream PUB v1.0.1: 210 guide files | Competitor vendors "208 guides byte-identical" | Snapshot difference; 210 is upstream's tree, 208 is the vendored snapshot. Not averaged. |

## Summary

- **Shipped:** 37 rules — 11 cross-cutting (SEM 2, ARI 2, FRM 2, IMG 3, MET 1, CSS 1), 17 framework (REA 9, NXT 8), 6 tooling (TYP 4, BLD 2), 3 AI-generation signals (AIA 3). Tier `a` = 18, tier `b` = 19; tier `c` = 0 shipped.
- **Severity:** 4 `blocker`, 13 `high`, 17 `medium`, 3 `low` — and REA-005 carries an `info` downgrade path when a recognised sanitiser is visible.
- **Autofix metadata:** 3 `safe`, 6 `situational`, 28 `none` — and **nothing is applied in v0.1** (D-008).
- **Excluded:** 19 rows covering ~24 candidate patterns, dominated by competitor occupancy (web-platform tokens), false-positive factories (`target="_blank"`, multiple `h1`, contrast), and AAA-only a11y items.
- **Tier c:** 9 groups, none shippable without a parser or a browser.
- **Conflicts:** 10, all resolved above; none averaged.
- **Remaining `UNVERIFIED`:** `tabindex` warning-page reachability; async request-API version boundary; `dvh`/`svh` Baseline; TypeScript 7.0 announcement URL; popover Baseline date at the QSB; `inert` floor; autocomplete token support; React `defaultProps` removal. Each is confined to a rule gate, a `reviewBy`, or a `Confidence: M/L` row — none is asserted as fact.
