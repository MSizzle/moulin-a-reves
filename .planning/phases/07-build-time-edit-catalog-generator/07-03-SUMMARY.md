---
phase: 07-build-time-edit-catalog-generator
plan: 03
subsystem: edit-catalog
tags: [tdd, catalog, walker, ops-02-fence, locator-signals, linkedom]
status: complete
requirements: [CATALOG-02, CATALOG-03]
requirements-completed: [CATALOG-02, CATALOG-03]
dependency-graph:
  requires:
    - "src/lib/locator-signals.mjs (from 07-01) — closestAttr, i18nOf, imageRefOf, galleryOf, nearestHeading, domPathOf, visibleText, signalCount"
    - "src/integrations/edit-catalog/content-index.mjs (from 07-04) — buildContentIndex, normalizeText"
    - "src/integrations/edit-catalog/index.mjs (from 07-02) — Astro integration spine + routeToCatalogPath"
    - "public/feedback-inject.js (READ-ONLY, OPS-02-fenced)"
    - "src/pages/api/feedback/validate.ts (READ-ONLY, OPS-02-fenced; signalCount() byte-identity is pinned by 07-01)"
  provides:
    - "src/integrations/edit-catalog/walker.mjs — walkRoute({document, route, contentIndex}) + classifyKind(el)"
    - "tests/edit-catalog/walker.test.mjs — 11 unit tests pinning entry schema + classification ladder + signalCount rule"
    - "tests/edit-catalog/dist-snapshot.test.mjs — 5 integration tests against a real Astro-emitted HTML snapshot"
    - "tests/edit-catalog/fixtures/le-moulin-dist-snapshot.html (80 KB committed snapshot)"
    - "dist/client/edit-catalogs/<route>.json with populated entries[] arrays at build time"
  affects:
    - "07-05 (build-SHA wrap consumes the populated catalogs)"
    - "Phase 8 matcher endpoint (reads dist/client/edit-catalogs/ at build time; /edit-catalogs/<route>.json over HTTP at runtime)"
tech-stack:
  added: []
  patterns:
    - "WeakSet-based claim tracking for element-selection ladder (no element appears in two entries)"
    - "node:crypto sha1 12-hex-char stable id derived from (kind|i18nKey|imageRef|galleryAttrRaw|galleryIndex|domPath)"
    - "Multi-pass walker: images -> i18n hosts -> bare headings -> hardcoded-text leaves (avoids double-emit of <a> inside <p>)"
    - "Per-route try/catch with linkedom.parseHTML — missing HTML logs warn, falls through with empty entries, never aborts the build"
    - "Committed real-dist HTML fixture exercises walker against actual Astro 6 + adapter output (hydration markers, astro-island, BaseLayout-injected feedback loader)"
key-files:
  created:
    - src/integrations/edit-catalog/walker.mjs
    - tests/edit-catalog/walker.test.mjs
    - tests/edit-catalog/dist-snapshot.test.mjs
    - tests/edit-catalog/fixtures/le-moulin-dist-snapshot.html
  modified:
    - src/integrations/edit-catalog/index.mjs
decisions:
  - "Use a 4-pass element-selection ladder rather than a single document-order pass. The PLAN's ladder gives images priority over their wrapping containers (an <img> inside a <div data-gallery> must claim itself before the wrapping element is considered), and i18n hosts must claim themselves before bare-heading classification examines their descendants. A single pass would require lookahead; four sub-passes keep the logic linear and the claim invariant trivial."
  - "Descendant-check (skip a hardcoded-text candidate if it has a claimed descendant) prevents the case where a <p>Hello <a>link</a></p> emits BOTH the <p> AND the <a>. The <a> claims itself in the hardcoded-text pass; the wrapping <p> is then skipped because its descendant is claimed. This is consistent with v1.1 captureLocator() behavior — the click handler hits the leaf, not the wrapper."
  - "hardcoded-text entries with NO content-source are emitted with requiresManualSelection: true regardless of signalCount. Rationale: without source, the entry has at most domPath as a locator anchor, and validate.ts:54-61 (signalCount) explicitly never counts domPath alone. So the entry could only auto-merge via Phase 8 PANEL if a human inspector confirms the locator — exactly the requiresManualSelection escape hatch documented in the PLAN."
  - "Catalog output path is `dist/client/edit-catalogs/` (not `dist/edit-catalogs/`) per the 07-02 Wave 1 deviation. The integration writes relative to Astro's `dir` URL which the @astrojs/vercel adapter resolves to `dist/client/`. This is adapter-agnostic — under plain static output `dir` would be `dist/`. Downstream plans (07-05, Phase 8) must read from `dist/client/edit-catalogs/` at build time and `/edit-catalogs/<route>.json` over HTTP at runtime."
  - "Walker tolerates missing HTML at dist/client/<route>/index.html by logging a warn and writing a catalog with empty entries. Astro can list a route in `routes[]` and yet emit no prerendered HTML (e.g. when the route is gated to be a Vercel Function only). A hard-failure here would block the entire build for the sake of one possibly-non-prerendered route."
metrics:
  duration: ~18 minutes
  completed: 2026-05-26T18:30:00Z
  tasks: "4 of 4 (Task 1 RED + Task 2 GREEN + Task 2b dist-snapshot + Task 3 integration wiring)"
  files-changed: 5
  insertions: 1285
  deletions: 5
---

# Phase 07 Plan 03: Catalog Walker (CATALOG-02 + CATALOG-03) Summary

The catalog walker pipeline is functionally complete. `npm run build` now produces 17 catalogs at `dist/client/edit-catalogs/*.json` with **1806 total entries** across all six `kind` values, every entry carrying a stable 12-hex `id`, populated locator-signal fields per kind, and the `requiresManualSelection` escape hatch flipped to `false` only when validate.ts's signalCount rule >= 2 is satisfied (or, for hardcoded-text, when the content-collection index resolves a `source`). The walker imports its locator helpers from `src/lib/locator-signals.mjs`, which Test 7 of `locator-parity.test.mjs` pins byte-for-byte to `validate.ts:54-61`. The OPS-02 fence on `public/feedback-inject.js` is unbroken.

## What shipped

- **`src/integrations/edit-catalog/walker.mjs`** (354 LOC) — pure ESM Node module exporting:
  - `walkRoute({document, route, contentIndex})` — returns `Array<CatalogEntry>` in approximate document order, applying the 4-pass element-selection ladder with WeakSet claim-tracking
  - `classifyKind(el)` — returns one of `i18n-text | i18n-html | image | gallery-image | heading | hardcoded-text | null`
  - Internal `computeId(parts)` uses `node:crypto` sha1 + slice(0, 12) for collision-safe stable ids
  - Imports `closestAttr, i18nOf, imageRefOf, galleryOf, nearestHeading, domPathOf, visibleText, signalCount` from `../../lib/locator-signals.mjs`
  - Imports `normalizeText` from `./content-index.mjs` for hardcoded-text source lookup
- **`tests/edit-catalog/walker.test.mjs`** (249 LOC) — 11 node:test blocks covering:
  - Schema invariants (id is 12-hex, kind in enum, every entry has at least one locator-signal populated)
  - Per-kind classification (i18n-text, i18n-html, image, gallery-image, heading)
  - Hardcoded-text positive case (content-anchored via the tagline) and negative case (lorem ipsum -> requiresManualSelection: true)
  - id uniqueness within a single walk
  - signalCount() >= 2 invariant on every entry the walker marks requiresManualSelection: false
- **`tests/edit-catalog/dist-snapshot.test.mjs`** (143 LOC) — 5 node:test blocks running the walker against:
- **`tests/edit-catalog/fixtures/le-moulin-dist-snapshot.html`** (80,328 bytes committed) — byte-exact copy of `dist/client/homes/le-moulin/index.html` taken after `npm run build`, covering the real Astro 6 + @astrojs/vercel adapter output (hydration markers, astro-island web components, BaseLayout-injected feedback loader). Snapshot refresh policy documented inline in the test file.
- **`src/integrations/edit-catalog/index.mjs`** — extended (67 line delta) to:
  - Build the content-collection index ONCE per build, reused for every route's walker call
  - Add `routeToHtmlPath()` helper mapping `/homes/le-moulin` -> `homes/le-moulin/index.html`
  - For each prerendered route: `readFile` the HTML, `parseHTML` it with linkedom, call `walkRoute()`, write entries into the catalog
  - Defensive per-route try/catch wraps HTML-read separately from catalog-write, so a missing HTML for one route never aborts the build
  - Logger now reports both file count AND total entries

## Verification

| Check | Expected | Actual |
| ----- | -------- | ------ |
| `npm run test:catalog` | exit 0 | yes — 31/31 pass (15 from 07-01 + 07-04, 11 walker, 5 dist-snapshot) |
| `npm run build` | exit 0 | yes |
| Sample catalog `dist/client/edit-catalogs/homes/le-moulin.json` entries.length | >= 10 | **160** |
| Total entries across all 17 catalogs | >= 17 | **1806** |
| Distinct `kind` values present across catalogs | >= 3 | **6** — image, gallery-image, i18n-text, i18n-html, heading, hardcoded-text |
| At least one entry with `source.file` starting `src/content/` | yes | yes (2 entries on `homes/le-moulin.json` alone) |
| At least one entry with `requiresManualSelection: true` | yes | yes (117 of 160 on `homes/le-moulin.json`) |
| Every entry id matches `/^[0-9a-f]{12}$/` | yes | yes |
| `git diff main -- public/feedback-inject.js \| wc -l` | 0 | 0 |
| `grep -cE "[‘’“”]"` in any new file | 0 | 0 (walker.mjs, walker.test.mjs, dist-snapshot.test.mjs, index.mjs) |
| `grep -c "feedback-inject"` in walker.mjs | 0 | 0 (rephrased OPS-02 comments to avoid the literal string per acceptance criterion) |
| `grep -c "locator-signals"` in walker.mjs | >= 1 | 4 |
| `astro.config.mjs editCatalog() registrations | 1 | 1 (no double-registration) |
| Walker exports `walkRoute` and `classifyKind` as named exports | yes | `node -e "import(...).then(m => {...})"` prints `ok` |

## Commits

| Hash | Type | Message |
| ---- | ---- | ------- |
| `6ff9906` | test | `test(07-03): add failing walker tests against a hand-built fixture (RED)` |
| `bbe2971` | feat | `feat(07-03): implement walkRoute + classifyKind walker (GREEN)` |
| `4a180c6` | test | `test(07-03): pin walker against committed Astro-emitted dist snapshot` |
| `1cb87a7` | feat | `feat(07-03): wire walkRoute into the astro:build:done hook (real entries)` |

TDD gate sequence: each behavior-adding task pair landed RED before GREEN. Task 1 (`6ff9906`, `test:`) preceded Task 2 (`bbe2971`, `feat:`). Task 2b (`4a180c6`, `test:`) was an additive integration-coverage test on top of the already-green walker, not a separate RED gate. Task 3 (`1cb87a7`, `feat:`) was the integration wiring with verification via the existing dist-snapshot test plus real-build inspection.

## Deviations from Plan

Two upstream-supplied corrections from Wave 1 were applied as instructed in the executor prompt. Both are documented here so Phase 8 (matcher endpoint) and Phase 9 (canary) know the operating paths.

### [Rule 1 — Bug] Upstream Deviation #1: catalog output path is `dist/client/edit-catalogs/`, not `dist/edit-catalogs/`

**Inherited from:** 07-02 deviation (see `07-02-SUMMARY.md` Deviations section).

**Issue:** Under `@astrojs/vercel`, Astro splits the build into `dist/client/` (static assets — production-served) and `dist/server/` (Vercel Functions bundle). The 07-02 integration writes catalogs relative to Astro's `dir` URL, which the adapter resolves to `dist/client/`. The 07-03 PLAN's verify commands and acceptance criteria literally pin `dist/edit-catalogs/`.

**Resolution:** The walker module's source code is path-agnostic — it takes a `document` argument from the integration (no path coupling). The deviation lives in the surface around it:

- **Task 2b fixture path:** Copied `dist/client/homes/le-moulin/index.html` (not `dist/homes/le-moulin/index.html`) to `tests/edit-catalog/fixtures/le-moulin-dist-snapshot.html`. The snapshot test reads from the fixtures dir, so the prod adapter path is captured-and-pinned by the snapshot itself.
- **Task 3 integration:** Added `routeToHtmlPath()` that maps `/homes/le-moulin` -> `homes/le-moulin/index.html` relative to Astro's `dir` URL. Under the Vercel adapter, that resolves to `dist/client/homes/le-moulin/index.html`. Under plain static output it would resolve to `dist/homes/le-moulin/index.html`. The integration is correct under any adapter.
- **Verification commands:** Re-pointed at `dist/client/edit-catalogs/homes/le-moulin.json` (not `dist/edit-catalogs/homes/le-moulin.json`). The verify-block command in the PLAN's Task 3 was run against the corrected path and passed.

**Files modified:** Only the integration (already path-agnostic by design) — no patch was needed in the walker itself.

### [Rule 3 — Blocker] Upstream Deviation #2: `npm install` required at executor start

**Issue:** The worktree branched from a base that has `linkedom@^0.18.12` and `gray-matter@^4.0.3` in `package.json` (merged by 07-01 and 07-04) but no `node_modules/` for this branch's checkout. Without installing, the walker tests cannot import `linkedom`.

**Resolution:** Ran `npm install` once at executor start (3s, 327 packages installed). No `package.json` or `package-lock.json` changes — the lockfile from main was honored byte-for-byte.

**Files modified:** None. `node_modules/` is gitignored.

### Notes on choices already documented in the PLAN (not deviations, just executed picks)

- **The walker's locator-signals import path** is `'../../lib/locator-signals.mjs'` (relative to `src/integrations/edit-catalog/walker.mjs`), as the PLAN's "key_links" frontmatter pins.
- **node:test glob** (`tests/edit-catalog/*.test.mjs`) is inherited from 07-01's `test:catalog` script — no change.
- **Walker treats the `route` argument as metadata-only.** v1.3 does not vary entry generation by route; the route is passed for future symmetry with per-locale walks and for log-message clarity. Per-route metadata (currentTextFr from FR-locale variants) is explicitly out of scope per the PLAN's CatalogEntry comment.

## Auth Gates

None encountered.

## Known Stubs

- **`buildSha: null`** at the top of every catalog — intentional placeholder for 07-05 to fill with `process.env.VERCEL_GIT_COMMIT_SHA` or `git rev-parse HEAD`. The walker does not own this field; 07-02 ships it, 07-05 wraps it.

No other stubs. The walker fully wires the entry pipeline; every entry it emits has real classification + real locator-signal fields + real id derivation. There are no "TODO" placeholders, no mock-data branches, no entries shaped as `{kind: 'unknown'}`.

## Threat Flags

None new. The walker reads `dist/client/<route>/index.html` and `src/content/**/*.md` (via `buildContentIndex` which already underwent its own threat-surface review in 07-04) and writes to `dist/client/edit-catalogs/`. No network endpoints, auth paths, or trust-boundary schema changes are introduced by this plan. The walker runs only at build time inside the Astro `astro:build:done` hook; it has no runtime cost on the deployed site.

## Continuation Notes

### For 07-05 (build-SHA wrap)

The catalog's top-level `buildSha` field remains `null`. 07-05 should:

1. Capture the commit SHA once at the top of the `astro:build:done` hook (after `buildContentIndex()` and before the per-route loop): try `process.env.VERCEL_GIT_COMMIT_SHA`, fall back to `execSync('git rev-parse HEAD').toString().trim()`.
2. Replace `buildSha: null` in the existing `catalog` object with the captured SHA.
3. The walker's output (the `entries` array) is unaffected — only the top-level metadata changes.

### For Phase 8 (matcher endpoint)

- Read catalogs from `dist/client/edit-catalogs/<route>.json` at build time (NOT `dist/edit-catalogs/`).
- Production HTTP path is `/edit-catalogs/<route>.json` at the site root — Vercel serves `dist/client/` from the root.
- Use the `id` field as the stable key. `requiresManualSelection: true` entries are still valid catalog entries; the matcher must surface them to Phase 8 PANEL as "needs human eye" candidates rather than auto-merging them.
- Hardcoded-text entries with a `source` object (e.g. `{file: 'src/content/homes/le-moulin.md', fieldPath: 'tagline'}`) are the auto-mergeable subset of hardcoded text — those are the CATALOG-04 round-trip targets.

### Real-build counts (snapshot at completion time)

```
total catalogs: 17
total entries: 1806
distinct kinds: gallery-image, hardcoded-text, heading, i18n-html, i18n-text, image (all 6)
le-moulin.json entries: 160
le-moulin.json kinds: 76 i18n-text, 41 hardcoded-text, 27 image, 8 gallery-image, 5 i18n-html, 3 heading
le-moulin.json with source: 2 (tagline + summary from src/content/{homes,pages}/le-moulin.md)
le-moulin.json requiresManualSelection=true: 117 (mostly hardcoded-text without a content-collection anchor)
```

The matcher endpoint will likely want to filter on `requiresManualSelection === false` first and surface the ~43 auto-mergeable entries per route to Claude-Action for the autonomy gate, with the ~117 manual-selection entries available for human inspection through the Phase 8 PANEL.

## Self-Check: PASSED

Verified existence + reachability of every claim:

| Claim | Verification |
| ----- | ------------ |
| `src/integrations/edit-catalog/walker.mjs` exists | FOUND |
| `tests/edit-catalog/walker.test.mjs` exists | FOUND |
| `tests/edit-catalog/dist-snapshot.test.mjs` exists | FOUND |
| `tests/edit-catalog/fixtures/le-moulin-dist-snapshot.html` exists | FOUND (80,328 bytes) |
| `src/integrations/edit-catalog/index.mjs` modified (not new) | FOUND with 67-line delta from main |
| Commit `6ff9906` (Task 1 RED) | FOUND in `git log main..HEAD` |
| Commit `bbe2971` (Task 2 GREEN) | FOUND |
| Commit `4a180c6` (Task 2b snapshot) | FOUND |
| Commit `1cb87a7` (Task 3 integration) | FOUND |
| `npm run test:catalog` exits 0 | yes — 31/31 pass |
| `npm run build` exits 0 | yes — 1806 entries written to dist/client/edit-catalogs/ |
| OPS-02 fence: `git diff main -- public/feedback-inject.js` | 0 lines |
