---
phase: 03-client-clarification
plan: 01
subsystem: client-deliverables
tags:
  - documentation
  - client-deliverable
  - markdown
requirements:
  - CLAR-01
  - CLAR-02
  - CLAR-03
  - CLAR-04
  - CLAR-05
  - CLAR-06
requires: []
provides:
  - CLIENT-CLARIFICATION.md
affects:
  - Milestone 1 deliverables
tech-stack-added: []
tech-stack-patterns:
  - "Plain-English client-facing markdown — no code references in body, commit hashes only in 'Already Done' for client cross-checks"
key-files-created:
  - CLIENT-CLARIFICATION.md
key-files-modified: []
decisions:
  - "Client doc placed at /workspace/CLIENT-CLARIFICATION.md (project root) per CLAR-01 — NOT under .planning/, because Melissa receives it directly out-of-band."
  - "Section ordering Home → Le Moulin → Hollywood Hideaway → Maison de la Rivière → Les Maisons → Get in Touch → Universal → Already Done → Groups question — matches CLAR-01 page-grouping requirement."
  - "29 ❓ ids represented across 29 numbered H3 items, with several merged under a single parent and cross-referenced (april30-037 + april30-040 → Universal #3; april30-042 + april30-043 + may5-002 → Le Moulin #1; april30-046 + april30-004 → Universal #5; may1-024 + may1-015 → Universal #10; april30-027 + april30-028 → Home #4)."
  - "Bonjour → Bienvenue resolution surfaced as Universal #11 confirming-shipped item (covers may1-023 ⚠️)."
  - "Le Mérévillois vs Méréville naming framed as a recommendation-with-confirmation (Universal #9) rather than an open question — Monty already shipped the address-only / marketing-Méréville split and just needs client to ack."
  - "Groups page question (CLAR-04) framed as Monty's instinct, with explicit 'this isn't from your PDF' framing and a clear yes/no/think-about-it ask."
metrics:
  duration_minutes: 5
  duration_iso: PT5M
  tasks_completed: 5
  files_created: 1
  lines_written: 412
  commits: 5
  completed_date: "2026-05-05"
---

# Phase 3 Plan 01: CLIENT-CLARIFICATION.md compilation Summary

Compiled all 29 ❓ Needs-Clarification rows + 1 ⚠️ cross-round conflict + 14 ✅ Already-Done acknowledgements from `AUDIT.md` into a single client-readable Markdown doc at the project root, ready to send to Melissa directly.

## What was built

`CLIENT-CLARIFICATION.md` (412 lines, project root) — a plain-English clarification document organised into 9 H2 sections:

1. **Home** (4 numbered items) — one-hour-from-Paris caption, Compound Button, "house listing" pointer, Monet/Giverny asset ask.
2. **Le Moulin** (1 merged item) — grounds-as-three-galleries question merging april30-042 + april30-043 + may5-002.
3. **Hollywood Hideaway** (4 items) — "What's Here" deferral, gathering-tile sizing, modal X-button cross-ref, Stars Who Stayed asset ask.
4. **Maison de la Rivière** (2 reminder items, no open questions) — cross-references to Universal items + dining-photo confirmation.
5. **Les Maisons** (4 items) — header-size, single-font, Three-Maisons-already-removed confirmation, per-house-galleries cross-ref.
6. **Get in Touch** (3 items) — form-above-calendar, contact-page-hero phrase, Orly/CDG directions placement.
7. **Universal** (11 items) — italics policy, gather header font, modal-photo-bottom, modal X-button, gallery white space, jacuzzi photos, biking photos, Netflix-on-TV, Le Mérévillois/Méréville naming, Join-us-vs-visit phrasing, Bonjour→Bienvenue confirmation.
8. **Already Done — please re-review** (14 commit-cited bullets) — 10 verified ✅ items + 4 commits the client likely hasn't noticed.
9. **A question from Monty (Groups page)** — Monty-originated yes/no question proposing a top-level Groups page in nav for corporate / retreat / wedding-planner inquiries.

## Coverage of the 29 ❓ ids

All 29 needs-clarification ids from `_audit-bullets.json` are traceable in the doc (verified by representative-phrase grep during Task 5):

| ❓ id | Section | Item # |
|-------|---------|--------|
| may1-002 | Universal | 1 (italics policy) |
| may1-008 | Hollywood Hideaway | 2 (gathering tile size) |
| may1-014 | Hollywood Hideaway | 1 (What's Here delete vs replace) |
| may1-015 | Universal | 10 (Join us! confirmation) |
| may1-024 | Universal | 10 (merged with may1-015) |
| may1-025 | Get in Touch | 2 (contact-page hero phrasing) |
| may1-026 | Get in Touch | 1 (form above calendar) |
| april30-004 | Universal | 5 (white-space gallery layout) |
| april30-007 | Universal | 6 (jacuzzi photos asset) |
| april30-009 | Universal | 7 (biking photos asset) |
| april30-010 | Universal | 8 (Netflix-on-TV) |
| april30-013 | Home | 1 (one hour from Paris caption) |
| april30-014 | Les Maisons | 1 (header size) |
| april30-023 | Get in Touch | 3 (Orly directions) |
| april30-024 | Get in Touch | 3 (CDG directions, merged) |
| april30-027 | Home | 4 (Monet Giverny asset) |
| april30-028 | Home | 4 (paintings, merged) |
| april30-029 | Home | 2 (Compound Button) |
| april30-035 | Home | 3 (house listing pointer) |
| april30-037 | Universal | 3 (modal photo-bottom) |
| april30-040 | Universal | 3 (gathering spaces, merged) |
| april30-042 | Le Moulin | 1 (grounds biggest selling) |
| april30-043 | Le Moulin | 1 (bigger box, merged) |
| april30-045 | Universal | 4 (modal X-button) |
| april30-046 | Universal | 5 (white space, merged with april30-004) |
| april30-047 | Hollywood Hideaway | 4 (Stars Who Stayed) |
| april30-048 | Les Maisons | 2 (Les Autres Maisons single font) |
| april30-049 | Universal | 2 (gather header single font) |
| april30-055 | Les Maisons | 3 (Three maisons removal confirm) |

**Plus 1 ⚠️ row:**
- may1-023 (Bonjour→Bienvenue) → Universal #11 confirming-shipped item.

**Plus 14 ✅ Already-Done acknowledgements** in dedicated section with commit hashes cited inline (target was ≥10 + 4 = 14 ✓).

## Commits landed

| Task | Subject | Commit |
|------|---------|--------|
| 1 | Skeleton + Universal section (intro, TOC, 11 universal items) | `4848518` |
| 2 | Home + Le Moulin sections | `9a45cc2` |
| 3 | Hollywood Hideaway + Maison de la Rivière sections | `ac020d5` |
| 4 | Les Maisons + Get in Touch sections | `344f5fa` |
| 5 | Already Done re-review + Groups page question | `cf32a32` |

All 5 commits land on `feat/may-5-2026-photos` per the no-new-branches-per-phase rule.

## Requirement disposition

| Req ID | Status | Where addressed |
|--------|--------|-----------------|
| CLAR-01 | ✓ Done | File at project root, 7 page-section H2 + Already Done + Groups |
| CLAR-02 | ✓ Done | Every ❓ has verbatim quote + plain-English current state + bold question |
| CLAR-03 | ✓ Done | "Already Done" section with 14 commit-cited bullets |
| CLAR-04 | ✓ Done | "A question from Monty (Groups page)" section with yes/no ask |
| CLAR-05 | ✓ Done | Bienvenue (#11), Join us vs visit (#10), Le Mérévillois (#9), italics (#1) all surfaced |
| CLAR-06 | ✓ Done | Jacuzzi (#6), biking (#7), Netflix (#8), Monet (Home #4), Stars (HH #4) all surfaced |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Added Universal #11 (Bonjour→Bienvenue) in Task 1 instead of deferring**

- **Found during:** Task 1 verify gate (`grep -q 'Bienvenue'` was a Task-1 verify requirement)
- **Issue:** Plan task 1 listed 10 numbered items for Universal but didn't include the may1-023 ⚠️ resolution; the verify gate required it before Task 1 could commit, and the resolution belongs naturally in the cross-round-contradictions group anyway.
- **Fix:** Added a #11 "Cross-round resolution — Bonjour → Bienvenue! (already shipped, confirming)" item to the Universal section before Task-1 commit, with verbatim quote and an explicit confirmation request.
- **Files modified:** CLIENT-CLARIFICATION.md
- **Commit:** `4848518` (Task 1)

### Auth gates

None.

### Architectural changes

None — pure markdown compilation.

## Verification results

All Task-5 final-pass gates passed on the file as committed at `cf32a32`:

- ✓ All 7 required page-section H2s present in TOC order (Home → Le Moulin → Hollywood Hideaway → Maison de la Rivière → Les Maisons → Get in Touch → Universal).
- ✓ Already Done section lists 13 commit hashes from the 12-hash union set (≥10 required) — count verified at 13.
- ✓ Groups page question present with yes/no/think-about-it framing.
- ✓ All 29 ❓ ids traceable to at least one phrase in the file.
- ✓ All asset-asks present (jacuzzi, biking, Stars, Monet, Netflix).
- ✓ All 4 cross-round contradictions surfaced (Bienvenue, Join us, Le Mérévillois, italic).
- ✓ Zero `src/` paths leaked into client-facing body.
- ✓ 5 atomic commits on `feat/may-5-2026-photos`.

## Self-Check: PASSED

- ✓ FOUND: /workspace/CLIENT-CLARIFICATION.md (412 lines)
- ✓ FOUND commit: `4848518` (Task 1 — intro + Universal)
- ✓ FOUND commit: `9a45cc2` (Task 2 — Home + Le Moulin)
- ✓ FOUND commit: `ac020d5` (Task 3 — Hollywood Hideaway + Maison de la Rivière)
- ✓ FOUND commit: `344f5fa` (Task 4 — Les Maisons + Get in Touch)
- ✓ FOUND commit: `cf32a32` (Task 5 — Already Done + Groups)

## Items the client must answer for Milestone 2 to proceed

These are the questions Monty needs answered in Melissa's reply before he can ship Milestone 2 cleanly:

1. **Universal #1** — italics global policy (A or B).
2. **Universal #2** — gather-header font (Cormorant or DM Sans).
3. **Universal #6** — jacuzzi photos Drive folder link.
4. **Universal #7** — biking photos Drive folder link.
5. **Universal #8** — Netflix-on-TV decision (A or B).
6. **Home #4** — Monet Giverny image (URL or Drive drop).
7. **Hollywood Hideaway #1** — "What's Here" delete now vs keep until Stars arrive.
8. **Hollywood Hideaway #4** — Stars photos + captions.
9. **Le Moulin #1** — confirm three-galleries split for grounds (all three houses).
10. **Get in Touch #3** — Orly/CDG directions placement + draft-or-supplied copy.
11. **A question from Monty** — Groups page yes/no.

Items the client can confirm passively (acknowledge OK or flag a fix):
- Universal #9 (Mérévillois naming approach), #10 (Join us! site-wide), #11 (Bienvenue), Home #1, #2, #3, Maison de la Rivière #2, Les Maisons #3, Already Done re-review list, Hollywood Hideaway #2 (gathering tile size), Get in Touch #1 (form above calendar), Get in Touch #2 (contact hero phrasing).

## Phase 3 status

This was the only plan in Phase 3 — Phase 3 is now complete (1/1). Milestone 1 deliverables (audit + clear edits + clarification doc) all shipped against the 2026-05-06 deadline.
