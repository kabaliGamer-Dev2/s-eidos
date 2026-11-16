# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-11-16

The first release. Detect-only, local-only, zero runtime dependencies.

### Added

- **A left sidebar entry in DeepSeek Harness.** The `S-Eidos` row opens an evidence workbench over
  the bundled catalog: filter by rule, classification or severity, and read each rule's
  classification, impact, severity, confidence, remediation confidence, support gate,
  false-positive warning, migration sketch and cited source with its retrieval and review dates. The
  panel is a static reader: no IPC, no network, no write path.
- **The `s_eidos_audit` agent tool.** Reviews explicitly named paths (1–16; it never scans the
  working directory on its own) and returns findings as a canonical value plus a bounded digest.
- **The `s-eidos-audit` skill.** When to call the tool, how to read a finding, what the review will
  not do, and why a suppressed finding is a decision rather than a deletion.
- **The `s-eidos` CLI.** `audit`, `rules`, `explain`, `decisions list|add|prune`, `version`.
  `--format text|json|md`, `--targets <preset>`, `--rule`, `--fail-on`, `--stamp`, `--color`.
- **A versioned rule catalog** of reviewed rules, each with a seven-value classification, an
  independent impact axis, severity, confidence, remediation confidence, a detectability tier, a
  support gate, dated evidence with a review deadline, a mandatory false-positive note, a migration
  sketch and an autofix policy.
- **Support-target gating.** Eight presets resolvable offline. A finding whose modern alternative the
  declared target cannot use is demoted to `situational` with a note; `insecure` and `inaccessible`
  findings are never demoted.
- **Decision records.** `.s-eidos/decisions.json` records suppression with a required reason and a
  review date. Suppressed findings stay in the report, counted separately, and expired decisions are
  reported.
- **Deterministic JSON reports.** Byte-identical across runs unless `--stamp` is passed, so a report
  is diffable and usable as a fixture.
- **Bounded, redacted analysis.** File/byte/depth/finding caps, generated and minified skips, symlink
  containment, cycle detection, and one-line redacted excerpts. Every skip is reported with a reason.
- **Repository checks.** Catalog validation, rule-reference drift, client-bundle drift, secret scan,
  dependency and licence review, citation link check, and an in-process verifier.

### Security

- Zero runtime dependencies; no install scripts.
- No network calls anywhere; enforced by a test.
- No write to scanned code. The only write is an opt-in decisions file.

### Known limitations

- 7 rules ship with detectors and fixtures. A further 30 reviewed rules are catalogued in
  `research/legacy-pattern-catalog.md` with evidence and are deferred; each needs a detector and its
  fixtures before it can fire.
- No codemod is applied. The refusal contract and the per-rule `autofix` policy are shipped; the apply
  path is not.
- The panel does not show live scan results; it reads the bundled catalog.
- Tier `c` rules (data flow, taint tracking) are documented and deliberately not shipped.
- English only.
- Severity and confidence are authored judgements, not measured calibration.
