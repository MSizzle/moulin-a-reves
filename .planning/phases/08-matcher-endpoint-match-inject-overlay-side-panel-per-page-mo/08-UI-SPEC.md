---
phase: 8
slug: matcher-endpoint-match-inject-overlay-side-panel-per-page-mo
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-26
---

# Phase 8 — UI Design Contract

> Visual and interaction contract for the Per-page review surface on `/feedback`:
> mode tabs, per-page input zone, side panel, match-row anatomy, numbered orange
> pin badge, catalog-drift banner, and the loader/inject wiring. Consumed by
> `gsd-planner` next; verified by `gsd-ui-checker`.

**Scope of contract:**
- Two surfaces own the rendered UI for this phase:
  1. `src/pages/feedback.astro` — parent shell — owns mode tabs, per-page input zone, side panel, catalog-drift banner, loading overlay. All CSS lives in the existing `<style>` block in `feedback.astro` (dark "ops" theme — `--bg`, `--panel`, `--line`, `--ink`, `--muted`, `--accent`, `--accent-2`). Do **NOT** add styles to `src/styles/global.css` — `feedback.astro` is intentionally a self-contained operator surface that does NOT consume the marketing site's design tokens.
  2. `public/feedback-match-inject.js` — iframe-injected — owns the numbered orange pin badge. CSS is inlined as a string literal in this file (same pattern as `public/feedback-inject.js:70-122`) because the styles must be injected into the target page's document.

**Why two themes coexist:**
- The marketing site (`global.css`) uses `--bg-cream #FFFFFF` / `--ink #202020` / `--blue-primary #2E5A88` — warm, editorial.
- `/feedback` already runs a dark slate operator theme (`--bg #0f172a`, `--accent #FF6B2B`). The new mode tabs / panel / banner extend that operator theme — they do not re-skin the marketing tokens.
- The pin badge inside the iframe uses `#FF6B2B` (the literal `ACCENT` value already in `public/feedback-inject.js:71`) so the in-iframe feedback visual language stays unified between v1.1 click overlay and v1.3 match overlay.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Astro + plain CSS, no shadcn / no Tailwind) |
| Preset | not applicable |
| Component library | none (vanilla DOM in `<script is:inline>` blocks) |
| Icon library | inline SVG / Unicode glyphs only (matches v1.2 rail's `↗` and existing usage) |
| Font (operator surface) | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` — inherited from `feedback.astro:44` |
| Font (in-iframe pin badge) | `system-ui, sans-serif` — matches `public/feedback-inject.js:101` corner chip |

---

## Spacing Scale

The operator surface (`feedback.astro`) uses rem-flavored mixed values today (`.45rem`, `.6rem`, `.7rem`, `.8rem`, `.85rem`, `.9rem`, `1rem`, `1.1rem`). The new spec snaps to a tighter 4-multiple px scale and translates to rem where neighboring code uses rem (no scope to refactor the rail's existing values — only the new additions follow this).

| Token | Value | Usage |
|-------|-------|-------|
| 2xs | 4px | Pill internal padding-y; row-action button gap |
| xs | 8px | Match row internal gap between elements; banner icon→text gap |
| sm | 12px | Match row inner padding; segmented-control inner padding-x |
| md | 16px | Panel padding; section vertical gap; row→row gap |
| lg | 24px | Panel header→body gap; major surface margin |
| xl | 32px | Two-column layout column gap on ≥1024px |
| 2xl | 48px | (reserved — not used in this phase) |
| 3xl | 64px | (reserved — not used in this phase) |

**Exceptions:**
- The 360px panel **width** inherited from the v1.1 corner chip pattern is not on the 4-multiple scale but is preserved exactly (panel renders side-by-side with iframe at ≥1024px using a `35%` flex-basis, not a fixed px; the 360px references in `feedback-inject.js` are for the in-iframe chip and do not appear in `feedback.astro`). New panel uses flex-basis 35% / min-width 360px.
- The numbered badge inside the iframe is a 28×28 px circle (touch target tolerance + readability for two-digit indexes; not a 32px touch target because the badge is non-interactive — clicking it bounces through `postMessage` to highlight the row, but the row in the panel is the actual action surface).

---

## Typography

The operator surface inherits the system font stack from `feedback.astro:44`. All sizes below are absolute pixel equivalents; the existing CSS uses rem-with-`.85rem`-grain — keep that pattern, the table below normalizes to px for the checker.

| Role | Size | Weight | Line Height | Notes |
|------|------|--------|-------------|-------|
| Display (panel title) | 15px (0.95rem) | 600 | 1.2 | "Per-page review" header |
| Body (default row text + textarea + reason) | 14px (0.875rem) | 400 | 1.45 | Match-inline copy, alternates list, reason line |
| Label (form label, mode tab) | 13px (0.82rem) | 500 | 1.3 | Picker label, tab labels, banner body |
| Small (hint, timestamp, confidence pill copy) | 12px (0.75rem) | 500 | 1.2 | "This page isn't catalogued yet." hint, pill text, alternate ID code |
| Code (catalog ID) | 12px (0.75rem) | 400 | 1.2 | Monospace stack `ui-monospace, SFMono-Regular, Menlo, monospace` for IDs in alternates list |

**Italic:** Used only for the inline `reason` line below alternates (matches Cormorant-italic editorial cue from the marketing site without importing Cormorant into the operator surface — keep `font-style: italic` on the system sans).

**Tab labels:** Sentence case ("Per-element click", "Per-page review") — matches existing `feedback.astro` chrome ("Feedback mode", "Recent submissions"). **Not** uppercase / tracked — uppercase eyebrow is a marketing-site idiom, not an operator-surface idiom.

---

## Color

**Reuse-only.** Every value below comes from `feedback.astro:41` `:root` block. **No new tokens introduced.** The pin badge value in the inject is the literal hex (operator theme tokens cannot reach into iframe documents — the inject ships its own CSS string).

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) — page bg | `#0f172a` (`--bg`) | `<body>` background, picker `<select>` bg, match-row inner bg, banner alt-row bg |
| Secondary (30%) — surfaces | `#1e293b` (`--panel`) | Top bar, mode tab strip, side panel, match-row card, textarea, banner card, rejected-disclosure card |
| Tertiary (~5%) — hairlines | `#334155` (`--line`) | All 1px borders between surfaces, between match rows, around buttons |
| Foreground primary | `#e2e8f0` (`--ink`) | Default text |
| Foreground muted | `#94a3b8` (`--muted`) | Labels, hints, timestamps, alternates list intro, reason italic, "Rejected (N)" count |
| Accent (10%) | `#FF6B2B` (`--accent`) | **Reserved-for list below — strict** |
| Action (≤10%) | `#6366f1` (`--accent-2`) | Primary "Match edits" CTA button bg; primary "Re-run match" button bg; active mode-tab indicator |
| Success | `#15803d` border / `#86efac` text / `#052e16` bg | Confidence pill `green` tier (≥0.75); approved-row tinted border |
| Warning | `#a16207` border / `#fde68a` text / `#3b2a06` bg | Confidence pill `amber` tier (0.50–0.74); catalog-drift banner accent |
| Destructive | `#dc2626` border / `#fca5a5` text / `#7f1d1d` bg | Confidence pill `red` tier (<0.50); Reject-button hover; rejected-row left rail |

**Accent (`#FF6B2B`) reserved for:**
1. **Numbered pin badge** inside the iframe (background fill) — `public/feedback-match-inject.js` only. This is the only place the accent appears in the in-iframe match overlay (no element outline, no hover halo — keeps the badge visually distinct from the v1.1 frozen-outline + dashed-hover language).
2. **"Open questions ↗" link** in the top bar — *already* uses `--accent` per `feedback.astro:64`; do not change.
3. **Confidence pill `red` tier left-edge stripe** — purely as the existing convention in the v1.1 corner chip's cap-warning border (mirrors `feedback-inject.js:116`).
4. **Catalog-drift banner left-edge stripe (4px)** — signals "action required" without re-using destructive red (which is reserved for rejection / cap errors).

**Accent NOT used for:**
- Primary CTAs (`--accent-2` indigo handles all interactive blues).
- Approved-row affordance (success-green border instead).
- General row hover states (`--line` darkens to `#475569`).
- Tab-active indicator (`--accent-2` underline — keeps the orange accent rare enough to mean "Moulin feedback brand cue" not "click here").

**Destructive (`#dc2626`):**
- Reject button hover border / fill.
- Confidence pill `red` tier (display only — does not gate Approve per D-06).
- "Restore" button on rejected row is **NOT** destructive — it returns the row to pending, so it uses neutral `--line` border with `--ink` text.

---

## Copywriting Contract

All copy is **EN-only in v1.3**. This is an operator-facing surface (Monty + Melissa, both EN-comfortable). The bilingual EN/FR rule (`CLAUDE.md` constraint) applies to public marketing pages — `/feedback` has shipped EN-only since v1.1 and stays EN-only.

| Element | Copy |
|---------|------|
| Mode tab #1 (default) | `Per-element click` |
| Mode tab #2 | `Per-page review` |
| Page picker label | `Page:` (re-used from existing `feedback.astro:132`) |
| Textarea placeholder | `Paste a freeform list of changes for this page — one edit per line. Bullets, numbers, paragraphs are all fine.` |
| Textarea aria-label | `Edit list for selected page` |
| Primary CTA (locked from ROADMAP Success Criterion #2) | `Match edits` |
| Primary CTA disabled hint (when no catalog) | `This page isn't catalogued yet.` (inline under textarea, `--muted`) |
| Primary CTA disabled hint (when textarea is empty) | (button stays disabled silently — no hint text; CTA-disabled state is self-explanatory in an empty form) |
| Loading state heading | `Matching your edits…` |
| Loading state body | `Asking Claude to find each line on the page. This usually takes 3–6 seconds.` |
| Empty state heading (Per-page tab open, no edit list yet) | `Tell us what to change on this page` |
| Empty state body | `Type or paste your edits above, then click "Match edits". You'll review each match before anything is sent.` |
| Empty state heading (Per-page tab open, edits matched, all rows resolved/rejected) | `All matches reviewed` |
| Empty state body (all resolved) | `Switch back to the corner chip inside the preview to submit your batch, or run another match.` |
| Side panel header title | `Per-page matches` |
| Side panel subtitle (when match set loaded) | `{N} edits on {route}` (e.g. `3 edits on /homes/le-moulin/`) |
| Catalog-drift banner heading | `Matches are out of date` |
| Catalog-drift banner body | `The site has been redeployed since these matches were generated. Click "Re-run match" to refresh.` (locked per CONTEXT.md `<specifics>` block) |
| Catalog-drift banner action | `Re-run match` |
| Match row — confidence pill (green) | `High match` |
| Match row — confidence pill (amber) | `Some confidence` |
| Match row — confidence pill (red) | `Low match` |
| Match row — confidence pill (no primary) | `No match` |
| Match row — alternates intro | `Other options:` |
| Match row — alternates empty | (omit the line entirely when `alternates.length === 0`) |
| Match row — reason prefix | (no prefix — render the italic line as-is; the matcher's prose is its own sentence) |
| Match row — reason truncated suffix | `… show more` (clickable, expands inline; collapses back to `… show less`) |
| Match row — "show more" replacement when expanded | `show less` |
| Approve button | `Approve` |
| Approve button aria-label | `Approve match for line: {line text}` |
| Reject button | `Reject` |
| Reject button aria-label | `Reject this match` |
| Pick-manually button | `Pick manually` |
| Pick-manually button aria-label | `Override match — pick element by clicking it` |
| Pick-manually instruction toast | `Click any element inside the preview to pick it for this line.` (shows below the row for 8 seconds after click) |
| Rejected disclosure summary | `Rejected ({N})` |
| Rejected disclosure expanded heading | `Rejected matches` |
| Rejected row — Restore button | `Restore` |
| Rejected row — Restore aria-label | `Restore rejected match for line: {line text}` |
| Per-row state badge — approved | `Staged` (green pill, top-right of row) |
| Per-row state badge — manual | `Manual` (indigo pill, top-right of row) |
| Per-row state badge — pending | (no badge — default state) |
| Submit batch — sourcing | (no new copy — the existing v1.1 corner chip inside the iframe handles "Submit batch ({N})"; the side panel does NOT duplicate the submit button — Approve writes through to `mar_feedback_staged_v1` and the corner chip already increments per D-05/D-24) |
| Side-panel-bottom helper text (after first Approve) | `Approved edits show in the orange chip inside the preview. Submit the full batch from there when you're done.` |
| Matcher error — auth | `Please sign in again to continue.` (toast, reuses existing 401 path) |
| Matcher error — no catalog | `This page isn't catalogued yet. Try a different page.` |
| Matcher error — list too long | `That edit list is too long. Try splitting it into smaller batches.` (cap at MATCH-07's 10k chars) |
| Matcher error — catalog too large | `This page has too many editable elements for one match. Contact Monty.` (catalog over 150 elements per MATCH-07) |
| Matcher error — unavailable | `The matcher is offline. Use per-element click mode instead.` (corresponds to `{ error: 'matcher_unavailable' }` per MATCH-06) |
| Matcher error — generic | `Couldn't match those edits. Try again, or use per-element click mode.` |

**Destructive confirmations:**
- **Reject:** No confirmation modal. Reject is reversible (Restore button in the "Rejected (N)" disclosure per PANEL-04 / D-18). One-click undo via Restore is the confirmation pattern. Match the v1.1 ergonomic — the corner chip's "X" delete is also one-click without confirmation.
- **Re-run match** (catalog drift banner): No confirmation. It re-POSTs the same `editList`; the worst case is the user sees the same matches refresh. Cost in matcher dollars is bounded by MATCH-07 caps.
- **Switching mode tabs:** No confirmation. The two sessionStorage keys are isolated (D-08). Switching is non-destructive.

---

## Component Inventory

### 1. Mode tab strip
- **Location:** Top of `feedback.astro` body, **between** the existing `.bar` chrome (line 130-139) and the `.frame-wrap` (line 140-142). Insert as a new sibling.
- **BEM block:** `mode-tabs`
- **Structure:** `<div class="mode-tabs" role="tablist" aria-label="Feedback mode">` containing two `<button class="mode-tabs__tab" role="tab">` elements with `.is-active` modifier on the active one. Active state mirrored into URL hash (`#mode=per-page` / `#mode=per-element`) per D-08.
- **Style:** Full-width strip, `--panel` bg, `--line` 1px bottom border. Each tab is `padding: 12px 24px`, inactive tab text is `--muted`, active tab is `--ink` with a `2px solid var(--accent-2)` bottom indicator inset 12px from each side. Hover on inactive: text becomes `--ink`.
- **Sizing:** Height 44px (touch-target floor); tabs are intrinsic-width; tab strip is left-aligned with 16px left padding.
- **Keyboard:**
  - `Tab` enters the tablist on first tab (`tabindex=0`); inactive tab gets `tabindex=-1`.
  - `Left` / `Right` arrows move focus between tabs and activate on focus (per ARIA tabs pattern — manual activation is acceptable but auto-activate on focus is the simpler ergonomic and matches the iframe rebuild that happens anyway).
  - `Enter` / `Space` activates a focused tab (no-op if already active).
- **ARIA:** `role="tablist"` on container; `role="tab"`, `aria-selected="true|false"`, `aria-controls="<panel id>"` on each tab. Per-page tab controls the `#mode-pane-per-page` container; per-element tab controls the `#mode-pane-per-element` container (which is the existing `<div class="frame-wrap">` + rail — they coexist, the iframe just changes `src` on tab switch).

### 2. Per-page input zone
- **Location:** Renders **inside** `#mode-pane-per-page` when the Per-page review tab is active. Sits **above** the iframe (which sits in the same pane).
- **BEM block:** `match-input`
- **Structure:**
  ```
  <section class="match-input" id="mode-pane-per-page" role="tabpanel" aria-labelledby="tab-per-page">
    <div class="match-input__header">
      <label class="match-input__label" for="matchPagePick">Page:</label>
      <select id="matchPagePick" class="match-input__picker">…</select>
      <span class="match-input__hint" id="matchPickerHint" hidden>This page isn't catalogued yet.</span>
    </div>
    <textarea class="match-input__textarea" id="matchEditList" rows="6"
              aria-label="Edit list for selected page"
              placeholder="Paste a freeform list of changes for this page — one edit per line. Bullets, numbers, paragraphs are all fine."></textarea>
    <div class="match-input__footer">
      <button class="match-input__submit" id="matchSubmitBtn" disabled>Match edits</button>
      <span class="match-input__char-count" aria-live="polite">{N} / 10000</span>
    </div>
  </section>
  ```
- **Style:**
  - Container: `padding: 16px`, `background: var(--panel)`, `border-bottom: 1px solid var(--line)`.
  - Picker re-uses existing `.bar select` styles literally — same dark `--bg` background, same `--line` border, same `.45rem .6rem` padding. **Implementation note for planner:** the new picker is a SECOND `<select>` (id `matchPagePick`), NOT the existing `#pagePick`. Both pickers exist concurrently. The existing one continues to drive the per-element flow's iframe `src` when in that tab; `matchPagePick` drives the per-page mode's matcher endpoint route. Reason: keeping picker state isolated per tab avoids spooky cross-tab side effects (a user picks Le Moulin in per-element, switches to per-page, expects to still see Le Moulin — fine; but the per-page picker's HEAD-probe state needs its own DOM node to attach to).
  - Textarea: `width: 100%`, `min-height: 120px`, `max-height: 320px`, `resize: vertical`, `padding: 12px`, `background: var(--bg)`, `border: 1px solid var(--line)`, `border-radius: 8px`, `color: var(--ink)`, `font-family: ui-monospace, SFMono-Regular, Menlo, monospace` (monospace because users will paste bullet lists and tabular content — monospace keeps it scannable), `font-size: 13px`, `line-height: 1.5`. Focus: `border-color: var(--accent-2)`. Match-input is the **only** monospace surface in the contract — everywhere else uses the system sans.
  - Submit button: `padding: 10px 24px`, `background: var(--accent-2)`, `color: #fff`, `border: 0`, `border-radius: 8px`, `font-weight: 600`, `font-size: 14px`, `cursor: pointer`. Disabled state: `opacity: 0.5`, `cursor: not-allowed`. Hover (when enabled): `background: #4f46e5` (one shade darker).
  - Char counter: `font-size: 12px`, `color: var(--muted)`. When count > 9500, color flips to `--accent` (orange = approaching cap warning); when count > 10000, color flips to `#fca5a5` (destructive — the button locks out at exactly 10000 chars per MATCH-07).
- **Disabled states:**
  - On picker change: button stays disabled if textarea is empty OR `HEAD /edit-catalogs/{route}.json` returned 404 (D-21). When 404, the `match-input__hint` becomes visible (`hidden` attr removed) and replaces nothing — sits beside the picker.
  - On textarea input: button enables when `value.trim().length > 0 && value.length <= 10000` AND last HEAD probe succeeded.
- **Keyboard:**
  - `Cmd/Ctrl + Enter` inside the textarea submits the form (calls the same handler as clicking the button) — common power-user shortcut for textareas-with-submit.
  - Tab order: picker → textarea → submit button → side panel (when present).
- **Loading state:** When matcher is in flight, swap submit-button label to a 16×16 spinning SVG + the text `Matching…`; set `disabled=true`. Re-use the existing `.working` overlay from `feedback.astro:79` as a full-screen scrim with copy "Matching your edits…" + "Asking Claude to find each line on the page. This usually takes 3–6 seconds." Spinner animation: simple CSS `rotate` keyframe at 0.8s linear infinite.

### 3. Side panel layout
- **Location:** Renders **inside** `#mode-pane-per-page`, **after** the iframe section. At `≥1024px` viewport the iframe + side panel form a flex row (`iframe ~65%` / `panel ~35%`); below 1024px, they stack vertically (panel after iframe). The match-input zone always sits above this row at full width — only iframe + panel form the two-column layout.
- **Layout HTML structure:**
  ```
  <div class="match-pane">
    <section class="match-input">…(above)…</section>
    <div class="match-pane__split">
      <div class="match-pane__iframe-col">
        <iframe id="matchSite" …></iframe>
      </div>
      <aside class="match-panel" aria-label="Per-page matches">…</aside>
    </div>
  </div>
  ```
- **BEM block (panel):** `match-panel`
- **Flex breakpoint:**
  - `≥1024px`: `display: flex; gap: 0;` (no internal gap — the panel's left border serves as the divider). `match-pane__iframe-col` is `flex: 1 1 65%; min-width: 0;`; `match-panel` is `flex: 0 0 35%; min-width: 360px; max-width: 480px;`.
  - `<1024px`: `display: block;` — panel renders below iframe at full width.
- **Panel structure:**
  ```
  <aside class="match-panel" aria-label="Per-page matches">
    <header class="match-panel__header">
      <h3 class="match-panel__title">Per-page matches</h3>
      <p class="match-panel__subtitle" id="matchPanelSubtitle">3 edits on /homes/le-moulin/</p>
    </header>
    <div class="match-panel__banner-slot" id="matchDriftBanner" hidden>…(drift banner)…</div>
    <div class="match-panel__empty" id="matchPanelEmpty">…(empty-state copy)…</div>
    <ol class="match-panel__rows" id="matchPanelRows" role="list">
      <li class="match-panel__row">…</li>
    </ol>
    <details class="match-panel__rejected" id="matchPanelRejected" hidden>
      <summary class="match-panel__rejected-summary">Rejected (<span id="matchRejectedCount">0</span>)</summary>
      <ol class="match-panel__rejected-list" role="list">…</ol>
    </details>
    <p class="match-panel__helper" id="matchPanelHelper" hidden>Approved edits show in the orange chip inside the preview. Submit the full batch from there when you're done.</p>
  </aside>
  ```
- **Panel style:**
  - Container: `background: var(--panel)`, `border-left: 1px solid var(--line)` (≥1024px only — vertical divider; below 1024px it's a `border-top`), `padding: 16px`, `overflow-y: auto`, `max-height: calc(100vh - <bar+tabs+input height>)`. Use `flex: 1 1 auto` on the parent split row so panel can fill height.
  - Header title: 15px / 600 / `--ink`. Subtitle: 12px / 400 / `--muted`. 4px gap.
  - Empty state: 13px / 400 / `--muted`, padding 24px 12px, centered. Shows when `matches.length === 0` (initial state, before "Match edits" pressed).
  - Helper (below rows): 12px / 400 / `--muted`. Becomes visible (`hidden=false`) after the first Approve in the panel; stays visible for the rest of the session.
- **Scrollability:** Panel scrolls independently of the iframe. On a long list (up to MATCH-07's 150-element cap, but in practice ≤ 20 lines), the panel maintains its own scroll position. When a row is clicked (not Approve/Reject — just the row body), `postMessage` to the iframe with `mar:feedback:match-focus` so the iframe can `scrollIntoView` the corresponding pinned element. (Out of strict scope — implement as polish if planner has capacity; the contract requires only the message-shape definition.)
- **Keyboard:**
  - Panel is focusable (`tabindex=0`) so screen readers can land on `aria-label="Per-page matches"`.
  - Match rows: each Approve/Reject/Pick-manually button is in normal tab order. No row-level focus management needed beyond default — the row is just a container.
  - `Esc` inside the panel does nothing (matches the v1.1 corner chip's behavior).

### 4. Match row anatomy
- **BEM block:** `match-panel__row` (with modifiers `--pending`, `--approved`, `--rejected`, `--manual`, `--no-primary`, `--low-confidence`).
- **Structure:**
  ```
  <li class="match-panel__row match-panel__row--pending" data-row-index="0">
    <header class="match-panel__row-head">
      <span class="match-panel__row-line-num">1</span>
      <span class="match-panel__row-line-text">Make the hero subtitle bolder</span>
      <span class="match-panel__row-state-badge" hidden>Staged</span>
    </header>
    <div class="match-panel__row-primary">
      <span class="match-panel__row-primary-label">Match:</span>
      <span class="match-panel__row-primary-preview">"A private compound in the heart of Méréville"</span>
      <span class="match-panel__row-confidence match-panel__row-confidence--green" aria-label="High match, confidence 0.87">High match · 87%</span>
    </div>
    <div class="match-panel__row-alternates" hidden>
      <span class="match-panel__row-alternates-label">Other options:</span>
      <ol class="match-panel__row-alternates-list">
        <li><code>hero.eyebrow</code> — "A SECRET COMPOUND"</li>
        <li><code>hero.cta-text</code> — "Discover the Compound"</li>
      </ol>
    </div>
    <p class="match-panel__row-reason" data-truncated="true">
      <em>The phrase "hero subtitle" most likely refers to the italic tagline directly below the H1 on this page; alternates are eyebrow text and CTA button which are also above the fold but less directly described as "subtitle". <button class="match-panel__row-reason-more">show more</button></em>
    </p>
    <footer class="match-panel__row-actions">
      <button class="match-panel__row-btn match-panel__row-btn--approve">Approve</button>
      <button class="match-panel__row-btn match-panel__row-btn--reject">Reject</button>
      <button class="match-panel__row-btn match-panel__row-btn--manual">Pick manually</button>
    </footer>
  </li>
  ```
- **Row style:**
  - Container: `background: var(--bg)`, `border: 1px solid var(--line)`, `border-radius: 10px`, `padding: 12px`, `margin-bottom: 12px`. The state modifiers tint the LEFT border (4px thick) — pending: `var(--line)`, approved: `#15803d`, rejected: `#dc2626` (only visible inside the Rejected disclosure), manual: `var(--accent-2)`, low-confidence: `var(--accent)`.
  - Row head: flex row, line-num is a 24×24 circle, 12px font, 600 weight, `background: var(--accent-2)`, `color: #fff`, `border-radius: 999px`, centered text, flex-shrink 0. Line text fills remaining space. State badge floats right, hidden when status is pending.
  - Line text: 14px / 500 / `--ink`. Truncate at 3 lines with `display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;` — long lines stay visible without blowing out the panel.
  - Primary preview: 13px / 400 / `--ink`. Wrapped in quotes for text matches. For image kinds, render `<img>` thumbnail 40×40 cover + filename code. For null primary (no match), shows: `<span class="match-panel__row-primary-empty">No match found. Use "Pick manually" to choose the element.</span>` and the confidence pill shows `No match` (gray/red tier).
  - Confidence pill: `display: inline-flex`, `padding: 2px 8px`, `border-radius: 999px`, `font-size: 11px`, `font-weight: 600`, `line-height: 1.2`. Tier colors (bg/border/text): green `#052e16 / #15803d / #86efac`; amber `#3b2a06 / #a16207 / #fde68a`; red `#3a0d0d / #dc2626 / #fca5a5`; no-match `#1e293b / #475569 / #94a3b8`.
  - Alternates: only renders if `alternates.length > 0`. Label `12px / 500 / --muted`. List items 12px, `--ink-soft equivalent` = `#cbd5e1` (we don't have an ink-soft token here; use the literal). `<code>` element: `background: #0f172a`, `padding: 1px 6px`, `border-radius: 4px`, `font-family: ui-monospace…`, `font-size: 11px`.
  - Reason: 12px / 400 / `--muted`, italic, `line-height: 1.4`, `margin-top: 8px`. Truncate at 120 chars (per D-19) — if length > 120, render first 120 chars + `…` + `<button>show more</button>`. On click, replace with full text + `<button>show less</button>`. No tooltip.
  - Actions footer: `display: flex; gap: 8px; margin-top: 12px;`.
  - Buttons:
    - All buttons: `padding: 8px 12px`, `border-radius: 8px`, `font-size: 13px`, `font-weight: 500`, `cursor: pointer`, `border: 1px solid var(--line)`, min-height 36px (touch target).
    - Approve (default): `background: var(--accent-2); color: #fff; border-color: var(--accent-2);` Hover: `background: #4f46e5;`. After approval: row gains `--approved` modifier; Approve button becomes `Unapprove` (or "Undo" — locked copy `Undo`) with neutral styling.
    - Reject: `background: transparent; color: var(--ink); border-color: var(--line);` Hover: `border-color: #dc2626; color: #fca5a5;`.
    - Pick manually: `background: transparent; color: var(--ink); border-color: var(--line);` Hover: `border-color: var(--accent-2); color: #c7d2fe;`.
  - Approved-row state: Approve button is replaced by `<button class="match-panel__row-btn match-panel__row-btn--undo">Undo</button>` with neutral border. The state badge "Staged" (green text on `#052e16` bg, 11px, 8px padding, 999px radius) appears top-right.
  - Manual-row state: After clicking Pick manually, the row's primary preview is replaced with "Waiting for you to click an element in the preview…" in muted italic. After the iframe sends back `mar:feedback:manual-resolved` with a new locator, the preview updates to show the manually-picked element's preview text and the state badge shows "Manual" (indigo `#3b3a8a` bg, `#c7d2fe` text).
- **ARIA:**
  - Row container: no role override.
  - Confidence pill: `aria-label="High match, confidence 87 percent"` (or the corresponding tier copy + numeric percent).
  - Approve button: `aria-label="Approve match for line: {line text truncated to 60 chars}"`.
  - Reject button: `aria-label="Reject this match"`.
  - Pick-manually button: `aria-label="Override match — pick element by clicking it"`.
  - State badge: `role="status"` so screen readers announce on transition.
  - Reason `<button>show more</button>`: `aria-expanded="false"` → flips to `true` when expanded.

### 5. Numbered orange pin badge (in-iframe)
- **File:** `public/feedback-match-inject.js` (NEW file — fully separate from `feedback-inject.js` per OVERLAY-05).
- **CSS injection pattern:** Mirror `public/feedback-inject.js:72-122` — create a `<style>` element, set `textContent` to a concatenated CSS string, append to `document.documentElement`. Do NOT use a `<link>` element — the inject runs inside the iframe document which doesn't share the parent's tokens.
- **CSS string (paste literally into the file as the badge style):**
  ```
  '[data-fb-match]{position:relative!important;}' +
  '[data-fb-match-pin]{position:absolute;top:-12px;left:-12px;z-index:2147483646;width:28px;height:28px;border-radius:999px;background:#FF6B2B;color:#fff;font:600 13px/28px system-ui,-apple-system,sans-serif;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.35),0 0 0 2px #fff;cursor:default;pointer-events:auto;user-select:none;}' +
  '[data-fb-match-pin]:hover{transform:scale(1.1);transition:transform .15s ease-out;}' +
  '[data-fb-match-pin][data-fb-match-focus="true"]{box-shadow:0 4px 12px rgba(0,0,0,.35),0 0 0 3px #6366f1;}'
  ```
- **DOM contract:**
  - For each match, find the target element via the priority order in OVERLAY-03 (`[data-i18n="X"]` → `img[src="Y"]` → `domPath`).
  - Apply `data-fb-match="<lineIndex 1-based>"` to the target (per OVERLAY-03).
  - **Append** (not prepend — preserve any existing `::before` decorations) a child `<div data-fb-match-pin="<lineIndex>">{lineIndex}</div>`. Because `[data-fb-match]` gets `position: relative` injected, the pin's `position: absolute; top: -12px; left: -12px;` places it at the top-left corner overlapping the bounding box edge by 12px (visually anchored to the corner, not floating inside).
  - For `img` matches: wrap the `<img>` in a `<span data-fb-match-wrap>` first if the parent already has `position: relative` set by site CSS (defensive — keeps the pin pinned to the image, not the surrounding container).
- **Visual differentiation from v1.1 click overlay (OVERLAY-04):**
  - v1.1 uses `outline: 2px dashed rgba(255,107,43,.6)` on hover and `outline: 2px solid #FF6B2B` on frozen. **NO** element outlines.
  - v1.3 match-inject uses **only** the numbered pin badge — NO element outline, NO background tint. The pin badge is the entire visual language. This is the OVERLAY-04 differentiation contract.
  - **Co-existence rule:** If a user is in per-page mode and somehow also has a v1.1 frozen element (shouldn't happen — the two modes own different sessionStorage), the dashed/solid outline still wins for that element. The pin remains rendered. No CSS competition because the inject scripts target disjoint attributes (`data-fb-frozen` / `data-fb-hover` vs `data-fb-match`).
- **Focus state for cross-panel-iframe wiring:** When the user clicks a row body (not a button) in the panel, `postMessage({type:'mar:feedback:match-focus', lineIndex:N})` → inject sets `data-fb-match-focus="true"` on the matching pin, scrolls the element into view with `scrollIntoView({behavior:'smooth', block:'center'})`, and clears the focus after 2 seconds via `setTimeout`. The indigo (`#6366f1`) ring is the "focused match" cue.
- **Drift state (OVERLAY-02):** When `matchSet.buildSha !== <meta name="x-build-sha">`, the inject paints NO pins (zero iteration) and sends `postMessage({type:'mar:feedback:matchset-stale', matchSetId})` → parent panel renders the drift banner per below.

### 6. Catalog-drift banner
- **Location:** Inside `match-panel__banner-slot` (top of side panel, above the empty-state / row list).
- **BEM block:** `match-drift-banner`
- **Structure:**
  ```
  <div class="match-drift-banner" id="matchDriftBanner" role="alert">
    <div class="match-drift-banner__icon" aria-hidden="true">⚠</div>
    <div class="match-drift-banner__body">
      <p class="match-drift-banner__title">Matches are out of date</p>
      <p class="match-drift-banner__msg">The site has been redeployed since these matches were generated. Click "Re-run match" to refresh.</p>
    </div>
    <button class="match-drift-banner__action" id="matchDriftRerun">Re-run match</button>
  </div>
  ```
- **Style:**
  - Container: `display: flex; gap: 12px; align-items: flex-start; padding: 12px 16px; background: #3b2a06; border: 1px solid #a16207; border-left: 4px solid var(--accent); border-radius: 8px; margin-bottom: 16px;`.
  - Icon: `font-size: 18px; color: var(--accent); line-height: 1;` flex-shrink 0.
  - Title: 13px / 600 / `#fde68a`. Body: 12px / 400 / `#fde68a`.
  - Action button: 13px / 600, padding `8px 12px`, `background: var(--accent-2)`, `color: #fff`, `border: 0`, `border-radius: 8px`, `cursor: pointer`. Hover `background: #4f46e5`. Aligned `align-self: center`.
- **Dismissal contract (per D-16):** The banner is **not** dismissible by a close-X. The ONLY dismissal path is clicking "Re-run match" — which on 200 replaces the match set, hides the banner, and reloads the iframe with the new `matchSet=<id>`. While the banner is visible, every Approve button in the panel is disabled (`disabled=true; aria-disabled=true`) and gains a `title="Matches are out of date — re-run match first."`.
- **ARIA:** `role="alert"` ensures screen readers announce on appearance.

### 7. Per-row state visualization
Summary table — already detailed in §4 Match row anatomy; reproduced here for the planner's quick reference:

| State | Left border | Background | State badge | Approve button | Reject button | Pick-manually | Behavior on click |
|-------|-------------|------------|-------------|----------------|---------------|---------------|-------------------|
| `pending` | 4px `var(--line)` | `var(--bg)` | (none) | enabled "Approve" | enabled "Reject" | enabled "Pick manually" | — |
| `pending` + low-confidence (<0.50) | 4px `var(--accent)` (orange warning) | `var(--bg)` | (none) | enabled "Approve" (still active — D-06) | enabled "Reject" | enabled "Pick manually" | — |
| `approved` | 4px `#15803d` (green) | `var(--bg)` (unchanged) | "Staged" green pill | replaced by "Undo" (neutral) | enabled "Reject" | enabled "Pick manually" | Clicking Undo returns to pending and removes the v2 staged edit from `mar_feedback_staged_v1` |
| `rejected` | 4px `#dc2626` (red) — only visible inside Rejected disclosure | `var(--bg)` | (none — row is hidden by collapse) | (n/a — replaced by Restore) | (n/a) | (n/a) | "Restore" returns row to pending |
| `manual` | 4px `var(--accent-2)` (indigo) | `var(--bg)` | "Manual" indigo pill | enabled "Approve" (writes the manual locator into staged edits) | enabled "Reject" | "Pick again" (replaces "Pick manually" copy) | Approve commits the manually-picked locator |
| `no-primary` (matcher returned null) | 4px `var(--line)` | `var(--bg)` | (none) | **disabled** + tooltip "No match — use Pick manually" | enabled "Reject" | enabled "Pick manually" — emphasized (border-color flips to `var(--accent-2)`) | — |

### 8. Mode-switch tab semantics
- Switching from Per-element click to Per-page review:
  - Hide `#mode-pane-per-element` (sets `hidden` attr); show `#mode-pane-per-page`.
  - Update URL hash to `#mode=per-page` (replace, not push — keeps back button sane).
  - **Do NOT** clear either sessionStorage key (`mar_feedback_match_set_v1` / `mar_feedback_staged_v1`). The corner chip badge inside the iframe continues to show its current count.
  - **Do NOT** reload the iframe. If the per-element iframe has a stale state, it stays.
  - On mode-pane show: if `mar_feedback_match_set_v1` exists AND its `route` matches the current matchPagePick value AND its `buildSha` matches the deployed buildSha, re-render the panel from storage. Else show empty-state.
- Switching back to Per-element click: same — hide / show / update hash. No state reset.
- Deep-link with `#mode=per-page` on first load: render Per-page mode active. With no hash or unrecognized: render Per-element (default per D-07).
- The two iframe elements (`#site` for per-element, `#matchSite` for per-page) are SEPARATE DOM nodes. This keeps per-element's iframe state from being trampled by per-page's `matchSet` query param changes, and vice versa. The hidden pane's iframe pauses naturally — browsers don't reload an iframe just because its container is `hidden`.

### 9. Empty state (per-page mode, no edits yet)
- **Location:** Shown inside the side panel (`#matchPanelEmpty`) when no match set is loaded.
- **Style:** Centered text, `padding: 32px 16px`, `font-size: 13px`, `color: var(--muted)`, `line-height: 1.5`.
- **Heading:** `Tell us what to change on this page` — 14px / 600 / `--ink`, margin-bottom 8px.
- **Body:** `Type or paste your edits above, then click "Match edits". You'll review each match before anything is sent.` — 13px / 400 / `--muted`.
- **Icon:** Optional small line-icon (`✎` Unicode pencil at 24px, color `--muted`, margin-bottom 12px). Implementer's call — not load-bearing.

### 10. Loading state (matcher in flight)
- **Trigger:** "Match edits" click → set button to spinner + "Matching…" + `disabled=true`. ALSO show the full-screen `.working` scrim (existing CSS from `feedback.astro:79-80`) with copy:
  - First line: `Matching your edits…` (16px / 600 / `--ink`).
  - Second line: `Asking Claude to find each line on the page. This usually takes 3–6 seconds.` (13px / 400 / `--muted`).
- **Spinner:** 16×16 inline SVG circle with 2px stroke, `animation: spin 0.8s linear infinite;`. Reuse for both the button-inline spinner and a 32×32 version inside the `.working` scrim.
- **End:** On 200 → hide scrim, replace button text with `Match edits`, populate panel rows. On error → hide scrim, replace button text with `Match edits`, show error toast (see Copywriting table for per-error copy).
- **Cancellation:** No cancel UX — the timeout is 25s per D-13. If the user navigates away or switches mode tabs mid-flight, the fetch's `AbortController` is fired and the panel state is unchanged.

---

## Z-Index Layering (operator surface only)

The pin badge inside the iframe uses `z-index: 2147483646` to sit above page content and below the existing v1.1 corner chip (`2147483645`) and v1.1 panel (`2147483647`). New values on the parent `/feedback` page:

| Layer | z-index | Notes |
|-------|---------|-------|
| Mode tabs | (default stacking) | Static block flow |
| Match input | (default) | Static block flow |
| Side panel | (default) | Static block flow |
| Catalog-drift banner | (default — inside panel) | Static, no overlay |
| Manual-pick toast | 50 | Same layer as existing `.toast` |
| `.working` scrim | 60 | Inherited from existing `feedback.astro:79` |
| In-iframe pin badge | 2147483646 | Set inside the inject's CSS |
| In-iframe focus ring on pin | (same z-index, achieved via box-shadow) | No second layer needed |

---

## Animation & Timing

Operator surface — keep motion minimal (this is a tool, not marketing).

| Surface | Property | Duration | Easing | Notes |
|---------|----------|----------|--------|-------|
| Mode tab indicator | `border-bottom-color` swap | 150ms | `ease-out` | Snappy — feels like a state change, not a transition |
| Match row state transition (pending → approved) | `border-left-color`, `background-color` | 200ms | `ease-out` | Confirms the click registered |
| Confidence pill / state badge | none | 0ms | — | Pop-in instant — no fade |
| `.working` scrim | `opacity` 0 → 1 | 200ms | `ease-out` | Existing pattern in `feedback.astro` already uses display:none toggle; preserve as-is |
| Spinner | `transform: rotate(360deg)` | 800ms | `linear` infinite | |
| Pin badge hover | `transform: scale(1.1)` | 150ms | `ease-out` | Inside iframe |
| Pin focus ring | `box-shadow` swap | 150ms | `ease-out` | Set on `data-fb-match-focus="true"`, cleared after 2s |
| Rejected disclosure open | `<details>` native | (browser default) | — | No custom animation — native is fine |
| Drift banner appearance | `opacity` 0 → 1 + `transform: translateY(-4px) → 0` | 220ms | `ease-out` | Subtle entrance so the alert feels intentional, not jarring |

**Reduced motion:** Wrap the spinner / drift banner / mode-tab transitions in `@media (prefers-reduced-motion: reduce)` to disable animations (set duration to 0ms). The marketing site already has this convention (`global.css:1101-1107`); the operator surface should match.

---

## Responsive Breakpoints

The marketing site uses `1200px / 1024px / 900px / 768px / 600px` breakpoints. The operator surface only needs ONE break for the two-column iframe + panel layout:

| Breakpoint | Behavior |
|------------|----------|
| ≥ 1024px | Two-column: iframe-col `flex: 1 1 65%`, match-panel `flex: 0 0 35%; min-width: 360px; max-width: 480px;`. Mode tabs full-width. Match-input full-width above. |
| < 1024px | Stack: match-input full-width, then iframe (height ~60vh), then panel (block flow, full-width). Panel's border-left becomes border-top. Mode tabs collapse the tab labels' horizontal padding from 24px to 16px to keep the strip on one row at narrow widths. |
| < 600px | (Locked as deferred — REQUIREMENTS.md non-goal "Mobile-specific UI for per-page review mode". Below 600px the layout simply continues the stacked flow at smaller font sizes; no dedicated mobile design.) |

---

## Accessibility Contract

Operator surface — must be keyboard-usable for Monty (power user) and screen-reader-tolerable for any future operator.

| Surface | Requirement |
|---------|-------------|
| Mode tabs | ARIA tabs pattern (`role="tablist"` + `role="tab"` + `aria-selected` + `aria-controls`). Arrow keys move between tabs. |
| Picker | Native `<select>` — already accessible. `<label for="matchPagePick">` required. |
| Textarea | `aria-label="Edit list for selected page"`. `aria-describedby` pointing to char-count element. |
| Submit button | Native `<button>`. When disabled, `aria-disabled="true"` AND `disabled` attribute. When in loading state, `aria-busy="true"`. |
| Match row | No `role` override (default list semantics). Each row's interactive buttons have descriptive `aria-label` (see Copywriting table). |
| Confidence pill | `aria-label="{tier copy}, confidence {percent} percent"` so screen readers don't read just "High match" without the number. |
| State badge | `role="status"` so transitions announce on screen readers. |
| Reject button | After click, the row's container fires `aria-live="polite"` announcement: `"Match {N} rejected. {Rejected count} total."`. |
| Approve button | After click, fires polite announcement: `"Match {N} approved and staged for batch submission."`. |
| Pick-manually button | After click, fires polite announcement: `"Picking match {N} manually. Click an element in the preview."`. |
| Catalog-drift banner | `role="alert"` — auto-announces. |
| Loading scrim | `aria-busy="true"` on the body when scrim is shown; scrim itself has `role="status"`. |
| Color-blind safety | Confidence tiers are NOT color-only — each pill includes text ("High match" / "Some confidence" / "Low match" / "No match") + numeric percent. Approved/Rejected/Manual state badges similarly include text. State row indicator left-border is COLOR-ONLY — to address this, add the state-badge text to approved + manual rows; rejected rows are only visible inside the Rejected disclosure (the disclosure label itself is the text affordance). |
| Focus indicators | Every interactive element keeps the browser's default `:focus-visible` outline. Buttons additionally get `outline: 2px solid var(--accent-2); outline-offset: 2px;` on `:focus-visible`. Pickers and textarea: `border-color: var(--accent-2)` on `:focus-visible` (already in the spec). |
| Tab order | bar (existing) → mode tabs → (per-page tab active) picker → textarea → submit → panel → row 1 actions → row 2 actions → … → Rejected disclosure → toast/scrim if open. |
| `Esc` | Inside the textarea: native (no override). Inside the panel: no-op. Inside the loading scrim: cancels the request via `AbortController` and hides the scrim. |

---

## State / Storage Contract (UI consumes — full schema in CONTEXT.md D-03..D-05)

For UI implementation reference only:

| Key | Owner | Lifecycle | UI consumer |
|-----|-------|-----------|-------------|
| `mar_feedback_match_set_v1` | Per-page mode | Cleared by re-running match or browser close | Side panel reads this to render rows; Approve/Reject updates `rowStates` inside |
| `mar_feedback_staged_v1` | v1.1 (shared) | Cleared by Submit batch or browser close (existing v1.1 behavior, untouched) | Approve in per-page mode writes through to this key |
| `mar_feedback_recent_v1` | v1.2 rail (existing) | localStorage (NOT sessionStorage), persists across browser close | Untouched — rail continues to render below or beside per existing layout |

---

## File Ownership

| File | Owns |
|------|------|
| `src/pages/feedback.astro` | Mode tabs CSS + HTML + JS; match-input CSS + HTML + JS; side-panel CSS + HTML + JS; catalog-drift banner CSS + HTML; loading scrim copy update (re-uses existing CSS). All new CSS lives in the existing `<style>` block (lines 39-98). |
| `src/layouts/BaseLayout.astro` | Adds a sibling conditional loader block (~10 lines) after the existing `?feedback=1` loader (line 1024-1037) that defer-loads `/feedback-match-inject.js?v=<MATCH_INJECT_VER>` when `matchSet` query param is present. The original `?feedback=1` loader stays byte-identical (OPS-02 fence). |
| `public/feedback-match-inject.js` | Pin badge CSS string (inlined); DOM-finding logic (priority order `data-i18n` → `img[src]` → `domPath`); buildSha drift detection; postMessage to parent; manual-pick handoff (which sets `data-fb-match-focus` and listens for the v1.1 inject's click-to-edit event via `MutationObserver` on `data-fb-frozen`). NO import from `feedback-inject.js` (OVERLAY-05). |
| `src/lib/feedback-version.ts` | Adds `export const MATCH_INJECT_VER = '1';` alongside the existing `FEEDBACK_INJECT_VER` (D-23). |
| `src/styles/global.css` | **NOT TOUCHED.** Operator surface is self-contained. |

---

## Token Re-use vs New Tokens

**Re-used (no new):**
- All colors come from `feedback.astro:41` `:root` block (`--bg`, `--panel`, `--line`, `--ink`, `--muted`, `--accent`, `--accent-2`). No new CSS custom properties are introduced.
- Font stacks come from the existing system-sans default.
- The 360px panel min-width matches the v1.1 corner-chip / panel-staged width convention from `feedback-inject.js:101,107`.

**New literal hex values (NOT tokenized — used inline):**
- `#15803d`, `#86efac`, `#052e16` (success tier — already used in `feedback.astro:71` and `.rail__row.is-live`).
- `#dc2626`, `#fca5a5`, `#7f1d1d` (destructive tier — already used in `.login-card .err` and existing toast styles).
- `#a16207`, `#fde68a`, `#3b2a06` (warning tier — NEW values for the drift banner amber surface; chosen to harmonize with the existing slate palette).
- `#3a0d0d` (red pill bg), `#475569` (no-match pill border), `#cbd5e1` (alternates list text), `#3b3a8a` (manual badge bg), `#c7d2fe` (manual badge text), `#4f46e5` (accent-2 hover).

**Recommendation for the planner:** Don't promote any of the new hex values to CSS custom properties — they appear once or twice each, and the operator surface deliberately keeps its theme inline rather than ballooning the design-token surface. If a future phase needs reuse, then promote.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| (none) | — | not applicable (no shadcn, no third-party registries) |

This phase introduces zero new UI dependencies. The only new runtime dep is `@anthropic-ai/sdk` (server-side, not UI). No client packages are added.

---

## Anti-Pattern Guardrails (planner & executor: do not breach)

1. **Do not import from `feedback-inject.js`.** `feedback-match-inject.js` is a sibling, not a child. OPS-02 fence + OVERLAY-05.
2. **Do not modify `src/styles/global.css`.** All operator-surface CSS lives in `feedback.astro`'s `<style>` block. The marketing tokens are not used here.
3. **Do not modify the existing `?feedback=1` loader block in `BaseLayout.astro` (lines 1024-1037).** Add a NEW sibling block below it (D-22). The existing block stays byte-identical (OPS-02).
4. **Do not introduce Tailwind, PostCSS, or any CSS preprocessor.** Plain CSS only, matches the project stack.
5. **Do not add a mobile-specific layout.** Below 1024px the components stack vertically using existing patterns — no custom mobile flow (REQUIREMENTS.md non-goal).
6. **Do not auto-approve at any confidence level.** Every match requires explicit Approve click (REQUIREMENTS.md non-goal).
7. **Do not persist match-set or rejected rows to localStorage.** sessionStorage only (PANEL-05 / D-05).
8. **Do not block Reject with confirmation modals.** Restore via the Rejected disclosure is the undo path.
9. **Do not block tab switches with confirmation modals.** Tab state is non-destructive.
10. **Do not bilingualize the operator surface.** EN-only (matches v1.1/v1.2 `/feedback`).
11. **Do not add a "Submit batch" button to the side panel.** The v1.1 corner chip handles batch submit unchanged (D-24); the panel ends with a helper line pointing the user there.
12. **Do not import Cormorant or DM Sans into the operator surface.** System sans only — different surface, different idiom.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
