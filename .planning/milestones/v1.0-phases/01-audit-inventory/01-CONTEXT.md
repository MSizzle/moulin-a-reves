# Phase 1: Audit & Inventory - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Cross-reference every item in `MMM may.5.pdf` (12 pages, 3 compiled rounds: April 30, May 1, May 5) against the current codebase to produce a single tagged inventory document. The inventory's tagged output is the input to Phase 2 (ship-the-clear) and Phase 3 (CLIENT-CLARIFICATION.md). This phase produces no user-facing site changes — it is pure analysis + structured output.

</domain>

<decisions>
## Implementation Decisions

### Inventory format & location

- **D-01:** Single output file at `.planning/phases/01-audit-inventory/AUDIT.md` — one inventory, by-page grouping, with tag annotations on each item. Phase 2 and Phase 3 both extract from this same source.
- **D-02:** Page-level grouping order matches the planned `CLIENT-CLARIFICATION.md` structure: **Universal → Home → Le Moulin → Hollywood Hideaway → Maison de la Rivière → Les Maisons → Get in Touch → About → La Grange (sub-pages of homes)**. "Universal" goes first because cross-page rules (italics, "Join us!" replacement, font policy, dark filter) cascade through every page below.
- **D-03:** Each row's structure: parent PDF-bullet quote → tag → current code state (file:line + quoted current text where helpful) → atomic sub-actions (if compound) → cross-round annotation (if applicable).

### Item granularity (compound bullets)

- **D-04:** **Hybrid model** — preserve the parent PDF bullet (verbatim quote) as one row, then list atomic sub-actions as nested checkbox children under it. Phase 2 ships the children atomically; Phase 3 references the parent for client context. Example:
  ```markdown
  ### "Hollywood hero — white text feels too low, please center it. Delete italicised text below it inside the image. Forward arrow on gallery beneath text is cut off the right side."
  - Tag: 🔧 Clear-to-Ship (centering, italics) + ⚠️ Defer (forward arrow → STRUCT-01)
  - Source: MMM may.5.pdf p.3 (April 30 round)
  - Children:
    - [ ] Center hero text vertically
    - [ ] Delete italicized text inside hero image
    - [ ] (deferred to v2) Forward arrow cut off — STRUCT-01
  ```

### "Already Done" verification rigor

- **D-05:** **Verify-in-code only.** Mark an item ✅ Already Done only if I can show file:line proof that the change is in current `HEAD` code. If a recent commit (`742fb89..ad07395`) touched the relevant file but I cannot confirm the specific edit landed, tag as 🔧 Clear-to-Ship and re-check; never trust commit messages alone.
- **D-06:** When something IS verified Done, annotate with the commit hash that landed it (e.g., `Done in 8bd51b9`) so the client can see exactly when. This stops the cycle of her re-flagging the same item.
- **D-07:** Items the audit finds were already done BEFORE the May 5 photo batch (i.e., done in commits older than `742fb89`) get the same ✅ tag with their original commit cited — proves the work was done long ago and she just hasn't noticed.

### i18n / bilingual coverage

- **D-08:** Audit English copy in `.astro` pages, `.astro` components, `src/content/**/*.md`, and `public/admin/config.yml` defaults. For every English copy edit identified (Clear-to-Ship), cross-check `public/i18n/translations.json` to determine whether the corresponding `fr` value also needs to change.
- **D-09:** When a copy edit needs both EN and FR updates, list them as **two atomic sub-actions** under the parent bullet so Phase 2 ships both in the same atomic commit. (FR translation values: if the English change is a tag/copy update with no semantic change in French, propose the FR equivalent in the audit; if the change has translation ambiguity, tag as ❓ Needs Clarification with the question routed to the client.)
- **D-10:** Pure structural edits (section removal, image swap, layout fix) don't trigger an FR check. Only copy text changes do.

### Source document handling

- **D-11:** Reference the PDF as `MMM may.5.pdf` (project root). Do NOT add the PDF to git — it stays untracked. The AUDIT.md inventory captures every quoted bullet so the PDF doesn't need to live in version control.
- **D-12:** Each inventory row cites the PDF round + page (e.g., `Source: MMM may.5.pdf p.7 (April 30 round)`) so cross-references back to the original are unambiguous. This also makes "newest round wins" decisions auditable.

### Tag taxonomy (locked)

- **D-13:** Four tags only:
  - ✅ **Already Done** — verified in current code; cite commit
  - 🔧 **Clear-to-Ship** — unambiguous, ready for Phase 2 atomic commit
  - ❓ **Needs Clarification** — question routes to Phase 3's CLIENT-CLARIFICATION.md
  - ⚠️ **Cross-round Conflict** — newest round wins, but flag the contradiction in the clarification doc
- **D-14:** A fifth implicit category — **Deferred-to-v2** — applies when an item maps to v2 requirements (STRUCT-01..06, NEW-01..05, AUDIT-DEEP-01..03). These get the 🔧 or ✅ tag for the parent bullet but are explicitly noted as deferred for downstream agents.

### Claude's Discretion

- Exact line counts and formatting of AUDIT.md (so long as the schema D-03 is preserved).
- Whether to use a top-level table-of-contents in AUDIT.md (recommended for scanability — Claude will include unless it bloats).
- Sub-section ordering within each page (recommended: Copy → Typography → Sections → Photos → Layout → Behavior).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source-of-truth for client requests
- `MMM may.5.pdf` — Verbatim client feedback, 3 compiled rounds (April 30, May 1, May 5). 12 pages. NOT in git.

### Project context
- `.planning/PROJECT.md` — milestone framing, core value triad, constraints, key decisions ("newest round wins", code-deep, defer structural fixes)
- `.planning/REQUIREMENTS.md` — 38 v1 requirements grouped (AUDIT-01..03 / COPY-01..15 / TYPOG-01..03 / SECT-01..08 / PHOTO-01..03 / CLAR-01..06) and v2 deferred set (STRUCT, NEW, AUDIT-DEEP)
- `.planning/ROADMAP.md` §Phase 1 — phase success criteria
- `.planning/STATE.md` — i18n dual-update concern; photo-source dependency

### Codebase intelligence
- `.planning/codebase/STRUCTURE.md` — file layout (where pages, components, content collections live)
- `.planning/codebase/STACK.md` — Astro 6 / Vercel / Decap CMS / editor SPA / i18n runtime overlay
- `.planning/codebase/ARCHITECTURE.md` — component responsibilities + data flow (BaseLayout, PhotoCarousel, RoomShowcase, AmenitiesSection, AvailabilityCalendar)
- `.planning/codebase/CONVENTIONS.md` — code style + content patterns
- `.planning/codebase/INTEGRATIONS.md` — Airbnb/VRBO ICS, Airtable webhooks, GitHub-as-CMS, Sharp pipeline
- `.planning/codebase/CONCERNS.md` — known fragility, including editor flow

### Recent shipped commits to verify against
- `742fb89` — `feat(photos): add 67 May 5 photos via processing pipeline`
- `ab1ac5d` — `feat(homes): wire May 5 photos into HH, Le Moulin, and the compound`
- `8bd51b9` — `feat(catering): add Pâtisseries section + food gallery with new May 5 photos`
- `182b810` — `feat(explore): replace Méréville placeholder photos + wire Cyclop and Barbizon mural`
- `fd8e979` — `feat(wellness): add yoga + massage galleries with new May 5 photos`
- `ad07395` — `feat(about): extend history gallery with six Borrah Minevitch family photos`

### Older shipped commits the client may not have noticed
- `c04e333` — `fix(home): remove duplicate tagline + match h2 sizing`
- `064839a` — `feat(scale): typography + layout scale on wide displays`
- `7b264e7`, `250733e` — mobile overflow hotfixes (PR #42 reverts)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/layouts/BaseLayout.astro` — global head, nav, footer, lang toggle runtime, dark filter style. Most "header / footer / dark filter" client requests probably resolve here, not in per-page files.
- `src/components/PhotoCarousel.astro` — accepts `i18nKey` for eyebrow + heading; the gallery navigation issue (X-button, forward arrow, photo bottom crop) likely lives here. **Defer** structural fix per Out-of-Scope.
- `src/components/RoomShowcase.astro` — bedroom-tile grid with click-to-modal carousel. Likely the source of the "click into the room and the photos are cut off at the bottom" client complaint. **Defer** structural fix.
- `src/components/AmenitiesSection.astro` — feature/checklist amenities block. May be relevant for the Le Moulin "where you'll sleep" / amenities footer copy.
- `public/i18n/translations.json` — every copy edit needs cross-check here for FR sibling.
- `src/content/homes/` — markdown content collections for each house. Some content (room names, gallery captions) may live here vs in `.astro` files. AUDIT must check both.

### Established Patterns

- **Bilingual pairing:** EN strings in `.astro`/`.md` + FR mirror in `translations.json`. The runtime overlay swaps based on language toggle. Breaking the pair = broken FR experience.
- **Static-first publishing:** all marketing pages prerender. Edits to `.astro` files trigger Vercel rebuild on push to `main`. No DB; persistence == git history.
- **Content collections:** `src/content/homes/le-moulin.md`, `src/content/homes/hollywood-hideaway.md`, `src/content/homes/maison-de-la-riviere.md` — markdown frontmatter drives some structured fields (sleeps, beds, rooms). The "sleeps 12 → 10" change probably lands in frontmatter, not body text.
- **Photo path discipline:** `scripts/process-photos.mjs` + `scripts/photo-mapping.json` is the canonical pipeline. Any "swap lead image" item maps to either a path change in `.astro` or a re-target in `photo-mapping.json` — verify which.

### Integration Points

- **Decap CMS** at `/admin/` is one input surface for the client's content edits; if she's directly editing copy via the CMS, our `.astro` strings may diverge. Worth grepping the admin config schema to know which fields she controls vs which are dev-only.
- **Editor SPA** at `editor.moulinareves.com` — click-to-edit overlay writes to GitHub directly. Same divergence risk. Don't touch this in Phase 1.
- **Translations API** (`/api/translations`) — proxies GitHub raw `translations.json`. Means a copy change in `translations.json` is live without a Vercel rebuild. So: copy edits to translations.json deploy faster than copy edits to `.astro` files. Useful for Phase 2 sequencing later.

</code_context>

<specifics>
## Specific Ideas

- The PDF is **layered chronologically** — May 5 round on top, then May 1, then April 30. Items repeated across rounds = highest-priority signal (client's frustration signal). Annotate each row with which rounds it appeared in (e.g., `Repeated: April 30 + May 1 + May 5` → high-priority Already-Done flag).
- The compound's three houses use distinct page templates with shared components. Per-house findings need to be tracked separately because identical-sounding requests may have house-specific code locations.
- The client uses "Join us!" universally in May 5, but conflicts with herself on the Riviere page (April 30) where she suggests "When would you like to visit?" as possibly better. **Decision per D-13:** newest round wins (Join us! globally), conflict flagged in clarification doc.
- "Houses" → "Homes" in landing-page bar (D-13: Clear-to-Ship), but **only on the bar count widget** — the words "houses" and "homes" elsewhere on the site are not implicated by this rule. Audit must be precise.

</specifics>

<deferred>
## Deferred Ideas

- **Spike on FR-translation-quality**: when copy changes are pure literal swaps (e.g., "Join us!" → "Rejoignez-nous!"), confidence is high. When the source phrase is idiomatic (e.g., "Bienvenue Chez Vous"), translation may need client review. Could spin up a translation-quality-review subtask later — out of scope for tonight.
- **Decap CMS field divergence audit**: separate workstream to confirm whether client-edited fields in CMS overlap with `.astro` hardcoded strings. Out of scope for tonight; possible Milestone 2 hygiene task.
- **Generate visual diff or screenshot grid**: would help client comparison. Out of scope; flagged as a deferred enhancement in v2.

</deferred>

---

*Phase: 1-Audit & Inventory*
*Context gathered: 2026-05-05*
