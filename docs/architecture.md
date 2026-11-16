# Architecture

S-Eidos is one engine with four surfaces. The engine is host-agnostic and dependency-free; every
surface is a thin adapter over it. That is why a finding can be reproduced identically from the CLI,
the agent tool and the tests.

```text
                    rules/catalog.json          (single source of truth, versioned, validated)
                            │
                    rules/schema.mjs            (hand-written validator, no dependency)
                            │
   ┌────────────────────────┴─────────────────────────┐
   │                   src/engine                     │
   │  walk → classify → select → detect → gate →      │
   │  collapse → decisions → summarise → report       │
   └───┬───────────────┬────────────────┬─────────────┘
       │               │                │
  src/cli/main.mjs  index.js        scripts/build-client.mjs
       │           (DSH host half)        │
  bin/s-eidos.mjs    tool + skill   client.js  (generated)
                                       │
                                  left sidebar panel
```

## Layers and why they are separate

| Layer | Module | Responsibility | Must never |
|---|---|---|---|
| Catalog validation | `rules/schema.mjs` | enforce every invariant the rest of the system assumes | be bypassed by a caller |
| Discovery | `src/engine/walk.mjs` | turn explicit paths into a bounded, reported file set | follow a symlink out of the root, read a binary, enter a dot-directory |
| Framework adapter | `src/engine/classify.mjs` | decide what kind of file this is, with evidence and confidence | guess silently when evidence conflicts |
| Support gating | `src/engine/targets.mjs` | decide whether a rule's advice is valid for this project's target | demote an `insecure` or `inaccessible` finding |
| Detection | `src/engine/detectors/` | report candidate sites for one rule | decide severity, classification or validity |
| Orchestration | `src/engine/scan.mjs` | compose the pipeline, collapse hits, apply decisions, summarise | write to the scanned tree, call the network, abort on one bad file |
| Rendering | `src/engine/report.mjs` | text / JSON / Markdown from the same value | introduce a fact the JSON lacks |
| Redaction | `src/engine/redact.mjs` | build already-safe excerpts | be applied after a value has left the engine |
| Decisions | `src/engine/decisions.mjs` | read and write the only file the tool ever writes | write without an explicit command |

## The pipeline, step by step

1. **Resolve the support target.** A preset name becomes a rank; the catalog default applies when the
   caller names none.
2. **Collect files.** Explicit paths only. Caps on files, bytes, depth and total volume; skips are
   recorded with a reason (`extension`, `binary`, `generated`, `minified`, `lockfile`, `too-large`,
   `symlink-escape`, `cycle`, `dot-directory`, `truncated`).
3. **Read project facts.** A `package.json` and the presence of an `app/` directory, when they exist.
   Absence is a normal state, not an error.
4. **Classify each file.** Language from the extension; framework from dependencies, imports and
   directives. Conflicting evidence lowers confidence instead of picking a winner.
5. **Select rules.** `appliesTo` gates language, framework and file kind; tier `c` rules never run;
   `--rule` narrows further.
6. **Detect.** Each rule's detector returns candidate sites, bounded per file.
7. **Gate.** A support gate yields `applies`, `demoted` or `unknown`. A demoted finding is reported as
   `situational` with a note; an unknown gate is reported with a visible caveat, never dropped.
8. **Collapse.** Hits of one rule in one file become one finding carrying `line`, `endLine`,
   `lines[]` and `occurrences`, so a twenty-line block is one finding rather than twenty.
9. **Attach decisions.** A matching decision marks the finding `suppressed`; it is counted, never
   deleted.
10. **Summarise and render.** Findings are sorted deterministically; stale rules, expired decisions,
    skipped paths and truncation travel with the counts.

## Determinism

The JSON report contains no timestamp unless `--stamp` is passed. Given the same inputs and catalog,
the output is byte-identical — a property the test suite asserts. This is what makes the report
diffable in a pull request and stable as a fixture.

## The four surfaces

### CLI (`src/cli/main.mjs` + `bin/s-eidos.mjs`)

`main(argv, io)` takes an `io` object and returns an exit code. It never calls `process.exit` and never
writes to a global stream, so the entire CLI is exercised in-process by the tests — including on
machines where spawning a child process is forbidden.

### DSH host half (`index.js`)

`export const inject = ['tools', 'skills']` and `apply(ctx)` register exactly two effects: the
`s_eidos_audit` tool and the `s-eidos-audit` skill. Both registrations go through `ctx.effect`, so
unloading the plugin removes them. The tool resolves the session workspace from
`exec.agent.session.header.cwd`; it never substitutes the plugin process's own directory for a
workspace the host did not report.

The tool returns one canonical JSON value and renders a bounded digest. When the digest is cut, the
cut is stated with the number of omitted lines and a way to get the whole value — a truncated digest
must never read as a complete one.

### DSH client half (`src/client/` → `client.js`)

A single generated file in the host's combo-script format. It registers two things under one id:

- `sidebar.panellist` — the left sidebar row: an icon component plus a locale-aware label.
- `main` (keyed by the same id) — the page the row opens.

Registering only one of the two is a host error: selecting a panel id with no `main` cell throws. The
shared `PANEL_ID` constant and a test that asserts both registrations exist are what keep the pair
honest.

The panel is a **static reader** of the bundled catalog. It has no IPC, no network and no write path,
which is both a privacy property and a reliability property: a panel that cannot perform an operation
cannot fail at it. Its data arrives at build time.

### Build (`scripts/build-client.mjs`)

There is no bundler. The build is a deterministic text assembly: source parts in fixed order with the
catalog and locale dictionary injected as JSON literals, wrapped in the host's module envelope.
`build:check` (and a test) fail if the committed `client.js` differs from a fresh build, so the shipped
artifact cannot drift from its sources.

## Invariants enforced by tests

| Invariant | Test |
|---|---|
| The catalog is valid, and every rule carries dated evidence and a false-positive note | `catalog.test.mjs` |
| `deprecated` is impossible without a named source | `catalog.test.mjs` |
| A clean fixture produces zero findings | `scan.test.mjs` |
| The JSON report is byte-identical across runs | `scan.test.mjs` |
| A support gate demotes taste, never safety | `scan.test.mjs` |
| A suppressed finding stays counted | `scan.test.mjs` |
| A symlink out of the root is not followed | `walk.test.mjs` |
| An excerpt never contains a credential | `redact.test.mjs` |
| Only `react` is required by the client bundle | `build.test.mjs` |
| The sidebar row and the panel page share one id | `build.test.mjs` |
| The tool requires explicit paths and registers as effects | `host.test.mjs` |
| No engine module touches the network | `no-network.test.mjs` |
| A scan writes nothing | `no-write.test.mjs` |
