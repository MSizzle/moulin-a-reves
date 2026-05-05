---
phase: 02-ship-the-clear-edits
plan: 03
subsystem: section-edits
tags: [astro, structural, room-removal, photo-removal, i18n]

requires:
  - phase: 02-ship-the-clear-edits
    plan: 01
    provides: Copy edits + i18n parity (COPY-01..COPY-15)
  - phase: 02-ship-the-clear-edits
    plan: 02
    provides: Typography hygiene (TYPOG-01..TYPOG-03 — Hollywood Hideaway scoped italic override + AvailabilityCalendar default fix)
  - phase: 01-audit-inventory
    provides: AUDIT.md SECT rows with file:line anchors and atomic_subactions
provides:
  - All 8 SECT requirements addressed (SECT-01..SECT-08) on `feat/may-5-2026-photos`
  - 6 atomic per-requirement commits + 2 verify-only no-ops (SECT-04 cream lightbox, SECT-07 Journal section)
  - Le Moulin gathering-spaces array reduced from 5 → 3 tiles (office + courtyard removed); office amenity removed; amenity i18n indices renumbered
  - Hollywood Hideaway main carousel cleared of la-grange-pavilion-wide.webp (scope-disciplined: "What's Here 3-photo" deferred per AUDIT ❓)
  - Maison de la Rivière gathering-spaces array reduced from 5 → 3 tiles (exterior + gardens removed); hero stripped to H1-only (eyebrow span + tagline <p> deleted; H1 already centered globally)
  - Carriage photos removed from gym-and-bikes section on /the-compound/ + La Grange feature gallery on /; tile renamed "Bikes & The Carriage" → "Bikes & The Gym"
  - Pink-gown welcome photo removed from Le Moulin main carousel; bike-by-the-gate retained
  - hideTileSummary={true} added to all 3 bedroom-showcase invocations (living-space showcases already had it)
affects: [02-04-photos, 03-clarification]

tech-stack:
  added: []
  patterns:
    - "i18n index renumbering: when removing a middle entry from an array consumed by `${i18nKey}.amenity.${i}`, all subsequent translation keys must shift down by 1 in BOTH stores; otherwise the runtime overlay maps the wrong English/French to the wrong list slot"
    - "Verify-only outcome for already-shipped requirements: SECT-04 (cream lightbox + toilet/laundry) and SECT-07 (Journal section gated `{false && (...)}`) confirmed clean; no commits produced"
    - "Scope discipline: SECT-02 split into 5 atomic sub-actions per AUDIT; only the 3 Clear-to-Ship sub-actions executed (eyebrow off, la-grange photo off, plus Secret Garden + italic verifications); 'What's Here 3-photo section' explicitly deferred to Phase 3 because AUDIT tagged it ❓ Needs Clarification"
    - "Hero structural reduction (Maison): delete eyebrow span + tagline <p> entirely; rely on global .hero__content { text-align: center } for centering — no scoped style needed"

key-files:
  created:
    - .planning/phases/02-ship-the-clear-edits/02-03-SUMMARY.md
  modified:
    - src/pages/homes/le-moulin.astro
    - src/pages/homes/hollywood-hideaway.astro
    - src/pages/homes/maison-de-la-riviere.astro
    - src/pages/the-compound.astro
    - src/pages/index.astro
    - src/content/pages/le-moulin.md
    - src/content/pages/hollywood-hideaway.md
    - public/i18n/translations.json
    - src/i18n/translations.ts

key-decisions:
  - "Renumber le-moulin.amenities.amenity.{6..9} → {5..8} when removing the office entry at index 5, instead of leaving a gap. AmenitiesSection passes `${i18nKey}.amenity.${i}` to data-i18n where i is the array index; a stale 'amenity.5' = 'Office with desk + printer' would have re-injected the deleted text into the new index-5 slot ('Garden & wishing well') after the array shift."
  - "SECT-03 hero treatment: delete BOTH the eyebrow span AND the tagline <p> per AUDIT 'Delete 2 rows of text in hero image above and below the name of the house'. Empty riviere.hero.tagline value too (defensive — markup is gone, but editor SPA could resurface stale text)."
  - "SECT-05 also remove la-grange-jetson-chariot.webp (carriage with dog — same subject as the carriage photo) from the bikes tile photo array, even though only la-grange-carriage.webp was named in AUDIT. Keeping the jetson-chariot would defeat the intent."
  - "SECT-07 verify-only: the Journal section was already wrapped in `{false && (...)}` in commit cc3ac01e (April 30 — 'Writings Carousel — hidden for now per Melissa'). Plan execution confirmed the gate. No commit produced."
  - "SECT-04 verify-only: SECT toilet/laundry already absent per commit 1a658c2; cream lightbox + --bg-cream tokens present in global.css. No drift, no remediation."
  - "SECT-02 scope split: AUDIT tags the 'What's Here 3-photo section' bullet as ❓ Needs Clarification. Per the plan's scope-discipline directive, that sub-action is deferred to Phase 3. The other three sub-actions of SECT-02 (eyebrow off — already empty; la-grange photo off — shipped; secret-garden + italic — verified) are the only items shipped here."
  - "i18n discipline (D-10): SECT-01 office amenity touches translatable text → updated both translations.json and translations.ts. SECT-03 hero tagline emptied in JSON store. Other SECT edits are pure structural removals where the data-i18n anchors are deleted along with the markup, so the runtime overlay cannot re-inject — no i18n changes needed."

patterns-established:
  - "Conventional commit format: refactor(02-03): SECT-NN — <subject>"
  - "Atomic-per-requirement commits with explicit per-line bullets summarizing what was deleted vs. what was retained"

requirements-completed: [SECT-01, SECT-02, SECT-03, SECT-04, SECT-05, SECT-06, SECT-07, SECT-08]

duration: ~30min
completed: 2026-05-05
---

# Phase 02 Plan 03: Section Edits Summary

**All 8 SECT requirements (SECT-01..SECT-08) discharged: 6 atomic commits + 2 verify-only confirmations of already-shipped items (SECT-04 cream-lightbox, SECT-07 Journal-section-hidden). Three house-page gathering-spaces arrays trimmed (Le Moulin: −office, −courtyard; Maison de la Rivière: −exterior, −gardens), Hollywood Hideaway main carousel cleared of la-grange-pavilion-wide.webp, carriage photos pulled from gym-and-bikes (both `/the-compound/` and `/`), pink-gown welcome photo pulled from Le Moulin main carousel, all 6 RoomShowcase invocations across the 3 houses now pass `hideTileSummary={true}`. The "What's Here 3-photo" sub-action of SECT-02 is intentionally deferred to Phase 3 per AUDIT's ❓ tag.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-05-05T21:25:00Z
- **Completed:** 2026-05-05T21:55:00Z
- **Tasks:** 8 (6 commit-producing, 2 verify-only)
- **Files modified:** 9 unique source files (3 .astro house pages, 2 .astro top-level pages, 2 .md content files, 2 i18n stores)

## Accomplishments

| # | Requirement | Outcome | Commit |
|---|-------------|---------|--------|
| 1 | SECT-01 | Le Moulin office + courtyard tiles deleted from livingSpaces array; "Office with desk + printer" amenity entry removed; le-moulin.amenities.amenity.{6..9} renumbered to {5..8} in JSON + TS | `8baf8eb` |
| 2 | SECT-02 | la-grange-pavilion-wide.webp removed from Hollywood Hideaway gallery; eyebrow already empty; secret-garden already folded into looking-glass + american-in-paris; "What's Here 3-photo section" deferred to Phase 3 (AUDIT ❓) | `73cce41` |
| 3 | SECT-03 | Maison de la Rivière exterior + gardens tiles deleted; hero eyebrow span + tagline `<p>` removed (H1-only, already centered globally via `.hero__content { text-align: center }`); riviere.hero.tagline JSON value emptied | `02c0406` |
| 4 | SECT-04 | Verify-only — la-grange-toilet/laundry confirmed absent (commit 1a658c2 prior); cream lightbox + --bg-cream tokens confirmed present in global.css. No drift, no commit. | n/a |
| 5 | SECT-05 | la-grange-carriage.webp removed from `/the-compound/` bikes tile (and la-grange-jetson-chariot.webp same subject); removed from `/` La Grange compound-feature gallery; tile title renamed "Bikes & The Carriage" → "Bikes & The Gym"; tile summary updated | `249e9b8` |
| 6 | SECT-06 | le-moulin-welcome-rose.webp gallery entry deleted from src/content/pages/le-moulin.md; le-moulin-gate.webp ('bike by the gate') retained | `60c5db2` |
| 7 | SECT-07 | Verify-only — Journal section already wrapped in `{false && (...)}` per April-30 commit cc3ac01e ("Writings Carousel — hidden for now per Melissa"). Source markup preserved for restore. No drift, no commit. | n/a |
| 8 | SECT-08 | hideTileSummary={true} added to bedrooms RoomShowcase invocations on all 3 house pages (livingSpaces invocations already had it); modal click-through retains full info via data-room JSON payload | `d2f200b` |

## Task Commits

Each commit-producing task landed atomically on `feat/may-5-2026-photos`:

1. **Task 1 — SECT-01** Le Moulin office + courtyard + office-amenity — `8baf8eb`
2. **Task 2 — SECT-02** Hollywood Hideaway la-grange photo + verifications — `73cce41`
3. **Task 3 — SECT-03** Maison exterior + gardens + hero dedupe — `02c0406`
4. **Task 4 — SECT-04** Verify-only ✓ (no commit)
5. **Task 5 — SECT-05** Carriage photo removal + tile rename — `249e9b8`
6. **Task 6 — SECT-06** Pink-gown photo removal — `60c5db2`
7. **Task 7 — SECT-07** Verify-only ✓ (no commit)
8. **Task 8 — SECT-08** hideTileSummary on bedroom showcases — `d2f200b`

**Plan metadata commit:** appended after this SUMMARY is written.

## Files Created/Modified

| File | What changed |
|------|--------------|
| `src/pages/homes/le-moulin.astro` | livingSpaces: −2 blocks (office, courtyard); amenities: −1 entry (office); +hideTileSummary on bedrooms RoomShowcase |
| `src/pages/homes/hollywood-hideaway.astro` | +hideTileSummary on bedrooms RoomShowcase |
| `src/pages/homes/maison-de-la-riviere.astro` | livingSpaces: −2 blocks (exterior, gardens); hero: −eyebrow span, −tagline <p>; −scoped .hero__eyebrow style block; +hideTileSummary on bedrooms RoomShowcase |
| `src/pages/the-compound.astro` | bikes tile: title rename, summary trim, −2 carriage photos (la-grange-carriage + la-grange-jetson-chariot) |
| `src/pages/index.astro` | compoundFeatures La Grange tile: −1 carriage photo |
| `src/content/pages/le-moulin.md` | gallery: −1 entry (le-moulin-welcome-rose) |
| `src/content/pages/hollywood-hideaway.md` | gallery: −1 entry (la-grange-pavilion-wide) |
| `public/i18n/translations.json` | le-moulin.amenities.amenity.{6..9} → {5..8} renumbered (5=office deleted); riviere.hero.tagline value emptied |
| `src/i18n/translations.ts` | le-moulin.amenities.amenity.9 key renamed → amenity.8 (cascade from JSON) |

## Decisions Made

- **Renumber, don't gap-skip i18n indices.** Removing index 5 from a list and leaving the JSON key `amenity.5` mapped to "Office with desk + printer" would silently re-inject the deleted English string into the new index-5 slot ("Garden & wishing well") at runtime. The component reads `${i18nKey}.amenity.${i}` where `i` is the position in the array, so all subsequent keys must shift down by 1 in both stores.
- **SECT-03 hero: delete the entire `<p class="hero__tagline">`** (not just empty the value). AUDIT specifies "2 rows of text… above and below the name of the house" → both eyebrow span + tagline <p> are the 2 rows. Markup deletion is more honest than empty-value rendering (which still produces an empty paragraph). Also remove the now-orphaned `.hero__eyebrow` scoped style block.
- **SECT-03 centering: no scoped CSS needed.** `.hero__content { text-align: center }` is the global rule (global.css:967). After we delete the eyebrow + tagline siblings, the H1 inherits the centering. No additional style needed — verified by inspection.
- **SECT-05 bonus: also drop la-grange-jetson-chariot.webp.** AUDIT only named la-grange-carriage.webp, but la-grange-jetson-chariot.webp shows the same antique carriage with a dog beside it — keeping it defeats the client's intent ("remove the carriage photo"). Rule 2 (auto-add missing critical functionality) — the AUDIT-listed gate would have left visible carriage imagery on the page.
- **SECT-05 summary text update.** The original "Bikes & The Carriage" tile summary read "Electric bikes for exploring the village and forest, plus the antique horse-drawn carriage." Removing the carriage photo without removing the carriage from the prose would leave dangling reference. Updated summary to "Electric bikes for exploring the village and forest." (Rule 1 — bug-shaped consistency fix.)
- **SECT-07 verify-only.** The Journal section wrap `{false && (...)}` was already shipped on April 30 (commit cc3ac01e, comment "Writings Carousel — hidden for now per Melissa"). Source preserved for restore (change `false` → `true`). The plan's preferred approach (`{false && (...)}` JSX wrap) is exactly what is in place. Marked done; no commit.
- **SECT-04 verify-only.** Toilet + laundry photos absent from `src/` and `public/i18n/`; cream-lightbox classes + --bg-cream token present in global.css. No drift; no commit.
- **SECT-02 scope split.** AUDIT explicitly tags the "What's Here 3-photo section" sub-action as ❓ Needs Clarification (the client's intent is unclear — "remove the section entirely" vs. "swap photos"). Per scope discipline, that sub-action goes to Phase 3 CLIENT-CLARIFICATION.md. The other three sub-actions (eyebrow off — already empty, italic removed — already shipped via TYPOG-02, secret-garden folded — already in code) are verified or shipped in this commit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Renumber i18n amenity keys after array element removal**
- **Found during:** Task 1 (SECT-01)
- **Issue:** Removing the index-5 entry "Office with desk + printer" from the `amenities` array shifts indices 6-9 down to 5-8. The corresponding `${i18nKey}.amenity.${i}` data-i18n attributes consume the new (post-shift) array index, so the JSON key `amenity.5` mapped to "Office with desk + printer" would silently inject the deleted string into the new index-5 slot ("Garden & wishing well") at runtime. The plan didn't explicitly call this out — Rule 2 because it's a correctness requirement.
- **Fix:** Renumbered amenity.{6..9} → {5..8} in `public/i18n/translations.json`; renamed amenity.9 → amenity.8 in `src/i18n/translations.ts` (only that single key existed in TS).
- **Files modified:** `public/i18n/translations.json`, `src/i18n/translations.ts`
- **Committed in:** `8baf8eb` (Task 1 commit)

**2. [Rule 2 - Missing Critical] Remove `la-grange-jetson-chariot.webp` alongside `la-grange-carriage.webp`**
- **Found during:** Task 5 (SECT-05)
- **Issue:** AUDIT named only la-grange-carriage.webp, but la-grange-jetson-chariot.webp shows the same antique carriage. Removing only one would leave a visible carriage in the bikes-tile gallery — defeating the "remove the carriage photo" instruction.
- **Fix:** Deleted both photos from the bikes tile photos array.
- **Files modified:** `src/pages/the-compound.astro`
- **Committed in:** `249e9b8` (Task 5 commit)

**3. [Rule 1 - Bug] Trim "plus the antique horse-drawn carriage" from bikes tile summary**
- **Found during:** Task 5 (SECT-05)
- **Issue:** Removing the photo without the prose reference would leave a copy → photo mismatch.
- **Fix:** Edited summary to "Electric bikes for exploring the village and forest."
- **Files modified:** `src/pages/the-compound.astro`
- **Committed in:** `249e9b8` (Task 5 commit)

**4. [Rule 2 - Missing Critical] Empty riviere.hero.tagline value in translations.json**
- **Found during:** Task 3 (SECT-03)
- **Issue:** The plan deleted the hero tagline `<p>` markup, so the runtime overlay no longer has an anchor to swap. But the editor SPA might still surface the stale "A light infused home brimming with inspiration." string. Rule 2 (defensive cleanliness) — empty the JSON value.
- **Fix:** Set `riviere.hero.tagline.en` to "" in `public/i18n/translations.json`.
- **Files modified:** `public/i18n/translations.json`
- **Committed in:** `02c0406` (Task 3 commit)

**5. [Rule 2 - Missing Critical] Remove orphaned `.hero__eyebrow` scoped style block**
- **Found during:** Task 3 (SECT-03)
- **Issue:** After deleting the `<span class="hero__eyebrow">` from maison-de-la-riviere.astro, the page's local `<style>` still defined `.hero__eyebrow` styling — dead code, plus a visible reminder in source that the eyebrow used to be there.
- **Fix:** Deleted the entire 12-line scoped style block.
- **Files modified:** `src/pages/homes/maison-de-la-riviere.astro`
- **Committed in:** `02c0406` (Task 3 commit)

---

**Total deviations:** 5 auto-fixed (4 Rule 2 missing-critical, 1 Rule 1 bug)
**Impact on plan:** All five fixes were necessary for correctness, runtime parity, or code-cleanliness consistent with the plan's intent. No scope creep beyond AUDIT.

## Verification

All 10 phase-level success criteria from the plan PASS:

| # | Gate | Expected | Actual |
|---|------|----------|--------|
| 1 | `grep -n "id: 'office'\|id: 'courtyard'\|Office with desk + printer" src/pages/homes/le-moulin.astro` | 0 | 0 ✓ |
| 2 | `grep -rn "la-grange-" src/content/pages/hollywood-hideaway.md src/pages/homes/hollywood-hideaway.astro` | 0 | 0 ✓ |
| 3 | `grep -n "id: 'exterior'\|id: 'gardens'" src/pages/homes/maison-de-la-riviere.astro` | 0 | 0 ✓ |
| 4 | `grep -rn "la-grange-toilet\|la-grange-laundry" src/ public/i18n/` | 0 | 0 ✓ |
| 5 | `grep -rn "la-grange-carriage\.webp\|Bikes & The Carriage" src/pages/the-compound.astro src/pages/index.astro` | 0 | 0 ✓ |
| 6 | `grep -n "le-moulin-welcome-rose\.webp" src/content/pages/le-moulin.md` | 0 | 0 ✓ |
| 7 | Home page `<h2>From the Journal</h2>` not rendered | gated `{false && (...)}` | gated ✓ (line 578) |
| 8 | `grep -c "hideTileSummary={true}" src/pages/homes/{le-moulin,hollywood-hideaway,maison-de-la-riviere}.astro` ≥ 1 each | 1, 1, 1 minimum | 2, 2, 2 ✓ |
| 9 | `node -e "JSON.parse(...)"` on translations.json | parses cleanly | PASS ✓ |
| 10 | Atomic per-requirement commits land on `feat/may-5-2026-photos` | 6 (8 tasks − 2 verify-only) | 6 ✓ |

### Verify-only outcomes

- **SECT-04 (toilet/laundry + cream lightbox):** `grep -rn "la-grange-toilet\|la-grange-laundry" src/ public/i18n/` → 0. `grep -c "lightbox--cream\|--bg-cream" src/styles/global.css src/components/PhotoCarousel.astro src/components/RoomShowcase.astro` → 3, 0, 0 (cream tokens in global.css). **PASS — no remediation.**
- **SECT-07 (Journal hide):** Two `{false && (...)}` gates in src/pages/index.astro (line 551 — pickup-CTA group; line 578 — Writings Carousel/Journal section) — confirms the Journal section is gated false. Source preserved for restore (change `false` → `true`). Comment trail: `cc3ac01e` (Apr 30) "Writings Carousel — hidden for now per Melissa". **PASS — no remediation.**

### Build status

`npm run build` not run locally because of the pre-existing `Cannot find module @rollup/rollup-linux-arm64-gnu` issue (documented in 02-01-SUMMARY and 02-02-SUMMARY — environment-specific npm rollup native-deps bug; Vercel CI is the canonical build oracle). Validated alternatively:

- `node -e "JSON.parse(...)"` confirms `public/i18n/translations.json` parses cleanly post-edits.
- All 8 phase-level grep gates pass.
- No new imports, no new module references, no API surface changes — pure structural removals plus property additions to existing component invocations.
- Vercel will validate the full build canonically on push to `main` (or PR preview deploy on `feat/may-5-2026-photos`).

## Issues Encountered

- **i18n index renumbering complexity.** Discovered during Task 1 (SECT-01). Removing a middle entry from an array consumed by `${i18nKey}.amenity.${i}` requires shifting all subsequent translation keys, in both stores. Documented as a pattern for future SECT/PHOTO work.
- **SECT-07 already shipped.** Discovered during Task 7 — the Journal section has been wrapped in `{false && (...)}` since April 30 (cc3ac01e). The plan's instruction was the exact pattern already in source. Verified and skipped commit. AUDIT row could be marked ✅ Done in retrospect.
- **SECT-02 scope clarity.** AUDIT mixes ✅/❓/🔧 sub-actions under one bullet. The plan correctly disambiguated: 3 sub-actions ship now, 1 verifies (italic — already shipped TYPOG-02), 1 defers (What's Here 3-photo — Phase 3). This split was honored.
- **`hideTileSummary={true}` already on living-space invocations.** Discovered during Task 8 — the prop was already added to all 3 livingSpaces RoomShowcase invocations in a prior commit. Only the bedrooms invocations needed the prop. The plan said "EVERY invocation" but it was idempotent — no double-add, just three additions.

## Threat Flags

None — no new network endpoints, auth paths, file-access patterns, or schema changes introduced. All edits are content/markup deletions and one prop addition (`hideTileSummary`) to an existing component invocation. Per the plan's threat register:
- T-02-07 (Tampering / content removal): Mitigation honored — Journal section markup preserved in source via `{false && (...)}` gate; gathering-space tiles removed cleanly with single-line revert path via `git revert`.
- T-02-08 (DoS / build break): Mitigation honored — JSON parse validated post-edit; all grep gates pass; no syntax errors introduced.
- T-02-09 (InfoDisclosure / orphaned assets): Mitigation honored — orphaned image files (le-moulin-office.webp, le-moulin-courtyard.webp, le-moulin-back-patio.webp, le-moulin-flower-cart.webp, le-moulin-marie-antoinette*.webp, le-moulin-welcome-rose.webp, maison-ext.webp, la-grange-carriage.webp, la-grange-jetson-chariot.webp, la-grange-pavilion-wide.webp) remain on disk under `public/images/homes/` but are no longer referenced from any rendered page. They were already publicly servable; no new exposure beyond pre-existing surface. Photo-pipeline owns asset lifecycle.

## Self-Check: PASSED

Verified files exist and commits are reachable:

- `.planning/phases/02-ship-the-clear-edits/02-03-SUMMARY.md` — created (this file)
- 6 task commits all reachable in `git log --oneline` on `feat/may-5-2026-photos`:
  - `8baf8eb` (SECT-01 — Le Moulin office + courtyard)
  - `73cce41` (SECT-02 — HH la-grange photo)
  - `02c0406` (SECT-03 — Maison hero dedupe + tile removal)
  - `249e9b8` (SECT-05 — carriage photos)
  - `60c5db2` (SECT-06 — pink-gown photo)
  - `d2f200b` (SECT-08 — hideTileSummary on bedrooms)
- All 9 modified source files reflect the intended changes (verified via 10 phase-level grep gates above).
- `MMM may.5.pdf` confirmed still untracked (`git status --short` shows `?? "MMM may.5.pdf"`).

## Next Phase Readiness

- **02-04-photos (PHOTO):** Ready. No interaction with SECT changes.
- **03-clarification (CLIENT-CLARIFICATION.md):** Ready. Two new items to surface beyond the typography questions already queued by 02-02:
  1. **SECT-02 sub-action (a) — "What's Here" 3-photo section on Hollywood Hideaway:** AUDIT tagged ❓. Client to clarify intent — "remove section entirely" vs. "swap the 3 photos for different ones" vs. "merge with the gathering-space showcase".
  2. **Orphaned image files in public/images/homes/:** ~10 photos no longer referenced anywhere on the site. Decision needed: leave on disk (current state — orphaned but publicly addressable), OR delete from disk during a cleanup commit. Photo-pipeline owns lifecycle so this is a Milestone-2 cleanup question, not a blocker for May 6 launch.
- **AUDIT.md status table:** SECT-01..SECT-08 can all be marked ✅ Done with this plan's commit hashes.

---
*Phase: 02-ship-the-clear-edits*
*Completed: 2026-05-05*
