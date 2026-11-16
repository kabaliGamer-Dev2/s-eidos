# Upstream Inventory — Google Chrome `modern-web-guidance`

**Auditor:** `upstream-auditor` · **Retrieved:** 2026-11-16 (all clusters) · **Method:** authenticated `gh` CLI (read-only) + `web_fetch` of primary sources.

**Evidence keys.** `[F]` = fact observed directly in a primary source. `[I]` = inference/reading by the auditor.
Every row carries a URL or `path:line`. Repo shorthand: **PUB** = `googlechrome/modern-web-guidance` (publish target), **SRC** = `googlechrome/modern-web-guidance-src` (source repo, linked from PUB `CONTRIBUTING.md`).

> **Why SRC is in scope.** PUB `CONTRIBUTING.md` states PUB is a publish target and directs all PRs/issues to SRC. PUB ships **no executable code** (see §2.3), so the scanner/CLI behaviour required by §3 exists only in SRC and in the npm tarball. PUB remains the authoritative source for what is *distributed to agents* (guides, skills, manifests, LICENSE).

---

## 1. Identity and status

| Field | Value | Type | Source |
|---|---|---|---|
| Repo | `GoogleChrome/modern-web-guidance` | [F] | `gh repo view` |
| Description | `Keep your coding agent up to date with the latest web best practices` | [F] | `gh repo view` |
| License (GitHub) | `apache-2.0` / name `Apache License 2.0` / SPDX **`Apache-2.0`** | [F] | `gh repo view`; `community/profile` → `spdx_id: Apache-2.0` |
| Default branch | `main` | [F] | `defaultBranchRef.name` |
| Latest commit | `64a6d708f5a43f2cd3fde5d4d7db3905ba1bdf65` — "Release v1.0.1" — `2026-11-16T14:57:49Z` | [F] | `gh api …/commits` |
| Latest release / tag | `v1.0.1`, published `2026-11-16T14:59:10Z` (not draft, not prerelease). Prior: `v1.0.0` 2026-11-10, `v0.0.197` 2026-11-02. Weekly-ish cadence historically. | [F] | `/releases`, `/tags` |
| Stars | **19,789** | [F] | `gh repo view` 2026-11-16 |
| Forks / watchers | 772 (repo view) → 773 (repo API, minutes later) / 65 | [F] | `gh repo view`; `gh api repos/…` |
| Topics | **none** (`repositoryTopics: null`) | [F] | `gh repo view` |
| Archived | `false` | [F] | `isArchived` |
| Homepage | `https://goo.gle/modern-web-guidance` (→ `https://developer.chrome.com/docs/modern-web-guidance`) | [F] | `homepageUrl`; README/docs |
| Created | `2026-03-23T17:49:14Z` | [F] | `createdAt` |
| Last push | `2026-11-16T14:57:57Z` | [F] | `pushedAt` |
| Size / health | disk 1,899 KB; `health_percentage: 50`; code_of_conduct, issue_template, PR template all `null` | [F] | `gh api …/community/profile` |
| Issue tracker on PUB | **disabled** (`has_issues=false`), discussions `false`. PUB issue list is empty/closed to the public. | [F] | `gh api repos/…` |
| Issue tracker on SRC | enabled, **411 open issues**, discussions `false` | [F] | `gh api repos/…-src` |
| SRC repo | public, Apache-2.0, 7,891 stars, created 2026-01-27, pushed 2026-11-16T18:25:17Z | [F] | `gh repo view …-src` |
| npm package | `modern-web-guidance@1.0.1`, 281 files, 16,720,506 bytes unpacked, provenance attestation present, published by GitHub Actions OIDC | [F] | `registry.npmjs.org/modern-web-guidance/latest` |
| Website target of task brief | `https://developer.chrome.com/docs/ai/modern-web-guidance` → **HTTP 404** (locale zh-TW 404 page) | [F] | `web_fetch` 2026-11-16 |
| Actual docs URL | `https://developer.chrome.com/docs/modern-web-guidance` → 200, with subpages `get-started`, `modernization-workflow`, `guides`, `troubleshoot` | [F] | `web_fetch` 2026-11-16 |

**[I]** The `/docs/ai/` path in the brief was likely an early/renamed location; every manifest that declares a homepage (`package.json`, `plugin.json`, `.codex-plugin/plugin.json`) points at `developer.chrome.com/docs/modern-web-guidance`, so treat that as canonical. Everything in this inventory is against `main` @ `64a6d70` (v1.0.1).

---

## 2. Distribution model

### 2.1 Summary

It is **not** an MCP server, not a linter binary, and not a single-agent plugin. It is a **multi-agent skill bundle** (markdown guides + one `SKILL.md` router per pack) **plus** a **Node ≥22 CLI** (`modern-web-guidance`) that the skill instructs the agent to shell out to, **wrapped in seven agent-specific manifest sets**. [F]

| Property | Finding | Type |
|---|---|---|
| Primary artifact | Markdown skill corpus, invoked via `npx -y modern-web-guidance@latest <cmd>` | [F] |
| Runtime | Node `>=22.0.0`; VS Code `^1.90.0` (declared `engines`) | [F] |
| MCP server | **No.** PUB tree: `0` paths matching `mcp`/`sarif`/`lint`/`eslint`; no MCP manifest, no tool schema. (SRC's only `lint` hits are its own `.oxlintrc.json`/`grader-lint.ts`.) | [F] |
| Standalone linter | CLI `legacy-scan` exists, but is a subcommand of the skill CLI, not a separately installed linter | [F] |
| Agent-specific manifests | 7 sets: `.claude-plugin/`, `.codex-plugin/`, `.cursor-plugin/`, `.grok-plugin/`, `.agents/plugins/`, `.github/plugin/`, plus root `plugin.json` (agent-plugins.org schema) | [F] |
| Other harness manifests | `gemini-extension.json`, `kimi.plugin.json`, `package.json` (`contributes.chatSkills` for VS Code) | [F] |
| ideation/telemetry | CLI sends Clearcut telemetry; `DISABLE_TELEMETRY=1` opt-out | [F] |

### 2.2 Manifests (paths + key fields)

| File | Key fields (quoted/paraphrased) | Type |
|---|---|---|
| `package.json` | `"name":"modern-web-guidance"`, `"version":"1.0.1"`, `"license":"Apache-2.0"`, `"publisher":"GoogleChrome"`, `"bin":{"modern-web-guidance":"skills/modern-web-guidance/modern-web.mjs"}`, `"contributes":{"chatSkills":[{"path":"./skills/modern-web-guidance/SKILL.md"}]}`, `"engines":{"vscode":"^1.90.0","node":">=22.0.0"}` | [F] |
| `package.json` → `repository.url` | `https://github.com/GoogleChrome/modern-web-guidance-src.git` — points **off** PUB to SRC | [F] |
| `plugin.json` | `"$schema":"https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"`, name/version/author/license/keywords (`web, html, css, javascript, best-practices`) | [F] |
| `.claude-plugin/plugin.json` + `marketplace.json` | marketplace name `googlechrome`; single plugin `modern-web-guidance`, `"source":"./"` | [F] |
| `.codex-plugin/plugin.json` | `"skills":"./skills/"`; `interface.capabilities:["Read"]`; two `defaultPrompt`s incl. *"Audit this project for modern web best practices and modernization opportunities"*; `supportURL` → SRC issues | [F] |
| `.cursor-plugin/plugin.json`, `.github/plugin/plugin.json` | no `skills` key; description only + license absent | [F] |
| `.grok-plugin/marketplace.json` | `{"name":"googlechrome","plugins":[{"name":"modern-web-guidance","source":"./"}]}` | [F] |
| `.agents/plugins/marketplace.json` | `"policy":{"installation":"AVAILABLE","authentication":"ON_INSTALL"}`, `category:"Developer Tools"`, `source:{source:"local",path:"./"}` | [F] |
| `gemini-extension.json` | only `name/description/version/author` — Gemini CLI extension | [F] |
| `kimi.plugin.json` | explicit `"skills":["./skills/modern-web-guidance/","./skills/chrome-extensions/"]`, `"license":"Apache-2.0"` | [F] |
| `policies/modern-web-guidance.toml` | Gemini-CLI-shaped policy rule: `toolName="run_shell_command"`, `commandRegex="modern-web"`, `decision="ask_user"`, `priority=100`, `modes=["plan"]` | [F] |
| `skills/modern-web-guidance/package.json` (in SRC `src/cli/template/`) | `"type":"module"`, `"bin":{"modern-web-guidance":"modern-web.mjs"}` — the per-skill shim the CLI copies in | [F] |

### 2.3 The publish-target gap (important)

- PUB tree = **301 entries, 0 files with extension `.js`, `.mjs`, `.ts`.** Non-markdown files are only: 11 JSON, 1 TOML, 1 `.gitignore`, 1 LICENSE, 14 SVG, 1 PNG. [F] (`git/trees/HEAD?recursive=1`, `truncated:false`)
- `package.json` declares `bin` → `skills/modern-web-guidance/modern-web.mjs`, but **that file does not exist in PUB**. [F]
- npm `dist.fileCount: 281` and `unpackedSize: 16.7 MB` — the published tarball is larger than the repo's rendered corpus, i.e. the CLI is injected at build/publish time. [F] + [I]
- Open SRC issue **#3620** independently reports the published package's `bin` target is missing and invocation fails with `MODULE_NOT_FOUND`. [F]
- SRC holds the implementation: `bin/gd.ts` (16,514 B), `src/cli/modern-web.ts` (14,427 B), `src/analyzing/**` (133 files), `guides/` (1,676 files), `features/*.json`. [F]

**[I]** Consequence for us: "does upstream scan/detect?" cannot be answered from PUB alone, and a duplication analysis that only reads PUB would materially understate upstream. Equally, PUB is the *contract* users install, so its manifests are what our plugin must coexist with.

### 2.4 Documented install channels (13)

From `developer.chrome.com/docs/modern-web-guidance/get-started` (retrieved 2026-11-16): `npx modern-web-guidance@latest install` (recommended, auto-updates); `install --choose` (wizard, pick skill packs); Antigravity (GUI + `agy plugin install`); `gemini extensions install … --auto-update`; JetBrains WebStorm Skill Manager (Settings → AI Assistant → Skills); `gh skill install GoogleChrome/modern-web-guidance`; `npx skills add …`; `claude plugin marketplace add` + `claude plugin install modern-web-guidance@googlechrome`; `codex plugin marketplace add` + `codex plugin add`; Copilot CLI `/plugin marketplace add` + `/plugin install`; `goose plugin install … --auto-update`; `grok plugin install … --trust`; Kimi Code `/plugins install …`. [F]

---

## 3. Capability inventory

**Headline count: 2 skill packs · 210 guides in 17 categories · 38 registered scanner rule modules · 11 invocable CLI command names · 3 `.mwgrc` keys (+ passthrough) · 1 agent policy rule · 4 matcher kinds.** [F]

### 3.1 Skill packs (2)

| Skill | `name` field | Coverage | Files | Source |
|---|---|---|---|---|
| Modern Web Guidance | `modern-web-guidance` | Router skill: mandates search-before-writing for HTML/CSS/client JS, then retrieve → implement → disclose. Explicit **DO NOT trigger** list excludes backend, infra, tooling. | 1 `SKILL.md` (9,801 B) + 210 guides | `skills/modern-web-guidance/SKILL.md` |
| Chrome Extensions | `chrome-extensions` | Manifest V3, service worker, content scripts, messaging, permissions, CSP/sandbox, DNR, side panel, popup, omnibox, context menus, devtools, storage, tabs, user scripts, MediaCapture, Prompt API, auth/identity, icons + Web Store listing/privacy-policy/review-checklist templates | 1 `SKILL.md` (26,456 B) + 23 refs | `skills/chrome-extensions/SKILL.md`, `…/references/extensions/*.md`, `…/references/webstore/*.md` |

Skill router behaviour, verbatim anchors: *"MANDATORY: Execute FIRST for all HTML/CSS and clientside JS tasks"*; *"`legacy-scan` scans for a curated subset (~20% of the guidance corpus)"*. [F]

### 3.2 Guide corpus — 17 categories, 210 files

All paths are `skills/modern-web-guidance/guides/<category>/<id>.md`. Counts are file counts from the PUB tree. [F]

| Category | # | Guide IDs (category prefix omitted) |
|---|---|---|
| `accessibility` | 4 | accessibility, accessible-error-announcement, accessible-generated-content, respect-os-text-scale |
| `built-in-ai` | 5 | language-detection, language-model, prompt-api, summarizer, translator |
| `css` | 18 | animate-to-intrinsic-sizes, atrule-support-conditionals, calculate-with-intrinsic-sizes, child-state-based-styling, content-based-styling, css, css-layout, design-token-reactivity, dynamic-sibling-styling, fluid-scaling, individual-transform-properties, overflow-clipping-control, reduce-style-repetition, responsive-design, selector-atrule-combinations, size-aware-styling, style-parent-with-has, usage-aware-component-variations |
| `forms` | 19 | animated-select-picker, autofill-address-form, autofill-highlight-inputs, autofill-payment-form, autofill-sign-in-form, autofill-sign-up-form, brand-consistent-forms, branded-select-styling, custom-select-picker-layouts, form-fields-automatically-fit-contents, forms, ime-safe-enter-submit, required-field-feedback, rich-media-picker, select-menu-interaction, slider, sms-otp-form, switch, validate-input-after-interaction |
| `html` | 8 | accessible-web-components, custom-elements, form-associated-custom-elements, html, prerendering-custom-elements, shadow-dom, styling-web-components, web-components |
| `js` | 6 | calculate-event-differentials, capture-location-agnostic-data, coordinate-global-events, js, sort-high-precision-timestamps, support-global-calendar-systems |
| `performance` | 26 | batch-analytics-events, break-up-long-tasks, calculate-total-foreground-time, conditional-async-dependencies, defer-rendering-heavy-content, defer-work-until-scroll-ends, deliver-optimized-decorative-images, deprioritize-background-fetches, detect-initial-visibility-state, efficient-background-processing, faster-spa-view-transitions, flicker-free-client-side-ab-testing, full-session-analytics, identify-heavy-scripts, identify-inp-causes, improve-next-page-load-performance, interaction-paint-timing, interactions-in-complex-layouts, lazy-load-video-and-audio, optimize-image-priority, optimize-preload-priority, optimize-script-priority, out-of-order-html-streaming, performance, resolution-optimized-pseudo-elements, schedule-tasks-by-priority |
| `privacy` | 1 | privacy |
| `pwa` | 2 | install-web-app, migrate-web-app-origin |
| `security` | 17 | client-side-encryption, digital-signatures, local-network-access, passkey-authentication, passkey-conditional-create, passkey-management, passkey-reauthentication, passkey-registration, passkeys, quick-sign-ins, restrict-outbound-connections, sanitize-untrusted-html, secure-external-subresources, security, trusted-types, validate-origins, verify-email-ownership |
| `ui-atoms` | 13 | carousel-slide-effects, component-specific-light-dark-theme, icons, position-aware-tooltips, pull-to-reveal, responsive-table, scrollability-affordance-hints, scroll-position-aware-elements, scroll-progress-indicator, shrinking-header-on-scroll, single-line-overflow, state-aware-sticky-headers, viewport-aware-dropdowns |
| `ui-behaviors` | 40 | 2d-panning, anchor-positioning-tab-underline, animate-element-entry-exit, animate-to-from-top-layer, carousel-snap-highlights, consistent-cross-document-transitions, cross-document-transitions, custom-button-actions, declarative-dialog-popover-control, directional-navigation-transitions, drag, drag-and-drop, dynamic-sibling-animations, dynamic-sort, group-element-transitions, highlight-text-ranges, interactive-content-reveal, interest-triggered-action-previews, interest-triggered-tooltips, light-dismiss-a-dialog, motion, move-dom-element-without-losing-state, parallax-scroll-effects, persistent-top-layer-ui, physics-based-easing, platform-controls-dismiss-dialog, prevent-page-scroll-under-modal-dialog, same-document-transitions, scoped-component-transitions, scroll-completion-effects, scroll-entry-exit-effects, scroll-snap-realtime-feedback, scroll-snap-state-sync, scroll-target-on-load, scrollytelling, search-hidden-content, sortable-table, spatial-navigation, swipe-to-remove, swipe-to-reveal |
| `ui-components` | 22 | accordion, app-menus, breadcrumbs, card, carousel, checkbox, copy-button, dark-mode-toggle, dialog, hovercard, menu, navbar, navigation-drawer, persistent-app-tours, persistent-toast-notifications, progress, progress-ring, scrollspy, spinner, stack-drill-down, tabs, toolbar |
| `user-experience` | 3 | content-first-noise-reduction, form-factor-adaptation, natural-interactions |
| `visual-design` | 22 | adapt-scrollbar-to-contrast-preferences, apply-webgl-shaders, browser-ui-theming, color, complex-shapes, contrast-color, customize-scrollbar-color-and-thickness, custom-text-decorations, dark-mode, equal-width-text-lines, export-html-media-from-canvas, expose-canvas-content-to-browser-features, improve-text-layout-and-legibility, interactive-content-in-3d-scenes, precise-text-alignment, shaped-cutouts, soft-edge-content-fade, typography, visual-effects, visually-stable-font-fallbacks, visually-stable-mixed-fonts, visually-texture-content |
| `wasm` | 1 | cpp-on-the-web |
| `webmcp` | 3 | agentic-forms, agentic-javascript-tools, webmcp |

Nine categories also ship a same-named umbrella/discipline guide (`css/css`, `security/security`, `webmcp/webmcp`, …). Category counts sum to 210 and were recomputed from the tree, not taken from docs. [F] for counts, [I] for umbrella semantics.


Guide files are **plain prose markdown starting with `# Title`** — no YAML frontmatter, no dates, no severity, no machine-readable metadata. Verified on `guides/forms/form-fields-automatically-fit-contents.md` (first line is `# Form Fields Automatically Fit Contents`). [F]

### 3.3 CLI — commands, flags, outputs

Entry: `npx -y modern-web-guidance@latest <command>`; implementation `src/cli/modern-web.ts` (SRC), `printUsage()` there. Parse via `node:util` `parseArgs` with `strict:false` at top level, `strict:true` inside `legacy-scan`. [F]

| Command | Flags | Behaviour | Evidence |
|---|---|---|---|
| `search <query>` | — (+ global `--skill-version`) | Offline embedding + BM25; prints **JSON-lines array of `{id, description}` only**; top-10 by similarity; warns (stderr) when query is non-English | `modern-web.ts` (`search`,`list` branches); `src/rag/search.ts`, `src/rag/bm25.ts` |
| `list` | — | Same `{id, description}` JSON lines for all use cases | same |
| `retrieve <ids>` | ids comma/space/semicolon-separated | Prints `--- Guide for <id> ---` blocks; if combined > **9,500 bytes** and stdout is not a file, writes `mwg-guide-<pid>-<ts>.md` to `tmpdir()`/`/tmp` and tells agent to read it with its file tool | `MAX_INLINE_STDOUT_BYTES = 9500`, `saveRetrievedGuides()` |
| `legacy-scan [path]` alias `analyze` | `--json`, `--guide <guideId>`, `--include-docs-and-tests`, `-h` | Deterministic AST/CSS/DOM/dependency scan; default target `.`; default **excludes docs & tests**; human output groups by guide → rule → up to 5 file-diversified findings with `Keep when:` / `Drop when:` lines | `src/analyzing/cli.ts` `ANALYZE_CLI_HELP`, `runAnalyzeCli` |
| `set-baseline <target>` | `widely\|newly\|limited\|YYYY` | Writes `baseline` into `.mwgrc`. **Not listed in `printUsage()`** — undocumented but dispatched | `modern-web.ts` (`command === "set-baseline"`) |
| `set-allow-origin-trials` | — | Sets `allowOriginTrials:true` in `.mwgrc` (unlocks Origin-Trial guides) | `modern-web.ts`; README `.mwgrc` table |
| `set-allow-volatile-features` | — | Sets `allowVolatileFeatures:true` | same |
| `install [--choose]` | `--choose`, passthrough args (e.g. `--agent`, `-y`) | Spawns `npx -y skills add GoogleChrome/modern-web-guidance` (+`--skill modern-web-guidance` unless `--choose`); `next` dist-tag swaps in `tree/next` | `modern-web.ts` `install` branch |
| `uninstall` | — | `npx -y skills remove <sibling skill ids>` | `modern-web.ts` |
| `update` | — | `npx -y skills update <sibling skill ids>` | `modern-web.ts` |
| global | `-h/--help`, `-v/--version`, `--skill-version <v>` | `--skill-version` enables stale-skill nagging; on Claude with frozen marketplace version it emits an "insist" upgrade message | `printUsage`, `maybeEmitUpdateMessage` |

**`legacy-scan --json` output schema** (`AnalyzeJsonOutput`, `src/analyzing/cli.ts`): `{targetDir, totalFindings, guides[{guideId, retrieveCommand, count, rules[{ruleId, summary, verifierRubric{keepWhen[],dropWhen[]}, count, findings[{file,line,message,lineContent}]}]}], activeRuleCount?, activeGuideCount?, skippedDocsAndTestsCount?, note?, error?}`. [F]
Exit codes: `0` = completed (regardless of findings), `1` = error (bad path, unknown guide id, oversize file, arg parse). [F]

### 3.4 Scanner engine (matcher kinds, limits)

| Component | Behaviour / constant | Source |
|---|---|---|
| Matcher kinds | `js` (ts-morph AST), `dom` (selector + attribute predicates), `css` (style-rule/declaration predicates), `dependency` (`package.json` package names) | `src/analyzing/schema.ts` (`RuleMatcher`) |
| Rule count | **38 registered rule modules** in `RULE_MODULES`, flattened into `QUALIFIED_RULES`; the `js` module re-exports 10 JS sub-rules (`src/analyzing/rules/js/*.ts`). 48 non-test `.ts` files exist under `rules/`, incl. `index.ts`, `js.ts`, `js/shared.ts`, `helpers/password-credential.ts` | `src/analyzing/rules/index.ts` |
| Qualification bar | comment: *"Post-Verifier Precision >= 90% and either Static Matcher Precision >= 80% at n >= 10, or >= 90% at n >= 5 for rare patterns"* | `rules/index.ts` |
| Suites | `src/analyzing/rules/*.test.ts` (one per rule) + `rules-landed.test.ts` | tree |
| File size cap | `MAX_SOURCE_FILE_BYTES = 1_000_000` | `scanners/file-filter.ts` |
| File count cap | `maxFiles: options?.maxFiles ?? 5000` — no CLI flag exposes it | `scanners/index.ts` |
| Source extensions | `.js .mjs .cjs .ts .mts .cts .jsx .tsx .html .htm .php .vue .svelte .gts .gjs .astro .css .scss .less` | `file-filter.ts` |
| Framework handling | JSX/TSX scanned with DOM rules; `.vue/.svelte/.gts/.gjs/.astro` → `<script>`/`<style>` block extraction (`sfc-extractor.ts`); Astro frontmatter + Glimmer `{{!…}}` comments handled | `sfc-extractor.ts`, `scanners/index.ts` |
| False-positive controls | per-rule `keepWhen`/`dropWhen` rubric; vendored/minified/build-dir detection; docs & tests skipped by default; `skipIfHasSpread`, `skipIfDynamicAttributes` | `schema.ts`, `file-filter.ts` |
| Rule identity | every finding carries `guideHash` + `cardId` (`CARD_ID_HEX_LENGTH = 12`) | `schema.ts`, `scanners/index.ts` |
| Verification | optional LLM verifier module exists (`llm-verifier.ts`); every rule match is explicitly labelled provisional and the *agent* is instructed to filter | `src/analyzing/llm-verifier.ts`; SKILL.md Step 2 of modernization flow |

### 3.5 Guide-triage taxonomy (design vocabulary)

`src/analyzing/schema.ts` defines two orthogonal axes used to decide whether a guide gets a scanner rule. [F]

| Axis | Values |
|---|---|
| `Detection` | `direct-token` (dedicated vendor prefix / deprecated attribute / single-purpose package; 0–3% static misfire) · `structural-ast` (2–3 clause AST shape; 3–10%) · `needs-verifier` (everyday APIs, >50% static misfire, *"requires LLM Verifier or deferral"*) · `no-legacy-pattern` |
| `UpdateScope` | `local-swap` · `cross-layer-refactor` · `widget-recipe` · `n/a` |

`GuideTriage` also carries `targetSubPattern`, `replaces[]`, `doesNotReplace[]`, `reason`, `modernFeature?`, `falsePositiveTraps[]`, `provenance{methodVersion, model, evaluatedAt, sources[]}`. **This rich metadata is SRC-only** — none of it is present in the distributed guide markdown or the CLI JSON. [F]

### 3.6 Configuration (`.mwgrc`)

| Key | Effect | Command | Source |
|---|---|---|---|
| `allowOriginTrials` | unlock Origin-Trial feature guides | `set-allow-origin-trials` | README; `src/core/mwgrc.ts` |
| `allowVolatileFeatures` | unlock single-engine/volatile feature guides | `set-allow-volatile-features` | README; `mwgrc.ts` |
| `baseline` | `widely\|newly\|limited\|YYYY` (accepts aliases `"baseline widely available"`, `"baseline"`, …) | `set-baseline` | `mwgrc.ts` `normalizeBaselineTarget` |
| *(arbitrary)* | `MwgConfig` has `[key: string]: unknown` — extra keys tolerated | — | `mwgrc.ts` |

Resolution order: walk up from cwd to the first dir containing `.mwgrc` **or `.git`** (nearest wins, no merging); else `~/.mwgrc` if present; else `<cwd>/.mwgrc`. [F] (`resolveMwgrcPath`)

**[I]** `baseline` is config-complete but **not consumed by `legacy-scan`** — `src/analyzing/cli.ts` imports no `mwgrc` module, and `AnalyzeJsonOutput` has no baseline field. So browser-target only gates *guide retrieval*, never *finding emission*.

### 3.7 Telemetry & privacy

`ClearcutLogger` posts to Google Clearcut; a detached watchdog process (`src/cli/telemetry/watchdog/`) flushes. Logged: install/update/uninstall counts, **calling agent name** (`determineAgent`, `KNOWN_AGENTS`), retrieved guide IDs, search query strings, latency, success/failure, command types. Opt-out: `DISABLE_TELEMETRY=1`. README says raw user prompts are not collected. [F]

### 3.8 Evaluation harness (internal, not shipped)

`src/harness` (222 files), `src/grading` (13), `src/dashboard` (72); base apps `daily-grind`, `devtools-times`; Playwright graders calibrated against multi-agent golden solutions (100% pass) and unmodified base app (0% pass); metrics = *opportunity* (100% − unguided) and *uplift* (guided − unguided). README snapshot (Nov 8): antigravity_cli 58%→94% (+36pp), codex_cli 54%→82% (+28pp), claude_code 57%→88% (+31pp). Dashboard: `googlechrome.github.io/modern-web-guidance-src/`. [F]

---

## 4. What it does NOT do (observable limitations)

Each row records **what was inspected** as evidence of absence, not merely silence.

| # | Limitation | Evidence (what was inspected) | Type |
|---|---|---|---|
| 1 | **No detection of AI-generated / "slop" provenance.** No heuristics for authorship, comment style, boilerplate, or agent-typical artefacts. | Full PUB tree (301 entries) and SRC tree (3,210 entries) searched for `slop\|ai-generated\|aigenerated\|provenance\|vibe`: **0 matches**. The `built-in-ai/` category is *browser-side* AI APIs (Prompt API, translator, summarizer), not code provenance. | [F] |
| 2 | **No severity, priority, or confidence score.** Findings are unranked, flat, count-only. | `AnalyzerFinding` and `AnalyzeJsonOutput`/`AnalyzeCliFinding` in `schema.ts`/`cli.ts` declare no `severity`/`priority`/`confidence`/`impact` field. Human output prints guide → rule → findings with no ranking, only a `count`. | [F] |
| 3 | **No automated remediation / codemod execution.** It detects, then asks the agent to hand-edit. | `ANALYZE_CLI_HELP` options are exactly `--json`, `--guide`, `--include-docs-and-tests`, `-h`; `parseArgs` is `strict:true` (an unknown `--fix` would throw). No path in either tree matches `codemod\|autofix\|fixer`. SKILL.md Step 4 has the agent *"apply the replacement … re-run `legacy-scan`"*. | [F] |
| 4 | **No SARIF / CI-native output, no fail-on-findings.** | Output is the bespoke JSON above; exit `0` even with findings; docs say *"automated CI/CD pipeline integrations are currently in development"*. PUB tree regex `sarif` → **0 matches**; SRC tree → **0 matches**. | [F]+[I] |
| 5 | **No framework-*idiom* rules.** Framework support is syntactic (parse JSX, extract SFC blocks), not semantic. | All 48 rule modules are named after web-platform features (`dialog.ts`, `field-sizing`…); none named react/vue/svelte/angular/next. Supported extensions include `.vue/.svelte/.astro/.php`, but rules target platform APIs only. No React-hooks / Vue-reactivity / Next-JS anti-pattern rules exist. | [F] |
| 6 | **No provenance dates in the distributed artifact.** | Shipped guides begin with `# Title` — no frontmatter/date/version. `GuideTriage.provenance` exists only in SRC `schema.ts`. CLI JSON has no `evaluatedAt`/`retrievedAt`. | [F] |
| 7 | **No per-finding browser-target gating.** `.mwgrc baseline` exists but is ignored by the scanner. | `src/analyzing/cli.ts` imports `QUALIFIED_RULES`, `scanners`, `schema` — no `mwgrc`; `AnalyzeJsonOutput` has no baseline field. | [F]+[I] |
| 8 | **No suppression / baseline-accept mechanism.** No ignore file, no inline-disable comments, no accepted-findings store. | Neither tree has paths matching `.mwgignore\|suppress\|baseline-ignore`. `.mwgrc` keys are only the 3 above (+ passthrough). SKILL.md instead tells the agent to *"drop false positives"* by judgment each run. | [F] |
| 9 | **Coverage is deliberately partial and capped.** | ~20% of the corpus has deterministic rules (SKILL.md, docs); default `maxFiles = 5000` with no flag to raise it; 1 MB/file cap; a 64k-file repo silently under-scans (issue #3596). | [F] |
| 10 | **No CSS/HTML semantics for dynamic code, and a narrow language set.** | No `.erb`, `.jinja`, `.twig`, `.razor`, `.mdx`, `.hbs` in `SUPPORTED_SOURCE_EXTENSIONS`; anything templated at runtime can only be matched on literal output. | [F] |
| 11 | **Feedback path on the publish repo is closed.** | PUB `has_issues=false`, `has_discussions=false`; all reporting routes to SRC (411 open issues). | [F] |

---

## 5. License and attribution obligations

### 5.1 What is actually in the repo

| Item | Finding | Type |
|---|---|---|
| `LICENSE` | 11,358 bytes; stock **Apache License 2.0**, unmodified body. First lines: `Apache License` / `Version 2.0, January 2004` / `http://www.apache.org/licenses/`. | [F] |
| Copyright holder line | **None.** No `Copyright (c) Google` header. The appendix still contains the placeholder `Copyright [yyyy] [name of copyright owner]`. Only `Google` strings in the file are in the boilerplate appendix/URLs (verified line-by-line). | [F] |
| `NOTICE` | **Absent.** No `NOTICE`, `COPYING`, `AUTHORS`, `SECURITY`, or `CODE_OF_CONDUCT` in PUB. Only `CONTRIBUTING.md` + `LICENSE`. | [F] |
| SPDX | `Apache-2.0` (GitHub `licenseInfo.key`, `community/profile.spdx_id`, `package.json.license`, `plugin.json.license`, `kimi.plugin.json.license` all agree) | [F] |

### 5.2 The dual-licence statement (read this before deriving anything)

README `## License` says, verbatim and *outside* any LICENSE file:

> "Software code in this project is licensed under the Apache License 2.0."
> "Documentation and guide content under `guides/` are licensed under Creative Commons Attribution 4.0 International (CC-BY 4.0)."
> "Portions of the documentation in this project are derived from MDN Web Docs by Mozilla Contributors and W3C, WHATWG, and IETF specifications."

[F] — README.md, `## License`, retrieved 2026-11-16.

**[I]** There is a real inconsistency to respect: the only licence *file* is Apache-2.0, yet the README asserts CC-BY-4.0 over `guides/`. A careful consumer should treat the guide corpus as **CC-BY-4.0** (the more specific, content-scoped statement) and code as Apache-2.0 — and should not assume the single LICENSE file resolves the question.

### 5.3 Obligations, precisely

**If we only read it for research (our current position):**

- Apache-2.0 §4 conditions attach to *distribution* of the Work or Derivative Works, not to reading or summarising. Reading obliges nothing. [F]
- Independently-created notes, summaries, and factual inventory (names, counts, flags, JSON shapes) are not Derivative Works: Apache-2.0 §1 excludes works that *"merely link (or bind by name) to the interfaces"*, and factual metadata is not copyrightable expression. [I]
- **Still required by our own rules:** no copying of prose/skill text/implementation beyond ≤25-word evidentiary quotes (this artifact complies), and no implied endorsement — Apache-2.0 §6 grants **no trademark rights**; *"Modern Web Guidance"*, *Chrome*, and *Google* marks may not be used to imply affiliation. [F §6]

**If we ever ship a derived work** (vendor a guide, port a rule, embed a SKILL.md):

| Obligation | Trigger | Source |
|---|---|---|
| Include a copy of the Apache-2.0 licence | any redistribution of code | §4(a) |
| Prominent notices on modified files | any modified file | §4(b) |
| Retain copyright/patent/trademark/attribution notices | Source-form redistribution | §4(c) |
| Reproduce NOTICE contents | only if a NOTICE exists — **none here**, so nothing to propagate | §4(d) |
| State changes / add own copyright | permitted, must not imply licence modification | §4 trailing paragraph |
| **CC-BY-4.0**: attribution to Google Chrome, licence link, indication of changes | reuse of any `guides/` prose | README |
| **MDN/W3C/WHATWG/IETF** attribution for derived documentation | reuse of guide text that derives from those sources | README |
| Patent grant terminates on patent litigation against the Work | defensive | §3 |

**[I]** Practical rule for the coordinator: we may freely cite facts and build an *original* detector; we must not paste guide bodies, SKILL.md text, or rule implementations, and if we ever reuse a guide we must satisfy **both** Apache-2.0 and CC-BY-4.0 (plus MDN attribution) — the repo gives no convenient NOTICE to copy, so attribution must be authored by us.

---

## 6. Materially useful issues (scope & limitations only)

All on SRC (PUB has no tracker). Retrieved 2026-11-16. [F]

| Issue | Why it matters to us | URL |
|---|---|---|
| **#3620** — published package `bin` points at a file missing from package contents → `MODULE_NOT_FOUND` | Distribution is currently brittle; its CLI entry is not reproducible from PUB | https://github.com/GoogleChrome/modern-web-guidance-src/issues/3620 |
| **#3596** — *"no way to raise the 5,000-file cap, so large repos are silently under-scanned"* | Confirms a hard coverage ceiling + silent truncation; a real trust gap we can exploit | https://github.com/GoogleChrome/modern-web-guidance-src/issues/3596 |
| **#3587** — *"surface parse-error, truncation, and skipped-file diagnostics"* | Upstream acknowledges it does not report *why* coverage was lost | https://github.com/GoogleChrome/modern-web-guidance-src/issues/3587 |
| **#3616** — `dialog` vs `light-dismiss-a-dialog` disagree on whether `closedby` fallback is mandatory | Cross-guide contradictions exist; a consistency layer is unowned | https://github.com/GoogleChrome/modern-web-guidance-src/issues/3616 |
| **#3615** — `html` guide omits cross-links to related dialog guides | Guide corpus is loosely linked; no dependency graph between guides | https://github.com/GoogleChrome/modern-web-guidance-src/issues/3615 |
| **#3595** — *"guides: optional 'When to keep existing code' section"* | Keep-vs-migrate guidance is not yet standardised per guide | https://github.com/GoogleChrome/modern-web-guidance-src/issues/3595 |
| **#3558** — WebSocket request; maintainer reply defines scope: guides are *"anchored to modern web platform features (`web-feature-ids`) with browser-observable evals"*, backend transport out of scope | Best single statement of upstream's scope boundary — anything backend/infra is ours, not theirs | https://github.com/GoogleChrome/modern-web-guidance-src/issues/3558 |
| **#3533** — Claude's built-in marketplace serves frozen v0.0.194; docs switched to GH-repo install | Upstream's distribution lags in at least one major agent marketplace | https://github.com/GoogleChrome/modern-web-guidance-src/issues/3533 |
| **#3606** — *"Proposal: Add Pi (pi.dev) as a supported agent"* | Agent coverage is demand-driven and still expanding | https://github.com/GoogleChrome/modern-web-guidance-src/issues/3606 |

Discussions: **none** (`has_discussions=false` on both repos). [F]

---

## 7. Non-duplication candidates

Ranked by (absence-confidence × value). **Collision risk** = likelihood upstream ships this itself within ~2 quarters, given its stated roadmap.

| # | Capability we could own | (a) Evidence it is absent upstream | (b) Why it is valuable | (c) What could go wrong | Collision risk |
|---|---|---|---|---|---|
| **1** | **AI-generated-code provenance signals** (comment/template tell-tales, over-abstraction, placeholder residue, duplicated block structure, generic naming density) reported as *signals*, never verdicts | `0` paths in either tree match `slop\|ai-generated\|provenance\|vibe`; 17 categories are all platform-capability areas; `built-in-ai` = browser APIs | It is the plugin's stated differentiator; upstream's premise is "agents copy 2015 conventions", not "code was AI-written"; nothing in the ecosystem owns this | Authorship inference is unreliable and accusatory; risk of defamation-ish framing, false positives on human code; must be framed probabilistically and never gate edits | **Low** — orthogonal to web-platform guidance |
| **2** | **Severity + confidence model** attached to every finding (impact × reach × reversibility × matcher class) | `AnalyzerFinding`/`AnalyzeJsonOutput` declare no severity/confidence/priority; human output is count-only and explicitly *"provisional"*; verification is delegated to the agent's judgement | Turns a flat list into a triage queue; enables thresholds, SLAs, and human review ordering; upstream deliberately refuses to rank | Inventing precision; upstream's 80/90% precision bar is measured, ours would be asserted → must publish calibration or label heuristic | **Medium** — upstream could add ranking once it has CI output |
| **3** | **Framework-idiom detection** (React hook misuse / effect waterfalls / legacy class components; Vue reactivity traps; Next data-fetching anti-patterns; AngularJS-era patterns) | All 48 rule modules are platform-named; no react/vue/svelte/angular/next rule files; framework support is only *parsing* `.jsx/.tsx/.vue/.svelte`. SRC #3558 confirms guides are anchored to `web-feature-ids` | Most real "AI-generated / legacy" code is framework code; upstream structurally cannot cover it without abandoning its platform-feature anchoring | Framework churn; overlapping with existing framework skills; opinionated rules age badly; needs its own evidence base | **Low-Medium** — outside upstream's charter |
| **4** | **Suppression / accept-with-reason baseline** (`.mwgignore`-style, auditable, carried across runs) | No suppression path or key exists; SKILL.md instead tells the agent to re-judge `keepWhen/dropWhen` every run; config has only 3 keys | Adoption is impossible without a false-positive escape hatch; makes repeat CI runs stable and diffs meaningful | Duplicates `.mwgrc` mental model; upstream may add `ignore` keys; a stale ignore file silently hides regressions | **Medium** |
| **5** | **SARIF / GitHub code-scanning output + `--fail-on` policy** | Output is bespoke JSON only; exit `0` regardless of findings; docs say CI integrations *"currently in development"*; no `sarif` path | Drops into PR annotations and code scanning with zero glue; makes the tool usable in gates | **Highest collision risk on this list** — upstream has publicly announced CI work; being second is worthless | **High** |
| **6** | **Baseline-target-aware scanning** (honour `.mwgrc baseline` / per-path browser targets so a finding is suppressed when the target predates the modern feature) | `.mwgrc.baseline` exists but `analyzing/cli.ts` imports no `mwgrc`; JSON has no baseline field → findings are target-blind today | A team pinned to an older Baseline gets the same findings as a greenfield team — noise; target-awareness is the difference between usable and ignored | Semantics of partial support are subtle (a feature can be supported in 2 of 3 engines); must not contradict upstream's fallback doctrine | **Medium** — natural upstream follow-on |
| **7** | **Whole-repo modernization inventory & trend** (per-category counts, age/effort estimate, run-over-run delta, "debt score") | Output is a single-run finding list; no history/trend/store; the only dashboard is upstream's *internal* eval dashboard, not shipped | Managers need "how bad is it and is it improving"; gives a reason to run repeatedly rather than once | Scope creep into a product; storage/state design; estimates are guesses that will be quoted back at us | **Low** |
| **8** | **Conflicting/duplicated guidance detector** (flag when two retrieved guides give incompatible prescriptions for the same code) | SRC #3616 and #3615 are exactly this class of bug, filed one-by-one and manually; no cross-guide consistency mechanism exists | Agent-retrieved guide sets can contradict each other; catching that is unique leverage from having a *corpus* view, and upstream's own backlog proves the need | Requires ingesting upstream guide text → licence care (CC-BY-4.0) and staleness as upstream edits | **Low** |
| **9** | **Dependency-usage-level legacy detection** (declared-but-unused legacy libs, lockfile drift, import-graph reach, transitive CVE-adjacent age) | `DEPENDENCY_RULE_FILENAMES = ['package.json']` only; dependency matcher receives package names; no lockfile, import-graph, or version-range analysis | Declared ≠ used; most legacy debt hides in transitive/lockfile state, invisible to name matching | Parsing lockfiles across npm/pnpm/yarn/bun; monorepos; overlaps with existing dependency-audit tooling | **Low** |
| **10** | **Standard-mapping of findings** (WCAG 2.2 SC, OWASP, Baseline feature IDs per finding, for compliance reporting) | `AnalyzerFinding` has no standard-reference field; guides are prose; SRC #1429 shows even the accessibility guide lacked WCAG SC references | Procurement/compliance ask "which WCAG criteria?"; mapping is pure added value over a platform-feature corpus | Mapping errors create legal exposure; WCAG interpretation is contested; must cite, not assert | **Low** |

**[I] Recommended wedge:** #1 + #2 + #3 together — provenance signals, severity/confidence, framework idioms — none of which upstream can adopt without breaking its "anchored to web-feature-ids + browser-observable evals" charter (SRC #3558). Avoid #5 as the headline; it is the one place upstream has already announced intent.

---

## Appendix A — Verification ledger (what was actually executed)

| Check | Result | Type |
|---|---|---|
| `gh repo view … --json …` (identity) | OK | [F] |
| `git/trees/HEAD?recursive=1` on PUB | 301 entries, `truncated:false` | [F] |
| `git/trees/HEAD?recursive=1` on SRC | 3,210 entries | [F] |
| Extension histogram on PUB | 237 `.md`, 14 `.svg`, 11 `.json`, 1 `.png`, 1 `.toml`, 1 `.gitignore`, 1 extensionless; **0 code files** | [F] |
| Path regex `(?i)(scan\|detect\|lint\|audit\|rule\|check\|eval\|fix\|codemod)` on PUB | only SVG icons + unrelated guide titles (`language-detection`, `review-checklist`) | [F] |
| `contents/LICENSE` decoded + written locally, inspected line-by-line | stock Apache-2.0, no holder, placeholder intact | [F] |
| npm `registry.npmjs.org/modern-web-guidance/latest` | 1.0.1, 281 files, bin → `modern-web.mjs`, provenance present | [F] |
| `web_fetch` docs index / get-started / modernization-workflow | 200; `/docs/ai/…` = 404 | [F] |
| `gh issue list -R …-src` + `gh search issues` | 30 titles read; searches for `maxFiles`, `severity`, `framework` | [F] |
| Clearcut/telemetry code read | `ClearcutLogger`, `determineAgent`, `DISABLE_TELEMETRY` | [F] |

## Appendix B — NOT INSPECTED

| Item | Reason |
|---|---|
| The 210 guide bodies in full | Only 1 guide read end-to-end (`forms/form-fields-automatically-fit-contents.md`) to establish the "no frontmatter" fact; 210 files × prose was out of scope and would risk wholesale copying |
| Exact `QUALIFIED_RULES.length` / `QUALIFIED_GUIDE_IDS.length` | Would require reading all 48 rule modules to count `AnalyzerRule` objects per module; recorded as "38 modules, ≥38 rules, ~20% of corpus per upstream" instead of a fabricated number |
| `src/analyzing/llm-verifier.ts` internals | Existence + role established from `schema.ts`/`cli.ts`; prompt/model behaviour not read |
| `src/rag/*` (embedding model, BM25 index) | Distribution-relevant only as "offline, zero-dependency, no network"; internals not read |
| `src/dashboard/**` (72 files) and `src/harness/**` (222 files) | Internal eval infrastructure, not shipped to agents |
| npm tarball contents (16.7 MB) | Would require extracting upstream implementation locally; deliberately not vendored. PUB/`gh api` tree used instead |
| Branch list / `next` dist-tag tip | `main` confirmed as default; `next` referenced in `modern-web.ts` but not enumerated |
| `modern-web-guidance-src` LICENSE body separately | `gh repo view` reports `apache-2.0`; PUB LICENSE read in full |
| GitHub Discussions | Disabled on both repos (`has_discussions=false`) |
