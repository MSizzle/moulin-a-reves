# Milestone v1.1 — Batch Feedback Pipeline

**Goal:** Let the client stage multiple feedback edits in a session and submit them as a single batch — one batch → one issue → one Claude PR → one merge → one deploy — replacing the current one-edit-per-deploy pattern that creates 8–10 deploys per client review pass.

**Source-of-truth spec:** user memory `moulin-batch-feedback-spec.md` (design decisions already made; 5 open UX questions explicitly deferred to `/gsd-discuss-phase`).

**Scope mode:** v1.1 = batch-feedback only. All structural deferrals (gallery modal, calendar 12-month, editor flow audit, Melissa's clarification answers) carry forward to v1.2 — see PROJECT.md → "Carried forward to v1.2".

---

## v1 Requirements

### STAGE — Client-side staging UI (`public/feedback-inject.js`)

- [ ] **STAGE-01**: Client can stage a confirmed edit instead of immediately submitting it; staged edits persist in `sessionStorage` and survive iframe navigation and reload (clear on browser close)
- [ ] **STAGE-02**: A corner chip appears after the first stage showing `N edits staged · Submit batch · View list`; click opens the panel
- [ ] **STAGE-03**: The panel shows each staged edit in plain language with a per-item ❌ delete button and a "Clear all" button at the bottom that requires a confirm before clearing
- [ ] **STAGE-04**: Client can submit the whole staged batch in one `POST /api/feedback/submit` call, which closes the panel and clears `sessionStorage` on success
- [ ] **STAGE-05**: Photo files are stored as File references in `sessionStorage` and encoded to base64 only at batch-submit time (avoids the ~5 MB `sessionStorage` cap that 12 MB photos would blow through)

### API — Server endpoint (`src/pages/api/feedback/submit.ts`)

- [ ] **API-01**: `POST /api/feedback/submit` accepts `schemaVersion: 2` batch payloads of shape `{ schemaVersion: 2, batch: true, edits: [...] }`
- [ ] **API-02**: `POST /api/feedback/submit` continues to accept `schemaVersion: 1` single-edit payloads indefinitely (back-compat — cached `feedback-inject.js` clients may stay in browser caches for days)
- [ ] **API-03**: Per-edit validation (vagueness check, photo size, locator quality, intent enum, EN/FR rule) runs on every edit in `edits[]`; if any edit fails, the entire batch is rejected with a structured per-edit-errors response so the UI can highlight which edits to fix or drop
- [ ] **API-04**: Per-edit validation logic is extracted into a shared helper consumed by both the v1 single-edit and v2 batch code paths (so the two paths can never drift)
- [ ] **API-05**: All photos in a batch commit to the same `feedback-incoming/issue-<n>/` directory and get patched into the issue body in a single PATCH call (not N PATCH calls)

### ISSUE — GitHub issue construction for batches

- [ ] **ISSUE-01**: One GitHub issue is created per batch, titled `[Feedback] batch of {N} edits — {comma-separated unique pageRoutes, truncated to 60 chars}`
- [ ] **ISSUE-02**: The issue body contains a per-edit human-readable summary section using the existing `renderHuman()` (one per edit, separated by `---`)
- [ ] **ISSUE-03**: The issue body contains a single fenced ```` ```json ```` block holding the entire `edits[]` array (the Action reads this via `gh issue view`, not via YAML interpolation, to preserve prompt-injection safety)
- [ ] **ISSUE-04**: The autonomy hint embedded in the issue body passes only if every edit individually passes the autonomy gate; failure-reason string lists which edits failed and why

### ACTION — Claude Code Action behavior (`.github/CLAUDE_FEEDBACK.md`)

- [ ] **ACTION-01**: `.github/CLAUDE_FEEDBACK.md` has a new `## 8. Batch submissions` section documenting v2 schema detection (`schemaVersion=2 && batch=true`), the per-edit-passes-required autonomy rule, and explicit inheritance of EN/FR + disallowed-paths rules per edit
- [ ] **ACTION-02**: A batched issue produces a single branch (e.g. `feedback/issue-<n>-batch-<N>`), a single commit, and a single PR with all edits applied (no per-edit branch fan-out)
- [ ] **ACTION-03**: The Action posts ONE result comment per batch summarizing how many edits applied and which (if any) failed (e.g., "Applied 3 of 4 edits; edit #4 had only 1 locator signal so the whole set is in review")

### OPS — Cache-bust, additive guarantee, docs, verification

- [ ] **OPS-01**: `FEEDBACK_INJECT_VER` in `src/lib/feedback-version.ts` is bumped before merge (without it browsers serve the cached v1 inject script and the new state machine never loads)
- [ ] **OPS-02**: Editor flow (`?edit=1`, `editor-inject.js`, `editor/`, `site/save.ts`, `site/publish.ts`, `guardrails.js`) is byte-for-byte unchanged in the v1.1 PR diff (additive-only constraint — verifiable via `git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts`)
- [ ] **OPS-03**: `CLAUDE.md` "Feedback mode" section gains a one-line note about batching so future devs / AI know the v2 schema exists
- [ ] **OPS-04**: After deploy, a regression canary verifies a `schemaVersion: 1` single-edit payload still works (curl with old-shape JSON → existing single-edit issue path)
- [ ] **OPS-05**: After deploy, a batched canary submission (using the `client-feedback-test` label OR with `DRY_RUN=true` first) produces ONE issue with all edits in the JSON block, ONE Claude PR, and the correct autonomy verdict; cache-bust is verified by checking the network tab for `feedback-inject.js?v=<NEW_VER>`

---

## Future Requirements

Items deferred from this milestone:

- *(none — see "Open design questions" below; those are scoped to discuss-phase, not deferred features)*

---

## Out of Scope

Explicit exclusions for v1.1, with reasoning:

- **Editor-flow changes** — the feedback flow shipped as a sibling system to the editor flow and the editor was left byte-for-byte unchanged. Batch-feedback maintains the same property. Editor-flow audit is a v1.2 candidate (`AUDIT-DEEP-01`).
- **Autonomy-gate redesign** — the gate works; batch-feedback lives one layer above it (per-edit invocation). Don't redesign.
- **Auto-batching heuristics** — no "client submitted 3 things in 30 seconds → batch them" detection. Explicit "Stage / Submit Batch" UI is clearer; implicit batching breaks user intent.
- **New endpoint** — extend `submit.ts` to accept two payload shapes. Do not add `POST /api/feedback/submit-batch`.
- **Server-side draft persistence** — the spec memory's option (c) (`client-feedback-draft`-labelled draft issues) is rejected for v1.1; `sessionStorage` is sufficient. Lift to v1.2 only if real demand emerges.
- **`localStorage` draft persistence** — same rationale; `sessionStorage` (clears on browser close) is the chosen lifetime.
- **Per-batch hard caps on edit count or total photo MB** — DEFERRED to `/gsd-discuss-phase` as open design question #1; if caps are needed they get added as STAGE-06 / API-06 during planning.
- **Cross-page batching confirmation** — DEFERRED to `/gsd-discuss-phase` as open design question #2; default behavior in spec supports it, but UX confirmation needed.
- **More-conservative batch autonomy thresholds** — DEFERRED to `/gsd-discuss-phase` as open design question #4; current default is per-edit thresholds (inherited from existing gate).
- **All v1.2-carried items from PROJECT.md** — gallery modal rewrite, calendar 12-month range, editor flow audit, Melissa's clarification answers.

---

## Open Design Questions (deferred to `/gsd-discuss-phase`)

These five items live in the spec memory and intentionally are NOT v1.1 requirements — they should be settled during discussion, not pre-decided here:

1. **Per-batch size caps** — hard limit on edit count (e.g., 10)? Hard limit on total photo MB (e.g., 30)?
2. **Cross-page batching** — confirm clients want to stage across home → /homes/le-moulin/ → submit? Current sessionStorage design supports it trivially.
3. **Draft persistence beyond browser close** — sessionStorage (default) vs localStorage vs server-side draft issues?
4. **Autonomy threshold inheritance** — keep per-edit thresholds, or require ≥3 locator signals across the batch?
5. **Mid-batch cancel UX** — confirm dialog vs toast vs irrevocable click for "Clear all"?

Resolutions become additional STAGE-* / API-* / ACTION-* requirements during planning.

---

## Architectural Constraints (must be respected)

From `CLAUDE.md` and prior project conventions — these are not requirements but they bound every requirement above:

- **Additive-only pattern** — the editor flow stays untouched (OPS-02 enforces).
- **Client↔server validation mirror** — whatever client validates, server re-validates (API-03 enforces).
- **Prompt-injection safety** — workflow only interpolates the integer issue number; JSON block read via `gh issue view`, not YAML inlining (ISSUE-03 enforces).
- **HTML translation keys** — if batch UI introduces translatable strings into the inject chip, use `data-i18n-html` (not `data-i18n`); admin-facing chip text may skip i18n entirely.
- **Bilingual or nothing** — every copy edit in a batch must update EN and FR (or carry `okToTranslate=true`); the autonomy gate evaluates this per-edit (ISSUE-04 enforces).

---

## Traceability

| REQ-ID | Phase | Plan | Status |
|--------|-------|------|--------|
| STAGE-01 | TBD | TBD | open |
| STAGE-02 | TBD | TBD | open |
| STAGE-03 | TBD | TBD | open |
| STAGE-04 | TBD | TBD | open |
| STAGE-05 | TBD | TBD | open |
| API-01 | TBD | TBD | open |
| API-02 | TBD | TBD | open |
| API-03 | TBD | TBD | open |
| API-04 | TBD | TBD | open |
| API-05 | TBD | TBD | open |
| ISSUE-01 | TBD | TBD | open |
| ISSUE-02 | TBD | TBD | open |
| ISSUE-03 | TBD | TBD | open |
| ISSUE-04 | TBD | TBD | open |
| ACTION-01 | TBD | TBD | open |
| ACTION-02 | TBD | TBD | open |
| ACTION-03 | TBD | TBD | open |
| OPS-01 | TBD | TBD | open |
| OPS-02 | TBD | TBD | open |
| OPS-03 | TBD | TBD | open |
| OPS-04 | TBD | TBD | open |
| OPS-05 | TBD | TBD | open |

*Phase / Plan / Status columns are populated by the roadmapper and updated during execution.*

---

*Created 2026-05-20 during `/gsd-new-milestone v1.1` — Batch Feedback Pipeline*
