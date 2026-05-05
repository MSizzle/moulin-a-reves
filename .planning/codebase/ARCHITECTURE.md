<!-- refreshed: 2026-05-05 -->
# Architecture

**Analysis Date:** 2026-05-05

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         Public Site (www.moulinareves.com)                │
│                                                                            │
│   Astro pages  →  BaseLayout  →  Components  →  Static HTML in /dist/      │
│   `src/pages/*` `src/layouts/`  `src/components/`                          │
│                                                                            │
│   Runtime layer (browser):                                                 │
│     • lang toggle reads `data-i18n` / `data-i18n-html` / `-placeholder`    │
│     • fetches /api/translations (proxies GitHub raw translations.json)     │
│     • EN no longer pulled from static HTML — always overlaid at runtime    │
└────────────┬─────────────────────────────────────────────────────────────┘
             │
             ├─── `/api/*` (prerender:false, runs on Vercel Edge/Node)
             │     • translations.ts  (GET → GitHub raw)
             │     • availability.ts  (GET → Airbnb + VRBO ICS feeds)
             │     • contact.ts / compound.ts / newsletter.ts (POST → Airtable)
             │     • auth/login.ts    (cookie session, HMAC-signed)
             │     • site/index.ts    (GET dashboard config)
             │     • site/save.ts     (POST → GitHub PUT, preview save)
             │     • site/publish.ts  (POST → GitHub PUT, live publish)
             │
             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│         Editor SPA  (editor.moulinareves.com  →  /editor/index.html)      │
│                                                                            │
│   Three layers:                                                            │
│   1. SPA shell           `public/editor/index.html` + precompiled bundle  │
│      (`assets/index-*.js`, `assets/index-*.css`)                          │
│   2. Guardrails          `public/editor/guardrails.js` (lives outside     │
│                          the React bundle so it survives rebuilds)        │
│   3. Inject script       `public/editor-inject.js` (loaded INSIDE the     │
│                          preview iframe when ?edit=1 is present)          │
└────────────┬─────────────────────────────────────────────────────────────┘
             │  postMessage {type: 'mar-i18n-edit', key, lang, value}
             │  (iframe → SPA, on every keystroke)
             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                  GitHub  (single source of truth)                         │
│                                                                            │
│   repo contents API  →  PUT  src/styles/global.css         (colors)       │
│                       →  PUT  public/i18n/translations.json (copy)        │
│                                                                            │
│   Vercel webhook → auto-deploy on push to main                            │
└──────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `BaseLayout` | HTML shell, meta/OG, nav, footer, lang toggle runtime, editor-inject loader | `src/layouts/BaseLayout.astro` |
| `PhotoCarousel` | Hero/gallery slider, accepts `i18nKey` to wire eyebrow + heading attrs | `src/components/PhotoCarousel.astro` |
| `RoomShowcase` | Bedroom-tile grid with click-to-modal carousel (used on home pages) | `src/components/RoomShowcase.astro` |
| `AmenitiesSection` | Feature + checklist amenities block | `src/components/AmenitiesSection.astro` |
| `AvailabilityCalendar` | Renders 4-month calendar from `/api/availability` | `src/components/AvailabilityCalendar.astro` |
| `auth.ts` | HMAC cookie session for the editor (`maison_session`, 30-day TTL) | `src/lib/auth.ts` |
| Edge middleware | Rewrites `editor.moulinareves.com/` → `/editor/index.html` | `middleware.ts` |
| Editor inject | Click-to-edit overlay inside preview iframe | `public/editor-inject.js` |
| Editor guardrails | Revert confirm, beforeunload, localStorage backup | `public/editor/guardrails.js` |
| Photo pipeline | Source-photo → optimised webp at known target paths | `scripts/process-photos.mjs` |

## Pattern Overview

**Overall:** Static-first Astro site (`output: 'static'`) with a small set of opt-in server endpoints (`export const prerender = false;`) and a precompiled React SPA mounted at `/editor/`.

**Key Characteristics:**
- All marketing pages prerender to flat HTML — fast, cheap, indexable.
- Translatable strings live in `public/i18n/translations.json` and are overlaid client-side at runtime; the JSON is fetched through `/api/translations` so dashboard-published edits appear without a Vercel rebuild.
- The editor never writes to a database. It commits to GitHub via the contents API and Vercel auto-deploys the resulting commit. Persistence == git history.
- The editor SPA is delivered as a precompiled bundle in `public/editor/assets/` — the source for it lives in a separate repo, and Astro just serves it as a static asset.

## Layers

**Pages (`src/pages/`):**
- Purpose: One Astro file per route; route is filename minus extension (`index.astro` → `/`).
- Location: `src/pages/`
- Contains: Top-level routes (`index.astro`, `about.astro`, `contact.astro`, `the-compound.astro`, `gallery.astro`, `wellness.astro`, `catering.astro`, `success.astro`), plus subdirectory routes for `/homes/`, `/explore/`, `/journal/`.
- Depends on: `src/layouts/BaseLayout.astro`, `src/components/*.astro`, `src/content/**/*.md`.
- Used by: Astro router at build time.

**Layouts (`src/layouts/`):**
- Purpose: Single `BaseLayout.astro` (1810 lines) containing `<head>`, nav, footer, popup, lang-toggle JS, room-modal JS, editor-inject loader, and most page-level inline `<script is:inline>` blocks.
- Location: `src/layouts/BaseLayout.astro`
- Contains: All shared chrome and most runtime JS for the public site.
- Used by: every page (`<BaseLayout title="…">`).

**Components (`src/components/`):**
- Purpose: Reusable Astro components consumed by pages.
- Location: `src/components/`
- Contains: 4 components — `AmenitiesSection`, `AvailabilityCalendar`, `PhotoCarousel`, `RoomShowcase`.
- Pattern: Each accepts an `i18nKey` prop; the component derives child keys (`${i18nKey}.eyebrow`, `${i18nKey}.heading`) and emits `data-i18n` / `data-i18n-html` only when the key is supplied.

**Content (`src/content/`):**
- Purpose: Markdown frontmatter as content-source-of-truth for page heroes, photo galleries, amenities, stats.
- Location: `src/content/{homes,pages,services}/*.md`
- Contains: 11 markdown files with no body — only YAML frontmatter (galleries are arrays of `{ src, alt }`).
- Pattern: Loaded with `fs.readFileSync` + `gray-matter` directly inside Astro page frontmatter (NOT Astro's `getCollection()` API — there is no `src/content/config.ts`). See `src/pages/index.astro:7-8` and `src/pages/homes/le-moulin.astro:10-11`.

**API (`src/pages/api/`):**
- Purpose: Server endpoints. Every file declares `export const prerender = false;` to opt out of SSG and run on Vercel.
- Location: `src/pages/api/`
- Contains: `translations.ts`, `availability.ts`, `contact.ts`, `compound.ts`, `newsletter.ts`, `auth/login.ts`, `site/{index,save,publish}.ts`.
- Used by: Public site fetches (translations, availability, form posts) and the Editor SPA (auth, save/publish, dashboard config).

**Lib (`src/lib/`):**
- Purpose: Server-only helpers shared across API routes.
- Location: `src/lib/auth.ts` (only file).
- Contains: `createSession()` / `checkAuth()` — HMAC-SHA256 signed cookie of the form `authenticated:<ts>:<sig>`.

**Styles (`src/styles/`):**
- Purpose: Single `global.css` (~30k) imported by `BaseLayout.astro`. CSS custom properties on `:root` are how the dashboard edits colors (the save endpoint regex-rewrites them).
- Location: `src/styles/global.css`

## Data Flow

### Public site request

1. Vercel serves prerendered `dist/<route>/index.html`.
2. `BaseLayout.astro` runs its inline `<script>` (line 1682 onward): `fetch('/api/translations', { cache: 'no-store' })` → `/api/translations.ts` → GitHub raw `public/i18n/translations.json` (CDN-cached `s-maxage=10, stale-while-revalidate=60`).
3. `setLanguage(currentLang)` walks every `[data-i18n]` (sets `textContent`), every `[data-i18n-html]` (sets `innerHTML`), every `[data-i18n-placeholder]` (sets `placeholder`).
4. EN is treated like any other language — runtime overlay always wins, so dashboard edits to English copy land without rebuild.

### Click-to-edit save flow

1. Editor SPA loads at `editor.moulinareves.com/` → middleware rewrites to `/editor/index.html` → SPA boots; `guardrails.js` runs in the parent window.
2. SPA opens `<iframe src="https://www.moulinareves.com/<route>?edit=1">`.
3. BaseLayout sees `edit=1` AND `window.parent !== window`, injects `/editor-inject.js` (`src/layouts/BaseLayout.astro:962-973`).
4. Inject script loads `/api/translations` and adds dashed-orange hover outlines to every `[data-i18n], [data-i18n-html]`.
5. User clicks an element → `contenteditable` is set to `'true'` for HTML keys, `'plaintext-only'` for text keys (so `<span class="serif-italic">` survives).
6. Each keystroke posts `{type: 'mar-i18n-edit', key, lang, value}` to the parent SPA.
7. `guardrails.js` mirrors every message to `localStorage['maison_editor_unsaved_v1']` (24h TTL) for crash recovery.
8. User clicks Save/Publish → SPA POSTs to `/api/site/save` or `/api/site/publish`.
9. Endpoint authenticates via `checkAuth()` → fetches current `public/i18n/translations.json` from GitHub → merges editor payload over remote (last-write-wins, but dev-added keys survive a stale editor) → PUTs back through GitHub contents API. Colors take a similar path against `src/styles/global.css` with regex rewrite of `:root { --… }`.
10. `guardrails.js` patches `window.fetch`: on a successful save it clears the localStorage backup.
11. Vercel webhook fires on commit; the public site rebuilds within ~30s.

### Availability flow

1. `AvailabilityCalendar` mounts → fetches `/api/availability`.
2. `availability.ts` fetches Airbnb + VRBO public ICS feeds in parallel, parses VEVENT ranges, expands to per-day blocked dates, returns `{ blocked, ranges, sources, lastSynced }`.
3. CDN caches the response for 15 minutes (`s-maxage=900, stale-while-revalidate=3600`).

**State Management:**
- Public site: language preference in `localStorage['lang']`; chocolate-popup dismissal in `localStorage['mar_chocolate_popup_seen']`.
- Editor: unsaved edits mirrored to `localStorage['maison_editor_unsaved_v1']` by guardrails; SPA owns the in-memory edit map.
- Server: cookie `maison_session` (HMAC-signed, 30-day expiry).

## Key Abstractions

**i18n key:**
- Purpose: Dot-namespaced string (`nav.homes`, `home.testimonial.quote`, `moulin.hero.heading`) that addresses one translatable value with EN/FR variants.
- Source of truth: `public/i18n/translations.json` (deployed) and `src/i18n/translations.ts` (typed seed/legacy export).
- Two attribute schemes — `data-i18n` for plain text (`textContent` swap) and `data-i18n-html` for fragments containing inline markup like `<span class="serif-italic">…</span>` (`innerHTML` swap).
- Examples: `src/layouts/BaseLayout.astro:85, 137`; `src/components/PhotoCarousel.astro:24-25`.

**Frontmatter content record:**
- Purpose: A markdown file with no body whose frontmatter is the page's structured content.
- Examples: `src/content/homes/le-moulin.md` (stats + amenities), `src/content/pages/le-moulin.md` (gallery array of `{ src, alt }`).
- Pattern: Loaded inline via `fs.readFileSync(...)` + `matter(raw).data`, surfaced to the template as `cms.gallery`, `cms.heroImage`, etc.

## Entry Points

**Astro public site:**
- Location: `src/pages/index.astro` (built to `/`), `src/pages/<route>.astro` (`/<route>/`), and subdirectories for nested routes.
- Triggers: HTTP GET on Vercel.
- Responsibilities: Compose `BaseLayout` + components + frontmatter data into static HTML.

**Editor SPA:**
- Location: `public/editor/index.html` (precompiled — bundle filenames hashed: `assets/index-D5eDIkAX.js`, `assets/index-C4VZbOx6.css`).
- Triggers: Direct nav to `editor.moulinareves.com/` (rewritten by `middleware.ts`) or `/editor` on the main domain (rewritten by `vercel.json`).
- Responsibilities: Render React dashboard, mount preview iframe, post diffs to `/api/site/save` and `/api/site/publish`.

**Edge middleware:**
- Location: `middleware.ts` (Vercel Edge, `matcher: '/'`).
- Triggers: Every request to `/` on any host.
- Responsibilities: When `host === 'editor.moulinareves.com'` rewrite to `/editor/index.html` so the editor's host shows the SPA at root without changing the URL bar.

## Architectural Constraints

- **Editor SPA is precompiled and source is external.** The bundle in `public/editor/assets/index-*.{js,css}` is committed binary-style; you cannot edit React components from this repo. To change the editor UI you must rebuild that bundle in its source repo and copy the new files in. `public/editor/guardrails.js` is the only editor-side script that lives in this repo.
- **Cache-bust the inject script after editing it.** `public/editor-inject.js` is loaded with `s.defer = true` from `BaseLayout.astro` and cached aggressively by Vercel CDN. Bump the script content (or rename if necessary) when shipping behavior changes — the editor will keep serving the old script otherwise.
- **HTML translation keys must use `data-i18n-html`, not `data-i18n`.** The runtime sets `textContent` for plain `data-i18n`, which strips inline markup. Any value containing `<span>`, `<br>`, `<strong>`, or `<em>` MUST sit on a `data-i18n-html` attribute (see `src/layouts/BaseLayout.astro:137` for the canonical footer-tagline `<br/>` example).
- **Content collections are not used.** There is no `src/content/config.ts` and no Zod schema. Pages read `.md` files via `fs.readFileSync` + `gray-matter` directly. Adding a frontmatter key requires editing both the `.md` file and the consuming `.astro` page.
- **`/public/` is a deploy-blast-radius landmine.** `scripts/check-public-clean.mjs` runs as `prebuild` and fails the build if `public/Moulin House Photos/` or `public/photo-source/` exist. Raw photo source MUST live at `../photo-source/` outside the repo.
- **Sitemap excludes `/the-compound/` and `/success/`.** See `astro.config.mjs:11`.
- **API routes must declare `prerender = false`.** Without it Astro tries to prerender them and they vanish at runtime. All seven existing routes do this.
- **Auth secret is the dashboard password.** `src/lib/auth.ts:4` uses `DASHBOARD_PASSWORD` as both verifier and HMAC secret. Rotating the password invalidates all live sessions.

## Anti-Patterns

### Adding HTML to a `data-i18n` key

**What happens:** Inline markup (e.g. `<span class="serif-italic">words</span>`) gets stuffed into a `data-i18n` value or onto an element marked `data-i18n`.
**Why it's wrong:** `setLanguage()` overwrites these elements with `el.textContent = …`, which renders the markup as visible literal text and erases the styling.
**Do this instead:** Use `data-i18n-html` (sets `innerHTML`) and feed it through `set:html={…}` at render time. Pattern reference: `src/components/RoomShowcase.astro:45`.

### Hardcoding translatable copy

**What happens:** A new heading is added directly to a `.astro` file with no `data-i18n*` attribute and no entry in `public/i18n/translations.json`.
**Why it's wrong:** The dashboard cannot edit it (no key to target), the FR speaker still sees English, and dashboard publishes will not affect it.
**Do this instead:** Wrap the element with `data-i18n="<section>.<field>"`, add the key to `public/i18n/translations.json` for both `en` and `fr`, and (for components) plumb through `i18nKey` so child eyebrow/heading keys are derived consistently.

### Reading `getCollection()` for content

**What happens:** Someone imports `getCollection` / `getEntry` from `astro:content` to load a `src/content/<x>.md` file.
**Why it's wrong:** No `src/content/config.ts` exists, so Astro has no schema and the call returns nothing useful.
**Do this instead:** Use the project's pattern — `import matter from 'gray-matter'; import fs from 'node:fs'; const { data } = matter(fs.readFileSync('src/content/...', 'utf-8'));` (see `src/pages/index.astro:4-8`).

### Editing `src/i18n/translations.ts` and expecting a runtime change

**What happens:** A developer edits the typed seed in `src/i18n/translations.ts` and is surprised the live site doesn't update.
**Why it's wrong:** The site fetches `public/i18n/translations.json` at runtime; the `.ts` file is not the source of truth at runtime.
**Do this instead:** Edit `public/i18n/translations.json` directly (or use the editor) — that's what `/api/translations` proxies.

## Error Handling

**Strategy:** Defensive, with silent fallbacks on the public site (loss of translations should never blank the page) and explicit JSON error responses on API routes.

**Patterns:**
- API routes wrap their handler in `try / catch`, return `new Response(JSON.stringify({ error: err.message }), { status: 500 })`.
- Translations fetch in `BaseLayout.astro:1688-1703` falls back to a hardcoded nav-only object on network failure.
- The editor inject script swallows clipboard/selection errors (`catch (_) {}`) so a single bad element doesn't kill click-to-edit.
- `availability.ts` returns empty arrays if either ICS feed fails, never blocking the calendar.

## Cross-Cutting Concerns

**Logging:** None. No structured logger; API routes rely on Vercel's request logs.
**Validation:** None on the server side. Form submissions hit Airtable directly with whatever the client sends (modulo `parseInt` coercion for numeric fields in `contact.ts:25-27`).
**Authentication:** HMAC-signed cookie via `src/lib/auth.ts`. Editor SPA + every `site/*` and `auth/*` route call `checkAuth(request)` first; public APIs (`translations`, `availability`, `contact`, `compound`, `newsletter`) are unauthenticated.

---

*Architecture analysis: 2026-05-05*
