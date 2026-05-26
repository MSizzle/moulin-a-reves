// ---------------------------------------------------------------------------
// Walker unit tests for CATALOG-02 (entry schema) + CATALOG-03 (locator-signal
// byte-identity). Exercises walkRoute() against a hand-built fixture HTML so
// classification ladder + signal-count + content-source resolution are pinned
// without depending on the real Astro build output. Real-dist coverage lives
// separately in tests/edit-catalog/dist-snapshot.test.mjs.
//
// OPS-02 fence: this test consumes walker.mjs which consumes
// src/lib/locator-signals.mjs. The browser file public/feedback-inject.js
// is NEVER imported by the walker or this test — parity is pinned by
// locator-parity.test.mjs.
//
// Run via: npm run test:catalog
// NEVER use curly quotes in this file.
// ---------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';

import { walkRoute } from '../../src/integrations/edit-catalog/walker.mjs';
import { buildContentIndex } from '../../src/integrations/edit-catalog/content-index.mjs';
import { signalCount } from '../../src/lib/locator-signals.mjs';

const KIND_ENUM = new Set([
  'i18n-text',
  'i18n-html',
  'image',
  'gallery-image',
  'heading',
  'hardcoded-text',
]);

// Hand-built fixture HTML emulating an Astro-emitted page. Includes:
//   1. <h2 data-i18n="home.intro.heading">Welcome</h2>           -> i18n-text
//   2. <p data-i18n-html="home.intro.body">Hello <span>world</span></p> -> i18n-html
//   3. <img src="/images/homes/le-moulin-hero.webp" alt="Le Moulin hero"> -> image
//   4. <div data-gallery="le-moulin"> with 3 imgs                -> 3x gallery-image
//   5. <h3>About the compound</h3>                               -> heading
//   6. <p>The heart of the compound</p>                          -> hardcoded-text (content-anchored)
//   7. <p>Lorem ipsum dolor sit amet consectetur adipiscing elit.</p> -> hardcoded-text (manual)
function buildFixtureDocument() {
  const html = `<!doctype html>
  <html lang="en"><body>
    <main>
      <section class="intro">
        <h2 data-i18n="home.intro.heading">Welcome</h2>
        <p data-i18n-html="home.intro.body">Hello <span>world</span></p>
      </section>
      <section class="hero">
        <img src="/images/homes/le-moulin-hero.webp" alt="Le Moulin hero" />
      </section>
      <section class="gallery-wrap">
        <h3>About the compound</h3>
        <div data-gallery="le-moulin">
          <img src="/images/homes/le-moulin-1.webp" alt="le moulin 1" />
          <img src="/images/homes/le-moulin-2.webp" alt="le moulin 2" />
          <img src="/images/homes/le-moulin-3.webp" alt="le moulin 3" />
        </div>
      </section>
      <section class="tagline-wrap">
        <p>The heart of the compound</p>
        <p>Lorem ipsum dolor sit amet consectetur adipiscing elit.</p>
      </section>
    </main>
  </body></html>`;
  return parseHTML(html).document;
}

// ---- Test 1: walkRoute returns Array<CatalogEntry> length >= 7 -------------
test('Test 1: walkRoute returns an array of >= 7 entries on the fixture', () => {
  const document = buildFixtureDocument();
  const contentIndex = buildContentIndex();
  const entries = walkRoute({ document, route: '/test', contentIndex });

  assert.ok(Array.isArray(entries), 'walkRoute returns an array');
  // Expected: 1 i18n-text + 1 i18n-html + 1 image + 3 gallery-image + 1 heading + 2 hardcoded-text = 9
  // Floor it at >= 7 so the test stays robust to minor classification choices.
  assert.ok(
    entries.length >= 7,
    'expected at least 7 entries on the fixture, got ' + entries.length
  );
});

// ---- Test 2: every entry has id (12 hex) + kind in enum + 1+ signal --------
test('Test 2: every entry has id (12 hex), kind in enum, and at least one locator-signal field populated', () => {
  const document = buildFixtureDocument();
  const contentIndex = buildContentIndex();
  const entries = walkRoute({ document, route: '/test', contentIndex });

  for (const entry of entries) {
    assert.ok(typeof entry.id === 'string', 'entry has a string id');
    assert.ok(/^[0-9a-f]{12}$/.test(entry.id), 'entry.id is 12 hex chars: ' + entry.id);
    assert.ok(KIND_ENUM.has(entry.kind), 'entry.kind in enum: ' + entry.kind);

    // At least one of the locator-signal fields is populated.
    const populated =
      (entry.i18nKey && entry.i18nAttr) ||
      entry.imageRef ||
      (entry.galleryAttrRaw && Number.isInteger(entry.galleryIndex)) ||
      entry.nearestHeading ||
      entry.domPath ||
      entry.currentText ||
      (entry.kind === 'hardcoded-text' && entry.source);
    assert.ok(populated, 'entry has at least one locator-signal field: ' + JSON.stringify(entry));
  }
});

// ---- Test 3: data-i18n h2 entry shape --------------------------------------
test('Test 3: the data-i18n h2 entry has kind=i18n-text, i18nKey + attr + currentText set', () => {
  const document = buildFixtureDocument();
  const contentIndex = buildContentIndex();
  const entries = walkRoute({ document, route: '/test', contentIndex });

  const target = entries.find((e) => e.i18nKey === 'home.intro.heading');
  assert.ok(target, 'entry with i18nKey=home.intro.heading exists');
  assert.equal(target.kind, 'i18n-text');
  assert.equal(target.i18nAttr, 'data-i18n');
  assert.equal(target.currentText, 'Welcome');
});

// ---- Test 4: data-i18n-html p entry shape ----------------------------------
test('Test 4: the data-i18n-html p entry has kind=i18n-html and i18nAttr=data-i18n-html', () => {
  const document = buildFixtureDocument();
  const contentIndex = buildContentIndex();
  const entries = walkRoute({ document, route: '/test', contentIndex });

  const target = entries.find((e) => e.i18nKey === 'home.intro.body');
  assert.ok(target, 'entry with i18nKey=home.intro.body exists');
  assert.equal(target.kind, 'i18n-html');
  assert.equal(target.i18nAttr, 'data-i18n-html');
});

// ---- Test 5: bare <img> entry shape ----------------------------------------
test('Test 5: the bare img entry has kind=image, imageRef + altText set', () => {
  const document = buildFixtureDocument();
  const contentIndex = buildContentIndex();
  const entries = walkRoute({ document, route: '/test', contentIndex });

  const target = entries.find(
    (e) => e.kind === 'image' && e.imageRef === '/images/homes/le-moulin-hero.webp'
  );
  assert.ok(target, 'bare img entry exists');
  assert.equal(target.altText, 'Le Moulin hero');
});

// ---- Test 6: gallery-image entries -----------------------------------------
test('Test 6: the data-gallery imgs have kind=gallery-image, galleryAttrRaw=le-moulin, indices 0/1/2', () => {
  const document = buildFixtureDocument();
  const contentIndex = buildContentIndex();
  const entries = walkRoute({ document, route: '/test', contentIndex });

  const gallery = entries.filter((e) => e.kind === 'gallery-image');
  assert.equal(gallery.length, 3, 'three gallery-image entries');
  const indices = gallery.map((e) => e.galleryIndex).sort();
  assert.deepEqual(indices, [0, 1, 2], 'galleryIndex 0,1,2 across the three entries');
  for (const g of gallery) {
    assert.equal(g.galleryAttrRaw, 'le-moulin', 'galleryAttrRaw is le-moulin');
  }
});

// ---- Test 7: <h3> without i18n key becomes a heading entry -----------------
test('Test 7: the h3 without an i18n key has kind=heading', () => {
  const document = buildFixtureDocument();
  const contentIndex = buildContentIndex();
  const entries = walkRoute({ document, route: '/test', contentIndex });

  const target = entries.find(
    (e) => e.kind === 'heading' && (e.currentText || '').includes('About the compound')
  );
  assert.ok(target, 'h3 heading entry exists with text "About the compound"');
});

// ---- Test 8: hardcoded-text with content-source ----------------------------
test('Test 8: the "The heart of the compound" p has kind=hardcoded-text with src/content/homes/le-moulin.md source', () => {
  const document = buildFixtureDocument();
  const contentIndex = buildContentIndex();
  const entries = walkRoute({ document, route: '/test', contentIndex });

  const target = entries.find(
    (e) =>
      e.kind === 'hardcoded-text' &&
      (e.currentText || '').includes('The heart of the compound')
  );
  assert.ok(target, 'hardcoded-text entry for the tagline exists');
  assert.ok(target.source, 'target has source object');
  assert.equal(target.source.file, 'src/content/homes/le-moulin.md');
  assert.equal(target.source.fieldPath, 'tagline');
  assert.equal(target.requiresManualSelection, false);
});

// ---- Test 9: hardcoded-text without content-source -------------------------
test('Test 9: the "Lorem ipsum..." p has kind=hardcoded-text, source undefined, requiresManualSelection=true', () => {
  const document = buildFixtureDocument();
  const contentIndex = buildContentIndex();
  const entries = walkRoute({ document, route: '/test', contentIndex });

  const target = entries.find(
    (e) => e.kind === 'hardcoded-text' && (e.currentText || '').includes('Lorem ipsum')
  );
  assert.ok(target, 'hardcoded-text entry for the lorem-ipsum p exists');
  assert.equal(target.source, undefined, 'no source on a non-content-indexed string');
  assert.equal(target.requiresManualSelection, true);
});

// ---- Test 10: id uniqueness within a route ---------------------------------
test('Test 10: no two entries share the same id within a single walk', () => {
  const document = buildFixtureDocument();
  const contentIndex = buildContentIndex();
  const entries = walkRoute({ document, route: '/test', contentIndex });

  const ids = new Set();
  for (const entry of entries) {
    assert.ok(!ids.has(entry.id), 'duplicate id encountered: ' + entry.id);
    ids.add(entry.id);
  }
});

// ---- Test 11: requiresManualSelection=false implies signalCount >= 2 -------
test('Test 11: every entry with requiresManualSelection=false has signalCount >= 2 (validate.ts rule)', () => {
  const document = buildFixtureDocument();
  const contentIndex = buildContentIndex();
  const entries = walkRoute({ document, route: '/test', contentIndex });

  for (const entry of entries) {
    if (entry.requiresManualSelection === false) {
      // Build a tuple in the field-name shape signalCount() expects (nearbyText
      // is the validate.ts-side name for the catalog's currentText for the
      // length-check signal; hardcoded-text entries can also qualify via
      // their source field, which the walker decides during classification).
      const tuple = {
        i18nKey: entry.i18nKey,
        i18nAttr: entry.i18nAttr,
        imageRef: entry.imageRef,
        galleryAttrRaw: entry.galleryAttrRaw,
        galleryIndex: entry.galleryIndex,
        nearbyText: entry.currentText,
        nearestHeading: entry.nearestHeading,
      };
      const count = signalCount(tuple);
      const hasContentSource = entry.kind === 'hardcoded-text' && entry.source;
      assert.ok(
        count >= 2 || hasContentSource,
        'entry with requiresManualSelection=false should have signalCount >= 2 OR a content-source: ' +
          JSON.stringify({ id: entry.id, kind: entry.kind, count, hasContentSource: !!hasContentSource })
      );
    }
  }
});
