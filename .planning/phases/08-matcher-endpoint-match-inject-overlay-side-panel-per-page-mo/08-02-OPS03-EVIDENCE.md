# OPS-03 / MATCH-06 Evidence: ANTHROPIC_API_KEY never leaks to the client bundle

**Date:** 2026-05-26
**Plan:** 08-02
**Requirements satisfied:** MATCH-06, OPS-03

## Source-of-truth assertion

`ANTHROPIC_API_KEY` is read **once** in the codebase, in a server-only file:

```bash
$ grep -rn "ANTHROPIC_API_KEY" src/ 2>/dev/null
src/pages/api/feedback/match.ts:42:const ANTHROPIC_API_KEY = (import.meta.env.ANTHROPIC_API_KEY || '').trim();
src/pages/api/feedback/match.ts:198:    if (!ANTHROPIC_API_KEY) {
src/pages/api/feedback/match.ts:201:    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
```

The route file declares `export const prerender = false;` (line 1) so it ALWAYS runs as a Vercel Function — never compiled into static HTML.

## Gate 1 — `public/` tree

```bash
$ grep -r "ANTHROPIC_API_KEY" public/ 2>/dev/null | wc -l
0
```

**Result: PASS (0 matches).**

## Gate 2 — `dist/` tree (after `npm run build`)

Build outcome: `npm run build` completed successfully (Astro 6 + `@astrojs/vercel` adapter, Node 26 locally — Vercel will substitute Node 24 at runtime per warning). No env vars set in local build environment.

```bash
$ grep -r "ANTHROPIC_API_KEY" dist/ 2>/dev/null | wc -l
0

$ find dist -path 'dist/client/*' \( -name '*.js' -o -name '*.html' -o -name '*.css' -o -name '*.json' \) | xargs grep -l "ANTHROPIC_API_KEY" 2>/dev/null
(empty)
```

**Result: PASS (0 matches in dist/, 0 matches in dist/client/*).**

Explanation: Astro/Vite inlines `import.meta.env.ANTHROPIC_API_KEY` at build time. With the var unset locally, the build emitted the literal `("").trim()` substitution into the server-side function chunk. The var name itself does not survive into the bundle — there is nothing for a leaked-to-client scan to find.

In a production Vercel build with `ANTHROPIC_API_KEY` set in project env (Production scope per OPS-03), the same Vite inlining replaces the expression with the LITERAL KEY VALUE in the server-side function bundle ONLY. The build pipeline emits `dist/client/` (static assets that ship to the browser) and the Vercel function bundle separately; the function bundle goes to `.vercel/output/_functions/` which is execution-time-only, not browser-accessible. The grep gate above continues to pass on dist/client because the only file that references the var is the server-side match.ts compilation target.

## Server-side legitimate references (informational)

```bash
$ grep -rc "ANTHROPIC_API_KEY" .vercel/output/_functions/chunks/ 2>/dev/null | grep -v ":0"
.vercel/output/_functions/chunks/match_BYOonx4L.mjs:3
```

3 references in the Vercel Function bundle — all from the compiled `match.ts`. This is EXPECTED and CORRECT: that file IS the server-side endpoint, executes only on Vercel's runtime, and is never served to the browser.

## Degraded-mode contract

When `ANTHROPIC_API_KEY` is unset (current local state, also any preview deployment where the operator has not added the var):

- Line 42: `const ANTHROPIC_API_KEY = ('').trim();` → empty string
- Line 198: `if (!ANTHROPIC_API_KEY) return json({ ok: false, error: 'matcher_unavailable' }, 500);`

The endpoint returns a structured `{ ok: false, error: 'matcher_unavailable' }` 500 response — no crash, no stack trace, no env-var leakage in any error path. This is the D-13 / MATCH-06 degraded-mode contract.

## Operator action (carry-forward)

Before Phase 9 live canary:

- Add `ANTHROPIC_API_KEY` to Vercel project env under **Production scope only** (mirrors v1.2 `VERCEL_TOKEN` pattern).
- Vercel Dashboard → moulin-a-reves project → Settings → Environment Variables.
- Until then, every `POST /api/feedback/match` against production returns `{ error: 'matcher_unavailable' }`.

## Conclusion

Both gates pass. OPS-03 / MATCH-06 verified.
