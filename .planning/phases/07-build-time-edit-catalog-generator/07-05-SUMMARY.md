---
phase: 07-build-time-edit-catalog-generator
plan: 05
subsystem: edit-catalog-closeout
tags: [catalog, build-sha, postbuild, vercelignore, CATALOG-05, CATALOG-06]
status: complete
requirements: [CATALOG-05, CATALOG-06]
requirements-completed: [CATALOG-05, CATALOG-06]
dependency-graph:
  requires:
    - "src/integrations/edit-catalog/index.mjs (07-02 + 07-03) — astro:build:done hook that writes the catalog object; this plan replaces `buildSha: null` with a real SHA"
    - "dist/client/edit-catalogs/ output path (07-02 Wave 1 deviation) — sanity script reads from there, not from dist/edit-catalogs/"
  provides:
    - "buildSha: <7-12 hex> populated on every catalog (Phase 8 overlay + Phase 9 canary can detect drift vs <meta name=\"x-build-sha\">)"
    - "scripts/check-edit-catalogs.mjs — postbuild sanity gate; fails the deploy if any catalog violates the schema, signal-count rule, or carries buildSha='unknown'"
    - "package.json scripts: `check:catalogs` (standalone) + `postbuild` (auto-runs after every build, including on Vercel)"
    - ".vercelignore CATALOG-06 decision comment block — anchor for future maintainers; the sanity script enforces the rule machine-side"
  affects:
    - "Phase 8 matcher endpoint (relies on buildSha for drift detection and on the dist/(client/)?edit-catalogs/ path staying shippable)"
    - "Phase 9 canary smoke (consumes /edit-catalogs/<route>.json over HTTP; needs the postbuild gate to abort bad deploys)"
    - "Every future Vercel deploy (postbuild gate is mandatory — a malformed catalog will now block the deploy with a clear stderr message)"
tech-stack:
  added: []
  patterns:
    - "Build-time `git rev-parse --short HEAD` via node:child_process execSync, wrapped in try/catch with logger.warn fallback to 'unknown' (rejected by the sanity script — Vercel always has .git)"
    - "Postbuild lifecycle hook as the sole deploy gate for catalog integrity (mirrors the existing prebuild gate for raw-photo cleanliness)"
    - "Schema + signal-count assertions in pure Node stdlib (fs, path) — no new dep, runs in Vercel's sandbox unmodified"
    - "Same-buildSha invariant across all catalogs in one build — a per-route SHA divergence would mean the integration recomputed mid-build, which is a bug we want to catch"
    - "Inline comment-anchor pattern for decision records (CATALOG-06 mirrored in the integration source AND in .vercelignore so neither hand-edit can silently break the contract)"
key-files:
  created:
    - scripts/check-edit-catalogs.mjs
  modified:
    - src/integrations/edit-catalog/index.mjs
    - package.json
    - .vercelignore
decisions:
  - "buildSha is resolved AT BUILD TIME inside the astro:build:done hook via `execSync('git rev-parse --short HEAD')` — not via process.env.VERCEL_GIT_COMMIT_SHA, not via .nvmrc-bound tooling. Reason: a single source of truth that works identically on Vercel (which clones .git) and locally; no env-var dependency to track. The 'unknown' fallback exists ONLY as a logged-warning escape hatch for non-git environments and is rejected by the sanity script as a hard failure, so it cannot reach a production deploy."
  - "The sanity script lives at scripts/check-edit-catalogs.mjs (matches the existing scripts/check-public-clean.mjs prebuild-gate pattern) and is wired as BOTH `npm run check:catalogs` (standalone run by humans + Phase 9 canary) AND `postbuild` (auto-runs after every `npm run build` including on Vercel). One file, two entry points, identical behavior — a malformed catalog now hard-aborts the Vercel deploy with a single-line stderr message."
  - "The sanity script enforces a same-buildSha invariant across all catalogs in one build. If the integration ever recomputed buildSha mid-loop (e.g. a refactor mistakenly moved the execSync inside the per-route loop), the catalogs would carry divergent SHAs and the script would fail. This catches a class of regressions that wouldn't otherwise surface until Phase 8 overlay tried to match against a stale meta tag."
  - "The .vercelignore CATALOG-06 comment block is a comment-anchored decision record only — the machine-enforced contract lives in the sanity script (Check 8: regex-match all non-comment lines for `^(dist/)?(client/)?edit-catalogs(/|$)`, fail if any active rule matches). A hand-edit that adds such a rule will now abort the next postbuild run with a specific failure message naming the offending line."
  - "Catalog output path is `dist/client/edit-catalogs/` (declared as a constant at the top of the script — `const CATALOG_DIR = 'dist/client/edit-catalogs'`). The CATALOG-06 banned regex is permissive: it matches `dist/edit-catalogs`, `dist/client/edit-catalogs`, AND bare `edit-catalogs` so either deployment shape (plain static or Vercel-adapter-split) is protected against an accidental .vercelignore rule."
metrics:
  duration: ~11 minutes
  completed: 2026-05-26T11:34:00Z
  tasks: "3 of 3"
  files-changed: 4
  files-created: 1
  insertions: 259
  deletions: 1
  catalogs-emitted: 17
  total-entries: 1806
---

# Phase 7 Plan 05: buildSha + CATALOG-06 Ship-To-Prod + Sanity Gate Summary

Closes out Phase 7. Every catalog at `dist/client/edit-catalogs/*.json` now carries a real `buildSha` matching `/^[0-9a-f]{7,12}$/` (resolved at build time via `git rev-parse --short HEAD`), the CATALOG-06 ship-to-prod decision is comment-anchored in both `src/integrations/edit-catalog/index.mjs` AND `.vercelignore`, and `scripts/check-edit-catalogs.mjs` runs as a postbuild gate that aborts the Vercel deploy on any catalog-integrity regression — a build-time net that Phase 8 overlay and Phase 9 canary can rely on.

## Objective Recap

CATALOG-05: catalogs must carry `buildSha` so Phase 8 overlay + Phase 9 canary can detect drift vs the deployed `<meta name="x-build-sha">` tag. Until this plan, the field was the literal `null` placeholder from 07-02.

CATALOG-06: the ship-to-prod decision must be explicit and machine-enforced. `dist/(client/)?edit-catalogs/` must remain shippable to production because the Phase 8 matcher endpoint reads catalogs from the Vercel filesystem at runtime. A future hand-edit to `.vercelignore` adding a `dist/edit-catalogs` rule would silently break the matcher.

Sanity script: codify Phase 7 Success Criteria #1, #2, #4 as an executable check that doubles as a regression net for Phase 8 + Phase 9.

## Tasks Completed

### Task 1 — Inject buildSha at build time + comment-anchor CATALOG-06 in the integration source (commit `9915f8f`)

Edited `src/integrations/edit-catalog/index.mjs`:

- Imported `execSync` from `node:child_process` next to the existing fs/path/url imports.
- Inside the `astro:build:done` hook, immediately after `buildContentIndex()`, added a CATALOG-05 + CATALOG-06 DECISION comment block (15 lines) documenting WHY buildSha must be real and WHY `dist/edit-catalogs/` ships to production.
- Computed `buildSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()` once per build (outside the per-route loop — same SHA for all catalogs in one build).
- Wrapped in try/catch with `logger.warn(...)` fallback to `'unknown'`. The warn message names Vercel explicitly: `Vercel deploys MUST have .git available; this fallback indicates a misconfigured environment.` Since the sanity script rejects `'unknown'` as a hard failure, this fallback can never reach a production-bound path — but it remains as an observable escape hatch for non-git local sandboxes.
- Replaced the literal `buildSha: null` placeholder in the catalog-write object with the resolved `buildSha`.

**Verification:** `npm run build` exits 0. `node -e "..."` on `dist/client/edit-catalogs/homes/le-moulin.json` confirms `buildSha` matches `/^[0-9a-f]{7,12}$/`. The first build produced `buildSha=dccf5f0` (worktree base), the build after Task 1 commit produced `buildSha=9915f8f`, the final post-Task-3 build produced `buildSha=30a1906` — all valid, each picking up the latest HEAD as expected.

### Task 2 — Add `scripts/check-edit-catalogs.mjs` + wire `check:catalogs` and `postbuild` npm scripts (commit `efdaccf`)

Created `scripts/check-edit-catalogs.mjs` (~190 LOC):

- Header comment block contains the literal phrase `postbuild also runs on Vercel deploys` so the Vercel-impact is visible at read time.
- `const CATALOG_DIR = 'dist/client/edit-catalogs'` at the top — explicit path matching the 07-02 Wave 1 deviation.
- 8 sanity checks: catalog directory exists with ≥ 8 files, every file parses as JSON, every file carries the 4 top-level keys, `buildSha` matches `/^[0-9a-f]{7,12}$/` (with `'unknown'` as a HARD FAILURE), all catalogs share the same buildSha, per-entry `id` is 12-hex, `kind` in the 6-value enum, ids unique within a catalog, entries with `requiresManualSelection: false` satisfy `signalCount >= 2` (or have an anchoring `source` object — mirrors the walker policy), and `.vercelignore` contains no active rule matching `^(dist/)?(client/)?edit-catalogs(/|$)` (CATALOG-06 guard, ignores comment lines).
- All failure paths `process.exit(1)` with `[check-edit-catalogs] FAIL: <file> <field>` to stderr.
- Success path writes a single line to stdout: `[check-edit-catalogs] OK: <n> catalogs, <m> entries, buildSha=<sha>`.
- Uses only `node:fs`, `node:path`, no new dependency.

Edited `package.json` — added two scripts:

- `"check:catalogs": "node scripts/check-edit-catalogs.mjs"` (standalone run, for humans + Phase 9 canary)
- `"postbuild": "node scripts/check-edit-catalogs.mjs"` (auto-runs after every `npm run build`, including on Vercel deploys)

**Verification:**

- `npm run build` exits 0; the postbuild hook prints `[check-edit-catalogs] OK: 17 catalogs, 1806 entries, buildSha=...`.
- `npm run check:catalogs` standalone exits 0 with the same OK line.
- **Tampering test 1 (the critical one):** set one catalog's `buildSha` to `'unknown'`, run the script — exits 1 with the documented hard-failure message naming the file and explaining the cause. Restored file exits 0.
- 0 curly quotes in `scripts/check-edit-catalogs.mjs` and `package.json`.

### Task 3 — Comment-anchor CATALOG-06 ship-to-prod decision in `.vercelignore` (commit `30a1906`)

Added a 5-line comment block at the top of `.vercelignore`:

```
# CATALOG-06 (v1.3 Phase 7): dist/edit-catalogs/ MUST ship to production —
# the matcher endpoint at src/pages/api/feedback/match.ts (Phase 8) reads
# these JSON files via the Vercel filesystem at runtime. Adding a
# `dist/edit-catalogs` rule here would break the matcher.
# scripts/check-edit-catalogs.mjs asserts this contract on every build.
```

The 3 pre-existing active entries (`public/Moulin House Photos/`, `public/photo-source/`, `feedback-incoming/`) are untouched byte-for-byte.

**Verification:**

- `grep -c "CATALOG-06" .vercelignore` returns 1.
- `grep -v '^#' .vercelignore | grep -c 'edit-catalogs'` returns 0 (no active rule).
- 3 pre-existing active entries present and unchanged.
- `npm run check:catalogs` exits 0 (the comment block is `#`-prefixed, so the banned-regex pass ignores it).
- 0 curly quotes.

## Deviations from Plan

Three deviations were carried in from Wave 1 + Wave 2 via the executor prompt. All three are documented here so the close-out shows the full Phase 7 history at a glance.

### [Rule 1 — Bug] Upstream Deviation #1: catalog output path is `dist/client/edit-catalogs/`, not `dist/edit-catalogs/`

**Inherited from:** 07-02 Wave 1 deviation, propagated through 07-03.

**Issue:** Under `@astrojs/vercel`, Astro splits the build into `dist/client/` (static — production-served at the site root) and `dist/server/` (Vercel Functions bundle). The integration writes catalogs relative to Astro's `dir` URL, which the adapter resolves to `dist/client/`. The PLAN's verify commands and the sanity script template still referenced `dist/edit-catalogs/`.

**Resolution applied here:**

- `scripts/check-edit-catalogs.mjs` declares `const CATALOG_DIR = 'dist/client/edit-catalogs'` at the top — explicit constant, no magic string in the script body.
- The CATALOG-06 banned regex is permissive: `^(dist/)?(client/)?edit-catalogs(/|$)` — matches any of `dist/edit-catalogs`, `dist/client/edit-catalogs`, `edit-catalogs`, `client/edit-catalogs`. Either deployment shape (plain static or Vercel-adapter-split) is protected against an accidental `.vercelignore` rule. The production HTTP path `/edit-catalogs/<route>.json` stays correct because Vercel serves `dist/client/` at the site root.
- All verify commands in this plan's acceptance criteria were re-pointed at `dist/client/edit-catalogs/`.

### [Rule 3 — Blocker] Upstream Deviation #2: `buildSha` source-of-truth pattern

**Resolution:** `buildSha` is resolved via `execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()` inside the `astro:build:done` hook handler, BEFORE the per-route loop, so all catalogs in one build share the same SHA. The `'unknown'` fallback exists only as a logged-warning escape hatch for non-git local sandboxes — Vercel deploys always have `.git` available via `git clone`, so the unknown path is unreachable in production. The sanity script rejects `'unknown'` as a hard failure to enforce this invariant machine-side.

The same-buildSha-across-all-catalogs invariant is also enforced by the sanity script (Check 5): if any catalog's `buildSha` diverges from the first catalog's, the script fails with a clear message naming both SHAs. This catches a regression where the execSync might mistakenly be moved inside the per-route loop.

### [Rule 3 — Blocker] Upstream Deviation #3: `npm install` required at executor start

**Issue:** The worktree branched from a base that has `linkedom@^0.18.12` and `gray-matter@^4.0.3` in `package.json` (merged by 07-01 and 07-04 + the walker code from 07-03) but no `node_modules/` for this branch's checkout.

**Resolution:** Ran `npm install` once at executor start (one-time, ~25s). No `package.json` or `package-lock.json` changes — the lockfile from main was honored byte-for-byte. `node_modules/` is gitignored, so no commit was needed.

## Files Modified

| File | Change | LOC |
| ---- | ------ | --- |
| `src/integrations/edit-catalog/index.mjs` | Add execSync import, add CATALOG-05 + CATALOG-06 decision comment block, compute `buildSha = execSync('git rev-parse --short HEAD').trim()` with try/catch + logger.warn fallback to 'unknown', replace `buildSha: null` with resolved `buildSha` in the catalog write | +23 / -1 |
| `scripts/check-edit-catalogs.mjs` (new) | Postbuild sanity script — 8 checks codifying Success Criteria #1, #2, #4; `dist/client/edit-catalogs/` path constant; CATALOG-06 banned-regex active-rule guard; same-buildSha invariant; per-entry signalCount rule | +205 |
| `package.json` | Add `"check:catalogs"` + `"postbuild"` scripts (both `node scripts/check-edit-catalogs.mjs`) | +2 |
| `.vercelignore` | Add 5-line CATALOG-06 comment block at top; 3 pre-existing active entries unchanged byte-for-byte | +5 |

No other files touched. `public/feedback-inject.js` unchanged (OPS-02 fence held byte-for-byte).

## Commits

| Hash | Task | Message |
| ---- | ---- | ------- |
| `9915f8f` | Task 1 | `feat(07-05): inject buildSha from git HEAD + comment-anchor CATALOG-06 ship-to-prod decision` |
| `efdaccf` | Task 2 | `feat(07-05): add check:catalogs sanity script + wire it as postbuild gate` |
| `30a1906` | Task 3 | `docs(07-05): comment-anchor CATALOG-06 ship-to-prod decision in .vercelignore` |

## Verification Results

| Check | Expected | Actual |
| ----- | -------- | ------ |
| `npm run build` exit code | 0 | 0 (postbuild runs automatically and prints OK) |
| `npm run check:catalogs` standalone | exit 0 | exit 0 with `OK: 17 catalogs, 1806 entries, buildSha=30a1906` |
| Catalogs emitted | ≥ 8 at `dist/client/edit-catalogs/` | 17 |
| Total entries across all catalogs | unchanged from 07-03 | 1806 |
| Every catalog's buildSha matches `/^[0-9a-f]{7,12}$/` | yes | yes (all 17 carry the same valid SHA) |
| Same buildSha across all catalogs in one build | yes | yes (final build all = `30a1906`) |
| Tampering test: set one catalog's buildSha to 'unknown' → exit 1 | yes | yes — `EXIT: 1` with documented FAIL message |
| `src/integrations/edit-catalog/index.mjs` contains "CATALOG-06 DECISION" | yes | yes (1 occurrence) |
| `src/integrations/edit-catalog/index.mjs` no longer contains `buildSha: null` | yes | yes (0 occurrences) |
| `scripts/check-edit-catalogs.mjs` header contains "postbuild also runs on Vercel deploys" | yes | yes (1 occurrence) |
| `package.json` contains `check:catalogs` and `postbuild` scripts | yes | yes (1 occurrence each) |
| `.vercelignore` contains "CATALOG-06" | yes | yes (1 occurrence) |
| `grep -v '^#' .vercelignore \| grep -c 'edit-catalogs'` | 0 | 0 |
| 3 pre-existing `.vercelignore` active entries unchanged | yes | yes (public/Moulin House Photos/, public/photo-source/, feedback-incoming/ all present and unmodified) |
| `grep -cE "[‘’“”]"` on every new/modified file | 0 | 0 across all 4 files |
| `git diff main -- public/feedback-inject.js \| wc -l` | 0 | 0 (OPS-02 fence intact) |
| Files diffed vs main | only the 4 in `files_modified` | only `src/integrations/edit-catalog/index.mjs`, `scripts/check-edit-catalogs.mjs`, `package.json`, `.vercelignore` |

## Auth Gates

None encountered.

## Known Stubs

None remaining in Phase 7. The walker (07-03) populated `entries[]` with real classification + locator-signal data; this plan replaced the last placeholder (`buildSha: null`) with a real value. Every field on every catalog is now meaningful.

## Threat Flags

None new. The buildSha is read from `git rev-parse --short HEAD` at build time (no user input, no network). The sanity script reads from `dist/client/edit-catalogs/` (build artifact) and `.vercelignore` (repo file); writes nothing. The postbuild hook runs in Vercel's deploy sandbox with the same permissions as the prebuild guard — established surface.

## Phase 7 Success Criteria — Final Status

| SC | Criterion | Status |
| -- | --------- | ------ |
| #1 | `npm run build` produces ≥ 8 catalogs at `dist/(client/)?edit-catalogs/` | green — 17 catalogs (sanity script enforces) |
| #2 | Every catalog has the 4 top-level keys + valid entries[] | green — sanity script Checks 2 + 3 + 6 + 7 + 8 enforce |
| #3 | Per-entry classification covers all 6 kind values | green — 07-03 confirmed, sanity script Check 6 enforces enum |
| #4 | Every catalog carries `buildSha` matching `/^[0-9a-f]{7,12}$/` | green — this plan; sanity script Check 4 enforces |
| #5 | CATALOG-06 ship-to-prod: catalogs are not in `.vercelignore` | green (local half) — sanity script Check 8 enforces |
| #5b | Live HEAD probe against `https://www.moulinareves.com/edit-catalogs/homes/le-moulin.json` returns 200 | **deferred to Phase 9** (named in Phase 9 SC #3) — requires a deployed PR |

## Continuation Notes

### For Phase 8 (matcher endpoint + overlay)

- Read catalogs from `dist/client/edit-catalogs/<route>.json` at build time (NOT `dist/edit-catalogs/`).
- Production HTTP path is `/edit-catalogs/<route>.json` at the site root — Vercel serves `dist/client/` from the root.
- Use `buildSha` to detect drift vs the deployed `<meta name="x-build-sha">` tag. If the catalog's `buildSha` differs from the meta tag's, the overlay was loaded from a stale CDN cache and the matcher should refuse to auto-merge.
- The sanity script is a hard build gate now — a Phase 8 PR that breaks any catalog will abort the deploy. If you need to make a structural change to the catalog schema, update the script's checks in the same commit.

### For Phase 9 (canary smoke)

- The canary should call `npm run check:catalogs` as part of its pre-deploy assertions (already exit-code-aware; just chain into the existing `scripts/canary.sh`).
- Phase 9 SC #3 (live HEAD probe against `/edit-catalogs/homes/le-moulin.json`) is the post-deploy half of CATALOG-06 — Vercel must serve the catalog at the public HTTP path.

### For future maintainers editing `.vercelignore`

- DO NOT add any line matching `dist/edit-catalogs`, `dist/client/edit-catalogs`, `edit-catalogs`, or `client/edit-catalogs`. The postbuild gate will refuse the deploy with a specific failure message naming your line. The comment block at the top of `.vercelignore` explains why.

## OPS-02 Fence Confirmation

- `git diff main -- public/feedback-inject.js | wc -l` → **0** across all 3 Task commits.
- No other v1.1 OPS-02-fenced files were touched.

The fence held byte-for-byte across the entire plan.

## Self-Check: PASSED

| Claim | Verification |
| ----- | ------------ |
| `src/integrations/edit-catalog/index.mjs` modified | FOUND in `git diff main..HEAD --name-only` |
| `scripts/check-edit-catalogs.mjs` exists | FOUND, 7110 bytes |
| `package.json` modified (check:catalogs + postbuild scripts) | FOUND in diff, both keys present |
| `.vercelignore` modified (CATALOG-06 comment block) | FOUND in diff, 1 occurrence of "CATALOG-06" |
| Commit `9915f8f` (Task 1) | FOUND in `git log main..HEAD` |
| Commit `efdaccf` (Task 2) | FOUND |
| Commit `30a1906` (Task 3) | FOUND |
| `npm run build` exits 0 | yes — verified after each task commit |
| `npm run check:catalogs` exits 0 | yes — final post-Task-3 run |
| 17 catalogs at `dist/client/edit-catalogs/`, all buildSha valid | yes — buildSha=30a1906 across all 17 |
| OPS-02 fence: `git diff main -- public/feedback-inject.js` | 0 lines |
| Tampering test (buildSha='unknown' → exit 1) | confirmed with documented FAIL message |
| Only 4 files diff vs main | confirmed via `git diff --name-only main..HEAD` |
