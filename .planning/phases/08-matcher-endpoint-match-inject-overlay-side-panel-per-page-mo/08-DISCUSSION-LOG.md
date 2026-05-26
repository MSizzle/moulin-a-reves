# Phase 8: Matcher Endpoint + Match-Inject Overlay + Side Panel + Per-Page Mode - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 08-matcher-endpoint-match-inject-overlay-side-panel-per-page-mo
**Mode:** `--auto` (recommended option auto-selected for each gray area, single pass)
**Areas discussed:** Side panel mount, Match-set storage shape, Confidence treatment, Mode tab/toggle, Anthropic SDK config, Catalog drift UX, Reject reversibility + reason display, Per-page picker scope, Match-inject loader wiring, Cross-tab batch composition

---

## Side panel mount location

| Option | Description | Selected |
|--------|-------------|----------|
| Sibling element on `/feedback.astro` (panel owned by parent page; inject paints pins only) | Cleanest separation; panel scrolls independently; iframe DOM stays clean; corner chip in iframe unchanged | ✓ |
| Inside the iframe via `feedback-match-inject.js` | Pins and panel visually adjacent; but pollutes target page DOM and complicates the OPS-02 fence reasoning | |
| Floating overlay anchored to iframe edge | Visually similar to (1) but harder to make responsive; loses scroll independence on long lists | |

**Auto-selected:** Sibling element on `/feedback.astro` (recommended).
**Notes:** Aligns with the additive-only fence philosophy — match-inject's responsibility is "paint pins + relay events"; everything else lives on the parent page where it's easier to test and style.

---

## Match-set sessionStorage shape

| Option | Description | Selected |
|--------|-------------|----------|
| Single object keyed `mar_feedback_match_set_v1` (latest wins), parallel `rowStates[]` | Simplest; matches "newest round wins" project decision; one match set per session in practice | ✓ |
| Multiple match sets keyed by match-set ID (history) | Allows tab-back UX; adds complexity for a flow the client uses linearly | |
| Two keys — match data + row states separate | Cleaner separation but two reads/writes per Approve | |

**Auto-selected:** Single object, latest wins (recommended).
**Notes:** Matches the v1.1 project-wide "newest round wins" decision and keeps the storage idiom consistent with `mar_feedback_staged_v1`.

---

## Confidence treatment in the panel

| Option | Description | Selected |
|--------|-------------|----------|
| Display only — three-tier color pill, never gates Approve | Respects the "no auto-approve" non-goal; gives the client a quick scan signal | ✓ |
| Auto-flag low confidence (< 0.6) with a hard warning blocking Approve | Safer but violates the "user always reviews" principle and adds friction for legitimate-but-paraphrased edits | |
| Numeric only, no color | Lowest visual noise but harder to scan a long list quickly | |

**Auto-selected:** Display-only with three-tier color pill (recommended).

---

## Mode tab/toggle UI + default

| Option | Description | Selected |
|--------|-------------|----------|
| Two-tab segmented control, default = per-element, URL hash for state | Lowest surprise vs shipped v1.1; deep links work; storage isolation per MODE-04 | ✓ |
| Toggle switch (binary), default = per-page | Flatter UI but inverts the client's existing mental model | |
| Mode picker dropdown | Three-options friendly but only two modes exist | |

**Auto-selected:** Two-tab segmented, per-element default, hash state (recommended).

---

## Anthropic SDK call configuration

| Option | Description | Selected |
|--------|-------------|----------|
| Forced tool use (`tool_choice: { type: 'tool', name: 'match_edits' }`), temp 0, one retry | Most reliable structured output for nested arrays; deterministic; bounded retries | ✓ |
| JSON mode (`response_format: { type: 'json_object' }`) | Works but less strict on nested array shape; more parse failures | |
| Free-form output + post-parse | Cheapest token-wise but unreliable; needs regex/repair logic | |

**Auto-selected:** Forced tool use + temp 0 + one retry (recommended).
**Notes:** Token budget capped per `max_tokens: min(8192, 64 + 96 * lineCount)`. Timeout 25s under Vercel's 30s function budget.

---

## Catalog drift / buildSha mismatch UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inject paints no pins + posts `matchset-stale` to parent; panel shows banner + Re-run button | Explicit user action; matches the v1.2 "no invisible work" decision; safe under deploy races | ✓ |
| Auto re-run on detection | Invisible work; risks double-charging Anthropic if the user is about to navigate away | |
| Hard error — block the panel until refresh | Safer but loses the editList; bad UX after a deploy | |

**Auto-selected:** Inject silent + parent banner + manual Re-run (recommended).

---

## Reject reversibility + reason display

| Option | Description | Selected |
|--------|-------------|----------|
| Rejected rows in collapsible "Rejected (N)" section with Restore button; reason inline below alternates, truncate-with-expand at 120 chars | Implements PANEL-04 literally; always-visible reasons help client learn; reversible by design | ✓ |
| Reject is destructive (no Restore); reason tooltip-only | Cleaner panel but loses PANEL-04 and forces full re-run for misclicks | |
| Reject reversible but reasons hidden behind a "Why?" button | Less clutter but adds a click to debug bad matches — bad ergonomics for Monty when iterating | |

**Auto-selected:** Collapsible Rejected section + Restore + always-visible reason (recommended).

---

## Per-page picker scope

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse existing `pagePick` `<select>` unchanged; HEAD-probe catalog availability and disable Match button on 404 | Zero new picker code; explicit "not catalogued" hint avoids wasted Anthropic calls | ✓ |
| New search-friendly combobox | Overkill for ~10 marketing routes | |
| Filter `pagePick` down to only catalogued routes at build time | Cleaner UI but requires plumbing the catalog manifest into `feedback.astro` at build | |

**Auto-selected:** Reuse `pagePick` + HEAD-probe + disable on 404 (recommended).

---

## Match-inject loader wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Sibling conditional block in `BaseLayout.astro`'s `?feedback=1` loader: load `feedback-match-inject.js` ONLY when `matchSet` query param is present | Preserves OPS-02 (existing block byte-identical); minimum surface area in the layout | ✓ |
| Single loader that always loads both injects when `?feedback=1` | Simpler logic but wastes a network round-trip on per-element flow | |
| Separate `?match=1` query flag (decoupled from `?feedback=1`) | Cleaner conceptually but breaks the auth model (per-page mode is auth-gated by the same `?feedback=1` plumbing) | |

**Auto-selected:** Sibling conditional + `matchSet` query trigger (recommended).

---

## Cross-tab batch composition (Success Criterion 4)

| Option | Description | Selected |
|--------|-------------|----------|
| Approve writes to `mar_feedback_staged_v1` using the same v2 shape `captureLocator+submitBatch` produces today; the v1.1 corner chip's batch read is unchanged | Yields the exact "3 per-page approves + 1 per-element click → 4-edit batch on Submit" behavior required by Success Criterion 4 | ✓ |
| Per-page mode writes to a parallel key; Submit batch merges both keys | More complex; touches `submit.ts` (fenced) | |
| Per-page mode goes through its own Submit endpoint | Two endpoints to maintain; defeats the OPS-02 fence | |

**Auto-selected:** Write through to `mar_feedback_staged_v1` with the v2 shape (recommended).

---

## Claude's Discretion

- Wave breakdown (server first vs client first), file ordering within plans, and per-plan test coverage — left to `/gsd-plan-phase 8`.
- Exact CSS / BEM class names for the new side panel — re-use existing design tokens; implementer's call.
- Whether the panel header sticks to viewport top on long match lists — not load-bearing for correctness.

## Deferred Ideas

- Auto-approval at high confidence (already a non-goal in REQUIREMENTS.md).
- Mobile-specific UI for per-page review mode (non-goal).
- Persisting freeform edit list beyond browser close (non-goal — sessionStorage scope only).
- Webhook-driven push for catalog updates (non-goal — fresh per request).
- Multi-page per-batch matching (future milestone).
- Editing the v1.1 inject to share state (permanently fenced by OPS-02 / OVERLAY-05).
- Per-row "Why this match?" modal or sidebar drill-down (v1.4+ idea).
- Persisting Rejected (N) decisions across browser close (non-goal — sessionStorage only).
- Phase 9 canary script + final OPS-02 byte-for-byte fence assertion (handled by `/gsd-discuss-phase 9`).
