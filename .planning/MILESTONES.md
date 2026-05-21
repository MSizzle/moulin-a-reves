# Milestones

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
