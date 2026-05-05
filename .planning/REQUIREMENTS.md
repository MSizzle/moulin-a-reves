# Requirements: Moulin à Rêves Site — Milestone 1

**Defined:** 2026-05-05
**Core Value:** Convey the compound's atmosphere convincingly enough to convert visitors into bookings and direct inquiries.
**Source document:** `MMM may.5.pdf` (3 compiled rounds: April 30, May 1, May 5)
**Deadline:** 2026-05-06

## v1 Requirements

Coarse-grained category-level requirements. The phase plan + audit phase will itemize specific edits within each.

### Audit

- [ ] **AUDIT-01**: Every item in `MMM may.5.pdf` (all 3 rounds) is categorized into one of: ✅ Already Done / 🔧 Clear-to-Ship / ❓ Needs Clarification / ⚠️ Cross-round Conflict.
- [ ] **AUDIT-02**: Items addressed by recent commits (`742fb89` and forward — May 5 photos work) are explicitly flagged DONE with file/commit references so the client stops re-asking.
- [ ] **AUDIT-03**: Each "Needs Clarification" item has at least one specific question with current code-state context (file:line where applicable).

### Copy edits

- [ ] **COPY-01**: All "When you can stay" / "Where you can stay" replaced with **"Join us!"** across home, all three home pages, and contact page footer.
- [ ] **COPY-02**: Le Moulin beige footer reads **"sleeps 10 in 8 beds"** (was "sleeps 12 in 10 beds").
- [ ] **COPY-03**: Landing-page bar reads **"3 homes"** (was "houses").
- [ ] **COPY-04**: About page CTA changed from "come and see" to **"come and visit!"**.
- [ ] **COPY-05**: Address corrected to `14, 16, 18 Rue des Crocs au Renard, 91660 Le Mérévillois` (no trailing X on "au").
- [ ] **COPY-06**: Home page hero leads with **"A Private Luxurious Compound, One Hour From Paris"** then 10-bedrooms info; "Méréville, France" relocated below tagline.
- [ ] **COPY-07**: Le Moulin house page renamed from "Moulin à Rêves" → **"Le Moulin"** (estate name vs single-house name distinction).
- [ ] **COPY-08**: Compound button copy replaced with **"This is a private walled compound where you are master of your own domaine. Peace, privacy. Tranquility."**
- [ ] **COPY-09**: "Speak with a concierge" / "Get in Touch" CTAs follow the **"Join us!"** pattern.
- [ ] **COPY-10**: Plan-your-stay box "bonjour" → **"Bienvenue!"**
- [ ] **COPY-11**: "Yoga retreats" → **"Yoga, painting, writing retreats"**; "Friends trips" → **"Friends celebrations"** in retreat copy.
- [ ] **COPY-12**: "The Sanctuary" above Hollywood Hideaway → **"The Refuge"**.
- [ ] **COPY-13**: Les Maisons section: remove "Three maisons. Sleeps 20 across 10 bedrooms." Replace with header **"Bienvenue Chez Vous"** + smaller text **"All size groups welcome. Rent 1 home or enjoy all 3."**
- [ ] **COPY-14**: Delete "Three stone houses around shared gardens. Each its own world; together, the compound." description.
- [ ] **COPY-15**: Add word "size" to contact microcopy: **"Tell us your dates, your group size, your dreams."**

### Typography

- [ ] **TYPOG-01**: Italic styling removed from final words of headers — at minimum: "stay" in "Where you can stay", "Maisons" in "Les Autres Maisons", "Rêves" in "Moulin à Rêves". Universal-policy clarification flagged in CLIENT-CLARIFICATION.md.
- [ ] **TYPOG-02**: "Get in Touch" page hero italicized text removed.
- [ ] **TYPOG-03**: Standardize site to 2–3 fonts; identify the "your french vacation come true" header font as a preferred variant for elegant accents.

### Section / content removal & restructuring

- [ ] **SECT-01**: Le Moulin — office removed (folded into living-room collection); courtyard block removed (covered in gardens).
- [ ] **SECT-02**: Hollywood Hideaway — "What's Here" 3-photo section removed; small "hollywood hideaway" text above hero text removed; Hollywood hero italic text removed; Secret Garden removed as individual room and folded into Looking Glass + American in Paris rooms; grange photo removed from main carousel.
- [ ] **SECT-03**: Maison de la Rivière — Exterior section removed (covered in top gallery); Gardens section removed (covered below); 2 rows of duplicative hero text removed; house name centered.
- [ ] **SECT-04**: Le Grange — toilet and laundry photos removed; black photo backgrounds replaced with white.
- [ ] **SECT-05**: Gym & Bikes — carriage photo removed.
- [ ] **SECT-06**: Le Moulin main carousel — pink-gown photo removed (keep bike-by-gate).
- [ ] **SECT-07**: Home page — Journal section hidden.
- [ ] **SECT-08**: Room carousels — subheaders above colon removed.

### Photo swaps

- [ ] **PHOTO-01**: Hollywood Hideaway lead image → patio shot with breakfast on table.
- [ ] **PHOTO-02**: Maison de la Rivière dining-room lead → horizontal shot with tables-set-with-plates.
- [ ] **PHOTO-03**: Hollywood Hideaway hero — white text vertically centered; dark filter removed where requested.

### Clarification deliverable

- [ ] **CLAR-01**: `CLIENT-CLARIFICATION.md` exists at the project root, grouped by page (Home / Le Moulin / Hollywood Hideaway / Maison de la Rivière / Les Maisons / Get in Touch / Universal).
- [ ] **CLAR-02**: Each item includes (a) verbatim client request, (b) current code state with file references, (c) one or more specific questions for the client.
- [ ] **CLAR-03**: A "✅ Already done — please re-review" section flags items the client has been re-asking that ARE shipped (so she stops re-flagging them).
- [ ] **CLAR-04**: Includes question about adding a top-level Groups page (Monty's instinct).
- [ ] **CLAR-05**: Includes cross-round contradictions ("Join us!" vs "When would you like to visit?", italics universal-policy, Le Mérévillois vs Méréville commune naming, etc.).
- [ ] **CLAR-06**: Includes asset-asks (jacuzzi photos, "Stars Who Stayed Here" photos, biking photos, Monet Giverny image, Netflix-on-TV decision).

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

Will be populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIT-01 | TBD | Pending |
| AUDIT-02 | TBD | Pending |
| AUDIT-03 | TBD | Pending |
| COPY-01 to COPY-15 | TBD | Pending |
| TYPOG-01 to TYPOG-03 | TBD | Pending |
| SECT-01 to SECT-08 | TBD | Pending |
| PHOTO-01 to PHOTO-03 | TBD | Pending |
| CLAR-01 to CLAR-06 | TBD | Pending |

**Coverage:**
- v1 requirements: ~33 total (AUDIT 3 + COPY 15 + TYPOG 3 + SECT 8 + PHOTO 3 + CLAR 6 = 38; some sub-items under SECT may bundle multiple edits)
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 38 ⚠️ (will be fixed by roadmap)

---
*Requirements defined: 2026-05-05*
*Last updated: 2026-05-05 after initialization*
