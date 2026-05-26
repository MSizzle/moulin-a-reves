export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth } from '../../../lib/auth';
import Anthropic from '@anthropic-ai/sdk';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CatalogEntry {
  id: string;
  kind: 'i18n-text' | 'i18n-html' | 'image' | 'gallery-image' | 'heading' | 'hardcoded-text';
  i18nKey?: string;
  i18nAttr?: string;
  currentText?: string;
  currentTextFr?: string;
  nearestHeading?: string;
  domPath?: string;
  imageRef?: string;
  altText?: string;
  requiresManualSelection?: boolean;
}

interface Catalog {
  route: string;
  buildSha: string;
  generatedAt?: string;
  entries: CatalogEntry[];
}

interface Match {
  line: string;
  primaryId: string | null;
  primaryConfidence: number;
  alternates: string[];
  reason: string;
}

// ---------------------------------------------------------------------------
// Env (server-only — MATCH-06 / OPS-03: never compiled into the client bundle)
// ---------------------------------------------------------------------------
const ANTHROPIC_API_KEY = (import.meta.env.ANTHROPIC_API_KEY || '').trim();

// ---------------------------------------------------------------------------
// Caps (MATCH-07)
// ---------------------------------------------------------------------------
const MAX_EDIT_LIST_CHARS = 10000;
const MAX_CATALOG_ENTRIES = 150;
const ANTHROPIC_TIMEOUT_MS = 25000; // D-13: 25s, leaves 5s headroom under Vercel 30s default
const ANTHROPIC_MAX_RETRIES = 1; // D-13: one retry on 5xx / 429

// ---------------------------------------------------------------------------
// Response helpers (byte-for-byte from clarify.ts:20-32 + submit.ts:142-153)
// ---------------------------------------------------------------------------
function unauthorized() {
  return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function failCap(
  cap: 'edit-list-chars' | 'catalog-elements',
  limit: number,
  actual: number,
  message: string,
  status = 422,
): Response {
  return new Response(
    JSON.stringify({ ok: false, error: message, cap, limit, actual }),
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}

// ---------------------------------------------------------------------------
// editList tokenizer (MATCH-05)
// ---------------------------------------------------------------------------
// Returns one entry per "edit line". Rules:
//   - Normalize CRLF → LF.
//   - Split on \n; trim each line; drop empty.
//   - Drop Markdown headers (`# ...` `## ...`) — treated as context per MATCH-05.
//   - Strip leading bullet markers: `-`, `*`, `•`, or `1.` / `2)` etc.
//   - Whitespace-only lines drop out via the trim+empty check.
function parseEditList(raw: string): string[] {
  const out: string[] = [];
  const lines = String(raw).replace(/\r\n/g, '\n').split('\n');
  for (const original of lines) {
    const trimmed = original.trim();
    if (!trimmed) continue;
    if (/^#+\s/.test(trimmed)) continue; // Markdown header — skip, used as ambient context only
    const stripped = trimmed.replace(/^([-*•]|\d+[.)])\s+/, '').trim();
    if (!stripped) continue;
    out.push(stripped);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Slug derivation (single source of truth; mirrors Phase 7 routeToCatalogPath
// minus the `.json` suffix).
// `/` → 'index', `/homes/le-moulin/` → 'homes/le-moulin', `/about` → 'about'.
// ---------------------------------------------------------------------------
function routeToSlug(route: string): string {
  const trimmed = String(route).replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed === '' ? 'index' : trimmed;
}

// ---------------------------------------------------------------------------
// Same-origin catalog fetch (BLOCKER-2 fix).
//
// We CANNOT use fs.readFile against the function working directory — on Vercel
// that resolves to the function bundle root, not the deployment static-asset
// tree. Phase 7 ships
// catalogs to dist/client/edit-catalogs/<slug>.json (CATALOG-06) which Vercel
// serves at the same origin as this function. Build the URL from `request.url`
// so production POSTs hit production catalogs, preview POSTs hit preview
// catalogs — the body-supplied `route` is only the path component.
// ---------------------------------------------------------------------------
async function loadCatalog(route: string, requestUrl: string): Promise<Catalog | null> {
  try {
    const slug = routeToSlug(route);
    const url = new URL('/edit-catalogs/' + slug + '.json', requestUrl);
    const res = await fetch(url);
    if (!res.ok) return null;
    try {
      const data = (await res.json()) as Catalog;
      return data;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Prompt builder (D-10). Includes nearestHeading + currentText per element for
// disambiguation. Entries flagged requiresManualSelection are EXCLUDED — Haiku
// can't usefully map to them (CATALOG-04) and they only burn tokens.
// ---------------------------------------------------------------------------
function buildPrompt(route: string, catalog: Catalog, lines: string[]): string {
  const promptEntries = catalog.entries
    .filter((e) => !e.requiresManualSelection)
    .filter((e) => e.currentText || e.nearestHeading || e.i18nKey)
    .map((e) => {
      const heading = e.nearestHeading ? String(e.nearestHeading) : '';
      const text = e.currentText ? String(e.currentText).slice(0, 200) : '';
      return (
        '- id: ' +
        e.id +
        ' | kind: ' +
        e.kind +
        ' | nearestHeading: "' +
        heading +
        '" | currentText: "' +
        text +
        '"'
      );
    })
    .join('\n');

  const numbered = lines.map((line, i) => String(i + 1) + '. ' + line).join('\n');

  return (
    'You are mapping freeform edit requests to specific editable elements on the page ' +
    route +
    '.\n\n' +
    'The page has these editable elements:\n' +
    promptEntries +
    '\n\n' +
    'Match each numbered line below to the most likely element id, with confidence (0..1), and up to 2 alternate ids. ' +
    'If no element is a plausible match, set primaryId to null. Briefly explain each choice in \'reason\'.\n\n' +
    numbered
  );
}

// ---------------------------------------------------------------------------
// Anthropic call (D-10 / D-11 / D-12). Forced tool-use guarantees structured
// output and is the FIRST line of defense against prompt-injection in the
// untrusted editList — Haiku cannot return freeform text that bypasses the
// schema. The SECOND line of defense is server-side ID validation against the
// catalog (validateMatches, D-14).
// ---------------------------------------------------------------------------
async function callAnthropic(
  client: Anthropic,
  prompt: string,
  lineCount: number,
  signal: AbortSignal,
): Promise<any[]> {
  const response: any = await client.messages.create(
    {
      model: 'claude-haiku-4-5',
      max_tokens: Math.min(8192, 64 + 96 * lineCount),
      temperature: 0,
      tools: [
        {
          name: 'match_edits',
          description: 'Map each freeform edit line to a catalog element ID.',
          input_schema: {
            type: 'object',
            properties: {
              matches: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    line: { type: 'string' },
                    primaryId: { type: ['string', 'null'] },
                    primaryConfidence: { type: 'number' },
                    alternates: { type: 'array', items: { type: 'string' }, maxItems: 2 },
                    reason: { type: 'string' },
                  },
                  required: ['line', 'primaryId', 'primaryConfidence', 'alternates', 'reason'],
                },
              },
            },
            required: ['matches'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'match_edits' },
      messages: [{ role: 'user', content: prompt }],
    } as any,
    { signal },
  );

  const content: any[] = Array.isArray(response?.content) ? response.content : [];
  const toolUse = content.find((c: any) => c && c.type === 'tool_use');
  const matches = (toolUse as any)?.input?.matches;
  return Array.isArray(matches) ? matches : [];
}

async function callAnthropicWithRetry(
  client: Anthropic,
  prompt: string,
  lineCount: number,
  signal: AbortSignal,
): Promise<any[]> {
  try {
    return await callAnthropic(client, prompt, lineCount, signal);
  } catch (err: any) {
    const status = Number(err?.status);
    const retriable = status >= 500 || status === 429;
    if (!retriable || ANTHROPIC_MAX_RETRIES < 1) throw err;
    await new Promise((r) => setTimeout(r, 2000)); // D-13 linear backoff
    return await callAnthropic(client, prompt, lineCount, signal);
  }
}

// ---------------------------------------------------------------------------
// Server-side validation (D-14 / MATCH-04).
//   - primaryId must be in the loaded catalog's id set; otherwise → null.
//   - alternates filtered to known IDs; capped at 2.
//   - primaryConfidence clamped to [0, 1]; non-finite → 0.
//   - reason / line coerced to string, defensively truncated.
// ---------------------------------------------------------------------------
function validateMatches(rawMatches: any[], catalogIds: Set<string>): Match[] {
  if (!Array.isArray(rawMatches)) return [];
  const out: Match[] = [];
  for (const m of rawMatches) {
    if (!m || typeof m !== 'object') continue;
    const line = String(m.line ?? '').slice(0, 1000);
    let primaryId: string | null = null;
    if (typeof m.primaryId === 'string' && catalogIds.has(m.primaryId)) {
      primaryId = m.primaryId;
    }
    let primaryConfidence = Number(m.primaryConfidence);
    if (!Number.isFinite(primaryConfidence)) primaryConfidence = 0;
    if (primaryConfidence < 0) primaryConfidence = 0;
    if (primaryConfidence > 1) primaryConfidence = 1;
    const altsRaw: any[] = Array.isArray(m.alternates) ? m.alternates : [];
    const alternates: string[] = [];
    for (const a of altsRaw) {
      if (typeof a === 'string' && catalogIds.has(a) && a !== primaryId) {
        alternates.push(a);
        if (alternates.length >= 2) break;
      }
    }
    const reason = String(m.reason ?? '').slice(0, 500);
    out.push({ line, primaryId, primaryConfidence, alternates, reason });
  }
  return out;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Auth gate — short-circuit BEFORE any work (D-09 / Pattern 4).
    if (!(await checkAuth(request))) return unauthorized();

    // 2. Body parse (Pattern 5).
    let body: any;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid request body' }, 400);
    }

    // 3. Validate body.route — non-empty string, starts with '/', no path-traversal markers.
    const route: unknown = body?.route;
    if (
      typeof route !== 'string' ||
      route.length === 0 ||
      !route.startsWith('/') ||
      route.includes('..') ||
      route.includes('\0')
    ) {
      return json({ ok: false, error: 'Invalid route' }, 422);
    }

    // 4. Validate body.editList — must be a string.
    const editList: unknown = body?.editList;
    if (typeof editList !== 'string') {
      return json({ ok: false, error: 'Invalid editList' }, 422);
    }

    // 5. Cap check #1 — editList ≤ 10000 chars (MATCH-07).
    if (editList.length > MAX_EDIT_LIST_CHARS) {
      return failCap(
        'edit-list-chars',
        MAX_EDIT_LIST_CHARS,
        editList.length,
        'That edit list is too long. Try splitting it into smaller batches.',
      );
    }

    // 6. Tokenize.
    const lines = parseEditList(editList);
    if (lines.length === 0) {
      return json(
        {
          ok: false,
          error: 'empty_edit_list',
          message: 'Add at least one edit before matching.',
        },
        422,
      );
    }

    // 7. Load catalog via same-origin HTTP fetch (BLOCKER-2 fix).
    const catalog = await loadCatalog(route, request.url);
    if (!catalog) {
      return json({ ok: false, error: 'no_catalog', route }, 404);
    }

    // 8. Cap check #2 — catalog ≤ 150 entries (MATCH-07).
    if (Array.isArray(catalog.entries) && catalog.entries.length > MAX_CATALOG_ENTRIES) {
      return failCap(
        'catalog-elements',
        MAX_CATALOG_ENTRIES,
        catalog.entries.length,
        'This page has too many editable elements for one match. Contact Monty.',
      );
    }

    // 9. Degraded mode (D-13 / MATCH-06): missing API key → structured 500.
    //    DO NOT throw — this is graceful degrade, not an error path.
    if (!ANTHROPIC_API_KEY) {
      return json({ ok: false, error: 'matcher_unavailable' }, 500);
    }

    // 10. Anthropic call with 25s AbortController timeout + 1 retry.
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const prompt = buildPrompt(route, catalog, lines);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

    let rawMatches: any[];
    try {
      rawMatches = await callAnthropicWithRetry(
        client,
        prompt,
        lines.length,
        controller.signal,
      );
    } catch {
      // Any post-retry failure → structured matcher_unavailable, NOT generic 500.
      return json({ ok: false, error: 'matcher_unavailable' }, 500);
    } finally {
      clearTimeout(timer);
    }

    // 11. Server-side ID validation (D-14).
    const catalogIds = new Set<string>(
      Array.isArray(catalog.entries) ? catalog.entries.map((e) => e.id) : [],
    );
    const validated = validateMatches(rawMatches, catalogIds);

    // 12. matchSetId + response.
    const matchSetId = 'ms_' + globalThis.crypto.randomUUID();

    return json({
      ok: true,
      matchSetId,
      buildSha: catalog.buildSha,
      matches: validated,
    });
  } catch (err: any) {
    return json({ ok: false, error: err?.message || 'Server error' }, 500);
  }
};
