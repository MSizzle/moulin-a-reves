// ---------------------------------------------------------------------------
// Catalog walker for CATALOG-02 + CATALOG-03. Consumes the shared helper at
// src/lib/locator-signals.mjs (parity-pinned to the browser inject script
// under public/ per OPS-02). Given a linkedom-parsed document for one
// prerendered route, returns
// an Array<CatalogEntry> by applying the element-selection ladder from the
// 07-03 PLAN <interfaces>:
//
//   1. <img> with src starting /images/   -> image OR gallery-image
//   2. data-i18n-html host                -> i18n-html
//   3. data-i18n host                     -> i18n-text
//   4. data-i18n-placeholder host         -> i18n-text (attr disambiguates)
//   5. <h1>..<h6> not already claimed     -> heading
//   6. text-leaf (p, span, em, strong,    -> hardcoded-text (with optional
//      li, a, button, blockquote) not        contentIndex source resolution)
//      under an i18n ancestor
//
// First match claims the element via a WeakSet, so no element appears in two
// entries. Per-entry id is the sha1 of (kind | i18nKey | imageRef |
// galleryAttrRaw | galleryIndex | domPath) sliced to 12 hex chars — stable
// across builds for the same element.
//
// signalCount enforcement: an entry is auto-mergeable
// (requiresManualSelection: false) only when signalCount() >= 2 on its
// locator tuple OR (kind === 'hardcoded-text' AND a content-source resolved
// via the contentIndex). Otherwise requiresManualSelection: true.
//
// OPS-02 fence: this module NEVER imports from the browser inject script
// under public/; that file is frozen for v1.3. The locator-signals helper
// module under src/lib/ is the only seam between Node-side build code and
// the v1.1 locator logic.
// NEVER use curly quotes in this file.
// ---------------------------------------------------------------------------

import { createHash } from 'node:crypto';

import {
  closestAttr,
  i18nOf,
  imageRefOf,
  galleryOf,
  nearestHeading,
  domPathOf,
  visibleText,
  signalCount,
} from '../../lib/locator-signals.mjs';
import { normalizeText } from './content-index.mjs';

// Tag names that, when they hold non-empty trimmed text and aren't inside an
// i18n-attributed ancestor, become hardcoded-text entries. Mirrors the
// element-selection ladder in the 07-03 PLAN <interfaces>.
const HARDCODED_TEXT_TAGS = new Set([
  'P', 'SPAN', 'EM', 'STRONG', 'LI', 'A', 'BUTTON', 'BLOCKQUOTE',
]);

const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

const I18N_ATTRS = ['data-i18n-html', 'data-i18n', 'data-i18n-placeholder'];

/**
 * Compute the stable 12-hex-char id from the entry's classification + locator
 * fields. The same physical element across two builds produces the same id
 * because (kind, i18nKey, imageRef, galleryAttrRaw, galleryIndex, domPath)
 * are stable under the static-site assumption.
 *
 * @param {{
 *   kind: string,
 *   i18nKey?: string | null,
 *   imageRef?: string | null,
 *   galleryAttrRaw?: string | null,
 *   galleryIndex?: number | null,
 *   domPath?: string | null,
 * }} parts
 * @returns {string}
 */
function computeId(parts) {
  const seed =
    parts.kind +
    '|' +
    (parts.i18nKey == null ? '' : parts.i18nKey) +
    '|' +
    (parts.imageRef == null ? '' : parts.imageRef) +
    '|' +
    (parts.galleryAttrRaw == null ? '' : parts.galleryAttrRaw) +
    '|' +
    (parts.galleryIndex == null ? '' : String(parts.galleryIndex)) +
    '|' +
    (parts.domPath == null ? '' : parts.domPath);
  return createHash('sha1').update(seed).digest('hex').slice(0, 12);
}

/**
 * Decide the kind for an already-classified slot. Exported so the walker
 * tests (and downstream callers in Phase 8) can introspect the
 * classification rule independently of the full walk.
 *
 * Returns null when the element does not match any kind in the ladder.
 *
 * @param {Element} el
 * @returns {string | null}
 */
export function classifyKind(el) {
  if (!el || el.nodeType !== 1) return null;

  // Step 1: IMG with /images/ src
  if (el.tagName === 'IMG') {
    const src = el.getAttribute('src') || '';
    if (/^\/images\//.test(src) || /\/images\//.test(src)) {
      const galleryHost =
        closestAttr(el, 'data-gallery') || closestAttr(el, 'data-room');
      return galleryHost ? 'gallery-image' : 'image';
    }
    return null;
  }

  // Step 2-4: i18n attributes on the element itself
  if (el.hasAttribute('data-i18n-html')) return 'i18n-html';
  if (el.hasAttribute('data-i18n')) return 'i18n-text';
  if (el.hasAttribute('data-i18n-placeholder')) return 'i18n-text';

  // Step 5: bare heading
  if (HEADING_TAGS.has(el.tagName)) {
    // Skip if any i18n attribute is on the heading itself (already handled
    // above) OR on an ancestor — i18n claims it before heading does.
    for (const attr of I18N_ATTRS) {
      if (closestAttr(el, attr)) return null;
    }
    return 'heading';
  }

  // Step 6: text-bearing leaf
  if (HARDCODED_TEXT_TAGS.has(el.tagName)) {
    for (const attr of I18N_ATTRS) {
      if (closestAttr(el, attr)) return null;
    }
    const text = visibleText(el);
    if (!text) return null;
    return 'hardcoded-text';
  }

  return null;
}

/**
 * Build a CatalogEntry for one element, applying the locator-signal helpers
 * from src/lib/locator-signals.mjs and the content-index source lookup.
 * Returns null if the element doesn't qualify (shouldn't happen if the
 * caller already filtered with classifyKind, but guards against drift).
 *
 * @param {Element} el
 * @param {Document} doc
 * @param {Map<string, Array<{ file: string, fieldPath: string }>>} contentIndex
 * @returns {object | null}
 */
function buildEntry(el, doc, contentIndex) {
  const kind = classifyKind(el);
  if (!kind) return null;

  const i18n = i18nOf(el);
  const heading = nearestHeading(el, doc);
  const dom = domPathOf(el);
  const text = visibleText(el);

  /** @type {any} */
  const entry = { id: '', kind };

  // Populate locator-signal fields per the schema in PLAN <interfaces>.
  if (kind === 'i18n-text' || kind === 'i18n-html') {
    entry.i18nKey = i18n.key;
    entry.i18nAttr = i18n.attr;
    entry.currentText = text || null;
    entry.nearestHeading = heading;
    entry.domPath = dom;
  } else if (kind === 'image') {
    entry.imageRef = imageRefOf(el);
    entry.altText = el.getAttribute('alt') || null;
    entry.currentText = text || null;
    entry.nearestHeading = heading;
    entry.domPath = dom;
  } else if (kind === 'gallery-image') {
    const gal = galleryOf(el);
    entry.imageRef = imageRefOf(el);
    entry.altText = el.getAttribute('alt') || null;
    entry.galleryAttrRaw = gal.raw;
    entry.galleryIndex = gal.index;
    entry.currentText = text || null;
    entry.nearestHeading = heading;
    entry.domPath = dom;
  } else if (kind === 'heading') {
    entry.currentText = text || null;
    entry.nearestHeading = heading;
    entry.domPath = dom;
  } else if (kind === 'hardcoded-text') {
    entry.currentText = text || null;
    entry.nearestHeading = heading;
    entry.domPath = dom;
    // Content-index lookup — first hit wins (matcher endpoint in Phase 8 can
    // re-rank if collisions matter).
    const match = contentIndex ? contentIndex.get(normalizeText(text)) : undefined;
    if (match && match.length > 0) {
      const first = match[0];
      entry.source = { file: first.file, fieldPath: first.fieldPath };
    }
  }

  // Compute id from the stable parts.
  entry.id = computeId({
    kind: entry.kind,
    i18nKey: entry.i18nKey,
    imageRef: entry.imageRef,
    galleryAttrRaw: entry.galleryAttrRaw,
    galleryIndex: entry.galleryIndex,
    domPath: entry.domPath,
  });

  // Resolve requiresManualSelection. Tuple field names: signalCount() expects
  // `nearbyText` for the length-check signal; the catalog stores that text in
  // `currentText`, so re-map locally.
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

  if (kind === 'hardcoded-text') {
    // CATALOG-04 extension: a content-source acts as the 2nd anchor for the
    // hardcoded-text case. A hardcoded-text entry with no content-source is
    // ALWAYS requiresManualSelection: true — without source, the entry has
    // at most domPath as a locator anchor, which signalCount() never counts.
    entry.requiresManualSelection = entry.source ? false : true;
  } else {
    entry.requiresManualSelection = count < 2;
  }

  return entry;
}

/**
 * Walk one route's HTML document and return its catalog entries in document
 * order. Each element appears in at most one entry (claimed via a WeakSet
 * during the ladder pass).
 *
 * @param {{
 *   document: Document,
 *   route: string,
 *   contentIndex: Map<string, Array<{ file: string, fieldPath: string }>>,
 * }} args
 * @returns {Array<object>}
 */
export function walkRoute({ document, route, contentIndex }) {
  if (!document) {
    throw new TypeError('walkRoute: document is required');
  }
  void route; // route is accepted for future per-route metadata; not used in v1.3 entry shape.

  const claimed = new WeakSet();
  /** @type {Array<object>} */
  const entries = [];

  // The selection ladder runs in document order via a single
  // querySelectorAll('*') pass; each element is checked through classifyKind
  // and skipped if it's already claimed (e.g. a heading is claimed before
  // its inner span is reached).
  const all = document.querySelectorAll('*');

  // First sub-pass: images (claim them before headings/text could over-claim
  // any wrapping element). This matches step 1 of the ladder.
  for (const el of all) {
    if (el.tagName !== 'IMG') continue;
    if (claimed.has(el)) continue;
    const kind = classifyKind(el);
    if (kind !== 'image' && kind !== 'gallery-image') continue;
    const entry = buildEntry(el, document, contentIndex);
    if (entry) {
      entries.push(entry);
      claimed.add(el);
    }
  }

  // Second sub-pass: i18n-attributed hosts (steps 2-4 of the ladder).
  for (const el of all) {
    if (claimed.has(el)) continue;
    if (
      !el.hasAttribute('data-i18n-html') &&
      !el.hasAttribute('data-i18n') &&
      !el.hasAttribute('data-i18n-placeholder')
    ) {
      continue;
    }
    const kind = classifyKind(el);
    if (kind !== 'i18n-text' && kind !== 'i18n-html') continue;
    const entry = buildEntry(el, document, contentIndex);
    if (entry) {
      entries.push(entry);
      claimed.add(el);
    }
  }

  // Third sub-pass: bare headings (step 5).
  for (const el of all) {
    if (claimed.has(el)) continue;
    if (!HEADING_TAGS.has(el.tagName)) continue;
    const kind = classifyKind(el);
    if (kind !== 'heading') continue;
    const entry = buildEntry(el, document, contentIndex);
    if (entry) {
      entries.push(entry);
      claimed.add(el);
    }
  }

  // Fourth sub-pass: hardcoded text-leaf (step 6).
  for (const el of all) {
    if (claimed.has(el)) continue;
    if (!HARDCODED_TEXT_TAGS.has(el.tagName)) continue;
    // Skip elements whose text-bearing role is owned by an ancestor that has
    // already been claimed (e.g. a span inside a claimed <a> or <p>).
    let ancestor = el.parentElement;
    let ancestorClaimed = false;
    while (ancestor) {
      if (claimed.has(ancestor)) {
        ancestorClaimed = true;
        break;
      }
      ancestor = ancestor.parentElement;
    }
    if (ancestorClaimed) continue;
    const kind = classifyKind(el);
    if (kind !== 'hardcoded-text') continue;
    // Also skip if a descendant text-leaf has already been claimed under us
    // — we don't want both the wrapping <p> and its inner <a> in the catalog.
    let hasClaimedDescendant = false;
    const descendants = el.querySelectorAll('*');
    for (const d of descendants) {
      if (claimed.has(d)) {
        hasClaimedDescendant = true;
        break;
      }
    }
    if (hasClaimedDescendant) continue;
    const entry = buildEntry(el, document, contentIndex);
    if (entry) {
      entries.push(entry);
      claimed.add(el);
    }
  }

  return entries;
}
