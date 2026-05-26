// Single source of truth for the deployed build's git short SHA.
//
// The literal `BUILD_SHA` identifier is REPLACED at build time by Vite — see
// the `vite.define.BUILD_SHA` block in astro.config.mjs. The replacement value
// is `JSON.stringify(execSync('git rev-parse --short HEAD').toString().trim())`,
// resolved once per `astro build` invocation. The Phase 7 catalog walker
// (src/integrations/edit-catalog/index.mjs) resolves the same value with the
// same command, so the <meta name="x-build-sha"> value in the deployed HTML and
// the `buildSha` field in dist/client/edit-catalogs/<route>.json are guaranteed
// equal byte-for-byte for any given deploy.
//
// Consumed by:
//   - src/layouts/BaseLayout.astro  (the <meta name="x-build-sha"> emission)
//
// The fallback value `'unknown'` is exported for local sandboxes where the
// vite.define replacement somehow didn't fire (e.g. running TypeScript outside
// astro build). The fallback is rejected as a hard failure by the Phase 7
// catalog audit script (scripts/check-edit-catalogs.mjs) so it cannot reach a
// Vercel deploy — the catalog audit runs on every prebuild.
declare const BUILD_SHA: string;
export const BUILD_SHA_VALUE: string = typeof BUILD_SHA !== 'undefined' ? BUILD_SHA : 'unknown';
