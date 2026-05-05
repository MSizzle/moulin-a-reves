<!-- GSD:project-start source:PROJECT.md -->
## Project

**Moulin à Rêves Site**

Marketing site for **Le Moulin à Rêves** — a private luxury vacation compound in Méréville, France (~1 hour from Paris) with three rentable houses (Le Moulin, Hollywood Hideaway, Maison de la Rivière). Built and maintained by Monty (solo dev) for the property owner. The site is a static Astro build with a custom Decap CMS admin and a precompiled editor SPA, deployed to Vercel and published via GitHub.

**Core Value:** **Convey the compound's atmosphere convincingly enough to convert visitors into bookings and direct inquiries.** Brand, photography, and copy all serve this. The editor / CMS / i18n stack exists so the client can keep that surface fresh without dev involvement.

### Constraints

- **Timeline**: Deliverable due **2026-05-06** (tomorrow). Monty has a full evening / late night of focused work.
- **Authority model**: Solo dev for client — "I decide, ship, show". No per-edit approval. Client reviews at milestones.
- **Risk posture**: Don't break the editor / publishing flow. It is fragile and the client uses it directly. Any structural fix to that area is deferred to Milestone 2.
- **Tech stack (locked, brownfield)**: Astro 6 + `@astrojs/vercel` + Decap CMS + custom React editor SPA + Vercel Edge middleware + Sharp photo pipeline + Airtable webhooks + Neon (admin scripts) + GitHub-as-CMS-backend.
- **i18n**: Site must remain bilingual (EN/FR) via runtime overlay from `public/i18n/translations.json`. Any copy change must update both languages or be flagged.
- **Node**: pinned to 24 (`.nvmrc`, `package.json` engines).
- **Deploy path**: pushes to `main` auto-deploy via Vercel webhook. Atomic commits = atomic deploys.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript (strict) — used in API routes (`src/pages/api/**/*.ts`), `src/lib/auth.ts`, `middleware.ts`, and `src/i18n/translations.ts`. Strict mode comes from `astro/tsconfigs/strict` (see `tsconfig.json`).
- Astro `.astro` components (HTML + scoped JS/CSS islands) — every route under `src/pages/` plus `src/layouts/BaseLayout.astro` (~1.6k lines, ships global CSS, head, nav, footer, language toggle, third-party scripts).
- JavaScript (ESM `.mjs`) — build/maintenance scripts under `scripts/` (photo pipeline, Neon admin, prebuild guard).
- Plain CSS (one global stylesheet) — `src/styles/global.css`. Imports two Google Fonts at the top:
- JSON content — `public/i18n/translations.json` (canonical translations, edited by the editor SPA), `scripts/photo-mapping.json` (~25 KB, drives Sharp pipeline).
- Markdown — content collections under `src/content/{homes,pages,services}/` (e.g. `src/content/homes/le-moulin.md`, `src/content/pages/homepage.md`).
- HTML — `public/admin/index.html` (Decap CMS shell), `public/editor/index.html` (compiled editor SPA shell), `public/google24a82c8f19f114ef.html` (Google Search Console verification token).
- YAML — `public/admin/config.yml` (Decap CMS schema, ~165 lines).
## Runtime
- Node.js — pinned to **24** via `.nvmrc` (single line: `24`) and `package.json` engines (`"node": ">=24.0.0"`). Documented as a hard requirement in `.claude` editor session notes (Sharp + Astro 6 need it).
- Browser runtime: Astro builds a static site (no client framework), with two non-Astro browser bundles served from `public/`:
- Vercel Edge Middleware via `@vercel/edge` (`middleware.ts`). Matcher `'/'` rewrites `editor.moulinareves.com/` to `/editor/index.html` so the SPA serves on its own subdomain without changing the URL bar.
- npm — `package-lock.json` is committed (~200 KB). No yarn/pnpm/bun lockfiles present.
## Frameworks
- **Astro `^6.1.2`** — static-site framework. `astro.config.mjs`:
- **`@astrojs/vercel` `^10.0.4`** — adapter that turns non-prerendered routes into Vercel Functions and wires up the `vercel.json` build artifact.
- **`@astrojs/sitemap` `^3.7.2`** — emits `sitemap-index.xml` referenced from `public/robots.txt`. `/success/` and `/the-compound/` are excluded.
- **`@vercel/edge` `^1.2.2`** — used only by `middleware.ts` for the editor subdomain rewrite.
- None detected. No `jest.config.*`, `vitest.config.*`, `*.test.*`, or `*.spec.*` files in the repo. There is no `test` script in `package.json`. QA is manual (see `.claude/.../qa_session_*.md` notes).
- **Sharp `^0.34.5`** (devDependencies) — image pipeline used by `scripts/process-photos.mjs`, `scripts/make-previews.mjs`, `scripts/make-all-previews.mjs`. Resizes to max 2000px and emits WebP at quality 85 for production photos.
- **Astro CLI** — `astro dev`, `astro build`, `astro preview`.
## Key Dependencies
- `astro` `^6.1.2` — see above.
- `@astrojs/vercel` `^10.0.4` — Vercel adapter.
- `@astrojs/sitemap` `^3.7.2` — sitemap generator.
- `@vercel/edge` `^1.2.2` — edge middleware helpers.
- `gray-matter` `^4.0.3` — declared as a dependency, indicates frontmatter parsing for the `src/content/**` markdown collections (Astro content layer).
- `@neondatabase/serverless` `^1.0.2` — declared but **NOT used by any runtime code in `src/`**. Only imported from `scripts/phase3-list-tables.mjs` and `scripts/phase3-drop-tables.mjs`, which are one-shot ops scripts for tearing down legacy analytics tables on a Neon Postgres branch (read `.env.phase3` directly, gitignored). This is leftover plumbing from a now-decommissioned analytics system.
- `sharp` `^0.34.5` (devDependencies) — image processing.
## Configuration
- `GITHUB_TOKEN`, `GITHUB_REPO` — used by `src/pages/api/translations.ts`, `src/pages/api/site/index.ts`, `src/pages/api/site/save.ts`, `src/pages/api/site/publish.ts` to read/write content via the GitHub Contents API.
- `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `AIRTABLE_CONTACT_TABLE`, `AIRTABLE_COMPOUND_TABLE`, `AIRTABLE_NEWSLETTER_TABLE` — form submissions in `src/pages/api/contact.ts`, `src/pages/api/compound.ts`, `src/pages/api/newsletter.ts`.
- `DASHBOARD_PASSWORD` — `src/lib/auth.ts` (HMAC-signed session cookie). Falls back to literal `'moulin2024'` if unset (note: this default is a real secret-shaped string in source, not a placeholder).
- `DATABASE_URL` — only read by `scripts/phase3-*.mjs` from a separate file `.env.phase3` (not via Vite). Not used at runtime.
- `.env` (~812 B) and `.env.local` (~2.6 KB) at repo root — gitignored.
- `.env.production`, `.env*.local` — covered by `.gitignore`.
- `.env.phase3` referenced by Neon scripts — gitignored.
- `astro.config.mjs` — see snippet above.
- `tsconfig.json`:
- `.astro/` — generated content-collection types; gitignored.
- `scripts/check-public-clean.mjs` runs as `prebuild`. It hard-fails the build if either `public/Moulin House Photos/` or `public/photo-source/` exists, because these raw photo dumps would balloon the Vercel deploy. Logged as a critical gotcha (Editor session, photo integration session).
## Platform Requirements
- Node 24 (matches `.nvmrc` and `package.json` engines).
- npm.
- Optional: `../photo-source/` directory **outside** the repo for the Sharp pipeline (`scripts/generate-photo-mapping.mjs` reads from `resolve(REPO_ROOT, "..", "photo-source")`).
- Primary deploy: **Vercel** (project ID `prj_RIo7DcBIYysCuz9zhnI71u1Ifrb4`, team `team_mYKN6qZrDebsHJGJaiN7XqrY`, project name `moulin-a-reves` — from `.vercel/project.json`). The Astro Vercel adapter splits the build into static assets + Functions for non-prerendered API routes; edge middleware ships from `middleware.ts`. Deploy domains: `www.moulinareves.com`, plus `editor.moulinareves.com` and `analytics.moulinareves.com` subdomains.
- Secondary: **Netlify** config exists (`netlify.toml`):
- `.vercelignore` keeps raw photo dumps out of the deploy:
- `vercel.json` rewrites and redirects:
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Astro pages and components: `kebab-case.astro` for routes (e.g. `src/pages/the-compound.astro`, `src/pages/maison-de-la-riviere.astro`), `PascalCase.astro` for reusable components (e.g. `src/components/AvailabilityCalendar.astro`, `src/components/RoomShowcase.astro`, `src/components/PhotoCarousel.astro`, `src/components/AmenitiesSection.astro`)
- Layout files: `PascalCase.astro` (e.g. `src/layouts/BaseLayout.astro` — only one layout exists)
- API endpoints: `kebab-case.ts` under `src/pages/api/` (e.g. `src/pages/api/contact.ts`, `src/pages/api/newsletter.ts`, `src/pages/api/availability.ts`)
- Library code: `kebab-case.ts` under `src/lib/` (e.g. `src/lib/auth.ts`)
- Build/maintenance scripts: `kebab-case.mjs` under `scripts/` (e.g. `scripts/check-public-clean.mjs`, `scripts/process-photos.mjs`, `scripts/generate-photo-mapping.mjs`)
- Markdown content: `kebab-case.md` under `src/content/` (e.g. `src/content/homes/le-moulin.md`, `src/content/pages/homepage.md`)
- Image assets: `kebab-case.webp` under `public/images/` (e.g. `public/images/homes/le-moulin-hero.webp`, `public/images/bridge-garden.webp`)
- `camelCase` for all JS/TS functions (e.g. `submitNewsletter`, `setLanguage`, `parseIcs`, `unfoldIcs`, `isoFromIcsDate`, `applyColorsToCss`, `updateGitHubFile`, `hmacSign`, `checkAuth`, `createSession` in `src/lib/auth.ts` and `src/pages/api/site/save.ts`)
- Inline IIFEs for client-side scripts (`(function () { ... })();`) — see `src/layouts/BaseLayout.astro` lines 695, 793, 962, 1002
- `camelCase` for locals and props (`currentLang`, `lastFocus`, `focusTimer`, `eyebrowKey`, `headingKey`)
- `SCREAMING_SNAKE_CASE` for module-level constants pulled from env (`GITHUB_TOKEN`, `GITHUB_REPO`, `DASHBOARD_PASSWORD`, `AIRBNB_ICS`, `VRBO_ICS`, `STORAGE_KEY`)
- Astro frontmatter destructuring: `const { title, description = "...", ogImage = "..." } = Astro.props;` (see `src/layouts/BaseLayout.astro:10-14`)
- `PascalCase` interfaces declared inline at top of `.astro` frontmatter (e.g. `interface Props`, `interface Image`, `interface Photo`, `interface Detail`, `interface Room` in `src/components/PhotoCarousel.astro` and `src/components/RoomShowcase.astro`)
- Type-only imports use `import type` (e.g. `import type { APIRoute } from 'astro';` — every file in `src/pages/api/`)
- Inline type aliases for narrow shapes (e.g. `type BusyRange = { start: string; end: string; source: 'airbnb' | 'vrbo'; summary?: string };` in `src/pages/api/availability.ts:10`)
- BEM-style `block__element--modifier` (e.g. `.nav__inner`, `.nav__logo-text`, `.footer__newsletter-form`, `.room-modal__thumb.is-active`, `.lightbox--cream`, `.btn--primary`, `.btn--sm`, `.btn--white`)
- Utility-style state classes use `is-` prefix (`.is-open`, `.is-active`, `.visible`, `.active`)
## Code Style
- No formatter configured. There is no `.prettierrc`, `.prettierrc.json`, `prettier.config.*`, `biome.json`, `.eslintrc*`, `eslint.config.*`, or `stylelint.*` in the repo root.
- 2-space indentation in TS/JS/Astro/CSS observed across `src/` and `scripts/`
- Single quotes for JS/TS strings, double quotes for HTML attributes (Astro default)
- Trailing semicolons present in TS/JS
- No ESLint, Biome, or Stylelint configured. Type checking comes only from `tsconfig.json` (extends `astro/tsconfigs/strict`) and the `// @ts-check` directive at the top of `astro.config.mjs:1`.
- VS Code recommends only the Astro extension (see `.vscode/extensions.json`)
## Import Organization
- None. All imports use relative paths (`../layouts/BaseLayout.astro`, `../../../lib/auth`). `tsconfig.json` declares no `paths`.
## Error Handling
- Wrap the entire handler body in `try { ... } catch { ... }` and return a generic 500 with `{ error: 'Server error' }` (see `src/pages/api/contact.ts:5-48`, `src/pages/api/newsletter.ts:5-40`)
- For external GitHub/Airtable calls, check `if (!res.ok)` and return the upstream JSON error body (`src/pages/api/contact.ts:39-42`)
- Caught errors are silently swallowed in helper functions that fetch from GitHub (`src/pages/api/site/save.ts:9-23, 25-38`, `src/pages/api/availability.ts:74-77`) — they return `null`/`[]` so the caller can decide
- Auth-protected endpoints check first and short-circuit with 401: `if (!await checkAuth(request)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, ... });` (see `src/pages/api/site/save.ts:76-81`)
- `JSON.parse` calls wrapped in `try { ... } catch (_) {}` to ignore malformed `data-room` / `data-gallery` payloads (lines 750-762, 924-933)
- `localStorage.setItem` wrapped in `try { ... } catch (e) {}` for private-mode safety (lines 1018, 1044)
- `fetch('/api/translations')` chained with `.catch(() => { ... fallback ... })` to fall back to a minimal nav-only translations dict (lines 1682-1703)
- Newsletter submit shows `alert('Something went wrong. Please try again.');` on failure (lines 1790, 1795)
## Logging
- Build/maintenance scripts log progress and errors directly: `scripts/process-photos.mjs:20-21,75,83-87`, `scripts/generate-photo-mapping.mjs:67,83,110-112`, `scripts/check-public-clean.mjs:11-15`, `scripts/phase3-drop-tables.mjs:19`
- Source code under `src/` does not log — failures are returned as HTTP responses or silently swallowed.
## Comments
- Block comments above non-obvious logic (e.g. `src/pages/api/availability.ts:79-87` documents `expandToDates`; `src/pages/api/site/save.ts:106-108` explains the merge-from-remote rationale; `middleware.ts:3-9` explains why edge middleware is needed)
- Section dividers in CSS use `/* ---- Section Name ---- */` (e.g. `src/styles/global.css:57`, `src/layouts/BaseLayout.astro:216, 525, 1051, 1212, 1440`)
- `=====` banners separate logical groups in `src/i18n/translations.ts` (lines 2-4, 14-16, 34-36)
- Not used. No `/** ... */` doc comments anywhere in `src/` or `scripts/`.
## Function Design
- API routes always return `new Response(JSON.stringify(...), { status, headers })`
- Helpers either return primitives (`string | null`, `boolean`) or arrays/objects; never throw across module boundaries.
## Module Design
- Named exports only. `export const POST: APIRoute = async (...) => { ... };` and `export const GET: APIRoute = async (...) => { ... };` (every file in `src/pages/api/`)
- `export const prerender = false;` is the first line of every API route to opt out of static prerendering
- Astro components export nothing — Astro picks up the file as a default export by convention
## Astro Component Conventions
- Pages that read CMS read frontmatter via `gray-matter`: `const raw = fs.readFileSync('src/content/pages/homepage.md', 'utf-8'); const { data: cms } = matter(raw);` (see `src/pages/index.astro:5-8`)
- `data-i18n="namespace.key"` — replaces `textContent`
- `data-i18n-html="namespace.key"` — replaces `innerHTML` (use when value contains markup like `<span class="serif-italic">…</span>`)
- `data-i18n-placeholder="namespace.key"` — replaces input `placeholder`
## CSS Strategy
- CSS custom-property design tokens under `:root` (`--bg-cream`, `--ink`, `--blue-primary`, `--font-serif`, `--font-display`, `--section-gap`, `--ease-out`, `--duration` — see lines 8-55)
- Reset, typography, layout primitives (`.section`, `.container`, `.grid`, `.btn`, `.card`, `.hero`)
- Responsive breakpoints layered as `@media (max-width: 1200px)`, `1024px`, `768px`; wide-display upscaling at `min-width: 1600px`, `1920px`, `2400px` (lines 74-76)
## Content / Translations Authoring
- Page-level content lives in `src/content/pages/*.md` (`homepage.md`, `about.md`, `compound.md`, `hollywood-hideaway.md`, `le-moulin.md`, `maison-de-la-riviere.md`)
- Per-house content lives in `src/content/homes/*.md` (`le-moulin.md`, `la-grange.md`, `le-jardin.md`)
- Service pages in `src/content/services/*.md` (`catering.md`, `wellness.md`)
- Frontmatter is YAML; pages read it via `gray-matter` and render `cms.fieldName` directly (`src/pages/index.astro:7-8`)
- Galleries are arrays of strings or `{ src, alt, caption }` objects in frontmatter (per memory `[[Session 2026-04-29: photo integration]]`)
- Static fallback dict in `src/i18n/translations.ts` (792 lines) — keyed by dot-namespaced strings (`'nav.homes'`, `'home.intro.text'`, `'footer.tagline'`)
- Runtime translations in `public/i18n/translations.json` — fetched via `/api/translations` which proxies the latest copy from GitHub raw (`src/pages/api/translations.ts:14-19`) so dashboard publishes appear without a Vercel rebuild
- Each key has shape `{ en: string, fr: string }`. Default page HTML carries the English copy; the runtime swap happens in `setLanguage()` regardless of `lang` so editor edits to English text replace static markup (see comment in `src/layouts/BaseLayout.astro:1678-1681`)
## Commit Message Conventions
| Prefix | Meaning | Example |
|--------|---------|---------|
| `feat(scope):` | New feature or content addition | `feat(scale): typography + layout scale on wide displays (#51)` |
| `fix(scope):` | Bug fix | `fix(home): remove duplicate tagline + match h2 sizing (#52)` |
| `hotfix(scope):` | Urgent production fix | `hotfix(layout): fully revert PR #42 mobile overflow CSS (#50)` |
| `copy:` | Copy / wording change only | `copy: rename availability heading "When You Can Stay" → "Join us" (#47)` |
| `chore:` | Tooling / non-product change | (3 occurrences) |
| `refactor:` | Internal restructure | (1 occurrence) |
| `SEO:` | SEO-only change | (2 occurrences) |
| `Publish translations - <ISO>` | Auto-commit from dashboard publish flow | `Publish translations - 2026-05-01T14:30:34.215Z` |
| `Update translations via dashboard` | Auto-commit from `src/pages/api/site/save.ts:120` | (73 occurrences — most common message overall) |
- `Update translations via dashboard` (from `src/pages/api/site/save.ts:122`)
- `Update colors via dashboard` (from `src/pages/api/site/save.ts:95`)
- `Publish translations - <ISO timestamp>` (from the publish flow — see `src/pages/api/site/publish.ts`)
## PR Workflow Conventions
- Direct push to `main` is blocked; all changes land via PR squash-merge
- Branch naming follows `<type>/<kebab-case-summary>`: `feat/wide-screen-scale`, `hotfix/body-sizing`, `fix/room-modal-batch`, `copy/availability-join-us`, `feat/melissa-vision-update-2`
- PR titles mirror the commit subject style (`fix(rooms): cream stage + trimmed modal text + drop HH laundry`)
- Vercel auto-deploys `main`; preview deploys are produced per PR
- No GitHub Actions workflows exist (`.github/` directory is absent) — there are no required status checks, so review is the only gate before merge
- The `prebuild` npm script (`scripts/check-public-clean.mjs`) is the only programmatic guard, and it runs locally and on Vercel — it aborts the build if `public/Moulin House Photos/` or `public/photo-source/` exist (raw photo dumps that would explode the deploy)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
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
- All marketing pages prerender to flat HTML — fast, cheap, indexable.
- Translatable strings live in `public/i18n/translations.json` and are overlaid client-side at runtime; the JSON is fetched through `/api/translations` so dashboard-published edits appear without a Vercel rebuild.
- The editor never writes to a database. It commits to GitHub via the contents API and Vercel auto-deploys the resulting commit. Persistence == git history.
- The editor SPA is delivered as a precompiled bundle in `public/editor/assets/` — the source for it lives in a separate repo, and Astro just serves it as a static asset.
## Layers
- Purpose: One Astro file per route; route is filename minus extension (`index.astro` → `/`).
- Location: `src/pages/`
- Contains: Top-level routes (`index.astro`, `about.astro`, `contact.astro`, `the-compound.astro`, `gallery.astro`, `wellness.astro`, `catering.astro`, `success.astro`), plus subdirectory routes for `/homes/`, `/explore/`, `/journal/`.
- Depends on: `src/layouts/BaseLayout.astro`, `src/components/*.astro`, `src/content/**/*.md`.
- Used by: Astro router at build time.
- Purpose: Single `BaseLayout.astro` (1810 lines) containing `<head>`, nav, footer, popup, lang-toggle JS, room-modal JS, editor-inject loader, and most page-level inline `<script is:inline>` blocks.
- Location: `src/layouts/BaseLayout.astro`
- Contains: All shared chrome and most runtime JS for the public site.
- Used by: every page (`<BaseLayout title="…">`).
- Purpose: Reusable Astro components consumed by pages.
- Location: `src/components/`
- Contains: 4 components — `AmenitiesSection`, `AvailabilityCalendar`, `PhotoCarousel`, `RoomShowcase`.
- Pattern: Each accepts an `i18nKey` prop; the component derives child keys (`${i18nKey}.eyebrow`, `${i18nKey}.heading`) and emits `data-i18n` / `data-i18n-html` only when the key is supplied.
- Purpose: Markdown frontmatter as content-source-of-truth for page heroes, photo galleries, amenities, stats.
- Location: `src/content/{homes,pages,services}/*.md`
- Contains: 11 markdown files with no body — only YAML frontmatter (galleries are arrays of `{ src, alt }`).
- Pattern: Loaded with `fs.readFileSync` + `gray-matter` directly inside Astro page frontmatter (NOT Astro's `getCollection()` API — there is no `src/content/config.ts`). See `src/pages/index.astro:7-8` and `src/pages/homes/le-moulin.astro:10-11`.
- Purpose: Server endpoints. Every file declares `export const prerender = false;` to opt out of SSG and run on Vercel.
- Location: `src/pages/api/`
- Contains: `translations.ts`, `availability.ts`, `contact.ts`, `compound.ts`, `newsletter.ts`, `auth/login.ts`, `site/{index,save,publish}.ts`.
- Used by: Public site fetches (translations, availability, form posts) and the Editor SPA (auth, save/publish, dashboard config).
- Purpose: Server-only helpers shared across API routes.
- Location: `src/lib/auth.ts` (only file).
- Contains: `createSession()` / `checkAuth()` — HMAC-SHA256 signed cookie of the form `authenticated:<ts>:<sig>`.
- Purpose: Single `global.css` (~30k) imported by `BaseLayout.astro`. CSS custom properties on `:root` are how the dashboard edits colors (the save endpoint regex-rewrites them).
- Location: `src/styles/global.css`
## Data Flow
### Public site request
### Click-to-edit save flow
### Availability flow
- Public site: language preference in `localStorage['lang']`; chocolate-popup dismissal in `localStorage['mar_chocolate_popup_seen']`.
- Editor: unsaved edits mirrored to `localStorage['maison_editor_unsaved_v1']` by guardrails; SPA owns the in-memory edit map.
- Server: cookie `maison_session` (HMAC-signed, 30-day expiry).
## Key Abstractions
- Purpose: Dot-namespaced string (`nav.homes`, `home.testimonial.quote`, `moulin.hero.heading`) that addresses one translatable value with EN/FR variants.
- Source of truth: `public/i18n/translations.json` (deployed) and `src/i18n/translations.ts` (typed seed/legacy export).
- Two attribute schemes — `data-i18n` for plain text (`textContent` swap) and `data-i18n-html` for fragments containing inline markup like `<span class="serif-italic">…</span>` (`innerHTML` swap).
- Examples: `src/layouts/BaseLayout.astro:85, 137`; `src/components/PhotoCarousel.astro:24-25`.
- Purpose: A markdown file with no body whose frontmatter is the page's structured content.
- Examples: `src/content/homes/le-moulin.md` (stats + amenities), `src/content/pages/le-moulin.md` (gallery array of `{ src, alt }`).
- Pattern: Loaded inline via `fs.readFileSync(...)` + `matter(raw).data`, surfaced to the template as `cms.gallery`, `cms.heroImage`, etc.
## Entry Points
- Location: `src/pages/index.astro` (built to `/`), `src/pages/<route>.astro` (`/<route>/`), and subdirectories for nested routes.
- Triggers: HTTP GET on Vercel.
- Responsibilities: Compose `BaseLayout` + components + frontmatter data into static HTML.
- Location: `public/editor/index.html` (precompiled — bundle filenames hashed: `assets/index-D5eDIkAX.js`, `assets/index-C4VZbOx6.css`).
- Triggers: Direct nav to `editor.moulinareves.com/` (rewritten by `middleware.ts`) or `/editor` on the main domain (rewritten by `vercel.json`).
- Responsibilities: Render React dashboard, mount preview iframe, post diffs to `/api/site/save` and `/api/site/publish`.
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
### Hardcoding translatable copy
### Reading `getCollection()` for content
### Editing `src/i18n/translations.ts` and expecting a runtime change
## Error Handling
- API routes wrap their handler in `try / catch`, return `new Response(JSON.stringify({ error: err.message }), { status: 500 })`.
- Translations fetch in `BaseLayout.astro:1688-1703` falls back to a hardcoded nav-only object on network failure.
- The editor inject script swallows clipboard/selection errors (`catch (_) {}`) so a single bad element doesn't kill click-to-edit.
- `availability.ts` returns empty arrays if either ICS feed fails, never blocking the calendar.
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
