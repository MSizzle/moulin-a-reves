/*
 * Client-feedback MATCH-inject script — v1.3 per-page review numbered-pin
 * overlay for the LIVE Moulin à Rêves site.
 *
 * Loaded ONLY inside the feedback iframe with BOTH `?feedback=1` AND
 * `?matchSet=<id>` present in the URL (OVERLAY-01 / D-22). The sibling loader
 * block in src/layouts/BaseLayout.astro appends this script with
 * `?v=<matchVer>` where matchVer comes from the iframe URL `?matchVer=<v>`
 * query string (set by feedback.astro per Plan 04), which ultimately sources
 * MATCH_INJECT_VER from src/lib/feedback-version.ts (OPS-01).
 *
 * Source of truth at runtime: sessionStorage key `mar_feedback_match_set_v1`
 * (D-03; written by feedback.astro on a successful POST /api/feedback/match).
 *
 * Catalog fetch (WARNING-3 fix): the inject fetches its own copy of the page
 * catalog at /edit-catalogs/<slug>.json and resolves each match.primaryId by
 * reading the entry's locator signals (i18nKey + i18nAttr, imageRef, domPath) —
 * the 12-hex catalog ID is the LOOKUP KEY into the entryMap, NOT a DOM
 * attribute value. Querying [data-i18n="<raw 12-hex id>"] would never match.
 *
 * OPS-02 fence: this is a SIBLING file to public/feedback-inject.js. NEVER
 * imports / forks / mutates state from it. Disjoint attribute namespaces
 * (data-fb-frozen/data-fb-hover for v1.1 vs data-fb-match/data-fb-match-pin
 * for v1.3) and disjoint sessionStorage keys (mar_feedback_staged_v1 vs
 * mar_feedback_match_set_v1).
 *
 * BLOCKER-1 dependency: drift detection reads the build SHA meta tag
 * emitted by BaseLayout.astro (Task 2 of this plan) — without that meta, the
 * D-15 conditional short-circuits and stale match sets render pins anyway.
 *
 * References: OVERLAY-01..05, D-15 (drift), D-22 (matchSet gate), OVERLAY-03
 * priority chain, OPS-02 fence, WARNING-3 (catalog-driven resolveElement).
 */
(function () {
  if (window.parent === window) return;
  var qs = new URLSearchParams(location.search);
  if (qs.get('feedback') !== '1') return;
  if (!qs.get('matchSet')) return;

  // ---- constants -----------------------------------------------------------
  // Literal hex — the iframe document does not share the parent's CSS tokens
  // per UI-SPEC.md §Color; the pin badge value matches the v1.1 ACCENT.
  var ACCENT = '#FF6B2B';
  // sessionStorage key per D-03 / PATTERNS.md; written by feedback.astro Plan 04.
  var MATCH_SET_KEY = 'mar_feedback_match_set_v1';

  // ---- styles (UI-SPEC.md §5 verbatim) ------------------------------------
  var style = document.createElement('style');
  style.textContent =
    '[data-fb-match]{position:relative!important;}' +
    '[data-fb-match-pin]{position:absolute;top:-12px;left:-12px;z-index:2147483646;width:28px;height:28px;border-radius:999px;background:#FF6B2B;color:#fff;font:600 13px/28px system-ui,-apple-system,sans-serif;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.35),0 0 0 2px #fff;cursor:default;pointer-events:auto;user-select:none;}' +
    '[data-fb-match-pin]:hover{transform:scale(1.1);transition:transform .15s ease-out;}' +
    '[data-fb-match-pin][data-fb-match-focus="true"]{box-shadow:0 4px 12px rgba(0,0,0,.35),0 0 0 3px #6366f1;}';
  document.documentElement.appendChild(style);

  // ---- helpers -------------------------------------------------------------

  function loadMatchSet() {
    try {
      var raw = sessionStorage.getItem(MATCH_SET_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  // D-15 drift signal: read the build SHA the page was rendered with. Without
  // BaseLayout.astro's build SHA meta tag (Task 2), this returns '' and
  // drift detection short-circuits.
  function deployedSha() {
    var m = document.querySelector('meta[name="x-build-sha"]');
    return (m && m.getAttribute('content')) || '';
  }

  // Restrict postMessage delivery to the same-origin parent (T-08-03-02).
  function postToParent(type, payload) {
    var msg = { type: type };
    if (payload) {
      for (var k in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, k)) msg[k] = payload[k];
      }
    }
    try {
      window.parent.postMessage(msg, location.origin);
    } catch (_) {}
  }

  // Inlined slug helper — the inject is a public/ static asset, cannot import
  // from src/lib/. Identical algorithm to Plan 02 routeToSlug + Phase 7's
  // routeToCatalogPath: strip leading/trailing slashes; empty → 'index';
  // preserve inner slashes.
  function routeToSlug(route) {
    if (typeof route !== 'string') return 'index';
    var s = route.replace(/^\/+/, '').replace(/\/+$/, '');
    return s === '' ? 'index' : s;
  }

  function catalogUrlFor(route) {
    return '/edit-catalogs/' + routeToSlug(route) + '.json';
  }

  // Cache the catalog promise so resolveElement can be called from multiple
  // call sites (paint loop, future re-paint hooks) without re-fetching.
  var _catalogPromise = null;
  function fetchCatalog(route) {
    if (_catalogPromise) return _catalogPromise;
    _catalogPromise = fetch(catalogUrlFor(route))
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
    return _catalogPromise;
  }

  // O(1) entry lookups by catalog ID (the 12-hex hash returned by the matcher).
  function buildEntryMap(catalog) {
    var map = new Map();
    if (!catalog || !Array.isArray(catalog.entries)) return map;
    for (var i = 0; i < catalog.entries.length; i++) {
      var e = catalog.entries[i];
      if (e && typeof e.id === 'string') map.set(e.id, e);
    }
    return map;
  }

  // OVERLAY-03 priority chain — catalog-driven resolveElement (WARNING-3 fix).
  // The catalog ID is the LOOKUP KEY into entryMap, NOT a DOM attribute value.
  // The DOM is queried with the entry's locator signals.
  function resolveElement(id, entryMap) {
    if (typeof id !== 'string') return null;
    var entry = entryMap.get(id);
    if (!entry) return null;

    // 1. i18n-text / i18n-html / i18n-placeholder via i18nAttr + i18nKey
    if (
      (entry.kind === 'i18n-text' || entry.kind === 'i18n-html' || entry.kind === 'i18n-placeholder') &&
      typeof entry.i18nKey === 'string' && entry.i18nKey &&
      typeof entry.i18nAttr === 'string' && entry.i18nAttr
    ) {
      try {
        var sel = '[' + entry.i18nAttr + '="' + CSS.escape(entry.i18nKey) + '"]';
        var el = document.querySelector(sel);
        if (el) return el;
      } catch (_) { /* defensive: bad i18nAttr value should not crash inject */ }
    }

    // 2. image / gallery-image via imageRef (with optional gallery disambiguation)
    if ((entry.kind === 'image' || entry.kind === 'gallery-image') && typeof entry.imageRef === 'string' && entry.imageRef) {
      try {
        var imgSel = 'img[src="' + CSS.escape(entry.imageRef) + '"]';
        var img = document.querySelector(imgSel);
        if (img) return img;
        if (entry.kind === 'gallery-image' && typeof entry.galleryAttrRaw === 'string' && entry.galleryAttrRaw) {
          var galleryAttr = entry.galleryAttrRaw;
          var narrowSel = 'img[' + galleryAttr + '][src="' + CSS.escape(entry.imageRef) + '"]';
          var narrowImg = document.querySelector(narrowSel);
          if (narrowImg) return narrowImg;
        }
      } catch (_) { /* defensive */ }
    }

    // 3. domPath fallback (hardcoded-text / heading / anything else)
    if (typeof entry.domPath === 'string' && entry.domPath) {
      try {
        var fb = document.querySelector(entry.domPath);
        if (fb) return fb;
      } catch (_) { /* domPath may have special chars that throw SyntaxError */ }
    }

    return null;
  }

  function paintPin(element, lineIndex) {
    if (!element) return false;
    var idxStr = String(lineIndex);

    // For <img> matches, wrap in a positioned span so the pin can anchor
    // (img cannot have children). Defensive: don't double-wrap.
    if (element.tagName === 'IMG') {
      var parent = element.parentNode;
      if (!parent) return false;
      var alreadyWrapped = parent.getAttribute && parent.getAttribute('data-fb-match-wrap') === 'true';
      var host;
      if (alreadyWrapped) {
        host = parent;
      } else {
        var wrap = document.createElement('span');
        wrap.setAttribute('data-fb-match-wrap', 'true');
        wrap.style.position = 'relative';
        wrap.style.display = 'inline-block';
        parent.insertBefore(wrap, element);
        wrap.appendChild(element);
        host = wrap;
      }
      host.setAttribute('data-fb-match', idxStr);
      var pin = document.createElement('div');
      pin.setAttribute('data-fb-match-pin', idxStr);
      pin.textContent = idxStr;
      host.appendChild(pin);
      return true;
    }

    element.setAttribute('data-fb-match', idxStr);
    var pin2 = document.createElement('div');
    pin2.setAttribute('data-fb-match-pin', idxStr);
    pin2.textContent = idxStr;
    element.appendChild(pin2);
    return true;
  }

  function clearPin(lineIndex) {
    var idxStr = String(lineIndex);
    var host = document.querySelector('[data-fb-match="' + CSS.escape(idxStr) + '"]');
    if (!host) return;
    var pin = host.querySelector('[data-fb-match-pin="' + CSS.escape(idxStr) + '"]');
    if (pin && pin.parentNode === host) host.removeChild(pin);
    host.removeAttribute('data-fb-match');
    // If the host is a data-fb-match-wrap span and has no remaining pins,
    // unwrap it so we restore the original DOM topology around the <img>.
    if (host.getAttribute('data-fb-match-wrap') === 'true' &&
        !host.querySelector('[data-fb-match-pin]')) {
      var parent2 = host.parentNode;
      if (parent2) {
        while (host.firstChild) parent2.insertBefore(host.firstChild, host);
        parent2.removeChild(host);
      }
    }
  }

  function focusPin(lineIndex) {
    var idxStr = String(lineIndex);
    var pin = document.querySelector('[data-fb-match-pin="' + CSS.escape(idxStr) + '"]');
    if (!pin) return;
    pin.setAttribute('data-fb-match-focus', 'true');
    var parent = pin.parentNode;
    if (parent && typeof parent.scrollIntoView === 'function') {
      try { parent.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
    }
    setTimeout(function () {
      // Only clear if still focused (don't override a re-focus)
      if (pin.getAttribute('data-fb-match-focus') === 'true') {
        pin.removeAttribute('data-fb-match-focus');
      }
    }, 2000);
  }

  // UI-SPEC.md §4 locked copy. Transient toast inside the iframe document.
  function showManualPickToast() {
    var existing = document.getElementById('mar-fb-match-manual-toast');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    var toast = document.createElement('div');
    toast.id = 'mar-fb-match-manual-toast';
    toast.textContent = 'Click any element inside the preview to pick it for this line.';
    toast.style.cssText =
      'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);' +
      'z-index:2147483647;background:#0f172a;color:#e2e8f0;' +
      'border:1px solid #334155;border-radius:8px;padding:12px 16px;' +
      'font:500 13px/1.3 system-ui,-apple-system,sans-serif;' +
      'box-shadow:0 10px 30px rgba(0,0,0,.45);max-width:80vw;text-align:center;';
    document.body.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 8000);
  }

  // ---- main paint flow -----------------------------------------------------
  (async function paint() {
    var matchSet = loadMatchSet();
    if (!matchSet || !Array.isArray(matchSet.matches)) return;

    // D-04 cross-check: stale sessionStorage from a different tab.
    var urlMatchSetId = qs.get('matchSet');
    if (matchSet.id && urlMatchSetId && matchSet.id !== urlMatchSetId) return;

    // OVERLAY-02 / D-15 drift detection. Without Task 2's <meta>, deployed
    // is '' and the conditional short-circuits to the no-drift branch.
    var deployed = deployedSha();
    if (matchSet.buildSha && deployed && matchSet.buildSha !== deployed) {
      postToParent('mar:feedback:matchset-stale', { matchSetId: matchSet.id });
      return; // paint NO pins
    }

    // WARNING-3 fix — fetch the catalog and resolve via locator signals.
    var catalog = await fetchCatalog(matchSet.route);
    if (!catalog) {
      postToParent('mar:feedback:match-ready', {
        matchSetId: matchSet.id,
        paintedCount: 0,
        totalCount: matchSet.matches.length,
      });
      return;
    }
    var entryMap = buildEntryMap(catalog);

    var paintedCount = 0;
    var rowStates = Array.isArray(matchSet.rowStates) ? matchSet.rowStates : [];
    for (var i = 0; i < matchSet.matches.length; i++) {
      var m = matchSet.matches[i];
      var row = rowStates[i] || { status: 'pending' };
      if (row.status === 'rejected') continue;
      if (!m || !m.primaryId) continue;
      var el = resolveElement(m.primaryId, entryMap);
      if (!el) continue;
      if (paintPin(el, i + 1)) paintedCount++;
    }

    postToParent('mar:feedback:match-ready', {
      matchSetId: matchSet.id,
      paintedCount: paintedCount,
      totalCount: matchSet.matches.length,
    });
  })();

  // ---- inbound message listener (parent -> inject) -------------------------
  // PATTERNS.md Pattern 4: origin check is the first line.
  window.addEventListener('message', function (ev) {
    if (ev.origin !== location.origin) return;
    var msg = ev && ev.data;
    if (!msg || typeof msg.type !== 'string') return;

    if (msg.type === 'mar:feedback:match-focus' && typeof msg.lineIndex === 'number') {
      focusPin(msg.lineIndex);
      return;
    }
    if (msg.type === 'mar:feedback:match-pick-manually' && typeof msg.lineIndex === 'number') {
      clearPin(msg.lineIndex);
      showManualPickToast();
      // The actual manual-pick capture is handled by the v1.1 inject's
      // existing click handler (which sets data-fb-frozen). OPS-02 fences
      // us out of its state machine — we do NOT install a click listener.
      return;
    }
    // mar:feedback:manual-resolved is OUTBOUND-only (sent by us on a future
    // wiring extension, consumed by the parent's Plan 05 panel). Other
    // outbound types (matchset-stale, match-ready) are sent above.
  });
})();
