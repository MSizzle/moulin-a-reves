// @ts-check
/**
 * responsiveImages() — Astro integration that materializes the responsive
 * image variants referenced by <Img> (src/components/Img.astro).
 *
 * <Img> emits a srcset of `<base>-<w>.webp` URLs but never creates those files.
 * After `astro build`, this hook scans every emitted HTML file for those
 * variant references, and for each one resizes the committed original
 * (`<base>.webp`, already copied into dist/client/ from public/) down to width
 * <w> with Sharp. Only variants that are actually referenced get generated, so
 * build cost scales with usage and nothing extra is committed to the repo.
 *
 * Mirrors the structure of src/integrations/edit-catalog/index.mjs (same
 * astro:build:done + dist/client HTML scan pattern). Sharp is already a
 * devDependency used by the photo pipeline and is installed during the Vercel
 * build, so importing it here is safe.
 */

import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Matches the variant URLs <Img> emits: /images/<anything>-<width>.webp
// Capturing groups: 1 = base path (no extension), 2 = width. The base is
// non-greedy so it stops at the LAST `-<digits>.webp`, and a 2–4 digit width
// means single-digit suffixes on real originals (e.g. -2.webp) never match.
const VARIANT_RE = /(\/images\/[^"'\s]+?)-(\d{2,4})\.webp/g;

const QUALITY = 80;

/** Recursively collect every *.html file under a directory. */
async function collectHtmlFiles(dir) {
  /** @type {string[]} */
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await collectHtmlFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * @returns {import('astro').AstroIntegration}
 */
export default function responsiveImages() {
  return {
    name: 'responsive-images',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = typeof dir === 'string' ? dir : fileURLToPath(dir);

        // 1. Find every referenced variant across all emitted HTML.
        const htmlFiles = await collectHtmlFiles(outDir);
        /** @type {Map<string, { base: string, width: number }>} */
        const wanted = new Map(); // variant URL -> {base url, width}
        for (const file of htmlFiles) {
          let html;
          try {
            html = await readFile(file, 'utf8');
          } catch {
            continue;
          }
          for (const m of html.matchAll(VARIANT_RE)) {
            const baseUrl = m[1]; // e.g. /images/hero-compound
            const width = Number(m[2]);
            const variantUrl = `${baseUrl}-${width}.webp`;
            if (!wanted.has(variantUrl)) wanted.set(variantUrl, { base: baseUrl, width });
          }
        }

        // 2. Generate each missing variant from its committed original.
        let generated = 0;
        let skipped = 0;
        let missing = 0;
        for (const [variantUrl, { base, width }] of wanted) {
          const variantPath = path.join(outDir, variantUrl.replace(/^\//, ''));
          if (await exists(variantPath)) {
            skipped++;
            continue;
          }
          const originalPath = path.join(outDir, `${base.replace(/^\//, '')}.webp`);
          if (!(await exists(originalPath))) {
            missing++;
            if (logger?.warn) {
              logger.warn(`[responsive-images] missing original for ${variantUrl} (looked for ${base}.webp)`);
            }
            continue;
          }
          try {
            await sharp(originalPath)
              .resize({ width, withoutEnlargement: true })
              .webp({ quality: QUALITY })
              .toFile(variantPath);
            generated++;
          } catch (err) {
            const msg = err && err.message ? err.message : String(err);
            if (logger?.warn) logger.warn(`[responsive-images] failed ${variantUrl}: ${msg}`);
          }
        }

        if (logger?.info) {
          logger.info(
            `[responsive-images] ${generated} variant(s) generated` +
              (skipped ? `, ${skipped} already present` : '') +
              (missing ? `, ${missing} missing original(s)` : '') +
              ` from ${wanted.size} reference(s)`
          );
        }
      },
    },
  };
}
