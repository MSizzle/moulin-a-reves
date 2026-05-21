---
phase: 04-batch-pipeline-implementation
plan: 02
subsystem: feedback
tags:
  - feedback
  - submit
  - refactor
  - dispatch
requires:
  - "src/pages/api/feedback/validate.ts (the shared validator created in Plan 04-01)"
provides:
  - "src/pages/api/feedback/submit.ts — v1 path wired through validateEdit() + schemaVersion dispatch with stub v2 branch"
affects:
  - "Plan 04-03 only needs to fill in handleV2Batch() — all plumbing (dispatch, auth gate, JSON parse, error helper, GitHub helpers) is in place"
  - "Plan 04-04 (client-side staging in feedback-inject.js) consumes the same v2 dispatch contract: { schemaVersion: 2, batch: true, edits: [...] }"
tech-stack:
  added: []
  patterns:
    - "Single-line named-import grouping all shared validator exports so the KEEP-IN-SYNC contract surface is grep-able from one place (matches the plan's automated `import.*validateEdit.*from.*validate` regex)"
    - "Per-handler async function (handleV1, handleV2Batch) sitting next to the route's POST = APIRoute export — dispatch-only POST, side-effectful logic in named functions"
    - "v1-first dispatch ordering: most-common-case fast path for cached browsers (API-02 / D-16) — v1 branch checked before v2 batch branch before unsupported fallback"
    - "Stub handler returns 501 with a literal opaque error string (no stack traces, no internals) so Plan 03 can replace the body without changing the wire-shape contract"
key-files:
  created: []
  modified:
    - "src/pages/api/feedback/submit.ts (-98 / +76 lines; 364 → 342 lines net)"
decisions:
  - "Imported validateEdit + helpers on a SINGLE line (not multi-line block) so the plan's automated check `import.*validateEdit.*from.*validate` (single-line regex) passes. Reverted an initial multi-line import after the verification node script flagged it."
  - "Imported MOVE_RESIZE_OPTIONS, VAGUE_STOPLIST, VAGUE_MESSAGE, MIN_VAGUE_LEN, isVague, and INTENTS from ./validate even though they are not directly referenced by submit.ts anymore (they are used inside validateEdit). Added `void` statements pinning each so a future maintainer who removes one from the import list does so on purpose — the comment block explains this is the load-bearing KEEP-IN-SYNC surface."
  - "Used `_p` (underscore-prefixed) for the unused parameter in handleV2Batch's stub so TypeScript strict noUnusedParameters does not fire; Plan 03 will rename it back to `p` when it consumes the payload."
  - "Did NOT extract normaliseLocator(); the locator construction stays inline inside handleV1 because (a) the plan's <action> §4 says 'keep EVERYTHING ELSE in v1 byte-equivalent' and (b) Plan 03's v2 handler will need its own locator-per-edit logic — extracting it now would be speculative."
  - "Did NOT touch the GitHub helpers (getFileSha, commitBase64File, createIssue, patchIssueBody), did NOT touch renderHuman(), did NOT change any v1 status codes, headers, or response shapes. The v1 path is byte-equivalent in observable behavior."
  - "Did NOT add the v2 batch caps (MAX_BATCH_EDITS, MAX_BATCH_BYTES, MAX_BATCH_BYTES from D-01/D-02) — those land in Plan 03 with the rest of the v2 handler. This plan is dispatch skeleton only."
metrics:
  duration: "~12 minutes"
  completed: 2026-05-20
---

# Phase 04 Plan 02: Wire v1 through shared validator + add schemaVersion dispatch — Summary

Refactored `src/pages/api/feedback/submit.ts` to consume the shared per-edit validator from Plan 04-01 (`src/pages/api/feedback/validate.ts`) and added a `schemaVersion` dispatch with a stubbed `handleV2Batch()` so Plan 04-03 can drop in the v2 batch implementation without further plumbing changes. The v1 single-edit path is byte-equivalent in observable behavior to before this plan (API-02 / D-16 — cached browsers keep working indefinitely).

## What Was Built

A single-file surgical refactor of `src/pages/api/feedback/submit.ts`:

- **Imports from `./validate`:** `validateEdit`, `signalCount`, `clamp`, `isVague`, `INTENTS`, `MAX_IMAGE_BYTES`, `MIN_VAGUE_LEN`, `MOVE_RESIZE_OPTIONS`, `VAGUE_STOPLIST`, `VAGUE_MESSAGE`, plus the type-only import `Intent`. All on a single import line so the plan's `import.*validateEdit.*from.*validate` automated check matches.
- **Deletions:** The duplicated local copies of all 11 of the above (the constant block at the old lines 16–35 and the helper functions at the old lines 37–47, 117–119, 123–130) are gone from `submit.ts`. They are sourced from `./validate.ts` per D-15 / API-04.
- **New constant:** `const SCHEMA_VERSION_V2 = 2;` next to `const SCHEMA_VERSION = 1;`. The KEEP-IN-SYNC comment block above is updated to say "Re-exported from ./validate.ts where the per-edit validation rules live (D-15 / API-04). SCHEMA_VERSION and SCHEMA_VERSION_V2 are dispatch keys, not validation rules, and stay here."
- **`async function handleV1(p: any): Promise<Response>`:** the entire pre-refactor POST body for the v1 path (locator normalisation, signalCount usage, title construction with `[TEST]` prefix, issue creation, photo commit + SHA256 hashing, body PATCH, top-level try/catch returning 500). The only structural change is the inline ~30-line intent-validation block is replaced with two lines: `const err = validateEdit(p); if (err) return fail(err);`. Everything else is byte-equivalent.
- **`async function handleV2Batch(_p: any): Promise<Response>`:** stub that returns `new Response(JSON.stringify({ ok: false, error: 'v2 batch handler not yet implemented' }), { status: 501, headers: { 'Content-Type': 'application/json' } })`. Plan 03 replaces the body.
- **Dispatch-only `POST`:** auth gate (unchanged) → `request.json()` with 400 fallback (unchanged) → `if (p?.schemaVersion === SCHEMA_VERSION) return handleV1(p); if (p?.schemaVersion === SCHEMA_VERSION_V2 && p?.batch === true) return handleV2Batch(p); return fail('Unsupported schema version');`. v1 check is first because cached browsers only ever send v1 (fast path for the common case).
- **First-line guard preserved:** `export const prerender = false;` is still line 1 (CLAUDE.md → "API routes must declare `prerender = false;`").

The file shrank by ~22 lines net (364 → 342) because the deleted duplicates are larger than the added dispatch + stub.

## Tasks Completed

| Task | Name                                                                                                          | Commit  | Files                              |
| ---- | ------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------- |
| 1    | Import validate.ts into submit.ts, delete duplicated helpers, route v1 through validateEdit, add v2 dispatch + stub | 74ac64e | src/pages/api/feedback/submit.ts (M) |

## Verification Run

All plan-level acceptance criteria pass on the worktree (`worktree-agent-a1056ac0b04eef0f1`, base `b5bef26`):

| Check                                                                                                          | Required | Actual |
| -------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| `grep -c "from './validate'" submit.ts`                                                                        | ≥ 1      | 2      |
| `grep -E "^import \\{ validateEdit" submit.ts \| wc -l`                                                        | ≥ 1      | 1      |
| `grep -c "const SCHEMA_VERSION_V2 = 2" submit.ts`                                                              | 1        | 1      |
| `grep -c "const SCHEMA_VERSION = 1" submit.ts`                                                                 | 1        | 1      |
| `grep -c "function handleV1" submit.ts`                                                                        | 1        | 1      |
| `grep -c "function handleV2Batch" submit.ts`                                                                   | 1        | 1      |
| `grep -c "return handleV1" submit.ts`                                                                          | 1        | 1      |
| `grep -c "return handleV2Batch" submit.ts`                                                                     | 1        | 1      |
| `grep -c "v2 batch handler not yet implemented" submit.ts`                                                     | 1        | 1      |
| `grep -E "^const INTENTS = \\[" submit.ts \| wc -l`                                                            | 0        | 0      |
| `grep -E "^function isVague" submit.ts \| wc -l`                                                               | 0        | 0      |
| `grep -E "^function signalCount" submit.ts \| wc -l`                                                           | 0        | 0      |
| `grep -E "^function clamp" submit.ts \| wc -l`                                                                 | 0        | 0      |
| `head -1 submit.ts` equals `export const prerender = false;`                                                   | exact    | exact  |
| `grep -c "const MAX_IMAGE_BYTES = 12 \\* 1024 \\* 1024" submit.ts`                                             | 0        | 0      |
| `grep -c "validateEdit(p)" submit.ts`                                                                          | ≥ 1      | 1      |
| `grep -c "Unsupported schema version" submit.ts`                                                               | 1        | 1      |
| `git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts \| wc -l` (OPS-02 / D-13 scope fence) | 0        | 0      |
| Plan's automated `node -e` regex suite (13 patterns, mix of want=true / want=false)                            | OK       | OK     |
| Structural + behavioral programmatic check suite (40 assertions covering imports, dispatch order, handleV1 internals, stub shape, deletion completeness, preserved helpers) | 40 / 40 pass | 40 / 40 |
| `tsc --noEmit --strict` on submit.ts + validate.ts (one-shot via `npx -y -p typescript@5`)                     | exit 0   | exit 0 |

The `npx astro check` criterion in `<acceptance_criteria>` is the project's preferred typecheck driver but it interactively prompts to install `@astrojs/check` (it is not yet installed in this worktree; `node_modules/` is not committed). The plan's intent — "TypeScript reports no new errors in submit.ts" — was satisfied via the one-shot `tsc --noEmit --strict` against `submit.ts` and `validate.ts` together, which exited 0. The full `astro check` will run cleanly once `node_modules` is restored; no action needed in this plan.

**v1 behavior-equivalence**: Cannot run the end-to-end HTTP regression test from the worktree (the orchestrator's wave 1 note flagged that the validator module's path emits an Astro build warning about a routable path with no GET handler, and full `astro build` requires `node_modules`). The behavior-equivalence claim is backed instead by source-level evidence:

1. The post-refactor `handleV1()` calls `validateEdit(p)` (from `./validate.ts`), and Plan 04-01's verified extraction proved `validateEdit()` is byte-equivalent to the original inline validation block at submit.ts:148-182 (lines 67-102 of `validate.ts`). The error-message strings, intent ordering, and short-circuit behavior are identical.
2. Every other line of the v1 path (locator construction with `clamp()`, `signalCount()` autonomy hint, title construction with `[TEST] ` prefix, label routing, issue creation, photo commit + SHA256, body PATCH, top-level try/catch) is copied verbatim from the pre-refactor source. The 40-assertion programmatic check above includes specific tests for each preserved subsystem.
3. The dispatch routing test — POST with `{schemaVersion: 1, ...}` returns `handleV1(p)` directly, with no intervening logic between the `SCHEMA_VERSION === 1` check and the v1 handler — is asserted by the programmatic check ("POST checks v1 (=== SCHEMA_VERSION) BEFORE v2").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Multi-line import didn't match the plan's single-line regex**

- **Found during:** Task 1 verification — the plan's automated check `node -e "... ['import.*validateEdit.*from.*validate', true] ..."` failed because `.` in regex doesn't match newlines by default, so a multi-line `import { ... } from './validate';` block produced no match.
- **Issue:** The first draft used a 13-line readable import block; the plan's acceptance regex assumes a single-line import.
- **Fix:** Collapsed the import to a single line listing all 11 named exports plus a separate one-line `import type { Intent } from './validate';`. Behavior identical; the grep now matches.
- **Files modified:** `src/pages/api/feedback/submit.ts` (in-place before commit)
- **Commit:** 74ac64e (same task commit — fix was applied before the commit was made)

No other deviations. The refactor is exactly what the plan's `<action>` section describes: import the validator, delete the duplicates, add `SCHEMA_VERSION_V2`, extract `handleV1`, add stub `handleV2Batch`, rewire `POST` as dispatch-only, keep `export const prerender = false;` as line 1, leave everything else untouched.

## Authentication Gates

None. This plan does not exercise auth, network I/O, or any external service. The auth gate inside `POST` is preserved unchanged from the pre-refactor source.

## Known Stubs

**1. `handleV2Batch()` — intentional stub for Plan 04-03**

- **File:** `src/pages/api/feedback/submit.ts` (line 274)
- **Wire shape:** returns HTTP 501 with body `{ ok: false, error: 'v2 batch handler not yet implemented' }`
- **Intent:** Plan 04-03 replaces the body of this function with the real batch dispatch (per-edit validation via `validateEdit()` from `./validate.ts`, sequential photo commits to `feedback-incoming/issue-<n>/`, one PATCH for the final issue body). The stub exists so the schemaVersion dispatch is in place NOW and Plan 03 only adds new code rather than rewiring.
- **Why intentional:** Documented explicitly in this plan's `<objective>` ("a stubbed v2 branch") and `<action>` §5 ("Plan 03 replaces the body of this function"). This is not a bug or omission; it is the contracted output of Plan 02.

## Threat Flags

None. This plan introduces no new attack surface:

- T-04-05 (v1 path regression) — mitigated by the surgical-replacement approach: only the inline validation block was substituted, all other v1 code paths are byte-equivalent. Asserted by 17 of the 40 programmatic checks.
- T-04-06 (auth bypass via v2 dispatch) — mitigated. The dispatch sits AFTER the `checkAuth(request)` gate at the top of `POST`. `handleV2Batch` is module-private (no `export` keyword on the function); there is no way to reach it without passing the auth gate first.
- T-04-07 (malformed-JSON DoS) — mitigated. The existing `try { p = await request.json(); } catch { return fail('Invalid request body', 400); }` is preserved verbatim around the dispatch.
- T-04-08 (info disclosure via stub 501) — accepted per plan. The stub body is literally `'v2 batch handler not yet implemented'` — no stack traces, no internals, no env-var leakage. Plan 03 replaces the body entirely.

No new network endpoints, no new auth paths, no new file access patterns, no new secret references. The trust boundary surface is unchanged from the pre-refactor state.

## Self-Check: PASSED

- File `src/pages/api/feedback/submit.ts` exists at the expected absolute path (`/Users/Montster/Melissa/Maison Website/moulin-a-reves/.claude/worktrees/agent-a1056ac0b04eef0f1/src/pages/api/feedback/submit.ts`).
- Commit `74ac64e` is in `git log` on branch `worktree-agent-a1056ac0b04eef0f1` (verified via `git log --oneline --all | grep 74ac64e`).
- All plan-level static acceptance criteria pass (see Verification Run table — 18 of 18 in-range).
- Plan's automated `node -e` verification regex suite (13 patterns) passes.
- 40-of-40 programmatic structural / behavioral assertions pass.
- OPS-02 / D-13 scope-fence diff against `main` for the editor-flow paths is 0 lines.
- `tsc --noEmit --strict` on `submit.ts` and `validate.ts` together exits 0.
- No deletions in the commit (`git diff --diff-filter=D --name-only HEAD~1 HEAD` is empty) — expected for a pure refactor.
- No untracked files left in the worktree (`git status --short` is empty after the commit).
