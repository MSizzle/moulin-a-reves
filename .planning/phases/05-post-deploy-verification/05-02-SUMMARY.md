---
phase: 05-post-deploy-verification
plan: 2
subsystem: canary-ops
tags: [canary, ops, live-run, ops-04, evidence]
dependency_graph:
  requires:
    - 05-01 (runCanaryV1 stub seam, canaryPost helper, canary.sh wrapper, npm scripts)
  provides:
    - scripts/smoke-feedback-v2.mjs (runCanaryV1 full body — OPS-04 assertions + cleanup)
    - .planning/phases/05-post-deploy-verification/05-CANARY-V1-EVIDENCE.md (OPS-04 audit trail)
  affects:
    - OPS-04 requirement (now satisfied)
tech_stack:
  added: []
  patterns:
    - try/finally canary cleanup pattern (issue close regardless of assertion outcome)
    - gh CLI env isolation (strip GITHUB_TOKEN from execFileSync env to avoid keyring override)
    - DASHBOARD_PASSWORD canary default (moulin2024 fallback, separate from smoke-password)
key_files:
  created:
    - .planning/phases/05-post-deploy-verification/05-CANARY-V1-EVIDENCE.md
  modified:
    - scripts/smoke-feedback-v2.mjs
decisions:
  - Strip GITHUB_TOKEN from gh sub-process env — the harness sets GITHUB_TOKEN=smoke-token for unit mode, which overrides gh's keyring auth and causes HTTP 401 on GraphQL calls
  - Use separate DASHBOARD_PASSWORD fallbacks per mode — unit mode uses smoke-password (any consistent value works against local stub), canary mode uses moulin2024 (matches Vercel production env)
metrics:
  duration: "~25 minutes"
  completed: "2026-05-21"
  tasks_completed: 2
  files_changed: 2
requirements_completed: [OPS-04]
---

# Phase 5 Plan 2: OPS-04 Canary V1 Execution Summary

OPS-04 v1 regression canary implemented and executed against the live deployment — schemaVersion 1 payload produces a single-edit issue via the existing v1 path, proving cached browsers won't break post-Phase-4.

## What Was Built

### Task 1 — `scripts/smoke-feedback-v2.mjs`: runCanaryV1 body filled in

The 05-01 stub was replaced with a full OPS-04 canary scenario (+137 LOC net):

**Payload:** `schemaVersion: 1`, `intent: 'change-wording'`, `pageRoute: '/'`, `testMode: true` (routes to `client-feedback-test` label; Action skips), `intentDetail.newTextEn: 'Canary test edit — Phase 5 verification <ISO timestamp>'`, `i18nKey: 'home.hero.title'`, `i18nAttr: 'data-i18n'`.

**Assertion sequence (try/finally per CONTEXT D-07):**
1. POST via `canaryPost` → assert `response.status === 200`
2. Parse JSON → assert `body.ok === true`, `typeof body.issueNumber === 'number'`, `typeof body.issueUrl === 'string'`
3. Log `PASS: v1 canary HTTP 200 with issueNumber=<N>`
4. Capture `issueNumber`
5. `gh issue view <N> --json title,labels,body` via `execFileSync` (sanitized env)
6. Assert `title.startsWith('[TEST] [Feedback] change wording — ')`
7. Assert `labels` contains `client-feedback-test`
8. Assert `body` does NOT contain `[Feedback] batch of`
9. Log `PASS: v1 canary issue body matches single-edit shape`

**Finally (cleanup):** `gh issue comment <N> --body "Closed by canary…"` then `gh issue close <N>`. Cleanup errors demote exit code to 3 only if assertions previously passed.

**Pre-checks:** `TARGET_URL` present + `gh --version` exits 0. Both guarded with `process.exit(2)` on failure.

**Exit codes:** 0 = PASS (assertions + cleanup), 1 = assertion failure, 2 = pre-check failure, 3 = assertions PASS but cleanup failed.

### Task 2 — `.planning/phases/05-post-deploy-verification/05-CANARY-V1-EVIDENCE.md`: NEW

Audit-grade evidence file (74 lines):
- YAML frontmatter: `requirement: OPS-04`, `status: passed`, `issue_number: 89`, `issue_state_after_cleanup: closed`, ISO timestamp
- Summary paragraph explaining OPS-04 + ROADMAP reference
- Full canary log (`/tmp/v1-canary-out.txt`)
- `gh issue view --json number,title,labels,state,closedAt,body` snapshot
- Assertions table: 6 rows, all PASS

## Live Canary Execution

**Timestamp:** 2026-05-21T15:15:02Z  
**Issue created:** [MSizzle/moulin-a-reves#89](https://github.com/MSizzle/moulin-a-reves/issues/89)  
**Issue closed:** 2026-05-21T15:15:05Z (3 seconds after creation)  
**Exit code:** 0

**Stdout (condensed):**
```
PASS: v1 canary HTTP 200 with issueNumber=89
PASS: v1 canary issue body matches single-edit shape
✓ Closed issue MSizzle/moulin-a-reves#89 (...)
=== v1 canary: PASS ===
PASS: canary v1 (OPS-04)

1 passed, 0 failed
```

## Verification Results

| Check | Result |
|-------|--------|
| `npm run canary:v1` exit code | 0 |
| Stdout contains `PASS: v1 canary HTTP 200 with issueNumber=89` | YES |
| Stdout contains `=== v1 canary: PASS ===` | YES |
| `gh issue view 89 --json state --jq .state` | CLOSED |
| Issue body contains no `[Feedback] batch of` | CONFIRMED (v1 dispatch arm) |
| Unit regression `npx tsx scripts/smoke-feedback-v2.mjs` | `5 passed, 0 failed` |
| OPS-02 fence (`git diff main -- public/editor-inject.js ...`) | 0 lines |

## Commits

| Task | Hash | Files |
|------|------|-------|
| Task 1: runCanaryV1 full body | `481b904` | `scripts/smoke-feedback-v2.mjs` (+137 LOC net) |
| Task 2: OPS-04 evidence file | `eaa32ec` | `.planning/phases/05-post-deploy-verification/05-CANARY-V1-EVIDENCE.md` (NEW, 74 lines) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DASHBOARD_PASSWORD set to 'smoke-password' in canary mode**
- **Found during:** First live canary run (Task 1 verify)
- **Issue:** Line 79 of the harness unconditionally sets `process.env.DASHBOARD_PASSWORD ||= 'smoke-password'`. In canary mode, this runs before any imports, so if DASHBOARD_PASSWORD isn't in the shell env, the value used for HMAC signing is `'smoke-password'` — not `'moulin2024'` (what the live Vercel endpoint expects). The POST returned HTTP 401.
- **Fix:** Moved the DASHBOARD_PASSWORD default into a conditional: unit mode gets `'smoke-password'`; canary mode falls back to `'moulin2024'` (matching `auth.ts` line 1's own fallback and the verified Vercel production env).
- **Files modified:** `scripts/smoke-feedback-v2.mjs`
- **Commit:** `481b904`

**2. [Rule 1 - Bug] GITHUB_TOKEN='smoke-token' breaks gh CLI keyring auth in subprocess**
- **Found during:** Second live canary run (Task 1 verify, DASHBOARD_PASSWORD already fixed)
- **Issue:** The harness sets `process.env.GITHUB_TOKEN ||= 'smoke-token'` for unit-mode GitHub API stub routing. When `execFileSync('gh', ...)` spawns a child process, it inherits this env var. `gh` treats `GITHUB_TOKEN` as an auth override, using `'smoke-token'` instead of the system keyring. GraphQL calls returned `HTTP 401: Bad credentials`.
- **Fix:** Build a sanitized env object (`{ ...process.env }` with `GITHUB_TOKEN` deleted) and pass it as `{ env: ghEnv }` to all `execFileSync('gh', ...)` calls in `runCanaryV1`.
- **Files modified:** `scripts/smoke-feedback-v2.mjs`
- **Commit:** `481b904`

**Note:** Issues #85, #86, #87, #88 were created by debugging runs and manually closed via `gh api` REST. All are in CLOSED state.

## Known Stubs

`runCanaryV2` in `scripts/smoke-feedback-v2.mjs` is still the 05-01 stub — full OPS-05 assertions land in Plan 05-03.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes. The only new surface (`05-CANARY-V1-EVIDENCE.md`) is a planning artifact in `.planning/` with no server-side exposure.

## Self-Check: PASSED

Files created/modified:
- [x] `scripts/smoke-feedback-v2.mjs` exists and passes `node --check`
- [x] `.planning/phases/05-post-deploy-verification/05-CANARY-V1-EVIDENCE.md` exists, 74 lines, `requirement: OPS-04`

Commits verified:
- [x] `481b904` — Task 1 (feat)
- [x] `eaa32ec` — Task 2 (docs)

Live canary verified:
- [x] Issue #89 CLOSED: `gh issue view 89 --repo MSizzle/moulin-a-reves --json state --jq .state` → CLOSED
- [x] OPS-02 fence: `git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts | wc -l` → 0
