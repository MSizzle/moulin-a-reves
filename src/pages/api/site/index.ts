export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth } from '../../../lib/auth';

const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
const GITHUB_REPO = import.meta.env.GITHUB_REPO; // format: owner/repo

async function fetchGitHubFile(path: string): Promise<string | null> {
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

function extractCSSProperties(css: string): Record<string, string> {
  const properties: Record<string, string> = {};
  // Match CSS custom properties in :root
  const rootMatch = css.match(/:root\s*\{([^}]+)\}/s);
  if (rootMatch) {
    const lines = rootMatch[1].split('\n');
    for (const line of lines) {
      const match = line.match(/\s*(--[\w-]+)\s*:\s*([^;]+);/);
      if (match) {
        properties[match[1].trim()] = match[2].trim();
      }
    }
  }
  return properties;
}

export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const [cssContent, translationsContent] = await Promise.all([
      fetchGitHubFile('src/styles/global.css'),
      fetchGitHubFile('public/i18n/translations.json'),
    ]);

    const cssProperties = cssContent ? extractCSSProperties(cssContent) : {};
    let translations = {};
    try {
      translations = translationsContent ? JSON.parse(translationsContent) : {};
    } catch {
      translations = {};
    }

    return new Response(JSON.stringify({
      css: cssProperties,
      rawCSS: cssContent || '',
      translations,
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
