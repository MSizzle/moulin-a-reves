---
phase: 07-build-time-edit-catalog-generator
plan: 01
subsystem: catalog-locator-helper
tags: [tdd, catalog, ops-02-fence, locator-signals, parity-test]
status: complete
requirements: [CATALOG-03]
requirements-completed: [CATALOG-03]
dependency-graph:
  requires:
    - "public/feedback-inject.js:169-238 (read-only source of truth)"
    - "src/pages/api/feedback/validate.ts:54-61 (read-only source of truth)"
  provides:
    - "src/lib/locator-signals.mjs (Node-side closestAttr / i18nOf / imageRefOf / galleryOf / nearestHeading / domPathOf / visibleText / signalCount)"
    - "tests/edit-catalog/locator-parity.test.mjs (parity harness pinning the helper to the two source files)"
    - "npm run test:catalog (regression net)"
  affects:
    - "07-02 (writeCatalogs entry point will consume the helper)"
    - "07-03 (catalog walker will import all 8 helpers)"
tech-stack:
  added:
    - "linkedom@^0.18.12 (devDep; server-side DOM with getAttribute/closest/querySelectorAll surface)"
  patterns:
    - "node:test built-in runner (Node 24+) wired via npm run test:catalog"
    - "OPS-02-style fence: inline-duplicate code + normalized-string parity test pinning the duplicate to its canonical source"
key-files:
  created:
    - src/lib/locator-signals.mjs
    - tests/edit-catalog/locator-parity.test.mjs
  modified:
    - package.json (add linkedom devDep + test:catalog script)
    - package-lock.json (npm install side-effect)
decisions:
  - "Inline-duplicate signalCount() from validate.ts into the new helper (chose Path A from the planner's two options). Node 24 ESM cannot load .ts without an explicit loader; widening scope to add tsx/ts-node would touch v1.1 production code under the OPS-02 fence. Drift is mechanically prevented by Test 7 in the parity harness."
  - "Omit the getComputedStyle branch from Node-side imageRefOf. No layout in Node and Task 0 pre-flight confirmed zero addressable elements rely on stylesheet-only bg-image. Defensive inline-style bg-image regex parse added for any future hand-edit."
  - "Change nearestHeading signature from (el) to (el, doc) so the catalog walker (07-03) must pass el.ownerDocument explicitly. Browser version implicitly uses the document global which has no Node equivalent."
  - "Inline DOCUMENT_POSITION_PRECEDING/CONTAINS as bitmask constants (2, 8) in nearestHeading instead of importing from a DOM lib; matches the bit values defined by the DOM spec and used in feedback-inject.js:235."
metrics:
  duration: ~14 minutes
  completed: 2026-05-26T15:14:17Z
  tasks: "2 of 2 (Task 0 pre-flight investigation + Task 1 RED + Task 2 GREEN — TDD plan-level cycle)"
  files-changed: 4
  insertions: 511
  deletions: 1
---

# Phase 07 Plan 01: Locator-signal helper + parity test Summary

CATALOG-03 spine is now in place: a Node-side ESM helper that the catalog walker (07-03) can call against a linkedom-parsed DOM and have its output round-trip byte-for-byte through the v1.1 batch validator. Parity with the browser locator code and with validate.ts's signalCount is mechanically pinned by a node:test harness, so any future drift in either source file fails the test on the next `npm run test:catalog`.

## What shipped

- **`src/lib/locator-signals.mjs`** (183 lines) — pure-ESM Node port of `public/feedback-inject.js:169-238` exporting `closestAttr`, `i18nOf`, `imageRefOf`, `galleryOf`, `nearestHeading`, `domPathOf`, `visibleText`, and `signalCount`. `MIN_VAGUE_LEN = 25` exported as a bonus constant for any future caller that needs the threshold. Top-of-file header declares the OPS-02 fence and points to both source files.
- **`tests/edit-catalog/locator-parity.test.mjs`** (252 lines) — node:test harness with 8 test blocks. Tests 1-5 + 8 exercise behavior against fixture DOMs (linkedom-parsed). Test 6 reads `public/feedback-inject.js` and asserts canonical substring markers are present (closestAttr loop, i18nOf priority order, domPathOf nth-of-type, headingNear querySelectorAll). Test 7 normalizes the `signalCount()` bodies in both `validate.ts` and `locator-signals.mjs` (strip line-comments, per-line whitespace, collapse spaces) and asserts byte equality.
- **`linkedom@^0.18.12`** added to `devDependencies`.
- **`npm run test:catalog`** wired to `node --test tests/edit-catalog/*.test.mjs` as the regression net.

## Verification

| Check | Result |
|-------|--------|
| `npm run test:catalog` exits 0 | yes — 8/8 tests pass |
| 8 named exports from helper | yes — `closestAttr, domPathOf, galleryOf, i18nOf, imageRefOf, nearestHeading, signalCount, visibleText` (+ `MIN_VAGUE_LEN`) |
| Top-of-file contains "OPS-02 fence" and both source-file refs | yes |
| signalCount block carries inline-duplication comment | yes |
| No `.ts` import in helper | yes (Node ESM cannot load .ts; pinned by Test 7) |
| `git diff main -- public/feedback-inject.js` | 0 lines (OPS-02 fence held) |
| `linkedom` in `devDependencies` | yes (`^0.18.12`) |
| 0 curly quotes in tests/edit-catalog or helper | yes |
| TDD RED gate (test commit before feat commit) | yes — `afde2d1` (test) → `5649571` (feat) |

## Commits

| Hash | Type | Message |
|------|------|---------|
| `afde2d1` | test | test(07-01): add locator-parity test scaffold + linkedom devDep (RED) |
| `5649571` | feat | feat(07-01): port locator signals + signalCount to Node-side ESM helper (GREEN) |

## Deviations from Plan

None — plan executed exactly as written. Both tasks landed on first attempt without any auto-fixes (Rules 1-3 not invoked). No checkpoint gates encountered. No auth gates encountered.

Notes on choices that were already documented in the plan (not deviations, just executed picks):

- **Path A for signalCount** (inline-duplicate + parity test) was the recommended option in the plan and was the path taken. Path B (extract `signalCount` to a separate `.mjs` and have `validate.ts` import it) would require widening scope to the v1.1 OPS-02-fenced surface, which the plan explicitly rejected.
- **node:test glob path** (`tests/edit-catalog/*.test.mjs`) instead of bare `tests/edit-catalog/`. Node 26's `--test` flag with a bare directory argument tried to resolve the directory as a CJS module and threw `MODULE_NOT_FOUND`. The glob pattern is the documented way to point Node's test runner at all test files in a directory; behavior is identical to what the plan intended.

## Pre-flight (Task 0) result

Grep result documented inline so future maintainers do not re-derive:

```
Step 1: grep -rn "background-image\|backgroundImage" src/layouts src/components src/pages
  -> 1 match: src/components/AvailabilityCalendar.astro:164
     ("data:image/svg+xml;utf8,...<svg>...</svg>" — a chevron on a <select>)
     This is NOT a /images/*.webp ref; normImage() filters it out at the source.

Step 2: grep -rn "background-image\|backgroundImage" src/styles
  -> 0 matches
```

Conclusion: the codebase has ZERO addressable elements whose primary image source is a CSS or inline-style background-image rule pointing at `/images/*.webp`. The Node-side `imageRefOf` safely omits the layout/computed-style branch. As defensive coverage for any future hand-edit, the helper additionally parses `el.getAttribute('style')` for inline `background-image: url(...)` (verified by Test 8 in the parity harness).

## Downstream contract for 07-02 and 07-03

- Catalog walker (07-03) imports all 8 functions from `src/lib/locator-signals.mjs` plus `MIN_VAGUE_LEN`.
- For `nearestHeading(el, doc)`, the walker MUST pass `el.ownerDocument` (the linkedom document for the current route's HTML).
- For each catalog entry, the walker computes the same locator tuple shape as `captureLocator()` in `feedback-inject.js:289`: `{ i18nKey, i18nAttr, imageRef, galleryAttrRaw, galleryIndex, domPath, nearbyText, nearestHeading }`. `signalCount()` against that tuple should return >= 2 (the §4 autonomy-gate threshold) for catalog IDs that the matcher endpoint (Phase 8) wants to auto-merge.
- Stylesheet-only background-image entries (currently zero) must be emitted with `requiresManualSelection: true` in 07-03; the helper cannot anchor them without layout.

## Known Stubs

None. The helper module is fully wired and exercised by the parity test; no placeholder data or "TODO" sites.

## Self-Check: PASSED

Verified existence + reachability of every claim in this Summary:

| Claim | Verification |
|-------|--------------|
| `src/lib/locator-signals.mjs` exists | `[ -f src/lib/locator-signals.mjs ]` — yes |
| `tests/edit-catalog/locator-parity.test.mjs` exists | `[ -f tests/edit-catalog/locator-parity.test.mjs ]` — yes |
| `package.json` has `test:catalog` script | grep present — yes |
| `package.json` has `linkedom` devDep | `^0.18.12` — yes |
| Commit `afde2d1` exists | `git log --oneline` shows it — yes |
| Commit `5649571` exists | `git log --oneline` shows it — yes |
| `npm run test:catalog` exits 0 | 8/8 pass — yes |
| `git diff main -- public/feedback-inject.js \| wc -l` returns 0 | yes |
