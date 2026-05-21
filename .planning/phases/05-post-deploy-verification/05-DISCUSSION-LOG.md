# Phase 5: Post-Deploy Verification — Discussion Log

**Mode:** `--auto` (operator instruction: "do all of them. do it full auto")
**Date:** 2026-05-21
**Discuss workflow:** Standard `discuss` mode, auto-answered all 4 gray areas with Claude's recommended option from the prior `.planning/v1.1-MILESTONE-AUDIT.md` integration-check findings.

---

## Pre-Discussion Context (loaded automatically)

- **PROJECT.md** — Solo-dev "I decide, ship, show" model; pushes to `main` auto-deploy via Vercel webhook; Hobby-tier constraints (CLAUDE.md's "Direct push blocked" wording proved stale; dry-run + real push succeeded at 17:00 UTC).
- **REQUIREMENTS.md** — OPS-04 + OPS-05 detail; both `open` entering Phase 5.
- **Phase 4 04-CONTEXT.md** — 19 D-codes carried forward; most relevant: D-03 (3 MB cap), D-13 (OPS-02 fence), D-14 (cache-bust constant), D-15 (shared validator mirror), D-16 (one endpoint two shapes).
- **Phase 4 04-VERIFICATION.md** — 6/6 truths verified, 23/23 req IDs satisfied locally (re-verified post-gap-closure at 2026-05-21T10:30Z).
- **v1.1-MILESTONE-AUDIT.md** — surfaced the "smoke harness has no TARGET_URL retarget seam" gap; surfaced both isolation seams in `claude.yml` (`client-feedback-test` label vs `DRY_RUN=true` repo var); recommended (b) DRY_RUN for full E2E proof.
- **Live-deploy probe** — `curl https://www.moulinareves.com/` returned HTTP 200; inline HTML contains `const feedbackVer = "3"`. The Phase 4 cache-bust took effect.

## TODO Cross-Reference

- `gsd-sdk query todo.match-phase "5"` → `matches: []` (no pending todos matched Phase 5 scope).

## SPEC.md Check

- None present. Decisions documented directly in `05-CONTEXT.md` `<decisions>` block.

## Gray Areas Identified (4 total)

The integration check + audit pre-identified these as the meaningful open implementation decisions. Operator selected `--auto` → all 4 auto-decided with recommended option.

### Area 1 — Canary harness shape

**Options presented:**
- (a) Pure bash + curl scripts (`canary-v1.sh`, `canary-v2.sh`) — zero deps, CI-friendly.
- (b) Node + native fetch (`canary.mjs`) — reuses smoke-feedback-v2.mjs fixtures.
- (c) Extend smoke harness with `TARGET_URL` env-var mode — one tool, two modes.

**Selected:** (c), with a small bash wrapper for OPS-04 "curl-style" ROADMAP-wording conformance.

**Rationale (auto-mode pick):**
The smoke harness already encodes "what passing means" in 5 scenarios. Splitting that knowledge across two tools (smoke + canary) creates drift risk. A `TARGET_URL` branch at the existing seams (~lines 86, 146, 180 per integration check) keeps the canary and smoke in lockstep — any future change to the contract changes one file. The bash wrapper (`scripts/canary.sh`) is a thin pass-through so the operator-facing interface satisfies the ROADMAP wording.

→ Decisions D-01 through D-04 in `05-CONTEXT.md`.

### Area 2 — OPS-05 isolation seam

**Options presented:**
- (a) `client-feedback-test` label only — Action skips entirely; proves only issue creation.
- (b) `DRY_RUN=true` repo var + real `client-feedback` label — Action fires, opens PR, no merge.
- (c) Both in sequence (label first, then DRY_RUN).

**Selected:** (b).

**Rationale (auto-mode pick):**
OPS-05's success criterion is "produces … ONE Claude PR with all edits applied" — option (a) doesn't satisfy this because the Action never fires under the test label. Option (c) is 2× the run-time for zero added proof. Option (b) gives the full E2E (issue → Action → branch → PR → result comment + autonomy verdict) while the squash-merge gate keeps `main` untouched. `claude.yml` already has the DRY_RUN gate (per integration check `claude.yml:55/122/145`) — no new code needed on the Action side.

→ Decisions D-05 through D-07 in `05-CONTEXT.md`.

### Area 3 — Cache-bust proof capture

**Options presented:**
- (a) Manual screenshot of browser net tab + commit to phase dir — high-confidence, not reproducible.
- (b) Automated `curl` + grep for `?v=3` in served HTML — reproducible, doesn't prove a real browser fetches.
- (c) Headless Playwright/Puppeteer with network interception — full fidelity, adds a dev dep.

**Selected:** (b), with the grep pattern adjusted to the actual served HTML.

**Rationale (auto-mode pick):**
Live probe during discuss revealed the actual pattern: `const feedbackVer = "3"` (an Astro `define:vars` interpolation in the inline loader block), NOT `feedback-inject.js?v=3` as a single string. The grep pattern is precise — matches only when the deployed HTML reflects the new value. (a) is not reproducible by future canary runs; (c) is a 60+ MB Playwright dep for a one-shot one-grep verification. (b) is right-sized for v1.1 scope. v1.2 can revisit if real-browser fidelity becomes a requirement.

Additionally added D-10: HEAD probe on `/feedback-inject.js?v=3` to confirm 200 (catches the edge case of HTML referencing v=3 but the asset returning 404).

→ Decisions D-08 through D-10 in `05-CONTEXT.md`.

### Area 4 — Canary lifecycle after Phase 5

**Options presented:**
- (a) Sit dormant in `scripts/` — opt-in `npm run canary:v1 / canary:v2` for future regressions.
- (b) Wire into a new GitHub workflow auto-running after every push to `main`.
- (c) One-shot only — write, run, delete after Phase 5 closes.

**Selected:** (a).

**Rationale (auto-mode pick):**
Solo-dev "I decide, ship, show" model + ROADMAP wording ("After deploy, a … canary verifies …" implies one-shot verification, not persistent regression). (b) would need a Vercel deploy-success webhook (Hobby-tier doesn't have easy outgoing webhooks) or a push-to-main trigger (false-positives if pushed before Vercel finishes). (c) discards regression value — once written, the scripts are cheap to keep. (a) is opt-in, no new workflow file, scripts available for future modifications to feedback-inject.js / submit.ts / feedback-version.ts. v1.2 can revisit if auto-canary becomes worth the deploy-coordination complexity.

→ Decisions D-11, D-12 in `05-CONTEXT.md`.

## Carry-Forward from Phase 4 (re-stated for planner)

→ Decisions D-13 through D-16 in `05-CONTEXT.md`. Map to Phase-4 D-15, D-13, D-03, D-14 respectively.

## Deferred Ideas

See `<deferred>` in `05-CONTEXT.md`:
- Auto-canary-on-deploy GitHub workflow (v1.2)
- Playwright headless browser fidelity (v1.2 if needed)
- Cron'd weekly regression sweep (out of scope)
- Canary against Vercel preview URLs per-PR (free from design; deferred from default invocation)
- Issue deletion (vs close) in cleanup (GitHub API restriction)
- Re-enabling auto-merge by unsetting DRY_RUN (operator decision, not Phase 5's role)

## Operator Decisions (overrides)

- "do all of them. do it full auto" → activated `--auto` semantics for both discuss-phase and downstream plan-phase (chain-mode).

## Claude's Discretion (planner-owned)

See `<decisions>` → "Claude's Discretion" in `05-CONTEXT.md`:
- Canary v2 payload composition (2-3 small text-only edits with `i18nAttr` to force AUTO-ELIGIBLE).
- Per-canary assertion granularity.
- Polling cadence for Action / PR creation (~30-90s typical latency).
- `gh` CLI subcommands vs `gh api` REST calls.
- Exit code semantics.
- Final PASS/FAIL banner format.

---

*Discussion auto-completed: 2026-05-21*
*All 4 gray areas resolved with recommended options. Plan-phase auto-advance: pending dispatch.*
