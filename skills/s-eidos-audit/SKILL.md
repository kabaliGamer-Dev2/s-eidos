---
name: s-eidos-audit
description: Review front-end code for risky, inaccessible, obsolete or framework-misaligned patterns, with dated evidence and a support-target check, before claiming it is modern or refactoring it.
---

# S-Eidos audit

S-Eidos reviews code that already exists. It reports evidence; it does not decide policy, and it
never edits a file. Its premise is that **age alone is never a defect**: a finding fires only when a
cited source, the project's declared support target, and a detectable code shape agree that a change
would pay.

## When to use it

- A request says "modernise", "update to current best practice", "is this still valid", or "review
  this component".
- You are about to describe existing front-end code as modern, or to refactor it.
- You have just written or modified a component and want a second opinion on the parts a linter
  does not check: semantics, focus behaviour, effect-driven state, hydration, framework idioms.
- A pull request touches `.tsx`, `.jsx`, `.html`, `.css`, or a Next.js route.

Do **not** call it to answer "what is the current best practice for X" — that is a documentation
question, not a review of existing code. Do not call it on an empty path list.

## How to call it

`s_eidos_audit({ paths: [...] })`

- `paths` — one to sixteen paths relative to the session workspace. It never walks the workspace
  implicitly, so name what you want reviewed. Prefer a directory over a long file list.
- `targets` — the support policy to judge advice against. Omit it for the default
  (`baseline-widely-available`). If the project pins older browsers, say so in the argument and in
  your answer; the tool will then demote advice the target cannot use instead of calling it a defect.
- `rules` — restrict to specific rule ids when you already know what you are looking for.
- `format` — `summary` (default) or `json` when you need the full structured value.

## How to read a finding

Each finding carries everything needed to judge it without another lookup:

| Field | What it means |
|---|---|
| `classification` | one of `deprecated`, `obsolete`, `legacy`, `situational`, `unsupported`, `insecure`, `inaccessible` |
| `severity` | harm if the finding is real and unaddressed |
| `confidence` | how likely the match is a real defect |
| `remediationConfidence` | how likely the suggested change is correct in context |
| `falsePositives` | the conditions under which it must **not** be flagged |
| `supportGate` / `gateNote` | why the advice may not apply to this project's target |
| `evidence` | the source URL, the date it was retrieved, and the date it must be reviewed |
| `migration` | a minimal before/after sketch, not a patch |
| `autofix` | `none`, `safe`, or `situational` — and this tool applies none of them |

## Rules of engagement

1. **Read `falsePositives` before reporting anything to the user.** If a listed condition applies,
   the finding does not. Say so rather than reporting it.
2. **Quote the classification accurately.** Never describe a finding as "deprecated" unless the
   field says `deprecated`; `obsolete` and `legacy` mean different things.
3. **Never present a count as a verdict.** "7 findings" is not "7 bugs". Report the ones that hold up
   against their own false-positive conditions, and say what you set aside.
4. **Respect a demoted finding.** When `gateNote` explains that the modern alternative is
   unavailable at the declared target, the honest recommendation is usually "leave it, revisit when
   the target moves", not "change it anyway".
5. **Report the caveats with the counts.** Skipped paths, truncation, stale rules and suppressed
   findings are part of the result. A number without them is misleading.
6. **This tool does not edit code.** If the user wants a change, make it yourself, deliberately, and
   run their formatter, lint, typecheck and tests afterwards.
7. **Suppression is a decision, not a deletion.** If the user wants to accept a finding, they run
   `s-eidos decisions add --rule <id> --reason "<why>" --review-by <date>`. A suppressed finding
   stays visible in the report; it is never erased.

## What it will not do

- It will not scan the working directory unless you name paths.
- It will not touch the network, and it has no telemetry.
- It will not rewrite, format, or delete files.
- It will not claim WCAG conformance, measure field performance, or prove that code is safe: those
  are not static-analysis questions. A finding is a lead with evidence attached.
