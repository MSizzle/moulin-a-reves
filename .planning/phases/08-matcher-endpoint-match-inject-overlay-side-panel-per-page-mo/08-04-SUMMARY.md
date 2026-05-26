---
phase: 08-matcher-endpoint-match-inject-overlay-side-panel-per-page-mo
plan: 04
subsystem: feedback
tags: [feedback, per-page-review, mode-tabs, matcher, ui-scaffolding]
requirements: [MODE-01, MODE-02, MODE-03, MODE-04]
dependencies:
  requires:
    - 08-01 (MATCH_INJECT_VER export in src/lib/feedback-version.ts)
    - 08-02 (POST /api/feedback/match endpoint)
    - 08-03 (BaseLayout sibling loader + BUILD_SHA meta + public/feedback-match-inject.js)
  provides:
    - Per-page review mode UI scaffolding (mode tabs + input zone + matcher fetch + iframe builder)
    - mar_feedback_match_set_v1 sessionStorage writer
    - mar:match-set-updated parent-internal CustomEvent (consumed by Plan 05)
  affects:
    - src/pages/feedback.astro (one file, additive only)
tech-stack:
  added: []
  patterns:
    - "Astro <script is:inline define:vars={{...}}> IIFE extension"
    - "ARIA tabs pattern (role=tablist + role=tab + aria-selected + aria-controls)"
    - "history.replaceState() hash router (no scroll, no push)"
    - "HEAD-probe gating (fetch with method:HEAD before submit)"
    - "sessionStorage stash + iframe src rebuild handoff"
key-files:
  created: []
  modified:
    - src/pages/feedback.astro
decisions:
  - "MVER passed through define:vars (not constructed via inline string concat) so the build picks up version bumps without re-checking the import path"
  - "routeToCatalogUrl() lives inline in the IIFE rather than imported — keeps it byte-equivalent to Plan 02's loadCatalog() and Plan 03's inject helper, all three derive the same slug from the route"
  - "matchSiteFrame.src is set once per Match-edits click (not on tab activation) — keeps the per-page iframe empty until the operator runs a match, so reloading the tab doesn't trigger a phantom inject load"
  - "Cmd/Ctrl+Enter submit shortcut added as power-user ergonomic (matches UI-SPEC §2 keyboard contract)"
  - "Working scrim innerHTML is restored to the v1.1 default 'Sending your feedback…' on done() — the scrim is shared between v1.1 submit and v1.3 match flows, and the v1.1 listener already calls working.classList.add('show') without re-writing innerHTML"
metrics:
  duration_min: 4
  tasks_completed: 3
  files_modified: 1
  net_lines_added: 218
completed: 2026-05-26T18:51:04Z
started: 2026-05-26T18:46:27Z
---

# Phase 08 Plan 04: Mode tabs + per-page input zone + matcher fetch wiring — Summary

One-liner: extends `src/pages/feedback.astro` with a segmented mode-tab strip, a per-page input zone (picker + textarea + Match-edits CTA), a HEAD-probe-gated catalog availability check, and a matcher-endpoint click handler that stashes the response in sessionStorage and points the per-page iframe at `?feedback=1&v=&matchSet=&matchVer=` — all while leaving the v1.1 mar-feedback-submit listener byte-for-byte unchanged.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add HTML structure: mode tabs + paned iframes + per-page input zone | `0bec9e8` | `src/pages/feedback.astro` |
| 2 | Add CSS for `.mode-tabs` + `.mode-pane` + `.match-input` BEM blocks | `deeec0d` | `src/pages/feedback.astro` |
| 3 | Extend IIFE with hash router + HEAD probe + matcher fetch + iframe src builder | `6ddcbc2` | `src/pages/feedback.astro` |

## Line-Number Map (post-plan)

The file grew from 399 lines (pre-plan) to 612 lines (post-plan).

### HTML structural insertions (Task 1)

| Insertion | Lines | Notes |
|-----------|-------|-------|
| `.mode-tabs` strip (segmented control) | 168-171 | Between `.bar` (line 130-167 region) and the first mode pane |
| `#mode-pane-per-element` wrapper around `#site` iframe | 172-176 | Wraps the existing `.frame-wrap` + `#site` iframe |
| `#mode-pane-per-page` (input zone + `#matchSite` iframe) | 177-198 | Sibling of `#mode-pane-per-element`; `hidden` attr at start |
| `.rail` (existing, untouched) | 200-203 | Still sits below both panes |

### CSS additions (Task 2)

| Block | Lines | Notes |
|-------|-------|-------|
| `/* ---- mode tabs ---- */` | 98-103 | Tab strip + tab + hover + active + focus-visible |
| `/* ---- mode panes ---- */` | 104-106 | `.mode-pane` flex + `[hidden]` toggle |
| `/* ---- match input zone ---- */` | 107-123 | Header / label / picker / hint / textarea / footer / submit / char-count |
| `@media (prefers-reduced-motion: reduce)` | 123-125 | Disables tab transitions |

All new CSS sits inside the existing `<style>` block (lines 39-126 post-plan). `:root` (line 41) is unchanged — no new design tokens introduced. `src/styles/global.css` was not modified.

### JS additions (Task 3, inside the existing IIFE)

| Block | Lines | Purpose |
|-------|-------|---------|
| Section comment header `// ---- Per-page review mode (v1.3 Phase 8) ----` | 449 | Delimiter |
| Block A — element refs + constants | 450-461 | `modeTabClick/Match`, `modePane*`, `matchPicker`, `matchTextarea`, `matchSubmitBtn`, `matchCharCount`, `matchSiteFrame`, `MATCH_SET_KEY`, `MAX_EDIT_LIST_CHARS` |
| Block B — `activateMode()` + `readModeFromHash()` + tab event handlers + arrow-key navigation + initial activation | 463-494 | Hash router (D-07, D-08) with `history.replaceState` |
| Block C — `refreshSubmitBtn()` + `routeToCatalogUrl()` + `probeCatalog()` + textarea/picker wire-up + Cmd/Ctrl+Enter shortcut | 496-535 | HEAD-probe gating (D-21) + char counter |
| Block D — Match-edits click handler (matcher fetch + matchSet stash + iframe src builder + CustomEvent dispatch) | 537-605 | MODE-02 core |

IIFE closes at line 607 (`})();`); script tag closes at line 608 (`</script>`).

### Frontmatter + script-tag edits (Task 3)

- Line 5: import extended to `import { FEEDBACK_INJECT_VER as VER, MATCH_INJECT_VER as MVER } from '../lib/feedback-version';`
- Line 211: `<script is:inline define:vars={{ VER, MVER, PAGES }}>` — passes the two version constants and the `PAGES` array into the inline JS scope.

## v1.1 Listener Integrity (OPS-02 / MODE-04 contract)

The original v1.1 `window.addEventListener('message', ...)` listener (pre-plan lines 318-392) is **byte-for-byte unchanged**. Verified by:

1. `grep -c "mar-feedback-submit" src/pages/feedback.astro` → `1` (single occurrence, matches the listener short-circuit guard).
2. `git diff main src/pages/feedback.astro | grep "^-" | grep -E "mar-feedback-submit|msg.type|persistSubmission|pollOne|isTerminal|loadRecent|saveRecent|renderRail"` → `0` matches (no removals to listener function bodies; all v1.1 helpers preserved).
3. `git log --oneline main..HEAD -- src/pages/feedback.astro` shows three additive commits and no rewrites.

The new Block D click handler short-circuits BEFORE the v1.1 listener runs because it's bound to a button click, not a window message. The two flows share `working` (scrim), `showToast()`, and `hideToast()` — both modes can use them because only one operation runs at a time. The new flow restores the scrim's innerHTML to the v1.1 default copy on `done()`.

## OPS-02 Fence Assertion

`git diff main` for the fenced files returns **0 lines** for every fenced path:

- `public/editor-inject.js` — untouched
- `public/editor/` (directory) — untouched
- `public/guardrails.js` — untouched
- `src/pages/api/site/` — untouched
- `middleware.ts` — untouched
- `public/feedback-inject.js` — untouched
- `src/pages/api/feedback/submit.ts` — untouched
- `src/pages/api/feedback/validate.ts` — untouched

## `routeToCatalogUrl()` Slug-Derivation Rule

This plan defines a single inline helper that derives the catalog URL from a route. The rule (so Plan 05 + Plan 03 + Phase 9 canaries can stay consistent):

```js
function routeToCatalogUrl(route) {
  var slug = route.replace(/^\/+|\/+$/g, '');  // strip leading/trailing slashes
  if (!slug) slug = 'index';                    // root '/' → 'index'
  return '/edit-catalogs/' + slug + '.json';
}
```

Examples:

| Input route | Resulting slug | Catalog URL |
|-------------|----------------|-------------|
| `/` | `index` | `/edit-catalogs/index.json` |
| `/the-compound/` | `the-compound` | `/edit-catalogs/the-compound.json` |
| `/homes/le-moulin/` | `homes/le-moulin` | `/edit-catalogs/homes/le-moulin.json` |
| `/contact/` | `contact` | `/edit-catalogs/contact.json` |

This MUST stay byte-equivalent to:

- Plan 02's `routeToSlug()` in `src/pages/api/feedback/match.ts` (the matcher's `loadCatalog()` source-of-truth)
- Plan 03's inline helper in `public/feedback-match-inject.js` (the inject can't import from `src/lib/` at runtime)

If a future plan needs slug rules that differ between trailing-slash and non-trailing-slash routes, all three call sites must be updated together.

## State Storage (D-03..D-05)

Block D writes to `sessionStorage['mar_feedback_match_set_v1']` on success. The shape:

```ts
{
  id: string,            // 'ms_<uuid>' from data.matchSetId
  route: string,         // the picked route, e.g. '/homes/le-moulin/'
  buildSha: string,      // server's data.buildSha (drift-check key)
  createdAt: string,     // new Date().toISOString()
  editList: string,      // the raw textarea value
  matches: Match[],      // server's data.matches array
  rowStates: { lineIndex: number, status: 'pending', manualLocator: null }[]
}
```

The write is wrapped in `try { ... } catch (_) {}` for Safari private-mode safety.

## CustomEvent Handoff to Plan 05

After a successful match, Block D dispatches:

```js
window.dispatchEvent(new CustomEvent('mar:match-set-updated', { detail: { matchSetId: data.matchSetId } }));
```

Plan 05 will add a `window.addEventListener('mar:match-set-updated', ...)` listener (inside the same IIFE) to re-render the side panel from `sessionStorage['mar_feedback_match_set_v1']`. This decouples Plan 04's matcher-call code from Plan 05's panel-render code without forcing them to share a function reference.

## Matcher Error Copy (Locked from UI-SPEC §Copywriting Contract)

All seven error paths are wired with the locked copy (verified via grep):

| HTTP / shape | Copy |
|--------------|------|
| `401` | "Please sign in again to continue." + "Your session expired." |
| `404 + error: 'no_catalog'` | "This page isn't catalogued yet. Try a different page." |
| `422 + cap: 'edit-list-chars'` | "That edit list is too long. Try splitting it into smaller batches." |
| `422 + cap: 'catalog-elements'` | "This page has too many editable elements for one match. Contact Monty." |
| `422 + error: 'empty_edit_list'` | "Add at least one edit before matching." |
| `500 + error: 'matcher_unavailable'` | "The matcher is offline. Use per-element click mode instead." |
| network/other | "We couldn't reach the matcher. Try again in a moment." (toast title "Network problem") + generic fallback "Couldn't match those edits. Try again, or use per-element click mode." |

## Deviations from Plan

None — plan executed exactly as written. No Rule-1/Rule-2/Rule-3 auto-fixes triggered. No checkpoints needed.

## Verification Outcomes

- Task 1 grep block (12 checks): all PASS.
- Task 2 grep block (4 checks): all PASS. `src/styles/global.css` diff = 0 lines. `:root` unchanged.
- Task 3 grep block (9 checks): all PASS. All seven locked error copy strings present (7/7).
- `astro sync` (executed in worktree): generated content types in 66ms, no errors.
- `node --check` against the extracted IIFE JS: parses cleanly.
- OPS-02 fence `git diff main` for 8 fenced paths: **0 lines** total.
- `git diff main` v1.1 listener body: 0 removals against pre-plan listener function bodies.

`npx astro check` was not executed because `@astrojs/check` requires an interactive `npm install` prompt; `astro sync` (which exercises the same Astro frontmatter / template parser) was substituted and passed cleanly. The plan's `done` criterion explicitly says "no NEW errors against feedback.astro" — there were already none against the file before the plan, and `astro sync` confirms the file still parses.

## Known Stubs

None. The plan deliberately defers panel-row rendering / Approve/Reject / drift banner / Restore to Plan 05 — these are documented future surfaces, not stubs:

- `#matchSite` iframe stays src-less until Match-edits is clicked — by design (D-22 / OVERLAY-01).
- `mar:match-set-updated` is dispatched but unlistened-for until Plan 05 wires up the panel renderer.
- Block D writes `rowStates: [{ status: 'pending', ... }]` for every match — Plan 05 will mutate these to `approved` / `rejected` / `manual` on user action.

## Threat Flags

None — no new security-relevant surface introduced beyond what the plan's `<threat_model>` covers. The matcher endpoint call (HTTPS + cookie + server-side auth) is owned by Plan 02; this plan only originates the request from the operator's authenticated `/feedback` shell.

## Self-Check: PASSED

- File `src/pages/feedback.astro` exists: FOUND.
- Commits exist in worktree history:
  - `0bec9e8` (Task 1): FOUND.
  - `deeec0d` (Task 2): FOUND.
  - `6ddcbc2` (Task 3): FOUND.
- All three commits on per-agent branch `worktree-agent-a51a8d686c0fd7880` (deny-list + allow-list checks passed pre-commit per #2924).
- OPS-02 fenced paths byte-identical to `main`.
- v1.1 mar-feedback-submit listener body byte-identical to pre-plan baseline.
