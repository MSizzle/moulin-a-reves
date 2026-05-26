# Milestone v1.3 Requirements — File-Driven Per-Page Edit Flow

**Goal:** Let the client paste a freeform list of changes for any single page, have Claude Haiku map each line to an addressable DOM element via a build-time edit catalog, and approve/reject each proposed match in a side panel before the approved set flows through the existing v1.1 batch pipeline unchanged.

**Design source:** [`/Users/Montster/.claude/plans/a-couple-ideas-this-melodic-nebula.md`](/Users/Montster/.claude/plans/a-couple-ideas-this-melodic-nebula.md) Feature 2.

**Cross-milestone invariants** (carried from v1.1/v1.2 — non-negotiable):
- Editor-flow files (`public/editor-inject.js`, `public/editor`, `public/guardrails.js`, `src/pages/api/site`, `middleware.ts`) are byte-for-byte unchanged across the entire milestone.
- `public/feedback-inject.js` and the v1 + v2 batch submit endpoint behaviour remain unchanged — v1.3 is purely additive.
- Every cache-busted client script bumps its version constant on every behavioural change.
- Bilingual rule (EN+FR or `okToTranslate=true`) applies per-edit at submit time, enforced by the existing shared validator.

---

## v1 Requirements

### CATALOG — build-time edit catalog generation

- [ ] **CATALOG-01**: An Astro post-build integration walks the emitted HTML in `dist/` after `astro build` and writes one JSON file per prerendered route to `dist/edit-catalogs/<route>.json`.
- [ ] **CATALOG-02**: Each catalog entry exposes stable `id`, `kind` ∈ {`i18n-text`, `i18n-html`, `image`, `gallery-image`, `heading`, `hardcoded-text`}, and locator-signal fields where applicable: `i18nKey`, `i18nAttr`, `currentText`, `currentTextFr`, `nearestHeading`, `domPath`, `imageRef`, `altText`.
- [ ] **CATALOG-03**: The catalog walker reuses the existing closestAttr / i18nOf logic from `public/feedback-inject.js:169-185` via a shared Node-side helper so the catalog's locator signals stay byte-identical to the ones the per-element click flow would compute.
- [ ] **CATALOG-04**: `kind: 'hardcoded-text'` rows are emitted **only** when the text appears in `src/content/**/*.md` frontmatter; text without an i18n key or content-collection source is flagged as `requiresManualSelection: true` so the matcher cannot return an ambiguous locator.
- [ ] **CATALOG-05**: Each catalog includes a `buildSha` field so the rail can detect when the deployed "Live" site is newer than the catalog used for matching (catalog-drift signal).
- [ ] **CATALOG-06**: `dist/edit-catalogs/` is added to `.vercelignore` only if it should NOT ship (decision: ship to production so the matcher endpoint can read it via the filesystem on Vercel). Document the call in the phase plan.

### MATCH — matcher endpoint + Claude Haiku integration

- [ ] **MATCH-01**: A new auth-gated `POST /api/feedback/match` route lives at `src/pages/api/feedback/match.ts`, declares `prerender = false`, and accepts `{ route: string, editList: string }`.
- [ ] **MATCH-02**: The endpoint loads `dist/edit-catalogs/<route>.json` (or regenerates the catalog on-demand in dev) and refuses the request with a structured 404 if the catalog is missing.
- [ ] **MATCH-03**: The endpoint calls `claude-haiku-4-5` via the official Anthropic SDK with a prompt of the form: *"Here is a catalog of editable elements on the page <route>. Match each numbered line below to the most likely element ID, with confidence, and up to 2 alternate IDs. If no match, return null."* — the prompt includes `nearestHeading` + `currentText` per element for disambiguation.
- [ ] **MATCH-04**: Response shape: `{ matches: [{ line: string, primaryId: string | null, primaryConfidence: number, alternates: string[], reason: string }] }`. The endpoint validates that every `primaryId` and `alternates[]` ID exists in the catalog; unknown IDs are stripped before returning.
- [ ] **MATCH-05**: The input parser tolerates bullet lists (`-`, `*`, `1.`, `2.`), free-paragraph form, and section headers (treated as context, not lines). One non-header line = one edit candidate.
- [ ] **MATCH-06**: `ANTHROPIC_API_KEY` is read from server env only and is never exposed to the client; the endpoint returns a structured 500 with `{ error: 'matcher_unavailable' }` if unset.
- [ ] **MATCH-07**: Per-request cost guardrails — refuse `editList` over a fixed character cap (e.g. 10,000 chars) and catalogs over a fixed element cap (e.g. 150 elements) with a clear error code so the UI can surface the cap to the client.

### OVERLAY — pin overlay inject

- [ ] **OVERLAY-01**: A new `public/feedback-match-inject.js` script is loaded by `BaseLayout.astro`'s `?feedback=1` loader **only** when the `matchSet` query parameter is present (the existing `?feedback=1` per-element click flow loader stays untouched).
- [ ] **OVERLAY-02**: On load, the inject reads the match set from `sessionStorage` (the parent `/feedback` page stashes it after `/api/feedback/match` returns) and ignores stale match sets where the catalog `buildSha` no longer matches the deployed `<meta name="x-build-sha">` value.
- [ ] **OVERLAY-03**: For each matched element, the inject queries the DOM via `[data-i18n="X"]`, `img[src="Y"]`, or `domPath` fallback (in that priority order) and applies `[data-fb-match]="N"`.
- [ ] **OVERLAY-04**: A numbered orange badge floats top-left of each matched element's bounding box, using the existing `ACCENT` color from `feedback-inject.js` so the visual language stays consistent.
- [ ] **OVERLAY-05**: `feedback-match-inject.js` is a fully separate file from `feedback-inject.js`; it does **not** import from, mutate, or share state with the existing per-element click state machine. `git diff main -- public/feedback-inject.js` returns zero lines.

### PANEL — Approve / Reject / Pick-manually side panel

- [ ] **PANEL-01**: The side panel renders one row per freeform line with: the input text, the primary matched element's preview (current text or image thumbnail), confidence indicator, alternate matches, and Approve / Reject / Pick-manually buttons.
- [ ] **PANEL-02**: Approve builds a v2 staged edit using the exact shape `feedback-inject.js:captureLocator` + `submitBatch` produces today, and stashes it in the existing `sessionStorage['mar_feedback_staged_v1']` so the v1.1 corner chip picks it up unchanged.
- [ ] **PANEL-03**: Pick-manually clears that row's highlight and hands off to the existing per-element click flow's IDLE state (the user clicks the element directly to override the match); the panel row updates to show the manual selection's preview.
- [ ] **PANEL-04**: Reject drops the row without staging anything; the row visually collapses but the side panel keeps a "Rejected (N)" counter so the user can re-open rejected rows before submitting the batch.
- [ ] **PANEL-05**: Panel state persists across iframe navigation (sessionStorage) and clears on browser close — matching the staged-edits behavior shipped in v1.1 STAGE-04.

### MODE — per-page input mode on /feedback

- [ ] **MODE-01**: `/feedback` (`src/pages/feedback.astro`) gains a "Per-page review" mode UI with a page picker (re-using the existing `picker` element), a textarea for the freeform edit list, and a "Match edits" submit button.
- [ ] **MODE-02**: Clicking "Match edits" POSTs to `/api/feedback/match`, stashes the response in sessionStorage keyed by a generated match-set ID, then sets the iframe `src` to `<route>?feedback=1&matchSet=<id>&v=<MATCH_INJECT_VER>`.
- [ ] **MODE-03**: Per-page review mode is auth-gated by the same `checkAuth()` that already gates `/feedback`; no new login surface.
- [ ] **MODE-04**: The existing per-element click flow remains available; the two modes coexist via a tab/toggle on the `/feedback` shell, and switching modes is a no-op for the other mode's state (sessionStorage isolation).

### OPS — cache-bust, env, additive-only fence

- [ ] **OPS-01**: A new cache-bust constant `MATCH_INJECT_VER` lives alongside `FEEDBACK_INJECT_VER` in `src/lib/feedback-version.ts`; it is bumped on every behavioural change to `feedback-match-inject.js`, mirroring the v1.1 OPS-01 contract.
- [ ] **OPS-02**: `git diff <pre-v1.3-baseline> -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts public/feedback-inject.js src/pages/api/feedback/submit.ts src/pages/api/feedback/validate.ts` returns zero lines across the entire milestone PR set (editor-flow + v1.1 inject + submit/validate byte-for-byte unchanged).
- [ ] **OPS-03**: `ANTHROPIC_API_KEY` is added to the Vercel project env under Production scope only (mirroring the v1.2 VERCEL_TOKEN scoping pattern); a missing key degrades the matcher gracefully (returns structured 500, UI surfaces a clear error, per-element click flow unaffected).
- [ ] **OPS-04**: `CLAUDE.md` "Feedback mode" section gets a one-line note about per-page review + `/api/feedback/match` so future Claude Code sessions discover the second flow.
- [ ] **OPS-05**: Reusable canary `scripts/smoke-feedback-match.mjs` runs in dual modes (unit-stub with mocked Anthropic SDK + canary against deployed `TARGET_URL`); wired into `scripts/canary.sh` default sequence and `npm run canary:match`.

---

## Future Requirements

Items called out in the plan doc as v2-of-this-feature or future iterations — captured here so they don't get lost:

- **Markdown / .txt file upload** for the freeform input (plan doc: "textarea-first, with `.md` / `.txt` upload as v2 of this feature").
- **Runtime catalog regeneration** via `cheerio` walking live HTML when build-time catalogs are stale (plan doc trade-off discussion).
- **Per-element screenshot thumbnails** in the catalog (plan doc lines 124-125 — `screenshotHint` field reserved but unused in v1.3).
- **Embedding-based retrieval** as an alternative to Haiku for matching (plan doc: "Embedding-based retrieval would also work but Claude can also use the `nearestHeading` + `currentText` context for disambiguation in one shot" — revisit if Haiku cost or latency becomes problematic).
- **Build SHA drift handling in the UI** beyond catalog-rejection — surface a "your catalog is stale, refresh" prompt vs silently dropping match sets.

---

## Out of Scope

Explicit boundaries for v1.3 to prevent scope creep:

- **Modifying the v1.1 batch submit endpoint** (`src/pages/api/feedback/submit.ts`) or the shared validator (`src/pages/api/feedback/validate.ts`) — v1.3 is additive on top, not a rewrite.
- **Modifying the Claude Code Action** (`.github/workflows/claude.yml`) or the operating manual (`.github/CLAUDE_FEEDBACK.md`) — the agent's downstream behavior is unchanged; the autonomy gate still evaluates per-edit using the existing rules.
- **Cross-page matching in a single match call** — the matcher endpoint accepts exactly one route per request; multi-page batching happens client-side by submitting multiple match calls and merging results into the same staged-edits sessionStorage bucket.
- **Auto-approval based on high confidence alone** — even at confidence 1.0, the user always approves each match (plan doc: "Surface confidence + alternates always; never auto-approve from match alone").
- **Touching the editor flow** (`?edit=1`, `editor-inject.js`, `editor/`, `site/save.ts`, `site/publish.ts`, `guardrails.js`) — the additive-only fence from v1.1 OPS-02 remains the hard merge gate.
- **Mobile-specific UI for the per-page review mode** — uses existing responsive patterns from `/feedback`; no dedicated mobile flow.
- **Persisting the freeform edit list beyond browser close** — sessionStorage scope only, matching v1.1 staged-edits storage decision.
- **Webhook-driven push for catalog updates** — catalogs are read fresh per match request; no push notification or invalidation channel.

---

## Traceability

| Requirement | Phase | Plan |
|-------------|-------|------|
| CATALOG-01..06 | TBD by roadmapper | — |
| MATCH-01..07 | TBD by roadmapper | — |
| OVERLAY-01..05 | TBD by roadmapper | — |
| PANEL-01..05 | TBD by roadmapper | — |
| MODE-01..04 | TBD by roadmapper | — |
| OPS-01..05 | TBD by roadmapper | — |

(Filled in by `/gsd:plan-phase` and verified at milestone audit close.)
