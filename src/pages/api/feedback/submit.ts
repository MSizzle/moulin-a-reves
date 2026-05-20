export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth } from '../../../lib/auth';

// GitHub Contents/Issues API plumbing — same pattern as src/pages/api/site/save.ts.
const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
const GITHUB_REPO = import.meta.env.GITHUB_REPO;

// ---------------------------------------------------------------------------
// Shared contract — KEEP IN SYNC with public/feedback-inject.js (the client
// validates first, this re-validates server-side; the client cannot be
// trusted). If you change a rule here, change it there too.
// ---------------------------------------------------------------------------
const SCHEMA_VERSION = 1;
const INTENTS = ['change-wording', 'replace-photo', 'move-resize', 'remove', 'something-else'] as const;
type Intent = (typeof INTENTS)[number];

const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12 MB
const MIN_VAGUE_LEN = 25; // free-text change-descriptions must clear this
const MOVE_RESIZE_OPTIONS = [
  'move-up', 'move-down', 'move-left', 'move-right',
  'make-bigger', 'make-smaller', 'more-space-around', 'less-space-around',
] as const;

// Phrases that signal a non-actionable request. Mirrored in feedback-inject.js.
const VAGUE_STOPLIST = [
  'fix this', 'fix it', 'better', 'make it better', 'make it pop', 'make it nice',
  'make it nicer', 'nicer', 'cleaner', 'improve', 'improve this', 'looks off',
  'looks weird', 'looks bad', 'more modern', 'modernize', 'update this',
  'change this', 'do something', 'something else', 'idk', 'dunno',
];

const VAGUE_MESSAGE =
  'Can you be more specific? What exactly should change, and what should it look like afterward?';

function isVague(raw: unknown): boolean {
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

// ---------------------------------------------------------------------------
// GitHub helpers
// ---------------------------------------------------------------------------
const ghHeaders = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
};

async function getFileSha(path: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sha;
  } catch {
    return null;
  }
}

// Commit pre-encoded base64 bytes verbatim (binary-safe — do NOT utf-8 round
// trip like save.ts does for text). Used for the raw client photo upload.
async function commitBase64File(path: string, base64: string, message: string): Promise<boolean> {
  const sha = await getFileSha(path);
  const body: any = { message, content: base64 };
  if (sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: ghHeaders,
    body: JSON.stringify(body),
  });
  return res.ok;
}

async function createIssue(title: string, bodyText: string, labels: string[]) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
    method: 'POST',
    headers: ghHeaders,
    body: JSON.stringify({ title, body: bodyText, labels }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`GitHub issue create failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  return res.json();
}

async function patchIssueBody(issueNumber: number, bodyText: string): Promise<boolean> {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}`, {
    method: 'PATCH',
    headers: ghHeaders,
    body: JSON.stringify({ body: bodyText }),
  });
  return res.ok;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function fail(message: string, status = 422) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function clamp(s: unknown, max: number): string {
  return String(s ?? '').slice(0, max);
}

// Count independent locator signals that agree. domPath NEVER counts. Mirrors
// the ladder in .github/CLAUDE_FEEDBACK.md.
function signalCount(p: any): number {
  let n = 0;
  if (p.i18nKey && p.i18nAttr) n += 1;
  if (p.imageRef) n += 1;
  if (p.galleryAttrRaw && Number.isInteger(p.galleryIndex) && p.galleryIndex >= 0) n += 1;
  if (String(p.nearbyText || '').trim().length >= MIN_VAGUE_LEN && p.nearestHeading) n += 1;
  return n;
}

export const POST: APIRoute = async ({ request }) => {
  if (!(await checkAuth(request))) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let p: any;
  try {
    p = await request.json();
  } catch {
    return fail('Invalid request body', 400);
  }

  // --- structural validation -------------------------------------------------
  if (p?.schemaVersion !== SCHEMA_VERSION) return fail('Unsupported schema version');
  const intent: Intent = p.intent;
  if (!INTENTS.includes(intent)) return fail('Unknown intent');
  if (!p.pageRoute || typeof p.pageRoute !== 'string') return fail('Missing page route');
  if (p.confirmationAccepted !== true) return fail('Confirmation was not accepted');

  const detail = p.intentDetail || {};
  const img = p.image || { present: false };

  // --- intent-specific re-validation (mirrors State-C in the inject) --------
  if (intent === 'change-wording') {
    const en = String(detail.newTextEn ?? '').trim();
    if (!en) return fail('New wording (English) is required');
    if (detail.okToTranslate !== true) {
      const fr = String(detail.newTextFr ?? '').trim();
      if (!fr) {
        return fail(
          'This site is bilingual. Provide the French wording too, or tick "OK to translate" so it can be translated for you.'
        );
      }
    }
  } else if (intent === 'replace-photo') {
    if (!img.present) return fail('A replacement photo is required');
    if (!String(img.mime || '').startsWith('image/')) return fail('Replacement file must be an image');
    if (!img.dataBase64) return fail('Replacement photo data missing');
    if (typeof img.bytes !== 'number' || img.bytes <= 0) return fail('Replacement photo is empty');
    if (img.bytes > MAX_IMAGE_BYTES) return fail('Replacement photo must be 12 MB or smaller');
  } else if (intent === 'move-resize') {
    if (!MOVE_RESIZE_OPTIONS.includes(detail.change)) return fail('Pick a layout change from the list');
    if (isVague(detail.detail)) return fail(VAGUE_MESSAGE);
  } else if (intent === 'remove') {
    if (detail.confirmed !== true) return fail('Tick the confirmation box to remove this element');
  } else if (intent === 'something-else') {
    if (isVague(detail.detail)) return fail(VAGUE_MESSAGE);
  }

  // --- normalize + size-bound the locator -----------------------------------
  const sigCount = signalCount(p);
  const autoEligible =
    (intent === 'change-wording' || intent === 'replace-photo') && sigCount >= 2;
  const testMode = p.testMode === true;

  const locator = {
    schemaVersion: SCHEMA_VERSION,
    pageRoute: clamp(p.pageRoute, 200),
    astroFileGuess: clamp(p.astroFileGuess, 200),
    intent,
    i18nKey: p.i18nKey ? clamp(p.i18nKey, 200) : null,
    i18nAttr: p.i18nAttr ? clamp(p.i18nAttr, 40) : null,
    imageRef: p.imageRef ? clamp(p.imageRef, 300) : null,
    galleryAttrRaw: p.galleryAttrRaw ? clamp(p.galleryAttrRaw, 4000) : null,
    galleryIndex: Number.isInteger(p.galleryIndex) ? p.galleryIndex : null,
    domPath: clamp(p.domPath, 600),
    nearbyText: clamp(p.nearbyText, 200),
    nearestHeading: p.nearestHeading ? clamp(p.nearestHeading, 200) : null,
    outerHTMLSnippet: clamp(p.outerHTMLSnippet, 1500),
    boundingInfo: p.boundingInfo || null,
    computedStyle: p.computedStyle || null,
    langAtCapture: p.langAtCapture === 'fr' ? 'fr' : 'en',
    intentDetail: {
      currentText: clamp(detail.currentText, 600),
      newTextEn: clamp(detail.newTextEn, 2000),
      newTextFr: clamp(detail.newTextFr, 2000),
      okToTranslate: detail.okToTranslate === true,
      change: detail.change || null,
      detail: clamp(detail.detail, 2000),
      confirmed: detail.confirmed === true,
    },
  };

  try {
    // 1. Build the human + machine issue body. committedPath unknown until the
    //    issue number exists, so render with a placeholder and PATCH it in.
    const imageMeta = (committedPath: string | null, sha256: string | null) => ({
      present: !!img.present,
      committedPath,
      originalFilename: img.present ? clamp(img.originalFilename, 260) : null,
      mime: img.present ? clamp(img.mime, 100) : null,
      bytes: img.present ? img.bytes : null,
      sha256,
    });

    const buildBody = (committedPath: string | null, sha256: string | null) => {
      const machine = { ...locator, image: imageMeta(committedPath, sha256) };
      const human = renderHuman(locator, intent);
      const hint = autoEligible
        ? `Autonomy hint: AUTO-ELIGIBLE (intent=${intent}, ${sigCount} locator signals agree). Verify against the autonomy gate in .github/CLAUDE_FEEDBACK.md before labelling \`auto-approved\`.`
        : `Autonomy hint: NEEDS-REVIEW (intent=${intent}, ${sigCount} locator signals). Open a PR, do not auto-merge; if you need client input, label \`needs-client-reply\` and ask ONE plain-language question.`;
      return [
        human,
        '',
        '---',
        '',
        '<!-- machine-readable feedback payload — do not edit by hand -->',
        '```json',
        JSON.stringify(machine, null, 2),
        '```',
        '',
        hint,
      ].join('\n');
    };

    // 2. Title (≤ 80 chars).
    const snippet =
      (locator.intentDetail.currentText || locator.nearbyText || locator.imageRef || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 40);
    const prettyIntent = intent.replace(/-/g, ' ');
    let title = `${testMode ? '[TEST] ' : ''}[Feedback] ${prettyIntent} — ${locator.pageRoute}: "${snippet}"`;
    if (title.length > 80) title = title.slice(0, 79) + '…';

    // TEST submissions get a non-triggering label so the live Action stays
    // dormant (verification stage 3). Real submissions get `client-feedback`.
    const labels = testMode ? ['client-feedback-test'] : ['client-feedback'];

    // 3. Create the issue first (need its number for the image path).
    const issue = await createIssue(title, buildBody(null, null), labels);
    const issueNumber: number = issue.number;
    const issueUrl: string = issue.html_url;

    // 4. If a photo is attached, commit the raw bytes OUTSIDE /public/ (it is
    //    in .vercelignore so the prebuild guard never trips and it never
    //    deploys) and PATCH the real path back into the issue body.
    if (img.present && img.dataBase64) {
      const b64: string = String(img.dataBase64).includes(',')
        ? String(img.dataBase64).split(',').pop()!
        : String(img.dataBase64);

      let sha256: string | null = null;
      try {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        sha256 = Array.from(new Uint8Array(digest))
          .map((x) => x.toString(16).padStart(2, '0'))
          .join('');
      } catch {
        /* hashing is best-effort */
      }

      const safeName =
        (clamp(img.originalFilename, 120) || 'upload')
          .replace(/[^a-zA-Z0-9._-]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'upload';
      const committedPath = `feedback-incoming/issue-${issueNumber}/${safeName}`;

      const ok = await commitBase64File(
        committedPath,
        b64,
        `feedback: raw upload for issue #${issueNumber}`
      );
      if (!ok) {
        await patchIssueBody(
          issueNumber,
          buildBody(null, sha256) +
            '\n\n> ⚠️ The replacement photo failed to upload. Ask the client to resend it.'
        );
        return new Response(
          JSON.stringify({
            ok: true,
            issueUrl,
            issueNumber,
            warning: 'Issue created but the photo upload failed.',
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      await patchIssueBody(issueNumber, buildBody(committedPath, sha256));
    }

    return new Response(JSON.stringify({ ok: true, issueUrl, issueNumber }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Plain-language summary humans (and Claude) read first, before the JSON block.
function renderHuman(loc: any, intent: Intent): string {
  const d = loc.intentDetail;
  const lines: string[] = [];
  lines.push(`**A client left feedback on the live site.**`);
  lines.push('');
  lines.push(`- **Page:** \`${loc.pageRoute}\`  (best guess: \`${loc.astroFileGuess || '?'}\`)`);
  lines.push(`- **What they want:** ${intent.replace(/-/g, ' ')}`);
  if (loc.nearestHeading) lines.push(`- **Under the heading:** “${loc.nearestHeading}”`);
  if (loc.i18nKey) lines.push(`- **Text key:** \`${loc.i18nKey}\` (via \`${loc.i18nAttr}\`)`);
  if (loc.imageRef) lines.push(`- **Image:** \`${loc.imageRef}\``);
  if (loc.galleryIndex !== null) lines.push(`- **Gallery index:** ${loc.galleryIndex}`);
  if (loc.nearbyText) lines.push(`- **Nearby text:** “${loc.nearbyText}”`);
  lines.push(`- **Captured in:** ${loc.langAtCapture.toUpperCase()}`);
  lines.push('');

  if (intent === 'change-wording') {
    lines.push(`**Current wording:** “${d.currentText}”`);
    lines.push('');
    lines.push(`**New wording (EN):** ${d.newTextEn}`);
    if (d.okToTranslate) lines.push(`**French:** _client OK'd auto-translation — translate it._`);
    else lines.push(`**New wording (FR):** ${d.newTextFr}`);
  } else if (intent === 'replace-photo') {
    lines.push(`**Replace this photo.** The raw upload is committed under \`feedback-incoming/\` (see JSON below). Run it through the Sharp pipeline onto the SAME target path — do not change \`/images/\` paths or any \`.astro\`/markdown.`);
  } else if (intent === 'move-resize') {
    lines.push(`**Layout change requested:** \`${d.change}\``);
    lines.push('');
    lines.push(`**In their words:** ${d.detail}`);
  } else if (intent === 'remove') {
    lines.push(`**They want this element removed.** They explicitly confirmed.`);
    if (d.detail) lines.push(`Note: ${d.detail}`);
  } else {
    lines.push(`**Free-form request:** ${d.detail}`);
  }
  return lines.join('\n');
}
