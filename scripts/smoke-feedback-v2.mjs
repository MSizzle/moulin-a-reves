#!/usr/bin/env node
// ---------------------------------------------------------------------------
// scripts/smoke-feedback-v2.mjs
//
// Phase 4 merge-gate smoke. Imports POST from src/pages/api/feedback/submit.ts
// (dynamic import), stubs globalThis.fetch with GitHub API mocks, runs 5
// scenarios end-to-end, exits 0 if all pass, non-zero on first failure.
//
// Invoked by Plan 04-08 Task 2 verify.
//
// USAGE
//   npx tsx scripts/smoke-feedback-v2.mjs
//
// The harness imports TypeScript modules (src/pages/api/feedback/submit.ts and
// src/lib/auth.ts) directly via dynamic import. Plain `node` cannot resolve
// .ts extensions, so the canonical invocation goes through tsx. When run via
// plain `node`, the script detects the ERR_UNKNOWN_FILE_EXTENSION /
// ERR_MODULE_NOT_FOUND from the import and prints the fallback command.
//
// SCENARIOS
//   1. v1 back-compat (change-wording, single edit) — HTTP 200 + ok:true.
//   2. v2 happy path (3 valid edits) — HTTP 200; ONE GitHub issue created
//      with title matching `^[Feedback] batch of 3 edits — `.
//   3. v2 edit-cap violation (11 edits) — HTTP 422; cap:'edits', limit:10.
//   4. v2 photo-byte cap violation — HTTP 422; cap:'bytes', limit matches
//      MAX_BATCH_BYTES read directly from submit.ts (scales with D-03).
//   5. v2 per-edit validation error (edit #0 missing newTextEn) — HTTP 422;
//      errors:[{index:0, error:'...'}].
//
// IMPLEMENTATION NOTES
//   - Env vars (GITHUB_TOKEN, GITHUB_REPO, DASHBOARD_PASSWORD) are set on
//     process.env BEFORE the dynamic import of submit.ts. Vite's
//     import.meta.env in tsx/node reflects process.env at module evaluation,
//     so the order matters.
//   - globalThis.fetch is replaced with a routing stub that handles the four
//     GitHub Contents/Issues API surfaces submit.ts hits:
//       GET  /repos/{owner}/{repo}/contents/{path} → 404 (file-not-exists)
//       PUT  /repos/{owner}/{repo}/contents/{path} → 201 with {content:{sha}}
//       POST /repos/{owner}/{repo}/issues         → 201 with {number, html_url}
//       PATCH /repos/{owner}/{repo}/issues/{n}    → 200 with {number}
//     All calls are logged to fetchLog for per-scenario assertions.
//   - The shared module-level fetchLog is cleared between scenarios via
//     resetFetchLog().
//   - createSession() is the real HMAC implementation from src/lib/auth.ts —
//     no shortcut. checkAuth() runs unmodified against the minted cookie.
//   - No new package dependency is introduced. tsx is invoked via npx.
// ---------------------------------------------------------------------------

// --- 1. Environment setup (BEFORE any dynamic import that touches submit.ts) -
process.env.GITHUB_TOKEN ||= 'smoke-token';
process.env.GITHUB_REPO ||= 'MSizzle/moulin-a-reves';
process.env.DASHBOARD_PASSWORD ||= 'smoke-password';

// --- 1a. import.meta.env shim ----------------------------------------------
// Under Astro's Vite build, `import.meta.env.X` is a compile-time replacement
// for `process.env.X`. Under plain tsx/node, `import.meta.env` is `undefined`,
// so any `src/` module that touches `import.meta.env.DASHBOARD_PASSWORD` or
// `import.meta.env.GITHUB_TOKEN` would throw at module evaluation time.
//
// We install a synchronous in-thread hook via `registerHooks()` (Node 24+'s
// non-deprecated replacement for `register()`) that text-rewrites
// `import.meta.env` → `process.env` on every text source load BEFORE the
// dynamic import below. The hook only touches sources that contain the literal
// `import.meta.env` substring, leaves everything else verbatim, and only runs
// inside this harness.
{
  const { registerHooks } = await import('node:module');
  registerHooks({
    load(url, context, nextLoad) {
      const result = nextLoad(url, context);
      if (result && result.format && /^(module|commonjs)$/.test(result.format)) {
        const src = typeof result.source === 'string'
          ? result.source
          : (result.source ? Buffer.from(result.source).toString('utf8') : '');
        if (src && src.indexOf('import.meta.env') !== -1) {
          return { ...result, source: src.replace(/import\.meta\.env/g, 'process.env') };
        }
      }
      return result;
    },
  });
}

// --- 2. Fetch stub framework ------------------------------------------------
const fetchLog = [];
let nextIssueNumber = 1000; // start at 1000 so it's obviously test data
function resetFetchLog() { fetchLog.length = 0; }

const realFetch = globalThis.fetch;

globalThis.fetch = async function stubFetch(input, init = {}) {
  const url = typeof input === 'string' ? input : (input?.url || String(input));
  const method = (init.method || 'GET').toUpperCase();
  const body = typeof init.body === 'string' ? init.body : (init.body ? String(init.body) : '');
  fetchLog.push({ url, method, body });

  // PATCH /repos/{owner}/{repo}/issues/{n}
  if (method === 'PATCH' && /\/repos\/[^/]+\/[^/]+\/issues\/\d+$/.test(url)) {
    const m = url.match(/\/issues\/(\d+)$/);
    const number = m ? Number(m[1]) : 0;
    return new Response(JSON.stringify({ number }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /repos/{owner}/{repo}/issues
  if (method === 'POST' && /\/repos\/[^/]+\/[^/]+\/issues$/.test(url)) {
    const number = nextIssueNumber++;
    return new Response(JSON.stringify({
      number,
      html_url: `https://github.com/MSizzle/moulin-a-reves/issues/${number}`,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // PUT /repos/{owner}/{repo}/contents/{path} (commit upload)
  if (method === 'PUT' && /\/repos\/[^/]+\/[^/]+\/contents\//.test(url)) {
    return new Response(JSON.stringify({ content: { sha: 'mock-sha' } }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // GET /repos/{owner}/{repo}/contents/{path} (sha lookup before PUT)
  if (method === 'GET' && /\/repos\/[^/]+\/[^/]+\/contents\//.test(url)) {
    return new Response(JSON.stringify({ message: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Anything else: fall through with a generic 404 so the test fails loudly
  // rather than silently hitting the real network.
  return new Response(JSON.stringify({ error: 'unhandled in smoke stub: ' + method + ' ' + url }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
};

// --- 3. Import submit.ts + auth.ts via dynamic import -----------------------
let POST, createSession;
try {
  const submitMod = await import('../src/pages/api/feedback/submit.ts');
  POST = submitMod.POST;
  const authMod = await import('../src/lib/auth.ts');
  createSession = authMod.createSession;
} catch (err) {
  // Plain `node` cannot resolve .ts extensions; tell the user how to run us.
  if (
    err && (
      err.code === 'ERR_UNKNOWN_FILE_EXTENSION' ||
      err.code === 'ERR_MODULE_NOT_FOUND' ||
      /Unknown file extension|Cannot find module/i.test(String(err.message || ''))
    )
  ) {
    console.error('Cannot import .ts modules under plain node.');
    console.error('Run via: npx tsx scripts/smoke-feedback-v2.mjs');
    console.error('Underlying error:', err.message);
    process.exit(2);
  }
  console.error('Unexpected import error:', err);
  process.exit(2);
}

if (typeof POST !== 'function') {
  console.error('FAIL: submit.ts did not export POST as a function');
  process.exit(2);
}
if (typeof createSession !== 'function') {
  console.error('FAIL: auth.ts did not export createSession as a function');
  process.exit(2);
}

// --- 4. Request constructor helper ------------------------------------------
async function makeRequest(payload) {
  const token = await createSession();
  return new Request('http://localhost/api/feedback/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: 'maison_session=' + encodeURIComponent(token),
    },
    body: JSON.stringify(payload),
  });
}

// --- 5. Scenario runner -----------------------------------------------------
let passed = 0;
let failed = 0;
const failures = [];

async function run(name, fn) {
  resetFetchLog();
  try {
    await fn();
    console.log('PASS:', name);
    passed++;
  } catch (err) {
    console.error('FAIL:', name, '-', err && err.message ? err.message : String(err));
    failed++;
    failures.push({ name, error: err && err.message ? err.message : String(err) });
  }
}

// --- 6. The five scenarios --------------------------------------------------

// Scenario 1: v1 back-compat (change-wording)
await run('v1 back-compat (change-wording)', async () => {
  const req = await makeRequest({
    schemaVersion: 1,
    intent: 'change-wording',
    pageRoute: '/',
    confirmationAccepted: true,
    intentDetail: { newTextEn: 'Hello world', okToTranslate: true },
    i18nKey: 'home.hero.title',
    i18nAttr: 'data-i18n',
    nearbyText: 'Welcome to the homepage',
    nearestHeading: 'Welcome',
  });
  const res = await POST({ request: req });
  if (res.status !== 200) throw new Error('expected 200, got ' + res.status);
  const body = await res.json();
  if (!body.ok || typeof body.issueNumber !== 'number') {
    throw new Error('bad v1 response: ' + JSON.stringify(body));
  }
  const createCalls = fetchLog.filter((c) => /\/issues$/.test(c.url) && c.method === 'POST');
  if (createCalls.length !== 1) {
    throw new Error('expected 1 createIssue call, got ' + createCalls.length);
  }
  // v1 issue title — sanity check the legacy shape was used (not the batch shape).
  const createBody = JSON.parse(createCalls[0].body);
  if (!/^\[Feedback\] change wording — /.test(createBody.title)) {
    throw new Error('v1 title did not match legacy shape: ' + createBody.title);
  }
});

// Scenario 2: v2 happy path (3 valid edits, no photos)
await run('v2 happy path (3 valid edits)', async () => {
  const edits = [
    {
      intent: 'change-wording', pageRoute: '/', confirmationAccepted: true,
      intentDetail: { newTextEn: 'A', okToTranslate: true },
      i18nKey: 'k1', nearbyText: 'long enough description here for signals',
    },
    {
      intent: 'change-wording', pageRoute: '/about/', confirmationAccepted: true,
      intentDetail: { newTextEn: 'B', okToTranslate: true },
      i18nKey: 'k2', nearbyText: 'long enough description here for signals',
    },
    {
      intent: 'change-wording', pageRoute: '/', confirmationAccepted: true,
      intentDetail: { newTextEn: 'C', okToTranslate: true },
      i18nKey: 'k3', nearbyText: 'long enough description here for signals',
    },
  ];
  const req = await makeRequest({ schemaVersion: 2, batch: true, edits });
  const res = await POST({ request: req });
  if (res.status !== 200) throw new Error('expected 200, got ' + res.status);
  const body = await res.json();
  if (!body.ok || typeof body.issueNumber !== 'number') {
    throw new Error('bad v2 response: ' + JSON.stringify(body));
  }
  const createCalls = fetchLog.filter((c) => /\/issues$/.test(c.url) && c.method === 'POST');
  if (createCalls.length !== 1) {
    throw new Error('expected 1 createIssue, got ' + createCalls.length);
  }
  const createBody = JSON.parse(createCalls[0].body);
  if (!/^\[Feedback\] batch of 3 edits — /.test(createBody.title)) {
    throw new Error('bad batch title: ' + createBody.title);
  }
  if (!Array.isArray(createBody.labels) || !createBody.labels.includes('client-feedback')) {
    throw new Error('bad labels: ' + JSON.stringify(createBody.labels));
  }
  // Issue body should contain three '### Edit i of 3' blocks and exactly one ```json fence.
  const editBlocks = (createBody.body.match(/^### Edit \d+ of 3$/gm) || []).length;
  if (editBlocks !== 3) {
    throw new Error('expected 3 "### Edit i of 3" blocks, got ' + editBlocks);
  }
  const jsonFences = (createBody.body.match(/```json/g) || []).length;
  if (jsonFences !== 1) {
    throw new Error('expected exactly 1 ```json fence, got ' + jsonFences);
  }
  if (!/Autonomy hint:/.test(createBody.body)) {
    throw new Error('missing autonomy hint in issue body');
  }
});

// Scenario 3: v2 cap violation (11 edits)
await run('v2 cap violation: 11 edits', async () => {
  const edits = Array.from({ length: 11 }, (_, i) => ({
    intent: 'change-wording', pageRoute: '/', confirmationAccepted: true,
    intentDetail: { newTextEn: 'x' + i, okToTranslate: true },
    i18nKey: 'k' + i, nearbyText: 'long enough description here for signals',
  }));
  const req = await makeRequest({ schemaVersion: 2, batch: true, edits });
  const res = await POST({ request: req });
  if (res.status !== 422) throw new Error('expected 422, got ' + res.status);
  const body = await res.json();
  if (body.cap !== 'edits' || body.limit !== 10 || body.actual !== 11) {
    throw new Error('bad cap-violation body: ' + JSON.stringify(body));
  }
});

// Scenario 4: v2 photo-byte cap violation (CR-02)
// The cap reads approxDecodedBytes(dataBase64) per edit (CR-02 fix in 04-09).
// Ship a real oversize base64 string so the sum-of-decoded-bytes reducer trips.
await run('v2 cap violation: photo bytes', async () => {
  // Read MAX_BATCH_BYTES from the source so the test scales with D-03 reconciliation.
  const { readFileSync } = await import('node:fs');
  const submitSrc = readFileSync('src/pages/api/feedback/submit.ts', 'utf8');
  const m = submitSrc.match(/const MAX_BATCH_BYTES = (\d+) \* 1024 \* 1024/);
  if (!m) throw new Error('cannot find MAX_BATCH_BYTES in submit.ts');
  const capMB = parseInt(m[1], 10);
  const capBytes = capMB * 1024 * 1024;
  // CR-02: The cap now reads approxDecodedBytes(dataBase64); ship a real oversize
  // base64 string so the sum-of-decoded-bytes reducer trips.
  // Per-edit: length = ceil((capBytes + 1024) * 4/3 / 2) + 4
  // The '+1024' provides margin above capBytes; the '+4' absorbs '=' padding rounding.
  // 'A'.repeat(N) decodes as binary \x00\x00\x00... and is the simplest oversize stub.
  // Two edits are used so the assertion proves the SUM-across-edits reducer works.
  const perEditB64Len = Math.ceil((capBytes + 1024) * 4 / 3 / 2) + 4;
  const bigB64 = 'A'.repeat(perEditB64Len);
  // bytes reflects the actual decoded size for shape-parity with real client payloads.
  const perEditDecodedBytes = Math.floor(bigB64.length * 3 / 4);
  const edits = [
    {
      intent: 'replace-photo', pageRoute: '/', confirmationAccepted: true,
      intentDetail: {},
      image: { present: true, mime: 'image/jpeg', dataBase64: bigB64, bytes: perEditDecodedBytes, originalFilename: 'a.jpg' },
      i18nKey: 'k1', nearbyText: 'long enough description here for signals',
    },
    {
      intent: 'replace-photo', pageRoute: '/', confirmationAccepted: true,
      intentDetail: {},
      image: { present: true, mime: 'image/jpeg', dataBase64: bigB64, bytes: perEditDecodedBytes, originalFilename: 'b.jpg' },
      i18nKey: 'k2', nearbyText: 'long enough description here for signals',
    },
  ];
  const req = await makeRequest({ schemaVersion: 2, batch: true, edits });
  const res = await POST({ request: req });
  if (res.status !== 422) throw new Error('expected 422, got ' + res.status);
  const body = await res.json();
  if (body.cap !== 'bytes' || body.limit !== capBytes) {
    throw new Error('bad cap-violation body (expected cap=bytes limit=' + capBytes + '): ' + JSON.stringify(body));
  }
  if (typeof body.actual !== 'number' || body.actual <= capBytes) {
    throw new Error('expected body.actual > limit, got ' + body.actual);
  }
});

// Scenario 5: v2 per-edit validation error (edit #0 missing newTextEn)
await run('v2 per-edit error', async () => {
  const edits = [
    // Missing newTextEn — should fail per-edit validation.
    {
      intent: 'change-wording', pageRoute: '/', confirmationAccepted: true,
      intentDetail: {},
    },
    // Valid.
    {
      intent: 'change-wording', pageRoute: '/', confirmationAccepted: true,
      intentDetail: { newTextEn: 'X', okToTranslate: true },
    },
  ];
  const req = await makeRequest({ schemaVersion: 2, batch: true, edits });
  const res = await POST({ request: req });
  if (res.status !== 422) throw new Error('expected 422, got ' + res.status);
  const body = await res.json();
  if (!Array.isArray(body.errors)) {
    throw new Error('expected errors array: ' + JSON.stringify(body));
  }
  if (body.errors.length !== 1) {
    throw new Error('expected exactly 1 error entry, got ' + body.errors.length + ': ' + JSON.stringify(body));
  }
  if (body.errors[0].index !== 0) {
    throw new Error('expected errors[0].index === 0: ' + JSON.stringify(body));
  }
  if (!/wording.*required/i.test(body.errors[0].error)) {
    throw new Error('expected wording-required message, got: ' + body.errors[0].error);
  }
});

// --- 7. Final report --------------------------------------------------------
console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  console.error('\nFailing scenarios:');
  for (const f of failures) console.error('  - ' + f.name + ': ' + f.error);
}
// Restore the real fetch (defensive — process is about to exit anyway).
globalThis.fetch = realFetch;
process.exit(failed > 0 ? 1 : 0);
