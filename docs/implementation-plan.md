# S-Eidos — implementation plan

- **Date:** 2026-11-16
- **Depends on:** `docs/design.md`, `research/legacy-pattern-catalog.md` (the rule source of truth for content)
- Ordered so that every step ends with something runnable and testable. No step depends on a later step.

---

## Phase 0 — repository skeleton (≈30 min)

| # | Deliverable | Acceptance |
|---|---|---|
| 0.1 | `git init`, `.gitignore` (`node_modules/`, `.s-eidos/`, `*.log`, `dist/`), `.gitattributes` (`* text=auto eol=lf`) | `git status` clean-ish, no accidental files |
| 0.2 | `package.json`: name `s-eidos`, `type: module`, `private: true`, `engines.node >=22`, scripts (`test`, `lint`, `format:check`, `typecheck`, `build`, `build:check`, `verify`, `check:links`, `check:secrets`, `check:licenses`), `dsh` block, `exports`, `files`, `bin` | `node -e "require('./package.json')"` parses |
| 0.3 | Directory tree per `docs/design.md` §10 | dirs exist |
| 0.4 | `LICENSE` (MIT, holder decided at publication), `NOTICE.md` (no bundled third-party content) | files present |

## Phase 1 — catalog and schema (the long pole)

| # | Deliverable | Acceptance |
|---|---|---|
| 1.1 | `rules/schema.mjs` — a hand-written validator for the catalog envelope and rule records (no ajv) | validator returns typed errors with rule id + field path; unit-tested against 12 malformed fixtures |
| 1.2 | `rules/catalog.json` — 28–40 rules from `research/legacy-pattern-catalog.md` | passes 1.1; every rule has all required fields; every `evidence.url` appears in `research/source-register.md` |
| 1.3 | `features` + `supportPresets` tables inside the catalog | every `supportGate.feature` referenced by a rule exists; every preset resolves |
| 1.4 | `scripts/gen-rules-docs.mjs` → `docs/rules/<ID>.md` + `docs/rules/index.md` | generated; `build:check`-style drift test |
| 1.5 | `test/catalog.test.mjs` | schema, ID uniqueness/format, reviewBy sanity, `deprecated`-requires-source-flag, impact non-empty, no tier `c` in `rules[]` |

## Phase 2 — engine (pure, no I/O beyond reading files)

| # | Deliverable | Acceptance |
|---|---|---|
| 2.1 | `src/engine/walk.mjs` — bounded file discovery: extension allowlist, skip dirs, dot-dirs, symlink containment, generated/minified/lockfile/binary detection, caps | unit tests for every skip reason; symlink escape test; cycle test |
| 2.2 | `src/engine/classify.mjs` — framework adapter: evidence + confidence (`react`, `next-app`, `next-pages`, `typescript`, `web-component`, `plain`) | table-driven tests incl. conflicting evidence (a `.tsx` with no JSX ⇒ lower confidence, still classified) |
| 2.3 | `src/engine/targets.mjs` — preset resolution + `evaluateGate(rule, targets) -> applies \| demoted \| unknown` | tests for each preset and each gate outcome |
| 2.4 | `src/engine/detectors/` — one module per detector family, exporting `detect(ctx) -> hit[]`; **no regex with nested quantifiers** | each detector has a positive, negative and adversarial (ReDoS-ish) fixture |
| 2.5 | `src/engine/scan.mjs` — orchestration: classify → select rules → detect → gate → collapse hits per (rule,file) → findings; caps + refusal conditions; never throws on a single bad file | end-to-end fixture tree test; cap/truncation test; bad-file-continues test |
| 2.6 | `src/engine/redact.mjs` | tests for 8 secret shapes + comment stripping + 120-char bound |
| 2.7 | `src/engine/report.mjs` — text / json / md renderers, deterministic ordering | golden-file test for JSON without `--stamp`; byte-identical on re-run |
| 2.8 | `src/engine/decisions.mjs` — read/validate/add/prune, reason + reviewBy enforcement, expiry | tests for refused writes, expired counting, upgrade of an older file |

## Phase 3 — CLI

| # | Deliverable | Acceptance |
|---|---|---|
| 3.1 | `bin/s-eidos.mjs` using `node:util.parseArgs`, no deps | `--help` exits 0; unknown flag exits 2 with a message |
| 3.2 | Commands `audit`, `rules`, `explain`, `decisions list\|add\|prune`, `version` | integration tests spawn the CLI and assert exit codes + JSON |
| 3.3 | `--fail-on <severity>` gate and `--format json` contract | exit 1 when findings ≥ threshold; exit 0 otherwise; JSON matches schema |
| 3.4 | Refusal UX: no paths ⇒ usage error (never scans cwd implicitly) | test asserts a bare `audit` refuses |

## Phase 4 — DSH host half

| # | Deliverable | Acceptance |
|---|---|---|
| 4.1 | `index.js` — `name`, `inject`, `apply`, `Config` | loads in a fake Cordis context (unit test) and registers exactly one tool + one skill |
| 4.2 | Tool `s_eidos_audit` with raw JSON-Schema params, `output.schema`, `output.render` bounded | fake-context test asserts schema validity, argument validation, bounded render, and that `exec.signal` aborts |
| 4.3 | `skills/s-eidos-audit/SKILL.md` + registration | registration object shape matches the verified recipe; skill body renders |
| 4.4 | `cordis.patch.yml` | installs; row appears; tool appears in a new session |

## Phase 5 — DSH client half (the left sidebar entry)

| # | Deliverable | Acceptance |
|---|---|---|
| 5.1 | `src/client/panel.js` — React via `createElement` only, `--dsw-alias-*` tokens only, filterable rule list + detail | pure render logic extracted into testable functions |
| 5.2 | `scripts/build-client.mjs` — catalog + panel → `client.js` | deterministic; `build:check` fails on drift |
| 5.3 | `client.js` registers `main` + `sidebar.panellist` under one id with locale label | unit test on the module envelope; live check after install |
| 5.4 | `locale/en.json` with `meta.title`, `meta.description`, panel labels | host display checklist satisfied |
| 5.5 | `icon.svg` — original, 36×36, no scripts/`<style>`/`<image>` | decodes; readable at row size in light and dark |
| 5.6 | `docs/DETAIL.md` + `docs/preview.svg` (one feature image) | one image line with alt text; ≤ 1 MiB |

## Phase 6 — verification

| # | Check | Command |
|---|---|---|
| 6.1 | Unit + integration + fixture tests | `npm test` (`node --test`) |
| 6.2 | Lint | `npm run lint` (ESLint flat config, dev dep) |
| 6.3 | Format | `npm run format:check` (Prettier, dev dep) |
| 6.4 | Typecheck | `npm run typecheck` (`tsc --noEmit` over JSDoc, dev dep) |
| 6.5 | Build drift | `npm run build:check` |
| 6.6 | No-network invariant | `test/no-network.test.mjs` + CI job without network |
| 6.7 | Secret scan | `npm run check:secrets` (repo-local script) |
| 6.8 | Dependency/licence review | `npm run check:licenses` + `npm audit --omit=dev` (expect zero runtime deps) |
| 6.9 | Link check | `npm run check:links` over `research/source-register.md` (network job; tolerates 429 with retry, fails on 404) |
| 6.10 | False-positive suite | `test/false-positives.test.mjs`: legacy-but-valid and situational fixtures must produce **zero** findings |
| 6.11 | No-write invariant | test asserts `audit` mutates nothing except when `decisions add` is invoked |
| 6.12 | Accessibility self-review | panel: contrast via tokens only, `aria-*` on every control, keyboard reachable; recorded checklist |
| 6.13 | CI | `.github/workflows/ci.yml`, actions pinned to SHAs, no secrets, `permissions: contents: read` |

## Phase 7 — documentation and release readiness

README (purpose, non-affiliation, quick start, support policy, safe defaults, limitations, targets, provenance model),
`docs/architecture.md`, `docs/knowledge-update-process.md`, `docs/rules/` (generated), `CONTRIBUTING.md`,
`CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`, `docs/releases/0.1.0.md`.

## Phase 8 — publication checkpoint

Verify `gh auth status`; re-check name collisions; present the exact repo name, licence and public visibility; **wait
for explicit approval**; then create, push, and verify visibility/default branch/README/LICENSE/Actions. No force-push.

---

## Definition of done for v0.1

1. `npm test` green with the fixture matrix in `docs/design.md` §3.4 represented.
2. Valid/situational fixtures produce zero findings (the anti-noise guarantee).
3. `client.js` is reproducible and the panel appears as a **left sidebar entry** in the running GUI, verified visually.
4. `s_eidos_audit` is callable from a DSH session and returns the §8.1 object.
5. Every rule's evidence URL resolves (link check) and every rule has a `reviewBy` date.
6. No network call, no telemetry, no write to scanned files.
7. Every documented command in the README has been run exactly as written.
