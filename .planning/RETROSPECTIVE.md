# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — May 5 Client Edits

**Shipped:** 2026-05-05 (archived 2026-05-21)
**Phases:** 3 | **Plans:** 6 | **Sessions:** 1 evening + 1 follow-on day
**Requirements:** 38 / 38 v1 (3 AUDIT + 15 COPY + 3 TYPOG + 8 SECT + 3 PHOTO + 6 CLAR)
**Git:** `a28dbc0` → `98e6dd9` · 134 files · +16,811 / −509 LOC (incl. 67 new photo assets)

### What Was Built

- **Code-deep audit pipeline** turning a 3-round client-feedback PDF (`MMM may.5.pdf`, 92 parent bullets) into a tagged inventory with file:line references and commit citations — the contract for both Phase 2 (ship) and Phase 3 (clarify).
- **29 atomic per-requirement edits** to copy, typography, sections, and photos across home, the 3 house pages, contact, and i18n — landed live on the deployed site before the client opened the clarification doc.
- **`CLIENT-CLARIFICATION.md`** at the project root — 412 lines, 9 H2 page-grouped sections, every ❓ item with verbatim quote + current-state + bold question, plus an "Already done — please re-review" section designed to break the client's re-reporting cycle.
- **`.hero--cta` BEM modifier** for the reduced-overlay "Interested in {house}?" CTA hero band — a small but reusable pattern across all 3 house pages.

### What Worked

- **Audit-first paid for itself twice.** Spending ~50 min on the Phase 1 code-deep audit meant Phase 2 had file:line anchors for every clear-to-ship row, and Phase 3 had verbatim quote + clarification-question pre-written for every ❓. Phase 3 plan-execution took ~5 minutes because all the source data was pre-extracted into `_audit-bullets.json`.
- **"Newest round wins"** was the right tie-breaker for cross-round contradictions — resolved 4 conflicts cleanly (Join us!, Bienvenue!, Mérévillois, italics) and surfaced each in CLAR so the client can still object if she wants the older version.
- **Atomic per-requirement commits** (21 of them in Phase 2) made the "Already Done — please re-review" CLAR section trivially citable — every item points to a specific commit hash the client can verify.
- **Page-grouped CLAR doc** (not category-grouped) reads as a walk-through of the site the client experiences, not a category dump. Matches how non-technical readers process visual products.
- **Shipping clear edits before sending the clarification doc** meant Melissa would see visible progress on the live site WHILE answering open questions — reframes the conversation from "you still haven't fixed X" to "look how much got done, now help me with these tricky ones".

### What Was Inefficient

- **i18n dual-store drift wasn't caught upfront.** COPY-01 was partially shipped weeks earlier (`.astro` updated, `translations.json` not) and we only discovered it during 02-01 execution. Several keys (home.tagline, compound.stats.houses, per-house availability headings) had to be reconciled mid-flight. Cheaper to have run a dual-store consistency scan as part of the audit.
- **TYPOG-01 italic policy was scoped twice.** Plan 02-01 stripped italic-spans from the COPY-related translation values, and Plan 02-02 stripped them from the same span markup in `.astro` files. A unified pass would have been one commit not two — though splitting them did make the audit trail cleaner per category.
- **Phase 3 deviation (Universal #11 Bonjour→Bienvenue added in Task 1 rather than deferred)** — the executor made the right call substantively but the deviation note polluted the SUMMARY one-liner, which then leaked into the auto-generated MILESTONES.md. The one-liner extraction needs to skip deviation notes (or the executor should write a clean one-liner separately).
- **The audit JSON sidecar (`_audit-bullets.json`) was the real reusable asset** — but it's buried under `phases/01-audit-inventory/`. Future milestones with PDF feedback should structure this kind of artifact as a first-class deliverable, not a side effect.

### Patterns Established

- **i18n dual-store rule:** every copy change MUST touch both `public/i18n/translations.json` AND `src/i18n/translations.ts`. Future i18n work treats forgetting one as a defect.
- **Empty-string deletion over key removal:** when removing a translation, set the value to `""` rather than removing the key, to preserve editor-SPA / dashboard compatibility (`home.homes.subheading`, `home.stats.intro`).
- **i18n array-index renumbering:** removing a middle entry from an array consumed by `${i18nKey}.amenity.${i}` requires shifting all subsequent translation keys in BOTH stores — otherwise the runtime overlay maps the wrong English/French to the wrong slot.
- **Audit JSON sidecar:** for PDF feedback work, generate a structured `_audit-bullets.json` alongside the human-readable AUDIT.md so downstream phases can iterate programmatically instead of re-parsing markdown.
- **CLIENT-CLARIFICATION pattern:** page-grouped (not category-grouped) Markdown at project root with verbatim quote + current-state + bold question per ambiguous item, plus an "Already done — please re-review" section with commit citations to break the re-reporting cycle.
- **Scoped CSS overrides for page-only behavior** preferred over modifying the global rule (e.g. HH hero vertical centering shipped as a page-only `<style>` block, not a change to `.hero` in `global.css`).

### Key Lessons

1. **Audit-first is non-negotiable for PDF feedback.** The ~50 min audit investment converted what could have been 6 hours of "where is this thing she's asking about?" into atomic-commit execution against an indexed inventory.
2. **Status-flag what's already done.** Non-technical clients re-flag shipped items because they don't track commits. A "✅ Already done — please re-review" section in client deliverables breaks the cycle and earns trust.
3. **Ship visible progress before asking questions.** Putting 29 atomic edits on the live site BEFORE the client opens the clarification doc completely changes the tone of her reply.
4. **Treat i18n as dual-store always.** The runtime overlay (`translations.json`) and typed seed (`translations.ts`) drift silently; assume they're out of sync and reconcile on every copy change.
5. **One-liner SUMMARY hygiene matters at archive time.** The auto-generated MILESTONES.md pulled a deviation note as Phase 3's "accomplishment" — a bad surface for a real win. Executors should write a clean one-liner separate from deviation logs.

### Cost Observations

- **Model mix (rough):** ~40% opus (planner, phase orchestration, audit reasoning), ~55% sonnet (executor for atomic edits), ~5% haiku (none noted — most light work fell back to sonnet).
- **Sessions:** ~1 focused evening (May 5) for Phases 1–3 + 1 follow-on day (May 6) for polish PRs (#56–#72, kao quick task).
- **Velocity:** Phase 3 plan-execution was the standout (~5 min) because Phase 1 had pre-extracted all source data. Phase 2 plans averaged ~24 min/plan and scaled with code-edit count, not requirement count.
- **Notable:** Audit-first is the highest-leverage investment in any client-feedback milestone — the ~50 min spent in Phase 1 paid back as ~150 min of avoided re-investigation across Phase 2 and Phase 3.

---

## Milestone: v1.2 — Status Visibility

**Shipped:** 2026-05-21
**Phases:** 1 (Phase 6) | **Plans:** 3 + 1 quick-task gap closure (`260521-ou9`)
**Requirements:** 10 / 10 v1.2 (STATUS-01..10, all satisfied)
**Git:** `7811cf5` (PR #99 merge) → `7ad7177` (final docs commit). Companion fix `fe37cef` (PR #98 cache-bust v4) landed just before. STATUS-06 closure `1495a10` landed retroactively after the first audit pass.

### What Was Built

- **Auth-gated `/api/feedback/status/[issueNumber]` endpoint** + pure resolver `src/lib/feedback-status.ts` rolling 4 API signals (GitHub issue, comments, PR, Vercel deployment by commit SHA) into a 5-stage code with 5s in-memory Map cache and graceful VERCEL_TOKEN degrade.
- **"Recent submissions" rail on `/feedback`** with localStorage persistence (cap 20), 5-segment progress bar, 8s client poll auto-stopping on terminal state, and stage-4 human disambiguation.
- **`scripts/smoke-feedback-status.mjs`** dual-mode canary (unit + canary) wired into `npm run canary:status` and the no-arg `scripts/canary.sh` default (now runs v1 → v2 → status sequentially).
- **Smart-quote pitfall fix in `feedback.astro`** as collateral inside 06-02 — replaced 14 U+2018/U+2019 JS string delimiters with ASCII `'` in lines 196-225 of the `<script is:inline>` block. The script had been parse-failing in browsers for 16 days; v1.1 canaries never exercised the iframe parent so the bug stayed latent.

### What Worked

- **Milestone audit caught a real defect that local verification missed.** The first audit pass surfaced STATUS-06 (rail summary reading `.locator.pageRoute` paths that never existed on the wire). The integration checker cross-referenced `persistSubmission()` against the actual `feedback-inject.js` payload shape — verification by reading both files in tension, not just inspecting the handler in isolation. Phase VERIFICATION.md had marked STATUS-06 passed based on code inspection of `persistSubmission()` alone. This is now the canonical "code-inspection verification alone is insufficient for client-side handlers consuming server-emitted shapes" lesson.
- **Inline closure via `/gsd-quick` worked cleanly.** The STATUS-06 fix was 3 line replacements; spinning up `discuss-phase → plan-phase → execute-phase` would have been overkill. `/gsd-quick` produced a worktree-isolated atomic commit (`1495a10`) and a SUMMARY in ~5 minutes. The "audit → quick-task closure → re-audit → complete-milestone" loop is a viable single-day close pattern for plumbing-scale gaps.
- **Graceful VERCEL_TOKEN degrade** kept the endpoint shippable without operator setup. The runbook in user memory `moulin-feedback-status-rail.md` walks the operator through token creation (scoped Production-only) and validation via the status canary. Without it, the rail tops out at stage 4 but doesn't crash.
- **Single-resolver design over per-stage endpoints.** `resolveStage()` as a pure function means the endpoint, unit tests, and canary mode all consume the exact same logic — cache coherence is guaranteed because there's only one path.
- **`FEEDBACK_INJECT_VER` discipline.** Bumping `'3'` → `'4'` in PR #98 (chip + staged-panel click fix) was necessary because the inject script changed; the rail (server endpoint + new client code in `feedback.astro`, not in `feedback-inject.js`) did NOT require a bump. The decision to bump or not is now a reflex: "did `feedback-inject.js` change? If yes, bump."

### What Was Inefficient

- **Phase VERIFICATION.md code-inspection pass missed the STATUS-06 wiring gap.** The verifier read `persistSubmission()` and concluded "the rail handler reads `msg.payload.edits[]` correctly per persistSubmission" — true in isolation, but the `.locator.pageRoute` read inside that function didn't match `feedback-inject.js`'s flat-payload shape. **Lesson:** for handlers that consume external payload shapes, verification must include reading the source-of-truth emitter, not just the consumer.
- **No E2E smoke test for the v2-batch-via-rail flow.** Captured as carry-forward tech debt. An actual submission round-tripped through the rail (rather than just the unit-table for `resolveStage`) would have caught STATUS-06 in Phase 6 itself.
- **Stale STATE.md and ROADMAP.md surfaced by the audit but not by the phase verification.** STATE.md was still claiming "Phase 04" focus, ROADMAP.md still showed v1.2 as 🚧 Planning with 0/? plans. These are bookkeeping debt that `/gsd-complete-milestone` reconciles, but ideally the phase-completion step itself would update them.
- **CLI's `summary-extract` couldn't pull one-liners.** The Phase 6 SUMMARY files don't include a `one_liner` frontmatter field, so `gsd-sdk query milestone.complete` reported "(none recorded)" for accomplishments. Manually backfilled in MILESTONES.md post-archival. Tooling gap.

### Patterns Established

- **Audit → quick-task closure → re-audit → complete-milestone** as a single-day close loop for plumbing-scale gaps (vs. a closure phase via `/gsd-phase --insert`).
- **Pure resolver + thin endpoint** for API routes that combine multiple upstream calls. The pure function is unit-testable; the endpoint adds auth + cache + I/O. Same pattern can apply to future endpoints like `/api/feedback/health` or `/api/deploy/state`.
- **Memory-driven operational runbooks.** `moulin-feedback-status-rail.md` captures the VERCEL_TOKEN setup steps with team ID, project ID, env scope, and validation command — once. Future maintainers (including future-me) don't have to re-derive it.
- **Quick-task SUMMARY filename convention is `<id>-SUMMARY.md`, not `<id>-01-SUMMARY.md`** for single-task work. The `audit-open` query's strict naming check flagged the v1.2 quick tasks as "missing" — false positive. Acknowledged in STATE.md "Deferred Items" under "Acknowledged at v1.2 close". Tooling should be relaxed.

### Key Lessons

1. **Code inspection of a consumer is insufficient verification for cross-file shape contracts.** Whenever you verify a handler that reads `payload.X.Y`, you must also read the emitter to confirm `payload.X.Y` is actually emitted with that shape. The first v1.2 audit demonstrated this concretely.
2. **Milestone audits should run integration checks against actual code, not just summarize per-phase verification claims.** The integration checker subagent's value is highest when it cross-references files the phase verification didn't.
3. **The 16-day-latent smart-quote bug** is a cautionary tale: any inline `<script>` block that doesn't have a parser smoke-test in CI can quietly break on copy-paste from rich-text sources. Memory note captures the gotcha. Future inline-script-heavy work should include the `new Function(scriptBody)` smoke as a habit.
4. **Bookkeeping debt** (stale STATE.md, ROADMAP.md, REQUIREMENTS.md checkboxes) is invisible to phase verification but visible to milestone audit. `/gsd-complete-milestone` reconciles it — running the audit then the close is now the canonical "is this milestone really done?" sequence.

### Cost Observations

- **Model mix:** opus for planning (1 plan), sonnet for execution + integration check + quick-task + audit re-run.
- **Sessions:** 1 (single-evening close after the in-progress PR #99 merged earlier the same day).
- **Notable:** The 3-line STATUS-06 fix took longer to plan-orchestrate than to write. `/gsd-quick` overhead (planner agent + worktree creation + executor agent + worktree cleanup + STATE update + final commit) is ~5 minutes wall-clock for a literal 3-line edit. For multi-line refactors this overhead is amortized; for trivial fixes it dominates. The trade-off bought atomic-commit + GSD bookkeeping + isolated execution; the alternative (raw `sed -i`) would have been 30 seconds but with zero traceability.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~2 (1 evening + 1 follow-on day) | 3 | First GSD-managed milestone on this project. Established audit-first pattern for PDF feedback, atomic-per-requirement commit convention, i18n dual-store rule. |
| v1.1 | 1 (~16 hours focused) + gap-closure cycle | 2 | First milestone with retrospective gap-closure inside the same phase (`/gsd-plan-phase 4 --gaps --auto` → 04-09..04-11). Live canaries against deployed `www.moulinareves.com` proved cache-bust + DRY_RUN gate. OPS-02 fence pattern formalized. |
| v1.2 | 1 (single-day) + audit-driven gap closure | 1 | First milestone where a milestone audit caught a real wiring defect that phase VERIFICATION.md (code inspection) had marked passed. Closed inline via `/gsd-quick` rather than a closure phase. Established the "audit → quick-task → re-audit → complete-milestone" loop. |

### Cumulative Quality

| Milestone | Requirements Coverage | Verification Coverage | Notable Quality Signals |
|-----------|----------------------|------------------------|--------------------------|
| v1.0 | 38/38 | 0/6 visual (deferred — eye-only on deployed preview) | Atomic per-requirement commits; both i18n stores in parity post-shipment; zero rollbacks needed |

### Top Lessons (Verified Across Milestones)

1. *(needs 2+ milestones to verify cross-milestone — re-evaluate after v1.1 ships)*
