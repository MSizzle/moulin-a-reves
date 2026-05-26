---
phase: 07-build-time-edit-catalog-generator
plan: 04
subsystem: edit-catalog
tags:
  - edit-catalog
  - content-collection
  - catalog-04
  - tdd
requirements-completed:
  - CATALOG-04
dependency_graph:
  requires: []
  provides:
    - buildContentIndex
    - normalizeText
  affects:
    - 07-03 (catalog walker consumes the index to flip requiresManualSelection)
tech-stack:
  added: []
  patterns:
    - "Synchronous recursive fs walk for ~11-file content collection"
    - "gray-matter default-import (callable parser) — matter(raw).data"
    - "Depth-first frontmatter traversal with bracketed fieldPath encoding"
    - "Map<normalizedText, Array<entry>> for cross-file collision tolerance"
key-files:
  created:
    - src/integrations/edit-catalog/content-index.mjs
    - tests/edit-catalog/content-index.test.mjs
  modified: []
decisions:
  - "Map value is Array<{file, fieldPath}> not single entry — same string can appear in multiple .md files (e.g. title \"Le Moulin\" lives in both homes/le-moulin.md and pages/le-moulin.md). The walker (07-03) decides what to do with collisions; the matcher endpoint in Phase 8 sees downstream ambiguity. Out of scope here."
  - "fieldPath uses JS-style array brackets (amenities[0], gallery[3].alt) rather than YAML pointer syntax (/amenities/0/) for parity with how the walker will read it back during catalog emission."
  - "MIN_INDEX_LEN = 8 — chosen to exclude short tokens like slugs (le-moulin is 9 chars and IS indexed; Le is 2 and is NOT). Catches one-word labels (Welcome, Confirm) while keeping enough signal for the matcher."
  - "Missing src/content directory returns an empty Map rather than throwing — supports fresh-checkout invocation by the walker before content scaffolding lands."
metrics:
  duration_min: 7
  completed_date: 2026-05-26
  commits: 2
  files_created: 2
  tests_added: 7
---

# Phase 07 Plan 04: Content-Collection Index for Hardcoded-Text Source Detection Summary

A Node-side `buildContentIndex()` helper that scans `src/content/**/*.md` frontmatter via `gray-matter`, returning a `Map<normalizedText, Array<{ file, fieldPath }>>` so the catalog walker (07-03) can classify hardcoded DOM text as either content-anchored (emit stable locator) or inline-only (set `requiresManualSelection: true`). 7 node:test cases pin the contract.

## Objective Achieved

CATALOG-04 is satisfied at the data-access layer. The walker (07-03) can now query the index per text node:

```js
import { buildContentIndex, normalizeText } from './content-index.mjs';
const idx = buildContentIndex();
const entries = idx.get(normalizeText(domTextNodeContent));
// entries === undefined  → requiresManualSelection: true
// entries[0].file/fieldPath → stable locator for the catalog
```

Real-repo index size: **102 entries** across 11 content files (homes/, pages/, services/). Well above the >= 20 acceptance threshold.

## Tasks Completed

### Task 1: RED — failing test scaffold (`e4c77e3`)

Created `tests/edit-catalog/content-index.test.mjs` with 7 node:test blocks:

1. `buildContentIndex finds homes/le-moulin.md tagline` — asserts "The heart of the compound" → `{file: 'src/content/homes/le-moulin.md', fieldPath: 'tagline'}`
2. `buildContentIndex finds pages/le-moulin.md summary` — asserts the 137-char summary maps to `{fieldPath: 'summary'}`
3. `buildContentIndex returns undefined for unknown strings` — guarantees no false positives
4. `normalizeText collapses runs of whitespace and trims` — whitespace contract
5. `buildContentIndex excludes image paths and URLs` — sweeps all Map keys against `/^\/images\//` and `/^https?:\/\//`
6. `buildContentIndex excludes strings shorter than 8 chars` — sweeps all Map keys against `length >= 8`
7. `buildContentIndex indexes amenities[] array items with bracketed fieldPath` — regex `^amenities\[\d+\]$`

Tests are **self-checking**: each test reads the source-of-truth frontmatter value via `fs.readFileSync` + `matter()` directly, then asserts that `buildContentIndex()` returns the same value. Future edits to `le-moulin.md` propagate cleanly without false test failures (and a contract drift would fail loudly).

**RED proof:** Before Task 2 landed, `node --test tests/edit-catalog/content-index.test.mjs` exited with code **1** and printed `ERR_MODULE_NOT_FOUND` referencing `src/integrations/edit-catalog/content-index.mjs` (5 mentions of `content-index` in the failure output).

### Task 2: GREEN — implement the index (`5c695c0`)

Created `src/integrations/edit-catalog/content-index.mjs` as a 143-line ESM module with two named exports:

- `normalizeText(s)` — `s.replace(/\s+/g, ' ').trim()` with non-string guard returning `''`
- `buildContentIndex(rootDir = 'src/content')` — synchronous fs walk + depth-first frontmatter traversal

Implementation details:

- `import matter from 'gray-matter'` (default-import callable form, per the plan's explicit acceptance criterion — the package's `module.exports` IS the parser function)
- `walkMarkdownFiles(dir)` — `fs.readdirSync(dir, { withFileTypes: true })` recursion; missing directory returns `[]` instead of throwing
- `traverse(node, fieldPath, visit)` — depth-first with array-index bracket notation
- Leaf filter chain: must be `typeof === 'string'`, normalized `length >= 8`, not matching `^/images/` or `^https?://` (checked both normalized and raw-trimmed)
- Repo-relative `file` path normalized to forward slashes for OS-portability
- Map value is `Array<entry>` — first hit creates `[entry]`, subsequent hits push (no de-dup; the walker decides on the first-or-pick policy)

**GREEN proof:** All 7 tests pass; `node --test` exits 0; `idx.size === 102`.

## Verification

| Check | Expected | Actual |
|-------|----------|--------|
| `node --test tests/edit-catalog/content-index.test.mjs` exit code | 0 | 0 |
| Passing tests | 7 | 7 |
| Failing tests | 0 | 0 |
| Index size on real repo content | >= 20 | 102 |
| Named exports | `buildContentIndex`, `normalizeText` | `buildContentIndex`, `normalizeText` |
| Default-import form for gray-matter | `import matter from 'gray-matter'` | `import matter from 'gray-matter'` |
| Curly quotes in source | 0 | 0 |
| Curly quotes in test | 0 | 0 |
| `git diff <phase-base> -- public/feedback-inject.js` lines | 0 | 0 |

OPS-02 fence holds byte-for-byte. No untracked files; no spurious deletions.

## Deviations from Plan

**None — plan executed exactly as written.**

The plan's `<read_first>` block for Task 1 referenced `tests/edit-catalog/locator-parity.test.mjs` (from sibling plan 07-01) and the `test:catalog` npm script that 07-01 adds. Because this executor runs in a parallel worktree from the phase base (07-01 has not landed here), I verified the same RED/GREEN contract by invoking `node --test tests/edit-catalog/content-index.test.mjs` directly — which is exactly what `npm run test:catalog` will resolve to once 07-01 merges (07-01's script is `node --test 'tests/edit-catalog/*.test.mjs'`). The contract this plan ships is identical regardless of orchestration order. No deviation.

## Auth Gates

None.

## Known Stubs

None. The contract is fully wired: `buildContentIndex()` returns the real index against the real repo content; no placeholders, no mock-data branches.

## Threat Flags

None. This plan adds two new files under `src/integrations/edit-catalog/` and `tests/edit-catalog/`. Neither introduces network endpoints, auth paths, file-write surface at trust boundaries, nor schema changes. The `fs.readdirSync` traversal is rooted at a hard-coded constant (`'src/content'`) under the repo, not at user-supplied input.

## Continuation Notes for 07-03 (catalog walker)

The walker imports both exports and uses the index per text node:

```js
import { buildContentIndex, normalizeText } from '../integrations/edit-catalog/content-index.mjs';

const contentIndex = buildContentIndex();

function classifyHardcodedText(domText) {
  const entries = contentIndex.get(normalizeText(domText));
  if (!entries) {
    return { kind: 'hardcoded-text', requiresManualSelection: true };
  }
  const first = entries[0];
  return {
    kind: 'hardcoded-text',
    requiresManualSelection: false,
    contentSource: { file: first.file, field: first.fieldPath },
  };
}
```

Index entries collide on `title: "Le Moulin"` (homes/le-moulin.md + pages/le-moulin.md) and on amenity strings shared across the three home files (`Fully equipped kitchen`, `Espresso machine`). The walker's first-entry-wins policy is acceptable for v1.3; the matcher endpoint in Phase 8 will see the downstream ambiguity if/when it matters and can re-rank via context.

## Self-Check: PASSED

- File `tests/edit-catalog/content-index.test.mjs` exists.
- File `src/integrations/edit-catalog/content-index.mjs` exists.
- Commit `e4c77e3` (Task 1 RED) exists in git log.
- Commit `5c695c0` (Task 2 GREEN) exists in git log.
- `node --test` passes 7 / fails 0.
- OPS-02 fence diff = 0 lines.
