// ---------------------------------------------------------------------------
// locator-signals.mjs
//
// PARITY MIRROR of public/feedback-inject.js:169-238 AND
// src/pages/api/feedback/validate.ts:54-61 (signalCount).
//
// OPS-02 fence: both source files are frozen for v1.3. Any change to
// closestAttr / i18nOf / domPathOf / nearestHeading / imageRefOf / galleryOf
// / visibleText / signalCount here MUST be matched by a hand-edit to the
// corresponding source file AND vice versa, pinned by
// tests/edit-catalog/locator-parity.test.mjs.
//
// Why duplicate instead of import?
//   - public/feedback-inject.js is a browser IIFE. It runs only inside the
//     iframe served at /?feedback=1 and is delivered as a static asset.
//     It cannot be imported by Node-side build code without a fragile
//     vm-evaluation seam. The OPS-02 fence treats the browser file as a
//     read-only source of truth; this module is the Node port.
//   - src/pages/api/feedback/validate.ts is TypeScript. Node 24 ESM cannot
//     load .ts files without an explicit tsx/ts-node loader, which this
//     repo does not configure. validate.ts is v1.1 production code;
//     widening scope to add a loader OR refactoring validate.ts to import
//     from a shared .mjs is out of scope for OPS-02-fenced v1.3 Phase 7.
//
// Drift is mechanically prevented by tests/edit-catalog/locator-parity.test.mjs:
//   - Test 6 asserts canonical substring markers in feedback-inject.js
//   - Test 7 normalizes the signalCount() bodies in this file and in
//     validate.ts and asserts byte equality
// ---------------------------------------------------------------------------

// Walk up the DOM tree from `el` and return the closest ancestor (inclusive)
// that has the named attribute. Returns null when no ancestor has it.
export function closestAttr(el, attr) {
  let n = el;
  while (n && n.nodeType === 1) {
    if (n.hasAttribute(attr)) return n;
    n = n.parentElement;
  }
  return null;
}

// Resolve the i18n key for `el` by walking up the tree in priority order.
// data-i18n-html beats data-i18n beats data-i18n-placeholder.
export function i18nOf(el) {
  const order = ['data-i18n-html', 'data-i18n', 'data-i18n-placeholder'];
  for (let i = 0; i < order.length; i++) {
    const host = closestAttr(el, order[i]);
    if (host) return { key: host.getAttribute(order[i]), attr: order[i] };
  }
  return { key: null, attr: null };
}

// Normalize any image URL down to a greppable /images/*.webp ref. Returns
// null when the URL does not point at /images/.
function normImage(url) {
  if (!url) return null;
  const m = String(url).match(/\/images\/[^"')?#]+/);
  return m ? m[0] : null;
}

// Resolve the image ref for `el` in this priority:
//   1. el itself if it is an <img src="...">
//   2. an inner <img src="..."> descendant
//   3. inline style="background-image: url(...)" on `el`
//
// The browser version (feedback-inject.js:204-210) ALSO falls back to
// getComputedStyle(el).backgroundImage which catches stylesheet-only bg
// rules. The Node port intentionally omits that branch (no layout in
// Node). Pre-flight grep (Task 0, plan 07-01) confirmed zero addressable
// elements site-wide rely on stylesheet-only bg-image; the catalog
// walker (07-03) emits any future such entry with requiresManualSelection.
export function imageRefOf(el) {
  if (el.tagName === 'IMG' && el.getAttribute('src')) {
    const r = normImage(el.getAttribute('src'));
    if (r) return r;
  }
  const innerImg = el.querySelector && el.querySelector('img[src]');
  if (innerImg) {
    const ri = normImage(innerImg.getAttribute('src'));
    if (ri) return ri;
  }
  // Defensive: parse inline style="background-image: url('...')" so that
  // a future hand-edit using inline-style bg-image is still parity-covered.
  const styleAttr = el.getAttribute && el.getAttribute('style');
  if (styleAttr) {
    const m = styleAttr.match(/background-image\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    if (m) {
      const rs = normImage(m[1]);
      if (rs) return rs;
    }
  }
  return null;
}

// Find the gallery host for `el` (a data-gallery or data-room ancestor) and
// return its raw value + the zero-based index of the <img> inside it that
// matches `el` (or contains/is contained by `el`).
export function galleryOf(el) {
  const host = closestAttr(el, 'data-gallery') || closestAttr(el, 'data-room');
  if (!host) return { raw: null, index: null };
  const raw = host.getAttribute('data-gallery') || host.getAttribute('data-room');
  let idx = null;
  try {
    const imgs = host.querySelectorAll('img');
    for (let i = 0; i < imgs.length; i++) {
      if (imgs[i] === el || imgs[i].contains(el) || el.contains(imgs[i])) { idx = i; break; }
    }
  } catch (e) {}
  return { raw: raw, index: idx };
}

// Return the trimmed text of the nearest heading that precedes or contains
// `el`, scanning the supplied document for h1-h6. The browser version
// implicitly uses `document` (the global); the Node port takes `doc`
// explicitly. Callers MUST pass `el.ownerDocument`.
export function nearestHeading(el, doc) {
  const hs = doc.querySelectorAll('h1,h2,h3,h4,h5,h6');
  let best = null;
  for (let i = 0; i < hs.length; i++) {
    const pos = el.compareDocumentPosition(hs[i]);
    // DOCUMENT_POSITION_PRECEDING = 2, DOCUMENT_POSITION_CONTAINS = 8.
    // Inlined to avoid depending on a Node global; matches the bit values
    // defined by the DOM spec and used in feedback-inject.js:235.
    if (pos & 2 || pos & 8) best = hs[i];
  }
  return best ? best.textContent.replace(/\s+/g, ' ').trim().slice(0, 200) : null;
}

// Build a domPath string up to 12 segments deep, stopping at BODY or at an
// element with an id (which becomes the leftmost segment). Each segment is
// tagName[.class1.class2][:nth-of-type(N)] with data-fb-* classes filtered.
export function domPathOf(el) {
  const parts = [];
  let n = el;
  while (n && n.nodeType === 1 && n.tagName !== 'BODY' && parts.length < 12) {
    let seg = n.tagName.toLowerCase();
    if (n.id) { seg += '#' + n.id; parts.unshift(seg); break; }
    let cls = (n.className && n.className.baseVal !== undefined ? n.className.baseVal : n.className) || '';
    cls = String(cls).split(/\s+/).filter(function (c) { return c && !/^data-fb/.test(c); }).slice(0, 2).join('.');
    if (cls) seg += '.' + cls;
    const p = n.parentElement;
    if (p) {
      const same = Array.prototype.filter.call(p.children, function (c) { return c.tagName === n.tagName; });
      if (same.length > 1) seg += ':nth-of-type(' + (Array.prototype.indexOf.call(p.children, n) + 1) + ')';
    }
    parts.unshift(seg);
    n = n.parentElement;
  }
  return parts.join(' > ');
}

// Visible text for the element: alt for IMG, trimmed textContent otherwise.
export function visibleText(el) {
  if (el.tagName === 'IMG') return (el.getAttribute('alt') || '').trim();
  return (el.textContent || '').replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// signalCount: inline-duplicated from src/pages/api/feedback/validate.ts
// (lines 54-61) + MIN_VAGUE_LEN constant from validate.ts:19.
//
// Why duplicate instead of import? Node 24 ESM cannot load .ts files
// without an explicit tsx/ts-node loader, which this repo does not
// configure. validate.ts is v1.1 production code; widening scope to add
// a loader OR refactoring validate.ts to import from a shared .mjs is
// out of scope for OPS-02-fenced v1.3 Phase 7.
//
// Drift is mechanically prevented by Test 7 in tests/edit-catalog/
// locator-parity.test.mjs — a normalized-string parity check between
// this signalCount body and validate.ts:54-61. Hand-edits to either
// copy fail the test until the maintainer syncs both.
// ---------------------------------------------------------------------------

export const MIN_VAGUE_LEN = 25; // free-text change-descriptions must clear this

export function signalCount(p) {
  let n = 0;
  if (p.i18nKey && p.i18nAttr) n += 1;
  if (p.imageRef) n += 1;
  if (p.galleryAttrRaw && Number.isInteger(p.galleryIndex) && p.galleryIndex >= 0) n += 1;
  if (String(p.nearbyText || '').trim().length >= MIN_VAGUE_LEN && p.nearestHeading) n += 1;
  return n;
}
