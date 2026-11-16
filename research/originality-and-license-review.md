# Originality and licence review

- **Retrieved / reviewed:** 2026-11-16 (Asia/Calcutta)
- **Decision owner:** user (final licence and name); coordinator (recommendation and evidence)

---

## 1. What we may not do

| Constraint | Source |
|---|---|
| Do not copy upstream guide prose, `SKILL.md` text, or rule implementations | Apache-2.0 §4 attaches only on distribution, but the project premise forbids derivation; and the guide corpus is additionally stated as **CC-BY-4.0** |
| Do not imply affiliation, endorsement, or authorship by Google, Chrome, or upstream maintainers | Apache-2.0 §6 grants **no trademark rights** |
| Do not reuse the upstream identity strings | `Modern Web Guidance`, `MWG`, `web_guidance_*`, `modern-web-guidance`, `Guidance Insights`, `/guidance-*` |
| Do not reproduce the DSH port's identity or architecture cinematically | `dsh-modern-web-guidance`, its panel name, its command names, its 208-guide corpus |

## 2. What we do instead (attribution posture)

- **Every rule is authored from a primary source** (MDN, web.dev, WHATWG/W3C/TC39, react.dev, nextjs.org,
  typescriptlang.org, OWASP, browser vendor docs) and cites it with a retrieval date. No upstream text is reused.
- Upstream and the DSH port are cited **as adjacent work in the README and docs**, explicitly as *inspiration and
  ecosystem context*, with a non-affiliation statement. Citing a project is not derivation.
- A **`NOTICE.md`** will state: no third-party code or prose is bundled; rule text is original; all external claims are
  cited by URL; upstream projects are named for context only.
- If a future version ever vendors any guide text, that change must satisfy **both** Apache-2.0 and CC-BY-4.0 plus
  MDN/W3C/WHATWG/IETF attribution. This is recorded as a hard gate, not a note.

## 3. Name selection

### Collision checks performed (2026-11-16)

**Working title, discarded.** The first candidate set was `verdigris`, `anachron` and `chronolint`; all three were
available, and `verdigris` was the coordinator's recommendation. **The user rejected it** and specified the naming
scheme: the name must begin with `S-` (for Shiva) followed by a Greek word that means something about the project.

**Final candidates under that scheme** (all `S-<Greek>`, all checked 2026-11-16):

| Candidate | Greek | npm | `github.com/kabaliGamer-Dev2/<name>` | Meaning |
|---|---|---|---|---|
| **s-eidos** | εἶδος | unpublished (E404) | available (404) | *form, shape, kind* — the root of "eidetic"/"idea"; a pattern is a form |
| s-kriterion | κριτήριον | unpublished (E404) | available (404) | *the standard by which a claim is judged* |
| s-elenchos | ἔλεγχος | unpublished (E404) | available (404) | *cross-examination of a claim* (the Socratic test) |
| s-aletheia | ἀλήθεια | unpublished (E404) | available (404) | *truth, unconcealment* |
| s-tekmerion | τεκμήριον | unpublished (E404) | available (404) | *sure evidence, proof* |
| s-axiom | ἀξίωμα | unpublished (E404) | available (404) | *that which is thought worthy* |

### Chosen: **S-Eidos**

Why it works:

- **It keeps the user's required form** — `S-` for Shiva, followed by a Greek word — without inventing a hybrid.
- **The meaning is the mechanism.** εἶδος is *form*: a pattern is a form, and recognising a form is exactly what
  detection does. The citation is how the tool earns the right to call something a defect, which gives the product its
  thesis sentence: *age is not the defect, and a shape alone is not a verdict.*
- **Distinct** from `modern-web-guidance`, `Chrome`, `Google`, `Guidance Insights`, `dsh-modern-web-guidance`: no
  substring, no phonetic overlap, and none of the "web"/"modern"/"lint" cluster.
- Free on npm and free as a repository name under the authenticated account, so nothing must be renamed later.

Risks, stated: the hyphenated form is unusual to type, and the Greek root is not self-evident to every reader — both
mitigated by the README and the panel subtitle stating the etymology in one line.

**Status:** confirmed by the user's naming instruction; the coordinator re-checked availability immediately before
publishing.

## 4. Licence recommendation: **MIT**

### Reasoning

| Factor | Assessment |
|---|---|
| Do we bundle third-party code? | **No.** Zero runtime dependencies; no vendored guides; no upstream source. A permissive licence is therefore legally uncomplicated. |
| Do we need a patent grant? | No identified patent surface for a static text analyzer. Apache-2.0 would add one, at the cost of NOTICE maintenance. |
| Do we need licence compatibility with the ecosystem? | The host (Apache-2.0), the upstream (Apache-2.0), and the DSH port (Apache-2.0) are all Apache-2.0. MIT is one-way compatible *into* Apache-2.0 works, so anyone may combine ours with theirs. |
| Adoption friction | MIT is the lowest-friction choice for a dev tool and needs no per-file headers. |
| Copyleft obligations | None created, none inherited. |

### Options considered and rejected

| Licence | Why not |
|---|---|
| Apache-2.0 (matching upstream) | The brief's premise is that we must not default to Apache-2.0 merely because upstream uses it. It adds NOTICE obligations and per-file modification notices we do not need, and would visually imply derivation. |
| MPL-2.0 | File-level copyleft adds obligations for contributors with no benefit to a standalone tool. |
| AGPL-3.0 / GPL-3.0 | Would forbid use inside most commercial toolchains and is incompatible with the "usable by any agent environment" goal. |
| Unlicensed / source-available | Not "public" in any meaningful sense; contradicts the brief. |

**Decision recorded in `research/decision-log.md`. The user confirms the licence at the publication checkpoint.**

## 5. Content-originality checklist (must remain true at release)

- [ ] No file copied from, or paraphrased line-by-line from, `GoogleChrome/modern-web-guidance*` or `metapeka/dsh-modern-web-guidance`
- [ ] No guide body, no `SKILL.md` text, no rule implementation, no rule id namespace (`ls-NN`, `web_guidance_*`) reused
- [ ] Every rule's evidence URL resolves and is a primary source, with a retrieval date recorded
- [ ] README states independent development and non-affiliation
- [ ] `NOTICE.md` present, stating the no-bundled-third-party-content posture
- [ ] No Google/Chrome/MDN logo, wordmark, or brand colour borrowed
- [ ] Product name, package name, panel name, tool names and command names are ours and are used consistently
- [ ] Dependency tree contains no runtime dependencies at all (so no third-party licence ships in the package)
