---
status: partial
phase: 08-matcher-endpoint-match-inject-overlay-side-panel-per-page-mo
source: [08-VERIFICATION.md]
started: 2026-05-26T20:05:00Z
updated: 2026-05-26T20:05:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. End-to-end per-page review smoke: load /feedback, sign in, switch to 'Per-page review' tab, pick /homes/le-moulin/, paste a 3-line freeform list, click 'Match edits'
expected: Iframe at #matchSite reloads to /homes/le-moulin/?feedback=1&v=4&matchSet=ms_<uuid>&matchVer=1; three numbered orange pins (#FF6B2B, 28x28px, top-left) appear on matched elements; side panel renders 3 rows with line text, primary match preview, confidence pill (green/amber/red), alternates, and Approve/Reject/Pick-manually buttons
result: [pending]

### 2. Click 'Approve' on one panel row
expected: Row's border-left turns green, badge 'Staged' appears, button label changes to 'Undo'; switch to per-element click mode tab — corner chip's 'N edits staged' counter increments by exactly 1; sessionStorage['mar_feedback_staged_v1'] contains a new entry whose locator satisfies signalCount() >= 2
result: [pending]

### 3. Click 'Reject' on a row
expected: Row disappears from main list and reappears in '<details>Rejected (1)' disclosure at panel bottom; clicking Restore returns row to pending state
result: [pending]

### 4. Click 'Pick manually' on a no-match row
expected: Pin clears from that row's element in iframe; in-iframe transient toast appears with copy 'Click any element inside the preview to pick it for this line.'; toast auto-dismisses after 8 seconds
result: [pending]

### 5. Catalog-drift simulation: stash a matchSet with buildSha='deadbee', reload iframe
expected: Inject paints ZERO pins; posts mar:feedback:matchset-stale to parent; #matchDriftBanner becomes visible with title 'Matches are out of date' and Re-run button; all Approve buttons disabled with tooltip 'Matches are out of date — re-run match first.'
result: [pending]

### 6. Tab switching does not lose state: pick page, paste edits, switch to per-element click tab, switch back
expected: Per-page mode textarea content and picker selection preserved; URL hash reflects active mode (#mode=per-page or #mode=per-element); no scroll on hash change
result: [pending]

### 7. Cross-mode batch composition: approve 3 matches via per-page mode + add 1 click-staged edit via per-element mode, click Submit batch
expected: Single GitHub issue created with all 4 edits; corner chip shows '4 edits staged' before submit; one PR is created; both mar_feedback_staged_v1 and mar_feedback_match_set_v1 keys exist independently in sessionStorage
result: [pending]

### 8. Drift banner Re-run button: simulate drift, click 'Re-run match'
expected: Existing editList from sessionStorage is replayed; matcher endpoint is hit again; new matchSet with current buildSha is stashed; iframe reloads; drift banner clears
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps
