---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Phase 2 complete — all 4 plans shipped (COPY/TYPOG/SECT/PHOTO); ready for Phase 3 (CLIENT-CLARIFICATION.md)
last_updated: "2026-05-05T22:25:00.000Z"
last_activity: 2026-05-05 -- Phase 2 plan 04 (photos) complete — 3 PHOTO requirements addressed (PHOTO-01 verify-only, PHOTO-02 + PHOTO-03 commits); Phase 2 100% shipped
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 5
  completed_plans: 5
  percent: 83
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-05)

**Core value:** Convey the compound's atmosphere convincingly enough to convert visitors into bookings and direct inquiries.
**Current focus:** Phase 2 COMPLETE — all 4 plans shipped (COPY/TYPOG/SECT/PHOTO); ready for Phase 3 (CLIENT-CLARIFICATION.md)

## Current Position

Phase: 2 of 3 (Ship-the-Clear Edits) — **COMPLETE**
Plan: 4 of 4 in current phase — COMPLETE (02-04 photos)
Status: Plan 02-04 complete — 2 commits landed (`10c9007` PHOTO-02 maison dining lead swap, `ae76a67` PHOTO-03 HH hero centering + house CTA overlay reduction); PHOTO-01 verify-only (hh-patio.webp confirmed as the patio-breakfast shot already). Phase 2 100% shipped: 19 commits + 7 verify-only across 26 requirements (15 COPY + 3 TYPOG + 8 SECT + 3 PHOTO). Ready for Phase 3.
Last activity: 2026-05-05 -- Phase 2 plan 04 (photos) complete — 3 PHOTO requirements addressed; Phase 2 100% shipped

Progress: [████████▎░] 83%

## Performance Metrics

**Velocity:**

- Total plans completed: 5
- Average duration: ~29 min
- Total execution time: ~2h 25 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 1 | ~50 min | ~50 min |
| 2 | 4 | ~95 min | ~24 min |

**Recent Trend:**

- Last 5 plans: 02-04 (photos, 3 requirements, 2 commits + 1 verify-only, ~25 min); 02-03 (sections, 8 requirements, 6 commits + 2 verify-only, ~30 min); 02-02 (typography, 3 requirements, 2 commits + 1 no-op, ~15 min); 02-01 (copy edits, 15 requirements, 11 commits + 4 verify-only, ~25 min); 01-01 (audit & inventory, 92 bullets, ~50 min)
- Trend: Plan-execution time scales with code-edit count, not requirement count. Verify-only tasks add minimal overhead. PHOTO was the smallest (3 requirements, 2 commits) but had the highest verify-only ratio (1 of 3) because plan-time research correctly anticipated that PHOTO-01 was already shipped.

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
- Plan 02-02 — italic-span removal scoped to AUDIT-listed final-words only: stay/Maisons/Rêves/sleep/gather/here/us/Compound/Area/Easy across .astro and i18n. Body-prose section heads (about.gallery 'archives', about.faq 'Questions', getting.options 'Arrive', getting.trips 'Here', catering.gallery 'table', the-compound 'Shared Spaces' / 'Trois Maisons', explore page heads — 8 occurrences) deliberately left untouched; flagged for Phase 3 CLIENT-CLARIFICATION as global-policy question.
- Plan 02-02 — Hollywood Hideaway hero italic resolved via page-scoped CSS override of global .hero__tagline rule (global.css:986). Other hero taglines (home, le-moulin, riviere, the-compound, about, explore, etc.) still inherit the global italic. Phase 3 CLIENT-CLARIFICATION will ask whether the global rule should be removed site-wide.
- Plan 02-02 — TYPOG-03 no-op: site already loads exactly 2 Google Font families (Cormorant Garamond + DM Sans) via a single @import. Favorite H1 font (Cormorant Garamond) preserved. No reduction work required.
- Plan 02-02 — Component-level fix on AvailabilityCalendar.astro default heading prop value preferred over only patching call-sites (Rule 2: missing critical) so future invocations cannot re-introduce the italic span.
- Plan 02-03 — i18n index renumbering: removing a middle entry from an array consumed by `${i18nKey}.amenity.${i}` requires shifting all subsequent translation keys in BOTH stores; otherwise the runtime overlay maps the wrong English/French to the wrong list slot. Documented as a pattern.
- Plan 02-03 — SECT-04 + SECT-07 verify-only: cream lightbox shipped in commit f5579e8/1a658c2 prior; Journal section gated `{false && (...)}` in commit cc3ac01e (Apr 30). No commits produced for those two; AUDIT can be marked ✅ Done in retrospect.
- Plan 02-03 — Hero structural reduction (Maison): delete the entire `<p class="hero__tagline">` markup (not just empty the value) when AUDIT specifies row removal. Markup deletion is more honest than empty-value rendering. Empty the JSON value defensively for editor SPA cleanliness.
- Plan 02-03 — Carriage removal expanded to BOTH la-grange-carriage.webp AND la-grange-jetson-chariot.webp (same subject); Rule 2 — keeping a near-duplicate would defeat the client's intent.
- Plan 02-04 — PHOTO-01 verify-only: visual inspection of `hh-patio.webp` and `hh-patio-facing-home.webp` showed both feature the patio breakfast spread (plates, pastries, coffee pot, blue dishes); the currently-deployed `heroImage: hh-patio.webp` IS the breakfast-on-patio shot the client requested. No swap, no commit.
- Plan 02-04 — PHOTO-03 vertical centering scoped to HH only: client flag named only HH (May 1 p.3); scoped page-only `<style>` overrides the global `.hero` bottom-alignment without touching le-moulin or maison hero alignment. Selector `.hero:not(.hero--cta)` excludes the CTA hero, which keeps its inline `height: 45vh` + global flex-end behavior.
- Plan 02-04 — PHOTO-03 dark-filter approach: new `.hero--cta .hero__overlay` modifier rule in global.css, ~50% opacity reduction (gradient `0.18/0.10/0.32` → `0.08/0.05/0.16`); applied via class additions on the "Interested in {house}?" CTA section across all 3 house pages. Top-of-page hero overlay deliberately unchanged — it is needed for white-text legibility against bright daytime hero photos.

### Pending Todos

- Phase 3 (CLIENT-CLARIFICATION.md) — compile 29 ❓ rows + 1 ⚠️ + ≥18 ✅ acknowledgements into client-readable Markdown grouped by page; add SECT-02-(a) "What's Here 3-photo" deferral question to the doc; ask global policy questions on TYPOG-01 italic-removal scope and global `.hero__tagline { font-style: italic }` rule.

### Blockers/Concerns

- Photo-source assets: Phase 2 PHOTO-01..PHOTO-03 all shipped (PHOTO-01 verify-only — heroImage already the patio-breakfast shot; PHOTO-02 swapped to maison-dinner-light.webp confirmed via visual inspection; PHOTO-03 scoped CSS + new BEM modifier). Remaining asset-pending items live in Phase 3 (CLIENT-CLARIFICATION): jacuzzi photos, Stars Who Stayed Here photos, biking photos, Monet Giverny image, Netflix-on-TV decision — all flagged in AUDIT.md as ❓.
- i18n dual-update: Every copy change must land in both the `.astro`/`.md` inline strings AND `public/i18n/translations.json` (runtime overlay); forgetting one leaves the FR toggle broken. Several existing partial-shipments (e.g., COPY-01) were caused by exactly this oversight.
- TYPOG-01 universal policy: client wants italic-on-final-word removed for listed cases (stay, Maisons, Rêves, Where you'll sleep/gather, etc.) but hasn't confirmed whether to apply globally. Phase 2 plan 02 shipped the listed cases (8 body-prose heads remain italic — about/getting/catering/the-compound/explore); Phase 3 asks the global policy question.
- Hero tagline italic policy: TYPOG-02 fixed Hollywood Hideaway only via scoped override; the global `.hero__tagline { font-style: italic }` rule still applies to 15+ other surfaces. Phase 3 asks whether the global rule should be removed.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Gallery modal | Fix X-button, forward arrow, bottom crop (all houses) | v2 | Milestone 1 init |
| Calendar | Extend scrollable range to 12 months | v2 | Milestone 1 init |
| Editor flow | Deep audit of fragile publish/save paths | v2 | Milestone 1 init |
| Google Maps | Active embed in Getting Here section | v2 pending client | Milestone 1 init |
| Groups page | New top-level page | v2 pending client | Milestone 1 init |

## Session Continuity

Last session: 2026-05-05T22:25:00.000Z
Stopped at: Phase 2 complete — all 4 plans shipped (COPY/TYPOG/SECT/PHOTO); ready for Phase 3 (CLIENT-CLARIFICATION.md)
Resume file: .planning/phases/02-ship-the-clear-edits/02-04-SUMMARY.md
