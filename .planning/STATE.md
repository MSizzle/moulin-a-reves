---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: complete
stopped_at: Milestone 1 complete — Phase 3 plan 01 shipped (CLIENT-CLARIFICATION.md, 412 lines, 5 commits); all 6 CLAR requirements done; doc ready to send to Melissa
last_updated: "2026-05-05T22:00:00.000Z"
last_activity: 2026-05-05 -- Phase 3 plan 01 complete — CLIENT-CLARIFICATION.md compiled (29 ❓ + 1 ⚠️ + 14 ✅ acks); 5 atomic commits; Milestone 1 100% shipped
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 6
  completed_plans: 6
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-05)

**Core value:** Convey the compound's atmosphere convincingly enough to convert visitors into bookings and direct inquiries.
**Current focus:** Milestone 1 COMPLETE — all 3 phases shipped (Audit / Ship-the-Clear / CLIENT-CLARIFICATION.md); doc ready to send to Melissa.

## Current Position

Phase: 3 of 3 (CLIENT-CLARIFICATION.md) — **COMPLETE**
Plan: 1 of 1 in current phase — COMPLETE (03-01 client-clarification)
Status: Plan 03-01 complete — 5 atomic commits landed (`4848518` intro + Universal, `9a45cc2` Home + Le Moulin, `ac020d5` HH + Maison, `344f5fa` Les Maisons + Get in Touch, `cf32a32` Already Done + Groups); CLIENT-CLARIFICATION.md is 412 lines covering all 29 ❓ + 1 ⚠️ + 14 ✅ acks. Milestone 1 100% shipped: 24 commits across Phase 2 + 5 commits in Phase 3 against the 2026-05-06 deadline.
Last activity: 2026-05-05 -- Phase 3 plan 01 complete — CLIENT-CLARIFICATION.md compiled and committed; Milestone 1 100% shipped

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 6
- Average duration: ~25 min
- Total execution time: ~2h 30 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 1 | ~50 min | ~50 min |
| 2 | 4 | ~95 min | ~24 min |
| 3 | 1 | ~5 min | ~5 min |

**Recent Trend:**

- Last 6 plans: 03-01 (client-clarification, 6 CLAR requirements, 5 commits, ~5 min); 02-04 (photos, 3 requirements, 2 commits + 1 verify-only, ~25 min); 02-03 (sections, 8 requirements, 6 commits + 2 verify-only, ~30 min); 02-02 (typography, 3 requirements, 2 commits + 1 no-op, ~15 min); 02-01 (copy edits, 15 requirements, 11 commits + 4 verify-only, ~25 min); 01-01 (audit & inventory, 92 bullets, ~50 min)
- Trend: Plan-execution time scales with code-edit count, not requirement count. The Phase 3 plan was the fastest (~5 min) because it was pure markdown compilation with all source data pre-extracted in `_audit-bullets.json`. Phase 1's audit work paid for itself across both Phase 2 (each clear-to-ship row had a file:line anchor) and Phase 3 (each clarification row had a verbatim quote + clarification_question pre-written).

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
- Plan 03-01 — `CLIENT-CLARIFICATION.md` placed at project root (NOT under `.planning/`) per CLAR-01: the file is a client deliverable that gets sent to Melissa directly out-of-band, not an internal artefact. Section ordering Home → Le Moulin → Hollywood Hideaway → Maison de la Rivière → Les Maisons → Get in Touch → Universal → Already Done → Groups question matches the page-grouping requirement.
- Plan 03-01 — 29 ❓ ids represented across 29 numbered H3 items, with several merged under shared parents and cross-referenced (april30-037 + april30-040 → Universal #3; april30-042 + april30-043 + may5-002 → Le Moulin #1; april30-046 + april30-004 → Universal #5; may1-024 + may1-015 → Universal #10; april30-027 + april30-028 → Home #4). Each represented item has a verbatim quote + plain-English current state + a single bold question.
- Plan 03-01 — Bonjour → Bienvenue resolution surfaced as Universal #11 confirming-shipped item (covers the may1-023 ⚠️). Le Mérévillois vs Méréville naming framed as a recommendation-with-confirmation (Universal #9) — Monty already shipped the address-only / marketing-Méréville split and just needs client to acknowledge.
- Plan 03-01 — Groups page question (CLAR-04) framed as Monty's instinct, with explicit "this isn't from your PDF" framing and a clear yes/no/think-about-it ask. Positioned as the final section to give it conversation-ending weight.
- Plan 03-01 — Style-guide gate enforced: zero `src/...` paths in client-facing body, even at the cost of slightly less precise "current state" descriptions (uses page-level descriptions like "the top of the Hollywood Hideaway page" instead). Commit hashes are the one exception — kept inline in "Already Done" because the client has used those references in prior PDF rounds.

### Pending Todos

- ~~Phase 3 (CLIENT-CLARIFICATION.md)~~ — **COMPLETE 2026-05-05** (Plan 03-01: 412-line doc covering all 29 ❓ + 1 ⚠️ + 14 ✅ acks; SECT-02-(a) "What's Here 3-photo" deferral surfaced as Hollywood Hideaway #1; TYPOG-01 italic-removal global policy + global `.hero__tagline { font-style: italic }` rule surfaced as Universal #1).
- **Send `/workspace/CLIENT-CLARIFICATION.md` to Melissa** (out-of-band — email/Slack copy-paste; the file is on `feat/may-5-2026-photos` branch and will hit production when that branch merges to main).
- **Wait on Melissa's reply** — the 11 questions listed in `03-01-SUMMARY.md` "Items the client must answer for Milestone 2 to proceed" gate the start of Milestone 2.

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

Last session: 2026-05-05T22:00:00.000Z
Stopped at: Milestone 1 complete — Phase 3 plan 01 shipped (CLIENT-CLARIFICATION.md, 412 lines, 5 commits); doc ready to send to Melissa; Milestone 2 gated on her reply.
Resume file: .planning/phases/03-client-clarification/03-01-SUMMARY.md
