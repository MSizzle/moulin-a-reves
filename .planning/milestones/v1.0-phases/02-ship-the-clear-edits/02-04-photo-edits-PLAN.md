---
phase: 02-ship-the-clear-edits
plan: 04
type: execute
wave: 4
depends_on: [01, 02, 03]
files_modified:
  - src/content/pages/hollywood-hideaway.md
  - src/pages/homes/maison-de-la-riviere.astro
  - src/pages/homes/hollywood-hideaway.astro
  - src/styles/global.css
autonomous: true
requirements:
  - PHOTO-01
  - PHOTO-02
  - PHOTO-03
must_haves:
  truths:
    - "Hollywood Hideaway lead image (heroImage) is the patio breakfast shot — i.e., either hh-patio.webp (current) is confirmed as the breakfast shot, or the heroImage is reassigned to whichever asset shows breakfast on the patio table (PHOTO-01)"
    - "Maison de la Rivière dining-room tile lead photo is the horizontal tables-set-with-plates shot (maison-dinner-light.webp or whichever asset matches) (PHOTO-02)"
    - "Hollywood Hideaway hero text is vertically centered within .hero__content (PHOTO-03)"
    - "Dark filter on the .hero__overlay reduced (lower opacity) on the 'Interested in...' CTA hero across house pages (PHOTO-03)"
  artifacts:
    - path: "src/content/pages/hollywood-hideaway.md"
      provides: "Hollywood Hideaway content with patio-breakfast lead image"
    - path: "src/pages/homes/maison-de-la-riviere.astro"
      provides: "Dining tile photos array with horizontal-with-plates lead"
    - path: "src/pages/homes/hollywood-hideaway.astro"
      provides: "Hero with vertically centered content (scoped style or override)"
    - path: "src/styles/global.css"
      provides: ".hero--cta or scoped overlay variant with reduced opacity"
  key_links:
    - from: "Hollywood Hideaway hero block"
      to: ".hero__content { ... } scoped style override"
      via: "vertical centering rule (display: flex; align-items: center; OR transform: translateY)"
      pattern: "align-items:\\s*center|justify-content:\\s*center"
---

<objective>
Execute the three photo-related Clear-to-Ship edits: PHOTO-01 (Hollywood Hideaway lead image), PHOTO-02 (Maison de la Rivière dining lead), PHOTO-03 (Hollywood Hideaway hero vertical centering + reduced dark filter on house-CTA hero overlays).

Purpose: Final polish before client review. Photo edits are visible-on-first-look — these complete the visible improvement set the client will scan tomorrow.

Output:
- 3 atomic commits on `feat/may-5-2026-photos` (one per requirement; PHOTO-01 may be verify-only if hh-patio.webp is already the breakfast shot)
- Updated `src/content/pages/hollywood-hideaway.md` (PHOTO-01)
- Reordered photos array in `src/pages/homes/maison-de-la-riviere.astro` (PHOTO-02)
- CSS update in either `src/pages/homes/hollywood-hideaway.astro` scoped style block OR `src/styles/global.css` (PHOTO-03)
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
@.planning/phases/02-ship-the-clear-edits/02-03-section-edits-PLAN.md
@CLAUDE.md

<interfaces>
PHOTO-01 — Hollywood Hideaway lead image:
  AUDIT.md does NOT have a verbatim row for PHOTO-01 (the requirement-coverage table at AUDIT line 1518+ shows 0 bullets for PHOTO-01). The requirement comes from REQUIREMENTS.md COPY-area: "Hollywood Hideaway lead image → patio shot with breakfast on table."

  Current state (verified in this plan's research):
    src/content/pages/hollywood-hideaway.md:6  heroImage: "/images/homes/hh-patio.webp"

  The asset `hh-patio.webp` may or may not be the patio-with-breakfast shot — its name suggests "patio" generally. There is also `hh-patio-facing-home.webp` (facing the facade, breakfast table visible per `src/pages/homes/index.astro:42` alt text "breakfast table on the patio facing the blue-shuttered facade").

  Decision protocol for the executor:
    1. Inspect both `hh-patio.webp` and `hh-patio-facing-home.webp` (open them in a browser or use `file` to confirm they are valid images).
    2. The `src/pages/homes/index.astro:42` alt text on `hh-patio.webp` (used as the Hollywood card image on the Les Maisons page) reads: "breakfast table on the patio facing the blue-shuttered facade" — strong indication that `hh-patio.webp` IS the breakfast shot already. Verify by opening the image.
    3. If `hh-patio.webp` is the breakfast shot → PHOTO-01 is already satisfied → verify-only task, no commit; SUMMARY note.
    4. If `hh-patio-facing-home.webp` is the breakfast shot and `hh-patio.webp` is a different patio view → swap heroImage to `/images/homes/hh-patio-facing-home.webp` in `src/content/pages/hollywood-hideaway.md:6`.

  Asset constraint: Use only assets that already exist under `public/images/homes/`. Do NOT request a new upload — that would block this phase.

PHOTO-02 — Maison de la Rivière dining-room lead:
  AUDIT.md anchor:
    src/pages/homes/maison-de-la-riviere.astro:60  dining tile photos array, current first photo is `maison-dining.webp` (alt "board table under the large landscape painting").
  Required:
    Reorder so the horizontal "tables set with plates" shot is FIRST in the array.
    AUDIT cites `maison-dinner-light.webp` as the likely candidate.

  Decision protocol:
    1. List candidate assets: `ls public/images/homes/ | grep -iE "maison.*(dinner|dining|table|plate|setting)"`.
    2. If `maison-dinner-light.webp` exists → reorder the dining tile photos array so this asset is at index 0. The previous first photo (`maison-dining.webp`) drops to index 1.
    3. If no asset clearly matches "horizontal tables-set-with-plates" → SUMMARY-flag as "PHOTO-02 needs client asset clarification" (Phase 3 already covers asset clarifications).

PHOTO-03 — Hollywood Hideaway hero vertical centering + reduced dark filter:
  AUDIT anchors:
    src/pages/homes/hollywood-hideaway.astro:198  hero h1 + tagline (currently bottom-aligned via .hero__content default)
    src/styles/global.css:957  .hero__overlay { /* dark filter overlay */ }
    src/styles/global.css:964  .hero__content { ... }
    src/pages/homes/maison-de-la-riviere.astro:274  "Interested in {cms.title}?" CTA section (also has dark filter)

  Required:
    1. Hero text on Hollywood Hideaway: vertical center inside .hero__content. Use a scoped <style> override on hollywood-hideaway.astro that sets .hero__content { justify-content: center; align-items: center; } (assuming the existing global rule uses flex with default alignment) OR use `top: 50%; transform: translateY(-50%);` pattern depending on positioning context. Inspect global.css:964 first to choose the minimum-disruption rule.
    2. Reduce dark filter on .hero__overlay specifically for the "Interested in..." CTA hero across all 3 house pages. Best approach: add a modifier class `.hero__overlay--cta` (or `.hero--cta .hero__overlay`) with reduced opacity (e.g., from rgba(0,0,0,0.55) to rgba(0,0,0,0.25) — verify current value first). Apply the modifier only to the CTA section, NOT the page top hero.

i18n discipline: PHOTO-* edits are structural-only (D-10 — no FR translation update required for asset path changes or CSS).

Atomic commit policy: One commit per requirement.
</interfaces>

<relevant-audit-rows>
PHOTO-02 — "Have the lead dining room photo be the horizontal one with the tables set with plates" (p.4 May 1)
  Anchor: src/pages/homes/maison-de-la-riviere.astro:60 dining tile photos[0]

PHOTO-03 — "Hollywood Hideaway The hero image white text feels too low - please center it" (p.3 May 1)
  Anchor: src/pages/homes/hollywood-hideaway.astro:198 hero h1+tagline (bottom-aligned)
PHOTO-03 — "Can you reduce the black filter on the image on this page and all the house listings" (p.12 April 30)
  Anchor: src/pages/homes/maison-de-la-riviere.astro:274 "Interested in..." CTA + src/styles/global.css:957 .hero__overlay
PHOTO-03 — "The photo is too dark in 'Interested in La Maison de la Riviere' and on all the maison pages" (p.12 April 30)
  Same anchors as above
</relevant-audit-rows>
</context>

<tasks>

<task type="auto">
  <name>Task 1: PHOTO-01 — verify (or swap) Hollywood Hideaway hero is the patio-breakfast shot</name>
  <files>src/content/pages/hollywood-hideaway.md</files>
  <action>
1. Inspect candidate assets:

```bash
ls -la public/images/homes/hh-patio*.webp
file public/images/homes/hh-patio.webp public/images/homes/hh-patio-facing-home.webp
```

2. Cross-reference alt-text usage:

```bash
grep -rn "hh-patio" src/content/ src/pages/
```

The `src/pages/homes/index.astro` line ~42 alt for `/images/homes/hh-patio.webp` reads "breakfast table on the patio facing the blue-shuttered facade" — strong evidence that hh-patio.webp IS the breakfast-on-patio shot already.

3. Decision tree:
   - **If hh-patio.webp shows breakfast on the patio table** (per visible inspection or alt-text consistency): PHOTO-01 is already satisfied. Add a SUMMARY note: "PHOTO-01 verified — hh-patio.webp is the patio-breakfast shot; heroImage already correct." NO commit needed.
   - **If hh-patio-facing-home.webp is the better breakfast match**: update `src/content/pages/hollywood-hideaway.md:6`:
     ```yaml
     heroImage: "/images/homes/hh-patio-facing-home.webp"
     ```
     Commit: `feat(02-04): PHOTO-01 — Hollywood Hideaway lead = patio-breakfast shot`
   - **If NEITHER asset matches**: SUMMARY-flag for Phase 3 clarification: "PHOTO-01 — need client to confirm which asset is the breakfast-on-patio shot." (Asset-clarification routing is consistent with AUDIT's pattern for ambiguous photo asks.)

The verify gate below assumes the most likely outcome (already correct).

  </action>
  <verify>
    <automated>cd /workspace &amp;&amp; grep -c "heroImage:" src/content/pages/hollywood-hideaway.md    # expect 1 (file still has a heroImage)
grep -E 'heroImage:.*"/images/homes/hh-patio(-facing-home)?\.webp"' src/content/pages/hollywood-hideaway.md    # expect a match (one of the two patio shots)</automated>
  </verify>
  <done>Hollywood Hideaway heroImage is one of the two patio assets; SUMMARY documents which one is the breakfast shot per visible inspection; commit landed only if a swap was needed.</done>
</task>

<task type="auto">
  <name>Task 2: PHOTO-02 — Maison de la Rivière dining-room lead = horizontal tables-set-with-plates shot</name>
  <files>src/pages/homes/maison-de-la-riviere.astro</files>
  <action>
1. List candidate assets:

```bash
ls public/images/homes/ | grep -iE "maison.*(dinner|dining|table|plate|setting)"
```

Likely candidates from the Maison family of photos: `maison-dinner-light.webp`, `maison-dining.webp`, plus possibly others.

2. Inspect the dining-tile photos array in `src/pages/homes/maison-de-la-riviere.astro` around line 60. Identify the current photos[0] (lead).

3. Reorder the array so the horizontal-tables-set-with-plates asset is at index 0. The most common choice per AUDIT is `maison-dinner-light.webp`. The previous lead drops to index 1.

   Pattern:
   ```jsx
   {
     id: 'dining',
     title: 'Dining Room',
     summary: '...',
     photos: [
       { src: '/images/homes/maison-dinner-light.webp', alt: '...' },  // ← new lead
       { src: '/images/homes/maison-dining.webp', alt: '...' },         // ← was lead
       // ... rest of array unchanged
     ],
   },
   ```

4. If no asset name clearly matches the "horizontal tables-set-with-plates" description, SUMMARY-flag for Phase 3 clarification: "PHOTO-02 — need client to confirm asset for horizontal dining-room lead."

5. If a swap was made: commit `feat(02-04): PHOTO-02 — Maison dining lead = horizontal tables-set-with-plates`.

  </action>
  <verify>
    <automated>cd /workspace &amp;&amp; grep -A4 "id: 'dining'" src/pages/homes/maison-de-la-riviere.astro | grep -E "maison-dinner|maison-(dining|tables)" | head -2    # expect 1 match within first 4 lines after dining (the new lead)</automated>
  </verify>
  <done>Dining tile photos array's first entry is the horizontal-tables-set-with-plates asset (or SUMMARY flags need-for-client-confirmation if no asset matches); commit landed if swap made.</done>
</task>

<task type="auto">
  <name>Task 3: PHOTO-03 — vertically center Hollywood Hideaway hero text + reduce dark filter on "Interested in..." CTA hero across house pages</name>
  <files>src/pages/homes/hollywood-hideaway.astro, src/pages/homes/maison-de-la-riviere.astro, src/pages/homes/le-moulin.astro, src/styles/global.css</files>
  <action>
Step A — vertical centering on Hollywood Hideaway hero:

1. Inspect the existing rule:

```bash
sed -n '950,990p' src/styles/global.css   # context around .hero__overlay and .hero__content
```

2. The existing `.hero__content` rule probably uses `position: absolute` with `bottom: …` or `flex` with default alignment. Choose the minimum-disruption override:
   - If flex-based: scoped `<style>` in `src/pages/homes/hollywood-hideaway.astro` adding `.hero__content { justify-content: center; }` (keep `align-items` if already set).
   - If absolute-positioned: scoped override `.hero__content { top: 50%; bottom: auto; transform: translate(-50%, -50%); left: 50%; }` — but this may break other pages that rely on the default. Use the scoped style block (Astro-scoped CSS will only apply to this component instance).

3. Add the override INSIDE the existing `<style>` block in `src/pages/homes/hollywood-hideaway.astro` (around line 204 where `.hero__eyebrow` lives). Astro scopes these styles to this file only.

Step B — reduce dark filter on the "Interested in..." CTA hero across all 3 house pages:

1. The `.hero__overlay` rule in `src/styles/global.css:957` likely has `background: rgba(0, 0, 0, 0.55);` or similar. Confirm by reading lines 955-965.

2. Add a NEW modifier class to global.css. Recommended: `.hero--cta .hero__overlay { background: rgba(0, 0, 0, 0.25); }` (reduced opacity). Place this directly after the existing `.hero__overlay` rule.

3. Apply `class="hero hero--cta"` to the "Interested in {cms.title}?" `<section class="hero">` block on:
   - `src/pages/homes/maison-de-la-riviere.astro:274` (per AUDIT)
   - `src/pages/homes/le-moulin.astro` — find the matching "Interested in" CTA section
   - `src/pages/homes/hollywood-hideaway.astro` — find the matching "Interested in" CTA section

   Search pattern: `grep -n "Interested in" src/pages/homes/*.astro`.

4. Do NOT change the top-of-page hero overlay opacity — that overlay is needed for legibility of hero text.

Commit message: `style(02-04): PHOTO-03 — center HH hero text + reduce dark filter on house CTA heroes`
  </action>
  <verify>
    <automated>cd /workspace &amp;&amp; grep -c "hero--cta\|hero hero--cta" src/pages/homes/maison-de-la-riviere.astro src/pages/homes/le-moulin.astro src/pages/homes/hollywood-hideaway.astro    # expect ≥ 1 each
grep -c "hero--cta" src/styles/global.css    # expect ≥ 1 (rule defined)
grep -c "justify-content:\s*center\|translateY(-50%)" src/pages/homes/hollywood-hideaway.astro    # expect ≥ 1 (vertical centering rule scoped to HH)</automated>
  </verify>
  <done>HH hero text vertically centered (scoped override); .hero--cta modifier class defined and applied to "Interested in..." CTA sections on all 3 house pages with reduced overlay opacity; one commit landed.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| static asset → rendered hero | Asset path changes route through Astro static-asset pipeline; no new boundary |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-10 | Information Disclosure | image alt text | accept | Alt text is intentionally public-facing copy. |
| T-02-11 | Denial of Service (build break) | reorder/swap of asset path | mitigate | Each task verifies asset exists in public/images/homes/ before referencing. |
| T-02-12 | Tampering | scoped CSS override | accept | Astro-scoped styles cannot leak to other pages. .hero--cta modifier class scope-limited to elements that opt in by adding the class. |
</threat_model>

<verification>
## Phase-level success criteria for this plan

1. `grep -E "heroImage:.*hh-patio(-facing-home)?\.webp" src/content/pages/hollywood-hideaway.md` matches a current patio asset
2. `grep -A4 "id: 'dining'" src/pages/homes/maison-de-la-riviere.astro | head -6` shows the new horizontal-with-plates asset at index 0 (or SUMMARY documents asset clarification needed)
3. `grep -c "hero--cta" src/styles/global.css` ≥ 1
4. `grep -c "hero--cta\|hero hero--cta" src/pages/homes/maison-de-la-riviere.astro src/pages/homes/le-moulin.astro src/pages/homes/hollywood-hideaway.astro` ≥ 1 each
5. `grep -c "justify-content:\s*center\|translateY(-50%)" src/pages/homes/hollywood-hideaway.astro` ≥ 1 (HH-scoped vertical centering)
6. `npm run build` exits 0
7. 1-3 atomic commits land (depending on PHOTO-01 verify-only and PHOTO-02 asset availability)
</verification>

<success_criteria>
- PHOTO-01: HH heroImage confirmed (or swapped) to a patio-with-breakfast shot.
- PHOTO-02: Maison dining tile lead = horizontal-tables-set-with-plates (or asset clarification deferred to Phase 3).
- PHOTO-03: HH hero vertically centered + house CTA hero overlays reduced.
- All edits structural-only (D-10 — no FR translation updates needed).
- Atomic commits on `feat/may-5-2026-photos`.
</success_criteria>

<output>
After completion, create `.planning/phases/02-ship-the-clear-edits/02-04-SUMMARY.md` recording:
- Files modified per task
- Commit hashes
- Which photo asset was confirmed/swapped for PHOTO-01 and PHOTO-02 (or deferral note)
- Before/after notes on hero centering and overlay opacity
- Any deviations from this plan
</output>
