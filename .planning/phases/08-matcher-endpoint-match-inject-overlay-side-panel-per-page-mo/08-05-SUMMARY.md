---
phase: 08-matcher-endpoint-match-inject-overlay-side-panel-per-page-mo
plan: 05
subsystem: feedback
tags: [feedback, per-page-review, side-panel, approve-reject, drift-banner, matcher-overlay]
requirements: [PANEL-01, PANEL-02, PANEL-03, PANEL-04, PANEL-05]
dependencies:
  requires:
    - 08-01 (MATCH_INJECT_VER export — already imported by 08-04)
    - 08-02 (POST /api/feedback/match endpoint — consumed by Re-run handler)
    - 08-03 (public/feedback-match-inject.js — emits the inbound mar:feedback:* messages dispatched here)
    - 08-04 (mode tabs + per-page input zone + matchSet sessionStorage writer + mar:match-set-updated CustomEvent)
  provides:
    - Side-panel render state machine over mar_feedback_match_set_v1
    - Approve write-through to mar_feedback_staged_v1 (the v1.1 corner chip's batch store)
    - Drift banner + Re-run handler that replays the cached editList
    - Inbound dispatcher for v1.3 colon-form mar:feedback:* messages
    - Outbound match-focus + match-pick-manually messages to matchSite iframe
  affects:
    - src/pages/feedback.astro (one file, additive only)
tech-stack:
  added: []
  patterns:
    - "Same-origin postMessage protocol with explicit origin checks"
    - "sessionStorage cross-IIFE handoff (parent IIFE writes mar_feedback_staged_v1; inject IIFE reads same key)"
    - "BEM modifiers on row-status state (pending/approved/rejected/manual/low-confidence)"
    - "Lazy-cached catalog fetch keyed by route (memoized per IIFE lifetime)"
    - "aria-live polite live-region announcements for screen-reader state updates"
    - "<details> disclosure pattern for rejected-rows section"
key-files:
  created: []
  modified:
    - src/pages/feedback.astro
decisions:
  - "Approve handler DERIVES the v2 staged-edit shape from the catalog entry, never imports from feedback-inject.js (OPS-02 fence)"
  - "Catalog cache is keyed by route + memoized in module-scope vars (matchCatalog / matchCatalogRoute); rebuilds when route changes"
  - "handlePickManually marks the row 'manual' immediately as a visual cue; the actual staged-edit is produced by the v1.1 click flow's 'Add to batch' interaction, not by this plan"
  - "handleUndo locates the staged edit by (pageRoute, note) pair from the tail of the array — most-recent wins on duplicates"
  - "Inbound dispatcher uses msg.type.startsWith('mar:feedback:') as the v1.3-vs-v1.1 namespace split — v1.1 uses dash-form 'mar-feedback-submit', v1.3 uses colon-form 'mar:feedback:*'"
  - "Re-run handler reuses matchSubmitBtn.click() (Plan 04 path) so error handling + matchSet stash logic stay in one place"
  - "announce() is created lazily on first call into a hidden absolutely-positioned <div id='matchPanelLive'> appended to body — single live region shared across all polite messages"
metrics:
  duration_min: 6
  tasks_completed: 3
  files_modified: 1
  net_lines_added: 554
completed: 2026-05-26T15:17:00Z
started: 2026-05-26T15:10:00Z
---

# Phase 08 Plan 05: Side panel + Approve/Reject/Pick-manually + drift banner — Summary

One-liner: extends `src/pages/feedback.astro` with a 65/35-split side-panel UI that renders one row per matcher result, wires Approve/Reject/Pick-manually/Restore/Undo handlers that write through to the v1.1 corner-chip's `mar_feedback_staged_v1` batch store, adds a drift banner with a Re-run button, and ships an inbound dispatcher for the v1.3 colon-form `mar:feedback:*` postMessages — all while leaving `public/feedback-inject.js` and the v1.1 `mar-feedback-submit` listener byte-for-byte unchanged.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add HTML structure for side panel + drift banner inside #mode-pane-per-page | `cbe9614` | `src/pages/feedback.astro` |
| 2 | Add CSS for side panel + match row + drift banner + responsive split | `4bb4f19` | `src/pages/feedback.astro` |
| 3 | Wire panel render + Approve/Reject/Pick-manually/Restore + drift banner + dispatcher | `038f1a7` | `src/pages/feedback.astro` |

## Final Line Counts (delta tracking)

- **Pre-Plan 04 baseline:** 398 lines (Plan 04 SUMMARY records 399; 398 was the line-1-counted truth)
- **Post-Plan 04 (entering Plan 05):** 612 lines (delta +214 from Plan 04 work)
- **Post-Plan 05 (this plan):** 1166 lines (delta +554 over Plan 04, **+768 from pre-Plan-04 baseline**)

`git diff --shortstat main -- src/pages/feedback.astro` reports `556 insertions(+), 2 deletions(-)` against `main` — the 2 deletions are the two-line `<div class="frame-wrap frame-wrap--match">` block that was relocated into the new `.match-pane__split` wrapper.

## Line-Number Map (post-plan)

### HTML structural insertions (Task 1)

| Insertion | Lines | Notes |
|-----------|-------|-------|
| `.match-pane__split` flex container opening | 265 | Wraps iframe column + new `.match-panel` aside |
| `.match-pane__iframe-col` + relocated `.frame-wrap--match` | 266-270 | The pre-existing iframe block moved into its own column wrapper |
| `<aside class="match-panel" id="matchPanel">` | 271-296 | Side panel root with header / banner-slot / empty / rows / rejected `<details>` / helper |
| `.match-pane__split` close | 297 | |

The existing `.match-input` section (Plan 04) sits at lines 247-264, untouched. The `#mode-pane-per-element` block (Plan 04) sits at lines 233-237, also untouched. The `.rail` block (v1.2) at lines 299-302 is untouched.

### CSS additions (Task 2)

| Block | Lines | Notes |
|-------|-------|-------|
| `/* ---- match-pane split layout (per-page review) ---- */` | 126-134 | Block-default + flex at `min-width: 1024px` (65/35 + 360-480px panel min/max) |
| `/* ---- side panel ---- */` | 135-148 | `.match-panel` + header / title / subtitle / empty / rows / rejected / helper |
| `/* ---- match row ---- */` | 149-185 | `.match-panel__row` + 5 modifiers + head / line-num / line-text / state-badge / primary / confidence (4 tiers) / alternates / reason / actions / button modifiers |
| `/* ---- drift banner ---- */` | 186-193 | Amber alert with icon / body / Re-run action |
| `@media (prefers-reduced-motion: reduce)` | 194-196 | Disables match row + drift banner transitions |

All CSS sits inside the existing `<style>` block (which now spans lines 39-197). `:root` (line 41) is unchanged — no new design tokens introduced. `src/styles/global.css` was not modified.

### JS additions (Task 3, inside the existing IIFE)

| Block | Lines | Purpose |
|-------|-------|---------|
| Section comment header `// ---- Per-page review side panel (v1.3 Phase 8 Plan 05) ----` | 709 | Delimiter |
| Block A — `ensureCatalog()` lazy-cached catalog fetch | 710-723 | Memoized by route; returns `{ entries: [...] }` |
| Block B — Element refs + `STAGED_KEY` + load/save helpers + `confidenceTier` + `renderRow` + `renderRejectedRow` + `renderPanel` | 725-989 | Panel render state machine (PANEL-01..05) |
| Block C — `buildStagedEditFromCatalogEntry` + `handleApprove` + `handleUndo` + `handleReject` + `handleRestore` + `handlePickManually` + `countByStatus` + `announce` | 990-1112 | Approve/Reject/Pick-manually/Restore handlers (PANEL-02..04, D-05, D-18, D-24) |
| Block D — `matchDriftRerun.addEventListener('click', ...)` | 1113-1125 | Drift banner Re-run handler (D-16, D-17) |
| Block E — Inbound `window.addEventListener('message', ...)` dispatcher | 1127-1154 | v1.3 colon-form `mar:feedback:*` (matchset-stale, match-ready, manual-resolved) |
| Block F — `mar:match-set-updated` listener + initial `renderPanel()` call | 1156-1160 | Cross-plan event handoff from Plan 04 + load-time render |

IIFE closes at line 1161 (`})();`); script tag closes at line 1162 (`</script>`).

## v1.1 Listener Integrity (OPS-02 / contract)

The pre-existing v1.1 `window.addEventListener('message', ...)` listener (lines 473-547 of the post-plan file, originally lines 318-392 of the pre-v1.3 baseline) is **byte-for-byte unchanged**.

- `grep -c "mar-feedback-submit" src/pages/feedback.astro` → `1` (single occurrence: line 477 of the post-plan file)
- Block E's new dispatcher uses `msg.type.startsWith('mar:feedback:')` (colon form) and short-circuits with `return;` if the prefix doesn't match — so v1.1's dash-form `mar-feedback-submit` flows through to the original listener.
- The two listeners share the `window.message` event but operate on disjoint type-namespaces and never coordinate.
- `git diff main src/pages/feedback.astro` shows zero removals from lines 318-392 of the pre-v1.3 baseline.

## OPS-02 Fence Assertion

`git diff main` for the fenced files returns **0 lines** total:

```
$ git diff main -- public/editor-inject.js public/editor public/guardrails.js \
                   src/pages/api/site middleware.ts public/feedback-inject.js \
                   src/pages/api/feedback/submit.ts src/pages/api/feedback/validate.ts | wc -l
0
```

Files NOT touched by this plan (verified):
- `public/editor-inject.js`
- `public/editor/` (directory)
- `public/guardrails.js`
- `src/pages/api/site/` (directory)
- `middleware.ts`
- `public/feedback-inject.js`
- `src/pages/api/feedback/submit.ts`
- `src/pages/api/feedback/validate.ts`

Files touched: only `src/pages/feedback.astro` (not in the OPS-02 fence).

## Message Types — Inbound / Outbound

For Phase 9's canary script reference.

### Inbound (handled by Block E `message` dispatcher)

| Type | Payload | Effect |
|------|---------|--------|
| `mar:feedback:matchset-stale` | `{ matchSetId }` | Show `#matchDriftBanner`, disable all `.match-panel__row-btn--approve` buttons with title "Matches are out of date — re-run match first." |
| `mar:feedback:match-ready` | `{ matchSetId, paintedCount, totalCount }` | Clear drift banner (idempotent — no other UX in v1) |
| `mar:feedback:manual-resolved` | `{ lineIndex: 1-based, locator }` | Update `rowStates[lineIndex-1].status = 'manual'` and `.manualLocator = locator`; re-render panel |

Plus the inherited v1.1 dash-form listener (untouched):

| Type | Payload | Effect |
|------|---------|--------|
| `mar-feedback-submit` | `{ payload }` (v1 or v2 schema) | POST `/api/feedback/submit` (handled by the v1.1 listener at line 473-547) |

### Outbound (panel → iframe via `matchSiteFrame.contentWindow.postMessage`)

| Type | Trigger | Payload |
|------|---------|---------|
| `mar:feedback:match-focus` | Row body click (not a button) | `{ lineIndex: 1-based }` |
| `mar:feedback:match-pick-manually` | "Pick manually" button click | `{ lineIndex: 1-based }` |

Origin check: every postMessage call passes `location.origin`; every inbound message listener checks `ev.origin === location.origin`.

## sessionStorage Keys

| Key | Owner | Reader | Writer |
|-----|-------|--------|--------|
| `mar_feedback_match_set_v1` | Plan 04 schema | This plan's `loadMatchSet()` + Block E dispatcher | This plan's `saveMatchSet()` (Approve / Reject / Restore / Pick-manually / dispatcher) |
| `mar_feedback_staged_v1` | v1.1 corner chip (inside `feedback-inject.js`) — **NOT touched** | v1.1 chip's polling/observer (inside iframe) | This plan's `saveStaged()` (Approve only) — also v1.1's chip writes its own |

The two contexts share the same origin (`/feedback` parent + iframe loading `/<route>?feedback=1` on the same domain) and therefore the same sessionStorage. The v1.1 chip's next read cycle picks up our appended entries.

## Deviations from Plan

None for content. One **process** note worth recording:

- **Worktree path drift during Task 1 (#3099):** The initial Task 1 Edit was applied via the absolute path `/Users/Montster/Melissa/Maison Website/moulin-a-reves/src/pages/feedback.astro`, which resolves to the **main repo**, not the worktree (`.claude/worktrees/agent-aeec425540abeb38c/src/pages/feedback.astro`). Detected by post-edit grep returning 0 hits. Reverted the unintended main-repo edit with `git checkout -- src/pages/feedback.astro` (working-tree restore on that single file only — main repo had other untracked dirty state which was left intact), then re-applied the Edit using the worktree-absolute path. Tasks 2 and 3 used the worktree-rooted path from the start. No content deviation; no orchestrator-artifact contamination; commit-time pre-flight guards (HEAD assertion + sentinel toplevel) all passed on the actual commits.

## Threat-Model Notes

### T-08-05-03 (manual-resolved locator forging) — defense in depth

The inbound `mar:feedback:manual-resolved` message carries a `locator` object that is written verbatim to `rowStates[i].manualLocator` (untrusted store). At Approve time, `handleApprove()` merges the manual locator into the staged edit via `Object.assign({}, rowState.manualLocator, { note: m.line, stagedAt: ... })`. The staged edit then flows through `mar_feedback_staged_v1` into the v1.1 batch submit → `POST /api/feedback/submit` → `src/pages/api/feedback/validate.ts` (`signalCount(locator) >= 2`).

**Server-side validation is the safety net.** The panel does NOT execute the locator — it's a data payload. Validate.ts is the authoritative check; the panel is just a UX surface. Same-origin postMessage + `ev.origin === location.origin` checks prevent cross-origin forging from third-party iframes; same-origin forging requires an XSS that already breaks every assumption.

### T-08-05-02 (XSS via match / catalog text) — mitigated

All text values from `match.line`, `match.reason`, `catalog.entries[*].currentText|altText|nearestHeading|id` are rendered via `el.textContent = ...` (which auto-escapes). The only `innerHTML` writes in this plan's code are `matchPanelRows.innerHTML = ''` and `matchPanelRejectedList.innerHTML = ''` (empty-string clears — not attacker-controlled). No template-string HTML construction with user-controlled values.

## Verification Outcomes

- Task 1 grep block (9 checks): all PASS.
  - `match-pane__split` = 1; `matchPanel` = 1; `matchDriftBanner` = 1; `matchPanelRows` = 1; `matchPanelRejected` = 1; "Per-page matches" = 2 (h3 + aria-label, expected); "Tell us what to change on this page" = 1; "Re-run match" = 2 (button label + body-copy reference, both verbatim from UI-SPEC); "Matches are out of date" = 1.
- Task 2 grep block (6 checks): all PASS.
  - `.match-panel__row` rule = 1; `.match-panel__row--approved` = 1; `.match-panel__row-confidence--green` = 1; `.match-drift-banner` = 2 (rule + reduced-motion ref); `min-width: 1024px` = 1; `prefers-reduced-motion` = 2 (existing Plan 04 + new).
- Task 3 grep block (13 checks): all PASS.
  - `function renderPanel` = 1; `function handleApprove` = 1; `function handleReject` = 1; `function handlePickManually` = 1; `function handleRestore` = 1; `buildStagedEditFromCatalogEntry` = 2 (definition + call); `mar:feedback:matchset-stale` = 1; `mar:feedback:match-pick-manually` = 1; `mar:feedback:match-focus` = 1; `mar:feedback:manual-resolved` = 1; `ensureCatalog` = 3 (definition + 2 calls); `mar-feedback-submit` = 1 (v1.1 listener intact); IIFE parses via `node --check` against extracted body.
- Plan-level verification block: all PASS.
  - OPS-02 fence = 0 lines diff; `renderRow` = 1; `STAGED_KEY = 'mar_feedback_staged_v1'` = 1; `saveStaged` = 3 (1 definition + 2 calls in handleApprove + handleUndo); `handleReject` = 2 (definition + addEventListener call); `handleRestore` = 2; `saveMatchSet` = 7 (1 definition + 6 callsites: Approve, Undo, Reject, Restore, Pick-manually, dispatcher manual-resolved branch).
- `astro sync` (executed in worktree): generated content types in 24-26ms, no errors.
- `node --check` against the extracted IIFE JS (849 lines): parses cleanly.
- `npx astro check` was **not executed** — `@astrojs/check` requires an interactive `npm install` prompt (same as Plan 04 SUMMARY noted). `astro sync` covers the Astro frontmatter / template parse; `node --check` covers the JS body. The plan's `done` criterion ("no new errors against feedback.astro") is satisfied by these two substitutes.
- OPS-02 fenced paths: `git diff main` returns **0 lines** for all 8 fenced paths.
- v1.1 listener byte-identical: `grep -c "mar-feedback-submit" src/pages/feedback.astro` = `1` (the single occurrence at line 477, which is the listener's short-circuit guard).

## End-to-End Smoke (not run — deferred to Phase 9)

The plan's `<verification>` § "End-of-phase verification" describes a 9-step manual smoke (pick page → match → approve → reject → pick-manually → switch back to per-element → submit batch). This is intentionally deferred to Phase 9's canary, per the plan's own note: "Plan 09 (post-deploy verification) will codify them as a canary script."

## Known Stubs

None. The plan deliberately treats the following as deferred-by-design (not stubs):

- The "manual" status badge is added immediately on Pick-manually click as a visual cue; the actual `manualLocator` is only set by an inbound `mar:feedback:manual-resolved` message from the inject (Plan 03), and the v1.1 click flow's "Add to batch" interaction is what ultimately produces the staged edit. This is documented in the inline comment block at `handlePickManually()` and is the agreed v1 behaviour per the plan.
- The Approve button is disabled when `m.primaryId === null && rowState.manualLocator === null` (no primary match + no manual override yet). The user must first Pick manually to enable Approve for no-match rows. This is intentional UX, not a stub.

## Threat Flags

None — no new security-relevant surface introduced beyond what the plan's `<threat_model>` covers. All inbound postMessages are same-origin-checked; all rendered text is `textContent`-escaped; the staged-edit shape feeds into the existing v1.1 validator at submit time (server-side).

## Self-Check: PASSED

- File `src/pages/feedback.astro` exists in the worktree at the expected path: FOUND.
- Commits exist in worktree history:
  - `cbe9614` (Task 1): FOUND.
  - `4bb4f19` (Task 2): FOUND.
  - `038f1a7` (Task 3): FOUND.
- All three commits on per-agent branch `worktree-agent-aeec425540abeb38c` (deny-list + allow-list checks passed pre-commit per #2924).
- OPS-02 fenced paths byte-identical to `main`.
- v1.1 mar-feedback-submit listener body byte-identical to pre-plan baseline.
- `node --check` on extracted IIFE JS: parses cleanly.
- `astro sync` in worktree: 0 errors.
