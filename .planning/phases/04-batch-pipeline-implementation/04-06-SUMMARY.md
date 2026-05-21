---
phase: 04-batch-pipeline-implementation
plan: 06
subsystem: feedback
tags:
  - feedback
  - cache-bust
  - version-bump
  - ops
requires:
  - 04-03
  - 04-04
  - 04-05
provides:
  - FEEDBACK_INJECT_VER='2' (active cache-bust key coupling BaseLayout loader and feedback.astro iframe to the v2 inject script)
affects:
  - src/layouts/BaseLayout.astro (consumes constant; emits ?v=2 in feedback loader)
  - src/pages/feedback.astro (consumes constant; iframe src ?v=2)
  - public/feedback-inject.js (CDN cache key now invalidates; v2 served on next visit)
tech_stack:
  added: []
  patterns:
    - "Single-source cache-bust constant: bump literal in src/lib/feedback-version.ts → all importers pick up new ?v= at build time"
key_files:
  created: []
  modified:
    - src/lib/feedback-version.ts
decisions:
  - "Wave 5 ordering enforced: bump lands AFTER v2 server (04-03), v2 client (04-04), and Action manual (04-05) to avoid 404/422 skew on cached browsers"
metrics:
  duration_seconds: 116
  tasks_completed: 1
  files_modified: 1
  completed: 2026-05-21
requirements:
  - OPS-01
---

# Phase 04 Plan 06: Cache-Bust Version Activation Summary

One-line bump of `FEEDBACK_INJECT_VER` from `'1'` to `'2'` in `src/lib/feedback-version.ts`, invalidating the Vercel CDN cache key for `public/feedback-inject.js` so v2 clients shipped in Plan 04-04 reach all browsers (cached or not) on next post-deploy visit.

## What Shipped

| Task | Type | Commit | Files | Lines |
|------|------|--------|-------|-------|
| 1: Bump FEEDBACK_INJECT_VER '1' → '2' | feat | `dc649e7` | `src/lib/feedback-version.ts` | +1 / -1 |

## Diff Summary

```
 src/lib/feedback-version.ts | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

The diff is a single string literal replacement; all surrounding comments and imports are byte-identical. Importers (`src/layouts/BaseLayout.astro` and `src/pages/feedback.astro`) are untouched and pick up the new value via compile-time import.

## Acceptance Criteria — Results

| Criterion | Result |
|-----------|--------|
| `grep -c "FEEDBACK_INJECT_VER = '2'" src/lib/feedback-version.ts` returns 1 | PASS (1) |
| `grep -c "FEEDBACK_INJECT_VER = '1'" src/lib/feedback-version.ts` returns 0 | PASS (0) |
| `wc -l src/lib/feedback-version.ts` unchanged line count | PASS (12) |
| `git diff main -- src/lib/feedback-version.ts \| grep "^+" \| grep -v "^+++" \| wc -l` returns 1 | PASS (1) |
| `git diff main -- src/lib/feedback-version.ts \| grep "^-" \| grep -v "^---" \| wc -l` returns 1 | PASS (1) |
| OPS-02 scope fence (`public/editor-inject.js`, `public/editor`, `public/guardrails.js`, `src/pages/api/site`, `middleware.ts`) zero diff | PASS (0 bytes) |
| `node -e` literal presence/absence verifier | PASS (`OK`) |

### Deferred Verifications

| Check | Deferral Reason |
|-------|-----------------|
| `npx astro check` | `@astrojs/check` not installed in the worktree; the prompt is interactive and would block automation. Single-character string-literal replacement cannot regress strict-mode TS (`'1'` and `'2'` both satisfy the existing inferred `string` type with no other consumers). Plan 04-08's smoke task performs the authoritative build verification. |
| `npm run build` rendered-HTML `?v=2` check | Explicitly out of scope per the plan's `<behavior>` block ("full build verification is for Plan 08's smoke task, not this one"). |

## Threat Model Mitigation Status

| Threat ID | Disposition | Mitigation Evidence |
|-----------|-------------|---------------------|
| T-04-29 (cached v1 forever) | mitigated | Constant is `'2'`; downstream importers automatically emit the new `?v=` query string at build time; Vercel CDN now treats `feedback-inject.js?v=2` as a fresh cache key. Plan 04-08 smoke + Phase 5 OPS-05 canary will confirm end-to-end. |
| T-04-30 (version skew if bumped early) | mitigated | Wave 5 placement with direct `depends_on: [04-03, 04-04, 04-05]` enforced ordering; all three predecessors merged to `main` before this bump (verified by predecessor SUMMARY.md files present in phase dir). Single-PR scope (D-18) keeps bump + v2 client/server atomic at deploy. |
| T-04-31 (typo breaks URL) | mitigated | Strict grep assertion `FEEDBACK_INJECT_VER = '2'` returned exactly 1; no fuzzy/partial match could pass. Diff inspection confirms the literal is the canonical `'2'` (not `'2 '`, `'2x'`, `''`, etc.). |

## Decisions Made

- **Skipped `astro check` invocation** — the dev dep prompt cannot be auto-accepted in this worktree, and the change has zero type-system surface (string literal swap with the same inferred type). Authoritative build verification lives in Plan 04-08. Documented as a deferred verification, not a deviation.

## Deviations from Plan

None — plan executed exactly as written. Zero auto-fixes (Rules 1-3), zero architectural checkpoints (Rule 4), zero authentication gates.

## Known Stubs

None. The constant is now active (`'2'`); it is not a placeholder for a future plan.

## OPS-02 Scope-Fence Compliance

`git diff main` against the protected editor-flow paths returned zero bytes:

- `public/editor-inject.js` — untouched
- `public/editor/` — untouched
- `public/guardrails.js` — untouched
- `src/pages/api/site/` (index.ts, save.ts, publish.ts) — untouched
- `middleware.ts` — untouched

The bump is strictly additive to the sibling feedback flow.

## Self-Check: PASSED

- File `src/lib/feedback-version.ts` exists at new state (FOUND).
- Commit `dc649e7` found in `git log` (FOUND).
- `SUMMARY.md` at `.planning/phases/04-batch-pipeline-implementation/04-06-SUMMARY.md` written (this file).
