---
phase: 260506-kao
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/catering.astro
autonomous: false
requirements:
  - KAO-01
must_haves:
  truths:
    - "Faces of the group are visible in the catering hero on desktop (~1920px down through ~1200px)"
    - "Faces remain visible on mobile widths (~390px) — table/food may be partially cropped at the bottom, which is acceptable"
    - "/about/ and /wellness/ heroes are visually unchanged (their `<img>` tags carry no inline `object-position`)"
    - "Catering hero height stays at 56vh — same as about and wellness"
  artifacts:
    - path: "src/pages/catering.astro"
      provides: "Catering page with object-position-corrected hero"
      contains: 'style="object-position: center 22%;"'
  key_links:
    - from: "src/pages/catering.astro line 10 <img>"
      to: "global .hero__image img rule (object-fit: cover)"
      via: "inline style overriding only object-position, not object-fit"
      pattern: 'object-position:\s*center\s*22%'
---

<objective>
Fix the catering hero photo crop on `/catering/`. The current `object-fit: cover` with default `object-position: center 50%` crops the desktop hero to people's torsos. A single inline `object-position: center 22%` on the hero `<img>` biases the visible window upward so faces stay in frame at every breakpoint.

Purpose: The hero currently shows guests cropped at waist height instead of conveying "guests gathered around a beautiful spread" — directly undermines the page's job (drive catering inquiries).

Output: One modified line in `src/pages/catering.astro`. No global CSS change, no photo swap, no copy change.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md

<!-- User-approved plan from Claude Code plan mode — your source of truth -->
@/home/claude/.claude/plans/the-catering-hero-photo-fancy-valiant.md

<!-- File to be modified — confirmed line 10 still matches the approved plan -->
@src/pages/catering.astro

<interfaces>
<!-- Current state of catering.astro lines 7–11 -->

```astro
  <!-- Hero -->
  <section class="hero" style="height: 56vh;">
    <div class="hero__image">
      <img src="/images/catering-group-table.webp" alt="Long table set for a group dinner at Moulin à Rêves" />
    </div>
```

<!-- Current global rule from src/styles/global.css:951-955 (DO NOT MODIFY) -->

```css
.hero__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

<!-- After this plan ships, line 10 must read: -->

```astro
      <img src="/images/catering-group-table.webp" alt="Long table set for a group dinner at Moulin à Rêves" style="object-position: center 22%;" />
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add inline object-position style to catering hero img</name>
  <files>src/pages/catering.astro</files>
  <action>
Open `src/pages/catering.astro`. On line 10, add `style="object-position: center 22%;"` to the existing `<img>` tag inside `<div class="hero__image">`. Do not touch the `src` or `alt` attributes. Do not change the `<section class="hero" style="height: 56vh;">` wrapper. Do not modify `src/styles/global.css` — the global `.hero__image img` rule must remain unchanged so `/about/` and `/wellness/` heroes are unaffected.

The exact line should change from:
```astro
      <img src="/images/catering-group-table.webp" alt="Long table set for a group dinner at Moulin à Rêves" />
```
to:
```astro
      <img src="/images/catering-group-table.webp" alt="Long table set for a group dinner at Moulin à Rêves" style="object-position: center 22%;" />
```

Why `center 22%`: faces sit ~15–28% from the top of the source photo; 22% anchors the visible viewport so faces stay in frame on wide desktop crops while preserving the table edge in the lower frame. Per the user-approved plan, alternative approaches (changing `object-fit`, lowering hero height on this page, swapping the photo) were explicitly rejected — do not propose them.
  </action>
  <verify>
    <automated>grep -c 'object-position: center 22%' src/pages/catering.astro | grep -q '^1$' && grep -c 'object-position' src/styles/global.css | grep -q '^0$'</automated>
  </verify>
  <done>
- `src/pages/catering.astro` line 10 contains `style="object-position: center 22%;"` on the hero `<img>`.
- `src/styles/global.css` is untouched (no `object-position` declarations anywhere in the global stylesheet that weren't there before).
- No other files modified.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Visual verification at desktop and mobile widths</name>
  <what-built>Catering hero `<img>` now has `object-position: center 22%` inline. Desktop and mobile crops should now favor faces over waists. Other heroes are untouched.</what-built>
  <how-to-verify>
1. Run `npm run dev` and open `http://localhost:4321/catering/`.
2. Resize the browser from ~1920px down to ~390px. Confirm faces of the group are visible at every breakpoint (previously they vanished above ~1200px).
3. Open `http://localhost:4321/about/` and `http://localhost:4321/wellness/` — confirm both heroes look identical to before (no shift in vertical crop). They should NOT be affected.
4. Toggle to FR via the language switcher on `/catering/` — hero crop is unchanged (no copy edits in this plan).
5. Optional: DevTools mobile emulation at iPhone widths — faces should still be visible; table/food may be partially cropped at the bottom (acceptable trade-off per approved plan).
  </how-to-verify>
  <resume-signal>Type "approved" if faces are visible on `/catering/` at all breakpoints AND `/about/` + `/wellness/` look unchanged. Otherwise describe what's wrong (e.g., "faces still cut off at 1920px" or "about hero looks different").</resume-signal>
</task>

</tasks>

<verification>
- `grep 'object-position: center 22%' src/pages/catering.astro` returns exactly one match on line 10.
- `git diff src/styles/global.css` is empty.
- `git diff src/pages/catering.astro` shows only the inline-style addition on the hero `<img>` — no other changes.
- Manual visual check (Task 2 checkpoint) confirms faces visible on `/catering/` and `/about/` + `/wellness/` unaffected.
</verification>

<success_criteria>
- Catering page hero shows guests' faces, not torsos, on desktop and mobile.
- About and Wellness page heroes are visually unchanged.
- Single-file diff: only `src/pages/catering.astro`.
- No copy / translations / global CSS / photo asset changes.
</success_criteria>

<output>
After completion, create `.planning/quick/260506-kao-catering-hero-object-position-fix/260506-kao-01-SUMMARY.md`.
</output>
