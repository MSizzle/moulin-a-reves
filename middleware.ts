import { rewrite, next } from '@vercel/edge';

// Vercel Edge Middleware — runs before filesystem lookup, so it can
// rewrite root requests on a custom subdomain to a static file path
// that would otherwise be shadowed by Astro's prerendered index.html.
//
// When a request hits editor.moulinareves.com/, transparently serve
// the editor SPA (built into /editor/index.html) without changing the
// URL bar. All other hosts (www.moulinareves.com, etc.) pass through
// to the normal Astro routing.
export const config = {
  matcher: '/',
};

export default function middleware(request: Request) {
  const host = request.headers.get('host') || '';

  if (host === 'editor.moulinareves.com') {
    return rewrite(new URL('/editor/index.html', request.url));
  }

  return next();
}
