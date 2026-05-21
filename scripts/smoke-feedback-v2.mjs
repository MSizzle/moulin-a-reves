#!/usr/bin/env node
// ---------------------------------------------------------------------------
// scripts/smoke-feedback-v2.mjs
//
// Phase 4 merge-gate smoke + Phase 5 canary harness (dual-mode).
//
// USAGE (unit mode — no TARGET_URL):
//   npx tsx scripts/smoke-feedback-v2.mjs
//
// USAGE (canary mode — requires TARGET_URL):
//   TARGET_URL=https://www.moulinareves.com npx tsx scripts/smoke-feedback-v2.mjs --canary v1
//   TARGET_URL=https://www.moulinareves.com npx tsx scripts/smoke-feedback-v2.mjs --canary v2
//   TARGET_URL=https://www.moulinareves.com npx tsx scripts/smoke-feedback-v2.mjs
//     (no --canary flag = runs v1 then v2 sequentially per CONTEXT D-02)
//
// Typically invoked via scripts/canary.sh or npm run canary:v1 / canary:v2.
//
// UNIT MODE (TARGET_URL unset):
//   Imports POST from src/pages/api/feedback/submit.ts (dynamic import), stubs
//   globalThis.fetch with GitHub API mocks, runs 5 scenarios end-to-end, exits
//   0 if all pass, non-zero on first failure. Invoked by Plan 04-08 Task 2 verify.
//
// CANARY MODE (TARGET_URL set — Phase 5 OPS-04/OPS-05):
//   Skips the dynamic import of submit.ts, skips globalThis.fetch stub setup.
//   Still dynamically imports createSession from src/lib/auth.ts to mint a valid
//   maison_session cookie for the real endpoint's checkAuth. Scenarios 3-5
//   (cap + validation) are SKIPPED with a SKIP: line — they require the fetch
//   stub + local import and cannot be meaningfully run against the live endpoint.
//   Dispatches runCanaryV1() or runCanaryV2() (or both sequentially) per
//   the --canary flag.
//
//   Per CONTEXT D-01: TARGET_URL semantics — real fetch against the deployed
//   endpoint; no stubbing; auth cookie minted from local DASHBOARD_PASSWORD.
//   Per CONTEXT D-03: DEPLOY_URL defaults to https://www.moulinareves.com in
//   scripts/canary.sh; overridable via env.
//
// SCENARIOS (unit mode only):
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

// --- 0. TARGET_URL / CANARY_KIND detection (D-01, D-03) --------------------
// When TARGET_URL is unset: unit mode (5/5 scenarios, fetch stub, dynamic
// import of submit.ts). When TARGET_URL is set: canary mode (real fetch,
// skip dynamic import of submit.ts, scenarios 3-5 skipped).
const TARGET_URL = process.env.TARGET_URL || null;

// --canary v1 | --canary v2 | (absent)
const _canaryFlagIdx = process.argv.indexOf('--canary');
const CANARY_KIND = _canaryFlagIdx !== -1 ? (process.argv[_canaryFlagIdx + 1] || null) : null;

// --- 1. Environment setup (BEFORE any dynamic import that touches submit.ts) -
process.env.GITHUB_TOKEN ||= 'smoke-token';
process.env.GITHUB_REPO ||= 'MSizzle/moulin-a-reves';
// In unit mode, 'smoke-password' is a deterministic test value (checkAuth runs
// locally against a stub, so any consistent value works).
// In canary mode, DASHBOARD_PASSWORD MUST match the Vercel project env var.
// Auth.ts falls back to 'moulin2024' when unset; the canary respects the same
// fallback so `source .env.local && npm run canary:v1` is optional (not required
// when the Vercel project uses the default password).
if (!TARGET_URL) {
  process.env.DASHBOARD_PASSWORD ||= 'smoke-password';
} else {
  // Canary mode: honour the real env var; fall back to the same default as auth.ts
  process.env.DASHBOARD_PASSWORD ||= 'moulin2024';
}

// ============================================================================
// UNIT MODE — install registerHooks + fetch stub, import submit.ts
// ============================================================================
let POST = null;
let createSession = null;

if (!TARGET_URL) {
  // --- 1a. import.meta.env shim --------------------------------------------
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

  // --- 2. Fetch stub framework (unit mode only) -----------------------------
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

  // --- 3. Import submit.ts + auth.ts via dynamic import (unit mode only) ---
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

  // --- 4. Request constructor helper (unit mode) ----------------------------
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

  // --- 5. Scenario runner ---------------------------------------------------
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

  // --- 6. The five scenarios ------------------------------------------------

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

  // --- 7. Final report (unit mode) ------------------------------------------
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    console.error('\nFailing scenarios:');
    for (const f of failures) console.error('  - ' + f.name + ': ' + f.error);
  }
  // Restore the real fetch (defensive — process is about to exit anyway).
  globalThis.fetch = realFetch;
  process.exit(failed > 0 ? 1 : 0);

} else {
  // ============================================================================
  // CANARY MODE — TARGET_URL is set; real fetch against the live endpoint
  // ============================================================================
  //
  // NOTE: DASHBOARD_PASSWORD must be set locally and MUST match the Vercel
  // project's DASHBOARD_PASSWORD env var. If they differ, checkAuth on the
  // deployed endpoint returns 401, and the canary will fail on auth.
  // Source your local .env.local before running: source .env.local && npm run canary:v1

  // Install the import.meta.env shim even in canary mode — auth.ts reads
  // import.meta.env.DASHBOARD_PASSWORD at module evaluation time, so we
  // must text-rewrite it to process.env before dynamic-importing auth.ts.
  // (We still skip importing submit.ts and the fetch stub — only auth.ts
  // is needed in canary mode.)
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

  // Import createSession from auth.ts — the canary needs a valid maison_session
  // cookie to satisfy checkAuth on the live endpoint. The cookie is HMAC-signed
  // with DASHBOARD_PASSWORD; minting one per invocation is harmless and safe.
  // IMPORTANT: operator's local DASHBOARD_PASSWORD must match the Vercel
  // project's DASHBOARD_PASSWORD env var, otherwise the endpoint returns 401.
  try {
    const authMod = await import('../src/lib/auth.ts');
    createSession = authMod.createSession;
  } catch (err) {
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

  if (typeof createSession !== 'function') {
    console.error('FAIL: auth.ts did not export createSession as a function');
    process.exit(2);
  }

  // --- Canary POST helper ----------------------------------------------------
  // Mints the auth cookie identically to makeRequest() in unit mode, but
  // performs a real fetch to TARGET_URL + '/api/feedback/submit'.
  async function canaryPost(payload) {
    const token = await createSession();
    const res = await fetch(TARGET_URL + '/api/feedback/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // NOTE: cookie value is not logged here (T-05-05 — avoid leaking cookie in output)
        cookie: 'maison_session=' + encodeURIComponent(token),
      },
      body: JSON.stringify(payload),
    });
    return res;
  }

  // --- Scenario runner (canary mode) ----------------------------------------
  let passed = 0;
  let failed = 0;
  const failures = [];

  async function run(name, fn) {
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

  // Scenarios 3-5 are unit-only (require fetch stub + dynamic import).
  // Emit SKIP lines so the canary output is traceable.
  console.log('SKIP: v2 cap violation: 11 edits (unit-mode only — requires fetch stub + dynamic import)');
  console.log('SKIP: v2 cap violation: photo bytes (unit-mode only — requires fetch stub + dynamic import)');
  console.log('SKIP: v2 per-edit error (unit-mode only — requires fetch stub + dynamic import)');

  // ---------------------------------------------------------------------------
  // runCanaryV1: OPS-04 — v1 back-compat canary against the live endpoint.
  // Plan 05-02: full assertion body — HTTP status, response shape, gh issue view
  // title/label/body checks, cleanup via try/finally per CONTEXT D-05/D-07.
  // ---------------------------------------------------------------------------
  const runCanaryV1 = async () => {
    const { execFileSync } = await import('node:child_process');

    // --- Pre-checks: TARGET_URL + gh CLI availability -----------------------
    if (!TARGET_URL) {
      console.error('FAIL: TARGET_URL not set');
      process.exit(2);
    }

    // Build a sanitized env for gh CLI sub-processes: remove GITHUB_TOKEN so
    // that gh falls back to its keyring auth (the smoke harness sets
    // process.env.GITHUB_TOKEN = 'smoke-token' which would override gh's own
    // credential store and cause HTTP 401 on GraphQL calls).
    // eslint-disable-next-line no-unused-vars
    const { GITHUB_TOKEN: _discarded, ...ghEnv } = { ...process.env };
    const ghOpts = { encoding: 'utf8', env: ghEnv };

    try {
      execFileSync('gh', ['--version'], ghOpts);
    } catch (e) {
      console.error('FAIL: gh CLI not available — ' + String(e && e.message ? e.message : e));
      process.exit(2);
    }

    // Outer-scope issueNumber so finally block can close regardless of assertion result.
    let issueNumber = null;
    let assertionsPassed = false;

    const payload = {
      schemaVersion: 1,
      intent: 'change-wording',
      pageRoute: '/',
      confirmationAccepted: true,
      testMode: true,
      intentDetail: {
        newTextEn: 'Canary test edit — Phase 5 verification ' + new Date().toISOString(),
        okToTranslate: true,
      },
      i18nKey: 'home.hero.title',
      i18nAttr: 'data-i18n',
      nearbyText: 'long enough nearby text for at least one locator signal',
      nearestHeading: 'Welcome',
    };

    try {
      // Step 1: POST the payload and assert HTTP 200.
      const response = await canaryPost(payload);
      if (response.status !== 200) {
        const bodyText = await response.text();
        console.error('FAIL: v1 canary expected HTTP 200, got ' + response.status + ' — ' + bodyText);
        throw new Error('HTTP ' + response.status);
      }

      // Step 2: Parse body and assert shape.
      const body = await response.json();
      if (body.ok !== true || typeof body.issueNumber !== 'number' || typeof body.issueUrl !== 'string') {
        console.error('FAIL: v1 canary response shape invalid — ' + JSON.stringify(body));
        throw new Error('bad response shape');
      }

      // Step 3: Log PASS with issue number.
      console.log('PASS: v1 canary HTTP 200 with issueNumber=' + body.issueNumber);

      // Step 4: Capture issue number (finally block needs it).
      issueNumber = body.issueNumber;

      // Step 5: gh issue view to get title, labels, body.
      const ghJson = execFileSync('gh', [
        'issue', 'view', String(issueNumber),
        '--json', 'title,labels,body',
        '--repo', 'MSizzle/moulin-a-reves',
      ], ghOpts);
      const issue = JSON.parse(ghJson);

      // Step 6: Assert title starts with expected v1 prefix.
      if (!issue.title.startsWith('[TEST] [Feedback] change wording — ')) {
        console.error('FAIL: v1 canary issue title mismatch — got: ' + issue.title);
        throw new Error('title mismatch');
      }

      // Step 7: Assert labels contain client-feedback-test.
      const labelNames = Array.isArray(issue.labels)
        ? issue.labels.map((l) => (typeof l === 'string' ? l : l.name))
        : [];
      if (!labelNames.includes('client-feedback-test')) {
        console.error('FAIL: v1 canary issue missing client-feedback-test label — got: ' + JSON.stringify(labelNames));
        throw new Error('label mismatch');
      }

      // Step 8: Assert issue body does NOT contain batch-shape prefix.
      if (issue.body && issue.body.includes('[Feedback] batch of')) {
        console.error('FAIL: v1 canary issue body contains batch prefix (wrong dispatch arm) — first 200 chars: ' + String(issue.body).slice(0, 200));
        throw new Error('batch shape detected in v1 issue body');
      }

      // Step 9: Log PASS for body shape assertion.
      console.log('PASS: v1 canary issue body matches single-edit shape');

      assertionsPassed = true;
    } finally {
      // Cleanup: close the test issue regardless of assertion outcome.
      if (issueNumber !== null) {
        try {
          execFileSync('gh', [
            'issue', 'comment', String(issueNumber),
            '--repo', 'MSizzle/moulin-a-reves',
            '--body', 'Closed by canary — Phase 5 OPS-04 verification (' + new Date().toISOString() + ')',
          ], ghOpts);
        } catch (e) {
          const msg = 'WARN: cleanup partial — issue ' + issueNumber + ' may need manual close (comment failed): ' + String(e && e.message ? e.message : e);
          console.warn(msg);
          if (assertionsPassed) process.exitCode = 3;
        }
        try {
          execFileSync('gh', [
            'issue', 'close', String(issueNumber),
            '--repo', 'MSizzle/moulin-a-reves',
          ], ghOpts);
        } catch (e) {
          const msg = 'WARN: cleanup partial — issue ' + issueNumber + ' may need manual close (close failed): ' + String(e && e.message ? e.message : e);
          console.warn(msg);
          if (assertionsPassed) process.exitCode = 3;
        }
      }
    }

    if (assertionsPassed) {
      console.log('=== v1 canary: PASS ===');
    } else {
      console.error('=== v1 canary: FAIL ===');
      throw new Error('v1 canary assertions failed');
    }
  };

  // ---------------------------------------------------------------------------
  // runCanaryV2: OPS-05 — v2 batch canary against the live endpoint.
  // Plan 05-03: full assertion body — DRY_RUN pre-check, batch POST, issue
  // shape assertions, PR poll (with result-comment proof), cache-bust proof,
  // asset HEAD probe, full cleanup via try/finally per CONTEXT D-05/D-06/D-07.
  // ---------------------------------------------------------------------------
  const runCanaryV2 = async () => {
    const { execFileSync } = await import('node:child_process');

    // Build a sanitized env for gh CLI sub-processes: remove GITHUB_TOKEN so
    // that gh falls back to its keyring auth (the smoke harness sets
    // process.env.GITHUB_TOKEN = 'smoke-token' which would override gh's own
    // credential store and cause HTTP 401 on real GitHub API calls).
    // eslint-disable-next-line no-unused-vars
    const { GITHUB_TOKEN: _discarded, ...ghEnv } = { ...process.env };
    const ghOpts = { encoding: 'utf8', env: ghEnv };

    // =========================================================================
    // Phase A — Pre-flight gates (non-state-mutating, run BEFORE any mutation)
    // =========================================================================

    // A1: TARGET_URL must be set (checked implicitly by the outer else branch,
    //     but guard here for clarity in runCanaryV2-only invocations).
    if (!TARGET_URL) {
      console.error('FAIL: TARGET_URL not set — cannot run v2 canary');
      process.exit(2);
    }

    // A2: gh CLI must be available.
    try {
      execFileSync('gh', ['--version'], ghOpts);
    } catch (e) {
      console.error('FAIL: gh CLI not available — ' + String(e && e.message ? e.message : e));
      process.exit(2);
    }

    // A3: DRY_RUN repo variable must be exactly the literal string 'true'.
    //     Per CONTEXT D-06: do NOT auto-set DRY_RUN — it is an operator-owned
    //     safety toggle. Without DRY_RUN=true the Action would squash-merge the
    //     canary's test PR into main, polluting the codebase with canary text.
    let dryRunValue = '';
    try {
      dryRunValue = execFileSync('gh', ['variable', 'get', 'DRY_RUN'], ghOpts).trim();
    } catch (e) {
      console.error('FAIL: could not read DRY_RUN repo variable — ' + String(e && e.message ? e.message : e));
      process.exit(2);
    }
    if (dryRunValue !== 'true') {
      console.error(
        'FAIL: DRY_RUN repo variable is "' + dryRunValue + '" but must be "true" for the v2 canary. ' +
        'Run: gh variable set DRY_RUN -b true (then re-run this canary). ' +
        'Do NOT remove this safety check — without DRY_RUN=true the Action will squash-merge the canary\'s test PR into main.'
      );
      process.exit(2);
    }

    // Resolve owner/repo dynamically so cleanup is never hardcoded.
    // Per plan-checker concern #8: derive from gh repo view, do not hardcode.
    let ownerRepo = 'MSizzle/moulin-a-reves';
    try {
      ownerRepo = execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'], ghOpts).trim();
    } catch (e) {
      // Non-fatal — fall back to the known value; log a warning.
      console.warn('WARN: could not resolve nameWithOwner dynamically, using default: ' + ownerRepo);
    }

    // =========================================================================
    // Phase B — Payload POST (state mutation begins here)
    // Everything from here through Phase F runs inside try/finally.
    // =========================================================================

    const tsSuffix = new Date().toISOString();

    // Fake i18nKey values are intentional — the canary verifies the pipeline
    // mechanics (issue creation, Action fire, PR open, result comment, autonomy
    // hint, cache-bust proof), not edit application. The Action may label the
    // issue needs-review after locator resolution; that is an acceptable OPS-05
    // outcome. The autonomy hint at issue creation time still says AUTO-ELIGIBLE
    // because the per-edit signal-count gate uses presence-of-i18nKey, not
    // validity-of-i18nKey.
    const edits = [
      {
        intent: 'change-wording',
        pageRoute: '/',
        confirmationAccepted: true,
        intentDetail: {
          newTextEn: 'Canary v2 edit 1 — Phase 5 verification ' + tsSuffix,
          okToTranslate: true,
        },
        i18nKey: 'home.canary.test1',
        i18nAttr: 'data-i18n',
        nearbyText: 'long enough nearby text for at least one locator signal for canary v2 testing',
        nearestHeading: 'Welcome',
      },
      {
        intent: 'change-wording',
        pageRoute: '/the-compound/',
        confirmationAccepted: true,
        intentDetail: {
          newTextEn: 'Canary v2 edit 2 — Phase 5 verification ' + tsSuffix,
          okToTranslate: true,
        },
        i18nKey: 'compound.canary.test2',
        i18nAttr: 'data-i18n',
        nearbyText: 'long enough nearby text for at least one locator signal for canary v2 testing',
        nearestHeading: 'The Compound',
      },
    ];

    // Outer-scope state — needed by Phase D (assertions), Phase F (cleanup),
    // and Task 2 (evidence file).
    let issueNumber = null;
    let prNumber = null;
    let prBranch = null;
    let assertionsPassed = false;

    try {
      // B3: POST the payload via the canaryPost helper.
      const response = await canaryPost({ schemaVersion: 2, batch: true, edits });
      if (response.status !== 200) {
        const bodyText = await response.text();
        console.error('FAIL: v2 canary expected HTTP 200, got ' + response.status + ' — ' + bodyText);
        throw new Error('HTTP ' + response.status);
      }

      // B4: Parse response body and assert shape.
      const body = await response.json();
      if (body.ok !== true || typeof body.issueNumber !== 'number' || typeof body.issueUrl !== 'string') {
        console.error('FAIL: v2 canary response shape invalid — ' + JSON.stringify(body));
        throw new Error('bad response shape');
      }

      // B5: Capture issueNumber to outer scope.
      issueNumber = body.issueNumber;
      console.log('PASS: v2 canary HTTP 200 with issueNumber=' + issueNumber);

      // =========================================================================
      // Phase C — Issue shape assertions
      // =========================================================================

      // C1: Fetch issue JSON via gh CLI.
      const ghJson = execFileSync('gh', [
        'issue', 'view', String(issueNumber),
        '--json', 'title,labels,body',
        '--repo', ownerRepo,
      ], ghOpts);
      const issue = JSON.parse(ghJson);

      // C2: Assert title matches batch shape (NOT [TEST] prefix, NOT single-edit shape).
      if (!/^\[Feedback\] batch of \d+ edits — /.test(issue.title)) {
        console.error('FAIL: v2 canary issue title does not match batch shape — got: ' + issue.title);
        throw new Error('title mismatch');
      }

      // C3: Assert label is 'client-feedback' (NOT 'client-feedback-test').
      const labelNames = Array.isArray(issue.labels)
        ? issue.labels.map((l) => (typeof l === 'string' ? l : l.name))
        : [];
      if (!labelNames.includes('client-feedback')) {
        console.error('FAIL: v2 canary issue missing client-feedback label — got: ' + JSON.stringify(labelNames));
        throw new Error('label mismatch');
      }

      // C4: Assert exactly ONE fenced JSON block in issue body.
      const jsonFenceRegex = new RegExp(String.fromCharCode(96).repeat(3) + 'json', 'g');
      const fenceMatches = issue.body.match(jsonFenceRegex) || [];
      if (fenceMatches.length !== 1) {
        console.error('FAIL: v2 canary issue body has ' + fenceMatches.length + ' json fences, expected exactly 1');
        throw new Error('json fence count mismatch');
      }

      // C5: Assert AUTO-ELIGIBLE autonomy hint.
      if (!issue.body.includes('Autonomy hint: AUTO-ELIGIBLE')) {
        console.error('FAIL: expected AUTO-ELIGIBLE autonomy hint, got: ' + String(issue.body).slice(0, 300));
        throw new Error('autonomy hint mismatch');
      }

      // C6: Log PASS for issue shape.
      console.log('PASS: v2 canary issue body matches batch shape (title + single json fence + AUTO-ELIGIBLE hint)');

      // =========================================================================
      // Phase D — PR poll + result-comment poll
      // =========================================================================

      const N = issueNumber;
      const M = edits.length; // 2
      const expectedBranchPrefix = 'feedback/issue-' + N + '-batch-' + M;
      const POLL_INTERVAL_MS = 10000;
      const POLL_CAP_MS = 5 * 60000;
      const pollStart = Date.now();

      // Poll for PR creation (10s intervals, 5min cap).
      while (Date.now() - pollStart < POLL_CAP_MS) {
        try {
          const prListJson = execFileSync('gh', [
            'pr', 'list',
            '--state', 'open',
            '--json', 'number,headRefName',
            '--search', 'head:' + expectedBranchPrefix,
          ], ghOpts);
          const prs = JSON.parse(prListJson);
          // Accept exact prefix match OR any branch that starts with feedback/issue-<N>-
          const found = prs.find(
            (pr) => pr.headRefName === expectedBranchPrefix ||
                    pr.headRefName.startsWith('feedback/issue-' + N + '-')
          );
          if (found) {
            prNumber = found.number;
            prBranch = found.headRefName;
            break;
          }
        } catch (_e) {
          // gh pr list can transiently fail — keep polling.
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      if (prNumber === null) {
        console.error(
          'FAIL: v2 canary timed out waiting for PR creation (5min). ' +
          'Check Action logs at https://github.com/' + ownerRepo + '/actions for issue ' + N + '.'
        );
        throw new Error('PR poll timeout');
      }

      console.log('PASS: PR opened at branch ' + prBranch + ', PR #' + prNumber);

      // Poll for result comment (up to 120s after PR found — the Always-post step
      // fires after the Claude step completes, which can take up to 90s more).
      // Accept any of the four possible phrasings from claude.yml:143-152:
      //   - "Dry run" (auto-approved + DRY_RUN=true, claude.yml:145)
      //   - "needs a person to look at it" (needs-review path, claude.yml:150)
      //   - "needs-client-reply" (clarification path, claude.yml:148)
      //   - "This feedback was processed" (fallback when Claude step errors AFTER
      //     creating the PR and labeling — proves the Always-post mechanic fires)
      // All four phrasings prove the result-comment mechanic works.
      const commentPollStart = Date.now();
      const COMMENT_POLL_CAP_MS = 3 * 60000; // 3 min — Action takes 90-150s to process
      let resultCommentFound = false;
      let resultCommentBody = '';

      while (Date.now() - commentPollStart < COMMENT_POLL_CAP_MS) {
        try {
          const commentBodies = execFileSync('gh', [
            'issue', 'view', String(N),
            '--json', 'comments',
            '--jq', '.comments[].body',
          ], ghOpts);
          if (
            commentBodies.includes('Dry run') ||
            commentBodies.includes('needs a person to look at it') ||
            commentBodies.includes('needs one quick clarification') ||
            commentBodies.includes('This feedback was processed')
          ) {
            resultCommentFound = true;
            resultCommentBody = commentBodies;
            break;
          }
        } catch (_e) {
          // Transient — keep polling.
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      if (!resultCommentFound) {
        console.error('FAIL: no result comment on issue ' + N + ' within 3min of PR creation.');
        throw new Error('result comment poll timeout');
      }

      console.log('PASS: result comment posted on issue ' + N);

      // =========================================================================
      // Phase E — Cache-bust proof + asset HEAD probe
      // =========================================================================

      // E1: curl -sL the deployed root URL and assert feedbackVer = "3" in HTML.
      const html = execFileSync('curl', ['-sL', TARGET_URL + '/'], ghOpts);
      if (!html.includes('const feedbackVer = "3"')) {
        console.error(
          'FAIL: cache-bust grep — expected \'const feedbackVer = "3"\' in deployed HTML; got: ' +
          String(html).slice(0, 1000)
        );
        throw new Error('cache-bust grep failed');
      }
      console.log('PASS: cache-bust grep — const feedbackVer = "3" present in deployed HTML');

      // E2: curl -sI the asset URL and assert HTTP 200.
      const headResp = execFileSync('curl', ['-sI', TARGET_URL + '/feedback-inject.js?v=3'], ghOpts);
      const firstLine = String(headResp).split('\n')[0].trim();
      if (!/^HTTP\/[12](\.[01])?\s+200/.test(firstLine)) {
        console.error('FAIL: asset HEAD — expected 200, got: ' + firstLine);
        throw new Error('asset HEAD probe failed');
      }
      console.log('PASS: asset HEAD — /feedback-inject.js?v=3 returned 200');

      assertionsPassed = true;

    } finally {
      // =======================================================================
      // Phase F — Cleanup (MANDATORY per CONTEXT D-07, runs even on failure)
      // Order: close PR FIRST (GitHub rejects branch delete if PR open).
      // =======================================================================
      const errs = [];

      // F1: Close the PR (must happen before branch delete).
      if (prNumber !== null) {
        try {
          execFileSync('gh', [
            'pr', 'close', String(prNumber),
            '--comment', 'Closed by canary — Phase 5 OPS-05 verification (' + new Date().toISOString() + ')',
          ], ghOpts);
        } catch (e) {
          errs.push('PR close failed (pr #' + prNumber + '): ' + String(e && e.message ? e.message : e));
        }
      }

      // F2: Wait 2s for GitHub to process the PR close before branch delete.
      if (prBranch !== null) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // F3: Delete the remote branch (primary: git push --delete; fallback: gh api).
        try {
          execFileSync('git', ['push', '--delete', 'origin', prBranch], ghOpts);
        } catch (_gitErr) {
          // Fallback: gh api DELETE refs/heads/<branch>
          try {
            execFileSync('gh', [
              'api',
              'repos/' + ownerRepo + '/git/refs/heads/' + prBranch,
              '-X', 'DELETE',
            ], ghOpts);
          } catch (e) {
            errs.push('branch delete failed (' + prBranch + '): ' + String(e && e.message ? e.message : e));
          }
        }
      }

      // F4: Close the issue with a cleanup comment.
      if (issueNumber !== null) {
        try {
          execFileSync('gh', [
            'issue', 'comment', String(issueNumber),
            '--body', 'Closed by canary — Phase 5 OPS-05 verification (' + new Date().toISOString() + ')',
            '--repo', ownerRepo,
          ], ghOpts);
        } catch (e) {
          errs.push('issue comment failed (issue #' + issueNumber + '): ' + String(e && e.message ? e.message : e));
        }
        try {
          execFileSync('gh', [
            'issue', 'close', String(issueNumber),
            '--repo', ownerRepo,
          ], ghOpts);
        } catch (e) {
          errs.push('issue close failed (issue #' + issueNumber + '): ' + String(e && e.message ? e.message : e));
        }
      }

      // Exit semantics:
      //   exit 0 — assertions PASS + cleanup PASS
      //   exit 1 — assertion failed (thrown from try block)
      //   exit 2 — pre-flight gate failed (gh not on PATH, DRY_RUN not true, etc.)
      //   exit 3 — assertions PASS but cleanup partial (operator must verify)
      if (assertionsPassed) {
        if (errs.length === 0) {
          console.log('PASS: cleanup — PR #' + prNumber + ' closed, branch ' + prBranch + ' deleted, issue #' + issueNumber + ' closed');
          console.log('=== v2 canary: PASS ===');
          process.exit(0);
        } else {
          console.warn('WARN: cleanup partial — manual action required:');
          for (const err of errs) console.warn('  ' + err);
          console.log('=== v2 canary: PASS (cleanup partial) ===');
          process.exit(3);
        }
      } else {
        console.error('=== v2 canary: FAIL ===');
        process.exit(1);
      }
    }
  };

  // --- Dispatch based on CANARY_KIND ----------------------------------------
  if (CANARY_KIND === 'v1') {
    await run('canary v1 (OPS-04)', runCanaryV1);
  } else if (CANARY_KIND === 'v2') {
    await run('canary v2 (OPS-05)', runCanaryV2);
  } else {
    // No --canary flag: run both sequentially per D-02
    await run('canary v1 (OPS-04)', runCanaryV1);
    await run('canary v2 (OPS-05)', runCanaryV2);
  }

  // --- Final report (canary mode) -------------------------------------------
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    console.error('\nFailing canary scenarios:');
    for (const f of failures) console.error('  - ' + f.name + ': ' + f.error);
  }
  process.exit(failed > 0 ? 1 : 0);
}
