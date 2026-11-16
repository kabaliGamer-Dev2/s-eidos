# Gap matrix — upstream vs proposed, item by item

- **Retrieved:** 2026-11-16
- **Rule:** no gap is claimed without an inspection that could have found the capability. Evidence lives in
  `research/upstream-capability-inventory.md` (upstream), `research/adjacent-projects.md` (the DSH port and the brief's
  stale assumptions), and `research/agents/*` (specialist detail).
- **Two competitors exist, not one.** `GoogleChrome/modern-web-guidance` (guides + CLI) and
  `metapeka/dsh-modern-web-guidance` (that corpus, in this exact host, plus a 33-rule regex scanner and a left-rail
  panel). "Upstream" below means the Google project; the DSH port is checked separately in §2.

Gap types: `absent` (nobody covers it) · `partial` (covered inadequately) · `different-unit` (same area, different
reasoning artifact) · `occupied` (do not build) .

---

## 1. Primary gap matrix

| Topic/capability | Upstream coverage and evidence | Proposed project coverage | Gap type | Why original/non-duplicative | Priority | Decision |
|---|---|---|---|---|---|---|
| Front-end **guide corpus** | 210 guides / 17 categories (`skills/…/guides/`), CC-BY-4.0 prose, no frontmatter or dates | none | occupied | Copying it would be a licence event and a rebrand | — | **Rejected** |
| **Guide search / retrieve / list** tools | CLI `search`/`list`/`retrieve` with offline embeddings + BM25; the DSH port re-implements all three plus a panel | none | occupied | Already solved twice; a third index adds no new value | — | **Rejected** |
| **Web-platform regex rule table** (`document.write`, `:host-context`, prefixed box) | 38 upstream rule modules; the DSH port ships **33 rules, 30 inherited from upstream**, as a dependency-free regex pass | not duplicated; web-platform rules enter only where a *framework-aware* rule subsumes them | occupied | Duplicating a table we can neither calibrate nor out-cover | — | **Rejected** |
| **Usage-counters dashboard** in a sidebar panel | the DSH port's "Guidance Insights" panel: calls/day, hit rate, per-tool breakdown, dead guides | none | occupied | Their panel answers "is the catalog used"; ours must answer a different question | — | **Rejected** |
| **SARIF / CI fail-on-findings** as the headline | Upstream: none — `sarif` 0 matches, exit 0 with findings, docs say CI "in development" | machine-readable JSON as the primary contract; SARIF **not** shipped in v0.1 | partly occupied | Upstream has publicly claimed CI next; being second on the marquee feature is worthless | Low | **Deferred** (v0.2, as an export format, never the pitch) |
| **Chrome-extension (MV3) guidance skill** | Upstream ships it; the DSH port bundles it unchanged | none | occupied | Not our problem domain | — | **Rejected** |
| **Framework-idiom detection** (React/Next/TypeScript anti-patterns) | Absent. All 48 rule modules are platform-named; frameworks are parsed, not understood; SRC #3558 fixes the charter to `web-feature-ids` + browser-observable evals | First-class: React effect/state/hydration hazards, Next.js Server/Client boundaries and hydration mismatch, TS `any`/`@ts-ignore`/unsafe assertions | **absent** | Upstream **cannot** adopt it without abandoning its charter; the DSH port inherits the same rule table | **High** | **Ship** |
| **Per-finding severity + confidence + remediation confidence** | Absent. `AnalyzerFinding`/`AnalyzeJsonOutput` have no severity/priority/confidence field; findings are flat and count-only, self-labelled "provisional" | Every finding carries severity, confidence and remediation-confidence with a published model | **absent** | Turns a list into a triage queue; upstream deliberately refuses to rank | **High** | **Ship** |
| **Per-claim provenance: `evidence URL` + `retrieved` + `reviewBy`** | Absent from the distributed artifact. Guides carry no dates; `GuideTriage.provenance` exists only in SRC; CLI JSON has no `evaluatedAt` | Every rule carries URL, retrieval date, and a review-by date that the tool reports as stale | **absent** | Makes guidance reviewable rather than eternal; an explicit staleness surface | **High** | **Ship** |
| **Support-target gating of findings** | Present but **unwired**: `.mwgrc.baseline` exists, yet `src/analyzing/cli.ts` imports no `mwgrc` and JSON has no baseline field | Findings gated by a declared support policy; a rule that only applies above the target is demoted, not emitted | **partial** (config without effect) | The difference between "usable" and "ignored" for a team pinned to older targets | **High** | **Ship** |
| **Seven-value classification discipline** (`deprecated` only when a source says so) | No classification vocabulary at all; rules are boolean matches | Fixed vocabulary + an impact axis; a rule cannot claim `deprecated` without a cited source | **absent** | Upstream's corpus has no such field; this is the epistemic layer | **High** | **Ship** |
| **Suppression with reason + expiry + audit trail** | Absent. No ignore file, no inline disable, no accepted-findings store; SKILL.md instead tells the agent to re-judge false positives every run | Decision records: suppress with a reason, a review-by date, and a durable local file that reports expired entries | **absent** | Adoption is impossible without an escape hatch that is itself auditable | **High** | **Ship** |
| **Guarded codemod** (dry-run default, refusal conditions, backup, post-change verification) | Absent. `legacy-scan` has no `--fix`; `parseArgs strict:true` would reject it; no codemod path in either tree | v0.1 ships **detect-only**; a single `safe`-tier codemod is considered only behind an explicit apply flag | **absent** | Rewriting working code is the highest-harm operation in this space; shipping it unguarded is worse than not shipping it | Medium | **Defer apply to v0.2; ship the refusal contract in v0.1** |
| **AI-generation provenance *signals*** (placeholder residue, cargo-cult wrapper, invented API, missing error state, fake accessibility) | Absent. 0 matches for `slop\|ai-generated\|provenance\|vibe` across both trees; `built-in-ai/` is browser AI APIs | A small, explicitly probabilistic signal family, never a verdict on authorship | **absent** | The one framing nobody owns; must be quiet about it to stay honest | Medium | **Partial ship** (2–3 signals, labelled `situational`/`obsolete`, never "AI-written") |
| **Framework detection confidence** (which framework is this file, and how sure are we?) | Absent. Framework support is extension-based parsing | Explicit adapter contract: evidence, confidence, conflict handling | **absent** | Without it, framework rules misfire on plain files — the top false-positive source | **High** | **Ship** |
| **Taint / data-flow analysis** (unsafe HTML from untrusted input) | `needs-verifier` triage class exists upstream; no data-flow shipped | **Not shipped** | partial | A conservative lexical tool that guesses taint produces exactly the false positives that get a tool uninstalled | — | **Rejected for v0.1** (documented as tier `c`) |
| **Whole-repo trend / debt score** | Absent upstream | Absent in v0.1 | absent | Requires history storage; a guess that will be quoted back | Low | **Defer** |
| **Standard mapping** (WCAG 2.2 SC / OWASP per finding) | Absent | A `standards` field on rules where a source supports it | absent | Pure added value for compliance, low risk if cited | Medium | **Ship (field only, no conformance claims)** |
| **Wire-level tool names / panel identity / command names** | `web_guidance_*`, `/guidance-*`, "Guidance Insights" | Distinct names | — | Confusability is a product defect | — | **Forbidden overlap** |

## 2. Adjacency check against `metapeka/dsh-modern-web-guidance`

| Overlap risk | Their implementation | Our answer |
|---|---|---|
| Bundling a guide corpus | 208 guides, byte-identical to upstream | we ship **no** guide corpus |
| Scanning legacy code | 33 regex rules, 30 upstream, report-only, explicit paths | we ship a **framework-aware, target-gated, evidence-annotated** catalog; overlapping web-platform rules are dropped |
| Left sidebar entry | left-rail icon → "Guidance Insights" central panel | left sidebar entry **required** by the user; ours opens an evidence/decision surface, not a counters dashboard |
| Human commands | `/guidance-scan`, `/guidance-stats`, `/guidance-suppress` | we register **no** slash commands in v0.1; the agent calls a tool, the human uses the panel and the CLI |
| Zero dependencies, no build | yes | same hard constraint, different architecture (see `docs/design.md`) |
| Host↔client channel | panel drives host through commands over `remote` | v0.1 panel is **static knowledge + clipboard**, no IPC and no write path — see `docs/design.md` §4 for why this is a feature, not a limitation |

**Verdict:** the two projects cannot be confused. Theirs answers *"what is the current best practice, and is anyone reading
the catalog?"*; ours answers *"is this specific code a defensible defect in **this** project's target environment, and
what is the evidence and the decision?"*

## 3. Rejected ideas register

| Rejected idea | Why |
|---|---|
| Vendor / rebrand the guide corpus | CC-BY-4.0 + Apache-2.0 dual statement, no NOTICE, no copyright line; and it duplicates two existing products |
| Port upstream's 38 rule modules | Uncalibrated by us; their precision bar (≥80–90%) is measured against *their* verifier, which we do not have |
| Ship an LLM verifier | Needs a model, a key, and network; violates zero-dependency and no-network defaults |
| Ship SARIF as the headline | Occupied by upstream's announced roadmap; not the interesting problem |
| Build a usage-analytics panel | Occupied, and it measures the tool rather than the code |
| Full AST parsing in v0.1 | Requires a parser dependency (ts-morph/TypeScript), contradicting zero-dependency; tier `b` heuristics cover the chosen rules |
| Taint analysis / data-flow | Cannot be done honestly at this budget; would produce the highest-volume false positives |
| Auto-modernising everything a rule matches | Explicitly forbidden by the project's own premise: never replace working code without evidence that the change pays |
