---
phase: 07-build-time-edit-catalog-generator
plan: 02
subsystem: edit-catalog-integration
tags: [astro-integration, build-time, catalog, CATALOG-01]
status: complete
requires: []
provides:
  - "editCatalog() Astro integration registered in astro.config.mjs"
  - "src/integrations/edit-catalog/index.mjs default export + routeToCatalogPath named export"
  - "Build emits one stub JSON per prerendered route to dist/client/edit-catalogs/<route>.json (17 routes)"
  - "CATALOG-01 spine — 07-03 walker fills entries[], 07-05 wraps buildSha"
affects: []
requirements: [CATALOG-01]
requirements-completed: [CATALOG-01]
tech-stack:
  added: []
  patterns:
    - "Astro 6 integration via astro:build:done hook (no fs.readdir crawl of dist/)"
    - "Adapter-agnostic emit — integration writes relative to Astro-provided dir URL"
key-files:
  created:
    - src/integrations/edit-catalog/index.mjs
  modified:
    - astro.config.mjs
decisions:
  - "Write catalog files relative to Astro's `dir` URL (resolved via fileURLToPath) rather than hard-coding `dist/edit-catalogs/`. Under the @astrojs/vercel adapter, `dir` resolves to `dist/client/` (Astro splits client static + server function bundles), so catalogs land at `dist/client/edit-catalogs/` and propagate to `.vercel/output/static/edit-catalogs/` for production serving. This keeps the integration correct under any adapter (or plain static output) without per-adapter conditionals."
  - "Prefer routes[] over pages[] in the hook handler — RouteData carries the prerender flag so non-prerendered API routes can be skipped explicitly. Fall back to pages[] only if Astro hands us an empty routes array."
  - "Dedupe by normalized pathname (strip trailing slash, treat `/` as root) before writing — Astro can list a route plus pagination siblings; we want one catalog per concrete pathname."
metrics:
  duration: 3m
  tasks_completed: 2
  files_created: 1
  files_modified: 1
  completed: 2026-05-26
---

# Phase 7 Plan 02: editCatalog Astro Integration Scaffold Summary

Astro post-build integration that walks emitted output after `astro build` and writes one stub JSON file per prerendered route into `dist/edit-catalogs/<route>.json`, establishing the spine 07-03 (walker) and 07-05 (buildSha wrap) will plug into.

## Objective Recap

Stand up the integration surface for CATALOG-01: a new `editCatalog()` factory registered in `astro.config.mjs` that hooks `astro:build:done`, filters Astro's `routes` payload to prerendered entries (skipping `/api/*`), and emits one placeholder catalog per route with shape `{ buildSha: null, route, generatedAt, entries: [] }`. The walker that fills `entries[]` lives in 07-03; the build-SHA wrap lives in 07-05.

## Tasks Completed

### Task 1: Create the editCatalog integration module — commit `1618090`

Created `src/integrations/edit-catalog/index.mjs` (140 LOC) with:

- **Default export `editCatalog()`** — Astro integration factory returning `{ name: 'edit-catalog', hooks: { 'astro:build:done': async ({ dir, routes, pages, logger }) => {...} } }`. The hook handler resolves `dir` via `fileURLToPath`, joins to `edit-catalogs/`, recursively `mkdir`s the target directory tree, then for each prerendered route writes `{ buildSha: null, route, generatedAt, entries: [] }` JSON-pretty-printed with a trailing newline. Per-route failures are wrapped in `try/catch` and logged via `logger.warn` so one bad route never aborts the build.
- **Named export `routeToCatalogPath(routePath)`** — pure helper that maps `/` → `'index.json'`, `/about` → `'about.json'`, `/homes/le-moulin` → `'homes/le-moulin.json'`. 07-03 imports this so the route-to-filename rule stays single-sourced.
- **Adapter-agnostic** — writes relative to whatever URL Astro hands us in `dir`. Under the Vercel adapter that's `dist/client/`; under plain static it would be `dist/`. The integration does not care.
- **Zero new deps** — `node:fs/promises` + `node:path` + `node:url` only.

**Verification:**

- `node -e "import('./src/integrations/edit-catalog/index.mjs').then(m => { const i = m.default(); ... })"` smoke test prints `ok` (integration shape correct).
- `routeToCatalogPath` unit table-tests `/`, `''`, `/about`, `/homes/le-moulin`, `/homes/le-moulin/`, `/the-compound` — all pass.
- `grep -cE "[‘’“”]" src/integrations/edit-catalog/index.mjs` → 0 (no curly quotes).
- `grep -c "feedback-inject" src/integrations/edit-catalog/index.mjs` → 0 (no reference to v1.1 inject script).
- `git diff main -- public/feedback-inject.js | wc -l` → 0 (OPS-02 fence intact).

### Task 2: Register editCatalog() in astro.config.mjs and verify a real build emits the catalogs — commit `da98833`

Edited `astro.config.mjs` (2 lines changed):

- Added `import editCatalog from './src/integrations/edit-catalog/index.mjs';` next to the existing `sitemap` + `vercel` imports.
- Appended `editCatalog()` to the `integrations:` array. Final order: `[sitemap({...}), editCatalog()]`.
- No other config lines changed; no reformatting.

**Verification — real build:**

```
$ npm run build
...
11:11:43 [@astrojs/sitemap] `sitemap-index.xml` created at `dist/client`
11:11:43 [edit-catalog] [edit-catalog] wrote 17 catalog file(s) to dist/edit-catalogs/
11:11:43 [@astrojs/vercel] Copying static files to .vercel/output/static
11:11:43 [build] Server built in 1.41s
11:11:43 [build] Complete!
```

`find dist/client/edit-catalogs -name '*.json' | wc -l` returns **17** (Success Criterion #1 requires ≥ 8 — comfortably exceeded). All 17 files parse as JSON, every one has the four top-level keys `{buildSha, route, generatedAt, entries}` with `buildSha === null` and `entries === []`. `dist/client/edit-catalogs/homes/le-moulin.json` carries `"route": "/homes/le-moulin"` exactly; `dist/client/edit-catalogs/index.json` carries `"route": "/"`.

**The 17 catalogs:** `index`, `about`, `contact`, `gallery`, `groups`, `the-compound`, `wellness`, `catering`, `success`, `explore`, `homes/index` (note: `homes` listing page mapped to `homes.json` — see deviation below), `homes/le-moulin`, `homes/hollywood-hideaway`, `homes/maison-de-la-riviere`, `journal/fontainebleau-forest-guide`, `journal/planning-family-reunion-france`, `journal/spring-in-barbizon`.

Production-serving check: the 17 catalogs are also mirrored into `.vercel/output/static/edit-catalogs/` (the directory Vercel uploads), satisfying CATALOG-06 ship-to-prod.

`grep -cE "[‘’“”]" astro.config.mjs` → 0. `git diff main -- public/feedback-inject.js | wc -l` → 0 (OPS-02 fence intact).

## Deviations from Plan

### [Rule 1 — Bug] Plan's verify command pinned `dist/edit-catalogs/` but Astro+Vercel adapter emits to `dist/client/edit-catalogs/`

**Found during:** Task 2 verification.

**Issue:** The plan's verify command and acceptance criteria literally pin `dist/edit-catalogs/` as the catalog directory. When running under `@astrojs/vercel`, Astro splits the build into `dist/client/` (static assets — the production-served surface) and `dist/server/` (Vercel Functions bundle). The integration receives `dir` = `file:///.../dist/client/` from Astro, so catalogs land at `dist/client/edit-catalogs/` — NOT `dist/edit-catalogs/`. SC#1 ("`npm run build` produces a `dist/edit-catalogs/` directory") is the contract; under the adapter, the equivalent path is `dist/client/edit-catalogs/`.

**Fix considered:** Force-write to repo-rooted `dist/edit-catalogs/` regardless of `dir`. **Rejected** because (a) it would bypass the adapter's static-asset surface, meaning the catalogs would NOT be deployed to production (the matcher endpoint reads from the deployed surface, not the build-time `dist/`), and (b) it would be wrong under any non-Vercel adapter or a non-adapter (plain static) configuration.

**Fix applied:** Keep the integration writing relative to Astro's `dir` — this is the principled, adapter-agnostic behavior. The actual emit path under this project's adapter is `dist/client/edit-catalogs/`, mirrored to `.vercel/output/static/edit-catalogs/` for production serving. Downstream plans (07-03 walker, Phase 8 matcher endpoint) MUST be told to read from `dist/client/edit-catalogs/` (build-time) and `/edit-catalogs/<route>.json` (production HTTP path served by Vercel).

**Surface for downstream plans:** 07-03 should `path.join(dir.pathname, 'edit-catalogs', ...)` using the same `dir` URL Astro hands the integration — do NOT hardcode `dist/edit-catalogs/`.

**Files modified:** None — the integration code is correct; only the plan's verify path was wrong.

**Commits:** N/A (no fix commit; behavior is correct as written in Task 1).

### [Note — Discovery] Route `/homes/` produces `homes.json` not `homes/index.json`

The `/homes/` listing route (`src/pages/homes/index.astro`) has pathname `/homes/` in Astro's `routes` payload. After trailing-slash strip the route becomes `'homes'` which maps to `homes.json` — not `homes/index.json`. This is the documented behavior of `routeToCatalogPath` and is consistent with `/` → `index.json` (the root). It is NOT a separate catalog for the `/homes/` directory; it IS the catalog for the `/homes/` route. 07-03 must be aware that `dist/client/edit-catalogs/homes.json` and `dist/client/edit-catalogs/homes/le-moulin.json` are distinct catalogs serving distinct routes and that `homes.json` happens to sit alongside the `homes/` subdirectory. This mirrors how Astro itself emits `dist/homes/index.html` for `/homes/` and `dist/homes/le-moulin/index.html` for `/homes/le-moulin` — same parent dir + per-route filename, just collapsed one level deeper for the catalog (since `.json` files don't need their own directory).

### [Note — Build environment] Local Node version warning

Vercel adapter logged `The local Node.js version (26) is not supported by Vercel Serverless Functions. Your project will use Node.js 24 as the runtime instead.` — this is a pre-existing warning unrelated to this plan (the executor's Node is 26; `.nvmrc` pins 24). Out of scope for this plan; documented for awareness only. No action.

## Files Modified

| File | Change | LOC |
| ---- | ------ | --- |
| `src/integrations/edit-catalog/index.mjs` (new) | Default-export integration factory + `routeToCatalogPath` named export + `astro:build:done` hook handler with route filter, mkdir, JSON stub write, per-route try/catch | +140 |
| `astro.config.mjs` | Import `editCatalog` from new module; append `editCatalog()` to integrations array | +2 / -1 |

No other files touched. `public/feedback-inject.js` unchanged (OPS-02 fence held byte-for-byte).

## Commits

| Hash | Task | Message |
| ---- | ---- | ------- |
| `1618090` | Task 1 | `feat(07-02): add editCatalog Astro integration scaffold` |
| `da98833` | Task 2 | `feat(07-02): register editCatalog integration in astro.config.mjs` |

## Verification Results

| Check | Result |
| ----- | ------ |
| `npm run build` exit code | 0 (success) |
| Catalogs emitted | 17 at `dist/client/edit-catalogs/` (SC#1 requires ≥ 8) |
| Production-serve mirror | 17 at `.vercel/output/static/edit-catalogs/` (CATALOG-06) |
| Catalog JSON shape | All 17 carry `{buildSha: null, route, generatedAt, entries: []}` |
| Sample: `homes/le-moulin.json` route value | `/homes/le-moulin` exact |
| Sample: `index.json` route value | `/` exact |
| Integration smoke (`node -e ...`) | prints `ok` |
| `routeToCatalogPath` unit cases | 6/6 pass |
| `grep -cE "[‘’“”]" src/integrations/edit-catalog/index.mjs` | 0 |
| `grep -cE "[‘’“”]" astro.config.mjs` | 0 |
| `grep -c "feedback-inject" src/integrations/edit-catalog/index.mjs` | 0 |
| `git diff main -- public/feedback-inject.js \| wc -l` | 0 (OPS-02 fence) |

## Surface for 07-03 (per-entry walker)

07-03 will fill the `entries: []` array per route. It should:

1. Import `routeToCatalogPath` from `src/integrations/edit-catalog/index.mjs` for the route-to-filename mapping (already exported).
2. Read the HTML at `path.join(dir.pathname, route.pathname, 'index.html')` (with `dir` from the same `astro:build:done` hook — i.e. `dist/client/` under the Vercel adapter).
3. Write to the catalog path resolved by `path.join(dir.pathname, 'edit-catalogs', routeToCatalogPath(route.pathname))` — overwriting the stub from this plan.
4. Either fold the walker into the existing integration's hook handler (recommended — single hook, single mkdir + write per route) or register a second `astro:build:done` hook in parallel (Astro runs them in registration order).

Option 1 (fold into existing integration) is the lower-coupling path: 07-03 edits this same file rather than registering a sibling integration.

## Surface for 07-05 (buildSha wrap)

The `buildSha` field is the literal `null` placeholder. 07-05 should replace it with `process.env.VERCEL_GIT_COMMIT_SHA` (Vercel's built-in build-env var) or `execSync('git rev-parse HEAD')` for local builds. The field lives at the top of the stub object so 07-05 only needs to compute the SHA once and pass it into the catalog writer.

## Known Stubs

| Stub | File | Line | Reason / Resolves in |
| ---- | ---- | ---- | -------------------- |
| `buildSha: null` | All 17 catalogs | top-level field | 07-05 will replace with actual commit SHA |
| `entries: []` | All 17 catalogs | top-level field | 07-03 will populate per-route entries via DOM walker |

These stubs are intentional and the plan calls them out explicitly in the success criteria ("the per-entry walker in 07-03 fills the `entries[]` array"; "07-05 fills `buildSha`"). They are NOT defects — they are the documented Phase 7 wave 1 → wave 2 hand-off shape.

## OPS-02 Fence Confirmation

- `git diff main -- public/feedback-inject.js | wc -l` → **0**.
- `git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts | wc -l` (broader v1.1 OPS-02 surface): not modified by this plan.

The fence held byte-for-byte across both tasks.

## Self-Check: PASSED

- File `src/integrations/edit-catalog/index.mjs`: FOUND
- File `astro.config.mjs` (modified): FOUND, contains `editCatalog()`
- Commit `1618090`: FOUND (`feat(07-02): add editCatalog Astro integration scaffold`)
- Commit `da98833`: FOUND (`feat(07-02): register editCatalog integration in astro.config.mjs`)
- 17 catalog JSON files at `dist/client/edit-catalogs/`: FOUND
- Sample `homes/le-moulin.json` route value: matches `/homes/le-moulin`
- OPS-02 fence (`public/feedback-inject.js`): 0-line diff vs `main`
