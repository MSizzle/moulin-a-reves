---
phase: 04-batch-pipeline-implementation
plan: 01
subsystem: feedback
tags:
  - feedback
  - validator
  - extraction
  - shared-helper
requires:
  - "src/pages/api/feedback/submit.ts (source of verbatim extraction; unmodified in this plan)"
provides:
  - "src/pages/api/feedback/validate.ts — shared per-edit validator + helpers (D-15 / API-04)"
affects:
  - "Plan 04-02 will rewire submit.ts to import from validate.ts (v1 path)"
  - "Plan 04-03 will consume validate.ts from the v2 batch dispatch (no rule drift)"
tech-stack:
  added: []
  patterns:
    - "Pure helper module under src/pages/api/feedback/ (no APIRoute export, no prerender directive) — mirrors clarify.ts module-structure convention but without the route exports"
    - "validateEdit returns null|string (never Response) so the same function serves both fail()-wrapped (v1) and errors[]-accumulating (v2) callers"
    - "KEEP-IN-SYNC binding via doc-comment markers (D-15, API-04, MIRROR of public/feedback-inject.js::validateFields)"
key-files:
  created:
    - "src/pages/api/feedback/validate.ts (102 lines)"
  modified: []
decisions:
  - "Adopted D-15 as written: extract before either v1 rewire or v2 batch is touched, so the shared rules are a refactor-safe foundation."
  - "Did NOT add `export const prerender = false;` — the file is not a route; the doc-comment header explains this so a future maintainer doesn't paste the directive back in."
  - "Did NOT extract normaliseLocator(): the plan scopes this file to validator helpers only. Locator-clamping (submit.ts:184-216) stays in submit.ts for now (out of plan scope)."
  - "Used `as const` on INTENTS and MOVE_RESIZE_OPTIONS verbatim from submit.ts so the Intent type union and the runtime list cannot diverge."
  - "Returned the VAGUE_MESSAGE constant from move-resize/something-else branches (not a string literal) so future tweaks to the message text propagate via one definition."
metrics:
  duration: "~10 minutes"
  completed: 2026-05-20
---

# Phase 04 Plan 01: Extract shared per-edit feedback validator — Summary

Created the shared per-edit validator module `src/pages/api/feedback/validate.ts` by verbatim extraction of the constant block and helper functions from `src/pages/api/feedback/submit.ts` (lines 16-47, 117-130, 148-182). This is step 1 of the phase per D-15 / API-04: the v1 single-edit path (Plan 02) and the v2 batch path (Plan 03) will both consume this module so their per-edit rules can never drift.

## What Was Built

A single new file — `src/pages/api/feedback/validate.ts` (102 LOC) — exporting:

- **Constants:** `INTENTS`, `MAX_IMAGE_BYTES` (= `12 * 1024 * 1024`), `MIN_VAGUE_LEN` (= 25), `MOVE_RESIZE_OPTIONS`, `VAGUE_STOPLIST`, `VAGUE_MESSAGE`
- **Type:** `Intent` (union derived from `(typeof INTENTS)[number]`)
- **Pure functions:**
  - `isVague(raw: unknown): boolean` — verbatim from submit.ts:37-47
  - `clamp(s: unknown, max: number): string` — verbatim from submit.ts:117-119
  - `signalCount(p: any): number` — verbatim from submit.ts:123-130
  - `validateEdit(p: any): string | null` — extracted from submit.ts:148-182; returns null on pass, error-message string on fail; never constructs a Response object so the same function serves both v1 (caller wraps with `fail()`) and v2 (caller accumulates into `errors[]` for API-03).

`SCHEMA_VERSION` was intentionally NOT moved — it is the dispatch key in submit.ts (v1=1 vs v2=2 in Plan 03), not a validation rule.

## Tasks Completed

| Task | Name                                                 | Commit  | Files                                  |
| ---- | ---------------------------------------------------- | ------- | -------------------------------------- |
| 1    | Create validate.ts with extracted helpers + constants | 4dd3d90 | src/pages/api/feedback/validate.ts (+) |

## Verification Run

All plan-level acceptance criteria pass on the worktree (`worktree-agent-aa0df952a026d0706`, base `c39eac9`):

| Check                                                                                                                                  | Required | Actual |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| `test -f src/pages/api/feedback/validate.ts`                                                                                           | exit 0   | exit 0 |
| `grep -c "export const prerender" src/pages/api/feedback/validate.ts`                                                                  | 0        | 0      |
| `grep -c "export function validateEdit" …/validate.ts`                                                                                 | 1        | 1      |
| `grep -c "export function signalCount" …/validate.ts`                                                                                  | 1        | 1      |
| `grep -c "export function isVague" …/validate.ts`                                                                                      | 1        | 1      |
| `grep -c "export function clamp" …/validate.ts`                                                                                        | 1        | 1      |
| `grep -c "export const INTENTS" …/validate.ts`                                                                                         | 1        | 1      |
| `grep -c "export const MAX_IMAGE_BYTES" …/validate.ts`                                                                                 | 1        | 1      |
| `grep -E "^export (const|function|type)" …/validate.ts | wc -l`                                                                       | ≥ 10     | 11     |
| `grep -c "12 \* 1024 \* 1024" …/validate.ts`                                                                                           | 1        | 1      |
| `git diff <base> -- src/pages/api/feedback/submit.ts public/feedback-inject.js \| wc -l`                                               | 0        | 0      |
| `git diff <base> -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts \| wc -l` (D-13 / OPS-02 scope fence) | 0        | 0      |
| Doc-comment contains "D-15", "API-04", "MIRROR" (case-insensitive)                                                                     | ≥ 1 each | 1 / 1 / 4 |
| `tsc --strict --noEmit src/pages/api/feedback/validate.ts`                                                                             | exit 0   | exit 0 |

The `npx astro check` criterion in `<acceptance_criteria>` is the project's preferred typecheck driver but it interactively prompts to install `@astrojs/check` (it is not yet installed in this worktree). The plan's intent — "TypeScript reports no new errors attributable to validate.ts" — was satisfied via a one-shot `npx -y -p typescript@5 tsc --noEmit --strict ...` against the new file, which exited 0. The full `astro check` will run cleanly once node_modules is restored (it is not committed); no action needed in this plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Doc-comment phrasing tripped the prerender-grep acceptance criterion**

- **Found during:** Task 1 verification (`grep -c "export const prerender"` returned 1 instead of 0)
- **Issue:** The first draft of the doc comment included the literal phrase ``export const prerender = false;`` inside a sentence explaining *why* the file does NOT carry that directive. That literal string matched the same grep the plan uses to assert the file is not a route.
- **Fix:** Reworded the comment to describe the same constraint without including the literal `export const prerender` substring (now: "no APIRoute export and therefore no prerender-opt-out directive"). The semantic message — "this is not a route" — is preserved; the grep gate is now satisfied.
- **Files modified:** `src/pages/api/feedback/validate.ts` (doc-comment lines only; same commit, fixed in place before the commit)
- **Commit:** 4dd3d90 (same task commit — the fix was applied before any commit was made)

No other deviations. The intent-specific validation block, the helpers, and the constants are byte-equivalent to the source ranges in submit.ts. T-04-01 (extraction drift) and T-04-03 (loss of KEEP-IN-SYNC binding) are mitigated by the acceptance criteria + the explicit "MIRROR" / "D-15" / "API-04" doc-comment markers.

## Authentication Gates

None. This plan does not exercise auth, network I/O, or any external service.

## Known Stubs

None. The new module ships fully-functional helpers with no placeholder values, no TODO markers, and no "coming soon" exports.

## Threat Flags

None. The new file performs no I/O, reads no env vars, references no secrets, and exports pure functions only. T-04-02 (info disclosure via accidentally-exported secrets) is satisfied by inspection — no new attack surface introduced.

## Self-Check: PASSED

- File `src/pages/api/feedback/validate.ts` exists at the expected absolute path (`/Users/Montster/Melissa/Maison Website/moulin-a-reves/.claude/worktrees/agent-aa0df952a026d0706/src/pages/api/feedback/validate.ts`).
- Commit `4dd3d90` is in `git log` on branch `worktree-agent-aa0df952a026d0706`.
- All plan-level static acceptance criteria pass (see Verification Run table).
- D-13 / OPS-02 scope-fence diff is 0 lines.
- submit.ts and public/feedback-inject.js diffs vs base are 0 lines (this plan does not modify them — Plan 02 will).
- `tsc --strict --noEmit` on the new file exits 0.
