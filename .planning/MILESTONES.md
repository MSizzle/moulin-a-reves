# Milestones

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
