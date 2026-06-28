---
quick_id: 260628-x7i
slug: smooth-gallery-photo-grid-spawn-animatio
date: 2026-06-28
---

# Quick Task: Smooth gallery photo-grid spawn animation

## Problem

Gallery photo tiles fade in with a distorted/janky look. Root cause: the spawn
animation animates `transform: translateY(24px)` + `will-change: transform` on
direct children of a CSS multi-column container (`.photo-grid { columns: 3 }`).
Multicol re-fragments its children on every layout pass; a transformed,
layer-promoted child inside that flow repaints/re-fragments mid-transition.
Lazy-loaded images with no reserved height compound it by reflowing the columns
while tiles are mid-fade.

## Change

In `src/styles/global.css`, make `.photo-grid > *` spawn fade **opacity-only**:
- Remove `transform: translateY(24px)` and its transition channel.
- `will-change: opacity, transform` → `will-change: opacity`.
- Drop the now-redundant `transform: none` from `.spawned`.

Keep the hover `transform: scale(1.03)` on `.photo-grid img` (separate element,
not a multicol child — unaffected).

## Verification

- Build succeeds.
- Gallery tiles fade in smoothly (no translate jump) as they scroll into view.
- Hover zoom on photos still works.
