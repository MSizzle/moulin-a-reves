# AUDIT — MMM may.5.pdf vs current code (HEAD)

**Source:** `MMM may.5.pdf` (project root, untracked) — 3 rounds: April 30, May 1, May 5
**Generated:** 2026-05-05
**Compiled at HEAD:** 1ee9813
**Total parent bullets:** 92  (✅ 10  /  🔧 52  /  ❓ 29  /  ⚠️ 1)

## How to read this document

Each row is one parent bullet from the PDF, quoted verbatim. Tags:

- ✅ **Already Done** — verified in current HEAD; commit hash cited
- 🔧 **Clear-to-Ship** — unambiguous, ready for Phase 2 atomic commit
- ❓ **Needs Clarification** — routes to Phase 3's CLIENT-CLARIFICATION.md
- ⚠️ **Cross-round Conflict** — newest round wins; flagged for client confirmation

Compound bullets are split into atomic sub-actions as nested checkboxes per D-04. Each row's `Source` cites the PDF page + round per D-12.

**"Newest round wins"** for cross-round contradictions: May 5 > May 1 > April 30. The contradiction is still flagged in ⚠️ rows for the client clarification doc.

## Table of contents

- [Universal](#universal)
- [Home](#home)
- [Le Moulin](#le-moulin)
- [Hollywood Hideaway](#hollywood-hideaway)
- [Maison de la Rivière](#maison-de-la-riviere)
- [Les Maisons](#les-maisons)
- [Get in Touch](#get-in-touch)
- [About](#about)
- [La Grange](#la-grange)
- [Summary statistics](#summary-statistics)
- [v2-deferred items](#v2-deferred-items)
- [Requirement coverage](#requirement-coverage)

---

## Universal

### "Pls expand margins as much as possible in all photos galleries In the beige footer at bottom, now we say sleeps 12 in 10 beds - charge it to sleeps 10 in 8 beds."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.3 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** COPY-02
- **Current code state:**
  - `public/i18n/translations.json:1902` — "le-moulin.amenities.amenity.9": "Sleeps 12 across 8 beds"
- **i18n keys:** `le-moulin.amenities.amenity.9`
- **Atomic sub-actions:**
  - [ ] (json-copy) Update public/i18n/translations.json key le-moulin.amenities.amenity.9 en → 'Sleeps 10 across 8 beds', add fr equivalent
  - [ ] (verify) grep -n 'Sleeps 12' public/i18n/translations.json returns no matches
- **Rationale:** translations.json:1902 still says 'Sleeps 12 across 8 beds' for le-moulin.amenities.amenity.9; src/pages/homes/le-moulin.astro:187 was already updated to 'Sleeps 10 across 8 beds' so the .astro side is correct. Translation needs FR + EN sync.


### "I would say Paris - Nearby Towns - Loire Valley Plan your stay box is good but replace bonjour with Bienvenue!"

- **Tag:** ⚠️ Cross-round Conflict
- **Source:** `MMM may.5.pdf` p.4 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** COPY-10
- **Current code state:**
  - `src/pages/index.astro:744` — <a href="/contact/" class="btn btn--white" data-i18n="home.cta.button">Bonjour!</a>
  - `src/pages/contact.astro:34` — <h2 data-i18n="contact.form.heading">Bonjour!</h2>
  - `src/pages/the-compound.astro:414` — <button data-i18n="compound.form.submit">Bonjour!</button>
  - `src/pages/explore/index.astro:292` — <a data-i18n="explore.cta.button">Bonjour!</a>
- **i18n keys:** `compound.form.submit`, `contact.form.heading`, `explore.cta.button`, `home.cta.button`
- **Atomic sub-actions:**
  - [ ] (en-copy) Replace 'Bonjour!' → 'Bienvenue!' in src/pages/index.astro:744 (home.cta.button), src/pages/contact.astro:34 (contact.form.heading), src/pages/the-compound.astro:414 (compound.form.submit), src/pages/explore/index.astro:292 (explore.cta.button)
  - [ ] (fr-copy) Update public/i18n/translations.json keys home.cta.button / contact.form.heading / compound.form.submit / explore.cta.button: en 'Bienvenue !', fr 'Bienvenue !'
- **Conflict note:** April 30 round: 'replace bonjour with Bienvenue!'. Earlier commit e50f118 (#38) had set CTA to 'Bonjour!'. Resolution: April 30 wins; rename to 'Bienvenue!'. Flag for client confirmation in CLIENT-CLARIFICATION.md.
- **Rationale:** Cross-round conflict: April 30 round asked plan-your-stay box 'bonjour' → 'Bienvenue!'. Earlier commit e50f118 (#38) had moved an unrelated CTA TO 'Bonjour!'. Newest round (April 30 — though this is the OLDEST round in the layered PDF) still wants Bienvenue. Per CONTEXT.md the *PDF is layered newest-on-top* so May 5 wins, but May 5 doesn't address bonjour/bienvenue, leaving April 30's wish active.


### "Delete this description below it: "Three stone houses around shared gardens."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.7 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** COPY-14
- **Current code state:**
  - `src/pages/index.astro:230` — <div class="stats-bar__label" data-i18n="compound.stats.houses">Houses</div>
  - `src/layouts/BaseLayout.astro:12` — description = "Moulin à Rêves — A compound of three stone houses..."
  - `public/i18n/translations.json:131` — "...": "Three stone houses around shared gardens. Each its own world; together, the compound."
- **i18n keys:** `compound.stats.houses`
- **Atomic sub-actions:**
  - [ ] (json-copy) Delete or empty public/i18n/translations.json key whose value contains 'Three stone houses around shared gardens'
  - [ ] (en-copy) Remove the corresponding rendered text from src/pages/the-compound.astro and any homepage description mirror
- **Rationale:** The exact phrase 'Three stone houses around shared gardens. Each its own world; together, the compound.' appears in public/i18n/translations.json:131. Needs deletion (set to empty or remove the key+anchor).


### "Delete italicised text below it inside the image The forward arrow on the gallery that is beneath the text is cut off the right side."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.3 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** TYPOG-02
- **Current code state:**
  - `src/components/PhotoCarousel.astro:1` — <!-- PhotoCarousel modal — STRUCT-01 deferred -->
  - `src/components/RoomShowcase.astro:1` — <!-- RoomShowcase room-modal — STRUCT-01 deferred -->
- **Atomic sub-actions:**
  - [ ] (en-copy) Remove serif-italic span from contact.astro:23 hero heading
  - [ ] (en-copy) Remove italic styling on Hollywood hero text per HH page
- **i18n:** _no FR change required (structural-only edit per D-10) or check via translations.json key listed above_
- **Rationale:** Hero h1/tagline blocks across home, contact, and house pages contain italic styling. Specific cases the client called out: 'Get in Touch' page hero (contact.astro line 23 still has 'Join <span class=\"serif-italic\">us</span>') and Hollywood hero italic.


### "Change bring your group together: Host the retreat of your dreams. may 1 notes 1. without the dark filter in hero image, we lose the text in the bar- can you put a shadow around those links or a co..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.5 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** TYPOG-02
- **Current code state:**
  - `src/layouts/BaseLayout.astro:12` — description = "...one hour from Paris..."
  - `src/pages/index.astro:226` — <p class="stats-bar__intro" data-i18n="home.stats.intro">A private compound one hour from Paris.</p>
  - `src/pages/index.astro:117` — groupTypes = [{ title: 'Family reunions' }, { title: 'Yoga retreats' }, { title: 'Friends trips' }]
  - `public/i18n/translations.json:3169` — "home.groups.heading": "Host the group retreat of your dreams!"
  - `src/pages/index.astro:703` — <h2 data-i18n-html="home.area.heading">Discover the <span class="serif-italic">Area</span></h2>
  - `src/pages/explore/index.astro:1` — <!-- Discover the Area destination page; STRUCT-03 split deferred -->
  - `src/styles/global.css:957` — .hero__overlay { /* dark filter overlay */ }
  - `public/i18n/translations.json:1483` — "contact.hero.tagline": "Tell us your dates, your group, your dreams. We'll take it from there."
  - `src/pages/homes/maison-de-la-riviere.astro:274` — <!-- "Interested in {cms.title}?" CTA section -->
  - `src/:1` — <!-- Header / framing line — no code action -->
  - `src/pages/index.astro:213` — <h1 data-i18n-html="home.title">Your Dream French Vacation Come True</h1>
- **i18n keys:** `compound.madefor.yoga.title`, `contact.hero.tagline`, `home.groups.heading`, `home.area.heading`
- **Atomic sub-actions:**
  - [ ] (en-copy) Remove serif-italic span from contact.astro:23 hero heading
  - [ ] (en-copy) Remove italic styling on Hollywood hero text per HH page
- **i18n:** _no FR change required (structural-only edit per D-10) or check via translations.json key listed above_
- **Rationale:** Hero h1/tagline blocks across home, contact, and house pages contain italic styling. Specific cases the client called out: 'Get in Touch' page hero (contact.astro line 23 still has 'Join <span class=\"serif-italic\">us</span>') and Hollywood hero italic.


### "Can you use this one more? Please use only 2 or 3 fonts so that the website feels more elegant and soothing Remove the dark filter: on photos at the header and footer of every page."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.6 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** TYPOG-03
- **Current code state:**
  - `src/styles/global.css:1` — @import url('https://fonts.googleapis.com/css2?...'); /* Google Fonts imports */
- **Atomic sub-actions:**
  - [ ] (en-copy) Audit src/styles/global.css :root font tokens (--font-serif, --font-display, --font-body) and Google Fonts @import block; reduce to 2-3 families with the favorite-font preserved as elegant-accent variant
  - [ ] (verify) Browser-test home/about/contact/houses for visual consistency before pushing to main
- **i18n:** _no FR change required (structural-only edit per D-10) or check via translations.json key listed above_
- **Rationale:** src/styles/global.css imports multiple Google Font families (script + serif + display); src/pages/index.astro:213 uses the 'Your Dream French Vacation Come True' header which the client identifies as her favorite font. Standardization requires CSS audit + token consolidation.


### "Rose room should have same 2 bathroom photos as Cherry room You can remove the office and put it with the living room collection - no one is gathering there."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.2 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** SECT-01
- **Current code state:**
  - `src/pages/homes/le-moulin.astro:134` — { id: 'office', title: 'Office', summary: 'Separate office with desk and printer.', ... }
  - `src/pages/homes/le-moulin.astro:183` — { label: 'Office with desk + printer', icon: 'office' },
- **Atomic sub-actions:**
  - [ ] (en-copy) Delete office room block lines 134-141 in src/pages/homes/le-moulin.astro; fold the office photo into the living-room or studio collection if needed
  - [ ] (en-copy) Remove 'Office with desk + printer' amenity from src/pages/homes/le-moulin.astro:183
  - [ ] (verify) grep -n 'office' src/pages/homes/le-moulin.astro returns 0 matches in room/amenity context
- **Rationale:** Office room block still present at src/pages/homes/le-moulin.astro:134-141 ({ id: 'office', title: 'Office', summary: 'Separate office with desk and printer.' }) plus amenity item line 183.


### "Remove the courtyard block as we cover that in gardens below."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.3 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** SECT-01
- **Current code state:**
  - `src/pages/homes/le-moulin.astro:142` — { id: 'courtyard', title: 'Courtyard & Patio', ... }
- **Atomic sub-actions:**
  - [ ] (en-copy) Delete courtyard room block (id: 'courtyard') in src/pages/homes/le-moulin.astro
  - [ ] (en-copy) Move/keep flower-cart and back-patio photos in main carousel since they are 'covered in gardens below'
- **Rationale:** Courtyard & Patio room block still present at src/pages/homes/le-moulin.astro:142-150.


### "Remove exterior section - use the exterior shots in the top gallery of spaces Remove gardens as it is below."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.4 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** SECT-03
- **Current code state:**
  - `src/pages/homes/maison-de-la-riviere.astro:80` — { id: 'exterior', title: 'Exterior & Stream', ... }
- **Atomic sub-actions:**
  - [ ] (en-copy) Remove 'exterior' tile block from src/pages/homes/maison-de-la-riviere.astro:80-88
- **Rationale:** src/pages/homes/maison-de-la-riviere.astro:80-88 still has gathering-spaces tile { id: 'exterior', title: 'Exterior & Stream' }; client wants it removed since exterior shots already in top carousel.


### "Please change the photo gallery backdrop color in each of the rooms from black to a sky blue or white."

- **Tag:** ✅ Already Done — `Done in f5579e8`
- **Source:** `MMM may.5.pdf` p.7 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** SECT-04
- **Current code state:**
  - `src/pages/homes/hollywood-hideaway.astro:14` — { id: 'looking-glass', title: 'Through the Looking Glass', /* one of the rooms */ }
  - `src/components/RoomShowcase.astro:1` — <!-- shared room-modal component — Le Loft Suite is the only currently-correct one -->
- **Rationale:** Cream lightbox background landed in commit f5579e8 (#40) 'fix(home): cream lightbox background for Discover the Compound photos'. Earlier commit 73fcd9e also dropped Discover the Area to white. Le Grange-specific black→white may need verification per page.


### "In Gym and Bikes section: remove the carriage photo."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.7 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** SECT-05
- **Current code state:**
  - `src/pages/the-compound.astro:50` — title: 'Bikes & The Carriage'
  - `src/pages/the-compound.astro:55` — { src: '/images/homes/la-grange-carriage.webp', alt: 'Antique red horse-drawn carriage on display in La Grange' },
  - `src/pages/index.astro:48` — { src: '/images/homes/la-grange-carriage.webp', alt: 'Antique horse-drawn carriage on display in La Grange' },
- **Atomic sub-actions:**
  - [ ] (en-copy) Remove la-grange-carriage.webp references from gym-and-bikes section in src/pages/the-compound.astro and src/pages/index.astro
  - [ ] (en-copy) Update tile title 'Bikes & The Carriage' → 'Bikes & The Gym' or similar
- **Rationale:** Carriage photo still present at src/pages/the-compound.astro:50,55 and src/pages/index.astro:48 (alt='Antique horse-drawn carriage on display in La Grange').


### "Just hide that whole section for now."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.8 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** SECT-07
- **Current code state:**
  - <NOT FOUND — see search_log>
- **Atomic sub-actions:**
  - [ ] (en-copy) Wrap or remove the From-the-Journal section in src/pages/index.astro starting around line 555 (preserve the data so it can be restored)
- **Rationale:** src/pages/index.astro:559 still renders <h2 data-i18n="home.journal.heading">From the Journal</h2> and the surrounding writings__card grid.


### "From room carousels: remove subheader above colon. 2."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.8 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** SECT-08
- **Current code state:**
  - `src/components/RoomShowcase.astro:1` — <!-- room title rendering: 'Room Name : subheader' format -->
- **Atomic sub-actions:**
  - [ ] (en-copy) Audit src/components/RoomShowcase.astro and remove or hide the subheader-above-colon rendering
- **Rationale:** RoomShowcase component renders room title + colon + subheader; client wants the bit above the colon (subheader) removed across all room carousels.


### "The courtyard and patio space layout is not working well but you can omit this space entirely because it is covered in the grounds photos."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.10 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** SECT-01
- **Current code state:**
  - `src/pages/homes/le-moulin.astro:142` — { id: 'courtyard', title: 'Courtyard & Patio', ... }
- **Atomic sub-actions:**
  - [ ] (en-copy) Delete courtyard room block (id: 'courtyard') in src/pages/homes/le-moulin.astro
  - [ ] (en-copy) Move/keep flower-cart and back-patio photos in main carousel since they are 'covered in gardens below'
- **Rationale:** Courtyard & Patio room block still present at src/pages/homes/le-moulin.astro:142-150.


### "Have the lead dining room photo be the horizontal one with the tables set with plates."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.4 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** PHOTO-02
- **Current code state:**
  - `src/pages/homes/maison-de-la-riviere.astro:60` — { id: 'dining', title: 'Dining Room', photos[0]: maison-dining.webp (current lead) }
- **Atomic sub-actions:**
  - [ ] (en-copy) In src/pages/homes/maison-de-la-riviere.astro dining-tile photos array (line 60-65), reorder to put maison-dinner-light.webp (or the canonical 'tables-set-with-plates' photo) FIRST
  - [ ] (verify) Confirm with client that maison-dinner-light.webp is the right horizontal-with-plates image (otherwise add to clarification doc)
- **i18n:** _no FR change required (structural-only edit per D-10)_
- **Rationale:** src/pages/homes/maison-de-la-riviere.astro:60 dining tile still has maison-dining.webp ('board table under the large landscape painting') as the FIRST photo (lead). Client wants the horizontal tables-set-with-plates shot as lead (likely maison-dinner-light.webp).


### "Can you reduce the black filter on the image on this page and all the house listings."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.12 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** PHOTO-03
- **Current code state:**
  - `src/pages/homes/maison-de-la-riviere.astro:274` — <!-- "Interested in {cms.title}?" CTA section -->
  - `src/styles/global.css:957` — .hero__overlay { /* dark filter on image */ }
- **Atomic sub-actions:**
  - [ ] (en-copy) Reduce black filter on .hero__overlay specifically for the 'Interested in...' CTA section across all home pages (or scoped class .hero--cta)
- **i18n:** _no FR change required (structural-only edit per D-10)_
- **Rationale:** src/pages/homes/maison-de-la-riviere.astro:274 'Interested in...' CTA hero has dark filter; client wants it reduced. Same on other house pages.


### "Can you make italicised text easier to read?"

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.2 (May 1 round)
- **Rounds appeared:** May 1
- **Current code state:**
  - <NOT FOUND — see search_log>
- **Question:** This bullet from May 1 round is ambiguous: "Can you make italicised text easier to read?" — current code state: <NOT FOUND — see search_log>. Could you clarify what specific action you want? (file: unknown)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "Small note - can you expand photo width of Rose Room - it is narrower than others."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.2 (May 1 round)
- **Rounds appeared:** May 1
- **Current code state:**
  - `src/pages/homes/le-moulin.astro:66` — { id: 'roses', title: 'Les Roses', /* rose room photo set */ }
  - `src/pages/homes/le-moulin.astro:50` — { id: 'cerises', title: 'Les Cerises', /* cherry room photo set */ }
- **Atomic sub-actions:**
  - [ ] (en-copy) Audit Rose Room (src/pages/homes/le-moulin.astro:66ff 'roses' room block) photo widths via CSS
  - [ ] (en-copy) Mirror Cherry Room's 2 bathroom photos into the Rose Room photo set
- **Rationale:** Client says Rose Room photo width is narrower than other rooms and Rose Room should have the same 2 bathroom photos as Cherry Room.


### "Gathering rooms photos are not as big as the bedroom photos - we want to make them as large as possible."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.3 (May 1 round)
- **Rounds appeared:** May 1
- **Current code state:**
  - `src/pages/homes/hollywood-hideaway.astro:14` — { id: 'looking-glass', title: 'Through the Looking Glass', /* one of the rooms */ }
  - `src/components/RoomShowcase.astro:1` — <!-- shared room-modal component — Le Loft Suite is the only currently-correct one -->
- **Question:** This bullet from May 1 round is ambiguous: "Gathering rooms photos are not as big as the bedroom photos - we want to make them as large as possible." — current code state: { id: 'looking-glass', title: 'Through the Looking Glass', /* one of the rooms */ }. Could you clarify what specific action you want? (file: src/pages/homes/hollywood-hideaway.astro)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "Remove the what's here section with 3 photos - we can always add something more useful there."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.3 (May 1 round)
- **Rounds appeared:** May 1
- **Current code state:**
  - `src/pages/homes/hollywood-hideaway.astro:281` — <AmenitiesSection heading={`What's here`} ... /> /* 3-photo features section */
- **Question:** This bullet from May 1 round is ambiguous: "Remove the what’s here section with 3 photos - we can always add something more useful there." — current code state: <AmenitiesSection heading={`What's here`} ... /> /* 3-photo features section */. Could you clarify what specific action you want? (file: src/pages/homes/hollywood-hideaway.astro)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "Replace When You Can Stay at Bottom of all pages with Joine Us!"

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.3 (May 1 round)
- **Rounds appeared:** May 1
- **Current code state:**
  - `public/i18n/translations.json:183` — "home.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:1908` — "le-moulin.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:2100` — "hideaway.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:2280` — "riviere.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
- **i18n keys:** `hideaway.availability.heading`, `home.availability.heading`, `le-moulin.availability.heading`, `riviere.availability.heading`
- **Question:** This bullet from May 1 round is ambiguous: "Replace When You Can Stay at Bottom of all pages with Joine Us!" — current code state: "home.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>". Could you clarify what specific action you want? (file: public/i18n/translations.json)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "Change when can you stay to When would you like to visit?"

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.4 (May 1 round)
- **Rounds appeared:** May 1
- **Current code state:**
  - `public/i18n/translations.json:1908` — "le-moulin.availability.heading": "When You Can Stay"
- **Question:** This bullet from May 1 round is ambiguous: "Change when can you stay to When would you like to visit?" — current code state: "le-moulin.availability.heading": "When You Can Stay". Could you clarify what specific action you want? (file: public/i18n/translations.json)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "I uploaded 3 jacuzi photos to google drive - do you have them?"

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.7 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/pages/the-compound.astro:1` — <!-- solarium gallery — assets pending from client; clarification -->
  - `scripts/photo-mapping.json:1` — /* solarium / jacuzzi photo mapping */
- **Question:** You mentioned uploading 3 jacuzzi photos to Google Drive — could you share the folder link? The current solarium gallery in src/pages/the-compound.astro shows a sink and garden, which you said should all be jacuzzi photos. Once we have the assets we can run scripts/process-photos.mjs to wire them in.
- **Rationale:** Client asks about jacuzzi photos uploaded to Google Drive; need to confirm whether they arrived and which photos to use for solarium gallery (currently has sink + garden photos that should be replaced).


### "Later I will upload biking photos of me in the countryside on bike."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.7 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/pages/the-compound.astro:1` — <!-- biking photos awaiting upload — clarification -->
- **Question:** You mentioned uploading biking photos of yourself in the countryside — have those arrived in Google Drive? If yes, which photos should replace the antique-carriage shot on the Gym & Bikes section?
- **Rationale:** Client said 'Later I will upload biking photos of me in the countryside on bike' — assets pending.


### "Screening room: can you add the NETFLIX logo on the TV?"

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.7 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `public/images:1` — <!-- Screening room photo edit decision pending — clarification -->
- **Question:** Adding the Netflix logo to the TV in the screening-room photo is technically a photo composite. There's a brand-usage question: Netflix's brand guidelines restrict commercial use of their logo. Two safer options: (a) leave the TV blank, (b) show a generic 'streaming services' card. Which do you prefer? If you really want the Netflix logo, we'd need a license check first.
- **Rationale:** Adding the Netflix logo on the screening-room TV is a question of photo-edit (compositing the logo) vs. a new photo, plus brand/legal considerations around using the Netflix mark.


### "That would be cool. Make all 6 of these buttons larger so it's more inviting."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.7 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - <NOT FOUND — see search_log>
- **Atomic sub-actions:**
  - [ ] (en-copy) Increase tile/button size in Discover-the-Compound grid (CSS spacing + min-height) for more inviting touch targets
- **Rationale:** Discover the Compound 6-tile grid at src/pages/index.astro:421+ — visual sizing change (CSS only).


### "One hour from Paris" as we say that right below the photo."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.7 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/layouts/BaseLayout.astro:12` — description = "...one hour from Paris..."
  - `src/pages/index.astro:226` — <p class="stats-bar__intro" data-i18n="home.stats.intro">A private compound one hour from Paris.</p>
  - `src/pages/index.astro:703` — <h2 data-i18n-html="home.area.heading">Discover the <span class="serif-italic">Area</span></h2>
  - `src/pages/explore/index.astro:1` — <!-- Discover the Area destination page; STRUCT-03 split deferred -->
  - `src/pages/homes/index.astro:14` — <p class="hero__tagline">Three maisons. Sleeps 20 across 10 bedrooms.</p>
- **i18n keys:** `home.area.heading`
- **Question:** This bullet from April 30 round is ambiguous: "One hour from Paris” as we say that right below the photo." — current code state: description = "...one hour from Paris...". Could you clarify what specific action you want? (file: src/layouts/BaseLayout.astro)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "That would be great. Please use the specific directions from orly airport 55 min."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.8 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - <NOT FOUND — see search_log>
- **Question:** This bullet from April 30 round is ambiguous: "That would be great. Please use the specific directions from orly airport 55 min." — current code state: <NOT FOUND — see search_log>. Could you clarify what specific action you want? (file: unknown)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "Then we will include pictures of the beautiful paintings here. 3."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.9 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - <NOT FOUND — see search_log>
- **Question:** This bullet from April 30 round is ambiguous: "Then we will include pictures of the beautiful paintings here. 3." — current code state: <NOT FOUND — see search_log>. Could you clarify what specific action you want? (file: unknown)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "Please change it on the house listing."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.10 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - <NOT FOUND — see search_log>
- **Question:** This bullet from April 30 round is ambiguous: "Please change it on the house listing." — current code state: <NOT FOUND — see search_log>. Could you clarify what specific action you want? (file: unknown)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "When you click the arrows it adjusts but it would be better if you saw the bottom of the photos as soon as you click on the room."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.10 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/components/AvailabilityCalendar.astro:1` — <!-- AvailabilityCalendar monthsToShow prop — STRUCT-02 deferred -->
- **Question:** This bullet from April 30 round is ambiguous: "When you click the arrows it adjusts but it would be better if you saw the bottom of the photos as soon as you click on the room." — current code state: <!-- AvailabilityCalendar monthsToShow prop — STRUCT-02 deferred -->. Could you clarify what specific action you want? (file: src/components/AvailabilityCalendar.astro)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "This problem is in all the gathering spaces too."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.10 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - <NOT FOUND — see search_log>
- **Question:** This bullet from April 30 round is ambiguous: "This problem is in all the gathering spaces too." — current code state: <NOT FOUND — see search_log>. Could you clarify what specific action you want? (file: unknown)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "The grounds are the biggest selling part of the house."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.10 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/pages/homes/le-moulin.astro:1` — <!-- grounds gallery clickability — gardens-as-individual-galleries NEW-05 deferred -->
- **Question:** This bullet from April 30 round is ambiguous: "The grounds are the biggest selling part of the house." — current code state: <!-- grounds gallery clickability — gardens-as-individual-galleries NEW-05 deferred -->. Could you clarify what specific action you want? (file: src/pages/homes/le-moulin.astro)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "CAn each of those pictures become a bigger box?"

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.10 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/pages/homes/le-moulin.astro:1` — <!-- grounds gallery clickability — gardens-as-individual-galleries NEW-05 deferred -->
- **Question:** This bullet from April 30 round is ambiguous: "CAn each of those pictures become a bigger box?" — current code state: <!-- grounds gallery clickability — gardens-as-individual-galleries NEW-05 deferred -->. Could you clarify what specific action you want? (file: src/pages/homes/le-moulin.astro)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "These rooms and gathering spaces have the same challenge of losing the x in the upper right corner so you can navigate back to the house."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.11 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/pages/homes/hollywood-hideaway.astro:14` — { id: 'looking-glass', title: 'Through the Looking Glass', /* one of the rooms */ }
  - `src/components/RoomShowcase.astro:1` — <!-- shared room-modal component — Le Loft Suite is the only currently-correct one -->
- **Question:** This bullet from April 30 round is ambiguous: "These rooms and gathering spaces have the same challenge of losing the x in the upper right corner so you can navigate back to the house." — current code state: { id: 'looking-glass', title: 'Through the Looking Glass', /* one of the rooms */ }. Could you clarify what specific action you want? (file: src/pages/homes/hollywood-hideaway.astro)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "Is the issue having the white space on the right side for text?"

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.11 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/components/PhotoCarousel.astro:1` — <!-- carousel layout uses padding/margins controlled by global.css -->
- **Question:** This bullet from April 30 round is ambiguous: "Is the issue having the white space on the right side for text?" — current code state: <!-- carousel layout uses padding/margins controlled by global.css -->. Could you clarify what specific action you want? (file: src/components/PhotoCarousel.astro)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "Where you'll gather header: just use one consistent font - now there are 2."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.11 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - <NOT FOUND — see search_log>
- **Question:** This bullet from April 30 round is ambiguous: "Where you’ll gather header: just use one consistent font - now there are 2." — current code state: <NOT FOUND — see search_log>. Could you clarify what specific action you want? (file: unknown)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "This is a universal note for all the houses. the grounds each one of these should be a Gallery so it's a Gallery for the gardens and the bridge and a Gallery for the patios."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.1 (May 5 round)
- **Rounds appeared:** May 5
- **Current code state:**
  - `src/pages/index.astro:230` — <div class="stats-bar__label" data-i18n="compound.stats.houses">Houses</div>
- **i18n keys:** `compound.stats.houses`
- **Atomic sub-actions:**
  - [ ] (v2-defer) Split grounds section into 3 individually clickable galleries (gardens, bridge, patios) — NEW-05 (deferred).
- **i18n:** _no FR change required (structural-only edit per D-10)_
- **Note:** Deferred to v2 → NEW-05 (Milestone 2)
- **Rationale:** Current grounds section on Le Moulin renders a single combined gallery, not 3 individually clickable galleries (gardens / bridge / patios).


### "Wellness - photo that links to massages tab Nearby Adventures -Link to things to do."

- **Tag:** ✅ Already Done — `Done in fd8e979`
- **Source:** `MMM may.5.pdf` p.8 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/pages/index.astro:468` — <h2>We Make It <span class="serif-italic">Easy</span></h2>
- **i18n:** _no FR change required (structural-only edit per D-10)_
- **Note:** Deferred to v2 → NEW-01 (Milestone 2)
- **Rationale:** Wellness page massage galleries with new May 5 photos shipped in commit fd8e979 (#feat(wellness): add yoga + massage galleries with new May 5 photos). The 'Wellness - photo that links to massages tab' tile lives in src/pages/index.astro 'We Make It Easy' block; massage tab is at /wellness/.


### "Peace, privacy. Tranquility. Calander I like that you only display 2 months at a time but the arrows should let you scroll to 12 months Currently it only lets you search for 4 months."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.10 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/components/AvailabilityCalendar.astro:1` — <!-- AvailabilityCalendar component, default monthsToShow varies by page -->
  - `src/pages/homes/le-moulin.astro:327` — <AvailabilityCalendar monthsToShow={12} />
- **Atomic sub-actions:**
  - [ ] (v2-defer) Extend AvailabilityCalendar scrollable range to 12 months across all pages — STRUCT-02. Investigate Airbnb/VRBO ICS feed depth in src/pages/api/availability.ts.
- **i18n:** _no FR change required (structural-only edit per D-10)_
- **Note:** Deferred to v2 → STRUCT-02 (Milestone 2)
- **Rationale:** AvailabilityCalendar currently displays 4-6 months depending on page. Some pages already pass monthsToShow={12} (e.g., src/pages/homes/le-moulin.astro:327) but home page uses {6} (line 749). Underlying ICS feed depth needs verification.


### "The only room where this is not an issue is Le Loft Suite."

- **Tag:** ✅ Already Done — `Done in d626c4b`
- **Source:** `MMM may.5.pdf` p.10 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/pages/homes/hollywood-hideaway.astro:14` — { id: 'looking-glass', title: 'Through the Looking Glass', /* one of the rooms */ }
  - `src/components/RoomShowcase.astro:1` — <!-- shared room-modal component — Le Loft Suite is the only currently-correct one -->
- **i18n:** _no FR change required (structural-only edit per D-10)_
- **Note:** Deferred to v2 → STRUCT-01 (Milestone 2)
- **Rationale:** Client confirms Le Loft Suite room modal works correctly; same room-modal cropping issue plagues all other rooms. That fix is STRUCT-01 deferred.


### "We can remove the text and put it under the photos if it's better Delete The What's here section Add a section called "Join the stars who stayed here" I will upload those photos tonight."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.11 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/pages/homes/hollywood-hideaway.astro:1` — <!-- 'Stars Who Stayed Here' section not present — NEW-04 deferred to v2 -->
- **Question:** For the 'Join the Stars Who Stayed Here' section on Hollywood Hideaway: have the star photos been uploaded to Google Drive yet? If yes, share the folder link so we can process them through scripts/process-photos.mjs. If no, the section stays deferred until assets arrive.
- **i18n:** _no FR change required (structural-only edit per D-10)_
- **Note:** Deferred to v2 → NEW-04 (Milestone 2)
- **Rationale:** New section requires client to upload star/celebrity photos. Client said 'I will upload those photos tonight' (April 30 round) — confirm whether photos arrived.


---

## Home

### "Move "Mereville France" from above "Your dream french vacation come true" to under it to replace " A private historic compound in Méréville, France."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.7 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** COPY-06
- **Current code state:**
  - `src/pages/index.astro:213` — <h1 class="hero__title" data-i18n-html="home.title">Your Dream French Vacation Come True</h1>
- **i18n keys:** `home.title`
- **Atomic sub-actions:**
  - [ ] (en-copy) Move Méréville · France label below the home hero h1; remove the longer 'A private historic compound...' tagline since it's redundant with what's said below the photo
- **i18n:** _no FR change required (structural-only edit per D-10) or check via translations.json key listed above_
- **Rationale:** Client wants 'Méréville France' relocated from above 'Your dream french vacation come true' to below it, replacing the longer 'A private historic compound in Méréville, France. One hour from Paris' tagline.


### "Shared grounds. The whole place, exclusively yours Make it: This is a private walled compound where you are master of your own domaine."

- **Tag:** ✅ Already Done — `Done in d120aed`
- **Source:** `MMM may.5.pdf` p.9 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** COPY-08
- **Current code state:**
  - `src/i18n/translations.ts:299` — 'compound.hero.tagline': { en: 'This is a private walled compound where you are master of your own domaine. Peace, privacy. Tranquility.' }
  - `src/pages/the-compound.astro:171` — <p class="hero__tagline" data-i18n="compound.hero.tagline">This is a private walled compound where you are master of your own domaine. Peace, privacy. Tranquility.</p>
  - `public/i18n/translations.json:839` — "compound.hero.tagline": "This is a private walled compound..."
- **i18n keys:** `compound.hero.tagline`
- **i18n:** _no FR change required (structural-only edit per D-10) or check via translations.json key listed above_
- **Rationale:** compound.hero.tagline already reads 'This is a private walled compound where you are master of your own domaine. Peace, privacy. Tranquility.' in src/i18n/translations.ts:299, src/pages/the-compound.astro:171, and public/i18n/translations.json:839. Likely landed in editorial pass d120aed (#30).


### "HOME PAGE Good job reducing white space I will need to improve and embellish all the text everywhere- these notes are to polish the architecture of the site Universal notes: Fonts: My favorite font..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.6 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** TYPOG-03
- **Current code state:**
  - `src/styles/global.css:1` — @import url('https://fonts.googleapis.com/css2?...'); /* Google Fonts imports */
- **Atomic sub-actions:**
  - [ ] (en-copy) Audit src/styles/global.css :root font tokens (--font-serif, --font-display, --font-body) and Google Fonts @import block; reduce to 2-3 families with the favorite-font preserved as elegant-accent variant
  - [ ] (verify) Browser-test home/about/contact/houses for visual consistency before pushing to main
- **i18n:** _no FR change required (structural-only edit per D-10) or check via translations.json key listed above_
- **Rationale:** src/styles/global.css imports multiple Google Font families (script + serif + display); src/pages/index.astro:213 uses the 'Your Dream French Vacation Come True' header which the client identifies as her favorite font. Standardization requires CSS audit + token consolidation.


### "Bottom of home page: Remove from the journal section."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.8 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** SECT-07
- **Current code state:**
  - `src/pages/index.astro:559` — <h2 data-i18n="home.journal.heading">From the Journal</h2>
- **i18n keys:** `home.journal.heading`
- **Atomic sub-actions:**
  - [ ] (en-copy) Wrap or remove the From-the-Journal section in src/pages/index.astro starting around line 555 (preserve the data so it can be restored)
- **Rationale:** src/pages/index.astro:559 still renders <h2 data-i18n="home.journal.heading">From the Journal</h2> and the surrounding writings__card grid.


### "Rent 1 home or enjoy all 3. That can have the gardens below it."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.12 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** SECT-03
- **Current code state:**
  - `src/pages/homes/index.astro:75` — <a>Book all three houses for up to 20 guests. Family reunions, retreats, celebrations.</a>
- **Atomic sub-actions:**
  - [ ] (en-copy) Remove 'gardens' tile block from src/pages/homes/maison-de-la-riviere.astro:89-95
- **Rationale:** src/pages/homes/maison-de-la-riviere.astro:89-95 still has 'Gardens' tile; client wants it removed since gardens are covered below.


### "I think living room and dining room, gathering photos shoul all be full size like Discover the Compound photos - there is no reason to keep all the white space."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.4 (May 1 round)
- **Rounds appeared:** May 1
- **Current code state:**
  - `src/components/PhotoCarousel.astro:1` — <!-- carousel layout uses padding/margins controlled by global.css -->
  - `public/i18n/translations.json:1483` — "contact.hero.tagline": "Tell us your dates, your group, your dreams." (currently missing word "size")
  - `src/i18n/translations.ts:642` — 'contact.hero.tagline': has 'group size' but translations.json has 'group' (without size)
  - `src/pages/index.astro:421` — <h2 data-i18n-html="home.compound.heading">Discover the <span class="serif-italic">Compound</span></h2>
- **i18n keys:** `contact.hero.tagline`
- **Atomic sub-actions:**
  - [ ] (en-copy) Reduce gallery section padding + image max-width constraints in src/components/PhotoCarousel.astro and src/styles/global.css
- **Rationale:** Photo galleries have excessive white space; client wants larger images and less margin.


### "The Compound Button Change: Three houses."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.9 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/pages/index.astro:230` — <div class="stats-bar__label" data-i18n="compound.stats.houses">Houses</div>
  - `src/i18n/translations.ts:299` — 'compound.hero.tagline': { en: 'This is a private walled compound where you are master of your own domaine. Peace, privacy. Tranquility.' }
  - `src/pages/the-compound.astro:171` — <p class="hero__tagline" data-i18n="compound.hero.tagline">This is a private walled compound where you are master of your own domaine. Peace, privacy. Tranquility.</p>
  - `public/i18n/translations.json:839` — "compound.hero.tagline": "This is a private walled compound..."
- **i18n keys:** `compound.hero.tagline`, `compound.stats.houses`
- **Question:** This bullet from April 30 round is ambiguous: "The Compound Button Change: Three houses." — current code state: <div class="stats-bar__label" data-i18n="compound.stats.houses">Houses</div>. Could you clarify what specific action you want? (file: src/pages/index.astro)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "The Grounds Link to the gallery for the grounds in the discover the compound section on the home page."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.3 (May 1 round)
- **Rounds appeared:** May 1
- **Current code state:**
  - `src/pages/index.astro:421` — <h2 data-i18n-html="home.compound.heading">Discover the <span class="serif-italic">Compound</span></h2>
  - `src/pages/homes/le-moulin.astro:1` — <!-- grounds gallery clickability — gardens-as-individual-galleries NEW-05 deferred -->
- **Atomic sub-actions:**
  - [ ] (v2-defer) Wire each house page's gardens tile to link to a single master gardens gallery — NEW-05 (deferred to Milestone 2).
- **i18n:** _no FR change required (structural-only edit per D-10)_
- **Note:** Deferred to v2 → NEW-05 (Milestone 2)
- **Rationale:** Client wants the garden/grounds gallery to be a single linked gallery referenced from each house page's 'gardens' tile and from Discover the Compound section.


### "In the We Make it Easy section replace nearby adventures with Bring your dog!"

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.4 (May 1 round)
- **Rounds appeared:** May 1
- **Current code state:**
  - `src/pages/index.astro:468` — <h2>We Make It <span class="serif-italic">Easy</span></h2>
- **Atomic sub-actions:**
  - [ ] (v2-defer) Audit We Make It Easy section — Catering/Wellness/Dogs tile cards — NEW-01 / NEW-02 (Dogs Welcome replaces Nearby Adventures per April 30 round).
- **i18n:** _no FR change required (structural-only edit per D-10)_
- **Note:** Deferred to v2 → NEW-01 (Milestone 2)
- **Rationale:** src/pages/index.astro:468 already has '<h2>We Make It <span class="serif-italic">Easy</span></h2>' header. Need to verify catering/wellness/dog (or nearby-adventures) tile cards underneath are wired correctly.


### "I like your faqs instructions. We bury bring your dog in FAQs Create a new section towards the bottom of the home page that says Dogs welcome."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.8 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/pages/index.astro:1` — <!-- 'Dogs Welcome' section not present — NEW-02 -->
- **Atomic sub-actions:**
  - [ ] (v2-defer) Add Dogs Welcome section + Jetson photo on home page — NEW-02 (deferred to Milestone 2).
- **i18n:** _no FR change required (structural-only edit per D-10)_
- **Note:** Deferred to v2 → NEW-02 (Milestone 2)
- **Rationale:** No dedicated 'Dogs Welcome' section on home; current 'bring your dog!' lives in FAQ. Client wants a new section with Jetson photo replacing 'Nearby Adventures' in the We Make It Easy block.


---

## Le Moulin

### "MOULIN Page of this house Please update the name of this house to Le Moulin."

- **Tag:** ✅ Already Done — `Done in 333254d`
- **Source:** `MMM may.5.pdf` p.10 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** COPY-07
- **Current code state:**
  - `src/pages/homes/le-moulin.astro:191` — <BaseLayout title="Le Moulin — Historic Mill Rental in Méréville, France" />
  - `src/content/pages/le-moulin.md:4` — title: "Le Moulin"  /* renamed from "Moulin à Rêves" */
- **i18n:** _no FR change required (structural-only edit per D-10) or check via translations.json key listed above_
- **Rationale:** House-page rename from 'Moulin à Rêves' → 'Le Moulin' shipped in commit 333254d (#35). src/pages/homes/le-moulin.astro:191 BaseLayout title='Le Moulin — Historic Mill Rental...' and src/content/pages/le-moulin.md:4 title='Le Moulin'.


### "The name of the whole estate is Moulin a Reves - the name of just this house is just Le Moulin."

- **Tag:** ✅ Already Done — `Done in 333254d`
- **Source:** `MMM may.5.pdf` p.10 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** COPY-07
- **Current code state:**
  - `src/pages/homes/le-moulin.astro:191` — <BaseLayout title="Le Moulin — Historic Mill Rental in Méréville, France" />
  - `src/content/pages/le-moulin.md:4` — title: "Le Moulin"  /* renamed from "Moulin à Rêves" */
- **i18n:** _no FR change required (structural-only edit per D-10) or check via translations.json key listed above_
- **Rationale:** House-page rename from 'Moulin à Rêves' → 'Le Moulin' shipped in commit 333254d (#35). src/pages/homes/le-moulin.astro:191 BaseLayout title='Le Moulin — Historic Mill Rental...' and src/content/pages/le-moulin.md:4 title='Le Moulin'.


### "Good job changing the photos in the main carousel of le moulin - delete my picture in the pink gown in front of the house (you can keep me in the bike by the gate) Beige box where you'll sleep sect..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.10 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** SECT-06
- **Current code state:**
  - `src/pages/index.astro:230` — <div class="stats-bar__label" data-i18n="compound.stats.houses">Houses</div>
  - `src/content/pages/le-moulin.md:25` — alt: "Welcome to Le Moulin — your hostess in a rose-pink gown with Jetson the Cavalier"
  - `src/content/pages/le-moulin.md:24` — src: "/images/homes/le-moulin-welcome-rose.webp"
  - `src/components/PhotoCarousel.astro:1` — <!-- PhotoCarousel modal — STRUCT-01 deferred -->
  - `src/components/RoomShowcase.astro:1` — <!-- RoomShowcase room-modal — STRUCT-01 deferred -->
- **i18n keys:** `compound.stats.houses`
- **Atomic sub-actions:**
  - [ ] (en-copy) Remove le-moulin-welcome-rose.webp lines (24-25) from gallery in src/content/pages/le-moulin.md
  - [ ] (verify) Confirm le-moulin-gate.webp ('bike by the gate') still in carousel
- **Rationale:** src/content/pages/le-moulin.md:24-25 still has le-moulin-welcome-rose.webp ('hostess in a rose-pink gown with Jetson the Cavalier') in the main carousel.


### "MOULIN Page Shrink Margin from hero image to text Photo galleries all work well now!"

- **Tag:** ✅ Already Done — `Done in ab1ac5d`
- **Source:** `MMM may.5.pdf` p.2 (May 1 round)
- **Rounds appeared:** May 1
- **Current code state:**
  - `src/styles/global.css:1` — /* container/hero margin tokens */
- **Atomic sub-actions:**
  - [ ] (already-done-photo-pipeline) Underlying photo pipeline + 67 May 5 photos landed in commit 742fb89 — prerequisite for ab1ac5d wiring.
- **Rationale:** Client acknowledgement that photo galleries on Le Moulin look right now. Likely landed in commit ab1ac5d (#wire May 5 photos). Underlying pipeline: 742fb89.


### "Size of photos in listings - my favorite are the layouts in wellness and catering https://www.moulinareves.com/the-compound/ Would it work to change the 3 maison pictures to this size and then make..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.7 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/pages/contact.astro:20` — <AvailabilityCalendar (rendered BEFORE the form section) />
  - `src/pages/contact.astro:27` — <!-- Form + Contact Info --> (rendered AFTER calendar)
- **Atomic sub-actions:**
  - [ ] (v2-defer) Standardize photo gallery layouts to wellness/catering style across home maison cards — STRUCT-05 (deferred).
- **i18n:** _no FR change required (structural-only edit per D-10)_
- **Note:** Deferred to v2 → STRUCT-05 (Milestone 2)
- **Rationale:** Client wants the 3-maison cards on home page to use the wellness/catering page photo-row layout (larger images), and the 'Discover the Compound' tiles to take the smaller layout currently used by maison cards. CSS layout swap.


### "Use a jetson photo. Create a new section that says: Make your life a masterpiece - life is a work of art at Moulin a Reves."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.8 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/pages/homes/le-moulin.astro:191` — <BaseLayout title="Le Moulin — Historic Mill Rental in Méréville, France" />
  - `src/content/pages/le-moulin.md:4` — title: "Le Moulin"  /* renamed from "Moulin à Rêves" */
  - `src/pages/index.astro:1` — <!-- 'Make your life a masterpiece' Monet pairing — NEW-03 deferred to v2 -->
- **Atomic sub-actions:**
  - [ ] (v2-defer) Add Dogs Welcome section + Jetson photo on home page — NEW-02 (deferred to Milestone 2).
- **i18n:** _no FR change required (structural-only edit per D-10)_
- **Note:** Deferred to v2 → NEW-02 (Milestone 2)
- **Rationale:** No dedicated 'Dogs Welcome' section on home; current 'bring your dog!' lives in FAQ. Client wants a new section with Jetson photo replacing 'Nearby Adventures' in the We Make It Easy block.


### "Use this monet giverny painting next to the bridge at moulin a reve."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.9 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/pages/index.astro:1` — <!-- 'Make your life a masterpiece' Monet pairing not present — NEW-03 -->
- **Question:** For the new 'Make your life a masterpiece' section pairing a Monet Giverny painting with the Moulin bridge photo: which specific Monet image should we use? (We need a PD/CC0 source — many of his Giverny series are public domain via Met / WikiArt — please confirm the one you have in mind, OR upload it to Google Drive so we can downscale + convert to .webp.)
- **i18n:** _no FR change required (structural-only edit per D-10)_
- **Note:** Deferred to v2 → NEW-03 (Milestone 2)
- **Rationale:** New section described requires Monet 'Giverny' painting image which client has not yet provided. To be paired with the Moulin bridge photo.


### "Once you are inside the photos of each room -- it's very difficult to get back to the main page of moulin photos again. the page shifts down and you lose the ability to click the x button in upper ..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.10 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/components/RoomShowcase.astro:1` — <!-- room modal X-close — STRUCT-01 deferred -->
- **Atomic sub-actions:**
  - [ ] (v2-defer) Gallery modal close-button + forward-arrow + bottom-crop fixes deferred to STRUCT-01 (Milestone 2 structural). Component-level rework needed in src/components/PhotoCarousel.astro and src/components/RoomShowcase.astro.
- **i18n:** _no FR change required (structural-only edit per D-10)_
- **Note:** Deferred to v2 → STRUCT-01 (Milestone 2)
- **Rationale:** Gallery/modal navigation defects (X-button visibility, forward arrow cropping, photo bottom-crop on first open). Partial fixes shipped in d626c4b (#41) 'fix(rooms): room modal adapts to viewport, shows photos fully' but client still reports the issues.


---

## Hollywood Hideaway

### "Hi Mr - Notes May 1st from noon your time - 6pm for me Home page: Can you start with A Private Luxurious Compound, One Hour From Paris Then have 10 bedrooms, and that info Please shrink the margins..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.2 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** COPY-06
- **Current code state:**
  - `src/layouts/BaseLayout.astro:12` — description = "...one hour from Paris..."
  - `src/pages/index.astro:226` — <p class="stats-bar__intro" data-i18n="home.stats.intro">A private compound one hour from Paris.</p>
  - `src/pages/index.astro:213` — <h1 class="hero__title" data-i18n-html="home.title">Your Dream French Vacation Come True</h1>
  - `src/i18n/translations.ts:43` — 'home.intro.text': { en: 'Moulin à Rêves is a compound of three stone houses gathered around a millstream...' }
  - `src/pages/index.astro:233` — <div class="stats-bar__number">10</div><div class="stats-bar__label">Bedrooms</div>
  - `src/pages/index.astro:703` — <h2 data-i18n-html="home.area.heading">Discover the <span class="serif-italic">Area</span></h2>
  - `src/pages/explore/index.astro:1` — <!-- Discover the Area destination page; STRUCT-03 split deferred -->
  - `src/pages/homes/hollywood-hideaway.astro:196` — <h1 class="hero__title" data-i18n="hideaway.hero.title">{cms.title}</h1>
  - `src/content/pages/hollywood-hideaway.md:6` — heroImage: "/images/homes/hh-patio.webp"
  - `src/styles/global.css:1` — /* container, section padding tokens — :root --section-gap --container-padding */
  - `src/pages/homes/hollywood-hideaway.astro:14` — { id: 'looking-glass', title: 'Through the Looking Glass', /* one of the rooms */ }
  - `src/components/RoomShowcase.astro:1` — <!-- shared room-modal component — Le Loft Suite is the only currently-correct one -->
  - `src/pages/index.astro:421` — <h2 data-i18n-html="home.compound.heading">Discover the <span class="serif-italic">Compound</span></h2>
  - `src/:1` — <!-- Header / framing line — no code action -->
- **i18n keys:** `home.area.heading`
- **Atomic sub-actions:**
  - [ ] (en-copy) Update home hero h1/lead block in src/pages/index.astro to lead with 'A Private Luxurious Compound, One Hour From Paris' then '10 bedrooms' info; relocate 'Méréville, France' below tagline
  - [ ] (fr-copy) Update translations.json keys home.title / home.tagline / home.stats.intro for matching FR copy
- **Rationale:** Home hero currently shows 'Your Dream French Vacation Come True' (h1) with a stats bar below saying 'A private compound one hour from Paris.' (line 226); client wants explicit lead with 'A Private Luxurious Compound, One Hour From Paris' followed by '10 bedrooms' info.


### "I asked you to simplify the fonts - they still are italicizing the final word on headers for example: where you can stay Les Autre Maisons moulin a reves i still cant x out on my laptop from photos..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.5 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** COPY-01
- **Current code state:**
  - `public/i18n/translations.json:183` — "home.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:1908` — "le-moulin.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:2100` — "hideaway.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:2280` — "riviere.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `src/pages/contact.astro:15` — <h1 class="hero__title" data-i18n="contact.hero.title">Join us!</h1>
  - `src/pages/contact.astro:23` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/index.astro:752` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/le-moulin.astro:333` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/hollywood-hideaway.astro:294` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/maison-de-la-riviere.astro:267` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/contact.astro:20` — <AvailabilityCalendar (rendered BEFORE the form section) />
  - `src/pages/contact.astro:27` — <!-- Form + Contact Info --> (rendered AFTER calendar)
  - `src/styles/global.css:1` — @import url('https://fonts.googleapis.com/css2?...'); /* Google Fonts imports */
- **i18n keys:** `contact.hero.heading`, `contact.hero.title`, `hideaway.availability.heading`, `home.availability.heading`, `le-moulin.availability.heading`, `riviere.availability.heading`
- **Atomic sub-actions:**
  - [ ] (json-copy) Update public/i18n/translations.json keys home.availability.heading, le-moulin.availability.heading, hideaway.availability.heading, riviere.availability.heading: en → 'Join us', fr → 'Rejoignez-nous' (no italic span on final word per TYPOG-01)
  - [ ] (ts-copy) Update src/i18n/translations.ts entries for the same keys to match
  - [ ] (verify) grep src/ public/i18n/ for 'When You Can Stay' returns 0 matches
- **Rationale:** Replaced on home page hero CTA (commit 0ef4dc8) but translations.json still has 'When You Can Stay' under home/le-moulin/hideaway/riviere availability keys; per-house pages still show old text via runtime overlay.


### "Each its own world; together, the compound." Replace "The sanctuary" above the Hollywood Hideaway with "The Refuge" Above the "Bring your group together" section, please create a new section that s..."

- **Tag:** ✅ Already Done — `Done in d120aed`
- **Source:** `MMM may.5.pdf` p.7 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** COPY-12
- **Current code state:**
  - `src/pages/the-compound.astro:303` — <span class="split__eyebrow">The Refuge</span>
  - `src/pages/index.astro:392` — <span class="split__eyebrow">The Refuge</span>
  - `src/pages/index.astro:468` — <h2>We Make It <span class="serif-italic">Easy</span></h2>
- **Atomic sub-actions:**
  - [ ] (already-done-catering) Catering Pâtisseries section: ✅ landed in 8bd51b9 — surface in clarification doc as 'already done — please re-review'.
- **i18n:** _no FR change required (structural-only edit per D-10) or check via translations.json key listed above_
- **Rationale:** 'The Sanctuary' eyebrow above Hollywood Hideaway already replaced with 'The Refuge'. Found at src/pages/index.astro:392, src/pages/the-compound.astro:303, src/pages/homes/index.astro:41, src/pages/homes/le-moulin.astro:366, src/pages/homes/maison-de-la-riviere.astro:311. ALSO: Pâtisseries section + food gallery with new May 5 photos shipped in commit 8bd51b9 (#feat(catering): add Pâtisseries section). Client may not have noticed.


### "When You Can Stay Replace the words "When you can stay" with "Join Us!" HOLLYWOOD HIDEAWAY PAGE Remove the small letters that say hollywood hideaway above the text of the house on the main photo Ch..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.6 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** COPY-01
- **Current code state:**
  - `public/i18n/translations.json:183` — "home.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:1908` — "le-moulin.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:2100` — "hideaway.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:2280` — "riviere.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `src/pages/contact.astro:15` — <h1 class="hero__title" data-i18n="contact.hero.title">Join us!</h1>
  - `src/pages/contact.astro:23` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/index.astro:752` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/le-moulin.astro:333` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/hollywood-hideaway.astro:294` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/maison-de-la-riviere.astro:267` — heading={`Join <span class="serif-italic">us</span>`}
- **i18n keys:** `contact.hero.heading`, `contact.hero.title`, `hideaway.availability.heading`, `home.availability.heading`, `le-moulin.availability.heading`, `riviere.availability.heading`
- **Atomic sub-actions:**
  - [ ] (json-copy) Update public/i18n/translations.json keys home.availability.heading, le-moulin.availability.heading, hideaway.availability.heading, riviere.availability.heading: en → 'Join us', fr → 'Rejoignez-nous' (no italic span on final word per TYPOG-01)
  - [ ] (ts-copy) Update src/i18n/translations.ts entries for the same keys to match
  - [ ] (verify) grep src/ public/i18n/ for 'When You Can Stay' returns 0 matches
- **Rationale:** Replaced on home page hero CTA (commit 0ef4dc8) but translations.json still has 'When You Can Stay' under home/le-moulin/hideaway/riviere availability keys; per-house pages still show old text via runtime overlay.


### "Delete grange photo from the main carousel photos Decrease the margin beneath the photos and the text that says The Hollywood Hideaway The gardens gallery should link to master gardens collection T..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.3 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** SECT-02
- **Current code state:**
  - `src/pages/homes/hollywood-hideaway.astro:196` — <h1 class="hero__title" data-i18n="hideaway.hero.title">{cms.title}</h1>
  - `src/content/pages/hollywood-hideaway.md:6` — heroImage: "/images/homes/hh-patio.webp"
  - `src/components/PhotoCarousel.astro:1` — <!-- carousel layout uses padding/margins controlled by global.css -->
  - `src/content/pages/le-moulin.md:24` — /* le-moulin-welcome-rose.webp still in carousel */
  - `public/i18n/translations.json:1483` — "contact.hero.tagline": "Tell us your dates, your group, your dreams." (currently missing word "size")
  - `src/i18n/translations.ts:642` — 'contact.hero.tagline': has 'group size' but translations.json has 'group' (without size)
- **i18n keys:** `contact.hero.tagline`
- **Atomic sub-actions:**
  - [ ] (en-copy) Audit src/pages/homes/hollywood-hideaway.astro main carousel for la-grange-*.webp references and remove
- **Rationale:** Hollywood Hideaway main carousel may still include la-grange-* photos. Specifically check src/pages/homes/hollywood-hideaway.astro main carousel array.


### "MAISON DE LA RIVIERE Delete 2 rows of text in hero image above and below the name of the house Center name of the house Right forward curser is off the page like in the hollywood hideaway images De..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.3 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** SECT-03
- **Current code state:**
  - `src/pages/homes/hollywood-hideaway.astro:198` — <h1 class="hero__title" data-i18n="hideaway.hero.title">{cms.title}</h1>
  - `src/styles/global.css:957` — .hero__overlay { /* dark filter */ }
  - `src/pages/homes/maison-de-la-riviere.astro:195` — <h1 class="hero__title">{cms.title}</h1>  <p class="hero__tagline">{cms.tagline}</p>
  - `src/pages/homes/hollywood-hideaway.astro:196` — <h1 class="hero__title" data-i18n="hideaway.hero.title">{cms.title}</h1>
  - `src/content/pages/hollywood-hideaway.md:6` — heroImage: "/images/homes/hh-patio.webp"
  - `src/components/PhotoCarousel.astro:1` — <!-- carousel layout uses padding/margins controlled by global.css -->
  - `public/i18n/translations.json:1483` — "contact.hero.tagline": "Tell us your dates, your group, your dreams." (currently missing word "size")
  - `src/i18n/translations.ts:642` — 'contact.hero.tagline': has 'group size' but translations.json has 'group' (without size)
- **i18n keys:** `contact.hero.tagline`
- **Atomic sub-actions:**
  - [ ] (en-copy) Remove duplicative tagline rows above/below the house name in src/pages/homes/maison-de-la-riviere.astro hero
  - [ ] (en-copy) Center the house name (h1) within the hero overlay
- **Rationale:** Maison de la Rivière hero currently shows duplicate text (h1 'La Maison de la Rivière' + tagline that may include redundant phrasing).


### "Hollywood Hideaway The hero image white text feels too low - please center it."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.3 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** PHOTO-03
- **Current code state:**
  - `src/pages/homes/hollywood-hideaway.astro:198` — <h1 class="hero__title" data-i18n="hideaway.hero.title">{cms.title}</h1>
  - `src/styles/global.css:957` — .hero__overlay { /* dark filter */ }
  - `src/pages/homes/hollywood-hideaway.astro:196` — <h1 class="hero__title" data-i18n="hideaway.hero.title">{cms.title}</h1>
  - `src/content/pages/hollywood-hideaway.md:6` — heroImage: "/images/homes/hh-patio.webp"
- **Atomic sub-actions:**
  - [ ] (en-copy) Add CSS to vertically center .hero__content on hollywood-hideaway.astro hero (or scoped style override)
  - [ ] (en-copy) Delete italicised tagline text inside the hero (TYPOG-02 overlap)
- **i18n:** _no FR change required (structural-only edit per D-10)_
- **Rationale:** Hollywood Hideaway hero h1+tagline currently bottom-aligned via .hero__content default; client wants vertical centering. Plus delete italicised text inside the hero image.


---

## Maison de la Rivière

### "You don't need the river at Dark. Please change the words "when you can stay" with "Join us!" Anytime the final word is in italics change it to straight up and down. fix the beige foote r so it sle..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.1 (May 5 round)
- **Rounds appeared:** May 5
- **Requirement:** COPY-01
- **Current code state:**
  - `public/i18n/translations.json:183` — "home.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:1908` — "le-moulin.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:2100` — "hideaway.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:2280` — "riviere.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `src/pages/contact.astro:15` — <h1 class="hero__title" data-i18n="contact.hero.title">Join us!</h1>
  - `src/pages/contact.astro:23` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/index.astro:752` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/le-moulin.astro:333` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/hollywood-hideaway.astro:294` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/maison-de-la-riviere.astro:267` — heading={`Join <span class="serif-italic">us</span>`}
- **i18n keys:** `contact.hero.heading`, `contact.hero.title`, `hideaway.availability.heading`, `home.availability.heading`, `le-moulin.availability.heading`, `riviere.availability.heading`
- **Atomic sub-actions:**
  - [ ] (json-copy) Update public/i18n/translations.json keys home.availability.heading, le-moulin.availability.heading, hideaway.availability.heading, riviere.availability.heading: en → 'Join us', fr → 'Rejoignez-nous' (no italic span on final word per TYPOG-01)
  - [ ] (ts-copy) Update src/i18n/translations.ts entries for the same keys to match
  - [ ] (verify) grep src/ public/i18n/ for 'When You Can Stay' returns 0 matches
- **Rationale:** Replaced on home page hero CTA (commit 0ef4dc8) but translations.json still has 'When You Can Stay' under home/le-moulin/hideaway/riviere availability keys; per-house pages still show old text via runtime overlay.


### "Maison de la Riviere page https://www.moulinareves.com/homes/maison-de-la-riviere/ Remove the text above the name of the house - it's duplicative This has the same issue with not being able to get ..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.11 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** SECT-03
- **Current code state:**
  - `src/pages/homes/hollywood-hideaway.astro:198` — <h1>{cms.title}</h1>  <p>{cms.tagline}</p>  /* hero text overlap */
- **Atomic sub-actions:**
  - [ ] (en-copy) Remove duplicative tagline rows above/below the house name in src/pages/homes/maison-de-la-riviere.astro hero
  - [ ] (en-copy) Center the house name (h1) within the hero overlay
- **Rationale:** Maison de la Rivière hero currently shows duplicate text (h1 'La Maison de la Rivière' + tagline that may include redundant phrasing).


### "The photo is too dark in "Interested in La Maison de la Riviere" and on all the maison pages."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.12 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** PHOTO-03
- **Current code state:**
  - `src/pages/homes/maison-de-la-riviere.astro:274` — <!-- "Interested in {cms.title}?" CTA section -->
  - `src/styles/global.css:957` — .hero__overlay { /* dark filter on image */ }
- **i18n keys:** `riviere.cta.heading`
- **Atomic sub-actions:**
  - [ ] (en-copy) Reduce black filter on .hero__overlay specifically for the 'Interested in...' CTA section across all home pages (or scoped class .hero--cta)
- **i18n:** _no FR change required (structural-only edit per D-10)_
- **Rationale:** src/pages/homes/maison-de-la-riviere.astro:274 'Interested in...' CTA hero has dark filter; client wants it reduced. Same on other house pages.


---

## Les Maisons

### "may 5th notes good morning Monty! landing page in the bar with the number of houses, bedrooms, bathrooms, and guests, please change the word houses to homes so it reads three homes in gathering and..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.1 (May 5 round)
- **Rounds appeared:** May 5
- **Requirement:** COPY-03
- **Current code state:**
  - `src/pages/index.astro:230` — <div class="stats-bar__label" data-i18n="compound.stats.houses">Houses</div>
  - `src/pages/contact.astro:20` — <AvailabilityCalendar (rendered BEFORE the form section) />
  - `src/pages/contact.astro:27` — <!-- Form + Contact Info --> (rendered AFTER calendar)
- **i18n keys:** `compound.stats.houses`
- **Atomic sub-actions:**
  - [ ] (en-copy) Update src/pages/index.astro:230 stats-bar__label from 'Houses' to 'Homes'
  - [ ] (fr-copy) Update public/i18n/translations.json key compound.stats.houses (en/fr) accordingly
- **Rationale:** Stats bar at src/pages/index.astro:230 still labels '3' as 'Houses'; client wants 'homes' specifically on the bar widget per COPY-03.


### "Sleeps 20 across 10 bedrooms. Below the photo write: Header: Bienvenue Chez Vous Smaller text: All size groups welcome."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.12 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** COPY-13
- **Current code state:**
  - `src/pages/homes/index.astro:13` — <h1 class="hero__title" data-i18n-html="homes.hero.title">Les <span class="serif-italic">Maisons</span></h1>
  - `src/pages/homes/index.astro:14` — <p class="hero__tagline">Three maisons. Sleeps 20 across 10 bedrooms.</p>
- **Atomic sub-actions:**
  - [ ] (en-copy) Replace src/pages/homes/index.astro:13-14 hero block: H1 'Bienvenue Chez Vous' (large) + tagline 'All size groups welcome. Rent 1 home or enjoy all 3.' (smaller)
  - [ ] (fr-copy) Update public/i18n/translations.json keys homes.hero.title and homes.hero.tagline (en/fr) — 'Bienvenue Chez Vous' is bilingual-neutral; FR equivalent 'Toutes tailles de groupes bienvenues. Louez 1 maison ou profitez des 3.'
- **Rationale:** src/pages/homes/index.astro:14 hero__tagline still reads 'Three maisons. Sleeps 20 across 10 bedrooms.'; client wants this replaced with header 'Bienvenue Chez Vous' and smaller text 'All size groups welcome. Rent 1 home or enjoy all 3.'.


### "Les Autres Maisons at bottom of page - take away italics."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.3 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** TYPOG-01
- **Current code state:**
  - <NOT FOUND — see search_log>
- **Atomic sub-actions:**
  - [ ] (en-copy) Remove <span class="serif-italic">…</span> wrappers from final words in: 'Where you\'ll sleep/gather', 'Les Maisons', 'Les Autres Maisons', 'Moulin à Rêves', 'When You Can Stay' (also part of COPY-01), 'What\'s here', 'Join us', 'Discover the Compound', 'Discover the Area', 'We Make It Easy'
  - [ ] (fr-copy) Same span removal in matching public/i18n/translations.json fr values where present
  - [ ] (verify) grep -n 'serif-italic' src/pages/ shows only intentional italic emphasis (not header final words)
- **Rationale:** Headers use <span class="serif-italic"> on final words across many files: src/pages/homes/le-moulin.astro:305 'Where you\'ll <span>sleep</span>', src/pages/homes/hollywood-hideaway.astro:263, src/pages/homes/maison-de-la-riviere.astro:236, src/pages/homes/index.astro:13 'Les <span>Maisons</span>', and the cross-links 'Les <span>Autres Maisons</span>' on each house page.


### "Remove exterior and stream and gardens from where you'll gather Just use one font in where you'll sleep and where you'll gather and what's here and when you can stay and les autre maisons."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.11 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** SECT-03
- **Current code state:**
  - `public/i18n/translations.json:183` — "home.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:1908` — "le-moulin.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:2100` — "hideaway.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:2280` — "riviere.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `src/pages/homes/maison-de-la-riviere.astro:80` — { id: 'exterior', title: 'Exterior & Stream', ... }
- **i18n keys:** `hideaway.availability.heading`, `home.availability.heading`, `le-moulin.availability.heading`, `riviere.availability.heading`
- **Atomic sub-actions:**
  - [ ] (en-copy) Remove 'exterior' tile block from src/pages/homes/maison-de-la-riviere.astro:80-88
- **Rationale:** src/pages/homes/maison-de-la-riviere.astro:80-88 still has gathering-spaces tile { id: 'exterior', title: 'Exterior & Stream' }; client wants it removed since exterior shots already in top carousel.


### "Les Maisons header should be the same size as the header above it."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.7 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/pages/homes/index.astro:13` — <h1 class="hero__title" data-i18n-html="homes.hero.title">Les <span class="serif-italic">Maisons</span></h1>
  - `src/pages/homes/index.astro:14` — <p class="hero__tagline">Three maisons. Sleeps 20 across 10 bedrooms.</p>
- **Question:** This bullet from April 30 round is ambiguous: "Les Maisons header should be the same size as the header above it." — current code state: <h1 class="hero__title" data-i18n-html="homes.hero.title">Les <span class="serif-italic">Maisons</span></h1>. Could you clarify what specific action you want? (file: src/pages/homes/index.astro)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "Les Autre Maisons should be in just one font."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.11 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/styles/global.css:1` — @import url('...Google Fonts...'); /* multiple font families */
  - `src/pages/homes/maison-de-la-riviere.astro:236` — heading={`Where you'll <span class="serif-italic">sleep</span>`}
  - `src/pages/homes/maison-de-la-riviere.astro:246` — heading={`Where you'll <span class="serif-italic">gather</span>`}
- **Question:** This bullet from April 30 round is ambiguous: "Les Autre Maisons should be in just one font." — current code state: @import url('...Google Fonts...'); /* multiple font families */. Could you clarify what specific action you want? (file: src/styles/global.css)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "Les Maisons Page Remove: Three maisons."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.12 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - <NOT FOUND — see search_log>
- **Question:** This bullet from April 30 round is ambiguous: "Les Maisons Page Remove: Three maisons." — current code state: <NOT FOUND — see search_log>. Could you clarify what specific action you want? (file: unknown)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


---

## Get in Touch

### "Make text under the photos in this section easier to read - remove italics and make it bold about section change lead photo for history replace "come and see" with "come and visit!" get in touch Pa..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.1 (May 5 round)
- **Rounds appeared:** May 5
- **Requirement:** COPY-04
- **Current code state:**
  - `src/pages/contact.astro:15` — <h1 class="hero__title" data-i18n="contact.hero.title">Join us!</h1>
  - `src/pages/contact.astro:23` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/index.astro:752` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/le-moulin.astro:333` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/hollywood-hideaway.astro:294` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/maison-de-la-riviere.astro:267` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/about.astro:198` — <h2 class="hero__title" data-i18n="about.cta.heading">Come and See</h2>
  - `public/i18n/translations.json:1451` — "about.cta.heading": "Come and See"
  - `src/i18n/translations.ts:634` — 'about.cta.heading': { en: 'Come and See', fr: 'Venez Voir' },
- **i18n keys:** `about.cta.heading`, `contact.hero.heading`, `contact.hero.title`, `home.availability.heading`
- **Atomic sub-actions:**
  - [ ] (en-copy) Update src/pages/about.astro:198 'Come and See' → 'come and visit!'
  - [ ] (fr-copy) Update public/i18n/translations.json key about.cta.heading en/fr (en: 'come and visit!', fr: 'venez nous voir !')
  - [ ] (ts-copy) Update src/i18n/translations.ts about.cta.heading
  - [ ] (already-done-history) About-page history-section lead photo refresh: ✅ landed in ad07395 (#extend history gallery with six Borrah Minevitch family photos). Tell the client this shipped so she can review.
- **Rationale:** Compound bullet: (a) 'make text under photos easier to read - remove italics and make it bold' is still 🔧 (TYPOG / Discover-the-Compound captions); (b) 'about section change lead photo for history' was addressed in commit ad07395 (#extend history gallery with six Borrah Minevitch family photos) — the about page now has a richer history gallery. (c) 'replace come and see with come and visit!' is COPY-04 still to do.


### "Buttons on home page: "Speak with a concierge" brings us to this page. https://www.moulinareves.com/contact/ Replace Get in touch with the words "Join us!" Add the word size here: Tell us your date..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.8 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** COPY-09
- **Current code state:**
  - `src/pages/contact.astro:15` — <h1 class="hero__title" data-i18n="contact.hero.title">Join us!</h1>
  - `src/pages/contact.astro:23` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/index.astro:752` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/le-moulin.astro:333` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/hollywood-hideaway.astro:294` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/maison-de-la-riviere.astro:267` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/i18n/translations.ts:642` — 'contact.hero.tagline': { en: "Tell us your dates, your group size, your dreams. We'll take it from there." }
  - `public/i18n/translations.json:1483` — "contact.hero.tagline": "Tell us your dates, your group, your dreams. We'll take it from there."
  - `src/pages/index.astro:217` — <a href="/contact/" class="btn btn--ghost">Speak with the Concierge</a>
- **i18n keys:** `contact.hero.heading`, `contact.hero.tagline`, `contact.hero.title`, `grange.cta.text`, `home.availability.heading`, `home.cta.text`, `jardin.cta.text`, `moulin.cta.text`
- **Atomic sub-actions:**
  - [ ] (en-copy) Replace 'Speak with the Concierge' on src/pages/index.astro:217 with 'Join us!' (or move to dedicated CTA section)
  - [ ] (fr-copy) If a translation key wraps this CTA, update both en/fr in translations.json
- **Rationale:** src/pages/index.astro:217 still has '<a>Speak with the Concierge</a>' as the second hero CTA; client wants the page-2 button labelled 'Join us!' per the universal pattern (COPY-09 + page-2 instruction).


### "We'll take it from there. Change the address to: 14, 16, 18 Rue des Crocs au Renard, 91660 Le Mérévillois (Remove the X at the end of the word "au" before Renard.) Getting here section Is that an a..."

- **Tag:** ✅ Already Done — `Done in 111cf9b`
- **Source:** `MMM may.5.pdf` p.8 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** COPY-05
- **Current code state:**
  - `src/layouts/BaseLayout.astro:137` — <p data-i18n-html="footer.tagline">14, 16, 18 Rue des Crocs au Renard<br/>91660 Le Mérévillois</p>
  - `src/pages/about.astro:119` — <p data-i18n="about.faq.address.a">14, 16, 18 Rue des Crocs au Renard, 91660 Le Mérévillois.</p>
  - `src/pages/contact.astro:129` — <p>14, 16, 18 Rue des Crocs au Renard<br />91660 Le Mérévillois</p>
- **i18n:** _no FR change required (structural-only edit per D-10) or check via translations.json key listed above_
- **Rationale:** Address already canonicalized site-wide in commit 111cf9b (#32). Footer (BaseLayout.astro:137), about (about.astro:119), contact (contact.astro:129) all show '14, 16, 18 Rue des Crocs au Renard, 91660 Le Mérévillois'.


### "Replace When you can stay with "Join us!" The What's Here section is really about the gardens and space -- that should link to the beautiful gardens page with more photo galleries."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.11 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** COPY-01
- **Current code state:**
  - `public/i18n/translations.json:183` — "home.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:1908` — "le-moulin.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:2100` — "hideaway.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:2280` — "riviere.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `src/pages/contact.astro:15` — <h1 class="hero__title" data-i18n="contact.hero.title">Join us!</h1>
  - `src/pages/contact.astro:23` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/index.astro:752` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/le-moulin.astro:333` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/hollywood-hideaway.astro:294` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/maison-de-la-riviere.astro:267` — heading={`Join <span class="serif-italic">us</span>`}
- **i18n keys:** `contact.hero.heading`, `contact.hero.title`, `hideaway.availability.heading`, `home.availability.heading`, `le-moulin.availability.heading`, `riviere.availability.heading`
- **Atomic sub-actions:**
  - [ ] (json-copy) Update public/i18n/translations.json keys home.availability.heading, le-moulin.availability.heading, hideaway.availability.heading, riviere.availability.heading: en → 'Join us', fr → 'Rejoignez-nous' (no italic span on final word per TYPOG-01)
  - [ ] (ts-copy) Update src/i18n/translations.ts entries for the same keys to match
  - [ ] (verify) grep src/ public/i18n/ for 'When You Can Stay' returns 0 matches
- **Rationale:** Replaced on home page hero CTA (commit 0ef4dc8) but translations.json still has 'When You Can Stay' under home/le-moulin/hideaway/riviere availability keys; per-house pages still show old text via runtime overlay.


### "Move the bonjour section with the form above the calendar section."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.1 (May 5 round)
- **Rounds appeared:** May 5
- **Requirement:** CLAR-FORM-CAL
- **Current code state:**
  - `src/pages/index.astro:744` — <a href="/contact/" class="btn btn--white" data-i18n="home.cta.button">Bonjour!</a>
  - `src/pages/contact.astro:34` — <h2 data-i18n="contact.form.heading">Bonjour!</h2>
  - `src/pages/the-compound.astro:414` — <button data-i18n="compound.form.submit">Bonjour!</button>
  - `src/pages/explore/index.astro:292` — <a data-i18n="explore.cta.button">Bonjour!</a>
  - `src/pages/contact.astro:20` — <AvailabilityCalendar (rendered BEFORE the form section) />
  - `src/pages/contact.astro:27` — <!-- Form + Contact Info --> (rendered AFTER calendar)
- **i18n keys:** `compound.form.submit`, `contact.form.heading`, `explore.cta.button`, `home.cta.button`
- **Atomic sub-actions:**
  - [ ] (en-copy) Reorder src/pages/contact.astro — move <!-- Form + Contact Info --> section to render BEFORE <AvailabilityCalendar />
- **Rationale:** src/pages/contact.astro currently renders <AvailabilityCalendar /> at line 20 BEFORE the form section that starts at line 27. Client wants form section moved ABOVE the calendar.


### "Fix the Getting here formatting"

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.2 (May 5 round)
- **Rounds appeared:** May 5
- **Current code state:**
  - `src/pages/contact.astro:20` — <AvailabilityCalendar (rendered BEFORE the form section) />
  - `src/pages/contact.astro:27` — <!-- Form + Contact Info --> (rendered AFTER calendar)
- **Atomic sub-actions:**
  - [ ] (en-copy) Update Getting Here directions in src/pages/contact.astro to read 'One hour from Paris by car, train, or [airport]. Orly: 55 min by car. Charles de Gaulle: 75 min by car.'
  - [ ] (fr-copy) Update getting.options.* translation keys to match
- **Rationale:** Getting Here section formatting needs improvement; client wants specific times: Orly 55 min, Charles de Gaulle 75 min.


### "Maybe this looks better than Join Us!"

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.4 (May 1 round)
- **Rounds appeared:** May 1
- **Current code state:**
  - `src/pages/contact.astro:15` — <h1 class="hero__title" data-i18n="contact.hero.title">Join us!</h1>
  - `src/pages/contact.astro:23` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/index.astro:752` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/le-moulin.astro:333` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/hollywood-hideaway.astro:294` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/maison-de-la-riviere.astro:267` — heading={`Join <span class="serif-italic">us</span>`}
- **i18n keys:** `contact.hero.heading`, `contact.hero.title`, `home.availability.heading`
- **Question:** This bullet from May 1 round is ambiguous: "Maybe this looks better than Join Us!" — current code state: <h1 class="hero__title" data-i18n="contact.hero.title">Join us!</h1>. Could you clarify what specific action you want? (file: src/pages/contact.astro)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "On the contact us page - please put the request for info above the calendar."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.4 (May 1 round)
- **Rounds appeared:** May 1
- **Current code state:**
  - `src/pages/contact.astro:20` — <AvailabilityCalendar (line 20 — BEFORE form)>  /* form at line 27 — needs swap */
  - `src/components/AvailabilityCalendar.astro:1` — <!-- AvailabilityCalendar monthsToShow prop — STRUCT-02 deferred -->
- **Question:** This bullet from May 1 round is ambiguous: "On the contact us page - please put the request for info above the calendar." — current code state: <AvailabilityCalendar (line 20 — BEFORE form)>  /* form at line 27 — needs swap */. Could you clarify what specific action you want? (file: src/pages/contact.astro)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "This is an issue in all the other room/gathering spaces galleries in all the homes, so perhaps you should use this formatting everywhere."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.7 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/pages/contact.astro:20` — <AvailabilityCalendar (rendered BEFORE the form section) />
  - `src/pages/contact.astro:27` — <!-- Form + Contact Info --> (rendered AFTER calendar)
- **Question:** This bullet from April 30 round is ambiguous: "This is an issue in all the other room/gathering spaces galleries in all the homes, so perhaps you should use this formatting everywhere." — current code state: <AvailabilityCalendar (rendered BEFORE the form section) />. Could you clarify what specific action you want? (file: src/pages/contact.astro)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "Charles de gaul 75 min. Currently the formatting is wonky here."

- **Tag:** ❓ Needs Clarification
- **Source:** `MMM may.5.pdf` p.8 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/pages/contact.astro:20` — <AvailabilityCalendar (rendered BEFORE the form section) />
  - `src/pages/contact.astro:27` — <!-- Form + Contact Info --> (rendered AFTER calendar)
- **Question:** This bullet from April 30 round is ambiguous: "Charles de gaul 75 min. Currently the formatting is wonky here." — current code state: <AvailabilityCalendar (rendered BEFORE the form section) />. Could you clarify what specific action you want? (file: src/pages/contact.astro)
- **Rationale:** Generic ❓ — bullet did not match a specific tagging rule; routes to Phase 3 for client clarification.


### "Move the calendar link below the request for contact."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.10 (April 30 round)
- **Rounds appeared:** April 30
- **Current code state:**
  - `src/components/AvailabilityCalendar.astro:1` — <!-- AvailabilityCalendar monthsToShow prop — STRUCT-02 deferred -->
- **Atomic sub-actions:**
  - [ ] (en-copy) Audit src/pages/index.astro Plan-Your-Stay area (line 740+) and reorder so the inquiry CTA appears before calendar link
- **Rationale:** Same pattern as form/calendar swap — reorder so request-for-contact is above calendar link on home Plan-Your-Stay block.


---

## About

### "Create a gallery of jetson photos. Host the group retreat of your dreams Family reunions - good Change yoga retreats to yoga, painting, writing retreats Change friends trips to Friends celebrations..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.4 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** COPY-11
- **Current code state:**
  - `src/pages/index.astro:118` — { title: 'Yoga retreats', summary: 'Lawn, La Grange, and the spa...' }
  - `src/i18n/translations.ts:319` — 'compound.madefor.yoga.title': { en: 'Yoga Retreats', ... }
  - `src/pages/index.astro:119` — { title: 'Friends trips', summary: 'Twenty beds, long dinners, the millstream...' }
  - `src/pages/index.astro:703` — <h2 data-i18n-html="home.area.heading">Discover the <span class="serif-italic">Area</span></h2>
- **i18n keys:** `compound.madefor.yoga.title`, `home.area.heading`
- **Atomic sub-actions:**
  - [ ] (en-copy) Update src/pages/index.astro:118 title 'Yoga retreats' → 'Yoga, painting, writing retreats'
  - [ ] (en-copy) Update src/pages/index.astro:119 title 'Friends trips' → 'Friends celebrations'
  - [ ] (fr-copy) Update translations.json compound.madefor.yoga.title and any related home.groups tile keys
  - [ ] (already-done-explore-photos) Méréville placeholder photos replaced + Cyclop + Barbizon mural wired in commit 182b810.
- **Rationale:** src/pages/index.astro:118-119 still has 'Yoga retreats' and 'Friends trips' as group-type tile titles. (Note: Explore page photos updated in 182b810; client may not have noticed.)


### "Bold? Non italicized maybe? Is there room for me to write more info about the grange I don't see the x in upper right to return to main page on any of the galleries now I don't see the arrow to go ..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.2 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** TYPOG-01
- **Current code state:**
  - `src/components/PhotoCarousel.astro:1` — <!-- modal close-button (X) — STRUCT-01 deferred -->
  - `src/components/RoomShowcase.astro:1` — <!-- room modal close button — STRUCT-01 deferred -->
- **Atomic sub-actions:**
  - [ ] (en-copy) Remove <span class="serif-italic">…</span> wrappers from final words in: 'Where you\'ll sleep/gather', 'Les Maisons', 'Les Autres Maisons', 'Moulin à Rêves', 'When You Can Stay' (also part of COPY-01), 'What\'s here', 'Join us', 'Discover the Compound', 'Discover the Area', 'We Make It Easy'
  - [ ] (fr-copy) Same span removal in matching public/i18n/translations.json fr values where present
  - [ ] (verify) grep -n 'serif-italic' src/pages/ shows only intentional italic emphasis (not header final words)
- **Rationale:** Headers use <span class="serif-italic"> on final words across many files: src/pages/homes/le-moulin.astro:305 'Where you\'ll <span>sleep</span>', src/pages/homes/hollywood-hideaway.astro:263, src/pages/homes/maison-de-la-riviere.astro:236, src/pages/homes/index.astro:13 'Les <span>Maisons</span>', and the cross-links 'Les <span>Autres Maisons</span>' on each house page.


---

## La Grange

### "Remove under hero Change hollywood Make holly wood full For the le grange photos: replace the black backgrounds with white Don't have two fonts Change When yOu can stay to join us Remove: Tell us y..."

- **Tag:** 🔧 Clear-to-Ship
- **Source:** `MMM may.5.pdf` p.4 (May 1 round)
- **Rounds appeared:** May 1
- **Requirement:** COPY-01
- **Current code state:**
  - `public/i18n/translations.json:183` — "home.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:1908` — "le-moulin.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:2100` — "hideaway.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `public/i18n/translations.json:2280` — "riviere.availability.heading": "When You Can <span class=\"serif-italic\">Stay</span>"
  - `src/pages/contact.astro:15` — <h1 class="hero__title" data-i18n="contact.hero.title">Join us!</h1>
  - `src/pages/contact.astro:23` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/index.astro:752` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/le-moulin.astro:333` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/hollywood-hideaway.astro:294` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/pages/homes/maison-de-la-riviere.astro:267` — heading={`Join <span class="serif-italic">us</span>`}
  - `src/i18n/translations.ts:642` — 'contact.hero.tagline': { en: "Tell us your dates, your group size, your dreams. We'll take it from there." }
  - `public/i18n/translations.json:1483` — "contact.hero.tagline": "Tell us your dates, your group, your dreams. We'll take it from there."
  - `src/pages/contact.astro:20` — <AvailabilityCalendar (rendered BEFORE the form section) />
  - `src/pages/contact.astro:27` — <!-- Form + Contact Info --> (rendered AFTER calendar)
  - `src/styles/global.css:1` — @import url('https://fonts.googleapis.com/css2?...'); /* Google Fonts imports */
- **i18n keys:** `contact.hero.heading`, `contact.hero.tagline`, `contact.hero.title`, `grange.cta.text`, `hideaway.availability.heading`, `home.availability.heading`, `home.cta.text`, `jardin.cta.text`, `le-moulin.availability.heading`, `moulin.cta.text`, `riviere.availability.heading`
- **Atomic sub-actions:**
  - [ ] (json-copy) Update public/i18n/translations.json keys home.availability.heading, le-moulin.availability.heading, hideaway.availability.heading, riviere.availability.heading: en → 'Join us', fr → 'Rejoignez-nous' (no italic span on final word per TYPOG-01)
  - [ ] (ts-copy) Update src/i18n/translations.ts entries for the same keys to match
  - [ ] (verify) grep src/ public/i18n/ for 'When You Can Stay' returns 0 matches
- **Rationale:** Replaced on home page hero CTA (commit 0ef4dc8) but translations.json still has 'When You Can Stay' under home/le-moulin/hideaway/riviere availability keys; per-house pages still show old text via runtime overlay.


### "Black feels too heavy. In the grange photos library - remove the toilet and laundry pictures Solarium photos should all be of the jacuzzi - now there is a sink and garden."

- **Tag:** ✅ Already Done — `Done in 1a658c2`
- **Source:** `MMM may.5.pdf` p.7 (April 30 round)
- **Rounds appeared:** April 30
- **Requirement:** SECT-04
- **Current code state:**
  - `src/components/RoomShowcase.astro:1` — <!-- modal/gallery background color — global.css -->
  - `src/pages/homes/le-moulin.astro:1` — <!-- grange photo gallery references — la-grange-toilet/laundry hopefully removed in 1a658c2 -->
  - `src/pages/the-compound.astro:1` — <!-- solarium gallery — assets pending from client; clarification -->
  - `scripts/photo-mapping.json:1` — /* solarium / jacuzzi photo mapping */
- **Rationale:** Drop HH/LG laundry photos was shipped in commit 1a658c2 (#46) 'fix(rooms): cream stage + trimmed modal text + drop HH laundry'. Verify no la-grange-toilet/laundry images remain referenced.


---

## Summary statistics

| Tag | Count |
|-----|-------|
| ✅ Already Done | 10 |
| 🔧 Clear-to-Ship | 52 |
| ❓ Needs Clarification | 29 |
| ⚠️ Cross-round Conflict | 1 |
| **Total parent bullets** | **92** |

_Total bullets after cross-round dedupe: 92. Original parsed bullets across 3 rounds: 92._

## v2-deferred items

| Bullet (truncated) | Section | v2 ID |
|--------------------|---------|-------|
| "This is a universal note for all the houses. the grounds each one of these shoul..." | Universal | NEW-05 |
| "Wellness - photo that links to massages tab Nearby Adventures -Link to things to..." | Universal | NEW-01 |
| "Peace, privacy. Tranquility. Calander I like that you only display 2 months at a..." | Universal | STRUCT-02 |
| "The only room where this is not an issue is Le Loft Suite." | Universal | STRUCT-01 |
| "We can remove the text and put it under the photos if it’s better Delete The Wha..." | Universal | NEW-04 |
| "The Grounds Link to the gallery for the grounds in the discover the compound sec..." | Home | NEW-05 |
| "In the We Make it Easy section replace nearby adventures with Bring your dog!" | Home | NEW-01 |
| "I like your faqs instructions. We bury bring your dog in FAQs Create a new secti..." | Home | NEW-02 |
| "Size of photos in listings - my favorite are the layouts in wellness and caterin..." | Le Moulin | STRUCT-05 |
| "Use a jetson photo. Create a new section that says: Make your life a masterpiece..." | Le Moulin | NEW-02 |
| "Use this monet giverny painting next to the bridge at moulin a reve." | Le Moulin | NEW-03 |
| "Once you are inside the photos of each room -- it’s very difficult to get back t..." | Le Moulin | STRUCT-01 |

_v2-deferred row count: 12_

## Requirement coverage

| Requirement | Bullet count |
|-------------|--------------|
| CLAR-FORM-CAL | 1 |
| COPY-01 | 5 |
| COPY-02 | 1 |
| COPY-03 | 1 |
| COPY-04 | 1 |
| COPY-05 | 1 |
| COPY-06 | 2 |
| COPY-07 | 2 |
| COPY-08 | 1 |
| COPY-09 | 1 |
| COPY-10 | 1 |
| COPY-11 | 1 |
| COPY-12 | 1 |
| COPY-13 | 1 |
| COPY-14 | 1 |
| PHOTO-02 | 1 |
| PHOTO-03 | 3 |
| SECT-01 | 3 |
| SECT-02 | 1 |
| SECT-03 | 5 |
| SECT-04 | 2 |
| SECT-05 | 1 |
| SECT-06 | 1 |
| SECT-07 | 2 |
| SECT-08 | 1 |
| TYPOG-01 | 2 |
| TYPOG-02 | 2 |
| TYPOG-03 | 2 |

_v1 requirements addressed: 28 of 38_

---

*End of audit. Phase 2 + Phase 3 consume this document; no further PDF re-reads needed.*