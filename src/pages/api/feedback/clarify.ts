export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth } from '../../../lib/auth';

// Same GitHub plumbing as api/site/save.ts + api/feedback/submit.ts.
const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
const GITHUB_REPO = import.meta.env.GITHUB_REPO;

const ghHeaders = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
};

// Claude is instructed (.github/CLAUDE_FEEDBACK.md §5) to start its single
// clarifying comment with exactly this marker line. We surface only that.
const QUESTION_MARKER = '**Question for you:**';

function unauthorized() {
  return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Pull the locator out of the issue body's fenced ```json block so we can show
// the client what the question is about (page, text, photo).
function parseLocator(body: string): any | null {
  const m = body && body.match(/```json\s*([\s\S]*?)```/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

export const GET: APIRoute = async ({ request }) => {
  if (!(await checkAuth(request))) return unauthorized();

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues?state=open&labels=${encodeURIComponent(
        'client-feedback,needs-client-reply'
      )}&per_page=50`,
      { headers: ghHeaders }
    );
    if (!res.ok) {
      return json({ ok: false, error: `GitHub list failed (${res.status})` }, 502);
    }
    const issues: any[] = await res.json();

    const items = await Promise.all(
      (issues || [])
        .filter((i) => !i.pull_request)
        .map(async (i) => {
          const loc = parseLocator(i.body || '');
          // Find the latest comment that starts with the question marker.
          let question = '';
          try {
            const cRes = await fetch(
              `https://api.github.com/repos/${GITHUB_REPO}/issues/${i.number}/comments?per_page=100`,
              { headers: ghHeaders }
            );
            if (cRes.ok) {
              const comments: any[] = await cRes.json();
              for (let k = comments.length - 1; k >= 0; k--) {
                const b = String(comments[k].body || '').trim();
                if (b.startsWith(QUESTION_MARKER)) {
                  question = b.slice(QUESTION_MARKER.length).trim();
                  break;
                }
              }
            }
          } catch {
            /* question stays empty — still list the item */
          }

          const intent = loc?.intent || 'change';
          const desc =
            loc?.intentDetail?.currentText ||
            loc?.nearbyText ||
            loc?.imageRef ||
            i.title ||
            '';

          return {
            issueNumber: i.number,
            url: i.html_url,
            title: i.title,
            pageRoute: loc?.pageRoute || '',
            intent,
            nearestHeading: loc?.nearestHeading || '',
            desc: String(desc).slice(0, 240),
            // imageRef is a deployed /images/*.webp path → safe to <img>.
            imageRef: loc?.imageRef || null,
            question: question || '(The question is on the issue — open it to read the full thread.)',
          };
        })
    );

    return json({ ok: true, items });
  } catch (err: any) {
    return json({ ok: false, error: err.message || 'Server error' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!(await checkAuth(request))) return unauthorized();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid request body' }, 400);
  }

  const issueNumber = parseInt(String(body?.issueNumber), 10);
  const answer = String(body?.answer ?? '').trim();
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    return json({ ok: false, error: 'Missing issue number' }, 422);
  }
  if (answer.length < 2) {
    return json({ ok: false, error: 'Please type your answer first.' }, 422);
  }
  if (answer.length > 5000) {
    return json({ ok: false, error: 'That answer is too long.' }, 422);
  }

  try {
    // 1. Re-validate the issue is genuinely awaiting a client reply (don't let
    //    a stale tab spam unrelated issues).
    const iRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}`,
      { headers: ghHeaders }
    );
    if (!iRes.ok) return json({ ok: false, error: 'Issue not found' }, 404);
    const issue = await iRes.json();
    const labels: string[] = (issue.labels || []).map((l: any) => l.name);
    if (!labels.includes('client-feedback') || !labels.includes('needs-client-reply')) {
      return json(
        { ok: false, error: 'This question is no longer open for a reply.' },
        409
      );
    }

    // 2. Post the client's plain answer as a comment. The `@claude` mention
    //    re-fires .github/workflows/claude.yml with the new context.
    const commentRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        headers: ghHeaders,
        body: JSON.stringify({
          body:
            `**Client reply (via the feedback inbox):**\n\n` +
            answer +
            `\n\n@claude — the client answered your question above. Please re-read the whole thread and continue per .github/CLAUDE_FEEDBACK.md.`,
        }),
      }
    );
    if (!commentRes.ok) {
      const d = await commentRes.text().catch(() => '');
      return json(
        { ok: false, error: `Could not post the reply (${commentRes.status}) ${d.slice(0, 200)}` },
        502
      );
    }

    // 3. Flip labels: needs-client-reply → client-replied.
    await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}/labels/${encodeURIComponent(
        'needs-client-reply'
      )}`,
      { method: 'DELETE', headers: ghHeaders }
    ).catch(() => {});
    await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}/labels`,
      {
        method: 'POST',
        headers: ghHeaders,
        body: JSON.stringify({ labels: ['client-replied'] }),
      }
    ).catch(() => {});

    return json({ ok: true });
  } catch (err: any) {
    return json({ ok: false, error: err.message || 'Server error' }, 500);
  }
};
