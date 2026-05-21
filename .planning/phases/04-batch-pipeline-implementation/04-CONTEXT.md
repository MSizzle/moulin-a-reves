# Phase 4: Batch Pipeline Implementation - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the current 1-edit-per-deploy `?feedback=1` flow with a stage-then-submit batch model that ships as a single PR (~450 LOC across `public/feedback-inject.js`, `src/pages/api/feedback/submit.ts`, `src/lib/feedback-version.ts`, `.github/CLAUDE_FEEDBACK.md`, `CLAUDE.md`).

In one PR the phase delivers:

- A client-side state machine in `feedback-inject.js` that lets the client confirm an edit, see it staged in a corner chip, optionally stage more (including across iframe navigations), then submit the whole batch as **one** `POST /api/feedback/submit` call.
- A `schemaVersion: 2 + batch: true` payload path in `submit.ts` that **co-exists indefinitely** with the existing `schemaVersion: 1` single-edit path (cached browsers must keep working).
- Per-edit validation extracted into a single shared helper consumed by both the v1 and v2 code paths so they cannot drift.
- One GitHub issue per batch (per-edit `renderHuman()` summaries separated by `---`, plus a single fenced ` ```json ` block containing the entire `edits[]` array, with an autonomy hint that passes only if every edit individually passes).
- A new `## 8. Batch submissions` section in `.github/CLAUDE_FEEDBACK.md` so the Action produces ONE branch / ONE commit / ONE PR / ONE result comment per batch.
- `FEEDBACK_INJECT_VER` bump in `src/lib/feedback-version.ts` so cached clients pick up the new inject script.
- Editor flow (`?edit=1`, `editor-inject.js`, `editor/`, `site/save.ts`, `site/publish.ts`, `guardrails.js`, `middleware.ts`) MUST be byte-for-byte unchanged in the PR diff.

Out of this phase: post-deploy canary work (lives in Phase 5: OPS-04, OPS-05); server-side draft persistence (v1.2 candidate); autonomy-gate redesign (do not touch).

</domain>

<decisions>
## Implementation Decisions

> **Note:** No SPEC.md exists for this phase. The 20 locked requirements live in `.planning/REQUIREMENTS.md` (STAGE-01..05, API-01..05, ISSUE-01..04, ACTION-01..03, OPS-01..03). Downstream agents MUST read REQUIREMENTS.md and the spec memory `moulin-batch-feedback-spec.md` (see Canonical References) before planning.
>
> The decisions below resolve the 5 open design questions REQUIREMENTS.md explicitly deferred to discuss-phase. They emerge as additions/clarifications on top of the 20 locked requirements.

### Per-batch safety limits (Q1 → resolved)

- **D-01:** **Cap the batch at 10 edits.** Hard limit enforced client-side in `feedback-inject.js` and re-enforced server-side in `submit.ts` (mirror rule). Matches the upper bound of the "8–10 small edits per 10-min review pass" usage pattern documented in the spec memory; gives the runner a bounded job size and the chip a clean "limit reached, submit this batch first" UX state.
- **D-02:** **Cap total batch photo size at 30 MB.** Sum of all `image.bytes` across `edits[]` ≤ 30 MB. Existing per-photo cap stays at 12 MB (`MAX_IMAGE_BYTES` in `submit.ts:19`) — do not lower it.
- **D-03:** **Vercel function payload limit is the binding upstream constraint.** The cap above (30 MB) almost certainly exceeds the request body limit (Hobby/Pro default ≈ 4.5 MB; base64 inflates ~33%). **Research/plan-phase MUST verify the current Vercel project's request-body limit** and either (a) confirm the project tier allows ≥ ~40 MB requests, (b) lower D-02 to fit, or (c) switch the batch upload to multipart/streaming. This is a planning concern, not a discuss concern — caps are the correct design; the exact number is research-bounded.
- **D-04:** **Cap enforcement UX:** when the next stage would breach a cap, show an inline message in the panel ("This batch is full — submit it before staging more") and disable the "Confirm" button on the open edit. No silent drops, no auto-submit.
- **D-05:** Emerges as new requirements during planning: **STAGE-06** (client enforces edit-count + total-photo-MB caps), **STAGE-07** (chip "limit reached" UX), **API-06** (server re-validates both caps; reject oversize batches with structured per-cap error so the UI can highlight which cap was hit). Roadmapper / planner add these to REQUIREMENTS.md traceability table.

### Cross-page batching (Q2 → resolved)

- **D-06:** **Cross-page batching IS supported.** A client can stage on `/`, navigate inside the iframe to `/homes/le-moulin/`, stage more, and submit them together as one batch. The sessionStorage design already supports this trivially (sessionStorage is per-origin and survives iframe navigation within the same browsing context). No additional requirement needed; only confirm during plan-phase that the iframe navigation rehydrates the chip on the new page.
- **D-07:** The issue title `[Feedback] batch of {N} edits — {comma-separated unique pageRoutes, truncated to 60 chars}` (ISSUE-01) naturally accommodates multi-route batches. No change there.

### Draft persistence lifetime (Q3 → resolved)

- **D-08:** **sessionStorage only.** Stages survive iframe navigation and reload; clear on browser close. This is option (a) from the spec memory and matches REQUIREMENTS.md "Out of Scope" which explicitly rejects (b) localStorage and (c) server-side draft issues for v1.1. Lift to v1.2 only if real demand emerges.
- **D-09:** **Photo Files stay as File references in sessionStorage**, encoded to base64 only at batch-submit time (already locked in STAGE-05). This avoids blowing past sessionStorage's ~5 MB cap when 12 MB photos are staged.

### Autonomy threshold inheritance (Q4 → resolved)

- **D-10:** **Per-edit autonomy thresholds — no batch-level redesign.** The autonomy gate (≥2 locator signals for `change-wording`/`replace-photo`, etc.) runs unchanged per edit; the batch passes the autonomy gate iff every edit passes individually. Failure-reason string lists which edits failed and why (already locked in ISSUE-04). Anchored by spec memory "What NOT to do": *"Don't redesign the autonomy gate. It works; the batch feature lives one layer above it (per-edit invocation)."*

### Mid-batch cancel UX (Q5 → resolved)

- **D-11:** **"Clear all" uses a confirm dialog**, not a toast-with-undo and not an irrevocable click. Staged edits represent real client work — a confirm dialog is the right friction. Already implicit in STAGE-03 ("a 'Clear all' button at the bottom that requires a confirm before clearing"); this decision just confirms the implementation form (modal/native confirm dialog, not a 5-second toast-undo pattern).
- **D-12:** **Per-item ❌ delete on individual staged edits is irrevocable (no confirm).** STAGE-03 already specifies per-item delete without a confirm requirement, and one-click delete with the option to re-stage is the right UX weight for a single item. Only "Clear all" gets the confirm.

### Cross-cutting / carried-forward (not new — re-stated for the planner)

- **D-13:** **Additive-only.** Editor flow files are byte-for-byte unchanged in the PR diff (OPS-02). The merge gate is `git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts` returning zero lines.
- **D-14:** **Cache-bust.** `FEEDBACK_INJECT_VER` in `src/lib/feedback-version.ts` (currently `'1'`) must bump (e.g., to `'2'`) in the same PR (OPS-01). Without this, cached browsers continue running v1 inject indefinitely and the new state machine never loads.
- **D-15:** **Shared validator.** Per-edit validation is extracted into a single helper consumed by both the v1 single-edit and v2 batch code paths (API-04) — the two paths can never drift. This is non-negotiable; the planner should make extraction Step 1 of the plan.
- **D-16:** **One endpoint, two payload shapes.** Do not add `POST /api/feedback/submit-batch`. The existing `submit.ts` branches on `schemaVersion`/`batch`. v1 path stays for cached clients.
- **D-17:** **Bilingual or `okToTranslate=true`** applies per-edit in a batch (carried from v1.0 + ISSUE-04 autonomy-per-edit rule).
- **D-18:** **Atomic per-requirement commits** convention from v1.0 holds — one REQ-ID per commit so the audit trail stays scannable. Single-PR scope, not single-commit scope.
- **D-19:** **CLAUDE.md "Feedback mode" section gains a one-line note about v2 batching** in the same PR (OPS-03).

### Claude's Discretion

- Exact chip visual styling (font, color, position) — not specified; planner picks something consistent with the existing `?feedback=1` UI vocabulary (the existing feedback-inject likely already has a visual idiom worth reusing). Admin-facing UI; not subject to i18n.
- Whether to use a native `window.confirm()` or a small in-iframe modal for the "Clear all" confirm — both satisfy D-11. Planner picks based on what's lightest to add in `feedback-inject.js` without pulling in extra UI deps.
- Branch name format under `feedback/issue-<n>-batch-<N>` — example, not lock; planner can refine if conflicts arise.
- File/function split for the shared validator (`src/pages/api/feedback/validate.ts` vs colocated in `submit.ts`) — planner's call; D-15 only mandates *that* it's shared, not *where* it lives.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked requirements & scope

- `.planning/REQUIREMENTS.md` — 20 v1.1 requirements scoped to Phase 4 (STAGE-01..05, API-01..05, ISSUE-01..04, ACTION-01..03, OPS-01..03), plus the "Out of Scope" rejections (server-side drafts, localStorage drafts, auto-batching heuristics, new endpoint, autonomy-gate redesign). The 5 open design questions resolved in this CONTEXT.md live in the "Open Design Questions" section.
- `.planning/ROADMAP.md` §"Phase 4: Batch Pipeline Implementation" — phase goal, dependencies (none), success criteria (5 numbered, MUST be TRUE before merge).
- `.planning/PROJECT.md` — milestone v1.1 framing, "Carried forward to v1.2" deferrals (don't bleed into this phase), Key Decisions table (i18n dual-store, atomic per-REQ commits, "newest round wins").
- **User memory `~/.claude/projects/-Users-Montster-Melissa-Maison-Website/memory/moulin-batch-feedback-spec.md`** — original design seed for this feature (MUST READ before planning). Contains: client state machine diagram, payload shape examples, issue construction rules, operating-manual change list, cache-bust rationale, "What NOT to do" section. Note this lives outside the repo — full path above.
- `.planning/STATE.md` §"Pending Todos" / §"Blockers/Concerns" — context on why OPS-01 (cache-bust) and OPS-02 (additive-only) are release blockers.

### Project conventions

- `CLAUDE.md` §"Architectural Constraints" → "Feedback mode" — describes the feedback flow as a SIBLING of the editor flow; lists the cache-bust rule, `feedback-incoming/` directory convention, prompt-injection-safe issue body pattern. OPS-03 adds a one-line note to this section.
- `CLAUDE.md` §"Conventions" → "Naming Patterns" / "Code Style" — `camelCase` JS, single-quote strings, 2-space indent, kebab-case files, BEM CSS, named exports only, `export const prerender = false;` on every API route.
- `CLAUDE.md` §"Anti-Patterns" — `data-i18n-html` vs `data-i18n`, no `getCollection()`, no editing `src/i18n/translations.ts` for runtime changes, dual-store i18n rule.
- `.planning/codebase/ARCHITECTURE.md` and `.planning/codebase/INTEGRATIONS.md` — current state of the feedback pipeline before this phase.

### Files being modified

- `public/feedback-inject.js` (710 LOC) — extend the existing click → intent → detail → confirm → POST loop into click → … → confirm → STAGE → (loop OR Submit). Existing `validateFields` (line 482) is the per-edit validator the new chip needs to call; `SCHEMA_VERSION` constant (line 237) becomes a v2 branch.
- `src/pages/api/feedback/submit.ts` (364 LOC) — extend the existing handler. Existing per-edit logic of interest: `renderHuman()` (line 330), `MAX_IMAGE_BYTES` constant (line 19), `INTENTS` enum (line 16), schema-version check (line 148). The shared validator extraction (D-15) should preserve all of these.
- `src/lib/feedback-version.ts` (12 LOC) — bump the single constant `FEEDBACK_INJECT_VER` from `'1'` to `'2'`.
- `.github/CLAUDE_FEEDBACK.md` (192 LOC) — add a new `## 8. Batch submissions` section (per ACTION-01).
- `CLAUDE.md` §"Feedback mode" — one-line note about v2 batching (OPS-03).
- NEW (planner's call): a shared validator module if extracted out of `submit.ts` (D-15 / API-04).

### External / runbook context

- PR #73 architectural rationale: <https://github.com/MSizzle/moulin-a-reves/pull/73> (original feedback-pipeline PR; explains why the JSON-block-in-issue-body / autonomy-hint design exists and the prompt-injection safety property).
- User memory `~/.claude/projects/-Users-Montster-Melissa-Maison-Website/memory/moulin-feedback-action-setup.md` — 4 non-obvious knobs on the auto-merge Action (OAuth token, `--max-turns`, settings allowlist, GH-Actions PR-creation toggle) plus canary protocol. Relevant if planning touches `.github/workflows/claude.yml` (it shouldn't — spec memory says "Workflow file changes: None required").
- User memory `~/.claude/projects/-Users-Montster-Melissa-Maison-Website/memory/moulin-pat-rotation.md` — PAT/token rotation runbook. Relevant only if canary work (Phase 5) needs token rotation.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`renderHuman(loc, intent)`** in `src/pages/api/feedback/submit.ts:330` — already produces the human-readable per-edit summary. Batch-issue body just loops `edits[]` and joins with `\n\n---\n\n`.
- **`validateFields(intent, d)`** in `public/feedback-inject.js:482` — current client-side validator. The shared-validator extraction (D-15) starts here on the client side; the server's matching logic in `submit.ts` (around line 155, the `img.bytes > MAX_IMAGE_BYTES` family of checks) is the other half. They already mirror; extracting the shared rules into one module keeps that property as both paths grow.
- **`MAX_IMAGE_BYTES = 12 * 1024 * 1024`** in `submit.ts:19` — existing per-photo cap. Reuse, do not lower; the new caps (D-01, D-02) are batch-level on top of this.
- **`SCHEMA_VERSION`** constant in both `submit.ts` and `feedback-inject.js` — the dispatch key for v1 vs v2 branching.
- **`feedback-incoming/issue-<n>/<file>`** directory convention — already in place (CLAUDE.md "Feedback mode" → "`feedback-incoming/` rule"). Batch puts all photos under the same `issue-<n>/` (API-05); the existing Action workflow already deletes the directory in the same commit it consumes the files, so cleanup is free.
- **`.vercelignore`** already excludes `feedback-incoming/` — no risk of accidentally deploying staged client uploads.

### Established Patterns

- **Sibling-of-editor design.** Two parallel `BaseLayout.astro` inline loader blocks: one for `?edit=1` (untouched, sacred), one for `?feedback=1` (what this phase extends). Stay additive; never touch the editor block.
- **Cache-bust via single constant import.** `FEEDBACK_INJECT_VER` is imported by both `BaseLayout.astro` and `feedback.astro` so the loader `?v=` and iframe `src` versions stay in lockstep. Mirror the existing `EDITOR_INJECT_VER` pattern (if present in the codebase) — bumping the constant is the cache-bust.
- **Prompt-injection safety: integer-only interpolation.** The GitHub workflow only ever interpolates the integer issue number into Claude's prompt; the JSON edit payload is read by Claude via `gh issue view`. Preserve this: the new `## 8. Batch submissions` doc in `CLAUDE_FEEDBACK.md` should instruct Claude to read the JSON block via `gh issue view`, never via YAML interpolation.
- **Atomic per-requirement commits.** Phase 2 of v1.0 set the precedent: one REQ-ID per commit. Phase 4 ships ~450 LOC across one PR but the commits inside that PR should follow the same convention (one per REQ-ID where practical), so the PR review can scan REQ-by-REQ.
- **`export const prerender = false;`** as the first line of every API route. `submit.ts` already has it; nothing changes.
- **HTML translation keys use `data-i18n-html`, not `data-i18n`.** Chip text is admin-facing only, so it can skip i18n entirely (decision left to planner).

### Integration Points

- **`feedback-inject.js` ↔ `submit.ts`** — POST body shape and validation rules are the contract. After D-15 extraction, both sides import / mirror the same validator module so drift is structurally impossible.
- **`submit.ts` ↔ GitHub Issues API** — `gh-api` style fetch (existing pattern); batch path adds one extra PATCH to write the JSON block + photo paths after the issue exists and after all photos are committed to `feedback-incoming/issue-<n>/` (API-05).
- **GitHub issue ↔ `.github/CLAUDE_FEEDBACK.md` / `claude.yml`** — `client-feedback` label triggers the Action; new `## 8.` section tells Claude how to detect and handle v2 batches. No workflow file changes (per spec memory).
- **`FEEDBACK_INJECT_VER` ↔ `BaseLayout.astro` / `feedback.astro`** — both files import the constant. Touching either is invisible without bumping the constant.

</code_context>

<specifics>
## Specific Ideas

- Chip copy is **`N edits staged · Submit batch · View list`** (from PROJECT.md Target Features and ROADMAP.md success criteria #1). Plain-language per-item summaries inside the panel.
- Issue title pattern: **`[Feedback] batch of N edits — <comma-separated unique pageRoutes>`** (ISSUE-01).
- Branch name pattern (Action side): **`feedback/issue-<n>-batch-<N>`** (ROADMAP.md success criteria #4; example pattern, not strict lock).
- Cap-reached state in panel: **"This batch is full — submit it before staging more"** (D-04 phrasing suggestion; planner may refine).
- One-line CLAUDE.md doc note (OPS-03 / D-19): something like *"v2 batched submissions are detected by `schemaVersion: 2 && batch: true`; per-edit validation runs through the shared helper used by both v1 and v2 paths."*
- The Action result comment should be summarized per ACTION-03, e.g., *"Applied 3 of 4 edits; edit #4 had only 1 locator signal so the whole set is in review"* — spec memory's example phrasing is fine to reuse.

</specifics>

<deferred>
## Deferred Ideas

These came up implicitly through the open design questions but are explicitly out of v1.1 (see REQUIREMENTS.md → Out of Scope and PROJECT.md → "Carried forward to v1.2"). Don't lose them.

- **Server-side draft persistence** (`client-feedback-draft` label workflow) — option (c) from Q3. Lift to v1.2 only if real demand emerges. Most robust solution but ~3× the code.
- **`localStorage` draft persistence** — option (b) from Q3. Survives browser close but device-local; v1.2 candidate at most.
- **Batch-aware autonomy thresholds** (e.g., require ≥3 locator signals across the batch) — Q4 alternative. Rejected for v1.1 (per-edit thresholds inherited); revisit only if production data shows per-edit thresholds approving low-quality batches.
- **Toast-with-undo for "Clear all"** — Q5 alternative. Rejected for v1.1 (confirm dialog chosen); could reconsider if user research shows confirm dialog is too high-friction.
- **Auto-batching heuristics** ("client submitted 3 things in 30 seconds → batch them automatically") — explicitly rejected in REQUIREMENTS.md Out of Scope and spec memory "What NOT to do". Explicit Stage / Submit UI is clearer; implicit batching breaks user intent. Do not revisit.
- **Adding `POST /api/feedback/submit-batch` as a new endpoint** — explicitly rejected. One endpoint, two payload shapes is the chosen design (D-16).
- **Multipart / streaming upload path for large batches** — flagged in D-03 as a research-bounded *contingency* if Vercel's request-body limit forces it. Only adopt during plan-phase if research confirms the 4.5 MB default applies; otherwise stick with the base64-in-JSON pattern that already works for single-edit submits.
- **v1.2 carry-forward (out of v1.1 entirely):** gallery modal rewrite, calendar 12-month range, editor / publishing flow deep audit, Melissa's CLIENT-CLARIFICATION.md replies. All tracked in PROJECT.md and STATE.md → Deferred Items.

</deferred>

---

*Phase: 4-batch-pipeline-implementation*
*Context gathered: 2026-05-20*
