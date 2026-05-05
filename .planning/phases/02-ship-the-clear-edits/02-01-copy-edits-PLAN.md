---
phase: 02-ship-the-clear-edits
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - public/i18n/translations.json
  - src/i18n/translations.ts
  - src/pages/index.astro
  - src/pages/contact.astro
  - src/pages/the-compound.astro
  - src/pages/explore/index.astro
  - src/pages/about.astro
  - src/pages/homes/index.astro
  - src/pages/homes/le-moulin.astro
  - src/pages/homes/hollywood-hideaway.astro
  - src/pages/homes/maison-de-la-riviere.astro
  - src/content/homes/le-moulin.md
autonomous: true
requirements:
  - COPY-01
  - COPY-02
  - COPY-03
  - COPY-04
  - COPY-05
  - COPY-06
  - COPY-07
  - COPY-08
  - COPY-09
  - COPY-10
  - COPY-11
  - COPY-12
  - COPY-13
  - COPY-14
  - COPY-15
must_haves:
  truths:
    - "grep -ri 'when you can stay' src/ public/i18n/ returns zero matches (COPY-01)"
    - "Le Moulin amenities footer reads 'Sleeps 10 across 8 beds' in both src/pages/homes/le-moulin.astro and translations.json (COPY-02)"
    - "Home stats-bar label reads 'Homes' (en) / 'Maisons' (fr), not 'Houses' (COPY-03)"
    - "About-page CTA reads 'come and visit!' in both .astro and translations.json (COPY-04)"
    - "Address renders '14, 16, 18 Rue des Crocs au Renard, 91660 Le Mérévillois' on footer + about + contact (COPY-05 — verify-only)"
    - "Home hero leads with 'A Private Luxurious Compound, One Hour From Paris' + 10-bedrooms info; 'Méréville, France' below tagline (COPY-06)"
    - "Le Moulin house title + content reads 'Le Moulin' (not 'Moulin à Rêves') across .astro + .md (COPY-07 — verify-only)"
    - "Compound tagline reads 'This is a private walled compound where you are master of your own domaine. Peace, privacy. Tranquility.' (COPY-08 — verify-only)"
    - "Home page hero secondary CTA reads 'Join us!' instead of 'Speak with the Concierge' (COPY-09)"
    - "All four 'Bonjour!' instances are 'Bienvenue!' in translations.json en/fr (COPY-10)"
    - "groupTypes array shows 'Yoga, painting, writing retreats' and 'Friends celebrations' (COPY-11)"
    - "Hollywood Hideaway 'The Refuge' eyebrow renders on home, the-compound, le-moulin, and maison-de-la-riviere pages (COPY-12 — verify-only)"
    - "Les Maisons hero h1 reads 'Bienvenue Chez Vous' with smaller tagline 'All size groups welcome. Rent 1 home or enjoy all 3.' (COPY-13)"
    - "'Three stone houses around shared gardens. Each its own world; together, the compound.' phrase no longer appears in translations.json or rendered HTML (COPY-14)"
    - "Contact tagline includes the word 'size' — 'Tell us your dates, your group size, your dreams. We'll take it from there.' in BOTH translations.json:1483 and src/i18n/translations.ts:642 (COPY-15)"
  artifacts:
    - path: "public/i18n/translations.json"
      provides: "FR + EN runtime overlay for every i18n key touched"
      contains: "Bienvenue!, Join us, Sleeps 10 across 8 beds, come and visit!, Homes, Bienvenue Chez Vous, your group size"
    - path: "src/i18n/translations.ts"
      provides: "Static fallback dict matches translations.json"
      contains: "Bienvenue!, Join us, come and visit!"
    - path: "src/pages/index.astro"
      provides: "Home hero + groupTypes + stats-bar + secondary CTA"
      contains: "Join us!, Yoga, painting, writing retreats, Friends celebrations, Homes"
  key_links:
    - from: "src/layouts/BaseLayout.astro setLanguage()"
      to: "public/i18n/translations.json"
      via: "fetch('/api/translations') runtime overlay"
      pattern: "data-i18n.*availability\\.heading"
---

<objective>
Execute every Clear-to-Ship copy edit (COPY-01 through COPY-15) from AUDIT.md as a sequence of atomic commits. This plan covers 15 requirements; three of them (COPY-05, COPY-07, COPY-08, COPY-12) are already-done acknowledgements that need verify-only tasks so the requirement boxes can be ticked truthfully.

Purpose: Visibly improve the live site for the client review tomorrow by shipping every copy edit she has unambiguously requested across all three rounds of MMM may.5.pdf.

Output:
- 15 atomic commits on `feat/may-5-2026-photos` (one per requirement; COPY-12 verifies and may produce no commit)
- Updated `public/i18n/translations.json` (runtime overlay) + matching `src/i18n/translations.ts` (typed seed) for every translatable change (D-09 i18n dual-update rule)
- Updated `.astro` and content `.md` files per AUDIT.md `file:line` references
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
@CLAUDE.md

<interfaces>
<!-- Key conventions the executor MUST follow. From CLAUDE.md + AUDIT.md decisions. -->

i18n dual-update rule (D-09):
  Every English copy change in a .astro/.md file MUST be paired with the matching key
  update in BOTH public/i18n/translations.json (runtime overlay, fetched via /api/translations)
  AND src/i18n/translations.ts (typed seed for SSR/fallback). Forgetting either leaves
  the FR toggle broken or the static fallback drifted. Atomic commits = both files
  in one commit.

i18n attribute discipline:
  - data-i18n="key" → setLanguage() replaces textContent (use ONLY for plain text)
  - data-i18n-html="key" → setLanguage() replaces innerHTML (use whenever the value
    contains <span>, <br>, <em>, <strong>, etc.)
  - Never put HTML markup in a data-i18n value — it will be HTML-escaped at runtime.

translations.json shape:
  Each key is { "en": "...", "fr": "..." } — both must be updated.
  When you add a new key, also add the FR variant — never leave it null/empty.

Stats-bar i18n key (COPY-03):
  Key is `compound.stats.houses` (the historical name; semantic value is now "Homes").
  Update value en→'Homes' / fr→'Maisons'; do NOT rename the key (would invalidate
  every page that references it).

Translations.json key for 'Three stone houses' (COPY-14):
  AUDIT.md cites public/i18n/translations.json:131 as the location. Verify with
  `grep -n "Three stone houses" public/i18n/translations.json` then either delete
  the key entry OR set en/fr to empty strings if the key is consumed by an existing
  data-i18n anchor. If only an anchor in src/pages/the-compound.astro renders this
  text, remove the anchor's hardcoded text and the json key together.

Atomic commit messaging:
  Use the project's loose conventional-commit style. Examples:
    copy(02-01): COPY-01 — replace "When you can stay" with "Join us!" (en+fr)
    copy(02-01): COPY-02 — Le Moulin footer "Sleeps 10 across 8 beds" (en+fr)
    copy(02-01): COPY-13 — Les Maisons hero "Bienvenue Chez Vous" (en+fr)
  Match the existing project style (see `git log --oneline -20` on this branch).

Branch policy (no branching):
  All commits land directly on the current branch `feat/may-5-2026-photos`.
  Do not create a sub-branch per requirement; one commit per task is the contract.

Verify-only tasks (COPY-05, COPY-07, COPY-08, COPY-12):
  AUDIT.md marked these ✅ Already Done. The task body MUST run the grep gate to
  confirm the prior commit's change is still in place. If the gate passes, write
  a short note to the plan SUMMARY (no commit). If the gate fails, ship the
  remediation as a "fix(02-01): COPY-XX — restore ..." commit.
</interfaces>

<relevant-audit-rows>
<!-- Quoted verbatim from AUDIT.md so the executor needs no PDF re-read. -->

COPY-01 — "When you can stay" → "Join us!" (4 i18n keys + verify cascade)
  AUDIT.md anchors:
    public/i18n/translations.json:183  home.availability.heading
    public/i18n/translations.json:1908 le-moulin.availability.heading
    public/i18n/translations.json:2100 hideaway.availability.heading
    public/i18n/translations.json:2280 riviere.availability.heading
  Required: en → "Join us" (no italic span on final word per TYPOG-01),
            fr → "Rejoignez-nous"
  Mirror the same change in src/i18n/translations.ts.
  Final grep gate: `grep -rni "when you can stay\|where you can stay" src/ public/i18n/ | grep -v '^#' | wc -l` returns 0.

COPY-02 — Le Moulin amenities/footer "Sleeps 10 across 8 beds"
  AUDIT.md anchor:
    public/i18n/translations.json:1902  le-moulin.amenities.amenity.9 → currently "Sleeps 12 across 8 beds"
  src/pages/homes/le-moulin.astro:187 already says "Sleeps 10 across 8 beds" (verified).
  Required: update json key en → "Sleeps 10 across 8 beds", fr → "Couchage pour 10 sur 8 lits".
  Final grep gate: `grep -ni "Sleeps 12" public/i18n/translations.json` returns 0.

COPY-03 — Landing-bar "Houses" → "Homes"
  AUDIT.md anchor:
    src/pages/index.astro:230  data-i18n="compound.stats.houses">Houses</div>
  Update default text "Houses" → "Homes" AND translations.json key compound.stats.houses
  en → "Homes", fr → "Maisons".

COPY-04 — About CTA "Come and See" → "come and visit!"
  AUDIT.md anchors:
    src/pages/about.astro:198   <h2 data-i18n="about.cta.heading">Come and See</h2>
    public/i18n/translations.json:1451  about.cta.heading "Come and See"
    src/i18n/translations.ts:634        about.cta.heading en/fr
  Required: en → "come and visit!", fr → "venez nous voir !"

COPY-05 — Address verify (already-done task)
  AUDIT.md tag: ✅ Done in 111cf9b. Run grep gate:
    `grep -ni "Renardx\|Crocs au Renardx" src/ public/i18n/` returns 0
    `grep -c "14, 16, 18 Rue des Crocs au Renard" src/layouts/BaseLayout.astro src/pages/about.astro src/pages/contact.astro` returns 1+ on each.

COPY-06 — Home hero leads with "A Private Luxurious Compound, One Hour From Paris" + 10-bedrooms
  AUDIT.md anchor:
    src/pages/index.astro:213  <h1 data-i18n-html="home.title">Your Dream French Vacation Come True</h1>
  Required: re-architect the hero block:
    1. Keep the H1 'Your Dream French Vacation Come True' (the favorite font; client did not ask to remove it; per AUDIT she identifies this header as her favorite font).
    2. ADD beneath the H1 a tagline lead: "A Private Luxurious Compound, One Hour From Paris" then a second line "10 bedrooms · 7 bathrooms · 20 guests" (or use the existing stats-bar which already shows these — collapse the duplicate prose).
    3. Add a "Méréville, France" line below the tagline.
    4. Remove the longer 'A private historic compound in Méréville, France. One hour from Paris.' tagline if it appears elsewhere (BaseLayout description meta is OK to leave).
  i18n keys to update: home.title (data-i18n-html), home.tagline (new), home.location (new); add EN+FR for any new keys.
  Note: per CONTEXT discretion, the executor may keep the existing H1 as-is and add the new tagline+location underneath rather than restructuring the H1. Document the choice in the commit body.

COPY-07 — Le Moulin house naming verify (already-done)
  AUDIT.md tag: ✅ Done in 333254d. Grep gate:
    `grep -ni "Moulin à Rêves" src/pages/homes/le-moulin.astro src/content/pages/le-moulin.md` returns 0
      (the estate-level "Moulin à Rêves" should still appear in src/layouts/BaseLayout.astro, src/pages/index.astro, and src/pages/the-compound.astro — those are correct; only the per-house page must be "Le Moulin").
    `grep -c "Le Moulin" src/pages/homes/le-moulin.astro` returns 1+.

COPY-08 — Compound tagline verify (already-done)
  AUDIT.md tag: ✅ Done in d120aed. Grep gate:
    `grep -c "private walled compound where you are master of your own domaine" src/pages/the-compound.astro` returns 1.
    `grep -c "Peace, privacy. Tranquility" public/i18n/translations.json src/i18n/translations.ts` returns 1+ on each.

COPY-09 — Home hero "Speak with the Concierge" → "Join us!"
  AUDIT.md anchor:
    src/pages/index.astro:217  <a href="/contact/" class="btn btn--ghost">Speak with the Concierge</a>
  Replace text with "Join us!". Wire to a new i18n key home.cta.secondary (en="Join us!", fr="Rejoignez-nous"). Add data-i18n attribute.

COPY-10 — Plan-your-stay "Bonjour!" → "Bienvenue!" (cross-round conflict ⚠️ — newest wins)
  AUDIT.md anchors (4 sites):
    src/pages/index.astro:744                  data-i18n="home.cta.button">Bonjour!</a>
    src/pages/contact.astro:34                 data-i18n="contact.form.heading">Bonjour!</h2>
    src/pages/the-compound.astro:414           data-i18n="compound.form.submit">Bonjour!</button>
    src/pages/explore/index.astro:292          data-i18n="explore.cta.button">Bonjour!</a>
  Update inline text + the 4 keys in translations.json + src/i18n/translations.ts:
    en → "Bienvenue!", fr → "Bienvenue !"
  (Per AUDIT, this resolves the ⚠️ Cross-round Conflict. The contradiction is still flagged in CLIENT-CLARIFICATION.md by Phase 3.)

COPY-11 — Group-types tile copy
  AUDIT.md anchors:
    src/pages/index.astro:117  groupTypes = [{ title: 'Family reunions' }, { title: 'Yoga retreats' }, { title: 'Friends trips' }]
    src/i18n/translations.ts:319  compound.madefor.yoga.title { en: 'Yoga Retreats' }
  Required:
    'Yoga retreats' → 'Yoga, painting, writing retreats'
    'Friends trips' → 'Friends celebrations'
  Update the const array text + matching translations keys
  (compound.madefor.yoga.title and any home.groups.* tile keys discoverable by grep).

COPY-12 — "The Refuge" verify (already-done)
  AUDIT.md tag: ✅ Done in d120aed. Grep gate:
    `grep -c "The Refuge" src/pages/index.astro src/pages/the-compound.astro` returns 1+ on each.
    `grep -ni "The Sanctuary" src/pages/` returns 0 in the contexts above the Hollywood Hideaway block.

COPY-13 — Les Maisons hero rewrite
  AUDIT.md anchor:
    src/pages/homes/index.astro:13  <h1 data-i18n-html="homes.hero.title">Les <span class="serif-italic">Maisons</span></h1>
    src/pages/homes/index.astro:14  <p class="hero__tagline">Three maisons. Sleeps 20 across 10 bedrooms.</p>
  Required (per AUDIT atomic_subactions):
    H1 → "Bienvenue Chez Vous" (no italic span)
    Tagline → "All size groups welcome. Rent 1 home or enjoy all 3."
    FR for tagline: "Toutes tailles de groupes bienvenues. Louez 1 maison ou profitez des 3."
    'Bienvenue Chez Vous' is bilingual-neutral (FR phrase used in both).
  Update: src/pages/homes/index.astro :13 + :14 + translations.json keys homes.hero.title and homes.hero.tagline (en+fr) + src/i18n/translations.ts equivalents.

COPY-14 — Delete "Three stone houses around shared gardens. Each its own world; together, the compound."
  AUDIT.md anchors:
    public/i18n/translations.json:131  contains the exact phrase
    src/layouts/BaseLayout.astro:12    description = "Moulin à Rêves — A compound of three stone houses..."
                                       (this is the meta-description; per AUDIT-rationale it does NOT need to be deleted; the visible-on-page text is what the client wants gone. Verify by grepping for the phrase in rendered .astro/.md files; if not found in any rendered location, the json key is the only deletion target.)
  Required:
    Set the translations.json key value (whichever one contains the phrase) en/fr to "" (empty string) OR remove the key entirely if no anchor in src/ references it.
    Mirror in src/i18n/translations.ts (delete or empty).
    Final grep gate: `grep -rni "three stone houses around shared gardens" src/ public/i18n/ | grep -v '^#' | wc -l` returns 0.
    Leaving the BaseLayout meta description is acceptable (not user-visible on-page text).

COPY-15 — Add word "size" to contact tagline
  AUDIT.md anchors (note: not an explicit row but evidence appears across rows):
    public/i18n/translations.json:1483  "contact.hero.tagline" en: "Tell us your dates, your group, your dreams. We'll take it from there."
    src/i18n/translations.ts:642        "contact.hero.tagline" en: "Tell us your dates, your group size, your dreams. We'll take it from there."  (already has "size" — drift)
  Required:
    Update public/i18n/translations.json key contact.hero.tagline en to:
      "Tell us your dates, your group size, your dreams. We'll take it from there."
    Update fr to:
      "Dites-nous vos dates, la taille de votre groupe, vos envies. Nous nous occupons du reste."
    (src/i18n/translations.ts:642 already correct — verify only.)
    Final grep gate: `grep -c "your group size, your dreams" public/i18n/translations.json` returns 1.
</relevant-audit-rows>
</context>

<tasks>

<task type="auto">
  <name>Task 1: COPY-01 — replace "When you can stay" with "Join us" across 4 availability headings (en+fr)</name>
  <files>public/i18n/translations.json, src/i18n/translations.ts</files>
  <action>
Per AUDIT row "When You Can Stay → Join us" (5 bullets across pages 5, 6, 11 of MMM may.5.pdf):

1. In `public/i18n/translations.json` update these keys (lines per AUDIT — verify with grep):
   - `home.availability.heading`         → en: "Join us", fr: "Rejoignez-nous"
   - `le-moulin.availability.heading`    → en: "Join us", fr: "Rejoignez-nous"
   - `hideaway.availability.heading`     → en: "Join us", fr: "Rejoignez-nous"
   - `riviere.availability.heading`      → en: "Join us", fr: "Rejoignez-nous"

   Remove the `<span class="serif-italic">Stay</span>` markup entirely (no italic on final word per TYPOG-01).

2. In `src/i18n/translations.ts` apply identical updates to the same four keys.

3. Do NOT alter the existing `Join <span class="serif-italic">us</span>` headings on the AvailabilityCalendar component invocations in src/pages/contact.astro:23, src/pages/index.astro:752, src/pages/homes/le-moulin.astro:333, src/pages/homes/hollywood-hideaway.astro:294, src/pages/homes/maison-de-la-riviere.astro:267 — those become italic-cleanup work in plan 02 (TYPOG-01).

Commit message: `copy(02-01): COPY-01 — replace "When you can stay" with "Join us" (en+fr)`
  </action>
  <verify>
    <automated>grep -rni "when you can stay\|where you can stay" src/ public/i18n/ | grep -v '^#' | wc -l    # expect 0</automated>
  </verify>
  <done>Four availability.heading keys say "Join us" / "Rejoignez-nous" in both translations.json and translations.ts; grep for old phrase returns 0; one commit landed.</done>
</task>

<task type="auto">
  <name>Task 2: COPY-02 — Le Moulin amenities footer "Sleeps 10 across 8 beds" (en+fr)</name>
  <files>public/i18n/translations.json, src/i18n/translations.ts</files>
  <action>
Per AUDIT row p.3 (May 1): "now we say sleeps 12 in 10 beds - charge it to sleeps 10 in 8 beds."

1. Run `grep -n "Sleeps 12" public/i18n/translations.json` to locate the stale key (AUDIT cites line 1902, key `le-moulin.amenities.amenity.9`).
2. Update that key in `public/i18n/translations.json`:
   - en → "Sleeps 10 across 8 beds"
   - fr → "Couchage pour 10 sur 8 lits"
3. Mirror in `src/i18n/translations.ts` if the key is present (search; if absent, add it under the le-moulin amenities block to keep parity).
4. Verify `src/pages/homes/le-moulin.astro:187` already reads `'Sleeps 10 across 8 beds'` (per AUDIT it does — verify only, do not change).

Commit message: `copy(02-01): COPY-02 — Le Moulin footer "Sleeps 10 across 8 beds" (en+fr)`
  </action>
  <verify>
    <automated>grep -ni "Sleeps 12" public/i18n/translations.json src/i18n/translations.ts | wc -l    # expect 0</automated>
  </verify>
  <done>The amenity.9 key reads "Sleeps 10 across 8 beds" / "Couchage pour 10 sur 8 lits"; grep for "Sleeps 12" anywhere in src/ public/i18n/ returns 0.</done>
</task>

<task type="auto">
  <name>Task 3: COPY-03 — landing stats-bar "Houses" → "Homes" (en+fr)</name>
  <files>src/pages/index.astro, public/i18n/translations.json, src/i18n/translations.ts</files>
  <action>
Per AUDIT row p.1 (May 5): "please change the word houses to homes so it reads three homes".

1. In `src/pages/index.astro:230` replace the default text content `Houses` with `Homes` (keep the `data-i18n="compound.stats.houses"` attribute — do NOT rename the key, the historical name is fine).
2. Update `public/i18n/translations.json` key `compound.stats.houses`:
   - en → "Homes"
   - fr → "Maisons"
3. Mirror in `src/i18n/translations.ts`.

Other appearances of "Houses" (e.g., on the-compound.astro stats-bar, BaseLayout description meta) are NOT included in this requirement — leave them. The client specifically referenced the landing-page bar.

Commit message: `copy(02-01): COPY-03 — landing stats bar "Houses" → "Homes" (en+fr)`
  </action>
  <verify>
    <automated>grep -n 'data-i18n="compound.stats.houses">Homes' src/pages/index.astro && grep -A2 '"compound.stats.houses"' public/i18n/translations.json | grep -E '"Homes"|"Maisons"'</automated>
  </verify>
  <done>Stats-bar label renders "Homes" in EN and "Maisons" in FR; one commit landed.</done>
</task>

<task type="auto">
  <name>Task 4: COPY-04 — About CTA "Come and See" → "come and visit!" (en+fr)</name>
  <files>src/pages/about.astro, public/i18n/translations.json, src/i18n/translations.ts</files>
  <action>
Per AUDIT row p.1 (May 5): "replace 'come and see' with 'come and visit!'".

1. `src/pages/about.astro:198` — change the H2 text content from `Come and See` to `come and visit!` (keep the `data-i18n="about.cta.heading"` attribute).
2. `public/i18n/translations.json` key `about.cta.heading` → en: "come and visit!", fr: "venez nous voir !"
3. `src/i18n/translations.ts:634` key `about.cta.heading` → en: "come and visit!", fr: "venez nous voir !"

Commit message: `copy(02-01): COPY-04 — About CTA "come and visit!" (en+fr)`
  </action>
  <verify>
    <automated>grep -c "come and visit!" src/pages/about.astro public/i18n/translations.json src/i18n/translations.ts    # expect each ≥ 1</automated>
  </verify>
  <done>About-page CTA reads "come and visit!" in render + both i18n stores; one commit landed.</done>
</task>

<task type="auto">
  <name>Task 5: COPY-05 — verify address already canonicalized (already-done; verify-only)</name>
  <files>(none — verification only)</files>
  <action>
AUDIT.md tags COPY-05 as ✅ Done in commit 111cf9b. This task confirms no drift since.

1. Run the grep gates listed under <relevant-audit-rows> COPY-05.
2. If gates pass: write a one-line note to plan SUMMARY confirming no commit required.
3. If gates fail (drift discovered): create a remediation commit `fix(02-01): COPY-05 — re-canonicalize address` updating the offending file.

No commit required if pass.
  </action>
  <verify>
    <automated>! grep -ni "Renardx\|Crocs au Renardx" src/ public/i18n/ && grep -c "14, 16, 18 Rue des Crocs au Renard" src/layouts/BaseLayout.astro</automated>
  </verify>
  <done>Address gates pass; SUMMARY notes COPY-05 verified-clean.</done>
</task>

<task type="auto">
  <name>Task 6: COPY-06 — Home hero leads with "A Private Luxurious Compound, One Hour From Paris" + 10-bedrooms info; relocate "Méréville, France" below tagline (en+fr)</name>
  <files>src/pages/index.astro, public/i18n/translations.json, src/i18n/translations.ts</files>
  <action>
Per AUDIT row p.7 (April 30) and p.2 (May 1): "Move 'Mereville France' from above 'Your dream french vacation come true' to under it" and "Can you start with A Private Luxurious Compound, One Hour From Paris. Then have 10 bedrooms..."

The current hero block (src/pages/index.astro:208-220) is:
  <h1 data-i18n-html="home.title">Your Dream French Vacation Come True</h1>
  <div class="hero__actions">...</div>

The stats-bar below already shows "A private compound one hour from Paris." (line 226) and "3 Houses / 10 Bedrooms / 7 Bathrooms / 20 Guests".

Implementation (per CONTEXT.md client preferences — H1 is the favorite font; do NOT remove it):

1. Beneath the H1 (between line 213 and line 214), insert a new tagline block:
     <p class="hero__tagline" data-i18n="home.hero.tagline">A Private Luxurious Compound, One Hour From Paris</p>
     <p class="hero__location" data-i18n="home.hero.location">Méréville, France</p>
   These render under the H1 and above the .hero__actions buttons. Reuse existing .hero__tagline class if present in global.css; otherwise add a minimal scoped style block on this page.

2. Add the two new i18n keys to public/i18n/translations.json AND src/i18n/translations.ts:
     home.hero.tagline   → en: "A Private Luxurious Compound, One Hour From Paris", fr: "Un domaine privé de luxe, à une heure de Paris"
     home.hero.location  → en: "Méréville, France", fr: "Méréville, France"

3. The existing stats-bar__intro line 226 ("A private compound one hour from Paris.") is now duplicative with the new hero tagline. Remove that <p data-i18n="home.stats.intro"> from index.astro (lines around 226) AND mark the corresponding home.stats.intro key in translations.json + translations.ts as empty string OR delete the key. Use empty string to avoid breaking any other anchor that may reference it.

4. The longer description "A private historic compound in Méréville, France. One hour from Paris" referenced in the bullet — search for this exact phrase in rendered files and remove if it appears as user-visible text (the BaseLayout `description=` meta string is OK to leave; it is not user-visible).

Commit message: `copy(02-01): COPY-06 — home hero leads "A Private Luxurious Compound" + Méréville below (en+fr)`
  </action>
  <verify>
    <automated>grep -c "A Private Luxurious Compound, One Hour From Paris" public/i18n/translations.json src/pages/index.astro    # expect ≥ 1 each
grep -c "home.hero.location" public/i18n/translations.json    # expect ≥ 1
! grep -c "A private compound one hour from Paris\." src/pages/index.astro    # expect 0 (removed duplicative line)</automated>
  </verify>
  <done>Home hero renders H1, then "A Private Luxurious Compound, One Hour From Paris" tagline, then "Méréville, France" location, then CTAs; stats-bar intro line removed; new keys exist in both i18n stores en+fr; one commit landed.</done>
</task>

<task type="auto">
  <name>Task 7: COPY-07 — verify Le Moulin renamed (already-done; verify-only)</name>
  <files>(none — verification only)</files>
  <action>
AUDIT.md tags COPY-07 as ✅ Done in commit 333254d.

1. Verify by grep:
   - `grep -ni "Moulin à Rêves" src/pages/homes/le-moulin.astro src/content/pages/le-moulin.md` returns 0 matches in user-visible text contexts (note: the Schema.org JSON-LD block at line ~210 of le-moulin.astro DOES include `${cms.title} — Moulin à Rêves` as the estate-context name, which is correct and intentional; that one match is acceptable. Document it in SUMMARY.)
   - `grep -c '"Le Moulin"' src/content/pages/le-moulin.md` returns 1.
2. If verification passes: SUMMARY note only, no commit.
3. If drift found: remediation commit `fix(02-01): COPY-07 — restore Le Moulin naming`.
  </action>
  <verify>
    <automated>grep -c '"Le Moulin"' src/content/pages/le-moulin.md && grep -c "title=\"Le Moulin" src/pages/homes/le-moulin.astro</automated>
  </verify>
  <done>Le Moulin naming verified; SUMMARY records the schema.org estate-name reference as intentional.</done>
</task>

<task type="auto">
  <name>Task 8: COPY-08 — verify compound tagline already shipped (already-done; verify-only)</name>
  <files>(none — verification only)</files>
  <action>
AUDIT.md tags COPY-08 as ✅ Done in d120aed.

1. Grep gate per <relevant-audit-rows> COPY-08:
   - `grep -c "private walled compound where you are master of your own domaine" src/pages/the-compound.astro` returns ≥ 1
   - `grep -c "Peace, privacy. Tranquility" public/i18n/translations.json src/i18n/translations.ts` returns ≥ 1 on each
2. Pass → SUMMARY note only.
3. Fail → remediation commit `fix(02-01): COPY-08 — restore compound tagline`.
  </action>
  <verify>
    <automated>grep -c "private walled compound where you are master of your own domaine" src/pages/the-compound.astro public/i18n/translations.json src/i18n/translations.ts</automated>
  </verify>
  <done>Compound tagline verified present in render + both i18n stores.</done>
</task>

<task type="auto">
  <name>Task 9: COPY-09 — home hero "Speak with the Concierge" → "Join us!" (en+fr)</name>
  <files>src/pages/index.astro, public/i18n/translations.json, src/i18n/translations.ts</files>
  <action>
Per AUDIT row p.8 (April 30): "Buttons on home page: 'Speak with a concierge' brings us to this page... Replace Get in touch with the words 'Join us!'".

1. `src/pages/index.astro:217` currently reads:
     <a href="/contact/" class="btn btn--ghost">Speak with the Concierge</a>
   Change to:
     <a href="/contact/" class="btn btn--ghost" data-i18n="home.cta.secondary">Join us!</a>

2. Add the new i18n key:
     `public/i18n/translations.json` → home.cta.secondary: { en: "Join us!", fr: "Rejoignez-nous !" }
     `src/i18n/translations.ts`      → home.cta.secondary: { en: "Join us!", fr: "Rejoignez-nous !" }

3. The primary button on line 216 (`<a href="/homes/" class="btn btn--white" data-i18n="home.cta">Discover the Maisons</a>`) is left as-is — client's note targets the secondary "Speak with the Concierge" CTA specifically.

Commit message: `copy(02-01): COPY-09 — home hero secondary CTA "Join us!" (en+fr)`
  </action>
  <verify>
    <automated>! grep -c "Speak with the Concierge" src/pages/index.astro    # expect 0
grep -c '"home.cta.secondary"' public/i18n/translations.json    # expect 1</automated>
  </verify>
  <done>Home hero secondary CTA reads "Join us!" with i18n attribute; new key in both stores; one commit landed.</done>
</task>

<task type="auto">
  <name>Task 10: COPY-10 — "Bonjour!" → "Bienvenue!" across 4 sites (cross-round conflict resolution; en+fr)</name>
  <files>src/pages/index.astro, src/pages/contact.astro, src/pages/the-compound.astro, src/pages/explore/index.astro, public/i18n/translations.json, src/i18n/translations.ts</files>
  <action>
Per AUDIT ⚠️ Cross-round Conflict row: April 30 round wants "Bienvenue!"; resolved per "newest round wins" with the layered-PDF newest-on-top rule (May 5 didn't address the bonjour/bienvenue choice, so April 30's wish remains active per AUDIT.md).

Update the four anchor sites + four i18n keys + ts mirror:

1. `src/pages/index.astro:744` — change `>Bonjour!</a>` to `>Bienvenue!</a>` (keep data-i18n="home.cta.button").
2. `src/pages/contact.astro:34` — change `>Bonjour!</h2>` to `>Bienvenue!</h2>` (keep data-i18n="contact.form.heading").
3. `src/pages/the-compound.astro:414` — change `>Bonjour!</button>` to `>Bienvenue!</button>` (keep data-i18n="compound.form.submit").
4. `src/pages/explore/index.astro:292` — change `>Bonjour!</a>` to `>Bienvenue!</a>` (keep data-i18n="explore.cta.button").

5. In `public/i18n/translations.json` update the 4 keys:
   - home.cta.button         → en: "Bienvenue!", fr: "Bienvenue !"
   - contact.form.heading    → en: "Bienvenue!", fr: "Bienvenue !"
   - compound.form.submit    → en: "Bienvenue!", fr: "Bienvenue !"
   - explore.cta.button      → en: "Bienvenue!", fr: "Bienvenue !"

6. Mirror in `src/i18n/translations.ts`.

Commit message: `copy(02-01): COPY-10 — "Bonjour!" → "Bienvenue!" across 4 CTAs (en+fr)`
  </action>
  <verify>
    <automated>! grep -rn "Bonjour!" src/pages/ public/i18n/translations.json src/i18n/translations.ts    # expect 0</automated>
  </verify>
  <done>All four "Bonjour!" CTAs render "Bienvenue!"; four keys updated en+fr in both i18n stores; one commit landed.</done>
</task>

<task type="auto">
  <name>Task 11: COPY-11 — group-types tile copy ("Yoga, painting, writing retreats" + "Friends celebrations") (en+fr)</name>
  <files>src/pages/index.astro, public/i18n/translations.json, src/i18n/translations.ts</files>
  <action>
Per AUDIT row p.4 (May 1): "Change yoga retreats to yoga, painting, writing retreats. Change friends trips to Friends celebrations."

1. `src/pages/index.astro:117-119` — update the const groupTypes array:
   - `{ title: 'Yoga retreats', ... }`  →  `{ title: 'Yoga, painting, writing retreats', ... }`
   - `{ title: 'Friends trips', ... }`   →  `{ title: 'Friends celebrations', ... }`
   - Leave 'Family reunions' untouched.

2. The titles are surfaced through i18n keys. Search for them:
   - `grep -n "compound.madefor.yoga\|home.groups\|made-for" public/i18n/translations.json src/i18n/translations.ts`
   - Update `compound.madefor.yoga.title` (cited at src/i18n/translations.ts:319) to en: "Yoga, painting, writing retreats", fr: "Retraites yoga, peinture, écriture"
   - If a corresponding `friends` key exists (search for "Friends trips" / "amis"), update it: en: "Friends celebrations", fr: "Célébrations entre amis"
   - If only a generic home.groups.* tile-title pattern is used, update those keys to match.

3. Mirror all changes in src/i18n/translations.ts.

Commit message: `copy(02-01): COPY-11 — group types "yoga, painting, writing retreats" + "friends celebrations" (en+fr)`
  </action>
  <verify>
    <automated>grep -c "Yoga, painting, writing retreats" src/pages/index.astro public/i18n/translations.json src/i18n/translations.ts    # expect ≥ 1 each
grep -c "Friends celebrations" src/pages/index.astro public/i18n/translations.json src/i18n/translations.ts    # expect ≥ 1 each
! grep -c "Yoga retreats\|Friends trips" src/pages/index.astro    # expect 0</automated>
  </verify>
  <done>groupTypes array + matching i18n keys updated to new copy in both en and fr; one commit landed.</done>
</task>

<task type="auto">
  <name>Task 12: COPY-12 — verify "The Refuge" eyebrow already shipped (already-done; verify-only)</name>
  <files>(none — verification only)</files>
  <action>
AUDIT.md tags COPY-12 as ✅ Done in d120aed.

1. Grep gate:
   - `grep -c "The Refuge" src/pages/index.astro src/pages/the-compound.astro src/pages/homes/index.astro src/pages/homes/le-moulin.astro src/pages/homes/maison-de-la-riviere.astro` returns ≥ 1 on each.
   - `grep -B2 -A2 "Hollywood Hideaway" src/pages/index.astro | grep -c "The Sanctuary"` returns 0.
2. Pass → SUMMARY note.
3. Fail → remediation commit `fix(02-01): COPY-12 — restore "The Refuge" eyebrow`.
  </action>
  <verify>
    <automated>grep -c "The Refuge" src/pages/index.astro src/pages/the-compound.astro    <automated>grep -c "The Refuge" src/pages/index.astro src/pages/the-compound.astro src/pages/homes/index.astro</automated>
  </verify>
  <done>The Refuge eyebrow verified present on all expected pages.</done>
</task>

<task type="auto">
  <name>Task 13: COPY-13 — Les Maisons hero "Bienvenue Chez Vous" + new tagline (en+fr)</name>
  <files>src/pages/homes/index.astro, public/i18n/translations.json, src/i18n/translations.ts</files>
  <action>
Per AUDIT row p.12 (April 30): "Below the photo write: Header: Bienvenue Chez Vous Smaller text: All size groups welcome."

1. `src/pages/homes/index.astro:13-14` currently:
     <h1 class="hero__title" data-i18n-html="homes.hero.title">Les <span class="serif-italic">Maisons</span></h1>
     <p class="hero__tagline" data-i18n="homes.hero.tagline">Three maisons. Sleeps 20 across 10 bedrooms.</p>

   Replace with:
     <h1 class="hero__title" data-i18n="homes.hero.title">Bienvenue Chez Vous</h1>
     <p class="hero__tagline" data-i18n="homes.hero.tagline">All size groups welcome. Rent 1 home or enjoy all 3.</p>

   Note: H1 attribute changes from `data-i18n-html` to `data-i18n` (no inline span anymore — plain text).

2. Update i18n keys in `public/i18n/translations.json`:
   - homes.hero.title    → en: "Bienvenue Chez Vous", fr: "Bienvenue Chez Vous"  (bilingual-neutral phrase)
   - homes.hero.tagline  → en: "All size groups welcome. Rent 1 home or enjoy all 3.", fr: "Toutes tailles de groupes bienvenues. Louez 1 maison ou profitez des 3."

3. Mirror in `src/i18n/translations.ts`.

Commit message: `copy(02-01): COPY-13 — Les Maisons hero "Bienvenue Chez Vous" (en+fr)`
  </action>
  <verify>
    <automated>grep -c "Bienvenue Chez Vous" src/pages/homes/index.astro public/i18n/translations.json src/i18n/translations.ts &amp;&amp; ! grep -c "Three maisons. Sleeps 20" src/pages/homes/index.astro</automated>
  </verify>
  <done>Les Maisons hero renders new H1 + tagline; both i18n stores updated en+fr; old "Three maisons" text removed; one commit landed.</done>
</task>

<task type="auto">
  <name>Task 14: COPY-14 — delete "Three stone houses around shared gardens" phrase (en+fr)</name>
  <files>public/i18n/translations.json, src/i18n/translations.ts, src/pages/the-compound.astro (if rendered there)</files>
  <action>
Per AUDIT row p.7 (April 30): "Delete this description below it: 'Three stone houses around shared gardens.'"

1. Locate the phrase via grep:
   - `grep -rn "Three stone houses around shared gardens" public/i18n/translations.json src/i18n/ src/pages/ src/content/` 
   AUDIT cites public/i18n/translations.json:131 as the canonical location.

2. In `public/i18n/translations.json`: set the en and fr values of the matching key to empty string `""` (do NOT delete the key — other code may still reference it; an empty string is the safer move).

3. In `src/i18n/translations.ts`: same — set en and fr to "".

4. If a hardcoded copy of the phrase appears in any rendered .astro/.md (likely `src/pages/the-compound.astro` or `src/pages/index.astro`), delete the surrounding <p> or text fragment.

5. The `src/layouts/BaseLayout.astro:12` description meta string ("Moulin à Rêves — A compound of three stone houses...") may legitimately stay — that is the SEO meta description, not user-visible page copy. Verify it does NOT also need deletion by checking the AUDIT-rationale comment: only the user-visible text is what the client wants gone.

Commit message: `copy(02-01): COPY-14 — delete "Three stone houses around shared gardens" (en+fr)`
  </action>
  <verify>
    <automated>grep -rni "three stone houses around shared gardens" src/pages/ src/content/ public/i18n/translations.json src/i18n/translations.ts | grep -v "^.*BaseLayout\.astro" | wc -l    # expect 0 (BaseLayout meta description allowed)</automated>
  </verify>
  <done>Phrase no longer renders in user-visible page copy; key set to empty string in both i18n stores; one commit landed.</done>
</task>

<task type="auto">
  <name>Task 15: COPY-15 — add "size" to contact tagline (en+fr)</name>
  <files>public/i18n/translations.json, src/i18n/translations.ts (verify only)</files>
  <action>
Per AUDIT row p.4 (May 1) referenced in multiple bullets: client wants the contact tagline to read "Tell us your dates, your group size, your dreams." (note: the word "size").

Current state per AUDIT:
  - `public/i18n/translations.json:1483` — currently "Tell us your dates, your group, your dreams. We'll take it from there." (missing "size")
  - `src/i18n/translations.ts:642` — currently has "your group size" (already correct — drift between the two stores)

1. In `public/i18n/translations.json` update key `contact.hero.tagline`:
   - en → "Tell us your dates, your group size, your dreams. We'll take it from there."
   - fr → "Dites-nous vos dates, la taille de votre groupe, vos envies. Nous nous occupons du reste."

2. Verify `src/i18n/translations.ts:642` already has the correct phrasing (per AUDIT it does); no change needed there. If grep shows drift, sync.

Commit message: `copy(02-01): COPY-15 — add "size" to contact tagline (en+fr)`
  </action>
  <verify>
    <automated>grep -c "your group size, your dreams" public/i18n/translations.json src/i18n/translations.ts    # expect ≥ 1 each</automated>
  </verify>
  <done>contact.hero.tagline reads "Tell us your dates, your group size, your dreams. We'll take it from there." in BOTH stores en+fr; one commit landed.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| build-time → runtime | Astro reads .md/.astro/.ts at build; runtime overlay fetches translations.json from /api/translations (proxied to GitHub raw). No new boundary introduced by copy edits. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-01 | Tampering | translations.json | accept | This file is read-only at runtime; client edits land via the editor SPA → GitHub commit pipeline (existing). Phase 2 changes commit text only — no new attack surface. |
| T-02-02 | Information Disclosure | committed copy | accept | All copy is intended for public marketing. No PII, no secrets, no internal info. |
| T-02-03 | Injection (XSS) | data-i18n-html anchors | mitigate | Per CLAUDE.md and i18n discipline above: any value containing markup MUST use data-i18n-html (innerHTML); plain text MUST use data-i18n (textContent). Plan tasks explicitly call out which attribute applies to each anchor. The setLanguage() runtime overlay does not sanitize, so editorial copy is the trust boundary — Phase 2 ships only owner-authored phrases (no user input). |
</threat_model>

<verification>
## Phase-level success criteria for this plan

1. `grep -rni "when you can stay\|where you can stay" src/ public/i18n/ | grep -v "^#" | wc -l` returns 0
2. `grep -ni "Sleeps 12" public/i18n/translations.json` returns 0; `grep -c "Sleeps 10 across 8 beds" public/i18n/translations.json` returns ≥ 1
3. `grep -c "Homes" public/i18n/translations.json` shows the new compound.stats.houses value present (en); fr shows "Maisons"
4. `grep -c "come and visit" src/pages/about.astro public/i18n/translations.json src/i18n/translations.ts` returns ≥ 1 on each
5. `grep -c "14, 16, 18 Rue des Crocs au Renard" src/layouts/BaseLayout.astro` returns ≥ 1 (verify-only)
6. `grep -c "A Private Luxurious Compound, One Hour From Paris" src/pages/index.astro public/i18n/translations.json` returns ≥ 1 each
7. `grep -ni "Moulin à Rêves" src/pages/homes/le-moulin.astro` returns 0 outside the schema.org JSON-LD block (verify-only)
8. `grep -c "Speak with the Concierge" src/pages/index.astro` returns 0
9. `grep -rn "Bonjour!" src/pages/ public/i18n/translations.json src/i18n/translations.ts` returns 0
10. `grep -c "Yoga, painting, writing retreats\|Friends celebrations" src/pages/index.astro` returns ≥ 2
11. `grep -c "Bienvenue Chez Vous" src/pages/homes/index.astro public/i18n/translations.json` returns ≥ 1 each
12. `grep -rni "three stone houses around shared gardens" src/pages/ src/content/ | wc -l` returns 0
13. `grep -c "your group size, your dreams" public/i18n/translations.json src/i18n/translations.ts` returns ≥ 1 each
14. Build does not error: `npm run build` exits 0 (run after final task; `prebuild` will guard public/ cleanliness)
15. 13 atomic commits land on branch `feat/may-5-2026-photos` (15 tasks − 4 verify-only no-commit + remediation if any drift discovered)
</verification>

<success_criteria>
- All 15 COPY-* requirements (COPY-01 through COPY-15) reflected in the codebase, with verify-only tasks confirming the four already-done items (COPY-05, 07, 08, 12).
- Every translatable change updates BOTH `public/i18n/translations.json` (runtime overlay) AND `src/i18n/translations.ts` (typed seed) — no FR-only or EN-only drift left behind.
- Each task that produces code changes lands as ONE atomic commit on `feat/may-5-2026-photos` with a `copy(02-01): COPY-NN — ...` subject line.
- Final `npm run build` succeeds.
</success_criteria>

<output>
After completion, create `.planning/phases/02-ship-the-clear-edits/02-01-SUMMARY.md` recording:
- Which 11 tasks produced commits (commit hashes)
- Which 4 tasks were verify-only (note any drift caught + remediation)
- Any deviations from this plan with rationale
- Confirmation that the verification grep gates all pass
</output>
