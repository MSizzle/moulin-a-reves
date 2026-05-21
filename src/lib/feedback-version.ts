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
