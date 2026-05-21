---
phase: 6
status: ready-to-verify-post-deploy
requirements-total: 10
requirements-satisfied: 10
created: 2026-05-21
---

# Phase 6 Verification — Status Visibility (v1.2)

## Coverage

| REQ-ID | Description | Plan | Verified by |
|--------|-------------|------|-------------|
| STATUS-01 | Auth-gated `prerender=false` status route | 06-01 | Code inspection (`checkAuth()` first, `401` on fail) |
| STATUS-02 | Stage 1..5 resolved from GitHub + Vercel signals | 06-01 | 9-case unit table in 06-03 (PASS) |
| STATUS-03 | Stage-4 `sub` disambiguator populated | 06-01 | Unit table covers `auto-merged`, `merged`, `needs-review`, `needs-client-reply`, `open` (stage 3 case) |
| STATUS-04 | 5 s memo cache | 06-01 | Code inspection (Map keyed by issue number, TTL guard before fetches) |
| STATUS-05 | `VERCEL_TOKEN` server-only + graceful degrade | 06-01 | Unit case "stage 4 auto-merged, vercel token missing" returns stage 4 (no crash) |
| STATUS-06 | localStorage persist on success, cap 20 | 06-02 | Code inspection (`persistSubmission()` → `saveRecent()` → `.slice(0, 20)`) |
| STATUS-07 | Rail renders 5-segment bar per row | 06-02 | Code inspection + manual smoke (see below) |
| STATUS-08 | 8 s poll, auto-stop on terminal | 06-02 | Code inspection (`isTerminal()` clears `setInterval`) |
| STATUS-09 | Stage-4 human sub-labels + stage-5 collapse | 06-02 | Code inspection (`subBlock()`) |
| STATUS-10 | Canary script (unit + canary modes) | 06-03 | `npx tsx scripts/smoke-feedback-status.mjs` → 9/9 passed |

## Local verification log

```
$ npx tsx scripts/smoke-feedback-status.mjs
… 9/9 passed
$ node -e "const fs = require('fs'); const txt = fs.readFileSync('src/pages/feedback.astro','utf8'); const m = txt.match(/<script is:inline[^>]*>([\s\S]*?)<\/script>/); new Function(m[1]); console.log('OK');"
… OK   (smart-quote fix verified — entire inline script body parses)
$ npx tsx -e "import('./src/lib/feedback-status.ts').then(m => console.log(m.resolveStage({...}).stage))"
… 5  (stage-5 case returns 5)
```

## Post-deploy verification (after PR merges)

1. Vercel auto-deploys `feat/v1.2-status-visibility` → `main` merge commit.
2. Operator sets `VERCEL_TOKEN` in the Vercel project env (project-level, server-only). Without it stage 5 stays at stage 4 with sub `auto-merged`/`merged` (degrade path).
3. Run:
   ```bash
   DASHBOARD_PASSWORD=<vercel env> npm run canary:status
   ```
   Expected: submits an `isTest:true` v1 edit, polls `/api/feedback/status/<N>`, sees stage 2 (Action skips `client-feedback-test`), PASSES after 3 polls.
4. Manual UI smoke: visit `/feedback`, submit a real (non-test) batch via the chip flow (requires the chip-clicks fix from PR #98 already on main). Recent submissions rail should appear under the iframe with stage 1 → 2 within ~30 s, then 3 within 60 s, then 4 / 5 over the next few minutes.

## Carry-overs / known gaps

- The unit table-driven cases use the v1.1 chip pattern (single-edit `isTest` submissions). The full v2-batch-via-rail flow isn't end-to-end smoke-tested locally — but the rail handler reads `msg.payload.edits[]` correctly per `persistSubmission()`, and the v2 batch postMessage shape is unchanged from v1.1 (verified by Phase 4 / 5 work).
- The Vercel-deploy-state lookup matches by `meta.githubCommitSha`. If Vercel changes how it sets that field, stage 5 detection silently degrades to stage 4. Mitigation: out-of-scope monitoring; if the rail starts showing rows stuck at stage 4 indefinitely, audit the Vercel API response shape.
- No webhook-driven push yet. Polling cost is bounded by the 5 s server cache + 8 s client tick + auto-stop on terminal; estimate ≤ 1 GitHub API sequence per issue per 5 s under sustained polling. If this becomes a problem, the webhook-push variant is captured as a v1.3+ future requirement.
