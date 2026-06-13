# FRENCH-TODO — review needed

These French strings were either auto-translated during the June 13 estate-repositioning
batch or left in English. Most are straightforward; the ones below are judgment calls a
native speaker should confirm before they're considered final. Runtime source of truth is
`public/i18n/translations.json` (key → `{ en, fr }`).

## New home-page copy — provided FR, please verify wording/tone

| Key | EN | FR provided (review) |
|---|---|---|
| `home.subtitle` | The Mill of Dreams | Le Moulin des Rêves |
| `home.luxuryspace.heading` | The Luxury of Space | Le Luxe de l'Espace |
| `home.luxuryspace.text` | Encircled by stone walls… be inspired. | (full sentence translated — verify flow) |
| `home.homes.intro` | Although the estate offers ten bedrooms… privacy and space. | (translated — verify "hôtes pour la nuit") |
| `home.refined.heading` | Refined Country Living | **L'Art de Vivre à la Campagne** (localized, not literal — confirm preferred) |
| `home.refined.text` | Historic charm meets modern luxury. | Le charme historique rencontre le luxe moderne. |
| `home.groups.heading` | The Art of Gathering | **L'Art de se Retrouver** (confirm vs. "L'Art de se Réunir") |
| `home.groups.sub` | A private estate designed for meaningful time together. | Un domaine privé conçu pour des moments précieux partagés. |
| `home.intro.text` | Just one hour from Paris… still flows through Le Moulin. | (translated — verify "Ancien moulin à eau") |

## English-only (no i18n key) — FR shows English

- Home section heading **"Effortless Living"** (was "We Make It Easy"): a hardcoded `<h2>`
  in `src/pages/index.astro` with no `data-i18n` attribute, so French visitors see English.
  This matches the prior behaviour (the old heading was English-only too). If a FR version is
  wanted, add a `home.easy.heading` key + `data-i18n` on the `<h2>`.

## Capacity / rename FR — auto-translated number/word swaps (low risk)

These were simple swaps (vingt→dix, sept→six, cinq→quatre, 20→10) or word changes and are
considered safe, but listed for completeness: `home.exp.events.desc`, `homes.rentall.text`,
`about.place.p4` (legacy house names corrected), `groups.hero.tagline` (room for twenty →
room to gather → « de la place pour se retrouver »), `groups.yoga.p2` (twenty→ten),
the three `groups.*.cta` arrow removals, `art.hero.subtitle` (dropped "— BROUILLON").

## Phase 2 — house pages (Le Moulin / Hollywood Hideaway / Maison de la Rivière)

### Story copy — FR drafted, please verify (native-speaker review)

These story paragraphs + the HH tagline now have French in `public/i18n/translations.json`.
The drafts are idiomatic but contain proper nouns and tone calls — confirm before final:

- `le-moulin.narrative.summary`, `le-moulin.narrative.p1`, `le-moulin.narrative.p2` — Le Moulin
  story (Borrah Minevitch / Maxim's / Folies Bergère). Check "salle à manger d'apparat" tone.
- `hideaway.hero.tagline` — "Un refuge secret à la campagne — jusqu'à 6 personnes."
- `hideaway.narrative.summary`, `hideaway.narrative.p1` — Hollywood Hideaway story
  (Bert Fields / Barbara Guggenheim). Check "gloriette" (gazebo) and "conseillère en art".
- `riviere.narrative.summary` — Maison de la Rivière story.

### FR provided this pass — please verify wording/tone

| Key(s) | EN | FR provided (review) |
|---|---|---|
| `*.bedrooms.heading` (all 3 houses) | The Bedrooms | Les Chambres |
| `*.living.heading` (all 3 houses) | The Living Spaces | Les Espaces de Vie (confirm vs. "Les Pièces à Vivre") |
| `le-moulin.bedrooms.intro` | 5 Bedrooms • 4 Bathrooms • 8 Beds • Sleeps 10 | 5 Chambres • 4 Salles de bain • 8 Lits • Couchage 10 |
| `hideaway.bedrooms.intro` | 4 Bedrooms • 2 Bathrooms • 4 Beds • Sleeps 6 | 4 Chambres • 2 Salles de bain • 4 Lits • Couchage 6 |
| `riviere.bedrooms.intro` | 2 Bedrooms • 1 Bathroom • 3 Beds • Sleeps 4 | 2 Chambres • 1 Salle de bain • 3 Lits • Couchage 4 |

### English-only (no i18n key) — FR shows English

- House-page **bedroom `qualities`** lines (e.g. "King bedroom · En-suite shower · Upstairs")
  render without a `data-i18n` key in `RoomShowcase.astro`, so French visitors see English.
  Matches prior behaviour (they were emoji English before). Add keys if FR is wanted.
- Cross-link / listing **card descriptions** (short house blurbs) are static `<p>` with no key.

## Non-runtime note

`src/i18n/translations.ts` is the legacy seed (not used at runtime). Its `home.intro.text`
(line 49) still holds the OLD English intro with "20 guests". Harmless (translations.json
overrides at runtime) but flagged so a future re-seed doesn't reintroduce it.
