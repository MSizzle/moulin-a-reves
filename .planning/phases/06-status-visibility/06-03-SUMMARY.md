---
phase: 6
plan: 06-03
requirements-completed: [STATUS-10]
status: complete
commit: 2468288
completed: 2026-05-21
---

# 06-03 — Status canary script

## What shipped

- `scripts/smoke-feedback-status.mjs` — dual-mode canary mirroring `smoke-feedback-v2.mjs`.
  - **Unit mode** (no `TARGET_URL`): imports `resolveStage` from `src/lib/feedback-status.ts`, runs 9 table-driven assertions, exits 0/1.
  - **Canary mode** (`TARGET_URL=https://www.moulinareves.com`): mints `maison_session`, POSTs `isTest: true` v1 single-edit to `/api/feedback/submit`, polls `/api/feedback/status/<N>` every 8 s. Pass on stage 5 OR `needs-review` / `needs-client-reply` OR sustained stage 2 (Action ignores `client-feedback-test` label so stage 2 is terminal for test submissions). Fail on 5-min timeout, HTTP error, or stage regression.
- `scripts/canary.sh` — new `status` dispatch case; no-arg default now runs v1 → v2 → status sequentially.
- `package.json` — new `canary:status` script.

## Verified

```
$ npx tsx scripts/smoke-feedback-status.mjs
PASS — stage 1 — fresh issue no label, no PR  (got stage=1 sub=null)
PASS — stage 2 — labelled client-feedback, no PR yet  (got stage=2 sub=null)
PASS — stage 3 — PR open, no terminal label  (got stage=3 sub=open)
PASS — stage 3 — PR ref from comments only  (got stage=3 sub=open)
PASS — stage 4 — needs-review  (got stage=4 sub=needs-review)
PASS — stage 4 — needs-client-reply  (got stage=4 sub=needs-client-reply)
PASS — stage 4 — auto-merged, vercel token missing → no stage 5  (got stage=4 sub=auto-merged)
PASS — stage 4 — merged, vercel BUILDING → no stage 5 yet  (got stage=4 sub=merged)
PASS — stage 5 — merged + vercel READY  (got stage=5 sub=null)

9/9 passed
```

## Requirements satisfied

- STATUS-10 ✓ Dual-mode canary lives at `scripts/smoke-feedback-status.mjs`; `npm run canary:status` runs it against `DEPLOY_URL`; aggregate `npm run canary` includes it after v1 / v2.

## Post-deploy verification (out-of-scope for this commit)

Once the PR merges and Vercel deploys, the operator (or a future auto-canary GH workflow) should run:

```bash
DASHBOARD_PASSWORD=<vercel env value> npm run canary:status
```

Expected outcome on production with `VERCEL_TOKEN` set: submit succeeds, status endpoint returns stage 2 (`isTest:true` ⇒ `client-feedback-test` label, Action skipped), canary passes after 3 polls.
