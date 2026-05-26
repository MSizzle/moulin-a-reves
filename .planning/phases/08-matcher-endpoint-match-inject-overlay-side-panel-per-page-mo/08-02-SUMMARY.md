---
phase: 08-matcher-endpoint-match-inject-overlay-side-panel-per-page-mo
plan: 02
subsystem: feedback-matcher
tags: [api, feedback, anthropic, claude-haiku, matcher, ops-02-passive]
status: complete
requirements-completed: [MATCH-01, MATCH-02, MATCH-03, MATCH-04, MATCH-05, MATCH-06, MATCH-07, OPS-03]
dependency-graph:
  requires:
    - "Phase 7 catalog emission at /edit-catalogs/<slug>.json (CATALOG-06 ship-to-prod) — consumed via same-origin HTTP fetch at request time"
    - "src/lib/auth.ts checkAuth() (HMAC cookie session, existing)"
  provides:
    - "POST /api/feedback/match — auth-gated matcher endpoint returning { ok, matchSetId, buildSha, matches[] }"
    - "@anthropic-ai/sdk@0.98.0 in dependencies (first project use)"
    - "Response-shape contract consumed by Plans 03 (inject), 04 (panel), 05 (approve), 06 (smoke)"
  affects:
    - "package.json + package-lock.json (added one runtime dep, no other packages)"
tech-stack:
  added:
    - "@anthropic-ai/sdk@0.98.0 (runtime, dependencies)"
  patterns:
    - "Forced tool-use (tool_choice: { type: 'tool', name: 'match_edits' }) as the FIRST line of defense against prompt-injection in untrusted editList"
    - "Server-side ID validation against Set<catalogId> as the SECOND line of defense (D-14)"
    - "Same-origin catalog fetch from request.url (NOT process.cwd / fs.readFile) — BLOCKER-2 fix for Vercel function bundle / static-asset tree separation"
    - "Degraded-mode contract: missing ANTHROPIC_API_KEY → structured 500 { error: 'matcher_unavailable' } (mirrors v1.2 VERCEL_TOKEN graceful degrade)"
    - "25s AbortController timeout + 1 retry on 5xx/429 with 2s linear backoff (D-13)"
key-files:
  created:
    - "src/pages/api/feedback/match.ts (410 lines, single POST export, MATCH-01..07 + OPS-03)"
    - ".planning/phases/08-matcher-endpoint-match-inject-overlay-side-panel-per-page-mo/08-02-OPS03-EVIDENCE.md (grep-gate evidence for MATCH-06 / OPS-03)"
  modified:
    - "package.json (added @anthropic-ai/sdk@^0.98.0 to dependencies)"
    - "package-lock.json (resolved version 0.98.0 + integrity hash)"
decisions:
  - "Followed plan's BLOCKER-2 fix exactly: catalog loaded via new URL('/edit-catalogs/' + slug + '.json', request.url) → fetch(). Zero filesystem reads; zero process.cwd references; zero node:fs imports."
  - "Deferred npx astro check verification gate. The project has no @astrojs/check dev dependency installed (verified via git log -S '@astrojs/check' — never installed). Adding it would have modified package.json beyond the plan's files_modified scope. Type correctness validated by hand-read + behavioral unit tests + successful npm run build (Astro 6 with strict TS).";
  - "Used per-task atomic commits (chore for SDK install, feat for endpoint, docs for evidence) following the project's commit-message convention (CLAUDE.md PR Workflow Conventions section)."
metrics:
  duration: "7 min"
  completed: "2026-05-26T18:30:16Z"
  tasks: 3
  files_created: 2
  files_modified: 2
  commits: 3
---

# Phase 8 Plan 2: Matcher Endpoint Summary

`POST /api/feedback/match` — auth-gated Claude-Haiku-4-5-backed endpoint that maps freeform edit-list lines to specific catalog element IDs on a given page, with forced tool-use + server-side ID validation + degraded-mode fallback.

## What shipped

| Commit | Type | Description |
|--------|------|-------------|
| `29a0e76` | chore | Added `@anthropic-ai/sdk@^0.98.0` to `dependencies` (NOT devDependencies — runtime use). Package-legitimacy gate verified (official Anthropic publisher, repo `anthropics/anthropic-sdk-typescript`, established weekly downloads). |
| `e51ee61` | feat | Created `src/pages/api/feedback/match.ts` (410 lines, single POST export). Auth-gates via `checkAuth()`; same-origin catalog fetch (BLOCKER-2 fix); MATCH-07 caps; MATCH-05 tokenization; forced tool-use; server-side ID validation (D-14); degraded-mode fallback. |
| `d880ea3` | docs | Recorded OPS-03 evidence: Gate 1 (public/) and Gate 2 (dist/) both 0 references; legitimate server-side bundle references documented as expected. |

## Endpoint behavior matrix

| Condition | Status | Response |
|-----------|--------|----------|
| No `maison_session` cookie / invalid auth | 401 | `{ ok: false, error: 'Unauthorized' }` |
| Malformed JSON body | 400 | `{ ok: false, error: 'Invalid request body' }` |
| Invalid `route` (not string, doesn't start with `/`, contains `..` or `\0`) | 422 | `{ ok: false, error: 'Invalid route' }` |
| `editList` not a string | 422 | `{ ok: false, error: 'Invalid editList' }` |
| `editList.length > 10000` | 422 | `{ ok: false, error: '...', cap: 'edit-list-chars', limit: 10000, actual }` |
| Tokenized `editList` is empty after MATCH-05 parse | 422 | `{ ok: false, error: 'empty_edit_list', message: '...' }` |
| No `/edit-catalogs/<slug>.json` at same-origin path | 404 | `{ ok: false, error: 'no_catalog', route }` |
| Catalog has > 150 entries | 422 | `{ ok: false, error: '...', cap: 'catalog-elements', limit: 150, actual }` |
| `ANTHROPIC_API_KEY` unset (degraded mode) | 500 | `{ ok: false, error: 'matcher_unavailable' }` |
| Anthropic call fails after 1 retry | 500 | `{ ok: false, error: 'matcher_unavailable' }` |
| Any unhandled throw | 500 | `{ ok: false, error: err.message \|\| 'Server error' }` |
| Success | 200 | `{ ok: true, matchSetId: 'ms_<uuid>', buildSha, matches: [{ line, primaryId, primaryConfidence, alternates, reason }] }` |

These canonical error codes are the contract Plan 05's side panel error-mapping consumes.

## BLOCKER-2 fix (catalog loading)

The endpoint loads catalogs via **same-origin HTTP fetch**, never via filesystem. Construction:

```typescript
const url = new URL('/edit-catalogs/' + routeToSlug(route) + '.json', request.url);
const res = await fetch(url);
```

- `request.url` is set by the Vercel runtime from the incoming request — its origin is the auth-gated function host, so production POSTs hit production catalogs and preview POSTs hit preview catalogs.
- `routeToSlug` strips leading/trailing slashes, defaults to `'index'` for `/`. Identical algorithm to Phase 7's `routeToCatalogPath` (without the `.json` suffix).
- Path-traversal protection: `route` is pre-validated to reject `..` and `\0`. The URL parser additionally normalizes any remaining `../` against the `/edit-catalogs/` base path — it cannot escape the deployment origin.

Why not filesystem: on Vercel, the function bundle's working directory resolves to the function bundle root, NOT the deployment static-asset tree. `fs.readFile` against `process.cwd()` would always 404. The static assets (catalogs from Phase 7) are served from the same origin as the function — same-origin fetch is the canonical pattern.

**Verification:** `grep -c 'process.cwd' src/pages/api/feedback/match.ts` returns 0; `grep -c "from 'node:fs"` returns 0; `grep -c 'new URL.*edit-catalogs'` returns 1.

## OPS-03 / MATCH-06 leak gate

| Gate | Result | Reference |
|------|--------|-----------|
| Gate 1: `grep -r ANTHROPIC_API_KEY public/` | 0 matches | [08-02-OPS03-EVIDENCE.md](./08-02-OPS03-EVIDENCE.md) |
| Gate 2: `grep -r ANTHROPIC_API_KEY dist/` after `npm run build` | 0 matches | same |
| Gate 2 (drill-down): `dist/client/*` only | 0 matches | same |

`ANTHROPIC_API_KEY` is read ONCE in the source tree (`src/pages/api/feedback/match.ts:42`), used twice more in the same file (line 198 degraded-mode guard, line 201 SDK client init), and zero times anywhere else. Astro's Vite inlines `import.meta.env.X` at build time — at production deploy on Vercel with the env var set, the literal key value is inlined into the SERVER-SIDE function bundle ONLY (`.vercel/output/_functions/chunks/match_*.mjs`). It never reaches `dist/client/` or any browser-served artifact.

## OPS-02 fence (passive)

`git diff` against the v1.3 baseline returns **0 lines** for all OPS-02 fenced files:

- `public/editor-inject.js`
- `public/editor/` (directory)
- `public/guardrails.js`
- `src/pages/api/site/` (directory)
- `middleware.ts`
- `public/feedback-inject.js`
- `src/pages/api/feedback/submit.ts`
- `src/pages/api/feedback/validate.ts`

This plan maintains the OPS-02 fence passively (no edits to fenced files).

## Anthropic call configuration (D-10..D-14)

```typescript
{
  model: 'claude-haiku-4-5',
  max_tokens: Math.min(8192, 64 + 96 * lineCount),
  temperature: 0,
  tools: [{ name: 'match_edits', input_schema: { /* matches array shape */ } }],
  tool_choice: { type: 'tool', name: 'match_edits' },  // FORCED — D-11
  messages: [{ role: 'user', content: <prompt> }],
}
```

- `AbortController` with 25s timeout (D-13; leaves 5s headroom under Vercel function default 30s).
- One retry on `err.status >= 500 || err.status === 429` with 2s linear backoff (D-13).
- Two-layer defense against prompt injection: (1) forced tool-use guarantees structured output, (2) every returned `primaryId` and `alternates[]` ID validated against `Set<catalogId>` built from the loaded catalog — unknown IDs are silently stripped, unknown `primaryId` becomes `null` (D-14 / MATCH-04).

## MATCH-05 tokenization

Implemented via `parseEditList(raw: string): string[]`. Behavioral unit tests (run via standalone Node) — all 9 cases passed:

| Input | Expected lines | Result |
|-------|---------------|--------|
| `- Make hero bolder\n- Shorten quote` | 2 | PASS |
| `1. Make hero bolder\n2. Shorten quote` | 2 | PASS |
| `* Make hero bolder\n* Shorten quote` | 2 | PASS |
| `Make hero bolder.\n\nShorten quote.` (paragraphs) | 2 | PASS |
| `# Hero section\n- Make hero bolder` (header + bullet) | 1 | PASS |
| `''` (empty) | 0 | PASS |
| `'  \n\n  '` (whitespace-only) | 0 | PASS |
| `## Header\n## Another\nReal line` | 1 | PASS |
| `- Foo\nBar` (mixed bullet + plain) | 2 | PASS |

## Verification of D-14 ID validation

Standalone behavioral tests — all 5 cases passed:

1. Known primaryId + known alternates → all preserved.
2. Unknown primaryId → set to `null`; known alternates filtered through.
3. Mixed known/unknown alternates → unknowns silently stripped.
4. Out-of-range / non-finite confidence → clamped to [0, 1] / 0.
5. > 2 alternates → capped at 2.

## Deferred items

- **`npx astro check`**: Project lacks `@astrojs/check` devDependency (never installed historically — `git log -S '@astrojs/check'` returns no commits). Installing it would have modified `package.json` beyond the plan's `files_modified` scope. Type correctness was validated by hand-read of the 410-line file + behavioral tests + successful `npm run build` (Astro 6 with strict TS extends `astro/tsconfigs/strict`). Recommendation: pick up `@astrojs/check` install in a separate quick task before Phase 9 canary, OR rely on Vercel preview builds as the integration typecheck.

## Deferred to operator (carry-forward to Phase 9)

- **Set `ANTHROPIC_API_KEY` in Vercel project env** (Production scope only). Until set, every production `POST /api/feedback/match` returns `{ error: 'matcher_unavailable' }` — graceful degrade, never crashes.

## Self-Check

**1. Created files exist:**

- `src/pages/api/feedback/match.ts` — FOUND
- `.planning/phases/08-matcher-endpoint-match-inject-overlay-side-panel-per-page-mo/08-02-OPS03-EVIDENCE.md` — FOUND
- `.planning/phases/08-matcher-endpoint-match-inject-overlay-side-panel-per-page-mo/08-02-SUMMARY.md` — FOUND (this file)

**2. Commits exist:**

- `29a0e76` chore(08-02): add @anthropic-ai/sdk — FOUND
- `e51ee61` feat(08-02): add /api/feedback/match endpoint — FOUND
- `d880ea3` docs(08-02): record OPS-03 / MATCH-06 leak-gate evidence — FOUND

**3. Verification gates:**

- OPS-02 fence diff: 0 lines (PASS)
- MATCH-01: prerender first line (PASS)
- MATCH-02: same-origin fetch present, no fs (PASS)
- MATCH-03 / D-10 / D-11: model + tool_choice configured (PASS)
- MATCH-04 / D-14: validateMatches with catalog Set<id> (PASS)
- MATCH-05: tokenization tested 9/9 (PASS)
- MATCH-06 / OPS-03: 0 references in public/ and dist/client/ (PASS)
- MATCH-07: MAX_EDIT_LIST_CHARS=10000, MAX_CATALOG_ENTRIES=150 declared (PASS)
- SDK importable at runtime (PASS)

## Self-Check: PASSED
