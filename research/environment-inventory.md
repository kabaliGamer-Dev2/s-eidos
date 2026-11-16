# Environment inventory — Stage 0 reconnaissance

- **Retrieved:** 2026-11-16 (Asia/Calcutta)
- **Coordinator:** `lead` (root agent)
- **Workspace:** `C:\Users\KABALI GAMER\Documents\dsh-plugins\MWC`
- **Status:** reconnaissance only. No repository created, no file deleted or renamed, nothing published.

This document records what was **observed**, not assumed. Every row below has a command or a read behind it.

---

## 1. Workspace state

| Observation | Value | How observed |
|---|---|---|
| Working directory | `C:\Users\KABALI GAMER\Documents\dsh-plugins\MWC` | `Get-Location` |
| Directory contents | empty (no files, no hidden files) | `Get-ChildItem -Force` |
| Git repository | **no** — `fatal: not a git repository (or any of the parent directories)` | `git status`, `git rev-parse --show-toplevel` |
| Existing user work at risk | none inside `MWC` | `Get-ChildItem -Force` |
| Parent directory | `C:\Users\KABALI GAMER\Documents\dsh-plugins` | `Get-ChildItem ..` |
| Sibling projects | `opencode-go-session-header/`, `seo-mcp/` | directory listing |

**Conclusion:** the directory is empty and outside version control. Creating a fresh repository here cannot overwrite user work, because there is none. Sibling projects are **read-only reference material** for local convention evidence and must not be modified.

## 2. Applicable instruction files

| Location | Found | Effect |
|---|---|---|
| `MWC` and every ancestor up to `C:\Users\KABALI GAMER` | no `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, or `.editorconfig` | no inherited project instructions to honour |
| `C:\Users\KABALI GAMER\claude-ollama.ps1` | present | unrelated to this workspace; not read, not used |

**Conclusion:** no repository instruction file constrains the layout. The authority for harness behaviour is the installed DeepSeek Harness documentation.

## 3. Host runtime and toolchain (non-mutating checks)

| Tool | Version | Evidence | Relevance |
|---|---|---|---|
| Node.js on `PATH` | `v26.5.1` | `node --version` | usable for repo scripts/CI, **not** the host runtime |
| **DSH embedded runtime** | **Node 24.21.0** | `ELECTRON_RUN_AS_NODE=1 <DSH_NODE_EXECUTABLE> -e "console.log(process.versions.node)"` | the runtime that actually loads plugins |
| npm | `11.17.0` | `npm --version` | dev-only tooling |
| pnpm | `12.4.2` | `pnpm --version` | not required by a dependency-free bundle |
| git | `2.55.0.windows.3` | `git --version` | repository init at Stage 7 only |
| gh | `2.100.0` | `gh --version` | publication only |
| PowerShell | `5.1.26100.9818` (Desktop) | `$PSVersionTable` | **not** `pwsh` 7: no `ProcessStartInfo.ArgumentList`, and `.ps1` execution is blocked by policy |
| TypeScript | not installed; `npx tsc` blocked | see §4 | must be added as a **devDependency** if used |

**Shell constraints observed (these shape every later command):**

- Execution policy refuses unsigned `.ps1` files (`PSSecurityException`), so helper scripts cannot be invoked as files; logic must be inlined in `pwsh -Command` calls.
- Windows Desktop Electron is a GUI-subsystem executable: `&` does **not** reliably wait. Piping `& $env:DSH_NODE_EXECUTABLE ... | Out-String` **does** wait and returns the exit code.
- `ProcessStartInfo.ArgumentList` is unavailable on PowerShell 5.1 (null in `FullLanguage` mode).

## 4. File sandbox and network

| Observation | Value | Effect |
|---|---|---|
| DSH file policy | `workspace-write`; workspace = `...\dsh-plugins\MWC` | writes outside the workspace need approval |
| npm cache location | `%LOCALAPPDATA%\npm-cache` — **outside** the workspace | default `npx`/`npm install` fails with `EPERM` on cache writes |
| npm with workspace-local cache | `npm view typescript version` → `7.0.2` | registry reachable; installs are possible when `npm_config_cache` points inside the workspace |
| Pre-existing failure | `npx --no-install tsc --version` → `EPERM ... npm-cache\_cacache\tmp` | recorded, not a project defect |

**Dependency-policy consequence:** a **zero-runtime-dependency** bundle is the only design that installs and runs without network or cache privileges. Any devDependency (ESLint, Prettier, TypeScript) must be optional for plugin operation and documented as dev-only.

## 5. Harness integration surface (observed, not invented)

| Fact | Value | Evidence source |
|---|---|---|
| DSH version | `@deepseek-ai/dsh@0.2.2-rc.3` | `require(DSH_INSTALL_DIR + '/package.json')` |
| Installation layout | Desktop, packaged `app.asar` | `DSH_INSTALL_DIR` inside `app.asar`; skill base path |
| Profile | `desktop`, dir `C:\Users\KABALI GAMER\.dsh\profiles\desktop` | `DSH_PROFILE`, `DSH_PROFILE_DIR` |
| Profile bundles | `@deepseek-ai/dsh-base`, `@deepseek-ai/dsh-web-app`, `@local/opencode-go-session-header`, `@local/seo-mcp` | `profiles/desktop/package.json` |
| Local plugin install form | `"<name>": "link:<abs path>"` dependency + `dsh.profile.bundles` entry | same file |
| Bundle manifest | `package.json` → `dsh.bundle.patch` → `cordis.patch.yml` | docs + both sibling plugins |
| Client manifest | `dsh.client = { platform, immediately, inject }` + `"./client"` export | `templates/decoration/package.json` |
| Client module format | `window.__ModuleLoader__.load({ id, factory(require) })`, React from host module table | `templates/decoration/client.js` |

### 5.1 Evidence of the two local plugin conventions (read in full)

- `opencode-go-session-header/package.json` — `dsh.bundle.patch`, `exports` incl. `./locale/*.json` and `./icon`, `files` list, `node --test` script.
- `opencode-go-session-header/cordis.patch.yml` — `- insert: [ { id, name, config } ]`.
- `seo-mcp/cordis.patch.yml` — configuration-only bundle inserting `@deepseek-ai/dsh-mcp-client` rows, `!!js` expressions reading `process.env`, `failOnStartupError: false`.

Both agree with the installed documentation, so the convention is **grounded in two independent local implementations plus primary docs**, not guessed.

## 6. The left-sidebar extension point (the user's request)

The request is "a DSH plugin with a left sidebar entry". The observed mechanism is a **global panel**: a row in the sidebar plus the main-column page it opens.

| Element | Observed contract | Source |
|---|---|---|
| Panel row | register into root-scoped list `sidebar.panellist` with `{ id, order?, label: () => t(key), locale }` and an **icon component**; props are `{ size, active }` | `dsh-client-ui-sidebar/README.md` § *Global panel entries*; `src/client/contract/slots.ts:47` |
| Panel page | register into root-scoped **keyed** slot `main` with `{ name: 'main', key: <same id> }` | `dsh-client-ui-plugin-manager/src/client/index.ts:129-149`; `dsh-client-ui-schedule/src/client/index.ts:218-239` |
| Same id in both | "The same id addresses the component registered in the layout's root-scoped `main` keyed slot; selecting a missing main entry **throws**" | `dsh-client-ui-sidebar/README.md` |
| Reference implementations | `plugins` panel (`PluginsPanelIcon`, order 0), `schedule` panel (order 10) | both `src/client/index.ts` files above |
| Locale | `ctx.effect(() => ctx.locale.register(NS, { en, zh, ... }))`, `const t = ctx.locale.bind(NS)` | `dsh-client-ui-plugin-manager/src/client/index.ts:95-96` |
| Selected state | `usePanelInfo(info => info.activePanelId === id)`; `ctx.layout.selectPanel(id)` | `SidebarRoot.tsx:76`, `service.ts:72` |

**Hard UI constraints observed** (`references/practices.md` § UI):

- Never `require('@deepseek-ai/dsh-client-ui-primitives')` or any Harness Client package as a module; write own controls, style only with `--dsw-alias-*` tokens.
- Contribute only through slots; no DOM outside the component, no `document.body` appends, no iframes.
- A throwing component blanks that slot entry.

## 7. GitHub state

| Fact | Value |
|---|---|
| `gh auth status` | logged in to `github.com`, account **`kabaliGamer-Dev2`** (keyring, active), scopes `gist, read:org, repo, workflow` |
| Identity | `gh api user` → login `kabaliGamer-Dev2`, name "Kabali Gamer", type `User` |
| Organizations | none |
| Existing repositories | 11 total (6 public, 5 private); **no** repository concerns front-end pattern detection or web modernization |
| Name collisions | none observed for the candidate names considered so far (`stratum`, `ilter`, `tessera`) |
| Git commit identity | `user.name=kabaliGamer-Dev2`, `user.email=your-email@example.com` (**placeholder**) |

**Token handling:** only the account identity and scopes are recorded. No token, key, or credential is reproduced in this or any later artifact.

**Commit-identity risk:** the configured e-mail is a placeholder. Publishing with it would put an invalid address in public commit metadata. Options must be decided with the user before publication (a GitHub `noreply` address is the proposed default); this is recorded as an open question in the decision log rather than silently changed, because `git config --global` is user state.

## 8. Constraints summary

1. **Zero runtime dependencies** — sandbox and cache privileges make anything else fragile, and the host explicitly supports dependency-free bundles.
2. **Node 24.21.0** is the real runtime; repo scripts must run on it *and* on `PATH` Node 26 for CI portability. Avoid APIs newer than Node 24.
3. **Plain ESM JavaScript** for the runtime. The installed distribution has no TypeScript build step for user bundles, and `link:` installs are not filtered by `files`, so a build artifact would have to be committed. TypeScript, if used at all, is **dev-only** for JSDoc type-checking.
4. **No Harness Client imports** in the browser artifact; React arrives from `window.__ModuleLoader__`.
5. **Verification without browser control is incomplete by definition** — I have Chrome DevTools MCP available and the Web GUI at `http://127.0.0.1:53564`, so the panel can be visually verified *after* installation, which itself mutates the user profile.
6. **Publication requires the explicit checkpoint** in the prompt; nothing is pushed before it.

## 9. Unknowns (must be resolved, not guessed)

| # | Unknown | Planned resolution |
|---|---|---|
| U1 | Exact upstream `googlechrome/modern-web-guidance` contents, license, and coverage | `upstream-auditor` agent, primary URLs |
| U2 | Which official sources are current as of 2026-11-16 | `modern-web-researcher` / specialists, dated citations |
| U3 | Whether `main` keyed registration accepts an arbitrary string id at runtime | two shipped call sites both pass literal string ids cast to `MainPanelId`; verify by installing and observing |
| U4 | Whether a Host plugin may `import '@deepseek-ai/dsh-tools'` without declaring the dependency | docs state shipped packages resolve from the installation; treat as load-time-only, keep tests free of it |
| U5 | Final product name and npm/GitHub collision status | name search before the design checkpoint |
| U6 | Authentic upstream licensing terms (attribution obligations) | license review artifact before any adaptation |

## 10. Proposed workspace layout (safe, additive only)

```text
MWC/
  research/                  # Stage 0–2 evidence artifacts (dated)
    environment-inventory.md
    agents/<specialist>/     # exclusive per-agent ownership
  docs/                      # design, architecture, rule reference, processes
  src/                       # original source (engine, host glue, client panel)
  rules/                     # declarative versioned rule catalog (JSON)
  fixtures/                  # positive/negative code samples per rule
  test/                      # node:test suites
  scripts/                   # repo-local checks (secrets, licenses, links)
  .github/workflows/         # CI, added only after local checks pass
  README.md LICENSE CHANGELOG.md CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md
```

Nothing is created outside `MWC` except the profile entries that `plugin_manager` itself writes, and only with approval.
