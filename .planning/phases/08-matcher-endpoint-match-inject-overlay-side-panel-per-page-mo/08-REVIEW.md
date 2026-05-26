---
phase: 08-matcher-endpoint-match-inject-overlay-side-panel-per-page-mo
reviewed: 2026-05-26T19:46:18Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/lib/feedback-version.ts
  - src/lib/build-sha.ts
  - src/pages/api/feedback/match.ts
  - src/pages/feedback.astro
  - public/feedback-match-inject.js
  - src/layouts/BaseLayout.astro
  - astro.config.mjs
findings:
  critical: 0
  warning: 5
  info: 5
  total: 10
status: issues_found
---

# Phase 8: Code Review Report

**Reviewed:** 2026-05-26T19:46:18Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Phase 8 delivers a non-trivial matcher endpoint, a sibling iframe inject, a side-panel render+state machine, and a drift-detection meta tag. The security-critical surface area (auth gate, prompt-injection containment via forced tool-use + server-side ID validation, OPS-02 fence between v1.1 and v1.3 injects) is well-handled — auth short-circuits before any work, the Anthropic call is wrapped in forced tool-use with subsequent server-side ID validation against the catalog, and the match-inject loader has three independent fence checks (`?feedback=1`, `?matchSet=*`, `window.parent !== window`) at both the loader and the inject itself.

No BLOCKER issues. Five WARNINGs concentrated in: (1) a broken single-source-of-truth pattern for `MATCH_INJECT_VER` where the BaseLayout loader silently falls back to literal `'1'`, (2) dead-code mismatch between the inject's `kind === 'i18n-placeholder'` branch and the walker's actual emission (`'i18n-text'`), (3) inconsistent guard in `handleUndo`, (4) a misleading retry-timeout interaction, and (5) leak surface in the matcher response where `err?.message` is forwarded to the client. Info findings include pre-existing `innerHTML` interpolation paths in `subBlock` (v1.2 code, not introduced by this phase but resident in a reviewed file) and minor architecture comments that don't match the code.

The v1.1 `mar-feedback-submit` listener (lines 474-548 in feedback.astro) is byte-identical to its v1.1 form and was not touched. The OPS-02 fence (disjoint attribute namespaces `data-fb-frozen` vs `data-fb-match`, disjoint sessionStorage keys `mar_feedback_staged_v1` vs `mar_feedback_match_set_v1`) holds — `public/feedback-match-inject.js` does not query, mutate, or import any v1.1 state.

## Warnings

### WR-01: `MATCH_INJECT_VER` single-source-of-truth pattern is broken — BaseLayout loader uses literal `'1'` fallback

**File:** `src/layouts/BaseLayout.astro:1049` (in conjunction with `src/lib/feedback-version.ts:27`)
**Issue:** The doc comment in `src/lib/feedback-version.ts:24-26` declares that `MATCH_INJECT_VER` is "Imported by ... `src/layouts/BaseLayout.astro` (the `?feedback=1&matchSet=…` inline loader, D-22)". It is NOT. `BaseLayout.astro:3` only imports `FEEDBACK_INJECT_VER`. The match-inject loader on line 1049 reads the version from the iframe URL query string (`qs.get('matchVer') || '1'`), so the value flows in as user-controllable URL data instead of as a build-time-pinned constant. If `feedback.astro` ever stops passing `&matchVer=…` (regression risk on any future edit to the iframe-src builder at line 698), every match-inject load silently pins to `?v=1` regardless of what `MATCH_INJECT_VER` is bumped to in `feedback-version.ts`. The CDN landmine that the constant is supposed to mitigate (per the comment on line 17-22 of feedback-version.ts) returns.

Also: the literal `'1'` happens to equal the current value of `MATCH_INJECT_VER`. The bug is invisible today and only manifests on the next bump.

**Fix:** Import the constant into BaseLayout and use it as the fallback, mirroring the v1.1 loader on line 1027.
```astro
---
import { FEEDBACK_INJECT_VER, MATCH_INJECT_VER } from '../lib/feedback-version';
import { BUILD_SHA_VALUE as BUILD_SHA } from '../lib/build-sha';
---
...
<script is:inline define:vars={{ matchVer: MATCH_INJECT_VER }}>
  (function () {
    try {
      var qs = new URLSearchParams(location.search);
      if (qs.get('feedback') !== '1') return;
      if (!qs.get('matchSet')) return;
      if (window.parent === window) return;
      // Trust the build-time constant; the URL hint is a redundant cache-bust signal at best.
      var v = qs.get('matchVer') || matchVer;
      var s = document.createElement('script');
      s.src = '/feedback-match-inject.js?v=' + encodeURIComponent(v);
      s.defer = true;
      document.body.appendChild(s);
    } catch (_) {}
  })();
</script>
```

### WR-02: Dead branch in `resolveElement` — `kind === 'i18n-placeholder'` is unreachable

**File:** `public/feedback-match-inject.js:135` and `src/pages/api/feedback/match.ts:12`
**Issue:** The inject's OVERLAY-03 priority chain matches against `entry.kind === 'i18n-placeholder'`, but the catalog walker (`src/integrations/edit-catalog/walker.mjs:119`) classifies elements carrying `data-i18n-placeholder` as kind `'i18n-text'`, not `'i18n-placeholder'`. The `CatalogEntry` type in `match.ts:12` likewise lists only `'i18n-text' | 'i18n-html' | 'image' | 'gallery-image' | 'heading' | 'hardcoded-text'`. The `i18n-placeholder` branch will never execute.

This is benign today because the `'i18n-text'` branch handles the same input elements correctly (the walker stores the placeholder element with `i18nAttr === 'data-i18n-placeholder'` and `kind === 'i18n-text'`, and the existing branch selects on i18nAttr+i18nKey). But the misleading branch hides intent and will confuse the next reader of the inject.

**Fix:** Remove the `'i18n-placeholder'` literal — the existing two-kind check already covers placeholder elements.
```javascript
if (
  (entry.kind === 'i18n-text' || entry.kind === 'i18n-html') &&
  typeof entry.i18nKey === 'string' && entry.i18nKey &&
  typeof entry.i18nAttr === 'string' && entry.i18nAttr
) {
  ...
}
```

### WR-03: `handleUndo` mutates `ms.rowStates[i].status` without guarding for rowStates length

**File:** `src/pages/feedback.astro:1048-1062`
**Issue:** `handleUndo` checks `if (!ms || !ms.matches[i]) return;` (line 1051) before mutating `ms.rowStates[i].status` on line 1059. The sister handlers `handleReject` (line 1066), `handleRestore` (line 1075), and `handlePickManually` (line 1090) all check `!ms.rowStates[i]`. If `matches` and `rowStates` ever drift (e.g., older sessionStorage payload from a prior schema, or a partial write under quota pressure), `handleUndo` throws `Cannot set properties of undefined`, breaking the panel until reload.

Today the two arrays are written together (line 690 sets `rowStates` from `matches`), so the drift is unlikely — but the guard is one inconsistent line across four near-identical handlers.

**Fix:** Align the guard with the other handlers.
```javascript
function handleUndo(i) {
  var ms = loadMatchSet();
  if (!ms || !ms.matches[i] || !ms.rowStates[i]) return;
  ...
}
```

### WR-04: Anthropic retry shares the original 25s timeout budget (misleading comment)

**File:** `src/pages/api/feedback/match.ts:240-255` and `:371-390`
**Issue:** The comment "D-13: 25s, leaves 5s headroom under Vercel 30s default" (line 49) and "Anthropic call with 25s AbortController timeout + 1 retry" (line 371) suggest each call gets up to 25s. They do not. `setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS)` is started once, outside the retry loop. If the first call consumes 22s before throwing a 5xx, `callAnthropicWithRetry` then `await new Promise(r => setTimeout(r, 2000))` (line 252), burning another 2s on the same shared budget — leaving only ~1s for the retry call before the AbortController fires mid-flight. The retry will almost always fail.

This is "graceful matcher_unavailable" by design (line 387), so the user-visible behaviour is acceptable. But the comment lies, and operators triaging matcher_unavailable rates will reach for the wrong fix.

**Fix:** Either (a) move the timer reset into the retry path so the second call gets a fresh budget — but then the total wall-clock could exceed Vercel's 30s. Or (b) clarify the comment.
```typescript
const ANTHROPIC_TIMEOUT_MS = 25000; // D-13: 25s TOTAL budget for the original
                                    // call + its 2s backoff + the retry call,
                                    // leaving ~5s under Vercel's 30s function ceiling.
                                    // A first-call failure near the budget edge
                                    // will time out the retry; that is by design —
                                    // we return 'matcher_unavailable' rather than
                                    // double the wall-clock.
```

### WR-05: Matcher response leaks raw error messages on the catch-all 500 path

**File:** `src/pages/api/feedback/match.ts:407-409`
**Issue:** The handler's outer `catch` returns `err?.message || 'Server error'`:
```typescript
} catch (err: any) {
  return json({ ok: false, error: err?.message || 'Server error' }, 500);
}
```
The endpoint is auth-gated, so the audience for any leak is the (authorised) operator. But every other matcher failure path goes through the structured `matcher_unavailable` (line 368, 387) which exposes no internal text. Forwarding `err.message` is inconsistent with the design and can surface stack-frame hints, native Node error contents, or third-party library strings that depend on environment configuration. The body parse `try` (line 302-306) and validators (lines 309-323) already cover the foreseeable user-input errors, so reaching this catch-all means an unexpected runtime fault — exactly the kind that should not leak details.

Also note: the project's own convention (`CLAUDE.md` Error Handling section: "Wrap the entire handler body in `try { ... } catch { ... }` and return a generic 500 with `{ error: 'Server error' }`") matches the other API routes — `match.ts` deviates.

**Fix:** Match the project convention and the rest of this file's structured-error pattern.
```typescript
} catch (_err) {
  return json({ ok: false, error: 'Server error' }, 500);
}
```

## Info

### IN-01: `subBlock` interpolates server-controlled URLs into innerHTML without `escapeHtml`

**File:** `src/pages/feedback.astro:351, 356`
**Issue:** `subBlock(item)` builds an HTML string containing `item.deployUrl` (line 351) and `item.issueUrl` (line 356) by direct concatenation, while the sister rendering call site at line 384 uses `escapeHtml(item.issueUrl)`. These values come from `/api/feedback/status/:n` (server-trusted) and are unlikely to carry hostile content, but the inconsistency is a footgun if the status endpoint's contract ever drifts. Not introduced by Phase 8 (this is v1.2 rail code), but lives in a file under review.
**Fix:** Use `escapeHtml(item.issueUrl)` / `escapeHtml(item.deployUrl)` for consistency with line 384.

### IN-02: `BUILD_SHA_VALUE` fallback `'unknown'` flows into the deployed meta tag in non-prod sandboxes

**File:** `src/lib/build-sha.ts:21`
**Issue:** The comment block explains that the fallback `'unknown'` "is rejected as a hard failure by the Phase 7 catalog audit script (scripts/check-edit-catalogs.mjs) so it cannot reach a Vercel deploy". Confirmed: prebuild guards the production path. In local dev/preview the fallback can flow through, which means `<meta name="x-build-sha" content="unknown">` would render. In the inject, `deployedSha()` then returns `'unknown'`, and the drift comparison `matchSet.buildSha !== deployed` would compare against the same `'unknown'` if the catalog generation ALSO fell back — and silently mark fresh matchSets as drifted. Low likelihood (both paths would have to fall back together in a non-production sandbox), but a debugging time-sink if it happens.
**Fix:** Optionally short-circuit the drift comparison when either side equals `'unknown'`. Today's code already short-circuits when `deployed === ''`; add the symmetric guard for `'unknown'` in `public/feedback-match-inject.js:277` and document the local-dev behaviour.

### IN-03: `failCap` signature accepts `message` but caller never passes a non-string

**File:** `src/pages/api/feedback/match.ts:69-80`
**Issue:** `failCap` typed `message: string` and called with hard-coded English strings (lines 328-333, 358-362). Functionally fine. However, these copy strings are duplicated between the server (here) and the client (`feedback.astro:675-677` — "That edit list is too long. Try splitting it into smaller batches." etc.) The client already maps `data.cap === 'edit-list-chars'` → its own copy and ignores the server's `error` field for that case. The server-side string is dead UX text — never user-visible.
**Fix:** Replace the server `message` arg with a stable error code (e.g., `cap_exceeded`) and let the client own the copy. Saves a translation footgun if the site ever bilingualises operator-facing UI.

### IN-04: `/edit-catalogs/<slug>.json` is publicly served — exposes site DOM structure

**File:** `src/integrations/edit-catalog/index.mjs` (out of scope) — observable consequence in `src/pages/api/feedback/match.ts:126-141`
**Issue:** Per the CATALOG-06 decision documented in the integration, `dist/client/edit-catalogs/*.json` ships unguarded so the feedback function can fetch its own deployment's catalog over same-origin HTTP (not over filesystem). The trade-off is that anyone hitting `https://www.moulinareves.com/edit-catalogs/index.json` gets a structured map of every i18n key, current text (EN + FR), nearest heading, and DOM path for every editable element on the site. This is a deliberate, documented trade-off, not a vulnerability — but worth flagging because the matcher endpoint is the only public-surface consumer.
**Fix:** None required for v1. If sensitive copy ever lands in the catalog (e.g., unpublished drafts), reconsider gating `/edit-catalogs/` via the same `checkAuth` cookie or via an edge middleware that rewrites unauthenticated requests to 404.

### IN-05: `parseEditList` strips lines beginning with `#` — could surprise operators using `#1` as a literal

**File:** `src/pages/api/feedback/match.ts:97`
**Issue:** The tokenizer treats any line matching `/^#+\s/` as a Markdown header and drops it (per MATCH-05). An operator who pastes `## Hero section` will have that line silently consumed as context. So far so good. But `### change "1 hour from Paris" to "1.5 hours"` will also disappear — the regex requires whitespace after the `#+`, so this is mostly safe; `#1` (no space) survives. Still, the silent drop is surprising and there's no UX surface that says "headers are treated as context".
**Fix:** Document the behaviour in the textarea placeholder (UI-SPEC §10) or echo "Treated 2 lines as headers" back in the response so the operator can verify intent.

---

_Reviewed: 2026-05-26T19:46:18Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
