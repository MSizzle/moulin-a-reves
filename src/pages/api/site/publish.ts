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

    if (body.css) {
      results.css = await commitFile(
        'src/styles/global.css',
        body.css,
        `Publish site styles - ${timestamp}`
      );
    }

    if (body.translations) {
      results.translations = await commitFile(
        'public/i18n/translations.json',
        JSON.stringify(body.translations, null, 2),
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
