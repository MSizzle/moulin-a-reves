# External Integrations

**Analysis Date:** 2026-05-05

## APIs & External Services

**Source-of-truth content store (GitHub Contents API):**
- The click-to-edit editor SPA reads and writes site content directly to the GitHub repo on `main`. There is no separate database for translations or design tokens — GitHub *is* the CMS.
- Endpoint: `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}` (GET for reads, PUT for writes, base64-encoded content + previous file SHA).
- Files touched:
  - `public/i18n/translations.json` — the canonical translations dictionary that `src/i18n/translations.ts` mirrors and that `public/editor-inject.js` fetches at edit time.
  - `src/styles/global.css` — `:root` CSS variables (colors only) updated via a regex pass in `applyColorsToCss()`.
- Auth: Bearer token via `Authorization: Bearer ${GITHUB_TOKEN}` header, `Accept: application/vnd.github.v3.raw` for reads, `application/vnd.github.v3+json` for the SHA + PUT.
- Env vars: `GITHUB_TOKEN`, `GITHUB_REPO` (e.g. `MSizzle/moulin-a-reves`).
- Code: `src/pages/api/translations.ts:5-17`, `src/pages/api/site/index.ts:6-22`, `src/pages/api/site/save.ts:6-73`, `src/pages/api/site/publish.ts:6-73`.
- Save flow: editor POSTs to `/api/site/save` (draft commit message `"Update colors via dashboard"` / `"Update translations via dashboard"`) or `/api/site/publish` (commit message `"Publish translations - <ISO timestamp>"`). Both routes merge editor payload over the latest remote translations to preserve keys added directly by a developer in git ("editor wins, but only for keys it sent"). On commit, **Vercel auto-deploys `main`** — that's the entire publish pipeline.

**Decap CMS (admin panel, currently parallel to the editor):**
- Loaded from CDN: `<script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>` in `public/admin/index.html`.
- Backend config (`public/admin/config.yml:1-7`):
  ```yaml
  backend:
    name: github
    repo: MSizzle/moulin-a-reves
    branch: main
    auth_type: pkce
    app_id: moulin-a-reves-cms
  ```
  Uses GitHub OAuth via PKCE (no server-side proxy), targeting the same `main` branch the editor commits to.
- Manages five collections rooted in `src/content/`: `homes`, `pages` (homepage / about / compound), `activities`, `journal`, `testimonials`, plus `services/{catering,wellness}.md`.
- Cloudinary media library is **commented out** in `public/admin/config.yml:11-16` — placeholder, no creds in repo.

**Booking platform iCal feeds (read-only):**
- `src/pages/api/availability.ts` polls two iCal URLs server-side and merges them into a JSON list of blocked dates for the availability calendar:
  ```ts
  const AIRBNB_ICS =
    'https://www.airbnb.com/calendar/ical/1655005094020930707.ics?t=5ba028e138df4f7ca43098b034f2b0af';
  const VRBO_ICS =
    'https://www.vrbo.com/icalendar/d6abff732437470f905c703bf1e9aea3.ics?nonTentative';
  ```
  Tokens are baked into source. CDN-cached: `Cache-Control: public, s-maxage=900, stale-while-revalidate=3600` (15 min fresh, 1 h stale).
- Consumer: `src/components/AvailabilityCalendar.astro`.

**Airtable (form sink for inquiries / RSVPs / newsletter):**
- All three POST routes use the same auth + base ID, different table names.
- Endpoint: `POST https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE}` with `Authorization: Bearer ${AIRTABLE_TOKEN}` and `Content-Type: application/json`.
- Routes and tables:
  - `src/pages/api/contact.ts` → `AIRTABLE_CONTACT_TABLE` — fields: `Name`, `Email`, `Check-in`, `Check-out`, `Adults`, `Children`, `Dogs`, `Houses`, `Message`, `Submitted At`, `Status: 'Todo'`.
  - `src/pages/api/compound.ts` → `AIRTABLE_COMPOUND_TABLE` — fields: `Name`, `Email`, `Dates`, `Guests`, `Occasion`, `Message`, `Submitted At`, `Status: 'Todo'`.
  - `src/pages/api/newsletter.ts` → `AIRTABLE_NEWSLETTER_TABLE` — fields: `Email`, `Source` (default `'Footer'`), `Submitted At`.
- Env vars: `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `AIRTABLE_CONTACT_TABLE`, `AIRTABLE_COMPOUND_TABLE`, `AIRTABLE_NEWSLETTER_TABLE`.

**Google Fonts:**
- `src/styles/global.css:6` imports `Cormorant Garamond` + `DM Sans` directly via `@import url('https://fonts.googleapis.com/css2?...&display=swap');`.
- `src/layouts/BaseLayout.astro:54-55` adds `<link rel="preconnect" href="https://fonts.googleapis.com" />` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`. There is no self-hosted fallback.

**OpenStreetMap embed:**
- `src/pages/contact.astro:144` embeds an OSM iframe centered on Mérévillois:
  ```
  https://www.openstreetmap.org/export/embed.html?bbox=2.05%2C48.28%2C2.15%2C48.36&layer=mapnik&marker=48.3167%2C2.0833
  ```
- No API key needed; no Mapbox / Google Maps integration.

## Data Storage

**Databases:**
- **None at runtime.** `@neondatabase/serverless` is in `dependencies` but only reachable from `scripts/phase3-list-tables.mjs` and `scripts/phase3-drop-tables.mjs`, which read `DATABASE_URL` from a local `.env.phase3` file and exist solely to clean up dead tables (`events`, `active_visitors`, `geo_cache`) on a Neon Postgres branch from a decommissioned analytics system. **Do not assume Postgres is in the request path** — it isn't.

**File Storage:**
- All images are committed to the repo under `public/images/**` (WebP, processed via Sharp from `../photo-source/` outside the repo). No S3/R2/Cloudinary at runtime — Cloudinary is wired up but commented out in `public/admin/config.yml`.
- Raw source dumps must NOT live under `public/` — `scripts/check-public-clean.mjs` (run as `prebuild`) hard-fails the build if `public/Moulin House Photos/` or `public/photo-source/` is present. `.vercelignore` enforces the same rule for deploys.

**Caching:**
- Vercel's edge CDN, configured per-route via `Cache-Control` headers on the API responses:
  - `/api/translations` — `public, s-maxage=10, stale-while-revalidate=60` (collapses bursts of GitHub calls during heavy editing).
  - `/api/availability` — `public, s-maxage=900, stale-while-revalidate=3600`.
- No Redis / Upstash.

## Authentication & Identity

**Editor session (custom HMAC):**
- `src/lib/auth.ts` implements a homegrown HMAC-SHA-256 cookie session. Token format: `authenticated:<timestamp>:<signature>`. Signed with `DASHBOARD_PASSWORD` itself as the secret (key + secret are the same value, fallback `'moulin2024'`).
- Cookie: `maison_session`, `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, `maxAge: 2592000` (30 days). Set in `src/pages/api/auth/login.ts:163-169`.
- Login flow: `GET /api/auth/login` returns an inline HTML password form (with the "Prometheus" watermark in the bottom-right corner). `POST /api/auth/login` validates against `DASHBOARD_PASSWORD` and 302s to `/editor/`.
- Authorization gate: `checkAuth(request)` is called at the top of `src/pages/api/site/{index,save,publish}.ts`, returning 401 JSON if the cookie is invalid/expired.

**Decap CMS authentication:**
- PKCE OAuth directly against GitHub (configured in `public/admin/config.yml`, `auth_type: pkce`, `app_id: moulin-a-reves-cms`). No server-side OAuth proxy; the GitHub OAuth app handles it client-side. Independent of the `maison_session` cookie above.

**No other auth providers** — no Auth0, Clerk, Supabase Auth, NextAuth, etc.

## Monitoring & Observability

**Error Tracking:**
- None. No Sentry, Datadog, or similar SDK detected anywhere in `src/` or `public/`.
- API routes silently swallow upstream errors (e.g. `src/pages/api/availability.ts:74` returns `[]` on a fetch failure; `src/pages/api/translations.ts:40-48` returns `{}` with status 200 on any error).

**Analytics:**
- **Umami, self-hosted at `analytics.moulinareves.com`.** Loaded globally in `src/layouts/BaseLayout.astro:67-71`:
  ```html
  <!-- Analytics (Umami, self-hosted) -->
  <script
    defer
    src="https://analytics.moulinareves.com/script.js"
    data-website-id="298110cf-9078-4b02-9c00-53e0daaab476"
  ></script>
  ```
- `vercel.json` redirects `/analytics` and `/analytics/:path*` to `https://analytics.moulinareves.com/` so the dashboard URL stays on-brand.
- No Google Analytics / GA4 / Plausible / Fathom / PostHog / Hotjar detected.

**Logs:**
- API routes use `console.error`-style returns with JSON error bodies (no structured logger). Vercel collects request logs by default.

## CI/CD & Deployment

**Hosting (active):**
- **Vercel.** Project ID `prj_RIo7DcBIYysCuz9zhnI71u1Ifrb4`, org/team ID `team_mYKN6qZrDebsHJGJaiN7XqrY`, project name `moulin-a-reves` (from `.vercel/project.json`).
- Production domain: `www.moulinareves.com` (canonical in `astro.config.mjs` `site:` and `BaseLayout.astro:16`).
- Subdomains:
  - `editor.moulinareves.com` — handled by `middleware.ts` rewriting `/` → `/editor/index.html`.
  - `analytics.moulinareves.com` — self-hosted Umami (separate deploy).
- Deploy trigger: push to `main`. Per `.claude/.../deployment.md`: direct push to `main` is blocked, merges happen via PR, and Vercel auto-deploys `main`. The editor's "Publish" button creates a commit on `main` via the GitHub API, which auto-triggers a Vercel build.

**Hosting (legacy / dormant):**
- **Netlify** config still exists (`netlify.toml`, `.netlify/state.json`). Not the active target — see STACK.md for details.

**CI Pipeline:**
- No GitHub Actions, GitLab CI, CircleCI, or other CI config detected (no `.github/workflows/`, no `.circleci/`). Vercel's own Git integration is the only automation.
- `prebuild` runs `node scripts/check-public-clean.mjs` locally and on Vercel — guards against shipping raw photo source folders.

## Environment Configuration

**Required env vars (set in Vercel project settings):**

| Var | Used by | Purpose |
|-----|---------|---------|
| `GITHUB_TOKEN` | `src/pages/api/translations.ts`, `src/pages/api/site/{index,save,publish}.ts` | Auth for GitHub Contents API reads + writes. Needs `repo` scope on `MSizzle/moulin-a-reves`. |
| `GITHUB_REPO` | same files | Repo slug, e.g. `MSizzle/moulin-a-reves`. |
| `DASHBOARD_PASSWORD` | `src/lib/auth.ts`, `src/pages/api/auth/login.ts` | Editor login password + HMAC session secret. Falls back to `'moulin2024'`. |
| `AIRTABLE_TOKEN` | `src/pages/api/{contact,compound,newsletter}.ts` | PAT for Airtable. |
| `AIRTABLE_BASE_ID` | same | Airtable base. |
| `AIRTABLE_CONTACT_TABLE` | `src/pages/api/contact.ts` | Inquiry table name. |
| `AIRTABLE_COMPOUND_TABLE` | `src/pages/api/compound.ts` | Compound RSVP table name. |
| `AIRTABLE_NEWSLETTER_TABLE` | `src/pages/api/newsletter.ts` | Newsletter signups table name. |

**Local env files (existence only, not read):**
- `.env`, `.env.local` at repo root — gitignored.
- `.env.phase3` — local-only file for the Neon scripts; gitignored, decoupled from `import.meta.env`.

**Secrets location:**
- Production: Vercel project environment variables.
- Local dev: `.env.local` (Vite/Astro picks it up via `import.meta.env`).

## Webhooks & Callbacks

**Incoming:**
- None. The site does not expose webhook receivers (no Stripe, Airtable, GitHub-webhook routes).

**Outgoing:**
- GitHub Contents API PUTs — every editor save/publish (`src/pages/api/site/save.ts:62-72`, `src/pages/api/site/publish.ts:62-72`).
- Airtable `POST /v0/...` — every form submission.
- iCal fetches to Airbnb + VRBO — every uncached `/api/availability` request.

## Third-party Browser Scripts

Loaded into every page (via `src/layouts/BaseLayout.astro`):
- **Umami analytics** — `https://analytics.moulinareves.com/script.js` (self-hosted, defer).
- **Google Fonts CSS** — `https://fonts.googleapis.com/css2?family=Cormorant+Garamond:...&family=DM+Sans:...&display=swap` (via `@import` in `src/styles/global.css:6`, with preconnects in `BaseLayout.astro:54-55`).

Loaded only on `/admin/`:
- **Decap CMS** — `https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js`.

Loaded only on `/editor/`:
- The pre-bundled editor SPA from `public/editor/assets/index-D5eDIkAX.js` (committed binary; rebuilt outside this repo). `public/editor/guardrails.js` adds non-bundle behaviour: Revert confirm prompt, beforeunload-while-dirty warning, and localStorage autosave of click-to-edit messages keyed by `maison_editor_unsaved_v1`. `public/editor-inject.js` is loaded *inside the preview iframe* and posts `mar-i18n-edit` messages to the parent window.

## SEO / Verification

- **Google Search Console** — verification token at `public/google24a82c8f19f114ef.html`:
  ```
  google-site-verification: google24a82c8f19f114ef.html
  ```
- `public/robots.txt`:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://www.moulinareves.com/sitemap-index.xml

  # Block admin panel from indexing
  User-agent: *
  Disallow: /admin/
  ```
- Sitemap is generated by `@astrojs/sitemap` (excludes `/success/` and `/the-compound/` — the latter is an unlisted "private" landing page).

---

*Integration audit: 2026-05-05*
