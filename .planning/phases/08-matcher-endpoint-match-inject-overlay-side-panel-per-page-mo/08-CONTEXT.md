# Phase 8: Matcher Endpoint + Match-Inject Overlay + Side Panel + Per-Page Mode - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

A `/feedback` user picks a page, pastes a freeform list of changes, clicks "Match edits", sees the iframe reload with numbered orange pins on each Haiku-mapped element, and uses a side panel to Approve / Reject / Pick-manually each match. Every Approve becomes a standard v2 staged edit that flows into the existing v1.1 corner chip + Submit batch pipeline unchanged.

**Hard fence:** `public/feedback-inject.js`, `public/editor-inject.js`, `public/editor/`, `public/guardrails.js`, `src/pages/api/site/*`, `middleware.ts`, `src/pages/api/feedback/submit.ts`, and `src/pages/api/feedback/validate.ts` are byte-for-byte unchanged across the entire milestone PR set (OPS-02). The new client surface lives in a separate file (`public/feedback-match-inject.js`) with its own cache-bust constant (`MATCH_INJECT_VER`).

**Phase 7 is shipped:** `dist/edit-catalogs/<route>.json` is emitted on every Vercel build with the schema produced by `src/integrations/edit-catalog/walker.mjs` (id, kind, locator signals, requiresManualSelection, buildSha). Phase 8 consumes that catalog — does not modify Phase 7's emitter.

</domain>

<decisions>
## Implementation Decisions

### Side panel mount location and layout
- **D-01:** The side panel is rendered as a sibling element of the existing iframe inside `src/pages/feedback.astro` — **NOT** injected inside the iframe. `public/feedback-match-inject.js` only paints pins inside the iframe; the panel lives on the parent page and reads sessionStorage. Reason: keeps target-page DOM clean, lets the panel scroll independently of the page being reviewed, and the existing v1.1 corner chip (which lives inside the iframe) keeps working unchanged.
- **D-02:** Layout is a two-column flex on viewports ≥ 1024px (iframe left ~65%, panel right ~35%) and stacks vertically below 1024px. Re-uses the existing `/feedback` responsive patterns; no new breakpoints.

### Match-set sessionStorage key + shape
- **D-03:** Storage key = `mar_feedback_match_set_v1` (single object — latest match set wins; picking a new page or re-running replaces it). Shape:
  ```json
  {
    "id": "ms_<uuid>",
    "route": "/homes/le-moulin",
    "buildSha": "abc1234",
    "createdAt": "<iso>",
    "editList": "<raw textarea content>",
    "matches": [
      { "line": "<original line text>", "primaryId": "<catalog id>", "primaryConfidence": 0.87, "alternates": ["<id>", "<id>"], "reason": "<haiku reason>" }
    ],
    "rowStates": [
      { "lineIndex": 0, "status": "pending|approved|rejected|manual", "manualLocator": null }
    ]
  }
  ```
- **D-04:** The `id` field is mirrored into the iframe URL `?matchSet=<id>` so the inject can verify the sessionStorage entry it loads is the one the parent intended (defends against a stale tab loading the wrong set).
- **D-05:** `rowStates` is parallel to `matches` (same length, same order) so Approve/Reject/Pick-manually state survives iframe navigation per PANEL-05. Approved rows ALSO write a v2 staged edit into `mar_feedback_staged_v1` — the two stores are independent (MODE-04 isolation).

### Confidence treatment in the panel
- **D-06:** Display only — never gates Approve. Each row shows a confidence pill with three color tiers: green ≥ 0.75, amber 0.50–0.74, red < 0.50. Rows with confidence < 0.50 get a subtle warning border but the Approve button is still active. Aligns with the REQUIREMENTS.md non-goal "Auto-approval based on high confidence alone" — even confidence 1.0 requires explicit Approve.

### Mode tab/toggle UI + default mode
- **D-07:** Two-tab segmented control at the top of `/feedback`: **"Per-element click"** (default) and **"Per-page review"**. Default = per-element matches the shipped v1.1 flow — lowest surprise for the client.
- **D-08:** Tab state is encoded in URL hash (`#mode=per-page` vs `#mode=per-element`) so deep links work; unrecognized hash falls back to per-element. Switching tabs hides/shows the relevant input UI but does **NOT** clear either sessionStorage key — `mar_feedback_match_set_v1` and `mar_feedback_staged_v1` stay independent per MODE-04.
- **D-09:** Both tabs run through the same `checkAuth()` shell gate that `/feedback` already enforces — no new login surface (MODE-03).

### Anthropic SDK call configuration (MATCH-03)
- **D-10:** Model = `claude-haiku-4-5` via the official `@anthropic-ai/sdk` (server-only import inside `src/pages/api/feedback/match.ts`). `ANTHROPIC_API_KEY` is read from server env only — a `public/`-tree grep MUST return zero hits (MATCH-06, OPS-03).
- **D-11:** Structured output via **tool use with forced tool choice**: `tool_choice: { type: "tool", name: "match_edits" }`. The `match_edits` tool schema mirrors the MATCH-04 response shape (`{ matches: [{ line, primaryId, primaryConfidence, alternates, reason }] }`). Reason: more reliable than JSON-mode for nested arrays + lets Anthropic validate the shape before we do.
- **D-12:** Sampling params: `temperature: 0`, `max_tokens: min(8192, 64 + 96 * lineCount)`. One-shot per request — no chunking even at MATCH-07 caps.
- **D-13:** Timeout = 25s (Vercel function default is 30s; reserve 5s for cold start + JSON serialization). One retry on transient `5xx` / `429` with 2s linear backoff; second failure returns the structured `{ error: 'matcher_unavailable' }` 500 from MATCH-06.
- **D-14:** Server-side ID validation pass after the Haiku response: every `primaryId` and every entry in `alternates[]` is checked against the in-memory `Set<catalogId>` built from the loaded catalog; unknown IDs are silently stripped before returning (MATCH-04 says "unknown IDs are stripped before returning"). `primaryId` that doesn't survive validation becomes `null` so the panel renders the row as "no match — pick manually".

### Catalog drift / buildSha mismatch UX (OVERLAY-02)
- **D-15:** The inject loads the stashed match set, then reads `<meta name="x-build-sha">` from the iframe document. If `matchSet.buildSha !== deployedBuildSha`, the inject paints **NO pins** and posts a `window.parent.postMessage({ type: 'mar:feedback:matchset-stale', matchSetId }, location.origin)`.
- **D-16:** On receiving that message (or detecting drift on initial panel render before iframe load), the panel disables every Approve button and shows a top banner: *"The site has been redeployed since these matches were generated. Click 'Re-run match' to refresh."* The Re-run button re-POSTs to `/api/feedback/match` with the **same `editList`** stashed in the match set; on 200 it replaces the match set, clears banner, and re-loads the iframe with the new `matchSet=<id>`.
- **D-17:** No auto re-run — explicit user action, matches the v1.2 "5s server cache + 8s client poll over webhook push" decision (no invisible work).

### Reject reversibility + reason display
- **D-18:** Rejected rows collapse into a **"Rejected (N)"** disclosure section at the bottom of the panel; click to expand → each rejected row shows a **Restore** button. Restore returns the row's `status` to `pending` (Approve/Reject buttons re-enabled). Implements PANEL-04 "re-open rejected rows before submitting the batch".
- **D-19:** `reason` is rendered inline below the alternates list as one italicized line. Truncate at 120 chars with `…` + click-to-expand (no tooltip-only). Reason: always-visible reasons help the client learn what phrasing works and helps Monty debug bad matches without DevTools.

### Per-page picker scope
- **D-20:** The page picker re-uses the existing `pagePick` `<select>` element from `src/pages/feedback.astro:159` unchanged — the picker enumerates the same routes the per-element flow exposes today. No dropdown filtering or search (the route list is small — ~10 marketing routes).
- **D-21:** The "Match edits" button is disabled if the selected route has no catalog. The panel performs a `fetch('/edit-catalogs/<route>.json', { method: 'HEAD' })` on picker change; on 404 the button stays disabled and the textarea shows a one-line hint *"This page isn't catalogued yet."*. This avoids a wasted Anthropic call for routes Phase 7's walker couldn't enumerate.

### Match-inject loader wiring (BaseLayout.astro, OVERLAY-01)
- **D-22:** `BaseLayout.astro`'s existing `?feedback=1` loader gains a sibling conditional block: **only when `matchSet` query parameter is present**, it ALSO defer-loads `/feedback-match-inject.js?v=<MATCH_INJECT_VER>`. The original `?feedback=1` loader for `feedback-inject.js` stays byte-identical (OPS-02). Two scripts can co-exist on the same page; `feedback-match-inject.js` does not import from `feedback-inject.js` and never mutates `feedback-inject.js`'s state (OVERLAY-05).
- **D-23:** `MATCH_INJECT_VER` is added as a new named export in `src/lib/feedback-version.ts` alongside `FEEDBACK_INJECT_VER` (which stays at `'4'`). Initial value `'1'`. Imported by both `BaseLayout.astro` (the conditional loader's `?v=`) and `src/pages/feedback.astro` (the iframe `src` builder).

### Cross-tab batch composition (MODE-04, Success Criterion 4)
- **D-24:** Approving 3 matches in per-page mode + adding 1 click-staged edit in per-element mode → 4-edit batch on Submit, one issue, one PR. This works because the corner chip's existing batch read of `mar_feedback_staged_v1` is unchanged, and Approve in per-page mode writes through to that same key using the exact `captureLocator` + `submitBatch` shape (re-derived from the catalog entry's locator signals — NOT by importing from `feedback-inject.js`, which is fenced).

### Claude's Discretion
- Wave breakdown (server first vs client first), file ordering within plans, and per-plan test coverage are left to `/gsd-plan-phase`.
- Exact tailwind/CSS class names for the new panel — re-use existing tokens (`--bg-cream`, `--ink`, `--blue-primary`, `--accent`) and BEM block names matching the v1.1 corner chip's styling vocabulary.
- Whether the panel header sticks to top of viewport on long match lists — implementer's call; not load-bearing for correctness.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase boundary / requirements
- `.planning/ROADMAP.md` §"Phase 8" — phase goal + 5 success criteria + 24 requirement IDs.
- `.planning/REQUIREMENTS.md` §MATCH-01..07, §OVERLAY-01..05, §PANEL-01..05, §MODE-01..04, §OPS-01, §OPS-03, §OPS-04 — locked requirement specs. (OPS-02 and OPS-05 belong to Phase 9.)
- `.planning/REQUIREMENTS.md` §"Future Requirements" / non-goals — auto-approval, mobile-specific flow, persisting editList across browser close, webhook for catalog updates are all explicitly out of scope.
- `.planning/PROJECT.md` §"Current Milestone: v1.3 File-Driven Per-Page Edit Flow" — v1.3 vision + key constraints.

### Operating manual / fence reference
- `CLAUDE.md` §"Feedback mode (`?feedback=1` → auto-code → auto-deploy)" — the additive-only fence rule, cache-bust contract, `feedback-incoming/` rule, and v2 batch submissions §8 link.
- `.github/CLAUDE_FEEDBACK.md` §8 — v2 batch submissions operating manual. The shape Approve must produce in `mar_feedback_staged_v1` MUST match what this Action expects to consume.

### Phase 7 catalog schema (consumed by this phase — do not modify)
- `.planning/phases/07-build-time-edit-catalog-generator/07-01-PLAN.md` — locator-signals helper + parity test.
- `.planning/phases/07-build-time-edit-catalog-generator/07-02-PLAN.md` — Astro integration scaffold + per-route emission.
- `.planning/phases/07-build-time-edit-catalog-generator/07-03-PLAN.md` — walker + element classification ladder + `requiresManualSelection`.
- `.planning/phases/07-build-time-edit-catalog-generator/07-04-PLAN.md` — content-collection index.
- `.planning/phases/07-build-time-edit-catalog-generator/07-05-PLAN.md` — `buildSha` injection + `.vercelignore` ship-to-prod assertion.
- `.planning/phases/07-build-time-edit-catalog-generator/07-VERIFICATION.md` — proof catalog ships to production.

### Source files this phase will touch
- `src/lib/feedback-version.ts` — ADD `MATCH_INJECT_VER` export alongside `FEEDBACK_INJECT_VER` (D-23).
- `src/integrations/edit-catalog/walker.mjs` — READ-ONLY; defines the catalog entry schema the matcher endpoint consumes.
- `src/lib/locator-signals.mjs` — READ-ONLY; the shared seam between catalog and inject. The Approve→staged-edit shape (D-24) derives locator tuple fields (`i18nKey`, `i18nAttr`, `imageRef`, `galleryAttrRaw`, `galleryIndex`, `nearbyText`, `nearestHeading`) from catalog entries using the same field names this helper uses.
- `src/pages/feedback.astro` — EXTEND with mode tabs + per-page input UI + side panel + picker HEAD-probe.
- `src/layouts/BaseLayout.astro` — EXTEND `?feedback=1` loader with the conditional `matchSet` branch that also loads `/feedback-match-inject.js?v=<MATCH_INJECT_VER>` (D-22).
- `public/feedback-inject.js` — FENCED. Read-only reference for sessionStorage key naming conventions (`mar_feedback_staged_v1`, `mar_feedback_draft_v1`, `mar_feedback_recent_v1`).
- `src/pages/api/feedback/submit.ts` — FENCED.
- `src/pages/api/feedback/validate.ts` — FENCED reference for the per-edit validator the Approve→staged-edit shape must pass.

### Codebase maps (for grounding)
- `.planning/codebase/ARCHITECTURE.md` §"Feedback mode" — system-level shape.
- `.planning/codebase/STRUCTURE.md` — directory layout + entry points.
- `.planning/codebase/CONVENTIONS.md` — naming, error-handling, commit-message, and CSS conventions (the new code must follow these; e.g., `kebab-case.ts` API routes, `export const prerender = false;` first line).
- `.planning/codebase/INTEGRATIONS.md` — external integration index (relevant: `@anthropic-ai/sdk` is NOT yet a declared dependency — Phase 8 will add it).
- `.planning/codebase/STACK.md` — Astro 6 + `@astrojs/vercel` + Node 24.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/lib/locator-signals.mjs`** — exported helpers (`closestAttr`, `i18nOf`, `imageRefOf`, `galleryOf`, `nearestHeading`, `domPathOf`, `visibleText`, `signalCount`) are the shared seam between Phase 7's walker and the v1.1 browser inject. The Approve handler (D-24) reads catalog entries (which were emitted using these helpers) and re-emits a v2 staged-edit locator without needing to call the helpers itself — the catalog already carries the resolved tuple.
- **`src/lib/auth.ts:checkAuth`** — HMAC-cookie session check used everywhere; `/api/feedback/match` reuses it byte-identically per the auth-gating pattern in `submit.ts`, `clarify.ts`, `validate.ts`.
- **`src/pages/feedback.astro:159` (`pagePick`)** — existing `<select>` enumerating addressable routes; re-used unchanged in per-page mode (D-20).
- **v1.1 corner chip** (inside `feedback-inject.js`, fenced) — already reads `mar_feedback_staged_v1` and renders an "N edits staged" badge. Approve in per-page mode writes through that same key (D-05) so the chip increments without any code change in the inject.
- **`@anthropic-ai/sdk`** — NOT YET INSTALLED. Phase 8 plan must add it to `dependencies` (not `devDependencies` — it's used at runtime in `src/pages/api/feedback/match.ts`).

### Established Patterns
- **API routes**: `kebab-case.ts` under `src/pages/api/`, first line `export const prerender = false;`, `try { ... } catch { return new Response(JSON.stringify({ error: '…' }), { status: 500 }); }`. Auth-protected routes short-circuit with 401 BEFORE any work (`if (!await checkAuth(request)) return new Response(...)`).
- **Cache-bust constants**: One source of truth per inject in `src/lib/feedback-version.ts`. Consumed in two places: the `BaseLayout.astro` loader's `?v=` AND the iframe `src` builder in `feedback.astro`. (`MATCH_INJECT_VER` follows this pattern exactly per D-23.)
- **sessionStorage key naming**: `mar_feedback_<name>_v<version>`. Conventions: `_v1` suffix means v1.x-family format (we do NOT bump it to v2 for additive changes per the v1.1 design).
- **i18n / locator attributes**: `data-i18n`, `data-i18n-html`, `data-i18n-placeholder`. The catalog kind enum is `image | gallery-image | i18n-text | i18n-html | heading | hardcoded-text`.
- **OPS-02 additive-only fence**: Every PR in this milestone MUST leave the editor flow + v1.1 feedback flow byte-for-byte unchanged. The fence is checked literally by `git diff <pre-v1.3-baseline> -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts public/feedback-inject.js src/pages/api/feedback/submit.ts src/pages/api/feedback/validate.ts`.

### Integration Points
- `/api/feedback/match` is a peer of `/api/feedback/submit`, `/api/feedback/validate`, `/api/feedback/clarify`, `/api/feedback/status/[issueNumber]` — same auth, same response idioms, same `prerender = false`.
- Catalog read path: in production, `dist/edit-catalogs/<route>.json` is shipped to the deploy (Phase 7's CATALOG-06) → reachable via HEAD + GET against `<deployed origin>/edit-catalogs/<route>.json`. The endpoint loads it server-side from the local filesystem (`dist/edit-catalogs/<route>.json` relative to the running function) in production, OR regenerates on-demand in dev per MATCH-02.
- The panel ↔ iframe ↔ inject conversation uses `window.postMessage` with explicit origin checks (`location.origin`). Three message types planned: `mar:feedback:matchset-stale` (iframe → panel, D-15), `mar:feedback:match-pick-manually` (panel → iframe, instructs inject to clear a pin and hand the row off to the v1.1 click flow's IDLE state per PANEL-03), and `mar:feedback:match-ready` (iframe → panel, confirms inject loaded and pins are painted — used for loading-state UX).

</code_context>

<specifics>
## Specific Ideas

- **Pin visual style:** numbered orange badge, top-left of the matched element's bounding box, using the existing `ACCENT` color from `feedback-inject.js` (OVERLAY-04). Visually distinguishable from the v1.1 per-element click overlay's hover/frozen states — the v1.1 inject uses a frozen outline; the match-inject uses a numbered badge with no element-outline by default.
- **Side panel scrollability:** the panel is independently scrollable from the iframe. On long match lists (the MATCH-07 cap is 150 elements + 10k chars of edit list), the panel maintains its own scroll position; the iframe scrolls independently to bring a focused match into view when a row is clicked.
- **"Match edits" button copy:** literal text "Match edits" per ROADMAP success criterion 2.
- **Stale-set banner copy:** "The site has been redeployed since these matches were generated. Click 'Re-run match' to refresh." — explicit user-visible action button rather than auto-rerun.

</specifics>

<deferred>
## Deferred Ideas

- **Auto-approval at high confidence** — even at confidence 1.0, every match requires explicit Approve. Already locked as a non-goal in REQUIREMENTS.md.
- **Mobile-specific UI for per-page review mode** — uses existing responsive patterns from `/feedback`; no dedicated mobile flow. Locked as a non-goal.
- **Persisting the freeform edit list beyond browser close** — sessionStorage scope only, matching v1.1 staged-edits storage decision. Locked as a non-goal.
- **Webhook-driven push for catalog updates** — catalogs read fresh per match request; no push notification or invalidation channel. Locked as a non-goal.
- **Multi-page per-batch matching** — D-03 limits the match set to one route at a time. A future "match across N pages" mode would need a different storage shape; out of scope for v1.3.
- **Editing the v1.1 inject to share state** — explicitly fenced by OPS-02 / OVERLAY-05. The two inject scripts will always be separate files with independent state.
- **Per-row "Why this match?" inspector beyond the inline reason** — current scope = one-line reason + alternates list. A modal or sidebar drill-down with catalog-entry details is a v1.4+ idea.
- **Persisting Rejected (N) decisions across browser close** — like staged edits, sessionStorage scope only (PANEL-05).
- **Phase 9 work — canary script `scripts/smoke-feedback-match.mjs` (OPS-05) + final OPS-02 byte-for-byte fence assertion** — handled by `/gsd-discuss-phase 9`, not here.

</deferred>

---

*Phase: 08-matcher-endpoint-match-inject-overlay-side-panel-per-page-mo*
*Context gathered: 2026-05-26*
