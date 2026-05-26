---
phase: 07-build-time-edit-catalog-generator
verified: 2026-05-26T00:00:00Z
head_sha: a7f47c7
status: passed
score: 6/6 must-haves verified
overrides_applied: 0
deferred:
  - truth: "Live HTTP HEAD probe against https://www.moulinareves.com/edit-catalogs/homes/le-moulin.json returns 200 (Success Criterion #5b)"
    addressed_in: "Phase 9"
    evidence: "ROADMAP.md Phase 7 SC #5 explicitly states '(Live HEAD probe deferred to Phase 9 — it requires a deployed Vercel build; Phase 9 Success Criterion #3 already covers it.)'. Phase 9 SC #3: 'A HEAD probe against https://www.moulinareves.com/edit-catalogs/homes/le-moulin.json returns HTTP/2 200 with content-type: application/json...'"
---

# Phase 7: Build-time Edit Catalog Generator — Verification Report

**Phase Goal:** After `astro build`, a post-build integration walks the emitted HTML in `dist/` and writes one JSON catalog per prerendered route under `dist/edit-catalogs/<route>.json` (actual emit path: `dist/client/edit-catalogs/<route>.json` per documented Rule-1 deviation under @astrojs/vercel adapter). Each catalog enumerates every addressable element with locator signals byte-identical to the v1.1 per-element click flow.

**Verified:** 2026-05-26
**HEAD:** `a7f47c7`
**Status:** PASSED

---

## Goal Achievement — Success Criteria

### SC#1: ≥ 8 catalogs at dist/client/edit-catalogs/

| Check | Expected | Observed | Status |
| ----- | -------- | -------- | ------ |
| `find dist/client/edit-catalogs -name '*.json' \| wc -l` | ≥ 8 | **17** | PASS |
| Catalog files include home + about + contact + 3 houses + the-compound + gallery | yes | yes (all present plus 8 additional: catering, explore, groups, success, wellness, homes.json, 3× journal/*.json) | PASS |
| Catalogs mirrored to .vercel/output/static/edit-catalogs/ (Vercel deploy artifact) | yes | 17 files | PASS |

**SC#1: PASS** — 17 catalogs (>2× the ≥8 threshold), all under `dist/client/edit-catalogs/` per documented deviation.

### SC#2: Every entry has stable id + kind + ≥ 2 locator signals (or requiresManualSelection: true)

| Check | Expected | Observed | Status |
| ----- | -------- | -------- | ------ |
| Sample `dist/client/edit-catalogs/homes/le-moulin.json` entries | populated | **160 entries** | PASS |
| All entry `id` fields match `/^[0-9a-f]{12}$/` (le-moulin sample) | yes | yes | PASS |
| Unique ids within catalog | yes | 160/160 unique | PASS |
| All 6 `kind` enum values present globally | yes | gallery-image, hardcoded-text, heading, i18n-html, i18n-text, image | PASS |
| Sample kind distribution (le-moulin) | mixed | image=27, gallery-image=8, i18n-text=76, i18n-html=5, heading=3, hardcoded-text=41 | PASS |
| `walker.test.mjs` (11 tests) | pass | 11/11 | PASS |
| `dist-snapshot.test.mjs` (5 tests) | pass | 5/5 | PASS |
| `node --test tests/edit-catalog/*.test.mjs` total | pass | **31/31** | PASS |
| Non-manual entries satisfy signalCount ≥ 2 (le-moulin: 43 non-manual) | 43/43 | 43/43 (walker.test Test 11 + manual cross-check) | PASS |
| `hardcoded-text` rows without `src/content/**/*.md` source → `requiresManualSelection: true` | yes | walker.test Test 9 + walker.mjs:230-236 explicit logic | PASS |

**SC#2: PASS** — Entry schema, id stability, kind enum, signalCount ≥ 2, and requiresManualSelection contract all verified.

### SC#3: Locator-signal byte-identity with v1.1 click flow

| Check | Expected | Observed | Status |
| ----- | -------- | -------- | ------ |
| `src/lib/locator-signals.mjs` exists with 8 exports | yes | closestAttr, i18nOf, imageRefOf, galleryOf, nearestHeading, domPathOf, visibleText, signalCount + MIN_VAGUE_LEN | PASS |
| Walker imports helpers from `../../lib/locator-signals.mjs` | yes | walker.mjs:35-46 | PASS |
| Test 6 (substring-presence regex pins helper against browser source) | pass | locator-parity.test Test 6 passes | PASS |
| Test 7 (signalCount byte-equality with validate.ts) | pass | locator-parity.test Test 7 passes | PASS |
| OPS-02 fence: `git diff main -- public/feedback-inject.js \| wc -l` | 0 | **0** | PASS |
| All canonical browser helpers still present in public/feedback-inject.js | yes | 7/7 function signatures intact (closestAttr, i18nOf, imageRefOf, galleryOf, headingNear, domPathOf, visibleText) | PASS |

**SC#3: PASS** — Locator-signal parity is mechanically pinned by Tests 6 + 7. OPS-02 fence held byte-for-byte.

### SC#4: Every catalog has top-level buildSha = git HEAD short SHA

| Check | Expected | Observed | Status |
| ----- | -------- | -------- | ------ |
| All 17 catalogs have `buildSha` field matching `/^[0-9a-f]{7,12}$/` | yes | all 17 carry `a7f47c7` (7 chars) | PASS |
| `buildSha` matches `git rev-parse --short HEAD` | `a7f47c7` | `a7f47c7` (identical) | PASS |
| Same buildSha across all catalogs in one build | yes | all 17 = `a7f47c7` | PASS |
| Sanity-script tampering test: rejects `buildSha='unknown'` with exit 1 | yes | confirmed: `GATE_EXIT=1` with documented FAIL message | PASS |
| `npm run check:catalogs` standalone | exit 0 | `OK: 17 catalogs, 1806 entries, buildSha=a7f47c7` | PASS |
| Postbuild hook wired in package.json | yes | `"postbuild": "node scripts/check-edit-catalogs.mjs"` | PASS |

**SC#4: PASS** — buildSha populated, matches HEAD exactly, sanity gate enforces invariant.

### SC#5: dist/edit-catalogs/ ships to production (local half)

| Check | Expected | Observed | Status |
| ----- | -------- | -------- | ------ |
| `grep -v '^#' .vercelignore \| grep -c 'edit-catalogs'` | 0 (no active rule) | **0** | PASS |
| .vercelignore has CATALOG-06 decision comment block at top | yes | 5-line comment block present | PASS |
| `.vercel/output/static/edit-catalogs/` populated by Vercel adapter | yes | 17 files mirrored | PASS |
| CATALOG-06 decision comment-anchored in src/integrations/edit-catalog/index.mjs | yes | lines 120-124 | PASS |
| Live HEAD probe vs https://www.moulinareves.com/edit-catalogs/homes/le-moulin.json returns 200 (SC#5b) | DEFERRED to Phase 9 | per ROADMAP.md inline note + Phase 9 SC #3 | DEFERRED (accepted) |

**SC#5: PASS** — Local half complete; live HEAD probe explicitly deferred to Phase 9 per ROADMAP.md and acknowledged in 07-05-SUMMARY.

### SC#6: Requirements coverage (CATALOG-01..06)

| Requirement | Description | Source Plan | Evidence | Status |
| ----------- | ----------- | ----------- | -------- | ------ |
| CATALOG-01 | Post-build integration emits one JSON per prerendered route | 07-02 | `src/integrations/edit-catalog/index.mjs` (default-export integration, `astro:build:done` hook, 17 files emitted) | SATISFIED |
| CATALOG-02 | Entry schema: stable id, kind enum, locator signals | 07-03 | `walker.mjs` walkRoute + classifyKind; 31/31 tests pass; 1806 real entries written | SATISFIED |
| CATALOG-03 | Walker reuses closestAttr/i18nOf via shared Node-side helper byte-identical to feedback-inject.js | 07-01 + 07-03 | `src/lib/locator-signals.mjs` with OPS-02 header; walker imports all 8 helpers; parity Tests 6+7 pass; OPS-02 fence intact (0 diff vs main) | SATISFIED |
| CATALOG-04 | Hardcoded-text without content-collection source → requiresManualSelection: true | 07-04 | `content-index.mjs` buildContentIndex (102 entries indexed); walker.mjs:230-236 sets requiresManualSelection: true when no source; le-moulin sample: 117/160 manual, 2 with src/content source | SATISFIED |
| CATALOG-05 | buildSha = git HEAD short SHA | 07-05 | execSync('git rev-parse --short HEAD') in index.mjs:127; all 17 catalogs carry `a7f47c7` | SATISFIED |
| CATALOG-06 | dist/edit-catalogs/ ships to prod; documented in plan | 07-05 | .vercelignore decision comment block + sanity-script Check 8 (banned regex) + integration source comment block | SATISFIED |

**SC#6: PASS** — All 6 CATALOG-XX requirements satisfied, each mapped to a plan and verified in code.

---

## Required Artifacts

| Artifact | Provides | Status |
| -------- | -------- | ------ |
| `src/lib/locator-signals.mjs` (184 LOC) | 8 Node-side helpers parity-pinned to browser source | VERIFIED |
| `src/integrations/edit-catalog/index.mjs` (220 LOC) | Astro integration; default export + routeToCatalogPath named export; buildSha injection | VERIFIED |
| `src/integrations/edit-catalog/walker.mjs` (355 LOC) | walkRoute + classifyKind; 4-pass element-selection ladder | VERIFIED |
| `src/integrations/edit-catalog/content-index.mjs` (143 LOC) | buildContentIndex + normalizeText for hardcoded-text source detection | VERIFIED |
| `scripts/check-edit-catalogs.mjs` (230 LOC) | Postbuild sanity gate; 8 checks; rejects buildSha='unknown' | VERIFIED |
| `tests/edit-catalog/locator-parity.test.mjs` (8 tests) | Parity harness pinning helper to browser + signalCount to validate.ts | VERIFIED (8/8 pass) |
| `tests/edit-catalog/content-index.test.mjs` (7 tests) | Content-index contract | VERIFIED (7/7 pass) |
| `tests/edit-catalog/walker.test.mjs` (11 tests) | Walker schema + classification + signalCount | VERIFIED (11/11 pass) |
| `tests/edit-catalog/dist-snapshot.test.mjs` (5 tests) | Walker against real Astro-emitted snapshot | VERIFIED (5/5 pass) |
| `tests/edit-catalog/fixtures/le-moulin-dist-snapshot.html` | 80 KB committed real Astro output | VERIFIED (file present, parses) |
| `.vercelignore` (modified) | CATALOG-06 decision comment block | VERIFIED |
| `package.json` (modified) | `postbuild`, `check:catalogs`, `test:catalog` scripts; `linkedom` devDep | VERIFIED |
| `astro.config.mjs` (modified) | `editCatalog()` registered in integrations array | VERIFIED |

---

## Key Link Verification

| From | To | Via | Status |
| ---- | -- | --- | ------ |
| astro.config.mjs | src/integrations/edit-catalog/index.mjs | `import editCatalog from './src/integrations/...'` + integrations array entry | WIRED |
| src/integrations/edit-catalog/index.mjs | src/integrations/edit-catalog/walker.mjs | `import { walkRoute }` (line 25) | WIRED |
| src/integrations/edit-catalog/index.mjs | src/integrations/edit-catalog/content-index.mjs | `import { buildContentIndex }` (line 26) | WIRED |
| src/integrations/edit-catalog/walker.mjs | src/lib/locator-signals.mjs | `from '../../lib/locator-signals.mjs'` (line 46) — all 8 helpers imported | WIRED |
| src/integrations/edit-catalog/index.mjs | dist/client/edit-catalogs/ | fs.mkdir + fs.writeFile in astro:build:done hook (lines 106, 198) | WIRED (17 files emitted) |
| scripts/check-edit-catalogs.mjs | dist/client/edit-catalogs/ | readdirSync recursive walk (lines 53-65) | WIRED (gate passes) |
| package.json `postbuild` | scripts/check-edit-catalogs.mjs | `"postbuild": "node scripts/check-edit-catalogs.mjs"` | WIRED |
| tests/edit-catalog/locator-parity.test.mjs | public/feedback-inject.js | fs.readFileSync substring-presence regex (Test 6) | WIRED |
| tests/edit-catalog/locator-parity.test.mjs | src/pages/api/feedback/validate.ts | fs.readFileSync normalized signalCount byte-eq (Test 7) | WIRED |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| dist/client/edit-catalogs/*.json | `entries[]` | walker.mjs → walkRoute() → linkedom-parsed real HTML at dist/client/<route>/index.html | yes — **1806 total entries** across 17 catalogs | FLOWING |
| dist/client/edit-catalogs/*.json | `buildSha` | execSync('git rev-parse --short HEAD') | yes — `a7f47c7` matches HEAD | FLOWING |
| Walker entries | `source` field (CATALOG-04) | content-index.mjs → buildContentIndex() → fs walk of src/content/**/*.md | yes — 10 entries across all catalogs (2 on le-moulin alone) have populated `source` objects pointing at real .md files | FLOWING |
| Walker entries | `requiresManualSelection` | walker.mjs logic re: signalCount + hardcoded-text source | yes — 117 of 160 entries on le-moulin are flagged manual; 43 auto-mergeable | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Test suite passes | `npm run test:catalog` | `tests 31 pass 31 fail 0` | PASS |
| Sanity script passes standalone | `npm run check:catalogs` | `OK: 17 catalogs, 1806 entries, buildSha=a7f47c7` (exit 0) | PASS |
| Catalog count ≥ 8 | `find dist/client/edit-catalogs -name '*.json' \| wc -l` | `17` | PASS |
| OPS-02 fence holds | `git diff main -- public/feedback-inject.js \| wc -l` | `0` | PASS |
| Sanity script rejects buildSha='unknown' | manual tampering test (set + run + restore) | `GATE_EXIT=1` with documented FAIL message | PASS |
| Vercel adapter mirrors catalogs to deploy artifact | `find .vercel/output/static/edit-catalogs -name '*.json' \| wc -l` | `17` | PASS |
| No active edit-catalogs rule in .vercelignore | `grep -v '^#' .vercelignore \| grep -c 'edit-catalogs'` | `0` | PASS |
| Smart-quote scan (curly quotes pitfall from v1.1 lessons) | `grep -cE "[‘’“”]"` on all 6 changed files | `0/0/0/0/0/0` | PASS |
| Debt markers in modified files | `grep -E "TODO\|FIXME\|XXX\|TBD\|HACK"` | (no output) | PASS |

---

## Probe Execution

The phase has no `scripts/*/tests/probe-*.sh` probes; it uses `node --test` directly via `npm run test:catalog` plus `npm run check:catalogs` postbuild gate. Both were run and pass.

| Probe-equivalent | Command | Result | Status |
| ---------------- | ------- | ------ | ------ |
| Test harness | `npm run test:catalog` | 31/31 pass | PASS |
| Postbuild gate | `npm run check:catalogs` | exit 0, all 8 checks pass | PASS |

---

## Requirements Coverage

All 6 CATALOG-* requirements declared in REQUIREMENTS.md and mapped to Phase 7 are satisfied (see SC#6 table above). No orphaned requirements detected; REQUIREMENTS.md lists exactly CATALOG-01..06 → Phase 7.

---

## Anti-Patterns Scan

| File | Pattern | Severity | Notes |
| ---- | ------- | -------- | ----- |
| src/integrations/edit-catalog/index.mjs | (clean) | — | No TODO/FIXME/XXX/TBD/HACK markers; no curly quotes; no orphaned imports |
| src/integrations/edit-catalog/walker.mjs | (clean) | — | Same |
| src/integrations/edit-catalog/content-index.mjs | (clean) | — | Same |
| src/lib/locator-signals.mjs | (clean) | — | Same |
| scripts/check-edit-catalogs.mjs | (clean) | — | Same |
| .vercelignore | (clean) | — | CATALOG-06 comment block + 3 unchanged active rules |

**No blocking or warning anti-patterns found.**

Minor observations (informational only, NOT blocking):

1. `scripts/check-edit-catalogs.mjs` signalCount() (line 75-84) uses field names `entry.textAnchor` (not `currentText`) and `entry.galleryIndex` (matched separately). This does NOT cause false-negatives because the script's auto-merge enforcement checks `hasSource || sc >= 2`; the rule still rejects truly broken entries while accepting walker output that satisfies the validate.ts-equivalent rule downstream. All 43 non-manual entries on the le-moulin sample pass independent cross-check using the validate.ts-equivalent rule.

2. Plan `07-04` was authored to run in a worktree where 07-01's `test:catalog` script wasn't merged yet, so its tests were invoked via raw `node --test` rather than `npm run test:catalog`. The deviation is documented in 07-04-SUMMARY and is no longer relevant post-merge — `npm run test:catalog` now picks up all 31 tests under tests/edit-catalog/*.test.mjs.

---

## Atomic-Commit Audit

| Commit | Type | Plan | Pattern |
| ------ | ---- | ---- | ------- |
| `afde2d1` | test | 07-01 | RED (test scaffold before impl) |
| `5649571` | feat | 07-01 | GREEN |
| `1618090` | feat | 07-02 | Integration scaffold |
| `da98833` | feat | 07-02 | Register in astro.config |
| `6ff9906` | test | 07-03 | RED (walker tests before impl) |
| `bbe2971` | feat | 07-03 | GREEN (walker impl) |
| `4a180c6` | test | 07-03 | dist-snapshot fixture + test |
| `1cb87a7` | feat | 07-03 | Wire walker into hook |
| `e4c77e3` | test | 07-04 | RED |
| `5c695c0` | feat | 07-04 | GREEN |
| `9915f8f` | feat | 07-05 | buildSha injection |
| `efdaccf` | feat | 07-05 | Sanity script + postbuild |
| `30a1906` | docs | 07-05 | .vercelignore comment block |

Each plan committed atomic per-task commits with RED → GREEN pattern where TDD applied. 5 SUMMARY.md files exist (one per plan). Pattern compliance is clean.

---

## Human Verification Required

None. All Success Criteria were verifiable programmatically. SC#5b (live HEAD probe against deployed URL) requires a deployed Vercel build and is explicitly deferred to Phase 9 SC #3 per the ROADMAP contract.

---

## Phase 7 Final Status

| SC | Criterion | Status |
| -- | --------- | ------ |
| #1 | ≥ 8 catalogs at dist/(client/)?edit-catalogs/ | PASS (17 catalogs) |
| #2 | Entry schema (id + kind + ≥ 2 signals OR requiresManualSelection) | PASS (31/31 tests + 1806 real entries) |
| #3 | Locator-signal byte-identity with v1.1 click flow + OPS-02 fence intact | PASS (Tests 6+7 + 0-line diff vs main) |
| #4 | buildSha = git HEAD short SHA | PASS (all 17 = `a7f47c7`) |
| #5 | dist/edit-catalogs ships to prod (local half) | PASS (.vercelignore clean + .vercel/output mirror) |
| #5b | Live HEAD probe vs deployed URL | DEFERRED (Phase 9 SC #3 per ROADMAP contract) |
| #6 | CATALOG-01..06 requirements coverage | PASS (all 6 satisfied) |

**Overall: PHASE 7 GOAL ACHIEVED.** All deliverables exist in the codebase, are wired, produce real data, and pass automated verification. The OPS-02 fence on `public/feedback-inject.js` is byte-stable vs main. Sanity gate is mandatory on every build (Vercel-deploy-aware) and rejects malformed catalogs.

---

_Verified: 2026-05-26_
_Verifier: Claude (gsd-verifier)_
_HEAD: a7f47c7_
