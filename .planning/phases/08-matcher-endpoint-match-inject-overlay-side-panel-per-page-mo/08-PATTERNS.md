# Phase 8: Matcher Endpoint + Match-Inject Overlay + Side Panel + Per-Page Mode — Pattern Map

**Mapped:** 2026-05-26
**Files analyzed:** 5 (3 new, 2 extended) — Phase 9 owns `scripts/smoke-feedback-match.mjs`, listed but not mapped here
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/pages/api/feedback/match.ts` | API route (controller) | request-response (auth-gated POST returning structured JSON) | `src/pages/api/feedback/clarify.ts` (POST half) + `src/pages/api/feedback/status/[issueNumber].ts` (GET half) | exact (same auth gate, same `json()` helper, same `prerender = false` first line) |
| `public/feedback-match-inject.js` | Browser inject (client overlay) | event-driven (postMessage + DOM observe) | `public/feedback-inject.js` (READ-ONLY per OPS-02 — pattern source only, not modified) | exact (same IIFE wrapper, CSS-string injection idiom, ACCENT constant, sessionStorage convention, `mar:feedback:*` postMessage shape) |
| `src/lib/feedback-version.ts` | Config constant (module) | none (compile-time const) | `src/lib/feedback-version.ts` itself (extend by appending second export) | exact (this IS the file; pattern is "named const with bump-on-change comment") |
| `src/pages/feedback.astro` | Astro page (parent shell) | request-response + postMessage | `src/pages/feedback.astro` itself (existing `.bar` chrome + `.frame-wrap` + `.rail` blocks at lines 58-97 + lines 130-148) | exact (extending in-place; CSS lives in same `<style>` block) |
| `src/layouts/BaseLayout.astro` | Astro layout (loader script) | event-driven (defer script insert on query param match) | `src/layouts/BaseLayout.astro` itself, lines 1024-1037 (the `?feedback=1` loader) | exact (NEW sibling block follows the same IIFE + `s.defer = true` + `document.body.appendChild` idiom) |
| `scripts/smoke-feedback-match.mjs` | (Phase 9) | — | — | deferred to Phase 9 — no analog needed in this phase |

---

## Pattern Assignments

### `src/pages/api/feedback/match.ts` (NEW — API route, request-response)

**Analog A — first-line + auth gate + JSON helper:** `src/pages/api/feedback/clarify.ts:1-32`
**Analog B — GET-handler auth short-circuit + structured-error returns:** `src/pages/api/feedback/status/[issueNumber].ts:21-50`
**Analog C — POST-handler body parse + 422 validation returns:** `src/pages/api/feedback/clarify.ts:116-136`
**Analog D — `fail()` / structured-error response shape:** `src/pages/api/feedback/submit.ts:120-153`

**Pattern 1 — File header: `prerender = false` MUST be the first line, then imports** (from `clarify.ts:1-4`):

```typescript
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth } from '../../../lib/auth';
```

Phase 8 note: also add `import Anthropic from '@anthropic-ai/sdk';` (third-party libs come after type imports / framework imports per CONVENTIONS.md "Import Organization").

**Pattern 2 — Env reads at top-of-file with literal SCREAMING_SNAKE_CASE consts** (from `status/[issueNumber].ts:11-15`):

```typescript
const GITHUB_TOKEN = (import.meta.env.GITHUB_TOKEN || '').trim();
const GITHUB_REPO = (import.meta.env.GITHUB_REPO || '').trim();
const VERCEL_TOKEN = (import.meta.env.VERCEL_TOKEN || '').trim();
```

Phase 8 note: `match.ts` adds exactly one such line — `const ANTHROPIC_API_KEY = (import.meta.env.ANTHROPIC_API_KEY || '').trim();`. Per MATCH-06 / OPS-03, a `public/`-tree grep for `ANTHROPIC_API_KEY` MUST return zero hits.

**Pattern 3 — `json()` response helper at module scope** (from `clarify.ts:27-32`):

```typescript
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

Phase 8 note: Re-use this exact helper shape verbatim. Status `[issueNumber].ts:17-19` uses a single-line variant `function json(body: unknown, status: number)` — `clarify.ts` style is preferred (default 200, formatted multi-line) and matches `submit.ts:120-125` `fail()`.

**Pattern 4 — Auth-gate short-circuit BEFORE any work** (from `clarify.ts:46-47` and `status/[issueNumber].ts:22-24`):

```typescript
export const POST: APIRoute = async ({ request }) => {
  if (!(await checkAuth(request))) return unauthorized();
  // ...
};
```

Where `unauthorized()` mirrors `clarify.ts:20-25`:

```typescript
function unauthorized() {
  return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

Phase 8 note: This is the literal MATCH-03 / D-09 gate. NO new login surface. Copy `unauthorized()` byte-for-byte from `clarify.ts:20-25`.

**Pattern 5 — Request body parse with 400-on-malformed** (from `clarify.ts:119-124`):

```typescript
let body: any;
try {
  body = await request.json();
} catch {
  return json({ ok: false, error: 'Invalid request body' }, 400);
}
```

Phase 8 note: Use the exact same idiom. Then validate `body.route` (string, non-empty) and `body.editList` (string, ≤ 10000 chars per MATCH-07) with 422 on cap violation.

**Pattern 6 — Top-level try/catch around the whole handler body with `err.message || 'Server error'` fallback** (from `clarify.ts:138-197`, particularly lines 195-197):

```typescript
try {
  // ... main work: load catalog, call Anthropic, validate IDs, return
  return json({ ok: true, /* matches */ });
} catch (err: any) {
  return json({ ok: false, error: err.message || 'Server error' }, 500);
}
```

Phase 8 note: For the structured `matcher_unavailable` 500 (MATCH-06 / D-13), bypass the generic catch with an early return: `return json({ ok: false, error: 'matcher_unavailable' }, 500);` when `ANTHROPIC_API_KEY` is missing OR when the retried Anthropic call fails.

**Pattern 7 — Cap-violation structured response** (from `submit.ts:142-153`):

```typescript
function failCap(
  cap: 'edits' | 'bytes',
  limit: number,
  actual: number,
  message: string,
  status = 422,
): Response {
  return new Response(
    JSON.stringify({ ok: false, error: message, cap, limit, actual }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}
```

Phase 8 note: MATCH-07 introduces two caps (`editList` chars > 10000, catalog entries > 150). Reuse this shape — emit `{ ok: false, error: '...', cap: 'edit-list-chars' | 'catalog-elements', limit, actual }` so the panel can switch on `data.cap` and render the locked copy from UI-SPEC.md ("That edit list is too long..." / "This page has too many editable elements...").

**Pattern 8 — Where to put the file:** `src/pages/api/feedback/match.ts` — kebab-case `.ts` under `src/pages/api/feedback/`, matching `submit.ts`, `validate.ts`, `clarify.ts`, `status/[issueNumber].ts` (CONVENTIONS.md: "API endpoints: `kebab-case.ts` under `src/pages/api/`").

---

### `public/feedback-match-inject.js` (NEW — browser inject, event-driven)

**Analog:** `public/feedback-inject.js` (READ-ONLY per OPS-02 — extract patterns; do NOT propose modifications).

**Pattern 1 — File header docstring + IIFE wrapper + iframe/query-string guards** (from `feedback-inject.js:1-19`):

```javascript
/*
 * Client-feedback inject script — guided "click anything, tell us what to
 * change" overlay for the LIVE Moulin à Rêves site.
 *
 * Runs ONLY inside the feedback iframe with `?feedback=1` (same iframe/query
 * guard shape as public/editor-inject.js). It is ADDITIVE and never touches
 * the editor flow. ...
 *
 * Cache-bust: loaded as /feedback-inject.js?v=<FEEDBACK_INJECT_VER>. Bump
 * src/lib/feedback-version.ts on every behavioural change here.
 */
(function () {
  if (window.parent === window) return;
  if (new URLSearchParams(location.search).get('feedback') !== '1') return;
  // ...
})();
```

Phase 8 note: For `feedback-match-inject.js`:
- Header docstring should reference OVERLAY-01..05, the cache-bust path `/feedback-match-inject.js?v=<MATCH_INJECT_VER>`, and the OPS-02 fence (this script is a sibling to `feedback-inject.js`, NEVER an import / fork).
- Guards: same `if (window.parent === window) return;` AND `if (new URLSearchParams(location.search).get('feedback') !== '1') return;` AND additionally `if (!new URLSearchParams(location.search).get('matchSet')) return;` (D-22 — only load when `matchSet=<id>` is also present).

**Pattern 2 — CSS-string injection via `<style>` appended to `document.documentElement`** (from `feedback-inject.js:70-123`):

```javascript
// ---- styles ---------------------------------------------------------------
var ACCENT = '#FF6B2B';
var style = document.createElement('style');
style.textContent =
  '[data-fb-hover]{outline:2px dashed rgba(255,107,43,.6)!important;outline-offset:3px!important;cursor:crosshair!important;}' +
  '[data-fb-frozen]{outline:2px solid ' + ACCENT + '!important;outline-offset:3px!important;background:rgba(255,107,43,.06)!important;}' +
  // ... ~50 lines of selectors concatenated with '+'
  '#mar-fb-panel-staged .mar-fb-staged-clear{background:#1e293b;color:#e2e8f0;border:1px solid #334155!important;}';
document.documentElement.appendChild(style);
```

Phase 8 note: Mirror this exact pattern. The `feedback-match-inject.js` CSS string is locked in UI-SPEC.md §5 (the four lines for `[data-fb-match]`, `[data-fb-match-pin]`, hover, focus-ring). Use `'#FF6B2B'` as a literal (NOT a token — see UI-SPEC.md "Color" notes; the iframe document doesn't share the parent's CSS custom properties). Re-declare `var ACCENT = '#FF6B2B';` at top of file to match `feedback-inject.js:71` so the in-iframe feedback visual language stays unified.

**Pattern 3 — sessionStorage key naming convention** (from `feedback-inject.js:34-38`):

```javascript
var DRAFT_KEY = 'mar_feedback_draft_v1';
// sessionStorage (NOT localStorage) per D-08 — stages survive iframe
// navigation + reload, clear on browser close. ...
var STAGED_KEY = 'mar_feedback_staged_v1';
```

Phase 8 note: The new match-inject uses `'mar_feedback_match_set_v1'` (D-03). Follow the SAME naming rule: `mar_feedback_<name>_v<version>` and `_v1` means "v1.x-family format; additive changes do NOT bump the suffix" (CONVENTIONS.md / code_context block). Read it like `feedback-inject.js` reads `STAGED_KEY`:

```javascript
var MATCH_SET_KEY = 'mar_feedback_match_set_v1';
try {
  var matchSet = JSON.parse(sessionStorage.getItem(MATCH_SET_KEY) || 'null');
} catch (_) { matchSet = null; }
```

Wrap every `JSON.parse(sessionStorage.getItem(...))` in `try { ... } catch (_) {}` exactly like `feedback.astro:174-178` `loadRecent()`.

**Pattern 4 — postMessage convention with explicit origin check** (from `feedback.astro:318-320` parent side; mirrors `feedback-inject.js` event consumer side):

```javascript
window.addEventListener('message', async function (ev) {
  if (ev.origin !== location.origin) return;
  var msg = ev.data;
  if (!msg || msg.type !== 'mar-feedback-submit') return;
  // ...
});
```

Phase 8 note: The new message types for v1.3 (CONTEXT.md §integration_points + UI-SPEC.md §5):
- `mar:feedback:matchset-stale` (iframe → panel, OVERLAY-02)
- `mar:feedback:match-pick-manually` (panel → iframe, PANEL-03)
- `mar:feedback:match-ready` (iframe → panel)
- `mar:feedback:match-focus` (panel → iframe, UI-SPEC.md §3)
- `mar:feedback:manual-resolved` (iframe → panel)

NOTE the **naming style difference**: v1.1 uses dash-separated `'mar-feedback-submit'`; v1.3 uses colon-separated `'mar:feedback:matchset-stale'` (per CONTEXT.md `<code_context>` block). This is intentional — the new namespace prefix keeps the two flows greppable. Use the colon-form consistently for all NEW message types.

Each `postMessage` call MUST pass `location.origin` as the second argument:

```javascript
window.parent.postMessage({ type: 'mar:feedback:matchset-stale', matchSetId: ... }, location.origin);
```

**Pattern 5 — Reading `<meta name="x-build-sha">` for drift detection (D-15):**

This meta tag is emitted by Phase 7's `buildSha` injection. Read pattern:

```javascript
var deployedSha = (document.querySelector('meta[name="x-build-sha"]') || {}).content || '';
if (matchSet && matchSet.buildSha && matchSet.buildSha !== deployedSha) {
  window.parent.postMessage({ type: 'mar:feedback:matchset-stale', matchSetId: matchSet.id }, location.origin);
  return; // paint NO pins
}
```

Phase 8 note: This is a NEW idiom (the v1.1 inject doesn't read `<meta name="x-build-sha">` because it doesn't care about catalog drift). Phase 7 emits the meta tag; Phase 8 consumes it.

**Pattern 6 — DOM querying priority order (OVERLAY-03):** `[data-i18n="X"]` → `img[src="Y"]` → `domPath`. Mirrors the locator-signal priority `feedback-inject.js` already uses for `captureLocator`. Implementation note: when querying `img[src]`, use the same exact attribute the catalog stored — usually the post-Astro-build optimised path like `/images/homes/le-moulin-hero.webp`. For each successful match, set `element.setAttribute('data-fb-match', String(lineIndex + 1))` (1-based, per OVERLAY-03 and UI-SPEC.md §5).

**Pattern 7 — No import from `feedback-inject.js` (OPS-02 / OVERLAY-05 fence):**

The two files share NO imports, NO state, NO global namespace pollution. `feedback-match-inject.js` re-derives `ACCENT = '#FF6B2B'` as a local `var` (do NOT try to read from `window.MAR_FEEDBACK_*` or similar — `feedback-inject.js` does not expose globals). Anti-pattern guardrail #1 from UI-SPEC.md: "Do not import from `feedback-inject.js`. `feedback-match-inject.js` is a sibling, not a child."

---

### `src/lib/feedback-version.ts` (EXTEND — config constant module)

**Analog:** the file itself (`src/lib/feedback-version.ts:1-13`).

**Existing content** (13 lines, full file):

```typescript
// Single source of truth for the client-feedback inject cache-bust version.
//
// public/feedback-inject.js is loaded with `defer` from BaseLayout.astro and
// is cached aggressively by the Vercel CDN (same landmine as editor-inject.js,
// see CLAUDE.md). BUMP THIS STRING on every behavioural change to
// public/feedback-inject.js so the `?v=` query string changes and clients
// stop being served the stale script.
//
// Imported by:
//   - src/layouts/BaseLayout.astro  (the `?feedback=1` inline loader)
//   - src/pages/feedback.astro      (the iframe `src` query string)
export const FEEDBACK_INJECT_VER = '4';
```

**Pattern to follow when appending:** named-const string export, preceded by a comment block that (a) explains what it cache-busts, (b) lists the two import sites, (c) says "BUMP THIS STRING on every behavioural change". Append immediately below the existing export so the file stays self-documenting top-to-bottom.

**Phase 8 addition** (D-23):

```typescript
// Single source of truth for the client-feedback MATCH-inject cache-bust
// version (v1.3 per-page matcher overlay, OPS-01).
//
// public/feedback-match-inject.js is loaded with `defer` from BaseLayout.astro
// (alongside but separate from the `?feedback=1` loader) and is cached
// aggressively by the Vercel CDN (same landmine as editor-inject.js / feedback-
// inject.js). BUMP THIS STRING on every behavioural change to
// public/feedback-match-inject.js so the `?v=` query string changes and
// clients stop being served the stale script.
//
// Imported by:
//   - src/layouts/BaseLayout.astro  (the `?feedback=1&matchSet=…` inline loader, D-22)
//   - src/pages/feedback.astro      (the iframe `src` query string when building per-page match URLs)
export const MATCH_INJECT_VER = '1';
```

Phase 8 note: `FEEDBACK_INJECT_VER` stays at `'4'` (D-23) — do NOT bump it. The OPS-02 fence requires `feedback-inject.js` to be byte-for-byte unchanged, so its version constant must not change either.

---

### `src/pages/feedback.astro` (EXTEND — Astro page, parent shell)

**Analog:** the file itself. Patterns to follow when adding new chrome.

**Pattern 1 — Frontmatter shape** (from `feedback.astro:1-30`):

```astro
---
export const prerender = false;

import { checkAuth } from '../lib/auth';
import { FEEDBACK_INJECT_VER as VER } from '../lib/feedback-version';

// Auth gate in the frontmatter (SSR — prerender=false). ...
const authed = await checkAuth(Astro.request);

// Public routes the client can leave feedback on, in nav-ish order.
const PAGES: { label: string; route: string }[] = [
  { label: 'Home', route: '/' },
  // ...
];
const firstSrc = `/?feedback=1&v=${VER}`;
---
```

Phase 8 note: Extend the import to add `MATCH_INJECT_VER` from the same module:

```typescript
import { FEEDBACK_INJECT_VER as VER, MATCH_INJECT_VER as MVER } from '../lib/feedback-version';
```

Pre-build per-page match URL builder pattern in the frontmatter (mirroring `firstSrc`):

```typescript
// Builder helper; the actual URL is also assembled client-side after the match call.
const matchSrcPrefix = `?feedback=1&v=${VER}&matchSet=`; // append <id>&mvr=${MVER}
```

**Pattern 2 — CSS lives in the existing `<style>` block (lines 39-98).** Per UI-SPEC.md File Ownership and Anti-Pattern Guardrail #2 ("Do not modify `src/styles/global.css`"). The existing `:root` block (line 41) declares the operator-theme tokens:

```css
:root { --bg:#0f172a; --panel:#1e293b; --line:#334155; --ink:#e2e8f0; --muted:#94a3b8; --accent:#FF6B2B; --accent-2:#6366f1; }
```

These are the ONLY color tokens the new mode tabs / match-input / side panel / drift banner use. Do not introduce new CSS custom properties (UI-SPEC.md "Token Re-use vs New Tokens"). Add new BEM blocks: `.mode-tabs`, `.match-input`, `.match-pane`, `.match-panel`, `.match-drift-banner` per UI-SPEC.md §Component Inventory.

**Pattern 3 — BEM block-and-state class convention** (CONVENTIONS.md "CSS classes"). Existing examples in `feedback.astro` use `.rail__row` + `.rail__row.is-live` (line 96). Mirror this for new blocks: `.match-panel__row` + `.match-panel__row--approved`, `--rejected`, `--manual`, etc. Modifier (`--`) syntax for permanent variants, `.is-*` for transient state.

**Pattern 4 — `<script is:inline define:vars={...}>` for parent-shell JS that needs build-time consts** (from `feedback.astro:156`):

```astro
<script is:inline define:vars={{ VER }}>
  (function () {
    var iframe = document.getElementById('site');
    var picker = document.getElementById('pagePick');
    // ...
  })();
</script>
```

Phase 8 note: Extend `define:vars` to include both versions and the page list for the match picker:

```astro
<script is:inline define:vars={{ VER, MVER, PAGES }}>
  (function () {
    // mode-tab switcher, match-input handler, side-panel renderer, postMessage listener
  })();
</script>
```

Keep the script inside the existing `{authed && (<>... </>)}` block (lines 128-396) so the auth-gated UI continues to be guarded by the SSR `checkAuth` result.

**Pattern 5 — postMessage parent-side listener with origin check** (from `feedback.astro:318-321`):

```javascript
window.addEventListener('message', async function (ev) {
  if (ev.origin !== location.origin) return;
  var msg = ev.data;
  if (!msg || msg.type !== 'mar-feedback-submit') return;
  // ...
});
```

Phase 8 note: Add SECOND listener (or extend dispatcher inside the existing one) for the v1.3 `mar:feedback:*` namespace. The v1.1 dispatcher MUST be untouched — its `if (!msg || msg.type !== 'mar-feedback-submit') return;` early-out means v1.3 colon-form messages naturally bypass it.

**Pattern 6 — `.working` scrim re-use** (from `feedback.astro:79-80, 149`):

```css
.working { position:fixed; inset:0; background:rgba(15,23,42,.55); display:none; align-items:center; justify-content:center; z-index:60; font-size:.95rem; }
.working.show { display:flex; }
```

```astro
<div class="working" id="working">Sending your feedback…</div>
```

Phase 8 note: Reuse the existing `.working` div. Change the inner text dynamically when the matcher is in flight (UI-SPEC.md §10 "Loading state"):

```javascript
working.innerHTML = '<div><strong>Matching your edits…</strong><br><span style="color:var(--muted);font-size:.85rem;">Asking Claude to find each line on the page. This usually takes 3–6 seconds.</span></div>';
working.classList.add('show');
```

**Pattern 7 — HEAD-probe pattern for catalog availability (D-21):**

No existing analog in `feedback.astro` — this is a new pattern. Build it after the picker-change listener pattern (line 298-301):

```javascript
picker.addEventListener('change', function () {
  iframe.src = picker.value + '?feedback=1&v=' + VER;
  hideToast();
});
```

Phase 8 addition (sibling listener on the SECOND picker, `matchPagePick`, per UI-SPEC.md §2):

```javascript
matchPicker.addEventListener('change', async function () {
  var route = matchPicker.value;
  matchSubmitBtn.disabled = true;
  matchHint.hidden = true;
  try {
    var probe = await fetch('/edit-catalogs' + route + '.json', { method: 'HEAD', credentials: 'same-origin' });
    if (probe.ok) {
      matchSubmitBtn.disabled = !(matchTextarea.value.trim().length > 0 && matchTextarea.value.length <= 10000);
    } else {
      matchHint.hidden = false;
    }
  } catch (_) {
    matchHint.hidden = false;
  }
});
```

---

### `src/layouts/BaseLayout.astro` (EXTEND — Astro layout, loader script)

**Analog:** lines 1024-1037 (the existing `?feedback=1` loader), and line 3 (the top-of-file import).

**Pattern 1 — Top-of-file import extension** (from `BaseLayout.astro:1-3`):

```astro
---
import '../styles/global.css';
import { FEEDBACK_INJECT_VER } from '../lib/feedback-version';
```

Phase 8 addition: extend the named-import list (do NOT add a second import statement):

```astro
import { FEEDBACK_INJECT_VER, MATCH_INJECT_VER } from '../lib/feedback-version';
```

**Pattern 2 — Inline-script loader IIFE** (the literal pattern at `BaseLayout.astro:1024-1037`):

```astro
<!-- Client-feedback overlay (only loads inside the feedback iframe with ?feedback=1) -->
<script is:inline define:vars={{ feedbackVer: FEEDBACK_INJECT_VER }}>
  (function () {
    try {
      var qs = new URLSearchParams(location.search);
      if (qs.get('feedback') !== '1') return;
      if (window.parent === window) return;
      var s = document.createElement('script');
      s.src = '/feedback-inject.js?v=' + feedbackVer;
      s.defer = true;
      document.body.appendChild(s);
    } catch (_) {}
  })();
</script>
```

**Pattern 3 — NEW sibling block (DO NOT MODIFY THE ABOVE)** per D-22, Anti-Pattern Guardrail #3 from UI-SPEC.md ("Do not modify the existing `?feedback=1` loader block in `BaseLayout.astro` (lines 1024-1037). Add a NEW sibling block below it (D-22). The existing block stays byte-identical (OPS-02)."):

Phase 8 inserts immediately AFTER line 1037 (before line 1039 chocolate-popup):

```astro
<!-- Client-feedback MATCH overlay (only loads inside the feedback iframe with ?feedback=1 AND ?matchSet=<id>) -->
<script is:inline define:vars={{ matchVer: MATCH_INJECT_VER }}>
  (function () {
    try {
      var qs = new URLSearchParams(location.search);
      if (qs.get('feedback') !== '1') return;
      if (!qs.get('matchSet')) return;
      if (window.parent === window) return;
      var s = document.createElement('script');
      s.src = '/feedback-match-inject.js?v=' + matchVer;
      s.defer = true;
      document.body.appendChild(s);
    } catch (_) {}
  })();
</script>
```

Phase 8 note — three idiom-level rules from the analog:
1. Same `try { ... } catch (_) {}` shape (silent — never break BaseLayout if the inject can't be appended).
2. Same triple-guard `feedback === '1'` AND `window.parent !== window` AND (NEW) `matchSet` query param present. The two flows are independent loaders; both run conditionally.
3. Same `s.defer = true` and `document.body.appendChild(s)`. Cache-bust via `?v=' + matchVer`.

---

## Shared Patterns

### Authentication (HMAC-cookie session)

**Source:** `src/lib/auth.ts` (full file, 56 lines)
**Apply to:** `src/pages/api/feedback/match.ts` (verbatim — same import path `../../../lib/auth`)

```typescript
import { checkAuth } from '../../../lib/auth';
// ...
if (!(await checkAuth(request))) return unauthorized();
```

Returns 401 with `{ ok: false, error: 'Unauthorized' }` (`clarify.ts:20-25` pattern). Used identically by `submit.ts`, `validate.ts` (transitively), `clarify.ts`, `status/[issueNumber].ts`. Phase 8 adds `match.ts` to that list.

### Error Handling (try/catch around handler body + structured error returns)

**Source:** `src/pages/api/feedback/clarify.ts:138-197` and `src/pages/api/feedback/submit.ts:120-153`
**Apply to:** `src/pages/api/feedback/match.ts`

Pattern:
- Top-level `try { ... } catch (err: any) { return json({ ok: false, error: err.message || 'Server error' }, 500); }` wraps the entire main work block.
- Validation failures → 422 with `{ ok: false, error: 'human message' }`.
- Cap violations → 422 with `{ ok: false, error, cap, limit, actual }`.
- Auth failure → 401 with `{ ok: false, error: 'Unauthorized' }`.
- Catalog missing → 404 with `{ ok: false, error: 'no_catalog', route }` (MATCH-02).
- Anthropic unavailable / key missing → 500 with `{ ok: false, error: 'matcher_unavailable' }` (MATCH-06).

### Response Body Shape

**Source:** `src/pages/api/feedback/clarify.ts` (uses `{ ok: true, items }` / `{ ok: false, error }`)
**Apply to:** `src/pages/api/feedback/match.ts`

On success (MATCH-04):

```typescript
return json({
  ok: true,
  matchSetId: 'ms_' + crypto.randomUUID(),
  buildSha: deployedBuildSha,
  matches: [
    { line: '...', primaryId: 'hero.heading', primaryConfidence: 0.87, alternates: ['hero.eyebrow', 'hero.cta'], reason: '...' },
    // ...
  ],
});
```

Phase 8 note: D-14 — server-side ID validation. After Anthropic returns, every `primaryId` and every entry in `alternates[]` is checked against an in-memory `Set<catalogId>` built from the loaded catalog. Unknown IDs are silently stripped. `primaryId` that fails validation becomes `null`.

### sessionStorage Convention

**Source:** `public/feedback-inject.js:34-38` and `feedback.astro:167` (`mar_feedback_recent_v1` localStorage), CONTEXT.md D-03 (`mar_feedback_match_set_v1`)
**Apply to:** parent-shell JS in `feedback.astro` AND inject in `feedback-match-inject.js`

| Key | Storage | Owner | Lifecycle |
|-----|---------|-------|-----------|
| `mar_feedback_draft_v1` | sessionStorage | `feedback-inject.js` (v1.1) | per-element draft |
| `mar_feedback_staged_v1` | sessionStorage | `feedback-inject.js` (v1.1) — shared write target for Phase 8 Approve | clears on Submit batch or close |
| `mar_feedback_recent_v1` | localStorage | `feedback.astro` rail | persists across browser close |
| `mar_feedback_match_set_v1` | sessionStorage | Phase 8 new (D-03) | latest match set wins; clears on browser close |

Every read wrapped in `try { JSON.parse(...) } catch (_) { /* fallback */ }`. Every write wrapped in `try { ... } catch (_) {}` for private-mode safety (CONVENTIONS.md "Error Handling" / `feedback.astro:179-181`).

### postMessage with explicit origin check

**Source:** `feedback.astro:318-320` (parent) and `feedback-inject.js` (iframe)
**Apply to:** `feedback-match-inject.js` (iframe → parent) AND new listener in `feedback.astro` (parent → iframe)

Every cross-frame message:
- Listener: `if (ev.origin !== location.origin) return;` as the first line.
- Sender: pass `location.origin` as the second argument to `postMessage`.
- Type-name convention for NEW messages: `mar:feedback:*` (colon-separated). Existing v1.1 messages (`mar-feedback-submit`, `mar-feedback-result`) keep their dash-form. Both styles co-exist; type-name is the dispatch key.

### Astro frontmatter + `<script is:inline define:vars={{ ... }}>` for build-time const bridging

**Source:** `BaseLayout.astro:1025` (`feedbackVer: FEEDBACK_INJECT_VER`) and `feedback.astro:156` (`define:vars={{ VER }}`)
**Apply to:** the new BaseLayout loader (`matchVer: MATCH_INJECT_VER`) AND the new feedback.astro script tags that need `MVER` or page list

`define:vars` injects values as plain `var` declarations inside the inline script — they become typed `const` references in the frontmatter and untyped `var` in the script. Use `is:inline` (NOT plain `<script>`) so Astro does NOT bundle/process the block — required for the IIFE + iframe-loader pattern.

---

## No Analog Found

No files in this phase lack an analog. Every new file has either an exact-match or pattern-source analog in the existing codebase:

- `match.ts` — analog: `clarify.ts` / `status/[issueNumber].ts` / `submit.ts` helpers
- `feedback-match-inject.js` — analog: `feedback-inject.js` (read-only, OPS-02 fenced)
- `feedback-version.ts` (extend) — analog: itself
- `feedback.astro` (extend) — analog: itself
- `BaseLayout.astro` (extend) — analog: lines 1024-1037 in itself

Phase 9 owns `scripts/smoke-feedback-match.mjs` — pattern source there will be the existing `scripts/canary.sh` infrastructure (per OPS-05); NOT mapped here.

---

## Anthropic SDK — first-time integration (NO existing analog)

**Status:** The project does NOT currently use `@anthropic-ai/sdk`. Phase 8 adds it as a runtime dependency. Per RESEARCH.md and CONTEXT.md `<code_context>` block:

> `@anthropic-ai/sdk` — NOT YET INSTALLED. Phase 8 plan must add it to `dependencies` (not `devDependencies` — it's used at runtime in `src/pages/api/feedback/match.ts`).

Phase 8 SDK call shape (D-10..D-14) — no codebase analog, so this is the reference patten the planner should ground on (drawn from CONTEXT.md decisions):

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const response = await client.messages.create({
  model: 'claude-haiku-4-5',
  max_tokens: Math.min(8192, 64 + 96 * lineCount),
  temperature: 0,
  tools: [{
    name: 'match_edits',
    description: 'Map each freeform edit line to a catalog element ID.',
    input_schema: {
      type: 'object',
      properties: {
        matches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'string' },
              primaryId: { type: ['string', 'null'] },
              primaryConfidence: { type: 'number' },
              alternates: { type: 'array', items: { type: 'string' }, maxItems: 2 },
              reason: { type: 'string' },
            },
            required: ['line', 'primaryId', 'primaryConfidence', 'alternates', 'reason'],
          },
        },
      },
      required: ['matches'],
    },
  }],
  tool_choice: { type: 'tool', name: 'match_edits' },
  messages: [{ role: 'user', content: prompt }],
});

// Extract the tool-use block
const toolUse = response.content.find((c) => c.type === 'tool_use');
const matches = (toolUse as any)?.input?.matches ?? [];
```

Retry/timeout (D-13): one retry on `5xx` / `429` with 2s linear backoff; 25s total timeout via `AbortController` (Vercel function default 30s; reserve 5s).

---

## Metadata

**Analog search scope:**
- `src/pages/api/feedback/` (4 files — submit, validate, clarify, status)
- `src/pages/feedback.astro` (the parent shell — extended in-place)
- `src/lib/` (auth, feedback-version, feedback-status)
- `src/layouts/BaseLayout.astro` (the loader site)
- `public/feedback-inject.js` (READ-ONLY pattern source for the new inject)

**Files scanned:** 11 (5 API routes, 2 lib helpers, 1 layout, 1 parent shell, 1 inject, 1 SDK reference)

**Pattern extraction date:** 2026-05-26

**Phase boundary alignment:**
- OPS-02 fence respected: `feedback-inject.js`, `submit.ts`, `validate.ts`, `BaseLayout.astro:1024-1037` block, `editor-inject.js`, `editor/`, `guardrails.js`, `site/*`, `middleware.ts` are all READ-ONLY references — no modification patterns proposed.
- Phase 7 `dist/edit-catalogs/<route>.json` is consumed via filesystem read (not modified).
- Phase 9 OPS-05 (`scripts/smoke-feedback-match.mjs`) deferred.
