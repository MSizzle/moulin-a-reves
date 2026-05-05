# Coding Conventions

**Analysis Date:** 2026-05-05

## Naming Patterns

**Files:**
- Astro pages and components: `kebab-case.astro` for routes (e.g. `src/pages/the-compound.astro`, `src/pages/maison-de-la-riviere.astro`), `PascalCase.astro` for reusable components (e.g. `src/components/AvailabilityCalendar.astro`, `src/components/RoomShowcase.astro`, `src/components/PhotoCarousel.astro`, `src/components/AmenitiesSection.astro`)
- Layout files: `PascalCase.astro` (e.g. `src/layouts/BaseLayout.astro` — only one layout exists)
- API endpoints: `kebab-case.ts` under `src/pages/api/` (e.g. `src/pages/api/contact.ts`, `src/pages/api/newsletter.ts`, `src/pages/api/availability.ts`)
- Library code: `kebab-case.ts` under `src/lib/` (e.g. `src/lib/auth.ts`)
- Build/maintenance scripts: `kebab-case.mjs` under `scripts/` (e.g. `scripts/check-public-clean.mjs`, `scripts/process-photos.mjs`, `scripts/generate-photo-mapping.mjs`)
- Markdown content: `kebab-case.md` under `src/content/` (e.g. `src/content/homes/le-moulin.md`, `src/content/pages/homepage.md`)
- Image assets: `kebab-case.webp` under `public/images/` (e.g. `public/images/homes/le-moulin-hero.webp`, `public/images/bridge-garden.webp`)

**Functions:**
- `camelCase` for all JS/TS functions (e.g. `submitNewsletter`, `setLanguage`, `parseIcs`, `unfoldIcs`, `isoFromIcsDate`, `applyColorsToCss`, `updateGitHubFile`, `hmacSign`, `checkAuth`, `createSession` in `src/lib/auth.ts` and `src/pages/api/site/save.ts`)
- Inline IIFEs for client-side scripts (`(function () { ... })();`) — see `src/layouts/BaseLayout.astro` lines 695, 793, 962, 1002

**Variables:**
- `camelCase` for locals and props (`currentLang`, `lastFocus`, `focusTimer`, `eyebrowKey`, `headingKey`)
- `SCREAMING_SNAKE_CASE` for module-level constants pulled from env (`GITHUB_TOKEN`, `GITHUB_REPO`, `DASHBOARD_PASSWORD`, `AIRBNB_ICS`, `VRBO_ICS`, `STORAGE_KEY`)
- Astro frontmatter destructuring: `const { title, description = "...", ogImage = "..." } = Astro.props;` (see `src/layouts/BaseLayout.astro:10-14`)

**Types:**
- `PascalCase` interfaces declared inline at top of `.astro` frontmatter (e.g. `interface Props`, `interface Image`, `interface Photo`, `interface Detail`, `interface Room` in `src/components/PhotoCarousel.astro` and `src/components/RoomShowcase.astro`)
- Type-only imports use `import type` (e.g. `import type { APIRoute } from 'astro';` — every file in `src/pages/api/`)
- Inline type aliases for narrow shapes (e.g. `type BusyRange = { start: string; end: string; source: 'airbnb' | 'vrbo'; summary?: string };` in `src/pages/api/availability.ts:10`)

**CSS classes:**
- BEM-style `block__element--modifier` (e.g. `.nav__inner`, `.nav__logo-text`, `.footer__newsletter-form`, `.room-modal__thumb.is-active`, `.lightbox--cream`, `.btn--primary`, `.btn--sm`, `.btn--white`)
- Utility-style state classes use `is-` prefix (`.is-open`, `.is-active`, `.visible`, `.active`)

## Code Style

**Formatting:**
- No formatter configured. There is no `.prettierrc`, `.prettierrc.json`, `prettier.config.*`, `biome.json`, `.eslintrc*`, `eslint.config.*`, or `stylelint.*` in the repo root.
- 2-space indentation in TS/JS/Astro/CSS observed across `src/` and `scripts/`
- Single quotes for JS/TS strings, double quotes for HTML attributes (Astro default)
- Trailing semicolons present in TS/JS

**Linting:**
- No ESLint, Biome, or Stylelint configured. Type checking comes only from `tsconfig.json` (extends `astro/tsconfigs/strict`) and the `// @ts-check` directive at the top of `astro.config.mjs:1`.
- VS Code recommends only the Astro extension (see `.vscode/extensions.json`)

## Import Organization

**Order observed across `.astro` and `.ts` files:**
1. Type-only imports first (`import type { APIRoute } from 'astro';`)
2. Astro framework / layout imports (`import BaseLayout from '../layouts/BaseLayout.astro';`)
3. Local component imports (`import AvailabilityCalendar from '../components/AvailabilityCalendar.astro';`)
4. Third-party libs (`import matter from 'gray-matter';`)
5. Node built-ins last with `node:` prefix (`import fs from 'node:fs';`, `import { existsSync } from "node:fs";` in `scripts/check-public-clean.mjs`)

**Path Aliases:**
- None. All imports use relative paths (`../layouts/BaseLayout.astro`, `../../../lib/auth`). `tsconfig.json` declares no `paths`.

## Error Handling

**API routes (`src/pages/api/*.ts`):**
- Wrap the entire handler body in `try { ... } catch { ... }` and return a generic 500 with `{ error: 'Server error' }` (see `src/pages/api/contact.ts:5-48`, `src/pages/api/newsletter.ts:5-40`)
- For external GitHub/Airtable calls, check `if (!res.ok)` and return the upstream JSON error body (`src/pages/api/contact.ts:39-42`)
- Caught errors are silently swallowed in helper functions that fetch from GitHub (`src/pages/api/site/save.ts:9-23, 25-38`, `src/pages/api/availability.ts:74-77`) — they return `null`/`[]` so the caller can decide
- Auth-protected endpoints check first and short-circuit with 401: `if (!await checkAuth(request)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, ... });` (see `src/pages/api/site/save.ts:76-81`)

**Client-side scripts (`src/layouts/BaseLayout.astro`):**
- `JSON.parse` calls wrapped in `try { ... } catch (_) {}` to ignore malformed `data-room` / `data-gallery` payloads (lines 750-762, 924-933)
- `localStorage.setItem` wrapped in `try { ... } catch (e) {}` for private-mode safety (lines 1018, 1044)
- `fetch('/api/translations')` chained with `.catch(() => { ... fallback ... })` to fall back to a minimal nav-only translations dict (lines 1682-1703)
- Newsletter submit shows `alert('Something went wrong. Please try again.');` on failure (lines 1790, 1795)

## Logging

**Framework:** None. Plain `console.error` / `console.log` / `console.warn` only.

**Where logging occurs:**
- Build/maintenance scripts log progress and errors directly: `scripts/process-photos.mjs:20-21,75,83-87`, `scripts/generate-photo-mapping.mjs:67,83,110-112`, `scripts/check-public-clean.mjs:11-15`, `scripts/phase3-drop-tables.mjs:19`
- Source code under `src/` does not log — failures are returned as HTTP responses or silently swallowed.

## Comments

**When to Comment:**
- Block comments above non-obvious logic (e.g. `src/pages/api/availability.ts:79-87` documents `expandToDates`; `src/pages/api/site/save.ts:106-108` explains the merge-from-remote rationale; `middleware.ts:3-9` explains why edge middleware is needed)
- Section dividers in CSS use `/* ---- Section Name ---- */` (e.g. `src/styles/global.css:57`, `src/layouts/BaseLayout.astro:216, 525, 1051, 1212, 1440`)
- `=====` banners separate logical groups in `src/i18n/translations.ts` (lines 2-4, 14-16, 34-36)

**JSDoc/TSDoc:**
- Not used. No `/** ... */` doc comments anywhere in `src/` or `scripts/`.

## Function Design

**Size:** Small focused helpers (10-30 lines). Larger handlers in `src/pages/api/site/save.ts` (`POST` ~60 lines) and `src/pages/api/availability.ts` (`parseIcs` ~30 lines) are still single-purpose.

**Parameters:** Positional with defaults in destructured props (`const { title, description = "...", ogImage = "..." } = Astro.props;` in `src/layouts/BaseLayout.astro:10-14`; `const { images, interval = 5500, eyebrow, heading, i18nKey } = Astro.props;` in `src/components/PhotoCarousel.astro:15`).

**Return Values:**
- API routes always return `new Response(JSON.stringify(...), { status, headers })`
- Helpers either return primitives (`string | null`, `boolean`) or arrays/objects; never throw across module boundaries.

## Module Design

**Exports:**
- Named exports only. `export const POST: APIRoute = async (...) => { ... };` and `export const GET: APIRoute = async (...) => { ... };` (every file in `src/pages/api/`)
- `export const prerender = false;` is the first line of every API route to opt out of static prerendering
- Astro components export nothing — Astro picks up the file as a default export by convention

**Barrel Files:** None. No `index.ts` re-exports anywhere in `src/`.

## Astro Component Conventions

**Frontmatter shape (`---` block at top of `.astro` files):**
1. `import` statements
2. `interface Props { ... }` declaration (when component takes props)
3. `const { ... } = Astro.props;` destructure with defaults
4. Derived constants (e.g. `const eyebrowKey = i18nKey ? \`${i18nKey}.eyebrow\` : undefined;`)
- Pages that read CMS read frontmatter via `gray-matter`: `const raw = fs.readFileSync('src/content/pages/homepage.md', 'utf-8'); const { data: cms } = matter(raw);` (see `src/pages/index.astro:5-8`)

**Inline CSS:** Each `.astro` component owns its CSS via a `<style>` block at the bottom; styles are scoped to the component by Astro's compiler. Globally-scoped CSS uses `<style is:global>` (see `src/layouts/BaseLayout.astro:73`).

**Inline scripts:** `<script is:inline>` for client-side code that must NOT be bundled or processed (every popup/modal/lightbox script in `src/layouts/BaseLayout.astro`). Plain `<script>` (lines 1630, 1766) is used for code that is allowed to go through Astro's TS transform.

**i18n attributes:** Three runtime-translated attributes (handled by `setLanguage()` in `src/layouts/BaseLayout.astro:1707-1751`):
- `data-i18n="namespace.key"` — replaces `textContent`
- `data-i18n-html="namespace.key"` — replaces `innerHTML` (use when value contains markup like `<span class="serif-italic">…</span>`)
- `data-i18n-placeholder="namespace.key"` — replaces input `placeholder`

## CSS Strategy

**Single design system file:** `src/styles/global.css` (1448 lines) is imported once by `src/layouts/BaseLayout.astro:2` and contains:
- CSS custom-property design tokens under `:root` (`--bg-cream`, `--ink`, `--blue-primary`, `--font-serif`, `--font-display`, `--section-gap`, `--ease-out`, `--duration` — see lines 8-55)
- Reset, typography, layout primitives (`.section`, `.container`, `.grid`, `.btn`, `.card`, `.hero`)
- Responsive breakpoints layered as `@media (max-width: 1200px)`, `1024px`, `768px`; wide-display upscaling at `min-width: 1600px`, `1920px`, `2400px` (lines 74-76)

**No CSS framework:** Tailwind is not installed. PostCSS is not configured. Sass/Less is not used. All styling is plain CSS with custom properties.

**No CSS modules:** Component styles live inside `<style>` blocks in each `.astro` file (default Astro scoped styles). Global selectors are namespaced with BEM blocks like `.nav`, `.footer`, `.room-modal`, `.lightbox`, `.chocolate-popup`.

**Inline `style="..."` attributes** are used for one-off overrides on hero sections and ad-hoc spacing (e.g. `src/pages/about.astro:21,53`, `src/pages/index.astro:702`).

## Content / Translations Authoring

**Markdown frontmatter (CMS):**
- Page-level content lives in `src/content/pages/*.md` (`homepage.md`, `about.md`, `compound.md`, `hollywood-hideaway.md`, `le-moulin.md`, `maison-de-la-riviere.md`)
- Per-house content lives in `src/content/homes/*.md` (`le-moulin.md`, `la-grange.md`, `le-jardin.md`)
- Service pages in `src/content/services/*.md` (`catering.md`, `wellness.md`)
- Frontmatter is YAML; pages read it via `gray-matter` and render `cms.fieldName` directly (`src/pages/index.astro:7-8`)
- Galleries are arrays of strings or `{ src, alt, caption }` objects in frontmatter (per memory `[[Session 2026-04-29: photo integration]]`)

**i18n translations:**
- Static fallback dict in `src/i18n/translations.ts` (792 lines) — keyed by dot-namespaced strings (`'nav.homes'`, `'home.intro.text'`, `'footer.tagline'`)
- Runtime translations in `public/i18n/translations.json` — fetched via `/api/translations` which proxies the latest copy from GitHub raw (`src/pages/api/translations.ts:14-19`) so dashboard publishes appear without a Vercel rebuild
- Each key has shape `{ en: string, fr: string }`. Default page HTML carries the English copy; the runtime swap happens in `setLanguage()` regardless of `lang` so editor edits to English text replace static markup (see comment in `src/layouts/BaseLayout.astro:1678-1681`)

## Commit Message Conventions

**Loose Conventional Commits.** Prefixes observed in recent history (`git log --pretty=format:"%s"`):

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

**Common scopes:** `home`, `homes`, `rooms`, `mobile`, `layout`, `explore`, `wellness`, `catering`, `hideaway`, `maison`, `cta`, `address`, `scale`, `compound`, `area`.

**PR suffix:** `(#NN)` GitHub PR number is appended to merged-to-main commits via squash merge (e.g. `(#52)`, `(#51)`).

**Auto-commits:** Editor dashboard writes to GitHub directly with two distinct messages:
- `Update translations via dashboard` (from `src/pages/api/site/save.ts:122`)
- `Update colors via dashboard` (from `src/pages/api/site/save.ts:95`)
- `Publish translations - <ISO timestamp>` (from the publish flow — see `src/pages/api/site/publish.ts`)

## PR Workflow Conventions

**Per `[[Deployment & branch policy]]` memory and observed history:**
- Direct push to `main` is blocked; all changes land via PR squash-merge
- Branch naming follows `<type>/<kebab-case-summary>`: `feat/wide-screen-scale`, `hotfix/body-sizing`, `fix/room-modal-batch`, `copy/availability-join-us`, `feat/melissa-vision-update-2`
- PR titles mirror the commit subject style (`fix(rooms): cream stage + trimmed modal text + drop HH laundry`)
- Vercel auto-deploys `main`; preview deploys are produced per PR
- No GitHub Actions workflows exist (`.github/` directory is absent) — there are no required status checks, so review is the only gate before merge
- The `prebuild` npm script (`scripts/check-public-clean.mjs`) is the only programmatic guard, and it runs locally and on Vercel — it aborts the build if `public/Moulin House Photos/` or `public/photo-source/` exist (raw photo dumps that would explode the deploy)

---

*Convention analysis: 2026-05-05*
