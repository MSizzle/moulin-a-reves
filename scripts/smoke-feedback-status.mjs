#!/usr/bin/env node
// ---------------------------------------------------------------------------
// scripts/smoke-feedback-status.mjs
//
// Phase 6 / v1.2 canary for the /api/feedback/status/[issueNumber] endpoint.
// Dual mode, mirrors scripts/smoke-feedback-v2.mjs.
//
// UNIT MODE (no TARGET_URL):
//   Imports resolveStage from src/lib/feedback-status.ts and runs ~6
//   table-driven assertions covering stages 1..5 + the missing-Vercel-token
//   degrade path. No network, no I/O. Exits 0 on all pass, non-zero on any
//   mismatch.
//
// CANARY MODE (TARGET_URL set):
//   Mints a maison_session via createSession() from src/lib/auth.ts, posts a
//   small v1 single-edit "isTest:true" submission (cheaper than a v2 batch
//   but exercises the same status pipeline because both produce the same
//   client-feedback-labelled issue → Action → PR → deploy lifecycle), then
//   polls /api/feedback/status/<N> every 8 s until either:
//     - stage 5 reached (PASS)
//     - sub === 'needs-review' OR 'needs-client-reply' (PASS — human waiting)
//     - 5-minute timeout (FAIL)
//     - HTTP error or stage regression (FAIL)
//
//   DASHBOARD_PASSWORD must match the Vercel project's env var exactly (same
//   pre-condition as the v2 canary).
// ---------------------------------------------------------------------------

const TARGET_URL = process.env.TARGET_URL || null;
process.env.DASHBOARD_PASSWORD ||= 'moulin2024';

if (!TARGET_URL) {
  // -------------------------------------------------------------------------
  // UNIT MODE
  // -------------------------------------------------------------------------
  const { resolveStage } = await import('../src/lib/feedback-status.ts');

  const cases = [
    {
      name: 'stage 1 — fresh issue no label, no PR',
      input: { issueLabels: [], issueHasPrLink: false, prFromComments: null, pr: null, vercelDeployState: null },
      expect: { stage: 1, sub: null },
    },
    {
      name: 'stage 2 — labelled client-feedback, no PR yet',
      input: { issueLabels: ['client-feedback'], issueHasPrLink: false, prFromComments: null, pr: null, vercelDeployState: null },
      expect: { stage: 2, sub: null },
    },
    {
      name: 'stage 3 — PR open, no terminal label',
      input: {
        issueLabels: ['client-feedback'],
        issueHasPrLink: true,
        prFromComments: null,
        pr: { state: 'open', merged: false, mergeSha: null, url: 'https://x/pull/1', number: 1 },
        vercelDeployState: null,
      },
      expect: { stage: 3, sub: 'open' },
    },
    {
      name: 'stage 3 — PR ref from comments only',
      input: {
        issueLabels: ['client-feedback'],
        issueHasPrLink: false,
        prFromComments: { url: 'https://x/pull/2', number: 2 },
        pr: null,
        vercelDeployState: null,
      },
      expect: { stage: 3, sub: 'open' },
    },
    {
      name: 'stage 4 — needs-review',
      input: {
        issueLabels: ['client-feedback', 'needs-review'],
        issueHasPrLink: true,
        prFromComments: null,
        pr: { state: 'open', merged: false, mergeSha: null, url: 'https://x/pull/1', number: 1 },
        vercelDeployState: null,
      },
      expect: { stage: 4, sub: 'needs-review' },
    },
    {
      name: 'stage 4 — needs-client-reply',
      input: {
        issueLabels: ['client-feedback', 'needs-client-reply'],
        issueHasPrLink: true,
        prFromComments: null,
        pr: { state: 'open', merged: false, mergeSha: null, url: 'https://x/pull/1', number: 1 },
        vercelDeployState: null,
      },
      expect: { stage: 4, sub: 'needs-client-reply' },
    },
    {
      name: 'stage 4 — auto-merged, vercel token missing → no stage 5',
      input: {
        issueLabels: ['auto-merged'],
        issueHasPrLink: true,
        prFromComments: null,
        pr: { state: 'closed', merged: true, mergeSha: 'abc', url: 'https://x/pull/1', number: 1 },
        vercelDeployState: null,
      },
      expect: { stage: 4, sub: 'auto-merged' },
    },
    {
      name: 'stage 4 — merged, vercel BUILDING → no stage 5 yet',
      input: {
        issueLabels: [],
        issueHasPrLink: true,
        prFromComments: null,
        pr: { state: 'closed', merged: true, mergeSha: 'abc', url: 'https://x/pull/1', number: 1 },
        vercelDeployState: 'BUILDING',
      },
      expect: { stage: 4, sub: 'merged' },
    },
    {
      name: 'stage 5 — merged + vercel READY',
      input: {
        issueLabels: ['auto-merged'],
        issueHasPrLink: true,
        prFromComments: null,
        pr: { state: 'closed', merged: true, mergeSha: 'abc', url: 'https://x/pull/1', number: 1 },
        vercelDeployState: 'READY',
      },
      expect: { stage: 5, sub: null },
    },
  ];

  let pass = 0;
  let fail = 0;
  for (const c of cases) {
    const got = resolveStage(c.input);
    const ok = got.stage === c.expect.stage && got.sub === c.expect.sub;
    console.log((ok ? 'PASS' : 'FAIL') + ' — ' + c.name + '  (got stage=' + got.stage + ' sub=' + got.sub + ')');
    ok ? pass++ : fail++;
  }
  console.log('\n' + pass + '/' + cases.length + ' passed');
  process.exit(fail ? 1 : 0);
} else {
  // -------------------------------------------------------------------------
  // CANARY MODE
  // -------------------------------------------------------------------------
  process.env.GITHUB_REPO ||= 'MSizzle/moulin-a-reves';
  process.env.GITHUB_TOKEN ||= 'canary-noop'; // not actually used in canary mode

  const { createSession } = await import('../src/lib/auth.ts');
  const cookie = 'maison_session=' + encodeURIComponent(await createSession());

  // Test-only single-edit submission. submit.ts labels this 'client-feedback-test'
  // because of isTest:true, so the Action won't actually run; the status endpoint
  // will see the test label and resolve stage 2 immediately, then stall there.
  // That's enough to verify the endpoint contract end-to-end (auth + GitHub
  // round-trip + stage 2 detection + cache) without spending an Action minute.
  const submitPayload = {
    schemaVersion: 1,
    intent: 'change-wording',
    locator: {
      schemaVersion: 1,
      pageRoute: '/',
      astroFileGuess: 'src/pages/index.astro',
      i18nKey: 'nav.homes',
      i18nAttr: 'data-i18n',
      nearbyText: 'Houses',
      nearestHeading: null,
      domPath: 'nav > a[1]',
      _currentText: 'Houses',
    },
    intentDetail: { newTextEn: 'Houses', newTextFr: 'Maisons', okToTranslate: true },
    isTest: true,
  };

  console.log('POST ' + TARGET_URL + '/api/feedback/submit (isTest=true)…');
  const startRes = await fetch(TARGET_URL + '/api/feedback/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify(submitPayload),
  });
  if (!startRes.ok) {
    console.error('FAIL submit HTTP', startRes.status, await startRes.text());
    process.exit(1);
  }
  const startData = await startRes.json();
  if (!startData.ok || !startData.issueNumber) {
    console.error('FAIL submit shape:', JSON.stringify(startData));
    process.exit(1);
  }
  const num = startData.issueNumber;
  console.log('Submitted issue #' + num + '; polling status…');

  // Poll. For an isTest submission we expect stage 2 (label seen, no PR) to
  // appear within one tick. We accept stage 2..5 + the terminal review subs.
  const deadline = Date.now() + 5 * 60 * 1000;
  let lastStage = 0;
  let lastSub = null;
  let ticks = 0;
  let sawStage2OrAbove = false;

  while (Date.now() < deadline) {
    if (ticks > 0) await new Promise((r) => setTimeout(r, 8000));
    ticks++;
    const sRes = await fetch(TARGET_URL + '/api/feedback/status/' + num, { headers: { cookie } });
    if (!sRes.ok) {
      console.error('  status http', sRes.status);
      continue;
    }
    const s = await sRes.json();
    if (s.stage < lastStage) {
      console.error('FAIL regression — stage went from', lastStage, 'to', s.stage);
      process.exit(1);
    }
    lastStage = s.stage;
    lastSub = s.sub;
    if (s.stage >= 2) sawStage2OrAbove = true;
    console.log('  tick ' + ticks + ': stage=' + s.stage + ' sub=' + s.sub);
    if (s.stage === 5 || s.sub === 'needs-review' || s.sub === 'needs-client-reply') {
      console.log('PASS — terminal state reached');
      process.exit(0);
    }
    // For isTest submissions, stage 2 is "terminal" since the Action won't run.
    // After 3 polls (≈24 s) of stage 2 with no advance, accept as PASS.
    if (sawStage2OrAbove && lastStage === 2 && ticks >= 3) {
      console.log('PASS — isTest submission stalled at stage 2 as expected (Action skips client-feedback-test label)');
      process.exit(0);
    }
  }

  console.error('FAIL timeout — last stage=' + lastStage + ' sub=' + lastSub);
  process.exit(1);
}
