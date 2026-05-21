---
phase: 04-batch-pipeline-implementation
plan: "10"
subsystem: feedback-ui-plumbing
tags: [gap-closure, cr-01, cr-02, cr-03, feedback-astro, feedback-inject, smoke-harness]
dependency_graph:
  requires: [04-09]
  provides: [parent-forwarder-spread, warning-success-branch, real-oversize-smoke-scenario]
  affects:
    - src/pages/feedback.astro
    - public/feedback-inject.js
    - scripts/smoke-feedback-v2.mjs
tech_stack:
  added: []
  patterns: [conditional-spread-postMessage, warning-success-state-preservation]
key_files:
  created: []
  modified:
    - src/pages/feedback.astro
    - public/feedback-inject.js
    - scripts/smoke-feedback-v2.mjs
decisions:
  - "Parent forwarder uses conditional spreads (Array.isArray / truthiness / typeof) for all six new fields — no undefined reaches the iframe"
  - "Warning-success branch uses capMessage field of renderPanel (existing rendering mechanism) for the warning string; no new highlight code path"
  - "Smoke scenario 4 per-edit base64 length = ceil((capBytes+1024)*4/3/2)+4 — provides margin above cap when summed across 2 edits"
  - "feedback-version.ts NOT bumped here — wave 3 (04-11) handles the cache-bust after all inject changes land"
metrics:
  duration: "~20 minutes"
  completed: "2026-05-21T09:10:00Z"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 3
---

# Phase 4 Plan 10: Gap Closure CR-01 + CR-03 UI Half + Smoke Scenario 4 Summary

**One-liner:** Wire server-side structured error/warning fields through the `feedback.astro` parent forwarder to the iframe inject, add a partial-failure warning branch that preserves staged state, and fix smoke scenario 4 to ship a real oversize base64 string exercising the CR-02 decoded-bytes cap.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Spread structured server fields onto `mar-feedback-result` postMessage | `ce4b21e` | `src/pages/feedback.astro` |
| 2 | Add warning-success branch to `feedback-inject.js` (CR-03 UI half) | `06be1b8` | `public/feedback-inject.js` |
| 3 | Update smoke scenario 4 to ship real oversize base64 (CR-02) | `daaf395` | `scripts/smoke-feedback-v2.mjs` |

## What Was Built

### Task 1 — CR-01 fix (parent forwarder drops structured fields)

Modified the `window.addEventListener('message', ...)` handler in `feedback.astro` (the `mar-feedback-submit` → `/api/feedback/submit` → `mar-feedback-result` round-trip) to spread all structured server response fields onto the iframe postMessage.

**Failure path** (was: `{ type: 'mar-feedback-result', ok: false }`, now):
```js
{
  type: 'mar-feedback-result',
  ok: false,
  ...(Array.isArray(data?.errors) ? { errors: data.errors } : {}),
  ...(data?.cap ? { cap: data.cap } : {}),
  ...(typeof data?.limit === 'number' ? { limit: data.limit } : {}),
  ...(typeof data?.actual === 'number' ? { actual: data.actual } : {}),
  ...(data?.error ? { error: data.error } : {}),
}
```

**Success path** (was: `{ type: 'mar-feedback-result', ok: true }`, now):
```js
{
  type: 'mar-feedback-result',
  ok: true,
  ...(data.warning ? { warning: data.warning } : {}),
  ...(Array.isArray(data.commitErrors) ? { commitErrors: data.commitErrors } : {}),
}
```

**Toast adjustment:** When `data.warning` is truthy on success, the parent toast shows the warning string + "Re-attach the affected photos and resubmit." instead of the generic "We've logged your request…" copy. The `Done` button and `'ok'` kind are preserved (the issue WAS created).

Auth branch and network catch branch are unchanged.

The inject's previously-dead `m.cap` and `m.errors` branches at lines 1143 and 1134 of `feedback-inject.js` are now reachable.

**New parent-forwarder spread fields contract:**
- Failure: `errors` (per-edit `[{index, error}]` array), `cap` (`'edits'|'bytes'`), `limit` (number), `actual` (number), `error` (user-facing string)
- Success: `warning` (partial-photo summary string), `commitErrors` (`[{index, error}]` array)

### Task 2 — CR-03 UI half (inject clears staged state on clean success, ignores partial failure)

Added a new `if (m.ok && m.warning)` branch inside the `STATE.SUBMITTING` handler of the `mar-feedback-result` listener in `public/feedback-inject.js`, placed BEFORE the existing unconditional `if (m.ok)` block.

**Branch order inside `if (state === STATE.SUBMITTING)`:**
1. NEW: `if (m.ok && m.warning)` — partial photo-commit failure (issue created, photos failed)
2. Existing: `if (m.ok)` — clean success (clears everything)
3. Existing: `if (m.auth)` — session expired
4. Existing: `if (Array.isArray(m.errors))` — per-edit validation failures (now reachable)
5. Existing: `if (m.cap)` — cap violation (now reachable)
6. Existing: generic failure fallback

**New branch behavior:**
- Does NOT call `clearStaged()`, `removeChip()`, `destroyStagedPanel()`, or `clearDraft()`
- Sets `state = STATE.STAGED` (re-enables chip + submit button)
- Calls `renderChip(loadStaged().length)` to refresh the count
- Calls `renderPanel({ capMessage: warnMsg, errors: m.commitErrors })` where `warnMsg` is the server's `m.warning` + guidance text
- The `commitErrors` array (if present) triggers `.is-error` highlights on failing staged items via the existing `errByIndex` mechanism in `renderPanel`

### Task 3 — Smoke scenario 4 (real oversize base64 for CR-02 decoded-bytes cap)

Rewrote scenario 4 body in `scripts/smoke-feedback-v2.mjs` to ship an actually-oversize base64 string instead of the 3-byte `'AAAA'` stub with a spoofed `bytes` descriptor.

**New construction:**
```js
const perEditB64Len = Math.ceil((capBytes + 1024) * 4 / 3 / 2) + 4;
const bigB64 = 'A'.repeat(perEditB64Len);
```

The `+1024` provides margin above `capBytes`; the `+4` absorbs padding rounding. Both edits use the same `bigB64` value, proving the SUM-across-edits reducer in `approxDecodedBytes` works (not just a single-photo gate). The `bytes` descriptor now reflects the actual decoded size (`Math.floor(bigB64.length * 3 / 4)`) for shape-parity with real client payloads.

Existing assertions are unchanged: `res.status === 422`, `body.cap === 'bytes'`, `body.limit === capBytes`, `body.actual > capBytes`.

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsx scripts/smoke-feedback-v2.mjs` | **5 passed, 0 failed** |
| `node --check public/feedback-inject.js` | exit 0 |
| OPS-02 fence (`git diff main -- fenced paths \| wc -l`) | **0** |
| `grep -c "CR-01" src/pages/feedback.astro` | 2 |
| `grep -c "CR-03" public/feedback-inject.js` | 1 |
| `grep -c "CR-02" scripts/smoke-feedback-v2.mjs` | 3 |
| `grep -c "data.cap" src/pages/feedback.astro` | 1 |
| `grep -c "data.errors" src/pages/feedback.astro` | 1 |
| `grep -c "data.warning" src/pages/feedback.astro` | 2 |
| `grep -c "data.commitErrors" src/pages/feedback.astro` | 1 |
| `grep -c "m.warning" public/feedback-inject.js` | 2 |
| Old `dataBase64: 'AAAA'` stub in smoke | Gone (0 occurrences) |
| `src/lib/feedback-version.ts` modified | No — untouched (04-11 bumps it) |

## Wave 3 Follow-Up Required

**`public/feedback-inject.js` was modified in this plan.** Per OPS-01 / the cache-bust rule in `CLAUDE.md`, **plan 04-11 MUST bump `FEEDBACK_INJECT_VER` from `'2'` to `'3'`** in `src/lib/feedback-version.ts`. Without this bump, cached browsers will continue running the pre-CR-03 inject indefinitely and the partial-failure warning branch will never load.

## Deviations from Plan

None. Plan executed exactly as written.

The only note: `npx tsc --noEmit -p tsconfig.json` cannot run because TypeScript is not installed as a standalone project dependency (Astro bundles it internally). The `<script is:inline>` block in `feedback.astro` is plain JS and is not TS-checked. Frontmatter changes were verified by inspection (no TypeScript in frontmatter was modified in this task — the change is entirely within the `<script is:inline>` block).

## Known Stubs

None. All three files contain live logic — no placeholder text, no hardcoded empty values blocking the plan's goal.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns were introduced. The parent-forwarder change stays same-origin (`location.origin` target unchanged). The origin guard at `feedback-inject.js:1104` continues to gate all incoming postMessages. No new threat surface.

## Self-Check

- [x] `src/pages/feedback.astro` modified — confirmed (commit `ce4b21e`)
- [x] `public/feedback-inject.js` modified — confirmed (commit `06be1b8`)
- [x] `scripts/smoke-feedback-v2.mjs` modified — confirmed (commit `daaf395`)
- [x] Commits `ce4b21e`, `06be1b8`, `daaf395` exist — confirmed
- [x] `npx tsx scripts/smoke-feedback-v2.mjs` → `5 passed, 0 failed` — confirmed
- [x] OPS-02 fence = 0 — confirmed
- [x] `src/lib/feedback-version.ts` untouched — confirmed (0 lines in git diff)
- [x] No STATE.md or ROADMAP.md modified — confirmed (parallel worktree mode)

## Self-Check: PASSED
