---
phase: 6
plan: 06-01
requirements-completed: [STATUS-01, STATUS-02, STATUS-03, STATUS-04, STATUS-05]
status: complete
commit: 2a0b52b
completed: 2026-05-21
---

# 06-01 — Status endpoint + shared resolver

## What shipped

- `src/lib/feedback-status.ts` — pure stage resolver + types. Exports `resolveStage(input) → { stage, sub, prUrl, prNumber, mergeSha }`. Branch logic: needs-client-reply / needs-review labels short-circuit to stage 4; merged PR with mergeSha + Vercel READY → stage 5; PR-from-comments fallback when issue's `pull_request` link is lazy.
- `src/pages/api/feedback/status/[issueNumber].ts` — auth-gated GET endpoint. Calls 3 GitHub endpoints (issue, comments, PR) + 1 Vercel endpoint (deployments by SHA). 5 s in-memory cache keyed by issue number. Graceful degrade: missing `VERCEL_TOKEN` → stage stays at 4, response stays valid.

## Verified

- Pure-module unit test via `npx tsx` import: stage 5 case (merged + vercel READY) returns `{stage:5, sub:null, prUrl, prNumber, mergeSha}` as expected.
- Full table coverage lives in `scripts/smoke-feedback-status.mjs` (06-03) — 9 cases, all pass.

## Requirements satisfied

- STATUS-01 ✓ `prerender = false`, 401 on missing/invalid `maison_session`
- STATUS-02 ✓ Stages 1..5 resolved from GitHub + Vercel signals
- STATUS-03 ✓ `sub` populated at stage 4 (`auto-merged` / `merged` / `needs-review` / `needs-client-reply` / `open` at stage 3); `null` at stages 1,2,5
- STATUS-04 ✓ Server-side `Map` cache, 5 s TTL, keyed by issue number string
- STATUS-05 ✓ `VERCEL_TOKEN` server-only via `import.meta.env`; absent → degrade to stage 4 with `deployUrl: null`

## Pre-conditions for Vercel deploy

The Vercel project env must include `VERCEL_TOKEN` (Vercel REST API token scoped to the team / project) for stage 5 detection to work. `VERCEL_PROJECT_ID` and `VERCEL_TEAM_ID` defaults are baked in from `.vercel/project.json`; override via env if the project moves.
