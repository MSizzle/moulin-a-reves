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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~2 (1 evening + 1 follow-on day) | 3 | First GSD-managed milestone on this project. Established audit-first pattern for PDF feedback, atomic-per-requirement commit convention, i18n dual-store rule. |

### Cumulative Quality

| Milestone | Requirements Coverage | Verification Coverage | Notable Quality Signals |
|-----------|----------------------|------------------------|--------------------------|
| v1.0 | 38/38 | 0/6 visual (deferred — eye-only on deployed preview) | Atomic per-requirement commits; both i18n stores in parity post-shipment; zero rollbacks needed |

### Top Lessons (Verified Across Milestones)

1. *(needs 2+ milestones to verify cross-milestone — re-evaluate after v1.1 ships)*
