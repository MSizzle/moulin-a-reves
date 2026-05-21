# Moulin à Rêves Site

## What This Is

Marketing site for **Le Moulin à Rêves** — a private luxury vacation compound in Méréville, France (~1 hour from Paris) with three rentable houses (Le Moulin, Hollywood Hideaway, Maison de la Rivière). Built and maintained by Monty (solo dev) for the property owner. The site is a static Astro build with a custom Decap CMS admin and a precompiled editor SPA, deployed to Vercel and published via GitHub.

## Core Value

**Convey the compound's atmosphere convincingly enough to convert visitors into bookings and direct inquiries.** Brand, photography, and copy all serve this. The editor / CMS / i18n stack exists so the client can keep that surface fresh without dev involvement.

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

### Active

<!-- v1.1: gated on Melissa's reply to CLIENT-CLARIFICATION.md. Scope candidates below; concrete milestone defined via /gsd-new-milestone. -->

- [ ] **Batch-feedback feature** — collect multiple staged client edits into a single Claude PR rather than one PR per click (design spec in user memory at `moulin-batch-feedback-spec.md`). Leading candidate for the first v1.1 phase; doesn't require the client reply.
- [ ] **Apply Melissa's clarification answers** — once she replies to the 11 outstanding questions in `CLIENT-CLARIFICATION.md`, execute the resolved scope. Likely items: TYPOG-01 global italic policy, hero tagline italic site-wide policy, Le Mérévillois vs Méréville naming confirmation, asset-pending items (jacuzzi/Stars/biking/Monet photos, Netflix-on-TV decision), Groups-page yes/no/think.
- [ ] **Photo gallery modal rewrite** (deferred from v1 — STRUCT-01) — fix X-button visibility, forward-arrow cropping, photo bottom cropping on first open across all houses (only Le Loft Suite currently works).
- [ ] **Calendar 12-month scrollable range** (deferred from v1 — STRUCT-02) — investigate ICS feed depth implications.
- [ ] **Editor / publishing flow deep audit** (deferred from v1 — AUDIT-DEEP-01) — fragility, error paths, GitHub integration, HMAC session edge cases.

### Out of Scope

<!-- Explicit boundaries. Items marked → v1.1 carry forward as Active above; items kept here remain firmly out. -->

- **Deep audit of editor / publishing flow** — → v1.1 (Active). Carried forward verbatim from v1.0 deferral.
- **Mobile / responsive deep audit** — Still out (no v1.1 commitment). Recent overflow hotfixes (PRs #49, #50, plus follow-on May-6 work) appear to have settled the pain; revisit if new reports surface.
- **Performance / SEO audit** — Still out. Fonts already at 2-family target (v1.0 TYPOG-03 was a no-op confirming this); image pipeline shipping WebP at q=85; sitemap excludes intentionally. Not currently blocking conversion.
- **Gallery modal navigation rewrite** — → v1.1 (Active). Client raised it in all 3 rounds and TYPOG-01 work confirmed it's still broken; v1.1 needs to ship this.
- **Calendar scroll to 12 months** — → v1.1 (Active). Surfaced in `CLIENT-CLARIFICATION.md`; client likely confirms when she replies.
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

**Shipped:** v1.0 May 5 Client Edits (2026-05-05) — 3 phases, 6 plans, 38/38 requirements, 134 files +16,811 LOC, deployed live via Vercel auto-deploy. `CLIENT-CLARIFICATION.md` at project root delivered to Melissa out-of-band.

**Next milestone (v1.1):** Gated on Melissa's reply to the 11 questions in CLIENT-CLARIFICATION.md. Batch-feedback feature (user memory seed) is the leading first-phase candidate regardless. Start with `/gsd-new-milestone` when ready.

---
*Last updated: 2026-05-21 after v1.0 milestone close*
