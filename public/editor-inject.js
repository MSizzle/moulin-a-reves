/*
 * Editor inject script — click-to-edit overlay for the Maison editor.
 *
 * Runs only when the page is loaded inside the editor iframe with `?edit=1`.
 * Makes every element with [data-i18n] hover-highlightable, click-to-edit,
 * and posts changes back to the parent (the editor SPA) via postMessage.
 *
 * Save / publish are handled by the parent — this script only emits edits.
 */
(function () {
  if (window.parent === window) return;
  if (new URLSearchParams(location.search).get('edit') !== '1') return;

  const ACCENT = '#FF6B2B';

  const SELECTOR = '[data-i18n], [data-i18n-html]';

  const style = document.createElement('style');
  style.textContent = `
    [data-i18n], [data-i18n-html] { transition: outline-color 0.15s ease; }
    [data-ed-hover]:not([data-ed-active]) {
      outline: 2px dashed rgba(255,107,43,0.55) !important;
      outline-offset: 3px !important;
      cursor: text !important;
    }
    [data-ed-active] {
      outline: 2px solid ${ACCENT} !important;
      outline-offset: 3px !important;
      background: rgba(255,107,43,0.06) !important;
      border-radius: 2px;
    }
    [data-ed-active][contenteditable]:focus {
      outline: 2px solid ${ACCENT} !important;
    }
  `;
  document.head.appendChild(style);

  let active = null;
  let translations = {};

  fetch('/api/translations', { cache: 'no-store' })
    .then((r) => r.json())
    .then((data) => {
      translations = data || {};
    })
    .catch(() => {});

  function currentLang() {
    return document.documentElement.lang || 'en';
  }

  // Returns { key, isHtml } for an i18n target, or null.
  function keyOf(el) {
    if (!el) return null;
    const html = el.getAttribute('data-i18n-html');
    if (html) return { key: html, isHtml: true };
    const plain = el.getAttribute('data-i18n');
    if (plain) return { key: plain, isHtml: false };
    return null;
  }

  function clearHover() {
    document
      .querySelectorAll('[data-ed-hover]')
      .forEach((el) => el.removeAttribute('data-ed-hover'));
  }

  function deactivate() {
    if (!active) return;
    active.removeAttribute('data-ed-active');
    active.removeAttribute('contenteditable');
    active = null;
  }

  document.addEventListener(
    'mouseover',
    (e) => {
      const target = e.target.closest && e.target.closest(SELECTOR);
      if (!target) {
        clearHover();
        return;
      }
      if (target.hasAttribute('data-ed-hover')) return;
      clearHover();
      target.setAttribute('data-ed-hover', '');
    },
    true
  );

  document.addEventListener(
    'mouseout',
    (e) => {
      const target = e.target.closest && e.target.closest(SELECTOR);
      if (target) target.removeAttribute('data-ed-hover');
    },
    true
  );

  document.addEventListener(
    'click',
    (e) => {
      const target = e.target.closest && e.target.closest(SELECTOR);
      if (!target) {
        deactivate();
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      if (active === target) return;

      deactivate();

      const meta = keyOf(target);
      active = target;
      target.setAttribute('data-ed-active', '');
      // For HTML-bearing fields, allow rich content editing so child markup
      // (e.g. <span class="serif-italic">) survives the edit. For plain
      // text fields, lock down to plaintext-only.
      target.setAttribute('contenteditable', meta && meta.isHtml ? 'true' : 'plaintext-only');
      target.focus();

      // Place caret at end of text
      try {
        const range = document.createRange();
        range.selectNodeContents(target);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (_) {}
    },
    true
  );

  document.addEventListener(
    'input',
    (e) => {
      if (!active || e.target !== active) return;
      const meta = keyOf(active);
      if (!meta) return;
      window.parent.postMessage(
        {
          type: 'mar-i18n-edit',
          key: meta.key,
          lang: currentLang(),
          value: meta.isHtml ? (active.innerHTML || '') : (active.textContent || ''),
        },
        '*'
      );
    },
    true
  );

  document.addEventListener('keydown', (e) => {
    if (!active) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      active.blur();
      deactivate();
    }
    // Enter on single-line elements ends the edit; Shift+Enter inserts a newline.
    if (e.key === 'Enter' && !e.shiftKey) {
      const tag = active.tagName;
      if (tag === 'A' || tag === 'BUTTON' || tag === 'LI' || /^H[1-6]$/.test(tag)) {
        e.preventDefault();
        active.blur();
        deactivate();
      }
    }
  });

  // Tell the parent we're ready (lets the editor confirm the iframe is wired up)
  window.parent.postMessage(
    { type: 'mar-editor-ready', lang: currentLang() },
    '*'
  );
})();
