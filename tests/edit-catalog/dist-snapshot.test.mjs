// ---------------------------------------------------------------------------
// Real-dist-snapshot test for the catalog walker. Runs walkRoute() against a
// committed snapshot of dist/client/homes/le-moulin/index.html taken AFTER the
// 07-02 integration was wired but BEFORE 07-03 Task 3 modified index.mjs.
//
// This is the fail-fast canary for Astro-emitted-HTML compatibility: any
// future Astro upgrade that changes the emitted HTML format and breaks
// linkedom parsing, walker classification, or the kind-coverage floor lights
// up here long before the full build-time integration runs at deploy time.
//
// Snapshot refresh policy
// -----------------------
// If a future Astro upgrade changes the emitted HTML format and breaks
// Test A (parse) or any other test below, the maintainer regenerates the
// fixture by re-running:
//
//   npm run build
//   cp dist/client/homes/le-moulin/index.html \
//     tests/edit-catalog/fixtures/le-moulin-dist-snapshot.html
//
// The snapshot is a fixture, NOT a contract — its job is to fail fast when
// Astro changes its output and the walker hasn't been updated yet. The
// walker's API contract is pinned by walker.test.mjs, not by this snapshot.
//
// NEVER use curly quotes in this file.
// ---------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

import { walkRoute } from '../../src/integrations/edit-catalog/walker.mjs';
import { buildContentIndex } from '../../src/integrations/edit-catalog/content-index.mjs';

const KIND_ENUM = new Set([
  'i18n-text',
  'i18n-html',
  'image',
  'gallery-image',
  'heading',
  'hardcoded-text',
]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'le-moulin-dist-snapshot.html');

function loadSnapshot() {
  return fs.readFileSync(FIXTURE_PATH, 'utf8');
}

// ---- Test A: parseHTML on the snapshot succeeds ---------------------------
test('Test A: parseHTML succeeds on the committed dist snapshot and yields a non-empty body', () => {
  const html = loadSnapshot();
  assert.ok(html.length > 1000, 'snapshot is non-trivial (>= 1000 bytes)');
  const { document } = parseHTML(html);
  assert.ok(document, 'document is parsed');
  assert.ok(document.body, 'document has a body');
  assert.ok(
    document.body.children.length > 0,
    'document.body has at least one child element'
  );
});

// ---- Test B: walkRoute returns >= 10 entries ------------------------------
test('Test B: walkRoute on the snapshot returns entries.length >= 10', () => {
  const html = loadSnapshot();
  const { document } = parseHTML(html);
  const contentIndex = buildContentIndex();
  const entries = walkRoute({
    document,
    route: '/homes/le-moulin',
    contentIndex,
  });
  assert.ok(Array.isArray(entries), 'walkRoute returns an array');
  assert.ok(
    entries.length >= 10,
    'expected entries.length >= 10 on a real Astro-emitted page, got ' + entries.length
  );
});

// ---- Test C: at least 3 distinct kinds in the catalog ---------------------
test('Test C: the snapshot produces entries covering at least 3 distinct kind values', () => {
  const html = loadSnapshot();
  const { document } = parseHTML(html);
  const contentIndex = buildContentIndex();
  const entries = walkRoute({
    document,
    route: '/homes/le-moulin',
    contentIndex,
  });
  const kinds = new Set(entries.map((e) => e.kind));
  assert.ok(
    kinds.size >= 3,
    'expected at least 3 distinct kind values, got ' +
      kinds.size +
      ' (' +
      [...kinds].sort().join(',') +
      ')'
  );
});

// ---- Test D: every entry has 12-hex id + valid kind -----------------------
test('Test D: every snapshot entry has a 12-hex id and a kind in the 6-value enum', () => {
  const html = loadSnapshot();
  const { document } = parseHTML(html);
  const contentIndex = buildContentIndex();
  const entries = walkRoute({
    document,
    route: '/homes/le-moulin',
    contentIndex,
  });
  for (const entry of entries) {
    assert.ok(/^[0-9a-f]{12}$/.test(entry.id), 'entry.id is 12 hex: ' + entry.id);
    assert.ok(KIND_ENUM.has(entry.kind), 'entry.kind in enum: ' + entry.kind);
  }
});

// ---- Test E: no Astro-runtime artifacts leak into currentText -------------
test('Test E: no entry.currentText contains stray "astro-island" or "astro-slot" runtime artifacts', () => {
  const html = loadSnapshot();
  const { document } = parseHTML(html);
  const contentIndex = buildContentIndex();
  const entries = walkRoute({
    document,
    route: '/homes/le-moulin',
    contentIndex,
  });
  for (const entry of entries) {
    const text = entry.currentText || '';
    assert.ok(
      !/astro-island/i.test(text),
      'entry.currentText must not contain "astro-island": ' + text
    );
    assert.ok(
      !/astro-slot/i.test(text),
      'entry.currentText must not contain "astro-slot": ' + text
    );
  }
});
