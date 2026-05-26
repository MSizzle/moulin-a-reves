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
