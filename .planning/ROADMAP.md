# Roadmap: Moulin à Rêves Site — Milestone 1: May 5 Client Edits

## Overview

Three parallel deliverables due 2026-05-06: a code-deep audit of the client's `MMM may.5.pdf` feedback, execution of all unambiguous edits as atomic commits, and a `CLIENT-CLARIFICATION.md` that surfaces every ambiguous item with specific questions. The audit output (tagged inventory) is the input to the other two, so it runs first. All structural fixes (gallery modal, calendar, editor flow) are deferred to Milestone 2.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases: Urgent insertions (none anticipated for this milestone)

- [x] **Phase 1: Audit & Inventory** - Cross-reference every item in `MMM may.5.pdf` against current codebase; tag each as Already Done / Clear-to-Ship / Needs Clarification / Cross-round Conflict
- [x] **Phase 2: Ship-the-Clear Edits** - Execute all Clear-to-Ship and resolved Cross-round Conflict items as atomic commits grouped by category (copy, typography, sections, photos) — **completed 2026-05-05**
- [ ] **Phase 3: CLIENT-CLARIFICATION.md** - Compile all Needs Clarification items into a client-facing Markdown document grouped by page, with verbatim requests, current code state, and specific questions

## Phase Details

### Phase 1: Audit & Inventory
**Goal**: Produce a complete, code-deep tagged inventory of every client-feedback item so that Phase 2 and Phase 3 have a definitive, no-guesswork input list.
**Depends on**: Nothing (first phase)
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03
**Success Criteria** (what must be TRUE):
  1. Every item mentioned in all three rounds of `MMM may.5.pdf` appears in the audit inventory with a tag (Already Done / Clear-to-Ship / Needs Clarification / Cross-round Conflict).
  2. Items addressed by recent commits (`c04e333`, `064839a`, `7b264e7`, `250733e`, `3ff6215`) are explicitly marked Already Done with a file/commit reference — not left as open questions.
  3. Each "Needs Clarification" item has a current-code-state note (file path, line number, or quoted string where applicable) so the question in Phase 3 can be specific rather than vague.
  4. Cross-round conflicts (e.g., "Join us!" vs "When would you like to visit?", italics universal policy, commune naming) are identified and the "newest round wins" resolution is recorded, with the contradiction noted for the clarification doc.
**Plans:** 1 plan
Plans:
- [x] 01-01-audit-inventory-PLAN.md — Parse MMM may.5.pdf, cross-reference current HEAD code, tag every bullet (✅/🔧/❓/⚠️), and write AUDIT.md as the contract for Phase 2 and Phase 3 — **completed 2026-05-05** (92 bullets: ✅10/🔧52/❓29/⚠️1)
**UI hint**: no

### Phase 2: Ship-the-Clear Edits
**Goal**: Execute every Clear-to-Ship and conflict-resolved edit as a set of atomic commits so the live site visibly improves before the client reviews the clarification doc.
**Depends on**: Phase 1
**Requirements**: COPY-01, COPY-02, COPY-03, COPY-04, COPY-05, COPY-06, COPY-07, COPY-08, COPY-09, COPY-10, COPY-11, COPY-12, COPY-13, COPY-14, COPY-15, TYPOG-01, TYPOG-02, TYPOG-03, SECT-01, SECT-02, SECT-03, SECT-04, SECT-05, SECT-06, SECT-07, SECT-08, PHOTO-01, PHOTO-02, PHOTO-03
**Success Criteria** (what must be TRUE):
  1. `grep -r "when you can stay\|where you can stay" src/ public/i18n/` returns zero matches — all instances replaced by "Join us!" (COPY-01).
  2. Le Moulin beige footer stat reads "sleeps 10 in 8 beds" in both `src/content/homes/le-moulin.md` and `public/i18n/translations.json` (COPY-02).
  3. All italic styling removed from header final words for the listed cases ("stay", "Maisons", "Rêves") verified by grep for the relevant CSS class or `<em>` tag (TYPOG-01, TYPOG-02).
  4. Removed sections (Le Moulin office block, Hollywood "What's Here" 3-photo section, Maison Exterior section, La Grange toilet/laundry photos, home Journal section, carriage gym photo, pink-gown carousel photo) are absent from the built pages — verifiable by searching the relevant `.astro`/content files.
  5. Hollywood Hideaway lead image and Maison de la Rivière dining lead are updated to the requested photos, and Hollywood hero text is vertically centered with the dark filter adjusted per the audit finding (PHOTO-01, PHOTO-02, PHOTO-03).
**Plans**: 4 plans
Plans:
- [x] 02-01-copy-edits-PLAN.md — Execute COPY-01..COPY-15 across translations.json + .astro files (Wave 1) — **completed 2026-05-05** (11 commits + 4 verify-only)
- [x] 02-02-typography-edits-PLAN.md — Execute TYPOG-01..TYPOG-03 italic removal + font consolidation (Wave 2) — **completed 2026-05-05** (2 commits + 1 no-op TYPOG-03 — fonts already at 2-family target)
- [x] 02-03-section-edits-PLAN.md — Execute SECT-01..SECT-08 structural removals (Wave 3) — **completed 2026-05-05** (6 commits + 2 verify-only — SECT-04 cream lightbox, SECT-07 Journal section already shipped)
- [x] 02-04-photo-edits-PLAN.md — Execute PHOTO-01..PHOTO-03 photo swaps + hero CSS (Wave 4) — **completed 2026-05-05** (2 commits + 1 verify-only — PHOTO-01 heroImage already correct)
**UI hint**: yes

### Phase 3: CLIENT-CLARIFICATION.md
**Goal**: Deliver a single, client-readable Markdown document that surfaces every ambiguous item with verbatim context and a specific question, plus an "already done" section to stop re-reporting cycles.
**Depends on**: Phase 1
**Requirements**: CLAR-01, CLAR-02, CLAR-03, CLAR-04, CLAR-05, CLAR-06
**Success Criteria** (what must be TRUE):
  1. `CLIENT-CLARIFICATION.md` exists at the project root and is organized into page-level sections: Home / Le Moulin / Hollywood Hideaway / Maison de la Rivière / Les Maisons / Get in Touch / Universal.
  2. Every "Needs Clarification" item from the Phase 1 audit appears in the doc with (a) the verbatim client request quoted, (b) the current code state with file reference, and (c) at least one specific, answerable question.
  3. A clearly labelled "Already Done — please re-review" section lists every item the client has been re-flagging that is already shipped, so she can verify and stop re-submitting them.
  4. The doc includes the Groups page question (Monty's instinct — not from client), all cross-round contradiction flags (Join us! vs "When would you like to visit?", italics global policy, Le Mérévillois vs Méréville naming), and all asset-request items (jacuzzi photos, Stars Who Stayed Here photos, biking photos, Monet Giverny image, Netflix-on-TV decision).
**Plans**: 1 plan
Plans:
- [ ] 03-01-client-clarification-PLAN.md — Compile all 29 ❓ Needs-Clarification items + 1 ⚠️ cross-round conflict + ≥10 ✅ already-done items from AUDIT.md into a single client-readable Markdown doc at project root, grouped by page (Home / Le Moulin / Hollywood Hideaway / Maison de la Rivière / Les Maisons / Get in Touch / Universal), plus Groups-page question (Monty) and Already-Done re-review section
**UI hint**: no

## Progress

**Execution Order:** Phase 1 → Phase 2 → Phase 3 (Phase 2 and Phase 3 can start in parallel once Phase 1 inventory is complete)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Audit & Inventory | 1/1 | **Complete** | 2026-05-05 |
| 2. Ship-the-Clear Edits | 4/4 | **Complete** | 2026-05-05 |
| 3. CLIENT-CLARIFICATION.md | 0/1 | Ready to execute | - |
