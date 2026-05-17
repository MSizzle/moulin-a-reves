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

  // ---- shared contract (KEEP IN SYNC with src/pages/api/feedback/submit.ts) --
  var SCHEMA_VERSION = 1;
  var MAX_IMAGE_BYTES = 12 * 1024 * 1024;
  var MIN_VAGUE_LEN = 25;
  var DRAFT_KEY = 'mar_feedback_draft_v1';
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
    '#mar-fb-panel .ok{background:#052e16;border:1px solid #15803d;color:#bbf7d0;padding:.7rem;border-radius:8px;}';
  document.documentElement.appendChild(style);

  // ---- state ----------------------------------------------------------------
  var STATE = { IDLE: 'idle', SELECTED: 'selected', FIELDS: 'fields', CONFIRM: 'confirm', DONE: 'done', AUTH: 'auth' };
  var state = STATE.IDLE;
  var frozenEl = null;
  var locator = null; // captured at freeze time
  var draft = { intent: null, detail: {}, image: null }; // image: {dataURL,name,type,size}
  var hovered = null;

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
      var file = el('input', { type: 'text' }); // placeholder; replaced below
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
    bd.appendChild(el('div', { class: 'err' }));

    var back = el('button', { class: 'ghost' }, 'Back');
    back.addEventListener('click', renderFields);
    var send = el('button', { class: 'act' }, 'Looks right — send it');
    send.addEventListener('click', submit);
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

  // ---- E: result from parent ------------------------------------------------
  window.addEventListener('message', function (ev) {
    if (ev.origin !== location.origin) return;
    var m = ev.data;
    if (!m || m.type !== 'mar-feedback-result') return;
    if (m.ok) {
      clearDraft();
      state = STATE.DONE;
      var parts = buildPanelShell('Thank you');
      parts.bd.appendChild(el('div', { class: 'ok' }, 'Your feedback was sent. You can leave another, or close this tab.'));
      var done = el('button', { class: 'act' }, 'Leave another');
      done.addEventListener('click', reset);
      parts.ft.appendChild(done);
    } else if (m.auth) {
      // Draft already in localStorage — nothing lost.
      state = STATE.AUTH;
      var p2 = buildPanelShell('Please sign in again');
      p2.bd.appendChild(el('div', { class: 'prev' }, 'Your session expired, but your note is saved. Sign in again and your draft will still be here.'));
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

  window.parent.postMessage({ type: 'mar-feedback-ready', lang: document.documentElement.lang || 'en' }, '*');
})();
