export const DASHBOARD_PASSWORD = (import.meta.env.DASHBOARD_PASSWORD || 'moulin2024').trim();

// Secret for signing cookies — derived from password + a salt so it's stable across instances
const SECRET = import.meta.env.DASHBOARD_PASSWORD || 'moulin2024';

async function hmacSign(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacVerify(message: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(message);
  return expected === signature;
}

export async function createSession(): Promise<string> {
  // Token format: "authenticated:<timestamp>:<signature>"
  const payload = `authenticated:${Date.now()}`;
  const sig = await hmacSign(payload);
  return `${payload}:${sig}`;
}

export async function checkAuth(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...rest] = c.trim().split('=');
      return [key, rest.join('=')];
    })
  );
  const raw = cookies['maison_session'];
  if (!raw) return false;
  // Astro's cookies.set() URL-encodes the value; decode before parsing
  const token = decodeURIComponent(raw);

  // Parse token: "authenticated:<timestamp>:<signature>"
  const parts = token.split(':');
  if (parts.length !== 3 || parts[0] !== 'authenticated') return false;

  const payload = `${parts[0]}:${parts[1]}`;
  const sig = parts[2];
  const valid = await hmacVerify(payload, sig);
  if (!valid) return false;

  // Check token is less than 30 days old
  const timestamp = parseInt(parts[1], 10);
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > thirtyDays) return false;

  return true;
}
