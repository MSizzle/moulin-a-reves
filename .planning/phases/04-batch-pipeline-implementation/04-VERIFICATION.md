---
phase: 04-batch-pipeline-implementation
verified: 2026-05-21T10:30:00Z
status: passed
score: 6/6 must-haves verified (Success Criteria from ROADMAP); 23/23 requirement IDs satisfied
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: "4/6 must-haves verified (Success Criteria from ROADMAP); 21/23 requirement IDs satisfied"
  gaps_closed:
    - id: CR-01
      truth: "Parent forwarder in feedback.astro dropped structured cap/error fields, making inject branches unreachable"
      status: closed
      evidence: "src/pages/feedback.astro:192-222 now spreads data.errors, data.cap, data.limit, data.actual, data.error onto failure postMessage; data.warning and data.commitErrors onto success postMessage. Committed ce4b21e. Both m.cap (line ~1159) and m.errors (line ~1150) branches in feedback-inject.js are now reachable."
    - id: CR-02
      truth: "Server byte cap computed from spoofable client descriptor e.image.bytes instead of decoded base64 length"
      status: closed
      evidence: "approxDecodedBytes(b64) helper added at submit.ts:328 (commit 9409ac6). totalBytes reducer at line 366 now sums approxDecodedBytes(e?.image?.dataBase64 || ''); old descriptor reducer removed. Smoke scenario 4 updated in commit daaf395 to ship real oversize base64 (perEditB64Len = ceil((capBytes+1024)*4/3/2)+4) with AAAA stub gone (0 occurrences). Harness: 5 passed, 0 failed."
    - id: CR-03
      truth: "v2 batch silently swallowed per-edit commitError without surfacing warning to client"
      status: closed
      evidence: "submit.ts:586-601 (commit eac7ec0) aggregates finalMachineEdits entries with commitError into commitErrors array; 200 response gains warning + commitErrors fields when commitErrors.length > 0; clean batches remain byte-identical. feedback.astro:198-199 relays data.warning and data.commitErrors. feedback-inject.js:1113-1125 (commit 06be1b8) adds if(m.ok && m.warning) branch that does NOT call clearStaged/removeChip/destroyStagedPanel/clearDraft, re-enables chip, and renders warning panel."
    - id: OPS-01
      truth: "FEEDBACK_INJECT_VER must be bumped to 3 after inject behavioral change in 04-10"
      status: closed
      evidence: "src/lib/feedback-version.ts:12 = export const FEEDBACK_INJECT_VER = '3'; (commit cbffdde). grep -c \"FEEDBACK_INJECT_VER = '2'\" returns 0; grep -c \"FEEDBACK_INJECT_VER = '3'\" returns 1."
  gaps_remaining: []
  regressions: []
deferred: []
---

# Phase 4: Batch Pipeline Implementation — Verification Report

**Phase Goal:** Client can stage multiple edits in a session, submit them as one batch, and the entire pipeline (server endpoint → GitHub issue → Claude Code Action) produces exactly one PR for that batch — while v1 cached clients keep working unchanged and the editor flow stays byte-for-byte identical.

**Verified:** 2026-05-21T05:08:16Z (initial) / 2026-05-21T10:30:00Z (re-verification)
**Status:** passed
**Re-verification:** Yes — after gap closure (04-09 / 04-10 / 04-11)

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Corner chip appears after first stage; panel lists each staged edit with ❌ delete and confirm-required "Clear all"; survives iframe navigation/reload, clears on browser close | VERIFIED | `public/feedback-inject.js`: `renderChip()` line 788, `renderPanel()` line 819, `stagedDelete()` line 904, `stagedClearAll()` with `window.confirm('Clear all staged edits…')` (grep confirms), `STAGED_KEY = 'mar_feedback_staged_v1'` line 38 in sessionStorage, `pageshow` + `visibilitychange` listeners (grep confirms). `node --check public/feedback-inject.js` exit 0. |
| 2 | Clicking Submit batch on 3-edit stage → exactly ONE POST with `{schemaVersion:2, batch:true, edits:[3]}`; on success closes panel + clears sessionStorage + creates ONE GitHub issue with title `[Feedback] batch of 3 edits — <pageRoutes>`, per-edit `renderHuman()` separated by `---`, single fenced ```json``` block | VERIFIED | `scripts/smoke-feedback-v2.mjs` scenario 2 passes: title regex `^\[Feedback\] batch of 3 edits — ` asserted; createIssue called exactly once with labels `client-feedback`. `submit.ts` lines 480-484 build title; lines 462-475 join `humanSections` with `\n\n---\n\n` then a single ```json``` fence. Success branch at inject 1126-1139 calls `clearStaged()` + `removeChip()` + `destroyStagedPanel()`. |
| 3 | v1 single-edit (cached browser) still produces existing single-edit issue with no behavioural change; v1 and v2 share validator | VERIFIED | `scripts/smoke-feedback-v2.mjs` scenario 1 passes (v1 back-compat). `submit.ts:594` dispatches `schemaVersion===1` to `handleV1()`. `handleV1` line 166-167 calls `validateEdit(p)` from `./validate`. v2 line 364 calls the same `validateEdit(e)` for every edit. `validate.ts:67-102` is the single rule set. |
| 4 | Batched issue → ONE branch `feedback/issue-<n>-batch-<N>`, ONE commit, ONE PR, ONE result comment; autonomy hint passes iff every edit passes per-edit gate; failure-reason lists failing edits | VERIFIED (Action-side documented) | `.github/CLAUDE_FEEDBACK.md §8 lines 245-257` mandates one-branch / one-commit / one-PR / one-result-comment convention; lines 228-244 document the per-edit AND roll-up; the result comment format at lines 263-275 includes the "Applied X of N edits; edit #Y had only 1 locator signal…" example. Server-side at `submit.ts:373-383` computes `batchAuto = perEdit.every(x.auto)` and produces the `AUTO-ELIGIBLE` / `NEEDS-REVIEW (… edits failed: #N…)` strings in the body (lines 455-457). |
| 5 | `git diff main` editor-flow fence returns 0; `FEEDBACK_INJECT_VER` bumped; `CLAUDE.md` "Feedback mode" has new v2 batch note | VERIFIED | `git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts \| wc -l` returns 0. `src/lib/feedback-version.ts:12` exports `FEEDBACK_INJECT_VER = '3'` (bumped from '2' after 04-10 inject behavioral change, per OPS-01). `CLAUDE.md:262` has the "Batch submissions (v2 schema)" bullet. |
| 6 | Client enforces 10-edit + 30 MB caps before submit with limit-reached chip UX (STAGE-06/07); server re-validates both caps and returns structured per-cap error response that the UI highlights (API-06) | VERIFIED | **(A) Client-side:** `exceedsCaps()` at inject line 765-774 checks `MAX_BATCH_EDITS` and `MAX_BATCH_BYTES` (3 MB per D-03 reconciliation). **(B) Server-side:** `approxDecodedBytes()` helper at submit.ts:328 (commit 9409ac6) computes decoded byte length from base64 string length, not the spoofable client descriptor. totalBytes reducer at line 366 sums decoded bytes. Smoke scenario 4 ships a real oversize base64 (AAAA stub gone) and confirms cap fires correctly: 5 passed, 0 failed. **(C) UI surfacing:** feedback.astro:213-222 spreads data.errors, data.cap, data.limit, data.actual, data.error onto failure postMessage (commit ce4b21e, CR-01 closed). Inject's `m.cap` branch at line 1159 and `m.errors` branch at line 1150 are now reachable. **(D) Atomicity/warning:** feedback.astro:198-199 relays data.warning + data.commitErrors onto success postMessage (CR-03 closed). Inject's `if(m.ok && m.warning)` branch at line 1113 surfaces warning without clearing staged state. |

**Score:** 6/6 truths verified

---

### Required Artifacts (from PLAN frontmatter must_haves, plus emergent artifacts)

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/pages/api/feedback/validate.ts` | NEW — shared per-edit validator with full helper surface | VERIFIED | 102 LOC, exports `validateEdit`, `signalCount`, `isVague`, `clamp`, `INTENTS`, `MAX_IMAGE_BYTES`, `MIN_VAGUE_LEN`, `MOVE_RESIZE_OPTIONS`, `VAGUE_STOPLIST`, `VAGUE_MESSAGE`, `Intent`. Doc header at lines 1-13 contains D-15, API-04, MIRROR. No `export const prerender` directive. |
| `src/pages/api/feedback/submit.ts` | MODIFIED — imports validator, v1+v2 dispatch, full v2 handler, approxDecodedBytes, commitErrors aggregation, sequential photo commits, single final patchIssueBody | VERIFIED | approxDecodedBytes helper at line 328; totalBytes reducer uses decoded bytes at line 366; commitErrors aggregation at lines 586-601; warning in 200 response when commitErrors.length > 0. handleV1 lines 164-317 unchanged. |
| `public/feedback-inject.js` | MODIFIED — v2 state machine, chip + panel, sessionStorage staging, base64 at submit time, cross-page rehydrate, warning-success branch (CR-03 UI half) | VERIFIED | `if(m.ok && m.warning)` branch at line 1113 (commit 06be1b8) precedes `if(m.ok)` clean-success branch at line 1126; warning branch does NOT call clearStaged/removeChip/destroyStagedPanel/clearDraft. m.cap (line 1159) and m.errors (line 1150) branches now reachable via CR-01 fix. `node --check` exit 0. |
| `src/lib/feedback-version.ts` | MODIFIED — bump `'2'` → `'3'` (OPS-01, triggered by 04-10 inject behavioral change) | VERIFIED | Line 12: `export const FEEDBACK_INJECT_VER = '3';`. grep -c "'2'" returns 0; grep -c "'3'" returns 1. Commit cbffdde. |
| `src/pages/feedback.astro` | MODIFIED — parent forwarder spreads structured server response fields (CR-01 fix) | VERIFIED | Lines 192-222: success path spreads data.warning + data.commitErrors; failure path spreads data.errors, data.cap, data.limit, data.actual, data.error. Commit ce4b21e. |
| `scripts/smoke-feedback-v2.mjs` | MODIFIED — scenario 4 ships real oversize base64 (CR-02 fix) | VERIFIED | Lines 307-355: perEditB64Len = ceil((capBytes+1024)*4/3/2)+4; bigB64 = 'A'.repeat(perEditB64Len); AAAA stub gone. Assertions unchanged (status 422, cap='bytes', limit=capBytes, actual>capBytes). Commit daaf395. |
| `.github/CLAUDE_FEEDBACK.md` | MODIFIED — new `## 8. Batch submissions` section | VERIFIED | Line 194 has `## 8. Batch submissions — one issue, N edits, one PR`. Lines 200-281 cover schema detection, gh issue view protocol, per-edit inheritance of §0/§2/§4, ONE branch / ONE commit / ONE PR, autonomy decision tree, result-comment format. |
| `CLAUDE.md` | MODIFIED — new bullet in Feedback-mode subsection | VERIFIED | Line 262 has the "**Batch submissions (v2 schema).**" bullet referencing schemaVersion:2, batch:true, validate.ts, v1 cached-browser back-compat, CLAUDE_FEEDBACK.md §8. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `submit.ts handleV1` → `validateEdit` | `./validate.ts` | named import + call | WIRED | `import { validateEdit, … } from './validate'` line 5; called at line 166. |
| `submit.ts handleV2Batch` → `validateEdit` | `./validate.ts` | per-edit loop call | WIRED | Line 364: `errors.push({ index, error: validateEdit(e) })` (effectively). Acceptance behavior verified by smoke scenario 5. |
| `submit.ts handleV2Batch` → `approxDecodedBytes` → cap gate | module-scope helper | totalBytes reducer | WIRED | Line 328 defines helper; line 366 calls it in reduce; cap gate at line 369 compares totalBytes > MAX_BATCH_BYTES. |
| `submit.ts handleV2Batch` → `createIssue` → `commitBase64File`xN → `patchIssueBody` | GitHub API | issue-first then per-photo sequential then single PATCH | WIRED | Sequential `for` loop at line 511 not Promise.all. commitErrors aggregated at lines 586-601. |
| `feedback-inject.js submitBatch` → `window.parent.postMessage({type:'mar-feedback-submit', payload})` | `feedback.astro` listener | postMessage round-trip | WIRED | Line 1049: `window.parent.postMessage({ type: 'mar-feedback-submit', payload }, '*')`. Parent listener at feedback.astro:164-235 receives, POSTs to `/api/feedback/submit`. |
| `feedback.astro` parent → iframe → `submitBatch` result-receiver (success path) | `mar-feedback-result` postMessage | parent posts response back with warning + commitErrors | WIRED | feedback.astro:191-209 spreads data.warning + data.commitErrors onto success postMessage. Inject's `if(m.ok && m.warning)` branch at line 1113 surfaces warning and preserves staged state. |
| `feedback.astro` parent → iframe → `submitBatch` result-receiver (failure path) | `mar-feedback-result` postMessage | parent posts response back with structured cap/error fields | WIRED | feedback.astro:210-222 spreads data.errors, data.cap, data.limit, data.actual, data.error onto failure postMessage. Inject's m.cap (line 1159) and m.errors (line 1150) branches are now reachable. |
| `pageshow` / `visibilitychange` → `renderChip` rehydrate | sessionStorage `mar_feedback_staged_v1` | event listeners call loadStaged() + renderChip() | WIRED | Listeners installed; both check `!document.getElementById('mar-fb-chip')` before re-rendering. Cross-page (D-06) batching works for descriptor entries; photo-bearing edits lose the in-memory `fileMap[stageId]` File reference across nav (documented behaviour per PLAN). |
| BaseLayout loader / feedback.astro iframe `src` → `FEEDBACK_INJECT_VER` | `src/lib/feedback-version.ts` | named import → `?v=3` at build time | WIRED | feedback.astro line 5 imports `FEEDBACK_INJECT_VER as VER`; line 29 builds `firstSrc = '/?feedback=1&v=' + VER`. Both consumers resolve '3' automatically. |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `submit.ts handleV2Batch` totalBytes cap | `totalBytes` | `approxDecodedBytes(e?.image?.dataBase64 \|\| '')` per edit | YES — decoded bytes from base64 string length, not spoofable descriptor | FLOWING (CR-02 closed) |
| `submit.ts handleV2Batch` response on partial photo failure | response body commitErrors + warning fields | `finalMachineEdits[i].commitError` entries filtered to `{index, error}` array | YES — real per-edit commit results aggregated into response | FLOWING (CR-03 server half closed) |
| `feedback.astro` parent forwarder result message (failure) | postMessage payload | `data.errors`, `data.cap`, `data.limit`, `data.actual`, `data.error` | YES — structured server fields now spread onto mar-feedback-result | FLOWING (CR-01 closed) |
| `feedback.astro` parent forwarder result message (success w/ warning) | postMessage payload | `data.warning`, `data.commitErrors` | YES — partial-failure fields relayed to inject | FLOWING (CR-03 UI half closed) |
| `feedback-inject.js` chip count | `loadStaged().length` | `sessionStorage.getItem(STAGED_KEY)` parsed array | YES | FLOWING — verified end-to-end via smoke harness scenarios 2 and 3. |
| `feedback-inject.js` panel item rendering | escaped innerHTML | `loadStaged()` array entries' `intentDetail.newTextEn` etc. | YES (with `escapeHtml`) | FLOWING — `escapeHtml` applied at every interpolation. |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Smoke harness runs all 5 scenarios | `npx tsx scripts/smoke-feedback-v2.mjs` | `5 passed, 0 failed` | PASS |
| feedback-inject.js parses | `node --check public/feedback-inject.js` | exit 0 | PASS |
| OPS-02 editor-flow fence (working tree vs HEAD) | `git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts \| wc -l` | 0 | PASS |
| OPS-02 fence Phase 4 commits only (since 2026-05-20) | `git log --oneline --since="2026-05-20" -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts` | (empty — no phase-4 commits touched fenced paths) | PASS |
| Cache-bust constant bumped to v3 | `grep -c "FEEDBACK_INJECT_VER = '3'" src/lib/feedback-version.ts` | 1 | PASS |
| '2' no longer present | `grep -c "FEEDBACK_INJECT_VER = '2'" src/lib/feedback-version.ts` | 0 | PASS |
| approxDecodedBytes helper exists | `grep -c "function approxDecodedBytes" src/pages/api/feedback/submit.ts` | 1 | PASS |
| Reducer uses decoded bytes | `grep -c "approxDecodedBytes(e?\.image?\.dataBase64" src/pages/api/feedback/submit.ts` | 1 (line 366) | PASS |
| Old AAAA stub gone from smoke | `grep -c "dataBase64.*AAAA" scripts/smoke-feedback-v2.mjs` | 0 | PASS |
| commitErrors aggregation present | `grep -c "commitErrors" src/pages/api/feedback/submit.ts` | 5 | PASS |
| warning-success branch in inject | `grep -c "m.ok && m.warning" public/feedback-inject.js` | 1 (line 1113) | PASS |
| Parent forwarder spreads data.cap | `grep -c "data.cap" src/pages/feedback.astro` | 1 | PASS |
| Parent forwarder spreads data.errors | `grep -c "data.errors" src/pages/feedback.astro` | 1 | PASS |
| Parent forwarder spreads data.warning | `grep -c "data.warning" src/pages/feedback.astro` | 2 | PASS |
| CLAUDE.md batch bullet | `grep -c "Batch submissions (v2 schema)" CLAUDE.md` | 1 | PASS |
| CLAUDE_FEEDBACK §8 | `grep -c "^## 8\\. Batch submissions" .github/CLAUDE_FEEDBACK.md` | 1 | PASS |
| D-03 cap unchanged in submit.ts | `grep "const MAX_BATCH_BYTES = 3 \* 1024 \* 1024" src/pages/api/feedback/submit.ts` | 1 match at line 53 | PASS |
| D-03 cap unchanged in inject | `grep "var MAX_BATCH_BYTES = 3\*1024\*1024" public/feedback-inject.js` | 1 match at line 32 | PASS |

---

### Probe Execution

No conventional `scripts/*/tests/probe-*.sh` probes exist in the repo. The phase's declared verification driver is `scripts/smoke-feedback-v2.mjs`, run above.

| Probe | Command | Result | Status |
|---|---|---|---|
| `scripts/smoke-feedback-v2.mjs` | `npx tsx scripts/smoke-feedback-v2.mjs` | 5 passed, 0 failed | PASS |

---

### Requirements Coverage

| Requirement | Plan | Description | Status | Evidence |
|---|---|---|---|---|
| STAGE-01 | 04-04 | Stage confirmed edit in sessionStorage; survive iframe nav + reload | SATISFIED | `STAGED_KEY` in sessionStorage; pageshow/visibilitychange rehydrate; clears on browser close (sessionStorage semantics). |
| STAGE-02 | 04-04 | Corner chip `N edits staged · Submit batch · View list` | SATISFIED | `renderChip()` builds the chip with those literal strings. |
| STAGE-03 | 04-04 | Panel with per-item ❌ delete and confirm-required "Clear all" | SATISFIED | `renderPanel()` + `stagedDelete()` (no confirm per D-12) + `stagedClearAll()` with `window.confirm('Clear all staged edits? This cannot be undone.')` |
| STAGE-04 | 04-04 | One POST per Submit batch; on 200 close panel + clear sessionStorage | SATISFIED | `submitBatch()` line 942-1049 builds payload, posts once, success branch at 1126-1139 clears state. |
| STAGE-05 | 04-04 | Files as in-memory references; base64 only at submit time | SATISFIED | `fileMap` in-memory map; `readAsBase64()` at submit time only. |
| STAGE-06 | 04-04 | Client 10-edit + 30 MB caps with Confirm disabled + inline message | SATISFIED (cap value lowered to 3 MB per D-03 reconciliation; documented) | `exceedsCaps()` line 765 checks both caps; cap value = 3 MB to mirror server. |
| STAGE-07 | 04-04 | Chip 'limit reached' UX | SATISFIED | Cap message string present; renderPanel emits the `mar-fb-staged-cap-msg` div. m.cap branch at line 1159 is now reachable via CR-01 fix. |
| API-01 | 04-03 | Accept v2 batch payloads | SATISFIED | Dispatch at submit.ts:595 routes `schemaVersion:2 && batch:true` to handleV2Batch. Smoke scenario 2 passes. |
| API-02 | 04-02 | Continue to accept v1 indefinitely | SATISFIED | Dispatch at submit.ts:594 routes `schemaVersion:1` to handleV1. Smoke scenario 1 passes. handleV1 lines 164-317 unchanged by gap-closure commits. |
| API-03 | 04-03 | Per-edit validation rejects whole batch with structured per-edit-errors | SATISFIED | `failBatch()` returns `{ok:false, error, errors:[{index,error}]}`. Smoke scenario 5 passes. feedback.astro:217 spreads data.errors onto mar-feedback-result; m.errors branch at inject line 1150 is now reachable (CR-01 closed). |
| API-04 | 04-01 | Shared helper consumed by both v1 and v2 | SATISFIED | `validate.ts` is consumed by both `handleV1` (line 166) and `handleV2Batch` (line 364). |
| API-05 | 04-03 | All photos to same `feedback-incoming/issue-<n>/` directory; single PATCH; partial failures surfaced | SATISFIED | Sequential commits to `feedback-incoming/issue-${issueNumber}/edit-${i+1}-${safeName}` at line 537; exactly one `patchIssueBody(issueNumber, buildBatchBody(finalMachineEdits))` at line 578; commitErrors aggregated into 200 response (CR-03 closed). |
| API-06 | 04-03 | Server re-validates both caps and returns structured per-cap error | SATISFIED | Edit-count cap: `p.edits.length > MAX_BATCH_EDITS` (correct). Byte cap: `approxDecodedBytes(e?.image?.dataBase64)` sum (CR-02 closed — not spoofable). Cap response shape `{cap, limit, actual}` correct and now relayed by parent forwarder to inject (CR-01 closed). |
| ISSUE-01 | 04-03 | One issue per batch titled `[Feedback] batch of {N} edits — {pageRoutes}` | SATISFIED | submit.ts:480-484 builds title; smoke scenario 2 asserts `/^\[Feedback\] batch of 3 edits — /`. |
| ISSUE-02 | 04-03 | Per-edit `renderHuman()` separated by `---` | SATISFIED | Line 462-464 emits each as `### Edit X of N\n\n${renderHuman(...)}` joined by `\n\n---\n\n`. |
| ISSUE-03 | 04-03 | Single fenced ```json``` block holding `edits[]` | SATISFIED | Lines 468-471 emit exactly one ```json``` block with full `{schemaVersion:2, batch:true, edits:[...]}` payload. |
| ISSUE-04 | 04-03 | Autonomy hint passes iff every edit passes; atomicity surfaced | SATISFIED | `batchAuto = perEdit.every(x => x.auto)` line 378; hint string lines 455-457 lists failing #N indexes. Partial photo-commit failures surfaced via commitErrors in 200 response (CR-03 closed). |
| ACTION-01 | 04-05 | `## 8. Batch submissions` section with v2 detection, per-edit rule inheritance | SATISFIED | Section present; all required substrings (schemaVersion:2, batch:true, gh issue view, --json body, per-edit, EN/FR, §0/§2/§4 cross-refs). |
| ACTION-02 | 04-05 | One branch `feedback/issue-<n>-batch-<N>` / one commit / one PR | SATISFIED (documented) | CLAUDE_FEEDBACK §8 lines 245-257 mandates this. Action-side enforcement is by the LLM following the manual; verifiable via OPS-05 canary in Phase 5. |
| ACTION-03 | 04-05 | ONE result comment per batch with applied/skipped summary | SATISFIED (documented) | CLAUDE_FEEDBACK §8 lines 263-275 mandates the format with example phrasings. |
| OPS-01 | 04-06 / 04-11 | `FEEDBACK_INJECT_VER` bumped | SATISFIED | '1' → '2' in 04-06; '2' → '3' in 04-11 (cbffdde) after 04-10 inject behavioral change. Current value: '3'. |
| OPS-02 | 04-08 | Editor flow byte-for-byte unchanged | SATISFIED | `git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts \| wc -l` returns 0. No phase-4 commits (since 2026-05-20) touched fenced paths (git log confirms empty result). |
| OPS-03 | 04-07 | CLAUDE.md Feedback mode batch note | SATISFIED | New bullet at CLAUDE.md:262. |

**All 23 requirement IDs: SATISFIED**

**Orphan check:** REQUIREMENTS.md maps OPS-04 and OPS-05 to Phase 5, not Phase 4. No orphaned requirement IDs.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `public/feedback-inject.js` | 24, 489, 559 | `MAX_IMAGE_BYTES = 12 MB` per-photo cap is larger than `MAX_BATCH_BYTES = 3 MB` batch cap | INFO (WR-01 in review) | A first-photo over 3 MB trips the misleading "batch is full" message instead of a per-photo over-limit message. No change in gap-closure. |
| `src/pages/api/feedback/submit.ts` | 16-21 | `void` ritual pins 6 imports but `MAX_IMAGE_BYTES` is imported and not in the ritual | INFO (WR-05 in review) | Inconsistent with the ritual's stated intent; not a runtime issue. No change in gap-closure. |

No `TBD`/`FIXME`/`XXX` debt markers in any modified files.
No regressions introduced: `handleV1` lines 164-317 are byte-identical to pre-gap-closure; `validate.ts` untouched; `MAX_BATCH_BYTES` and `MAX_BATCH_EDITS` constants unchanged in both submit.ts and feedback-inject.js.

---

### Human Verification Required

None. All gaps closed via falsifiable code-level evidence verified programmatically. Phase 5 (OPS-04 / OPS-05 canaries) will exercise the live pipeline post-merge against real GitHub / Claude Action infrastructure.

---

### Gaps Summary

All three BLOCKER gaps from the initial verification (2026-05-21T05:08:16Z) are closed:

1. **CR-01 (parent forwarder dead code):** `src/pages/feedback.astro` now spreads all six structured server response fields onto `mar-feedback-result` postMessage for both success (warning, commitErrors) and failure (errors, cap, limit, actual, error) paths. The inject's `m.cap` and `m.errors` branches are reachable. (Commit ce4b21e)

2. **CR-02 (spoofable byte cap):** `approxDecodedBytes(b64)` helper computes decoded byte length from base64 string character count (not the client-supplied descriptor). The `totalBytes` reducer in `handleV2Batch` sums decoded bytes. Smoke scenario 4 ships a real oversize base64 string and confirms the cap fires on the actual data. (Commits 9409ac6 + daaf395)

3. **CR-03 (silent partial photo-commit failure):** `handleV2Batch` aggregates `finalMachineEdits` entries with `commitError` into a `commitErrors` array and includes `warning` + `commitErrors` in the 200 response body when any photo commit failed. `feedback.astro` relays these fields to the iframe. The inject's `if(m.ok && m.warning)` branch surfaces the warning and preserves staged state (no clearStaged/removeChip/destroyStagedPanel/clearDraft called). (Commits eac7ec0 + 06be1b8 + ce4b21e)

4. **OPS-01 (cache-bust):** `FEEDBACK_INJECT_VER` bumped from '2' → '3' after the 04-10 inject behavioral change. (Commit cbffdde)

The master merge-gate (`npx tsx scripts/smoke-feedback-v2.mjs`) returns `5 passed, 0 failed`. The OPS-02 fence is clean. The phase goal is fully achieved.

---

## Re-Verification (2026-05-21)

**Re-verification date:** 2026-05-21T10:30:00Z
**Gap-closure trio:** 04-09 (server fixes) / 04-10 (UI plumbing + smoke harness) / 04-11 (version bump)

### Per-Gap Closure Evidence

#### CR-01 — Parent forwarder drops structured fields (CLOSED)

**File:** `src/pages/feedback.astro:191-222`
**Commit:** ce4b21e

Success path (lines 194-200):
- `data.warning` → spread as `{ warning: data.warning }` if truthy
- `data.commitErrors` → spread as `{ commitErrors: data.commitErrors }` if Array.isArray

Failure path (lines 214-222):
- `data.errors` → spread if Array.isArray
- `data.cap` → spread if truthy
- `data.limit` → spread if typeof === 'number'
- `data.actual` → spread if typeof === 'number'
- `data.error` → spread if truthy

`grep -c "data.cap" src/pages/feedback.astro` = 1
`grep -c "data.errors" src/pages/feedback.astro` = 1
`grep -c "data.warning" src/pages/feedback.astro` = 2
`grep -c "data.commitErrors" src/pages/feedback.astro` = 1
`grep -c "CR-01" src/pages/feedback.astro` = 2

Inject's m.cap branch confirmed at line 1159; m.errors branch confirmed at line 1150. Both reachable.

#### CR-02 — Server cap reads spoofable descriptor (CLOSED)

**File:** `src/pages/api/feedback/submit.ts:320-376`
**Commits:** 9409ac6 (helper + reducer), daaf395 (smoke harness)

`approxDecodedBytes(b64)` at line 328:
- Strips data-URL prefix (splits on `,`)
- Computes padding count (2 for `==`, 1 for `=`, 0 otherwise)
- Returns `Math.floor((s.length * 3) / 4) - pad`

`totalBytes` reducer at line 365-367 sums `approxDecodedBytes(e?.image?.dataBase64 || '')`.
Old descriptor reference `e.image.bytes` appears ONLY in comments (line 364) and imageMeta echo (lines 216, 458) — not in the cap computation.

Smoke scenario 4 (lines 307-355 of smoke-feedback-v2.mjs):
- Reads `MAX_BATCH_BYTES` dynamically from submit.ts source
- Constructs `bigB64 = 'A'.repeat(perEditB64Len)` where perEditB64Len = `ceil((capBytes+1024)*4/3/2)+4`
- Ships two edits with this base64 to prove the SUM-across-edits reducer works
- `'AAAA'` stub: 0 occurrences (gone)

Master merge-gate: `5 passed, 0 failed` (scenario 4: PASS)

#### CR-03 — Silent partial photo-commit failure (CLOSED)

**Server half** — `src/pages/api/feedback/submit.ts:580-603` (commit eac7ec0):
```
const commitErrors = finalMachineEdits
  .map((m, i) => (m.commitError ? { index: i, error: m.commitError } : null))
  .filter((x): x is { index: number; error: string } => x !== null);
```
When commitErrors.length > 0: response includes `warning: '<N> of <M> photo(s) failed to upload'` and `commitErrors: [...]`.
When commitErrors.length === 0: response is `{ ok: true, issueNumber, issueUrl }` (byte-identical to pre-fix).
`grep -c "commitErrors" submit.ts` = 5; `grep -n "warning.*photo" submit.ts` = lines 300 (v1) and 597 (v2).

**UI half — inject** — `public/feedback-inject.js:1110-1125` (commit 06be1b8):
`if (m.ok && m.warning)` branch at line 1113 placed BEFORE `if (m.ok)` clean-success at line 1126.
Branch body: `state = STATE.STAGED; renderChip(loadStaged().length); renderPanel({ capMessage: warnMsg, ... })`.
Confirmed: clearStaged(), removeChip(), destroyStagedPanel(), clearDraft() NOT called in this branch.
`grep -c "m.warning" public/feedback-inject.js` = 2
`grep -c "CR-03" public/feedback-inject.js` = 1

**Relay** — `src/pages/feedback.astro:198-199` (commit ce4b21e):
`data.warning` and `data.commitErrors` spread onto success postMessage (same commit as CR-01 fix).

#### OPS-01 — Cache-bust version bump (CLOSED)

**File:** `src/lib/feedback-version.ts:12` (commit cbffdde)
`export const FEEDBACK_INJECT_VER = '3';`
`grep -c "FEEDBACK_INJECT_VER = '2'" src/lib/feedback-version.ts` = 0
`grep -c "FEEDBACK_INJECT_VER = '3'" src/lib/feedback-version.ts` = 1
Line count: 12 (unchanged; comment block preserved)
Both consumers resolve '3' automatically without manual touch (BaseLayout.astro imports at line 3, uses at line 1025; feedback.astro imports as VER at line 5).

### OPS-02 Fence Final Result

`git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts | wc -l` = **0**

Phase-4-era commits touching fenced paths: **0** (git log --since="2026-05-19" -- [fenced paths] returns empty; git log a5e4a67..main -- [fenced paths] returns only pre-phase-4 Phases 1-3 commits).

OPS-02 fence: CLEAN.

### Master Merge-Gate Result

`npx tsx scripts/smoke-feedback-v2.mjs`:
```
PASS: v1 back-compat (change-wording)
PASS: v2 happy path (3 valid edits)
PASS: v2 cap violation: 11 edits
PASS: v2 cap violation: photo bytes
PASS: v2 per-edit error

5 passed, 0 failed
```

Master merge-gate: **PASS**

### Regression Scan

**v1 path integrity:** `handleV1` at lines 164-317 is unchanged by gap-closure commits (9409ac6 and eac7ec0 each modified only the handleV2Batch region and the approxDecodedBytes helper). `git show 9409ac6 -- src/pages/api/feedback/submit.ts | grep "^[-+]" | grep handleV1` = empty. `git show eac7ec0 -- src/pages/api/feedback/submit.ts | grep "^[-+]" | grep handleV1` = comment reference only. Smoke scenario 1 (v1 back-compat): PASS.

**D-03 cap constants:** `MAX_BATCH_BYTES = 3 * 1024 * 1024` unchanged in both submit.ts (line 53) and feedback-inject.js (line 32).

**Previously SATISFIED requirement IDs (21):** All 21 requirements that passed the initial verification continue to pass — no regressions observed. Smoke harness confirms scenarios 1, 2, 3, 5 unchanged.

**Previously BLOCKED IDs now SATISFIED:** API-03 (UI surfacing via CR-01), API-05 (atomicity surfaced via CR-03), API-06 (server cap + UI highlighting via CR-01 + CR-02 + CR-03).

**OPS-02 fenced paths:** No phase-4 commits touched fenced files (confirmed above).

**Debt markers:** No TBD/FIXME/XXX in modified files.

### Final Verdict

All 3 BLOCKER gaps from the initial verification are CLOSED. No regressions. Master merge-gate green. OPS-02 fence clean. Phase 4 goal fully achieved.

**Status: PASSED — 6/6 Success Criteria verified, 23/23 requirement IDs satisfied.**

---

_Initial verification: 2026-05-21T05:08:16Z_
_Re-verification: 2026-05-21T10:30:00Z_
_Verifier: Claude (gsd-verifier)_
