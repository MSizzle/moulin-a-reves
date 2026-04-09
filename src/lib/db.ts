import { neon } from '@neondatabase/serverless';

const sql = neon(import.meta.env.DATABASE_URL);

let initialized = false;

export async function initDB() {
  if (initialized) return;

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      site_id TEXT,
      visitor_id TEXT,
      page_url TEXT,
      page_title TEXT,
      referrer TEXT,
      city TEXT,
      region TEXT,
      country TEXT,
      lat REAL,
      lon REAL,
      device TEXT,
      browser TEXT,
      os TEXT,
      duration_seconds INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS active_visitors (
      visitor_id TEXT PRIMARY KEY,
      site_id TEXT,
      page_url TEXT,
      city TEXT,
      country TEXT,
      device TEXT,
      last_seen TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS geo_cache (
      ip TEXT PRIMARY KEY,
      city TEXT,
      region TEXT,
      country TEXT,
      lat REAL,
      lon REAL,
      cached_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_events_site_id ON events(site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_visitor_id ON events(visitor_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_page_url ON events(page_url)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_country ON events(country)`;

  initialized = true;
}

export const queries = {
  async insertEvent(data: {
    site_id?: string;
    visitor_id?: string;
    page_url?: string;
    page_title?: string;
    referrer?: string;
    city?: string;
    region?: string;
    country?: string;
    lat?: number;
    lon?: number;
    device?: string;
    browser?: string;
    os?: string;
  }) {
    return sql`
      INSERT INTO events (site_id, visitor_id, page_url, page_title, referrer, city, region, country, lat, lon, device, browser, os)
      VALUES (${data.site_id ?? null}, ${data.visitor_id ?? null}, ${data.page_url ?? null}, ${data.page_title ?? null}, ${data.referrer ?? null}, ${data.city ?? null}, ${data.region ?? null}, ${data.country ?? null}, ${data.lat ?? null}, ${data.lon ?? null}, ${data.device ?? null}, ${data.browser ?? null}, ${data.os ?? null})
      RETURNING *
    `;
  },

  async updateDuration(data: { visitor_id: string; page_url: string; duration_seconds: number }) {
    return sql`
      UPDATE events SET duration_seconds = ${data.duration_seconds}
      WHERE id = (
        SELECT id FROM events
        WHERE visitor_id = ${data.visitor_id} AND page_url = ${data.page_url}
        ORDER BY created_at DESC
        LIMIT 1
      )
    `;
  },

  async upsertActiveVisitor(data: {
    visitor_id: string;
    site_id?: string;
    page_url?: string;
    city?: string;
    country?: string;
    device?: string;
  }) {
    return sql`
      INSERT INTO active_visitors (visitor_id, site_id, page_url, city, country, device, last_seen)
      VALUES (${data.visitor_id}, ${data.site_id ?? null}, ${data.page_url ?? null}, ${data.city ?? null}, ${data.country ?? null}, ${data.device ?? null}, NOW())
      ON CONFLICT (visitor_id) DO UPDATE SET
        site_id = EXCLUDED.site_id,
        page_url = EXCLUDED.page_url,
        city = EXCLUDED.city,
        country = EXCLUDED.country,
        device = EXCLUDED.device,
        last_seen = NOW()
    `;
  },

  async removeActiveVisitor(visitorId: string) {
    return sql`DELETE FROM active_visitors WHERE visitor_id = ${visitorId}`;
  },

  async cleanStaleVisitors() {
    return sql`DELETE FROM active_visitors WHERE last_seen < NOW() - INTERVAL '60 seconds'`;
  },

  async getActiveVisitors() {
    return sql`SELECT * FROM active_visitors ORDER BY last_seen DESC`;
  },

  async getEventsFiltered(conditions: string[], params: Record<string, any>, limit: number, offset: number) {
    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
    // Build parameterized query - since neon sql tag doesn't support dynamic WHERE easily,
    // we use a raw approach with the conditions pre-built by the caller
    const query = `SELECT * FROM events WHERE ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    return sql(query, Object.values(params));
  },

  async getEventsCount(conditions: string[], params: Record<string, any>) {
    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
    const query = `SELECT COUNT(*) as count FROM events WHERE ${whereClause}`;
    const result = await sql(query, Object.values(params));
    return result[0]?.count ?? 0;
  },

  async getTopPages(start: string, end: string) {
    return sql`
      SELECT page_url, COUNT(*) as views, COUNT(DISTINCT visitor_id) as unique_visitors
      FROM events
      WHERE created_at >= ${start}::timestamptz AND created_at <= ${end}::timestamptz
      GROUP BY page_url
      ORDER BY views DESC
      LIMIT 20
    `;
  },

  async getTrafficOverTime(start: string, end: string, groupBy: string) {
    // groupBy should be a valid date_trunc value: 'hour', 'day', 'week', 'month'
    const validGroupBy = ['hour', 'day', 'week', 'month'].includes(groupBy) ? groupBy : 'day';
    const query = `
      SELECT date_trunc($1, created_at) as period, COUNT(*) as views, COUNT(DISTINCT visitor_id) as unique_visitors
      FROM events
      WHERE created_at >= $2::timestamptz AND created_at <= $3::timestamptz
      GROUP BY period
      ORDER BY period ASC
    `;
    return sql(query, [validGroupBy, start, end]);
  },

  async getGeoBreakdown(start: string, end: string) {
    return sql`
      SELECT country, city, COUNT(*) as views, COUNT(DISTINCT visitor_id) as unique_visitors
      FROM events
      WHERE created_at >= ${start}::timestamptz AND created_at <= ${end}::timestamptz
      GROUP BY country, city
      ORDER BY views DESC
      LIMIT 50
    `;
  },

  async getVisitorLocations(start: string, end: string) {
    return sql`
      SELECT ROUND(lat::numeric, 1) as lat, ROUND(lon::numeric, 1) as lon, COUNT(*) as count, country, city
      FROM events
      WHERE created_at >= ${start}::timestamptz AND created_at <= ${end}::timestamptz
        AND lat IS NOT NULL AND lon IS NOT NULL
      GROUP BY ROUND(lat::numeric, 1), ROUND(lon::numeric, 1), country, city
      ORDER BY count DESC
    `;
  },

  async getCachedGeo(ip: string) {
    const result = await sql`SELECT * FROM geo_cache WHERE ip = ${ip}`;
    return result[0] ?? null;
  },

  async cacheGeo(data: { ip: string; city: string; region: string; country: string; lat: number; lon: number }) {
    return sql`
      INSERT INTO geo_cache (ip, city, region, country, lat, lon)
      VALUES (${data.ip}, ${data.city}, ${data.region}, ${data.country}, ${data.lat}, ${data.lon})
      ON CONFLICT (ip) DO UPDATE SET
        city = EXCLUDED.city,
        region = EXCLUDED.region,
        country = EXCLUDED.country,
        lat = EXCLUDED.lat,
        lon = EXCLUDED.lon,
        cached_at = NOW()
    `;
  },
};
