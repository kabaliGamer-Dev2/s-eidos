# Rule reference

> Generated from `rules/catalog.json` by `scripts/gen-rules-docs.mjs`. Do not edit by hand.

Catalog `0.1.0`, as of 2026-11-16. 7 rule(s).

| Rule | Title | Classification | Impact | Severity | Confidence | Tier | Autofix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [`SEM-001`](SEM-001.md) | iframe has no accessible name | inaccessible | accessibility | medium | high | a | none |
| [`SEM-002`](SEM-002.md) | javascript: URL in a link or source | insecure | security, compatibility | critical | high | a | situational |
| [`IMG-001`](IMG-001.md) | img has no intrinsic dimensions | obsolete | performance | medium | medium | b | none |
| [`MET-001`](MET-001.md) | viewport blocks pinch zoom | inaccessible | accessibility | critical | high | a | safe |
| [`ARI-001`](ARI-001.md) | Large motion ignores prefers-reduced-motion | situational | accessibility | medium | medium | b | situational |
| [`FRM-001`](FRM-001.md) | autocomplete disabled on a credential field | obsolete | correctness, accessibility | medium | high | b | situational |
| [`TYP-001`](TYP-001.md) | @ts-ignore instead of @ts-expect-error | obsolete | maintainability, correctness | medium | high | a | safe |

## How to read this table

- `Classification` says what kind of statement the rule makes; `deprecated` is used only where a cited source says so.
- `Impact` says why a change would pay. It is independent of classification.
- `Confidence` is a judgement about matches, not measured calibration; every rule page lists the conditions under which it must not be flagged.
- `Tier` `a` is a reliable lexical match, `b` a bounded heuristic. No tier `c` rule ships in this version.
- `Autofix` records a policy this version does **not** execute. Nothing is applied automatically.
