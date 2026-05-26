# Roadmap: Moulin à Rêves Site

## Milestones

- ✅ **v1.0 May 5 Client Edits** — Phases 1–3 (shipped 2026-05-05, archived 2026-05-21)
- ✅ **v1.1 Batch Feedback Pipeline** — Phases 4–5 (shipped 2026-05-21, archived 2026-05-21)
- ✅ **v1.2 Status Visibility** — Phase 6 (shipped 2026-05-21, archived 2026-05-21)
- 🚧 **v1.3 File-Driven Per-Page Edit Flow** — Phases 7–9 (planning, 2026-05-26)

## Overview (active milestone — v1.3)

**v1.3 File-Driven Per-Page Edit Flow** lets the client paste a freeform list of changes for any single page, have Claude Haiku map each line to an addressable DOM element via a build-time edit catalog, and approve/reject each proposed match in a side panel before the approved set flows through the existing v1.1 batch pipeline unchanged.

Scope is **purely additive** on top of v1.1/v1.2 — `submit.ts`, the v1.1 shared validator, the v2 batch issue schema, the Claude Action, and the autonomy gate stay byte-for-byte unchanged. The new surface adds: a build-time edit-catalog generator (one JSON per route), an auth-gated `/api/feedback/match` endpoint backed by `claude-haiku-4-5`, a separate `feedback-match-inject.js` overlay that pins numbered orange badges on matched elements inside the iframe, a side panel that turns each Approve click into a v2 staged edit (re-using the existing chip + Submit batch flow), and a "Per-page review" mode tab on `/feedback`.

Three phases: catalog generator (build-time foundation), matcher + overlay + panel + per-page mode (the shippable UX), and post-deploy verification (live canary proving the editor-flow fence held and `MATCH_INJECT_VER` cache-bust took effect).

## Phases (active milestone — v1.3)

**Phase Numbering:**

- Integer phases (7, 8, 9): Planned v1.3 milestone work
- Decimal phases (7.1, 8.1, …): Urgent insertions (marked with INSERTED) — none anticipated

Decimal phases appear between their surrounding integers in numeric order. v1.3 continues numbering from v1.2 (which ended at Phase 6); no `--reset-phase-numbers` flag.

- [x] **Phase 7: Build-time Edit Catalog Generator** (5/5 plans) — completed 2026-05-26 — Astro post-build integration emits 17 catalogs (1806 entries) to `dist/client/edit-catalogs/` (Vercel adapter path; production HTTP path `/edit-catalogs/<route>.json` unchanged). Shared Node-side helper `src/lib/locator-signals.mjs` byte-pinned to `feedback-inject.js:169-238` via 8-test parity harness; OPS-02 fence held (0 lines diff). `buildSha` + `postbuild` sanity gate (`scripts/check-edit-catalogs.mjs`) hard-fails on schema violations or `buildSha='unknown'`.
- [ ] **Phase 8: Matcher Endpoint + Match-Inject Overlay + Side Panel + Per-Page Mode** — auth-gated `POST /api/feedback/match` (Claude Haiku), separate `public/feedback-match-inject.js` for numbered-pin overlay, side panel with Approve/Reject/Pick-manually wiring into the v1.1 staged-edits sessionStorage, and a "Per-page review" tab on `/feedback`; `MATCH_INJECT_VER` cache-bust + `ANTHROPIC_API_KEY` env scoping + CLAUDE.md note
- [ ] **Phase 9: Post-Deploy Verification** — Run the dual-mode `scripts/smoke-feedback-match.mjs` canary against the deployed preview to prove the matcher endpoint, the pin overlay, and the v1.1 staged-edits handoff all work end-to-end; final OPS-02 byte-for-byte fence assertion across the entire milestone PR set

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

<details>
<summary>✅ v1.2 Status Visibility (Phase 6) — SHIPPED 2026-05-21</summary>

- [x] **Phase 6: Status Visibility** (3/3 plans + 1 quick-task gap closure) — completed 2026-05-21 — Auth-gated `/api/feedback/status/[issueNumber]` route resolving GitHub + Vercel signals into a 5-stage code with 5s memo cache and graceful VERCEL_TOKEN degrade; "Recent submissions" rail under the `/feedback` iframe with 8s poll, terminal-state auto-stop, and stage-4 sub-label disambiguation; `scripts/smoke-feedback-status.mjs` canary wired into `npm run canary`. Smart-quote pitfall in `feedback.astro` (latent v1.1-era parse-fail) fixed in 06-02. STATUS-06 wiring gap closed retroactively via quick task `260521-ou9` (commit `1495a10`).

Full milestone detail: [`milestones/v1.2-ROADMAP.md`](./milestones/v1.2-ROADMAP.md) · Requirements archive: [`milestones/v1.2-REQUIREMENTS.md`](./milestones/v1.2-REQUIREMENTS.md) · Audit: [`milestones/v1.2-MILESTONE-AUDIT.md`](./milestones/v1.2-MILESTONE-AUDIT.md)

</details>

### Phase 7: Build-time Edit Catalog Generator

**Goal**: After `astro build`, a post-build integration walks the emitted HTML in `dist/` and writes one JSON catalog per prerendered route under `dist/edit-catalogs/<route>.json`. Each catalog enumerates every addressable element on the page — i18n text/HTML, images, gallery items, headings, content-collection-sourced hardcoded text — with the exact same locator signals (`i18nKey`, `currentText`, `nearestHeading`, `domPath`, `imageRef`) that the per-element click flow would compute, so an approved match from the matcher is byte-indistinguishable from a click-captured locator at submit time.

**Depends on**: Nothing — milestone-fresh start; reuses `closestAttr` / `i18nOf` logic from `public/feedback-inject.js:169-185` lifted into a new shared Node-side helper.

**Requirements**: CATALOG-01, CATALOG-02, CATALOG-03, CATALOG-04, CATALOG-05, CATALOG-06

**Success Criteria** (what must be TRUE):

  1. `npm run build` produces a `dist/edit-catalogs/` directory containing one `<route>.json` file per prerendered route (verify: `ls dist/edit-catalogs/ | wc -l` matches the count of static routes emitted by Astro, e.g. ≥ 8 covering home + about + contact + 3 house pages + the-compound + gallery).
  2. For a representative catalog (e.g. `dist/edit-catalogs/homes/le-moulin.json`), every element row exposes a stable `id`, a `kind` ∈ `{i18n-text, i18n-html, image, gallery-image, heading, hardcoded-text}`, AND ≥ 2 locator-signal fields populated where applicable (`i18nKey`, `currentText`, `nearestHeading`, `domPath`, `imageRef`); `hardcoded-text` rows that have no `src/content/**/*.md` frontmatter source carry `requiresManualSelection: true`.
  3. Catalog locator signals are byte-identical to what the v1.1 per-element click flow would produce — the shared Node-side helper (extracted from `feedback-inject.js:169-185`) is consumed by both the catalog walker and (when run in a unit test) returns the same `{ i18nKey, currentText, nearestHeading, domPath }` tuple for the same DOM element as `captureLocator()` does in-browser.
  4. Each catalog includes a top-level `buildSha` field set to the current git HEAD short SHA so a downstream consumer (Phase 8 overlay, Phase 9 canary) can detect catalog-drift relative to the deployed `<meta name="x-build-sha">` value.
  5. `dist/edit-catalogs/` ships to production (decision documented in the phase plan per CATALOG-06): a HEAD probe against the deployed `/edit-catalogs/homes/le-moulin.json` returns 200, AND `.vercelignore` does NOT contain a `dist/edit-catalogs` rule that would block deployment. _(Live HEAD probe deferred to Phase 9 — it requires a deployed Vercel build; Phase 9 Success Criterion #3 already covers it.)_

**Plans**: 5 plans across 3 waves

Plans:
**Wave 1**

- [x] 07-01-PLAN.md — Wave 1: Extract shared locator helper to `src/lib/locator-signals.mjs` + parity test pinning byte-identity to `public/feedback-inject.js:169-238` (CATALOG-03)
- [x] 07-02-PLAN.md — Wave 1: Astro integration scaffold registering `astro:build:done` hook in `astro.config.mjs` + stub catalog emission per prerendered route (CATALOG-01)
- [x] 07-04-PLAN.md — Wave 1: Content-collection index module `src/integrations/edit-catalog/content-index.mjs` walking `src/content/**/*.md` frontmatter for hardcoded-text source detection (CATALOG-04)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 07-03-PLAN.md — Wave 2: Catalog walker `src/integrations/edit-catalog/walker.mjs` — element classification + locator-signal population using shared helper + `requiresManualSelection` enforcement (CATALOG-02, CATALOG-03)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 07-05-PLAN.md — Wave 3: `buildSha` injection from git HEAD + `.vercelignore` ship-to-prod assertion + `scripts/check-edit-catalogs.mjs` post-build sanity script (CATALOG-05, CATALOG-06)

### Phase 8: Matcher Endpoint + Match-Inject Overlay + Side Panel + Per-Page Mode

**Goal**: A `/feedback` user picks a page, pastes a freeform list, clicks "Match edits", sees the iframe reload with numbered orange pins on each matched element, and uses a side panel to Approve / Reject / Pick-manually each match. Every Approve becomes a standard v2 staged edit that flows into the existing v1.1 corner chip and Submit batch pipeline unchanged. The new client surface is fully separated from `feedback-inject.js` (separate `public/feedback-match-inject.js` file, separate `MATCH_INJECT_VER` cache-bust constant) so the per-element click flow remains untouched.

**Depends on**: Phase 7 (the matcher endpoint reads `dist/edit-catalogs/<route>.json`; the overlay validates `buildSha` against the deployed catalog).

**Requirements**: MATCH-01, MATCH-02, MATCH-03, MATCH-04, MATCH-05, MATCH-06, MATCH-07, OVERLAY-01, OVERLAY-02, OVERLAY-03, OVERLAY-04, OVERLAY-05, PANEL-01, PANEL-02, PANEL-03, PANEL-04, PANEL-05, MODE-01, MODE-02, MODE-03, MODE-04, OPS-01, OPS-03, OPS-04

**Success Criteria** (what must be TRUE):

  1. Posting `{ route: "/homes/le-moulin", editList: "- Make the hero subtitle bolder\n- Shorten the testimonial quote\n- Replace the second gallery image with a sunset shot" }` to `/api/feedback/match` (with a valid `maison_session` cookie) returns a 200 with shape `{ matches: [{ line, primaryId, primaryConfidence, alternates: string[], reason }] }` where every `primaryId` and `alternates[]` ID exists in `dist/edit-catalogs/homes/le-moulin.json`; the same call without a session cookie returns 401; the same call against a route with no catalog returns a structured 404; the same call with a 15,000-char `editList` OR against a 200-element catalog returns a structured 4xx (per MATCH-07 caps).
  2. On `/feedback`, picking `/homes/le-moulin`, pasting the same 3-line list, and clicking "Match edits" loads the iframe at `/homes/le-moulin?feedback=1&matchSet=<id>&v=<MATCH_INJECT_VER>`; inside the iframe, three numbered orange badges appear at the top-left of the matched elements (visually distinguishable from the v1.1 per-element click overlay's hover/frozen styles), AND `git diff main -- public/feedback-inject.js` returns zero lines.
  3. Clicking **Approve** on a panel row stashes a v2 staged edit in `sessionStorage['mar_feedback_staged_v1']` whose locator shape passes `signalCount() >= 2` against the existing `validate.ts` rules (verified by re-reading the sessionStorage value and feeding it through the same validator the v1.1 chip's "Submit batch" call would run); the corner chip's "N edits staged" counter increments by exactly one without any change to `feedback-inject.js`; clicking **Reject** drops the row and increments a panel-local "Rejected (N)" counter; clicking **Pick-manually** clears the row's overlay highlight and lets the user resolve the match via the existing per-element click flow.
  4. The "Per-page review" mode and the existing per-element click mode coexist via a tab/toggle on `/feedback`: switching between them is a no-op for the other mode's sessionStorage state (`mar_feedback_match_set_v1` vs `mar_feedback_staged_v1` keys are independent), both modes are auth-gated by the same `checkAuth()`, and approving 3 matches in per-page mode + adding 1 click-staged edit in per-element mode results in a 4-edit batch on Submit (one issue, one PR).
  5. `MATCH_INJECT_VER` is declared in `src/lib/feedback-version.ts` alongside `FEEDBACK_INJECT_VER` and is consumed by both `BaseLayout.astro` (the conditional `?feedback=1` match-inject loader's `?v=` query) and `feedback.astro` (the iframe `src` builder); `ANTHROPIC_API_KEY` is read from server env only (grep `public/` returns zero hits) and a missing key produces a structured 500 with `{ error: 'matcher_unavailable' }` without crashing the endpoint; `CLAUDE.md` "Feedback mode" section contains a one-line note pointing future Claude sessions at the per-page review flow + `/api/feedback/match`.

**Plans**: 5 plans across 4 waves

Plans:
**Wave 1** *(parallel — no dependencies between 08-01 and 08-02)*

- [x] 08-01-PLAN.md — Wave 1: Add `MATCH_INJECT_VER` cache-bust constant to `src/lib/feedback-version.ts` + one-line per-page-review pointer in `CLAUDE.md` §Feedback mode (OPS-01, OPS-04)
- [x] 08-02-PLAN.md — Wave 1: Server endpoint `src/pages/api/feedback/match.ts` (auth-gated POST, Claude Haiku 4.5 via `@anthropic-ai/sdk`, catalog load + server-side ID validation, MATCH-07 caps, graceful `matcher_unavailable` degrade) + add `@anthropic-ai/sdk` as runtime dep + grep-gate `ANTHROPIC_API_KEY` out of `public/` (MATCH-01..07, OPS-03)

**Wave 2** *(depends on 08-01)*

- [ ] 08-03-PLAN.md — Wave 2: New `public/feedback-match-inject.js` (numbered-pin overlay + buildSha drift detection + manual-pick handoff) + sibling conditional loader in `BaseLayout.astro` (cache-bust via `MATCH_INJECT_VER`) — existing `?feedback=1` loader block byte-for-byte unchanged (OVERLAY-01..05)

**Wave 3** *(depends on 08-01, 08-02, 08-03)*

- [ ] 08-04-PLAN.md — Wave 3: `src/pages/feedback.astro` — mode tab strip + per-page input zone (picker + textarea + Match edits button + char counter + HEAD-probe catalog availability) + matcher POST handler + matchSet sessionStorage stash + iframe `?matchSet=` URL builder (MODE-01..04)

**Wave 4** *(depends on 08-04 — same file, sequential)*

- [ ] 08-05-PLAN.md — Wave 4: `src/pages/feedback.astro` — side panel render (rows + confidence pill + alternates + reason truncation + state badges) + Approve/Reject/Pick-manually/Restore/Undo handlers + catalog-drift banner + Re-run match + `mar:feedback:*` postMessage dispatcher + responsive 65/35 split at ≥1024px (PANEL-01..05)

### Phase 9: Post-Deploy Verification

**Goal**: After the Phase 7 + Phase 8 PR(s) merge and Vercel auto-deploys, run the dual-mode `scripts/smoke-feedback-match.mjs` canary against the live deployment to prove (a) the matcher endpoint round-trips a real call to `claude-haiku-4-5` end-to-end, (b) the deployed `feedback-match-inject.js` carries the bumped `MATCH_INJECT_VER`, (c) the `dist/edit-catalogs/` artifacts are reachable at production URLs, and (d) the OPS-02 editor-flow + v1.1 fence held byte-for-byte across the entire v1.3 PR set.

**Depends on**: Phase 8 (merged and Vercel-deployed); operator must set `ANTHROPIC_API_KEY` in the Vercel project env (Production scope only) before the canary can call the real Anthropic SDK.

**Requirements**: OPS-02, OPS-05

**Success Criteria** (what must be TRUE):

  1. `TARGET_URL=https://www.moulinareves.com DASHBOARD_PASSWORD=<env> npm run canary:match` runs the dual-mode `scripts/smoke-feedback-match.mjs` canary against the live deployment and exits 0; the canary mints a `maison_session`, POSTs a 3-line `editList` to `/api/feedback/match` for `/homes/le-moulin`, asserts the response shape (`matches[].primaryId` exists in the live `/edit-catalogs/homes/le-moulin.json`), and captures a `09-CANARY-EVIDENCE.md` artifact under `.planning/phases/09-post-deploy-verification/`.
  2. The deployed HTML at `https://www.moulinareves.com/feedback?feedback=1` contains a `MATCH_INJECT_VER` reference at the new bumped value (e.g. `const matchVer = "1"`), AND a HEAD probe against `https://www.moulinareves.com/feedback-match-inject.js?v=<MATCH_INJECT_VER>` returns HTTP/2 200 — proving the cache-bust contract took effect end-to-end (mirrors v1.1 OPS-05 cache-bust proof).
  3. A HEAD probe against `https://www.moulinareves.com/edit-catalogs/homes/le-moulin.json` returns HTTP/2 200 with `content-type: application/json`, AND a GET parses to JSON containing the same `buildSha` field as the deployed `<meta name="x-build-sha">` — proving catalogs ship to production and the drift-detection signal is consistent.
  4. `git diff <pre-v1.3-baseline> -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts public/feedback-inject.js src/pages/api/feedback/submit.ts src/pages/api/feedback/validate.ts | wc -l` returns 0 across the entire merged v1.3 PR set — the editor flow, the v1.1 batch inject, and the v1.1 batch submit endpoint + shared validator are byte-for-byte unchanged (OPS-02 fence held).
  5. `scripts/smoke-feedback-match.mjs` is wired into `scripts/canary.sh` so the no-arg `./scripts/canary.sh` default now runs v1 → v2 → status → match sequentially, AND `npm run canary:match` is declared in `package.json`; the unit mode (`scripts/smoke-feedback-match.mjs` with no `TARGET_URL`) passes a table-driven set of assertions against a stubbed Anthropic SDK fixture so the harness can be re-run as a regression net on future changes to `match.ts`.

**Plans**: TBD (filled in by `/gsd-plan-phase 9`)

## Progress

**Execution Order:** Phases execute in numeric order: 7 → 8 → 9. Phase 8 cannot start until Phase 7's catalog generator produces deterministic per-route JSON. Phase 9 cannot start until the Phase 7 + 8 PR(s) merge to `main` and Vercel finishes auto-deploying with `ANTHROPIC_API_KEY` set in the Production env.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Audit & Inventory | v1.0 | 1/1 | Complete | 2026-05-05 |
| 2. Ship-the-Clear Edits | v1.0 | 4/4 | Complete | 2026-05-05 |
| 3. CLIENT-CLARIFICATION.md | v1.0 | 1/1 | Complete | 2026-05-05 |
| 4. Batch Pipeline Implementation | v1.1 | 11/11 | Complete | 2026-05-21 |
| 5. Post-Deploy Verification | v1.1 | 3/3 | Complete | 2026-05-21 |
| 6. Status Visibility | v1.2 | 3/3 + 1 quick-task closure | Complete | 2026-05-21 |
| 7. Build-time Edit Catalog Generator | v1.3 | 5/5 | Complete | 2026-05-26 |
| 8. Matcher Endpoint + Overlay + Panel + Per-Page Mode | v1.3 | 2/5 | In Progress|  |
| 9. Post-Deploy Verification | v1.3 | 0/? | Planning | — |

**v1.0 — COMPLETE 2026-05-05** (38/38 requirements). **v1.1 — COMPLETE 2026-05-21** (25/25 requirements). **v1.2 — COMPLETE 2026-05-21** (10/10 STATUS-* requirements). **v1.3 — PLANNING 2026-05-26** (0/32 requirements; 100% coverage across Phases 7–9; Phase 8 plans drafted 2026-05-26).
