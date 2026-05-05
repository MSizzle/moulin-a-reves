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

### Active

<!-- Milestone 1: Audit, Ship-What's-Clear, Compile Questions. Due 2026-05-06. -->

- [ ] **Audit** — code-deep cross-reference of every item in `MMM may.5.pdf` (3 compiled rounds: April 30, May 1, May 5) against current site code/content; tag each as Already Done / Clear-to-Ship / Needs Clarification / Conflicts-with-Earlier-Note
- [ ] **Ship the clear ones** — execute the unambiguous edits via atomic commits grouped by category (copy fixes, italics removal, content/section deletions, header copy changes)
- [ ] **CLIENT-CLARIFICATION.md** — Markdown grouped by page (Home / Le Moulin / Hollywood Hideaway / Maison de la Rivière / Les Maisons / Get in Touch / Universal). For each ambiguous item: quote the request verbatim, describe current state, list specific question(s). Include status-flag section for items already shipped so client stops re-asking. Include question about a top-level Groups page (Monty's intuition).

### Out of Scope

<!-- Explicit boundaries for THIS milestone. Some are deferred to later milestones, not killed forever. -->

- **Deep audit of editor / publishing flow** — Deferred to Milestone 2. Fragile area, but fixing it is structural work that doesn't fit tomorrow's deliverable.
- **Mobile / responsive deep audit** — Deferred to Milestone 2. Recent overflow hotfixes (PRs #49, #50) suggest pain here, but it's not in the client doc.
- **Performance / SEO audit** — Deferred to Milestone 2. Not in client's request, fonts and meta are reasonable today.
- **Gallery modal navigation rewrite** — Deferred. Client mentions it all 3 rounds (X button missing, forward arrow cut off, photos cut at bottom). Real bug, but a proper fix may need component-level rework. If a quick win is found during audit, ship; otherwise defer.
- **Calendar scroll to 12 months** — Deferred. Currently 4 months. Needs investigation into ICS feed depth and component logic. Will note in clarification doc.
- **Active Google Maps embed in Getting Here** — Pending client confirmation (cost, maintenance, vs. static directions). Goes in clarification doc.
- **Adding a top-level Groups page** — Monty's instinct, not in client doc. Goes in clarification doc as a question.
- **Items requiring client-supplied assets** — jacuzzi photos, "stars who stayed here" photos, biking photos, Monet Giverny image. Asked in clarification doc.
- **Netflix logo on TV in screening room photo** — Pending: photo-edit vs new photo, branding/legality. Goes in clarification doc.
- **Universal italic-on-final-word policy** — Apply to listed cases now; ask client whether to apply globally. Goes in clarification doc.
- **"When you can stay" → "Join us!" vs "When would you like to visit?"** — Conflict between rounds. Apply newest (May 5: "Join us!") globally; flag the contradiction in clarification doc.

## Context

**Brownfield project** — codebase already exists and was mapped on 2026-05-05 (see `.planning/codebase/`).

The site has been live and iteratively maintained. The client (property owner) gives feedback in compiled multi-round PDFs that grow over time — `MMM may.5.pdf` contains the May 5 round on top, then the May 1 round, then the April 30 round below it. She is non-technical and re-includes earlier rounds because she doesn't track what's been shipped, which is itself a signal: items repeated across rounds are her highest-frustration items.

Recent work shipped per `git log`:
- `c04e333` — fixed home page duplicate tagline + h2 sizing
- `064839a` — typography + layout scale on wide displays
- `7b264e7`, `250733e` — mobile overflow hotfixes (reverted PR #42 CSS)
- `3ff6215` — codebase map written

Recurring themes in the client's feedback (high signal because they appear in all 3 rounds):
1. Photo galleries — too much white space, modal navigation broken (can't see X to close, forward arrow cut off, photos cut at bottom). Only Le Loft Suite modal works correctly.
2. Copy: "When you can stay" / "where you can stay" → "Join us!" everywhere
3. Italics on final word of headers — make them roman
4. Naming: "Le Moulin" is just one house; "Moulin à Rêves" is the whole estate
5. Beige footer on Le Moulin: sleeps 12 in 10 beds → sleeps 10 in 8 beds
6. Font count: too many; standardize to 2–3

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
| Milestone 1 = audit + ship-clear + clarify-ambiguous (not just questionnaire) | Monty has a full evening; shipping the unambiguous items now reduces backlog and gives the client visible progress alongside her clarification questions | — Pending |
| "Newest round wins" for resolving cross-round contradictions in client feedback | She layers feedback over time; the most recent expression is her current preference. Earlier-round contradictions are still flagged in CLIENT-CLARIFICATION.md so she can confirm. | — Pending |
| Code-deep audit (not surface-level) | Client repeatedly re-flags items that are already done; surface-level audit would miss this. Code-deep lets us status-flag done items and stop the cycle. | — Pending |
| Defer all structural fixes (gallery modal, editor flow audit, calendar 12-month range, mobile/perf audit) to Milestone 2 | They don't fit tomorrow's window and Monty wants foundations solid, which means giving them their own milestone rather than rushing them tonight | — Pending |
| Audit and clarification doc grouped by page (Home / Le Moulin / Hollywood / Riviere / Les Maisons / Contact / Universal), not by category | Easier for client (non-technical) to read in one pass, page-by-page, matching how she experiences the site | — Pending |

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

---
*Last updated: 2026-05-05 after initialization*
