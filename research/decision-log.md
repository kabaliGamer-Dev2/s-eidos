# Decision log

- **Opened:** 2026-11-16 (Asia/Calcutta)
- Format: each decision records what was decided, the evidence, the alternatives, and the consequence. Decisions are
  reversible only with a new entry.

---

### D-001 — Build a fresh repository in the empty `MWC` directory
**Evidence:** `Get-Location` → `...\dsh-plugins\MWC`; `Get-ChildItem -Force` → empty; `git status` → not a repository.
**Decision:** treat `MWC` as the project root and initialise Git only at Stage 7.
**Alternatives:** create a subdirectory (adds a pointless level); work in a sibling (would modify user work).
**Consequence:** nothing of the user's can be overwritten; the two sibling plugins stay read-only.

### D-002 — Zero runtime dependencies
**Evidence:** the npm cache sits outside the workspace and default installs fail with `EPERM`
(`research/environment-inventory.md` §4); the host documents dependency-free bundles; the adjacent DSH port is also
zero-dependency and no-build.
**Decision:** `"dependencies": {}` permanently. Any dev tooling must be optional and must never be required to load the plugin.
**Alternatives:** a parser dependency (ts-morph/TypeScript) for an AST tier — rejected, it would make the tool unusable in
the exact environment it targets.
**Consequence:** detection is lexical/structural; tier-`c` (data-flow) rules are out of scope and must be documented as such.

### D-003 — Plain ESM JavaScript; TypeScript is dev-only, for checking
**Evidence:** the installed distribution has no TypeScript build step for user bundles; `link:` installs are not filtered
by `files`, so a build artifact is effectively committed source; the host runtime is Node 24.21.0.
**Decision:** runtime code is `.mjs`/`.js` ESM. TypeScript, if adopted, is a devDependency used only for `tsc --noEmit`
over JSDoc-annotated JavaScript, and is never required to load or test the plugin.
**Consequence:** no type-safety claims beyond JSDoc; tests must run with no `node_modules` present.

### D-004 — The left sidebar entry is the `sidebar.panellist` + `main` pair
**Evidence:** `@deepseek-ai/dsh-client-ui-sidebar/README.md` § *Global panel entries*; `src/client/contract/slots.ts:47`;
two shipped call sites (`ui-plugin-manager/src/client/index.ts:129-173`, `ui-schedule/src/client/index.ts:218-246`).
Selecting a panel id with no `main` registration **throws**.
**Decision:** register both, with one shared constant id and one icon component receiving `{ size, active }`.
**Alternatives:** `conversation.composer.dock` (a decoration, not a sidebar entry — fails the user's request);
`shell.overlay` (no navigation semantics).
**Consequence:** the plugin needs a client half, a locale namespace, and a single bundled `client.js`.

### D-005 — v0.1 panel is a static evidence surface; no host↔client IPC
**Evidence:** the adjacent DSH port already occupies "panel shows live usage counters, driven through `remote` commands";
one client file only (no multi-module asset imports), and a throwing component blanks the slot.
**Decision:** the panel renders the bundled, versioned rule catalog as an inspectable evidence/decision surface
(classification, severity, confidence, support gate, false-positive warning, migration example, evidence link + retrieved
date), with copyable commands. It performs no scan, no writes, and no network.
**Alternatives:** (a) counters dashboard — occupied; (b) live findings via a custom `remote` endpoint — high complexity
and highest risk of shipping something broken; (c) a guide browser — occupied.
**Consequence:** the panel's value is *reasoning transparency*, not telemetry. The limitation is stated in the README and
the panel itself. v0.2 trigger: a proven, tested remote end.

### D-006 — Classification: exactly seven values, plus an impact axis
**Evidence:** the brief fixes seven classes; the `legacy-pattern-analyst` proposed four more (`inefficient`, `fragile`,
`misaligned`, `overengineered`), because the seven cannot express *why* something is worth changing.
**Decision:** keep the seven as the single required `classification` enum, and add an independent `impact` array
(`security`, `accessibility`, `performance`, `maintainability`, `correctness`, `compatibility`, `privacy`). "Inefficient",
"overengineered" and "framework-misaligned" become impact values plus an optional `frameworkAlignment` note.
**Alternatives:** a 11-value enum (breaks the brief's vocabulary and makes the axis ambiguous — `insecure` and
`deprecated` are not mutually exclusive kinds of thing).
**Consequence:** the two axes are orthogonal and each is independently testable; the seven-value rule "never say
deprecated without a source" stays enforceable.

### D-007 — Scope subtracted against the *whole* competitive set, not just Google
**Evidence:** `metapeka/dsh-modern-web-guidance` v0.13.0 ships Google's 208 guides byte-identical, four tools including a
33-rule legacy scanner, and a left-rail panel — in this exact host (`research/adjacent-projects.md` §3).
**Decision:** ship **no** guide corpus, **no** guide search, **no** web-platform regex rule table, **no** counters panel,
**no** slash commands. Differentiate on framework-idiom detection, severity/confidence/classification, per-claim
provenance and review dates, support-target gating, and auditable suppression.
**Alternatives:** compete on scanner breadth (a table we cannot calibrate); compete on corpus (licence event + duplicate).
**Consequence:** a smaller rule count with a much higher evidence standard per rule. Recorded in `research/gap-matrix.md`.

### D-008 — Detect-only in v0.1; codemod apply deferred
**Evidence:** the `quality-security-auditor` contract; the highest-harm failure mode is `innerHTML → textContent` deleting
intentional markup; upstream ships no autofix at all, so an *unguarded* one would be a novelty with a blast radius.
**Decision:** v0.1 ships the detection and the **refusal contract** (what a future codemod must never do), plus
per-rule `autofix: none | safe | situational` metadata. No code is rewritten.
**Alternatives:** ship one "safe" codemod (`@ts-ignore` → `@ts-expect-error`) — genuinely safe, but it needs the full
backup/diff/verify apparatus to be non-embarrassing, which is v0.2 work.
**Consequence:** no write path at all in v0.1, which removes an entire class of threat.

### D-009 — Licence: MIT (recommended; user confirms)
**Evidence:** `research/originality-and-license-review.md` §4.
**Decision:** recommend MIT. No third-party code is bundled, no patent surface identified, and MIT is one-way compatible
into the Apache-2.0 ecosystem we live in.
**Alternatives considered:** Apache-2.0 (implies derivation; NOTICE overhead), MPL-2.0, AGPL, unlicensed.
**Consequence:** no per-file headers, no NOTICE propagation; a `NOTICE.md` is still written to document the *content*
posture (no bundled third-party text).

### D-010 — Product name: `s-eidos`, chosen by the user's naming scheme
**Evidence:** the coordinator first recommended the working title `verdigris` (npm-unpublished, repository free, 9 global
repos of which one dormant component library). **The user rejected it** and specified the scheme: the name must begin
with `S-` (for Shiva) followed by a **Greek word** with a meaning related to the project. Six `S-<Greek>` candidates were
checked; all were unpublished on npm and free as repository names (`s-eidos`, `s-kriterion`, `s-elenchos`, `s-aletheia`,
`s-tekmerion`, `s-axiom`).
**Decision:** **S-Eidos** — Greek **εἶδος**, *form, shape, kind* (the root of "eidetic" and "idea"). A pattern is a form;
recognising a form is what detection does, and the citation is how the tool earns the right to call it a defect.
**Alternatives:** the other five Greek candidates (recorded in `originality-and-license-review.md` §3) and the three
pre-scheme working titles.
**Consequence:** the entire project was renamed consistently — package, repository target, panel id, agent tool
(`s_eidos_audit`), skill (`s-eidos-audit`), CLI (`bin/s-eidos.mjs`), decision directory (`.s-eidos/`), docs, tests and the
generated client bundle — and every check was re-run after the rename. `verdigris` survives nowhere in the tree.

### D-011 — Reject the `target="_blank"` / `rel="noopener"` rule
**Evidence:** both the `legacy-pattern-analyst` and `quality-security-auditor` independently found that modern engines
imply `noopener`; flagging it is near-pure noise.
**Decision:** not shipped. It stays in the catalog's excluded list with the reason.
**Consequence:** one fewer rule, one fewer way to look naive.

### D-012 — Correct the brief's documentation URL
**Evidence:** `https://developer.chrome.com/docs/ai/modern-web-guidance` → **404**; canonical is
`https://developer.chrome.com/docs/modern-web-guidance`.
**Decision:** every artifact cites the canonical URL. The dead one is mentioned only as a correction.
**Consequence:** no dead link ships in our docs; the link checker enforces this.

### D-013 — Single generated `client.js`, no bundler
**Evidence:** one client file per package (combo-script format); no asset/module import path for JS.
**Decision:** a ~40-line build script emits `client.js` from `src/client/panel.js` + `rules/catalog.json`, and CI proves
the committed artifact equals a fresh regeneration.
**Alternatives:** a bundler dependency (violates D-002); hand-duplicating the catalog into the client (drift).
**Consequence:** "build" is a deterministic text assembly we can fully test.

### D-014 — Commit identity must be fixed before the first public commit
**Evidence:** `git config user.email` = `your-email@example.com` (placeholder); `gh api user` id available.
**Decision:** raise it at the publication checkpoint; propose the GitHub `noreply` address as a repo-local setting rather
than mutating global user config.
**Consequence:** no public commit carries an invalid address; the user's global Git config is not silently changed.

### D-015 — No type checker; a syntax check plus fixture tests instead
**Evidence:** the runtime is plain ESM loaded directly by the host (`index.js`, `client.js`); nothing is compiled from
TypeScript. An experimental `tsc --noEmit --checkJs` pass over the repository produced **92 errors**, nearly all from
JSDoc narrowing (`unknown` widened from hand-written guards) rather than real defects; making it green would have
required ~90 type escapes, which is a gate that asserts less than it appears to.
**Decision:** ship `npm run check:syntax` (every module parses, via `node --check`) and rely on the 90-test suite for
behaviour. No `typescript` dependency, no `tsconfig.json`.
**Alternatives:** keep a red typecheck (dishonest), keep a green one made of `any` casts (worse), or add a build step and
write the runtime in TypeScript (contradicts D-002/D-003).
**Consequence:** the project makes no type-safety claim, and this is stated in the README and the final report. A future
typed core would be a deliberate migration, not a switch.

### D-016 — Shipped seven implemented rules, not the 37 reviewed ones
**Evidence:** `research/legacy-pattern-catalog.md` catalogues 37 reviewed rules with evidence. Each one still needs a
detector, a positive fixture, a negative fixture and an end-to-end test before it may fire; compounds the false-positive
risk, and the project's entire promise is precision.
**Decision:** v0.1 ships the 7 rules that have all four of those. The remaining 30 stay in the research catalog as the
reviewed backlog and are named as a limitation in the changelog and the README.
**Consequence:** a small, honest rule set; the panel and CLI show 7 rules rather than a misleading breadth.

### D-017 — Live panel verification unavailable in this environment
**Evidence:** the plugin installed with `application: applied` and zero warnings, and the `s-eidos-audit` skill
immediately appeared in the host's live skill catalog (proof that `apply` ran and registered its effects). The Web GUI
at the session URL answers `401 dsh web authentication required` to an isolated browser, and the host documentation
forbids searching for an authentication token to obtain a screenshot.
**Decision:** verify what is verifiable — install result, live skill registration, manifest shape, both slot ids present
in the built bundle, single-file envelope, no forbidden imports, valid icon — and **report the rendered sidebar row as
unverified** rather than claiming a visual success.
**Consequence:** the panel's appearance and interaction remain unverified; the report says so explicitly.
