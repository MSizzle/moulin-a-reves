export const prerender = false;

import type { APIRoute } from 'astro';
import { initDB, queries } from '../../../lib/db';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await initDB();
    const body = await request.json();

    const visitorId = body.visitor_id || body.visitorId;

    // Update duration on the last event
    if (body.page_url || body.pageUrl) {
      await queries.updateDuration({
        visitor_id: visitorId,
        page_url: body.page_url || body.pageUrl,
        duration_seconds: body.duration_seconds || body.durationSeconds || 0,
      });
    }

    // Remove from active visitors
    await queries.removeActiveVisitor(visitorId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
};
