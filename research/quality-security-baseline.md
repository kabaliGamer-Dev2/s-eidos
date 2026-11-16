# Quality, security and remediation baseline

**Purpose:** the requirements every shipped rule must satisfy — accessibility, performance, security, privacy, SEO, supply chain — plus the remediation contract to be honoured if codemods ever arrive. **Retrieved:** 2026-11-16 (Asia/Calcutta). **v0.1 is detect-only** (D-008): nothing in §7 is executable yet; it is the refusal contract, not a feature list.

Two governing decisions sit above everything else. (1) The tool is a **source analyzer, not a browser**: it never executes repository code, boots a dev server, measures a metric, or loads repo JS config. (2) **No rule may assert conformance** — reports say "potential barrier, SC 1.4.3, needs human confirmation", never "WCAG failure" or "this page passes".

## 1. Accessibility

| Target | Version / status | Use here |
|---|---|---|
| **WCAG 2.2** | W3C Recommendation, 12 December 2024 | Normative conformance target; cite SC numbers and levels |
| Understanding WCAG 2.2 | WAI informative, continuously updated | Intent and exception text; informative, never normative |
| **WAI-ARIA 1.2** | W3C Recommendation | Normative role/state/property semantics |
| ARIA Authoring Practices Guide | WAI guidance | **Pattern reference, not a requirement** — cite as "recommended pattern", never as a failure |

WCAG 2.2 removed **4.1.1 Parsing** and is backwards compatible with 2.0/2.1. New SCs: 2.4.11 (AA), 2.4.12/2.4.13 (AAA), 2.5.7 (AA), 2.5.8 (AA), 3.2.6 (A), 3.3.7 (A), 3.3.8 (AA), 3.3.9 (AAA).

**Default target = WCAG 2.2 level AA.** AAA-only criteria (2.3.3 Animation from Interactions, 1.4.6, 2.4.13, 2.5.5, 3.3.9) may be surfaced but **must be labelled "AAA — advisory"** and must never contribute to a blocking count. Mis-labelling AAA as AA is the fastest credibility loss available to a tool in this category.

**Capability statement (printed in `--help` and every report header):**

> This tool detects a subset of WCAG 2.2 barriers that are visible in source. It cannot verify conformance, cannot evaluate rendered contrast, focus order, or assistive-technology behaviour, and a clean report does not mean the interface is accessible. Conformance requires manual testing against WCAG 2.2 by a qualified evaluator.

**Why the ceiling is structural:** WCAG criteria "are designed to apply broadly … and to be testable with a combination of automated testing **and human evaluation**". 1.3.2, 2.4.3, 3.3.3 and 1.1.1 depend on author intent and rendered state. Empirically, **95.9 % of one million home pages had automatically detectable WCAG 2 A/AA failures**, and the top six issue types account for 96 % of detected errors (low contrast 83.9 %, missing alt 53.1 %, missing form labels 51 %, empty links 46.3 %, empty buttons 30.6 %, missing lang 13.5 %). Automation is neither sufficient nor useless: it is a triage aid with a hard ceiling.

**Three buckets, and a rule's bucket is not a property of the rule alone:**

| Bucket | Allowed to ship as `default: true` | Examples from the shipped set |
|---|---|---|
| **a — reliable from source** | Yes, given a well-formed parse and no cross-file/runtime need | ARI-001 contradiction, MET-001 zoom block, FRM-002 button type |
| **b — heuristic** | **`default: false` unconditionally** — opt-in, confidence-tagged, mandatory false-positive note | CSS-001 outline, ARI-002 tabindex, FRM-001 labels, IMG-001 alt |
| **c — must not be automated** | Never | contrast ratio, alt-text *meaning*, focus order, heading structure, keyboard operability, reading order, target size, "element is invisible", flashing GIFs |

**File-kind gate (`A11Y-001`).** A rule manifest declares `reliability` **and** the `fileKinds` it applies to; the engine refuses to emit a tier-(a) finding for a file kind the rule does not list. Literal markup (`.html`, static template) → tier (a) allowed; opaque component children (JSX/TSX, SFC) → demoted to (b) unless the file proves otherwise; test/story/doc/generated files → a11y rules never run.

**Forbidden automation, with reasons:** contrast (`color`/`background` cascade, custom properties, `currentColor`, `inherit`, `opacity`, compositing, gradients, `background-image`, `mix-blend-mode` all change the answer — and contrast is the #1 detected issue, so an approximation is wrong exactly where users check); "alt text looks too short"; "focus order is wrong"; "heading structure is correct"; "this widget is keyboard operable"; "`aria-label` present ⇒ 4.1.2 passes"; "element is invisible". Also: never auto-insert `aria-required`/`required` from a `*` in a label, and never suggest a specific `aria-live` politeness value as a codemod.

**Report language (`A11Y-002`).** Every a11y finding renders as: `<rule-id> <severity> <criterion> <file>:<line>` + "Potential barrier: …" + "Detected: …" (redacted per §4) + **"Why this may be a false positive: …" (mandatory, non-empty for tier b)** + "Verify by: <manual step>". A rule author who cannot state the false-positive note has not finished the rule.

## 2. Performance (Core Web Vitals)

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| **LCP** | ≤ 2500 ms | 2500–4000 ms | > 4000 ms |
| **INP** | ≤ 200 ms | 200–500 ms | > 500 ms |
| **CLS** | ≤ 0.1 | 0.1–0.25 | > 0.25 |

Thresholds are read from the `web-vitals` library exports (`LCPThresholds`, `INPThresholds`, `CLSThresholds`); INP is applied to the **75th percentile of page loads, segmented mobile/desktop**, and observes click/tap/keyboard only. **FID is retired** (replaced by INP on 12 March 2024, removed from field tools in September 2024) — the catalog must contain no FID rule; a rule that recommends optimising "FID" is a defect. FCP/TTFB are diagnostics, never "Core Web Vitals failures". `onCLS()` is Chromium-only and has no visibility into iframes.

**Hard boundary (`PERF-001`).** The words LCP/INP/CLS may appear **only** as `risk: contributes to CLS` / `risk: likely to delay LCP`, never with a number, unit, or predicted score. Question-answerable-from-source: does an image declare dimensions; is a `<script>` render-blocking; does a font lack `font-display`; is a third-party origin on the critical path. Not answerable: what is LCP/INP/CLS; is the bundle too big. A fabricated measurement is a **release blocker**. `PERF-002`: no simulated throttling, no synthetic before/after estimates; print the command and label pasted results as lab data.

**Source-detectable causes the catalog may name:** missing media dimensions (IMG-002), lazy on an LCP candidate (IMG-003), render-blocking third-party script, `@font-face` without `font-display` / Google Fonts without `preconnect` (NXT-004), static import of a heavy module used only in a handler, `document.write` in a parser-blocking position. Every one names a *cause*, never a score.

## 3. Security

**Standards map:** OWASP Top 10:**2025** (`A0x:2025` — A03 Software Supply Chain Failures and A10 Mishandling of Exceptional Conditions are new; a rule citing `A03:2017` is stale and rejected), OWASP ASVS **5.0.0** (cite `v5.0.0-<chapter>.<section>.<requirement>`), OWASP WSTG **4.2** (5.0 is in development — never cite as released).

**Sink policy (`SEC-001`/`SEC-002`).** `el.innerHTML = '<b>ok</b>'` is safe and flagging it is a false positive: the literal check is AST-shape work, not a regex. Without data-flow, `innerHTML = sanitize(html)` and `innerHTML = userInput` look identical, so **severity** requires a local one-hop taint check (`location.*`, `document.URL`/`referrer`, `window.name`, `postMessage` data, `localStorage`, user-typed params, `await fetch()`): high = tainted, medium = taint unknown, info = recognised sanitiser wraps it. Never claim a sanitiser is safe — only that a call we recognise is present; its config may be wrong.

**v0.1 consequence:** taint is tier `c` and **not shipped** (see catalog §4). `REA-005` ships only the literal-vs-non-literal half, severity-capped, and its message must not imply "this is exploitable".

**Secrets (`PRIV-003`, `SEC-320…322`).** The tool must never print a secret it finds: report rule id, file, line, **pattern name**, length, and a truncated salted hash. Never the value, never a prefix/suffix. A scanner that echoes a secret into CI logs has made the leak worse. `.env*` presence may be reported; values are never read into a report.

**CSP** is a W3C **Working Draft** (27 October 2026) — cite it as such. The spec says CSP is "not intended as a first line of defense": a nonce is not a fix for an XSS sink, and `'strict-dynamic'` makes host allowlists irrelevant for script, so recommend it only **with** nonce/hash **and** Trusted Types. `require-trusted-types-for` is **fail-open** where TT is absent (TT is newly available since 2026-02-24); migration order is report-only → default-policy logging → rewrite sinks → enforce.

**Headers** are infrastructure: report only from files that can substantiate them (`next.config.*`, `vercel.json`, `netlify.toml`, `_headers`, `nginx.conf`, `web.config`, `middleware.ts`/`proxy.ts`). If none is found the finding is one line — "no header configuration detected in this repository — headers may be set upstream" — never a per-page failure.

**Two facts that prevent false findings.** (a) `target="_blank"` **implicitly** gets `rel="noopener"` behaviour in current engines: no rule ships (D-011); `noreferrer` is a privacy decision. (b) Authorisation in client code is a UX affordance only: report it as a question ("client-side only — must be enforced server-side", A01:2025), severity medium, default off, and **no codemod** exists for it.

## 4. Privacy and redaction

**Testable invariants (`PRIV-001`):** zero network calls of any kind (a harness monkeypatches `http`/`https`/`net`/`dns`/`fetch`/`WebSocket` and asserts zero calls during a full scan; CI also runs with egress blocked and requires exit 0); no analytics/crash reporting; no remote rule updates; no version-check phone-home; no writes outside the repo; no reads outside the repo except the tool's own package; symlinks not followed.

**No telemetry by default.** If ever added: off by default with no install prompt, content-free payload (rule ids, counts, tool version, OS family, Node major, duration buckets — never paths/excerpts/hashes/dependency names/repo names), consent per major version, `--telemetry-status`, and `MWC_OFFLINE=1` honoured before argument parsing.

**Redaction policy — what may appear in a report:**

| Element | Allowed | Prohibited |
|---|---|---|
| Path | repo-relative, forward slashes `src/app/Card.tsx` | absolute paths, drive letters, `C:\Users\<name>`, home dirs, UNC shares |
| Location | `line`, `column`, `endLine` | byte offsets alone, whole-file ranges |
| Excerpt | **≤ 120 characters, single line**, leading whitespace collapsed | multi-line blocks, whole functions/files |
| String literals in excerpts | redacted to `"***"` if longer than 16 chars or matching a secret pattern | any credential-looking literal, URL with a query string, email |
| Comments | **excluded by default**; `--include-comments` opt-in, still redacted | comments are the highest-density place for planted secrets |
| Fingerprint | `HMAC-SHA256(repo_salt, rule_id + "\0" + relpath + "\0" + normalized_excerpt)[0:16]` | whole-file hashes, reversible encodings, unsalted hashes of short secrets |
| `repo_salt` | random per run, stored in the report, documented as not a secret | derived from machine name, username, or time |
| Env values | never, under any flag | — |

The redactor is **one module used by every output path** (console, JSON, SARIF, HTML); the finding object is constructed already redacted and there is no "raw" mode. `--verbose` may not widen the limits; it must re-run the secret detector before printing. Rule of thumb: prefer structure over content — `img element with 3 attributes (src, class, loading)` identifies the construct without quoting the user's text.

**SEO scope.** Only metadata a source file can substantiate is in scope: the viewport/zoom block (`MET-001`) is the one shipped SEO-adjacent rule. `noindex` in a template, canonical URLs and social metadata are **excluded**: preview/staging templates legitimately set them and the tool cannot know the deployment. No rule may claim indexability, ranking, or crawl status.

## 5. Supply chain

- **Zero runtime dependencies** (`dependencies: {}`) — the only design that both installs without network/cache privileges in this host and bounds the blast radius of a compromised dependency (D-002, `SUP-001`). A test asserts `dependencies` is empty.
- Dev dependencies: lockfile-pinned with `integrity`, installed `npm ci --ignore-scripts`, licence-gated by an **SPDX expression** allowlist (`MIT OR ISC OR 0BSD OR BSD-2-Clause OR BSD-3-Clause OR Apache-2.0 OR MPL-2.0`), deny-by-default, unknown identifiers fail closed.
- `supply-chain/deps.json` (name, version, resolved, integrity, licence, dev, hasInstallScript) and a dated advisory snapshot are committed; CI regenerates `deps.json` from the lockfile and fails on any diff, so a lockfile change is a reviewable event.
- Dependency rules are name/heuristic only (`SEC-370…374`): typosquat distance, install scripts, lockfile drift, URL/tarball/git installs. `SEC-370` is `default: false` and always says "verify the publisher".
- No vendored code, no bundled prose, no upstream guide text (licence boundary in `research/upstream-capability-inventory.md` §5; MIT is the tool's own licence). A GPL/AGPL **dev-only, non-distributed** tool is a different analysis from a runtime dependency, and if a bundled/single-file build is ever shipped that boundary disappears — **this is not legal advice; obtain counsel before shipping any non-permissive dependency in the distributed artefact.**

## 6. Safe remediation contract (honoured when codemods arrive — not implemented in v0.1)

**Modes.** `detect` (default, read-only) · `preview`: `--fix` alone computes edits and prints a unified diff, **writes nothing** · `apply`: `--fix --apply`, after every precondition passes · `revert`: `--fix --apply --revert <journal>`. In a non-TTY context `--apply` additionally requires `--yes`, else exit `2`.

**Preconditions — refuse before touching a byte.** Unparseable file; generated file (markers/`dist|build|out|.next|coverage|*.min.*|vendor|third_party`); vendored/not ours (`node_modules`, foreign `LICENSE`, submodule); lockfiles; minified; symlink; dirty working tree in an overlapping path; not a git repository (no trustworthy rollback); two rules producing overlapping edits; unsupported syntax; size budget (>1 MiB); an edit that would storm line count. Refusals are **reported**, never silently skipped.

**Semantic traps — refuse even when the pattern matches.** `innerHTML → textContent` (deletes intentional markup) · `eval`/`new Function` (template engines, sandboxes) · adding `alt=""` (declares decorative; can make accessibility *worse*) · inventing `aria-label` (wrong language, violates Label in Name) · moving focus / adding `tabindex` / a focus trap · adding `aria-live` (wrong politeness hides or spams announcements) · adding `prefers-reduced-motion` (removes needed feedback) · adding `loading="lazy"` (can delay the LCP image) · static → `await import()` (breaks top-level usage/chunking) · adding `rel="noreferrer"` (kills attribution) · wrapping in `DOMPurify.sanitize` (adds a dependency, may strip required content) · any lockfile/dependency edit · reformatting untouched lines.

**v1 allowlist is deliberately tiny (3 edits, none enabled):** add `width`/`height` only when the intrinsic size is readable from an image file in the same repo; add `type="button"` to a `<button>` in a form with no type; nothing else. Everything else is detect-only.

**Verification.** `formatter → lint → typecheck → focused tests → build`, commands discovered from the repo's own scripts, never invented, never an install hook, network off by default. Missing command ⇒ `verification: unavailable (<reason>)`, exit `3`. Failed verification ⇒ exit `4` (auto-revert only with `--revert-on-failure`). **Host constraint:** process-spawn failures (`EPERM`, blocked `.ps1`) are `unavailable`, not test failures.

**Rollback.** Journal (`.mwc/journal/<ts>-<pid>.json`) written and fsynced **before** the first byte: per-file repo-relative path, pre/post SHA-256, original content or backup copy, rule ids, tool version, git HEAD. Restore is verify-then-write and refuses on a hash mismatch. Write temp → fsync → rename in the same directory; never leave `.bak`/`.orig`/`.rej` beside source; refuse `--apply` if `.mwc/` is gitignored.

**Suppression.** Inline `// mwc-disable-next-line <ID> -- reason: <≥10 chars>`, file-scope `disable`, no wildcards, placeholders rejected; config allowlist entries carry `reason`, `owner`, `expires` and **expired entries fail the run**; a committed baseline keyed by fingerprint, never by line number; nothing suppressible by environment variable.

## 7. Per-rule test requirements

A rule is data plus a pure function and declares: `id`, `title`, `criterion`/standard mapping, `classification` (one of seven), `impact[]`, `reliability` (a/b — `c` is rejected by the loader), `fileKinds[]`, `default`, `severity`, `falsePositiveNote` (**mandatory non-empty; empty is a schema error**), `codemod` metadata (`none|safe|situational`, `allowed: false` in v0.1), fixtures, `redosFixtures`, `minConfidence`.

**Six mandatory fixture kinds:** `positive` (must flag) · `negative` (must not flag) · `legacy-valid`/false-positive (intentional construct: `alt=""`, email-table layout, `target="_blank"`, `document.write` in a legacy ad slot, `innerHTML` with a literal) · `framework` (the same defect in the React/Next idiom) · `unsupported-browser` (code that exists because of an old target, e.g. IE conditionals) · `domain` subtrees (a11y/security/perf/hydration).

**Plus:** golden report text per fixture (wording regressions are reviewable diffs) · byte-identical determinism, stable ordering (path → line → rule id) · redaction test with planted secrets and a `C:\Users\…`-style path asserting zero leakage in console/JSON/SARIF · ReDoS fixtures under 50 ms per rule and 2 s per file · `skipped: timeout` never a silent partial · idempotence for any codemod, and **zero edits on negative fixtures** · identical findings on Windows and POSIX separators.

**`default: true` requires all eight:** tier (a) for every declared file kind; zero false positives on the fixture corpus *and* a vendored real-repo regression corpus (≥10 repos: React/Next/Vue/Svelte/Astro/plain HTML); every negative and legacy-valid fixture passes; non-assertive wording; no measurement claim and no secret echo; `codemod.allowed` false or on the allowlist with trap fixtures; suppressible with a reason and baseline-appearing; deterministic under the time budget with no network and no reads outside the repo.

## 8. Threat model (summary) — full model in `research/agents/quality-security-auditor/threat-model.md`

| Class | Position |
|---|---|
| Hostile repo content attacking the scanner | Assume every input is hostile: bounded reads, no execution, no symlink following, no archives, per-file/per-run budgets |
| ReDoS from regex rules | AST first; regex only for leaf classification, bounded `{0,64}`, load-time linter, adversarial fixtures, worker timeout |
| Report leakage (secrets/PII) | Findings constructed already redacted; planted-secret tests; never echo a secret |
| Supply-chain compromise of the tool | Zero runtime dependencies; lockfile-pinned dev deps; `--ignore-scripts`; provenance/SRI on anything published |
| Unsafe codemod on a victim repo | Detect-only default; two-flag apply; journal before write; ambiguity refusal; semantic-trap list (§6) |

**INV-1 dominates:** the scanner never executes repository code — no `require()` of repo files, no loading repo JS config (`next.config.js`, `eslint.config.js`, `postcss.config.js`), no `npx`, no install hooks, no shelling to repo scripts. Config is read as **data** or not at all; violating this turns every hostile repo into code execution on the developer's machine.

**Threats that are live even in a detect-only v0.1:** `TM-09` secret in report · `TM-10` path/PII disclosure · `TM-18` terminal-escape injection through file names/excerpts · `TM-07` ReDoS · `TM-01/05/06` oversized, deeply nested or mis-encoded inputs · `TM-20` walk amplification · `TM-17` repo-code execution · `TM-21` **report text reaching an AI agent as prompt injection** (comments excluded by default; excerpts wrapped in a labelled untrusted-content block; machine formats carry `untrusted: true`; the residual risk is documented, not "solved"). Writes (`TM-14…16`, `TM-24`) are dormant by construction while no codemod ships.

## 9. Summary

1. Detect-only by default; `--fix` alone never writes.
2. No rule claims WCAG conformance; no rule measures LCP/INP/CLS; causes and potential barriers only.
3. Every a11y finding carries a mandatory false-positive note and a manual verification step.
4. Reliability tier and file kinds are declared; the engine refuses findings outside them; tier `c` does not load.
5. Secrets and PII never enter a report; excerpts ≤120 chars, one line; comments off by default.
6. Zero network calls ever, enforced by a patched-network test and an egress-blocked CI job.
7. Zero runtime dependencies; dev deps lockfile-pinned, `--ignore-scripts`, SPDX-expression gated.
8. Any future codemod writes only inside a git repo, only on a clean tree, only after a journal, only for the 3-edit allowlist.
9. Suppression requires a reason; allowlist entries expire; expired entries fail the build.
10. Post-change verification is recorded per command — never run ⇒ `unavailable`, never "pass".

**Unresolved in this layer:** Deque's automated-coverage percentage (**UNVERIFIED**, must not be quoted — the pages are JS-rendered); npm provenance flags and `npm audit signatures` semantics (**UNVERIFIED**); directives ignored in a `<meta>`-delivered CSP (**UNVERIFIED**); the regression corpus's exact repositories and licences; whether output should be SARIF-only, custom-only, or both (D-005 keeps v0.1 to bundled catalog rendering + a custom JSON contract).
