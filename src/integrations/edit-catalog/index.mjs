// @ts-check
/**
 * editCatalog() — Astro integration that emits one JSON catalog per prerendered
 * route after `astro build`. Spine for Phase 7 v1.3 build-time edit catalog
 * (CATALOG-01). The per-entry walker (07-03) fills the `entries[]` array; the
 * metadata wrap (07-05) fills `buildSha`. This module ships:
 *
 *   1. The default-exported integration factory `editCatalog()`.
 *   2. A named export `routeToCatalogPath(routePath)` — pure helper that maps a
 *      route pathname like '/' or '/homes/le-moulin' to a relative POSIX path
 *      under dist/edit-catalogs/, e.g. 'index.json' or 'homes/le-moulin.json'.
 *      07-03 imports this so the route-to-filename rule stays single-sourced.
 *
 * No external dependency — node:fs/promises + node:path + node:url only.
 * OPS-02 fence: this module MUST NOT import from the v1.1 inject script in
 * public/ (kept fenced byte-for-byte in v1.3 per CATALOG-* requirements).
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { parseHTML } from 'linkedom';

import { walkRoute } from './walker.mjs';
import { buildContentIndex } from './content-index.mjs';

/**
 * Map a route pathname to its catalog file path (POSIX, relative to
 * dist/edit-catalogs/).
 *
 *   '/'                       -> 'index.json'
 *   '/about'                  -> 'about.json'
 *   '/homes/le-moulin'        -> 'homes/le-moulin.json'
 *   '/homes/le-moulin/'       -> 'homes/le-moulin.json'
 *
 * Edge cases: empty string -> 'index.json'; multiple internal slashes preserved.
 *
 * @param {string} routePath
 * @returns {string}
 */
export function routeToCatalogPath(routePath) {
  if (typeof routePath !== 'string') {
    throw new TypeError('routeToCatalogPath: routePath must be a string');
  }
  // Strip leading slash, strip trailing slash. Treat '' as the root index.
  let cleaned = routePath.replace(/^\/+/, '').replace(/\/+$/, '');
  if (cleaned === '') cleaned = 'index';
  return cleaned + '.json';
}

/**
 * Map a route pathname to the relative path of its emitted HTML inside the
 * Astro `dir` (under the Vercel adapter, that's dist/client/). Astro emits
 * every prerendered route as <pathname>/index.html, with the root '/' as
 * just 'index.html' at the top of `dir`.
 *
 *   '/'                 -> 'index.html'
 *   '/about'            -> 'about/index.html'
 *   '/homes/le-moulin'  -> 'homes/le-moulin/index.html'
 *
 * @param {string} routePath
 * @returns {string}
 */
function routeToHtmlPath(routePath) {
  if (routePath === '/' || routePath === '') return 'index.html';
  const trimmed = routePath.replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed + '/index.html';
}

/**
 * Decide whether a route should produce a catalog. Filters out:
 *   - non-prerendered routes (API endpoints become Vercel Functions, no HTML)
 *   - routes under /api/ (defensive — Astro already marks them prerender:false)
 *
 * @param {{ pathname?: string, route?: string, prerender?: boolean }} route
 * @returns {boolean}
 */
function shouldCatalogRoute(route) {
  const pathname = route && (route.pathname || route.route);
  if (!pathname || typeof pathname !== 'string') return false;
  if (pathname.startsWith('/api/') || pathname === '/api') return false;
  // Astro RouteData: prerender is `true` for static routes; for static-output
  // sites every page route is prerendered. Be permissive: treat `prerender !==
  // false` as prerendered (covers both explicit `true` and `undefined`).
  if (route.prerender === false) return false;
  return true;
}

/**
 * Astro integration factory. Register via:
 *
 *   import editCatalog from './src/integrations/edit-catalog/index.mjs';
 *   export default defineConfig({ integrations: [..., editCatalog()] });
 *
 * @returns {import('astro').AstroIntegration}
 */
export default function editCatalog() {
  return {
    name: 'edit-catalog',
    hooks: {
      'astro:build:done': async ({ dir, routes, pages, logger }) => {
        // Resolve dist/ root from the URL Astro hands us.
        const outDir = typeof dir === 'string' ? dir : fileURLToPath(dir);
        const catalogRoot = path.join(outDir, 'edit-catalogs');
        await mkdir(catalogRoot, { recursive: true });

        // Build the content-collection index ONCE per build, reused for every
        // route's walker call. Hardcoded-text classification depends on this
        // to flip requiresManualSelection to false when a string is anchored
        // in src/content/**/*.md frontmatter (CATALOG-04).
        const contentIndex = buildContentIndex();

        // CATALOG-05: buildSha lets Phase 8 overlay and Phase 9 canary detect catalog
        // drift vs the deployed <meta name="x-build-sha"> value. The catalog must
        // carry a REAL short SHA matching /^[0-9a-f]{6,12}$/; the 'unknown' fallback
        // exists only for non-git local sandboxes and is rejected as a hard failure
        // by scripts/check-edit-catalogs.mjs so it cannot reach a Vercel deploy.
        //
        // CATALOG-06 DECISION (Phase 7, 2026-05-26): dist/edit-catalogs/ SHIPS to
        // production. The matcher endpoint at src/pages/api/feedback/match.ts
        // (Phase 8) reads catalogs via the Vercel filesystem at runtime; an entry
        // in .vercelignore for `dist/edit-catalogs` would break that read path.
        // DO NOT add such an entry. Sanity-checked by scripts/check-edit-catalogs.mjs.
        let buildSha;
        try {
          buildSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
        } catch (gitErr) {
          buildSha = 'unknown';
          if (logger && typeof logger.warn === 'function') {
            logger.warn('[edit-catalog] git rev-parse failed; using unknown as buildSha. Vercel deploys MUST have .git available; this fallback indicates a misconfigured environment.');
          }
        }

        // Prefer `routes` (richer — carries prerender flag); fall back to
        // `pages` (always { pathname }). For static-output sites both work.
        const source = Array.isArray(routes) && routes.length > 0
          ? routes.map((r) => ({
              pathname: (r.route || r.pathname || '').replace(/\[\.\.\.[^\]]+\]/g, '').replace(/\[[^\]]+\]/g, ''),
              prerender: r.prerender,
            }))
          : (Array.isArray(pages) ? pages.map((p) => ({ pathname: p.pathname.startsWith('/') ? p.pathname : '/' + p.pathname, prerender: true })) : []);

        // Dedupe — Astro routes can include both the static route and any
        // pagination siblings; we only want one catalog per concrete pathname.
        const seen = new Set();
        const written = [];
        const skipped = [];
        let totalEntries = 0;

        for (const r of source) {
          let pathname = r.pathname;
          if (!pathname) continue;
          if (!pathname.startsWith('/')) pathname = '/' + pathname;
          // Normalize trailing slash for dedupe (but preserve '/' as root).
          const key = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
          if (seen.has(key)) continue;
          seen.add(key);

          if (!shouldCatalogRoute({ pathname: key, prerender: r.prerender })) {
            skipped.push(key);
            continue;
          }

          try {
            const relPath = routeToCatalogPath(key);
            const catalogPath = path.join(catalogRoot, relPath);
            const targetDir = path.dirname(catalogPath);
            await mkdir(targetDir, { recursive: true });

            // Read the prerendered HTML for this route. Under the Vercel
            // adapter `outDir` is dist/client/; the HTML for '/homes/le-moulin'
            // lives at dist/client/homes/le-moulin/index.html. If the file is
            // missing (e.g. Astro routed this entry to a Vercel Function and
            // didn't emit HTML), log a warning and write an empty-entries
            // stub rather than aborting the whole build.
            const htmlRelPath = routeToHtmlPath(key);
            const htmlPath = path.join(outDir, htmlRelPath);
            /** @type {Array<object>} */
            let entries = [];
            try {
              const html = await readFile(htmlPath, 'utf8');
              const { document } = parseHTML(html);
              entries = walkRoute({ document, route: key, contentIndex });
            } catch (htmlErr) {
              const hmsg = htmlErr && htmlErr.message ? htmlErr.message : String(htmlErr);
              if (logger && typeof logger.warn === 'function') {
                logger.warn('[edit-catalog] no HTML at ' + htmlRelPath + ' for route ' + key + ' (' + hmsg + '); emitting empty-entries catalog');
              }
            }

            const catalog = {
              buildSha,
              route: key,
              generatedAt: new Date().toISOString(),
              entries,
            };
            await writeFile(catalogPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
            written.push(relPath);
            totalEntries += entries.length;
          } catch (err) {
            const msg = err && err.message ? err.message : String(err);
            if (logger && typeof logger.warn === 'function') {
              logger.warn('[edit-catalog] failed to write catalog for ' + key + ': ' + msg);
            }
          }
        }

        if (logger && typeof logger.info === 'function') {
          logger.info(
            '[edit-catalog] wrote ' + written.length + ' catalog file(s) (' +
              totalEntries + ' total entries) to edit-catalogs/' +
              (skipped.length ? ' (skipped ' + skipped.length + ' non-prerendered)' : '')
          );
        }
      },
    },
  };
}
