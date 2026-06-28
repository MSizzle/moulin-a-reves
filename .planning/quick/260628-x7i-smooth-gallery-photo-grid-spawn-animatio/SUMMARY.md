---
quick_id: 260628-x7i
slug: smooth-gallery-photo-grid-spawn-animatio
date: 2026-06-28
status: complete
---

# Summary: Smooth gallery photo-grid spawn animation

Made the gallery photo-grid spawn fade **opacity-only** in
`src/styles/global.css`. Removed `transform: translateY(24px)` and
`will-change: transform` from `.photo-grid > *`, and the redundant
`transform: none` from `.spawned`.

**Why:** A translateY transform on a CSS multi-column child fights multicol
re-fragmentation and lazy-image reflow, producing the distorted/janky motion.
Opacity-only fades composite cleanly inside `columns`.

Hover `scale(1.03)` on `.photo-grid img` is untouched (separate element).

**Verified:** `astro build` completes (226 image references, server built clean).
