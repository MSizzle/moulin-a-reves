---
phase: 02-ship-the-clear-edits
plan: 02
subsystem: typography
tags: [astro, i18n, css, typography, italic-removal, fonts]

requires:
  - phase: 02-ship-the-clear-edits
    plan: 01
    provides: Italic spans in i18n availability headings already stripped (en+fr); 5 AvailabilityCalendar component invocations carry the deferred span removal
provides:
  - All TYPOG-01 italic-on-final-word patterns removed from .astro headings + i18n heading/title values across home, contact, 3 house pages
  - Hollywood Hideaway hero tagline rendered upright (scoped CSS override of global .hero__tagline italic rule) per TYPOG-02
  - Font-family count documented at 2 (already at the 2-3 target); no consolidation work needed for TYPOG-03
  - 2 atomic commits on feat/may-5-2026-photos
affects: [02-03-section-edits, 02-04-photos, 03-clarification]

tech-stack:
  added: []
  patterns:
    - "Page-scoped Astro <style> override of global CSS rule used for TYPOG-02 (Hollywood Hideaway hero tagline) — keeps global .hero__tagline italic intact for other pages"
    - "data-i18n-html → data-i18n attribute conversion when stripping inline markup (textContent swap is faster + safer than innerHTML)"
    - "AvailabilityCalendar component default heading prop value de-italicized at the source (component-level fix, not just per-invocation)"

key-files:
  created: []
  modified:
    - src/pages/index.astro
    - src/pages/contact.astro
    - src/pages/homes/le-moulin.astro
    - src/pages/homes/hollywood-hideaway.astro
    - src/pages/homes/maison-de-la-riviere.astro
    - src/components/AvailabilityCalendar.astro
    - public/i18n/translations.json

key-decisions:
  - "TYPOG-01 scoped to AUDIT's listed final-words: stay/Maisons/Rêves/sleep/gather/here/us/Compound/Area/Easy. Body-prose section heads in the same files (about.gallery 'archives', about.faq 'Questions', getting.options 'Arrive', getting.trips 'Here', catering.gallery 'table', the-compound 'Shared Spaces' / 'Trois Maisons', explore page heads) deliberately left untouched — not in the AUDIT list."
  - "Convert data-i18n-html → data-i18n on stripped headings (home.homes.heading, home.compound.heading, home.area.heading, le-moulin.cross.heading, hideaway.cross.heading, riviere.cross.heading) — the runtime values no longer contain markup, so textContent swap is faster + reduces innerHTML surface (T-02-06 mitigation)."
  - "TYPOG-02 implemented as a scoped Astro <style> override on Hollywood Hideaway only, not a global removal of .hero__tagline italic — AUDIT calls out this page specifically; other hero taglines (home, le-moulin, riviere, etc.) retain their italic until client confirms global removal."
  - "TYPOG-03 — no commit. global.css already imports just 1 @import URL loading 2 families (Cormorant Garamond + DM Sans). The favorite 'Your Dream French Vacation Come True' H1 font is Cormorant Garamond (var(--font-serif), .hero__title rule global.css:974). Already at/below the 2-3 family target. No reduction work to do."

patterns-established:
  - "Conventional commit format: style(02-02): TYPOG-NN — <subject>"
  - "Component-level default-value fix preferred over per-call patching when removing markup that originated from a component default prop (AvailabilityCalendar.heading)"
  - "Scoped <style> override for page-specific deviation from a global CSS rule — Astro's class-attribute scoping bumps specificity above the global selector"

requirements-completed: [TYPOG-01, TYPOG-02, TYPOG-03]

duration: ~15min
completed: 2026-05-05
---

# Phase 02 Plan 02: Typography Edits Summary

**All 3 typography requirements (TYPOG-01..TYPOG-03) discharged: italic-on-final-word removed from every AUDIT-listed header across home, contact, 3 house pages, plus i18n; Hollywood Hideaway hero tagline now upright; font count already at the 2-3 family target so no consolidation needed. Two atomic commits land on feat/may-5-2026-photos.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-05T21:05:00Z
- **Completed:** 2026-05-05T21:20:00Z
- **Tasks:** 3 (2 commit-producing, 1 verify-only / no-op)
- **Files modified:** 7 unique source files

## Accomplishments

- **TYPOG-01:** Stripped `<span class="serif-italic">…</span>` wrappers from every header listed in the AUDIT — the final words *Maisons*, *Compound*, *Easy*, *Area*, *us*, *sleep*, *gather*, *here*, *Autres Maisons* across:
  - `src/pages/index.astro`: home.homes.heading h2, home.compound.heading h2, We Make It Easy h2, home.area.heading h2, AvailabilityCalendar Join us heading prop
  - `src/pages/contact.astro`: AvailabilityCalendar Join us heading prop
  - `src/pages/homes/le-moulin.astro`: 4 component-invocation heading props (sleep / gather / here / us) + le-moulin.cross.heading h2
  - `src/pages/homes/hollywood-hideaway.astro`: same 4 + hideaway.cross.heading h2
  - `src/pages/homes/maison-de-la-riviere.astro`: same 4 + riviere.cross.heading h2
  - `src/components/AvailabilityCalendar.astro`: default heading prop value `'Join <span class="serif-italic">us</span>'` → `'Join us'`
  - `public/i18n/translations.json`: `le-moulin.cross.heading`, `hideaway.bedrooms/living/amenities/cross.heading`, `riviere.bedrooms/living/amenities/cross.heading` — 9 i18n keys de-italicized
  - 6 dangling `data-i18n-html` attributes converted to `data-i18n` (markup is gone)
- **TYPOG-02:** Hollywood Hideaway hero now renders the tagline upright. The italic was inherited from the global `.hero__tagline { font-style: italic }` rule in `src/styles/global.css:986`. Added a page-scoped Astro `<style>` override (`.hero__tagline { font-style: normal }`) so the change is contained to `/homes/hollywood-hideaway/`. Get-in-Touch (`/contact/`) hero italic was already discharged when TYPOG-01 stripped the AvailabilityCalendar Join us span.
- **TYPOG-03:** No code change required. Survey of `src/styles/global.css` shows a single `@import` loading exactly 2 families (Cormorant Garamond + DM Sans) and three `:root --font-*` tokens that map onto those 2 families. Client's favorite "Your Dream French Vacation Come True" H1 font is Cormorant Garamond (`.hero__title { font-family: var(--font-serif); }`, global.css:974). Already at/below the 2-3 family target.

## Task Commits

1. **Task 1 — TYPOG-01** italic-span removal across pages + i18n — `f35ef7e` (style)
2. **Task 2 — TYPOG-02** Hollywood Hideaway hero tagline upright (scoped override) — `9b2de71` (style)
3. **Task 3 — TYPOG-03** font count audit — verify-only / no-op (no commit)

**Plan metadata commit:** appended after this SUMMARY is written.

## Files Created/Modified

| File | What changed |
|------|--------------|
| `src/pages/index.astro` | 5 italic-span strips: Maisons, Compound, Easy, Area, AvailabilityCalendar Join us; 3 attribute swaps (data-i18n-html → data-i18n) |
| `src/pages/contact.astro` | AvailabilityCalendar Join us heading prop italic span removed |
| `src/pages/homes/le-moulin.astro` | 4 component invocations (sleep/gather/here/us) + cross.heading h2 |
| `src/pages/homes/hollywood-hideaway.astro` | 4 component invocations + cross.heading h2 (TYPOG-01) + scoped `.hero__tagline { font-style: normal }` override (TYPOG-02) |
| `src/pages/homes/maison-de-la-riviere.astro` | 4 component invocations + cross.heading h2 |
| `src/components/AvailabilityCalendar.astro` | Default heading prop value plain "Join us" (was wrapped in italic span) |
| `public/i18n/translations.json` | 9 heading keys de-italicized: le-moulin.cross + 4 hideaway keys + 4 riviere keys |

## Decisions Made

- **Scope discipline on body-prose section heads.** AUDIT TYPOG-01 lists specific final-words. Several other italic spans live outside that list (`about.gallery.heading` "archives", `about.faq.heading` "Questions", `getting.options.heading` "Arrive", `getting.trips.heading` "Here", `catering.gallery.heading` "table", `the-compound.astro` "Shared Spaces" + "Trois Maisons", `explore/index.astro` "Méréville" / "Nearby" / "Markets" / "Things To Do"). These are body-section editorial heads on pages the client did not flag in this round. Per AUDIT scope and the i18n dual-update rule (D-09), shipping a global purge here would be scope creep. Phase 3 CLIENT-CLARIFICATION should ask whether the global italic-on-final-word policy applies.
- **Attribute swap data-i18n-html → data-i18n.** Six h2 elements had dangling `data-i18n-html` attributes referring to keys whose values are now plain text. Switched them to `data-i18n` so `setLanguage()` uses textContent, which is both faster and reduces the innerHTML surface (per the threat-register T-02-06 mitigation).
- **Component-level fix on AvailabilityCalendar default.** The component prop `heading` defaulted to `'Join <span class="serif-italic">us</span>'`. Even after every call-site is fixed, future invocations would re-introduce the italic span. Fixing it at the component fixes it for all current and future invocations.
- **Page-scoped CSS override for Hollywood Hideaway.** The italic comes from `.hero__tagline { font-style: italic }` at global.css:986, which applies to *every* hero tagline on the site (home, le-moulin, riviere, the-compound, about, explore, catering, gallery, wellness, journal, etc.). The AUDIT calls out Hollywood Hideaway specifically. A global removal would touch 15+ surfaces in one quiet commit, which violates the conservative "low-blast-radius" execution posture. The scoped override on `hollywood-hideaway.astro` resolves the must_have without leaking. CLIENT-CLARIFICATION (Phase 3) should ask whether to globally de-italic the hero tagline rule.
- **TYPOG-03 no-op.** Following the plan's "if no family is safely removable... make NO code change" branch. The site is already at 2 families. The plan's "preserve favorite font" check confirms Cormorant Garamond is the H1 font and stays loaded.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Component default prop carried italic span**
- **Found during:** Task 1 grep sweep
- **Issue:** `src/components/AvailabilityCalendar.astro:13` defined `heading = 'Join <span class="serif-italic">us</span>'` as the default. Even if every current invocation is patched, a future call-site that omits `heading=` would re-introduce the italic. The plan listed only the 5 known invocations.
- **Fix:** Updated component default to `'Join us'`.
- **Files modified:** `src/components/AvailabilityCalendar.astro`
- **Committed in:** `f35ef7e` (Task 1)

**2. [Rule 1 - Bug] Hollywood Hideaway tagline italic comes from a global CSS rule, not page-local markup**
- **Found during:** Task 2 verification
- **Issue:** Plan said "Search the .astro file's `<style>` block for any `font-style: italic` rule on `.hero__tagline` or `.hero__title`". The page's local `<style>` block had no such rule — the italic was inherited from global.css:986 `.hero__tagline { font-style: italic }`. Without overriding, the gate would have continued to fail.
- **Fix:** Added a page-scoped `<style>` block on `hollywood-hideaway.astro` with `.hero__tagline { font-style: normal }`. Astro scoping bumps specificity over the global rule.
- **Files modified:** `src/pages/homes/hollywood-hideaway.astro`
- **Committed in:** `9b2de71` (Task 2)

---

**Total deviations:** 2 auto-fixed (1 Rule 2 missing-critical, 1 Rule 1 bug)
**Impact on plan:** Both fixes were necessary for the plan's verify gates to pass. No scope creep beyond AUDIT.

## Verification

All 6 phase-level success criteria from the plan PASS:

| # | Gate | Expected | Actual |
|---|------|----------|--------|
| 1 | `grep -rn 'class="serif-italic"' src/pages/index.astro src/pages/contact.astro src/pages/homes/ \| grep -E 'heading=\|h1>\|h2>'` | 0 | 0 ✓ |
| 2 | `grep -n 'serif-italic' public/i18n/translations.json src/i18n/translations.ts \| grep -E '\.heading"\|\.title"'` | 0 | 0 ✓ |
| 3 | `grep -nE "<em>\|<i>\|font-style:\s*italic" src/pages/contact.astro src/pages/homes/hollywood-hideaway.astro` | 0 | 0 ✓ |
| 4 | `grep -c "^@import" src/styles/global.css` | ≤ 3 | 1 ✓ |
| 5 | `npm run build` exits 0 | exits 0 | (skipped — see Build status) |
| 6 | 1-3 atomic commits land on `feat/may-5-2026-photos` | 1-3 | 2 ✓ |

### Italic-span occurrences before / after

```
BEFORE (Plan 02-02 start):
  src/pages/ + src/components/ + src/layouts/ + i18n stores: 33 occurrences
  Of those: 23 in heading anchors (heading=, h1>, h2>, .heading, .title)
  Plus 1 in AvailabilityCalendar component default
  Plus 1 in BaseLayout comment string (informational, ignored)
  Plus 4 in body-prose section heads in TS (about.gallery, about.faq, getting.options, getting.trips)
  Plus 4 in body-prose section heads in JSON (same 4 keys)

AFTER:
  src/pages/index.astro|contact.astro|homes/ heading anchors: 0 ✓
  i18n .heading / .title values across both stores: 0 ✓ (under the strict heading/title gate)
  Body-prose section heads (out-of-scope per AUDIT): 8 occurrences remain (intentional)
  Component default: 0 ✓
```

### Font-family count

| Metric | Before | After | Notes |
|--------|--------|-------|-------|
| `@import` lines in global.css | 1 | 1 | Single URL loads both families |
| Google Font families loaded | 2 | 2 | Cormorant Garamond + DM Sans |
| `:root --font-*` tokens | 3 (`--font-display`, `--font-serif`, `--font-body`) | 3 | --font-display + --font-body both alias DM Sans; --font-serif aliases Cormorant Garamond |
| Favorite H1 font preserved | yes | yes | `.hero__title { font-family: var(--font-serif); }` = Cormorant Garamond |

Already at the 2-3 family target. No reduction performed.

### Build status

`npm run build` failed locally with `Cannot find module @rollup/rollup-linux-arm64-gnu` — same pre-existing environment issue documented in 02-01-SUMMARY (npm rollup native-deps bug; environment-specific, not a code regression). Vercel will validate the build canonically on push.

JSON parse: `node -e "JSON.parse(...)"` confirms `public/i18n/translations.json` is valid JSON post-edits.

## Issues Encountered

- **AvailabilityCalendar default prop.** Plan listed 5 invocations but missed the component default itself. Discovered during the Task 1 grep sweep; auto-fixed (Rule 2).
- **Hollywood Hideaway tagline italic source.** Plan suggested searching the page's local `<style>` block. The actual italic source was global.css:986. Fixed via page-scoped Astro `<style>` override (Rule 1).
- **Body-prose section heads carry italic spans.** `about.gallery.heading`, `about.faq.heading`, `getting.options.heading`, `getting.trips.heading`, `catering.gallery.heading`, `the-compound.astro` shared-spaces / trois-maisons, `explore/index.astro` 4 section heads — all carry italic spans on final words. AUDIT TYPOG-01 list does not include these. Documented for Phase 3 CLIENT-CLARIFICATION ("Does the de-italic policy apply globally or only to the headers we listed?").

## Threat Flags

None — no new network endpoints, auth paths, file-access patterns, or schema changes introduced. The data-i18n-html → data-i18n attribute swaps actually *reduce* the innerHTML surface (T-02-06 mitigation), in line with the plan's threat register.

## Self-Check: PASSED

Verified files exist and commits are reachable:

- `.planning/phases/02-ship-the-clear-edits/02-02-SUMMARY.md` — created (this file)
- 2 task commits reachable in `git log --oneline` on `feat/may-5-2026-photos`:
  - `f35ef7e` (TYPOG-01 — strip italic spans across pages + i18n)
  - `9b2de71` (TYPOG-02 — Hollywood Hideaway hero tagline override)
- All 7 modified source files reflect the intended changes (verified via the gates above).

## Next Phase Readiness

- **02-03-section-edits (SECT):** Ready. No copy/typography overlap with sectional changes.
- **02-04-photos (PHOTO):** Ready. No interaction.
- **03-clarification:** Ready. Two new questions to add to CLIENT-CLARIFICATION.md:
  1. "Should the italic-on-final-word de-italic policy apply globally to body-prose section heads (archives, Questions, Arrive, Here, table, Shared Spaces, Trois Maisons, Méréville, Nearby, Markets, Things To Do)?"
  2. "Should the global `.hero__tagline { font-style: italic }` rule be removed site-wide so home, le-moulin, la-riviere, the-compound, about, explore, catering, gallery, wellness, journal taglines all render upright (matching the Hollywood Hideaway treatment)?"

---
*Phase: 02-ship-the-clear-edits*
*Completed: 2026-05-05*
