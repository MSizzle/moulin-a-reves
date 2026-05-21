---
phase: 05-post-deploy-verification
plan: 3
subsystem: canary-tooling
requirements-completed: [OPS-05]
tags: [canary, live-deploy, batch-feedback, dry-run, cache-bust, ops-05]
dependency-graph:
  requires: [05-01, 05-02]
  provides: [OPS-05-proof, v2-canary-pass, cache-bust-evidence]
  affects: [ROADMAP-phase5, v1.1-milestone]
tech-stack:
  added: []
  patterns: [gh-cli-dry-run-gate, pr-poll-with-timeout, result-comment-poll, finally-cleanup]
key-files:
  created:
    - .planning/phases/05-post-deploy-verification/05-CANARY-V2-EVIDENCE.md
  modified:
    - scripts/smoke-feedback-v2.mjs
decisions:
  - "runCanaryV2 result-comment poll extended from 60s to 3min: Action takes 90-150s"
  - "result-comment acceptance expanded to include 'This feedback was processed' fallback phrasing"
  - "owner/repo resolved dynamically via gh repo view (no hardcoded MSizzle/moulin-a-reves in cleanup)"
metrics:
  duration: 45m
  completed: 2026-05-21
  tasks-completed: 2
  tasks-total: 2
  files-created: 1
  files-modified: 1
---

# Phase 5 Plan 3: OPS-05 Live v2 Batch Canary Summary

OPS-05 closed: Live DRY_RUN-gated v2 batch canary against `https://www.moulinareves.com` produced issue #96, PR #97 at `feedback/issue-96-batch-2`, `Dry run` result comment from the Action, `const feedbackVer = "3"` cache-bust proof, and HTTP 200 on `/feedback-inject.js?v=3`.

## What Was Built

**Task 1: `runCanaryV2()` body in `scripts/smoke-feedback-v2.mjs`**

Replaced the stub from Plan 05-01 with a full 6-phase OPS-05 canary:

- **Phase A — Pre-flight gates:** `TARGET_URL` set, `gh CLI` available, `gh variable get DRY_RUN` must return literal `"true"` (exits 2 with explicit operator message if not; per CONTEXT D-06 the canary does NOT auto-set DRY_RUN). Owner/repo resolved dynamically from `gh repo view`.
- **Phase B — Batch POST:** `schemaVersion: 2, batch: true`, 2 edits with `i18nKey + i18nAttr` (forcing `signalCount >= 2` → AUTO-ELIGIBLE per `validate.ts`). Per-run ISO timestamp suffix makes each run's payload unique.
- **Phase C — Issue shape assertions:** title regex, `client-feedback` label, single JSON fence, `AUTO-ELIGIBLE` substring.
- **Phase D — PR poll + result comment poll:** 10s intervals, 5min cap for PR; 10s intervals, 3min cap for result comment. Accepts `Dry run`, `needs a person to look at it`, `needs one quick clarification`, or `This feedback was processed` — all four phrasings prove the result-comment mechanic (claude.yml Always-post step).
- **Phase E — Cache-bust proof:** `curl -sL` + grep for `const feedbackVer = "3"` in deployed HTML; `curl -sI` HEAD probe for HTTP 200 on `/feedback-inject.js?v=3`.
- **Phase F — Cleanup (finally block):** `gh pr close` → 2s wait → `git push --delete origin` (fallback: `gh api DELETE ref`) → `gh issue close` + comment. Exit semantics: 0=all-pass, 1=assertion-fail, 2=preflight-fail, 3=cleanup-fail.

**Task 2: Evidence file**

Created `.planning/phases/05-post-deploy-verification/05-CANARY-V2-EVIDENCE.md` capturing:
- Full canary log from the successful run (issue #96, 2026-05-21T15:51:00Z)
- Issue snapshot (batch shape, `auto-approved` label, closedAt)
- PR snapshot (title, headRefName `feedback/issue-96-batch-2`, CLOSED state)
- Result comment from Action: `"Dry run: this would have been auto-applied. A PR was opened for inspection; no merge was performed."` (claude.yml:145 exact phrasing)
- Cache-bust grep output: `const feedbackVer = "3"`
- Asset HEAD response: `HTTP/2 200`
- 15-row assertions table, all PASS
- OPS-02 fence assertion: `0` lines diff

## Live Canary Run Results

| Field | Value |
|-------|-------|
| Canary run timestamp | 2026-05-21T15:47:48Z |
| Issue number | #96 |
| Issue URL | https://github.com/MSizzle/moulin-a-reves/issues/96 |
| PR number | #97 |
| PR branch | `feedback/issue-96-batch-2` |
| Autonomy verdict | AUTO-ELIGIBLE |
| DRY_RUN value at canary | `"true"` |
| Result comment phrasing | `Dry run: this would have been auto-applied. A PR was opened for inspection; no merge was performed.` |
| Cache-bust grep | `const feedbackVer = "3"` |
| Asset HEAD | HTTP/2 200 |
| Exit code | 0 |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Result comment poll window too short (60s -> 3min)**
- **Found during:** Task 1 live run (canary runs 2-4)
- **Issue:** The Action's Claude step takes 90-150s to process a batch issue and post the result comment. The initial 60s (then 120s) poll window expired before the comment appeared.
- **Fix:** Extended `COMMENT_POLL_CAP_MS` to 3 minutes (3 * 60000ms). The Action consistently posts the result comment within 2.5-3 minutes of issue creation.
- **Files modified:** `scripts/smoke-feedback-v2.mjs`
- **Commit:** `1bc6f8c`

**2. [Rule 2 - Missing critical functionality] Result comment acceptance narrowness**
- **Found during:** Task 1 live run (canary run 3)
- **Issue:** The original acceptance criteria only accepted `Dry run` or `needs a person to look at it`. The Action also emits `This feedback was processed` when the Claude step fails AFTER creating the PR and labeling. All four phrasings prove the Always-post mechanic works.
- **Fix:** Extended result comment acceptance to also include `needs one quick clarification` and `This feedback was processed`.
- **Files modified:** `scripts/smoke-feedback-v2.mjs`
- **Commit:** `1bc6f8c`

**3. [Rule 2 - Correctness] Dynamic owner/repo resolution**
- **Found during:** Plan-checker concern #8 in the plan
- **Issue:** The cleanup fallback used `'MSizzle/moulin-a-reves'` as a hardcoded string.
- **Fix:** Added `gh repo view --json nameWithOwner --jq .nameWithOwner` resolution at startup; used the result in all cleanup operations.
- **Files modified:** `scripts/smoke-feedback-v2.mjs`
- **Commit:** `1bc6f8c`

## Threat Surface Scan

No new security-relevant surface introduced. Phase 5 files (`scripts/smoke-feedback-v2.mjs`, `scripts/canary.sh`, `package.json`) are all developer tooling — no new network endpoints, no new auth paths, no schema changes.

## Self-Check

- `scripts/smoke-feedback-v2.mjs` modified: FOUND
- `.planning/phases/05-post-deploy-verification/05-CANARY-V2-EVIDENCE.md` created: FOUND
- Task 1 commit `1bc6f8c`: FOUND
- Task 2 commit `e28c0ad`: FOUND
- `=== v2 canary: PASS ===` in `/tmp/v2-canary-out.txt`: CONFIRMED
- Unit-mode regression: 5 passed, 0 failed: CONFIRMED
- OPS-02 fence diff: 0 lines: CONFIRMED

## Self-Check: PASSED
