export const prerender = false;

import type { APIRoute } from 'astro';

const AIRBNB_ICS =
  'https://www.airbnb.com/calendar/ical/1655005094020930707.ics?t=5ba028e138df4f7ca43098b034f2b0af';
const VRBO_ICS =
  'https://www.vrbo.com/icalendar/d6abff732437470f905c703bf1e9aea3.ics?nonTentative';

type BusyRange = { start: string; end: string; source: 'airbnb' | 'vrbo'; summary?: string };

function unfoldIcs(text: string): string[] {
  const raw = text.replace(/\r\n/g, '\n').split('\n');
  const lines: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function isoFromIcsDate(value: string): string | null {
  const date = value.includes('T') ? value.slice(0, 8) : value.slice(0, 8);
  if (!/^\d{8}$/.test(date)) return null;
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
}

function parseIcs(text: string, source: BusyRange['source']): BusyRange[] {
  const lines = unfoldIcs(text);
  const events: BusyRange[] = [];
  let inEvent = false;
  let cur: Partial<BusyRange> = {};
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      cur = { source };
      continue;
    }
    if (line === 'END:VEVENT') {
      if (cur.start && cur.end) events.push(cur as BusyRange);
      inEvent = false;
      cur = {};
      continue;
    }
    if (!inEvent) continue;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon);
    const val = line.slice(colon + 1);
    if (key.startsWith('DTSTART')) {
      const iso = isoFromIcsDate(val);
      if (iso) cur.start = iso;
    } else if (key.startsWith('DTEND')) {
      const iso = isoFromIcsDate(val);
      if (iso) cur.end = iso;
    } else if (key === 'SUMMARY') {
      cur.summary = val;
    }
  }
  return events;
}

async function fetchIcs(url: string, source: BusyRange['source']): Promise<BusyRange[]> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'text/calendar, text/plain;q=0.8, */*;q=0.5' },
    });
    if (!res.ok) return [];
    const text = await res.text();
    return parseIcs(text, source);
  } catch {
    return [];
  }
}

function expandToDates(range: BusyRange): string[] {
  const out: string[] = [];
  const start = new Date(range.start + 'T00:00:00Z');
  const end = new Date(range.end + 'T00:00:00Z');
  for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export const GET: APIRoute = async () => {
  const [airbnb, vrbo] = await Promise.all([
    fetchIcs(AIRBNB_ICS, 'airbnb'),
    fetchIcs(VRBO_ICS, 'vrbo'),
  ]);

  const ranges = [...airbnb, ...vrbo].filter((r) => {
    const summary = (r.summary || '').toLowerCase();
    return summary !== 'not available' ? true : true;
  });

  const blockedSet = new Set<string>();
  for (const r of ranges) {
    for (const day of expandToDates(r)) blockedSet.add(day);
  }
  const blocked = [...blockedSet].sort();

  const body = JSON.stringify({
    blocked,
    ranges,
    sources: {
      airbnb: airbnb.length,
      vrbo: vrbo.length,
    },
    lastSynced: new Date().toISOString(),
  });

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
    },
  });
};
