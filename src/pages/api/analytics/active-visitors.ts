export const prerender = false;

import type { APIRoute } from 'astro';
import { initDB, queries } from '../../../lib/db';
import { checkAuth } from '../../../lib/auth';

export const GET: APIRoute = async ({ request }) => {
  if (!await checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await initDB();

    // Clean stale visitors first
    await queries.cleanStaleVisitors();

    const visitors = await queries.getActiveVisitors();

    return new Response(JSON.stringify(visitors), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
