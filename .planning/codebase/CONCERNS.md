# Codebase Concerns

**Analysis Date:** 2026-05-05

A risk register grounded in evidence. Citations refer to actual files, commits (`git log --oneline`), and grep hits on `main` as of 2026-05-05.

---

## Tech Debt

### Dual deploy-target configuration (Vercel + Netlify)

- **Issue:** Both `vercel.json` and `netlify.toml` are checked in, plus a `.netlify/` directory and a `.vercel/` directory. `astro.config.mjs` is hardwired to `vercel()` (`adapter: vercel()`), and `package.json` depends on `@astrojs/vercel` and `@vercel/edge`. `middleware.ts` is a Vercel Edge Middleware. The Netlify config is dead code that confuses humans (and future agents) about where the site actually deploys.
- **Files:** `vercel.json`, `netlify.toml`, `astro.config.mjs`, `middleware.ts`, `package.json`, `.netlify/`, `.vercel/`
- **Impact:** Drift risk — a contributor changes redirects in `netlify.toml` and assumes they took effect; they didn't. Also pollutes `gh` PR descriptions with stale "Netlify deploy" UX.
- **Fix approach:** Delete `netlify.toml` and the `.netlify/` directory. Add a one-line note in `README.md` that the deploy target is Vercel.

### Legacy `la-grange-*` photo naming references

- **Issue:** The third house was renamed (PR #35: "rename house 'Le Moulin à Rêves' → 'Le Moulin'", and prior renames produced `Le Jardin` / `La Maison de la Rivière` / `Hollywood Hideaway`), but image filenames and one content file were never renamed. There is no `/homes/la-grange/` page (the route shows `hollywood-hideaway.astro`, `le-moulin.astro`, `maison-de-la-riviere.astro` only), yet:
  - `src/content/homes/la-grange.md` (orphaned content entry, references `la-grange-hero.jpg` which doesn't exist — only `la-grange-hero.webp` is on disk).
  - `src/pages/the-compound.astro:12-52` references nine `/images/homes/la-grange-*.webp` paths.
  - `src/pages/index.astro:41-100` references `la-grange-pavilion-wide.webp`, `la-grange-fire.webp`, `la-grange-gym-boxing.webp`, `la-grange-bikes.webp`, `la-grange-bikes-door.webp`, `la-grange-screening-2.webp`, `la-grange-carriage.webp`.
  - `src/pages/journal/planning-family-reunion-france.astro:54` links `<a href="/homes/la-grange/">La Grange</a>` — **broken link** (the route was decommissioned by PR #35).
  - `src/pages/contact.astro:98` has `<option value="la-grange">La Grange</option>` in the inquiry form, so the Airtable record gets `Houses: la-grange` for selections that the marketing copy now calls something else.
  - `scripts/photo-mapping.json` lines 429–487 still target `la-grange-*` paths.
  - `public/images/README.md` references the legacy slug.
- **Files:** `src/content/homes/la-grange.md`, `src/pages/the-compound.astro:12-52`, `src/pages/index.astro:41-100`, `src/pages/journal/planning-family-reunion-france.astro:54`, `src/pages/contact.astro:98`, `scripts/photo-mapping.json`, `public/images/README.md`, `public/images/homes/la-grange-*.webp` (~10 files)
- **Impact:** Broken `/homes/la-grange/` link in journal copy; mismatched form values vs. dashboard labels; future "rename photos" pass has to chase references in 7+ files; `la-grange.md` has a `heroImage` pointing at a `.jpg` that doesn't exist.
- **Fix approach:** One PR that (a) deletes `src/content/homes/la-grange.md` if not used, or rewrites it to the canonical slug; (b) renames `la-grange-*.webp` → `<canonical>-*.webp`, updates `scripts/photo-mapping.json` and `public/images/README.md`, and rewrites every `/images/homes/la-grange-*` reference; (c) fixes the journal anchor in `planning-family-reunion-france.astro:54`; (d) updates the `<option value>` in `contact.astro:98`.

### Precompiled editor SPA bundle living in `/public/`

- **Issue:** The dashboard React SPA is shipped as a precompiled bundle at `public/editor/assets/index-D5eDIkAX.js` (176 KB) + `public/editor/assets/index-C4VZbOx6.css` (14 KB), with a hash-stamped filename, but **no source repo / build script in this codebase** produces it. The hand-written companions `public/editor/guardrails.js` and `public/editor-inject.js` patch behavior on top of the opaque bundle. The bundle is the editor — losing the source repo means losing the ability to fix bugs without a full rewrite.
- **Files:** `public/editor/index.html`, `public/editor/assets/index-D5eDIkAX.js`, `public/editor/assets/index-C4VZbOx6.css`, `public/editor/guardrails.js`, `public/editor-inject.js`
- **Impact:** Bundle-vs-companion-script drift is documented in MEMORY.md as a known gotcha. The bundle's UI labels are scraped by `guardrails.js` — `guardrails.js:42-54` literally walks every `<span>`/`<div>` looking for the literal text `"unsaved"` to know if the SPA is dirty. A future SPA rebuild that changes that label silently breaks the `beforeunload` warning and the localStorage autosave/restore flow. There is no test for this.
- **Fix approach:** Either (a) check the SPA source into this repo as a workspace package and wire its build into `npm run build`, or (b) document the upstream repo + how to rebuild + update `index.html` script hash. Add a CI check that verifies the hashed asset filename in `public/editor/index.html` matches the file actually present in `public/editor/assets/`.

### Two parallel attribute schemes for the i18n system

- **Issue:** `data-i18n` (textContent) and `data-i18n-html` (innerHTML) are both supported. The HTML variant exists because plain `data-i18n` collides with Astro's `set:html` for stylized headings that contain `<span class="serif-italic">…</span>` — this collision was the entire reason for PR #4 ("Fix data-i18n + set:html collision on stylized headings"). The runtime applies them in two separate `querySelectorAll` passes (`src/layouts/BaseLayout.astro:1713-1726`). Authors must remember to switch attribute names whenever they introduce inline markup, or click-to-edit in the editor SPA stops working for that field.
- **Files:** `src/layouts/BaseLayout.astro:1713-1726`, `src/components/AvailabilityCalendar.astro:28`, `src/components/RoomShowcase.astro:45`, `src/components/PhotoCarousel.astro:25`, `src/components/AmenitiesSection.astro:61`, `public/editor-inject.js:21-28` (key extraction logic), `src/pages/the-compound.astro:275`, `src/pages/index.astro:214`
- **Impact:** Easy to author a new heading with inline `<span>` and `data-i18n=` — looks fine on the page (the markup wins) but the editor cannot save edits because the SPA hits `set:html` collision and Melissa's published changes get clobbered on next deploy.
- **Fix approach:** Lint rule (or grep in `prebuild`) that flags any `data-i18n=` whose value contains `<` after the static-render pass, and surface a build error.

### `src/content/homes/` orphans drift from `src/pages/homes/`

- **Issue:** `src/content/homes/` has `la-grange.md`, `le-jardin.md`, `le-moulin.md`. `src/pages/homes/` has `hollywood-hideaway.astro`, `le-moulin.astro`, `maison-de-la-riviere.astro`, `index.astro`. The slugs don't match (`le-jardin.md` ↔ no `le-jardin.astro`; `la-grange.md` ↔ no `la-grange.astro`; `hollywood-hideaway.astro` ↔ no `hollywood-hideaway.md` in `homes/`). Astro's content collection isn't actually feeding the home pages — the `.md` files are vestigial.
- **Files:** `src/content/homes/la-grange.md`, `src/content/homes/le-jardin.md`, `src/content/homes/le-moulin.md`, `src/pages/homes/*.astro`
- **Impact:** Editors who think they can change a tagline by editing `src/content/homes/le-jardin.md` will be silently ignored.
- **Fix approach:** Either delete the unused `.md` entries or wire `src/pages/homes/[slug].astro` to read from the collection.

### Open `TODO` and `TODO: write alt text` markers

- `src/pages/index.astro:103` — "TODO(Melissa): drop chicken-coop photos in /public/images/ and append them to the gallery below." Author-facing TODO, not a bug, but it has been in the homepage since before PR #9.
- `scripts/generate-photo-mapping.mjs:101` writes `alt: "TODO: write alt text"` for new photos. `scripts/process-photos.mjs:18-21` then **bails the build** if any entry has that alt — good guard, but means a half-done photo import blocks deploys silently.

### Orphaned `phase3-*` Neon scripts

- `scripts/phase3-list-tables.mjs` and `scripts/phase3-drop-tables.mjs` reference `.env.phase3` and `@neondatabase/serverless`. The package is still in `package.json` `dependencies` but **no application code imports `@neondatabase/serverless`** (`grep -rn "@neondatabase\|neon(" src/` returns nothing). Pure tech debt — ship-side dependency for a one-shot migration script.
- **Fix approach:** Move to `devDependencies` or delete the scripts and the dep.

---

## Known Bugs / Gotchas

### Hero h1 flashes wrong copy on reload (recurring)

- **Symptom:** The homepage hero h1 has, at least twice in recent history, briefly displayed the prior English string before the i18n script swaps it. Fixes shipped in PR #18 ("stop hero h1 flashing to 'Moulin à Rêves' on every reload") and PR #28 ("stop hero h1 flashing 'Live the countryside, unhurried.' on reload"). The root cause — i18n applies *after* `fetch('/api/translations')` resolves (`src/layouts/BaseLayout.astro:1682`) — is unfixed; the bandaids change the SSR'd default text to match the English translation.
- **Files:** `src/layouts/BaseLayout.astro:1676-1726`, `src/pages/index.astro:214`
- **Trigger:** Any time the static markup and `translations.json[*].en` disagree — which happens every time Melissa edits a hero string in the dashboard without a Vercel rebuild.
- **Workaround:** Manually keep static h1 markup in sync with `home.title.en`. The dashboard does not enforce this.

### Cache-busting required after editor changes

- **Symptom:** Documented gotcha (MEMORY.md). The editor saves to GitHub via `src/pages/api/site/save.ts` and `publish.ts`, both of which `PUT` to `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`. The live site reads through `/api/translations` which sets `Cache-Control: public, s-maxage=10, stale-while-revalidate=60` (`src/pages/api/translations.ts:39`) — so a published change can take up to ~70 s to appear. The editor SPA itself fetches `cache: 'no-store'` (`public/editor-inject.js:41`, `src/layouts/BaseLayout.astro:1682`) so the *editor* sees fresh data, but anonymous visitors don't.
- **Files:** `src/pages/api/translations.ts:39`, `src/pages/api/site/save.ts`, `src/pages/api/site/publish.ts`
- **Impact:** "I published it but the site still shows the old text" support tickets. Confusing because the editor's preview iframe is fresh.
- **Fix approach:** Already mitigated by `s-maxage=10`. Document the 60 s tail in the editor UI ("changes appear in ~1 minute on the live site").

### `data-i18n-html` required for any string with inline markup

- **Symptom:** Documented gotcha (MEMORY.md). If you author `<h2 data-i18n="some.key">Les <span>Maisons</span></h2>`, Astro's `set:html` will fight the runtime swap and the editor will appear to save but the value won't render correctly. Caught for `RoomShowcase`, `PhotoCarousel`, `AvailabilityCalendar`, `AmenitiesSection` (PR #4) but no lint rule prevents reintroduction.
- **Files:** `src/components/{AvailabilityCalendar,RoomShowcase,PhotoCarousel,AmenitiesSection}.astro`, any new component using `set:html` on translatable text.

### `availability.ts` always-true filter

- **Symptom:** `src/pages/api/availability.ts:96-99` filters: `summary !== 'not available' ? true : true` — both branches return `true`, so the filter is a no-op. It looks like a half-finished attempt to drop "not available" placeholders from an iCal feed.
- **Files:** `src/pages/api/availability.ts:96-99`
- **Impact:** Cosmetic right now; will mislead anyone who reads it expecting the filter to do something.
- **Fix approach:** Remove the filter, or implement it: `summary !== 'not available'`.

---

## Security Considerations

### Default fallback dashboard password is hard-coded

- **Risk:** `src/lib/auth.ts:1` and `src/lib/auth.ts:4` both fall back to the literal `'moulin2024'` when `import.meta.env.DASHBOARD_PASSWORD` is unset. If Vercel ever loses the env var (rotated, mis-deployed preview branch, etc.) the dashboard silently accepts the public default — and this string is in plaintext in the public git history.
- **Files:** `src/lib/auth.ts:1`, `src/lib/auth.ts:4`
- **Current mitigation:** Production presumably has `DASHBOARD_PASSWORD` set on Vercel.
- **Recommendations:** Refuse to start (`throw`) if `DASHBOARD_PASSWORD` is unset on a non-dev build. Don't reuse the password as the HMAC signing secret — derive a separate `SESSION_SIGNING_SECRET` so a password rotation doesn't invalidate every existing cookie (and so the password doesn't leak through HMAC oracle attacks).

### Session token format has weak invariants

- **Risk:** `src/lib/auth.ts:21-24` produces tokens of the form `authenticated:<timestamp>:<hmac>`. The HMAC covers `authenticated:<timestamp>` only, not a user identifier (there is only one user, so OK for now). The 30-day window (`src/lib/auth.ts:51`) is enforced client-side — a leaked cookie is valid for up to 30 days with no server-side revocation list.
- **Files:** `src/lib/auth.ts:20-55`
- **Impact:** No way to log out all sessions if a cookie is exfiltrated short of rotating `DASHBOARD_PASSWORD`, which the comment at line 4 says doubles as the signing key — rotating it invalidates everyone.

### No CSRF, no rate limiting, no bot protection on auth or save endpoints

- **Risk:** `grep -rn "rate\|limit\|throttle\|csrf" src/pages/api/` returns nothing. `src/pages/api/auth/login.ts` accepts both JSON and form-encoded passwords; an attacker can run a credential-stuffing loop directly against `/api/auth/login` from any origin (CORS not restricted in code). `src/pages/api/site/save.ts` and `publish.ts` will then write to GitHub on the attacker's behalf.
- **Files:** `src/pages/api/auth/login.ts:139-183`, `src/pages/api/site/save.ts`, `src/pages/api/site/publish.ts`, `src/pages/api/contact.ts`, `src/pages/api/newsletter.ts`, `src/pages/api/compound.ts`
- **Current mitigation:** Single-user password; `httpOnly`/`secure`/`sameSite=lax` cookie. Form-style honeypot referenced in newsletter (`bot-field`), but no rate limiting.
- **Recommendations:** Add Vercel-edge rate limiting (e.g., Upstash) on `/api/auth/login` and the `site/*` endpoints. Add an honeypot or hCaptcha on the public Airtable POSTs (`contact.ts`, `newsletter.ts`, `compound.ts`) which currently let any drive-by bot fill Melissa's Airtable.

### GitHub PAT scope and storage

- **Risk:** Four endpoints (`api/translations.ts:5`, `api/site/index.ts:6`, `api/site/save.ts:6`, `api/site/publish.ts:6`) read `import.meta.env.GITHUB_TOKEN` and use it as a Bearer token against `api.github.com/repos/.../contents/`. The token therefore has at minimum `contents:write` on the repo. A leak (Vercel env dump, build-log echo, prefix-shadowed preview) gives an attacker push access to `main`, which Vercel auto-deploys.
- **Files:** `src/pages/api/translations.ts:5`, `src/pages/api/site/index.ts:6`, `src/pages/api/site/save.ts:6`, `src/pages/api/site/publish.ts:6`
- **Current mitigation:** Token never logged in the code paths I reviewed. Cookies signed; 30-day TTL.
- **Recommendations:** Use a fine-grained PAT or a GitHub App installation token scoped to `contents:write` on this repo only. Set a 90-day rotation reminder.

### Local env file inventory (existence only, contents not read)

- **Files present (do NOT commit):**
  - `.env` (~812 bytes, modified 2026-04-30) — gitignored via `.gitignore:14`.
  - `.env.local` (~2648 bytes, modified 2026-04-09) — gitignored via `.gitignore:38` (`.env*.local` glob).
- **Code references that require these vars:** `DASHBOARD_PASSWORD`, `GITHUB_TOKEN`, `GITHUB_REPO`, `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `AIRTABLE_CONTACT_TABLE`, `AIRTABLE_NEWSLETTER_TABLE`, `AIRTABLE_COMPOUND_TABLE`, plus `DATABASE_URL` for the orphan Neon scripts (in `.env.phase3`, also gitignored).
- **Recommendations:** Confirm `.gitignore` actually excluded these from the initial commit (`git log -- .env`) — if any historical commit ever included secrets, rotate them.

### `applyColorsToCss` regex on production CSS

- **Risk:** `src/pages/api/site/save.ts:40-52` and `src/pages/api/site/publish.ts:40-52` rewrite `src/styles/global.css`'s `:root { ... }` block using a non-anchored regex per variable. A malicious or malformed color value (e.g., a value containing `;` or `}`) submitted by an authenticated user can break out of the variable definition and inject arbitrary CSS into the production stylesheet, which is then committed via the GitHub API.
- **Files:** `src/pages/api/site/save.ts:40-52`, `src/pages/api/site/publish.ts:40-52`
- **Current mitigation:** Single-user dashboard, so the trust boundary is "Melissa." But if the auth cookie ever leaks, the attacker can persist arbitrary CSS into `main`.
- **Recommendations:** Validate each color value against `^#[0-9a-fA-F]{3,8}$|^rgb\(...\)$|^var\(...\)$` before the `replace`.

---

## Performance Bottlenecks

### Image weight — `public/images/` is 94 MB, 144 files

- **Problem:** 28 images >1 MB; largest are 1.6 MB (`wellness-hero.webp`), 1.5 MB (`hero-compound.webp`), 1.4 MB+ (`garden-chaise-jetson.webp`, `wellness-jacuzzi-2.webp`, `garden-private-spot.webp`, `garden-chaises.webp`). `public/images/homes/` alone is 57 MB across 88 files.
- **Files:** `public/images/hero-compound.webp` (1.46 MB), `public/images/wellness-hero.webp` (1.64 MB), `public/images/garden-chaise-jetson.webp` (1.38 MB), `public/images/wellness-jacuzzi-2.webp` (1.44 MB), `public/images/garden-private-spot.webp` (1.38 MB), `public/images/garden-chaises.webp` (1.29 MB), `public/images/forest-path.webp` (1.12 MB), `public/images/wellness-massage-willow.webp` (1.05 MB), and ~10 more home photos >1 MB.
- **Cause:** Images are exported at original resolution rather than served via `<picture>` with multiple sizes. `astro.config.mjs` does not configure `image.service` so Astro's image optimizer is not in play. All `<img>` tags are raw HTML (`grep loading=` shows only `loading="lazy"` — no `srcset`, no `sizes`, no `<picture>`).
- **Improvement path:** Run every >500 KB asset through `sharp` at responsive widths (`{640,1024,1600,2400}.webp`) and emit `<picture>` with `srcset`/`sizes`. The toolchain already exists — `scripts/process-photos.mjs` and `scripts/make-previews.mjs` use `sharp`. Add a build step that generates responsive variants and a small Astro component (e.g., `<ResponsivePicture>`) that everyone uses instead of raw `<img>`.

### Hero LCP image not preloaded, not eager

- **Problem:** The homepage above-the-fold image is `/images/homes/le-moulin-hero.webp` rendered by `<img src=... loading="lazy" />` (`src/pages/index.astro:375`). `loading="lazy"` on the LCP image delays paint; no `<link rel="preload">` is emitted for it.
- **Files:** `src/pages/index.astro:375`, `src/layouts/BaseLayout.astro:53-55` (only Google Fonts is preconnected)
- **Improvement path:** Mark the first hero image `loading="eager" fetchpriority="high"` and add a `<link rel="preload" as="image" href="...">` in `BaseLayout`'s head when on the homepage.

### Google Fonts loaded over network on every page

- **Problem:** `src/styles/global.css:6` does `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@...&family=DM+Sans:ital,wght@...&display=swap');` — render-blocking, third-party, blocking on Google's CSS endpoint. `BaseLayout` adds `preconnect` (`:54-55`) but the actual font files still load from `fonts.gstatic.com` synchronously per page.
- **Files:** `src/styles/global.css:6`, `src/layouts/BaseLayout.astro:53-55`
- **Improvement path:** Self-host the two woff2 subsets in `public/fonts/`, drop the `@import`, add `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the regular weights actually used above the fold.

### Editor SPA loads on every visit to `/editor/`

- **Problem:** `public/editor/assets/index-D5eDIkAX.js` is 176 KB minified — a full React + bundle. Loaded synchronously by `public/editor/index.html`'s `<script type="module" crossorigin>` tag. Not relevant to public-site performance, but worth noting since the bundle is also an opaque blob.
- **Files:** `public/editor/index.html`, `public/editor/assets/index-D5eDIkAX.js`

### Translations API has tight CDN cache, but the no-store editor path always hits GitHub

- **Problem:** Every keystroke-triggered preview reload in the editor calls `fetch('/api/translations', { cache: 'no-store' })` (`public/editor-inject.js:41`, `src/layouts/BaseLayout.astro:1682`). With many tabs/devices this can hit the GitHub API rate limit (5,000 req/hr authed) faster than expected.
- **Files:** `src/pages/api/translations.ts`, `public/editor-inject.js:41`, `src/layouts/BaseLayout.astro:1682`
- **Improvement path:** Add an in-memory LRU on the edge function or use the `If-None-Match` ETag header GitHub returns.

---

## Fragile Areas

### Mobile horizontal-overflow CSS (recurring regression hot spot)

- **Files:** `src/styles/global.css:64-86` (current `html`/`body`), `src/layouts/BaseLayout.astro` (multiple `overflow:` rules at 266, 319, 373-374, 386, 409, 487, 567, 686, 733)
- **Why fragile:** Three commits in two days touch the exact same 4 lines:
  - `9476f6c` (PR #42, 2026-05-04ish): added `overflow-x: clip` to both `html` and `body`, plus `max-width: 100%` on body.
  - `250733e` (PR #49, 2026-05-04ish): hotfix removed `overflow-x: clip` and `max-width: 100%` from `body`, replaced with `width: 100%`.
  - `7b264e7` (PR #50, 2026-05-04ish): hotfix removed `overflow-x: clip` from `html` and `width: 100%` from `body` — full revert of #42.
  Net: PR #42 was fully backed out within ~24 hours, suggesting the original mobile-overflow problem the PR aimed to fix is back. There is no test that reproduces the regression.
- **Safe modification:** Don't put any `overflow-*` or `width`/`max-width` on `<html>` or `<body>` without first reproducing the symptom in a Vercel preview deploy on a real iPhone. Use `overflow-x: clip` on a child container instead. Open BrowserStack on iOS Safari (which has known issues with `clip` interacting with `position: sticky` and 100vw children) before merging.
- **Test coverage:** None.

### Typography scaling on wide displays

- **Files:** `src/styles/global.css:69-72` (newly added by PR #51, 064839a)
- **Why fragile:** PR #51 added `@media (min-width: 1600px)` / `1920px` / `2400px` blocks that scale the root `font-size`. PR #52 immediately followed (`c04e333`) to "remove duplicate tagline + match h2 sizing" — two fixes in 24 hours. The `clamp(...)` values scattered throughout `BaseLayout.astro` (lines 442, 482, 508, 1473) interact unpredictably with the new breakpoints.
- **Safe modification:** When changing any `clamp()` or `font-size` rule, eyeball the page at 1399, 1600, 1919, 1921, 2400, and 2560 px widths.

### `BaseLayout.astro` (1810 lines, 1 file)

- **Files:** `src/layouts/BaseLayout.astro`
- **Why fragile:** Holds the entire site shell, all global styles, the language toggle script, the room-modal logic, the newsletter form handler, and inline CSS for every section variant. 38 `data-i18n` keys. Several `innerHTML` writes (lines 853, 875). High churn (touched by ~10 of the last 30 commits).
- **Safe modification:** Always read the section you're editing fully before changing — local edits often interact with global state via class names. There is no unit test.

### Room modal (`src/pages/homes/*.astro` + BaseLayout)

- **Files:** `src/layouts/BaseLayout.astro:319-409`, `src/components/RoomShowcase.astro`, `src/pages/homes/le-moulin.astro`, `src/pages/homes/hollywood-hideaway.astro`, `src/pages/homes/maison-de-la-riviere.astro`
- **Why fragile:** PR #41 ("room modal adapts to viewport"), PR #46 ("cream stage + trimmed modal text + drop HH laundry"), PR #25 ("clean up Living Room photo set"), PR #27 ("use fireplace shot"), 6d3af82 ("smooth room modal opening"). The modal mixes inline `style.overflow = 'hidden'`/`''` body manipulation (`BaseLayout.astro:733-739`) with `set:html` content injection (`:853, :875`).

### Stats bar / hero / homes card layout

- **Files:** `src/pages/index.astro` (43 historical edits), `src/pages/homes/index.astro`
- **Why fragile:** PR #36 ("move stats bar to home page; hide compound page"), PR #37 ("stats intro line; align HH card on /homes/"), PR #39 ("match Hollywood Hideaway photo width to other maison rows"), PR #14 + revert (#15), PR #28 + #18 (hero h1 flash). High visual-iteration churn → lots of dead CSS classes.

---

## Recently-Churned Files (last 60 days, top 10 by edit count)

From `git log --since="60 days ago" --pretty=format: --name-only -- src/ public/ scripts/ middleware.ts vercel.json netlify.toml`:

| Edits | File |
|------:|------|
| 74 | `public/i18n/translations.json` *(autogenerated by editor)* |
| 43 | `src/pages/index.astro` |
| 39 | `src/layouts/BaseLayout.astro` |
| 30 | `src/pages/homes/le-moulin.astro` |
| 23 | `src/pages/homes/maison-de-la-riviere.astro` |
| 23 | `src/pages/homes/hollywood-hideaway.astro` |
| 22 | `src/styles/global.css` |
| 22 | `src/pages/the-compound.astro` |
| 19 | `src/pages/explore/index.astro` |
| 19 | `src/pages/contact.astro` |

**Interpretation:** `index.astro`, `BaseLayout.astro`, and `global.css` are the three risk centroids — combined they account for the majority of recent regressions. Any new feature touching these three should be reviewed by a second pair of eyes and tested at mobile widths *and* at >=1920px.

---

## Test Coverage Gaps

- **No test framework is configured.** `package.json` has no `test` script, no Jest/Vitest/Playwright dependency.
- **No regression test exists for the recurring mobile-overflow bug.** PRs #42/#49/#50 were all eyeballed.
- **No regression test for hero h1 flash.** PRs #18 and #28 were eyeballed.
- **No test for editor save/publish flow.** A broken `applyColorsToCss` regex would silently corrupt `global.css` in production.
- **No test for `data-i18n` ↔ `set:html` collision.** PR #4 was a manual fix.
- **No test for the i18n `data-i18n-html` attribute correctness.** Authors can introduce a mismatched key and only catch it when Melissa reports "saving doesn't work."
- **Priority:** Highest-leverage first test would be a Playwright smoke that loads `/`, `/homes/le-moulin/`, `/homes/hollywood-hideaway/`, `/homes/maison-de-la-riviere/`, `/the-compound/` at viewport widths 320, 768, 1280, 1920 and asserts `document.documentElement.scrollWidth === window.innerWidth` (overflow regression guard) and that no `console.error` fires.

---

## Missing Critical Features

- **No Vercel environment variable schema.** Anyone setting up a fresh deploy has to grep `import.meta.env.*` across the repo to discover required vars. Add a `README.md` section or a `scripts/check-env.mjs` that lists required vars and fails fast.
- **No way to roll back a published edit from the dashboard.** Save and Publish both `PUT` directly to the latest SHA; there is no UI for "revert last publish." Recovery requires Git CLI access.
- **No image responsive variants.** All `<img>` tags ship one size — see Performance section above.

---

## Dependencies at Risk

- **`@neondatabase/serverless` (^1.0.2)** — declared in `package.json` `dependencies` but only used by `scripts/phase3-*.mjs` (one-shot migration scripts). Ships to production for no reason.
- **`gray-matter` (^4.0.3)** — used by Astro's content collection, but `src/content/homes/*.md` is largely orphaned (see "Tech Debt"). Worth confirming whether the dep is still needed after that cleanup.
- **No lockfile-only audit run.** Without a `npm audit`/`npm outdated` cadence, transitive vulns drift unnoticed.

---

## Concerns Summary (priority ordered)

| # | Concern | Files | Priority |
|--:|--------|-------|---------:|
| 1 | Recurring mobile-overflow regressions, no test | `src/styles/global.css:64-86`, `src/layouts/BaseLayout.astro` | High |
| 2 | Default password `'moulin2024'` in code | `src/lib/auth.ts:1,4` | High |
| 3 | No rate limiting on auth/save/publish/contact | `src/pages/api/auth/login.ts`, `src/pages/api/site/*.ts`, `src/pages/api/{contact,newsletter,compound}.ts` | High |
| 4 | Legacy `la-grange-*` references + broken `/homes/la-grange/` link | `src/pages/journal/planning-family-reunion-france.astro:54`, `src/pages/contact.astro:98`, `src/pages/the-compound.astro`, `src/pages/index.astro`, `scripts/photo-mapping.json` | High |
| 5 | Image weight (94 MB `public/images/`, 28 files >1 MB) | `public/images/*.webp` | Medium |
| 6 | Precompiled editor SPA with no in-repo source | `public/editor/assets/*` | Medium |
| 7 | Dual deploy config (Vercel + dead Netlify) | `netlify.toml`, `.netlify/` | Low |
| 8 | `applyColorsToCss` regex on user input | `src/pages/api/site/save.ts:40-52`, `src/pages/api/site/publish.ts:40-52` | Medium |
| 9 | `availability.ts` always-true filter | `src/pages/api/availability.ts:96-99` | Low |
| 10 | No test framework at all | `package.json` | Medium |

---

*Concerns audit: 2026-05-05*
