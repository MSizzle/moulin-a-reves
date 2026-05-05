# Codebase Structure

**Analysis Date:** 2026-05-05

## Directory Layout

```
moulin-a-reves/
├── astro.config.mjs        # Astro config — output: 'static', Vercel adapter, sitemap
├── middleware.ts           # Vercel Edge middleware — rewrites editor.* host to /editor
├── vercel.json             # /admin and /editor route rewrites + analytics redirect
├── tsconfig.json           # extends astro/tsconfigs/strict
├── package.json            # Node ≥24, deps: astro 6.x, gray-matter, sharp, @vercel/edge
├── netlify.toml            # legacy (Netlify), site is on Vercel
├── .nvmrc                  # 24
│
├── src/
│   ├── pages/              # Astro routes (file-based)
│   │   ├── index.astro             # /                 (homepage, 758 lines)
│   │   ├── about.astro             # /about/
│   │   ├── catering.astro          # /catering/
│   │   ├── contact.astro           # /contact/
│   │   ├── gallery.astro           # /gallery/
│   │   ├── the-compound.astro      # /the-compound/    (excluded from sitemap)
│   │   ├── wellness.astro          # /wellness/
│   │   ├── success.astro           # /success/         (excluded from sitemap)
│   │   ├── homes/
│   │   │   ├── index.astro             # /homes/
│   │   │   ├── le-moulin.astro         # /homes/le-moulin/
│   │   │   ├── hollywood-hideaway.astro
│   │   │   └── maison-de-la-riviere.astro
│   │   ├── explore/
│   │   │   └── index.astro             # /explore/
│   │   ├── journal/
│   │   │   ├── spring-in-barbizon.astro
│   │   │   ├── fontainebleau-forest-guide.astro
│   │   │   └── planning-family-reunion-france.astro
│   │   └── api/                # Server endpoints (export const prerender = false;)
│   │       ├── availability.ts         # GET — Airbnb + VRBO ICS aggregator
│   │       ├── translations.ts         # GET — proxies translations.json from GitHub
│   │       ├── contact.ts              # POST — Airtable contact table
│   │       ├── compound.ts             # POST — Airtable compound table
│   │       ├── newsletter.ts           # POST — Airtable newsletter table
│   │       ├── auth/login.ts           # GET (login page) + POST (issue cookie)
│   │       └── site/
│   │           ├── index.ts            # GET — dashboard config
│   │           ├── save.ts             # POST — preview save → GitHub PUT
│   │           └── publish.ts          # POST — publish → GitHub PUT
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro    # 1810 lines — head/nav/footer/lang-toggle/popup
│   │
│   ├── components/             # Astro components (all .astro)
│   │   ├── AmenitiesSection.astro      # 202 lines
│   │   ├── AvailabilityCalendar.astro  # 461 lines
│   │   ├── PhotoCarousel.astro         # 335 lines
│   │   └── RoomShowcase.astro          # 134 lines
│   │
│   ├── content/                # Frontmatter-only markdown (NOT astro:content collections)
│   │   ├── homes/              # Per-home stats + amenities
│   │   │   ├── le-moulin.md
│   │   │   ├── la-grange.md
│   │   │   └── le-jardin.md
│   │   ├── pages/              # Page-level hero copy + galleries
│   │   │   ├── homepage.md
│   │   │   ├── about.md
│   │   │   ├── compound.md
│   │   │   ├── le-moulin.md             # Le Moulin gallery (15+ photos)
│   │   │   ├── hollywood-hideaway.md
│   │   │   └── maison-de-la-riviere.md
│   │   └── services/
│   │       ├── catering.md
│   │       └── wellness.md
│   │
│   ├── i18n/
│   │   └── translations.ts     # Typed EN/FR seed (~102KB, ~1500+ keys) — legacy / dev reference
│   │
│   ├── lib/
│   │   └── auth.ts             # HMAC-signed cookie session for editor
│   │
│   └── styles/
│       └── global.css          # ~30KB — :root CSS vars are dashboard-editable
│
├── public/                     # Vercel serves this verbatim
│   ├── editor/                 # Precompiled editor SPA (source lives in another repo)
│   │   ├── index.html              # SPA shell — <script src="/editor/assets/index-*.js">
│   │   ├── guardrails.js           # Revert confirm + beforeunload + localStorage backup
│   │   └── assets/
│   │       ├── index-D5eDIkAX.js   # React bundle (hashed)
│   │       └── index-C4VZbOx6.css  # Tailwind/UI (hashed)
│   ├── editor-inject.js        # Click-to-edit overlay (loaded inside the preview iframe)
│   ├── admin/                  # Decap CMS shell (legacy)
│   │   ├── index.html
│   │   └── config.yml
│   ├── i18n/
│   │   └── translations.json   # ~158KB — RUNTIME source of truth for translations
│   ├── images/
│   │   ├── homes/              # Per-house photos (le-moulin-*, hh-*, maison-de-la-riviere-*)
│   │   ├── explore/            # Day-trip + region photos
│   │   ├── history/            # Historical archive photos
│   │   └── *.webp              # Top-level: hero-compound, group-dinner, gardens, wellness-*
│   ├── favicon*, apple-touch-icon.png, robots.txt
│   └── og-default.jpg, og-hero.jpg
│
├── scripts/                    # Node scripts (no test runner; not part of the build)
│   ├── check-public-clean.mjs          # prebuild — fails if photo-source dirs in /public
│   ├── generate-photo-mapping.mjs      # walks ../photo-source/, emits photo-mapping.json
│   ├── process-photos.mjs              # reads photo-mapping.json → sharp → optimised webp
│   ├── photo-mapping.json              # source→target+alt mapping (hand-edited)
│   ├── make-previews.mjs               # one-off: thumbs to scripts/previews/
│   ├── make-all-previews.mjs           # batch version
│   ├── phase3-list-tables.mjs          # one-off Neon DB cleanup utility
│   ├── phase3-drop-tables.mjs          # one-off Neon DB cleanup utility
│   └── previews/                       # gitignored thumbnail output
│
├── dist/                       # `astro build` output (gitignored)
├── .astro/                     # Astro generated types (gitignored)
├── .vercel/                    # Vercel CLI output (gitignored)
└── .planning/codebase/         # GSD codebase docs (this file's home)
```

## Directory Purposes

**`src/pages/`:**
- Purpose: Astro file-based router. Every `.astro` becomes a route at `/<filename>/`.
- Contains: Marketing pages, journal posts, server endpoints under `api/`.
- Key files: `index.astro` (homepage, 758 lines), `the-compound.astro` (group-stay landing, 451 lines), `homes/le-moulin.astro` (398 lines).

**`src/layouts/`:**
- Purpose: Shared HTML chrome.
- Contains: Single `BaseLayout.astro` (1810 lines). All shared `<head>`, nav, footer, popup, lang-toggle, and editor-inject loader live here. Pages use `<BaseLayout title="…">`.

**`src/components/`:**
- Purpose: Reusable section components.
- Contains: Four components (`AmenitiesSection`, `AvailabilityCalendar`, `PhotoCarousel`, `RoomShowcase`).
- Pattern: Each accepts an `i18nKey` prop that derives `${i18nKey}.eyebrow` / `${i18nKey}.heading` keys for the editor.

**`src/content/`:**
- Purpose: Frontmatter content, NOT an Astro content collection.
- Contains: 11 markdown files in `homes/`, `pages/`, `services/`. All bodies are empty — only the YAML frontmatter is consumed.
- Key files: `pages/homepage.md` (homepage hero copy), `pages/le-moulin.md` (gallery — 15 photo records), `homes/le-moulin.md` (stats: bedrooms, sleeps, amenities).

**`src/i18n/`:**
- Purpose: Typed translation seed in TypeScript.
- Contains: `translations.ts` (~102KB, 1500+ keys) — kept for dev IDE autocompletion but NOT the runtime source of truth.

**`src/lib/`:**
- Purpose: Server-only helpers.
- Contains: `auth.ts` — HMAC-SHA256 session cookie helpers (`createSession`, `checkAuth`).

**`src/styles/`:**
- Purpose: Single global stylesheet imported once by `BaseLayout.astro`.
- Contains: `global.css` (~30KB). The `:root { --… }` block is dashboard-editable: `site/save.ts:40-52` regex-rewrites individual variable values.

**`public/`:**
- Purpose: Static assets served verbatim by Vercel.
- Contains: Editor SPA, click-to-edit injector, translations JSON, all images, favicons.

**`public/editor/`:**
- Purpose: Precompiled React SPA. Source lives in a separate repo; this directory is updated by copying built artifacts.
- Key files: `index.html` (shell), `guardrails.js` (autosave + revert/beforeunload), `assets/index-*.js` and `assets/index-*.css` (hashed bundle).

**`public/editor-inject.js`:**
- Purpose: Click-to-edit overlay. Loaded inside the preview iframe by `BaseLayout.astro:962-973` only when `?edit=1` is present and the page is iframed.

**`public/i18n/translations.json`:**
- Purpose: RUNTIME source of truth for translations. Fetched by every page via `/api/translations`. Edited by the dashboard via GitHub PUT.

**`public/images/`:**
- Purpose: All public-facing photography. Optimised webp output of `process-photos.mjs`.
- Subdirectories: `homes/` (per-house, prefixed `le-moulin-*`, `hh-*`, `maison-de-la-riviere-*`), `explore/` (day trips), `history/` (archive).

**`scripts/`:**
- Purpose: Node automation scripts. Not invoked by `astro build` except for `check-public-clean.mjs` (the `prebuild` hook in `package.json`).
- Photo pipeline: `generate-photo-mapping.mjs` (build mapping from `../photo-source/`) → hand-edit `photo-mapping.json` → `process-photos.mjs` (write optimised webps to `public/images/`).
- DB cleanup: `phase3-list-tables.mjs`, `phase3-drop-tables.mjs` use `@neondatabase/serverless` for one-off operations. Not part of the deploy.

**`scripts/previews/`:**
- Purpose: Local preview thumbnails. Gitignored (`.gitignore:28`).
- Generated: yes (by `make-previews.mjs` / `make-all-previews.mjs`).
- Committed: no.

**`dist/`:**
- Purpose: `astro build` output. Vercel deploys from here.
- Generated: yes. Committed: no.

## Key File Locations

**Entry Points:**
- `src/pages/index.astro` — public homepage.
- `public/editor/index.html` — editor SPA.
- `middleware.ts` — Vercel Edge entry.
- `src/pages/api/auth/login.ts` — editor login flow.

**Configuration:**
- `astro.config.mjs` — site URL, output mode, sitemap filter, Vercel adapter.
- `vercel.json` — `/admin` and `/editor` rewrites; `/analytics` redirect to Umami.
- `middleware.ts` — host-based rewrite for `editor.moulinareves.com`.
- `package.json` — Node ≥24 pin, `prebuild` script.
- `tsconfig.json` — `extends: astro/tsconfigs/strict`.
- `.env`, `.env.local` — secrets (NEVER commit; existence noted only).

**Core Logic:**
- `src/layouts/BaseLayout.astro:1682-1762` — language overlay runtime (`fetch /api/translations`, `setLanguage()`, attribute walkers).
- `src/layouts/BaseLayout.astro:962-973` — editor-inject loader gate (`?edit=1` + iframed only).
- `public/editor-inject.js` — click-to-edit overlay implementation.
- `public/editor/guardrails.js` — autosave + revert confirm + beforeunload.
- `src/pages/api/site/save.ts` and `publish.ts` — GitHub contents-API writers.
- `src/pages/api/translations.ts` — read-side proxy with CDN cache.
- `src/lib/auth.ts` — HMAC cookie session.

**Content (loaded at build time):**
- `src/content/pages/homepage.md` — homepage hero / intro / testimonial.
- `src/content/pages/le-moulin.md` — Le Moulin photo carousel data.
- `src/content/pages/compound.md`, `pages/about.md`, `pages/hollywood-hideaway.md`, `pages/maison-de-la-riviere.md`.
- `src/content/services/catering.md`, `services/wellness.md`.
- `src/content/homes/{le-moulin,la-grange,le-jardin}.md` — stats and amenity lists.

**Translations:**
- `public/i18n/translations.json` — RUNTIME source of truth.
- `src/i18n/translations.ts` — typed seed reference (do NOT expect edits here to take effect at runtime).

## Naming Conventions

**Pages:**
- Kebab-case filenames: `the-compound.astro`, `hollywood-hideaway.astro`, `maison-de-la-riviere.astro`.
- Becomes URL: `the-compound.astro` → `/the-compound/`.
- Subdirectories for grouping (`homes/`, `journal/`, `explore/`, `api/`).

**Components:**
- PascalCase Astro components: `PhotoCarousel.astro`, `AmenitiesSection.astro`.
- One section per component; each takes `eyebrow`, `heading`, optional `intro`, and `i18nKey`.

**API routes:**
- Lowercase nouns: `availability.ts`, `translations.ts`, `contact.ts`.
- Group under subdirectories when an area has multiple files (`auth/`, `site/`).
- File MUST start with `export const prerender = false;`.

**Content files:**
- Kebab-case slugs match the corresponding page route: `pages/le-moulin.md` ↔ `pages/homes/le-moulin.astro`.
- Two-tier split:
  - `src/content/homes/<home>.md` for room/stat data.
  - `src/content/pages/<route>.md` for hero copy and galleries.

**Photos:**
- Prefix encodes the home: `le-moulin-*.webp`, `hh-*.webp` (Hollywood Hideaway), `maison-de-la-riviere-*.webp`.
- Legacy gotcha: some Hollywood Hideaway grange photos are still named `la-grange-*.webp` (old prefix; see `scripts/generate-photo-mapping.mjs:24-28`).
- Format: WebP only. Max width 2000px, quality 85 (`scripts/process-photos.mjs:14-15`).

**i18n keys:**
- Dot-namespaced sections: `nav.*`, `footer.*`, `home.*`, `moulin.*`, `compound.*`, `wellness.*`, `catering.*`, `about.*`, `contact.*`, `gallery.*`, `success.*`, `amenity.*`.
- Component-derived: `${i18nKey}.eyebrow`, `${i18nKey}.heading`, `${i18nKey}.intro`.

## Where to Add New Code

**New marketing page:**
- Route file: `src/pages/<kebab-name>.astro` (or `src/pages/<group>/<kebab-name>.astro` for nested).
- Content (if structured): `src/content/pages/<kebab-name>.md` with frontmatter, loaded via `fs.readFileSync(...)` + `gray-matter` in the page.
- Wrap content with `data-i18n` / `data-i18n-html` and add keys to `public/i18n/translations.json` (and ideally mirror in `src/i18n/translations.ts`).
- If excluding from sitemap, update the filter in `astro.config.mjs:11`.

**New API endpoint:**
- File: `src/pages/api/<name>.ts` (or `src/pages/api/<group>/<name>.ts`).
- First line: `export const prerender = false;`.
- For authenticated endpoints, gate with `if (!await checkAuth(request)) return …;` (see `src/pages/api/site/save.ts:75-81`).

**New translatable string on existing page:**
- Add `data-i18n="<section>.<field>"` (or `data-i18n-html` if value contains markup) to the element.
- Add `"<section>.<field>": { "en": "…", "fr": "…" }` to `public/i18n/translations.json`.

**New gallery photo:**
- Source jpeg goes in `../photo-source/<folder>/` (NOT in this repo).
- Append entry to `scripts/photo-mapping.json` with `{ source: { target: "public/images/...", alt: "..." } }`. Empty alts fail the script.
- Run `node scripts/process-photos.mjs` to emit the webp.
- Reference the new path in the relevant `src/content/pages/<page>.md` `gallery:` array, or in the page's `.astro` if defined inline.

**New component:**
- File: `src/components/<PascalCase>.astro`.
- Accept `eyebrow`, `heading`, optional `intro`, and `i18nKey`. Derive child keys from `i18nKey` and emit `data-i18n` / `data-i18n-html` only when provided. Pattern reference: `src/components/PhotoCarousel.astro:13-17, 24-25`.

**New translation language:**
- Not currently parameterised — `setLanguage()` only handles `'en'` / `'fr'` and the toggle button is hardcoded for two states (`src/layouts/BaseLayout.astro:97-101`). Adding a third language would require touching `BaseLayout.astro` plus all entries in `public/i18n/translations.json`.

**New dashboard-editable color:**
- Add `--<name>: <value>;` inside `:root { … }` in `src/styles/global.css`.
- Update the prefix-allow-list in `src/pages/api/site/index.ts:36-40` (`bg-`, `blue-`, `text-`, plus literal `gold` / `green-garden` / `terracotta`).

## Special Directories

**`public/editor/`:**
- Purpose: Precompiled editor SPA artifacts.
- Generated: yes (in a separate source repo).
- Committed: yes (binary-style — bundle hash changes show up as plain file replacements).
- Editing: do not edit `assets/*.js` or `assets/*.css` by hand. To change the editor, rebuild in the source repo and replace these files. `guardrails.js` IS hand-editable.

**`public/i18n/`:**
- Purpose: Live translations served at runtime.
- Generated: by the dashboard's Save/Publish flows AND by hand commits.
- Committed: yes.
- Editing: prefer the dashboard. Direct edits work but a stale editor save will MERGE on top of remote (last-write-wins for shared keys, dev-only keys survive — see `src/pages/api/site/save.ts:108-118`).

**`scripts/previews/`:**
- Purpose: local thumbnails from `make-previews.mjs`.
- Generated: yes. Committed: no (`.gitignore:28`).

**`../photo-source/` (sibling, OUTSIDE the repo):**
- Purpose: Raw camera output before optimisation.
- NOT a directory of this repo, but the photo scripts assume it exists at `resolve(REPO_ROOT, '..', 'photo-source')`.
- `prebuild` will fail if these files are accidentally placed under `public/`.

**`dist/`, `.astro/`, `.vercel/`, `.netlify/`, `node_modules/`:**
- Generated; gitignored. Do not edit.

---

*Structure analysis: 2026-05-05*
