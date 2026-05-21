export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth } from '../../../lib/auth';
import { validateEdit, signalCount, clamp, isVague, INTENTS, MAX_IMAGE_BYTES, MIN_VAGUE_LEN, MOVE_RESIZE_OPTIONS, VAGUE_STOPLIST, VAGUE_MESSAGE } from './validate';
import type { Intent } from './validate';

// Touch unused helper-imports so a future maintainer who removes one of these
// from the import list deliberately must do so on purpose. The shared module
// is the source of truth for the v1 path AND the upcoming v2 batch path; we
// pin all of its named exports here so the contract surface stays visible at
// the top of this file even when a given helper is currently only used inside
// validateEdit() (e.g. isVague, MIN_VAGUE_LEN, VAGUE_STOPLIST, MOVE_RESIZE_OPTIONS,
// VAGUE_MESSAGE). DO NOT remove this — it makes the KEEP-IN-SYNC contract
// (D-15 / API-04) grep-able from one place.
void isVague;
void MIN_VAGUE_LEN;
void VAGUE_STOPLIST;
void VAGUE_MESSAGE;
void MOVE_RESIZE_OPTIONS;
void INTENTS;

// GitHub Contents/Issues API plumbing — same pattern as src/pages/api/site/save.ts.
const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
const GITHUB_REPO = import.meta.env.GITHUB_REPO;

// ---------------------------------------------------------------------------
// Re-exported from ./validate.ts where the per-edit validation rules live
// (D-15 / API-04). SCHEMA_VERSION and SCHEMA_VERSION_V2 are dispatch keys,
// not validation rules, and stay here.
// ---------------------------------------------------------------------------
const SCHEMA_VERSION = 1;
const SCHEMA_VERSION_V2 = 2;

// ---------------------------------------------------------------------------
// D-03: Vercel Hobby tier request-body limit is ~4.5 MB (the default for the
// project per `.vercel/project.json` prj_RIo7DcBIYysCuz9zhnI71u1Ifrb4 / team
// team_mYKN6qZrDebsHJGJaiN7XqrY). MAX_BATCH_BYTES set to 3 MB so the
// base64-inflated wire size (~4 MB on the wire, since base64 grows ~33%)
// stays under the limit and the in-app cap-violation error fires BEFORE the
// edge rejects the request with an opaque 413. This is the conservative
// Hobby-safe default — the planner's D-03 verification step was unable to
// run `vercel inspect` from the sandbox; OPERATOR FOLLOW-UP REQUIRED: confirm
// the project tier at https://vercel.com/MSizzle/moulin-a-reves/settings/general
// (or the team-scoped equivalent) before merge. If the project is on a Pro+
// tier with function body-size override enabled, this can lift to 30 MB
// (the D-02 default) — update both this constant and the matching mirror in
// public/feedback-inject.js (STAGE-06 client mirror) in the same PR. See
// https://vercel.com/docs/functions/runtimes#request-body-size for the
// upstream constraint table.
// KEEP IN SYNC with MAX_BATCH_BYTES in public/feedback-inject.js (STAGE-06
// client mirror).
const MAX_BATCH_BYTES = 3 * 1024 * 1024;

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
// Response helper
// ---------------------------------------------------------------------------
function fail(message: string, status = 422) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// v1 single-edit handler — extracted verbatim from the pre-refactor POST body.
// The inline ~30-line validation block is replaced with one call to
// validateEdit() from ./validate.ts (D-15 / API-04). Everything else
// (locator normalisation, signalCount usage, title construction, issue
// creation, photo commit, body PATCH, top-level try/catch) is byte-equivalent
// in observable behavior to before this plan (API-02 / D-16: cached browsers
// keep working indefinitely).
// ---------------------------------------------------------------------------
async function handleV1(p: any): Promise<Response> {
  // --- structural + intent-specific validation via the shared validator ----
  const err = validateEdit(p);
  if (err) return fail(err);

  // After validateEdit() passes, p.intent is one of INTENTS by construction.
  const intent: Intent = p.intent;
  const detail = p.intentDetail || {};
  const img = p.image || { present: false };

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
}

// ---------------------------------------------------------------------------
// v2 batch handler — STUB. Plan 04-03 replaces the body of this function
// with the real batch dispatch (per-edit validation via validateEdit() from
// ./validate.ts, sequential photo commits to feedback-incoming/issue-<n>/,
// one PATCH for the final issue body — see PATTERNS.md §"submit.ts" items
// 11-17 and CONTEXT.md decisions D-01..D-12 for the design).
// ---------------------------------------------------------------------------
async function handleV2Batch(_p: any): Promise<Response> {
  return new Response(
    JSON.stringify({ ok: false, error: 'v2 batch handler not yet implemented' }),
    { status: 501, headers: { 'Content-Type': 'application/json' } }
  );
}

// ---------------------------------------------------------------------------
// POST — auth gate → JSON parse → schemaVersion dispatch. The v1 check comes
// first because cached browsers (the API-02 / D-16 reason this dispatch
// exists at all) only ever send v1 payloads; we want the most common case
// on the fast path. NEVER remove the v1 branch.
// ---------------------------------------------------------------------------
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

  if (p?.schemaVersion === SCHEMA_VERSION) return handleV1(p);
  if (p?.schemaVersion === SCHEMA_VERSION_V2 && p?.batch === true) return handleV2Batch(p);
  return fail('Unsupported schema version');
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
