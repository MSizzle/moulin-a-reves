---
phase: 04-batch-pipeline-implementation
reviewed: 2026-05-21T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - .github/CLAUDE_FEEDBACK.md
  - CLAUDE.md
  - public/feedback-inject.js
  - scripts/smoke-feedback-v2.mjs
  - src/lib/feedback-version.ts
  - src/pages/api/feedback/submit.ts
  - src/pages/api/feedback/validate.ts
findings:
  critical: 3
  warning: 11
  info: 3
  total: 17
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-05-21
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

The v2 batch pipeline lands alongside v1 cleanly and the shared validator
(`validate.ts`) does what API-04 promised — both paths funnel through a single
rule set, the smoke harness exercises the five required scenarios, the
cap constants are mirrored byte-for-byte across `submit.ts` and
`feedback-inject.js`, and the editor flow is untouched. The architecture is
sound.

However, three categories of defect block ship:

1. **The result-forwarder in `feedback.astro` (out of scope, but the inject
   depends on it) drops every field the v2 contract added.** The
   `submitBatch` listener has explicit branches for `m.errors`, `m.cap`,
   `m.limit`, and `m.actual`, but the parent only forwards `ok` / `auth`.
   Per-edit error highlights, cap-violation UX, and the
   "Submit batch → fix → resubmit" loop are all dead code today.
2. **The server's `bytes` cap is computed from the client-supplied
   `image.bytes` descriptor**, not from the actual decoded base64 length. An
   authenticated client can spoof `bytes: 1` and ship arbitrarily large
   payloads to GitHub. The smoke test (scenario 4) literally exercises this
   gap (`dataBase64: 'AAAA'` with `bytes: 1.5 MB`).
3. **v2 photo-commit failures are silently swallowed.** v1 returns a
   `warning` field when the photo PUT fails; v2 records `commitError` in the
   JSON block but responds `{ok: true}`. The user sees success while the
   Action receives an unprocessable issue.

The cross-cutting "the v2 schema implies a richer result contract that the
parent never carries" theme means even the WARNING items below cluster:
several of them only matter once the BLOCKERs are unblocked.

## Critical Issues

### CR-01: v2 result forwarder in `src/pages/feedback.astro` drops every batch field

**File:** `public/feedback-inject.js:1134-1156` (inject's defensive branches)
plus `src/pages/feedback.astro:202-204` (the parent forwarder — out of scope,
flagged per prompt).

**Issue:** `submitBatch`'s result listener handles four distinct v2 server
shapes: `m.errors` (per-edit validation failures, API-03), `m.cap` /
`m.error` (cap violations, API-06), `m.auth` (401 reauth), and generic
failure. The parent in `feedback.astro` only forwards `{ok: true}` or
`{ok: false, auth: true}` or `{ok: false}` — it never spreads `data.errors`,
`data.cap`, `data.limit`, or `data.actual` into the message it posts back
to the iframe.

Net effect: the iframe branches at lines 1134 (`Array.isArray(m.errors)`)
and 1143 (`if (m.cap)`) are **unreachable**. A v2 batch that hits a
422 cap-violation falls through to the generic-failure branch (line 1154)
which shows "Something went wrong" instead of the specific
"This batch is full" cap message. A v2 batch that hits per-edit validation
errors loses the error indexes entirely — no `.is-error` highlight, no
guidance which staged item to fix.

This is the forward concern flagged in the 04-04 SUMMARY and the prompt
explicitly asked to flag inject's defensive branches that reference state
that can never arrive. They are referenced; the state cannot arrive.

**Fix:** Edit `src/pages/feedback.astro` to spread the server response
fields onto the forwarded message (out of scope for this phase's diff but
must land before v2 is enabled in production):

```js
// in the else branch around line 202-204:
iframe.contentWindow && iframe.contentWindow.postMessage({
  type: 'mar-feedback-result',
  ok: false,
  ...(data && data.auth ? { auth: true } : {}),
  ...(data && Array.isArray(data.errors) ? { errors: data.errors } : {}),
  ...(data && data.cap ? { cap: data.cap, limit: data.limit, actual: data.actual } : {}),
  ...(data && data.error ? { error: data.error } : {}),
}, location.origin);
```

Until that lands, ship the v2 path behind a feature flag, or accept that v2
batch failures degrade to a generic "Something went wrong" with no recovery
hints.

---

### CR-02: Server-side byte cap trusts client-supplied descriptor (`image.bytes`) instead of decoded base64 length

**File:** `src/pages/api/feedback/submit.ts:346-357`

**Issue:** `totalBytes` is summed from `e.image.bytes` (the JSON descriptor
the client posted) rather than from `dataBase64.length`. An authenticated
client can post `{ bytes: 1 }` for every edit and ship arbitrarily large
base64 payloads — `MAX_BATCH_BYTES` never trips, `commitBase64File` PUTs
the actual decoded bytes into GitHub regardless. Scenario 4 of the smoke
harness inadvertently documents this gap by relying on it (sets
`dataBase64: 'AAAA'` — 4 chars, ~3 bytes — with `bytes: perEditBytes` of
1.5 MB and asserts the cap fires).

Authentication is required (`checkAuth`), so this is not an open-internet
DoS — but the auth model is the dashboard password (`DASHBOARD_PASSWORD`),
shared across users. Any session-holder can:
- Exhaust GitHub API quota by uploading large payloads under the radar of
  the in-app cap.
- Push `feedback-incoming/` blobs of unbounded size to the repo. The
  `.vercelignore` keeps them out of the deploy, but they bloat clone size
  and remain in git history.
- Bypass the D-03 Hobby-tier 4.5 MB body-limit rationale that motivates
  `MAX_BATCH_BYTES = 3 MB` in the first place — Vercel will still 413 at
  the edge if the request body is too large, so the practical impact is
  bounded by the platform — but the in-app gate has zero effect.

**Fix:** Compute total bytes from the actual base64 payload, not the
descriptor:

```ts
function approxDecodedBytes(b64: string): number {
  if (!b64) return 0;
  const s = b64.includes(',') ? b64.split(',').pop()! : b64;
  // base64 decodes 4 chars -> 3 bytes; adjust for '=' padding.
  const pad = (s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0);
  return Math.floor((s.length * 3) / 4) - pad;
}

const totalBytes: number = p.edits.reduce(
  (sum: number, e: any) => sum + approxDecodedBytes(e?.image?.dataBase64 || ''),
  0,
);
```

Then update scenario 4 of `scripts/smoke-feedback-v2.mjs` to ship a real
oversize base64 string (e.g. `'A'.repeat(capBytes * 2)`) so the test
exercises the actual code path.

---

### CR-03: v2 silently swallows per-edit photo commit failures (response says `ok: true`)

**File:** `src/pages/api/feedback/submit.ts:511-553`

**Issue:** The per-edit photo loop tracks `commitError` for each failed
PUT and records it on `finalMachineEdits[i]`, but the final response is
unconditionally `{ ok: true, issueNumber, issueUrl }`. The v1 path (line
289-303) by contrast returns:

```ts
return new Response(
  JSON.stringify({ ok: true, issueUrl, issueNumber, warning: 'Issue created but the photo upload failed.' }),
  ...
);
```

For v2, a 3-photo batch where two commits fail produces an issue body with
two `commitError: 'photo commit failed'` markers buried in the JSON block,
and a `{ok: true}` UI confirmation. The client sees "Your batch was sent",
the user closes the tab, the Action picks up the issue and sees photos
missing for two edits → either the Action defers everything or
auto-merges a partially-broken batch.

**Fix:** Aggregate the commit errors and surface them in the response:

```ts
const commitErrors = finalMachineEdits
  .map((m, i) => (m.commitError ? { index: i, error: m.commitError } : null))
  .filter((x): x is { index: number; error: string } => x !== null);

return new Response(
  JSON.stringify({
    ok: true,
    issueNumber,
    issueUrl,
    ...(commitErrors.length > 0 ? {
      warning: `${commitErrors.length} of ${p.edits.length} photo(s) failed to upload`,
      commitErrors,
    } : {}),
  }),
  { status: 200, headers: { 'Content-Type': 'application/json' } },
);
```

(And then have the parent forwarder relay `warning` / `commitErrors` to the
iframe — see CR-01.)

## Warnings

### WR-01: `MAX_IMAGE_BYTES` (12 MB) is larger than `MAX_BATCH_BYTES` (3 MB) — per-photo cap is unreachable in practice

**File:** `src/pages/api/feedback/validate.ts:18`, `public/feedback-inject.js:24, 32`,
`src/pages/api/feedback/submit.ts:53`

**Issue:** A user can pick a 4 MB photo that passes the per-file 12 MB cap
in `validateFields` / `validateEdit`, but the moment they try to stage it
the batch cap (3 MB) trips with the misleading "This batch is full — submit
it before staging more". For a first photo, the batch isn't full — the
single file is just larger than the entire batch budget. The 12 MB constant
is effectively dead code for any photo-bearing edit in v2; for v1 it remains
the real cap, but a v1 client that uploads >3 MB will still hit Vercel's
~4.5 MB body limit at the edge regardless.

**Fix:** Either lower `MAX_IMAGE_BYTES` to ≤ `MAX_BATCH_BYTES` (matches the
Hobby-tier rationale), or make `exceedsCaps` return a distinct message for
"this single photo exceeds the batch budget" vs "the batch is already full":

```js
function exceedsCaps(extraBytes) {
  var totals = batchTotals();
  if (totals.count + 1 > MAX_BATCH_EDITS) {
    return { exceeds: true, reason: "You've reached the " + MAX_BATCH_EDITS + "-edit limit. Submit this batch before staging more." };
  }
  if (extraBytes > MAX_BATCH_BYTES) {
    return { exceeds: true, reason: 'That photo alone is over the ' + (MAX_BATCH_BYTES / (1024*1024)) + ' MB batch limit. Choose a smaller image.' };
  }
  if (totals.totalBytes + (extraBytes || 0) > MAX_BATCH_BYTES) {
    return { exceeds: true, reason: 'This batch is full — submit it before staging more.' };
  }
  return { exceeds: false, reason: null };
}
```

---

### WR-02: `exceedsCaps` collapses both cap dimensions into one generic message

**File:** `public/feedback-inject.js:765-774`

**Issue:** The server returns a structured `{cap: 'edits' | 'bytes', limit, actual}`
shape, but the client-side `exceedsCaps` returns the same string for both
violation types. STAGE-07's UX requirement is to tell the user which cap
they hit. Coupled with WR-01.

**Fix:** Return `cap: 'edits' | 'bytes'` from `exceedsCaps`, mirror the
server shape, render distinct messages.

---

### WR-03: Per-item delete (✕) is not disabled during `STATE.SUBMITTING`

**File:** `public/feedback-inject.js:873-877`

**Issue:** `submitBatch` sets `state = STATE.SUBMITTING` and disables the
chip's submit button + panel's submit button, but the per-item delete
buttons (`mar-fb-staged-item__delete`) remain clickable. A user who clicks
✕ between `submitBatch` POST and the result message:
- Removes an entry from `sessionStorage` and the `fileMap`.
- The in-flight POST still references the deleted entry.
- When the result arrives with `errors: [{index: 2, ...}]`, the panel
  re-renders against the now-truncated list — error highlights apply to
  the wrong items, or to entries that no longer exist.

**Fix:** Gate the delete-button click handler on state:

```js
del.addEventListener('click', function () {
  if (state === STATE.SUBMITTING) return;
  stagedDelete(sid);
});
```

Or set `aria-disabled` + visually disable all `.mar-fb-staged-item__delete`
buttons inside `renderPanel` while `state === STATE.SUBMITTING`.

---

### WR-04: Test-mode dispatch is inconsistent between v1 and v2

**File:** `public/feedback-inject.js:724, 1046`, `src/pages/api/feedback/submit.ts:251, 385`

**Issue:** v1's `buildPayload()` reads `testMode` from the URL:
`new URLSearchParams(location.search).get('fbtest') === '1'`. v2's
`submitBatch()` reads it from a window flag: `window.__feedback_testMode === true`.
A maintainer who runs `?fbtest=1` against a v2 batch will get production
labels (`client-feedback`) and a live Action trigger — defeating the
purpose of the test mode. Conversely, scripts that set
`window.__feedback_testMode` for v2 don't carry over to v1 fallback
submissions.

**Fix:** Use the same URL-based source of truth in both paths (or have v1
also read the window flag):

```js
// in submitBatch around line 1046:
var testModeFromUrl = new URLSearchParams(location.search).get('fbtest') === '1';
if (window.__feedback_testMode === true || testModeFromUrl) payload.testMode = true;
```

---

### WR-05: Unused import `MAX_IMAGE_BYTES` in `submit.ts` not covered by the `void` ritual

**File:** `src/pages/api/feedback/submit.ts:5, 16-21`

**Issue:** The KEEP-IN-SYNC `void` ritual at lines 16-21 pins `isVague`,
`MIN_VAGUE_LEN`, `VAGUE_STOPLIST`, `VAGUE_MESSAGE`, `MOVE_RESIZE_OPTIONS`,
and `INTENTS`, but `MAX_IMAGE_BYTES` is imported and never referenced. If
`tsconfig` flips on `noUnusedLocals` (Astro's strict tsconfig doesn't, but
"strict" plus `noUnusedLocals` is a one-line change), the build breaks.
The ritual itself signals "we care about contract surface here"; missing
one member contradicts the ritual.

**Fix:** Either remove `MAX_IMAGE_BYTES` from the import (it's only used
transitively via `validateEdit`), or add it to the void list:

```ts
void MAX_IMAGE_BYTES;
```

---

### WR-06: `mar-feedback-result` message listener checks `ev.origin` but not `ev.source`

**File:** `public/feedback-inject.js:1103-1184`

**Issue:** The listener guards against cross-origin spoofing, but any
same-origin context (e.g. a nested same-origin iframe, a script injected
via XSS elsewhere on the page) can post `mar-feedback-result` and drive
the state machine — e.g. trigger `clearStaged()` / `state = STATE.DONE` by
sending `{type: 'mar-feedback-result', ok: true}`.

**Fix:** Verify the message comes from the parent window:

```js
if (ev.source !== window.parent) return;
```

Same guard applies to the `mar-feedback-submit` listener in
`feedback.astro` if not already present.

---

### WR-07: `domPath` rehydration only uses the last path segment

**File:** `public/feedback-inject.js:1267`

**Issue:** `document.querySelector(saved.locator.domPath.split(' > ').pop())`
querySelects only the trailing segment (e.g. `div.foo:nth-of-type(3)`).
Multiple elements with the same class can match — first match wins. If
the page has shifted (carousel rotation, runtime translation overlay
swapping a parent), restore can re-anchor to the wrong element.

This is pre-existing v1 behaviour but worth noting since restore-after-
401 is a key resilience claim. The full `domPath` (joined with `>`) is
already a valid CSS selector; use it.

**Fix:**

```js
var cand = saved.locator.domPath && document.querySelector(saved.locator.domPath);
```

(Wrap in try/catch — `:nth-of-type(0)` is invalid CSS and could throw.)

---

### WR-08: `saveStaged` quota-exceeded errors silently swallowed; user sees Confirm working but nothing persists

**File:** `public/feedback-inject.js:356`

**Issue:** `sessionStorage.setItem(STAGED_KEY, JSON.stringify(arr))` is
wrapped in `try { ... } catch (e) {}`. If quota is exhausted (the staged
list of even 10 edits with descriptors is tiny — kBs — so this is rare,
but a user with 200 long descriptions per edit could in theory hit it),
the user keeps clicking "Confirm and stage" and sees the chip count
update from the in-memory list. But on iframe reload the staged list is
gone — descriptors were never persisted.

Actually, looking again: `stagedPush` calls `saveStaged(arr)` then
`renderChip(arr.length)` — but `arr.length` is computed from the variable
that was just pushed in memory; on next call `loadStaged()` returns the
stale (pre-quota-failure) sessionStorage value. So the chip count
oscillates / drops on reload.

**Fix:** Surface the quota failure:

```js
function saveStaged(arr) {
  try {
    sessionStorage.setItem(STAGED_KEY, JSON.stringify(arr));
    return true;
  } catch (e) {
    return false;
  }
}
// in stagedPush:
if (!saveStaged(arr)) {
  lastCapMessage = 'Could not save the staged list — local storage is full. Submit or clear some items first.';
  renderPanel({ capMessage: lastCapMessage });
  return;
}
```

---

### WR-09: `safeName` regex does not block `..` filenames; relies on GitHub Contents API URL semantics

**File:** `src/pages/api/feedback/submit.ts:278-282, 533-537`

**Issue:** `originalFilename: '../../escape'` → after clamp(120) +
`[^a-zA-Z0-9._-]+` → `-` → `..-..-escape`, then strip leading/trailing
dashes → `..-..-escape`. So path traversal is mostly defused at the
slash-stripping step. But `safeName: '..'` (literal two dots, allowed by
the class) is preserved verbatim. The full committed path becomes
`feedback-incoming/issue-NNN/..`. GitHub Contents API likely treats this
as a filename rather than a directory-up reference (URLs aren't filesystem
paths) so the practical impact is bounded — but a maintainer reading
`safeName.replace(/[^a-zA-Z0-9._-]+/g, '-')` reasonably assumes ".." is
blocked. It isn't.

**Fix:** Reject `..` post-sanitization:

```ts
const safeName =
  ((clamp(img.originalFilename, 120) || 'upload')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')   // strip leading/trailing dots too
    .replace(/\.{2,}/g, '.')          // collapse '..' sequences
  ) || 'upload';
```

---

### WR-10: Astro routability warning on `validate.ts` placed under `src/pages/api/feedback/`

**File:** `src/pages/api/feedback/validate.ts`

**Issue:** Per the prompt, this is deliberate per PATTERNS.md (shared
validator co-located with submit.ts so the KEEP-IN-SYNC contract is
greppable). Astro will warn at build time that the file is a route with
no GET handler (and no `prerender = false`). The file's banner comment
acknowledges this, but the operator running `astro build` will see the
warning every build with no in-code suppression hint.

**Fix (acknowledgement only):** Either move to `src/lib/feedback-validate.ts`
(loses the colocation greppability) or add an `export const GET: APIRoute`
that returns 404 explicitly so Astro stops warning:

```ts
export const prerender = false;
export const GET: APIRoute = async () => new Response(null, { status: 404 });
```

The latter is the minimum-disruption fix.

---

### WR-11: Smoke test scenarios 2/3 don't actually exercise the AUTO-ELIGIBLE autonomy hint

**File:** `scripts/smoke-feedback-v2.mjs:241-289`

**Issue:** `signalCount()` (validate.ts:54-61) requires `p.i18nKey AND
p.i18nAttr` for the i18n signal to count. Scenarios 2 and 3 build edits
with `i18nKey: 'k1'` but no `i18nAttr`, no `nearestHeading`, no
`imageRef`. Result: `signalCount === 0` for every edit. Server marks
batch as `NEEDS-REVIEW`. The smoke test asserts `/Autonomy hint:/`
matches anywhere in the body — that regex matches both AUTO-ELIGIBLE and
NEEDS-REVIEW lines, so the test passes but it's testing the failure
path. The "happy path (3 valid edits)" label is misleading.

**Fix:** Add `i18nAttr: 'data-i18n'` and `nearestHeading: 'A heading'` to
each scenario-2 edit so they pass the autonomy gate, then assert the
hint shape explicitly:

```js
if (!/Autonomy hint: AUTO-ELIGIBLE/.test(createBody.body)) {
  throw new Error('expected AUTO-ELIGIBLE hint, got: ' + createBody.body.slice(-200));
}
```

## Info

### IN-01: `import.meta.env` source-rewriting hook in smoke harness is global, not scoped

**File:** `scripts/smoke-feedback-v2.mjs:66-82`

**Issue:** `registerHooks({ load })` text-rewrites every module the runtime
loads if its source contains `import.meta.env` (including from
`node_modules` and unrelated `src/` files). For a smoke test that imports
only submit.ts + auth.ts this is largely harmless, but the rewrite is not
file-scoped — a third-party module that uses `import.meta.env` literally
in a comment or string literal also gets rewritten. Add an `if
(url.startsWith('file://.../src/'))` guard for safety.

---

### IN-02: Title-truncation uses code-unit `slice` — multibyte chars can be split mid-surrogate

**File:** `src/pages/api/feedback/submit.ts:248, 483`

**Issue:** `title.slice(0, 79) + '…'` slices by JS code units. A title
that ends in an emoji or non-BMP character at exactly position 79 leaves
a lone surrogate that GitHub will render as a replacement glyph. Edge
case; current titles are ASCII + accents (all BMP).

**Fix:** Use `Array.from(title).slice(0, 79).join('')` if non-ASCII
titles become common.

---

### IN-03: `signalCount` does not require any locator signal for `replace-photo` server-side

**File:** `src/pages/api/feedback/validate.ts:67-102`, cross-ref
`.github/CLAUDE_FEEDBACK.md` §1

**Issue:** `validateEdit` for `replace-photo` checks `img.present`,
`img.mime`, `img.dataBase64`, `img.bytes` — nothing about `imageRef`. The
Action's §1 locator-resolution ladder says photo replacement "drives off
`imageRef`". A client posting `intent: replace-photo` with no
`imageRef`, no `galleryAttrRaw`, etc., passes `validateEdit` and the
batch's signalCount is 0 → batch is NEEDS-REVIEW (correct), but the
issue body has no target indication. Minor: the Action can still resolve
via `domPath` / `outerHTMLSnippet`, but server-side accepting a photo
replacement with zero locator signals is loose.

**Fix (acknowledge):** No change needed — the NEEDS-REVIEW labelling
catches this. Document in PATTERNS.md that a missing `imageRef` for
replace-photo is permissible but downgrades to human review.

---

_Reviewed: 2026-05-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
