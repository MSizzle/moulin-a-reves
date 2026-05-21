---
phase: 6
plan: 06-02
requirements-completed: [STATUS-06, STATUS-07, STATUS-08, STATUS-09]
status: complete
commit: 541aaf3
completed: 2026-05-21
---

# 06-02 — Recent submissions rail + smart-quote fix

## What shipped

- New `<aside class="rail">` block in `src/pages/feedback.astro` below the iframe, with `<h3>Recent submissions</h3>` and a `<ul>` of submission rows.
- Inline CSS for the rail: 5-segment progress bar (3 px gap; segments dim → `--accent-2` current → `--accent` filled), card styling matching the existing panel theme, live-row strikethrough.
- Inline JS helpers added before the existing `picker` handler:
  - `loadRecent()` / `saveRecent(list)` — localStorage key `mar_feedback_recent_v1`, cap 20.
  - `relTime(iso)` / `stageLabel(n)` / `subBlock(item)` — formatters.
  - `escapeHtml()` — defends `summary` / `issueUrl` from injection when re-rendered.
  - `renderRail()` — full re-render from localStorage on every change.
  - `isTerminal(item)` — true for stage 5 OR sub `needs-review` / `needs-client-reply`.
  - `pollOne(num)` — `setInterval` 8 s loop hitting `/api/feedback/status/<N>`; stops itself on terminal.
  - `persistSubmission(data, payload)` — derives summary from payload's `edits[].locator.pageRoute` (v2) or `locator.pageRoute` (v1) and prepends to the list.
  - `startAllPollers()` — on page load, resumes polling for any non-terminal row in localStorage.
- Success-path handler now calls `persistSubmission(data, msg.payload)` → `renderRail()` → `pollOne(data.issueNumber)` before `showToast(...)`.
- Toast copy updated: "Watch the Recent submissions panel below to follow it from review to live." (replaces the generic "Simple changes go live…" line; redirects attention to the new rail).

## Smart-quote fix (pre-existing bug)

`src/pages/feedback.astro:196-225` was emitting `‘` / `’` (U+2018 / U+2019) as JS string delimiters — every browser would parse-fail the entire `<script is:inline>` block. Confirmed via `od -c`: 14 smart-quote occurrences as delimiters. Replaced with ASCII `'`; literal apostrophes inside ASCII-delimited strings (`it's`, `We've`, `Monty's`, etc.) are kept as U+2019 — valid as string content.

Validation: extracted the inline script and ran through `new Function(js)` — parses OK.

Latent because v1.1 canaries (`scripts/smoke-feedback-v2.mjs`) hit `/api/feedback/submit` directly, never exercising the iframe parent's `window.addEventListener('message', ...)` handler.

## Requirements satisfied

- STATUS-06 ✓ `mar_feedback_recent_v1` localStorage populated on success, capped at 20 via `.slice(0, 20)`
- STATUS-07 ✓ Rail renders below iframe with 5-segment bar, per-row summary + issue link + relative timestamp
- STATUS-08 ✓ 8 s poll via `setInterval`, auto-stops on terminal states
- STATUS-09 ✓ Sub-labels render: `auto-merged`/`merged` → "Merged · waiting for deploy…", `needs-review` → "Needs Monty's review", `needs-client-reply` → "Question for you → open issue" deep-link; stage 5 collapses to "✓ Live on the site" + `view deploy` link
