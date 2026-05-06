---
phase: 260506-kao
plan: 01
subsystem: marketing-site/catering
tags: [css, hero, object-position, brownfield-safe]
requires: []
provides: ["Catering page hero crop biased to keep faces in frame"]
affects: ["src/pages/catering.astro"]
tech_stack_added: []
patterns_established: []
key_files_created: []
key_files_modified:
  - src/pages/catering.astro
decisions:
  - Single inline `object-position: center 22%` on the hero <img> — does not modify the global `.hero__image img { object-fit: cover }` rule, so /about/ and /wellness/ heroes are untouched.
metrics:
  duration_min: ~3
  tasks_completed: 1
  tasks_total: 2
  completed_date: 2026-05-06
status: task-1-complete-task-2-awaits-human-verify
---

# Phase 260506-kao Plan 01: Catering Hero Object-Position Fix Summary

One-line: Added `style="object-position: center 22%;"` to the catering hero `<img>` so the desktop crop favors guests' faces over their waists; global CSS untouched, /about/ and /wellness/ unaffected.

## What Was Built

- Task 1 (auto): One inline-style addition to `src/pages/catering.astro:10`. Hero `<img>` now reads:
  ```astro
  <img src="/images/catering-group-table.webp" alt="Long table set for a group dinner at Moulin à Rêves" style="object-position: center 22%;" />
  ```
- Task 2 (checkpoint:human-verify): **NOT YET RUN.** Awaiting Monty's manual visual check at desktop (~1920px down to ~1200px) and mobile (~390px) widths, plus a no-regression check on `/about/` and `/wellness/`.

## Commits

| Task | Commit  | Message                                                       | Files                     |
| ---- | ------- | ------------------------------------------------------------- | ------------------------- |
| 1    | a6342c2 | fix(catering): bias hero crop upward so faces stay visible    | src/pages/catering.astro  |

Single atomic commit on `main`. No `.planning/` artifacts in this commit (per orchestrator step 8 contract).

## Verification

- **Plan automated check (modified, see Deviations):** `grep -c 'object-position: center 22%' src/pages/catering.astro` → `1` ✅
- **Done-criteria intent (`global.css` untouched):** `git diff src/styles/global.css` → empty ✅
- **Single-file diff:** `git log -1 --stat` shows only `src/pages/catering.astro | 2 +-` (1 insertion, 1 deletion) ✅
- **Diff content:** the only line changed is the hero `<img>`; `src` and `alt` unchanged, `style` attribute added at the end ✅
- **Visual verification (Task 2):** pending — user runs `npm run dev` and resizes browser; this summary will be amended after approval.

## Deviations from Plan

### Auto-noted Issues

**1. [Rule 3 — Blocking issue with verify command, NOT with the code change] Plan's automated verify command was over-strict**

- **Found during:** Task 1 verification step.
- **Issue:** The plan specifies `grep -c 'object-position' src/styles/global.css | grep -q '^0$'` as part of the verify chain. But `src/styles/global.css` already contained two `object-position` rules **before this plan started**:
  - Line 301: `.compound-tile img { object-position: center 65%; }`
  - Line 309: `.compound-grid--rooms .compound-tile img { object-position: center 68%; }`
  Both rules pre-date this plan and target compound tiles, not the hero. The verify command would have failed regardless of whether I made the right change.
- **What was actually checked:** The plan's `done` criteria (the source of truth) state: "`src/styles/global.css` is untouched (no `object-position` declarations anywhere in the global stylesheet that weren't there before)." That is satisfied — `git diff src/styles/global.css` is empty.
- **Files modified by this deviation:** None. The deviation is documentation-only; the code change matches the plan exactly.
- **Commit:** N/A — no code change required.

No other deviations. Code change matches the plan's `<interfaces>` block byte-for-byte.

## Auth Gates

None — this plan touches only static markup.

## Known Stubs

None.

## Threat Flags

None — adding an inline `style` attribute on an `<img>` does not introduce new network endpoints, auth surface, file-access patterns, or schema changes.

## What Awaits

- **Task 2 — Human visual verify (blocking checkpoint):**
  1. `npm run dev` → open `http://localhost:4321/catering/`
  2. Resize from ~1920px down through ~390px; confirm faces stay visible at every breakpoint (previously vanished above ~1200px).
  3. Open `/about/` and `/wellness/` — confirm both heroes look identical to before (they should NOT shift).
  4. Toggle FR via the language switcher on `/catering/` — hero crop should be unchanged (no copy edits in this plan).
  5. Optional: DevTools mobile emulation at iPhone widths — faces visible; table/food may be partially cropped at the bottom (acceptable per approved plan).
- **Resume signal:** "approved" if all four checks pass; otherwise describe what's wrong (e.g., "faces still cut off at 1920px" or "about hero looks different").

## Self-Check: PASSED

- File exists: `src/pages/catering.astro` ✅
- Inline style present: `grep -c 'object-position: center 22%' src/pages/catering.astro` → `1` ✅
- Global CSS untouched: `git diff src/styles/global.css` → empty ✅
- Commit exists: `git log --oneline | grep a6342c2` → `a6342c2 fix(catering): bias hero crop upward so faces stay visible` ✅
- Summary file exists: this file at `.planning/quick/260506-kao-catering-hero-object-position-fix/260506-kao-01-SUMMARY.md` ✅
