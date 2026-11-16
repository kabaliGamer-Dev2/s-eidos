# Contributing

Thanks for considering a contribution. S-Eidos is a small, evidence-first project, and the rules for
changing it are deliberately strict about one thing: **a claim without a citation is not a rule.**

## Ground rules

1. **Evidence before code.** Every rule cites a primary source (MDN, web.dev, WHATWG/W3C/TC39,
   react.dev, nextjs.org, typescriptlang.org, OWASP, a browser vendor's own documentation) and records
   the date it was retrieved. Blog posts and Stack Overflow answers are not primary sources.
2. **`deprecated` is reserved.** A rule may only use that classification when the cited source says
   "deprecated" or "removed". Otherwise choose `obsolete` or `legacy` and say what the source supports.
3. **Every rule lists a false-positive condition.** A rule that cannot say when it must not fire is not
   ready to ship.
4. **No vendored third-party content.** Do not copy guide text, rule implementations, or branding from
   any other project. See `NOTICE.md`.
5. **No runtime dependencies.** The package must install and run with nothing but Node.
6. **No network, no telemetry.** The engine, the tool and the panel make no outbound request.

## Adding a rule

1. Add an entry to `rules/catalog.json`. Run `npm test`; `rules/schema.mjs` will tell you exactly which
   field is wrong.
2. Implement its detector in `src/engine/detectors/index.mjs` and register it in `DETECTORS`.
   Detectors must be bounded: no nested quantifiers, no unbounded scanning, no filesystem access.
3. Add fixtures:
   - `test/fixtures/problems/` — code that must flag;
   - `test/fixtures/clean/` — code that must not;
   - a framework-specific fixture when classification matters.
4. Extend `test/scan.test.mjs` with the expected rule id and, where the false-positive condition is
   subtle, a test that proves it does not fire.
5. Run `npm run docs:rules` to regenerate the reference, then `npm run verify`.

Rules are reviewed on two axes before merge: is the *claim* supported by the citation, and is the
*detector* precise enough that the false-positive list is honest.

## Adding a support preset or feature

Support data lives in `catalog.supportPresets` and `catalog.features`. The model is intentionally
small and offline: a preset has a rank, and a feature has a minimum rank. Presets are not a browser
database. If you need per-engine version data, explain why the existing ranks cannot express it.

## Changing the panel

`client.js` is generated. Edit `src/client/`, then run `npm run build`. The build is checked in CI, so
a hand-edited `client.js` will fail.

Panel constraints, from the host's own rules:

- never import a Harness Client package or a primitive library; only `react` arrives from the host;
- colours come from `--dsw-alias-*` theme tokens, never literal colours;
- no DOM access outside the component, no `document.body`, no iframe;
- the sidebar row and the panel page must share one id.

## Commits and pull requests

- Conventional commit subjects (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- One logical change per pull request; a rule addition is its own pull request.
- Describe the evidence for a new rule in the pull request body, with the URL and retrieval date.
- `npm run verify` must pass. CI runs the same checks plus the test suite.

## Reporting a bad finding

A false positive is a bug. Open an issue with:

- the rule id,
- the smallest code snippet that reproduces it,
- what the correct verdict is and why.

If the finding is legitimate for your project but you do not intend to act on it, that is a
**decision**, not a bug: use `s-eidos decisions add` with a reason and a review date.

## Security

Do not open a public issue for a vulnerability in S-Eidos itself. See [SECURITY.md](SECURITY.md).
