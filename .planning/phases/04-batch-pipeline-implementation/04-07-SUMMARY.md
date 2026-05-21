---
phase: 04-batch-pipeline-implementation
plan: 07
subsystem: docs
tags: [feedback, claude-md, batch, v2-schema, documentation, ops-03]

# Dependency graph
requires:
  - phase: 04-batch-pipeline-implementation
    provides: "Plan 05 added `## 8. Batch submissions` to `.github/CLAUDE_FEEDBACK.md` — the new CLAUDE.md bullet cross-references it."
  - phase: 04-batch-pipeline-implementation
    provides: "Plans 01-04 landed v2 batch submit path (`schemaVersion: 2 && batch: true`), shared validator at `src/pages/api/feedback/validate.ts`, and `feedback-inject.js` corner chip — all referenced by the new bullet."
provides:
  - "Discoverable architectural doc for v2 batch submissions in CLAUDE.md (the canonical project memory)"
  - "Implicit cross-reference from CLAUDE.md → `.github/CLAUDE_FEEDBACK.md §8` so future devs / AI find the operating manual"
  - "Explicit promise in the architectural docs that the v1 single-edit path stays for cached browsers indefinitely (T-04-32 mitigation)"
  - "Pointer in the architectural docs to `src/pages/api/feedback/validate.ts` as the source-of-truth shared validator (T-04-33 mitigation)"
affects: [phase-05-canary, future-feedback-feature-work, ai-agent-onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CLAUDE.md `Feedback mode` subsection is the architectural-doc layer for the feedback pipeline; new behavioural surface gets a one-line bullet here so it stays discoverable from the project memory"

key-files:
  created: []
  modified:
    - "CLAUDE.md (one-line bullet append under §Architectural Constraints → Feedback mode)"

key-decisions:
  - "Used the exact recommended wording from PATTERNS.md §`CLAUDE.md §'Feedback mode'` (verbatim), plus the `Operating manual: .github/CLAUDE_FEEDBACK.md §8` tail to make the cross-reference explicit rather than implicit"
  - "Inserted the bullet as the 5th and last bullet under the Feedback mode subsection — placed immediately after the existing `self-codes` bullet, before the `## Anti-Patterns` H2 — matching plan-prescribed placement"
  - "Kept the change pure-append (0 lines removed, 1 line added) per OPS-02 scope fence and plan acceptance criteria"

patterns-established:
  - "Architectural doc bullets follow `**Bold lead.**` then 2-3 sentences with inline `` `code` ``. The new bullet mirrors the existing `Cache-bust constant` bullet style verbatim"
  - "When a Phase ships a new sibling-flow behaviour, the architectural-doc bullet should explicitly point at (a) the detection mechanism, (b) the shared invariant (validator/version), (c) the back-compat promise, (d) the operating-manual location"

requirements-completed:
  - OPS-03

# Metrics
duration: 4min
completed: 2026-05-21
---

# Phase 04 Plan 07: CLAUDE.md v2 Batch-Submissions Doc Note Summary

**One-line bullet appended to `CLAUDE.md` Feedback-mode section announcing v2 batch submissions, the shared validator at `src/pages/api/feedback/validate.ts`, the indefinite v1 back-compat promise, and a cross-reference to `.github/CLAUDE_FEEDBACK.md §8`.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-21T04:38Z (approx)
- **Completed:** 2026-05-21T04:42:55Z
- **Tasks:** 1 / 1
- **Files modified:** 1

## Accomplishments

- Added a 5th bullet to the `### Feedback mode` subsection in `CLAUDE.md`'s `## Architectural Constraints` chapter, documenting v2 batch submissions for future maintainers (devs and AI agents) so they discover the v2 schema, shared validator, v1 back-compat promise, and operating-manual location from the canonical project memory.
- Satisfied REQ **OPS-03** / decision **D-19** (one-line architectural-doc note for v2 batching in the same PR that ships the v2 implementation).
- Held the **OPS-02** scope fence at zero diff lines against the editor flow (`public/editor-inject.js`, `public/editor/`, `public/guardrails.js`, `src/pages/api/site/`, `middleware.ts`) — the change is additive to CLAUDE.md only.
- Held the inverse fence too: zero diff lines against `src/pages/api/feedback/submit.ts`, `public/feedback-inject.js`, `src/lib/feedback-version.ts`, and `.github/CLAUDE_FEEDBACK.md` (Plan 07 is doc-only; v2 implementation lives in Plans 01–06).

## Task Commits

Each task was committed atomically:

1. **Task 1: Append the v2 batch-submissions bullet to CLAUDE.md "Feedback mode" section** — `1597f45` (docs)

## Files Created/Modified

- `CLAUDE.md` — Added one bullet (line 262, immediately after the "feedback pipeline self-codes" bullet) documenting:
  - Detection mechanism: `schemaVersion: 2 && batch: true`
  - Server entrypoint: `src/pages/api/feedback/submit.ts`
  - Shared validator: `src/pages/api/feedback/validate.ts` (consumed by both v1 and v2 paths so they cannot drift)
  - One-issue-per-batch guarantee
  - v1 single-edit back-compat promise ("stays for cached browsers indefinitely")
  - Operating-manual cross-reference: `.github/CLAUDE_FEEDBACK.md §8`

## Decisions Made

- **Verbatim use of PATTERNS.md-recommended wording.** PATTERNS.md §"`CLAUDE.md` §'Feedback mode'" provided the bullet body word-for-word. Used it as-is, then appended `Operating manual: \`.github/CLAUDE_FEEDBACK.md §8\`.` so the cross-reference to Plan 05's new section is explicit rather than implicit. The plan's `<action>` block explicitly endorses verbatim or near-verbatim use of that recommendation.
- **Bullet placement.** Inserted strictly between the existing "self-codes" bullet (line 261) and the next H2 boundary (`## Anti-Patterns`) — the placement the plan mandates as the 5th and last bullet of the Feedback-mode subsection.

## Deviations from Plan

None - plan executed exactly as written.

(No deviation rules were triggered. The plan was a single-task, single-file, single-bullet append with verbatim suggested wording. No bugs to fix, no missing critical functionality, no blocking issues, no architectural questions.)

## Issues Encountered

- **Minor:** First attempt to run the plan's automated `node -e '…'` verification inline failed because the shell ate a backslash in the `\(` regex escape when interpolating the inline `-e` string. Re-ran the identical script from a file (`/tmp/verify-04-07.mjs`) and it printed `OK`. The verification logic itself was correct — only the bash interpolation needed a different vehicle. No code change; verification eventually passed cleanly on the same edited file.

## Verification Performed

All acceptance criteria from the plan ran green against the post-commit working tree:

| Check | Required | Actual |
|---|---|---|
| `grep -c "Batch submissions (v2 schema)" CLAUDE.md` | 1 | 1 |
| `grep -c "schemaVersion: 2" CLAUDE.md` | ≥1 | 1 |
| `grep -c "batch: true" CLAUDE.md` | ≥1 | 1 |
| `grep -c "src/pages/api/feedback/validate.ts" CLAUDE.md` | ≥1 | 1 |
| `grep -c "CLAUDE_FEEDBACK.md" CLAUDE.md` | ≥1 | 2 |
| Added lines vs main (CLAUDE.md) | ≥1 | 1 |
| Removed lines vs main (CLAUDE.md) | 0 | 0 |
| OPS-02 editor-flow fence diff | 0 | 0 |
| Inverse fence (submit.ts, feedback-inject.js, feedback-version.ts, CLAUDE_FEEDBACK.md) | 0 | 0 |
| Automated `node` check (all six substring assertions) | OK | OK |

## Threat-Model Coverage

The bullet wording materialises the mitigations declared in the plan's `<threat_model>`:

| Threat | Disposition | Mitigation realised in bullet text |
|---|---|---|
| T-04-32 (Repudiation — future change drops v1 back-compat without realising cached browsers depend on it) | mitigate | Bullet states: *"The v1 single-edit path stays for cached browsers indefinitely."* |
| T-04-33 (Tampering — client/server validation drift via one-sided edit) | mitigate | Bullet states: *"Per-edit validation runs through the shared helper consumed by both v1 and v2 paths (`src/pages/api/feedback/validate.ts`) so they can never drift."* |
| T-04-34 (Information Disclosure — documenting v2 schema in a tracked file) | accept | Intentional. CLAUDE.md is internal docs; auth gate on `/api/feedback/submit` is the real defence. |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **OPS-03 closed.** All three OPS requirements for Phase 4 are now satisfied across the wave-5 PR:
  - OPS-01 (cache-bust `FEEDBACK_INJECT_VER`) — Plan 06 (parallel peer; runs concurrently in a separate worktree).
  - OPS-02 (additive-only / no editor-flow files touched) — Held across the entire phase, including this plan (0 diff lines).
  - OPS-03 (CLAUDE.md doc note for v2) — Closed by this plan.
- **Phase 4 architectural-doc layer is now consistent with implementation.** The bullet visibly closes the gap between "v2 ships in code (Plans 01–04)" and "v2 is documented at the architectural-memory layer (CLAUDE.md)". A future dev opening CLAUDE.md no longer sees only the v1 pattern.
- **Phase 5 canary work (OPS-04, OPS-05)** is unblocked from a documentation standpoint. The v2 schema is now discoverable from the architectural docs, so the canary protocol can reference CLAUDE.md as the entry point.
- **No blockers introduced.** OPS-02 fence held at 0 lines. No untracked files created. No deletions.

## Self-Check: PASSED

- FOUND: `CLAUDE.md` (modified — bullet at line 262)
- FOUND: `1597f45` (commit `docs(04-07): document v2 batch submissions in CLAUDE.md Feedback mode`)
- FOUND: `.planning/phases/04-batch-pipeline-implementation/04-07-SUMMARY.md` (this file — being written now, will be committed next)

---
*Phase: 04-batch-pipeline-implementation*
*Completed: 2026-05-21*
