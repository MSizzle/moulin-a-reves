# Moulin à Rêves Site

## What This Is

Marketing site for **Le Moulin à Rêves** — a private luxury vacation compound in Méréville, France (~1 hour from Paris) with three rentable houses (Le Moulin, Hollywood Hideaway, Maison de la Rivière). Built and maintained by Monty (solo dev) for the property owner. The site is a static Astro build with a custom Decap CMS admin and a precompiled editor SPA, deployed to Vercel and published via GitHub.

## Core Value

**Convey the compound's atmosphere convincingly enough to convert visitors into bookings and direct inquiries.** Brand, photography, and copy all serve this. The editor / CMS / i18n stack exists so the client can keep that surface fresh without dev involvement.

## Most Recent Milestone: v1.1 Batch Feedback Pipeline — SHIPPED 2026-05-21

v1.1 replaced the 1-edit-per-deploy feedback flow with a batched submission model: client stages multiple edits in a corner-chip + panel UI, submits as one POST, server creates ONE GitHub issue per batch, Claude Action produces ONE branch / ONE commit / ONE PR / ONE deploy. Targeted ~10× reduction in deploys per client review pass. 25/25 requirements satisfied; live canaries verified end-to-end on `www.moulinareves.com`. v1 (`schemaVersion:1`) cached clients keep working indefinitely.

Full detail: [`MILESTONES.md` § v1.1](./MILESTONES.md) · [`milestones/v1.1-ROADMAP.md`](./milestones/v1.1-ROADMAP.md) · [`milestones/v1.1-MILESTONE-AUDIT.md`](./milestones/v1.1-MILESTONE-AUDIT.md) · [`RETROSPECTIVE.md`](./RETROSPECTIVE.md)

## Next Milestone: v1.2 (planning pending)

To kick off v1.2, run `/gsd-new-milestone`. Candidate scope lives in the "Carried forward to v1.2" subsection under Requirements below.

## Requirements

### Validated

<!-- Existing capabilities inferred from .planning/codebase/ — already shipped and relied upon. -->

- ✓ Static Astro 6 site (`output: 'static'`) with marketing pages — home, about, compound, three home pages, contact, FAQs, services — existing
- ✓ Per-house pages: Le Moulin, Hollywood Hideaway, Maison de la Rivière — existing
- ✓ Bilingual EN/FR via runtime client overlay from `/api/translations` (proxies GitHub raw `translations.json`) — existing
- ✓ Decap CMS admin at `/admin/` (GitHub-backed) — existing
- ✓ Custom editor SPA at `editor.moulinareves.com` (precompiled bundle in `public/editor/`) with click-to-edit overlay and HMAC cookie auth (`maison_session`, 30-day) — existing
- ✓ Availability calendar pulling Airbnb + VRBO ICS feeds via `/api/availability` — existing
- ✓ Form endpoints: contact, compound-events, newsletter — Airtable webhook integration — existing
- ✓ Photo pipeline (`scripts/process-photos.mjs` + Sharp) for source-photo → optimized webp — existing
- ✓ Vercel hosting + edge middleware (`middleware.ts`) for editor subdomain rewrite — existing
- ✓ PhotoCarousel, RoomShowcase, AmenitiesSection components — existing
- ✓ **Code-deep audit pipeline for client PDF feedback** — tag every bullet ✅/🔧/❓/⚠️ with file:line references — v1.0 (AUDIT-01..03, 92 bullets across 3 rounds)
- ✓ **Atomic per-requirement copy/typography/section/photo edits** — 11+ atomic commits, both runtime overlay and typed seed updated in lockstep — v1.0 (COPY-01..15, TYPOG-01..03, SECT-01..08, PHOTO-01..03)
- ✓ **`CLIENT-CLARIFICATION.md` deliverable workflow** — page-grouped Markdown with verbatim quote + current-state + bold question, plus "Already done — please re-review" section — v1.0 (CLAR-01..06, 412 lines, shipped to Melissa out-of-band)
- ✓ **`.hero--cta` BEM modifier for reduced-overlay CTA hero band** — v1.0 (PHOTO-03, used across all 3 house pages)
- ✓ **Feedback flow (`?feedback=1` → auth-gated `/feedback` → GitHub issue → Claude Code Action → PR)** — existing, shipped in moulin-feedback-action setup (pre-v1.0); supports the autonomy hint and locator schema documented in `.github/CLAUDE_FEEDBACK.md`
- ✓ **v2 batch feedback pipeline** — v1.1 (STAGE-01..07, API-01..06, ISSUE-01..04, ACTION-01..03, OPS-01..05). Client stages N edits via corner chip + sessionStorage panel, submits as one `{schemaVersion:2, batch:true, edits:[...]}` POST; server creates ONE GitHub issue per batch (batch title + per-edit `renderHuman()` + single fenced ```json``` block); Claude Action produces ONE branch / ONE commit / ONE PR; v1 cached clients keep working indefinitely; `FEEDBACK_INJECT_VER='3'` cache-bust live; OPS-02 editor-flow fence intact (0 lines diff).
- ✓ **Shared per-edit validator (`src/pages/api/feedback/validate.ts`)** — v1.1 (API-04, D-15 mirror). Single source of truth for `validateEdit`, `signalCount`, `clamp`, `INTENTS`, etc. Consumed by both `handleV1` and `handleV2Batch` in `submit.ts`; the two paths can never drift on validation.
- ✓ **Server-side decoded-bytes cap (`approxDecodedBytes` helper)** — v1.1 (API-06 / CR-02 closure). `MAX_BATCH_BYTES` reducer reads from `e.image.dataBase64` (decoded length), not from the spoofable `e.image.bytes` client descriptor.
- ✓ **Reusable canary tooling** — v1.1 (OPS-04, OPS-05). `scripts/smoke-feedback-v2.mjs` runs in dual modes (unit-stub vs `TARGET_URL=<live>` real-fetch); `scripts/canary.sh` is the bash wrapper; `npm run canary:v1` / `canary:v2` / `canary` are opt-in regression nets. `DRY_RUN=true` repo variable gates Action squash-merge for safe v2 canaries.

### Active

<!-- v1.1 shipped 2026-05-21. Active = TBD until /gsd-new-milestone defines v1.2 scope. Concrete REQ-IDs land in a fresh .planning/REQUIREMENTS.md when the next milestone is initialized. -->

- (none currently — run `/gsd-new-milestone` to pick the v1.2 focus)

### Carried forward to v1.2 (candidates)

<!-- Carried from v1.1 → v1.2. Lift any of these back into Active when starting v1.2 via /gsd-new-milestone. -->

- [ ] **Apply Melissa's clarification answers** — gated on her reply to the 11 outstanding questions in `CLIENT-CLARIFICATION.md`. Likely items: TYPOG-01 global italic policy, hero tagline italic site-wide policy, Le Mérévillois vs Méréville naming confirmation, asset-pending items (jacuzzi/Stars/biking/Monet photos, Netflix-on-TV decision), Groups-page yes/no/think.
- [ ] **Photo gallery modal rewrite** (STRUCT-01, deferred from v1) — fix X-button visibility, forward-arrow cropping, photo bottom cropping on first open across all houses (only Le Loft Suite currently works).
- [ ] **Calendar 12-month scrollable range** (STRUCT-02, deferred from v1) — investigate ICS feed depth implications.
- [ ] **Editor / publishing flow deep audit** (AUDIT-DEEP-01, deferred from v1) — fragility, error paths, GitHub integration, HMAC session edge cases.
- [ ] **Per-photo vs per-batch cap UX disambiguation** (v1.1 WR-01) — first photo over 3 MB currently trips "batch full" message instead of "this photo too large". Low UX priority; distinguish messages.
- [ ] **Auto-canary-on-deploy GitHub workflow** (v1.1 D-12 carry-forward) — Vercel-deploy-success-webhook-triggered `.github/workflows/canary.yml` that runs `npm run canary` post-deploy. Currently opt-in only via `npm run canary`.
- [ ] **Playwright headless canary fidelity** (v1.1 D-09 carry-forward) — real-browser network-tab interception if curl+grep proof becomes insufficient (e.g., service-worker cache invalidation).
- [ ] **SUMMARY frontmatter hygiene backfill** (v1.1 tech debt) — 10 of 11 Phase 4 SUMMARY files use non-standard `requirements:` key or omit `requirements-completed:`; truth-of-record is VERIFICATION.md. Cosmetic metadata hygiene.

### Out of Scope

<!-- Explicit boundaries. Items marked → v1.2 candidate live in "Carried forward to v1.2" above; items kept here remain firmly out. -->

- **Deep audit of editor / publishing flow** — → v1.2 candidate. Carry-forward; not in v1.1.
- **Mobile / responsive deep audit** — Still out (no v1.1 / v1.2 commitment). Recent overflow hotfixes (PRs #49, #50, plus follow-on May-6 work) appear to have settled the pain; revisit if new reports surface.
- **Performance / SEO audit** — Still out. Fonts already at 2-family target (v1.0 TYPOG-03 was a no-op confirming this); image pipeline shipping WebP at q=85; sitemap excludes intentionally. Not currently blocking conversion.
- **Gallery modal navigation rewrite** — → v1.2 candidate. Carry-forward; not in v1.1. Client raised it in all 3 v1.0 rounds and TYPOG-01 work confirmed it's still broken.
- **Calendar scroll to 12 months** — → v1.2 candidate. Carry-forward; not in v1.1. Surfaced in `CLIENT-CLARIFICATION.md`; client likely confirms when she replies.
- **Active Google Maps embed in Getting Here** — Still out, pending client confirmation in `CLIENT-CLARIFICATION.md`. Lift to Active if she says yes.
- **Adding a top-level Groups page** — Still out, pending client yes/no/think in `CLIENT-CLARIFICATION.md`. Lift to Active if she says yes.
- **Items requiring client-supplied assets** — jacuzzi photos, "stars who stayed here" photos, biking photos, Monet Giverny image — still blocked on Melissa uploading. Asked in clarification doc.
- **Netflix logo on TV in screening room photo** — Still pending: photo-edit vs new photo, branding/legality. Asked in clarification doc.
- **Universal italic-on-final-word policy (global rollout)** — v1.0 shipped the listed cases; global rollout still pending Melissa's reply (Universal #1 in CLIENT-CLARIFICATION.md).
- **Hero tagline italic global removal** — v1.0 fixed Hollywood Hideaway via scoped CSS; global `.hero__tagline` rule still applies to 15+ other surfaces. Pending Melissa's reply.
- ~~**"When you can stay" → "Join us!" vs "When would you like to visit?"**~~ — RESOLVED in v1.0. "Join us!" shipped globally per "newest-round-wins" rule (COPY-01).

## Context

**Brownfield project** — codebase mapped 2026-05-05 (see `.planning/codebase/`). v1.0 shipped 2026-05-05 with 38/38 milestone requirements complete; 134 files changed and +16,811 LOC (mostly 67 new photo assets); deployed live via Vercel auto-deploy on `main`.

The site has been live and iteratively maintained. The client (Melissa, property owner) gives feedback in compiled multi-round PDFs that grow over time — `MMM may.5.pdf` contained the May 5 round on top, then May 1, then April 30 below. She is non-technical and re-includes earlier rounds because she doesn't track what's been shipped, which is itself a signal: items repeated across rounds are her highest-frustration items. v1.0's CLIENT-CLARIFICATION.md is designed to break that re-reporting cycle by surfacing an "Already done — please re-review" section for every item she's repeatedly re-flagged.

### Recurring themes (validated across all 3 v1.0 rounds)

1. **Photo galleries** — too much white space, modal navigation broken (X invisible, forward arrow cut off, photos cut at bottom). Only Le Loft Suite modal works correctly. → v1.1 (Active).
2. **Copy: "When you can stay" / "where you can stay" → "Join us!"** — RESOLVED in v1.0 (COPY-01).
3. **Italics on final word of headers** — RESOLVED for listed cases in v1.0 (TYPOG-01..03); global rollout pending client reply.
4. **Naming: "Le Moulin" is just one house; "Moulin à Rêves" is the whole estate** — RESOLVED in v1.0 (COPY-07).
5. **Beige footer: sleeps 12 in 10 beds → sleeps 10 in 8 beds** — RESOLVED in v1.0 (COPY-02).
6. **Font count standardized to 2–3** — RESOLVED in v1.0 (TYPOG-03 verify-only: already at 2-family target).

### Patterns established in v1.0

- **i18n dual-store rule:** every copy change must land in BOTH `public/i18n/translations.json` (runtime overlay) AND `src/i18n/translations.ts` (typed seed), or the FR toggle silently breaks. Discovered after COPY-01 partial-shipment; now standard practice.
- **Atomic per-requirement commits:** Phase 2 shipped 21 commits each tied to a specific REQ-ID, making the audit trail trivially scannable. This convention should persist.
- **`/feedback`-flow autonomy hint + locator JSON:** the self-coding pipeline now in place (autonomous Claude Code Action on `client-feedback`-labelled issues) is a v1.1+ multiplier — batch-feedback (next milestone seed) builds directly on it.

### v1.0 deferred → v1.1 candidates

- Photo gallery modal rewrite (STRUCT-01)
- Calendar 12-month range (STRUCT-02)
- Editor / publishing flow audit (AUDIT-DEEP-01)
- All items in `CLIENT-CLARIFICATION.md` that come back with "yes, do this" answers
- Batch-feedback feature (see user memory `moulin-batch-feedback-spec.md`)

## Constraints

- **Timeline**: Deliverable due **2026-05-06** (tomorrow). Monty has a full evening / late night of focused work.
- **Authority model**: Solo dev for client — "I decide, ship, show". No per-edit approval. Client reviews at milestones.
- **Risk posture**: Don't break the editor / publishing flow. It is fragile and the client uses it directly. Any structural fix to that area is deferred to Milestone 2.
- **Tech stack (locked, brownfield)**: Astro 6 + `@astrojs/vercel` + Decap CMS + custom React editor SPA + Vercel Edge middleware + Sharp photo pipeline + Airtable webhooks + Neon (admin scripts) + GitHub-as-CMS-backend.
- **i18n**: Site must remain bilingual (EN/FR) via runtime overlay from `public/i18n/translations.json`. Any copy change must update both languages or be flagged.
- **Node**: pinned to 24 (`.nvmrc`, `package.json` engines).
- **Deploy path**: pushes to `main` auto-deploy via Vercel webhook. Atomic commits = atomic deploys.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| v1.0 = audit + ship-clear + clarify-ambiguous (not just questionnaire) | Monty had a full evening; shipping the unambiguous items now reduces backlog and gives the client visible progress alongside her clarification questions | ✓ Good — 29 unambiguous edits shipped before client read CLAR doc; "look-it's-already-better" effect achieved |
| "Newest round wins" for resolving cross-round contradictions in client feedback | She layers feedback over time; the most recent expression is her current preference. Earlier-round contradictions are still flagged in CLIENT-CLARIFICATION.md so she can confirm. | ✓ Good — resolved 4 cross-round contradictions cleanly (Join us!, Bienvenue!, Mérévillois, italics); each surfaced in CLAR doc for explicit confirmation |
| Code-deep audit (not surface-level) | Client repeatedly re-flags items that are already done; surface-level audit would miss this. Code-deep lets us status-flag done items and stop the cycle. | ✓ Good — 10 ✅ Already-Done items identified with commit refs, 14 surfaced in CLAR "please re-review"; audit took ~50 min and paid for itself across Phase 2 and Phase 3 |
| Defer all structural fixes (gallery modal, editor flow audit, calendar 12-month range, mobile/perf audit) to Milestone 2 | They don't fit tomorrow's window and Monty wants foundations solid, which means giving them their own milestone rather than rushing them tonight | ✓ Good — kept v1.0 deadline (2026-05-06); deferred items now carried forward to v1.1 Active where they belong |
| Audit and clarification doc grouped by page (Home / Le Moulin / Hollywood / Riviere / Les Maisons / Contact / Universal), not by category | Easier for client (non-technical) to read in one pass, page-by-page, matching how she experiences the site | ✓ Good — 9 H2 sections matching page navigation; CLAR doc reads as a walk-through of the site, not a category dump |
| i18n dual-store update on every copy change (runtime overlay JSON + typed TS seed) | After COPY-01 partial-shipment revealed drift between the two stores; forgetting one silently breaks FR toggle | ✓ Good — pattern shipped across all 15 COPY requirements and confirmed during 02-01 reconciliation; now standard practice |
| Atomic per-requirement commits (one REQ-ID per commit) | Makes the audit trail trivially scannable; each requirement maps to a single commit hash that can be cited back to the client | ✓ Good — Phase 2 produced 21 commits each tied to a specific REQ-ID; cited inline in CLAR "Already Done" section |
| `CLIENT-CLARIFICATION.md` at project root, not under `.planning/` | The file is a client deliverable sent to Melissa directly out-of-band, not an internal artefact | ✓ Good — file lives at `/CLIENT-CLARIFICATION.md`, ships to production via Vercel auto-deploy on `main`, no special handling needed |
| **v1.1**: One endpoint, two payload shapes (no `POST /submit-batch`) — `submit.ts` branches on `schemaVersion`/`batch` (D-16) | v1 cached clients must keep working indefinitely; a separate endpoint would have forced a v1 deprecation eventually. Branching on payload shape keeps both paths in one file under one validator. | ✓ Good — smoke harness scenario 1 (v1) and scenarios 2-5 (v2) all pass through one dispatcher; no client-side feature-detection needed |
| **v1.1**: Shared per-edit validator extracted to `validate.ts` consumed by both v1 and v2 paths (D-15 mirror) | Forces the two paths to never drift on validation rules; a future change to `signalCount` thresholds or `INTENTS` automatically applies to both | ✓ Good — `submit.ts:5` named import; `handleV1` and `handleV2Batch` both call `validateEdit(e)`; smoke scenario 1 and scenario 5 collectively exercise both paths against the same rule set |
| **v1.1**: Vercel Hobby tier (3 MB cap) over Pro (30 MB cap) — D-03 reconciliation | ROADMAP success criterion #6 originally specified 30 MB; operator-side cost / tier check chose Hobby. Both `MAX_BATCH_BYTES` constants set to 3 MB (server + client mirror) | ✓ Good — Phase 5 OPS-05 canary payload (2 small text-only edits) comfortably fits; smoke scenario 4 exercises the real cap; the 30 MB → 3 MB downgrade is documented as an acceptable caveat on success criterion #6 |
| **v1.1**: OPS-02 editor-flow fence enforced via PR-diff regex (D-13) | The editor flow is fragile and the client uses it directly; the only way to guarantee zero regression is to make a byte-for-byte unchanged diff a hard merge gate | ✓ Good — `git diff <pre-Phase-4-baseline> -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts \| wc -l` returns 0 across all 14 v1.1 plans; smoke scenario 5 / Phase 5 OPS-02 final check both assert this |
| **v1.1**: `FEEDBACK_INJECT_VER` as single-source-of-truth bump on every inject change (D-14, OPS-01) | Cached `feedback-inject.js` lives in browsers for days; without a cache-bust per behavioural change, deployed updates are invisible to existing clients | ✓ Good — bumped `'1'`→`'2'` in 04-06, then `'2'`→`'3'` in 04-11 after gap-closure modified the inject; Phase 5 OPS-05 canary verified `const feedbackVer = "3"` lands in deployed HTML |
| **v1.1**: Retrospective gap-closure as a within-milestone cycle (not a separate phase) | After Phase 4's initial verification surfaced 3 BLOCKERs (CR-01/CR-02/CR-03), inserting a Phase 4.1 would have re-numbered Phase 5 and complicated the audit trail; running `/gsd-plan-phase 4 --gaps --auto` produced 3 new plans (04-09..04-11) under the same phase | ✓ Good — re-verification flipped Phase 4 from `gaps_found` → `passed` cleanly; gap-closure plans nested inside Phase 4 SUMMARIES; pattern proven viable when gaps are code-plumbing fixes inside the same scope |
| **v1.1**: `DRY_RUN=true` repo variable as the OPS-05 canary isolation seam (over `client-feedback-test` label-only) (D-05 v2 refinement) | `client-feedback-test` label would skip the Action entirely, failing OPS-05's "ONE Claude PR with all edits applied" success criterion; `DRY_RUN=true` lets the Action fire + open a PR but halts at squash-merge | ✓ Good — Phase 5 OPS-05 canary fired real Action under DRY_RUN, captured PR #97 + result comment, then cleaned up; `claude.yml:122/145` gate confirmed effective |
| **v1.1**: `TARGET_URL` env-var seam on the smoke harness (over a separate canary script) (D-01) | The smoke harness already encodes "what passing means" in 5 scenarios; splitting that into a second tool creates drift risk. One file with `if (TARGET_URL)` branching keeps unit-mode (stubbed fetch) and canary-mode (real fetch) in lockstep | ✓ Good — harness is 925 LOC across two modes; unit mode still 5/5 in regression; canary mode reused 2 of the 5 scenarios verbatim (scenarios 3-5 SKIP cleanly under TARGET_URL) |
| **v1.1**: Curl + grep for `const feedbackVer = "3"` over headless-browser cache-bust verification (D-08, D-09) | OPS-05 wording says "browser network tab confirms…" but the spirit is "prove deployed HTML references the new version." Curl on the served HTML proves the same thing without adding a Playwright runtime dep. Real-browser fidelity deferred to v1.2 if needed | ✓ Good — Phase 5 canary asserted both `const feedbackVer = "3"` HTML substring AND HTTP/2 200 HEAD probe on `/feedback-inject.js?v=3`; both passed live |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

## Current State

**Shipped:**
- **v1.0 May 5 Client Edits** (2026-05-05) — 3 phases, 6 plans, 38/38 requirements, 134 files +16,811 LOC.
- **v1.1 Batch Feedback Pipeline** (2026-05-21) — 2 phases, 14 plans (8 + 3 gap-closure + 3 canary), 25/25 requirements; live canaries on `www.moulinareves.com` confirmed OPS-04 v1 regression (issue #89) + OPS-05 v2 batched pipeline (issue #96 → PR #97 → DRY_RUN-halted) + cache-bust + asset-HEAD; OPS-02 editor-flow fence held byte-for-byte across the entire milestone; `FEEDBACK_INJECT_VER='3'` live; `DRY_RUN=true` repo variable set as safety net for autonomous Action runs.

**Deployed:** `www.moulinareves.com` (Vercel auto-deploy on `main`; production-tier Hobby; client-feedback pipeline self-codes via `client-feedback`-labelled issues → Claude Code Action under `DRY_RUN=true`).

**In progress:** None — between milestones. Next milestone (v1.2) pending — run `/gsd-new-milestone` to define scope.

**Carried to v1.2:** Apply Melissa's clarification answers (once she replies), photo gallery modal rewrite, calendar 12-month range, editor / publishing flow audit, plus 4 v1.1 tech-debt items (WR-01 cap-message disambiguation, auto-canary-on-deploy workflow, Playwright headless canary fidelity, SUMMARY frontmatter hygiene backfill).

**Operator pending:** Consider flipping `DRY_RUN=false` on the GitHub repo (`gh variable set DRY_RUN -b false`) after observing 1-2 real `client-feedback` rounds prove the v2 batch path is stable in production. Currently `true` from Phase 5 canary setup.

---
*Last updated: 2026-05-21 — v1.1 Batch Feedback Pipeline shipped and archived*
