# Phase 4: Batch Pipeline Implementation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 4-batch-pipeline-implementation
**Areas discussed:** Per-batch safety limits, Cross-page batching, Draft persistence lifetime, Autonomy threshold + Clear-all UX
**Mode:** auto (user replied "go auto" after multiSelect; recommended defaults applied without further prompting)

---

## Gray Areas Presented (multiSelect — user selected ALL 4)

| Option | Description | Selected |
|--------|-------------|----------|
| Per-batch safety limits | Hard cap on edit count (e.g., 10) and/or total photo MB (e.g., 30)? Spec default: undecided. | ✓ |
| Cross-page batching | Should a batch span page navigations inside the iframe? Spec default: yes, supported. | ✓ |
| Draft persistence lifetime | (a) sessionStorage / (b) localStorage / (c) server-side draft issues. Spec default + REQUIREMENTS.md Out-of-Scope: (a). | ✓ |
| Autonomy threshold + Clear-all UX | Per-edit thresholds vs batch-aware? Confirm dialog vs toast vs irrevocable click? Spec defaults: per-edit + confirm dialog. | ✓ |

**User's choice:** All 4 selected; then "go auto" — accept recommended defaults for each without further interactive questioning.

---

## Per-batch safety limits

| Option | Description | Selected |
|--------|-------------|----------|
| Caps (10 edits / 30 MB total) | Spec memory's suggested defaults; bound DoS risk and Action runner cost. | ✓ |
| No caps | Trust the client; bound only by Vercel payload limit. | |
| Stricter caps (5 edits / 15 MB) | More defensive — easier on the runner but more friction. | |

**Auto-selected:** Caps (10 edits / 30 MB total) — matches the "8–10 small edits per 10-min review pass" pattern documented in spec memory.
**Follow-up notes:** Plan/research-phase MUST verify Vercel project's request-body limit (Hobby/Pro default ≈ 4.5 MB after base64 inflation). If the 30 MB cap exceeds it, planner either confirms the project tier, lowers the cap, or switches to multipart/streaming. Captured as D-03 contingency in CONTEXT.md.
**Emergent new requirements:** STAGE-06 (client caps), STAGE-07 (chip "limit reached" UX), API-06 (server re-validates caps).

---

## Cross-page batching

| Option | Description | Selected |
|--------|-------------|----------|
| Supported (default) | sessionStorage design supports trivially; chip rehydrates on iframe nav. | ✓ |
| Scope per page | Submit before navigating; simpler mental model. | |

**Auto-selected:** Supported — no extra code; sessionStorage is per-origin and survives iframe navigation within the same browsing context. Issue title already accommodates multi-route batches.
**Follow-up notes:** Planner should confirm during plan-phase that the chip re-renders on the new page after iframe navigation (likely a `pageshow` or `visibilitychange` listener).

---

## Draft persistence lifetime

| Option | Description | Selected |
|--------|-------------|----------|
| (a) sessionStorage only | Clears on browser close. Simplest; matches REQUIREMENTS.md Out-of-Scope rejections of (b) and (c). | ✓ |
| (b) localStorage | Survives close but device-local; may collide across tabs. | |
| (c) Server-side draft issues | `client-feedback-draft` label workflow. Most robust, most code. | |

**Auto-selected:** (a) sessionStorage only — matches spec memory default and REQUIREMENTS.md Out-of-Scope which explicitly defers (b) and (c) to v1.2.
**Follow-up notes:** Photo Files stay as File references in sessionStorage (STAGE-05); base64 encoding only at submit time. Avoids sessionStorage's ~5 MB cap.

---

## Autonomy threshold + Clear-all UX

### Q4: Autonomy threshold inheritance

| Option | Description | Selected |
|--------|-------------|----------|
| Per-edit thresholds | Inherit existing gate (≥2 locator signals for change-wording/replace-photo). Batch passes iff every edit passes. | ✓ |
| Batch-aware (≥3 signals across batch) | More conservative; gate evaluates batch as a whole. | |

**Auto-selected:** Per-edit thresholds — anchored by spec memory's "What NOT to do": *"Don't redesign the autonomy gate. It works; the batch feature lives one layer above it."*

### Q5: Clear-all UX

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm dialog | Real friction for a destructive action on real client work. Already implied by STAGE-03. | ✓ |
| Toast-with-undo | 5-second window; lighter UX but recoverable. | |
| Irrevocable click | Lowest friction; highest data-loss risk. | |

**Auto-selected:** Confirm dialog — staged edits represent real client work; the confirm friction is appropriate.
**Follow-up notes:** Per-item ❌ delete on individual edits stays irrevocable (one-click) per STAGE-03 — only "Clear all" gets the confirm. Captured as D-12 in CONTEXT.md.

---

## Claude's Discretion

Areas where the planner has freedom (captured under "Claude's Discretion" in CONTEXT.md `<decisions>`):

- Exact chip visual styling — admin-facing, not subject to i18n; reuse existing `?feedback=1` UI vocabulary.
- Native `window.confirm()` vs in-iframe modal for "Clear all" — both satisfy D-11.
- Branch name format refinement under `feedback/issue-<n>-batch-<N>` — example, not lock.
- Where the shared validator module lives (`src/pages/api/feedback/validate.ts` vs colocated in `submit.ts`) — D-15 mandates *that* it's shared, not *where*.

## Deferred Ideas

Ideas that surfaced during the open-design questions but are explicitly out of v1.1 (full list in CONTEXT.md `<deferred>`):

- Server-side draft persistence (`client-feedback-draft` label) — option (c) from Q3; v1.2 candidate at most.
- `localStorage` draft persistence — option (b) from Q3; v1.2 candidate at most.
- Batch-aware autonomy thresholds (≥3 locator signals across batch) — Q4 alternative; revisit only if per-edit thresholds prove too permissive in production.
- Toast-with-undo for "Clear all" — Q5 alternative; revisit only if confirm dialog proves too high-friction.
- Multipart / streaming upload — flagged as research-bounded contingency if Vercel's request-body limit forces it (D-03).
- v1.2 carry-forward (out of v1.1 entirely): gallery modal rewrite, calendar 12-month range, editor-flow audit, Melissa's CLIENT-CLARIFICATION.md replies.
