---
phase: quick-260713-mu0
plan: 01
subsystem: content
tags: [i18n, astro, copy, marketing]

requires: []
provides:
  - Estate lodging capacity raised from 10 to 20 guests site-wide (EN+FR)
  - Event capacity raised from 35 to 50 guests site-wide (EN+FR)
  - New "Pricing & Events" section on the contact page with published nightly/event rates (EN+FR)
affects: [homepage copy, the-compound page, groups page, contact page, i18n translations]

tech-stack:
  added: []
  patterns:
    - "contact.pricing.* i18n keys follow the existing contact.getting.* markup-vs-plain-text split (data-i18n for plain strings, data-i18n-html for strings containing an <a> link)"

key-files:
  created: []
  modified:
    - public/i18n/translations.json
    - src/i18n/translations.ts
    - src/pages/index.astro
    - src/pages/the-compound.astro
    - src/pages/groups.astro
    - src/content/pages/compound.md
    - src/pages/contact.astro

key-decisions:
  - "Rewrote home.homes.intro's 'although ten bedrooms / maximum of ten guests' privacy framing since that logic no longer holds at 20 guests; kept the same privacy/exclusivity tone."
  - "Added the €5,000 facility fee to home.groups.events copy since pricing is now intentionally public (per plan note this was optional)."
  - "Inserted the new Pricing & Events section on contact.astro using the same section > container--narrow > h2 > p structure as the-compound.astro's intro block for visual consistency."

requirements-completed: [MU0-CAP, MU0-PRICING]

duration: 7min
completed: 2026-07-13
---

# Quick Task 260713-mu0: Pricing & Capacity Update Summary

**Raised site-wide lodging capacity 10→20 and event capacity 35→50 guests (EN+FR), and added a bilingual "Pricing & Events" section to the contact page with the owner's published rates.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-13T16:32:34+08:00
- **Completed:** 2026-07-13T16:39:15+08:00
- **Tasks:** 2 completed
- **Files modified:** 7

## Accomplishments
- Updated every targeted aggregate-capacity string (10/ten → 20/twenty guests; 35 → 50 event guests) across `translations.json`, the static fallback `translations.ts`, and inline `.astro` defaults, in both EN and FR, while leaving per-house "Sleeps 10/6/4" values untouched.
- Added a new "Pricing & Events" section to `/contact/` with nightly rate (€2,500/house, €10,000 full compound, 2-night minimum, €250 linens/housekeeping fee) and event terms (max 50 guests including lodging guests, €5,000 facility fee, La Grange decor allowed, catering vendor link), fully bilingual.
- `npm run build` passes; rendered `dist/client/contact/index.html` confirms `data-i18n`/`data-i18n-html` attributes are present and correctly split (plain text vs. markup).

## Task Commits

Each task was committed atomically:

1. **Task 1: Capacity 10→20 and events 35→50 site-wide (EN+FR)** - `1cc656b` (copy)
2. **Task 2: Add "Pricing & Events" section to contact page (EN+FR)** - `9697cf2` (feat)

**Plan metadata:** committed separately by the orchestrator (not by this executor per plan constraints).

## Files Created/Modified
- `public/i18n/translations.json` - Updated `home.homes.intro`, `home.groups.events`, `homes.rentall.heading`, `homes.rentall.text`, `about.place.p4`, `journal.family.p4` (EN only, FR was already empty) to new capacity numbers; added `contact.pricing.heading`, `contact.pricing.rates`, `contact.pricing.events` keys
- `src/i18n/translations.ts` - Synced `homes.rentall.text` and `about.place.p4` static fallback strings
- `src/pages/index.astro` - Updated meta description, JSON-LD description, two FAQ JSON-LD answers, and inline defaults for `home.homes.intro` and `home.groups.events`
- `src/pages/the-compound.astro` - Updated page title, meta description, JSON-LD description, FAQ JSON-LD answer, and body copy
- `src/pages/groups.astro` - Updated meta description
- `src/content/pages/compound.md` - Updated `summary` frontmatter and body description
- `src/pages/contact.astro` - Inserted new "Pricing & Events" `<section>` between the contact grid and `<AvailabilityCalendar>`

## Decisions Made
- `home.homes.intro`'s "although ten bedrooms... maximum of ten guests" privacy framing was rewritten (not just number-swapped) since that logic contradicted 20 guests across 10 bedrooms; new copy keeps the privacy/exclusivity tone without the "although/maximum" construction.
- `home.groups.events` now mentions the €5,000 facility fee (plan flagged this as optional since pricing is now public) — matches the new Pricing & Events section on the contact page for consistency.
- `compound.intro.p1` on the-compound page already said "vingt"/"twenty" in translations.json (pre-existing, likely a prior partial update) — left unchanged, only the inline `.astro` default and JSON-LD/meta needed correction.
- New `contact.pricing.*` keys were inserted immediately after `contact.getting.summary` to keep the `contact.*` cluster contiguous, rather than appending at the very end of that block.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' automated verification commands passed as specified, and the final `npm run build` gate passed clean.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Copy changes are self-contained (no schema, API, or infra changes) and ready to ship.
- Build is green; no further verification needed before merge/deploy.
- No blockers.

---
*Phase: quick-260713-mu0*
*Completed: 2026-07-13*

## Self-Check: PASSED

All 7 modified files verified present on disk; both task commits (`1cc656b`, `9697cf2`) verified present in git history.
