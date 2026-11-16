# Knowledge update process

S-Eidos is only worth as much as its citations. This document is how the knowledge behind it stays
true, gets reviewed, and gets retired.

## 1. What is versioned

| Artifact | Field | Meaning |
|---|---|---|
| Package / plugin | `version` (semver) | the code and the panel |
| Catalog | `catalogVersion`, `asOf` | the rule set and the day it was last reviewed as a whole |
| Catalog schema | `schemaVersion` | the shape of a rule record |
| Report | `schemaVersion` | the shape of a report |
| Decisions file | `schemaVersion` | the shape of `.s-eidos/decisions.json` |

Rule IDs (`SEM-001`, `MET-001`, …) are **permanent**. A rule is never renumbered. Retiring a rule keeps
its ID and adds `retired: true`, a reason, and the date.

## 2. Per-claim dates

Every rule carries two dates:

- `evidence.retrieved` — the day the cited source was read.
- `evidence.reviewBy` — the day it must be read again. Default: `retrieved` + 12 months.

When `reviewBy` passes, the rule is **stale**:

- `s-eidos audit` appends a `[stale rule]` marker to the finding and a line to the caveats block;
- the report's `catalog.staleRules` lists the affected IDs;
- the panel shows a stale count in its header.

A stale rule still reports. Hiding it would be worse than flagging it: the point is to make the
staleness visible, not to make the tool quietly shrink.

## 3. Review cadence

| Trigger | Action |
|---|---|
| A `reviewBy` date passes | re-read the source; update `retrieved`/`reviewBy`; if the claim no longer holds, retire or reclassify the rule |
| A cited source changes materially | same as above, immediately |
| A new framework major ships (React, Next.js, TypeScript) | review the rules whose `supportGate` names a version; update the gate |
| A baseline/Baseline date moves | review rules gated on browser features |
| A false positive is reported | add the condition to `falsePositives` **before** widening or narrowing the detector |
| Quarterly, at minimum | run `npm run check:links`; every dead citation is a bug |

## 4. Changing a rule safely

1. Edit `rules/catalog.json`.
2. Run `npm test`. The catalog validator and the rule-reference drift check run first.
3. If the detector changed, add or update a fixture in `test/fixtures/`:
   - a **positive** fixture that must flag,
   - a **negative** fixture that must not flag (the false-positive condition made executable),
   - a framework-specific fixture when classification matters.
4. Run `npm run verify` — catalog, links, bundle and reference must all agree.
5. Bump `catalogVersion` and update `asOf` when the shipped rule set changes.

## 5. Retiring a rule

A rule is retired when its evidence no longer supports it, when the pattern is no longer worth a
finding, or when the framework it targeted is gone.

```json
{
  "id": "REA-004",
  "retired": true,
  "retiredOn": "2027-03-01",
  "retiredReason": "React 21 makes the rewrite the compiler's job; the manual migration is no longer the right advice."
}
```

Retired rules stay in the file so that an old report still resolves its IDs. They are excluded from
scanning and from the panel by `shipped: false`.

## 6. Dead citations

`npm run check:links` fetches every URL in the catalog and in `research/source-register.md`.

- `404`/`410` — **fails**. A citation that does not resolve is a correctness bug.
- Rate limits, timeouts and 5xx — reported as **unverified**, not as failure. A blocked request is not
  a dead source, and a check that pretends otherwise gets disabled.
- A URL that is deliberately not a navigable page (an API base endpoint, or the stale URL recorded in
  research as a 404) must be listed with its reason in `scripts/check-links.mjs`. An unexplained
  exception is how a dead link survives.

## 7. Updating the support presets

Presets live in the catalog's `supportPresets`, and each browser feature the catalog knows carries a
`rank`. A rule's `supportGate` compares the project's rank against the feature's rank.

Changing a rank is a **behaviour change** for every project that uses the preset, so it is a catalog
minor bump and must be called out in the changelog.

## 8. What is intentionally not automated

- **No automatic source fetching at runtime.** The tool never calls the network; updating a citation is
  a human act recorded in a commit.
- **No automatic reclassification.** A machine cannot decide that a source now says "deprecated".
- **No self-updating rules.** The catalog ships with the package; a stale rule is reported, not
  silently refreshed from a feed.
