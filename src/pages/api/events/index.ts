export const prerender = false;

import type { APIRoute } from 'astro';
import { initDB, queries } from '../../../lib/db';
import { resolveIP } from '../../../lib/geo';
import { checkAuth } from '../../../lib/auth';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await initDB();
    const body = await request.json();

    // Resolve geo from IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1';

    let geo = { city: '', region: '', country: '', lat: 0, lon: 0 };
    if (ip && ip !== '127.0.0.1' && ip !== '::1') {
      geo = await resolveIP(ip);
    }

    const event = await queries.insertEvent({
      site_id: body.site_id || body.siteId,
      visitor_id: body.visitor_id || body.visitorId,
      page_url: body.page_url || body.pageUrl,
      page_title: body.page_title || body.pageTitle,
      referrer: body.referrer,
      city: geo.city,
      region: geo.region,
      country: geo.country,
      lat: geo.lat,
      lon: geo.lon,
      device: body.device,
      browser: body.browser,
      os: body.os,
    });

    // Upsert active visitor
    await queries.upsertActiveVisitor({
      visitor_id: body.visitor_id || body.visitorId,
      site_id: body.site_id || body.siteId,
      page_url: body.page_url || body.pageUrl,
      city: geo.city,
      country: geo.country,
      device: body.device,
    });

    return new Response(JSON.stringify({ ok: true, event: event[0] }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
};

export const GET: APIRoute = async ({ request, url }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await initDB();

    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: Record<string, any> = {};
    let paramIndex = 1;

    const siteId = url.searchParams.get('site_id');
    if (siteId) {
      conditions.push(`site_id = $${paramIndex}`);
      params[`p${paramIndex}`] = siteId;
      paramIndex++;
    }

    const country = url.searchParams.get('country');
    if (country) {
      conditions.push(`country = $${paramIndex}`);
      params[`p${paramIndex}`] = country;
      paramIndex++;
    }

    const start = url.searchParams.get('start');
    if (start) {
      conditions.push(`created_at >= $${paramIndex}::timestamptz`);
      params[`p${paramIndex}`] = start;
      paramIndex++;
    }

    const end = url.searchParams.get('end');
    if (end) {
      conditions.push(`created_at <= $${paramIndex}::timestamptz`);
      params[`p${paramIndex}`] = end;
      paramIndex++;
    }

    const [events, count] = await Promise.all([
      queries.getEventsFiltered(conditions, params, limit, offset),
      queries.getEventsCount(conditions, params),
    ]);

    return new Response(JSON.stringify({ events, total: count, page, limit }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
