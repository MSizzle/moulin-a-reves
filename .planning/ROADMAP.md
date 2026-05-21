# Roadmap: Moulin à Rêves Site

## Milestones

- ✅ **v1.0 May 5 Client Edits** — Phases 1–3 (shipped 2026-05-05, archived 2026-05-21)
- 🚧 **v1.1 Batch Feedback Pipeline** — Phases 4–5 (started 2026-05-20)

## Overview

**v1.1 Batch Feedback Pipeline** replaces the current 1-edit-per-deploy feedback flow with a batched submission model: client stages multiple edits in a single session via a corner chip + panel UI, submits them as one POST, the server creates one GitHub issue containing all edits, and the Claude Code Action produces one branch / one commit / one PR / one deploy. Targets a ~10× reduction in deploys per client review pass.

Scope is intentionally narrow: a single ~450 LOC PR spanning `feedback-inject.js`, `submit.ts`, `feedback-version.ts`, and `.github/CLAUDE_FEEDBACK.md`. The editor flow is byte-for-byte unchanged (additive-only). Back-compat with `schemaVersion: 1` clients is required indefinitely (cached `feedback-inject.js` may live in browsers for days).

Two phases: implementation (everything that ships in the PR) and post-deploy verification (canary checks that can only run after Vercel deploys the merged code).

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3, 4, 5): Planned milestone work
- Decimal phases (4.1, 5.1, …): Urgent insertions (marked with INSERTED) — none anticipated

Decimal phases appear between their surrounding integers in numeric order. v1.1 continues numbering from v1.0 (which ended at Phase 3); no `--reset-phase-numbers` flag.

- [ ] **Phase 4: Batch Pipeline Implementation** — Client staging UI + v2 server schema + batched issue construction + Claude Action `## 8. Batch submissions` section, shipped as one PR with cache-bust bump and editor-flow-unchanged guarantee
- [ ] **Phase 5: Post-Deploy Verification** — Run v1 back-compat canary + v2 batched-issue canary against the deployed preview to prove cache-bust landed and both schemas work end-to-end

## Phase Details

<details>
<summary>✅ v1.0 May 5 Client Edits (Phases 1–3) — SHIPPED 2026-05-05</summary>

- [x] **Phase 1: Audit & Inventory** (1/1 plan) — completed 2026-05-05 — Code-deep tagged inventory of 92 client-feedback bullets across 3 PDF rounds.
- [x] **Phase 2: Ship-the-Clear Edits** (4/4 plans) — completed 2026-05-05 — All 29 unambiguous Clear-to-Ship edits shipped as atomic per-requirement commits.
- [x] **Phase 3: CLIENT-CLARIFICATION.md** (1/1 plan) — completed 2026-05-05 — 412-line client-readable Markdown doc.

Full milestone detail: [`milestones/v1.0-ROADMAP.md`](./milestones/v1.0-ROADMAP.md) · Requirements archive: [`milestones/v1.0-REQUIREMENTS.md`](./milestones/v1.0-REQUIREMENTS.md)

</details>

### Phase 4: Batch Pipeline Implementation

**Goal**: Client can stage multiple edits in a session, submit them as one batch, and the entire pipeline (server endpoint → GitHub issue → Claude Code Action) produces exactly one PR for that batch — while v1 cached clients keep working unchanged and the editor flow stays byte-for-byte identical.
**Depends on**: Nothing — milestone-fresh start; reuses existing `submit.ts`, `feedback-inject.js`, `CLAUDE_FEEDBACK.md` from the pre-v1.0 feedback pipeline
**Requirements**: STAGE-01, STAGE-02, STAGE-03, STAGE-04, STAGE-05, STAGE-06, STAGE-07, API-01, API-02, API-03, API-04, API-05, API-06, ISSUE-01, ISSUE-02, ISSUE-03, ISSUE-04, ACTION-01, ACTION-02, ACTION-03, OPS-01, OPS-02, OPS-03
**Success Criteria** (what must be TRUE):

  1. On `?feedback=1`, after confirming the first edit, a corner chip appears reading `N edits staged · Submit batch · View list`; the panel lists each staged edit in plain language with a per-item ❌ delete and a confirm-required "Clear all"; staged edits survive iframe navigation and reload and clear on browser close.
  2. Clicking **Submit batch** on a 3-edit stage produces exactly ONE `POST /api/feedback/submit` call with `{ schemaVersion: 2, batch: true, edits: [3 items] }`, which on success closes the panel, clears `sessionStorage`, and creates exactly ONE GitHub issue titled `[Feedback] batch of 3 edits — <pageRoutes>` containing per-edit `renderHuman()` summaries separated by `---` and a single fenced ```json``` block holding the entire `edits[]` array.
  3. A `schemaVersion: 1` single-edit payload posted to `/api/feedback/submit` (simulating a cached browser) still produces the existing single-edit issue with no behavioural change — verified by per-edit validation logic running through the same shared helper in both v1 and v2 code paths.
  4. A batched issue produces exactly ONE branch (`feedback/issue-<n>-batch-<N>`), ONE commit, ONE PR with all edits applied, and ONE Action result comment summarizing per-edit pass/fail; the embedded autonomy hint passes only if every edit individually passes the gate (failure-reason string lists which edits failed and why).
  5. `git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts` returns zero lines in the PR diff (editor flow byte-for-byte unchanged); `FEEDBACK_INJECT_VER` in `src/lib/feedback-version.ts` is bumped from its prior value; `CLAUDE.md` "Feedback mode" section has a new one-line note about v2 batch submissions.
  6. Client enforces 10-edit and 30 MB total-photo caps before submit (STAGE-06) with a clear 'limit reached' chip UX (STAGE-07); the server re-validates both caps and returns a structured per-cap error response that the UI highlights (API-06). (Emergent requirements added during plan-phase iteration 1 per D-05.)

**Plans**: 8 plans

Plans:
**Wave 1**

- [x] 04-01-PLAN.md — Extract shared per-edit validator (`src/pages/api/feedback/validate.ts` NEW; D-15 / API-04 mirror seed)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02-PLAN.md — Wire v1 submit.ts through shared validator + add v2 dispatch skeleton (API-02 back-compat preserved)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04-03-PLAN.md — Implement v2 batch handler in submit.ts (D-03 Vercel-limit reconciliation + input gates + issue construction + sequential photo commit; introduces emergent API-06)
- [x] 04-05-PLAN.md — Add `## 8. Batch submissions` section to `.github/CLAUDE_FEEDBACK.md` (ACTION-01/02/03)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 04-04-PLAN.md — Implement v2 client state machine + chip + panel in feedback-inject.js (introduces emergent STAGE-06, STAGE-07)

**Wave 5** *(blocked on Wave 4 completion)*

- [ ] 04-06-PLAN.md — Bump `FEEDBACK_INJECT_VER` from `'1'` to `'2'` (OPS-01 cache-bust)
- [ ] 04-07-PLAN.md — Add 'Batch submissions' bullet to CLAUDE.md 'Feedback mode' section (OPS-03)

**Wave 6** *(blocked on Wave 5 completion)*

- [ ] 04-08-PLAN.md — OPS-02 additive-only diff verification + integration smokes (merge-gate)

### Phase 5: Post-Deploy Verification

**Goal**: After the Phase 4 PR merges and Vercel auto-deploys, prove on the live deployment that the cache-bust took effect and both v1 and v2 schemas work end-to-end against real GitHub / Claude Action infrastructure.
**Depends on**: Phase 4 (merged and Vercel-deployed)
**Requirements**: OPS-04, OPS-05
**Success Criteria** (what must be TRUE):

  1. A `schemaVersion: 1` regression canary (curl with old-shape JSON) against the deployed `/api/feedback/submit` produces a single-edit issue via the existing v1 path — proving cached clients won't break.
  2. A v2 batched canary (using the `client-feedback-test` label OR `DRY_RUN=true` first) produces exactly ONE issue containing all edits in the JSON block, ONE Claude PR with all edits applied, and the autonomy verdict matches expectation (passes if every edit passes; gates to review otherwise); browser network tab confirms `feedback-inject.js?v=<NEW_VER>` is fetched (cache-bust verified end-to-end).

**Plans**: TBD

## Progress

**Execution Order:** Phases execute in numeric order: 4 → 5. Phase 5 cannot start until Phase 4's PR is merged to `main` and Vercel finishes auto-deploying.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Audit & Inventory | v1.0 | 1/1 | Complete | 2026-05-05 |
| 2. Ship-the-Clear Edits | v1.0 | 4/4 | Complete | 2026-05-05 |
| 3. CLIENT-CLARIFICATION.md | v1.0 | 1/1 | Complete | 2026-05-05 |
| 4. Batch Pipeline Implementation | v1.1 | 5/8 | In Progress|  |
| 5. Post-Deploy Verification | v1.1 | 0/TBD | Not started | - |

**v1.0 — COMPLETE 2026-05-05** (38/38 requirements). **v1.1 — Planning** (0/25 requirements mapped across 2 phases; 100% coverage; emergent STAGE-06/STAGE-07/API-06 added during plan-phase iteration 1 per D-05).
