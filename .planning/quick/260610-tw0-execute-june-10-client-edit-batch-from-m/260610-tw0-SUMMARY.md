---
status: complete
quick_id: 260610-tw0
date: 2026-06-11
commits: 15
---

# Quick Task 260610-tw0 — June 10 Client Edit Batch — Summary

All 18 items from `moulin-a-reves-edit-prompts (2).md` executed (Items 0, 1–3, 4, 5, 6, 7a, 7b, 8, 9, 10, 11, 12–14, 15, 16, 17, 18) as 15 atomic commits, `c23cd16..df2ab07`. Build passes; `public/i18n/translations.json` valid; editor/feedback flow untouched (verified via `git diff --name-only`); no raw asset from `June 2026 Moulin/` in git history (folder gitignored first).

## Commits

| Commit | Item(s) | Change |
|---|---|---|
| c23cd16 | 0 | Asset intake: gitignore raw folder, transcode 6 videos, 2 Grange webps, 6 posters |
| e454cef | 1–3 | Sitewide hero lightbox replaces white room-modal (7 RoomShowcase galleries) |
| 2264ab4 | 4 | Gather cards: italic room name only (no badge/description) via `gatherMode` prop |
| ffdf4b2 | 5, 6 | "Where you'll gather & dine" (EN+FR) + emoji quality lines on all 10 sleep cards |
| 09c5b5f | 7a | 4-square "Explore the Estate" on 3 house pages (Gardens/Grange/Spa/Chicken Coop); "Also included" kept directly below; homepage 6 tiles untouched |
| cb58ed0 | 15 | Gardens card removed from HH gather (see note: La Maison had none) |
| 645a98f | 7b | Both grey sync lines deleted (EN+FR keys removed); duplicate arrow fixed |
| b56ac91 | 11 | 2 owner photos removed from Le Moulin hero gallery (19→17, visually verified) |
| 18f9b00 | 12–14 | HH exact-duplicate photos removed (Looking Glass + Gazebo & Patio) |
| 37dc0ce | 16 | Grange gallery: 2 deletions, fireplace replaced, Netflix shot added (see flags) |
| 232caea | 8 | Groups: 3 sections → clickable lightbox galleries with video-slide support + TODO arrays |
| 3dfadf7 | 9 | 5-video testimonial row above quotes + Florence H. 4th quote w/ expander scaffold |
| 8b95970 | 10 | /art/ DRAFT page in nav + footer (EN+FR), seeded from /about/, cross-linked |
| 94457ea | 17 | Catering hero = bon-appétit video (muted/autoplay/loop/playsinline, poster + reduced-motion fallback) |
| df2ab07 | 18 | Contact "Getting Here" diagnosed + fixed |

## Item 0 — Asset route & size table

Videos → `public/videos/`, posters → `public/images/testimonials/` (+ `public/images/` for catering poster & Grange stills). All H.264+AAC, `+faststart`, ≤1080p. Size check PASS — largest testimonial 33MB (<50MB threshold); catering 398KB (audio stripped, CRF28, 720p). All sources landscape 16:9; no orientation issues. Raw sources remain untouched in gitignored `June 2026 Moulin/`.

| File | Size | Routed to |
|---|---|---|
| testimonial-rave-review.mp4 | 33MB | Groups video row (1st) |
| testimonial-friends-birthday.mp4 | 26MB | Groups video row (2nd) |
| testimonial-guests-luxembourg.mp4 | 17MB | Groups video row (3rd) |
| testimonial-family-french.mp4 | 16MB | Groups video row (4th, "(en français)" label) |
| testimonial-husband-english-tag.mp4 | 6.7MB | Groups video row (5th) |
| catering-bon-appetit.mp4 | 398KB | Catering hero |
| grange-fireplace-flame.webp / grange-screening-netflix.webp | 561/337KB | Grange gallery |

## Lightbox conversion inventory (Items 1–3)

Converted to hero lightbox: sleep + gather on all 3 house pages (7 RoomShowcase instances) and /the-compound/ Shared Spaces (5). Already lightbox, unchanged: homepage Explore tiles, /catering/ gallery. No other white-box modals found. Lightbox extended with video slides (`.lightbox--video-slide`, native controls, no autoplay, stopVideo on nav/close) and `data-gallery-start` index support.

## Diagnose-first findings

- **7b arrow:** literal "→" in anchor text + CSS `.link-arrow::after` injected arrow = two arrows. Removed the literal; CSS supplies the single arrow. Month nav unaffected.
- **11:** both Marie-Antoinette photos present; visually distinguished — deleted `le-moulin-welcome-rose.webp` + `le-moulin-marie-antoinette.webp` (biting, eyes to camera); kept `le-moulin-marie-antoinette-patio.webp`. No stop-and-list needed.
- **12–14:** duplicates were pixel-identical files (`hh-secret-garden-sitting.webp`, `hh-patio-facing-home.webp`) — removed, one of each scene kept.
- **16:** fireplace replacement visually confirmed same scene (now with flame + champagne/cakes) → replaced. "Patio facing blue French doors" was already absent — nothing to delete. No black/off-TV shot existed → Netflix shot **added** rather than swapped (⚑ owner confirm placement). Final count 10; badges auto-compute.
- **18 before-state:** (1) `data-i18n` (not `-html`) on `contact.getting.summary` stripped the directions-FAQ link on language toggle — the actual "wonky" bug; (2) "Getting Here" was an equal-weight h2 → demoted to styled h3; (3) hardcoded caption mismatched the translation key (text flash) → aligned. Map is a Google embed (not OSM), no raw URL visible. `/about/#getting-here` verified working.

## Item 6 — emoji decision for owner

Stairs emoji 🪜 judged misleading; plain text used for the two stair rooms: Le Loft Suite "Up steep stairs", Sleeping Beauty "Up two steep flights" (emoji variants available on request). All other rooms use 🛌/🛏/🛁/🚿/etc. per room's own description text.

## Groups drop-dir convention (Item 8)

New gallery stills: `public/images/groups/{yoga|family|creative}/kebab-case.webp` (max 2000px, q85). New videos: `public/videos/` + poster in `public/images/testimonials/`. TODO arrays marked in `src/pages/groups.astro`.

## Owner flags / open questions

1. **French testimonial subtitles** — add EN `.vtt` track, EN caption, or leave labeled "(en français)"? Not decided.
2. **Florence H. quote placement** (4th card under video row) is the assistant's guess — owner may move; full review text still ⏳ (expander scaffolded with TODO).
3. **Grange Netflix photo** was added (no off-TV shot existed to replace) — confirm.
4. **Item 15 / La Maison:** no "Gardens" card existed in its gather section (the tile the owner saw was the old "What's here" → "Compound Gardens" feature, now superseded by Explore the Estate → The Gardens). Nothing deleted; intent satisfied.
5. **/art/ page is DRAFT** — copy + gallery seeded from existing material; dedicated photos/text ⏳ (`public/images/art/` TODO).
6. **Item 8 extra gallery photos** ⏳ — galleries scaffolded with existing repo images.
7. **All new FR strings are machine-translated** — flagged for native review before publish (gather&dine heading, Explore tiles, groups/art/Florence keys).
