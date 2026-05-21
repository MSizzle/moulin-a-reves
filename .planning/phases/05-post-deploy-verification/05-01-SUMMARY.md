---
phase: 05-post-deploy-verification
plan: 1
subsystem: canary-tooling
tags: [canary, smoke, tooling, ops]
dependency_graph:
  requires: []
  provides:
    - scripts/smoke-feedback-v2.mjs (dual-mode: unit + canary)
    - scripts/canary.sh (bash entry point)
    - package.json canary:v1/canary:v2/canary scripts
  affects:
    - Plan 05-02 (uses runCanaryV1 seam for OPS-04)
    - Plan 05-03 (uses runCanaryV2 seam for OPS-05)
tech_stack:
  added: []
  patterns:
    - TARGET_URL env-var dual-mode branching in Node harness
    - registerHooks() import.meta.env shim in both unit and canary modes
    - canaryPost() real-fetch helper with maison_session cookie from createSession()
    - bash wrapper set -euo pipefail with positional-arg dispatch + usage-on-error
key_files:
  modified:
    - scripts/smoke-feedback-v2.mjs
    - package.json
  created:
    - scripts/canary.sh
decisions:
  - Installed registerHooks in canary mode too (not just unit mode) because auth.ts reads import.meta.env.DASHBOARD_PASSWORD at module evaluation time — without the shim, the dynamic import of createSession throws TypeError
  - Canary stubs attempt a real POST (not a no-op) so the unreachable-URL dry-test exits non-zero, satisfying the acceptance criterion that --canary v1 against 127.0.0.1:1 exits non-zero
metrics:
  duration: "~6 minutes"
  completed: "2026-05-21"
  tasks_completed: 3
  files_changed: 3
requirements_completed: []
---

# Phase 5 Plan 1: Canary Tooling Foundation Summary

Dual-mode smoke harness with TARGET_URL env-var seam, bash wrapper, and npm scripts — enabling OPS-04/OPS-05 canary runs against the live deployment.

## What Was Built

Three files modified/created to build the canary tooling foundation for Phase 5 Wave 1.

### Task 1 — `scripts/smoke-feedback-v2.mjs` extended with dual-mode branching

The 386-LOC unit-mode harness was extended (~540 LOC total) with a `TARGET_URL` / `CANARY_KIND` detection block at the top:

- `const TARGET_URL = process.env.TARGET_URL || null` — absent = unit mode; present = canary mode
- `CANARY_KIND` extracted from `process.argv.indexOf('--canary')` + next arg (`v1`, `v2`, or `null`)

**Unit mode (TARGET_URL unset):** executes byte-for-byte-equivalent to the original harness — `registerHooks()` shim, `globalThis.fetch` stub, dynamic import of `submit.ts`, all 5 scenarios, `5 passed, 0 failed` terminal line.

**Canary mode (TARGET_URL set):** installs `registerHooks()` shim (needed for `auth.ts`'s `import.meta.env.DASHBOARD_PASSWORD`), skips `submit.ts` import, skips fetch stub. `canaryPost(payload)` mints the auth cookie via `createSession()` and posts to `TARGET_URL + '/api/feedback/submit'` with real `fetch`. Scenarios 3-5 emit `SKIP:` lines. Dispatches `runCanaryV1()` or `runCanaryV2()` (or both) per `CANARY_KIND`.

**Stubs:** `runCanaryV1` and `runCanaryV2` each attempt a minimal real POST against `TARGET_URL` (same payload shape as unit scenarios 1 and 2 respectively). The stubs assert only `response.status === 200` and `body.ok === true`. Full assertion bodies (issue title, `gh issue view`, PR poll, cache-bust proof, cleanup) land in Plans 05-02 and 05-03.

**Deviations from plan:** One auto-fix (Rule 1). The plan said "in canary mode, do NOT install the registerHooks block." However, `src/lib/auth.ts` reads `import.meta.env.DASHBOARD_PASSWORD` at module evaluation time — without the shim, the canary-mode dynamic import of `auth.ts` throws `TypeError: Cannot read properties of undefined (reading 'DASHBOARD_PASSWORD')`. Fix: install `registerHooks` in canary mode as well, covering only `auth.ts` (not `submit.ts`, which is never imported in canary mode).

### Task 2 — `scripts/canary.sh` created

New file (58 lines, `chmod +x`):

- `set -euo pipefail` strict mode
- `DEPLOY_URL="${DEPLOY_URL:-https://www.moulinareves.com}"` (D-03 override-via-env)
- `case "$ARG"` dispatch: `v1` → `--canary v1`, `v2` → `--canary v2`, empty → no flag (both), anything else → usage stderr + exit 2
- Header documents DASHBOARD_PASSWORD pre-condition (T-05-02)
- References CONTEXT D-02 and D-03 (5 occurrences)

### Task 3 — `package.json` scripts section updated

Three entries added after `astro`:

```json
"canary:v1": "scripts/canary.sh v1",
"canary:v2": "scripts/canary.sh v2",
"canary": "scripts/canary.sh"
```

No dependencies added; existing scripts preserved; JSON validity confirmed.

## Verification Results

| Check | Result |
|-------|--------|
| Unit-mode regression: `npx tsx scripts/smoke-feedback-v2.mjs` | `5 passed, 0 failed` |
| Canary-mode seam: `TARGET_URL=http://127.0.0.1:1 ... --canary v1` exits non-zero | Exit 1 (fetch failed) |
| SKIP line count (canary mode) | 3 (scenarios 3-5) |
| `node --check scripts/smoke-feedback-v2.mjs` | Exit 0 |
| `test -x scripts/canary.sh` | Exit 0 |
| `bash -n scripts/canary.sh` | Exit 0 |
| `scripts/canary.sh badarg` exits 2 | Exit 2 |
| OPS-02 fence: `git diff main -- public/editor-inject.js ...` | 0 lines |
| No new deps: `6,1` | Confirmed |
| `grep -c 'const TARGET_URL' smoke-feedback-v2.mjs` | 1 |
| `grep -c "process.argv.indexOf('--canary')" smoke-feedback-v2.mjs` | 1 |
| `grep -c 'runCanaryV1' smoke-feedback-v2.mjs` | 5 |
| `grep -c 'runCanaryV2' smoke-feedback-v2.mjs` | 5 |
| `grep -c "TARGET_URL + '/api/feedback/submit'" smoke-feedback-v2.mjs` | 2 |
| T-05-05 `grep -c "console.log.*cookie" smoke-feedback-v2.mjs` | 0 |

## Commits

| Task | Hash | Files |
|------|------|-------|
| Task 1: dual-mode smoke harness | `14c4c7e` | `scripts/smoke-feedback-v2.mjs` (+219 LOC net, full rewrite with 5/5 unit-mode pass preserved) |
| Task 2: bash wrapper | `fd2f2bf` | `scripts/canary.sh` (NEW, 58 lines, executable) |
| Task 3: npm scripts | `70f69b3` | `package.json` (+4 lines) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] registerHooks required in canary mode for auth.ts**
- **Found during:** Task 1 verification (canary dry-test)
- **Issue:** `src/lib/auth.ts` line 1 reads `import.meta.env.DASHBOARD_PASSWORD` at module evaluation time. The plan said "do NOT install registerHooks in canary mode." Without the shim, the dynamic import of `createSession` threw `TypeError: Cannot read properties of undefined (reading 'DASHBOARD_PASSWORD')`.
- **Fix:** Install `registerHooks()` in the canary mode branch as well, before dynamically importing `auth.ts`. The shim only rewrites `import.meta.env` → `process.env` in sources that contain the literal substring; it has zero effect on submit.ts (which is not imported in canary mode) and the original unit-mode shim is unchanged.
- **Files modified:** `scripts/smoke-feedback-v2.mjs`
- **Commit:** `14c4c7e`

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `runCanaryV1` | `scripts/smoke-feedback-v2.mjs` | Full OPS-04 assertions (issue title shape, `gh issue view`, cleanup) land in Plan 05-02 |
| `runCanaryV2` | `scripts/smoke-feedback-v2.mjs` | Full OPS-05 assertions (batch issue, Claude PR, cache-bust proof, cleanup) land in Plan 05-03 |

Both stubs DO attempt a real POST to `TARGET_URL` (not no-ops) — they assert only `status === 200` and `body.ok === true`. Plans 05-02/05-03 replace the stub bodies with the full OPS-04/OPS-05 assertion logic.

## Requirements

`requirements-completed: []` — This plan builds the tooling that enables OPS-04 and OPS-05 verification. The requirements are SATISFIED by Plans 05-02 (runCanaryV1 full body + live OPS-04 run) and 05-03 (runCanaryV2 full body + live OPS-05 run).

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes were introduced. The new surface (`canary.sh`, npm scripts) is operator-shell-local tooling only. All STRIDE mitigations from the plan's threat register were implemented:

- **T-05-01** (argv tampering): `case` dispatch with exact `v1`/`v2`/empty match; anything else exits 2. No `eval`, no glob matching.
- **T-05-02** (DASHBOARD_PASSWORD disclosure): documented in canary.sh header and in canaryPost() comment; not embedded in any file. `.env.local` remains gitignored.
- **T-05-03** (package.json script tampering): exact string commands, no template interpolation.
- **T-05-05** (cookie leakage in logs): `grep -c "console.log.*cookie" scripts/smoke-feedback-v2.mjs` returns 0.

## Self-Check: PASSED

Files created/modified:
- [x] `scripts/smoke-feedback-v2.mjs` exists and passes `node --check`
- [x] `scripts/canary.sh` exists, is executable, passes `bash -n`
- [x] `package.json` has `canary:v1`, `canary:v2`, `canary` entries

Commits verified:
- [x] `14c4c7e` — Task 1
- [x] `fd2f2bf` — Task 2
- [x] `70f69b3` — Task 3
