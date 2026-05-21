# Milestones

## v1.2 Status Visibility (Shipped: 2026-05-21)

**Phases completed:** 1 phase, 3 plans + 1 quick-task gap closure
**Requirements:** 10 / 10 v1.2 (STATUS-01..10, all `satisfied`)
**Timeline:** 2026-05-21 (single-day milestone — PR #99 squash-merged the same day, retrospective wiring-gap closure landed the same evening via quick task `260521-ou9`)
**Git range:** `7811cf5` (PR #99 merge) → `7ad7177` (final docs commit). Companion fix `fe37cef` (PR #98 chip/staged-panel click fix, cache-bust v4) landed just before PR #99.
**Live verification:** Phase 6 verified locally via `npx tsx scripts/smoke-feedback-status.mjs` (9/9 unit table pass) + inline-script parser smoke (`new Function(scriptBody)` → OK) + VERCEL_TOKEN-absent degrade case. Post-deploy canary against `www.moulinareves.com` pending operator setting `VERCEL_TOKEN` (graceful degrade verified — endpoint stays valid at stage 4 without it).
**Known deferred items at close:** 2 tooling-metadata false-positives (see STATE.md → ## Deferred Items → "Acknowledged at v1.2 close"). 4 tech-debt items captured in `milestones/v1.2-MILESTONE-AUDIT.md` (canary.sh doc drift, v2-batch-via-rail E2E smoke, Vercel `meta.githubCommitSha` implicit contract, webhook-driven push deferred to v1.3+). 1 operational-debt item: `VERCEL_TOKEN` env var setup.

**Key accomplishments:**

- **Per-batch deployment progress bar shipped on `/feedback`.** Auth-gated `src/pages/api/feedback/status/[issueNumber].ts` route + pure stage resolver `src/lib/feedback-status.ts` rolls 4 API signals (GitHub issue, issue comments, PR, Vercel deployment by commit SHA) into a 5-stage code (Submitted → Reviewing → PR opened → Merged/Needs-review/Question → Live). 5-second in-memory Map cache keyed by issue number bounds GitHub API cost to ≤ 1 sequence per issue per 5s under sustained polling.
- **"Recent submissions" rail rendered on `src/pages/feedback.astro`** below the iframe — `localStorage` (`mar_feedback_recent_v1`, cap 20), 5-segment per-row progress bar, 8-second client poll with `isTerminal()` auto-stop (stage 5 OR sub `needs-review`/`needs-client-reply`), stage-4 human disambiguation ("Merged" / "Needs Monty's review" / "Question for you →"). Stage-5 collapses to "✓ Live · <relative time>" with a view-changes link to the merge commit.
- **Graceful VERCEL_TOKEN degrade.** Endpoint reads `import.meta.env.VERCEL_TOKEN`; if absent or the Vercel call fails, the response stays valid at stage 4 with `deployUrl: null` and sub `auto-merged`/`merged`. STATUS-05 unit case confirms no crash. Setup runbook captured in user memory `moulin-feedback-status-rail.md`.
- **OPS-02 fence held byte-for-byte across all of v1.2.** `git diff main~6..main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts | wc -l` returns 0 — the editor / publishing flow is untouched per the additive-only contract that has held since v1.1.
- **Smart-quote pitfall in `feedback.astro` fixed as collateral work in 06-02.** A 2026-05-05 edit had replaced ASCII `'` with U+2018/U+2019 as JS string delimiters in 14 occurrences inside the `<script is:inline>` block (lines 196-225) — the entire script body had been parse-failing in every browser since then. v1.1 canaries hit `/api/feedback/submit` directly and never exercised the iframe parent, so it stayed latent for 16 days. Fixed by replacing the delimiters with ASCII `'`; literal apostrophes inside ASCII-delimited strings kept as U+2019.
- **STATUS-06 wiring gap caught by milestone audit, closed inline.** First audit pass found `persistSubmission()` in `feedback.astro:272-278` read `e.locator.pageRoute` / `payload.locator.pageRoute` paths that never existed on the wire (`feedback-inject.js` emits a flat payload on both v1 `buildPayload` and v2 `editObj` spread paths). v1 rows would have shown "0 edits"; v2 rows had a correct count but no route list. Closed via quick task `260521-ou9` (3-line edit, commit `1495a10`) before milestone archive. Re-audit confirmed `passed` (10/10).
- **Reusable status canary tooling.** `scripts/smoke-feedback-status.mjs` runs in dual modes via `TARGET_URL` (unit mode: imports `resolveStage` directly, runs 9 table-driven assertions; canary mode: mints `maison_session`, posts `isTest:true` v1 edit, polls `/api/feedback/status/<N>` with 5-minute timeout). Wired into `npm run canary:status` and the no-arg `scripts/canary.sh` default (now runs v1 → v2 → status sequentially).

**Process note:** v1.2 is the first milestone where a post-execution milestone audit caught a real wiring defect that the phase's own VERIFICATION.md (relying on code inspection) had marked passed. The integration checker traced `persistSubmission()` against the actual `feedback-inject.js` payload shape and surfaced the `.locator.pageRoute` mismatch in a way that pure file-by-file inspection didn't. The fix landed via `/gsd-quick` (worktree-isolated, 3-line atomic commit) before milestone archive, demonstrating that the "audit → quick-task closure → re-audit → complete-milestone" loop is a viable single-day close pattern when the gap is plumbing-scale rather than architectural.

---

## v1.1 Batch Feedback Pipeline (Shipped: 2026-05-21)

**Phases completed:** 2 phases, 14 plans (8 + 3 gap-closure + 3 canary), 15 tasks
**Requirements:** 25 / 25 v1.1 (7 STAGE + 6 API + 4 ISSUE + 3 ACTION + 5 OPS, all `satisfied`)
**Timeline:** 2026-05-20 → 2026-05-21 (~16 hours of focused single-session work + 1 follow-on gap-closure cycle)
**Git range:** `32c8df2` → `e7195c3` (78 commits, 75 files changed; +11,623 / −207 LOC)
**Live verification:** OPS-04 canary (issue #89), OPS-05 canary (issue #96 + PR #97), both closed cleanly; cache-bust + DRY_RUN gate proven on `www.moulinareves.com`
**Known deferred items at close:** 0 new (1 carry-over from v1.0: orphan `260506-kao` quick-task status indicator — substantively complete via commits `a6342c2`/`98e6dd9`, only the tooling metadata file is missing)

**Key accomplishments:**

- **v2 batch feedback pipeline shipped end-to-end.** Client stages multiple edits via corner chip + panel + sessionStorage, submits as one POST with `{schemaVersion:2, batch:true, edits:[...]}`; server creates ONE GitHub issue per batch with batch title + per-edit `renderHuman()` joined by `---` + single fenced ```json``` block; Claude Action produces ONE branch / ONE commit / ONE PR / ONE result comment. v1 cached clients keep working indefinitely.
- **Shared per-edit validator (D-15 mirror).** Extracted `src/pages/api/feedback/validate.ts` consumed by both `handleV1` and `handleV2Batch` so the two paths can never drift on validation rules. Single source of truth for `signalCount`, `clamp`, `INTENTS`, `MAX_IMAGE_BYTES`, `MIN_VAGUE_LEN`, etc.
- **OPS-02 fence held byte-for-byte across all 14 plans.** `git diff <pre-Phase-4-baseline> -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts | wc -l` returns 0 — the editor / publishing flow is untouched per the additive-only contract.
- **3 BLOCKER gaps closed in retrospective gap-closure cycle.** CR-01 (parent forwarder dropped structured cap/error fields → inject branches were dead code), CR-02 (server cap was descriptor-spoofable — added `approxDecodedBytes` helper + decoded-bytes reducer), CR-03 (silent partial-photo-commit failure — added `commitErrors` + `warning` to 200 response shape). All closed via plans 04-09 / 04-10 / 04-11 with `FEEDBACK_INJECT_VER` re-bumped from `'2'` to `'3'`.
- **Live-deploy proven end-to-end.** OPS-04 v1 regression canary on the deployed `/api/feedback/submit` (issue #89, single-edit shape, closed). OPS-05 v2 batched canary fired the real Claude Action under `DRY_RUN=true` repo variable (issue #96, PR #97 at `feedback/issue-96-batch-2`, result comment "Dry run: this would have been auto-applied…", branch deleted, issue + PR closed). Cache-bust proof: deployed HTML contains `const feedbackVer = "3"` AND `/feedback-inject.js?v=3` HEAD returns 200.
- **Reusable canary tooling.** `scripts/smoke-feedback-v2.mjs` runs in dual modes via `TARGET_URL` env var (unit-stub mode: 5/5 scenarios with mocked GitHub API; canary mode: real fetch against deployed URL). `scripts/canary.sh` is a thin bash wrapper exposing v1/v2 dispatch. `npm run canary:v1` / `canary:v2` / `canary` are opt-in regression nets for future modifications to `feedback-inject.js` / `submit.ts` / `feedback-version.ts`.

**Process note:** The milestone shipped in two acts — Phase 4 implementation landed via 8 plans + 3 retrospective gap-closure plans after initial verification surfaced the 3 BLOCKERs, then Phase 5 verified the deployed pipeline via 3 canary plans. The gap-closure cycle (`/gsd-plan-phase 4 --gaps --auto` → `/gsd-execute-phase 4`) closed the verification gaps cleanly without a separate phase. v1.1 demonstrated that "Executed (gaps_found) → gap-closure → passed" is a viable single-milestone close pattern when the gaps are code-plumbing fixes inside the same scope.

---

## v1.0 May 5 Client Edits (Shipped: 2026-05-05, archived: 2026-05-21)

**Phases completed:** 3 phases, 6 plans, 34 tasks
**Requirements:** 38 / 38 v1 (3 AUDIT + 15 COPY + 3 TYPOG + 8 SECT + 3 PHOTO + 6 CLAR)
**Timeline:** 2026-05-05 → 2026-05-06 (kickoff to follow-on polish)
**Git range:** `a28dbc0` → `98e6dd9` (134 files changed; +16,811 / −509 LOC including 67 new photo assets)
**Known deferred items at close:** 3 (see `.planning/STATE.md` → `## Deferred Items` → v1.0 close subsection)

**Key accomplishments:**

- **Audit:** Tagged inventory of 92 parent bullets across 3 client-feedback rounds (April 30 / May 1 / May 5) with code-deep file:line cross-references and 8 distinct ✅ commit hash citations — a contract-grade output that Phase 2 and Phase 3 consumed without re-reading the PDF.
- **Copy (15 reqs):** All 15 Clear-to-Ship copy edits shipped as 11 atomic per-requirement commits, with 4 already-done items (COPY-05, 07, 08, 12) verified clean. Runtime overlay and typed seed in parity across every touched i18n key.
- **Typography (3 reqs):** Italic-on-final-word removed from every AUDIT-listed header across home, contact, 3 house pages, plus i18n. Hollywood Hideaway hero tagline upright via scoped CSS override. Font count already at the 2-family target — no consolidation needed.
- **Sections (8 reqs):** 6 atomic commits + 2 verify-only confirmations. Three house-page gathering-spaces arrays trimmed (Le Moulin: −office, −courtyard; Maison de la Rivière: −exterior, −gardens). HH main carousel cleared of la-grange-pavilion-wide. Carriage photos pulled from gym-and-bikes. Pink-gown welcome photo pulled from Le Moulin main carousel. All 6 RoomShowcase invocations across the 3 houses now pass `hideTileSummary={true}`.
- **Photos (3 reqs):** 2 atomic commits + 1 verify-only. Maison de la Rivière dining tile now leads with `maison-dinner-light.webp`. HH top-of-page hero text vertically centered via scoped CSS override. New `.hero--cta` modifier reduces the dark filter on per-house "Interested in {house}?" CTA hero across all three pages.
- **Clarification deliverable:** `CLIENT-CLARIFICATION.md` at project root — 412 lines, 9 H2 page sections; every ❓ item has verbatim quote + current-code-state + bold question; "Already done — please re-review" section breaks re-reporting cycles; Groups-page question framed as Monty's instinct.

**Process note:** All clear-to-ship work landed visibly on the live site **before** the client read the clarification doc — so she saw progress as she answered open questions. The Phase 1 audit (one plan, ~50 min) paid for itself across Phase 2 (each clear-to-ship row had file:line anchors) and Phase 3 (each ❓ row had a pre-written verbatim quote).

---
