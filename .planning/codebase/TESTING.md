# Testing Patterns

**Analysis Date:** 2026-05-05

## Test Framework

**Runner:** None. There is no automated test framework configured.

Evidence:
- `package.json` has no `test` script (only `dev`, `prebuild`, `build`, `preview`, `astro`)
- `package.json` `dependencies` and `devDependencies` contain no test runner — no `jest`, `vitest`, `mocha`, `ava`, `node:test`, `playwright`, `cypress`, `puppeteer`, or `@testing-library/*`. Devdeps are limited to `sharp` (used by photo-processing scripts).
- No `jest.config.*`, `vitest.config.*`, `playwright.config.*`, `cypress.config.*` files exist anywhere in the repo
- A repo-wide search for `*.test.*` and `*.spec.*` files (excluding `node_modules`) returns zero results
- No `test/`, `tests/`, or `__tests__/` directory exists at the repo root or under `src/`

**Assertion Library:** Not applicable.

**Run Commands:** Not applicable.

## Test File Organization

Not applicable — no test files exist.

If tests are introduced later, the established Astro convention would be to co-locate them next to source (e.g. `src/lib/auth.test.ts` next to `src/lib/auth.ts`) or under a top-level `tests/` directory mirroring `src/`.

## Test Structure

Not applicable.

## Mocking

Not applicable.

## Fixtures and Factories

Not applicable. Note that `src/content/**/*.md` and `public/i18n/translations.json` provide realistic content data that could double as fixtures if tests are added.

## Coverage

**Requirements:** None enforced. There is no coverage tool, no `c8`/`nyc` configuration, and no coverage threshold gate.

## Test Types

**Unit Tests:** None.

**Integration Tests:** None.

**E2E Tests:** None. Playwright/Cypress are not installed.

**Build-time validation (the closest thing to an automated test):**
- `scripts/check-public-clean.mjs` runs as `prebuild` in `package.json` and fails the build with `process.exit(1)` if `public/Moulin House Photos/` or `public/photo-source/` exist. This is a deploy-safety guard, not a test.
- `scripts/process-photos.mjs:18-22` aborts with a non-zero exit if any photo entry in `scripts/photo-mapping.json` has missing or `TODO` alt text. This enforces accessibility metadata at content-processing time.
- `tsconfig.json` extends `astro/tsconfigs/strict`, so `astro build` performs type-checking across `.astro`, `.ts`, and inline `<script>` code. Type errors fail the deploy.

## Manual QA Approach

The team relies on **manual visual QA** against preview deployments. Evidence from git history:
- A "QA punch list" pattern is visible in commit `21611ef`: `QA punch list 2: visual polish, jacuzzi-only spa, day trips, dog FAQ, footer address (#9)`
- The `[[Session 2026-04-29: QA punch list 2]]` memory documents this workflow: 6 atomic commits on a single branch addressing a list of visual-fidelity issues, each tied to a designer/owner punch list rather than a failing test
- Recent fixes are visual/copy in nature and ship with no accompanying test changes:
  - `c04e333 fix(home): remove duplicate tagline + match h2 sizing (#52)`
  - `7b264e7 hotfix(layout): fully revert PR #42 mobile overflow CSS (#50)`
  - `f5579e8 fix(home): cream lightbox background for Discover the Compound photos (#40)`
  - `4819a7d fix(home): stop hero h1 flashing "Live the countryside, unhurried." on reload (#28)`
- Bug-fix commits frequently mention specific viewports/devices (`fix(mobile)`, `fix(rooms): room modal adapts to viewport`) consistent with manual cross-device review against Vercel preview URLs

**Implied workflow:**
1. Open a PR from a `<type>/<scope>` branch
2. Vercel auto-builds a preview deployment for the PR
3. Reviewer eyeballs the preview against the design intent and the QA punch list
4. Squash-merge to `main`; Vercel auto-deploys to production at `https://www.moulinareves.com`
5. If something regresses, ship a `fix(...)` or `hotfix(...)` commit (see `[[Deployment & branch policy]]`)

## CI Status Checks

**No CI workflows are configured.**

Evidence:
- `.github/` directory does not exist in the repo
- No `.github/workflows/*.yml` files
- No `.gitlab-ci.yml`, `.circleci/`, `azure-pipelines.yml`, or `.travis.yml`
- The only programmatic gate that runs on every push/PR is **Vercel's build pipeline**, triggered by the `vercel.json` configuration and the GitHub integration. Vercel runs:
  1. `npm install`
  2. `npm run build` (which triggers `prebuild` → `node scripts/check-public-clean.mjs`, then `astro build`)
  3. Deploys to a preview URL (per PR) or to production (on `main`)
- A failing TypeScript build (via Astro's built-in `tsc` in strict mode) or a failing `prebuild` guard will break the Vercel deploy and surface as a red status check on the PR

**Branch protections** (per `[[Deployment & branch policy]]`):
- Direct pushes to `main` are blocked
- All changes must merge via PR
- Vercel preview build is the de-facto required check, but no automated tests gate the merge

## Common Patterns

Not applicable — there are no test patterns to document. New code should be considered untested unless explicitly verified via the manual QA workflow described above.

## Recommendations for Future Test Coverage

If automated coverage is added, the highest-value targets given the current concerns are:

- `src/pages/api/availability.ts` — `parseIcs`, `unfoldIcs`, `isoFromIcsDate`, `expandToDates` are pure functions with clear inputs/outputs; ideal for unit tests and they protect the booking calendar from breaking when Airbnb/VRBO change their `.ics` format
- `src/pages/api/site/save.ts` — `applyColorsToCss` is a regex-based string transform that silently no-ops on missing tokens; a unit test would catch regressions in dashboard color edits
- `src/lib/auth.ts` — HMAC sign/verify logic guards the editor; a unit test would catch token-format drift
- `src/i18n/translations.ts` and `public/i18n/translations.json` — a structural test that every key has both `en` and `fr` values, and that no two static `data-i18n` attributes in `.astro` files reference an undefined key, would catch i18n regressions before they reach a live page

---

*Testing analysis: 2026-05-05*
