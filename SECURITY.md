# Security policy

## Reporting a vulnerability

**Do not open a public issue for a security problem in S-Eidos itself.**

Use GitHub's private vulnerability reporting on this repository
(**Security** → **Report a vulnerability**), or contact the maintainer listed on the repository
profile. Include:

- what the issue is, and the impact you believe it has;
- the smallest reproduction you can produce;
- the version and the surface (CLI, agent tool, or panel).

You can expect an acknowledgement within a few days. Please give a reasonable window to ship a fix
before public disclosure.

## Scope

S-Eidos is a static analyzer. It reads source files and prints findings. The realistic security
surface is therefore:

| Surface | Risk | Mitigation |
|---|---|---|
| Reading a hostile repository | a crafted file that hangs the scanner (ReDoS, huge file, symlink cycle) | bounded patterns, per-file and total caps, `realpath` containment, cycle detection, generated/minified/binary skips |
| Report contents | a secret from the scanned code reaching a log, an issue, or a model's context | excerpts are one line and bounded, comments stripped, credential-shaped values redacted at construction; tested |
| The agent tool | a model walking a wider tree than intended | explicit paths only; never defaults to the working directory; 16-path cap |
| The panel | a compromised bundle or a malformed catalog | the panel is a static reader of a build-time-frozen catalog; it has no IPC, no network and no write path |
| Supply chain | a compromised dependency | **zero runtime dependencies**, no install scripts; dev tooling only, reviewed in CI |
| Writing to a repository | an unexpected mutation | the only write is `.s-eidos/decisions.json`, only via an explicit `decisions add --yes` |

## Explicitly out of scope

- **Wrong advice.** A finding that is technically incorrect is a correctness bug, not a
  vulnerability. Report it as a normal issue; see `CONTRIBUTING.md`.
- **The security of code that S-Eidos inspects.** S-Eidos reports evidence about a codebase; it
  does not sandbox it, and it does not make an insecure project secure.
- **Conformance.** S-Eidos does not certify WCAG, OWASP or Baseline conformance, and a clean report
  is not a security or accessibility guarantee.

## How S-Eidos protects the people whose code it reads

- It never executes repository code: no `require` of repository files, no config inheritance, no
  `npx`, no shelling out to `git`.
- It never transmits anything: there is no network code in the engine, the tool, or the panel, and a
  test fails the build if one appears.
- It never echoes a whole file: findings carry a single redacted line.
- It never deletes: a suppressed finding stays in the report, counted.

## Supported versions

The project is pre-1.0. Security fixes land on the latest published version; there are no maintained
older branches yet.
