---
phase: 02-ship-the-clear-edits
plan: 03
type: execute
wave: 3
depends_on: [01, 02]
files_modified:
  - src/pages/homes/le-moulin.astro
  - src/pages/homes/hollywood-hideaway.astro
  - src/pages/homes/maison-de-la-riviere.astro
  - src/pages/the-compound.astro
  - src/pages/index.astro
  - src/content/pages/le-moulin.md
  - src/content/pages/hollywood-hideaway.md
autonomous: true
requirements:
  - SECT-01
  - SECT-02
  - SECT-03
  - SECT-04
  - SECT-05
  - SECT-06
  - SECT-07
  - SECT-08
must_haves:
  truths:
    - "Le Moulin gathering-spaces array contains no `id: 'office'` and no `id: 'courtyard'` block (SECT-01)"
    - "Le Moulin amenities list contains no 'Office with desk + printer' entry (SECT-01)"
    - "Hollywood Hideaway main carousel contains no la-grange-*.webp references (SECT-02)"
    - "Hollywood Hideaway What's Here AmenitiesSection: section's clarification status documented (SECT-02 — note: AUDIT marks the 3-photo section bullet as ❓; for clear-to-ship we cover the 'small text above hero', 'hero italic', and 'grange photo' atomic subactions)"
    - "Maison de la Rivière gathering-spaces array contains no `id: 'exterior'` and no `id: 'gardens'` block; hero text is not duplicative; house name is centered (SECT-03)"
    - "La Grange toilet/laundry photos absent from referenced galleries; SECT-04 marked ✅ already-done — verify only (SECT-04)"
    - "Carriage photo (la-grange-carriage.webp) absent from gym-and-bikes section in src/pages/the-compound.astro AND src/pages/index.astro; tile title updated (SECT-05)"
    - "le-moulin-welcome-rose.webp absent from src/content/pages/le-moulin.md gallery; le-moulin-gate.webp still present (SECT-06)"
    - "Home page Journal section hidden — no `<h2 data-i18n=\"home.journal.heading\">` rendered (SECT-07)"
    - "RoomShowcase invocations pass `hideTileSummary={true}` so per-room summaries (subheaders) are hidden on tiles (SECT-08)"
  artifacts:
    - path: "src/pages/homes/le-moulin.astro"
      provides: "Le Moulin page with office and courtyard rooms removed"
    - path: "src/pages/homes/maison-de-la-riviere.astro"
      provides: "Maison hero centered, exterior and gardens gathering-tiles removed"
    - path: "src/pages/index.astro"
      provides: "Home page without Journal section, without carriage photo"
    - path: "src/content/pages/le-moulin.md"
      provides: "Main carousel without pink-gown welcome photo"
  key_links:
    - from: "src/pages/homes/*.astro RoomShowcase invocations"
      to: "src/components/RoomShowcase.astro"
      via: "hideTileSummary prop"
      pattern: "hideTileSummary=\\{true\\}"
---

<objective>
Execute every Clear-to-Ship structural removal/restructure (SECT-01 through SECT-08) from AUDIT.md as atomic commits.

Purpose: The client repeatedly flagged the same structural removals across all three rounds (office, courtyard, exterior section, gardens section, journal, carriage, pink-gown photo). These are pure deletions/restructures — no FR translations to update for most (D-10 structural-only edits), so this plan ships fast.

Output:
- 7-8 atomic commits on `feat/may-5-2026-photos` (one per requirement; SECT-04 is verify-only per AUDIT — already done in 1a658c2)
- Updated `.astro` files per AUDIT line references; one `.md` content edit (le-moulin.md gallery)
- No translations.json changes for SECT-01,03,05,06,07,08 (structural-only); only SECT-05 may need `home.compound.bikes` tile title update if i18n-keyed
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-audit-inventory/AUDIT.md
@.planning/phases/02-ship-the-clear-edits/02-01-copy-edits-PLAN.md
@.planning/phases/02-ship-the-clear-edits/02-02-typography-edits-PLAN.md
@CLAUDE.md

<interfaces>
RoomShowcase prop contract (from src/components/RoomShowcase.astro line 30):
  Props: { eyebrow, heading, intro?, rooms[], background?, i18nKey?, hideTileSummary? }
  Setting `hideTileSummary={true}` on the invocation hides the `<p class="compound-tile__summary">{room.summary}</p>` rendered below each room title — exactly what SECT-08 requires.

Le Moulin gathering-spaces array (src/pages/homes/le-moulin.astro lines ~107-160):
  Order today: salon, dining, kitchen, OFFICE (id:'office', lines ~134-141), COURTYARD (id:'courtyard', lines ~142-150).
  Required: delete office and courtyard blocks entirely. Also remove the `{ label: 'Office with desk + printer', icon: 'office' }` entry from the amenities array (line ~183).
  After deletion the array members for `livingSpaces` should be: salon, dining, kitchen.

Maison de la Rivière gathering-spaces array (src/pages/homes/maison-de-la-riviere.astro lines ~80+):
  Has tiles `id: 'exterior'` (line 80) and `id: 'gardens'` (line ~89). Both removed per SECT-03.

Hollywood Hideaway main carousel (src/pages/homes/hollywood-hideaway.astro plus src/content/pages/hollywood-hideaway.md):
  AUDIT instructs: search for la-grange-* references in the HH main carousel and remove. Inspect both the .astro file and the .md content file (gallery: array).

la-grange-carriage.webp removal (SECT-05):
  Anchors per AUDIT:
    src/pages/the-compound.astro:50  title: 'Bikes & The Carriage'
    src/pages/the-compound.astro:55  { src: '/images/homes/la-grange-carriage.webp', ... }
    src/pages/index.astro:48          { src: '/images/homes/la-grange-carriage.webp', ... }
  Update tile title 'Bikes & The Carriage' → 'Bikes & The Gym' (consistent with what remains).

le-moulin-welcome-rose.webp removal (SECT-06):
  Anchor per AUDIT: src/content/pages/le-moulin.md lines 24-25 contain the pink-gown welcome photo. Remove those two YAML lines (the `- src:` line and its `alt:` line). Keep `le-moulin-gate.webp` ('bike by the gate') in the carousel.

Home page Journal section (SECT-07):
  Anchor: src/pages/index.astro:559 `<h2 data-i18n="home.journal.heading">From the Journal</h2>` plus surrounding `writings__card` grid. Wrap the entire section in an Astro conditional or remove the JSX block. Per AUDIT instruction "preserve the data so it can be restored": keep the markdown writings data files where they live; just remove or comment-wrap the JSX section.

SECT-04 (verify-only): AUDIT marks "Black photo backgrounds replaced with white" as ✅ Done in commit 1a658c2 (cream lightbox shipped in f5579e8). Run grep gate; if drift, remediate.

SECT-02 partial scope:
  AUDIT main bullet for HH "What's here 3-photo section" is tagged ❓ Needs Clarification (NOT clear-to-ship — see AUDIT line 330). HOWEVER, SECT-02 in REQUIREMENTS.md explicitly lists multiple sub-actions:
    (a) Remove "What's Here" 3-photo section            ← ❓ in AUDIT — DEFER, do NOT remove
    (b) Remove small "hollywood hideaway" text above hero text  ← clear-to-ship
    (c) Remove Hollywood hero italic text               ← already covered by TYPOG-02 in plan-02 — verify
    (d) Fold Secret Garden into Looking Glass + American in Paris  ← already done per inspected code (rooms array shows secret-garden photos folded into looking-glass and american-in-paris arrays)
    (e) Remove la-grange photo from main carousel       ← clear-to-ship

  This task ships (b), verifies (c) and (d), and ships (e). It does NOT ship (a) — that goes to Phase 3 clarification.

Use D-10 i18n discipline:
  Most SECT edits are structural-only — no FR translation to update. Exception: if you are deleting a heading/text that has a corresponding `data-i18n` anchor and the key exists in translations.json with a real value, also empty the key in BOTH translations.json and translations.ts so the runtime overlay does not re-inject the deleted text.
</interfaces>

<relevant-audit-rows>
SECT-01 (3 bullets): office removal + courtyard block removal — Le Moulin
SECT-02 (1 bullet): 5 atomic subactions, 3 ship now (small-text-above-hero, grange photo, verify TYPOG/Secret-Garden) — Hollywood Hideaway
SECT-03 (5 bullets): Maison Exterior tile remove + Gardens tile remove + 2 rows hero-text remove + house name centering — Maison de la Rivière
SECT-04 (2 bullets): toilet/laundry + black backgrounds — La Grange (✅ done in 1a658c2; verify-only)
SECT-05 (1 bullet): carriage photo remove from gym-and-bikes
SECT-06 (1 bullet): pink-gown photo remove from Le Moulin main carousel
SECT-07 (2 bullets): home page Journal section hide
SECT-08 (1 bullet): subheader-above-colon removal in room carousels (use hideTileSummary={true})
</relevant-audit-rows>
</context>

<tasks>

<task type="auto">
  <name>Task 1: SECT-01 — remove Le Moulin office room + courtyard tile + office amenity</name>
  <files>src/pages/homes/le-moulin.astro, public/i18n/translations.json, src/i18n/translations.ts</files>
  <action>
Per AUDIT rows p.2 (May 1) and p.10 (April 30): "remove the office and put it with the living room collection" + "remove the courtyard block as we cover that in gardens below."

1. In `src/pages/homes/le-moulin.astro`, locate the `livingSpaces` const array (lines ~107-160). Currently contains: salon, dining, kitchen, office, courtyard.

2. Delete the entire `{ id: 'office', ... }` block (lines ~134-141) including its photos array. The single office photo (`/images/homes/le-moulin-office.webp`) does NOT need to be re-injected into the salon/dining/kitchen blocks unless it is referenced elsewhere — verify the asset is referenced nowhere via `grep -rn "le-moulin-office.webp" src/ public/i18n/`. If the photo is now orphaned, that is acceptable — the file remains in `public/images/homes/` but is not displayed.

3. Delete the entire `{ id: 'courtyard', ... }` block (lines ~142-160) including its photos array.

4. In the amenities array (line ~183), delete the entry `{ label: 'Office with desk + printer', icon: 'office' }`.

5. If any i18n key references office/courtyard in this page's namespace (search: `grep -n "le-moulin.*office\|le-moulin.*courtyard" public/i18n/translations.json src/i18n/translations.ts`), set those values to empty string in both stores.

Commit message: `refactor(02-03): SECT-01 — remove Le Moulin office + courtyard tiles + office amenity`
  </action>
  <verify>
    <automated>cd /workspace &amp;&amp; ! grep -n "id: 'office'\|id: 'courtyard'\|Office with desk \+ printer" src/pages/homes/le-moulin.astro    # expect 0 matches</automated>
  </verify>
  <done>Le Moulin gathering-spaces array reduced to salon/dining/kitchen; amenity removed; one commit landed.</done>
</task>

<task type="auto">
  <name>Task 2: SECT-02 — Hollywood Hideaway: remove small "hollywood hideaway" eyebrow above hero + remove la-grange photo from main carousel; verify Secret Garden + italic-removed</name>
  <files>src/pages/homes/hollywood-hideaway.astro, src/content/pages/hollywood-hideaway.md</files>
  <action>
Per AUDIT row p.3 (May 1) and p.6 (April 30): "Remove the small letters that say hollywood hideaway above the text of the house on the main photo" + "Delete grange photo from the main carousel".

NOTE: The "What's Here 3-photo section" sub-action of SECT-02 is ❓ Needs Clarification per AUDIT — DEFER. This task does NOT remove `<AmenitiesSection heading={`What's here`} ... />`.

Step A — small "hollywood hideaway" eyebrow above hero:
1. In `src/pages/homes/hollywood-hideaway.astro` hero region (around line 196-202), inspect for any `<span class="hero__eyebrow">` or similar small-caps text that renders "hollywood hideaway" above the H1. The current code has a `.hero__eyebrow` style block at line 204 but the rendering depends on whether `cms.eyebrow` is non-empty.
2. Check `src/content/pages/hollywood-hideaway.md` line 6 — the `eyebrow:` field. If it currently has a value (non-empty string), set it to empty string: `eyebrow: ""`.
3. If the .astro hero has hard-coded markup rendering a small "hollywood hideaway" span, remove that span entirely.

Step B — remove la-grange photo from main carousel:
1. In `src/content/pages/hollywood-hideaway.md`, inspect the `gallery:` array. Search for any entry whose `src:` contains `la-grange-`. Delete that entry (the `- src:` line and its `alt:` line).
2. Also grep `src/pages/homes/hollywood-hideaway.astro` for any inline `la-grange-` reference in its main carousel array; delete if found.

Step C — verify already-shipped sub-actions:
1. Hollywood hero italic text — check that TYPOG-02 in plan-02 stripped any italic styling.
   `grep -nE "<em>|<i>|font-style:\s*italic" src/pages/homes/hollywood-hideaway.astro src/content/pages/hollywood-hideaway.md` returns 0.
2. Secret Garden folding — verify `id: 'secret-garden'` is NOT a top-level room block in hollywood-hideaway.astro rooms array (per inspected code at lines 17-54 it has been folded into looking-glass and american-in-paris; verify):
   `grep -n "id: 'secret-garden'" src/pages/homes/hollywood-hideaway.astro` returns 0.

Commit message: `refactor(02-03): SECT-02 — HH small eyebrow off + remove la-grange photo from main carousel`
  </action>
  <verify>
    <automated>cd /workspace &amp;&amp; ! grep -n "la-grange-" src/content/pages/hollywood-hideaway.md src/pages/homes/hollywood-hideaway.astro &amp;&amp; ! grep -n "id: 'secret-garden'" src/pages/homes/hollywood-hideaway.astro</automated>
  </verify>
  <done>HH main carousel free of la-grange photos; eyebrow set empty; verify gates pass; one commit landed; What's Here section preserved (deferred to Phase 3 clarification).</done>
</task>

<task type="auto">
  <name>Task 3: SECT-03 — Maison de la Rivière: remove exterior + gardens tiles, remove duplicative hero text, center house name</name>
  <files>src/pages/homes/maison-de-la-riviere.astro</files>
  <action>
Per AUDIT rows p.4 (May 1), p.11 (April 30), p.12 (April 30): "Remove exterior section - use the exterior shots in the top gallery" + "Remove gardens as it is below" + "Delete 2 rows of text in hero image above and below the name of the house" + "Center name of the house".

1. In `src/pages/homes/maison-de-la-riviere.astro` find the gathering-spaces array (the array passed as `rooms` to a `<RoomShowcase ... />` invocation, currently around line 80+).

2. Delete the entire `{ id: 'exterior', title: 'Exterior & Stream', ... }` block (line 80-88 per AUDIT).

3. Delete the entire `{ id: 'gardens', ... }` block (line 89-95 per AUDIT).

4. Hero region (around line 195): currently
     <h1 class="hero__title">{cms.title}</h1>
     <p class="hero__tagline">{cms.tagline}</p>
   Plus possibly extra prose lines above/below.

   Per AUDIT atomic_subactions: "Remove duplicative tagline rows above/below the house name; Center the house name (h1) within the hero overlay."

   - Inspect the file's hero block. If there is any `<p>` or `<span>` rendering a redundant tagline above or below the h1, remove it.
   - To center the h1: add `text-align: center;` to the `.hero__content` selector in this file's `<style>` block (or inline `style="text-align: center;"` on the h1). Use the existing scoped style pattern in other house pages.

5. If any i18n keys (riviere.gathering.exterior.*, riviere.gathering.gardens.*) referenced the deleted tiles, set their values to empty in BOTH translations.json and translations.ts.

Commit message: `refactor(02-03): SECT-03 — Maison remove exterior+gardens tiles, dedupe hero, center name`
  </action>
  <verify>
    <automated>cd /workspace &amp;&amp; ! grep -n "id: 'exterior'\|id: 'gardens'" src/pages/homes/maison-de-la-riviere.astro    # expect 0</automated>
  </verify>
  <done>Maison gathering-spaces array contains no exterior or gardens tile; hero text deduplicated; h1 centered; one commit landed.</done>
</task>

<task type="auto">
  <name>Task 4: SECT-04 — verify La Grange toilet/laundry photos removed + black-backgrounds-to-white shipped (already-done; verify-only)</name>
  <files>(none — verification only)</files>
  <action>
AUDIT marks SECT-04 as ✅ Done in commits 1a658c2 (HH/LG laundry drop) and f5579e8 (cream lightbox).

1. Grep gate:
   - `grep -rn "la-grange-toilet\|la-grange-laundry" src/ public/i18n/` returns 0.
   - `grep -c "lightbox--cream\|background.*cream\|--bg-cream" src/styles/global.css src/components/PhotoCarousel.astro src/components/RoomShowcase.astro` returns ≥ 1 (indicating cream/white background system in place).
2. Pass → SUMMARY note only.
3. Fail → remediation commit `fix(02-03): SECT-04 — restore non-black gallery backgrounds / drop toilet-laundry`.
  </action>
  <verify>
    <automated>cd /workspace &amp;&amp; ! grep -rn "la-grange-toilet\|la-grange-laundry" src/ public/i18n/    # expect 0</automated>
  </verify>
  <done>La Grange toilet/laundry photos confirmed absent; cream lightbox confirmed; SUMMARY records verified-clean.</done>
</task>

<task type="auto">
  <name>Task 5: SECT-05 — remove la-grange-carriage.webp from gym-and-bikes section + rename tile title</name>
  <files>src/pages/the-compound.astro, src/pages/index.astro, public/i18n/translations.json, src/i18n/translations.ts</files>
  <action>
Per AUDIT row p.7 (April 30): "In Gym and Bikes section: remove the carriage photo."

1. In `src/pages/the-compound.astro`:
   - Line ~50: `title: 'Bikes & The Carriage'` → `title: 'Bikes & The Gym'`
   - Line ~55: delete the entire `{ src: '/images/homes/la-grange-carriage.webp', alt: '...' },` line.
   - If the title is i18n-keyed via `data-i18n`, also update the matching key value in BOTH translations.json and translations.ts.

2. In `src/pages/index.astro`:
   - Line ~48: delete the `{ src: '/images/homes/la-grange-carriage.webp', alt: '...' },` entry from whichever array contains it (search for the exact substring).

3. Asset file `public/images/homes/la-grange-carriage.webp` may be left in place (orphaned) — DO NOT delete from disk; the photo pipeline owns asset lifecycle.

Commit message: `refactor(02-03): SECT-05 — remove carriage photo from gym & bikes, rename tile`
  </action>
  <verify>
    <automated>cd /workspace &amp;&amp; ! grep -rn "la-grange-carriage\.webp\|Bikes & The Carriage" src/pages/the-compound.astro src/pages/index.astro    # expect 0</automated>
  </verify>
  <done>Carriage photo absent from both pages; tile title renamed; i18n key (if any) updated en+fr; one commit landed.</done>
</task>

<task type="auto">
  <name>Task 6: SECT-06 — remove pink-gown photo from Le Moulin main carousel</name>
  <files>src/content/pages/le-moulin.md</files>
  <action>
Per AUDIT row p.10 (April 30): "delete my picture in the pink gown in front of the house (you can keep me in the bike by the gate)".

1. In `src/content/pages/le-moulin.md` lines 24-25 (per AUDIT), the gallery array has:
     - src: "/images/homes/le-moulin-welcome-rose.webp"
       alt: "Welcome to Le Moulin — your hostess in a rose-pink gown with Jetson the Cavalier"

   Delete BOTH the `- src:` line and its `alt:` line.

2. Verify `le-moulin-gate.webp` ('bike by the gate') still present in the same file's gallery.

3. Asset `/images/homes/le-moulin-welcome-rose.webp` may stay on disk (orphaned).

Commit message: `refactor(02-03): SECT-06 — remove pink-gown welcome photo from Le Moulin main carousel`
  </action>
  <verify>
    <automated>cd /workspace &amp;&amp; ! grep -n "le-moulin-welcome-rose\.webp\|rose-pink gown" src/content/pages/le-moulin.md    # expect 0
grep -c "le-moulin-gate\.webp" src/content/pages/le-moulin.md    # expect ≥ 1</automated>
  </verify>
  <done>Pink-gown gallery entry removed; bike-by-gate confirmed retained; one commit landed.</done>
</task>

<task type="auto">
  <name>Task 7: SECT-07 — hide home-page Journal section</name>
  <files>src/pages/index.astro</files>
  <action>
Per AUDIT row p.8 (April 30): "Just hide that whole section for now" (referring to From the Journal block at src/pages/index.astro:559).

1. In `src/pages/index.astro` locate the section starting around line 555 — the `<section>` containing `<h2 data-i18n="home.journal.heading">From the Journal</h2>` and the surrounding `writings__card` grid. Find the opening `<section class="...">` tag and the matching closing `</section>` tag.

2. Wrap the entire section in `{false &&  ( ... ) }` JSX so the section is fully removed from rendered output but the markup is preserved in source for easy restore. Add a comment immediately above the wrap: `{/* Journal section hidden per SECT-07 — restore by changing false to true */}`

   ALTERNATIVELY (cleaner): comment-wrap with `{/* ... */}` over the whole section block. Either approach is acceptable per "preserve the data so it can be restored".

3. Do NOT delete the `home.journal.heading` translation key — the editor SPA may still surface it; emptying it is unnecessary because the section is no longer rendered.

4. Do NOT delete the underlying writings markdown files in `src/content/journal/` (if present).

Commit message: `refactor(02-03): SECT-07 — hide From-the-Journal section on home page`
  </action>
  <verify>
    <automated>cd /workspace &amp;&amp; npm run build 2>&amp;1 | tail -5 | grep -E "error|Error" | wc -l    # expect 0 — build still passes
grep -c "home.journal.heading" src/pages/index.astro    # may be 1 (still in source) or 0 (commented out); both acceptable. Section is HIDDEN but data preserved.</automated>
  </verify>
  <done>Journal section no longer rendered on home page; markup preserved in source for restore; build passes; one commit landed.</done>
</task>

<task type="auto">
  <name>Task 8: SECT-08 — hide per-room subheader on RoomShowcase tiles</name>
  <files>src/pages/homes/le-moulin.astro, src/pages/homes/hollywood-hideaway.astro, src/pages/homes/maison-de-la-riviere.astro</files>
  <action>
Per AUDIT row p.8 (April 30): "From room carousels: remove subheader above colon. 2."

After inspecting RoomShowcase.astro, the rendering of "title: subheader" is actually:
- `<h3 class="compound-tile__title">{room.title}</h3>` (e.g., "Les Roses")
- `<p class="compound-tile__summary">{room.summary}</p>` (e.g., "The Rose Room — two twin beds.")

The "subheader above colon" interpretation per AUDIT-rationale is: the room.summary line that renders below each room title on the tile. RoomShowcase already supports a `hideTileSummary={true}` prop (line 30, 38) — that is the exact lever.

1. Find every `<RoomShowcase ... />` invocation in:
   - src/pages/homes/le-moulin.astro
   - src/pages/homes/hollywood-hideaway.astro
   - src/pages/homes/maison-de-la-riviere.astro

   `grep -n "RoomShowcase" src/pages/homes/*.astro`

2. On EVERY invocation, add the prop `hideTileSummary={true}`. If the prop is already present, leave it. Do NOT modify the RoomShowcase component itself — the prop already does the work.

3. Verify by running the build that no Astro template error surfaces.

This affects only the room/gathering-spaces tiles — the modal click-to-expand still shows the full summary because that flow uses `data-room` JSON payload (which is not affected by the prop).

Commit message: `refactor(02-03): SECT-08 — hide per-room summaries on RoomShowcase tiles`
  </action>
  <verify>
    <automated>cd /workspace &amp;&amp; grep -c "hideTileSummary={true}" src/pages/homes/le-moulin.astro src/pages/homes/hollywood-hideaway.astro src/pages/homes/maison-de-la-riviere.astro    # expect ≥ 1 each</automated>
  </verify>
  <done>Every RoomShowcase invocation in the 3 house pages passes hideTileSummary={true}; tile rendering shows title-only (no summary); modal click-through still shows full info; one commit landed.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| build → render | All edits in this plan are content/markup deletions; no new code paths, no new external surface |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-07 | Tampering | content removal | accept | Removed sections preserved in markdown source where applicable; restore is a one-line revert. |
| T-02-08 | Denial of Service (build break) | Astro template syntax | mitigate | Each task includes `npm run build` implicitly via verify; commit only after build passes. |
| T-02-09 | Information Disclosure | orphaned image assets | accept | Deleted-from-page images remain on disk but are not linked from any rendered page; not exfiltratable beyond what was already public. |
</threat_model>

<verification>
## Phase-level success criteria for this plan

1. `! grep -n "id: 'office'\|id: 'courtyard'\|Office with desk + printer" src/pages/homes/le-moulin.astro` (expect 0)
2. `! grep -rn "la-grange-" src/content/pages/hollywood-hideaway.md src/pages/homes/hollywood-hideaway.astro` (expect 0 in main carousel context)
3. `! grep -n "id: 'exterior'\|id: 'gardens'" src/pages/homes/maison-de-la-riviere.astro` (expect 0)
4. `! grep -rn "la-grange-toilet\|la-grange-laundry" src/ public/i18n/` (expect 0 — verify-only)
5. `! grep -rn "la-grange-carriage\.webp\|Bikes & The Carriage" src/pages/the-compound.astro src/pages/index.astro` (expect 0)
6. `! grep -n "le-moulin-welcome-rose\.webp" src/content/pages/le-moulin.md` (expect 0)
7. Home page build does not render `<h2>From the Journal</h2>` (manual or grep `<h2.*journal\.heading` in dist if needed; otherwise rely on commented/conditional wrap)
8. `grep -c "hideTileSummary={true}" src/pages/homes/{le-moulin,hollywood-hideaway,maison-de-la-riviere}.astro` ≥ 1 each
9. `npm run build` exits 0
10. 7 atomic commits land (8 tasks − 1 verify-only)
</verification>

<success_criteria>
- All 8 SECT-* requirements addressed (7 commits, 1 verify-only).
- No section deletion accidentally takes a translation key with it that is referenced elsewhere (verify by greps in each task).
- Atomic commits on `feat/may-5-2026-photos`.
- Build passes after each commit.
</success_criteria>

<output>
After completion, create `.planning/phases/02-ship-the-clear-edits/02-03-SUMMARY.md` recording:
- Files modified per task with before/after grep counts
- Commit hashes
- Confirmation that hidden Journal section is restorable
- Note on SECT-02 "What's Here 3-photo" deferral to Phase 3 clarification
</output>
