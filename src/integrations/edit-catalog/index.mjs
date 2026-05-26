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

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
            const stub = {
              buildSha: null,
              route: key,
              generatedAt: new Date().toISOString(),
              entries: [],
            };
            await writeFile(catalogPath, JSON.stringify(stub, null, 2) + '\n', 'utf8');
            written.push(relPath);
          } catch (err) {
            const msg = err && err.message ? err.message : String(err);
            if (logger && typeof logger.warn === 'function') {
              logger.warn('[edit-catalog] failed to write catalog for ' + key + ': ' + msg);
            }
          }
        }

        if (logger && typeof logger.info === 'function') {
          logger.info('[edit-catalog] wrote ' + written.length + ' catalog file(s) to dist/edit-catalogs/' + (skipped.length ? ' (skipped ' + skipped.length + ' non-prerendered)' : ''));
        }
      },
    },
  };
}
