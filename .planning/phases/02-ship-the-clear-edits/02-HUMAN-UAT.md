---
status: partial
phase: 02-ship-the-clear-edits
source: [02-VERIFICATION.md]
started: 2026-05-05T21:30:00.000Z
updated: 2026-05-05T21:30:00.000Z
---

## Current Test

[awaiting visual confirmation on Vercel preview deploy]

## Tests

### 1. HH hero vertical centering
expected: Hollywood Hideaway hero text (white) is vertically centered within the hero band on `/homes/hollywood-hideaway/`. No bottom-clinging text.
result: [pending]

### 2. House CTA overlay opacity reduced
expected: The "Interested in {house}?" CTA section near the bottom of all 3 house pages (le-moulin, hollywood-hideaway, maison-de-la-riviere) shows a noticeably lighter overlay than before — text remains readable but the photo behind shows through more.
result: [pending]

### 3. FR i18n toggle works end-to-end
expected: Click the FR/EN language toggle on home + each house page. All copy edits (Join us!, Bienvenue!, sleeps 10 across 8 beds, Bienvenue Chez Vous, etc.) flip cleanly between English and French. No raw key labels.
result: [pending]

### 4. PHOTO-02 visual — Maison dining tile lead
expected: On `/homes/maison-de-la-riviere/`, the Dining Room room-tile lead photo is the horizontal table-set-with-plates shot (warm chandelier, glassware, bread, wine), not the empty board table.
result: [pending]

### 5. PHOTO-01 visual — Hollywood Hideaway hero / lead
expected: The Hollywood Hideaway hero/lead image shows the patio with breakfast on the table (plates of pastries, coffee pot, blue dishes). Verify-only confirmed via filename inspection — visual confirms intended subject.
result: [pending]

### 6. Vercel preview deploys cleanly
expected: After `git push`, Vercel preview deploy succeeds with no build errors. Local `npm run build` is blocked by a pre-existing rollup-linux-arm64 npm bug (npm/cli#4828) — this is a local-sandbox issue and Vercel uses linux-x64 native modules so the deploy is unaffected. Verify on Vercel preview that the page builds.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
