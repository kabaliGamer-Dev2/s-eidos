# S-Eidos — design

- **Status:** Stage 3 design, evidence-backed. Implementation follows only after the research gate (§11).
- **Date:** 2026-11-16 (Asia/Calcutta)
- **Evidence:** `research/gap-matrix.md`, `research/adjacent-projects.md`, `research/decision-log.md`,
  `research/environment-inventory.md`, `research/agents/*`, and the installed DSH documentation.

> **Name status.** *S-Eidos* is the recommended name (`research/originality-and-license-review.md` §3). It is
> provisional until the user confirms at the publication checkpoint; the package, panel id, tool names and file
> paths in this document all follow from it and are cheap to rename before release.

---

## 1. What this is

**S-Eidos is a decision ledger for agent-written front-end code.** It does not teach the platform, and it does not
lint for style. It answers one question per finding: *is this specific code a defensible defect in this project's
target environment, what is the evidence, and what did we decide about it?*

S-Eidos takes its name from the Greek **εἶδος** — *form, shape, kind*, the root of "eidetic" and "idea". A pattern is
a form, and recognising a form is what this tool does; evidence is how it earns the right to say so. The thesis
follows: **age is not the defect, and a shape alone is not a verdict.** Nothing is flagged for being old. A rule fires
only when a cited source, the project's declared support targets, and a detectable code shape agree that the change pays.

### Value proposition (three claims that survive the adjacency subtraction)

1. **Framework-aware, not platform-aware.** Most "AI-generated legacy code" is React, Next.js or TypeScript written
   by an agent that knows the syntax and not the idiom. Rules express defects no web-platform rule table can
   express: effect-driven state, hydration hazards, Server/Client boundary confusion, `'use client'` overuse,
   `@ts-ignore` where `@ts-expect-error` is the self-cleaning form, `any` at an API boundary.
2. **Evidence, dated and reviewable.** Every rule carries a primary-source URL, a `retrieved` date and a `reviewBy`
   date. Every finding carries a classification from a fixed seven-value vocabulary (never `deprecated` without a
   source that says so), a severity, a confidence, a remediation confidence, the support constraint that makes it
   valid, and an explicit false-positive warning. The tool reports its own staleness instead of pretending to be
   timeless.
3. **A safety model for code that already works.** Detect-only by default. Support-target gating so a team pinned to
   an older Baseline does not drown in advice it cannot take. Suppression that records *why* and *until when*, so a
   dismissed finding is a decision with a review date rather than a permanent silent allowance.

### Non-affiliation

S-Eidos is independently developed. It is not affiliated with, endorsed by, or derived from Google, Chrome, MDN, or
the maintainers of `modern-web-guidance`. It bundles no third-party guide text, rule implementation, or branding.

---

## 2. Supported host environments

| Environment | Support | Evidence |
|---|---|---|
| DeepSeek Harness (Web/Desktop), profile `desktop` or `web`, DSH `0.2.2-rc.3` | **First-class**: host tool + skill + left-sidebar panel | `research/environment-inventory.md` §5; installed docs |
| DSH without the Web client (headless/CLI sessions) | **Host half only**: tool + skill register; the panel is a client half and is simply absent | `dsh.client` only composes when the web stack is present |
| OpenCode-style agent environments | **CLI only**: `node bin/s-eidos.mjs …` driven by any agent that can run a shell command, plus the shipped `SKILL.md` as plain markdown | The engine is a plain ESM CLI with no host imports |
| Plain CI / human terminal | **CLI only** | same |

**Node support:** the engine targets **Node ≥ 22** and is exercised on the host's **Node 24.21.0** and on
`PATH` Node 26. No API newer than Node 22 is used (`node:test`, `node:util.parseArgs`, `node:fs/promises`).

---

## 3. Rule taxonomy

### 3.1 Domain prefixes (stable rule IDs)

`<DOMAIN>-<NNN>`, never renumbered once published.

| Prefix | Domain |
|---|---|
| `SEM` | semantics & document structure |
| `ARI` | ARIA, focus, keyboard, dialogs, live regions, motion |
| `FRM` | forms, labels, validation, autocomplete, native controls |
| `IMG` | images and media (dimensions, lazy, codecs, captions, controls) |
| `MET` | metadata, canonical, robots, structured data, SEO rendering |
| `CSS` | cascade, layout, logical properties, container queries, colour, focus styles |
| `REA` | React state, effects, keys, refs, memoisation, hydration, boundaries |
| `NXT` | Next.js routing, Server/Client boundaries, caching, assets, route handlers |
| `TYP` | TypeScript strictness, unsafe types, DOM types, API contracts |
| `BLD` | build/bundle/env/testing/CI hygiene |
| `AIA` | AI-generation provenance signals (probabilistic, never a verdict) |

### 3.2 Classification (exactly one per rule, required)

`deprecated` · `obsolete` · `legacy` · `situational` · `unsupported` · `insecure` · `inaccessible`

Definition discipline:

| Value | Meaning | Evidence rule |
|---|---|---|
| `deprecated` | officially discouraged or scheduled for removal | **only** with a cited source that uses "deprecated"/"removed" |
| `obsolete` | no longer suitable in most modern contexts, not formally deprecated | source supports the unsuitability |
| `legacy` | older but potentially valid | source documents a newer equivalent |
| `situational` | appropriate under stated constraints | the rule states the constraints |
| `unsupported` | unavailable in the target browser/runtime | compatibility evidence |
| `insecure` | unsafe regardless of age | security source |
| `inaccessible` | inaccessible regardless of age | accessibility source |

### 3.3 Impact axis (independent of classification)

`security` · `accessibility` · `performance` · `maintainability` · `correctness` · `compatibility` · `privacy`

This is where "inefficient", "overengineered" and "framework-misaligned" live, because they are *reasons a change
pays*, not kinds of temporality. A rule may carry several impacts. (`research/decision-log.md` D-006.)

### 3.4 Detectability tiers

| Tier | Meaning | Shippable |
|---|---|---|
| `a` | reliable lexical match, a bounded pattern over one line or one small block | yes |
| `b` | bounded structural heuristic (needs the surrounding few lines, the file's imports, or a sibling config) | yes, with a documented false-positive class |
| `c` | needs data-flow, taint tracking, or a real AST | **no** — listed and excluded |

Tier is part of the rule record, is printed in reports, and the engine refuses to run a tier-`c` detector even if one
is registered.

---

## 4. Evidence and provenance data model

### 4.1 Rule record (`rules/catalog.json`, one object per rule)

| Field | Type | Req | Purpose |
|---|---|---|---|
| `id` | string `<DOMAIN>-<NNN>` | ✓ | stable identity |
| `title` | string ≤ 72 chars | ✓ | one-line finding title |
| `classification` | enum (7) | ✓ | §3.2 |
| `impact` | array of impact enum, ≥1 | ✓ | §3.3 |
| `severity` | enum `critical\|high\|medium\|low\|info` | ✓ | harm if unaddressed |
| `confidence` | enum `high\|medium\|low` | ✓ | confidence that a *match is a real defect* |
| `remediationConfidence` | enum `high\|medium\|low` | ✓ | confidence that the recommended change is correct |
| `tier` | `a\|b\|c` | ✓ | §3.4 |
| `detector` | string | ✓ | name of the code detector in `src/engine/detectors` |
| `detectorParams` | object | ✓ (may be `{}`) | declarative parameters, validated |
| `appliesTo` | object `{ languages[], frameworks[], fileKinds[] }` | ✓ | gates execution |
| `supportGate` | object \| null `{ feature, requires }` | ✓ | §5; `null` = always applicable |
| `evidence` | `{ url, title, authority, retrieved, reviewBy }` | ✓ | §4.2 |
| `standards` | array \| absent `{ framework, id }` | — | e.g. `{framework:'WCAG 2.2', id:'1.4.4'}`; a *reference*, never a conformance claim |
| `why` | string ≤ 320 chars | ✓ | why it matters, one precise sentence |
| `detectionHint` | string | ✓ | what a human looks for |
| `falsePositives` | array of strings, ≥1 | ✓ | when **not** to flag; printed with every finding |
| `migration` | `{ before, after, notes? }` | ✓ | minimal, original example |
| `autofix` | enum `none\|safe\|situational` | ✓ | §7 |
| `suppressible` | boolean | ✓ | some security findings may not be suppressible without an expiry |

### 4.2 Evidence sub-record

`{ url, title, authority, retrieved, reviewBy }` where `retrieved` and `reviewBy` are ISO dates.
`reviewBy` defaults to `retrieved + 12 months` (configurable per rule). A rule whose `reviewBy` is in the past is
**stale**: the engine still reports the finding but appends a `staleRule` warning and the CLI prints a staleness line.
Staleness is a first-class output, not a hidden property.

### 4.3 Catalog envelope

```json
{
  "catalogVersion": "0.1.0",
  "asOf": "2026-11-16",
  "schemaVersion": 1,
  "classificationValues": [...],
  "impactValues": [...],
  "supportPresets": {...},
  "features": {...},
  "rules": [ ... ]
}
```

The catalog is the **single source of truth**. The panel, the CLI, the host tool and `docs/rules/*.md` are all
*generated from or validated against* it (`docs/rules/` is generated; CI fails if it drifts).

---

## 5. Browser / runtime target model

A finding may only fire when the project's declared target makes it *valid*. Targets are declared, never inferred
from the machine.

### 5.1 Presets (resolvable offline)

| Preset | Meaning |
|---|---|
| `baseline-widely-available` | **default**; the project may rely on Baseline "widely available" features |
| `baseline-newly-available` | newly available features are acceptable |
| `modern-2026` | current-year Baseline snapshot |
| `safari-16-plus`, `safari-18-plus` | conservative Apple floor |
| `last-2-versions` | evergreen minus two |
| `evergreen-desktop` | Chromium/Firefox/WebKit current |
| `enterprise-chromium-lts` | a pinned older Chromium |

Each preset resolves, offline, to a small capability table shipped in the catalog (`features`: feature id →
minimum preset rank). No network, no caniuse fetch, no Browserslist database dependency.

### 5.2 Gating semantics

For a rule with `supportGate = { feature, requires }`:

| Project target vs `requires` | Effect |
|---|---|
| target satisfies `requires` | rule applicable normally |
| target is older | finding **demoted** to `situational` and annotated *"the modern alternative is unavailable in your declared target"*, unless the rule is `insecure`/`inaccessible`, which are **never** demoted |
| feature unknown to the catalog | `supportGate` result is `unknown`; the finding is emitted with a visible `unknownSupport` caveat rather than silently dropped |

This is the mechanism that makes "never flag merely for being old" enforceable in code rather than in a README.

---

## 6. Confidence model (and what it is not)

- `severity` — harm if the finding is real and unaddressed. Ordered.
- `confidence` — probability the **match is a real defect** given the detector's false-positive class.
- `remediationConfidence` — probability the **suggested change is correct in context**.

The three are declared per rule and are *not* multiplied into a single score in v0.1 (no pseudo-precision). Reports
sort by `severity`, then `confidence`, then `ruleId` for determinism. The README states plainly that these are
authored judgements, not measured calibration, which is why the false-positive note is mandatory and printed.

---

## 7. Safety model: detect-only, and the codemod contract for later

### 7.1 v0.1 writes nothing to user code

The engine has **no write path into scanned files**. Its only writes are:
`.s-eidos/decisions.json` (opt-in suppression records, CLI-only) and stdout/a report file the user names explicitly.

### 7.2 The contract any future codemod must satisfy (implemented as a refusal table now)

1. Detect-only unless an explicit apply flag is present; `--dry-run` is the default even then.
2. Before writing: print the diff, list the files, require a clean Git worktree or an explicit `--force-clean-tree`
   acknowledgement, and write a recoverable journal/backup **before the first byte**.
3. Refuse to modify when: the file has a parse error, is generated or vendored, is a lockfile, is minified, is
   outside the declared scope, or the rule is not `autofix: safe`.
4. Refuse per-rule when intent is ambiguous. Canonical example: `innerHTML → textContent` is **wrong** when the
   string is intentional markup; that rule is `autofix: none` forever.
5. After applying: run the project's formatter, lint, typecheck, focused tests and build when those commands exist;
   record each as `passed | failed | unavailable`, never as "pass" by omission.
6. Never leave a half-written file: write to a temp file in the same directory and rename.

v0.1 ships this table, the `autofix` metadata, and **zero apply capability**. `docs/rules/` documents, per rule,
whether a future autofix would be `safe` or `situational`.

### 7.3 Suppression with reason capture

`.s-eidos/decisions.json`:

```json
{ "schemaVersion": 1, "decisions": [
  { "ruleId": "REA-003", "scope": { "kind": "path", "path": "src/legacy/**" },
    "decision": "accepted", "reason": "third-party widget we do not own",
    "recordedAt": "2026-11-16", "reviewBy": "2027-05-16", "status": "active" }
] }
```

- `reason` is **required** (≥ 8 chars) — a suppression without a reason is refused.
- `reviewBy` is **required**; expired decisions are reported as `expired` in the audit and counted, so they cannot
  silently accumulate.
- Suppressed findings are **not deleted** from the report: they are marked `suppressed` and counted separately, so the
  numbers stay honest.
- `s-eidos decisions list|add|prune` is the only writer. The tool never writes decisions; the agent may propose one
  in prose.

### 7.4 Rollback

- No code writes ⇒ nothing to roll back in v0.1.
- `decisions.json` is append-oriented; `prune` removes only expired entries and prints what it removed.
- If the plugin fails to load, DSH isolates the fiber; the tool and panel simply do not appear, and the CLI still works.

---

## 8. Report formats

| Format | Audience | Notes |
|---|---|---|
| Terminal text (default) | human | grouped by severity, one block per finding, with evidence line, false-positive line, and a staleness/footer summary. Colour only through the `--color=auto\|always\|never` flag; never assume a TTY. |
| JSON (`--format json`) | machine, CI, other agents | the report object in §8.1; **the primary contract**. Deterministic ordering; `--stamp` adds `generatedAt` (omitted by default so fixtures are stable). |
| Markdown (`--format md`) | PR comments, issue bodies | bounded table + details; used by the skill. |
| **SARIF** | — | **Not in v0.1.** Upstream has publicly claimed CI integration next; shipping it as the headline would be second-place marketing. The JSON schema is designed so a SARIF exporter is a pure adapter, deferred to v0.2. |

### 8.1 Report object

```json
{
  "schemaVersion": 1,
  "tool": { "name": "s-eidos", "version": "0.1.0" },
  "catalog": { "version": "0.1.0", "asOf": "2026-11-16", "staleRules": ["REA-003"] },
  "targets": { "preset": "baseline-widely-available", "resolvedFrom": "cli" },
  "scope": { "root": ".", "filesRead": 128, "filesSkipped": [ { "path": "dist/app.min.js", "reason": "minified" } ],
             "truncated": false },
  "summary": { "findings": 12, "suppressed": 2, "expiredDecisions": 1,
               "bySeverity": { "high": 3, "medium": 7, "low": 2 },
               "byClassification": { "obsolete": 4, "inaccessible": 3, "situational": 5 } },
  "findings": [ {
    "id": "REA-002:src/App.tsx:41",
    "ruleId": "REA-002", "title": "State derived in an effect",
    "classification": "obsolete", "impact": ["correctness", "performance"],
    "severity": "medium", "confidence": "high", "remediationConfidence": "high",
    "tier": "b",
    "file": "src/App.tsx", "line": 41, "endLine": 44, "occurrences": 2,
    "excerpt": "useEffect(() => { setFull(a + b) }, [a, b])",
    "supportGate": null, "unknownSupport": false,
    "evidence": { "url": "https://react.dev/...", "title": "...", "authority": "react.dev",
                  "retrieved": "2026-11-16", "reviewBy": "2027-11-16" },
    "standards": [], "falsePositives": ["..."], "migration": { "before": "...", "after": "..." },
    "autofix": "none", "suppressed": false, "decisionId": null
  } ]
}
```

**Determinism:** identical input + catalog ⇒ byte-identical JSON without `--stamp`. This is a test.

---

## 9. Private-by-default posture

- **Zero network calls** in engine, host tool and panel. Enforced by a test that stubs `fetch`/`http`/`https`/`dns`
  and fails the run if anything is touched, plus a CI job run with no network.
- **No telemetry, no analytics, no counters.** None of the "usage insights" surface the adjacent project ships.
- **Redaction**: excerpts are single-line, ≤ 120 characters, comments stripped by default, and any string that looks
  like a secret (assignment to `key|token|secret|password|apiKey` with a plausible literal) is replaced with
  `[redacted]` before it can reach a report or a model. The scanner never echoes a full file, an absolute path
  containing a user name, or an environment value.
- **No execution of repository code**: no `require` of repo files, no config `extends` resolution, no `npx`, no
  `git` subprocess.
- The panel transmits nothing anywhere; it has no network path at all.

---

## 10. DSH integration

### 10.1 Bundle manifest

```json
{
  "name": "s-eidos",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./index.js", "./client": "./client.js",
               "./locale/*.json": "./locale/*.json", "./icon": "./icon.svg" },
  "files": ["index.js", "client.js", "src", "rules", "locale", "cordis.patch.yml",
            "docs", "icon.svg", "README.md", "LICENSE", "NOTICE.md", "skills"],
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": { "platform": "web", "immediately": true,
                "inject": ["@deepseek-ai/dsh-client-ui-sidebar", "@deepseek-ai/dsh-client-ui-layout"] }
  }
}
```

`cordis.patch.yml`: `- insert: [ { id: s-eidos, name: s-eidos, config: {} } ]`.

### 10.2 Host half (`index.js`)

Verified recipe (from a working third-party bundle in this host, cross-checked against the installed docs):

```js
export const name = 's-eidos'
export const inject = ['tools', 'skills']          // optional services; inactive without them
export function apply(ctx, config = {}) {
  ctx.effect(() => ctx.tools.register(toolSpec), 's-eidos tool')
  ctx.effect(() => ctx.skills.register(skillSpec), 's-eidos skill')
}
```

- Tool `s_eidos_audit`: parameters `{ paths?: string[1..16], targets?: preset, rules?: id[], severityAtLeast?, format? }`.
  Explicit paths only (no default `.`) — the same refusal the adjacent project learned to make, and it keeps a model
  from walking a whole disk by accident. Returns the §8.1 object; `output.render` returns bounded text (top findings +
  a *"N more"* line + the staleness/skip caveats).
- Skill `s-eidos-audit`: markdown shipped in `skills/`, registered with
  `{ name, description, content, source: 'bundled', path, invocation: { modelInvocable: true, userInvocable: true } }`.
- `Config`: `{ targets?: preset, maxFiles?: number, disabledRules?: string[] }` — validated at activation.

### 10.3 Client half (the left sidebar entry)

Two registrations with one shared id constant (`PANEL_ID = 's-eidos'`):

```js
ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID, locale: NS }, EvidenceWorkbench))
ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
  { name: 'sidebar.panellist', id: PANEL_ID, order: 0, label: () => t('panel'), locale: NS }, S-EidosIcon))
```

The panel is a **static evidence workbench** over the bundled catalog: filter by rule id/title, by classification and
by severity; open a rule to read classification, impact, severity/confidence/remediation, the *why*, the detection
hint, the false-positive warning, the support gate, the migration before/after, and the cited evidence with
`retrieved`/`reviewBy` — plus the staleness of any expired rule. Copy buttons for the CLI command and the tool call.

**No IPC, no writes, no network.** Rationale (`research/decision-log.md` D-005): the adjacent project already owns
the "live counters over IPC" panel; one client file only means no extra JS modules; and a static panel cannot break
the host. The panel states its own limitation in one caption.

**Hard constraints honoured:** no Harness Client package is imported; only `react` from the host module table; all
colours come from `--dsw-alias-*` tokens (`bg-base`, `bg-layer-1/2`, `border-l1/l2`, `label-primary/secondary`,
`brand-primary`, `state-{error,warn,success,idle}-primary`); no `document.body` access; no iframe; no global listeners
outside `apply`'s effect scope.

### 10.4 Build: one `client.js` from source + catalog

`scripts/build-client.mjs` (zero deps) reads `rules/catalog.json` and `src/client/panel.js`, injects the catalog as a
JSON literal, and wraps the result in the combo-script envelope
`window.__ModuleLoader__.load({ id: 's-eidos', factory(require) { … } })`. The generated `client.js` is committed.
`npm run build:check` regenerates in memory and fails if the committed file differs — so the artifact cannot drift.

---

## 11. Research gate

Implementation may begin only when all of the following are true, and they are:

| Gate | Evidence |
|---|---|
| Upstream inventory complete enough to substantiate the gap matrix | `research/upstream-capability-inventory.md` + the 339-line agent inventory, both inspecting PUB **and** SRC trees |
| Every proposed feature has a cited rationale | `research/gap-matrix.md` §1, one row per capability |
| Clear non-duplicative value proposition | `research/gap-matrix.md` §2 (adjacency check against the DSH port) |
| Manifest/integration format grounded in inspected environment evidence | `research/environment-inventory.md` §5–6; two shipped call sites; one working third-party bundle |
| Architecture has a compatibility and safety policy | this document §5, §6, §7, §9 |
| Licence and attribution approach documented | `research/originality-and-license-review.md`, `research/decision-log.md` D-009 |

---

## 12. Versioning and rollback

| Surface | Version | Compatibility policy |
|---|---|---|
| Package / plugin | semver, `0.1.0` | breaking panel/tool contract ⇒ major (or `0.x` minor before 1.0) |
| Catalog | `catalogVersion` + `asOf` | rule IDs are permanent; a retired rule keeps its id and gains `retired: true` with the reason and date |
| Report | `schemaVersion` | additive-only within a major |
| Decisions file | `schemaVersion` | additive-only; an older file is upgraded on read, never silently rewritten |

**Failure behaviour:** a malformed catalog is a load-time failure with a precise message (file + rule id), never a
half-working tool. In DSH the fiber fails and the tool/panel are absent while the CLI still works. The engine never
throws away a partially produced report: it prints what it has plus the reason it stopped.

---

## 13. What v0.1 deliberately does not do

| Not done | Reason | v0.2 trigger |
|---|---|---|
| Apply any codemod | §7.1; the backup/diff/verify apparatus is a release of its own | a `safe`-tier rule with fixture proof and the full apparatus |
| Live findings in the panel (IPC) | one client file, highest breakage risk, adjacent project already owns a live panel | a tested remote end |
| SARIF / CI gate | occupied by upstream's roadmap; not the differentiator | after JSON proves stable |
| AST / data-flow rules (tier `c`) | needs a parser dependency ⇒ violates D-002 | an optional plugin pack |
| Guide corpus or search | occupied twice over | never |
| Slash commands | the tool covers the agent path; commands are UI surface we cannot verify without more risk | when the panel gains actions |
| Whole-repo trend / debt score | needs history storage; a guess | after decisions file has real use |
| Localisation beyond English | host needs `locale/en.json` only; a bad translation is worse than none | community PRs |

---

## 14. Threat model for *this* design

The generic threat model lives in `research/agents/quality-security-auditor/threat-model.md`. The design-specific
risks:

| Threat | Path | Mitigation | Residual |
|---|---|---|---|
| Scanner hangs a pipeline (ReDoS, huge file, symlink cycle) | hostile repo content | bounded patterns only (no nested quantifiers), 1 MB/file, file and finding caps, `realpath` containment, cycle-detected walk, per-file deadline check | a pathological *many-small-files* repo costs time; the cap bounds it and is reported |
| Secret leakage through a report | excerpt includes a token | redaction at construction time, comments stripped, ≤120-char single line, tests assert known-format secrets never appear | a novel secret format could pass; the excerpt is one line |
| Wrong advice accepted at scale | confident false positive | mandatory `falsePositives` printed with every finding; tier gating; support gating; `remediationConfidence` separate from `confidence` | inherent to static analysis; stated in README |
| Panel breaks the host UI | a throwing component blanks the slot | panel renders only from a validated, build-time-frozen catalog; no I/O in the component; no Harness imports | a bad catalog would fail the build, not the host |
| Supply-chain | dev dependency compromise | zero runtime dependencies; dev deps pinned; `--ignore-scripts`; CI runs with no secrets | dev-only surface |
| Report used as a conformance claim | "WCAG compliant" misuse | `standards` are references, never verdicts; README and report disclaimer forbid conformance claims | user misinterpretation |
| Plugin writes into a user's repo | decisions file | only `.s-eidos/decisions.json`, CLI-only, append-oriented, printed before write | a user could commit it accidentally; documented |
