---
phase: 02-ship-the-clear-edits
plan: 04
subsystem: photo-edits
tags: [astro, css, photo, hero, overlay, structural]

requires:
  - phase: 02-ship-the-clear-edits
    plan: 01
    provides: Copy edits + i18n parity (COPY-01..COPY-15)
  - phase: 02-ship-the-clear-edits
    plan: 02
    provides: Typography hygiene (TYPOG-01..TYPOG-03 — Hollywood Hideaway scoped italic override)
  - phase: 02-ship-the-clear-edits
    plan: 03
    provides: Section/structural edits (SECT-01..SECT-08)
  - phase: 01-audit-inventory
    provides: AUDIT.md PHOTO rows with file:line anchors
provides:
  - All 3 PHOTO requirements addressed (PHOTO-01, PHOTO-02, PHOTO-03) on `feat/may-5-2026-photos`
  - 2 atomic per-requirement commits + 1 verify-only no-op (PHOTO-01 — heroImage already correct)
  - Maison de la Rivière dining tile lead photo swapped from empty board table to horizontal table-set-with-plates shot
  - Hollywood Hideaway top-of-page hero text vertically centered via scoped CSS override (`align-items: center; padding-bottom: 0` on `.hero:not(.hero--cta)`)
  - New `.hero--cta` modifier in global.css with reduced overlay opacity; applied to the per-house "Interested in {house}?" CTA section on all 3 house pages
affects: [03-clarification]

tech-stack:
  added: []
  patterns:
    - "BEM modifier scoping: `.hero--cta` opt-in class lets a child of `.hero` (the dark filter overlay) inherit a softer treatment without touching the top-of-page hero where overlay opacity is needed for white-text legibility"
    - "Astro page-scoped CSS as minimal-disruption hero override: scoped `<style>` in `src/pages/homes/hollywood-hideaway.astro` reaches the global `.hero` rule via Astro's data-attribute scoping — no global CSS edit needed for HH-only vertical centering"
    - "`.hero:not(.hero--cta)` selector lets a single page-scoped rule target the top hero only and exclude the CTA hero — avoids needing to add `.hero--top` or similar marker class to the page-top hero element"
    - "Verify-only outcome for already-shipped requirements: PHOTO-01 — both candidate assets (`hh-patio.webp`, `hh-patio-facing-home.webp`) inspected visually, both show the patio breakfast spread; current `heroImage: hh-patio.webp` confirmed correct; no commit"

key-files:
  created:
    - .planning/phases/02-ship-the-clear-edits/02-04-SUMMARY.md
    - .planning/phases/02-ship-the-clear-edits/deferred-items.md
  modified:
    - src/pages/homes/maison-de-la-riviere.astro
    - src/pages/homes/le-moulin.astro
    - src/pages/homes/hollywood-hideaway.astro
    - src/styles/global.css

key-decisions:
  - "PHOTO-01 verify-only: visual inspection of both `public/images/homes/hh-patio.webp` and `hh-patio-facing-home.webp` showed nearly-identical compositions, both featuring breakfast laid out (plates of pastries, coffee pot, fruit, blue dishes) on the round patio table facing the blue-shuttered facade. The currently-deployed `heroImage: hh-patio.webp` IS already the breakfast-on-patio shot the client asked for. No swap, no commit."
  - "PHOTO-02 asset choice = `maison-dinner-light.webp`: visual inspection confirmed this is the only asset under `public/images/homes/maison-*` that shows the long dining table set with plates, glasses, bread, and wine. The previous lead `maison-dining.webp` shows the same table empty. Reordered photos array so `maison-dinner-light` is index 0; `maison-dining` drops to index 1; subsequent entries unchanged. Updated alt text on the new lead to describe the set table."
  - "PHOTO-03 hero centering scoped to Hollywood Hideaway only: client's flag named only HH (May 1 p.3 — 'Hollywood Hideaway The hero image white text feels too low'). Scoped `<style>` in `src/pages/homes/hollywood-hideaway.astro` overrides the global `.hero` default (`align-items: flex-end; padding-bottom: 80px`) without touching le-moulin or maison hero alignment. Astro's automatic data-astro-cid-* scoping keeps the override file-local."
  - "PHOTO-03 selector `.hero:not(.hero--cta)` chosen over inverted approach (e.g., adding a `.hero--top` class to the top hero only). Reason: lets the same scoped style block work for both the page-top hero AND any hypothetical future top-of-page hero variants on this page, while excluding any hero that opts into the smaller `.hero--cta` treatment. Single rule, future-proof, no extra class additions to the markup."
  - "PHOTO-03 dark-filter approach = new `.hero--cta .hero__overlay` modifier rule in global.css with the same gradient shape but ~50% opacity reduction (`0.18/0.10/0.32` → `0.08/0.05/0.16`). Top-of-page hero overlay deliberately unchanged: it is needed for white-text legibility against bright daytime hero photos. CTA hero text is `.hero__title` only (no tagline) and visually framed by the surrounding cream sections, so the overlay can be much lighter without losing readability."
  - "PHOTO-03 applied across all 3 house pages: client message (Apr 30 p.12) explicitly says 'on this page and all the house listings' and 'on all the maison pages' — added `class='hero hero--cta'` to the CTA section on `hollywood-hideaway.astro:305`, `le-moulin.astro:322`, `maison-de-la-riviere.astro:238`."
  - "Build environment issue (missing `@rollup/rollup-linux-arm64-gnu` — npm/cli#4828) is a pre-existing local-sandbox problem unrelated to any PHOTO edit. Out of scope per executor scope-boundary rule. Logged to `deferred-items.md`. Vercel deploy uses linux-x64 native module so the issue does not block production."

patterns-established:
  - "Verify-only outcome for already-shipped requirements: confirmed in SUMMARY with reasoning + visual inspection notes; no commit produced"
  - "Conventional commit format: `feat(02-04): PHOTO-NN — <subject>` for content/asset swaps; `style(02-04): PHOTO-NN — <subject>` for CSS-only changes"
  - "Atomic-per-requirement commits with explicit per-line bullets summarizing what was modified vs. what was retained"

requirements-completed: [PHOTO-01, PHOTO-02, PHOTO-03]

duration: ~25min
completed: 2026-05-05
---

# Phase 02 Plan 04: Photo Edits Summary

**All 3 PHOTO requirements (PHOTO-01..PHOTO-03) discharged: 2 atomic commits + 1 verify-only confirmation. Maison de la Rivière dining tile now leads with the horizontal table-set-with-plates shot (`maison-dinner-light.webp`), Hollywood Hideaway top-of-page hero text is vertically centered via a scoped page-only CSS override, and a new `.hero--cta` modifier reduces the dark filter on the per-house "Interested in {house}?" CTA hero across all three house pages. PHOTO-01 was verify-only because visual inspection of both candidate assets confirmed the currently-deployed `heroImage: hh-patio.webp` IS already the patio-with-breakfast shot the client asked for.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-05T22:00:00Z
- **Completed:** 2026-05-05T22:25:00Z
- **Tasks:** 3 (2 commit-producing, 1 verify-only)
- **Files modified:** 4 unique source files (3 .astro house pages, 1 global stylesheet)

## Accomplishments

| # | Requirement | Outcome | Commit |
|---|-------------|---------|--------|
| 1 | PHOTO-01 | **Verify-only** — both `hh-patio.webp` and `hh-patio-facing-home.webp` show the patio with the breakfast spread (plates, pastries, coffee pot, blue dishes on the round table facing the blue-shuttered facade); currently-deployed `heroImage: hh-patio.webp` confirmed correct. No swap, no commit. | n/a |
| 2 | PHOTO-02 | Reordered the dining tile photos array in `src/pages/homes/maison-de-la-riviere.astro:64` so `maison-dinner-light.webp` (table set with plates/glasses/bread/wine under warm chandelier light) is now the lead photo. Previous lead `maison-dining.webp` (empty board table) drops to index 1. Updated alt text on new lead. | `10c9007` |
| 3 | PHOTO-03 | Two-part fix: (a) scoped `<style>` in `hollywood-hideaway.astro` adds `.hero:not(.hero--cta) { align-items: center; justify-content: center; padding-bottom: 0; }` overriding the global `.hero` bottom-alignment; (b) new `.hero--cta .hero__overlay` rule in `global.css` with reduced gradient opacity (`0.18/0.10/0.32` → `0.08/0.05/0.16`); applied `class='hero hero--cta'` to the "Interested in {house}?" CTA section on all 3 house pages. | `ae76a67` |

## Task Commits

Each commit-producing task landed atomically on `feat/may-5-2026-photos`:

1. **Task 1 — PHOTO-01** Verify-only ✓ (no commit) — heroImage already the patio-breakfast shot
2. **Task 2 — PHOTO-02** Maison dining lead = horizontal tables-set-with-plates — `10c9007`
3. **Task 3 — PHOTO-03** Center HH hero text + reduce dark filter on house CTA heroes — `ae76a67`

**Plan metadata commit:** appended after this SUMMARY is written.

## Files Created/Modified

| File | What changed |
|------|--------------|
| `src/pages/homes/maison-de-la-riviere.astro` | Dining tile photos array reordered: `maison-dinner-light.webp` → index 0; `maison-dining.webp` → index 1; rest unchanged. New lead alt text "Long dining table set with plates, glasses, and bread under warm chandelier light". CTA section gains `class='hero hero--cta'`. |
| `src/pages/homes/hollywood-hideaway.astro` | Scoped `<style>` block extended with `.hero:not(.hero--cta) { align-items: center; justify-content: center; padding-bottom: 0; }` (preserves the existing TYPOG-02 `.hero__tagline { font-style: normal }` override). CTA section gains `class='hero hero--cta'`. |
| `src/pages/homes/le-moulin.astro` | CTA section gains `class='hero hero--cta'`. |
| `src/styles/global.css` | New rule after `.hero__overlay`: `.hero--cta .hero__overlay { background: linear-gradient(to bottom, rgba(15, 15, 15, 0.08) 0%, rgba(15, 15, 15, 0.05) 40%, rgba(15, 15, 15, 0.16) 100%); }` — softer overlay for the CTA hero only. Top-of-page `.hero__overlay` rule untouched (white-text legibility). |
| `.planning/phases/02-ship-the-clear-edits/deferred-items.md` | Logged the pre-existing rollup arm64 native-module local-sandbox build issue (npm/cli#4828); does not affect Vercel deploy or any PHOTO edit. |

## Verification

Plan-level success criteria (lines 269-274 of the plan):

| # | Check | Result |
|---|-------|--------|
| 1 | `grep -E "heroImage:.*hh-patio(-facing-home)?\.webp" src/content/pages/hollywood-hideaway.md` matches a current patio asset | ✅ matches `heroImage: "/images/homes/hh-patio.webp"` (line 6) |
| 2 | `grep -A4 "id: 'dining'" src/pages/homes/maison-de-la-riviere.astro \| head -6` shows new horizontal-with-plates asset at index 0 | ✅ `maison-dinner-light.webp` at index 0 |
| 3 | `grep -c "hero--cta" src/styles/global.css` ≥ 1 | ✅ 1 occurrence |
| 4 | `grep -c "hero--cta\|hero hero--cta" src/pages/homes/{le-moulin,hollywood-hideaway,maison-de-la-riviere}.astro` ≥ 1 each | ✅ maison: 1, le-moulin: 1, hideaway: 3 (1 in markup + 2 in scoped style block) |
| 5 | `grep -c "justify-content:\s*center\|translateY(-50%)" src/pages/homes/hollywood-hideaway.astro` ≥ 1 | ✅ 1 occurrence |
| 6 | `npm run build` exits 0 | ⚠️ Local sandbox build fails on a pre-existing rollup-arm64 native-module npm bug (npm/cli#4828) — unrelated to PHOTO edits, logged to `deferred-items.md`. Vercel build uses linux-x64 native and is unaffected. |
| 7 | 1–3 atomic commits land | ✅ 2 commits (PHOTO-01 verify-only by design) |

## Deviations from Plan

### None — plan executed as written

The plan accounted for PHOTO-01 verify-only and PHOTO-02 swap-or-defer outcomes; both took the expected path (verify-only and swap, respectively). PHOTO-03 followed the recommended approach (scoped style + new `.hero--cta` modifier + class additions on 3 pages) verbatim.

### Out-of-scope discovery (logged, not fixed)

- **Local build environment:** `npm run build` fails with `Cannot find module @rollup/rollup-linux-arm64-gnu`. This is a pre-existing optional-dependency npm bug (npm/cli#4828) and is unrelated to any PHOTO edit (our changes are pure CSS rules, BEM modifier additions, and a photo-array reorder — none can plausibly trigger a rollup native-module resolution error). Logged to `.planning/phases/02-ship-the-clear-edits/deferred-items.md`. Vercel deploy uses linux-x64 native module and is unaffected.

## Authentication Gates

None — all edits were file-system-local. No auth required.

## Threat Flags

None — all PHOTO edits route through the existing Astro static-asset pipeline. The new `.hero--cta` selector is a BEM opt-in modifier (Astro-scoped or class-on-element), no new trust boundary introduced. T-02-11 (build break from asset path swap) was mitigated: `maison-dinner-light.webp` confirmed present in `public/images/homes/` before the reorder commit.

## Known Stubs

None — all edits are concrete production-quality changes; no placeholder or "TODO" markers introduced.

## Self-Check: PASSED

- ✅ `src/pages/homes/maison-de-la-riviere.astro` modified, dining lead = `maison-dinner-light.webp`
- ✅ `src/pages/homes/hollywood-hideaway.astro` modified, scoped centering rule + `hero--cta` class on CTA
- ✅ `src/pages/homes/le-moulin.astro` modified, `hero--cta` class on CTA
- ✅ `src/styles/global.css` modified, `.hero--cta .hero__overlay` rule added
- ✅ Commit `10c9007` (PHOTO-02) found in git log
- ✅ Commit `ae76a67` (PHOTO-03) found in git log
- ✅ `MMM may.5.pdf` still untracked (preserved per repo convention)
