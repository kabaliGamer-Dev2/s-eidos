# Framework guidance — React 19, Next.js 16, TypeScript 7, and the adapter contract

**Purpose:** the differentiated layer: version-scoped framework idioms for the shipped `REA`/`NXT`/`TYP`/`BLD` rules, plus the contract that decides which framework a file belongs to and what that decision is worth. **Retrieved:** 2026-11-16 (Asia/Calcutta) for every row in this document.

Web Components and build tooling appear only where a shipped rule needs them (§5). Vite/Vitest/Playwright/ESLint version tables from the input are **deliberately omitted**: no shipped rule depends on them. Zero runtime dependencies and plain ESM (D-002, D-003) mean nothing here may require a parser, a compiler API, or a network read.

## 1. Version landscape (verified 2026-11-16)

| Package | Current stable | Fact source | Corroboration | Engine consequence |
|---|---|---|---|---|
| React | **19.3.1** | `https://registry.npmjs.org/react/latest` (version field) | react.dev reference sidebar renders "react@19.3" | React 19 API gates (REA-009) compare against the *installed* major, never this table |
| Next.js | **16.4.6** | `https://registry.npmjs.org/next/latest` | nextjs.org docs sidebar renders "Latest v16.4.6" | Caching model and request-API gates (NXT-007/008) read the installed version |
| TypeScript | **7.0.2** | `https://registry.npmjs.org/typescript/latest` | TS 7 is the native (Go) port; a 6.x line coexists — **`UNVERIFIED` (7.0 announcement URL not captured)** | Config-only rules (TYP-001/002) work on either line; the type-information tier is out of scope |
| Node.js | **26.13.1** (LTS "Lithium") | `https://nodejs.org/dist/index.json` | `https://nodejs.org/en/about/previous-releases` | v26/v24/v22 are LTS; v20 EOL 2026-03-24; v25 EOL 2026-03-31; annual cycle from v27 |
| Toolchain floors | Next `engines.node >=20.9.0` | `https://registry.npmjs.org/next/latest` | registry metadata | Read `engines.node` from `node_modules/<pkg>/package.json`; never hardcode this table |

**Support windows:** Node and ESLint publish them; **React, Next.js, TypeScript and Vite publish none — `UNVERIFIED`.** No artifact may promise "supported until" for those.

**Hard rule:** the version table above is documentation of a snapshot, not engine input. A rule that hardcodes "React 19.3.1" is a defect (§6, failure mode "stale version table").

## 2. React 19 (docs label 19.3; registry 19.3.1)

| Shipped rule | Version scope | Correct pattern the finding names | False-positive note (mandatory) | Evidence |
|---|---|---|---|---|
| REA-001 keyless list | React 18+/19 | stable `key` from data on the outermost element | static JSX children are not a mapped list | https://react.dev/learn/rendering-lists |
| REA-002 index key | React 18+/19 | `key={item.id}` for any insert/reorder/delete-capable list | React's own docs accept an index key for a static, never-reordered list with no per-row state | https://react.dev/learn/rendering-lists |
| REA-003 random/time key | React 18+/19 | stable identity from data; `useId` for a11y ids, never as a list key | a key generated once into state/ref, or a deliberate forced reset, is correct | https://react.dev/learn/rendering-lists |
| REA-004 derived state in Effect | React 18+/19 | compute during render; reset via `key`; adjust in an event handler | effects that synchronise a real external system are the legitimate case | https://react.dev/learn/you-might-not-need-an-effect |
| REA-005 non-literal `dangerouslySetInnerHTML` | React 18+/19 | sanitise at the boundary or render structured data | a recognised sanitiser in the same expression caps severity at `info`; **never claim it is safe** | https://react.dev/reference/react-dom/components/common |
| REA-006 controlled input, no `onChange` | React 18+/19 | `value` + `onChange`, or `readOnly` | `onChange` via spread props; an intentional read-only display | https://react.dev/reference/react-dom/components/input |
| REA-007 effect fetch without cancellation | React 18+/19 | `AbortController` + cleanup return, or a data library that owns cancellation | SWR/TanStack Query/RSC own it; fire-and-forget telemetry is deliberate | https://react.dev/reference/react/useEffect |
| REA-008 ref during render | React 18+/19 | refs only in effects/handlers; state for rendered values | lazy-init guard `if (ref.current == null)`; measuring in `useLayoutEffect` | https://react.dev/reference/react/useRef |
| REA-009 React 19 API below installed major | 19.0+ (`use`, `useActionState`, `useOptimistic`, `useFormStatus`); **19.2+** (`useEffectEvent`) | upgrade React, or use the pre-19 pattern | unresolved install, `preact/compat`, or monorepo dedupe | https://react.dev/blog/2024/04/25/react-19-upgrade-guide, https://react.dev/reference/react/useActionState, https://react.dev/reference/react/useEffectEvent |

**Version-scoped facts that change the advice (all fetched 2026-11-16):**

| Fact | Statement | Evidence | Status |
|---|---|---|---|
| React 19 API floor | React 19 ships form-action APIs (`useActionState`) and `use`; `useEffectEvent` is 19.2+ | react.dev references above | verified |
| Hydration contract | Server HTML ≠ first client render → React discards and re-renders the mismatched subtree (lost input state) | https://react.dev/reference/react-dom/client/hydrateRoot | verified |
| `defaultProps` on function components removed in 19 | **`UNVERIFIED`** — upgrade-guide page not read for that specific claim | upgrade guide above | **UNVERIFIED**; therefore not a shipped rule and never asserted |
| ARIA props swallowed by a wrapper component | A custom component that destructures `aria-*`/`role`/`id` without spreading `...rest` silently drops the accessible name | https://react.dev/reference/react-dom/components/common | verified but **deferred to v0.2** (needs prop-flow analysis; not in the 37) |

## 3. Next.js 16 (App Router first)

### 3.1 The two caching models — the finding this layer exists for

Next 16 has **two live caching models gated by `cacheComponents`**. Emitting a caching finding without resolving the flag is a false positive by construction.

| Model | Gate | Verified behaviour | Evidence |
|---|---|---|---|
| **Previous model** | `cacheComponents` absent or `false` | "By default, `fetch` requests are not cached." Opt in per request with `cache: 'force-cache'` / `next.revalidate`. Docs are a separate guide. | https://nextjs.org/docs/app/guides/caching-without-cache-components |
| **Cache Components** | `cacheComponents: true` | "All dynamic code in any page, layout, or API route is executed at request time by default"; caching is opt-in via the `"use cache"` directive + `cacheLife`/`cacheTag` | https://nextjs.org/docs/app/getting-started/caching, https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents |
| New-project default | `create-next-app` recommended defaults | "New App Router apps … already have Cache Components and Partial Prefetching enabled." | https://nextjs.org/docs/app/getting-started/caching |
| PPR flag | removed | `experimental.ppr` removed in favour of the Cache Components configuration | https://nextjs.org/blog/next-16 |

**Detector rule (NXT-007):** resolve `cacheComponents` from `next.config.*` **and** the installed `next` major before any caching finding. Absent resolution ⇒ no finding. `export const dynamic`/`revalidate` belong to the previous model and must not be judged under the Cache Components model (`dynamic`/`revalidate` interaction is only partly documented ⇒ `N-14` stays **Medium** confidence).

### 3.2 App Router vs Pages Router — scope is decided per file, never per project

| Concern | App Router (`app/`) | Pages Router (`pages/`) | Shipped rule |
|---|---|---|---|
| Client boundary | `'use client'` marks the client boundary | all files are client | NXT-001 |
| Data exports | Server Components `await`; `generateStaticParams`; route handlers | `getServerSideProps`/`getStaticProps`/`getStaticPaths` | NXT-002 |
| Metadata | `metadata`/`generateMetadata`; `next/head` is a Pages-Router API | `next/head` | none shipped (both router modes are correctly scoped by path) |
| Route handlers | `app/**/route.ts` exporting `GET`/`POST` | `pages/api/*` with `req`/`res` | none shipped |
| Request APIs | `params`/`searchParams` are Promises (Next 15+; breaking in 16) | plain object props | NXT-008 |
| Network boundary | `proxy.ts` in Next 16 (`middleware.ts` renamed) | `middleware.ts` | none shipped — rename is documented in §3.3, not flagged |
| Bundler | Turbopack default in Next 16 | same | none |

Coexistence during migration is normal: `app/` and `pages/` in one repo are resolved per file, never treated as an error.

### 3.3 Shipped NXT rules

| Rule | Version scope | Correct pattern | False-positive note | Evidence |
|---|---|---|---|---|
| NXT-001 `'use client'` too high | App Router 13+ | directive at the smallest interactive leaf; server data passed as serialisable props | the whole app being interactive (editor/canvas); a provider that genuinely needs client state | https://nextjs.org/docs/app/getting-started/server-and-client-components |
| NXT-002 Pages-Router exports in `app/` | App Router | Server Components + `await`; route handlers for APIs | the file is under `pages/` — then the export is correct | https://nextjs.org/docs/app/getting-started/fetching-data |
| NXT-003 raw `<img>` | App + Pages | `next/image` with dimensions or `fill` | SVG/icon, `images.unoptimized: true`, static export, third-party-owned DOM | https://nextjs.org/docs/app/api-reference/components/image |
| NXT-004 Google Fonts `<link>` | App + Pages | `next/font`/`next/font/google` + exported `className`/CSS variable | an already self-hosted brand font; email templates in the repo | https://nextjs.org/docs/app/api-reference/components/font |
| NXT-005 render-time `Date`/`Math.random()` | App + Pages (SSR + hydration) | move to `useEffect`; pass the value from the server; explicit `locale`/`timeZone` | inside an effect/handler; client-only `ssr: false`; server-provided prop | https://nextjs.org/docs/messages/react-hydration-error |
| NXT-006 module-scope/render browser globals | App + Pages | guard with `typeof window` in a client-only module, or move into an effect | component never SSR'd; module imported only by client components | https://nextjs.org/docs/messages/react-hydration-error |
| NXT-007 caching assumption | Next 15+/16, **gate on `cacheComponents`** | previous model: opt in with `cache`/`revalidate`; Cache Components model: `"use cache"` | flag unresolved ⇒ no finding; Next <15 caches `fetch` by default; a `"use cache"` directive is present | §3.1 |
| NXT-008 sync request APIs | Next 15+ (breaking in 16), App Router | `const { id } = await params`; `use(params)` in a Client Component | Pages-Router file; value already awaited into a local; installed Next <15 | https://nextjs.org/docs/app/guides/upgrading/version-16 |

**Preserved version facts:**

| Fact | Statement | Evidence | Status |
|---|---|---|---|
| Request-API boundary | Next 15 introduced async `params`/`cookies()`/`headers()`; Next 16 lists sync access under Breaking Changes | version-15, version-16 guides | verified at major granularity; **the exact patch where sync access stopped working is `UNVERIFIED (version)`** ⇒ NXT-008 gate is `≥15`, confidence `M` on the version claim only |
| `middleware.ts` → `proxy.ts` | "Middleware replaced by `proxy.ts` to clarify network boundary" (Next 16) | https://nextjs.org/blog/next-16 | verified; **no rule ships** because removal semantics are not stated as deprecated |
| Turbopack | "Turbopack (stable): Default bundler for all apps" | https://nextjs.org/blog/next-16 | verified |
| `dynamic`/`revalidate` under Cache Components | Segment config belongs to the previous model; mixing mental models produces stale-or-always-dynamic pages | cacheComponents config page | **Medium confidence** (partly documented) |
| Build Adapters API (Next 16, alpha) | may change deploy-target constraints | — | not evaluated; `N-16` excluded |

## 4. TypeScript 7 (and the coexisting 6.x line)

| Shipped rule | Scope | Correct pattern | False-positive note | Evidence |
|---|---|---|---|---|
| TYP-001 `@ts-ignore` | TS ≥3.9 | `@ts-expect-error` (fails when the suppression becomes unnecessary) | installed TS <3.9, where the directive does not exist | https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html |
| TYP-002 `strict` family off | any TS line, config-only | `"strict": true`; ratcheted per-directory if needed | extended config sets it (resolve `extends` first); JS-only project | https://www.typescriptlang.org/tsconfig#strict |
| TYP-003 `any` at a boundary | any TS line, syntax tier | `unknown` + narrowing at the boundary | a documented interop seam with an untyped dependency | https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any |
| TYP-004 assertion on parsed data | any TS line, syntax tier | validate at the boundary, then derive the type | a same-repo typed client already validated the payload | https://www.typescriptlang.org/docs/handbook/2/narrowing.html |

**Two consequences the analyzer must encode:**

1. **The compiler API moved in TS 7.** `typescript@7` exposes `./unstable/ast`, `./unstable/fs`, `./unstable/sync`, `./unstable/async`, `./unstable/proto` and ships platform binaries as optional dependencies (`https://registry.npmjs.org/typescript/latest`, `exports` field). Any future type-information tier must target that surface with a version guard. **`UNVERIFIED`:** whether `unstable/*` is stable API — it is not documented as such.
2. **Two compiler lines coexist.** The 7.0 announcement benchmarks a 6.x line against 7.x, so a codebase may pin either. Read the installed version; never assume 7.

**Three tiers, and the design rule that keeps plain-HTML users out of the TypeScript toolchain:**

| Tier | Cost | Rules | Degradation |
|---|---|---|---|
| Config-only (resolve `tsconfig.json` + `extends`) | microseconds, no parser | TYP-001/002 | no tsconfig ⇒ rules silently absent, not an error |
| Syntax/AST-only | milliseconds per file | TYP-003/004 | accepts `.ts`/`.tsx` text only; no type checker |
| Type-information | seconds, needs a `Program` | none in v1 | out of scope (D-002); TS 7 adapter needed if ever added |

TypeScript itself is **dev-only** for `tsc --noEmit` over JSDoc (D-003): no shipped rule may require it to load or run.

## 5. Web Components and build tooling (only where a shipped rule needs them)

**Web Components: zero shipped rules in v1.** The adapter still recognises `.vue`/`.svelte`/`.astro` and unclaimed custom-element code as the `html` profile (§6), but no `W-*` rule passes the bar: the sound ones need `ElementInternals`/shadow-root semantics that a lexical pass cannot judge, and they carry no differentiator against existing linters. This is a recorded subtraction, not an omission.

**Build tooling: exactly two facts are load-bearing.**

| Rule | Fact | Evidence |
|---|---|---|
| BLD-001 | Public env prefixes inline values into the client bundle: `NEXT_PUBLIC_` (Next), `VITE_` (Vite), `PUBLIC_` (Astro), `REACT_APP_` (CRA), `GATSBY_` (Gatsby), `NUXT_PUBLIC_` (Nuxt). The prefix list is **versioned data**, not rule code. | https://nextjs.org/docs/app/guides/environment-variables, https://vite.dev/guide/env-and-mode |
| BLD-002 | `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` disable the last automated gate before production | https://nextjs.org/docs/app/api-reference/config/next-config-js/typescript |

**Classification discipline for BLD-001:** the output is "value is inlined into the client bundle — confirm it is publishable", **never** "rotate this secret" and never the value itself (§7 redaction in QSB).

## 6. Framework-adapter contract

The engine never assumes a framework. It resolves one adapter **per file**, with an explicit confidence, and every rule declares which adapters it applies to. This contract exists because framework hallucination is the top false-positive source in a lexical tool.

### 6.1 Evidence ladder (strongest first)

| Rank | Evidence | Example | Confidence | Cost | Usable as |
|---|---|---|---|---|---|
| 1 | Explicit framework directive in the file | `'use client'`, `'use server'`, `"use cache"` | 0.98 | line scan | file-level fact |
| 2 | Framework config at project root | `next.config.{js,ts,mjs}`, `vite.config.*` | 0.95 | file existence | **project-level** only |
| 3 | File extension + path convention | `app/**/page.tsx` → Next App Router; `pages/**` → Next Pages Router | 0.90 | path match | file-level fact |
| 4 | Import specifier from a framework package | `from 'react'`, `from 'next/image'` | 0.90 | token scan of import lines | file-level fact |
| 5 | JSX/TSX syntax present | `<div>` in a `.tsx` | 0.80 | text scan | advisory only (JSX ≠ React) |
| 6 | Imported local module that itself ranks 1–4 | `import { Button } from './Button'` where `Button.tsx` is React | 0.60 | import graph | advisory only |
| 7 | `package.json` dependency presence | `"react": "^19"` | 0.50 | JSON read | project-level **hint**, never evidence for a file |

### 6.2 Decision procedure

```text
framework(file) =
  1. directive in file                     -> (framework from directive, 0.98)
  2. path matches app/ or pages/           -> (next-app | next-pages, 0.95)
  3. nearest framework config walking up   -> next.config.*: next-app if app/ exists else next-pages
                                              vite.config.*: read the plugin name (react/svelte/vue)
                                              none: continue
  4. import specifiers in this file        -> 'react'/'react-dom' => react (next-* if a next config was found)
                                              'next/*'            => next (router from path)
                                              none: continue
  5. JSX present + .jsx/.tsx               -> react-jsx (0.80)
  6. no framework evidence                 -> html (0.90)
```

`html` is a **first-class adapter, not an error path**: `.html`, `.css`, `.js`/`.mjs` with no framework import, and any `.vue`/`.svelte`/`.astro` file that no adapter claims. It excludes every framework rule and keeps only document/CSS/DOM rules. A missing `tsconfig.json` is not an error.

### 6.3 What the confidence carries into a finding

| Rule class | Minimum adapter confidence | Effect when below it |
|---|---|---|
| Framework-idiom rules (`REA-*`, `NXT-*`, `TYP-*`, `BLD-*`) | rank 1–4 evidence **or** a framework config | rule suppressed; an `adapter-not-resolved` info notice may be emitted instead |
| Tier-a markup rules (`SEM-*`, `FRM-*`, `IMG-001`, `MET-001`) | `html` or a resolved component adapter | run, but the finding records the file kind (QSB §1.3) |
| Tier-b a11y rules | same, plus the rule's own file-kind declaration | suppressed outside its declared file kinds |

Every finding records the **evidence rank** that selected the adapter and the adapter id. A 0.5-confidence project-level guess must never be presented as a file-level fact ("confidence laundering").

### 6.4 Conflict resolution

| Situation | Resolution | Rationale |
|---|---|---|
| `.tsx` file with no JSX | keep the React adapter for type rules, drop JSX-dependent rules, confidence 0.6 | extension is a build-tooling statement, not a framework statement |
| `react` import inside a Next project | `next` wins; React rules run as a sub-adapter | Next's rule set is a superset; running both unqualified double-reports |
| `pages/` and `app/` both present | resolve per file by path, never per project | normal coexistence during migration, not an error |
| `.vue`/`.svelte`/`.astro` file | `html` profile with framework rules suppressed + `framework-uncovered` info notice | do not misapply React rules to a `.vue` file |
| Two conflicting directives (`'use client'` + `'use server'`) | highest-rank directive wins; emit a `conflicting-directive` finding | the pair is invalid and worth reporting on its own |
| Monorepo with mixed frameworks | resolve per package: nearest `package.json` upward from the file | a root `package.json` is not evidence for a nested package |
| Config says Vue but the file is `.tsx` | plugin inspection (rank 3) outranks extension (rank 5) | silent mis-scope is worse than a missed finding |

### 6.5 Failure modes to design against

| Failure mode | Symptom | Mitigation |
|---|---|---|
| Framework hallucination | React rules fire on a plain `.js` file that merely uses `document` | require rank ≤4 evidence or a framework config; ranks 5–7 are advisory only |
| Version hallucination | A Next 15 caching finding emitted on a Next 16 + `cacheComponents` app | resolve installed version **and** the flag before selecting caching rules (§3.1) |
| Confidence laundering | A 0.5 project-level guess presented as a file-level fact | carry the evidence rank into the finding |
| Adapter monoculture | A new framework requires editing core rules | rules declare `appliesTo: [adapterId]`; adapters are manifests selected at runtime |
| Plain-HTML tax | A static site is asked to install React/TS tooling to get a report | `html` adapter declares no requirements; config tier only |
| Stale version table | "React 19.3.1" hardcoded in a rule | the version comes from the project, never from §1 |

## 7. Remaining `UNVERIFIED` in this layer

| Item | Status | Effect |
|---|---|---|
| React `defaultProps` removal for function components | **UNVERIFIED** (upgrade-guide claim not read) | not a shipped rule; never asserted in output |
| Exact Next patch where sync request APIs stopped working | **UNVERIFIED (version)** | NXT-008 gate stays `≥15`; confidence `M` on the version claim |
| TypeScript 7.0 announcement URL | **UNVERIFIED** (not captured) | TS 7 framing is used for scoping only; no rule gates on it |
| `unstable/*` API stability in TS 7 | **UNVERIFIED** | any future type-information tier needs its own adapter + version guard |
| Next 16 `dynamic`/`revalidate` interaction with Cache Components | partly documented, Medium confidence | no shipped rule may claim it |
| Support windows for React/Next/TypeScript | **UNVERIFIED** — no published policy | no "supported until" statement anywhere |
| React docs label 19.3 vs registry 19.3.1 | granularity difference, not a conflict | cite the registry for versions, docs for API semantics |
| Build Adapters API (Next 16 alpha) | not evaluated | deploy-target rules excluded |
