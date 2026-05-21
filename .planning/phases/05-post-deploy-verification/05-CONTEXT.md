# Phase 5: Post-Deploy Verification - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning
**Source:** Auto-decisions (full-auto mode); operator confirmed all 4 gray-area options as recommended by the integration check (`.planning/v1.1-MILESTONE-AUDIT.md`).

<domain>
## Phase Boundary

After Phase 4's batch-pipeline implementation PR shipped to `main` (commit `57b24d6`, pushed 2026-05-21) and Vercel auto-deployed `feedback-inject.js?v=3` to `www.moulinareves.com`, prove on the LIVE deployment that:

1. **OPS-04** — A `schemaVersion: 1` regression canary against the deployed `/api/feedback/submit` still produces the existing single-edit issue path (cached browsers will not break).
2. **OPS-05** — A `schemaVersion: 2, batch: true` canary produces exactly ONE GitHub issue with all edits in the JSON block, ONE Claude PR with all edits applied, the autonomy verdict matches expectation, and the browser network tab confirms `feedback-inject.js?v=3` is fetched (cache-bust verified end-to-end).

**Scope is the canary tooling + one successful canary run, not ongoing regression infrastructure.** The canary scripts ship to `scripts/` and are opt-in via `npm run canary:v1` / `canary:v2`. No GitHub workflow auto-triggers them.

Live-deploy already confirmed during discuss (2026-05-21): HTTP 200 at `https://www.moulinareves.com/`, and the deployed HTML contains `const feedbackVer = "3"` in the inline `?feedback=1` loader block. The Phase 4 cache-bust took effect.

</domain>

<decisions>
## Implementation Decisions

> **No SPEC.md exists for this phase.** The 2 locked requirements are in `.planning/REQUIREMENTS.md` (OPS-04, OPS-05) with explicit success-criteria wording in `.planning/ROADMAP.md` Phase 5 entry. Downstream agents MUST read both before planning. Phase 4's `04-CONTEXT.md` decisions carry forward (D-03 through D-19); the most relevant carry-forwards are listed under "Carry-Forward" below.

### Canary harness shape

- **D-01:** **Extend `scripts/smoke-feedback-v2.mjs` with a `TARGET_URL` env-var mode.** When `TARGET_URL` is unset, the harness runs as today (5/5 unit-mode scenarios, GitHub `globalThis.fetch` stubbed, dynamic import of `submit.ts`). When `TARGET_URL` is set (e.g., `TARGET_URL=https://www.moulinareves.com`), the harness:
    - Skips the dynamic import of `submit.ts` and the `globalThis.fetch` stub setup
    - Makes real `fetch(TARGET_URL + '/api/feedback/submit', { method: 'POST', headers: {...}, body: JSON.stringify(payload) })` calls
    - Asserts on the live HTTP response (status code, `ok` field, `issueNumber` field, `error`/`cap`/`commitErrors` shape)
    - For OPS-05's PR/Action-level proof, additionally uses `gh` CLI (already on the system per the existing feedback pipeline) to query `gh issue view <N>`, `gh pr list --head feedback/issue-<N>-batch-<M>`, and `gh pr view <N>`
    - Reports each step as `PASS: <description>` or `FAIL: <reason>` (mirror existing harness convention)

- **D-02:** **Add `scripts/canary.sh` as a thin bash wrapper** so OPS-04's "curl-style" ROADMAP wording is literally honoured. The wrapper accepts `v1` or `v2` and exec's the harness:
    ```
    scripts/canary.sh v1   → TARGET_URL=$DEPLOY_URL npx tsx scripts/smoke-feedback-v2.mjs --canary v1
    scripts/canary.sh v2   → TARGET_URL=$DEPLOY_URL npx tsx scripts/smoke-feedback-v2.mjs --canary v2
    ```
    The harness gains two flags: `--canary v1` (runs only the v1 single-edit canary against TARGET_URL) and `--canary v2` (runs only the v2 batched canary against TARGET_URL). When no `--canary` flag is given AND `TARGET_URL` is set, run both v1 and v2 sequentially.

- **D-03:** **`DEPLOY_URL` defaults to `https://www.moulinareves.com`** inside `canary.sh` but is overridable via env var. Useful for testing against Vercel preview URLs in future (out of scope for Phase 5 first run).

- **D-04:** **Add npm scripts** in `package.json` `scripts` section:
    - `"canary:v1": "scripts/canary.sh v1"`
    - `"canary:v2": "scripts/canary.sh v2"`
    - `"canary": "scripts/canary.sh"` (runs both)

  These are opt-in. No auto-trigger. (Lifecycle decision D-08 below.)

### OPS-05 isolation seam

- **D-05:** **Use `DRY_RUN=true` repo variable + real `client-feedback` label.** The canary opens a REAL `client-feedback`-labelled issue against the deployed `/api/feedback/submit` so the Claude Action (`.github/workflows/claude.yml`) actually fires, follows `.github/CLAUDE_FEEDBACK.md §8`, creates the batch branch, opens the PR, posts the result comment — but halts at the squash-merge step because `DRY_RUN=true` (per integration check finding: `claude.yml:55/122/145` gates merge on `DRY_RUN`).

  Rationale: this proves the full E2E (issue → Action → PR + result comment + autonomy verdict) without leaving an actual diff merged into `main`. The `client-feedback-test` alternative was rejected because it would skip the Action entirely and therefore fail to prove OPS-05's "ONE Claude PR with all edits applied" success criterion.

- **D-06:** **Canary script must verify `DRY_RUN` is already set to `true` BEFORE creating the issue.** If not set, abort with an explicit error message instructing the operator to run `gh variable set DRY_RUN -b true` first. Do NOT auto-set DRY_RUN — that is an operator-owned safety toggle, not the canary's role.

- **D-07:** **Canary script performs cleanup after verification (idempotent end-state):**
    - `gh issue comment <N> --body "Closed by canary — Phase 5 verification ($(date -u +%FT%TZ))"`
    - `gh issue close <N>`
    - `gh pr close <N>` (if the Action created one; closing the PR is required even though it's not merged)
    - `git push --delete origin feedback/issue-<N>-batch-<M>` (delete the test branch from remote; if `git` is not authenticated for push, fall back to `gh api repos/:owner/:repo/git/refs/heads/feedback/issue-<N>-batch-<M> -X DELETE`)
    - DRY_RUN is NOT unset by the canary — that is the operator's choice (probably leave it on permanently as a safety net for future Action runs).
  Cleanup runs in a `try { … } finally { cleanup() }` pattern so a mid-canary assertion failure still tears down the test artifacts.

### Cache-bust proof capture

- **D-08:** **Automated `curl + grep` for `const feedbackVer = "3"` in the deployed HTML.** The exact pattern lives in the inline `?feedback=1` loader block emitted by `src/layouts/BaseLayout.astro:1024-1033` via `<script is:inline define:vars={{ feedbackVer: FEEDBACK_INJECT_VER }}>`. When Astro renders to HTML, the `define:vars` interpolation produces a literal `const feedbackVer = "3";` JS statement in the served HTML. The canary's assertion:
    ```
    curl -sL "${DEPLOY_URL}/" | grep -oE 'const feedbackVer = "[0-9]+"'
    Expected: const feedbackVer = "3"
    Fail:    if value is "2" or missing — Vercel CDN cache still stale or deploy didn't land
    ```
    This was confirmed live during discuss-phase (2026-05-21 17:00 UTC): `const feedbackVer = "3"` is already in the deployed HTML.

- **D-09:** **No headless browser (Playwright / Puppeteer) needed.** OPS-05's success criterion wording mentions "browser network tab" but the spirit is "proves the new version is being served," which `curl + grep` of the HTML source proves equivalently. The integration check explicitly recommended (b) over (c) to avoid adding a runtime dev dep. If a future requirement demands real-browser fidelity (e.g., proving service-worker cache invalidation), revisit in v1.2.

- **D-10:** **Additionally HEAD-probe `/feedback-inject.js?v=3`** to confirm the file is reachable at that URL (200, not 404). This catches the edge case where the HTML references v=3 but the asset path returns 404 because of a build/deploy seam issue. `curl -sI "${DEPLOY_URL}/feedback-inject.js?v=3"` → expect `HTTP/2 200`.

### Canary lifecycle after Phase 5

- **D-11:** **Scripts sit dormant in `scripts/`.** Opt-in via `npm run canary:v1` / `canary:v2` / `canary`. No GitHub workflow auto-triggers them. No cron. The user runs canary when they want a regression net (e.g., after any future modification to `feedback-inject.js`, `submit.ts`, or `feedback-version.ts`).

- **D-12:** **No new `.github/workflows/*.yml` files in Phase 5.** Auto-canary-on-deploy is deferred to a hypothetical v1.2 — adding it now is scope creep relative to the ROADMAP (which says "After deploy, a … canary verifies …" — implying one-shot verification, not a persistent regression suite).

### Carry-Forward from Phase 4 (apply to canaries)

- **D-13 (from 04-CONTEXT.md D-15):** **Shared validator mirror is enforced by the endpoint itself.** Canaries hit `/api/feedback/submit` and BOTH v1 and v2 paths run through `validateEdit` from `src/pages/api/feedback/validate.ts`. The canary does not bypass; it exercises the production wiring.
- **D-14 (from 04-CONTEXT.md D-13):** **OPS-02 fence intact through Phase 5.** Phase 5 modifies `scripts/`, `package.json`, and optionally `.gitignore`. None of these are in the fence (`public/editor-inject.js`, `public/editor`, `public/guardrails.js`, `src/pages/api/site`, `middleware.ts`). The OPS-02 grep must still return 0 at the end of Phase 5.
- **D-15 (from 04-CONTEXT.md D-03):** **3 MB Hobby-tier cap is final.** Canary v2 payloads stay well under (e.g., 2 small text-only edits with no photos, ~2 KB total). Do not test the cap defence from Phase 5 — that's already exercised by smoke scenario 4 locally. Phase 5's job is "deployed pipeline works on the happy path."
- **D-16 (from 04-CONTEXT.md D-14):** **Cache-bust constant `FEEDBACK_INJECT_VER='3'` is the proof point.** OPS-05's net-tab check verifies this exact value lands in deployed HTML.

### Claude's Discretion

- **Canary v2 payload composition:** the planner picks 2-3 small text-only edits (no photos) that will reliably pass the per-edit autonomy gate so the AUTO-ELIGIBLE path is exercised. The exact edit content is the planner's call as long as `i18nAttr` is set (forcing `signalCount > 0` → AUTO-ELIGIBLE per smoke scenario 2 pattern) and the routes are existing site routes (e.g., `/`, `/the-compound/`).
- **Assertion granularity:** how many `PASS: …` log lines per canary run — planner's call. Recommended: one per ROADMAP success-criterion sub-claim.
- **Polling cadence for Action / PR creation:** the Action takes ~30-90s after issue creation to open a PR. Planner picks a poll-with-timeout pattern (e.g., 10s intervals up to 5 min) for `gh pr list --head feedback/issue-<N>-batch-<M>`.
- **Whether to use `gh` REST API or `gh` CLI subcommands:** both work. Default to CLI subcommands (`gh issue view`, `gh pr view`) for readability; fall back to `gh api` only if a subcommand can't express the query (rare).
- **Exit code semantics:** all canaries exit 0 on pass, non-zero on fail. Planner picks specific codes (1 = assertion fail, 2 = setup fail, 3 = cleanup fail) if useful.
- **Whether to print a final PASS/FAIL banner at the end of `canary.sh`:** yes, recommended; banner format is planner's call (mirror smoke harness's `5 passed, 0 failed` if it adds clarity).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope + requirements
- `.planning/ROADMAP.md` (Phase 5 section, lines 84-94) — defines OPS-04 + OPS-05 success criteria verbatim ("`curl` with old-shape JSON" for OPS-04; "browser network tab confirms `feedback-inject.js?v=<NEW_VER>`" for OPS-05).
- `.planning/REQUIREMENTS.md` — OPS-04 + OPS-05 detail lines; traceability table flips to `satisfied` once Phase 5 ships.
- `.planning/PROJECT.md` — solo-dev "I decide, ship, show" authority model; deploy path (pushes to `main` auto-deploy via Vercel webhook); Hobby-tier constraints.

### Carry-forward from Phase 4
- `.planning/phases/04-batch-pipeline-implementation/04-CONTEXT.md` — D-03 (3 MB cap), D-13 (OPS-02 fence), D-14 (cache-bust), D-15 (shared validator mirror), D-16 (one endpoint two shapes). All apply to canaries.
- `.planning/phases/04-batch-pipeline-implementation/04-VERIFICATION.md` — what's already proven locally: 6/6 truths verified, 23/23 req IDs satisfied, smoke harness 5/5 in unit mode.
- `.planning/v1.1-MILESTONE-AUDIT.md` — surfaced the "smoke harness has no TARGET_URL retarget seam" gap that Phase 5's D-01 closes; also surfaced both isolation seams (`client-feedback-test` label vs DRY_RUN) that D-05 chose between.

### Deployed-pipeline integration points
- `.github/CLAUDE_FEEDBACK.md` §8 — batch protocol the v2 canary verifies the Action follows (title detection, branch name pattern `feedback/issue-<N>-batch-<M>`, one PR + one result comment, autonomy verdict semantics).
- `.github/workflows/claude.yml` — `DRY_RUN` repo variable gate locations (around lines 55, 122, 145 per integration check). Canary requires `DRY_RUN=true` before creating an OPS-05 issue.

### Targets the canary hits
- `src/pages/api/feedback/submit.ts` — the endpoint (`/api/feedback/submit`); both `handleV1` and `handleV2Batch` are exercised end-to-end.
- `src/pages/api/feedback/validate.ts` — shared validator (D-15 mirror) — exercised transparently by the endpoint.
- `src/lib/feedback-version.ts` — `FEEDBACK_INJECT_VER = '3'` — the cache-bust constant the OPS-05 net-tab check asserts on.
- `src/layouts/BaseLayout.astro:1024-1033` — the inline `?feedback=1` loader block that emits `const feedbackVer = "3"` into deployed HTML; this is the exact string the cache-bust grep matches against.

### Phase 5's modifiable surface
- `scripts/smoke-feedback-v2.mjs` — Phase 5 extends with `TARGET_URL` env-var mode + `--canary v1|v2` flags.
- `scripts/canary.sh` — Phase 5 CREATES this. Thin bash wrapper around the harness.
- `package.json` (`scripts` section) — Phase 5 adds `canary:v1`, `canary:v2`, `canary` entries. (Note: `package.json` is NOT in the OPS-02 fence — safe to modify.)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`scripts/smoke-feedback-v2.mjs`** (386 LOC, passing 5/5 in unit mode): contains the 5 canonical scenarios. Phase 5 reuses scenarios 1 (v1 back-compat) and 2 (v2 happy path) almost verbatim in canary mode; scenarios 3-5 (cap + validation) are local-only because they require deterministic small payloads against a stubbed GitHub fetch — they exit cleanly when `TARGET_URL` is set (skip with `SKIP: <reason>`).
- **`gh` CLI** is already available (used by `.github/workflows/claude.yml` and the feedback pipeline). No new install needed.
- **`npx tsx`** is already in devDependencies (per smoke harness invocation pattern). Canary runs the same way.
- **`curl`** is in PATH (Darwin 25.4.0). Used by cache-bust grep (D-08) and HEAD probe (D-10).

### Established Patterns

- **Smoke harness assertion format:** `PASS: <scenario name>` per success, `FAIL: <reason>` per failure, summary at end `<N> passed, <M> failed`. Phase 5 mirrors this convention so canary output is visually consistent with smoke output.
- **`globalThis.fetch` stub pattern (lines ~86 of harness):** replaced under unit mode; bypassed entirely under canary mode (real fetch goes to TARGET_URL).
- **`try { … } finally { cleanup() }` cleanup pattern:** standard JS — Phase 5's canary v2 uses this to guarantee issue/PR/branch cleanup even on mid-canary failure.

### Integration Points

- **`scripts/canary.sh`** is the new entry point. It exists to satisfy OPS-04's literal "curl with old-shape JSON" ROADMAP wording — internally it invokes `npx tsx` against the smoke harness, but the operator-facing interface is bash + curl-equivalent semantics.
- **`package.json` `scripts` section** gets 3 new entries — `canary:v1`, `canary:v2`, `canary`. No new dependencies added.
- **GitHub repo variable `DRY_RUN`** — canary v2 reads it (via `gh variable get DRY_RUN`) and aborts if not `true`. The variable is owned by the operator, not the canary.

</code_context>

<specifics>
## Specific Ideas

- **Live-deploy already verified during discuss (2026-05-21 17:00 UTC):** `curl https://www.moulinareves.com/` returns HTTP 200, `content-type=text/html; charset=utf-8`, and the inline loader block contains `const feedbackVer = "3"`. The plan-phase + execute-phase can run the canary immediately without waiting for deploy.
- **Smoke harness has the right shape already.** 386 LOC, 5 scenarios, dynamic-import + fetch-stub pattern. Adding TARGET_URL mode is a ~50-100 LOC change wrapped in `if (TARGET_URL) { /* canary mode */ } else { /* unit mode */ }` branches at the right seams (~lines 86, 146, 180 per integration check finding).
- **Operator-facing UX should be one line:** `npm run canary` returns 0 / 1. No interactive prompts; no manual screenshot step; full automated pass/fail.

</specifics>

<deferred>
## Deferred Ideas

- **Auto-canary-on-deploy via a new GitHub workflow** — D-12 explicitly defers this. v1.2 candidate: a `.github/workflows/canary.yml` triggered by Vercel deploy-success webhook (or `workflow_dispatch` post-deploy) that runs `npm run canary`. Out of scope for v1.1 first ship.
- **Playwright / Puppeteer headless browser canary** — D-09 explicitly defers this. v1.2 candidate only if real-browser fidelity becomes a requirement (e.g., proving service-worker cache invalidation, or proving the inject's `pageshow`/`visibilitychange` listeners fire correctly in a real browser context). Curl + grep is sufficient for v1.1's "the deployed HTML references v=3" claim.
- **Cron'd weekly regression sweep** — out of scope. The canary is opt-in via `npm run canary`. If the user wants a recurring run, they can use the existing GH Actions cron infrastructure later.
- **Canary against Vercel preview URLs (per-PR)** — `DEPLOY_URL` is overridable via env var (D-03 of this phase), so this comes "for free" from the design, but Phase 5 only ships the default `https://www.moulinareves.com/` invocation. Preview-URL canary would need a way to know the preview URL from inside CI — out of scope.
- **Issue-deletion in cleanup (not just close)** — GitHub doesn't easily allow issue deletion via API (admin-only and `gh issue delete` requires manual confirm). D-07 chose `gh issue close` + a "Closed by canary" comment as the audit-friendly cleanup pattern.
- **Re-enabling auto-merge after Phase 5** — `DRY_RUN=true` stays set throughout Phase 5 and after. The user re-enables auto-merge (`gh variable set DRY_RUN -b false`) on their own schedule — likely after a few client-feedback rounds prove the v2 batch path is stable in production.

</deferred>

---

*Phase: 05-post-deploy-verification*
*Context gathered: 2026-05-21 via /gsd-discuss-phase --auto*
