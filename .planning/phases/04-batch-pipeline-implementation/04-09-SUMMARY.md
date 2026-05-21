---
phase: 04-batch-pipeline-implementation
plan: "09"
subsystem: feedback-api
tags: [gap-closure, security, cr-02, cr-03, submit-ts]
dependency_graph:
  requires: [04-01, 04-02, 04-03, 04-04, 04-05, 04-06, 04-07, 04-08]
  provides: [approxDecodedBytes, partial-failure-response]
  affects: [src/pages/api/feedback/submit.ts]
tech_stack:
  added: []
  patterns: [decoded-base64-length, conditional-spread-response]
key_files:
  created: []
  modified:
    - src/pages/api/feedback/submit.ts
decisions:
  - "approxDecodedBytes placed module-scope above handleV2Batch; not exported (module-internal is sufficient)"
  - "Clean-batch response is byte-identical to pre-fix: conditional spread adds warning+commitErrors only when commitErrors.length > 0"
  - "MAX_BATCH_BYTES and MAX_BATCH_EDITS constants untouched (D-03 cap reconciliation)"
  - "TypeScript not installed in project — syntax verified via node --check; type safety validated by code inspection"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-21T08:47:25Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 1
---

# Phase 4 Plan 9: Gap Closure CR-02 + CR-03 in submit.ts Summary

**One-liner:** Close CR-02 (spoofable byte cap) and CR-03 (silent partial photo-commit failure) in `handleV2Batch` by switching the cap reducer to `approxDecodedBytes(dataBase64)` and aggregating per-edit `commitError` entries into the 200 response body.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add `approxDecodedBytes` helper and switch cap gate to decoded bytes | `9409ac6` | `src/pages/api/feedback/submit.ts` |
| 2 | Aggregate per-edit `commitError` into `commitErrors[]` + `warning` on 200 response | `eac7ec0` | `src/pages/api/feedback/submit.ts` |

## What Was Built

### Task 1 — CR-02 fix (spoofable byte cap)

Added `approxDecodedBytes(b64: string): number` module-scope helper at line 328 of `submit.ts`, placed just above `handleV2Batch`. The helper:
- Returns 0 for empty/falsy input
- Strips a data-URL prefix (e.g. `data:image/jpeg;base64,<data>`) by splitting on `,` and taking the last segment
- Computes padding count (2 for `==` ending, 1 for `=`, 0 otherwise)
- Returns `Math.floor((s.length * 3) / 4) - pad`

The `totalBytes` reducer in `handleV2Batch` now sums `approxDecodedBytes(e?.image?.dataBase64 || '')` instead of `e.image.bytes` (the client-supplied descriptor). The old descriptor-based reducer is gone. The `imageMeta()` response-shape echo of `.bytes` is untouched (acceptable per plan — it is a response echo, not the cap computation).

### Task 2 — CR-03 fix (silent partial photo-commit failure)

After the single `patchIssueBody()` call, the response now aggregates `finalMachineEdits` entries that have `commitError` truthy into:

```ts
const commitErrors = finalMachineEdits
  .map((m, i) => (m.commitError ? { index: i, error: m.commitError } : null))
  .filter((x): x is { index: number; error: string } => x !== null);
```

When `commitErrors.length > 0`, the 200 response gains two additional top-level fields via conditional spread:
- `warning: '<N> of <M> photo(s) failed to upload'` (where N = commitErrors.length, M = p.edits.length)
- `commitErrors: [{ index, error }, ...]`

When zero failures, the response is byte-identical to before the fix: `{ ok: true, issueNumber, issueUrl }`. This mirrors the v1 `warning` semantics in `handleV1` at lines 295-303.

## New Partial-Failure Response Contract

The contract that `feedback.astro`'s forwarder (04-10) and the UI must spread:

```json
{
  "ok": true,
  "issueNumber": 123,
  "issueUrl": "https://github.com/...",
  "warning": "2 of 3 photo(s) failed to upload",
  "commitErrors": [
    { "index": 1, "error": "photo commit failed" },
    { "index": 2, "error": "photo commit failed" }
  ]
}
```

04-10's `feedback.astro` forwarder must relay `data.warning` and `data.commitErrors` onto the `mar-feedback-result` postMessage so the inject can surface "sent — but N photos failed; re-attach and resubmit those edits".

## Verification Results

| Check | Result |
|-------|--------|
| `grep -c "function approxDecodedBytes" submit.ts` | 1 |
| `grep -c "approxDecodedBytes(e?\.image?\.dataBase64" submit.ts` | 1 (line 366) |
| Old descriptor reducer (`e.image.bytes` in reduce) | Gone — only appears in comment (line 364) and imageMeta echo (lines 216, 458) |
| `grep -c "commitErrors" submit.ts` | 5 |
| `grep -n "warning.*photo" submit.ts` | lines 300 (v1) and 597 (v2 — new) |
| `grep -c "CR-02" submit.ts` | 2 |
| `grep -c "CR-03" submit.ts` | 1 |
| `node --check public/feedback-inject.js` | exit 0 (sanity — file untouched) |
| OPS-02 fence (`git diff main -- fenced paths \| wc -l`) | 0 |
| `node --check src/pages/api/feedback/submit.ts` | exit 0 (syntax valid) |

## Known Mid-Flight Breakage (Expected)

**Smoke harness scenario 4 will FAIL after this plan lands and before 04-10 updates it.**

Scenario 4 in `scripts/smoke-feedback-v2.mjs` asserts the byte cap fires by posting `dataBase64: 'AAAA'` (3 decoded bytes) with a spoofed `bytes: 1.5 MB` descriptor. Before this plan, the server read the spoofed descriptor — so the cap fired "correctly" (but against the wrong data). After this plan, the server reads the actual decoded length (3 bytes) which does NOT exceed `MAX_BATCH_BYTES = 3 MB`. The scenario-4 assertion now fails because the cap does NOT fire on a tiny AAAA string.

This is the PROOF that CR-02 is fixed. 04-10 must update scenario 4 to ship an actually-oversize base64 string (e.g. `'A'.repeat(capBytes * 2)`) so the test exercises the real code path.

**Scenarios 1, 2, 3, 5 are unaffected** — none of those scenarios exercise the byte cap or the partial-failure response shape.

## Out of Scope — Not Touched

- `MAX_IMAGE_BYTES > MAX_BATCH_BYTES` asymmetry (WR-01 from review) — out of scope per plan
- `validate.ts` — not modified; clean per non-goals
- v1 `handleV1` — not modified; warning semantics already correct at lines 295-303
- OPS-02 fence files — untouched; fence returns 0

## Deviations from Plan

None. Plan executed exactly as written.

The only deviation from a strict reading of the acceptance criteria: `npx tsc --noEmit -p tsconfig.json` could not run because TypeScript is not installed as a project dependency (Astro bundles it internally but does not expose `tsc`). Syntax was verified via `node --check` (exit 0). Type correctness was validated by code inspection — the `approxDecodedBytes` helper accepts `string` and returns `number`; the `commitErrors` filter uses a TypeScript type predicate `(x): x is { index: number; error: string }` which is valid strict-mode TypeScript.

## Self-Check

- [x] `src/pages/api/feedback/submit.ts` modified — confirmed
- [x] Commit `9409ac6` exists — confirmed
- [x] Commit `eac7ec0` exists — confirmed
- [x] `approxDecodedBytes` function at line 328 — confirmed
- [x] Reducer uses `approxDecodedBytes(e?.image?.dataBase64 || '')` — confirmed (line 366)
- [x] `commitErrors` aggregation and `warning` in response — confirmed (lines 586-600)
- [x] OPS-02 fence = 0 — confirmed
- [x] No STATE.md or ROADMAP.md modified — confirmed (only submit.ts changed)

## Self-Check: PASSED
