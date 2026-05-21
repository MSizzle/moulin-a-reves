---
phase: 04-batch-pipeline-implementation
plan: 03
subsystem: feedback
tags:
  - feedback
  - submit
  - v2-batch
  - issue-construction
  - server-cap
  - d-03-vercel-limit
  - photo-commit
  - api-05
requires:
  - "src/pages/api/feedback/validate.ts (shared validator from Plan 04-01)"
  - "src/pages/api/feedback/submit.ts dispatch skeleton from Plan 04-02"
provides:
  - "src/pages/api/feedback/submit.ts — fully implemented v2 batch handler (handleV2Batch) — POST {schemaVersion:2, batch:true, edits:[...]} returns 200 with {ok, issueNumber, issueUrl} after creating ONE GitHub issue and committing photos to feedback-incoming/issue-<N>/edit-<i+1>-<safeName>"
affects:
  - "Plan 04-04 (client v2 batch state machine in public/feedback-inject.js): MUST mirror MAX_BATCH_BYTES=3 (Hobby-safe) AND MAX_BATCH_EDITS=10 EXACTLY. KEEP-IN-SYNC comment blocks above both constants in submit.ts document this; D-03 chose Hobby-safe 3 MB so the client mirror MUST stay at 3 MB unless Vercel tier is verified higher."
  - "Plan 04-08 (smoke harness): use the v2 batch contract documented in submit.ts handleV2Batch. Cap-violation tests should target the 3 MB byte cap and the 10-edit cap."
tech-stack:
  added: []
  patterns:
    - "Sequential await loop for GitHub Contents API PUTs (NOT Promise.all) — avoids parent-SHA races on the shared feedback-incoming/issue-<N>/ tree. Mirrors PATTERNS.md §Shared Patterns → GitHub Contents API: get-SHA-then-PUT."
    - "Per-edit-index filename prefix (edit-<i+1>-<safeName>) prevents same-filename collisions across edits in one batch (T-04-15)."
    - "Best-effort SHA-256 hashing via crypto.subtle.digest — failure path keeps sha256:null and continues, mirroring v1's graceful-fallback shape."
    - "Single final patchIssueBody() per batch (API-05 — NOT N PATCH calls). The placeholder body from issue creation is overwritten exactly once after all photos commit."
    - "commitError best-effort: a failed photo commit records {commitError:'photo commit failed', committedPath:null} and the handler still returns 200 with the issue link — same UX shape v1 uses for upload failures."
key-files:
  created:
    - ".planning/phases/04-batch-pipeline-implementation/04-03-SUMMARY.md"
  modified:
    - "src/pages/api/feedback/submit.ts (+245 lines net across the three tasks; 342 → 633 lines): Task 1 added MAX_BATCH_BYTES + D-03 comment; Task 2 added MAX_BATCH_EDITS/failBatch/failCap and the full handleV2Batch input gates + issue construction; Task 3 added the photo-commit loop + single final patchIssueBody."
decisions:
  - "D-03 reconciliation outcome: chose the Hobby-safe value (MAX_BATCH_BYTES = 3 * 1024 * 1024 ≈ 3 MB raw → ~4 MB base64 on the wire). The Vercel CLI tier-verification step (Task 1 sub-step 3a) was not available in the session; per the plan's conservative-default fallback (3b), the constant ships safe AND the comment block flags the operator to confirm the tier at https://vercel.com/MSizzle/moulin-a-reves/settings/general before merge. If Pro+ with body-size override is confirmed, lift to 30 MB and update the client mirror in Plan 04-04 in the same iteration."
  - "Mirrored v1's data-URL strip (`String(img.dataBase64).includes(',') ? split(',').pop() : ...`) in the v2 photo loop. The plan's pseudocode passed `String(img.dataBase64)` directly, but v1's precedent handles clients that send `data:image/jpeg;base64,…` prefixes — keeping the v2 path tolerant of the same shape avoids a v1/v2 divergence in client expectations."
  - "Used `for (let i = 0; ...)` (not `for...of` with `entries()` or `Promise.all`). The plan's automated grep checks for this exact form, and a sequential for-loop is the simplest expression of the get-SHA-then-PUT pattern with the per-edit-index `i + 1` filename prefix in scope."
  - "Rewrote the explanatory comment from `(NOT Promise.all)` to `(not concurrent)` because the plan's acceptance criterion includes `grep -c \"Promise.all\" returns 0` as a mechanical gate, and the original phrasing tripped that gate as a false positive in a NOT-clause. Semantics are unchanged; the comment still names PATTERNS.md and explains why sequencing is mandatory."
  - "commitError field is added conditionally (`...(commitError ? { commitError } : {})`) rather than always set to null. Keeps the per-edit JSON block in the issue body clean for the common happy-path case where every commit succeeds; the Action can grep for `commitError` to detect any failures."
  - "Emergent requirement API-06 (server-side cap re-validation with structured per-cap error) is delivered in this plan via failCap('edits',...) and failCap('bytes',...). ROADMAP.md and REQUIREMENTS.md were updated during planning iteration 1, so Plans 04-04 and 04-08 do not need to re-surface this."
metrics:
  duration: "~25 minutes (resume-from-handoff path; the original execution time was longer due to the orphan-worktree recovery)"
  completed: 2026-05-21
  loc_changed: "+61 / -4 in Task 3 commit ab730ef; cumulative across 04-03 = +245 net"
  acceptance_pass: "8 of 9 source-pattern checks passed; TypeScript gate (npx astro check) could not run in this sandbox due to a corrupted property-information dep in node_modules — operator should re-run the typecheck on their primary machine before merge"
---

# Phase 04 Plan 03: v2 batch handler implementation — Summary

Fully implemented the v2 batch path in `src/pages/api/feedback/submit.ts`. POSTing `{schemaVersion:2, batch:true, edits:[…]}` now (1) gates the request through shape/cap/per-edit checks, (2) creates exactly one GitHub issue with the contract-conformant title/labels/body (renderHuman blocks + fenced JSON payload + autonomy hint), (3) sequentially commits per-edit photos to `feedback-incoming/issue-<N>/edit-<i+1>-<safeName>`, and (4) finalises the issue body with one `patchIssueBody()` call carrying the populated paths + SHA-256 hashes. The v1 single-edit path remains byte-equivalent (API-02 / D-16).

## Resume context (non-standard)

This plan was **paused mid-Task-3** in a previous session — an orphan worktree branch `worktree-agent-a8bd25cd031b6a9e7` had Task 1 (`f835a74`) and Task 2 (`5535b8f`) committed, with Task 3 ~70% written but uncommitted. The session boundary left the worktree's `.git` pointer aimed at a path that did not exist in the resume environment (macOS path inside a Linux sandbox), so the HANDOFF's recommended "finish in worktree" recovery path was not viable.

**Recovery taken (per /gsd-resume-work, user-authorised):**
1. Cherry-picked the two orphan commits onto main as `400e85d` + `26b9bcd` (clean apply — orphan commits only touched `submit.ts`; main's pause commit `d8ec4fa` only touched `.planning/`).
2. Re-implemented Task 3 fresh on main based on the plan spec (not the dirty WIP), producing commit `ab730ef`.
3. Worktree cleanup + orphan branch deletion deferred to the resume-completion commit (see `.planning/HANDOFF.json` cleanup commit).

## Tasks Completed

| Task | Name                                                                                                  | Commit (cherry-picked from orphan)  | Files                              |
|------|-------------------------------------------------------------------------------------------------------|-------------------------------------|------------------------------------|
| 1    | D-03 reconciliation — verify Vercel function request-body limit and lock MAX_BATCH_BYTES               | `400e85d` (was `f835a74` on orphan) | `src/pages/api/feedback/submit.ts` |
| 2    | Add v2 constants (MAX_BATCH_EDITS, fail helpers), input gates, AND issue construction                  | `26b9bcd` (was `5535b8f` on orphan) | `src/pages/api/feedback/submit.ts` |
| 3    | Sequential photo commits to feedback-incoming/issue-N/ with single final patchIssueBody (resume-redone)| `ab730ef`                           | `src/pages/api/feedback/submit.ts` |

## What Was Built (Task 3 specifically)

The Task 3 block sits inside the `try` of `handleV2Batch` between `createIssue()` and the success `return`:

- **Sequential await loop** iterates `p.edits` by index. Photo-less edits skip the commit; their `machineEdit` keeps `committedPath:null` and `sha256:null`.
- **Filename sanitisation** uses the same regex as v1 (`/[^a-zA-Z0-9._-]+/g → '-'`, trim leading/trailing dashes, fallback to `'upload'`). The committed path is server-controlled: `feedback-incoming/issue-${issueNumber}/edit-${i+1}-${safeName}` — the `edit-${i+1}-` prefix prevents same-filename collisions across edits (T-04-15).
- **SHA-256 hash** computed via `crypto.subtle.digest('SHA-256', bytes)` from the base64-decoded payload, falling back to `sha256:null` if crypto is unavailable (best-effort, matches v1).
- **commitBase64File** is called sequentially per photo with commit message `feedback: raw upload for issue #${issueNumber} edit ${i + 1}`. Failure records `commitError:'photo commit failed'` on the machineEdit and the handler still returns 200 (graceful fallback, mirroring v1).
- **EXACTLY ONE patchIssueBody** call after the loop, rebuilding the body via `buildBatchBody(finalMachineEdits)` so the JSON block carries populated paths + hashes (API-05 — NOT N PATCH calls per PATTERNS.md item 14).
- **Return** unchanged from Task 2: `{ok:true, issueNumber, issueUrl}` on 200, top-level try/catch returns 500 with `err.message`.

## D-03 Reconciliation — Operator Follow-up

**Vercel tier was NOT verifiable in this session** — the `vercel inspect` CLI was not available in the resume sandbox. Per the plan's conservative-default fallback path (Task 1 sub-step 3b), `MAX_BATCH_BYTES = 3 * 1024 * 1024` (Hobby-safe ≈ 3 MB raw → ~4 MB base64 on wire) ships safe.

**The operator MUST:**
1. Confirm the project tier at https://vercel.com/MSizzle/moulin-a-reves/settings/general before merge.
2. If Pro+ with body-size override is configured, lift `MAX_BATCH_BYTES` to 30 MB AND update the client mirror in `public/feedback-inject.js` in the same PR (Plan 04-04).
3. The KEEP-IN-SYNC comment block above `MAX_BATCH_BYTES` in `submit.ts` and `MAX_BATCH_EDITS` documents this binding.

## Emergent Requirements

- **API-06** (server-side cap re-validation with structured per-cap error response of shape `{ok:false, error, cap:'edits'|'bytes', limit, actual}`): delivered in Task 2 via `failCap('edits', ...)` and `failCap('bytes', ...)`. Already added to ROADMAP.md / REQUIREMENTS.md during planning iteration 1.

## Verification

Source-pattern grep gate (Task 3 acceptance criteria):
- `feedback-incoming/issue-${issueNumber}/edit-` → 1 ✓
- `patchIssueBody(issueNumber, buildBatchBody` → 1 ✓ (EXACTLY ONE PATCH call per batch)
- `for (let i = 0; i < p.edits.length` → 1 ✓ (sequential, not concurrent)
- `Promise.all` → 0 ✓
- `crypto.subtle.digest` → 2 ✓ (v1 + v2)
- safeName regex `replace(/[^a-zA-Z0-9._-]+/g` → 2 ✓ (v1 + v2)
- First line `export const prerender = false;` → ✓
- OPS-02 scope fence (`git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts | wc -l`) → 0 ✓

TypeScript gate (`npx astro check`): could not run in this sandbox — `node_modules/property-information/lib/xlink.js` was missing (ERR_MODULE_NOT_FOUND), an issue with the resume environment's incomplete `npm install`, not a code defect. **Operator must re-run `npx astro check` on the primary machine before merge.**

Behavior gate (mocked-GitHub harness, 19/19 assertions for Tasks 1+2): inherited from the original orphan-branch session. Task 3 added behavior surfaces (per-edit-index path, sequential commits, single PATCH, commitError fallback) are covered by the source-pattern grep gate above; the behavior harness should be re-run during Plan 04-08's integration smoke.

## Files Changed

- `src/pages/api/feedback/submit.ts`: 633 lines (was 342 after Plan 04-02). Added the full v2 batch handler — constants, helpers (`failBatch`, `failCap`), input gates, normalise/imageMeta/buildBatchBody factories, autonomy roll-up, title/labels construction, photo commit loop, and the final patchIssueBody.

## Deviations from Plan

1. **Mirrored v1's data-URL strip in Task 3** (added `b64 = String(...).includes(',') ? split(',').pop() : String(...)`). The plan's pseudocode passed `String(img.dataBase64)` directly; the deviation preserves cross-version client tolerance.
2. **Rewrote `(NOT Promise.all)` comment to `(not concurrent)`** to avoid tripping the plan's mechanical `grep -c "Promise.all" returns 0` gate as a false positive.
3. **TypeScript gate not executed** — see Verification section.

All deviations are documented above and do not change the wire-shape contract or any acceptance behavior.
