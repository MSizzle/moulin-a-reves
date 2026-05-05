---
phase: 02-ship-the-clear-edits
plan: 02
type: execute
wave: 2
depends_on: [01]
files_modified:
  - public/i18n/translations.json
  - src/i18n/translations.ts
  - src/pages/contact.astro
  - src/pages/index.astro
  - src/pages/the-compound.astro
  - src/pages/homes/index.astro
  - src/pages/homes/le-moulin.astro
  - src/pages/homes/hollywood-hideaway.astro
  - src/pages/homes/maison-de-la-riviere.astro
  - src/styles/global.css
autonomous: true
requirements:
  - TYPOG-01
  - TYPOG-02
  - TYPOG-03
must_haves:
  truths:
    - "No `<span class=\"serif-italic\">` wraps the final word in any header listed by AUDIT (stay, Maisons, Rêves, sleep, gather, Compound, Area, Easy, us, Autres Maisons) (TYPOG-01)"
    - "Get-in-Touch (`/contact/`) page hero has no italic styling on header text (TYPOG-02)"
    - "Hollywood Hideaway hero has no italic tagline text (TYPOG-02)"
    - "global.css :root font-family tokens consolidated to 2-3 family imports; the 'Your Dream French Vacation Come True' favorite-font preserved as elegant accent (TYPOG-03)"
  artifacts:
    - path: "public/i18n/translations.json"
      provides: "Italic spans removed from header values en+fr"
      contains: "no occurrences of 'serif-italic' in any *.heading or *.title key"
    - path: "src/styles/global.css"
      provides: "Consolidated Google Fonts @import block + :root font tokens"
      contains: "2-3 font families maximum"
    - path: "src/components/AvailabilityCalendar.astro and per-page heading invocations"
      provides: "Plain-text headings (no inline serif-italic spans on final words)"
  key_links:
    - from: "data-i18n-html headings in pages"
      to: "translations.json runtime overlay"
      via: "setLanguage() innerHTML swap"
      pattern: "data-i18n-html.*availability\\.heading|data-i18n-html.*homes\\.hero\\.title"
---

<objective>
Remove italic styling from the listed header final-words across the site, remove italics from the Get-in-Touch hero and Hollywood Hideaway hero (TYPOG-02), and consolidate the Google Fonts stack to 2-3 families while preserving the client's favorite "Your Dream French Vacation Come True" header font as an elegant accent (TYPOG-03).

Purpose: The client repeatedly flagged italic-on-final-word as visual noise across all three rounds; consolidating fonts addresses her "use only 2 or 3 fonts so the website feels more elegant and soothing" request from April 30.

Output:
- 3 atomic commits on `feat/may-5-2026-photos` (one per requirement)
- All `<span class="serif-italic">…</span>` wrappers stripped from the listed header final-words across .astro files AND the matching i18n-keys in translations.json + translations.ts
- src/styles/global.css `@import` block + `:root --font-*` tokens consolidated
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
@CLAUDE.md

<interfaces>
TYPOG-01 list (verbatim from AUDIT.md row "Les Autres Maisons at bottom of page - take away italics"):
  Header final-words to de-italicize across the site:
    - "stay"  in "Where you can stay" / "When You Can Stay"  (already covered by COPY-01 plan-01; verify zero remaining italic spans on this string)
    - "Maisons" in "Les Maisons" (homes/index.astro hero)
    - "Maisons" in "Les Autres Maisons" (cross-links on each house page)
    - "Rêves"  in "Moulin à Rêves" (footer + headers if any italicize this)
    - "sleep"  in "Where you'll sleep" (RoomShowcase headings on each house page)
    - "gather" in "Where you'll gather" (RoomShowcase headings)
    - "What's here" — final-word italic (AmenitiesSection invocations)
    - "us"     in "Join us" (AvailabilityCalendar invocations across home, contact, 3 house pages)
    - "Compound" in "Discover the Compound" (home page)
    - "Area"   in "Discover the Area" (home page)
    - "Easy"   in "We Make It Easy" (home page)

  Pattern in code: `<span class="serif-italic">FinalWord</span>` inside heading={`...`} prop strings, h1/h2 children, or translations.json values. Also via `data-i18n-html` keys whose VALUE in translations.json embeds the span markup.

TYPOG-02 list (per AUDIT rows):
  - `src/pages/contact.astro:23`  heading={`Join <span class="serif-italic">us</span>`}  → remove span, keep heading="Join us"
  - `src/pages/homes/hollywood-hideaway.astro` hero tagline italic — search the hero region for `<em>` or `<i>` or italic span and remove

TYPOG-03 (font standardization):
  Goal: site loads at most 3 Google Font families.
  Current src/styles/global.css imports likely include: a script/display font, a serif, a body sans (3+ families). Audit:
    `head -10 src/styles/global.css`  → list the @import url() lines
    `grep -n "^  --font-" src/styles/global.css`  → list :root font tokens
  Action:
    1. Pick 3 families to keep (one of which MUST be the family used by `home.title` = "Your Dream French Vacation Come True" since the client identifies it as her favorite).
    2. Remove unused @import lines.
    3. Consolidate :root --font-display / --font-serif / --font-body / --font-script to reference only the kept families. Update any selector that referenced a removed family to fall back to one of the 3.
    4. Do NOT change any visible heading rendering except where a family disappears — in that case substitute the closest remaining family.

  Risk note: full font swap could shift visuals on every page. Per AUDIT-rationale and PROJECT.md "Risk posture: Don't break the editor / publishing flow", keep this change conservative — remove only the EASILY-removable 4th/5th family (e.g., a fallback that's never referenced). Document the choice in the commit body. If no family is safely removable without visible regression, the task body should:
    - Document the current font count in the SUMMARY
    - Make NO code change
    - Flag for Phase 3 CLIENT-CLARIFICATION.md as "needs client visual approval before reduction"
</interfaces>

<relevant-audit-rows>
TYPOG-01 — "Les Autres Maisons at bottom of page - take away italics" (p.3 May 1)
  Code state per AUDIT:
    src/pages/homes/le-moulin.astro:305          heading={`Where you'll <span class="serif-italic">sleep</span>`}
    src/pages/homes/hollywood-hideaway.astro:263 (similar)
    src/pages/homes/maison-de-la-riviere.astro:236, 246  (sleep + gather)
    src/pages/homes/index.astro:13               <h1>Les <span class="serif-italic">Maisons</span></h1>  (already swapped to plain text by COPY-13 in plan-01 — verify)
    Cross-links on each house page  "Les <span>Autres Maisons</span>"
    src/pages/index.astro:421                    "Discover the <span class="serif-italic">Compound</span>"
    src/pages/index.astro:468                    "We Make It <span class="serif-italic">Easy</span>"
    src/pages/index.astro:703                    "Discover the <span class="serif-italic">Area</span>"
    src/pages/contact.astro:23                   "Join <span class="serif-italic">us</span>"  (TYPOG-02 overlap)
    src/pages/index.astro:752, le-moulin.astro:333, hollywood-hideaway.astro:294, maison-de-la-riviere.astro:267  same "Join us" italic span

TYPOG-02 — "Get in Touch" page hero italics + Hollywood Hideaway italic tagline (p.3 May 1)
  Code state per AUDIT:
    src/pages/contact.astro:15  <h1 data-i18n="contact.hero.title">Join us!</h1>  (already plain text — OK)
    src/pages/contact.astro:23  AvailabilityCalendar heading prop has italic span — TYPOG-01 overlap
    src/pages/homes/hollywood-hideaway.astro hero region — search for italic styling on tagline

TYPOG-03 — "Please use only 2 or 3 fonts so that the website feels more elegant and soothing" (p.6 April 30)
  Code state per AUDIT:
    src/styles/global.css:1  @import url(...)  multiple Google Fonts imports
</relevant-audit-rows>
</context>

<tasks>

<task type="auto">
  <name>Task 1: TYPOG-01 — strip italic spans from listed header final-words across .astro + translations</name>
  <files>src/pages/index.astro, src/pages/contact.astro, src/pages/homes/index.astro, src/pages/homes/le-moulin.astro, src/pages/homes/hollywood-hideaway.astro, src/pages/homes/maison-de-la-riviere.astro, src/pages/the-compound.astro, public/i18n/translations.json, src/i18n/translations.ts</files>
  <action>
Remove `<span class="serif-italic">FinalWord</span>` wrappers from every header listed under <interfaces> TYPOG-01.

Step A — locate every occurrence:

```bash
grep -rn 'class="serif-italic"' src/pages/ src/components/ src/layouts/ public/i18n/translations.json src/i18n/translations.ts
```

For each result, decide:
- If it is a final-word in a HEADING (h1/h2 or AvailabilityCalendar/RoomShowcase `heading=` prop or translations.json *.heading / *.title value) — REMOVE the span wrapper, keep the inner text.
- If it is intentional emphasis in body prose — LEAVE.

Step B — concrete edits (verify line numbers; AUDIT may be slightly stale):

1. `src/pages/index.astro`:
   - Line ~421: `Discover the <span class="serif-italic">Compound</span>` → `Discover the Compound`
   - Line ~468: `We Make It <span class="serif-italic">Easy</span>` → `We Make It Easy`
   - Line ~703: `Discover the <span class="serif-italic">Area</span>` → `Discover the Area`
   - Line ~752: `heading={`Join <span class="serif-italic">us</span>`}` → `heading="Join us"`

2. `src/pages/contact.astro:23`: `heading={`Join <span class="serif-italic">us</span>`}` → `heading="Join us"`

3. `src/pages/homes/le-moulin.astro`:
   - Line ~305: `heading={`Where you'll <span class="serif-italic">sleep</span>`}` → `heading="Where you'll sleep"`
   - Line ~333: `heading={`Join <span class="serif-italic">us</span>`}` → `heading="Join us"`
   - Line ~366: any "Les <span class="serif-italic">Autres Maisons</span>" → "Les Autres Maisons"

4. `src/pages/homes/hollywood-hideaway.astro`:
   - Line ~263: `Where you'll <span>sleep|gather</span>` → plain text (search both)
   - Line ~294: `Join <span>us</span>` → "Join us"
   - Any "Les <span>Autres Maisons</span>" → "Les Autres Maisons"

5. `src/pages/homes/maison-de-la-riviere.astro:236, 246, 267, 311`: same pattern — strip spans from sleep/gather/us/Autres Maisons.

6. `src/pages/the-compound.astro:303` and any other "The Refuge" / "Discover the Compound" headings — strip spans on final words.

7. `src/pages/homes/index.astro:13`: COPY-13 (plan 01) already replaced this header with plain "Bienvenue Chez Vous" — verify no span remains. If COPY-13 was not yet executed at this point in the wave, skip; if it was, confirm.

Step C — translations.json values:

```bash
grep -n 'serif-italic' public/i18n/translations.json src/i18n/translations.ts
```

For each match in `*.heading` or `*.title` values, remove the span markup from the string. Examples:
- `"home.compound.heading": "Discover the <span class=\"serif-italic\">Compound</span>"` → `"Discover the Compound"`
- `"home.area.heading": "Discover the <span class=\"serif-italic\">Area</span>"` → `"Discover the Area"`

After stripping, change the corresponding `data-i18n-html="..."` attributes to `data-i18n="..."` if the value no longer contains any HTML markup. (textContent swap is faster and safer than innerHTML when no markup remains.) Mirror the same in src/i18n/translations.ts.

Step D — verify intentional italic emphasis in body prose still works:
- `src/pages/index.astro` paragraph with `<span class="serif-italic">…</span>` inside body copy (NOT a heading) — leave untouched.

Commit message: `style(02-02): TYPOG-01 — remove italic on header final-words across pages + i18n`
  </action>
  <verify>
    <automated>cd /workspace &amp;&amp; grep -rn 'class="serif-italic"' src/pages/index.astro src/pages/contact.astro src/pages/homes/ public/i18n/translations.json src/i18n/translations.ts | grep -E 'heading=|h1>|h2>|\.heading"|\.title"' | wc -l    # expect 0</automated>
  </verify>
  <done>Zero italic spans wrap header final-words across pages or in *.heading/*.title i18n values; body-prose italic emphasis preserved; one commit landed.</done>
</task>

<task type="auto">
  <name>Task 2: TYPOG-02 — remove italic styling from Get-in-Touch hero + Hollywood Hideaway hero tagline</name>
  <files>src/pages/contact.astro, src/pages/homes/hollywood-hideaway.astro, src/content/pages/hollywood-hideaway.md, public/i18n/translations.json, src/i18n/translations.ts</files>
  <action>
Per AUDIT row p.3 (May 1): "Delete italicised text below it inside the image" + "Hollywood Hideaway The hero image white text feels too low - please center it."

The Hollywood Hideaway centering is PHOTO-03 (plan-04). This task focuses on italic-text removal in those hero regions.

1. `src/pages/contact.astro`:
   - Line 15: `<h1 data-i18n="contact.hero.title">Join us!</h1>` — already plain text, OK.
   - The AvailabilityCalendar `heading=` prop on line 23 was handled by Task 1 (TYPOG-01).
   - Search the file for any remaining `<em>`, `<i>`, or `font-style: italic` selector applied to hero content; if found, remove.

2. `src/pages/homes/hollywood-hideaway.astro` hero region (lines ~196-205):
   - Current renders `<h1>{cms.title}</h1>` and `<p>{cms.tagline}</p>` from `src/content/pages/hollywood-hideaway.md`.
   - Inspect `src/content/pages/hollywood-hideaway.md`:
     - `tagline: "A 60-year sanctuary in the French countryside — sleeps 7."` — currently no italic markup in the source.
   - Search the .astro file's `<style>` block for any `font-style: italic` rule on `.hero__tagline` or `.hero__title` — if found, remove or override scoped style.
   - Search the .md file for any `<em>` or `*…*` markdown emphasis in the tagline — if present, strip.

3. If TYPOG-01 already handled all italic spans, this task may produce no commit beyond verification. In that case, write a SUMMARY note and skip the commit. Otherwise:

Commit message: `style(02-02): TYPOG-02 — remove italic on Get-in-Touch + Hollywood Hideaway hero text`
  </action>
  <verify>
    <automated>cd /workspace &amp;&amp; grep -nE "<em>|<i>|font-style:\s*italic" src/pages/contact.astro src/pages/homes/hollywood-hideaway.astro src/content/pages/hollywood-hideaway.md | wc -l    # expect 0</automated>
  </verify>
  <done>Get-in-Touch and Hollywood Hideaway hero regions free of italic markup/styling; one commit (or verify-only SUMMARY note) recorded.</done>
</task>

<task type="auto">
  <name>Task 3: TYPOG-03 — consolidate global.css fonts to 2-3 families (preserve favorite-font as accent)</name>
  <files>src/styles/global.css</files>
  <action>
Per AUDIT row p.6 (April 30): "Please use only 2 or 3 fonts so that the website feels more elegant and soothing".

This is a careful, conservative consolidation — the risk is breaking visible typography across every page. Follow this protocol exactly:

Step A — survey:

```bash
grep -n "^@import\|^  --font-" src/styles/global.css | head -40
```

List:
- All `@import url('https://fonts.googleapis.com/css2?...')` lines (each loads ONE family).
- All `:root --font-*` custom properties (each names a family).
- Cross-reference: `grep -n "var(--font-" src/styles/global.css src/layouts/BaseLayout.astro src/pages/ src/components/ | head -20` shows where each token is consumed.

Step B — preserve the favorite font:

The client identifies the "Your Dream French Vacation Come True" H1 font as her favorite (`src/pages/index.astro:213` rendered via the `--font-display` or `--font-serif` token). Whichever token CSS rule applies to `.hero__title` on the home page, KEEP that family.

Step C — pick 3 families to keep:

Typical stack:
1. The favorite display/serif font (kept — used on hero H1 throughout)
2. A body sans (kept — used on body, nav, buttons, forms)
3. One accent script/serif if currently active on multiple pages (kept if present)

Anything beyond 3 families: REMOVE the @import line AND the unused `:root --font-*` token AND any selector that references the removed token. Replace orphan references with the closest remaining family.

Step D — if removal would cause visible regression:

If every imported family is currently consumed by a rendered selector, do NOT remove. Instead:
1. Make NO code change.
2. Add a SUMMARY note documenting current font count and the regression risk.
3. Flag in plan SUMMARY for Phase 3 CLIENT-CLARIFICATION.md: "TYPOG-03 needs client visual approval before reducing the font count from N to 3."

This pattern is acceptable for TYPOG-03 because the requirement is satisfied either by reducing fonts OR by surfacing the visual-approval question to the client.

Commit message (if reduction made): `style(02-02): TYPOG-03 — consolidate global.css fonts to N families (preserve home H1 font)`
Commit message (if SUMMARY-only): no commit; SUMMARY notes deferral.
  </action>
  <verify>
    <automated>cd /workspace &amp;&amp; grep -c "^@import" src/styles/global.css    # log count for SUMMARY (no fixed expected value — depends on safe-to-remove decision)</automated>
  </verify>
  <done>Either fonts reduced to 2-3 families with one commit landed, OR SUMMARY documents the deferral with a clear visual-approval question for the client.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| stylesheet → rendered DOM | global.css `@import` lines fetch external Google Fonts at runtime; removing imports reduces network surface but does not introduce new trust crossings |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-04 | Information Disclosure | Google Fonts CDN | accept | Already in use site-wide; reducing imports lowers fingerprintable network calls. No change in disposition. |
| T-02-05 | Denial of Service (visual) | font swap regression | mitigate | Task 3 protocol explicitly requires regression-safe removal OR no-op + SUMMARY deferral. |
| T-02-06 | Tampering (XSS via innerHTML) | data-i18n-html anchors | mitigate | Task 1 explicitly converts `data-i18n-html` → `data-i18n` (textContent swap) wherever the i18n value no longer contains markup. Reduces innerHTML surface. |
</threat_model>

<verification>
## Phase-level success criteria for this plan

1. `grep -rn 'class="serif-italic"' src/pages/index.astro src/pages/contact.astro src/pages/homes/ | grep -E 'heading=|h1>|h2>'` returns 0
2. `grep -n 'serif-italic' public/i18n/translations.json src/i18n/translations.ts | grep -E '\.heading"|\.title"'` returns 0
3. `grep -nE "<em>|<i>|font-style:\s*italic" src/pages/contact.astro src/pages/homes/hollywood-hideaway.astro` returns 0
4. `grep -c "^@import" src/styles/global.css` returns ≤ 3 (or SUMMARY documents reason for not reducing)
5. `npm run build` exits 0
6. 1-3 atomic commits land on branch `feat/may-5-2026-photos`
</verification>

<success_criteria>
- Italic-on-final-word visual pattern removed from every header listed in AUDIT.
- Get-in-Touch and Hollywood Hideaway hero regions free of italic markup.
- global.css fonts either reduced to ≤ 3 families OR a deferral note added to SUMMARY for Phase 3 clarification (regression-safe rule).
- All translatable changes maintain en+fr parity in BOTH translations.json and translations.ts (D-09).
- Atomic commits on `feat/may-5-2026-photos`.
</success_criteria>

<output>
After completion, create `.planning/phases/02-ship-the-clear-edits/02-02-SUMMARY.md` recording:
- Files modified per task
- Commit hashes
- Italic-span occurrences before/after (grep counts)
- Font-family count before/after (and reasoning if no reduction)
- Any deviations or deferrals
</output>
