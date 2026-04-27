export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth } from '../../../lib/auth';

const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
const GITHUB_REPO = import.meta.env.GITHUB_REPO;

async function getFileSha(path: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sha;
  } catch {
    return null;
  }
}

async function fetchFileContent(path: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3.raw',
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function applyColorsToCss(css: string, colors: Record<string, string>): string {
  return css.replace(/(:root\s*\{)([\s\S]*?)(\n?\})/, (_m, open, inner, close) => {
    let updated = inner;
    for (const [name, value] of Object.entries(colors)) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(--${escaped}\\s*:\\s*)([^;\\n]+)(;)`);
      if (re.test(updated)) {
        updated = updated.replace(re, `$1${value}$3`);
      }
    }
    return `${open}${updated}${close}`;
  });
}

async function commitFile(path: string, content: string, message: string): Promise<boolean> {
  const sha = await getFileSha(path);
  const body: any = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
  };
  if (sha) body.sha = sha;

  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return res.ok;
}

export const POST: APIRoute = async ({ request }) => {
  if (!await checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const results: Record<string, boolean> = {};
    const timestamp = new Date().toISOString();

    if (body.colors && Object.keys(body.colors).length > 0) {
      const currentCss = await fetchFileContent('src/styles/global.css');
      if (currentCss) {
        const newCss = applyColorsToCss(currentCss, body.colors);
        if (newCss !== currentCss) {
          results.colors = await commitFile(
            'src/styles/global.css',
            newCss,
            `Publish colors - ${timestamp}`
          );
        } else {
          results.colors = true;
        }
      } else {
        results.colors = false;
      }
    }

    if (body.translations) {
      // Merge editor's payload into the latest remote translations so keys a
      // developer added directly to git survive a publish from a stale editor.
      const currentRaw = await fetchFileContent('public/i18n/translations.json');
      let merged = body.translations;
      if (currentRaw) {
        try {
          const current = JSON.parse(currentRaw);
          merged = { ...current, ...body.translations };
        } catch {
          // Current file unparseable — fall back to editor's payload.
        }
      }
      results.translations = await commitFile(
        'public/i18n/translations.json',
        JSON.stringify(merged, null, 2),
        `Publish translations - ${timestamp}`
      );
    }

    // Vercel auto-deploys on push to the connected branch
    return new Response(JSON.stringify({
      ok: true,
      results,
      message: 'Changes committed to GitHub. Vercel will auto-deploy.',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
