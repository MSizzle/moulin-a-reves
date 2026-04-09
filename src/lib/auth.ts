import type { APIContext } from 'astro';

export const DASHBOARD_PASSWORD = (import.meta.env.DASHBOARD_PASSWORD || 'moulin2024').trim();

// In-memory session store — resets on cold start, which is acceptable for a small dashboard
const sessions = new Set<string>();

export function createSession(): string {
  const token = crypto.randomUUID();
  sessions.add(token);
  return token;
}

export function checkAuth(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...rest] = c.trim().split('=');
      return [key, rest.join('=')];
    })
  );
  const sessionToken = cookies['maison_session'];
  if (!sessionToken) return false;
  return sessions.has(sessionToken);
}
