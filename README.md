# S-Eidos

**Evidence-backed front-end pattern review for coding agents.**

S-Eidos is a [DeepSeek Harness](https://github.com/deepseek-ai) plugin — and a plain
command-line tool for any agent environment — that reviews front-end code that already exists and
reports the places where it is risky, inaccessible, obsolete, or a poor fit for the framework it is
written in. Every finding arrives with the evidence behind it: a classification, a severity, a
confidence, the support constraint under which the advice is valid, the conditions under which it
must **not** be flagged, a minimal migration, and a primary-source URL with the date it was
retrieved.

**S-Eidos** takes its name from the Greek **εἶδος** — *form, shape, kind*: the shape a thing has, and
the root of "eidetic" and "idea". A pattern is a form, and recognising a form is exactly what this
tool does; the *evidence* is how it earns the right to say so. The rest follows from that: **age is
not a defect, and a shape alone is not a verdict.** Nothing is flagged for being old. A finding fires
only when a cited source, the project's declared support target, and a detectable code shape agree
that a change would pay.

S-Eidos is independently developed. It is **not** affiliated with, endorsed by, or derived from
Google, Chrome, MDN, or the maintainers of any other project named in this repository. See
[NOTICE.md](NOTICE.md).

---

## What you get

| Surface | What it does |
|---|---|
| **Left sidebar entry** | Adds **S-Eidos** to the DeepSeek Harness left sidebar. It opens a workbench over the bundled rule catalog: filter by rule, classification or severity, and read each rule's reasoning — classification, impact, severity, confidence, support gate, false-positive warning, migration and dated citation. |
| **Agent tool** `s_eidos_audit` | Reviews explicitly named paths and returns findings as a structured value or a readable digest. Detect-only. |
| **Skill** `s-eidos-audit` | Teaches the agent when to call the tool, how to read a finding, and what the review will not do. |
| **CLI** `s-eidos` | The same engine from any terminal or agent that can run a shell command: `audit`, `rules`, `explain`, `decisions`. |

Nothing is uploaded. There is no telemetry, no analytics, no network call, and no write to the code
being reviewed.

## Quick start

### In DeepSeek Harness

The bundle needs no build step and no dependencies.

```shell
# From a local checkout, using the DSH CLI:
dsh plugin --profile desktop add file:/absolute/path/to/s-eidos
```

Or, from a DSH session, install the package directory with `plugin_manager`
(`action: "install_bundle"`, `target: "<absolute package directory>"`). One plugin row named
`s-eidos` is inserted; the tool and skill appear in the next session, and the sidebar entry appears
in the Web client.

Ask the agent for a review:

```text
Review src/ with s-eidos and tell me which findings you would actually act on.
```

### From the command line

```shell
node bin/s-eidos.mjs audit src/                      # readable report
node bin/s-eidos.mjs audit src/ --format json        # the machine-readable report
node bin/s-eidos.mjs audit src/ --fail-on high       # exit 1 when a high or worse finding exists
node bin/s-eidos.mjs audit src/ --targets safari-16-plus
node bin/s-eidos.mjs rules                           # the catalog
node bin/s-eidos.mjs explain MET-001                 # one rule in full
```

`audit` requires at least one explicit path. S-Eidos never walks the working directory on its own
— an unexpected whole-repository walk is worse than an error.

Exit codes: `0` completed, `1` a `--fail-on` gate was breached (or a runtime failure), `2` usage
error.

## How a finding reads

```text
CRITICAL MET-001 viewport blocks pinch zoom
  src/index.html:5
  excerpt: <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  classification: inaccessible · impact accessibility
  confidence: finding high · remediation high
  why: Blocking zoom removes the only way a low-vision user can enlarge text on a phone, and no content benefits from it.
  do not flag when: A maximum-scale value of 5 or greater ... | The pattern appears in a template that is never served ...
  evidence: https://developer.mozilla.org/.../Viewport_meta_element (MDN Web Docs, retrieved 2026-11-16, review by 2027-11-16)
  migration: <meta name="viewport" content="...maximum-scale=1, user-scalable=no"> → <meta name="viewport" content="width=device-width, initial-scale=1">
  autofix: safe
```

Three things to notice:

1. **`do not flag when` is not optional.** Every rule ships with at least one false-positive
   condition, and every report prints it next to the finding. A finding you are meant to dismiss
   says so.
2. **`evidence` carries two dates.** `retrieved` is when the source was read; `review by` is when it
   must be read again. A rule past its review date is reported as **stale** rather than presented as
   current.
3. **`autofix` describes a policy that this version does not execute.** See *Safety model* below.

## The classification vocabulary

Every rule carries exactly one classification. The word `deprecated` is reserved: a rule may only
claim it when a cited source says "deprecated" or "removed".

| Classification | Meaning |
|---|---|
| `deprecated` | officially discouraged or scheduled for removal — **only with a source that says so** |
| `obsolete` | no longer suitable in most modern contexts, not formally deprecated |
| `legacy` | older but potentially valid |
| `situational` | appropriate under stated constraints |
| `unsupported` | unavailable in the target browser or runtime |
| `insecure` | unsafe regardless of age |
| `inaccessible` | inaccessible regardless of age |

An independent **impact** axis says *why* a change would pay: `security`, `accessibility`,
`performance`, `maintainability`, `correctness`, `compatibility`, `privacy`. "Inefficient",
"overengineered" and "framework-misaligned" live here, because they are reasons a change pays rather
than kinds of temporality.

## Support targets, and why "old" is not a finding

The brief for every review includes a support policy. When a rule's modern alternative is
unavailable at that target, the finding is **demoted to `situational`** and says so, instead of being
presented as a defect. `insecure` and `inaccessible` findings are never demoted: a target that cannot
run the fix is not a reason to keep shipping the defect.

| Preset | Meaning |
|---|---|
| `baseline-widely-available` | **default** — Baseline "widely available" features are fair game |
| `baseline-newly-available` | newly available features are acceptable |
| `modern-2026` | current Baseline snapshot |
| `safari-16-plus`, `safari-18-plus` | conservative Apple floor |
| `last-2-versions` | evergreen minus two |
| `evergreen-desktop` | current Chromium, Firefox and WebKit |
| `enterprise-chromium-lts` | a pinned older Chromium |

Presets resolve **offline** from a capability table shipped inside the catalog. No network, no
caniuse download, no browser-database dependency.

## Safety model

**Detect-only.** This version has no apply path. It never edits, formats or deletes the code it
reviews. Its only write is an opt-in decision record, and only when a person runs
`s-eidos decisions add --yes`.

The contract any future codemod must satisfy is written down and tested now, so that the absence of
one is a design decision rather than an oversight:

- detect-only by default, `--dry-run` by default even when an apply flag exists;
- a diff preview, a clean worktree or explicit acknowledgement, and a recoverable journal written
  before the first byte;
- **refusal** when the file has a parse error, is generated or vendored, is a lockfile, is minified,
  is outside the declared scope, or when the rule's intent is ambiguous — the canonical example being
  `innerHTML → textContent`, which silently deletes rendered content and is therefore never
  `autofix: safe`;
- formatter, lint, typecheck, focused tests and build run afterwards, each recorded as
  `passed`/`failed`/**`unavailable`** — never "pass" by omission.

### Decisions, not deletions

A dismissed finding is a decision. S-Eidos records it in `.s-eidos/decisions.json` with a reason
and a review date:

```shell
node bin/s-eidos.mjs decisions add --rule REA-001 --path src/legacy \
  --reason "third-party widget we do not own" --review-by 2027-05-16 --yes
```

A suppressed finding **stays in the report**, marked `suppressed` and counted separately, so the
numbers stay honest. A decision past its `reviewBy` is reported as expired, so it cannot quietly
become permanent policy.

## Privacy

- **No network calls.** Enforced by a test that fails the suite if the engine touches `fetch`,
  `http`, `https` or `dns`.
- **No telemetry.** There are no counters of any kind.
- **No execution of repository code.** No `require` of repository files, no config inheritance, no
  `npx`, no `git` subprocess.
- **Redaction at construction.** Excerpts are one line, bounded, comments stripped, and
  credential-shaped values replaced before they can reach a report, a log or a model's context.
- **Bounded work.** Files, bytes, findings and per-file hits are capped, generated and minified files
  are skipped, symlinks that leave the scan root are not followed, and every skip is reported with a
  reason.

## Installing without network, and without dependencies

The package has **zero runtime dependencies** and no build step. `client.js` is a generated artifact
committed to the repository; `npm run build:check` fails if it drifts from its sources, so the bundle
cannot silently fall out of date.

## Limitations, stated plainly

- **This release ships 7 implemented rules.** Research reviewed 37 candidates with citations
  (`research/legacy-pattern-catalog.md`); each shipped rule has a detector, a positive fixture, a
  negative fixture and an end-to-end test, and the other 30 are the reviewed backlog rather than
  quietly missing.
- **Static analysis is not a verdict.** A finding is a lead with evidence attached. The tool does not
  prove code correct, safe, accessible or fast.
- **No conformance claims.** `standards` entries are references (for example a WCAG success
  criterion), never a conformance statement. S-Eidos does not certify anything.
- **No field measurement.** It cannot measure LCP, INP or CLS; it detects *causes* and *potential*
  barriers.
- **No data-flow analysis in this version.** Rules that would need taint tracking are catalogued as
  deferred rather than shipped with guesses.
- **Heuristic detection.** Tier `b` rules reason about a few surrounding lines, not a full parse
  tree. Their false-positive conditions are listed for exactly that reason.
- **English only.** The catalog and the panel ship in English.
- **The panel is a static reader.** It reads the bundled catalog; it does not scan your workspace and
  cannot show live results. Ask the agent to call the tool, or run the CLI.
- **Authored, not calibrated.** Severity and confidence are documented judgements, not measured
  precision. That is why the false-positive note is mandatory and printed.

## Provenance model

Every rule records `evidence.url`, `evidence.authority`, `evidence.retrieved` and `evidence.reviewBy`.
`research/source-register.md` is the master citation list; a link checker verifies it. The review and
retirement process is in [docs/knowledge-update-process.md](docs/knowledge-update-process.md).

## Repository layout

```text
rules/catalog.json          the single source of truth: every rule and its evidence
rules/schema.mjs            hand-written catalog validator (no dependency)
src/engine/                 the host-agnostic analyzer: walk, classify, targets, detect, scan, report
src/cli/main.mjs            the CLI, injectable so it is testable without spawning
src/client/                 the left-sidebar panel's source; client.js is generated from it
index.js                    the DSH host half: the agent tool and the skill
bin/s-eidos.mjs           the launcher
skills/s-eidos-audit/     the agent-facing workflow skill
test/                       fixtures and suites (node --test)
research/                   dated evidence artifacts that justify every rule
docs/                       architecture, rule reference, processes, design
```

## Development

```shell
npm test              # node --test, no dependencies required
npm run build         # regenerate client.js from src/client and the catalog
npm run build:check   # fail if client.js drifts
npm run verify        # every local check in one command
```

## License

MIT. See [LICENSE](LICENSE). Third-party content is neither bundled nor adapted; see [NOTICE.md](NOTICE.md).
