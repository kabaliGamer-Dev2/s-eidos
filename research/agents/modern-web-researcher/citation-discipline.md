# Citation Discipline — evidence rules for the compatibility knowledge base

**Owner:** modern-web-researcher · **Retrieved:** 2026-11-16 · **Status:** normative for any claim the tool emits
**Companion:** `compatibility-matrix.md` (the data this discipline governs).

A recommendation is only as trustworthy as the weakest citation behind it. These rules exist so that a wrong or stale citation **degrades the output** (downgrades confidence, blocks the recommendation) instead of silently producing confident advice.

---

## 1. What counts as authoritative

| Tier | Sources | May be used for | May **not** be used for |
|---|---|---|---|
| **A — Primary data** | MDN browser-compat-data (JSON, not prose); web-platform-dx `web-features` data; webstatus.dev API; WHATWG/W3C/TC39/CSSWG specs | Version numbers, `partial_implementation`, `version_removed`, flags/prefixes, Baseline status + dates, "is this specified" | Runtime behaviour, performance, a11y |
| **B — First-party prose** | web.dev Baseline pages, MDN guides, Chrome Platform Status, WebKit release notes / standards-positions, Firefox release notes, framework official docs | Policy definitions, rationale, "shipped in X", deprecation intent | Numbers that must be exact across engines (prose lags) |
| **C — Aggregators** | caniuse (including its `notes_by_num`), Browserslist's Baseline resolver | Cross-check, flag/disabled-by-default detection, "why does Safari say no" | Sole source for a version claim |
| **D — Not evidence** | blog posts, Stack Overflow, AI summaries, npm READMEs, "State of JS"-style surveys, our own prior output | Nothing. May appear only as *leads* to be traced to A/B | Anything in a `support` field |

**Two-source rule.** Every row needs ≥1 Tier A source for the *version* and 1 source of a *different* class (A or B) for the *status*. A dashboard may never be both — it is derived from the same BCD it would be "confirming".

**Never assert a version you did not read.** If the cell was not read, it is `UNVERIFIED`. `UNVERIFIED` is a legitimate, shippable value; a guessed number is not.

---

## 2. The record (one per feature, per definition)

```jsonc
{
  "feature_key": "popover",                    // stable id == web-features id where one exists
  "label": "Popover API",
  "definition": {
    "kind": "feature",                          // "feature" | "bcd_entry"
    "source": "web-features:popover",
    "granularity_note": "API + attribute + top-layer behaviour"   // REQUIRED when kind=="bcd_entry"
  },
  "support": {                                  // version_added per engine; null == not implemented
    "chromium": { "version": "116", "date": "2023-08-15" },
    "firefox":  { "version": "125", "date": "2024-04-16" },
    "webkit":   { "version": "17",  "date": "2023-09-18" },
    "webkit_ios": { "version": "18.3", "date": "2025-01-27" },  // iOS floors differ from macOS
    "node":     { "version": null, "status": "UNVERIFIED" }
  },
  "baseline": { "status": "newly", "low_date": "2025-01-27", "high_date": null },
  "qualifiers": {                               // any of these forces a "partial" verdict
    "partial_implementation": [],               // [{engine, from, to, note}]
    "prefixed": [], "flag_required": [], "removed": []
  },
  "detection": { "idiom": "'popover' in HTMLElement.prototype", "runnable": true },
  "fallback": "dialog+showModal or JS overlay",
  "risks": ["iOS floor 18.3", "light-dismiss differs"],
  "citations": [
    { "tier": "A", "url": "https://api.webstatus.dev/v1/features/popover",
      "http_status": 200, "content_hash": "sha256:…", "retrieved": "2026-11-16",
      "verified_fields": ["baseline.status", "support.*.version"] },
    { "tier": "A", "url": "https://html.spec.whatwg.org/multipage/popover.html",
      "http_status": 200, "content_hash": "sha256:…", "retrieved": "2026-11-16",
      "verified_fields": ["spec"] }
  ],
  "confidence": "H",
  "retrieved": "2026-11-16",
  "reviewBy": "2027-02-16",
  "open_questions": []
}
```

Required: `feature_key`, `definition`, `support.*.version` (or `null`), `baseline.status`, `citations[]` (≥2, different classes), `confidence`, `retrieved`, `reviewBy`. A record failing this is not publishable.

---

## 3. Expressing "supported from version X"

Allowed sentence forms (and only these):

| Intent | Form | Rendered as |
|---|---|---|
| Exact first version, read | `version_added` → `"116"` | "Chromium 116 (2023-08-15)" |
| Exists but version unread | `null` + `status: "UNVERIFIED"` | "Chromium: supported, version UNVERIFIED" |
| Not implemented | `null` + `status: "absent"` | "WebKit: not implemented" |
| Behind a flag | `flag_required: true` | "Safari: behind the Experimental WebKit Features flag — assume absent" |
| Prefixed only | `prefixed: "webkit"` | "WebKit only via `-webkit-` prefix until <version>" |
| Partial range | `partial_implementation: [{from, to, note}]` | "Chrome 112–119 partially — <note>. Fully supported from 120." |
| Removed | `version_removed` | "Supported 16.5–17.1, removed in 17.2" |

**Forbidden phrasings:** "supported by modern browsers", "all evergreen browsers", "works everywhere", "since 2021" (year without version is not a claim), "~95% support" (no source), "should work".

**Ranges are never collapsed.** If any engine has a partial range, the row's `support` must carry the range; a bare "yes" is a data-loss bug.

**Dating rule.** Version *and* release date travel together. A version without a date cannot be used to compute `widely` (which is date arithmetic).

**Granularity rule.** Store the definition, not just the name (§5 of the matrix: `color-scheme` = BCD Chrome 81 vs feature Chrome 98). When a `bcd_entry` is used, `granularity_note` is mandatory so the UI can say *what* is supported.

**Baseline arithmetic.** `newly` ⟺ every core engine has `version_added != false`. `widely` ⟺ `low_date + 30 months ≤ today`. Never hand-write a `low_date`; copy it from `web-features`/webstatus or omit the claim. If you compute it, label it `(derived)` and cap confidence at **M**.

---

## 4. Staleness model

Three states, computed from `retrieved` + `reviewBy`:

| State | Condition | What the tool may do |
|---|---|---|
| **fresh** | `now < reviewBy` | Cite normally |
| **aging** | `reviewBy ≤ now < reviewBy + grace` (grace = 50% of TTL) | Cite, but append "verify before migration" and show `retrieved` date |
| **stale** | `now ≥ reviewBy + grace` | **Block** the recommendation. Emit "evidence expired on `<reviewBy>`" and the row is excluded from ranking, not just footnoted. |

`TTL = reviewBy − retrieved`. TTLs are policy, chosen for how fast the underlying fact can change:

| Volatility class | Examples | TTL | Rationale |
|---|---|---|---|
| `shipping` | any per-engine version, `baseline.status`, caniuse entry | **30 days** | Engines ship on short, overlapping cycles; a version floor can move under us at any time. |
| `policy` | Baseline definitions, core browser set, Browserslist query syntax | **180 days** | Slow-moving editorial policy, but wording has changed before. |
| `spec` | WHATWG/W3C/TC39 text | **180 days** | Can change silently; check that the anchor still exists. |
| `vendor_intent` | release notes, deprecation announcements, standards-positions | **90 days** | Officially amended after publication more often than expected. |
| `framework` | framework docs (React/Next/Vue) | **60 days** | Docs are versioned independently of the platform. |
| `derived` | anything computed by us | **inherit the shortest input TTL** | A derived fact is never fresher than its stale input. |

Two extra lifetime rules:
- **Baseline `low_date` is immutable but its *status* is not.** A row can be `newly` today and `widely` next quarter. Store `low_date` as a fact; recompute `status` at read time from `low_date`, never cache the badge string.
- **Usage/interop numbers decay fastest.** WPT scores and usage shares are snapshot opinions, not properties of the feature. Always display them with their retrieval date or omit them.

---

## 5. Detecting that a cited URL changed or died

Run on a schedule (per class TTL) and before publishing any report. Pseudocode:

```text
for each citation c:
  r = GET c.url (follow redirects, 15s timeout, 2 retries with backoff)
  if r.status in {404, 410}:                     -> c.state = "DEAD"
  else if r.status in {301, 302, 307, 308} and final_url != c.url:
                                                     c.state = "MOVED"; c.final_url = final_url
  else if r.status >= 500 or timeout:            c.state = "UNREACHABLE"   // retry later, do NOT mark dead
  else:
      text = extract_main_text(r.body)            // strip nav/footer/scripts
      if c.anchor and anchor not in r.body:       c.state = "ANCHOR_MISSING"
      else if sha256(normalize(text)) != c.content_hash: c.state = "CHANGED"
      else:                                        c.state = "OK"
```

Normalisation before hashing: collapse whitespace, strip timestamps/CSRF tokens/session ids, drop the site chrome. Without it, every fetch looks "CHANGED" and the signal is worthless.

Response handling:

| State | Action |
|---|---|
| `OK` | refresh `last_checked`; keep confidence |
| `CHANGED` | set `needsReview: true`; **downgrade confidence one step** immediately, before a human looks. Auto-diff the fields in `verified_fields` if the source is structured (BCD/webstatus JSON) — a field-level diff is reviewable, a page diff is not. |
| `MOVED` | update URL, keep hash, log the redirect. Never silently accept a redirect to a *different product page* — verify the new page still supports the claim. |
| `ANCHOR_MISSING` | treat as `CHANGED`; the specific claim's anchor is gone even if the page lives. |
| `DEAD` | remove the citation → if the record falls below 2 citations, the record becomes `UNVERIFIED` and **every recommendation depending on it is blocked**, not merely warned. |
| `UNREACHABLE` | no state change (network ≠ evidence change); surface as "last verified <date>". |

**Rules that make this safe:** (a) a blocked row must never be replaced by a "best guess" from the model's memory; (b) any record whose *primary* Tier-A citation is `DEAD`/`CHANGED` loses the right to state a version until re-read; (c) log every state transition with a reason so a reviewer can audit what changed under them.

---

## 6. Conflict resolution

When two Tier A/B sources disagree, do **not** average, and do not pick the more convenient one. Procedure:

1. **Check granularity first.** Most "conflicts" are different definitions (`color-scheme` 81 vs 98). Resolve by naming the definition; store both if both are useful.
2. **Check the self-consistency signal.** `top-level-await` reports Safari 27 while its own WPT field reports Safari score 1.0. An engine does not score 100% on an unimplemented feature → the claim is suspect. Mark the field `UNVERIFIED`, cite both, and record the anomaly.
3. **Prefer the more specific source for the fact type**: BCD for `version_added`, vendor release notes for "shipped", web-features for `baseline.status`, spec for "is this UA-discretionary".
4. **If still unresolved:** confidence `✗`, `open_questions` entry with both values and both URLs, and the feature is excluded from automatic recommendation (it may still be shown as "needs manual verification").

Unresolved conflicts must never be rendered as a single confident number.

---

## 7. Confidence rubric (gates output, not just labels)

| Level | Definition | Tool behaviour |
|---|---|---|
| **H** | Version + status read from Tier A; two source classes agree; `fresh`. | May recommend. |
| **M** | One input is `(derived)` (e.g. status computed from `low_date`), **or** a C-tier cross-check, **or** `aging`. | May recommend only with an explicit fallback + `retrieved` shown. |
| **L** | Single source, or a range/partial nuance not fully modelled, or one citation stale. | May *suggest*; must be labelled "unverified" and must not be auto-applied (no codemod). |
| **✗** | `UNVERIFIED`, conflict, or required citation dead. | Must not recommend. Display as an open question. |

`allowedRisk` in the project declaration (§1.5.1 of the matrix) caps this: `low` ⇒ only H rows with a documented fallback; `medium` ⇒ H/M; `high` ⇒ H/M/L but never ✗.

---

## 8. Anti-patterns (each is a defect, file it as a bug)

1. **"Modern and supported"** with no version, no date, no fallback.
2. **Citing the feature dashboard as proof of a version** when the dashboard is itself derived from BCD (circular).
3. **Citing a spec as availability.** "Per the CSS spec, `@starting-style`…" proves nothing about engines.
4. **Hiding partial support** — "`nesting` is supported in Chrome since 112" (partial until 119).
5. **Dropping the removal range** — "supported in Safari 16.5+" when the implementation was *replaced* in 17.2.
6. **Treating `mirror` as a version.** BCD `"chrome_android": "mirror"` is an inheritance pointer, not a number.
7. **Percentages without provenance.** "97% of users can use this" with no source, date, or definition of "users".
8. **Perpetual `reviewBy`.** Extending a date without re-reading the source. (`reviewBy` moves only on a successful `OK` check that re-validated the fields.)
9. **Silent fallback substitution.** Recommending `structuredClone` and calling `JSON.parse(JSON.stringify(x))` equivalent — it is not (loses `Date`/`Map`/`Set`/cycles).
10. **Tool-level blank checks.** "This is Baseline, therefore safe" — MDN states Baseline is not a quality guarantee.

---

## 9. Machine-checkable invariants (CI)

Fail the build if any record violates these:

```
1. citations.length >= 2 AND distinct tiers/classes >= 2
2. every support.*.version is a string, null+status, or "UNVERIFIED"   (no floats, no ranges-as-strings)
3. baseline.status in {widely, newly, limited} and (status=="widely" => low_date != null)
4. widely => low_date + 30 months <= today          # recomputed, never trusted
5. retrieved <= reviewBy, and reviewBy - retrieved <= TTL(volatility_class)
6. partial_implementation non-empty => confidence <= "M" and fallback != null
7. flag_required non-empty => rendered support string contains "flag"
8. detection.runnable == false => recommendation is "build-time" and no codemod is generated
9. any citation.state in {DEAD, CHANGED, ANCHOR_MISSING} => confidence <= "M"; DEAD => blocked
10. definition.kind == "bcd_entry" => definition.granularity_note present
11. no free-text support string may contain "modern", "evergreen", "everywhere", "all browsers"
12. conflicts open => confidence == "✗" and feature excluded from auto-apply
```

---

## 10. Reviewer checklist (per PR touching the knowledge base)

- [ ] Every changed number traces to a URL in `citations[]` with a `retrieved` date.
- [ ] `retrieved` bumped on **every** source re-read, even if the value did not change.
- [ ] `reviewBy` moved only after a real `OK` check, and TTL matches the volatility class.
- [ ] Partial/flag/prefixed/removal qualifiers preserved verbatim from the source note.
- [ ] Any `UNVERIFIED` cell is visible in the rendered output — not silently blank.
- [ ] Trap list reconsidered: does this change make any of the 18 traps safer or newly dangerous?
- [ ] If a recommendation is added, it states target preset + detection idiom + fallback in the same sentence.
