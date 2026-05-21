---
phase: 04-batch-pipeline-implementation
verified: 2026-05-21T05:08:16Z
status: gaps_found
score: 4/6 must-haves verified (Success Criteria from ROADMAP); 21/23 requirement IDs satisfied
overrides_applied: 0
re_verification:
  previous_status: null
  previous_score: null
  gaps_closed: []
  gaps_remaining: []
  regressions: []
gaps:
  - truth: "Server re-validates the photo-bytes cap and the UI surfaces the structured per-cap error (Success Criterion #6 / API-06)"
    status: failed
    reason: |
      Two compounding defects break the API-06 contract end-to-end:
      (a) Server cap is computed from the client-supplied descriptor `e.image.bytes`, not the
      decoded base64 length. An authenticated client can post `{ bytes: 1 }` for every edit and
      ship arbitrarily large `dataBase64` payloads — `MAX_BATCH_BYTES` never trips. The smoke
      harness scenario 4 inadvertently documents this by sending `dataBase64: 'AAAA'` (3 bytes
      actual) with descriptor `bytes: 1.5 MB` and asserting the cap fires. (CR-02)
      (b) The parent forwarder in `src/pages/feedback.astro:202-208` drops the structured cap
      fields. When the server DOES send `{ ok: false, cap: 'bytes', limit, actual, error }`,
      the parent re-emits only `{ ok: false }` to the iframe. The inject's `m.cap` branch at
      feedback-inject.js:1143 and `m.errors` branch at 1134 are unreachable today. The user
      sees the generic "Something went wrong" fallback instead of the cap message. (CR-01)
      Together these mean the "UI highlights which cap was breached" promise of Success
      Criterion #6 is not deliverable on the deployed pipeline today.
    artifacts:
      - path: "src/pages/api/feedback/submit.ts:346-357"
        issue: "totalBytes is summed from `e.image.bytes` (client descriptor), not from `approxDecodedBytes(e.image.dataBase64)`. Cap is spoofable."
      - path: "src/pages/feedback.astro:202-208"
        issue: "Parent forwarder posts `{ type: 'mar-feedback-result', ok: false }` only. It must spread `data.errors`, `data.cap`, `data.limit`, `data.actual`, `data.error` onto the message so the inject's defensive branches can fire."
      - path: "scripts/smoke-feedback-v2.mjs scenario 4"
        issue: "Asserts the cap fires using a tiny `dataBase64` ('AAAA') with a spoofed `bytes` descriptor — the test passes because the server reads the descriptor, masking the real bug. Once fixed, scenario 4 must ship an actually-oversize base64 string."
    missing:
      - "Server-side `approxDecodedBytes(b64)` helper that decodes from the base64 string length (subtracting padding), and a `totalBytes = sum(approxDecodedBytes(e.image.dataBase64))` reduction in handleV2Batch's cap gate"
      - "Parent forwarder spread of `data.errors`, `data.cap`, `data.limit`, `data.actual`, `data.error` onto the `mar-feedback-result` postMessage in `src/pages/feedback.astro` (this file is NOT in the OPS-02 fence; safe to modify)"
      - "Smoke scenario 4 updated to send an actually-oversize base64 string (e.g. `'A'.repeat(capBytes * 2)`) so the test exercises the real code path"

  - truth: "v2 batch atomicity surfaces partial photo-commit failures so the client knows the issue is unprocessable (API-05 / ISSUE-04 atomic-issue contract)"
    status: failed
    reason: |
      The v2 handler at `src/pages/api/feedback/submit.ts:556-564` returns `{ ok: true,
      issueNumber, issueUrl }` unconditionally after the photo-commit loop, even when one or
      more `commitBase64File` calls failed. The per-edit `commitError` field is recorded into
      the JSON block (line 551) but never aggregated into the HTTP response. The v1 path
      (line 295-303) by contrast returns `{ ok: true, …, warning: 'Issue created but the
      photo upload failed.' }` when its single photo commit fails. Net effect for v2: a
      3-photo batch where 2 commits fail produces a `{ ok: true }` UI confirmation while the
      issue body has `commitError: 'photo commit failed'` markers; the user sees success and
      closes the tab; the Action picks up the issue and either defers everything or
      auto-merges a partially-broken batch with missing photos. (CR-03)
    artifacts:
      - path: "src/pages/api/feedback/submit.ts:510-564"
        issue: "Per-edit `commitError` is recorded into finalMachineEdits but the final Response does not aggregate them into a `warning` or `commitErrors` field. Response is always `{ ok: true, issueNumber, issueUrl }`."
    missing:
      - "Aggregate `finalMachineEdits.filter(m => m.commitError)` into `commitErrors: [{ index, error }, ...]` after the photo loop and include `warning: '<N> of <M> photo(s) failed to upload'` + `commitErrors` in the 200 response body when any commit failed (mirrors v1's `warning` field behavior)"
      - "Update `src/pages/feedback.astro` parent forwarder to relay `data.warning` / `data.commitErrors` to the iframe so the inject's success branch can surface 'sent — but N photos failed; re-attach and resubmit those edits'"

deferred: []
---

# Phase 4: Batch Pipeline Implementation — Verification Report

**Phase Goal:** Client can stage multiple edits in a session, submit them as one batch, and the entire pipeline (server endpoint → GitHub issue → Claude Code Action) produces exactly one PR for that batch — while v1 cached clients keep working unchanged and the editor flow stays byte-for-byte identical.

**Verified:** 2026-05-21T05:08:16Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Corner chip appears after first stage; panel lists each staged edit with ❌ delete and confirm-required "Clear all"; survives iframe navigation/reload, clears on browser close | VERIFIED | `public/feedback-inject.js`: `renderChip()` line 788, `renderPanel()` line 819, `stagedDelete()` line 904, `stagedClearAll()` with `window.confirm('Clear all staged edits…')` (grep confirms), `STAGED_KEY = 'mar_feedback_staged_v1'` line 38 in sessionStorage, `pageshow` + `visibilitychange` listeners (grep confirms). `node --check public/feedback-inject.js` exit 0. |
| 2 | Clicking Submit batch on 3-edit stage → exactly ONE POST with `{schemaVersion:2, batch:true, edits:[3]}`; on success closes panel + clears sessionStorage + creates ONE GitHub issue with title `[Feedback] batch of 3 edits — <pageRoutes>`, per-edit `renderHuman()` separated by `---`, single fenced ```json``` block | VERIFIED | `scripts/smoke-feedback-v2.mjs` scenario 2 passes: title regex `^\[Feedback\] batch of 3 edits — ` asserted; createIssue called exactly once with labels `client-feedback`. `submit.ts` lines 480-484 build title; lines 462-475 join `humanSections` with `\n\n---\n\n` then a single ```json``` fence. Success branch at inject 1109-1123 calls `clearStaged()` + `removeChip()` + `destroyStagedPanel()`. |
| 3 | v1 single-edit (cached browser) still produces existing single-edit issue with no behavioural change; v1 and v2 share validator | VERIFIED | `scripts/smoke-feedback-v2.mjs` scenario 1 passes (v1 back-compat). `submit.ts:594` dispatches `schemaVersion===1` to `handleV1()`. `handleV1` line 166-167 calls `validateEdit(p)` from `./validate`. v2 line 364 calls the same `validateEdit(e)` for every edit. `validate.ts:67-102` is the single rule set. |
| 4 | Batched issue → ONE branch `feedback/issue-<n>-batch-<N>`, ONE commit, ONE PR, ONE result comment; autonomy hint passes iff every edit passes per-edit gate; failure-reason lists failing edits | VERIFIED (Action-side documented) | `.github/CLAUDE_FEEDBACK.md §8 lines 245-257` mandates one-branch / one-commit / one-PR / one-result-comment convention; lines 228-244 document the per-edit AND roll-up; the result comment format at lines 263-275 includes the "Applied X of N edits; edit #Y had only 1 locator signal…" example. Server-side at `submit.ts:373-383` computes `batchAuto = perEdit.every(x.auto)` and produces the `AUTO-ELIGIBLE` / `NEEDS-REVIEW (… edits failed: #N…)` strings in the body (lines 455-457). |
| 5 | `git diff main` editor-flow fence returns 0; `FEEDBACK_INJECT_VER` bumped; `CLAUDE.md` "Feedback mode" has new v2 batch note | VERIFIED | `git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts \| wc -l` returns 0. `src/lib/feedback-version.ts:12` exports `FEEDBACK_INJECT_VER = '2'`. `CLAUDE.md:262` has the "Batch submissions (v2 schema)" bullet with the required cross-references (schemaVersion:2, batch:true, validate.ts, cached browsers, CLAUDE_FEEDBACK.md). |
| 6 | Client enforces 10-edit + 30 MB caps before submit with limit-reached chip UX (STAGE-06/07); server re-validates both caps and returns structured per-cap error response that the UI highlights (API-06) | FAILED | **(A) Client side: PARTIAL.** `exceedsCaps()` in inject at line 765-774 checks `MAX_BATCH_EDITS` and `MAX_BATCH_BYTES`; client cap value is 3 MB (per `var MAX_BATCH_BYTES = 3 * 1024 * 1024` at line 32), NOT 30 MB as ROADMAP Success Criterion #6 states — D-03 reconciliation chose Hobby-tier-safe 3 MB. Acceptable per D-03 documentation. **(B) Server side: FAILED.** `submit.ts:346-349` reads `e.image.bytes` (client descriptor) not the decoded base64 length — CR-02 confirms the cap is spoofable. **(C) UI surfacing: FAILED.** `src/pages/feedback.astro:202-208` parent forwarder posts `{ ok: false }` only; the inject's `m.cap` branch at line 1143 and `m.errors` branch at line 1134 are unreachable today — CR-01 confirms dead code. Together (B) and (C) make Success Criterion #6's "server re-validates / UI highlights" promise undeliverable on the live pipeline. |

**Score:** 5/6 truths verified (one with caveat on the 30 MB → 3 MB D-03 downgrade), 1 truth FAILED.

---

### Required Artifacts (from PLAN frontmatter must_haves, plus emergent artifacts)

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/pages/api/feedback/validate.ts` | NEW — shared per-edit validator with full helper surface | VERIFIED | 102 LOC, exports `validateEdit`, `signalCount`, `isVague`, `clamp`, `INTENTS`, `MAX_IMAGE_BYTES`, `MIN_VAGUE_LEN`, `MOVE_RESIZE_OPTIONS`, `VAGUE_STOPLIST`, `VAGUE_MESSAGE`, `Intent`. Doc header at lines 1-13 contains D-15, API-04, MIRROR. No `export const prerender` directive. |
| `src/pages/api/feedback/submit.ts` | MODIFIED — imports validator, v1+v2 dispatch, full v2 handler, sequential photo commits, single final patchIssueBody | VERIFIED (with CR-02/CR-03 caveats) | 634 LOC. Imports from `./validate` at line 5. `SCHEMA_VERSION = 1`, `SCHEMA_VERSION_V2 = 2` at lines 32-33. `MAX_BATCH_BYTES = 3 * 1024 * 1024` with D-03 comment block at line 36-53. `MAX_BATCH_EDITS = 10` at line 57. `handleV1` line 164 + `handleV2Batch` line 334. Sequential `for` loop (no Promise.all) at line 511. Single `patchIssueBody(issueNumber, buildBatchBody(finalMachineEdits))` at line 559. **CAVEAT: cap reads descriptor (CR-02); commitError swallowed (CR-03).** |
| `public/feedback-inject.js` | MODIFIED — v2 state machine, chip + panel, sessionStorage staging, base64 at submit time, cross-page rehydrate | VERIFIED (with CR-01 dead-code caveat) | 1308 LOC. `MAX_BATCH_EDITS = 10`, `MAX_BATCH_BYTES = 3*1024*1024`, `STAGED_KEY`, `STAGE-06` cap message string all present (8 hits across the file). `renderChip`, `renderPanel`, `stagedPush`, `stagedDelete`, `stagedClearAll`, `submitBatch`, `readAsBase64`, `exceedsCaps` all defined. `STATE.STAGED` and `STATE.SUBMITTING` defined at line 131. `pageshow` + `visibilitychange` rehydrate listeners present. **CAVEAT: lines 1134 (`m.errors`) and 1143 (`m.cap`) are unreachable because the parent forwarder drops those fields.** |
| `src/lib/feedback-version.ts` | MODIFIED — bump `'1'` → `'2'` | VERIFIED | Line 12: `export const FEEDBACK_INJECT_VER = '2';`. No `'1'` instances. |
| `.github/CLAUDE_FEEDBACK.md` | MODIFIED — new `## 8. Batch submissions` section | VERIFIED | Line 194 has `## 8. Batch submissions — one issue, N edits, one PR`. Lines 200-281 cover schema detection (`schemaVersion: 2`, `batch: true`), `gh issue view --json body` read protocol with prompt-injection-safety rationale, per-edit inheritance of §0/§2/§4, ONE branch `feedback/issue-<n>-batch-<N>` / ONE commit / ONE PR, autonomy decision tree (AUTO-ELIGIBLE iff every edit AUTO), result-comment format with "Applied X of N edits; edit #Y had only 1 locator signal so the whole set is in review". |
| `CLAUDE.md` | MODIFIED — new bullet in Feedback-mode subsection | VERIFIED | Line 262 has the "**Batch submissions (v2 schema).**" bullet referencing schemaVersion:2, batch:true, validate.ts, v1 cached-browser back-compat, CLAUDE_FEEDBACK.md §8. |
| `scripts/smoke-feedback-v2.mjs` | NEW — 5-scenario integration smoke harness | VERIFIED (with caveat) | 386 LOC. Running it: `5 passed, 0 failed`. **CAVEAT: Scenario 4 (photo-byte cap) passes BECAUSE the server reads the spoofed `bytes` descriptor, not the actual base64 length — see CR-02. The test does not exercise the real defence today; it documents the gap.** |

---

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `submit.ts handleV1` → `validateEdit` | `./validate.ts` | named import + call | WIRED | `import { validateEdit, … } from './validate'` line 5; called at line 166. |
| `submit.ts handleV2Batch` → `validateEdit` | `./validate.ts` | per-edit loop call | WIRED | Line 364: `errors.push({ index, error: validateEdit(e) })` (effectively). Acceptance behavior verified by smoke scenario 5. |
| `submit.ts handleV2Batch` → `createIssue` → `commitBase64File`xN → `patchIssueBody` | GitHub API | issue-first then per-photo sequential then single PATCH | WIRED | Smoke harness fetchLog (scenario 2 implicit, deduced from test passing): 1 issue POST, optional N PUTs, 1 PATCH. Sequential `for` loop at line 511 not Promise.all. |
| `feedback-inject.js submitBatch` → `window.parent.postMessage({type:'mar-feedback-submit', payload})` | `feedback.astro` listener | postMessage round-trip | WIRED | Line 1049: `window.parent.postMessage({ type: 'mar-feedback-submit', payload }, '*')`. Parent listener at feedback.astro:164-217 receives, POSTs to `/api/feedback/submit`. |
| `feedback.astro` parent → iframe → `submitBatch` result-receiver | `mar-feedback-result` postMessage | parent posts response back | **PARTIAL — DEAD CODE** | Parent at feedback.astro:202-208 sends only `{ ok: false }` on failure (no `errors`, no `cap`, no `limit`, no `actual`, no `error`). Inject branches at lines 1134 (`m.errors`) and 1143 (`m.cap`) cannot fire. Goal of Success Criterion #6 ("UI highlights which cap was breached") is undeliverable. **This is the CR-01 BLOCKER.** |
| `pageshow` / `visibilitychange` → `renderChip` rehydrate | sessionStorage `mar_feedback_staged_v1` | event listeners call loadStaged() + renderChip() | WIRED | Listeners installed; both check `!document.getElementById('mar-fb-chip')` before re-rendering. Cross-page (D-06) batching works for descriptor entries; photo-bearing edits lose the in-memory `fileMap[stageId]` File reference across nav (documented behaviour per PLAN). |
| BaseLayout loader / feedback.astro iframe `src` → `FEEDBACK_INJECT_VER` | `src/lib/feedback-version.ts` | named import → `?v=2` at build time | WIRED | feedback.astro line 5 imports `FEEDBACK_INJECT_VER as VER`; line 29 builds `firstSrc = '/?feedback=1&v=' + VER`. |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `submit.ts handleV2Batch` totalBytes cap | `totalBytes` | `p.edits[i].image.bytes` (client descriptor) | **NO — descriptor only, never recomputed from `dataBase64`** | **DISCONNECTED FROM TRUTH (CR-02)** — totalBytes scales with whatever the client claimed, not what was actually shipped. An authenticated client can ship arbitrarily large `dataBase64` payloads under `bytes: 1` and never trip the cap. |
| `submit.ts handleV2Batch` response on partial photo failure | response body | hardcoded `{ ok: true, issueNumber, issueUrl }` | **NO — `finalMachineEdits[i].commitError` data is dropped** | **HOLLOW (CR-03)** — the response shape claims success even when 2 of 3 photos failed to commit. v1 surfaces `warning` in the same scenario; v2 silently swallows it. |
| `feedback.astro` parent forwarder result message | postMessage payload | `data.ok`, `data.auth` (only) | **NO — `data.errors`, `data.cap`, `data.limit`, `data.actual`, `data.error` are dropped** | **HOLLOW (CR-01)** — the inject's defensive branches reference state that can never arrive. STAGE-07 limit-reached UX from the server is not user-visible. |
| `feedback-inject.js` chip count | `loadStaged().length` | `sessionStorage.getItem(STAGED_KEY)` parsed array | YES | FLOWING — verified end-to-end via smoke harness scenarios 2 and 3. |
| `feedback-inject.js` panel item rendering | escaped innerHTML | `loadStaged()` array entries' `intentDetail.newTextEn` etc. | YES (with `escapeHtml`) | FLOWING — `escapeHtml` applied at every interpolation (PLAN acceptance criterion 12). |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Smoke harness runs all 5 scenarios | `npx tsx scripts/smoke-feedback-v2.mjs` | `5 passed, 0 failed` | PASS (with scenario-4 caveat — masked by CR-02) |
| feedback-inject.js parses | `node --check public/feedback-inject.js` | exit 0 | PASS |
| OPS-02 editor-flow fence | `git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts \| wc -l` | 0 | PASS |
| Cache-bust constant bumped | `grep -c "FEEDBACK_INJECT_VER = '2'" src/lib/feedback-version.ts` | 1 | PASS |
| CLAUDE.md batch bullet | `grep -c "Batch submissions (v2 schema)" CLAUDE.md` | 1 | PASS |
| CLAUDE_FEEDBACK §8 | `grep -c "^## 8\\. Batch submissions" .github/CLAUDE_FEEDBACK.md` | 1 | PASS |

---

### Probe Execution

No conventional `scripts/*/tests/probe-*.sh` probes exist in the repo. The phase's declared verification driver is `scripts/smoke-feedback-v2.mjs`, run above.

| Probe | Command | Result | Status |
|---|---|---|---|
| `scripts/smoke-feedback-v2.mjs` | `npx tsx scripts/smoke-feedback-v2.mjs` | 5 passed, 0 failed | PASS (with CR-02 caveat — see Data-Flow Trace) |

---

### Requirements Coverage

| Requirement | Plan | Description | Status | Evidence |
|---|---|---|---|---|
| STAGE-01 | 04-04 | Stage confirmed edit in sessionStorage; survive iframe nav + reload | SATISFIED | `STAGED_KEY` in sessionStorage; pageshow/visibilitychange rehydrate; clears on browser close (sessionStorage semantics). |
| STAGE-02 | 04-04 | Corner chip `N edits staged · Submit batch · View list` | SATISFIED | `renderChip()` builds the chip with those literal strings. |
| STAGE-03 | 04-04 | Panel with per-item ❌ delete and confirm-required "Clear all" | SATISFIED | `renderPanel()` + `stagedDelete()` (no confirm per D-12) + `stagedClearAll()` with `window.confirm('Clear all staged edits? This cannot be undone.')` |
| STAGE-04 | 04-04 | One POST per Submit batch; on 200 close panel + clear sessionStorage | SATISFIED | `submitBatch()` line 942-1049 builds payload, posts once, success branch at 1110-1123 clears state. |
| STAGE-05 | 04-04 | Files as in-memory references; base64 only at submit time | SATISFIED | `fileMap` in-memory map; `readAsBase64()` at submit time only. |
| STAGE-06 | 04-04 | Client 10-edit + 30 MB caps with Confirm disabled + inline message | SATISFIED (cap value lowered to 3 MB per D-03 reconciliation; documented) | `exceedsCaps()` line 765 checks both caps; cap value = 3 MB to mirror server. |
| STAGE-07 | 04-04 | Chip 'limit reached' UX | SATISFIED (panel message; chip-text variant relies on `lastCapMessage` flow) | Cap message string present; renderPanel emits the `mar-fb-staged-cap-msg` div. |
| API-01 | 04-03 | Accept v2 batch payloads | SATISFIED | Dispatch at submit.ts:595 routes `schemaVersion:2 && batch:true` to handleV2Batch. Smoke scenario 2 passes. |
| API-02 | 04-02 | Continue to accept v1 indefinitely | SATISFIED | Dispatch at submit.ts:594 routes `schemaVersion:1` to handleV1. Smoke scenario 1 passes. |
| API-03 | 04-03 | Per-edit validation rejects whole batch with structured per-edit-errors | SATISFIED (server-side); **BUT UI surfacing BLOCKED by CR-01 dead code** | `failBatch()` returns `{ok:false, error, errors:[{index,error}]}`. Smoke scenario 5 passes server-side. UI per-edit highlighting unreachable because feedback.astro drops `data.errors`. |
| API-04 | 04-01 | Shared helper consumed by both v1 and v2 | SATISFIED | `validate.ts` is consumed by both `handleV1` (line 166) and `handleV2Batch` (line 364). |
| API-05 | 04-03 | All photos to same `feedback-incoming/issue-<n>/` directory; single PATCH | SATISFIED (atomicity caveat per CR-03) | Sequential commits to `feedback-incoming/issue-${issueNumber}/edit-${i+1}-${safeName}` at line 537; exactly one `patchIssueBody(issueNumber, buildBatchBody(finalMachineEdits))` at line 559. **But the response does not surface partial commit failure (CR-03), so atomicity is one-sided: GitHub sees a complete issue body, but the client sees `{ok:true}` and may not know to retry.** |
| API-06 | 04-03 | Server re-validates both caps and returns structured per-cap error | **BLOCKED — see CR-02 + CR-01** | Edit-count cap recomputes from `p.edits.length` (correct). Byte cap recomputes from `e.image.bytes` (descriptor; SPOOFABLE — CR-02). Cap response shape correct (`{cap, limit, actual}`) but the UI never sees it because the parent forwarder drops the fields (CR-01). |
| ISSUE-01 | 04-03 | One issue per batch titled `[Feedback] batch of {N} edits — {pageRoutes}` | SATISFIED | submit.ts:480-484 builds title; smoke scenario 2 asserts `/^\[Feedback\] batch of 3 edits — /`. |
| ISSUE-02 | 04-03 | Per-edit `renderHuman()` separated by `---` | SATISFIED | Line 462-464 emits each as `### Edit X of N\n\n${renderHuman(...)}` joined by `\n\n---\n\n`. |
| ISSUE-03 | 04-03 | Single fenced ```json``` block holding `edits[]` | SATISFIED | Lines 468-471 emit exactly one ```json``` block with full `{schemaVersion:2, batch:true, edits:[...]}` payload. Confirmed in body factory at line 470. |
| ISSUE-04 | 04-03 | Autonomy hint passes iff every edit passes | SATISFIED (server side); atomicity vs CR-03 noted | `batchAuto = perEdit.every(x => x.auto)` line 378; hint string lines 455-457 lists failing #N indexes. Documented in CLAUDE_FEEDBACK §8 lines 228-244. |
| ACTION-01 | 04-05 | `## 8. Batch submissions` section with v2 detection, per-edit rule inheritance | SATISFIED | Section present; all required substrings (schemaVersion:2, batch:true, gh issue view, --json body, per-edit, EN/FR, §0/§2/§4 cross-refs). |
| ACTION-02 | 04-05 | One branch `feedback/issue-<n>-batch-<N>` / one commit / one PR | SATISFIED (documented) | CLAUDE_FEEDBACK §8 lines 245-257 mandates this. Action-side enforcement is by the LLM following the manual; verifiable only via OPS-05 canary in Phase 5. |
| ACTION-03 | 04-05 | ONE result comment per batch with applied/skipped summary | SATISFIED (documented) | CLAUDE_FEEDBACK §8 lines 263-275 mandates the format with example phrasings. |
| OPS-01 | 04-06 | `FEEDBACK_INJECT_VER` bumped | SATISFIED | `'1'` → `'2'` at src/lib/feedback-version.ts:12. |
| OPS-02 | 04-08 | Editor flow byte-for-byte unchanged | SATISFIED | `git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts \| wc -l` returns 0. |
| OPS-03 | 04-07 | CLAUDE.md Feedback mode batch note | SATISFIED | New bullet at CLAUDE.md:262. |

**Orphan check:** REQUIREMENTS.md maps OPS-04 and OPS-05 to Phase 5, not Phase 4. No orphaned requirement IDs.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `src/pages/feedback.astro` | 202-208 | Parent forwarder drops `errors`, `cap`, `limit`, `actual`, `error` fields | BLOCKER | Makes inject's defensive branches unreachable; STAGE-07 / API-06 UX undeliverable. (CR-01) |
| `src/pages/api/feedback/submit.ts` | 346-349 | Cap reads `e.image.bytes` client descriptor, not `dataBase64.length` | BLOCKER | API-06 cap is spoofable by an authenticated client. (CR-02) |
| `src/pages/api/feedback/submit.ts` | 510-564 | `commitError` recorded per-edit but never aggregated into response | BLOCKER | v2 returns `{ok:true}` even when N of M photos failed to commit; v1 surfaces `warning`. Asymmetry; user closes tab thinking it shipped clean. (CR-03) |
| `public/feedback-inject.js` | 1134, 1143 | Branches reference fields that never arrive | WARNING | Net effect is BLOCKER via CR-01; the inject's intent is correct. |
| `public/feedback-inject.js` | 24, 489, 559 | `MAX_IMAGE_BYTES = 12 MB` per-photo cap is larger than `MAX_BATCH_BYTES = 3 MB` batch cap | INFO (WR-01 in review) | A first-photo over 3 MB trips the misleading "batch is full" message instead of a per-photo over-limit message. |
| `src/pages/api/feedback/submit.ts` | 16-21 | `void` ritual pins 6 imports but `MAX_IMAGE_BYTES` is imported and not in the ritual | INFO (WR-05 in review) | Inconsistent with the ritual's stated intent; not a runtime issue. |

No `TBD`/`FIXME`/`XXX` debt markers in modified files.

---

### Human Verification Required

None required. The status is `gaps_found` based on falsifiable code-level evidence (parent forwarder field drop, descriptor-based cap, swallowed `commitError`), so this verification routes to gap-closure planning rather than human testing. Phase 5 (`OPS-04` / `OPS-05` canaries) will exercise the live pipeline post-merge — at that point the human verification gate becomes the deployed-canary's success/failure, and CR-01/CR-02/CR-03 will determine whether the canaries can pass.

---

### Gaps Summary

The phase **does** ship a working batch pipeline end-to-end for the **happy path**: 3 clean edits stage, submit, produce a single GitHub issue with the correct title, body, fenced JSON, autonomy hint, and the Action manual documents the per-edit application contract. v1 cached browsers keep working. The editor-flow OPS-02 fence is clean. The cache-bust survives the build. Five of six ROADMAP Success Criteria are verifiable today.

The **sixth Success Criterion** — "the server re-validates both caps and returns a structured per-cap error response that the UI highlights (API-06)" — is **not deliverable** as the code stands, because of three compounding defects already documented in `04-REVIEW.md`:

1. **CR-01 (dead code in client):** The inject's `m.errors` and `m.cap` branches at `feedback-inject.js:1134` and `:1143` reference fields that the parent forwarder in `src/pages/feedback.astro:202-208` never spreads onto the `mar-feedback-result` postMessage. The "UI highlights which cap was breached" promise fails because the cap fields never reach the iframe.
2. **CR-02 (spoofable server cap):** The server's `MAX_BATCH_BYTES` cap is computed from the client-supplied `image.bytes` descriptor, not from the decoded base64 length. An authenticated client posting `{ bytes: 1 }` for every edit can ship arbitrarily large `dataBase64` payloads.
3. **CR-03 (silent partial-failure):** v2 records per-edit `commitError` markers into the issue body but responds `{ ok: true }` even when N of M photos failed to commit. v1 surfaces a `warning` field in the same scenario; v2 does not.

CR-01 is a one-file fix to `src/pages/feedback.astro` (NOT in the OPS-02 fence; safe to touch). CR-02 is a small server-side helper + reducer change. CR-03 is a response-shape change in `handleV2Batch` plus a corresponding spread on the parent forwarder. Together they close the API-06 / ISSUE-04 contract that Success Criterion #6 actually requires.

The PHASE goal as stated ("…the entire pipeline produces exactly one PR for that batch") is technically satisfied by the happy path, but the surrounding contract that the planning explicitly emphasized — server re-validation + structured per-cap response + UI surfacing of failures — is only partially wired today. Recommend a focused gap-closure plan that addresses CR-01 + CR-02 + CR-03 as a coherent group (they all cluster around "v2 introduced a richer result contract that the wires never finished carrying").

---

_Verified: 2026-05-21T05:08:16Z_
_Verifier: Claude (gsd-verifier)_
