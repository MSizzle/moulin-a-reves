// ---------------------------------------------------------------------------
// Shared per-edit validator — consumed by BOTH the v1 single-edit path AND
// the v2 batch path in ./submit.ts. The two paths cannot drift because the
// rules live here (D-15 / API-04).
//
// MIRROR of public/feedback-inject.js::validateFields(). When you change a
// rule here, change it there too. KEEP IN SYNC with the client.
//
// This is NOT an API route. It exports pure helpers consumed by submit.ts;
// it has no APIRoute export and therefore no prerender-opt-out directive
// (that directive only belongs on files under src/pages/api/ that actually
// serve a request).
// ---------------------------------------------------------------------------

export const INTENTS = ['change-wording', 'replace-photo', 'move-resize', 'remove', 'something-else'] as const;
export type Intent = (typeof INTENTS)[number];

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12 MB
export const MIN_VAGUE_LEN = 25; // free-text change-descriptions must clear this
export const MOVE_RESIZE_OPTIONS = [
  'move-up', 'move-down', 'move-left', 'move-right',
  'make-bigger', 'make-smaller', 'more-space-around', 'less-space-around',
] as const;

// Phrases that signal a non-actionable request. Mirrored in feedback-inject.js.
export const VAGUE_STOPLIST = [
  'fix this', 'fix it', 'better', 'make it better', 'make it pop', 'make it nice',
  'make it nicer', 'nicer', 'cleaner', 'improve', 'improve this', 'looks off',
  'looks weird', 'looks bad', 'more modern', 'modernize', 'update this',
  'change this', 'do something', 'something else', 'idk', 'dunno',
];

export const VAGUE_MESSAGE =
  'Can you be more specific? What exactly should change, and what should it look like afterward?';

export function isVague(raw: unknown): boolean {
  const t = String(raw ?? '').trim();
  if (t.length < MIN_VAGUE_LEN) return true;
  const norm = t.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
  // Block when the text is essentially nothing more than a stoplist phrase.
  for (const phrase of VAGUE_STOPLIST) {
    if (norm === phrase) return true;
    if (norm.includes(phrase) && norm.length < phrase.length + 25) return true;
  }
  return false;
}

export function clamp(s: unknown, max: number): string {
  return String(s ?? '').slice(0, max);
}

// Count independent locator signals that agree. domPath NEVER counts. Mirrors
// the ladder in .github/CLAUDE_FEEDBACK.md.
export function signalCount(p: any): number {
  let n = 0;
  if (p.i18nKey && p.i18nAttr) n += 1;
  if (p.imageRef) n += 1;
  if (p.galleryAttrRaw && Number.isInteger(p.galleryIndex) && p.galleryIndex >= 0) n += 1;
  if (String(p.nearbyText || '').trim().length >= MIN_VAGUE_LEN && p.nearestHeading) n += 1;
  return n;
}

// Returns null on pass, error-message string on fail. Pure — NEVER constructs
// Response objects (caller wraps in fail() for v1 or accumulates into a batch
// errors[] for v2). The intent-specific rules below are extracted verbatim
// from the pre-extraction submit.ts:148-182 block.
export function validateEdit(p: any): string | null {
  const intent: Intent = p?.intent;
  if (!INTENTS.includes(intent)) return 'Unknown intent';
  if (!p.pageRoute || typeof p.pageRoute !== 'string') return 'Missing page route';
  if (p.confirmationAccepted !== true) return 'Confirmation was not accepted';

  const detail = p.intentDetail || {};
  const img = p.image || { present: false };

  // --- intent-specific re-validation (mirrors State-C in the inject) --------
  if (intent === 'change-wording') {
    const en = String(detail.newTextEn ?? '').trim();
    if (!en) return 'New wording (English) is required';
    if (detail.okToTranslate !== true) {
      const fr = String(detail.newTextFr ?? '').trim();
      if (!fr) {
        return 'This site is bilingual. Provide the French wording too, or tick "OK to translate" so it can be translated for you.';
      }
    }
  } else if (intent === 'replace-photo') {
    if (!img.present) return 'A replacement photo is required';
    if (!String(img.mime || '').startsWith('image/')) return 'Replacement file must be an image';
    if (!img.dataBase64) return 'Replacement photo data missing';
    if (typeof img.bytes !== 'number' || img.bytes <= 0) return 'Replacement photo is empty';
    if (img.bytes > MAX_IMAGE_BYTES) return 'Replacement photo must be 12 MB or smaller';
  } else if (intent === 'move-resize') {
    if (!MOVE_RESIZE_OPTIONS.includes(detail.change)) return 'Pick a layout change from the list';
    if (isVague(detail.detail)) return VAGUE_MESSAGE;
  } else if (intent === 'remove') {
    if (detail.confirmed !== true) return 'Tick the confirmation box to remove this element';
  } else if (intent === 'something-else') {
    if (isVague(detail.detail)) return VAGUE_MESSAGE;
  }

  return null;
}
