/*
 * Client-feedback inject script — guided "click anything, tell us what to
 * change" overlay for the LIVE Moulin à Rêves site.
 *
 * Runs ONLY inside the feedback iframe with `?feedback=1` (same iframe/query
 * guard shape as public/editor-inject.js). It is ADDITIVE and never touches
 * the editor flow. It implements the disambiguation state machine
 * (A Idle → B Selected → C Intent fields → D Confirm → E auth-recover),
 * builds the layered locator, validates client-side (the server in
 * api/feedback/submit.ts re-validates — keep the rules in sync), keeps the
 * in-progress draft in localStorage so a 401/expiry loses nothing, and
 * postMessages a validated payload to the parent (src/pages/feedback.astro).
 *
 * Cache-bust: loaded as /feedback-inject.js?v=<FEEDBACK_INJECT_VER>. Bump
 * src/lib/feedback-version.ts on every behavioural change here.
 */
(function () {
  if (window.parent === window) return;
  if (new URLSearchParams(location.search).get('feedback') !== '1') return;

  // ---- shared contract (KEEP IN SYNC with src/pages/api/feedback/submit.ts + src/pages/api/feedback/validate.ts) --
  var SCHEMA_VERSION = 1;
  var SCHEMA_VERSION_V2 = 2;
  var MAX_IMAGE_BYTES = 12 * 1024 * 1024;
  // D-01 / STAGE-06 — mirror submit.ts MAX_BATCH_EDITS exactly.
  var MAX_BATCH_EDITS = 10;
  // D-02 / D-03 / STAGE-06 — mirror submit.ts MAX_BATCH_BYTES exactly.
  // Server is currently locked to 3 MB (Hobby-safe; Vercel default body limit
  // ~4.5 MB and base64 inflates ~33%). When the operator lifts the server
  // constant to 30 MB after confirming a Pro+ tier with body-size override,
  // bump this client mirror in the SAME PR.
  var MAX_BATCH_BYTES = 3 * 1024 * 1024;
  var MIN_VAGUE_LEN = 25;
  var DRAFT_KEY = 'mar_feedback_draft_v1';
  // sessionStorage (NOT localStorage) per D-08 — stages survive iframe
  // navigation + reload, clear on browser close. localStorage and server-side
  // draft issues are explicitly Out of Scope for v1.1 per REQUIREMENTS.md.
  var STAGED_KEY = 'mar_feedback_staged_v1';
  var MOVE_RESIZE_OPTIONS = [
    { v: 'move-up', l: 'Move it up' },
    { v: 'move-down', l: 'Move it down' },
    { v: 'move-left', l: 'Move it left' },
    { v: 'move-right', l: 'Move it right' },
    { v: 'make-bigger', l: 'Make it bigger' },
    { v: 'make-smaller', l: 'Make it smaller' },
    { v: 'more-space-around', l: 'More space around it' },
    { v: 'less-space-around', l: 'Less space around it' },
  ];
  var VAGUE_STOPLIST = [
    'fix this', 'fix it', 'better', 'make it better', 'make it pop', 'make it nice',
    'make it nicer', 'nicer', 'cleaner', 'improve', 'improve this', 'looks off',
    'looks weird', 'looks bad', 'more modern', 'modernize', 'update this',
    'change this', 'do something', 'something else', 'idk', 'dunno',
  ];
  var VAGUE_MESSAGE =
    'Can you be more specific? What exactly should change, and what should it look like afterward?';

  function isVague(raw) {
    var t = String(raw == null ? '' : raw).trim();
    if (t.length < MIN_VAGUE_LEN) return true;
    var norm = t.toLowerCase().replace(/[^0-9a-zà-ÿ ]/gi, ' ').replace(/\s+/g, ' ').trim();
    for (var i = 0; i < VAGUE_STOPLIST.length; i++) {
      var ph = VAGUE_STOPLIST[i];
      if (norm === ph) return true;
      if (norm.indexOf(ph) !== -1 && norm.length < ph.length + 25) return true;
    }
    return false;
  }

  // ---- styles ---------------------------------------------------------------
  var ACCENT = '#FF6B2B';
  var style = document.createElement('style');
  style.textContent =
    '[data-fb-hover]{outline:2px dashed rgba(255,107,43,.6)!important;outline-offset:3px!important;cursor:crosshair!important;}' +
    '[data-fb-frozen]{outline:2px solid ' + ACCENT + '!important;outline-offset:3px!important;background:rgba(255,107,43,.06)!important;}' +
    '#mar-fb-banner{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:2147483646;background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:999px;padding:.5rem 1rem;font:500 13px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35);}' +
    '#mar-fb-panel{position:fixed;right:16px;bottom:16px;width:360px;max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);overflow:auto;z-index:2147483647;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:14px;box-shadow:0 25px 60px rgba(0,0,0,.5);font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}' +
    '#mar-fb-panel .hd{display:flex;align-items:center;gap:.5rem;padding:.85rem 1rem;border-bottom:1px solid #334155;}' +
    '#mar-fb-panel .hd b{font-size:.95rem;flex:1;}' +
    '#mar-fb-panel .x{cursor:pointer;color:#94a3b8;border:0;background:none;font-size:1.1rem;line-height:1;}' +
    '#mar-fb-panel .bd{padding:1rem;}' +
    '#mar-fb-panel .lbl{display:block;font-size:.8rem;color:#94a3b8;margin:.9rem 0 .35rem;}' +
    '#mar-fb-panel .lbl:first-child{margin-top:0;}' +
    '#mar-fb-panel input[type=text],#mar-fb-panel textarea,#mar-fb-panel select{width:100%;background:#1e293b;color:#f8fafc;border:1px solid #334155;border-radius:8px;padding:.6rem .7rem;font:inherit;outline:none;}' +
    '#mar-fb-panel textarea{min-height:74px;resize:vertical;}' +
    '#mar-fb-panel .opt{display:flex;gap:.55rem;align-items:flex-start;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:.55rem .7rem;margin-bottom:.45rem;cursor:pointer;}' +
    '#mar-fb-panel .opt input{margin-top:.15rem;}' +
    '#mar-fb-panel .opt span small{display:block;color:#94a3b8;font-size:.78rem;}' +
    '#mar-fb-panel .chk{display:flex;gap:.5rem;align-items:flex-start;margin:.6rem 0;font-size:.85rem;color:#cbd5e1;}' +
    '#mar-fb-panel .prev{margin:.4rem 0;padding:.6rem .7rem;background:#1e293b;border:1px solid #334155;border-radius:8px;font-size:.85rem;color:#cbd5e1;max-height:120px;overflow:auto;}' +
    '#mar-fb-panel img.thumb{max-width:100%;max-height:120px;border-radius:8px;display:block;margin:.4rem 0;}' +
    '#mar-fb-panel .err{display:none;background:#7f1d1d;border:1px solid #dc2626;color:#fecaca;padding:.55rem .7rem;border-radius:8px;font-size:.82rem;margin:.7rem 0 0;}' +
    '#mar-fb-panel .err.show{display:block;}' +
    '#mar-fb-panel .ft{display:flex;gap:.6rem;padding:.85rem 1rem;border-top:1px solid #334155;}' +
    '#mar-fb-panel button.act{flex:1;background:#6366f1;color:#fff;border:0;border-radius:8px;padding:.65rem;font:600 14px/1 inherit;cursor:pointer;}' +
    '#mar-fb-panel button.ghost{flex:1;background:transparent;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:.65rem;cursor:pointer;}' +
    '#mar-fb-panel button[disabled]{opacity:.5;cursor:not-allowed;}' +
    '#mar-fb-panel .sum li{margin:.2rem 0;}' +
    '#mar-fb-panel .ok{background:#052e16;border:1px solid #15803d;color:#bbf7d0;padding:.7rem;border-radius:8px;}' +
    /* ---- v2 corner chip (STAGE-02) + staged-edits panel (STAGE-03) ---- */
    '#mar-fb-chip{position:fixed;right:16px;bottom:16px;z-index:2147483645;padding:8px 12px;border-radius:999px;background:#0f172a;color:#e2e8f0;font-family:system-ui,sans-serif;font-size:13px;line-height:1.2;cursor:default;box-shadow:0 2px 8px rgba(0,0,0,.25);display:flex;gap:6px;align-items:center;border:1px solid #334155;}' +
    '#mar-fb-chip .mar-fb-chip__count{background:' + ACCENT + ';color:#fff;border-radius:999px;padding:2px 8px;font-weight:600;}' +
    '#mar-fb-chip .mar-fb-chip__sep{color:#94a3b8;}' +
    '#mar-fb-chip button{background:transparent;color:#e2e8f0;border:none;cursor:pointer;text-decoration:underline;font:inherit;padding:0;}' +
    '#mar-fb-chip button:hover{color:#fff;}' +
    '#mar-fb-chip button[disabled]{opacity:.5;cursor:not-allowed;text-decoration:none;}' +
    '#mar-fb-panel-staged{position:fixed;right:16px;bottom:60px;z-index:2147483647;width:360px;max-width:calc(100vw - 32px);max-height:60vh;overflow-y:auto;background:#0f172a;color:#e2e8f0;font-family:system-ui,sans-serif;font-size:13px;padding:12px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.4);border:1px solid #334155;}' +
    '#mar-fb-panel-staged h4{font-size:.9rem;margin-bottom:.5rem;color:#e2e8f0;}' +
    '#mar-fb-panel-staged .mar-fb-staged-item{padding:8px;border:1px solid #1e293b;border-radius:6px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;background:#1e293b;}' +
    '#mar-fb-panel-staged .mar-fb-staged-item.is-error{border-color:' + ACCENT + ';background:#3b1a0d;}' +
    '#mar-fb-panel-staged .mar-fb-staged-item__body{flex:1;overflow:hidden;word-break:break-word;}' +
    '#mar-fb-panel-staged .mar-fb-staged-item__meta{color:#94a3b8;font-size:.75rem;margin-bottom:.2rem;}' +
    '#mar-fb-panel-staged .mar-fb-staged-item__error{color:#fecaca;font-size:.78rem;margin-top:.3rem;}' +
    '#mar-fb-panel-staged .mar-fb-staged-item__delete{background:transparent;color:#e2e8f0;border:none;cursor:pointer;font-size:16px;line-height:1;padding:0 4px;}' +
    '#mar-fb-panel-staged .mar-fb-staged-item__delete:hover{color:' + ACCENT + ';}' +
    '#mar-fb-panel-staged .mar-fb-staged-cap-msg{color:' + ACCENT + ';font-weight:600;padding:8px;border:1px dashed ' + ACCENT + ';border-radius:6px;margin-bottom:8px;font-size:.82rem;}' +
    '#mar-fb-panel-staged .mar-fb-staged-empty{color:#94a3b8;font-style:italic;padding:8px;}' +
    '#mar-fb-panel-staged .mar-fb-staged-actions{display:flex;justify-content:space-between;gap:8px;margin-top:8px;}' +
    '#mar-fb-panel-staged .mar-fb-staged-actions button{flex:1;padding:8px;border-radius:6px;border:none;font-weight:600;cursor:pointer;font:inherit;}' +
    '#mar-fb-panel-staged .mar-fb-staged-submit{background:' + ACCENT + ';color:#fff;}' +
    '#mar-fb-panel-staged .mar-fb-staged-submit[disabled]{opacity:.5;cursor:not-allowed;}' +
    '#mar-fb-panel-staged .mar-fb-staged-clear{background:#1e293b;color:#e2e8f0;border:1px solid #334155!important;}';
  document.documentElement.appendChild(style);

  // ---- state ----------------------------------------------------------------
  var STATE = {
    IDLE: 'idle',
    SELECTED: 'selected',
    FIELDS: 'fields',
    CONFIRM: 'confirm',
    STAGED: 'staged',
    SUBMITTING: 'submitting',
    DONE: 'done',
    AUTH: 'auth',
  };
  var state = STATE.IDLE;
  var frozenEl = null;
  var locator = null; // captured at freeze time
  var draft = { intent: null, detail: {}, image: null }; // image: {dataURL,name,type,size}
  var hovered = null;
  // In-memory File map (stageId → File). Ephemeral; NOT serialised to
  // sessionStorage (D-09 / STAGE-05) — only descriptors {name,type,size} are
  // persisted. Files lost across iframe navigation degrade gracefully: the
  // staged entry's imageDescriptor remains in storage, the panel shows the
  // file name, and the user can re-attach if the edit needs the photo.
  var fileMap = {};
  // Tracks the last reason a cap was hit, so renderConfirm() can surface the
  // inline cap message above its disabled Confirm button (D-04 / STAGE-07).
  var lastCapMessage = null;

  function nextStageId() {
    return 's_' + Date.now() + '_' + Math.floor(Math.random() * 1e9).toString(36);
  }

  var banner = document.createElement('div');
  banner.id = 'mar-fb-banner';
  banner.textContent = 'Feedback mode — hover anything you’d like changed, then click it.';
  document.body.appendChild(banner);

  var panel = null;

  // ---- locator capture ------------------------------------------------------
  function astroGuess(pathname) {
    var p = String(pathname || '/').replace(/\/+$/, '');
    if (p === '') return 'src/pages/index.astro';
    return 'src/pages' + p + '.astro';
  }

  function closestAttr(el, attr) {
    var n = el;
    while (n && n.nodeType === 1) {
      if (n.hasAttribute(attr)) return n;
      n = n.parentElement;
    }
    return null;
  }

  function i18nOf(el) {
    var order = ['data-i18n-html', 'data-i18n', 'data-i18n-placeholder'];
    for (var i = 0; i < order.length; i++) {
      var host = closestAttr(el, order[i]);
      if (host) return { key: host.getAttribute(order[i]), attr: order[i] };
    }
    return { key: null, attr: null };
  }

  // Normalize any image URL down to a greppable /images/*.webp ref.
  function normImage(url) {
    if (!url) return null;
    var m = String(url).match(/\/images\/[^"')?#]+/);
    return m ? m[0] : null;
  }

  function imageRefOf(el) {
    if (el.tagName === 'IMG' && el.getAttribute('src')) {
      var r = normImage(el.getAttribute('src'));
      if (r) return r;
    }
    var innerImg = el.querySelector && el.querySelector('img[src]');
    if (innerImg) {
      var ri = normImage(innerImg.getAttribute('src'));
      if (ri) return ri;
    }
    try {
      var bg = getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none') {
        var rb = normImage(bg);
        if (rb) return rb;
      }
    } catch (e) {}
    return null;
  }

  function galleryOf(el) {
    var host = closestAttr(el, 'data-gallery') || closestAttr(el, 'data-room');
    if (!host) return { raw: null, index: null };
    var raw = host.getAttribute('data-gallery') || host.getAttribute('data-room');
    // Best-effort index: which <img> inside the host the click was nearest to.
    var idx = null;
    try {
      var imgs = host.querySelectorAll('img');
      for (var i = 0; i < imgs.length; i++) {
        if (imgs[i] === el || imgs[i].contains(el) || el.contains(imgs[i])) { idx = i; break; }
      }
    } catch (e) {}
    return { raw: raw, index: idx };
  }

  function headingNear(el) {
    var hs = document.querySelectorAll('h1,h2,h3,h4,h5,h6');
    var best = null;
    for (var i = 0; i < hs.length; i++) {
      var pos = el.compareDocumentPosition(hs[i]);
      // heading precedes el (or contains it)
      if (pos & Node.DOCUMENT_POSITION_PRECEDING || pos & Node.DOCUMENT_POSITION_CONTAINS) best = hs[i];
    }
    return best ? best.textContent.replace(/\s+/g, ' ').trim().slice(0, 200) : null;
  }

  function domPathOf(el) {
    var parts = [];
    var n = el;
    while (n && n.nodeType === 1 && n.tagName !== 'BODY' && parts.length < 12) {
      var seg = n.tagName.toLowerCase();
      if (n.id) { seg += '#' + n.id; parts.unshift(seg); break; }
      var cls = (n.className && n.className.baseVal !== undefined ? n.className.baseVal : n.className) || '';
      cls = String(cls).split(/\s+/).filter(function (c) { return c && !/^data-fb/.test(c); }).slice(0, 2).join('.');
      if (cls) seg += '.' + cls;
      var p = n.parentElement;
      if (p) {
        var same = Array.prototype.filter.call(p.children, function (c) { return c.tagName === n.tagName; });
        if (same.length > 1) seg += ':nth-of-type(' + (Array.prototype.indexOf.call(p.children, n) + 1) + ')';
      }
      parts.unshift(seg);
      n = n.parentElement;
    }
    return parts.join(' > ');
  }

  function cleanOuterHTML(el) {
    var c = el.cloneNode(true);
    var strip = function (node) {
      if (node.nodeType !== 1) return;
      ['data-fb-hover', 'data-fb-frozen', 'data-ed-hover', 'data-ed-active', 'contenteditable'].forEach(function (a) {
        node.removeAttribute(a);
      });
      for (var i = 0; i < node.children.length; i++) strip(node.children[i]);
    };
    strip(c);
    return c.outerHTML.slice(0, 1500);
  }

  function computedSubset(el) {
    try {
      var s = getComputedStyle(el);
      var keys = ['display', 'position', 'fontSize', 'fontWeight', 'color',
        'backgroundColor', 'textAlign', 'margin', 'padding', 'width', 'height'];
      var out = {};
      keys.forEach(function (k) { out[k] = s[k]; });
      return out;
    } catch (e) { return null; }
  }

  function visibleText(el) {
    if (el.tagName === 'IMG') return (el.getAttribute('alt') || '').trim();
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function captureLocator(el) {
    var i18n = i18nOf(el);
    var gal = galleryOf(el);
    var rect = el.getBoundingClientRect();
    var txt = visibleText(el);
    return {
      schemaVersion: SCHEMA_VERSION,
      pageRoute: location.pathname,
      astroFileGuess: astroGuess(location.pathname),
      i18nKey: i18n.key,
      i18nAttr: i18n.attr,
      imageRef: imageRefOf(el),
      galleryAttrRaw: gal.raw,
      galleryIndex: gal.index,
      domPath: domPathOf(el),
      nearbyText: txt.slice(0, 160),
      nearestHeading: headingNear(el),
      outerHTMLSnippet: cleanOuterHTML(el),
      boundingInfo: {
        x: Math.round(rect.left), y: Math.round(rect.top),
        w: Math.round(rect.width), h: Math.round(rect.height),
        viewportW: window.innerWidth, viewportH: window.innerHeight,
      },
      computedStyle: computedSubset(el),
      langAtCapture: document.documentElement.lang || 'en',
      _currentText: txt.slice(0, 600),
    };
  }

  // ---- element classification (drives the filtered intent radios) -----------
  function classify(el) {
    var i18n = i18nOf(el);
    var hasText = !!i18n.key || visibleText(el).length > 0;
    var isImage =
      el.tagName === 'IMG' ||
      !!imageRefOf(el) ||
      !!(closestAttr(el, 'data-gallery') || closestAttr(el, 'data-room'));
    var name = 'this section';
    var t = el.tagName;
    if (t === 'IMG' || isImage && !hasText) name = 'this photo';
    else if (/^H[1-6]$/.test(t)) name = 'this heading';
    else if (t === 'P') name = 'this paragraph';
    else if (t === 'A') name = 'this link';
    else if (t === 'BUTTON') name = 'this button';
    else if (t === 'LI') name = 'this list item';
    else if (t === 'SPAN' || t === 'EM' || t === 'STRONG') name = 'this text';
    return { hasText: hasText, isImage: isImage, name: name };
  }

  // ---- localStorage draft ---------------------------------------------------
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        locator: locator, intent: draft.intent, detail: draft.detail,
        image: draft.image, state: state, ts: Date.now(),
      }));
    } catch (e) {}
  }
  function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }

  // ---- sessionStorage staged-list helpers (D-08 / D-09 / STAGE-05) ----------
  // The staged list holds COMMITTED edits awaiting batch submit. Distinct from
  // the in-progress single-edit draft above (which lives in localStorage).
  function loadStaged() {
    try { var raw = sessionStorage.getItem(STAGED_KEY); return raw ? JSON.parse(raw) : []; }
    catch (e) { return []; }
  }
  function saveStaged(arr) { try { sessionStorage.setItem(STAGED_KEY, JSON.stringify(arr)); } catch (e) {} }
  function clearStaged() { try { sessionStorage.removeItem(STAGED_KEY); } catch (e) {} }

  // ---- panel rendering ------------------------------------------------------
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }

  function destroyPanel() {
    if (panel) { panel.remove(); panel = null; }
  }

  function showError(msg) {
    if (!panel) return;
    var e = panel.querySelector('.err');
    if (e) { e.textContent = msg; e.classList.add('show'); }
  }
  function clearError() {
    if (!panel) return;
    var e = panel.querySelector('.err');
    if (e) e.classList.remove('show');
  }

  function buildPanelShell(titleText) {
    destroyPanel();
    panel = el('div', { id: 'mar-fb-panel' });
    var hd = el('div', { class: 'hd' });
    hd.appendChild(el('b', null, titleText));
    var x = el('button', { class: 'x', 'aria-label': 'Close' }, '&times;');
    x.addEventListener('click', reset);
    hd.appendChild(x);
    var bd = el('div', { class: 'bd' });
    var ft = el('div', { class: 'ft' });
    panel.appendChild(hd);
    panel.appendChild(bd);
    panel.appendChild(ft);
    document.body.appendChild(panel);
    return { bd: bd, ft: ft };
  }

  // ---- B: Selected — name + preview + filtered intent -----------------------
  function renderSelected() {
    state = STATE.SELECTED;
    var cls = classify(frozenEl);
    var parts = buildPanelShell('What about ' + cls.name + '?');
    var bd = parts.bd;

    if (cls.isImage) {
      var ref = locator.imageRef;
      var im = el('img', { class: 'thumb', alt: '', src: (frozenEl.tagName === 'IMG' ? frozenEl.src : (ref || '')) });
      bd.appendChild(im);
    }
    var preview = locator._currentText;
    if (preview) bd.appendChild(el('div', { class: 'prev' }, escapeHtml(preview.slice(0, 240))));

    bd.appendChild(el('div', { class: 'lbl' }, 'What would you like to do? (required)'));

    var options = [];
    if (cls.hasText) options.push(['change-wording', 'Change the wording', 'Edit the text itself']);
    if (cls.isImage) options.push(['replace-photo', 'Replace the photo', 'Upload a different image']);
    options.push(['move-resize', 'Move or resize it', 'Position or size only']);
    options.push(['remove', 'Remove it', 'Take this off the page']);
    options.push(['something-else', 'Something else', 'Describe it in your words']);

    options.forEach(function (o) {
      var lab = el('label', { class: 'opt' });
      var r = el('input', { type: 'radio', name: 'mar-fb-intent', value: o[0] });
      if (draft.intent === o[0]) r.checked = true;
      r.addEventListener('change', function () { draft.intent = o[0]; saveDraft(); nextBtn.removeAttribute('disabled'); });
      lab.appendChild(r);
      lab.appendChild(el('span', null, '<b>' + o[1] + '</b><small>' + o[2] + '</small>'));
      bd.appendChild(lab);
    });

    bd.appendChild(el('div', { class: 'err' }));

    var cancel = el('button', { class: 'ghost' }, 'Cancel');
    cancel.addEventListener('click', reset);
    var nextBtn = el('button', { class: 'act', disabled: 'disabled' }, 'Next');
    if (draft.intent) nextBtn.removeAttribute('disabled');
    nextBtn.addEventListener('click', function () {
      if (!draft.intent) { showError('Please choose what you’d like to do.'); return; }
      renderFields();
    });
    parts.ft.appendChild(cancel);
    parts.ft.appendChild(nextBtn);
  }

  // ---- C: Intent fields + validation ----------------------------------------
  function renderFields() {
    state = STATE.FIELDS;
    saveDraft();
    var intent = draft.intent;
    var parts = buildPanelShell('Tell us more');
    var bd = parts.bd;
    var d = draft.detail;

    if (intent === 'change-wording') {
      d.currentText = locator._currentText;
      bd.appendChild(el('div', { class: 'lbl' }, 'Current wording'));
      bd.appendChild(el('div', { class: 'prev' }, escapeHtml(d.currentText || '(empty)')));
      bd.appendChild(el('div', { class: 'lbl' }, 'New wording — English (required)'));
      var en = el('textarea'); en.value = d.newTextEn || '';
      en.addEventListener('input', function () { d.newTextEn = en.value; saveDraft(); });
      bd.appendChild(en);
      bd.appendChild(el('div', { class: 'lbl' }, 'New wording — French'));
      var fr = el('textarea'); fr.value = d.newTextFr || '';
      fr.addEventListener('input', function () { d.newTextFr = fr.value; saveDraft(); });
      bd.appendChild(fr);
      var ok = el('label', { class: 'chk' });
      var okc = el('input', { type: 'checkbox' });
      if (d.okToTranslate) okc.checked = true;
      okc.addEventListener('change', function () { d.okToTranslate = okc.checked; saveDraft(); });
      ok.appendChild(okc);
      ok.appendChild(el('span', null, 'I don’t speak French — it’s OK to translate this for me.'));
      bd.appendChild(ok);
    } else if (intent === 'replace-photo') {
      bd.appendChild(el('div', { class: 'lbl' }, 'Choose the new photo (required, image, max 12 MB)'));
      var realFile = document.createElement('input');
      realFile.type = 'file';
      realFile.accept = 'image/*';
      realFile.style.cssText = 'width:100%;color:#cbd5e1;';
      var thumb = el('img', { class: 'thumb', alt: '' });
      thumb.style.display = 'none';
      if (draft.image) { thumb.src = draft.image.dataURL; thumb.style.display = 'block'; }
      realFile.addEventListener('change', function () {
        clearError();
        var f = realFile.files && realFile.files[0];
        if (!f) return;
        if (f.type.indexOf('image/') !== 0) { showError('That file isn’t an image. Please choose a photo.'); realFile.value = ''; return; }
        if (f.size > MAX_IMAGE_BYTES) { showError('That photo is over 12 MB. Please choose a smaller one.'); realFile.value = ''; return; }
        var fr2 = new FileReader();
        fr2.onload = function () {
          draft.image = { dataURL: fr2.result, name: f.name, type: f.type, size: f.size };
          thumb.src = fr2.result; thumb.style.display = 'block';
          saveDraft();
        };
        fr2.readAsDataURL(f);
      });
      bd.appendChild(realFile);
      bd.appendChild(thumb);
    } else if (intent === 'move-resize') {
      bd.appendChild(el('div', { class: 'lbl' }, 'What kind of change? (required)'));
      var sel = el('select');
      sel.appendChild(el('option', { value: '' }, 'Choose…'));
      MOVE_RESIZE_OPTIONS.forEach(function (o) {
        var op = el('option', { value: o.v }, o.l);
        if (d.change === o.v) op.setAttribute('selected', 'selected');
        sel.appendChild(op);
      });
      sel.addEventListener('change', function () { d.change = sel.value; saveDraft(); });
      bd.appendChild(sel);
      bd.appendChild(el('div', { class: 'lbl' }, 'Describe exactly what you want (be specific)'));
      var mt = el('textarea'); mt.value = d.detail || '';
      mt.addEventListener('input', function () { d.detail = mt.value; saveDraft(); });
      bd.appendChild(mt);
    } else if (intent === 'remove') {
      bd.appendChild(el('div', { class: 'prev' }, 'You’re asking to remove ' + escapeHtml(classify(frozenEl).name) + ' from the page entirely.'));
      var rl = el('label', { class: 'chk' });
      var rc = el('input', { type: 'checkbox' });
      if (d.confirmed) rc.checked = true;
      rc.addEventListener('change', function () { d.confirmed = rc.checked; saveDraft(); });
      rl.appendChild(rc);
      rl.appendChild(el('span', null, 'Yes, remove this entirely. I understand it will disappear from the live site.'));
      bd.appendChild(rl);
      bd.appendChild(el('div', { class: 'lbl' }, 'Anything to add? (optional)'));
      var rt = el('textarea'); rt.value = d.detail || '';
      rt.addEventListener('input', function () { d.detail = rt.value; saveDraft(); });
      bd.appendChild(rt);
    } else {
      bd.appendChild(el('div', { class: 'lbl' }, 'Describe what you’d like changed (be specific)'));
      var st = el('textarea'); st.value = d.detail || '';
      st.addEventListener('input', function () { d.detail = st.value; saveDraft(); });
      bd.appendChild(st);
    }

    bd.appendChild(el('div', { class: 'err' }));

    var back = el('button', { class: 'ghost' }, 'Back');
    back.addEventListener('click', renderSelected);
    var next = el('button', { class: 'act' }, 'Review');
    next.addEventListener('click', function () {
      var v = validateFields(intent, d);
      if (v) { showError(v); return; }
      renderConfirm();
    });
    parts.ft.appendChild(back);
    parts.ft.appendChild(next);
  }

  // Mirrors api/feedback/submit.ts intent-specific re-validation.
  function validateFields(intent, d) {
    if (intent === 'change-wording') {
      if (!String(d.newTextEn || '').trim()) return 'Please enter the new English wording.';
      if (!d.okToTranslate && !String(d.newTextFr || '').trim()) {
        return 'This site is bilingual (EN + FR). Please add the French wording, or tick “OK to translate this for me”.';
      }
    } else if (intent === 'replace-photo') {
      if (!draft.image) return 'Please choose a replacement photo.';
      if (String(draft.image.type || '').indexOf('image/') !== 0) return 'The chosen file must be an image.';
      if (draft.image.size > MAX_IMAGE_BYTES) return 'That photo is over 12 MB. Please choose a smaller one.';
    } else if (intent === 'move-resize') {
      if (!d.change) return 'Please pick the kind of change from the list.';
      if (isVague(d.detail)) return VAGUE_MESSAGE;
    } else if (intent === 'remove') {
      if (!d.confirmed) return 'Please tick the box to confirm removal.';
    } else if (intent === 'something-else') {
      if (isVague(d.detail)) return VAGUE_MESSAGE;
    }
    return null;
  }

  // ---- D: Plain-language confirmation ---------------------------------------
  function renderConfirm() {
    state = STATE.CONFIRM;
    saveDraft();
    var parts = buildPanelShell('Here’s what we’ll do');
    var bd = parts.bd;
    var d = draft.detail;
    var ul = el('ul', { class: 'sum' });
    function li(t) { ul.appendChild(el('li', null, t)); }

    li('On <b>' + escapeHtml(locator.pageRoute) + '</b>' + (locator.nearestHeading ? ' (under “' + escapeHtml(locator.nearestHeading) + '”)' : ''));
    if (draft.intent === 'change-wording') {
      li('Change the wording to: “<b>' + escapeHtml(d.newTextEn) + '</b>”');
      li(d.okToTranslate ? 'French will be translated for you.' : 'French version: “' + escapeHtml(d.newTextFr) + '”');
    } else if (draft.intent === 'replace-photo') {
      li('Replace the photo with your uploaded image (<b>' + escapeHtml(draft.image.name) + '</b>).');
      li('It keeps the same spot and size — only the picture changes.');
    } else if (draft.intent === 'move-resize') {
      li('Layout change: <b>' + escapeHtml(d.change.replace(/-/g, ' ')) + '</b>');
      li('Your note: “' + escapeHtml(d.detail) + '”');
    } else if (draft.intent === 'remove') {
      li('<b>Remove</b> ' + escapeHtml(classify(frozenEl).name) + ' from the page.');
      if (d.detail) li('Note: “' + escapeHtml(d.detail) + '”');
    } else {
      li('Your request: “' + escapeHtml(d.detail) + '”');
    }
    li('Simple, clear changes go live automatically. Anything we’re unsure about comes back to you as a plain question.');
    bd.appendChild(ul);

    // v2 cap enforcement (STAGE-06 / STAGE-07 / D-04): if staging THIS edit
    // would breach the 10-edit or 30MB cap, show the inline message and
    // disable the Confirm button. Per D-04 the chip stays visible; the user
    // can Submit the open batch from the chip to make room.
    var extraBytes = (draft.image && typeof draft.image.size === 'number') ? draft.image.size : 0;
    var capResult = exceedsCaps(extraBytes);
    if (capResult.exceeds) {
      lastCapMessage = capResult.reason;
      bd.appendChild(el('div', { class: 'prev', style: 'color:' + ACCENT + ';border-color:' + ACCENT + ';' }, escapeHtml(capResult.reason)));
      // Re-render the open staged panel (if any) so it surfaces the same
      // cap message above the staged list.
      if (document.getElementById('mar-fb-panel-staged')) renderPanel();
    }
    bd.appendChild(el('div', { class: 'err' }));

    var back = el('button', { class: 'ghost' }, 'Back');
    back.addEventListener('click', renderFields);
    var send = el('button', { class: 'act' }, 'Confirm and stage');
    if (capResult.exceeds) send.setAttribute('disabled', 'disabled');
    send.addEventListener('click', function () {
      // Re-validate at the cap boundary (handles edits that arrived from a
      // restored draft after staging filled the batch in another tab).
      var v = validateFields(draft.intent, draft.detail);
      if (v) { renderFields(); setTimeout(function () { showError(v); }, 0); return; }
      var bytesNow = (draft.image && typeof draft.image.size === 'number') ? draft.image.size : 0;
      var capNow = exceedsCaps(bytesNow);
      if (capNow.exceeds) {
        lastCapMessage = capNow.reason;
        send.setAttribute('disabled', 'disabled');
        // Force the cap message to render even if the panel was just opened.
        if (!document.getElementById('mar-fb-panel-staged')) renderPanel();
        else renderPanel();
        return;
      }
      // Build the staged entry. The File (if any) goes into the in-memory
      // fileMap; only the descriptor {name,type,size} is persisted (D-09 /
      // STAGE-05). dataBase64 is NEVER written to sessionStorage.
      var sid = nextStageId();
      var imgDesc = null;
      if (draft.image) {
        imgDesc = { name: draft.image.name, type: draft.image.type, size: draft.image.size };
        // The existing draft.image carries a `dataURL` from FileReader.
        // Hold the full object in memory (including dataURL) so submitBatch
        // can re-emit the base64 at submit time. The dataURL bytes are kept
        // in the in-memory map ONLY — they never touch sessionStorage.
        fileMap[sid] = draft.image;
      }
      var entry = {
        stageId: sid,
        intent: draft.intent,
        pageRoute: locator.pageRoute,
        confirmationAccepted: true,
        intentDetail: {
          currentText: locator._currentText || '',
          newTextEn: draft.detail.newTextEn || '',
          newTextFr: draft.detail.newTextFr || '',
          okToTranslate: !!draft.detail.okToTranslate,
          change: draft.detail.change || null,
          detail: draft.detail.detail || '',
          confirmed: !!draft.detail.confirmed,
        },
        locator: {
          schemaVersion: SCHEMA_VERSION_V2,
          pageRoute: locator.pageRoute,
          astroFileGuess: locator.astroFileGuess,
          i18nKey: locator.i18nKey,
          i18nAttr: locator.i18nAttr,
          imageRef: locator.imageRef,
          galleryAttrRaw: locator.galleryAttrRaw,
          galleryIndex: locator.galleryIndex,
          domPath: locator.domPath,
          nearbyText: locator.nearbyText,
          nearestHeading: locator.nearestHeading,
          outerHTMLSnippet: locator.outerHTMLSnippet,
          boundingInfo: locator.boundingInfo,
          computedStyle: locator.computedStyle,
          langAtCapture: locator.langAtCapture,
        },
        imageDescriptor: imgDesc,
        stagedAt: Date.now(),
      };
      stagedPush(entry);
      // Successful stage: clear the in-progress draft + return to IDLE so
      // the user can stage another edit. staged[] persists.
      reset();
      lastCapMessage = null;
    });
    parts.ft.appendChild(back);
    parts.ft.appendChild(send);
  }

  function buildPayload() {
    var d = draft.detail;
    var img = draft.image;
    return {
      schemaVersion: SCHEMA_VERSION,
      pageRoute: locator.pageRoute,
      astroFileGuess: locator.astroFileGuess,
      intent: draft.intent,
      i18nKey: locator.i18nKey,
      i18nAttr: locator.i18nAttr,
      imageRef: locator.imageRef,
      galleryAttrRaw: locator.galleryAttrRaw,
      galleryIndex: locator.galleryIndex,
      domPath: locator.domPath,
      nearbyText: locator.nearbyText,
      nearestHeading: locator.nearestHeading,
      outerHTMLSnippet: locator.outerHTMLSnippet,
      boundingInfo: locator.boundingInfo,
      computedStyle: locator.computedStyle,
      langAtCapture: locator.langAtCapture,
      intentDetail: {
        currentText: locator._currentText || '',
        newTextEn: d.newTextEn || '',
        newTextFr: d.newTextFr || '',
        okToTranslate: !!d.okToTranslate,
        change: d.change || null,
        detail: d.detail || '',
        confirmed: !!d.confirmed,
      },
      image: img
        ? { present: true, originalFilename: img.name, mime: img.type, bytes: img.size, dataBase64: img.dataURL }
        : { present: false },
      confirmationAccepted: true,
      testMode: new URLSearchParams(location.search).get('fbtest') === '1',
    };
  }

  function submit() {
    var v = validateFields(draft.intent, draft.detail);
    if (v) { renderFields(); setTimeout(function () { showError(v); }, 0); return; }
    saveDraft();
    var parts = buildPanelShell('Sending…');
    parts.bd.appendChild(el('div', { class: 'prev' }, 'Sending your feedback — one moment.'));
    window.parent.postMessage({ type: 'mar-feedback-submit', payload: buildPayload() }, '*');
  }

  // ===========================================================================
  // v2 batch-staging UI + state helpers (STAGE-01..03, STAGE-06/07 / Plan 04-04)
  // ===========================================================================
  //
  // The chip is the persistent corner widget showing "N edits staged · Submit
  // batch · View list". It appears after the first stage and rehydrates on
  // iframe navigation via pageshow/visibilitychange (see bottom of IIFE).
  // The staged panel is a click-to-open list with per-item delete + Clear all
  // + Submit batch. Per D-12 per-item ❌ is irrevocable (no confirm); per D-11
  // Clear all uses window.confirm() because losing the whole batch is louder.
  //
  // sessionStorage holds only DESCRIPTORS (name/type/size) — Files live in
  // the in-memory fileMap (D-09 / STAGE-05). Base64 encoding happens only at
  // submit time inside submitBatch() (Task 3).

  function batchTotals() {
    var arr = loadStaged();
    var totalBytes = 0;
    for (var i = 0; i < arr.length; i++) {
      var d = arr[i] && arr[i].imageDescriptor;
      if (d && typeof d.size === 'number') totalBytes += d.size;
    }
    return { count: arr.length, totalBytes: totalBytes };
  }

  // STAGE-06 caps mirror submit.ts MAX_BATCH_EDITS / MAX_BATCH_BYTES exactly.
  // extraBytes is the size of an about-to-stage photo (0 for text-only edits)
  // so the check answers "would staging this one push us over?".
  function exceedsCaps(extraBytes) {
    var totals = batchTotals();
    if (totals.count + 1 > MAX_BATCH_EDITS) {
      return { exceeds: true, reason: 'This batch is full — submit it before staging more' };
    }
    if (totals.totalBytes + (extraBytes || 0) > MAX_BATCH_BYTES) {
      return { exceeds: true, reason: 'This batch is full — submit it before staging more' };
    }
    return { exceeds: false, reason: null };
  }

  function removeChip() {
    var c = document.getElementById('mar-fb-chip');
    if (c) c.remove();
  }

  function destroyStagedPanel() {
    var p = document.getElementById('mar-fb-panel-staged');
    if (p) p.remove();
  }

  // STAGE-02: corner chip. count===0 removes it. Otherwise the count span is
  // updated in-place when the chip already exists (avoids a flash on stage).
  function renderChip(count) {
    if (!count || count <= 0) { removeChip(); return; }
    var chip = document.getElementById('mar-fb-chip');
    if (chip) {
      var cspan = chip.querySelector('.mar-fb-chip__count');
      if (cspan) cspan.textContent = String(count);
      return;
    }
    chip = el('div', { id: 'mar-fb-chip' });
    chip.appendChild(el('span', { class: 'mar-fb-chip__count' }, String(count)));
    chip.appendChild(document.createTextNode(' '));
    chip.appendChild(el('span', { class: 'mar-fb-chip__sep' }, 'edits staged · '));
    var sub = el('button', { class: 'mar-fb-chip__submit', type: 'button' }, 'Submit batch');
    sub.addEventListener('click', function () { submitBatch(); });
    chip.appendChild(sub);
    chip.appendChild(el('span', { class: 'mar-fb-chip__sep' }, ' · '));
    var view = el('button', { class: 'mar-fb-chip__view', type: 'button' }, 'View list');
    view.addEventListener('click', togglePanel);
    chip.appendChild(view);
    document.body.appendChild(chip);
  }

  function togglePanel() {
    if (document.getElementById('mar-fb-panel-staged')) destroyStagedPanel();
    else renderPanel();
  }

  // STAGE-03: panel listing each staged edit with per-item delete + actions.
  // `opts` is optional and may carry:
  //   - errors:  Array<{index, error}> from API-03 (highlight failing items)
  //   - capMessage: string from D-04 / cap-violation flow (prepend banner)
  function renderPanel(opts) {
    opts = opts || {};
    destroyStagedPanel();
    var arr = loadStaged();
    var p = el('div', { id: 'mar-fb-panel-staged' });
    p.appendChild(el('h4', null, 'Staged edits (' + arr.length + ')'));

    if (opts.capMessage) {
      p.appendChild(el('div', { class: 'mar-fb-staged-cap-msg' }, escapeHtml(opts.capMessage)));
    } else if (lastCapMessage) {
      p.appendChild(el('div', { class: 'mar-fb-staged-cap-msg' }, escapeHtml(lastCapMessage)));
    }

    var errByIndex = {};
    if (Array.isArray(opts.errors)) {
      for (var ei = 0; ei < opts.errors.length; ei++) {
        var er = opts.errors[ei];
        if (er && typeof er.index === 'number') errByIndex[er.index] = er.error || 'Validation failed';
      }
    }

    if (arr.length === 0) {
      p.appendChild(el('div', { class: 'mar-fb-staged-empty' }, 'No edits staged yet. Click anything on the page to start.'));
    } else {
      for (var i = 0; i < arr.length; i++) {
        var entry = arr[i];
        var classes = 'mar-fb-staged-item';
        if (errByIndex.hasOwnProperty(i)) classes += ' is-error';
        var item = el('div', { class: classes });
        var body = el('div', { class: 'mar-fb-staged-item__body' });
        body.appendChild(el('div', { class: 'mar-fb-staged-item__meta' }, escapeHtml(entry.pageRoute) + ' · ' + escapeHtml(String(entry.intent || '').replace(/-/g, ' '))));
        // One-line plain-language summary per intent.
        var summary = '';
        var d = entry.intentDetail || {};
        if (entry.intent === 'change-wording') {
          var nt = String(d.newTextEn || '');
          summary = 'Change to: “' + escapeHtml(nt.slice(0, 80)) + (nt.length > 80 ? '…' : '') + '”';
        } else if (entry.intent === 'replace-photo') {
          var fname = (entry.imageDescriptor && entry.imageDescriptor.name) || 'new photo';
          var lost = !!(entry.imageDescriptor && !fileMap[entry.stageId]);
          summary = 'Replace photo with ' + escapeHtml(fname) + (lost ? ' (re-attach — file lost after navigation)' : '');
        } else if (entry.intent === 'move-resize') {
          summary = 'Layout: ' + escapeHtml(String(d.change || '').replace(/-/g, ' ')) + ' — ' + escapeHtml(String(d.detail || '').slice(0, 80));
        } else if (entry.intent === 'remove') {
          summary = 'Remove this element' + (d.detail ? ' — ' + escapeHtml(String(d.detail).slice(0, 60)) : '');
        } else {
          summary = escapeHtml(String(d.detail || '').slice(0, 100));
        }
        body.appendChild(el('div', null, summary));
        if (errByIndex.hasOwnProperty(i)) {
          body.appendChild(el('div', { class: 'mar-fb-staged-item__error' }, escapeHtml(errByIndex[i])));
        }
        item.appendChild(body);
        // Per-item ❌ delete: irrevocable (D-12). closure over stageId.
        (function (sid) {
          var del = el('button', { class: 'mar-fb-staged-item__delete', type: 'button', 'aria-label': 'Delete this staged edit' }, '✕');
          del.addEventListener('click', function () { stagedDelete(sid); });
          item.appendChild(del);
        })(entry.stageId);
        p.appendChild(item);
      }
    }

    var actions = el('div', { class: 'mar-fb-staged-actions' });
    var clearBtn = el('button', { class: 'mar-fb-staged-clear', type: 'button' }, 'Clear all');
    clearBtn.addEventListener('click', stagedClearAll);
    actions.appendChild(clearBtn);
    var subBtn = el('button', { class: 'mar-fb-staged-submit', type: 'button' }, 'Submit batch');
    if (arr.length === 0 || state === STATE.SUBMITTING) subBtn.setAttribute('disabled', 'disabled');
    subBtn.addEventListener('click', function () { submitBatch(); });
    actions.appendChild(subBtn);
    p.appendChild(actions);
    document.body.appendChild(p);
  }

  function stagedPush(entry) {
    var arr = loadStaged();
    arr.push(entry);
    saveStaged(arr);
    renderChip(arr.length);
    if (document.getElementById('mar-fb-panel-staged')) renderPanel();
  }

  // D-12: per-item delete is IRREVOCABLE — no confirm dialog. Removes the
  // entry from sessionStorage AND the in-memory fileMap, then refreshes UI.
  function stagedDelete(stageId) {
    var arr = loadStaged();
    var next = [];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] && arr[i].stageId === stageId) {
        // Drop the in-memory File reference for this stage.
        try { delete fileMap[arr[i].stageId]; } catch (e) {}
      } else {
        next.push(arr[i]);
      }
    }
    saveStaged(next);
    // Cap state may have changed (deletes drop totals); clear stale message.
    lastCapMessage = null;
    if (next.length === 0) {
      removeChip();
      destroyStagedPanel();
    } else {
      renderChip(next.length);
      if (document.getElementById('mar-fb-panel-staged')) renderPanel();
    }
  }

  // D-11: Clear all is loud (loses the whole batch) so it uses window.confirm.
  // The confirm string is admin-facing and skips i18n (CONTEXT.md Claude's
  // Discretion).
  function stagedClearAll() {
    if (!window.confirm('Clear all staged edits? This cannot be undone.')) return;
    clearStaged();
    fileMap = {};
    lastCapMessage = null;
    removeChip();
    destroyStagedPanel();
  }

  // Stub — Task 3 of Plan 04-04 implements the v2 batch postMessage path.
  // Forward-declared here so renderChip's Submit button and renderPanel's
  // Submit batch button can reference it at load time without throwing.
  function submitBatch() { /* placeholder — Task 3 implements */ }


  // ---- E: result from parent ------------------------------------------------
  // Parent (feedback.astro) posts `mar-feedback-result` after the
  // /api/feedback/submit round-trip. v2 extends the v1 contract with
  // `m.errors[]` (per-edit validation failures, API-03 / D-05) so the panel
  // can highlight which staged items need fixing without losing the batch.
  // The `m.cap` cap-violation branch lands in Task 3.
  window.addEventListener('message', function (ev) {
    if (ev.origin !== location.origin) return;
    var m = ev.data;
    if (!m || m.type !== 'mar-feedback-result') return;
    if (m.ok) {
      // STAGE-04 success path: clear v1 draft AND v2 staged state (chip,
      // panel, sessionStorage, fileMap) — a successful batch removes all
      // pending work.
      clearDraft();
      clearStaged();
      fileMap = {};
      removeChip();
      destroyStagedPanel();
      state = STATE.DONE;
      var parts = buildPanelShell('Thank you');
      parts.bd.appendChild(el('div', { class: 'ok' }, 'Your feedback was sent. You can leave another, or close this tab.'));
      var done = el('button', { class: 'act' }, 'Leave another');
      done.addEventListener('click', reset);
      parts.ft.appendChild(done);
    } else if (m.auth) {
      // Draft already in localStorage — nothing lost. Staged edits also
      // survive in sessionStorage; the chip stays for resubmit after login.
      state = STATE.AUTH;
      var p2 = buildPanelShell('Please sign in again');
      p2.bd.appendChild(el('div', { class: 'prev' }, 'Your session expired, but your note is saved. Sign in again and your draft will still be here.'));
    } else if (Array.isArray(m.errors)) {
      // API-03 / D-05: per-edit-errors response. The panel re-renders with
      // .is-error highlights on the failing indexes; sessionStorage is
      // UNCHANGED so the user can edit/delete and retry.
      renderPanel({ errors: m.errors });
    } else {
      var p3 = panel && panel.querySelector('.err');
      if (p3) { p3.textContent = m.error || 'Something went wrong. Your note is saved — please try again.'; p3.classList.add('show'); }
      else { state = STATE.CONFIRM; renderConfirm(); setTimeout(function () { showError('Something went wrong. Your note is saved — please try again.'); }, 0); }
    }
  });

  // ---- selection + hover lifecycle ------------------------------------------
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function inUi(node) {
    return !!(node && node.closest && node.closest('#mar-fb-panel,#mar-fb-banner'));
  }

  function clearHover() {
    if (hovered) { hovered.removeAttribute('data-fb-hover'); hovered = null; }
  }

  document.addEventListener('mouseover', function (e) {
    if (state !== STATE.IDLE) return;
    if (inUi(e.target)) { clearHover(); return; }
    var t = e.target;
    if (!t || t.nodeType !== 1 || t === document.body || t === document.documentElement) return;
    if (t === hovered) return;
    clearHover();
    hovered = t;
    t.setAttribute('data-fb-hover', '');
  }, true);

  document.addEventListener('mouseout', function () {
    if (state !== STATE.IDLE) return;
    clearHover();
  }, true);

  document.addEventListener('click', function (e) {
    if (inUi(e.target)) return; // let the panel work normally
    // Always stop the live site from navigating/acting in feedback mode.
    e.preventDefault();
    e.stopPropagation();
    if (state !== STATE.IDLE) return;
    var t = e.target;
    if (!t || t.nodeType !== 1) return;
    clearHover();
    frozenEl = t;
    t.setAttribute('data-fb-frozen', '');
    locator = captureLocator(t);
    draft = { intent: null, detail: {}, image: null };
    renderSelected();
  }, true);

  function reset() {
    destroyPanel();
    if (frozenEl) { frozenEl.removeAttribute('data-fb-frozen'); frozenEl = null; }
    clearHover();
    locator = null;
    draft = { intent: null, detail: {}, image: null };
    state = STATE.IDLE;
    clearDraft();
  }

  // ---- restore an in-progress draft (survives 401 / reload) -----------------
  (function restore() {
    var raw;
    try { raw = localStorage.getItem(DRAFT_KEY); } catch (e) { return; }
    if (!raw) return;
    var saved;
    try { saved = JSON.parse(raw); } catch (e) { return; }
    if (!saved || !saved.locator || saved.locator.pageRoute !== location.pathname) return;
    banner.textContent = 'You have an unfinished note on this page.';
    var resume = el('div', { id: 'mar-fb-panel' });
    resume.innerHTML =
      '<div class="hd"><b>Resume your note?</b></div><div class="bd"><div class="prev">' +
      escapeHtml((saved.locator._currentText || saved.locator.nearbyText || 'your selection').slice(0, 140)) +
      '</div></div>';
    var ft = el('div', { class: 'ft' });
    var no = el('button', { class: 'ghost' }, 'Discard');
    no.addEventListener('click', function () { resume.remove(); clearDraft(); banner.textContent = 'Feedback mode — hover anything you’d like changed, then click it.'; });
    var yes = el('button', { class: 'act' }, 'Resume');
    yes.addEventListener('click', function () {
      resume.remove();
      locator = saved.locator;
      draft = { intent: saved.intent, detail: saved.detail || {}, image: saved.image || null };
      // Re-anchor the frozen outline if the element is still on the page.
      try {
        var cand = saved.locator.domPath && document.querySelector(saved.locator.domPath.split(' > ').pop());
        if (cand) { frozenEl = cand; cand.setAttribute('data-fb-frozen', ''); }
      } catch (e) {}
      if (!frozenEl) frozenEl = document.body;
      renderSelected();
    });
    ft.appendChild(no);
    ft.appendChild(yes);
    resume.appendChild(ft);
    document.body.appendChild(resume);
  })();

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state !== STATE.IDLE) { e.preventDefault(); reset(); }
  });

  // ---- v2 staged-batch rehydrate on load + iframe navigation (D-06) --------
  // sessionStorage survives iframe navigation in the same browsing context,
  // so the chip can re-appear on the next page automatically. Placed at the
  // END of the IIFE so renderChip (declared above) is already in scope.
  (function rehydrateStaged() {
    var staged = loadStaged();
    if (staged.length > 0) renderChip(staged.length);
  })();

  window.addEventListener('pageshow', function () {
    var staged = loadStaged();
    if (staged.length > 0 && !document.getElementById('mar-fb-chip')) {
      renderChip(staged.length);
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      var staged = loadStaged();
      if (staged.length > 0 && !document.getElementById('mar-fb-chip')) {
        renderChip(staged.length);
      }
    }
  });

  window.parent.postMessage({ type: 'mar-feedback-ready', lang: document.documentElement.lang || 'en' }, '*');
})();
