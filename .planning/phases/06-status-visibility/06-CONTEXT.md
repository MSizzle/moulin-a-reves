---
phase: 6
milestone: v1.2
name: Status Visibility
status: planning
created: 2026-05-21
---

# Phase 6 — Status Visibility — Context

## Goal

Make the v1.1 batch-feedback pipeline observable to the client. After Submit, a per-batch progress bar on `/feedback` lights up through 5 stages (Submitted → Reviewing → PR opened → Merged/Needs-review/Question → Live).

## Requirements

STATUS-01..10 (see `.planning/REQUIREMENTS.md`).

## Source of truth

`/Users/Montster/.claude/plans/a-couple-ideas-this-melodic-nebula.md` (Feature 1 section). Design is finalized; this phase implements it as-spec'd.

## What we're touching

| File | Action | Why |
|------|--------|-----|
| `src/pages/api/feedback/status/[issueNumber].ts` | NEW | Auth-gated status endpoint (STATUS-01..05) |
| `src/lib/feedback-status.ts` | NEW | Shared stage-resolver function + types (consumed by route + client) |
| `src/pages/feedback.astro` | EDIT | Add "Recent submissions" rail + polling loop (STATUS-06..09) |
| `scripts/smoke-feedback-status.mjs` | NEW | Dual-mode canary (STATUS-10) |
| `package.json` | EDIT | Add `canary:status` + extend `canary` aggregate |
| `.env.local` / Vercel env | OPS | Set `VERCEL_TOKEN` (server-only) |

## What we're NOT touching (load-bearing fences)

- `public/feedback-inject.js` — no changes (no cache-bust bump in v1.2)
- `src/lib/feedback-version.ts` — stays at `FEEDBACK_INJECT_VER='4'`
- `src/pages/api/feedback/submit.ts` — server submit contract is fixed
- `.github/CLAUDE_FEEDBACK.md` — Action prompt fixed
- `src/pages/api/feedback/validate.ts` — validator is fixed

## Decisions already made

- **Per-batch granularity, not per-edit.** One batch = one issue = one PR = one commit = one deploy; per-edit progress is not useful.
- **Polling, not webhooks.** Server-side 5 s memo cache + 8 s client poll + auto-stop on terminal states keeps API cost bounded. Webhook-driven push deferred.
- **localStorage, not server-side persistence.** The client owns its "Recent submissions" list. No new DB / store.
- **Stage 5 ("Live") is best-effort.** If `VERCEL_TOKEN` is missing or the Vercel API call fails, the endpoint returns valid stage 1–4 data and stage 5 stays `null`. The rail shows "Merged · checking deploy…" rather than failing the whole row.
- **Auth model reused.** Same HMAC `maison_session` cookie that gates `/api/feedback/submit` gates the status endpoint.

## External-state observability map

| Stage | Detected by | API call |
|-------|-------------|----------|
| 1 Submitted | Locally — issue # returned from submit | (none) |
| 2 Reviewing | Issue has `client-feedback` label and no `pull_request` link | `GET /repos/.../issues/<N>` |
| 3 PR opened | Issue's `pull_request` field is non-null OR a comment contains a PR URL | same call |
| 4a auto-merged / merged | Issue label `auto-merged` OR PR `merged_at` is non-null | `GET /repos/.../pulls/<N>` |
| 4b needs-review | Issue label `needs-review` | label-list from #2's call |
| 4c needs-client-reply | Issue label `needs-client-reply` | label-list from #2's call |
| 5 Live | Vercel deployment for the merge SHA on `main` is `READY` | `GET https://api.vercel.com/v6/deployments?projectId=...&sha=<mergeSha>` |

## Risks + mitigations

- **GH rate limit:** 5 s memo cache + auto-stop on terminal. ~1 req per issue per 5 s under sustained polling.
- **Stale `pull_request` link:** Issues sometimes don't get the field populated immediately. Mitigation: also scan issue comments for the PR URL the Action posts (Action always comments the PR URL per `.github/CLAUDE_FEEDBACK.md`).
- **`VERCEL_TOKEN` missing in dev:** Graceful degrade to stage 4 with `sub: 'merged'`; do not crash.
- **localStorage quota:** Cap retained submissions at 20.

## Plans

- **06-01 — Status endpoint + shared types** — STATUS-01..05
- **06-02 — Recent submissions rail UI** — STATUS-06..09
- **06-03 — Canary script** — STATUS-10
