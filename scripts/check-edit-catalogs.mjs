#!/usr/bin/env node
/**
 * check-edit-catalogs.mjs — Phase 7 v1.3 sanity script.
 *
 * postbuild also runs on Vercel deploys — this script must be robust to
 * Vercel's sandbox (no interactive prompts, no human-only output, exit codes
 * only). All failure paths must process.exit(1) with a single-line
 * stderr-friendly message; success path is one stdout line. If this script
 * regresses, Vercel deploys abort, which is intended — a deploy with a
 * malformed catalog would break the Phase 8 matcher endpoint at runtime, so
 * failing the deploy is correct.
 *
 * Codifies Phase 7 Success Criteria #1, #2, #4 as a build-time gate:
 *   #1 — `dist/client/edit-catalogs/` exists with >= 8 catalog JSON files
 *   #2 — every file parses as JSON and carries the 4 top-level keys
 *   #4 — every catalog's buildSha matches /^[0-9a-f]{7,12}$/ (the 'unknown'
 *        fallback in src/integrations/edit-catalog/index.mjs is REJECTED here)
 *
 * Per-entry shape: id is 12-hex, kind is one of the 6 enum values, ids unique
 * within a catalog, entries with requiresManualSelection: false must satisfy
 * the signalCount >= 2 rule (pinned by validate.ts:54-61 via 07-01).
 *
 * .vercelignore guard (CATALOG-06): no active rule matching `dist/edit-catalogs`
 * (matched anywhere, even when the comment block in .vercelignore mentions it
 * — only non-comment lines count). Mirrors the integration's inline decision
 * comment block.
 *
 * Catalog path under @astrojs/vercel adapter is `dist/client/edit-catalogs/`
 * (NOT `dist/edit-catalogs/`) per Wave 1 upstream deviation.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const CATALOG_DIR = 'dist/client/edit-catalogs';
const VALID_KINDS = new Set([
  'i18n-text',
  'i18n-html',
  'image',
  'gallery-image',
  'heading',
  'hardcoded-text',
]);
const BUILD_SHA_OK = /^[0-9a-f]{7,12}$/;
const ENTRY_ID_OK = /^[0-9a-f]{12}$/;
const MIN_CATALOGS = 8;

function fail(msg) {
  process.stderr.write('[check-edit-catalogs] FAIL: ' + msg + '\n');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(p));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      out.push(p);
    }
  }
  return out;
}

/**
 * Replicates validate.ts:54-61 signalCount() rule for sanity-script use.
 * Signals counted: i18nKey | imageRef | galleryAttrRaw | galleryIndex
 *                 | textAnchor | nearestHeading. domPath is NOT counted alone.
 *
 * @param {object} entry
 * @returns {number}
 */
function signalCount(entry) {
  let n = 0;
  if (entry.i18nKey) n++;
  if (entry.imageRef) n++;
  if (entry.galleryAttrRaw) n++;
  if (typeof entry.galleryIndex === 'number') n++;
  if (entry.textAnchor) n++;
  if (entry.nearestHeading) n++;
  return n;
}

// --- Check 1: catalog directory exists with >= MIN_CATALOGS files ---
if (!existsSync(CATALOG_DIR)) {
  fail(CATALOG_DIR + ' does not exist — did `npm run build` complete?');
}
try {
  const st = statSync(CATALOG_DIR);
  if (!st.isDirectory()) fail(CATALOG_DIR + ' exists but is not a directory');
} catch (e) {
  fail(CATALOG_DIR + ' stat failed: ' + (e && e.message ? e.message : String(e)));
}

const catalogFiles = walk(CATALOG_DIR);
if (catalogFiles.length < MIN_CATALOGS) {
  fail(
    CATALOG_DIR + ' contains only ' + catalogFiles.length +
      ' catalog file(s) — Success Criterion #1 requires >= ' + MIN_CATALOGS
  );
}

// --- Checks 2-7: per-catalog schema + per-entry shape ---
let totalEntries = 0;
let firstBuildSha = null;
const requiredTopLevelKeys = ['buildSha', 'route', 'generatedAt', 'entries'];

for (const file of catalogFiles) {
  /** @type {any} */
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    fail(file + ' is not valid JSON: ' + (e && e.message ? e.message : String(e)));
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    fail(file + ' top-level value is not an object');
  }

  for (const k of requiredTopLevelKeys) {
    if (!(k in parsed)) {
      fail(file + ' missing top-level key `' + k + '`');
    }
  }

  // buildSha rule (Success Criterion #4) — 'unknown' is a HARD FAILURE.
  if (parsed.buildSha === 'unknown') {
    fail(
      file + ' buildSha is \'unknown\' — git rev-parse failed at build time. ' +
        'Vercel deploys always have .git available; this indicates a misconfigured ' +
        'build environment and the catalog cannot reach production with this value.'
    );
  }
  if (typeof parsed.buildSha !== 'string' || !BUILD_SHA_OK.test(parsed.buildSha)) {
    fail(
      file + ' buildSha does not match /^[0-9a-f]{7,12}$/ (got: ' +
        JSON.stringify(parsed.buildSha) + ')'
    );
  }
  if (firstBuildSha === null) firstBuildSha = parsed.buildSha;
  if (parsed.buildSha !== firstBuildSha) {
    fail(
      file + ' buildSha=' + parsed.buildSha + ' diverges from first catalog buildSha=' +
        firstBuildSha + ' — all catalogs in one build must share the same SHA'
    );
  }

  if (typeof parsed.route !== 'string' || !parsed.route.startsWith('/')) {
    fail(file + ' route must be a string starting with `/` (got: ' + JSON.stringify(parsed.route) + ')');
  }
  if (typeof parsed.generatedAt !== 'string' || !parsed.generatedAt) {
    fail(file + ' generatedAt must be a non-empty string');
  }
  if (!Array.isArray(parsed.entries)) {
    fail(file + ' entries must be an array');
  }

  const idsSeen = new Set();
  for (let i = 0; i < parsed.entries.length; i++) {
    const entry = parsed.entries[i];
    const where = file + ' entries[' + i + ']';
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      fail(where + ' is not an object');
    }
    if (typeof entry.id !== 'string' || !ENTRY_ID_OK.test(entry.id)) {
      fail(where + ' id missing or does not match /^[0-9a-f]{12}$/ (got: ' + JSON.stringify(entry.id) + ')');
    }
    if (idsSeen.has(entry.id)) {
      fail(where + ' duplicate id within catalog: ' + entry.id);
    }
    idsSeen.add(entry.id);

    if (typeof entry.kind !== 'string' || !VALID_KINDS.has(entry.kind)) {
      fail(where + ' kind missing or not in enum (got: ' + JSON.stringify(entry.kind) + ')');
    }

    // signalCount rule — only enforced when requiresManualSelection is explicitly false.
    // When true or undefined, the entry is considered manual-eye-needed and the rule does not apply.
    if (entry.requiresManualSelection === false) {
      const sc = signalCount(entry);
      // hardcoded-text with a source object satisfies the auto-merge gate even with a
      // single positional signal — the source IS the locator anchor. Mirrors walker policy.
      const hasSource = entry.source && typeof entry.source === 'object';
      if (!hasSource && sc < 2) {
        fail(
          where + ' requiresManualSelection=false but signalCount=' + sc +
            ' (< 2) and no source — violates the auto-merge gate'
        );
      }
    }
  }

  totalEntries += parsed.entries.length;
}

// --- Check 8: .vercelignore active rules do not match dist/edit-catalogs ---
// CATALOG-06 ship-to-prod guard. Read .vercelignore as text, strip comment lines
// (those starting with #), then look for any remaining line matching the
// banned regex. A comment that mentions the path (e.g. the CATALOG-06 decision
// block) is OK; only active rules count.
try {
  const vercelIgnoreText = readFileSync('.vercelignore', 'utf8');
  const activeLines = vercelIgnoreText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  const banned = /^(dist\/)?(client\/)?edit-catalogs(\/|$)/;
  for (const line of activeLines) {
    if (banned.test(line)) {
      fail(
        '.vercelignore contains an ACTIVE rule matching the catalog path: `' +
          line + '` — CATALOG-06 requires dist/(client/)?edit-catalogs/ to ship to prod ' +
          '(matcher endpoint reads catalogs at runtime). Remove this rule.'
      );
    }
  }
} catch (e) {
  fail('.vercelignore could not be read: ' + (e && e.message ? e.message : String(e)));
}

// --- Success summary ---
process.stdout.write(
  '[check-edit-catalogs] OK: ' + catalogFiles.length + ' catalogs, ' +
    totalEntries + ' entries, buildSha=' + firstBuildSha + '\n'
);
process.exit(0);
