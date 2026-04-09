export const prerender = false;

import type { APIRoute } from 'astro';
import { initDB, queries } from '../../../lib/db';
import { checkAuth } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, url }) => {
  if (!await checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await initDB();

    const now = new Date();
    const start = url.searchParams.get('start') || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = url.searchParams.get('end') || now.toISOString();
    const group = url.searchParams.get('group') || 'day';

    const traffic = await queries.getTrafficOverTime(start, end, group);

    return new Response(JSON.stringify(traffic), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
