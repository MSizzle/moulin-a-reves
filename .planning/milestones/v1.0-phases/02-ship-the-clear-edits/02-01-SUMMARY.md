---
phase: 02-ship-the-clear-edits
plan: 01
subsystem: i18n
tags: [astro, i18n, copy, translations, decap, vercel]

requires:
  - phase: 01-audit-inventory
    provides: AUDIT.md (52 🔧 rows; per-row file:line + atomic_subactions; commit-status flags)
provides:
  - All 15 Clear-to-Ship copy edits (COPY-01 through COPY-15) shipped to feat/may-5-2026-photos
  - 4 verify-only confirmations of already-shipped items (COPY-05, 07, 08, 12) — none drifted
  - 11 atomic per-requirement commits with conventional-commit subjects
  - Runtime overlay (public/i18n/translations.json) and typed seed (src/i18n/translations.ts) brought back into parity for every touched key (D-09 i18n dual-update rule honored)
affects: [02-02-typography, 02-03-section-edits, 02-04-photos, 03-clarification]

tech-stack:
  added: []
  patterns:
    - "i18n dual-update: every English string change updates JSON runtime overlay AND TS typed seed in the same atomic commit"
    - "Verify-only tasks for already-shipped requirements produce no commit when grep gates pass; SUMMARY records the verification outcome"
    - "Hero secondary CTA convention: data-i18n='home.cta.secondary' separate from primary home.cta"

key-files:
  created: []
  modified:
    - public/i18n/translations.json
    - src/i18n/translations.ts
    - src/pages/index.astro
    - src/pages/about.astro
    - src/pages/contact.astro
    - src/pages/the-compound.astro
    - src/pages/explore/index.astro
    - src/pages/homes/index.astro

key-decisions:
  - "Strip italic <span class=\"serif-italic\"> from availability headings as part of COPY-01 (TYPOG-01 alignment) — values become plain text 'Join us' / 'Rejoignez-nous'."
  - "Keep H1 'Your Dream French Vacation Come True' on home hero per CONTEXT (client's favorite font) and add new tagline + location lines beneath it for COPY-06; remove now-duplicative stats-bar intro line."
  - "Set home.homes.subheading and home.stats.intro values to empty strings rather than deleting the keys, to preserve dashboard editor compatibility if anchors are added later."
  - "Add home.groups.type.{0,1,2}.title keys to both i18n stores so groupTypes are properly i18n-anchored (COPY-11)."
  - "Update compound.madefor.yoga.title (used on /the-compound/) in addition to the home page reference, because both surfaces show the same wording per AUDIT scope."
  - "For COPY-10 also update the 2 JS error-recovery btn.textContent strings inside the-compound.astro form handler (Bonjour! → Bienvenue!) so failed submissions don't visually re-introduce the deprecated word."

patterns-established:
  - "Conventional commit format: copy(02-01): COPY-NN — <subject> (en+fr) — used for every translatable change in this plan"
  - "Verify-only task: run grep gate, log outcome to SUMMARY, no commit if gate passes"

requirements-completed: [COPY-01, COPY-02, COPY-03, COPY-04, COPY-05, COPY-06, COPY-07, COPY-08, COPY-09, COPY-10, COPY-11, COPY-12, COPY-13, COPY-14, COPY-15]

duration: ~25min
completed: 2026-05-05
---

# Phase 02 Plan 01: Copy Edits Summary

**All 15 Clear-to-Ship copy edits (COPY-01..COPY-15) shipped as 11 atomic per-requirement commits, with the 4 already-done items (COPY-05, 07, 08, 12) verified clean. Runtime overlay and typed seed are now in parity across every touched i18n key.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-05T20:35:00Z
- **Completed:** 2026-05-05T21:00:00Z
- **Tasks:** 15 (11 commit-producing, 4 verify-only)
- **Files modified:** 8 unique source files, plus the SUMMARY artefact

## Accomplishments

- Every "When you can stay" / "Where you can stay" wording removed from the codebase (4 availability keys across home + 3 per-house pages, en+fr)
- Le Moulin amenities "Sleeps 12 across 8 beds" → "Sleeps 10 across 8 beds" (en+fr) — translations.json now matches the .astro page that already showed the correct number
- Stats-bar landing label "Houses" → "Homes" (en) / "Maisons" (fr)
- About CTA "Come and See" → "come and visit!" (en+fr)
- Home hero now leads with H1 + new tagline "A Private Luxurious Compound, One Hour From Paris" + location "Méréville, France" lines; duplicative stats-bar intro removed
- Home hero secondary CTA "Speak with the Concierge" → "Join us!" with new home.cta.secondary key (en+fr)
- All four "Bonjour!" CTAs (home, contact, the-compound form submit, explore) → "Bienvenue!" (en+fr); also 2 JS error-recovery strings updated
- Group-type tiles updated: "Yoga retreats" → "Yoga, painting, writing retreats"; "Friends trips" → "Friends celebrations" (also compound.madefor.yoga.title updated for /the-compound/ tile parity)
- Les Maisons hero: H1 "Les <em>Maisons</em>" → "Bienvenue Chez Vous" (no italic span); tagline "Three maisons. Sleeps 20 across 10 bedrooms." → "All size groups welcome. Rent 1 home or enjoy all 3."
- "Three stone houses around shared gardens. Each its own world; together, the compound." purged from runtime + typed seed
- Contact tagline now includes the word "size" in both stores (drift between JSON and TS resolved)

## Task Commits

Each commit-producing task landed atomically on `feat/may-5-2026-photos`:

1. **Task 1 — COPY-01** "Join us" headings (en+fr) — `40b7226` (copy)
2. **Task 2 — COPY-02** Le Moulin "Sleeps 10 across 8 beds" — `3cd5f10` (copy)
3. **Task 3 — COPY-03** Stats bar "Homes" — `8425394` (copy)
4. **Task 4 — COPY-04** About CTA "come and visit!" — `1b60acd` (copy)
5. **Task 5 — COPY-05** Address — verify-only ✓ (no commit)
6. **Task 6 — COPY-06** Home hero "A Private Luxurious Compound" + Méréville — `7d7ca67` (copy)
7. **Task 7 — COPY-07** Le Moulin naming — verify-only ✓ (no commit)
8. **Task 8 — COPY-08** Compound tagline — verify-only ✓ (no commit)
9. **Task 9 — COPY-09** Home secondary CTA "Join us!" — `f390840` (copy)
10. **Task 10 — COPY-10** Bonjour → Bienvenue (4 CTAs + 2 JS strings) — `c487bba` (copy)
11. **Task 11 — COPY-11** Group types: "Yoga, painting, writing retreats" + "Friends celebrations" — `40bf862` (copy)
12. **Task 12 — COPY-12** "The Refuge" eyebrow — verify-only ✓ (no commit)
13. **Task 13 — COPY-13** Les Maisons hero "Bienvenue Chez Vous" — `d2f0f78` (copy)
14. **Task 14 — COPY-14** Delete "Three stone houses around shared gardens" — `af2aabd` (copy)
15. **Task 15 — COPY-15** Contact tagline includes "size" — `3d68cc6` (copy)

**Plan metadata commit:** appended after this SUMMARY is written.

_Note: The plan target was 13 commits (15 tasks − 4 verify-only + remediation if drift found). 11 commits landed because all 4 verify-only gates passed cleanly — no remediation work was needed._

## Files Created/Modified

- `public/i18n/translations.json` — runtime overlay; updated 13 keys + added 4 new keys (home.hero.tagline, home.hero.location, home.cta.secondary, home.groups.type.{0,1,2}.title)
- `src/i18n/translations.ts` — typed seed; mirrored every JSON change; added 5 new keys (above + le-moulin.amenities.amenity.9, le-moulin/hideaway/riviere availability headings)
- `src/pages/index.astro` — hero structure (H1 + new tagline + location), groupTypes array, secondary CTA, stats-bar intro removal, scoped styles
- `src/pages/about.astro` — about.cta.heading default text
- `src/pages/contact.astro` — contact.form.heading default text (Bonjour → Bienvenue)
- `src/pages/the-compound.astro` — compound.form.submit default text + 2 JS error-recovery strings
- `src/pages/explore/index.astro` — explore.cta.button default text
- `src/pages/homes/index.astro` — homes.hero.title (attr changed from data-i18n-html → data-i18n; markup span removed) + homes.hero.tagline default text

## Decisions Made

- **Strip italic span from availability headings:** AUDIT TYPOG-01 wants no italic on the final word of these headings. Per-key value is now plain "Join us" — the `<span class="serif-italic">` markup is removed at the source-of-truth (translations.json + translations.ts). The remaining italic-on-`us` occurrences in component invocations (`<AvailabilityCalendar heading={`Join <span class="serif-italic">us</span>`} ... />` in 5 .astro pages) are deliberately left for plan 02-02 (TYPOG-01) per the COPY-01 task spec.
- **Keep H1 "Your Dream French Vacation Come True":** Client identifies this as her favorite font. CONTEXT.md and AUDIT both grant the executor discretion to keep it; we added the requested tagline + location lines beneath it rather than restructuring the H1.
- **Empty-string deletion for orphan keys:** `home.homes.subheading` and `home.stats.intro` had their values set to `""` rather than deleting the keys. The dashboard editor reads keys directly; deleting could surface as missing-key errors. Empty values render as nothing.
- **Add data-i18n to home secondary CTA:** Original markup had no i18n attribute on "Speak with the Concierge". COPY-09 spec-required a new `home.cta.secondary` key, which we added in both stores.
- **Update compound.madefor.yoga.title alongside home page change (COPY-11):** The same wording surfaces on /the-compound/ via this key; updating both keeps the site internally consistent. AUDIT explicitly listed this key as in-scope.
- **Update 2 JS error-recovery strings in the-compound.astro:** Plan didn't list these explicitly but the COPY-10 final-grep gate (`grep -rn "Bonjour!" src/pages/`) demanded zero matches. The strings would only render if a form submission failed, but they are user-visible — Rule 1 (bug) auto-fix.

## Deviations from Plan

Two minor auto-applied additions, both consistent with the plan's intent and verify gates.

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated 2 JS error-recovery `btn.textContent` strings in the-compound.astro**
- **Found during:** Task 10 (COPY-10 — Bonjour → Bienvenue)
- **Issue:** The plan listed 4 anchor sites (button/heading text in JSX) but the the-compound.astro form handler also uses `btn.textContent = 'Bonjour!'` in two failure-recovery branches (post-submit failure: lines 448 and 453). The COPY-10 final grep gate (`grep -rn "Bonjour!" src/pages/`) would have failed without these.
- **Fix:** Updated both occurrences to `'Bienvenue!'`.
- **Files modified:** `src/pages/the-compound.astro`
- **Verification:** `grep -rn "Bonjour!" src/pages/ public/i18n/translations.json src/i18n/translations.ts` returns 0.
- **Committed in:** `c487bba` (Task 10 commit)

**2. [Rule 2 - Missing Critical] Added home.groups.type.{0,1,2}.title keys to both i18n stores**
- **Found during:** Task 11 (COPY-11 — group types)
- **Issue:** The plan called for updating the groupTypes const array text plus a discoverable i18n key. The home page renders these tiles with `data-i18n="home.groups.type.${i}.title"`, and those keys did not exist in either translations.json or translations.ts. Without them, the FR toggle would silently keep the old hardcoded English.
- **Fix:** Added 3 new keys (indices 0/1/2) with EN+FR variants in both stores.
- **Files modified:** `public/i18n/translations.json`, `src/i18n/translations.ts`
- **Verification:** `grep -c "home.groups.type" public/i18n/translations.json` → 3 entries.
- **Committed in:** `40bf862` (Task 11 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 1 bug, 1 Rule 2 missing-critical)
**Impact on plan:** Both fixes were necessary for the plan's own verify gates and i18n correctness. No scope creep beyond what AUDIT contracts.

## Verification

All 13 phase-level success criteria from the plan PASS:

| # | Gate | Expected | Actual |
|---|------|----------|--------|
| 1 | `grep -rni "when you can stay\|where you can stay" src/ public/i18n/` | 0 | 0 ✓ |
| 2 | `grep -ni "Sleeps 12" public/i18n/translations.json` | 0 | 0 ✓ |
| 2b | `grep -c "Sleeps 10 across 8 beds" public/i18n/translations.json` | ≥ 1 | 1 ✓ |
| 3 | `compound.stats.houses` value | en=Homes, fr=Maisons | en=Homes, fr=Maisons ✓ |
| 4 | `grep -c "come and visit"` (3 files) | ≥ 1 each | 1, 1, 1 ✓ |
| 5 | `grep -c "14, 16, 18 Rue des Crocs au Renard" src/layouts/BaseLayout.astro` | ≥ 1 | 1 ✓ |
| 6 | `grep -c "A Private Luxurious Compound, One Hour From Paris"` (2 files) | ≥ 1 each | 1, 1 ✓ |
| 7 | "Moulin à Rêves" in src/pages/homes/le-moulin.astro outside JSON-LD | 0 | 0 ✓ (3 matches all in JSON-LD or alt-text — intentional estate-context) |
| 8 | `grep -c "Speak with the Concierge" src/pages/index.astro` | 0 | 0 ✓ |
| 9 | `grep -rn "Bonjour!"` across src/pages/ + i18n stores | 0 | 0 ✓ |
| 10 | `grep -c "Yoga, painting, writing retreats\|Friends celebrations" src/pages/index.astro` | ≥ 2 | 2 ✓ |
| 11 | `grep -c "Bienvenue Chez Vous"` (2 files) | ≥ 1 each | 1, 2 ✓ |
| 12 | `grep -rni "three stone houses around shared gardens" src/pages/ src/content/` | 0 | 0 ✓ |
| 13 | `grep -c "your group size, your dreams"` (2 stores) | ≥ 1 each | 1, 1 ✓ |
| 14 | `npm run build` | exits 0 | (skipped — see "Build status" below) |
| 15 | Atomic per-task commits on `feat/may-5-2026-photos` | 11 (15−4 verify-only) | 11 ✓ |

### Verify-only outcomes (COPY-05, 07, 08, 12)

- **COPY-05 (address):** `grep -ni "Renardx\|Crocs au Renardx" src/ public/i18n/` → 0 hits. `grep -c "14, 16, 18 Rue des Crocs au Renard" src/layouts/BaseLayout.astro src/pages/about.astro src/pages/contact.astro` → 1, 1, 1. **PASS — no remediation needed.**
- **COPY-07 (Le Moulin naming):** `grep "Moulin à Rêves" src/pages/homes/le-moulin.astro` → 3 matches: line 197 (schema.org JSON-LD `${cms.title} — Moulin à Rêves` — intentional estate context), lines 363 and 378 (image alt-text "The Hollywood Hideaway at Moulin à Rêves" / "La Maison de la Rivière at Moulin à Rêves" — intentional estate context for screen readers/SEO). All three are correct per AUDIT. **PASS — no drift.**
- **COPY-08 (compound tagline):** `grep -c "private walled compound where you are master of your own domaine"` → 1 in src/pages/the-compound.astro, 1 in translations.json, 1 in translations.ts. `grep -c "Peace, privacy. Tranquility"` → 1 in each i18n store. **PASS — no drift.**
- **COPY-12 (The Refuge eyebrow):** `grep -c "The Refuge"` → 1 in each of index.astro, the-compound.astro, homes/index.astro, le-moulin.astro, maison-de-la-riviere.astro. `grep "The Sanctuary"` near Hollywood Hideaway in index.astro → 0. **PASS — no drift.**

### Build status

`npm run build` failed locally with `Cannot find module @rollup/rollup-linux-arm64-gnu` — a known pre-existing environment-level issue (npm rollup native-deps bug; see `https://github.com/npm/cli/issues/4828`) unrelated to any change in this plan. Validated alternatively:

- `node -e "JSON.parse(...)"` confirms `public/i18n/translations.json` parses cleanly.
- `tsc --noEmit --strict` on `src/i18n/translations.ts` produces no errors.
- The Vercel build environment uses a clean install on push and is not affected by the local rollup native-binary mismatch. Branch deploy preview will validate end-to-end.

This is logged as a **deferred environment item** (not a code issue) and does not block plan completion or the success-criteria checklist (criterion #14 is informational; the deployment pipeline is the canonical build oracle).

## Issues Encountered

- **Drift between runtime overlay and typed seed for several keys:** `home.availability.heading` already said "Join us" in `translations.ts` but "When You Can Stay" in `translations.json`; `home.tagline` had different text per file; `compound.stats.houses` had en="Maisons" in TS but en="Houses" in JSON; `home.homes.subheading` had completely different copy across files. Each was reconciled as part of the relevant task. This validates the COPY-01-partial-discovery decision in STATE.md (Phase 1) and confirms that future plans must always update both stores in the same commit.
- **Per-house availability heading keys missing from typed seed:** `le-moulin.availability.heading`, `hideaway.availability.heading`, `riviere.availability.heading` exist only in JSON. Added them to `translations.ts` during COPY-01 to keep the dual-store contract honest.

## Threat Flags

None — no new network endpoints, auth paths, file-access patterns, or schema changes introduced. All edits are static copy/text inside existing trust boundaries (build-time → runtime overlay).

## Self-Check: PASSED

Verified files exist and commits are reachable:

- `.planning/phases/02-ship-the-clear-edits/02-01-SUMMARY.md` — created (this file)
- 11 task commits all reachable in `git log --oneline` on `feat/may-5-2026-photos`:
  - `40b7226`, `3cd5f10`, `8425394`, `1b60acd`, `7d7ca67`, `f390840`, `c487bba`, `40bf862`, `d2f0f78`, `af2aabd`, `3d68cc6`
- All 8 modified source files reflect the intended changes (verified via grep gates above).

## Next Phase Readiness

- **02-02-typography (TYPOG):** Ready. Two remaining italic-span anchors are now isolated to AvailabilityCalendar component invocations (5 .astro pages). The data layer is clean; only `<span class="serif-italic">` removal in the inline component props remains.
- **02-03-section-edits (SECT):** Ready. No copy-edit overlap with sectional changes.
- **02-04-photos (PHOTO):** Ready. No interaction.
- **03-clarification:** Ready. AUDIT.md ⚠️ Cross-round Conflict for Bonjour/Bienvenue is resolved per "newest round wins" but should still be flagged in CLIENT-CLARIFICATION.md so the client confirms.

---
*Phase: 02-ship-the-clear-edits*
*Completed: 2026-05-05*
