# Upstream capability inventory (integrated)

- **Retrieved:** 2026-11-16 (Asia/Calcutta)
- **Method:** authenticated read-only `gh` CLI + `web_fetch` of primary sources, executed by the `upstream-auditor` agent
- **Detail source:** `research/agents/upstream-auditor/inventory.md` (339 lines, every claim tagged `[F]` observed / `[I]` inferred, each with a URL or `path:line`)
- **Purpose:** the evidence base the gap matrix depends on. This file summarises; it does not replace the detail file.

Repo shorthand: **PUB** = `GoogleChrome/modern-web-guidance` (what agents install), **SRC** = `GoogleChrome/modern-web-guidance-src` (the implementation, linked from PUB `CONTRIBUTING.md`).

---

## 1. Identity

| Field | Value |
|---|---|
| Latest release | `v1.0.1`, published 2026-11-16; commit `64a6d70` |
| Stars / forks | 19,789 / ~772 |
| License file | **Apache-2.0**, 11,358 B, stock text, **no copyright-holder line**, **no `NOTICE`** |
| Additional licence statement | README `## License`: software under Apache-2.0; **`guides/` documentation under CC-BY-4.0**; portions derived from MDN / W3C / WHATWG / IETF |
| Issue tracker | **disabled on PUB**, 411 open issues on SRC |
| Documented docs URL | `https://developer.chrome.com/docs/modern-web-guidance` — the `/docs/ai/…` path in the project brief is **404** |

## 2. Distribution model

A **multi-agent skill bundle plus a Node ≥22 CLI**, wrapped in seven agent-specific manifest sets
(`.claude-plugin`, `.codex-plugin`, `.cursor-plugin`, `.grok-plugin`, `.agents/plugins`, `.github/plugin`, root `plugin.json`),
plus `gemini-extension.json`, `kimi.plugin.json`, and a VS Code `chatSkills` contribution. It is **not an MCP server**.

Thirteen documented install channels (npx, `agy`, Gemini CLI, WebStorm, `gh skill install`, `npx skills`, Claude Code, Codex, Copilot CLI, Goose, Grok, Kimi…).

**Notable structural fact:** PUB ships **zero executable code** — 301 entries, no `.js/.mjs/.ts` — yet `package.json` declares
`bin` → `modern-web.mjs`, which is absent from the tree. The published npm tarball (281 files, 16.7 MB) is assembled at release
time. SRC issue **#3620** independently reports the published `bin` target missing (`MODULE_NOT_FOUND`).

**Consequence for us:** a duplication analysis that reads only PUB would understate upstream; conversely PUB is the
contract users install. We cite both.

## 3. Capabilities

| Capability | Detail |
|---|---|
| Skill packs | 2: `modern-web-guidance` (router skill, mandates search-before-writing) and `chrome-extensions` (MV3 + Web Store) |
| Guide corpus | **210 guides, 17 categories**, plain prose markdown starting `# Title` — **no frontmatter, no dates, no severity, no machine-readable metadata** |
| CLI commands | 11 invocable names: `search`, `list`, `retrieve`, `legacy-scan` (alias `analyze`), `set-baseline` (undocumented), `set-allow-origin-trials`, `set-allow-volatile-features`, `install`, `uninstall`, `update`, plus globals |
| Scanner | **38 registered rule modules**, 4 matcher kinds (`js` via ts-morph AST, `dom`, `css`, `dependency`) |
| Scanner qualification bar | per-rule *"Post-Verifier Precision ≥ 90% and either Static Matcher Precision ≥ 80% at n ≥ 10, or ≥ 90% at n ≥ 5 for rare patterns"* |
| Scanner limits | ≤ 1 MB/file, `maxFiles = 5000` (no flag to raise it — SRC #3596), default excludes docs & tests |
| Finding identity | every finding carries `guideHash` + `cardId` (12 hex chars) |
| Config | `.mwgrc` with 3 keys: `allowOriginTrials`, `allowVolatileFeatures`, `baseline` |
| Telemetry | Google Clearcut, including calling-agent name and search queries; `DISABLE_TELEMETRY=1` opt-out |
| Evaluation | internal harness; reported +28 to +36 pp uplift on three agent CLIs |

### Scanner output shape (`legacy-scan --json`)

`{targetDir, totalFindings, guides[{guideId, retrieveCommand, count, rules[{ruleId, summary, verifierRubric{keepWhen[], dropWhen[]}, count, findings[{file, line, message, lineContent}]}]}], activeRuleCount?, activeGuideCount?, skippedDocsAndTestsCount?, note?, error?}`

Exit codes: `0` = completed **regardless of findings**; `1` = error.

## 4. Observable limitations (each backed by an inspection that could have found the thing)

| # | Limitation | Evidence of absence |
|---|---|---|
| 1 | **No AI-generation provenance signal** | full PUB tree (301) and SRC tree (3,210) searched for `slop\|ai-generated\|provenance\|vibe` → 0 matches; `built-in-ai/` is browser AI APIs |
| 2 | **No severity / priority / confidence** | `AnalyzerFinding`, `AnalyzeJsonOutput` declare no such field; human output is count-only; matches are self-labelled "provisional" |
| 3 | **No codemod / autofix** | `legacy-scan` options are exactly `--json`, `--guide`, `--include-docs-and-tests`, `-h`; `parseArgs strict:true` rejects `--fix`; no `codemod\|autofix\|fixer` path in either tree |
| 4 | **No SARIF / CI output, no fail-on-findings** | `sarif` → 0 matches both trees; docs state CI integrations "currently in development"; exit 0 with findings |
| 5 | **No framework-*idiom* rules** | all 48 rule modules are platform-named; framework support is syntactic parsing only; SRC #3558 defines the charter as `web-feature-ids` + browser-observable evals |
| 6 | **No provenance dates in the distributed artifact** | shipped guides have no frontmatter; `GuideTriage.provenance` exists only in SRC |
| 7 | **No per-finding browser-target gating** | `.mwgrc.baseline` exists but `src/analyzing/cli.ts` imports no `mwgrc`; JSON has no baseline field |
| 8 | **No suppression / accepted-findings baseline** | no `ignore|suppress` path or key; SKILL.md instead instructs the agent to drop false positives by judgement on every run |
| 9 | **Coverage capped and silent** | `maxFiles=5000` unfixable; SRC #3596, #3587 (no parse-error/skip diagnostics) |
| 10 | **Narrow language set** | no `.mdx/.erb/.jinja/.twig/.razor/.hbs` |

## 5. Licence obligations (matters for our originality)

- **Reading for research obliges nothing.** Apache-2.0 §4 attaches to distribution of the Work or Derivative Works.
- **We must not copy** guide bodies, `SKILL.md` text, or rule implementations. Independent factual inventories (names, counts, JSON shapes, flags) are not derivative works.
- **If we ever reused a guide we would owe both** Apache-2.0 (licence copy, modified-file notices) **and** CC-BY-4.0 (attribution to Google Chrome, licence link, indication of changes), plus MDN/W3C/WHATWG/IETF attribution.
- Apache-2.0 §6 grants **no trademark rights**: "Modern Web Guidance", "Chrome" and "Google" must never imply affiliation.
- Combined with §1's missing copyright-holder line and missing NOTICE, the safest and most honest engineering decision is **author every rule from primary sources and cite them**; reuse nothing textual.

## 6. Verification ledger

| Check | Result |
|---|---|
| `git/trees/HEAD?recursive=1` on PUB | 301 entries, `truncated:false` |
| `git/trees/HEAD?recursive=1` on SRC | 3,210 entries |
| PUB extension histogram | 237 `.md`, 14 `.svg`, 11 `.json`, 1 `.png`, 1 `.toml`; **0 code files** |
| `contents/LICENSE` decoded and read line-by-line | stock Apache-2.0, no holder, placeholder intact |
| npm registry `modern-web-guidance/latest` | 1.0.1, 281 files, provenance attestation present |
| Docs pages | `/docs/modern-web-guidance` 200; `/docs/ai/modern-web-guidance` **404** |

**Not inspected (stated, not hidden):** the 210 guide bodies in full (one read end-to-end, deliberately, to avoid wholesale
copying); the exact `QUALIFIED_RULES.length`; `llm-verifier` internals; `src/rag` internals; the 16.7 MB npm tarball; branch list.
