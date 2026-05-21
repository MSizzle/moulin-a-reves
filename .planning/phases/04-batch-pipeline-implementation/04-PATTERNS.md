# Phase 4: Batch Pipeline Implementation - Pattern Map

**Mapped:** 2026-05-20
**Files analyzed:** 6 (5 modified + 1 conditionally-new)
**Analogs found:** 6 / 6 (every file is an extension of itself — analogs are in-file existing patterns)

> **CRITICAL framing:** Phase 4 is a pure-extension phase. The "closest analog" for every file being modified is **the file itself** at its current state. The patterns to copy are *already in the same file* — the planner must mirror them, not invent new ones. For the one potentially-new file (the shared validator), the analog is `submit.ts` itself (extract-in-place).

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `public/feedback-inject.js` (MODIFY, ~710 → ~1100 LOC) | client-side overlay / state machine | event-driven + request-response | Itself (existing v1 single-edit flow + `?edit=1` sibling `editor-inject.js`) | exact (in-file extension) |
| `src/pages/api/feedback/submit.ts` (MODIFY, 364 → ~550 LOC) | API route (controller + service) | request-response (JSON-in, JSON-out + side-effects to GitHub) | Itself (existing v1 single-edit handler) + `src/pages/api/feedback/clarify.ts` for GET/json/unauthorized helpers | exact (in-file branch) |
| `src/lib/feedback-version.ts` (MODIFY, 12 LOC) | config constant | n/a | Itself | exact (single-line bump) |
| `.github/CLAUDE_FEEDBACK.md` (MODIFY, 192 → ~250 LOC) | operating manual (LLM agent instructions) | n/a (documentation) | Itself §3 (Photo replacement) and §4 (Autonomy gate) — closest existing structural sections | exact (new `## 8.` mirrors `## 3.` / `## 4.` shape) |
| `CLAUDE.md` §"Feedback mode" (MODIFY, +1 line) | architectural documentation | n/a | Existing "Cache-bust constant" bullet (one-line tone) | exact (single bullet) |
| `src/pages/api/feedback/validate.ts` (NEW — planner discretion per D-15) | shared helper (validator module) | function-call (pure) | Helpers inside `submit.ts` (`isVague`, `signalCount`, intent-specific blocks ll. 158–182) — extract verbatim | role-match (extract-then-import) |

### Out-of-scope reminder (must NOT appear in any plan / modified set per D-13 / OPS-02)

`public/editor-inject.js`, `public/editor/**`, `public/guardrails.js`, `src/pages/api/site/save.ts`, `src/pages/api/site/publish.ts`, `middleware.ts`. The merge gate is `git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts` returning zero lines.

---

## Pattern Assignments

### `src/pages/api/feedback/submit.ts` (API route — controller + service)

**Analog:** Itself. The v2 batch path is a sibling branch that lives next to the existing v1 path; ALL of the following idioms must be preserved and reused.

**1. Route-file boilerplate** (`submit.ts:1-4`):
```typescript
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth } from '../../../lib/auth';
```
Apply to: every API route in this phase. `export const prerender = false;` is THE FIRST LINE — non-negotiable (CLAUDE.md "API routes must declare `prerender = false;`").

**2. GitHub env + headers** (`submit.ts:7-8`, `52-56`):
```typescript
const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
const GITHUB_REPO = import.meta.env.GITHUB_REPO;

const ghHeaders = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
};
```
Apply to: any new GitHub-touching code. Do not introduce a second header builder. Mirrored verbatim in `clarify.ts:7-14`.

**3. Shared-contract constant block** (`submit.ts:10-35`):
```typescript
// ---------------------------------------------------------------------------
// Shared contract — KEEP IN SYNC with public/feedback-inject.js (the client
// validates first, this re-validates server-side; the client cannot be
// trusted). If you change a rule here, change it there too.
// ---------------------------------------------------------------------------
const SCHEMA_VERSION = 1;
const INTENTS = ['change-wording', 'replace-photo', 'move-resize', 'remove', 'something-else'] as const;
type Intent = (typeof INTENTS)[number];

const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12 MB
const MIN_VAGUE_LEN = 25;
const MOVE_RESIZE_OPTIONS = [...] as const;
const VAGUE_STOPLIST = [...];
```
Apply to: the v2 path. Concretely:
- KEEP `SCHEMA_VERSION = 1` as-is. ADD `const SCHEMA_VERSION_V2 = 2;` next to it (or convert to a `Set<number>` for the dispatch check).
- ADD `const MAX_BATCH_EDITS = 10;` (D-01) and `const MAX_BATCH_BYTES = 30 * 1024 * 1024;` (D-02) in the same block, with the same KEEP IN SYNC comment binding them to `feedback-inject.js`.
- DO NOT lower `MAX_IMAGE_BYTES`.

**4. Auth gate at handler entry** (`submit.ts:132-138`):
```typescript
export const POST: APIRoute = async ({ request }) => {
  if (!(await checkAuth(request))) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // ...
```
Apply to: the v2 branch. The auth check is SHARED — it runs BEFORE the `schemaVersion` dispatch. Do not duplicate it inside v1/v2 branches. `clarify.ts:46-47` shows the same idiom factored via a `unauthorized()` helper — planner may follow that style.

**5. JSON body parse with fail-safe** (`submit.ts:140-145`):
```typescript
let p: any;
try {
  p = await request.json();
} catch {
  return fail('Invalid request body', 400);
}
```
Apply to: v2 branch entry. Parse ONCE, then dispatch on `p?.schemaVersion`.

**6. Structured `fail()` response helper** (`submit.ts:110-115`):
```typescript
function fail(message: string, status = 422) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```
Apply to: every v2 validation failure. EXTEND with a per-edit variant for API-03 ("structured per-edit-errors response so the UI can highlight which edits to fix"):
```typescript
function failBatch(errors: Array<{ index: number; error: string }>, status = 422) {
  return new Response(
    JSON.stringify({ ok: false, error: 'One or more edits failed validation', errors }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**7. Schema-version dispatch** (`submit.ts:148`):
```typescript
if (p?.schemaVersion !== SCHEMA_VERSION) return fail('Unsupported schema version');
```
**This is the dispatch point.** Replace with:
```typescript
if (p?.schemaVersion === SCHEMA_VERSION) {
  return handleV1(p);  // existing logic, extracted into a function
} else if (p?.schemaVersion === SCHEMA_VERSION_V2 && p?.batch === true) {
  return handleV2Batch(p);
} else {
  return fail('Unsupported schema version');
}
```
v1 path stays for cached browsers (API-02 / D-16). NEVER remove the v1 branch.

**8. Per-edit validation — the shared helper origin** (`submit.ts:149-182`):
```typescript
const intent: Intent = p.intent;
if (!INTENTS.includes(intent)) return fail('Unknown intent');
if (!p.pageRoute || typeof p.pageRoute !== 'string') return fail('Missing page route');
if (p.confirmationAccepted !== true) return fail('Confirmation was not accepted');

const detail = p.intentDetail || {};
const img = p.image || { present: false };

// --- intent-specific re-validation (mirrors State-C in the inject) --------
if (intent === 'change-wording') {
  const en = String(detail.newTextEn ?? '').trim();
  if (!en) return fail('New wording (English) is required');
  if (detail.okToTranslate !== true) {
    const fr = String(detail.newTextFr ?? '').trim();
    if (!fr) {
      return fail('This site is bilingual. Provide the French wording too, or tick "OK to translate" so it can be translated for you.');
    }
  }
} else if (intent === 'replace-photo') {
  if (!img.present) return fail('A replacement photo is required');
  if (!String(img.mime || '').startsWith('image/')) return fail('Replacement file must be an image');
  if (!img.dataBase64) return fail('Replacement photo data missing');
  if (typeof img.bytes !== 'number' || img.bytes <= 0) return fail('Replacement photo is empty');
  if (img.bytes > MAX_IMAGE_BYTES) return fail('Replacement photo must be 12 MB or smaller');
} else if (intent === 'move-resize') {
  if (!MOVE_RESIZE_OPTIONS.includes(detail.change)) return fail('Pick a layout change from the list');
  if (isVague(detail.detail)) return fail(VAGUE_MESSAGE);
} else if (intent === 'remove') {
  if (detail.confirmed !== true) return fail('Tick the confirmation box to remove this element');
} else if (intent === 'something-else') {
  if (isVague(detail.detail)) return fail(VAGUE_MESSAGE);
}
```
**THIS IS THE BLOCK D-15 / API-04 MANDATES BE EXTRACTED.** Refactor signature to:
```typescript
// Returns null on pass, string error message on fail. NO Response objects —
// caller wraps in fail() (v1) or accumulates into batch errors[] (v2).
export function validateEdit(p: any): string | null { ... }
```
Both `handleV1(p)` and `handleV2Batch(p)` `.edits[]` loop call it. The two paths can never drift because the rules live in one function.

**9. Locator normalisation + clamp** (`submit.ts:184-216`):
```typescript
function clamp(s: unknown, max: number): string { return String(s ?? '').slice(0, max); }

const locator = {
  schemaVersion: SCHEMA_VERSION,
  pageRoute: clamp(p.pageRoute, 200),
  // ... 15+ clamped fields
};
```
Apply to: v2 path. EVERY edit in `edits[]` goes through the same normaliser. Extract `function normaliseLocator(p: any)` if `validateEdit` doesn't already include it. Keep all length caps identical.

**10. `signalCount()` autonomy hint** (`submit.ts:123-130`):
```typescript
function signalCount(p: any): number {
  let n = 0;
  if (p.i18nKey && p.i18nAttr) n += 1;
  if (p.imageRef) n += 1;
  if (p.galleryAttrRaw && Number.isInteger(p.galleryIndex) && p.galleryIndex >= 0) n += 1;
  if (String(p.nearbyText || '').trim().length >= MIN_VAGUE_LEN && p.nearestHeading) n += 1;
  return n;
}
const autoEligible = (intent === 'change-wording' || intent === 'replace-photo') && sigCount >= 2;
```
Apply to: v2 ISSUE-04 autonomy hint. Compute per-edit. Batch is auto-eligible iff EVERY edit is auto-eligible:
```typescript
const perEditEligibility = edits.map((e) => ({
  edit: e,
  sigCount: signalCount(e),
  autoEligible: (e.intent === 'change-wording' || e.intent === 'replace-photo') && signalCount(e) >= 2,
}));
const batchAutoEligible = perEditEligibility.every((x) => x.autoEligible);
const failedIndexes = perEditEligibility.map((x, i) => x.autoEligible ? null : i).filter((x) => x !== null);
```
Failure-reason string MUST list which edits failed and why (ISSUE-04 verbatim).

**11. GitHub helpers — REUSE AS-IS** (`submit.ts:58-105`):
```typescript
async function getFileSha(path: string): Promise<string | null> { /* ... */ }
async function commitBase64File(path: string, base64: string, message: string): Promise<boolean> { /* ... */ }
async function createIssue(title: string, bodyText: string, labels: string[]) { /* ... */ }
async function patchIssueBody(issueNumber: number, bodyText: string): Promise<boolean> { /* ... */ }
```
Apply to: v2 path. DO NOT add `commitMultipleFiles` — call `commitBase64File` in a loop (or in `Promise.all`) for the batch's photos. The repo currently has no batch-commit helper and adding one would be scope creep; sequential PUTs against the same `feedback-incoming/issue-<n>/` path are correct (API-05 says "same directory + single PATCH for the body", NOT "single PUT for all files").

**12. Issue body construction — `renderHuman()` reused** (`submit.ts:230-248`, `330-364`):
```typescript
const buildBody = (committedPath: string | null, sha256: string | null) => {
  const machine = { ...locator, image: imageMeta(committedPath, sha256) };
  const human = renderHuman(locator, intent);
  const hint = autoEligible ? `Autonomy hint: AUTO-ELIGIBLE ...` : `Autonomy hint: NEEDS-REVIEW ...`;
  return [
    human,
    '',
    '---',
    '',
    '<!-- machine-readable feedback payload — do not edit by hand -->',
    '```json',
    JSON.stringify(machine, null, 2),
    '```',
    '',
    hint,
  ].join('\n');
};
```
Apply to: v2 path. Concrete batch shape (ISSUE-02 + ISSUE-03):
```typescript
const humanSections = edits.map((e, i) => `### Edit ${i + 1} of ${edits.length}\n\n${renderHuman(e, e.intent)}`);
const body = [
  `**A client left feedback on the live site (${edits.length} edits).**`,
  '',
  humanSections.join('\n\n---\n\n'),
  '',
  '---',
  '',
  '<!-- machine-readable feedback payload — do not edit by hand -->',
  '```json',
  JSON.stringify({ schemaVersion: 2, batch: true, edits: machineEdits }, null, 2),
  '```',
  '',
  batchAutoEligible
    ? `Autonomy hint: AUTO-ELIGIBLE (all ${edits.length} edits pass per-edit gate). Verify against the autonomy gate in .github/CLAUDE_FEEDBACK.md before labelling \`auto-approved\`.`
    : `Autonomy hint: NEEDS-REVIEW (${failedIndexes.length} of ${edits.length} edits failed the per-edit gate: ${failedIndexes.map(i => `#${i+1}`).join(', ')}). Open a PR, do not auto-merge.`,
].join('\n');
```
Preserves: prompt-injection safety (integer issue # only ever interpolated into workflow; the JSON block is read by Claude via `gh issue view`).

**13. Title construction with TEST mode prefix** (`submit.ts:250-262`):
```typescript
const snippet = (...).replace(/\s+/g, ' ').trim().slice(0, 40);
const prettyIntent = intent.replace(/-/g, ' ');
let title = `${testMode ? '[TEST] ' : ''}[Feedback] ${prettyIntent} — ${locator.pageRoute}: "${snippet}"`;
if (title.length > 80) title = title.slice(0, 79) + '…';
const labels = testMode ? ['client-feedback-test'] : ['client-feedback'];
```
Apply to: v2 (ISSUE-01). Concrete shape:
```typescript
const uniqueRoutes = Array.from(new Set(edits.map((e) => e.pageRoute)));
const routeList = uniqueRoutes.join(', ').slice(0, 60);
let title = `${testMode ? '[TEST] ' : ''}[Feedback] batch of ${edits.length} edits — ${routeList}`;
if (title.length > 80) title = title.slice(0, 79) + '…';
```
KEEP `testMode` → `client-feedback-test` label routing — Phase 5 canary OPS-05 depends on it.

**14. Issue-first, photos-second, PATCH-third sequencing** (`submit.ts:264-316`):
```typescript
// 3. Create the issue first (need its number for the image path).
const issue = await createIssue(title, buildBody(null, null), labels);
const issueNumber: number = issue.number;
const issueUrl: string = issue.html_url;

// 4. If a photo is attached, commit the raw bytes and PATCH the real path back.
if (img.present && img.dataBase64) {
  // ... commit, hash, fall back gracefully if PUT fails
  await patchIssueBody(issueNumber, buildBody(committedPath, sha256));
}
```
Apply to: v2 (API-05). The v2 sequencing is:
1. Create issue with placeholder JSON (paths all `null`).
2. For each `edit` with a photo, sequentially commit to `feedback-incoming/issue-<N>/<safeName-i>` (same dir, no per-edit subfolders).
3. Build the FINAL body with all committed paths populated, then ONE `patchIssueBody()` call. **NOT N PATCH calls — API-05 is explicit.**

**15. SHA256 hash of base64 image** (`submit.ts:277-286`):
```typescript
const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const digest = await crypto.subtle.digest('SHA-256', bytes);
sha256 = Array.from(new Uint8Array(digest)).map((x) => x.toString(16).padStart(2, '0')).join('');
```
Apply to: each photo in the batch. Best-effort (wrap in try/catch and proceed with `null` on failure — same as v1).

**16. Safe filename sanitisation** (`submit.ts:288-292`):
```typescript
const safeName = (clamp(img.originalFilename, 120) || 'upload')
  .replace(/[^a-zA-Z0-9._-]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'upload';
const committedPath = `feedback-incoming/issue-${issueNumber}/${safeName}`;
```
Apply to: each photo in the batch. ADD per-edit collision-avoidance — two edits with the same filename ("photo.jpg") would clobber each other on the second PUT. Prefix with edit index:
```typescript
const committedPath = `feedback-incoming/issue-${issueNumber}/edit-${i + 1}-${safeName}`;
```
(Planner refines exact form; the rule is "no two edits in the batch write the same path".)

**17. Top-level try/catch returning 500** (`submit.ts:218`, `321-326`):
```typescript
try {
  // ... whole side-effect block
} catch (err: any) {
  return new Response(JSON.stringify({ ok: false, error: err.message || 'Server error' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
```
Apply to: v2 side-effect block. Same shape, same 500 fallback. Mirrors CLAUDE.md → Conventions → Error Handling.

---

### `public/feedback-inject.js` (client-side overlay + state machine)

**Analog:** Itself. The v1 state machine `IDLE → SELECTED → FIELDS → CONFIRM → DONE` is what gets extended to `... → STAGED → (loop) → SUBMITTING → DONE`. The sibling `public/editor-inject.js` (DO NOT TOUCH — OPS-02) is a peer reference but not an analog for code copy.

**1. IIFE wrapper + iframe-only guard** (`feedback-inject.js:17-19`):
```javascript
(function () {
  if (window.parent === window) return;
  if (new URLSearchParams(location.search).get('feedback') !== '1') return;
  // ...
})();
```
Apply to: all new code. Stay inside the existing IIFE. Do not introduce a second IIFE or top-level module.

**2. Shared-contract constants at top** (`feedback-inject.js:21-43`):
```javascript
// ---- shared contract (KEEP IN SYNC with src/pages/api/feedback/submit.ts) --
var SCHEMA_VERSION = 1;
var MAX_IMAGE_BYTES = 12 * 1024 * 1024;
var MIN_VAGUE_LEN = 25;
var DRAFT_KEY = 'mar_feedback_draft_v1';
var MOVE_RESIZE_OPTIONS = [/*...*/];
var VAGUE_STOPLIST = [/*...*/];
```
Apply to: add v2 constants in the SAME block with the SAME KEEP IN SYNC comment:
```javascript
var SCHEMA_VERSION_V2 = 2;
var MAX_BATCH_EDITS = 10;            // D-01 — mirror in submit.ts
var MAX_BATCH_BYTES = 30 * 1024 * 1024;  // D-02 — mirror in submit.ts
var STAGED_KEY = 'mar_feedback_staged_v1';  // sessionStorage, not localStorage (D-08)
```
**Style:** `var` not `let`/`const` (this file is ES5-style for max browser compat). `camelCase` for functions, `SCREAMING_SNAKE_CASE` for constants. Single quotes. 2-space indent.

**3. State enum extension** (`feedback-inject.js:90-91`):
```javascript
var STATE = { IDLE: 'idle', SELECTED: 'selected', FIELDS: 'fields', CONFIRM: 'confirm', DONE: 'done', AUTH: 'auth' };
var state = STATE.IDLE;
```
Apply to: ADD states (planner finalises names):
```javascript
var STATE = { IDLE: 'idle', SELECTED: 'selected', FIELDS: 'fields', CONFIRM: 'confirm',
              STAGED: 'staged', SUBMITTING: 'submitting', DONE: 'done', AUTH: 'auth' };
```
After successful `validateFields()` in `renderConfirm()` ("Looks right — send it" button), instead of `submit()`-immediately, the new flow is: push the built payload into the `staged[]` array, persist to sessionStorage, render the chip, return to STATE.IDLE so the client can stage more.

**4. localStorage draft pattern → sessionStorage staged pattern** (`feedback-inject.js:281-289`):
```javascript
function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      locator: locator, intent: draft.intent, detail: draft.detail,
      image: draft.image, state: state, ts: Date.now(),
    }));
  } catch (e) {}
}
function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }
```
Apply to: NEW sibling helpers (mirror the shape):
```javascript
function loadStaged() {
  try { var raw = sessionStorage.getItem(STAGED_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
}
function saveStaged(arr) { try { sessionStorage.setItem(STAGED_KEY, JSON.stringify(arr)); } catch (e) {} }
function clearStaged() { try { sessionStorage.removeItem(STAGED_KEY); } catch (e) {} }
```
**Critical** (D-09 / STAGE-05): the `image` field in each staged entry MUST stay a File reference OR a small descriptor (`name`, `type`, `size`) — DO NOT serialise the `dataURL` base64 bytes into sessionStorage (would blow the ~5 MB cap with 12 MB photos). Re-read the File at submit time. Pattern for keeping the File handle alive across the chip/panel UI: hold an in-memory `Map<stageId, File>` separately from the sessionStorage descriptor.

**5. validateFields — TO BE EXTRACTED** (`feedback-inject.js:482-501`):
```javascript
function validateFields(intent, d) {
  if (intent === 'change-wording') {
    if (!String(d.newTextEn || '').trim()) return 'Please enter the new English wording.';
    // ...
  } else if (intent === 'replace-photo') {
    // ...
  }
  // ...
  return null;
}
```
**This is the client half of D-15.** Both halves (this and `submit.ts:158-182`) must extract to a shared rule set. Realistically the client and server file types differ (JS vs TS), so the practical extraction is:
- Server-side: extract to `src/pages/api/feedback/validate.ts` (planner's call per D-15).
- Client-side: keep `validateFields()` in `feedback-inject.js` but tag its comment header with `// MIRROR OF: src/pages/api/feedback/validate.ts::validateEdit() — keep in sync` so future devs see the contract.
- Pre-stage check: re-call `validateFields()` BEFORE pushing into `staged[]`. The server re-runs the same rules on submit per API-03.

**6. Element construction helper** (`feedback-inject.js:292-297`):
```javascript
function el(tag, attrs, html) {
  var n = document.createElement(tag);
  if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
  if (html != null) n.innerHTML = html;
  return n;
}
```
Apply to: chip + panel DOM construction. Reuse for the corner chip (`<div id="mar-fb-chip">…</div>`) and the panel listing staged edits. NO new framework / no innerHTML for user-controlled strings (use `escapeHtml()`).

**7. escapeHtml helper** (`feedback-inject.js:613-617`):
```javascript
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
```
Apply to: every place where staged-edit text appears in the panel (`escapeHtml(edit.intentDetail.newTextEn)`, `escapeHtml(edit.pageRoute)`, etc.). Mandatory — the panel renders client-supplied strings.

**8. Style block convention** (`feedback-inject.js:57-87`):
```javascript
var ACCENT = '#FF6B2B';
var style = document.createElement('style');
style.textContent =
  '[data-fb-hover]{outline:2px dashed rgba(255,107,43,.6)!important;...}' +
  '#mar-fb-banner{position:fixed;left:50%;...;z-index:2147483646;...}' +
  '#mar-fb-panel{position:fixed;right:16px;bottom:16px;...;z-index:2147483647;...}' +
  /* ... */;
document.documentElement.appendChild(style);
```
Apply to: the chip styles. ADD a `#mar-fb-chip` ruleset to the SAME `style.textContent` string concat — DO NOT introduce a separate `<style>` element. Use the same `var ACCENT = '#FF6B2B'`, the same `#0f172a` / `#e2e8f0` palette, and `z-index: 2147483645` (one lower than panel, one higher than banner) so the chip sits below the panel when both are open. Position the chip `bottom: 16px; right: 16px` BUT only when the panel is closed; when the panel opens, hide the chip or shift it up.

**9. postMessage to parent** (`feedback-inject.js:582-585`, `709`):
```javascript
window.parent.postMessage({ type: 'mar-feedback-submit', payload: buildPayload() }, '*');
// ...
window.parent.postMessage({ type: 'mar-feedback-ready', lang: ... }, '*');
```
Apply to: v2 batch submit. Keep the EXACT message type `mar-feedback-submit` — the parent (`feedback.astro:167`) keys off it and POSTs to `/api/feedback/submit`. The only change is `msg.payload` becomes `{ schemaVersion: 2, batch: true, edits: [...] }` instead of the v1 single-edit shape. **`feedback.astro` does not need to change** — it forwards `msg.payload` verbatim.

**10. Result-message receiver** (`feedback-inject.js:588-610`):
```javascript
window.addEventListener('message', function (ev) {
  if (ev.origin !== location.origin) return;
  var m = ev.data;
  if (!m || m.type !== 'mar-feedback-result') return;
  if (m.ok) {
    clearDraft();
    // ... show success
  } else if (m.auth) {
    // ... 401 recovery
  } else {
    // ... show error
  }
});
```
Apply to: extend success path to ALSO `clearStaged()` and dismiss the chip (STAGE-04). Extend error path to handle the new structured per-edit-errors response shape (API-03 / D-05): if `m.errors` is an array, highlight which staged items failed in the panel; the chip stays. DO NOT clear staged on error — the client edits represent real work.

**11. Reset / cancel pattern** (`feedback-inject.js:659-667`):
```javascript
function reset() {
  destroyPanel();
  if (frozenEl) { frozenEl.removeAttribute('data-fb-frozen'); frozenEl = null; }
  clearHover();
  locator = null;
  draft = { intent: null, detail: {}, image: null };
  state = STATE.IDLE;
  clearDraft();
}
```
Apply to: a new `resetCurrentEdit()` (returns to IDLE WITHOUT clearing `staged[]` — only clears the in-progress edit) AND a separate `clearAllStaged()` (called by the "Clear all" button after `window.confirm()` per D-11 — pops the panel, calls `clearStaged()`, removes the chip). Per D-12, per-item delete on a single staged edit is irrevocable (no confirm).

**12. Resume-on-load block** (`feedback-inject.js:670-703`):
```javascript
(function restore() {
  var raw;
  try { raw = localStorage.getItem(DRAFT_KEY); } catch (e) { return; }
  if (!raw) return;
  // ... "Resume your note?" prompt
})();
```
Apply to: ADD a sibling auto-restore for `staged[]` from sessionStorage. Different shape from the draft restore — staged edits don't need a "resume?" prompt; they're already committed. On load: `var staged = loadStaged(); if (staged.length > 0) renderChip(staged.length);`. This is what makes D-06 (cross-page batching) work: the chip rehydrates on every iframe navigation because sessionStorage survives.

---

### `src/lib/feedback-version.ts` (config constant)

**Analog:** Itself. One-line bump.

**Existing** (`feedback-version.ts:12`):
```typescript
export const FEEDBACK_INJECT_VER = '1';
```

**Change** (D-14 / OPS-01):
```typescript
export const FEEDBACK_INJECT_VER = '2';
```

**Why a separate plan-step:** Without this bump, cached browsers continue running v1 `feedback-inject.js` forever (Vercel CDN aggressively caches `.js`); the new state machine never loads, the chip never appears, and Phase 5's OPS-05 canary fails. The comment at lines 1-11 of the file already explains this — no doc edit needed beyond the constant.

**Verification:** OPS-05 canary checks browser network tab for `feedback-inject.js?v=2` post-deploy.

---

### `.github/CLAUDE_FEEDBACK.md` (LLM operating manual)

**Analog:** Itself, sections `## 3. Photo replacement` (lines 79-111) and `## 4. Autonomy gate` (lines 113-154) — these are the closest existing structural sections in tone and depth. The new `## 8. Batch submissions` mirrors their shape.

**1. Section-header style** (existing `## 3.` and `## 4.`):
```markdown
## 3. Photo replacement — Sharp pipeline (zero source edits)

The raw upload is committed at `image.committedPath`
(`feedback-incoming/issue-<n>/<file>`, repo root, in `.vercelignore`).
**Do not** reference it from site code...
```
Apply to: `## 8.` follows the same convention — H2 with a one-line `—` subtitle, body paragraphs with `**Bold**` rules and inline `` `code` ``.

**2. Numbered hard-rules pattern** (`CLAUDE_FEEDBACK.md:14-29`, `## 0. Hard rules`):
```markdown
- **Never touch the editor flow.** Off-limits: ...
- **Bilingual or nothing.** Any copy change updates **both `en` and `fr`**.
- **One commit style:** `copy: …`, `fix(scope): …`, or `feat(scope): …`,
  always ending with ` (feedback #<n>)`.
```
Apply to: `## 8.` should reference (not duplicate) §0 / §2 rules — say "EN/FR rule (§2) and disallowed-paths rule (§0) apply **per edit** in a batch" (ACTION-01 verbatim).

**3. Autonomy-gate decision-tree pattern** (`CLAUDE_FEEDBACK.md:140-151`):
```markdown
Decision tree, briefly:

\`\`\`
intent change-wording/replace-photo? ── no ──► PR + needs-review (or +question)
        │ yes
≥2 signals agree? ───────────────────── no ──► PR + needs-review (or +question)
        │ yes
diff within allowed set & build green? ─ no ──► PR + needs-review
        │ yes
        ▼
PR + label issue `auto-approved`  (workflow squash-merges → Vercel redeploys)
\`\`\`
```
Apply to: `## 8.` should include a SIMILAR ASCII tree showing the per-edit→batch autonomy rollup:
```
For each edit in batch:
  per-edit autonomy gate (§4) → AUTO / NEEDS-REVIEW
batch AUTO iff every edit AUTO
otherwise: open ONE PR with all edits applied (or skip the failing edits with a clear note), label issue needs-review
```

**4. Branch / commit naming pattern** (`CLAUDE_FEEDBACK.md:25-26`):
```markdown
- **Branch name:** `feedback/issue-<n>-<kebab-summary>`.
```
Apply to: `## 8.` documents the BATCH variant `feedback/issue-<n>-batch-<N>` (where N = edit count) — ACTION-02 / ROADMAP success criterion #4. ACTION-02 also requires ONE commit (not N), so `## 8.` must explicitly say:
- ONE branch off default.
- ONE commit applying all N edits (or a clear subset, with note).
- ONE PR.
- ONE result comment (ACTION-03) summarising "Applied X of N edits; edit #Y had only 1 locator signal so the whole set is in review".

**5. Schema-detection rule** — NEW content (ACTION-01):
Open the section with:
```markdown
## 8. Batch submissions

When the issue body's fenced ```json``` block has `schemaVersion: 2` AND `batch: true`,
the locator is an `edits[]` array rather than a single edit. Treat it as a batch:
...
```

**6. Prompt-injection safety reminder** — carry forward (CLAUDE.md "Feedback mode" → "prompt-injection-safe issue body pattern"). The new section MUST instruct: "Read the JSON block via `gh issue view <n> --json body`, NEVER via YAML interpolation in the workflow file." The workflow file only ever sees the integer issue number. (`code_context` → "Prompt-injection safety" in CONTEXT.md is the canonical statement.)

---

### `CLAUDE.md` §"Feedback mode" (architectural documentation)

**Analog:** The four existing bullets in the same section (CLAUDE.md:257-261), specifically the "Cache-bust constant" bullet (line 259) — same one-line-with-inline-code tone.

**Existing bullet style**:
```markdown
- **Cache-bust constant.** `public/feedback-inject.js` is `defer`-loaded and CDN-cached just like `editor-inject.js`. The version lives in **one place**: `src/lib/feedback-version.ts` (`FEEDBACK_INJECT_VER`), imported by both `BaseLayout.astro` (the loader `?v=`) and `feedback.astro` (the iframe `src`). **Bump it on every behavioural change to `feedback-inject.js`** or clients keep the stale script.
```

**New bullet to add** (OPS-03 / D-19), one of:
```markdown
- **Batch submissions (v2 schema).** `feedback-inject.js` can stage multiple edits via a corner chip before submitting; the server in `submit.ts` detects v2 batches by `schemaVersion: 2 && batch: true` and creates ONE issue per batch. Per-edit validation runs through the shared helper consumed by both v1 and v2 paths (`src/pages/api/feedback/validate.ts`) so they can never drift. The v1 single-edit path stays for cached browsers.
```
Place: as a 5th bullet under "Feedback mode (`?feedback=1` → auto-code → auto-deploy)" — after the existing self-codes bullet. Match the existing bullet style: `**Bold lead.**` then 2-3 sentences with inline `` `code` ``.

---

### `src/pages/api/feedback/validate.ts` (NEW — planner discretion per D-15)

**Analog:** `src/pages/api/feedback/submit.ts:110-182` (the helpers + the intent-specific validation block) and `src/pages/api/feedback/clarify.ts:1-32` (the route-helper-extraction pattern — `unauthorized()`, `json()`).

**Module-structure pattern** (from `clarify.ts:1-32`):
```typescript
// File starts with helper utility functions (no `export const prerender`
// because this is NOT a route — it's a helper module under api/feedback/).
```

**Naming pattern** (CLAUDE.md → Conventions → Naming): kebab-case file `validate.ts`, camelCase exports `validateEdit`, `signalCount`, `isVague`, `clamp`, `normaliseLocator`.

**Recommended shape**:
```typescript
// src/pages/api/feedback/validate.ts
// Shared per-edit validator — consumed by BOTH the v1 single-edit path AND
// the v2 batch path in ./submit.ts. The two paths cannot drift because the
// rules live here (D-15 / API-04).
//
// Mirrored client-side in public/feedback-inject.js::validateFields(). When
// you change a rule here, change it there too.

export const INTENTS = ['change-wording', 'replace-photo', 'move-resize', 'remove', 'something-else'] as const;
export type Intent = (typeof INTENTS)[number];

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const MIN_VAGUE_LEN = 25;
export const MOVE_RESIZE_OPTIONS = [...] as const;
export const VAGUE_STOPLIST = [...];
export const VAGUE_MESSAGE = 'Can you be more specific? ...';

export function isVague(raw: unknown): boolean { /* verbatim from submit.ts:37-47 */ }
export function clamp(s: unknown, max: number): string { /* verbatim from submit.ts:117-119 */ }
export function signalCount(p: any): number { /* verbatim from submit.ts:123-130 */ }

// Returns null on pass, error message string on fail. Pure — no Response objects.
export function validateEdit(p: any): string | null { /* extracted from submit.ts:149-182 */ }

// Optional: extracted from submit.ts:190-216
export function normaliseLocator(p: any): NormalisedLocator { /* ... */ }
```
Then `submit.ts` imports: `import { validateEdit, signalCount, MAX_IMAGE_BYTES, ... } from './validate';` and DELETES the now-extracted local versions.

**Anti-pattern to avoid:** do NOT make this a class. The project uses functional helpers throughout (`src/lib/auth.ts` is the only "lib" file and it exports two free functions, no class).

---

## Shared Patterns

### Auth gating
**Source:** `src/lib/auth.ts::checkAuth`, called from `submit.ts:133` and `clarify.ts:47`
**Apply to:** Every API route. POST handlers return 401 immediately on failure with `{ ok: false, error: 'Unauthorized' }`. No new pattern needed for v2 — auth check runs once at the top of the route, BEFORE the `schemaVersion` dispatch. Pattern (verbatim from `submit.ts:132-138`):
```typescript
export const POST: APIRoute = async ({ request }) => {
  if (!(await checkAuth(request))) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // ... rest of handler
};
```

### Error response shape
**Source:** `submit.ts::fail` (l. 110-115), `clarify.ts::json` (l. 27-32)
**Apply to:** Every v2 validation failure. Response body is ALWAYS `{ ok: boolean, error?: string, ...extra }`. Status: 401 unauthorized, 400 bad request body, 422 validation failure, 502 upstream (GitHub) failure, 500 server error. Same status codes the v1 path uses. Extended for v2:
```typescript
// API-03 + D-05 — structured per-edit-errors response
{ ok: false, error: 'One or more edits failed validation', errors: [{ index: 2, error: 'Replacement photo must be 12 MB or smaller' }] }
{ ok: false, error: 'Batch exceeds 10-edit limit', cap: 'edits', limit: 10, actual: 12 }
{ ok: false, error: 'Batch exceeds 30 MB total photo size', cap: 'bytes', limit: 31457280, actual: 35840000 }
```

### KEEP-IN-SYNC comment convention
**Source:** `submit.ts:10-14` and `feedback-inject.js:21` (both label their shared-contract blocks with the SAME KEEP IN SYNC comment)
**Apply to:** Every constant duplicated across the client/server boundary in v2. The comments are load-bearing — they're the only thing preventing drift before D-15's extraction. After extraction, the server-side comment changes to "Re-exported from `./validate.ts`" but the client-side comment stays because JS can't import a `.ts` file.

### Defensive try/catch wrapping localStorage / sessionStorage
**Source:** `feedback-inject.js:282-289, 672-676, 686-696` (every storage access wrapped in `try { ... } catch (e) {}`)
**Apply to:** All new `sessionStorage.getItem`/`.setItem`/`.removeItem` calls for staged edits. Private-browsing mode throws on storage access; the chip must not blow up.

### GitHub Contents API: get-SHA-then-PUT
**Source:** `submit.ts::commitBase64File` (l. 73-83)
**Apply to:** Every photo commit in a batch. DO NOT add a batch-commit helper — the existing `commitBase64File` is correct for the per-photo loop. Sequential calls only (Promise.all is risky against the GitHub API rate limit on shared SHAs; sequential is safe and predictable).

### Title length cap
**Source:** `submit.ts:258` (`if (title.length > 80) title = title.slice(0, 79) + '…';`)
**Apply to:** v2 batch issue title. ISSUE-01 says "truncated to 60 chars" for the route list inside the title; the OVERALL title still respects the 80-char cap. Apply both clamps in that order.

### `data-i18n-html` vs `data-i18n` (anti-pattern)
**Source:** CLAUDE.md → Architectural Constraints
**Apply to:** Any new translatable string in the chip. Per D-19 / `## Claude's Discretion` in CONTEXT.md, chip text is ADMIN-FACING ONLY and can skip i18n entirely — recommended path. If translated anyway, use `data-i18n-html` for any string containing markup, `data-i18n` for plain text. NEVER `data-i18n` on a string with `<b>` / `<br>` / `<span>` (the runtime strips markup via `textContent`).

---

## Cross-cutting D-13 Verification Pattern (OPS-02 merge gate)

Source: D-13 / CONTEXT.md
**Apply to:** The implementation plan must include a verification step that runs:
```bash
git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts
```
and asserts ZERO output lines before opening the PR. This is the OPS-02 merge gate.

---

## No Analog Found

None. Every Phase 4 file has a direct in-codebase analog (typically itself, since this is a pure-extension phase). The "no analog" column would normally hold genuinely new infra; Phase 4 introduces no new infra.

---

## Metadata

**Analog search scope:**
- `src/pages/api/feedback/` (both files: `submit.ts`, `clarify.ts`)
- `src/pages/api/` (read for `prerender = false` + APIRoute convention sample)
- `src/lib/` (`feedback-version.ts`, `auth.ts`)
- `src/layouts/BaseLayout.astro` (loader-block context for the cache-bust)
- `src/pages/feedback.astro` (parent ↔ iframe postMessage contract)
- `public/feedback-inject.js` (full file — primary modify target)
- `.github/CLAUDE_FEEDBACK.md` (full file — primary modify target)
- `.github/workflows/claude.yml` (existence-checked only; per spec memory "Workflow file changes: None required")
- `CLAUDE.md` (Architectural Constraints + Feedback-mode sections)

**Files scanned:** 11
**Out-of-scope files explicitly NOT scanned for patterns (per D-13 / OPS-02 scope fence):** `public/editor-inject.js`, `public/editor/**`, `public/guardrails.js`, `src/pages/api/site/save.ts`, `src/pages/api/site/publish.ts`, `middleware.ts`.

**Pattern extraction date:** 2026-05-20
