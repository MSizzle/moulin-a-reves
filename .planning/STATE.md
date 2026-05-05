---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Phase 2 plan 01 (copy edits) complete — COPY-01..COPY-15 shipped (11 commits + 4 verify-only)
last_updated: "2026-05-05T21:00:00.000Z"
last_activity: 2026-05-05 -- Phase 2 plan 01 (copy edits) complete — 15 requirements shipped
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 2
  completed_plans: 2
  percent: 40
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-05)

**Core value:** Convey the compound's atmosphere convincingly enough to convert visitors into bookings and direct inquiries.
**Current focus:** Phase 2 in progress — plan 02-01 (copy edits) complete; plans 02-02 (typography), 02-03 (sections), 02-04 (photos) queued

## Current Position

Phase: 2 of 3 (Ship-the-Clear Edits) — IN PROGRESS
Plan: 1 of 4 in current phase — COMPLETE (02-01 copy edits)
Status: Plan 02-01 complete — 11 commits landed, 4 verify-only confirmed; ready for plan 02-02 (TYPOG)
Last activity: 2026-05-05 -- Phase 2 plan 01 (copy edits) complete — 15 requirements shipped

Progress: [████░░░░░░] 40%

## Performance Metrics

**Velocity:**

- Total plans completed: 2
- Average duration: ~37 min
- Total execution time: ~1.25 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 1 | ~50 min | ~50 min |
| 2 | 1 | ~25 min | ~25 min |

**Recent Trend:**

- Last 5 plans: 02-01 (copy edits, 15 requirements, 11 commits + 4 verify-only, ~25 min); 01-01 (audit & inventory, 92 bullets, ~50 min)
- Trend: Plan-execution time scales with code-edit count, not requirement count. Verify-only tasks add minimal overhead.

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Newest round wins: May 5 feedback overrides April 30 / May 1 contradictions; contradictions still flagged in clarification doc.
- Code-deep audit: Required because client re-flags already-shipped items; audit must cite file+commit for done items.
- No new branches per phase: All work on `feat/may-5-2026-photos` branch; atomic commits per category.
- Defer structural work: Gallery modal, calendar 12-month, editor flow audit all deferred to Milestone 2.
- AUDIT.md is the contract: Phase 2 and Phase 3 read AUDIT.md (and `_audit-bullets.json` for structured iteration); neither phase needs to re-read the source PDF.
- COPY-01 partial discovery: "When You Can Stay" was renamed in `.astro` files (commit `0ef4dc8`) but per-house translations.json keys still serve old text. Phase 2 must update runtime overlay AND typed seed.
- 4 commits the client probably hasn't noticed: `ad07395` (about/history), `fd8e979` (wellness), `8bd51b9` (catering), `182b810` (explore photos) — Phase 3 surfaces these in "Already Done — please re-review" section.
- Plan 02-01 — italic-span removal scoped to data layer only: COPY-01 strips `<span class="serif-italic">` from translations.json/translations.ts availability headings, but the same italic markup in the 5 AvailabilityCalendar component invocations (`heading={\`Join <span class="serif-italic">us</span>\`}`) is intentionally deferred to plan 02-02 (TYPOG-01) per the COPY-01 task spec.
- Plan 02-01 — i18n dual-store drift discovered and reconciled: home.tagline, home.homes.subheading, compound.stats.houses, and per-house availability headings all had different values across translations.json vs translations.ts. Each was synchronized as part of its requirement task. Future i18n work must always touch both stores.
- Plan 02-01 — empty-string deletion preferred over key removal: home.homes.subheading and home.stats.intro are now `""` rather than removed, to keep dashboard/editor compatibility.

### Pending Todos

- Phase 2 plan 02 (TYPOG) — TYPOG-01..TYPOG-03 italic removal + font consolidation (5 AvailabilityCalendar component invocations carry the deferred italic-span removal from COPY-01).
- Phase 2 plan 03 (SECT) — SECT-01..SECT-08 structural removals.
- Phase 2 plan 04 (PHOTO) — PHOTO-01..PHOTO-03 photo swaps + hero CSS.
- Phase 3 (CLIENT-CLARIFICATION.md) — compile 29 ❓ rows + 1 ⚠️ + ≥18 ✅ acknowledgements into client-readable Markdown grouped by page.

### Blockers/Concerns

- Photo-source assets: Some requested photo swaps (PHOTO-01 ✅ done; PHOTO-02 needs maison-dinner-light.webp confirmation). Asset-pending items: jacuzzi photos, Stars Who Stayed Here photos, biking photos, Monet Giverny image, Netflix-on-TV decision — all flagged in AUDIT.md as ❓.
- i18n dual-update: Every copy change must land in both the `.astro`/`.md` inline strings AND `public/i18n/translations.json` (runtime overlay); forgetting one leaves the FR toggle broken. Several existing partial-shipments (e.g., COPY-01) were caused by exactly this oversight.
- TYPOG-01 universal policy: client wants italic-on-final-word removed for listed cases (stay, Maisons, Rêves, Where you'll sleep/gather, etc.) but hasn't confirmed whether to apply globally. Phase 2 ships listed cases; Phase 3 asks the global policy question.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Gallery modal | Fix X-button, forward arrow, bottom crop (all houses) | v2 | Milestone 1 init |
| Calendar | Extend scrollable range to 12 months | v2 | Milestone 1 init |
| Editor flow | Deep audit of fragile publish/save paths | v2 | Milestone 1 init |
| Google Maps | Active embed in Getting Here section | v2 pending client | Milestone 1 init |
| Groups page | New top-level page | v2 pending client | Milestone 1 init |

## Session Continuity

Last session: 2026-05-05T21:00:00.000Z
Stopped at: Phase 2 plan 01 complete — copy edits shipped; ready for plan 02-02 (TYPOG)
Resume file: .planning/phases/02-ship-the-clear-edits/02-01-SUMMARY.md
