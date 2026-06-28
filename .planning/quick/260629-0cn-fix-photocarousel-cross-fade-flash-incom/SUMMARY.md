---
quick_id: 260629-0cn
slug: fix-photocarousel-cross-fade-flash-incom
date: 2026-06-29
status: complete
---

# Summary: Fix PhotoCarousel cross-fade flash

The house-page `PhotoCarousel` cross-faded by fading the outgoing slide out
(`opacity 1→0`) and the incoming slide in (`opacity 0→1`) **simultaneously**.
At the midpoint both slides were ~50% transparent, so the `--bg-stone` backdrop
showed through the gap — a visible flash/flicker on every transition.

**Fix** (`src/components/PhotoCarousel.astro`): incoming slide now fades in *on
top of* the outgoing one, which stays fully opaque underneath until the fade
completes — the same "solid backdrop" principle the lightbox already uses.
- CSS: added `.photo-carousel__slide.is-leaving { opacity: 1; z-index: 1; transition: none }`; active slide is `z-index: 2`, default slides `z-index: 0`.
- JS `show()`: tags the outgoing slide `is-leaving` (held solid), adds `is-active`
  to the incoming, and drops `is-leaving` after the 1.1s fade via `leaveTimer`.
  Rapid transitions clear stale `is-leaving` first (hidden behind the active slide).

No background show-through mid-fade → no flash. Covers all three house pages
(le-moulin, hollywood-hideaway, maison-de-la-riviere) via the shared component.

The lightbox prev/next cross-fade (bedroom tiles → fullscreen) was already
flash-free from prior commits (bed4c39, f2401c7) — unchanged here.

**Verified:** `astro build` completes clean (226 image refs).
