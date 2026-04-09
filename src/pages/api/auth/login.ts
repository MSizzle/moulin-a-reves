export const prerender = false;

import type { APIRoute } from 'astro';
import { DASHBOARD_PASSWORD, createSession } from '../../../lib/auth';

const loginHTML = (error?: boolean) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maison Dashboard - Login</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .login-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 2.5rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.25);
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: #f8fafc;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }
    .error {
      background: #7f1d1d;
      border: 1px solid #dc2626;
      color: #fca5a5;
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }
    label {
      display: block;
      font-size: 0.875rem;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }
    input[type="password"] {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      color: #f8fafc;
      font-size: 1rem;
      margin-bottom: 1.5rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input[type="password"]:focus {
      border-color: #6366f1;
    }
    button {
      width: 100%;
      padding: 0.75rem;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #4f46e5; }
    .prometheus {
      position: fixed;
      bottom: 8px;
      right: 12px;
      font-size: 11px;
      opacity: 0.3;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="login-card">
    <h1>Moulin a Reves</h1>
    <p class="subtitle">Dashboard Login</p>
    ${error ? '<div class="error">Invalid password. Please try again.</div>' : ''}
    <form id="loginForm">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" placeholder="Enter dashboard password" autofocus required>
      <button type="submit">Sign In</button>
    </form>
    <script>
      document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        if (res.ok) {
          window.location.href = '/analytics/';
        } else {
          window.location.href = '/api/auth/login?error=1';
        }
      });
    </script>
  </div>
  <div class="prometheus">Prometheus</div>
</body>
</html>`;

export const GET: APIRoute = async ({ url }) => {
  const error = url.searchParams.has('error');
  return new Response(loginHTML(error), {
    headers: { 'Content-Type': 'text/html' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  let password = '';
  try {
    const body = await request.json();
    password = body.password || '';
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const envPw = import.meta.env.DASHBOARD_PASSWORD;
  const expected = (typeof envPw === 'string' && envPw.trim().length > 0) ? envPw.trim() : 'moulin2024';
  if (password === expected) {
    const token = createSession();
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `maison_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
      },
    });
  }

  return new Response(JSON.stringify({ error: 'Invalid password' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
};
