---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: File-Driven Per-Page Edit Flow
status: ready_to_plan
stopped_at: Phase 08 complete (5/5) — ready to discuss Phase 9
last_updated: 2026-05-26T19:58:05.336Z
last_activity: 2026-05-26 -- Phase 08 execution started
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 10
  completed_plans: 10
  percent: 33
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-21)

**Core value:** Convey the compound's atmosphere convincingly enough to convert visitors into bookings and direct inquiries.
**Current focus:** Phase 9 — post deploy verification

## Current Position

Phase: 9
Plan: Not started
Status: Ready to plan
Last activity: 2026-07-13 - Completed quick task 260713-mu0: capacity 20 guests + events for 50 + Pricing & Events section on contact page

## Performance Metrics

**Velocity (v1.0):**

- Total plans completed: 11
- Average duration: ~25 min
- Total execution time: ~2h 30 min

**By Phase (v1.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 1 | ~50 min | ~50 min |
| 2 | 4 | ~95 min | ~24 min |
| 3 | 1 | ~5 min | ~5 min |
| 08 | 5 | - | - |

**v1.1 Trend:** 14 plans (8 implementation + 3 gap-closure + 3 canary) over a single ~16h session.
**v1.2 Trend:** 3 plans + 1 quick-task closure over a single day (2026-05-21).
**v1.3 Trend:** No plans executed yet.

*Updated after each plan completion.*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table. All v1.0, v1.1, and v1.2 decisions remain in force (i18n dual-store rule, atomic per-requirement commits, "newest round wins", `?feedback=1` flow as sibling to editor flow, OPS-02 fence, `FEEDBACK_INJECT_VER` single-source-of-truth bump, VERCEL_TOKEN Production-only scoping, 5s server cache + 8s client poll over webhook push, shared per-edit validator as single source of truth between v1 and v2 paths).

**New for v1.3 (provisional — confirm in plan-phase discuss step):**

- `dist/edit-catalogs/` ships to production (no `.vercelignore` entry) so the matcher endpoint reads catalogs via the filesystem on Vercel. CATALOG-06 documents the call.
- `feedback-match-inject.js` is a fully separate file from `feedback-inject.js` (not a code path inside the same file) so the OVERLAY-05 byte-for-byte fence on `feedback-inject.js` is mechanical rather than reviewer-judgment-bound.
- `MATCH_INJECT_VER` lives alongside `FEEDBACK_INJECT_VER` in `src/lib/feedback-version.ts` as a second exported constant; bump independently per behavioural change to `feedback-match-inject.js`.
- `ANTHROPIC_API_KEY` is Production-scope only on Vercel (mirrors v1.2 VERCEL_TOKEN pattern); missing key degrades the matcher to a structured 500 without affecting the per-element click flow.

### Pending Todos

- **`/gsd-plan-phase 7`** — decompose Build-time Edit Catalog Generator into plans (target: shared Node-side helper extracted from `feedback-inject.js:169-185`, Astro post-build integration, per-route catalog walker, `requiresManualSelection` flag for hardcoded text without a content-collection source, `buildSha` field).
- **Operator: set `ANTHROPIC_API_KEY`** in Vercel project env (Production scope only) before Phase 9 canary runs. The matcher gracefully degrades without it (structured 500), so Phase 8 implementation work is unblocked — only the live canary in Phase 9 needs it.
- **Set `VERCEL_TOKEN` in Vercel production env** (carry-over from v1.2) — blocks stage-5 "Live" detection on the v1.2 rail. Runbook in user memory `moulin-feedback-status-rail.md`. Not blocking v1.3.
- **Push v1.2 close commits to `origin/main`** (carry-over from v1.2) — 4 local commits (`b648796 → 7ad7177`) ahead of remote. Not blocking v1.3 implementation but blocks the live deployment that v1.3 will eventually layer on top of.
- **Wait on Melissa's reply** (carry-over from v1.0+) — gates the items in `CLIENT-CLARIFICATION.md`. Not blocking v1.3.

### Blockers/Concerns

- **None new for v1.3.** The matcher endpoint's reliance on `ANTHROPIC_API_KEY` is a known degrade-gracefully path (MATCH-06 + OPS-03); Phase 8 ships in a working but-matcher-disabled state if the operator hasn't set the key yet.
- **Operational debt (v1.2 carry):** stage 5 "Live" detection requires `VERCEL_TOKEN` in production env; without it the rail correctly degrades to stage 4. UX dead-end only — no crash, no data loss. Not blocking v1.3.
- **Carry-forward from v1.0:** the 3 deferred verification items at `## Deferred Items → Acknowledged at v1.0 close` (Phase 2 UAT eye-only items) remain open. Not blocking v1.3.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260506-kao | fix catering hero crop — bias upward so faces stay visible | 2026-05-06 | a6342c2 | [260506-kao-catering-hero-object-position-fix](./quick/260506-kao-catering-hero-object-position-fix/) |
| 260521-ou9 | Fix persistSubmission summary derivation in src/pages/feedback.astro — flat `.pageRoute` reads on v1+v2 (closes STATUS-06) | 2026-05-21 | 1495a10 | [260521-ou9-fix-persistsubmission-summary-derivation](./quick/260521-ou9-fix-persistsubmission-summary-derivation/) |
| 260521-sjf | Ship snapshot tooling — scripts/snapshot-pre.sh + snapshot-diff.sh + .github/workflows/snapshot.yml daily cron + gitignore .planning/snapshots/ | 2026-05-22 | 6310fe6 | [260521-sjf-ship-snapshot-tooling-for-agent-paranoia](./quick/260521-sjf-ship-snapshot-tooling-for-agent-paranoia/) |
| 260610-tw0 | June 10 client edit batch — all 18 items from moulin-a-reves-edit-prompts doc (asset intake, sitewide lightbox, house-page edits, galleries, groups videos, /art/ page, catering hero, contact fix) | 2026-06-11 | df2ab07 | [260610-tw0-execute-june-10-client-edit-batch-from-m](./quick/260610-tw0-execute-june-10-client-edit-batch-from-m/) |
| 260628-x7i | Smooth gallery photo-grid spawn animation — opacity-only fade, drop translateY transform that fought CSS multicol + lazy-image reflow | 2026-06-28 | ca1c36d | [260628-x7i-smooth-gallery-photo-grid-spawn-animatio](./quick/260628-x7i-smooth-gallery-photo-grid-spawn-animatio/) |
| 260629-0cn | Fix PhotoCarousel cross-fade flash — incoming slide fades over solid outgoing (no stone-backdrop show-through) | 2026-06-29 | 1fcc617 | [260629-0cn-fix-photocarousel-cross-fade-flash-incom](./quick/260629-0cn-fix-photocarousel-cross-fade-flash-incom/) |
| 260713-mu0 | Client pricing update — capacity 10→20 guests site-wide (EN+FR), events 35→50, new Pricing & Events section on contact page (€2,500/house, €10,000 compound, 2-night min, €250 linens fee, €5,000 event fee ≤50 ppl) | 2026-07-13 | 9697cf2 | [260713-mu0-pricing-capacity-update](./quick/260713-mu0-pricing-capacity-update/) |

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Gallery modal | Fix X-button, forward arrow, bottom crop (all houses) | v1.3 | Milestone 1 init |
| Calendar | Extend scrollable range to 12 months | v1.3 | Milestone 1 init |
| Editor flow | Deep audit of fragile publish/save paths | v1.3 | Milestone 1 init |
| Google Maps | Active embed in Getting Here section | v1.3 pending client | Milestone 1 init |
| Groups page | New top-level page | v1.3 pending client | Milestone 1 init |
| Clarification answers | Apply Melissa's CLIENT-CLARIFICATION.md replies | v1.3 pending client | v1.1 kickoff (2026-05-20) |
| Webhook-driven status push | Replace v1.2 polling with Vercel + GitHub webhooks → SSE | v1.3+ | v1.2 audit close (2026-05-21) |
| Batch feedback open questions | 5 UX design questions (caps, cross-page, draft persistence, autonomy thresholds, cancel UX) | Phase 4 discuss-phase | v1.1 roadmap (2026-05-21) |

### Acknowledged at v1.0 close (2026-05-21)

Three open artifacts surfaced by `audit-open` were acknowledged at the v1.0 milestone close. Substantively the work is on the live site — only the verification artifact metadata is open. All three resolve at a browser on the deployed preview.

| Category | Item | Status | Note |
|----------|------|--------|------|
| UAT | `phases/02-ship-the-clear-edits/02-HUMAN-UAT.md` | partial — 6 pending scenarios | HH hero centering, CTA overlay opacity, FR i18n toggle, Maison dining tile lead, plus 2 more — all eye-only on the deployed preview |
| Verification | `phases/02-ship-the-clear-edits/02-VERIFICATION.md` | human_needed | Same 6 visual confirmations expressed as a verification harness; same eye-only verdict |
| Quick task | `quick/260506-kao-catering-hero-object-position-fix` | missing status indicator | Substantively complete 2026-05-06 (commits `a6342c2`, `98e6dd9`); only the quick-task tooling's status file is missing |

*Note:* v1.0 phase directories were archived to `.planning/milestones/v1.0-phases/` during v1.1 kickoff (commit `1aa074b`); v1.1 phases archived to `.planning/milestones/v1.1-phases/` at v1.1 close; v1.2 phase directory archived to `.planning/milestones/v1.2-phases/` at v1.2 close. `.planning/phases/` is empty and ready for v1.3 Phase 7 work.

**Resolution path:** Run `/gsd-verify-work 2` against the deployed preview to retire all 6 visual UAT items and close the verification gap in one pass. The quick-task status will reconcile on the next `audit-open` run. (Not blocking v1.3.)

### Acknowledged at v1.2 close (2026-05-21)

Two quick tasks were flagged by `audit-open` as "missing status" — both have `SUMMARY.md` files with `status: complete` frontmatter; the audit query uses a stricter filename convention (`<id>-01-SUMMARY.md`) than the quick-task tooling actually writes (`<id>-SUMMARY.md` for single-task quick work). Tooling false-positive only; no missing work.

| Category | Item | Status | Note |
|----------|------|--------|------|
| Quick task | `quick/260506-kao-catering-hero-object-position-fix` | tooling metadata false-positive | Substantively complete 2026-05-06 (commits `a6342c2`, `98e6dd9`); audit-tool naming-convention check, not a real gap |
| Quick task | `quick/260521-ou9-fix-persistsubmission-summary-derivation` | tooling metadata false-positive | Substantively complete 2026-05-21 (commit `1495a10`, SUMMARY at `260521-ou9-SUMMARY.md` with `status: complete`); same audit-tool naming-convention check |

## Session Continuity

Last session: 2026-05-26T16:38:53.068Z
Stopped at: Phase 8 UI-SPEC approved
Resume file: .planning/phases/08-matcher-endpoint-match-inject-overlay-side-panel-per-page-mo/08-UI-SPEC.md

## Operator Next Steps

1. **`/gsd-plan-phase 7`** — decompose Build-time Edit Catalog Generator into plans. Reuse `closestAttr` / `i18nOf` logic from `public/feedback-inject.js:169-185` via a shared Node-side helper (CATALOG-03 is the spine; the other 5 hang off it).
2. **Set `ANTHROPIC_API_KEY`** in Vercel project env (Production scope only) before Phase 9 canary. Not needed for Phase 7 or Phase 8 implementation — the matcher degrades gracefully without it.
3. **Set `VERCEL_TOKEN`** (carry-over from v1.2) in Vercel production env to light up stage-5 "Live" detection on the v1.2 rail. Runbook: `moulin-feedback-status-rail.md`.
4. **Push v1.2 close commits** (`b648796 → 7ad7177`) to `origin/main` — PR or direct, owner's choice. Blocks live deployment that v1.3 will eventually layer on top of.
