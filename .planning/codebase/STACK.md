# Technology Stack

**Analysis Date:** 2026-05-05

## Languages

**Primary:**
- TypeScript (strict) — used in API routes (`src/pages/api/**/*.ts`), `src/lib/auth.ts`, `middleware.ts`, and `src/i18n/translations.ts`. Strict mode comes from `astro/tsconfigs/strict` (see `tsconfig.json`).
- Astro `.astro` components (HTML + scoped JS/CSS islands) — every route under `src/pages/` plus `src/layouts/BaseLayout.astro` (~1.6k lines, ships global CSS, head, nav, footer, language toggle, third-party scripts).
- JavaScript (ESM `.mjs`) — build/maintenance scripts under `scripts/` (photo pipeline, Neon admin, prebuild guard).

**Secondary:**
- Plain CSS (one global stylesheet) — `src/styles/global.css`. Imports two Google Fonts at the top:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  ```
  Tokens: `--font-display: 'DM Sans'`, `--font-serif: 'Cormorant Garamond'`, `--font-body: 'DM Sans'`.
- JSON content — `public/i18n/translations.json` (canonical translations, edited by the editor SPA), `scripts/photo-mapping.json` (~25 KB, drives Sharp pipeline).
- Markdown — content collections under `src/content/{homes,pages,services}/` (e.g. `src/content/homes/le-moulin.md`, `src/content/pages/homepage.md`).
- HTML — `public/admin/index.html` (Decap CMS shell), `public/editor/index.html` (compiled editor SPA shell), `public/google24a82c8f19f114ef.html` (Google Search Console verification token).
- YAML — `public/admin/config.yml` (Decap CMS schema, ~165 lines).

## Runtime

**Environment:**
- Node.js — pinned to **24** via `.nvmrc` (single line: `24`) and `package.json` engines (`"node": ">=24.0.0"`). Documented as a hard requirement in `.claude` editor session notes (Sharp + Astro 6 need it).
- Browser runtime: Astro builds a static site (no client framework), with two non-Astro browser bundles served from `public/`:
  - `/admin/` — Decap CMS, loaded from `https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js` (CDN, no install).
  - `/editor/` — pre-bundled React SPA shipped as raw assets at `public/editor/assets/index-D5eDIkAX.js` (~180 KB) and `public/editor/assets/index-C4VZbOx6.css` (~14 KB). Source for the SPA lives outside this repo; bundles are committed to `public/` so Astro serves them as-is.

**Edge Runtime:**
- Vercel Edge Middleware via `@vercel/edge` (`middleware.ts`). Matcher `'/'` rewrites `editor.moulinareves.com/` to `/editor/index.html` so the SPA serves on its own subdomain without changing the URL bar.

**Package Manager:**
- npm — `package-lock.json` is committed (~200 KB). No yarn/pnpm/bun lockfiles present.

## Frameworks

**Core:**
- **Astro `^6.1.2`** — static-site framework. `astro.config.mjs`:
  ```js
  export default defineConfig({
    site: 'https://www.moulinareves.com',
    output: 'static',
    adapter: vercel(),
    integrations: [sitemap({
      filter: (page) => !page.includes('/success/') && !page.includes('/the-compound/')
    })],
  });
  ```
  - `output: 'static'` — pages are prerendered HTML.
  - API routes opt out of prerendering individually with `export const prerender = false;` (every file in `src/pages/api/**` does this so they run as Vercel Functions).
- **`@astrojs/vercel` `^10.0.4`** — adapter that turns non-prerendered routes into Vercel Functions and wires up the `vercel.json` build artifact.
- **`@astrojs/sitemap` `^3.7.2`** — emits `sitemap-index.xml` referenced from `public/robots.txt`. `/success/` and `/the-compound/` are excluded.
- **`@vercel/edge` `^1.2.2`** — used only by `middleware.ts` for the editor subdomain rewrite.

**Testing:**
- None detected. No `jest.config.*`, `vitest.config.*`, `*.test.*`, or `*.spec.*` files in the repo. There is no `test` script in `package.json`. QA is manual (see `.claude/.../qa_session_*.md` notes).

**Build/Dev:**
- **Sharp `^0.34.5`** (devDependencies) — image pipeline used by `scripts/process-photos.mjs`, `scripts/make-previews.mjs`, `scripts/make-all-previews.mjs`. Resizes to max 2000px and emits WebP at quality 85 for production photos.
- **Astro CLI** — `astro dev`, `astro build`, `astro preview`.

## Key Dependencies

**Critical (production):**
- `astro` `^6.1.2` — see above.
- `@astrojs/vercel` `^10.0.4` — Vercel adapter.
- `@astrojs/sitemap` `^3.7.2` — sitemap generator.
- `@vercel/edge` `^1.2.2` — edge middleware helpers.
- `gray-matter` `^4.0.3` — declared as a dependency, indicates frontmatter parsing for the `src/content/**` markdown collections (Astro content layer).
- `@neondatabase/serverless` `^1.0.2` — declared but **NOT used by any runtime code in `src/`**. Only imported from `scripts/phase3-list-tables.mjs` and `scripts/phase3-drop-tables.mjs`, which are one-shot ops scripts for tearing down legacy analytics tables on a Neon Postgres branch (read `.env.phase3` directly, gitignored). This is leftover plumbing from a now-decommissioned analytics system.

**Infrastructure / dev:**
- `sharp` `^0.34.5` (devDependencies) — image processing.

## Configuration

**Environment variables (referenced via `import.meta.env`):**
- `GITHUB_TOKEN`, `GITHUB_REPO` — used by `src/pages/api/translations.ts`, `src/pages/api/site/index.ts`, `src/pages/api/site/save.ts`, `src/pages/api/site/publish.ts` to read/write content via the GitHub Contents API.
- `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `AIRTABLE_CONTACT_TABLE`, `AIRTABLE_COMPOUND_TABLE`, `AIRTABLE_NEWSLETTER_TABLE` — form submissions in `src/pages/api/contact.ts`, `src/pages/api/compound.ts`, `src/pages/api/newsletter.ts`.
- `DASHBOARD_PASSWORD` — `src/lib/auth.ts` (HMAC-signed session cookie). Falls back to literal `'moulin2024'` if unset (note: this default is a real secret-shaped string in source, not a placeholder).
- `DATABASE_URL` — only read by `scripts/phase3-*.mjs` from a separate file `.env.phase3` (not via Vite). Not used at runtime.

**Local env files (existence only, not read):**
- `.env` (~812 B) and `.env.local` (~2.6 KB) at repo root — gitignored.
- `.env.production`, `.env*.local` — covered by `.gitignore`.
- `.env.phase3` referenced by Neon scripts — gitignored.

**Astro / TS:**
- `astro.config.mjs` — see snippet above.
- `tsconfig.json`:
  ```json
  {
    "extends": "astro/tsconfigs/strict",
    "include": [".astro/types.d.ts", "**/*"],
    "exclude": ["dist"]
  }
  ```
- `.astro/` — generated content-collection types; gitignored.

**Build pipeline guard:**
- `scripts/check-public-clean.mjs` runs as `prebuild`. It hard-fails the build if either `public/Moulin House Photos/` or `public/photo-source/` exists, because these raw photo dumps would balloon the Vercel deploy. Logged as a critical gotcha (Editor session, photo integration session).

## Platform Requirements

**Development:**
- Node 24 (matches `.nvmrc` and `package.json` engines).
- npm.
- Optional: `../photo-source/` directory **outside** the repo for the Sharp pipeline (`scripts/generate-photo-mapping.mjs` reads from `resolve(REPO_ROOT, "..", "photo-source")`).

**Local commands:**
```bash
npm install
npm run dev       # astro dev — defaults to localhost:4321
npm run build     # runs prebuild guard, then astro build → dist/
npm run preview   # astro preview
npm run astro -- --help
```

**Production:**
- Primary deploy: **Vercel** (project ID `prj_RIo7DcBIYysCuz9zhnI71u1Ifrb4`, team `team_mYKN6qZrDebsHJGJaiN7XqrY`, project name `moulin-a-reves` — from `.vercel/project.json`). The Astro Vercel adapter splits the build into static assets + Functions for non-prerendered API routes; edge middleware ships from `middleware.ts`. Deploy domains: `www.moulinareves.com`, plus `editor.moulinareves.com` and `analytics.moulinareves.com` subdomains.
- Secondary: **Netlify** config exists (`netlify.toml`):
  ```toml
  [build]
    command = "npm run build"
    publish = "dist"

  [[redirects]]
    from = "/admin"
    to = "/admin/index.html"
    status = 200
  ```
  A `.netlify/state.json` is present (53 B) but `.gitignore` excludes the rest of `.netlify/`. **The active production target is Vercel** — `astro.config.mjs` uses `adapter: vercel()`, the Vercel adapter rewrites the build for Functions/Edge, and `vercel.json` defines production rewrites/redirects. The Netlify config appears to be vestigial from before the Vercel migration; deploying to Netlify would not run the API routes (they'd 404) because the Vercel adapter doesn't emit Netlify Functions. Treat `netlify.toml` as legacy unless explicitly resurrected.
- `.vercelignore` keeps raw photo dumps out of the deploy:
  ```
  public/Moulin House Photos/
  public/photo-source/
  ```
- `vercel.json` rewrites and redirects:
  ```json
  {
    "rewrites": [
      { "source": "/admin", "destination": "/admin/index.html" },
      { "source": "/editor", "destination": "/editor/index.html" }
    ],
    "redirects": [
      { "source": "/analytics", "destination": "https://analytics.moulinareves.com/", "permanent": false },
      { "source": "/analytics/:path*", "destination": "https://analytics.moulinareves.com/", "permanent": false }
    ]
  }
  ```

---

*Stack analysis: 2026-05-05*
