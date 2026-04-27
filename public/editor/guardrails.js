/*
 * Editor guardrails — companion script to the React SPA in this folder.
 *
 * Lives outside the React bundle so it survives bundle rebuilds. Adds:
 *  1. Confirmation prompt before the toolbar's Revert button discards work
 *  2. beforeunload warning while the SPA shows its "unsaved" indicator
 *  3. Autosave of click-to-edit messages to localStorage with a restore
 *     banner on next load if the previous session left work unsaved
 */
(function () {
  if (window.parent !== window) return; // never run inside the preview iframe

  const STORAGE_KEY = 'maison_editor_unsaved_v1';
  const MAX_AGE_MS = 24 * 60 * 60 * 1000;

  // ---------- 1) Confirm before Revert ----------
  document.addEventListener(
    'click',
    (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      const btn = t.closest('button');
      if (!btn) return;
      const label = (btn.textContent || '').trim().toLowerCase();
      if (label !== 'revert') return;
      const ok = window.confirm(
        'Discard all unsaved changes and reload from the last saved version? This cannot be undone.'
      );
      if (!ok) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
      }
    },
    true
  );

  // ---------- 2) beforeunload when dirty ----------
  let dirty = false;
  function refreshDirty() {
    // The SPA renders a small "unsaved" pill in the toolbar when state has
    // diverged from the last save. We treat its presence as the source of
    // truth so the indicator and the warning never disagree.
    const indicators = document.querySelectorAll('span, div');
    let found = false;
    for (const el of indicators) {
      if ((el.textContent || '').trim() === 'unsaved') {
        found = true;
        break;
      }
    }
    dirty = found;
  }
  const dirtyObserver = new MutationObserver(refreshDirty);
  dirtyObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
  setInterval(refreshDirty, 2000); // safety net in case the observer misses
  window.addEventListener('beforeunload', (e) => {
    if (!dirty) return;
    e.preventDefault();
    e.returnValue = ''; // required for Chrome to actually show the prompt
    return '';
  });

  // ---------- 3) Autosave click-to-edit messages to localStorage ----------
  // The preview iframe posts {type: 'mar-i18n-edit', key, lang, value} for
  // every keystroke in click-to-edit. We mirror those into localStorage so
  // a tab close / crash doesn't lose visible work in progress.
  function readBackup() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.savedAt || !parsed.edits) return null;
      if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
  function writeBackup(edits) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ savedAt: Date.now(), edits })
      );
    } catch {}
  }
  function clearBackup() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  const liveEdits = (function () {
    const existing = readBackup();
    return existing ? existing.edits : {};
  })();

  window.addEventListener('message', (ev) => {
    const data = ev && ev.data;
    if (!data || typeof data !== 'object') return;
    if (data.type !== 'mar-i18n-edit') return;
    if (!data.key || !data.lang) return;
    if (!liveEdits[data.key]) liveEdits[data.key] = {};
    liveEdits[data.key][data.lang] = data.value || '';
    writeBackup(liveEdits);
  });

  // Patch fetch so successful saves clear the backup automatically.
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const isSave = init && init.method === 'POST' &&
      (url.endsWith('/api/site/save') || url.endsWith('/api/site/publish'));
    const res = await originalFetch(input, init);
    if (isSave && res.ok) {
      try {
        const cloned = res.clone();
        const json = await cloned.json();
        if (json && json.ok) {
          for (const k of Object.keys(liveEdits)) delete liveEdits[k];
          clearBackup();
        }
      } catch {}
    }
    return res;
  };

  // Restore banner on load
  function showRestoreBanner(backup) {
    const editCount = Object.values(backup.edits).reduce(
      (n, v) => n + Object.keys(v || {}).length,
      0
    );
    if (editCount === 0) {
      clearBackup();
      return;
    }
    const banner = document.createElement('div');
    banner.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:99999;' +
      'background:#fef3c7;color:#78350f;border-bottom:1px solid #f59e0b;' +
      'padding:10px 16px;font:13px -apple-system,BlinkMacSystemFont,sans-serif;' +
      'display:flex;align-items:center;gap:12px;';
    const msg = document.createElement('span');
    const minutesAgo = Math.max(1, Math.round((Date.now() - backup.savedAt) / 60000));
    msg.textContent =
      `Your last session left ${editCount} unsaved edit${editCount === 1 ? '' : 's'} ` +
      `from ~${minutesAgo} min ago.`;
    const view = document.createElement('button');
    view.textContent = 'View';
    view.style.cssText =
      'background:#92400e;color:#fff;border:0;border-radius:4px;' +
      'padding:4px 10px;cursor:pointer;font-size:12px;';
    view.onclick = () => {
      const lines = [];
      for (const [key, langs] of Object.entries(backup.edits)) {
        for (const [lang, value] of Object.entries(langs || {})) {
          lines.push(`${key} (${lang}): ${value}`);
        }
      }
      window.alert(lines.join('\n\n'));
    };
    const dismiss = document.createElement('button');
    dismiss.textContent = 'Dismiss';
    dismiss.style.cssText =
      'background:transparent;color:#78350f;border:1px solid #b45309;' +
      'border-radius:4px;padding:4px 10px;cursor:pointer;font-size:12px;margin-left:auto;';
    dismiss.onclick = () => {
      banner.remove();
      clearBackup();
    };
    banner.appendChild(msg);
    banner.appendChild(view);
    banner.appendChild(dismiss);
    document.body.appendChild(banner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const backup = readBackup();
      if (backup) showRestoreBanner(backup);
    });
  } else {
    const backup = readBackup();
    if (backup) showRestoreBanner(backup);
  }
})();
