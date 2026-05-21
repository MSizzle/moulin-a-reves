# Roadmap: Moulin à Rêves Site

## Milestones

- ✅ **v1.0 May 5 Client Edits** — Phases 1–3 (shipped 2026-05-05, archived 2026-05-21)
- ✅ **v1.1 Batch Feedback Pipeline** — Phases 4–5 (shipped 2026-05-21, archived 2026-05-21)
- 📋 **v1.2** — TBD (run `/gsd-new-milestone` to plan)

## Phase Details

<details>
<summary>✅ v1.0 May 5 Client Edits (Phases 1–3) — SHIPPED 2026-05-05</summary>

- [x] **Phase 1: Audit & Inventory** (1/1 plan) — completed 2026-05-05 — Code-deep tagged inventory of 92 client-feedback bullets across 3 PDF rounds.
- [x] **Phase 2: Ship-the-Clear Edits** (4/4 plans) — completed 2026-05-05 — All 29 unambiguous Clear-to-Ship edits shipped as atomic per-requirement commits.
- [x] **Phase 3: CLIENT-CLARIFICATION.md** (1/1 plan) — completed 2026-05-05 — 412-line client-readable Markdown doc.

Full milestone detail: [`milestones/v1.0-ROADMAP.md`](./milestones/v1.0-ROADMAP.md) · Requirements archive: [`milestones/v1.0-REQUIREMENTS.md`](./milestones/v1.0-REQUIREMENTS.md)

</details>

<details>
<summary>✅ v1.1 Batch Feedback Pipeline (Phases 4–5) — SHIPPED 2026-05-21</summary>

- [x] **Phase 4: Batch Pipeline Implementation** (11/11 plans: 8 + 3 gap-closure) — completed 2026-05-21 — v2 client state machine + server schema + batched issue construction + Claude Action `## 8. Batch submissions` section + cache-bust `FEEDBACK_INJECT_VER='3'` + OPS-02 editor-flow fence intact. 3 BLOCKER gaps (CR-01 forwarder, CR-02 spoofable cap, CR-03 silent partial-failure) closed via retrospective gap-closure plans 04-09..04-11.
- [x] **Phase 5: Post-Deploy Verification** (3/3 plans) — completed 2026-05-21 — Reusable canary tooling (`scripts/smoke-feedback-v2.mjs` dual-mode + `scripts/canary.sh` + `npm run canary`). Live canaries against `www.moulinareves.com`: OPS-04 v1 regression (issue #89 closed), OPS-05 v2 batched (issue #96 + PR #97 closed, DRY_RUN halted merge, cache-bust + asset HEAD proven).

Full milestone detail: [`milestones/v1.1-ROADMAP.md`](./milestones/v1.1-ROADMAP.md) · Requirements archive: [`milestones/v1.1-REQUIREMENTS.md`](./milestones/v1.1-REQUIREMENTS.md) · Audit: [`milestones/v1.1-MILESTONE-AUDIT.md`](./milestones/v1.1-MILESTONE-AUDIT.md)

</details>

### 📋 v1.2 (Planning pending)

To start the next milestone, run `/gsd-new-milestone` — the questioning flow gathers context, picks a focus, generates a fresh REQUIREMENTS.md, and writes a new roadmap.

**Carried-forward candidates** (from PROJECT.md → "Carried forward to v1.2"):

- Photo gallery modal rewrite (X-button, forward arrow, bottom crop across all houses)
- Calendar 12-month scrollable range
- Editor / publishing flow deep audit (fragility, error paths, HMAC session edge cases)
- Apply Melissa's `CLIENT-CLARIFICATION.md` answers (gated on her reply)
- Possible v1.2 follow-on canary work: auto-canary-on-deploy GitHub workflow, Playwright-based browser net-tab fidelity, cron'd weekly regression sweep

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Audit & Inventory | v1.0 | 1/1 | Complete | 2026-05-05 |
| 2. Ship-the-Clear Edits | v1.0 | 4/4 | Complete | 2026-05-05 |
| 3. CLIENT-CLARIFICATION.md | v1.0 | 1/1 | Complete | 2026-05-05 |
| 4. Batch Pipeline Implementation | v1.1 | 11/11 | Complete | 2026-05-21 |
| 5. Post-Deploy Verification | v1.1 | 3/3 | Complete | 2026-05-21 |

**v1.0 — COMPLETE 2026-05-05** (38/38 requirements). **v1.1 — COMPLETE 2026-05-21** (25/25 requirements; live canaries verified end-to-end on deployed `www.moulinareves.com`).
