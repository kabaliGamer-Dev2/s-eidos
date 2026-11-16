# Framework-Specific, Version-Aware Guidance

Rule-engine input for an original front-end pattern detection and migration tool.
Retrieval date for every row: **2026-11-16**. Versions were read from npm registry metadata and from each project's own docs; where the two disagree the row says so.

**Reading the "Detectable statically?" column:** `Yes — <indicator>` means a single-file AST/source pattern suffices. `Partial — <indicator>` means the pattern is visible but the *judgement* needs extra evidence (cross-file, config, or type information). `No — <reason>` means a static analyzer must not claim it.

**Conventions:** `FP` = false positives. IDs are stable and intended to be encoded as rule IDs. `Version scope` is mandatory for Next.js because App Router and Pages Router answers differ.

---

## 1. Version landscape

### 1.1 Current stable, verified

| Package | Current stable | Fact source | Corroborating source | Notes |
| --- | --- | --- | --- | --- |
| React | **19.3.1** | `registry.npmjs.org/react/latest` (version field) | `react.dev` docs render "v19.3" / "react@19.3" in the reference sidebar | Docs and registry agree on the 19.3 line |
| Next.js | **16.4.6** | `registry.npmjs.org/next/latest` | nextjs.org docs sidebar renders "Latest v16.4.6" | 16.x is the current major; docs are App-Router-first |
| TypeScript | **7.0.2** | `registry.npmjs.org/typescript/latest` | TypeScript blog "Announcing TypeScript 7.0", 2026-07-08 | TS 7 is the native (Go) port; 7.1 is in beta (blog, 2026-10-20) |
| Node.js | **26.13.1** (LTS "Lithium") | `nodejs.org/dist/index.json` (`lts: "Lithium"`, date 2026-11-10) | `nodejs.org/en/about/previous-releases` table | Latest non-EOL major; v27 is Alpha only |
| Vite | **8.3.8** | `registry.npmjs.org/vite/latest` | `vite.dev` sidebar renders "v8.3.7" (docs one patch behind the registry) | Registry and docs disagree by one patch; cite 8.3.x |
| Vitest | **5.1.0** | `registry.npmjs.org/vitest/latest` | `vitest.dev/guide/migration/` is the v5 migration guide | Peer dependency on Vite `^6.4.0 \|\| ^7.0.0 \|\| ^8.0.0` (registry metadata) |
| Playwright | **1.65.1** | `registry.npmjs.org/playwright/latest` | `playwright.dev/docs/release-notes` | `engines.node >=20` (registry metadata) |
| ESLint | **10.15.0** | `registry.npmjs.org/eslint/latest` | Blog "ESLint v10.0.0 released", Feb 2026 | v10.0.0 removed eslintrc support; 10.15.0 is the current patch line |

### 1.2 Support window — verified vs unverified

| Package | Support window | Verification |
| --- | --- | --- |
| Node.js | **Verified.** v26 (Lithium), v24 (Krypton), v22 (Jod) are all "LTS"; v20 reached EOL 2026-03-24; v25 EOL 2026-03-31. Docs: "Production applications should only use Active LTS or Maintenance LTS releases." | `nodejs.org/en/about/previous-releases` |
| Node.js (policy change) | **Verified.** "Starting with Node.js 27, the release cycle will be annual and every major version will move to LTS status after its six-month Current phase" | `nodejs.org/en/about/previous-releases` |
| React | `UNVERIFIED — no formal per-major support window is published.` Practical floor observable from metadata: Next 16 declares peer `react: ^18.2.0 \|\| ^19.0.0`, so 18.2+ is still a live target. | registry `next@16.4.6` peerDependencies |
| Next.js | `UNVERIFIED — no LTS or support-window policy found on nextjs.org`; only the current major's docs are published (v16.4.6). | nextjs.org/docs |
| TypeScript | `UNVERIFIED — no LTS policy.` Both a 6.x line and 7.x exist per the 7.0 announcement's own benchmark table ("TypeScript 6" vs "TypeScript 7"). | TypeScript blog 7.0 |
| Vite | `UNVERIFIED — no stated EOL dates.` Versioned docs sites are maintained for v7, v6, v5, v4, v3, v2 (vite.dev sidebar links) but that is documentation, not a support promise. | vite.dev sidebar |
| ESLint | **Verified.** "ongoing support for the current version and six months of limited support for the previous version"; v10.x is **Current** (first release 2026-02-06), v9 moved to EOL 2026-08-06 | https://eslint.org/version-support/ |
| Vitest / Playwright | `UNVERIFIED — no stated support windows.` | — |

### 1.3 Toolchain compatibility floor (derived from `engines` in registry metadata)

| Tool | `engines.node` | Consequence for the analyzer |
| --- | --- | --- |
| Next.js 16.4.6 | `>=20.9.0` | Lowest floor; safe for any LTS |
| Vite 8.3.8 | `^20.19.0 \|\| >=22.12.0` | Excludes Node 21/23/25-style odd lines |
| Vitest 5.1.0 | `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0` | **Node 25 is not satisfiable** — flag it if detected |
| Playwright 1.65.1 | `>=20` | Fine |
| ESLint 10.15.0 | `^20.19.0 \|\| ^22.13.0 \|\| >=24` | Fine on 26 |
| TypeScript 7.0.2 | `>=16.20.0` | Note: TS 7 ships platform binaries as optional deps |

> Detector rule: read `engines.node` from the project's `node_modules/<pkg>/package.json` and compare against `process.version`; never hardcode the table above. All `engines` values above were read from the respective `registry.npmjs.org/<pkg>/latest` documents, retrieved 2026-11-16.

---

## 2. React

Doc version observed: `react.dev` reference sidebar is labelled **react@19.3**, matching registry 19.3.1.

| ID | Pattern | Why it is a problem | Correct pattern | Detectable statically? | False positives | Evidence URL | Retrieved | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-01 | Deriving state with `useEffect` + `setState` | Extra render pass and a frame of stale UI; state can desync from props | Compute during render; reset via `key`; adjust in event handler | Yes — `useEffect` whose body only calls a state setter whose argument derives solely from deps | Effects that sync to real external systems; subscription bridges | https://react.dev/learn/you-might-not-need-an-effect | 2026-11-16 | High |
| R-02 | Data fetching in `useEffect` with no abort/cleanup | Race condition: late response overwrites newer state; state set after unmount | Return cleanup that aborts (`AbortController`) or guard with an `ignore` flag; or use framework fetch | Yes — `useEffect` containing `fetch(`/`axios` with no returned function and no `AbortController` signal | Fetch in a data library (SWR/React Query); fire-and-forget analytics; request already cancelled by router | https://react.dev/reference/react/useEffect | 2026-11-16 | High |
| R-03 | Effect dependency mistakes (missing, stale, unstable) | Stale closures read old props; unstable object deps re-run every render | List every reactive value; move object creation inside the effect; `useEffectEvent` for non-reactive reads | Partial — needs scope analysis of free variables in the effect body (same algorithm as `exhaustive-deps`) | Deliberately non-reactive values; values only read in cleanup; `ref` reads | https://react.dev/reference/react/useEffect https://react.dev/reference/react/useEffectEvent | 2026-11-16 | High |
| R-04 | `key={index}` on a reorderable list | React matches rows by position, so item state/timers/DOM focus attach to the wrong row | Stable ID from the data (`key={item.id}`) | Yes — `key` argument is the `map` index parameter | Static lists that never reorder; keyless-render-only rows with no state or inputs | https://react.dev/learn/rendering-lists | 2026-11-16 | High |
| R-05 | Key produced by `Math.random()` / `Date.now()` / fresh `uuid()` during render | A new key each render forces a full unmount+remount, destroying state and focus | Stable identity from data; `useId` for a11y IDs (never as a list key) | Yes — `key` expression is a call to `Math.random`, `Date.now`, `crypto.randomUUID` | Key generated once and stored in state/ref; deliberately forced reset after submit | https://react.dev/learn/rendering-lists https://react.dev/reference/react/useId | 2026-11-16 | High |
| R-06 | `ref.current` read or written during render; ref used as a render-visible value | Refs do not trigger re-render, so UI silently disagrees with the ref | Use state for rendered values; touch refs only in effects/handlers | Yes — `ref.current` access in a component body outside `useEffect`/handler | Lazy-init guard (`if (ref.current === null)`); measuring in `useLayoutEffect` | https://react.dev/reference/react/useRef | 2026-11-16 | High |
| R-07 | `useMemo`/`useCallback` on cheap values or with only-primitive deps | Adds allocation and dependency burden with no measurable win; memo is not a semantic guarantee | Memoise only measured hot paths or where referential identity is required | Yes — density of memo hooks in a component + dep list of literals/primitive params | Value feeds `React.memo` child or context value; expensive sort/filter; effect dep stability | https://react.dev/reference/react/useMemo | 2026-11-16 | Medium |
| R-08 | Context value is a fresh object/array/function literal | Every provider render re-renders all consumers | Memoise the value, or pass stable primitives and split contexts | Yes — `value={{` / `value={[` / inline arrow inside `<Provider>` | Provider re-renders rarely; React Compiler enabled (auto-memoises) | https://react.dev/reference/react/useContext | 2026-11-16 | High |
| R-09 | `dangerouslySetInnerHTML` with a non-literal expression | Direct XSS path if the string is user- or API-controlled | Sanitise at the boundary, or render structured data instead | Partial — flag any use; escalate when the value is not a literal and no sanitiser call is in the expression | Expression wraps `DOMPurify.sanitize(...)`; trusted build-time HTML constant | https://react.dev/reference/react-dom/components/common | 2026-11-16 | High |
| R-10 | Switching controlled ↔ uncontrolled (`value={x ?? undefined}`, `value` + `defaultValue`) | React warns and the input keeps internal state; behaviour differs between renders | Pick one mode per input for its lifetime; use `value` + `onChange` with a stable fallback (`''`) | Yes — `value` expression is a conditional yielding `undefined`/`null`, or `value` and `defaultValue`/`defaultChecked` on the same element | Two different elements mounted conditionally; wrapper normalises the fallback | https://react.dev/reference/react-dom/components/input | 2026-11-16 | Medium |
| R-11 | Hand-rolled submit state (`onSubmit` + `setLoading`) instead of form actions | Loses progressive enhancement, built-in pending/error state, and reset semantics | `<form action={fn}>` with `useActionState`, and `useFormStatus`/pending from the hook | Yes — `onSubmit` + `preventDefault` + a boolean `isSubmitting` state, and no `useActionState` import | Non-React-19 targets; file uploads to a third-party endpoint; forms inside a form library | https://react.dev/reference/react/useActionState https://react.dev/reference/react-dom/components/form | 2026-11-16 | Medium |
| R-12 | `React.lazy`/async subtree with no `Suspense` or no error boundary above it | A rejected lazy import or thrown error unmounts the whole tree to a blank screen | Wrap in `Suspense` + an error boundary near the failure | Partial — `React.lazy` without an ancestor `Suspense` in the same file; boundary needs cross-file analysis | Framework boundary present (`app/error.tsx`, `errorElement`); boundary registered in a parent module | https://react.dev/reference/react/Suspense https://react.dev/reference/react/Component | 2026-11-16 | Medium |
| R-13 | Custom component declares `aria-*`/`label`/`id` props but does not spread them to the DOM node | Accessibility props silently vanish; screen readers see an unnamed control | Spread `...rest` onto the underlying element; or use `forwardRef`+`useId` for label wiring | Yes — destructured props named `aria-*`/`role`/`id` with no `...rest` spread in the returned JSX | Props intentionally consumed (e.g. `aria-label` mapped to a visible caption); props forwarded via a hook | https://react.dev/reference/react-dom/components/common | 2026-11-16 | High |
| R-14 | Hydration hazards: `Date.now()`, `new Date()`, `Math.random()`, `localStorage`/`window` read in render, locale/timezone formatting without explicit options | Server HTML and first client render disagree → hydration mismatch and discarded DOM | Move to `useEffect`, gate on `useSyncExternalStore`/`useId`, or pass explicit `locale`/`timeZone` | Yes — render-body (not effect/handler) reference to those globals, or `toLocaleString()` with no argument | Code inside `useEffect`/event handler; component only rendered client-side (dynamic `ssr: false`); value already injected from the server | https://react.dev/reference/react-dom/client/hydrateRoot | 2026-11-16 | High |
| R-15 | Large list rendered with a plain `.map` and no windowing | Thousands of live DOM nodes; slow paint and scroll on low-end devices | Virtualise, paginate, or use CSS `content-visibility` | Partial — `.map` over an array from fetch/props with no windowing library import and a large known constant | Bounded lists; server-paginated data; presentational tables under ~100 rows | https://react.dev/learn/rendering-lists | 2026-11-16 | Low |
| R-16 | Filter/sort/page/page-size kept in `useState` instead of the URL | State is unshareable and lost on reload/back; deep links break | Put shareable UI state in the query string (`useSearchParams` in Next, router in plain React) | Partial — `useState` named `page`/`query`/`sort`/`filter` in a route component with no router import | Ephemeral UI state (hover, draft text); state already synced by a store middleware | https://react.dev/learn/managing-state | 2026-11-16 | Medium |
| R-17 | Input with no accessible name | Screen-reader users hear "edit text" with no purpose | `<label htmlFor>` + `id`, or `aria-label`/`aria-labelledby` | Yes — `<input>`/`<select>`/`<textarea>` with no `id`, no ancestor `<label>`, no `aria-label*` | Input wrapped by a `<label>`; name supplied by a design-system wrapper component | https://react.dev/reference/react-dom/components/common | 2026-11-16 | High |
| R-18 | No focus management on client-side route change | Keyboard and screen-reader focus stays on the stale page; users are not told navigation happened | Move focus to the new heading/main region and announce the route | Partial — absence of any focus/announce call in the router layout (project-level) | Framework handles it; app uses a documented a11y router add-on | https://nextjs.org/docs/architecture/accessibility | 2026-11-16 | Medium |
| R-19 | State setter called unconditionally in the render body | Infinite render loop or "Too many re-renders" | Move to an event handler, or guard with a condition / derive instead | Yes — setter/dispatch call in a component body at statement position | Setter inside `if (prev !== next)` render-time adjust (documented pattern); inside `useMemo` | https://react.dev/reference/react/useState | 2026-11-16 | High |
| R-20 | `useEffect` reading latest props but omitting them from deps (stale closure) where `useEffectEvent` is intended | Effect captures an old value; behaviour drifts over time | Extract the non-reactive read into `useEffectEvent` (React 19.2+) | Partial — effect references a prop/state not in deps and the reference is not a dependency of the effect's *purpose* | Value is intentionally frozen (mount-only subscription); deps list intentionally narrowed | https://react.dev/reference/react/useEffectEvent | 2026-11-16 | Medium |

---

## 3. Next.js

Current major **16.4.6**. The docs are split: `/docs/app/*` (App Router) and the Pages Router docs. Statements below name their scope.

### 3.1 Behaviour that changed and that detectors get wrong

| ID | Topic | Verified statement | Version scope | Evidence URL | Retrieved |
| --- | --- | --- | --- | --- | --- |
| N-C1 | Implicit caching removed | "By default, `fetch` requests are not cached." Opt in per request with `cache: 'force-cache'` | Next 15+, App Router, **without** `cacheComponents` | https://nextjs.org/docs/app/guides/caching-without-cache-components | 2026-11-16 |
| N-C2 | Cache Components is opt-in but on by default in new apps | "caching with Cache Components is entirely opt-in. All dynamic code in any page, layout, or API route is executed at request time by default" | Next 16+, App Router, `cacheComponents: true` | https://nextjs.org/blog/next-16 | 2026-11-16 |
| N-C3 | New projects ship with it enabled | "New App Router apps created with the recommended `create-next-app` defaults already have Cache Components and Partial Prefetching enabled." | Next 16+ | https://nextjs.org/docs/app/getting-started/caching | 2026-11-16 |
| N-C4 | The two caching models have separate docs | The Cache Components page explicitly defers to a "Caching and Revalidating (Previous Model)" guide for apps that have not enabled the flag | Next 16+ | https://nextjs.org/docs/app/getting-started/caching | 2026-11-16 |
| N-C5 | `middleware.ts` renamed | "Middleware replaced by `proxy.ts` to clarify network boundary" | Next 16+ | https://nextjs.org/blog/next-16 | 2026-11-16 |
| N-C6 | Turbopack is the default bundler | "Turbopack (stable): Default bundler for all apps" | Next 16+ | https://nextjs.org/blog/next-16 | 2026-11-16 |
| N-C7 | `params`/`searchParams` are async | Async `params` is listed under "Breaking Changes"; the upgrade guide is the migration path | Next 15 introduced it; Next 16 treats sync access as breaking | https://nextjs.org/docs/app/guides/upgrading/version-16 | 2026-11-16 |
| N-C8 | React floor | Next 16 peer deps: `react: ^18.2.0 \|\| 19.0.0-rc-... \|\| ^19.0.0` | Next 16.4.6 | https://registry.npmjs.org/next/latest | 2026-11-16 |
| N-C9 | PPR flag removed | "the previous experimental `experimental.ppr` flag and configuration options have been removed in favor of the Cache Components configuration" | Next 16+ | https://nextjs.org/blog/next-16 | 2026-11-16 |

> **Detector rule for caching:** never emit a caching finding without first resolving `cacheComponents` from `next.config.*`. If the flag is absent/false, apply the N-C1 model; if true, apply N-C2. Emitting the wrong one is a false positive by construction.

### 3.2 Findings

| ID | Pattern | Why it is a problem | Correct pattern | Detectable statically? | False positives | Version scope | Evidence URL | Retrieved | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| N-01 | `'use client'` at the top of most files | Pushes the whole subtree into the client bundle; loses server-only data access | Keep the directive at the smallest interactive leaf; pass server data down as serialisable props | Partial — ratio of `'use client'` files to total route files (project-level) | Small app where everything is interactive; providers that genuinely must be client | App Router 13+ | https://nextjs.org/docs/app/getting-started/server-and-client-components | 2026-11-16 | Medium |
| N-02 | Client-only API used in a file with no `'use client'` | `useState`/`onClick`/`window` throw or are ignored in a Server Component | Add `'use client'` at the boundary, or move the logic to a client leaf | Yes — hook/handler/`window` reference in a module with no directive and no client ancestor | File is imported from a client module (needs import-graph analysis — treat as Partial) | App Router 13+ | https://nextjs.org/docs/app/getting-started/server-and-client-components | 2026-11-16 | High |
| N-03 | Non-serialisable prop passed from Server to Client Component | Functions, class instances, and Symbols cannot cross the serialisation boundary | Pass serialisable data; pass Server Actions (which are `'use server'` functions) instead of closures | Partial — prop value is an arrow function, `new X()`, or a non-exported local function | Prop is a Server Action reference; prop is a `Date`/`Map` supported by the RSC serializer | App Router | https://nextjs.org/docs/app/getting-started/server-and-client-components | 2026-11-16 | Medium |
| N-04 | Hydration mismatch sources (`Date`, `Math.random`, locale, invalid nesting) | Server HTML ≠ first client render; React discards and re-renders, losing input state | Render the same value on both sides; defer to `useEffect`; fix invalid HTML nesting (`<div>` in `<p>`) | Partial — render-body use of those globals + JSX nesting that the HTML parser would repair | Client-only rendering; value supplied by the server as a prop | App Router + Pages Router | https://react.dev/reference/react-dom/client/hydrateRoot | 2026-11-16 | High |
| N-05 | Raw `<img>` for content images | No automatic sizing/format negotiation → larger LCP and CLS | `next/image` with `width`/`height` or `fill` | Yes — literal `<img` in a route/component that imports nothing from `next/image` | SVG icons (optimisation disabled by default), sprite/inline art, images inside `<noscript>`, third-party widgets owning their DOM | App Router + Pages Router | https://nextjs.org/docs/app/getting-started/images | 2026-11-16 | High |
| N-06 | `next/image` without `width`/`height` and without `fill` | Layout shift or a build-time error | Provide intrinsic dimensions, or `fill` inside a positioned parent | Yes — `<Image` with neither `width`/`height` nor `fill` | Dimensions spread from a props object (`{...dims}`) — treat as Partial | App Router + Pages Router | https://nextjs.org/docs/app/getting-started/images | 2026-11-16 | High |
| N-07 | Font loaded via `<link>`/`@import` instead of `next/font` | Extra connection + FOUT/CLS; no automatic self-hosting or preload | `next/font` (or `next/font/google`) and use the exported `className`/CSS variable | Yes — `<link href="...fonts.googleapis...">` or `@import url(...fonts...)` with no `next/font` import | Brand font served from the same origin with `font-display` already set; fonts in an email template | App Router + Pages Router | https://nextjs.org/docs/app/getting-started/fonts | 2026-11-16 | High |
| N-08 | `next/script` with `strategy="beforeInteractive"` outside the root layout | Docs: scripts with this strategy "must be placed inside a root layout"; elsewhere the strategy cannot be applied | Use `beforeInteractive` only in `app/layout.tsx` or `_document`; otherwise `afterInteractive`/`lazyOnload` | Yes — `beforeInteractive` in a file that is not the root layout/`_document` | File is a nested layout that is effectively the root; script is a polyfill that must preload | App Router + Pages Router | https://nextjs.org/docs/app/api-reference/components/script | 2026-11-16 | High |
| N-09 | Hand-written `<head>`/`<title>`/`<meta>` in App Router | Fights the Metadata API; tags get duplicated or dropped in streaming | Export `metadata`/`generateMetadata` from the route file | Yes — `<head>`/`<title>`/`<meta name=` in an App Router file | The root layout intentionally renders a `<head>`-level tag with no Metadata equivalent (rare); Pages Router files (use `next/head`) | **App Router only** | https://nextjs.org/docs/app/getting-started/metadata-and-og-images | 2026-11-16 | High |
| N-10 | `pages/api/*` handler written in an App Router project (or vice versa) | Wrong runtime conventions (`req`/`res` vs `Request`/`Response`), wrong caching defaults | App Router: `app/**/route.ts` exporting `GET`/`POST`; Pages Router: `pages/api/*` | Yes — file path + exported handler shape | Intentional coexistence during migration; `route.ts` inside `app/` is correct | Scope: path decides which rule applies | https://nextjs.org/docs/app/getting-started/route-handlers | 2026-11-16 | High |
| N-11 | Reading `params`/`searchParams` as plain objects | They are Promises; `.id` is `undefined` and the page breaks at runtime | `const { id } = await params` in a Server Component; `use(params)` in a Client Component | Yes — member access on `params`/`searchParams` without `await`/`use(` in an App Router page/layout | The file is a Pages Router page; value already awaited into a local | **Next 15+ App Router; breaking in 16** | https://nextjs.org/docs/app/guides/upgrading/version-16 | 2026-11-16 | High |
| N-12 | `searchParams`/`params` used with no validation | Garbage query strings (`?page=abc`, repeated keys, arrays) reach rendering/database code | Validate and narrow at the route boundary (schema parse) before use | Partial — `searchParams` destructured and passed straight into queries/render with no schema call | Value only echoed as text; framework-typed route params with generated types | App Router | https://nextjs.org/docs/app/getting-started/layouts-and-pages | 2026-11-16 | Medium |
| N-13 | Secret read in client-reachable code (`NEXT_PUBLIC_` misuse or `process.env` in a Client Component) | `NEXT_PUBLIC_` values are inlined into the client bundle at build time — they are public forever | Keep secrets unprefixed and server-only; never reference them from `'use client'` modules | Partial — `process.env.X` where `X` has no `NEXT_PUBLIC_` prefix inside a client module, plus any `NEXT_PUBLIC_*KEY/TOKEN/SECRET*` name | Value is a publishable key by design (e.g. a public analytics site ID) | App Router + Pages Router | https://nextjs.org/docs/app/guides/environment-variables | 2026-11-16 | High |
| N-14 | `export const dynamic`/`revalidate` used to "fix" caching under Cache Components | Segment config predates the Cache Components model; mixing mental models produces stale or always-dynamic pages | Use `"use cache"` + `cacheLife`/`cacheTag` when the flag is on; keep segment config for the previous model | Partial — requires `cacheComponents` resolved from config first | App has not enabled `cacheComponents` (then segment config is correct) | `dynamic`/`revalidate` = previous model; `"use cache"` = Next 16 + flag | https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents | 2026-11-16 | Medium |
| N-15 | Authentication/authorisation enforced only in middleware | Edge middleware/proxy is a routing layer, not an authorisation boundary for every data path | Re-check the session in the server component/handler that reads the data | Partial — auth check present in `middleware.ts`/`proxy.ts` and absent in the matching route/handler | Centralised auth helper invoked by every handler; app has no protected data paths | **Next 16+ uses `proxy.ts`** | https://nextjs.org/docs/app/getting-started/proxy | 2026-11-16 | Medium |
| N-16 | Portable code that assumes a writable filesystem or long-lived process | Serverless/edge targets have ephemeral disk and execution time limits; self-hosted does not | Use object storage/DB; move long work to a queue; declare the deploy target | No — requires deployment-target knowledge the source does not carry | Self-hosted deployment (`output: 'standalone'`); code runs only in a build script | App Router + Pages Router, target-dependent | https://nextjs.org/docs/app/getting-started/deploying | 2026-11-16 | Low |
| N-17 | `getServerSideProps`/`getStaticProps` in an App Router project | Pages-Router data APIs do not exist in App Router files and are silently unused | Server Components with `await`; `generateStaticParams` for static params; route handlers for APIs | Yes — exported `getServerSideProps`/`getStaticProps`/`getStaticPaths` inside `app/` | File is under `pages/` (then it is correct) | App Router vs Pages Router (path-decided) | https://nextjs.org/docs/app/getting-started/fetching-data | 2026-11-16 | High |
| N-18 | `'use client'` placed too high (root layout) for one small widget | Ships the entire tree as client JS | Move the boundary down to the widget | Partial — directive in `app/layout.tsx`/`app/page.tsx` with no hook usage in that file | The root genuinely needs client state (theme, providers) | App Router | https://nextjs.org/docs/app/getting-started/server-and-client-components | 2026-11-16 | Medium |
| N-19 | `next/head` used in an App Router file | `next/head` is a Pages-Router API | Metadata API | Yes — `import Head from 'next/head'` under `app/` | File under `pages/` | App Router vs Pages Router | https://nextjs.org/docs/app/getting-started/metadata-and-og-images | 2026-11-16 | High |
| N-20 | Loading state and error state missing for a route | Users see a blank screen during navigation or a raw stack on failure | `loading.tsx` + `error.tsx` (App) or explicit pending/error UI | Partial — route segment lacks sibling `loading.tsx`/`error.tsx` (file-set analysis) | Route is fully static and cannot fail; parent segment supplies both | App Router | https://nextjs.org/docs/app/getting-started/error-handling | 2026-11-16 | Medium |

---

## 4. TypeScript

Current stable **7.0.2** (native port, announced 2026-07-08). Two consequences the analyzer must encode:

1. **The compiler API moved.** `typescript@7` exports `./unstable/ast`, `./unstable/fs`, `./unstable/sync`, `./unstable/async`, `./unstable/proto` (registry metadata, `exports` field) and ships platform binaries as optional dependencies (`@typescript/typescript-win32-x64`, …). A rule engine that wants type information from TS 7 must target the `unstable/*` surface, not the historical `ts.*` API. Confidence: High (registry metadata).
2. **Two compiler lines coexist.** The 7.0 announcement benchmarks "TypeScript 6" against "TypeScript 7", so a codebase may pin either. Read the installed version; never assume.

### 4.1 Findings

| ID | Pattern | Why it is a problem | Correct pattern | Detectable statically? | False positives | Evidence URL | Retrieved | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-01 | `strict` absent/false | Unlocks the whole family below; `null`/`undefined` flow unchecked | `"strict": true` | **Yes — from `tsconfig.json` only** | Extended config sets it (must resolve `extends`); JS-only project | https://www.typescriptlang.org/tsconfig#strict | 2026-11-16 | High |
| T-02 | `strictNullChecks` off | `null` assignable to every type; the classic `undefined` crash class | On (implied by `strict`) | Yes — config only | Overridden later in `extends` chain | https://www.typescriptlang.org/tsconfig#strictNullChecks | 2026-11-16 | High |
| T-03 | `noUncheckedIndexedAccess` off | `arr[0]` and `record[key]` are typed as present when they may be `undefined` | On — forces a guard at every index access | Yes — config only | Heavy numeric/DOM-buffer code where the cost outweighs the gain | https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess | 2026-11-16 | High |
| T-04 | `exactOptionalPropertyTypes` off | `{ a?: string }` accepts an explicit `undefined`, so "absent" and "undefined" are not distinguished | On when serialising to JSON/DB | Yes — config only | Libraries whose public types rely on the looser behaviour | https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes | 2026-11-16 | High |
| T-05 | `noImplicitOverride` off | A renamed base method silently stops overriding | On — requires `override` | Yes — config only | Code with no class hierarchies | https://www.typescriptlang.org/tsconfig#noImplicitOverride | 2026-11-16 | High |
| T-06 | `noFallthroughCasesInSwitch` off | Accidental fallthrough in reducers/state machines | On | Yes — config only | — | https://www.typescriptlang.org/tsconfig#noFallthroughCasesInSwitch | 2026-11-16 | High |
| T-07 | `verbatimModuleSyntax` off + `import type` not used | Type-only imports survive transform, pulling runtime deps into the bundle | `"verbatimModuleSyntax": true` and `import type` | Yes — config; per-import shape needs AST | Babel/SWC `isolatedModules`-only pipelines; CJS interop requiring elision | https://www.typescriptlang.org/tsconfig#verbatimModuleSyntax | 2026-11-16 | High |
| T-08 | `moduleResolution` not `"bundler"` in a Vite/Next app | Node-style resolution rejects valid bundler imports and rewrites extension expectations | `"moduleResolution": "bundler"` with `"module": "esnext"` | Yes — config only | Project emits with `tsc` for Node (then `nodenext` is correct) | https://www.typescriptlang.org/tsconfig#moduleResolution | 2026-11-16 | High |
| T-09 | `any` in place of `unknown` at a boundary | Disables checking and propagates silently through the call graph | `unknown` + narrowing/validation | Yes — AST: explicit `any` annotations and `as any` | Interop with untyped third-party globals; incrementally typed JS migration files | https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html | 2026-11-16 | High |
| T-10 | `@ts-ignore` instead of `@ts-expect-error` | Suppresses errors forever, including ones that no longer apply | `@ts-expect-error` (errors when the suppression becomes unnecessary) | Yes — comment scan | `@ts-ignore` on a line that legitimately must never be revisited (rare) | https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html | 2026-11-16 | High |
| T-11 | `as` assertions / non-null `!` on values from `fetch`/`JSON.parse`/`localStorage` | Assertions are erased; a wrong shape crashes at the first property access | Validate at the boundary and narrow; keep `as` for genuinely-known DOM/library facts | Yes — `as T` / `x!` where `x` derives from a parse/fetch call | `as const`; assertions after an explicit validation call | https://www.typescriptlang.org/docs/handbook/2/everyday-types.html | 2026-11-16 | High |
| T-12 | `querySelector`/`getElementById` result used without a null guard | They return `Element \| null` / `HTMLElement \| null`; `noUncheckedIndexedAccess`-style crashes at runtime | Guard, or use `querySelector<T>` plus a check | Yes — call result dereferenced on the same line without `?.`/`if` | Assertion already applied (`!`); element is guaranteed by a preceding guard | https://www.typescriptlang.org/tsconfig#lib | 2026-11-16 | High |
| T-13 | `e.target.value` read in a DOM event handler typed as `Event` | `target` is `EventTarget \| null` and has no `value` | Narrow (`e.target instanceof HTMLInputElement`) or type the handler `(e: Event & { currentTarget: HTMLInputElement })` | Yes — `.target.value` on an un-narrowed event param | Handler already typed with a specific `HTMLInputElement` event | https://developer.mozilla.org/en-US/docs/Web/API/EventTarget | 2026-11-16 | High |
| T-14 | `next-env.d.ts` edited by hand or missing from `tsconfig.include` | It is generated; edits are overwritten, and exclusion breaks JSX/image-module types | Leave it generated and committed; rely on `next dev`/`next build` to refresh | Yes — file content hash differs from the generated template, or absent from `include` | Project intentionally uses `typedRoutes`-generated types elsewhere | https://nextjs.org/docs/app/api-reference/config/typescript | 2026-11-16 | Medium |
| T-15 | Untrusted JSON typed by assertion only (`const data = await res.json() as User`) | Types are compile-time only; nothing validates the payload | Schema-validate at the boundary, then derive the type from the schema | Yes — `as T` applied directly to `res.json()`/`JSON.parse()` | Response came from a same-repo typed client that already validates | https://www.typescriptlang.org/docs/handbook/2/basic-types.html | 2026-11-16 | High |
| T-16 | `satisfies` not used for config objects | Widening loses literal keys; annotation loses literal values | `const config = {...} satisfies Config` | Yes — object literal annotated with `: T` instead of `satisfies T` | The widened type is exactly what is wanted (exported API surface) | https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html | 2026-11-16 | Medium |

### 4.2 Why "config-detectable" vs "type-information" matters for a fast analyzer

| Check class | Cost | Examples | Engine implication |
| --- | --- | --- | --- |
| Config-only (read `tsconfig.json`, resolve `extends`) | Microseconds, no parser | T-01…T-08 | Run first, as a project-level gate; degrade gracefully if no tsconfig (plain HTML/JS users) |
| Syntax/AST-only | Milliseconds per file | T-09…T-13, T-15, T-16 | Core rule pass; no `typescript` dependency required beyond a parser |
| Type-information required | Seconds; needs a `Program` | Cross-module `any` propagation, discriminated-union exhaustiveness, `satisfies` necessity | Must be an **opt-in tier**. TS 7's `unstable/*` API surface (see above) means this tier needs its own adapter and version guard |

**Design rule:** the analyzer must produce a useful report with tier 1 + tier 2 only. Tier 3 is an enhancement, not a prerequisite — this is what keeps plain HTML/CSS/JS users from being forced to install the TypeScript toolchain.

---

## 5. Web Components

Status note: declarative shadow DOM (`shadowrootmode` on `<template>`) is "Widely available (since 2026-08-20)" per the Web Platform DX feature explorer, with Chrome 111 / Firefox 123 / Safari 16.4 as the first supporting releases (https://web-platform-dx.github.io/web-features-explorer/features/declarative-shadow-dom/, retrieved 2026-11-16). Spec-level status is tracked in the HTML Standard's custom-elements section.

| ID | Pattern | Why it is a problem | Correct pattern | Detectable statically? | False positives | Evidence URL | Retrieved | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W-01 | Non-idempotent `connectedCallback` | It runs on **every** insertion, so moving the element re-runs setup and duplicates listeners | Make setup idempotent; do teardown in `disconnectedCallback` and re-arm on reconnect | Yes — listener/interval created in `connectedCallback` with no matching removal in `disconnectedCallback` | Setup guarded by a boolean; element never moves | https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements | 2026-11-16 | High |
| W-02 | Full DOM access in the constructor | Children are not parsed yet; `super()` must be first, and attributes may be absent | Do initialisation in `connectedCallback`; read attributes in `attributeChangedCallback` | Yes — `this.children`/`this.querySelector`/`appendChild` inside `constructor` | Creating a shadow root in the constructor (allowed) | https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements | 2026-11-16 | High |
| W-03 | Global listener/timer never removed in `disconnectedCallback` | Leaks the element and everything it closes over | Mirror every registration with a removal | Yes — `addEventListener`/`setInterval`/`ResizeObserver` in setup, no removal | Element is a singleton that lives for the page lifetime | https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements | 2026-11-16 | High |
| W-04 | Attribute read once instead of via `observedAttributes` | Later attribute changes never reach the element; no reactive update | Declare `static observedAttributes` and implement `attributeChangedCallback` | Yes — `getAttribute` in constructor/`connectedCallback` with no `observedAttributes` | Attribute is documented as init-only; value comes from a property setter | https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements | 2026-11-16 | High |
| W-05 | Property/attribute desync (reflection missing) | `el.foo = x` and `el.setAttribute('foo', x)` diverge; SSR markup and runtime disagree | Reflect attribute ↔ property in both directions, guarding against loops | Yes — property setter with no `setAttribute`/`toggleAttribute` counterpart (and vice versa) | Property intentionally non-reflective (object/function values) | https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements | 2026-11-16 | Medium |
| W-06 | Role="checkbox"/"slider" custom control not form-associated | Value never submits, does not participate in validation or form reset | `static formAssociated = true` + `attachInternals()` + `setFormValue`/`setValidity` | Yes — interactive `role=` element with no `formAssociated` and no hidden input | Control is genuinely non-form UI (a toolbar button) | https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals | 2026-11-16 | High |
| W-07 | Hidden `<input>` used to smuggle a custom control's value into a form | Breaks validation, `form.elements`, reset, and `FormData` semantics | `ElementInternals.setFormValue` / `setValidity` | Yes — `type="hidden"` input inside a custom-element definition | Genuine hidden field carrying non-user data | https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals | 2026-11-16 | High |
| W-08 | `<label for>` pointing at a host element with no form association | Labels cannot cross the shadow boundary; the label targets nothing focusable | Make the host form-associated, or place the label inside the shadow root and use `aria-label`/`aria-labelledby` on the host | Yes — external `for=` whose target is a custom-element tag | Host implements `formAssociated` and forwards `labels` | https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals | 2026-11-16 | Medium |
| W-09 | Shadow root without `delegatesFocus` on a focusable composite | Focus lands on the host instead of the inner control; tab order and `:focus-visible` misbehave | `attachShadow({ mode: 'open', delegatesFocus: true })` | Yes — `attachShadow` call missing `delegatesFocus` in an element containing focusable parts | Element has a single naturally-focusable child; focus is managed manually | https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow | 2026-11-16 | Medium |
| W-10 | `aria-*` set on the host but the accessible role lives inside the shadow root | Assistive tech reads the host's default role, not the internal widget's | Put the role/state on the host, or expose the internal element via `ElementInternals.ariaRole`/ARIA reflection | Partial — host has `aria-*` but no `role`, while the shadow template contains a widget role | Host intentionally a generic container | https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals | 2026-11-16 | Low |
| W-11 | Theming via `::part`/custom properties absent, styles hard-coded in the shadow root | Consumers cannot theme without piercing the boundary (impossible when `mode: 'closed'`) | Export `part="..."` hooks and consume CSS custom properties | Yes — `mode: 'closed'` shadow roots; shadow stylesheet with hard-coded colours and no `::part` export | Element is intentionally unthemeable (a vendor widget) | https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow | 2026-11-16 | Medium |
| W-12 | Custom element defined in a module that runs during SSR without a guard | `customElements`/`HTMLElement` are undefined on the server → import-time crash | Guard registration (`if (typeof window !== 'undefined')`) or register from a client-only entry | Yes — top-level `customElements.define`/`class X extends HTMLElement` in a module imported by a server entry | SSR framework already isolates client modules; declarative shadow DOM provides SSR markup | https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements | 2026-11-16 | High |

### 5.1 When *not* to use Web Components (analysis, not a finding)

| Situation | Prefer | Reason |
| --- | --- | --- |
| The app is already a single framework and every consumer is in that framework | Framework components | You get typed props, context, and the framework's devtools; a custom element adds a serialisation boundary for nothing |
| You need SSR-rendered interactive content today, without a hydration strategy | Framework components + declarative shadow DOM where supported | DSD is widely available as of 2026-08-20 but still requires per-framework wiring |
| You need deep prop passing of objects/functions | Framework components | Attributes are strings; property passing bypasses SSR entirely |
| Styling must be inherited from the page | Light DOM or framework components | Shadow encapsulation works against you |

---

## 6. Build, test, tooling

### 6.1 Vite (docs render v8.3.7; registry 8.3.8)

| ID | Pattern | Why it is a problem | Correct pattern | Detectable statically? | False positives | Evidence URL | Retrieved | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V-01 | Secret in a `VITE_`-prefixed variable | "`VITE_*` variables should not contain sensitive information… values are bundled into your source code at build time" | Keep secrets server-side; expose only publishable values | Yes — `VITE_*` name matching `SECRET/KEY/TOKEN/PASSWORD/PRIVATE` in `.env*` | The key is explicitly publishable (Stripe publishable key, public site ID) | https://vite.dev/guide/env-and-mode | 2026-11-16 | High |
| V-02 | `process.env.X` in browser code | `process` does not exist in the browser bundle; only `import.meta.env` is provided | `import.meta.env.VITE_X` (or map via `define`) | Yes — `process.env` in a client module | File is config/SSR-only code executed in Node | https://vite.dev/guide/env-and-mode | 2026-11-16 | High |
| V-03 | `define` used with a raw secret or a non-JSON-serialisable value | `define` performs a textual replacement into the shipped bundle | Only replace compile-time constants; inject runtime config from the server | Yes — `define: { ...: JSON.stringify(secretLikeName) }` in `vite.config.*` | Value is a build stamp/version string | https://vite.dev/config/shared-options | 2026-11-16 | Medium |
| V-04 | `import.meta.env` treated as typed | Every value is a string at runtime, even if it looks numeric/boolean | Parse explicitly; declare `ImportMetaEnv` for IntelliSense | Yes — arithmetic on `/ truthiness of` an `import.meta.env.*` value without parsing | Value is only ever compared as a string | https://vite.dev/guide/env-and-mode | 2026-11-16 | High |
| V-05 | Hard-coded absolute asset paths under a non-root `base` | Deploys to a sub-path break every asset URL | Use `import.meta.env.BASE_URL` or relative imports | Yes — string literal starting `/` in `src`/`href` where config sets a non-`/` `base` | App is served from the domain root; path is an API route | https://vite.dev/guide/env-and-mode | 2026-11-16 | Medium |
| V-06 | App build used to publish a library | Ships a full app bundle with duplicated framework code | `build.lib` + `rollupOptions.external` for peer deps | Yes — `build.lib` absent in a package whose `package.json` has `main`/`exports` and is published | The package is private/internal | https://vite.dev/guide/build | 2026-11-16 | Medium |
| V-07 | Top-level side effects + wrong `sideEffects` metadata | Tree-shaking cannot drop unused modules | Keep modules side-effect free; declare `sideEffects` accurately | Partial — requires both the source pattern and `package.json` | Module intentionally registers a global/polyfill | https://vite.dev/guide/build | 2026-11-16 | Low |
| V-08 | Production sourcemaps published publicly | Leaks original source (including comments and internal URLs) | `build.sourcemap: 'hidden'` and upload to the error reporter; or disable in prod | Yes — `sourcemap: true`/`'inline'` for a production config | Sourcemaps are intentionally public for an open-source app | https://vite.dev/config/build-options | 2026-11-16 | High |

### 6.2 Testing

| ID | Pattern | Why it is a problem | Correct pattern | Detectable statically? | False positives | Evidence URL | Retrieved | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| X-01 | "Focused test" undefined per framework | A React component test that mounts the whole app is not focused; a plain-HTML project has no component layer at all | React/Next: one behaviour per component, mock the network, assert user-visible output. Plain HTML/JS: DOM-level test on the module's public function. Web Components: test the element through `customElements.define` + real DOM | No — a test-strategy judgement, not a source pattern | — | https://vitest.dev/guide/ | 2026-11-16 | Medium |
| X-02 | `test.globals` left off while tests use bare `describe`/`it` | `ReferenceError` at collection time | Import from `vitest`, or enable `globals: true` and its types | Yes — bare `describe(`/`it(` with no import and no `globals: true` | Test file imports a globals shim; `expect` provided by a setup file | https://vitest.dev/config/ | 2026-11-16 | High |
| X-03 | DOM test without a DOM environment | Default environment is Node; `document` is undefined | `environment: 'jsdom'` (or `happy-dom`) + the dependency installed | Yes — `document`/`window` in a test while config sets no DOM environment | Test targets a Node-only module and only imports DOM types | https://vitest.dev/config/ | 2026-11-16 | High |
| X-04 | Shared mutable module state across test files | Tests pass alone, fail together; order dependence | Enable isolation (default) or reset modules explicitly | Partial — module-level `let` mutated by tests | Deliberate singleton with an explicit reset in `beforeEach` | https://vitest.dev/config/ | 2026-11-16 | Medium |
| X-05 | Config drift on a Vitest major upgrade | v5's migration guide lists removed APIs (benchmark/`--compare`, `bench.*` aliases) | Follow `vitest.dev/guide/migration/` per major | Partial — grep for removed APIs listed in the migration guide | The project is pinned to an older major | https://vitest.dev/guide/migration/ | 2026-11-16 | Medium |
| X-06 | Playwright: `waitForTimeout`/manual sleeps and non-web-first assertions | Fixed sleeps are the dominant flake source; auto-waiting exists precisely to remove them | Rely on locators and web-first assertions (`toBeVisible`) | Yes — `waitForTimeout(`, `sleep(`, `expect(await x.isVisible())` | Verifying *absence* over a window; polling a third-party widget that exposes no signal | https://playwright.dev/docs/best-practices | 2026-11-16 | High |
| X-07 | Playwright: shared state between tests (storage, DB, fixtures) | Order-dependent flakes under parallel workers | Per-test context (default) + seeded fixtures | Partial — module-scope mutable object used across `test()` blocks | Intentional serial suite with `test.describe.serial` | https://playwright.dev/docs/best-practices | 2026-11-16 | Medium |
| X-08 | Automated a11y check treated as a11y coverage | Rule engines catch only a subset (contrast, names, roles); they cannot judge focus order, reading order, or whether the name is *meaningful* | Keep the automated check, add manual keyboard and screen-reader passes | No — coverage claim, not a code pattern | — | https://nextjs.org/docs/architecture/accessibility | 2026-11-16 | Medium |
| X-09 | Migration "done" on unit tests alone | Unit tests do not see hydration, routing, CSS, or real network; a framework migration breaks exactly there | Layer: unit (logic) → component (render) → E2E (routing/hydration/a11y smoke) | Partial — presence/absence of an E2E directory per route | App has no routing and no hydration surface | https://playwright.dev/docs/best-practices | 2026-11-16 | Medium |

### 6.3 Lint and format

| ID | Pattern | Why it is a problem | Correct pattern | Detectable statically? | False positives | Evidence URL | Retrieved | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L-01 | `.eslintrc*` still present | ESLint v10 removed eslintrc support; the config is ignored | Migrate to `eslint.config.js`/`.mjs`/`.ts` flat config | Yes — `.eslintrc.*` file present, or `.eslintignore` | The project is pinned to ESLint 8/9 (then it still works — check the installed version first) | https://eslint.org/blog/2026/02/eslint-v10.0.0-released/ | 2026-11-16 | High |
| L-02 | `eslint-plugin-react-hooks` only inheriting `recommended` | `recommended` is the conservative preset; compiler-grade rules live in `recommended-latest` | `reactHooks.configs.flat.recommended` (or `flat['recommended-latest']` when trialling compiler rules) | Yes — config `extends`/spread of the plugin's configs | Project deliberately avoids experimental compiler rules | https://www.npmjs.com/package/eslint-plugin-react-hooks | 2026-11-16 | Medium |
| L-03 | Treating hook lint as hook correctness | The plugin flags dependency-array and call-order mistakes; it cannot see custom-hook contracts, conditional side effects across modules, or whether a derived value is correct | Keep the lint; add review rules for R-01/R-02 semantics | No — the plugin's limits are the point | — | https://react.dev/reference/eslint-plugin-react-hooks | 2026-11-16 | Medium |
| L-04 | Prettier and ESLint both owning formatting | Contradictory fixes; noisy diffs; slow CI | Prettier for formatting, ESLint for correctness (`eslint-config-prettier` to disable stylistic rules) | Yes — `prettier` + stylistic ESLint rules enabled simultaneously | Both present but `eslint-config-prettier` already applied | https://eslint.org/docs/latest/use/configure/configuration-files | 2026-11-16 | High |
| L-05 | Lint config not layered per framework | A single config applies React rules to `.html` and Next rules to `pages/`, producing nonsense findings | Use flat-config `files` globs per framework/adapter | Yes — `eslint.config.*` with no `files:` scoping | Monorepo already scopes by package | https://eslint.org/docs/latest/use/configure/configuration-files | 2026-11-16 | High |

---

## 7. Adapter contract

The engine must never assume a framework. It resolves one **per file**, with an explicit confidence, and every rule declares which adapters it applies to.

### 7.1 Evidence ladder (strongest first)

| Rank | Evidence | Example | Confidence | Cost |
| --- | --- | --- | --- | --- |
| 1 | Explicit framework directive in the file | `'use client'`, `'use server'`, `"use cache"` | 0.98 | Line scan |
| 2 | Framework config file at project root | `next.config.{js,ts,mjs}`, `vite.config.*`, `angular.json`, `svelte.config.js` | 0.95 (project-level, not per-file) | File existence |
| 3 | File extension + path convention | `app/**/page.tsx` → Next App Router; `pages/**` → Next Pages Router | 0.9 | Path match |
| 4 | Import specifier from a framework package | `from 'react'`, `from 'next/image'`, `from 'vue'` | 0.9 | AST |
| 5 | JSX/TSX syntax present | `<div>` in a `.tsx` | 0.8 (JSX ≠ React) | Parse |
| 6 | Imported local module that itself ranks 1–4 | `import { Button } from './Button'` where `Button.tsx` is React | 0.6 (transitive) | Import graph |
| 7 | `package.json` dependency presence | `"react": "^19"` | 0.5 (project-level; monorepos lie) | JSON read |

### 7.2 Decision procedure

```
framework(file) =
  1. directive in file                  -> (framework from directive, 0.98)
  2. path matches app/ or pages/        -> (next-app | next-pages, 0.95)
  3. nearest framework config walking up from file
       next.config.*    -> next-app if app/ exists else next-pages
       vite.config.*    -> look for the framework plugin (react/svelte/vue) in that config
       none             -> continue
  4. import specifiers in this file
       'react'/'react-dom' -> react (or next-* if next config found)
       'next/*'            -> next (router from path)
       none                -> continue
  5. JSX present + .jsx/.tsx          -> react-jsx (0.8)
  6. no framework evidence at all      -> html (0.9)  // plain HTML/CSS/JS profile
```

`html` is a **first-class adapter, not a fallback error**: extensions `.html`, `.css`, `.js`/`.mjs` with no framework import, Astro/Vue/Svelte files that no adapter claims. Its rule set excludes every framework-specific rule and keeps only document/CSS/DOM rules.

### 7.3 Conflict resolution and the `.tsx`-without-JSX case

| Situation | Resolution | Rationale |
| --- | --- | --- |
| `.tsx` file with no JSX | Keep the `react` adapter for *type* rules, drop JSX-dependent rules, emit confidence 0.6 | Extension is a build-tooling statement, not a framework statement; a `.tsx` can legitimately hold only types/hooks |
| `react` import in a `next` project | `next` wins; the `react` rule set runs as a *sub-adapter* | Next rules are a superset; running both unqualified double-reports |
| `pages/` and `app/` both present | Resolve per file by path; never per project | This is the coexistence-during-migration case and is not an error |
| `vue`/`svelte`/`astro` file | No adapter → `html`-profile with framework rules suppressed, plus a `framework-uncovered` info notice | Do not misapply React rules to a `.vue` file |
| Two directives conflict (`'use client'` + `'use server'`) | Highest-rank directive wins; emit a `conflicting-directive` error finding | The pair is invalid and worth reporting on its own |
| Monorepo with mixed frameworks | Config resolution is per-package: nearest `package.json` upward from the file | A root-level `package.json` is not evidence for a nested package |

### 7.4 Failure modes to design against

| Failure mode | Symptom | Mitigation |
| --- | --- | --- |
| **Framework hallucination** | React rules fired on a plain `.js` file that merely uses `document` | Require rank ≤ 4 evidence or a framework config; treat rank 5–7 as advisory only |
| **Version hallucination** | A Next 15 caching finding emitted on a Next 16 + `cacheComponents` app | Resolve the installed version from `node_modules/next/package.json` and the flag from config **before** selecting caching rules (see §3.1) |
| **Confidence laundering** | A 0.5-confidence project-level guess presented as a file-level fact | Carry provenance: each finding records the evidence rank that selected the adapter |
| **Adapter monoculture** | New framework requires editing core rules | Rules declare `appliesTo: [adapterId]`; adapters are directories with a manifest, selected at runtime |
| **Plain-HTML tax** | A static site is asked to install React/TS tooling to get a report | Adapter `html` declares `requires: []`; tiers 1–2 only (§4.2). Missing `tsconfig.json` is not an error |
| **Silent mis-scope** | A `.tsx` file gets JSX rules but the config is Vue via `vite.config.ts` | Plugin inspection in step 3 outranks extension in step 5 |
| **Stale version table** | Hardcoded "React 19.3.1" in a rule | Never hardcode; the version table in §1 is documentation of a snapshot, not engine input |

---

## Summary

**Verified current stable (2026-11-16):** React 19.3.1 · Next.js 16.4.6 · TypeScript 7.0.2 · Node.js 26.13.1 (LTS "Lithium"; 24 and 22 also LTS, 20 EOL 2026-03-24) · Vite 8.3.8 · Vitest 5.1.0 · Playwright 1.65.1 · ESLint 10.15.0 (v10 removed eslintrc). Only Node and ESLint publish support windows; React/Next/TS/Vite/Vitest/Playwright windows are `UNVERIFIED`.

**8 highest-value framework-specific rules**
1. R-02 — `useEffect` fetch with no abort/cleanup (race + setState-after-unmount).
2. R-04/R-05 — index keys and randomly-generated keys (silent state corruption, forced remounts).
3. R-14 / N-04 — hydration hazards (time, randomness, `localStorage`, locale) read during render.
4. R-01 — derived state via `useEffect` instead of computing during render.
5. N-11 — `params`/`searchParams` read synchronously (breaking in Next 16 App Router).
6. N-C1/N-C2 — caching model selected without resolving `cacheComponents` (wrong by construction).
7. N-13 — `NEXT_PUBLIC_` / `process.env` secret exposure in client-reachable code.
8. T-01…T-08 — `strict` family absent, read from `tsconfig.json` at near-zero cost.

**3 riskiest recommendations (being wrong is expensive)**
- **N-C1/N-C2 caching defaults.** Both models are live in Next 16 and the docs themselves split into two guides. Emitting the wrong one is a confident false positive about data freshness. Gate on `cacheComponents` + installed version or say nothing.
- **R-09 `dangerouslySetInnerHTML` / N-13 env exposure as security claims.** A false "sanitised, safe" verdict is worse than no finding. Only downgrade severity when a sanitiser call is visible in the same expression; otherwise report as unverified exposure.
- **V-01/V-03 secrets in Vite env/`define`.** Naming heuristics produce false alarms on publishable keys; the safe output is "value is inlined into the client bundle — confirm it is publishable", never "rotate this secret".

**Unresolved**
- No published support windows for React, Next.js, TypeScript, Vite, Vitest, or Playwright — cannot promise "supported until" dates (Node and ESLint do publish them).
- Next.js `dynamic`/`revalidate` interaction with Cache Components is only partly documented; N-14 stays at Medium confidence.
- TypeScript 7's `unstable/*` API surface is not documented as stable; the type-information tier needs its own adapter and version guard.
- React's docs version label (19.3) and the registry patch (19.3.1) differ in granularity; no per-patch doc exists.
- Virtualisation (R-15) has no React-documented recommendation — stays Low confidence and should probably ship disabled by default.
- Web Components `aria-*`-on-host (W-10) needs a real AT test matrix; Low confidence.
- Build Adapters API (Next 16, "alpha") may change deploy-target constraints in N-16; not evaluated.
