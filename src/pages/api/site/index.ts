export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth } from '../../../lib/auth';

const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
const GITHUB_REPO = import.meta.env.GITHUB_REPO;

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

function organizeConfig(cssContent: string, translationsContent: string) {
  // Parse CSS variables from :root block
  const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/s);
  const colors: Record<string, string> = {};
  const fonts: Record<string, string> = {};
  const spacing: Record<string, string> = {};

  if (rootMatch) {
    for (const line of rootMatch[1].split('\n')) {
      const varMatch = line.match(/--([^:]+):\s*([^;]+);/);
      if (varMatch) {
        const name = varMatch[1].trim();
        const value = varMatch[2].trim();
        if (name.startsWith('bg-') || name.startsWith('blue-') || name.startsWith('text-') ||
            name === 'gold' || name === 'green-garden' || name === 'terracotta') {
          colors[name] = value;
        } else if (name.startsWith('font-')) {
          fonts[name] = value;
        } else if (name.startsWith('section-') || name.startsWith('content-') || name.startsWith('side-')) {
          spacing[name] = value;
        }
      }
    }
  }

  // Organize translations by section prefix
  const translations = JSON.parse(translationsContent || '{}');
  const pages: Record<string, Record<string, any>> = {};
  for (const [key, value] of Object.entries(translations)) {
    const prefix = key.split('.')[0];
    if (!pages[prefix]) pages[prefix] = {};
    pages[prefix][key] = value;
  }

  return { colors, fonts, spacing, pages };
}

const SECTIONS = [
  { id: 'home', label: 'Homepage', icon: 'home' },
  { id: 'nav', label: 'Navigation', icon: 'nav' },
  { id: 'homes', label: 'Homes Overview', icon: 'houses' },
  { id: 'moulin', label: 'Le Moulin', icon: 'house' },
  { id: 'grange', label: 'La Grange', icon: 'house' },
  { id: 'jardin', label: 'Le Jardin', icon: 'house' },
  { id: 'compound', label: 'The Compound', icon: 'compound' },
  { id: 'explore', label: 'Explore', icon: 'explore' },
  { id: 'catering', label: 'Catering', icon: 'catering' },
  { id: 'wellness', label: 'Wellness', icon: 'wellness' },
  { id: 'about', label: 'About', icon: 'about' },
  { id: 'contact', label: 'Contact', icon: 'contact' },
  { id: 'gallery', label: 'Gallery', icon: 'gallery' },
  { id: 'footer', label: 'Footer', icon: 'footer' },
  { id: 'amenity', label: 'Amenities', icon: 'amenity' },
  { id: 'success', label: 'Success Page', icon: 'success' },
];

export const GET: APIRoute = async ({ request }) => {
  if (!await checkAuth(request)) {
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

    const config = organizeConfig(cssContent || '', translationsContent || '{}');

    return new Response(JSON.stringify({
      ...config,
      sections: SECTIONS,
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
