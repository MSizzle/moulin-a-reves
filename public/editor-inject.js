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

  const style = document.createElement('style');
  style.textContent = `
    [data-i18n] { transition: outline-color 0.15s ease; }
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

  fetch('/i18n/translations.json')
    .then((r) => r.json())
    .then((data) => {
      translations = data || {};
    })
    .catch(() => {});

  function currentLang() {
    return document.documentElement.lang || 'en';
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
      const target = e.target.closest && e.target.closest('[data-i18n]');
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
      const target = e.target.closest && e.target.closest('[data-i18n]');
      if (target) target.removeAttribute('data-ed-hover');
    },
    true
  );

  document.addEventListener(
    'click',
    (e) => {
      const target = e.target.closest && e.target.closest('[data-i18n]');
      if (!target) {
        deactivate();
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      if (active === target) return;

      deactivate();

      const key = target.getAttribute('data-i18n');
      const lang = currentLang();

      // If this element's static markup differs from the canonical translation
      // (e.g. inline <br> tags), normalize to the canonical value first so the
      // edit produces the canonical string the editor stores.
      if (key && translations[key] && translations[key][lang] != null) {
        const canonical = translations[key][lang];
        if (target.textContent.trim() !== canonical.trim()) {
          target.textContent = canonical;
        }
      }

      active = target;
      target.setAttribute('data-ed-active', '');
      target.setAttribute('contenteditable', 'plaintext-only');
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
      const key = active.getAttribute('data-i18n');
      if (!key) return;
      window.parent.postMessage(
        {
          type: 'mar-i18n-edit',
          key,
          lang: currentLang(),
          value: active.textContent || '',
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
