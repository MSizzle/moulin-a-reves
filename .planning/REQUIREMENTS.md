# Milestone v1.2 Requirements — Status Visibility

**Milestone:** v1.2 Status Visibility
**Goal:** Make the v1.1 batch-feedback pipeline observable to the client via a per-batch deployment progress bar on `/feedback`.
**Plan reference:** `/Users/Montster/.claude/plans/a-couple-ideas-this-melodic-nebula.md` (Feature 1).
**Defined:** 2026-05-21

---

## v1.2 Requirements (10)

### Server — Status Endpoint (5)

- [ ] **STATUS-01**: New route `src/pages/api/feedback/status/[issueNumber].ts` exists, declares `export const prerender = false;`, and rejects unauthenticated requests with `401` via the existing `checkAuth()` helper from `src/lib/auth.ts`.
- [ ] **STATUS-02**: Endpoint resolves a numeric issue → a stage code in `{1,2,3,4,5}` corresponding to: 1 Submitted, 2 Reviewing, 3 PR opened, 4 Merged/Needs-review/Question, 5 Live. Resolution combines: GitHub issue labels, GitHub issue's linked `pull_request`, the merge commit SHA on `main`, and the Vercel deployment state for that SHA.
- [ ] **STATUS-03**: Stage 4 returns a `sub` field disambiguating which terminal-review state was reached: `'auto-merged'`, `'needs-review'`, `'needs-client-reply'`, `'merged'`, or `'open'`. `null` at stages 1–3 and 5.
- [ ] **STATUS-04**: Endpoint memoizes responses server-side keyed by `<issueNumber>` with a ~5 s TTL so 10 sequential client polls produce ≤ 1 GitHub API call sequence per issue per 5 s window.
- [ ] **STATUS-05**: Vercel deployment state is fetched via the Vercel REST API using a server-only token sourced from a new `VERCEL_TOKEN` env var; the token is never reachable from the browser. If the token is missing, the endpoint still returns valid stage 1–4 data and degrades stage 5 detection to `null` rather than crashing.

### Client — Recent Submissions Rail (4)

- [ ] **STATUS-06**: On successful POST to `/api/feedback/submit` from `src/pages/feedback.astro`, the returned `{ issueNumber, issueUrl }` plus a derived `summary` (route list + edit count) is appended to a `localStorage` entry under key `mar_feedback_recent_v1` (max 20 most-recent retained).
- [ ] **STATUS-07**: A new "Recent submissions" rail renders below the feedback iframe on `/feedback`, showing one row per persisted submission with: issue number link, summary, submitted timestamp (relative), and a 5-segment progress bar with the current stage lit and prior stages filled.
- [ ] **STATUS-08**: The rail polls `/api/feedback/status/<N>` every 8 s for any row whose stage is `< 5` AND whose `sub` is not in `{'needs-review','needs-client-reply'}`. Polling stops once the row reaches stage 5 OR enters a human-wait sub-state.
- [ ] **STATUS-09**: Stage-4 rows render their `sub` as a human label: `auto-merged` → "Merged", `needs-review` → "Needs Monty's review", `needs-client-reply` → "Question for you →" (with deep-link to the issue comment). Stage-5 rows collapse to a single "✓ Live · <relative time>" line with a "view changes" link to the merge commit.

### Verification (1)

- [ ] **STATUS-10**: A canary script `scripts/smoke-feedback-status.mjs` (dual-mode like `smoke-feedback-v2.mjs`) submits a small dry-run batch through `submit.ts`, then polls `/api/feedback/status/<N>` until the response stabilizes at stage 5 OR a terminal review sub-state, with a 5-minute timeout. Exits non-zero on timeout or unexpected stage regression. Wired into `npm run canary` alongside the existing v1 / v2 canaries.

---

## Future Requirements (deferred to v1.3+)

- File-driven per-page edit flow (catalog generator, Claude-Haiku matcher endpoint, `feedback-match-inject.js`, side panel with Approve/Reject/Pick-manually). Tracked as Feature 2 in the plan; landing as Milestone v1.3.
- Webhook-driven status push (replace polling with Vercel + GitHub webhooks → server-sent events). Defer until polling cost is shown to be a problem.
- Per-edit drill-down within a batch (show which edits inside the batch failed validation, which images uploaded). Today the API only exposes batch-level outcomes; deferred until v1.3 needs it.

## Out of Scope

- Changes to `.github/CLAUDE_FEEDBACK.md`, the Action's prompt, the issue body schema, or the `submit.ts` server contract. v1.2 must be net-additive.
- New auth surface (no API keys, no rotated tokens beyond the new `VERCEL_TOKEN`). The existing `maison_session` HMAC cookie protects all new endpoints.
- Mobile-specific UI for the rail. The rail uses the existing responsive layout patterns from `/feedback`; no dedicated mobile flow.
- Push notifications, email, or Slack alerts when a batch goes live. The rail is the surface; out-of-band notification is out of scope.

## Traceability

To be filled in by the roadmapper / phase plan: maps REQ-IDs above to phase numbers and verifying plan IDs.
