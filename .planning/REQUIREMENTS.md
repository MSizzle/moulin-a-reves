# Requirements: Moulin à Rêves Site — Milestone 1

**Defined:** 2026-05-05
**Core Value:** Convey the compound's atmosphere convincingly enough to convert visitors into bookings and direct inquiries.
**Source document:** `MMM may.5.pdf` (3 compiled rounds: April 30, May 1, May 5)
**Deadline:** 2026-05-06

## v1 Requirements

Coarse-grained category-level requirements. The phase plan + audit phase will itemize specific edits within each.

### Audit

- [x] **AUDIT-01**: Every item in `MMM may.5.pdf` (all 3 rounds) is categorized into one of: ✅ Already Done / 🔧 Clear-to-Ship / ❓ Needs Clarification / ⚠️ Cross-round Conflict. _Completed 2026-05-05 in 01-01 (92 bullets tagged: ✅10/🔧52/❓29/⚠️1)._
- [x] **AUDIT-02**: Items addressed by recent commits (`742fb89` and forward — May 5 photos work) are explicitly flagged DONE with file/commit references so the client stops re-asking. _Completed 2026-05-05 — 8 distinct ✅ commit hashes cited inline plus 10+ secondary acknowledgements._
- [x] **AUDIT-03**: Each "Needs Clarification" item has at least one specific question with current code-state context (file:line where applicable). _Completed 2026-05-05 — all 29 ❓ rows have file-anchored questions._

### Copy edits

- [x] **COPY-01**: All "When you can stay" / "Where you can stay" replaced with **"Join us!"** across home, all three home pages, and contact page footer.
- [x] **COPY-02**: Le Moulin beige footer reads **"sleeps 10 in 8 beds"** (was "sleeps 12 in 10 beds").
- [x] **COPY-03**: Landing-page bar reads **"3 homes"** (was "houses").
- [x] **COPY-04**: About page CTA changed from "come and see" to **"come and visit!"**.
- [x] **COPY-05**: Address corrected to `14, 16, 18 Rue des Crocs au Renard, 91660 Le Mérévillois` (no trailing X on "au").
- [x] **COPY-06**: Home page hero leads with **"A Private Luxurious Compound, One Hour From Paris"** then 10-bedrooms info; "Méréville, France" relocated below tagline.
- [x] **COPY-07**: Le Moulin house page renamed from "Moulin à Rêves" → **"Le Moulin"** (estate name vs single-house name distinction).
- [x] **COPY-08**: Compound button copy replaced with **"This is a private walled compound where you are master of your own domaine. Peace, privacy. Tranquility."**
- [x] **COPY-09**: "Speak with a concierge" / "Get in Touch" CTAs follow the **"Join us!"** pattern.
- [x] **COPY-10**: Plan-your-stay box "bonjour" → **"Bienvenue!"**
- [x] **COPY-11**: "Yoga retreats" → **"Yoga, painting, writing retreats"**; "Friends trips" → **"Friends celebrations"** in retreat copy.
- [x] **COPY-12**: "The Sanctuary" above Hollywood Hideaway → **"The Refuge"**.
- [x] **COPY-13**: Les Maisons section: remove "Three maisons. Sleeps 20 across 10 bedrooms." Replace with header **"Bienvenue Chez Vous"** + smaller text **"All size groups welcome. Rent 1 home or enjoy all 3."**
- [x] **COPY-14**: Delete "Three stone houses around shared gardens. Each its own world; together, the compound." description.
- [x] **COPY-15**: Add word "size" to contact microcopy: **"Tell us your dates, your group size, your dreams."**

### Typography

- [ ] **TYPOG-01**: Italic styling removed from final words of headers — at minimum: "stay" in "Where you can stay", "Maisons" in "Les Autres Maisons", "Rêves" in "Moulin à Rêves". Universal-policy clarification flagged in CLIENT-CLARIFICATION.md.
- [ ] **TYPOG-02**: "Get in Touch" page hero italicized text removed.
- [ ] **TYPOG-03**: Standardize site to 2–3 fonts; identify the "your french vacation come true" header font as a preferred variant for elegant accents.

### Section / content removal & restructuring

- [x] **SECT-01**: Le Moulin — office removed (folded into living-room collection); courtyard block removed (covered in gardens).
- [x] **SECT-02**: Hollywood Hideaway — "What's Here" 3-photo section removed; small "hollywood hideaway" text above hero text removed; Hollywood hero italic text removed; Secret Garden removed as individual room and folded into Looking Glass + American in Paris rooms; grange photo removed from main carousel. _(Note: "What's Here 3-photo section" sub-action deferred to Phase 3 per AUDIT ❓; other 4 sub-actions shipped/verified in 02-03.)_
- [x] **SECT-03**: Maison de la Rivière — Exterior section removed (covered in top gallery); Gardens section removed (covered below); 2 rows of duplicative hero text removed; house name centered.
- [x] **SECT-04**: Le Grange — toilet and laundry photos removed; black photo backgrounds replaced with white.
- [x] **SECT-05**: Gym & Bikes — carriage photo removed.
- [x] **SECT-06**: Le Moulin main carousel — pink-gown photo removed (keep bike-by-gate).
- [x] **SECT-07**: Home page — Journal section hidden.
- [x] **SECT-08**: Room carousels — subheaders above colon removed.

### Photo swaps

- [x] **PHOTO-01**: Hollywood Hideaway lead image → patio shot with breakfast on table.
- [x] **PHOTO-02**: Maison de la Rivière dining-room lead → horizontal shot with tables-set-with-plates.
- [x] **PHOTO-03**: Hollywood Hideaway hero — white text vertically centered; dark filter removed where requested.

### Clarification deliverable

- [x] **CLAR-01**: `CLIENT-CLARIFICATION.md` exists at the project root, grouped by page (Home / Le Moulin / Hollywood Hideaway / Maison de la Rivière / Les Maisons / Get in Touch / Universal). _Completed 2026-05-05 in 03-01 — file at `/workspace/CLIENT-CLARIFICATION.md`, 412 lines, 9 H2 sections in TOC order._
- [x] **CLAR-02**: Each item includes (a) verbatim client request, (b) current code state with file references, (c) one or more specific questions for the client. _Completed 2026-05-05 in 03-01 — all 29 ❓ ids represented with verbatim quotes + plain-English current state + bold question._
- [x] **CLAR-03**: A "✅ Already done — please re-review" section flags items the client has been re-asking that ARE shipped (so she stops re-flagging them). _Completed 2026-05-05 in 03-01 — 14 commit-cited bullets (10 verified ✅ + 4 commits client likely hasn't noticed)._
- [x] **CLAR-04**: Includes question about adding a top-level Groups page (Monty's instinct). _Completed 2026-05-05 in 03-01 — final section with explicit yes/no/think-about-it ask._
- [x] **CLAR-05**: Includes cross-round contradictions ("Join us!" vs "When would you like to visit?", italics universal-policy, Le Mérévillois vs Méréville commune naming, etc.). _Completed 2026-05-05 in 03-01 — Universal #1 (italics), #9 (Mérévillois), #10 (Join us), #11 (Bienvenue) all surfaced._
- [x] **CLAR-06**: Includes asset-asks (jacuzzi photos, "Stars Who Stayed Here" photos, biking photos, Monet Giverny image, Netflix-on-TV decision). _Completed 2026-05-05 in 03-01 — Universal #6 (jacuzzi), #7 (biking), #8 (Netflix), Home #4 (Monet), Hollywood Hideaway #4 (Stars)._

## v2 Requirements

Items the client has requested but that need foundational work, structural rework, or assets we don't have. Tracked but not in tonight's roadmap.

### Structural / UX

- **STRUCT-01**: Photo gallery modal — fix X-button visibility, forward arrow cropping, photo bottom cropping on first open. Currently only Le Loft Suite modal works correctly. Affects all houses.
- **STRUCT-02**: Calendar — extend scrollable range to 12 months (currently 4); investigate ICS feed depth implications.
- **STRUCT-03**: "Discover the Area" — split single page into separate Paris / Nearby Towns / Loire Valley pages or anchored sections.
- **STRUCT-04**: Active Google Map embed in Getting Here section (replacing static directions).
- **STRUCT-05**: Photo gallery layouts standardized to wellness/catering style across all home pages.
- **STRUCT-06**: New top-level **Groups page** (pending client confirmation).

### New sections (additive)

- **NEW-01**: Home page — new **"We Make It Easy"** section with Catering / Wellness / Nearby-Adventures cards (above "Bring your group together").
- **NEW-02**: Home page — new **"Dogs Welcome"** section with Jetson photo (replaces "Bring your dog!" buried elsewhere).
- **NEW-03**: Home page — new **"Make your life a masterpiece"** section with Monet Giverny imagery and Moulin bridge pairing.
- **NEW-04**: Hollywood Hideaway — new **"Join the Stars Who Stayed Here"** section (awaits client photo upload).
- **NEW-05**: Le Moulin — gardens-as-individual-clickable-galleries grid.

### Auditable areas (deferred to a separate Milestone 2)

- **AUDIT-DEEP-01**: Editor / publishing flow audit — fragility, error paths, GitHub integration, HMAC session edge cases.
- **AUDIT-DEEP-02**: Mobile / responsive deep audit — surface remaining overflow / layout breaks beyond the recent hotfixes.
- **AUDIT-DEEP-03**: Performance / SEO audit — font loading, image sizes, sitemap coverage, meta tags.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat with concierge | Out of brand for boutique vacation rental; contact form is sufficient |
| Direct booking engine on-site | Bookings funnel via Airbnb/VRBO + direct inquiry forms; no on-site payment intended |
| Multi-language beyond EN/FR | Not requested by client; English/French covers target markets |
| Adding additional houses to listings | The compound has exactly three houses; this is fixed |
| Replacing Decap CMS / editor SPA | Working today; structural rework is a separate decision |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIT-01 | Phase 1 | Complete (01-01) |
| AUDIT-02 | Phase 1 | Complete (01-01) |
| AUDIT-03 | Phase 1 | Complete (01-01) |
| COPY-01 | Phase 2 | Complete (02-01) |
| COPY-02 | Phase 2 | Complete (02-01) |
| COPY-03 | Phase 2 | Complete (02-01) |
| COPY-04 | Phase 2 | Complete (02-01) |
| COPY-05 | Phase 2 | Complete (02-01) |
| COPY-06 | Phase 2 | Complete (02-01) |
| COPY-07 | Phase 2 | Complete (02-01) |
| COPY-08 | Phase 2 | Complete (02-01) |
| COPY-09 | Phase 2 | Complete (02-01) |
| COPY-10 | Phase 2 | Complete (02-01) |
| COPY-11 | Phase 2 | Complete (02-01) |
| COPY-12 | Phase 2 | Complete (02-01) |
| COPY-13 | Phase 2 | Complete (02-01) |
| COPY-14 | Phase 2 | Complete (02-01) |
| COPY-15 | Phase 2 | Complete (02-01) |
| TYPOG-01 | Phase 2 plan 02 | Done — `f35ef7e` |
| TYPOG-02 | Phase 2 plan 02 | Done — `9b2de71` |
| TYPOG-03 | Phase 2 plan 02 | Done — verify-only (no-op; `global.css` already 2 families) |
| SECT-01 | Phase 2 plan 03 | Done — `8baf8eb` |
| SECT-02 | Phase 2 plan 03 | Done — `73cce41` (3-photo sub-action deferred to Phase 3) |
| SECT-03 | Phase 2 plan 03 | Done — `02c0406` |
| SECT-04 | Phase 2 plan 03 | Done — verify-only (prior commits `1a658c2`, `f5579e8`) |
| SECT-05 | Phase 2 plan 03 | Done — `249e9b8` |
| SECT-06 | Phase 2 plan 03 | Done — `60c5db2` |
| SECT-07 | Phase 2 plan 03 | Done — verify-only (prior commit `cc3ac01e`) |
| SECT-08 | Phase 2 plan 03 | Done — `d2f200b` |
| PHOTO-01 | Phase 2 plan 04 | Done — verify-only (heroImage `hh-patio.webp` already the patio-breakfast shot) |
| PHOTO-02 | Phase 2 plan 04 | Done — `10c9007` |
| PHOTO-03 | Phase 2 plan 04 | Done — `ae76a67` |
| CLAR-01 | Phase 3 plan 01 | Done — `4848518` (intro + Universal section anchors the 9 H2 page-section structure) |
| CLAR-02 | Phase 3 plan 01 | Done — verbatim + current-state + bold question on every ❓ across `4848518` `9a45cc2` `ac020d5` `344f5fa` |
| CLAR-03 | Phase 3 plan 01 | Done — `cf32a32` (Already Done re-review section, 14 commit-cited bullets) |
| CLAR-04 | Phase 3 plan 01 | Done — `cf32a32` (A question from Monty — Groups page, yes/no ask) |
| CLAR-05 | Phase 3 plan 01 | Done — `4848518` (Universal #1 italics, #9 Mérévillois, #10 Join us, #11 Bienvenue) |
| CLAR-06 | Phase 3 plan 01 | Done — Universal #6/#7/#8 (`4848518`), Home #4 (`9a45cc2`), Hollywood Hideaway #4 (`ac020d5`) |

**Coverage:**
- v1 requirements: 38 total (AUDIT 3 + COPY 15 + TYPOG 3 + SECT 8 + PHOTO 3 + CLAR 6)
- Mapped to phases: 38
- Unmapped: 0 ✓
- **Completed: 38 / 38** ✓ — Milestone 1 100% shipped against the 2026-05-06 deadline.

---
*Requirements defined: 2026-05-05*
*Last updated: 2026-05-05 — Milestone 1 complete; all 38 v1 requirements done; Milestone 2 gated on Melissa's reply to CLIENT-CLARIFICATION.md*
