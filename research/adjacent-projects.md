# Adjacent projects and competitive positioning

- **Retrieved:** 2026-11-16 (Asia/Calcutta)
- **Author:** coordinator (integration note; consolidates `upstream-auditor` findings plus first-hand inspection)

This note exists because the project brief assumed the gap was "upstream has guides, nobody detects patterns".
First-hand inspection on 2026-11-16 shows the terrain is already more occupied. Scope must be re-derived from evidence,
not from the brief's assumption.

---

## 1. Upstream: `GoogleChrome/modern-web-guidance`

| Fact | Value | Evidence |
|---|---|---|
| License | Apache-2.0 (`LICENSE`, 11,358 B, stock text, **no** copyright-holder line, **no** `NOTICE`) | `gh api repos/googlechrome/modern-web-guidance/license` |
| **Second licence layer** | README declares `guides/` content under **CC-BY-4.0**, with MDN/W3C/WHATWG/IETF derivation | README, per `upstream-auditor` inventory |
| Shape | multi-agent **skill bundle + Node CLI**, not an MCP server | `inventory.md` §Distribution |
| Coverage | ~210 guides in 17 categories; 38 rule modules | `inventory.md` §Capability |
| Public repo ships | **zero executable code** — `bin` → `modern-web.mjs` is absent from the published tree | `inventory.md`; upstream issue #3620 |
| Documented weaknesses (self-described) | analyzer output is "provisional", **no severity/confidence field**, verification delegated to the agent's `keepWhen`/`dropWhen` | `inventory.md` §Gaps |
| Rule domain | web-platform named (`ls-01`… style ids); **no React/Next/Vue anti-pattern rules**; framework support is syntactic parsing only | SRC issue #3558, cited in `inventory.md` |
| CI/SARIF | CI/CD integration self-described as "currently in development" | `inventory.md` |

**Two consequences for us.**

1. **We must never copy guide text.** It is CC-BY-4.0 (attribution + share-alike-free but obligation-bearing) *and*
   Apache-2.0 at file level; the licence boundary is ambiguous in the upstream repo itself. The safe and honest path is
   to author our own rule text from primary sources and cite them. No vendoring, no byte-identical corpus.
2. **A better scanner is not, by itself, a gap.** Upstream already has an analyzer; see §3.

## 2. The brief's documentation URL is stale

`https://developer.chrome.com/docs/ai/modern-web-guidance` returns **404**. Canonical page:
`https://developer.chrome.com/docs/modern-web-guidance` (per `upstream-auditor`). Recorded so that no artifact of ours
cites a dead URL.

## 3. Adjacent DSH plugin: `metapeka/dsh-modern-web-guidance`

| Fact | Value | Evidence |
|---|---|---|
| Version | 0.13.0, published on npm | `package.json` in repo |
| License | Apache-2.0 + `NOTICE` | repo root |
| Created / pushed | 2026-11-08 / 2026-11-11 | `gh repo view` |
| Stars | 3 | `gh repo view` |
| Shape | DSH bundle, **zero dependencies**, no build step; one row `modern-web-guidance` | `package.json`, `cordis.patch.yml` |
| Corpus | **vendors Google's 208 guides byte-identical** (snapshot `2026_11_09-5bcc021b`) | README §vs Google |
| Tools | `web_guidance_search`, `web_guidance_retrieve`, `web_guidance_list`, **`web_guidance_legacy_scan`** | README §What you get |
| Scanner | **33 regex rules, 30 inherited from upstream**, report-only, explicit paths only, no AST, **no autofix** | README §FAQ |
| Panel | a **left-rail icon** opening "Guidance Insights" in the central area: counters, per-day chart, scan button, mute list | README §Sidebar panel |
| Client services | `slots`, `locale`, `remote`; acts on the host through **human commands** (`/guidance-scan`, `/guidance-suppress`, `/guidance-stats`) | README §Sidebar panel |
| Explicit non-goals | will not ship upstream's 4.99 MB `legacy-scan` engine or 9.16 MB embedding tables | README §Roadmap |

### Why this matters

It independently proves the integration the brief asks for is feasible (left-rail icon → central panel, zero deps,
`node --test`), which de-risks our build. It also **closes three candidate gaps** that the brief implied were open:

- "offline guide access in DSH" — done.
- "a lightweight pattern scanner in DSH" — done, 33 rules, effectively upstream's rule set.
- "a DSH sidebar panel for a web-guidance plugin" — done.

Any of those three, shipped by us, would be duplication. They are struck from the scope.

## 4. What remains genuinely unoccupied

Derived by subtraction, then checked against the upstream inventory:

| Candidate capability | Upstream Google | metapeka DSH port | Verified absence evidence |
|---|---|---|---|
| **Framework-idiom detection** (React/Next/TS anti-patterns, not web-platform features) | none — charter-bound to `web-feature-ids` | none — inherits the same rule table | upstream `inventory.md` §Gaps; upstream SRC issue #3558 |
| **Support-target gating** (`browserslist`/Baseline input decides whether "old" is a defect) | rules fire without project targets | rules fire without project targets | neither README nor rule table accepts a target policy |
| **Severity + confidence + classification model** | explicitly absent | rule-level "confidence" label only, no severity model | upstream `AnalyzerFinding` has no such field |
| **Provenance with `retrieved` + `reviewBy` dates per claim** | none stated | guides pinned by snapshot hash, not per-claim recency | no date fields in either rule model |
| **Decision records**: suppression with **reason + review date + expiry**, auditable | none | `.suppress` stores a `siteId` only, no reason | metapeka README §Suppression |
| **Guarded codemod**: dry-run default, refusal conditions, backup, post-change verification | a "modernize" step inside the CLI, but no diff/backup/apply guard described | explicitly **no autofix** | metapeka README §FAQ |
| **AI-generation provenance signals** (cargo-cult wrappers, invented APIs, missing error states, fake a11y) | no path matches `slop\|ai-generated\|provenance\|vibe` | no such rules | upstream `inventory.md` §Gaps |

## 5. Positioning statement (draft, to be finalised in design)

> A **decision ledger**, not a guide library and not a lint pass.

Three claims that survive the subtraction:

1. **Framework-aware findings.** Rules that understand a `.tsx` React component or a Next.js route handler, where a
   web-platform ruleset cannot express the defect (effect-driven state, hydration hazards, `'use client'` boundaries,
   `@ts-ignore` vs `@ts-expect-error`, unsafe `any` at API boundaries).
2. **Evidence over opinion.** Every finding carries a classification from a fixed seven-value vocabulary, a severity, a
   confidence, a primary-source URL with a `retrieved` date and a `reviewBy` date, the support constraint that makes it
   apply, and an explicit false-positive warning. Nothing is marked *deprecated* unless a cited source says so.
3. **A safety model built for code that already works.** Detect-only by default; support-target gating so age alone never
   flags; guarded, dry-run-first codemods that refuse ambiguity; and suppression that records *why* and *until when*, so
   the advice can be reviewed rather than repeated forever.

## 6. Naming constraint

Any name must avoid: `Google`, `Chrome`, `Modern Web Guidance`, `MWG`, `Guidance Insights`, `web_guidance_*`,
`modern-web-guidance`, and the `dsh-modern-web-guidance` identity. Candidates are evaluated in
`originality-and-license-review.md`.
