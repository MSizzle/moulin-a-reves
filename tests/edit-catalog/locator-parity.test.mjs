// ---------------------------------------------------------------------------
// Locator-signal parity tests for src/lib/locator-signals.mjs.
//
// This harness pins the Node-side locator helper (built in 07-01 Task 2) to:
//
//   1. public/feedback-inject.js lines 169-238 (closestAttr / i18nOf /
//      imageRefOf / galleryOf / headingNear / domPathOf / visibleText)
//   2. src/pages/api/feedback/validate.ts lines 54-61 (signalCount + the
//      MIN_VAGUE_LEN constant on line 19)
//
// Both source files are frozen for v1.3 (OPS-02 fence). The Node helper is
// an intentional duplicate; this test makes that duplication mechanical:
// drift in either copy fails the test and forces the maintainer to sync.
//
// Run via: npm run test:catalog
// ---------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

import {
  closestAttr,
  i18nOf,
  imageRefOf,
  galleryOf,
  nearestHeading,
  domPathOf,
  visibleText,
  signalCount,
} from '../../src/lib/locator-signals.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

// ---- Test 1: i18n + heading + domPath parity for a plain text element ------
test('Test 1: i18n + nearestHeading + domPath for a <p data-i18n> inside a section', () => {
  const html = `<!doctype html>
  <html><body>
    <section class="intro">
      <h2>Welcome</h2>
      <p class="intro__text" data-i18n="home.intro.text">Hello world</p>
    </section>
  </body></html>`;
  const { document } = parseHTML(html);
  const el = document.querySelector('p[data-i18n]');
  assert.ok(el, 'fixture <p> exists');

  const i18n = i18nOf(el);
  assert.strictEqual(i18n.key, 'home.intro.text');
  assert.strictEqual(i18n.attr, 'data-i18n');

  assert.strictEqual(visibleText(el), 'Hello world');
  assert.strictEqual(nearestHeading(el, document), 'Welcome');

  const dp = domPathOf(el);
  assert.ok(dp.includes('p'), 'domPath includes p tag');
  assert.ok(dp.includes('section'), 'domPath includes section tag');
  assert.strictEqual(imageRefOf(el), null, 'no image ref on a <p>');
});

// ---- Test 2: image parity for <img src="/images/..."> ----------------------
test('Test 2: imageRef + visibleText for an <img src="/images/..."> with alt', () => {
  const html = `<!doctype html>
  <html><body>
    <section><h2>Heroes</h2>
      <img src="/images/homes/le-moulin-hero.webp" alt="Le Moulin hero" />
    </section>
  </body></html>`;
  const { document } = parseHTML(html);
  const el = document.querySelector('img');
  assert.ok(el, 'fixture <img> exists');

  const i18n = i18nOf(el);
  assert.strictEqual(i18n.key, null);
  assert.strictEqual(i18n.attr, null);

  assert.strictEqual(visibleText(el), 'Le Moulin hero', 'img visibleText = alt');
  assert.strictEqual(imageRefOf(el), '/images/homes/le-moulin-hero.webp');
});

// ---- Test 3: gallery parity ------------------------------------------------
test('Test 3: galleryOf returns raw + index for an <img> inside data-gallery host', () => {
  const html = `<!doctype html>
  <html><body>
    <div data-gallery="le-moulin">
      <img src="/images/homes/le-moulin-1.webp" alt="a" />
      <img src="/images/homes/le-moulin-2.webp" alt="b" />
      <img src="/images/homes/le-moulin-3.webp" alt="c" />
    </div>
  </body></html>`;
  const { document } = parseHTML(html);
  const imgs = document.querySelectorAll('img');
  assert.strictEqual(imgs.length, 3);

  const g0 = galleryOf(imgs[0]);
  assert.strictEqual(g0.raw, 'le-moulin');
  assert.strictEqual(g0.index, 0);

  const g2 = galleryOf(imgs[2]);
  assert.strictEqual(g2.raw, 'le-moulin');
  assert.strictEqual(g2.index, 2);
});

// ---- Test 4: priority ladder data-i18n-html > data-i18n > placeholder ------
test('Test 4: data-i18n-html wins over data-i18n on the same element', () => {
  const html = `<!doctype html>
  <html><body>
    <p data-i18n-html="footer.tagline" data-i18n="footer.tagline.plain">A<br/>B</p>
  </body></html>`;
  const { document } = parseHTML(html);
  const el = document.querySelector('p');
  const i18n = i18nOf(el);
  assert.strictEqual(i18n.attr, 'data-i18n-html');
  assert.strictEqual(i18n.key, 'footer.tagline');
});

// ---- Test 5: signalCount rules from validate.ts:54-61 ----------------------
test('Test 5: signalCount returns >= 2 for populated tuple; 0 for domPath-only tuple', () => {
  const populated = {
    i18nKey: 'home.intro.text',
    i18nAttr: 'data-i18n',
    imageRef: '/images/homes/le-moulin-hero.webp',
    galleryAttrRaw: null,
    galleryIndex: null,
    nearbyText: 'A line of nearby text that exceeds twenty-five chars.',
    nearestHeading: 'Welcome',
    domPath: 'section > p',
  };
  assert.ok(signalCount(populated) >= 2, 'populated tuple has >= 2 signals');

  const domPathOnly = {
    i18nKey: null,
    i18nAttr: null,
    imageRef: null,
    galleryAttrRaw: null,
    galleryIndex: null,
    nearbyText: '',
    nearestHeading: null,
    domPath: 'section > p',
  };
  assert.strictEqual(signalCount(domPathOnly), 0, 'domPath alone counts 0');
});

// ---- Test 6: parity-anchor on public/feedback-inject.js --------------------
test('Test 6: feedback-inject.js source contains the canonical closestAttr / i18nOf / domPathOf signatures', () => {
  const injectPath = path.join(repoRoot, 'public/feedback-inject.js');
  const src = fs.readFileSync(injectPath, 'utf8');

  // Anchor 1: closestAttr body markers
  assert.ok(
    src.includes('while (n && n.nodeType === 1) {'),
    'closestAttr inner-loop marker present in feedback-inject.js'
  );
  assert.ok(
    src.includes('if (n.hasAttribute(attr)) return n;'),
    'closestAttr hasAttribute check present in feedback-inject.js'
  );

  // Anchor 2: i18nOf priority ladder marker
  assert.ok(
    src.includes("['data-i18n-html', 'data-i18n', 'data-i18n-placeholder']"),
    'i18nOf attribute order array present in feedback-inject.js'
  );

  // Anchor 3: domPathOf marker
  assert.ok(
    src.includes(":nth-of-type('"),
    'domPathOf :nth-of-type marker present in feedback-inject.js'
  );

  // Anchor 4: headingNear marker
  assert.ok(
    src.includes("document.querySelectorAll('h1,h2,h3,h4,h5,h6')"),
    'headingNear querySelectorAll marker present in feedback-inject.js'
  );
});

// ---- Test 7: normalized-string parity for signalCount ----------------------
// Extracts signalCount() bodies from BOTH validate.ts and locator-signals.mjs,
// normalizes them (strip per-line leading/trailing whitespace + strip //
// line-comments + collapse multi-space runs), and asserts byte equality.
// Drift in either copy fails this test.
function extractSignalCountBody(src) {
  // Match `... signalCount(p ...): number {` (TS) OR `... signalCount(p) {`
  // (JS), then capture the body up to a balanced closing brace at depth 0.
  const startRe = /(?:export\s+)?function\s+signalCount\s*\([^)]*\)(?:\s*:\s*\w+)?\s*\{/;
  const m = src.match(startRe);
  if (!m) return null;
  const startIdx = m.index + m[0].length;
  let depth = 1;
  let i = startIdx;
  while (i < src.length && depth > 0) {
    const c = src[i];
    if (c === '{') depth += 1;
    else if (c === '}') depth -= 1;
    if (depth === 0) break;
    i += 1;
  }
  return src.slice(startIdx, i);
}

function normalize(body) {
  if (body === null || body === undefined) return null;
  return body
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, '')) // strip line-comments
    .map((line) => line.trim()) // strip per-line whitespace
    .filter((line) => line.length > 0) // drop blank lines
    .join('\n')
    .replace(/[ \t]+/g, ' '); // collapse runs of horizontal whitespace
}

test('Test 7: signalCount() body in locator-signals.mjs is byte-equal (normalized) to validate.ts', () => {
  const validatePath = path.join(repoRoot, 'src/pages/api/feedback/validate.ts');
  const helperPath = path.join(repoRoot, 'src/lib/locator-signals.mjs');

  const validateSrc = fs.readFileSync(validatePath, 'utf8');
  const helperSrc = fs.readFileSync(helperPath, 'utf8');

  const validateBody = extractSignalCountBody(validateSrc);
  const helperBody = extractSignalCountBody(helperSrc);

  assert.ok(validateBody, 'extracted signalCount body from validate.ts');
  assert.ok(helperBody, 'extracted signalCount body from locator-signals.mjs');

  const normalizedValidate = normalize(validateBody);
  const normalizedHelper = normalize(helperBody);

  assert.strictEqual(
    normalizedHelper,
    normalizedValidate,
    'signalCount() body in locator-signals.mjs drifted from validate.ts; sync both copies'
  );
});

// ---- Test 8: inline-style background-image parity (defensive) --------------
test('Test 8: imageRefOf parses inline style="background-image: url(...)"', () => {
  const html = `<!doctype html>
  <html><body>
    <div style="background-image: url('/images/bridge-garden.webp'); height: 400px;">
      <h2>Bridge</h2>
    </div>
  </body></html>`;
  const { document } = parseHTML(html);
  const el = document.querySelector('div');
  assert.strictEqual(imageRefOf(el), '/images/bridge-garden.webp');
});
