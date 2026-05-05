# Clarifications for Moulin à Rêves Site — May 5, 2026

Hi Melissa — this is a single document with all the items from your three rounds of feedback that I need a quick answer on before I can finish them. There's also an **"Already Done — please re-review"** section at the bottom — please skim it and you'll see several things you've been flagging are actually already live (we may have just been writing past each other). Thanks!

**How to reply:** each numbered item ends with **a single bold question**. Just reply with the item number and your answer (e.g., *"Universal 6: Yes, here's the Drive link…"* or *"Le Moulin 1: Yes, split into three galleries"*).

---

## Table of Contents

1. [Home](#home)
2. [Le Moulin](#le-moulin)
3. [Hollywood Hideaway](#hollywood-hideaway)
4. [Maison de la Rivière](#maison-de-la-rivière)
5. [Les Maisons](#les-maisons)
6. [Get in Touch](#get-in-touch)
7. [Universal](#universal)
8. [Already Done — please re-review](#already-done--please-re-review)
9. [A question from Monty (Groups page)](#a-question-from-monty-groups-page)

---

## Universal

These items aren't tied to a single page — they're site-wide policy questions or asset-asks I need from you before I can finish.

### 1. Italics — site-wide policy

> "Can you make italicised text easier to read?" *(May 1 round)*

I went through last night and removed the italic from the final word of the headers you specifically called out — **stay**, **Maisons**, **Rêves**, **sleep**, **gather**, **here**, **us**, **Compound**, **Area**, **Easy**. Those now render in upright Cormorant Garamond.

But there are still ~8 body-prose section headers across the site (about, getting-here, catering, the-compound, explore) where the final word is italicised the same way, and ~15 hero taglines (le-moulin, riviere, the-compound, about, explore) that use a global italic rule. I left those alone for now because you didn't list them by name, but they're the same visual treatment.

Two options:

- **(A)** Remove italics globally — every header and tagline goes upright. Most consistent.
- **(B)** Keep italics everywhere except the specific words you listed. Leaves the look you originally designed in, just trims the words that bothered you.

**Which do you want — A or B?**

### 2. "Where you'll gather" header — single font

> "Where you'll gather header: just use one consistent font - now there are 2." *(April 30 round)*

Right now the "Where you'll gather" header uses Cormorant Garamond (italic) for the first part and DM Sans for the body text underneath — that's the mix you flagged.

Two options:

- **(A)** Whole header in **Cormorant Garamond** (the elegant serif — what we use on most page titles).
- **(B)** Whole header in **DM Sans** (the clean sans-serif — what we use for body copy).

**Which font — Cormorant Garamond or DM Sans?**

### 3. Photo gallery — bottom of photos cropped on first open

> "When you click the arrows it adjusts but it would be better if you saw the bottom of the photos as soon as you click on the room." *(April 30 round)*
>
> "This problem is in all the gathering spaces too." *(April 30 round)*

I see the issue — when you open a room or gathering-space gallery, the photo is initially scaled wrong and the bottom is cut off, only correcting itself once you click an arrow. This is in my notes as a structural fix to the gallery component (every house's room and gathering galleries share the same component, so it's a single fix that touches all three houses).

I've scoped this as **Milestone 2** work because it's a real component rebuild, not a CSS tweak. **Confirming you're OK with this landing in the next round (not tomorrow)?**

### 4. Modal X-button cropped — same root cause as #3

> "These rooms and gathering spaces have the same challenge of losing the x in the upper right corner so you can navigate back to the house." *(April 30 round)*

Same fix as Universal #3 above — the X button gets cropped on the same component that has the photo-bottom issue. Both go away with the same Milestone 2 rebuild. **No separate answer needed — flagging it here so you can see I haven't forgotten it.**

### 5. White space on the right side of room/gathering galleries

> "Is the issue having the white space on the right side for text?" *(April 30 round)*
>
> "This is an issue in all the other room/gathering spaces galleries in all the homes, so perhaps you should use this formatting everywhere." *(April 30 round)*

You flagged that the gallery layouts on the home pages have a white text column on the right while the photos sit smaller on the left — and you preferred the formatting we used elsewhere (the wellness / catering full-width gallery layout).

**Do you want me to make the photos take the full width — no text column beside them — on every home's room and gathering galleries (matching the wellness/catering format you liked)?** Yes / no.

### 6. Asset ask — jacuzzi photos

> "I uploaded 3 jacuzi photos to google drive - do you have them?" *(April 30 round)*

Right now the solarium / jacuzzi gallery on the Compound page shows a sink photo and a garden photo — the actual jacuzzi photos haven't reached me yet.

**Can you share the Google Drive folder link with the 3 jacuzzi photos? Drop the link in your reply and I'll process and wire them in tomorrow.**

### 7. Asset ask — biking photos

> "Later I will upload biking photos of me in the countryside on bike." *(April 30 round)*

The Gym & Bikes section currently has a single bike-by-gate photo (the antique-carriage shot was removed last round per your request).

**Have the biking photos arrived in Google Drive yet? If yes — folder link, please. If no — no rush, we can swap them in next round.**

### 8. Netflix logo on the screening-room TV

> "Screening room: can you add the NETFLIX logo on the TV?" *(April 30 round)*

The screening-room photo currently shows a blank TV. Adding the actual Netflix logo is a brand-licensing question — Netflix's brand guidelines restrict commercial use of their wordmark, so dropping it onto the TV in our marketing photo is a real legal grey area.

Two safer options:

- **(A)** Leave the TV blank as it is — most legally clean, slightly less evocative.
- **(B)** Show a generic "streaming" card mockup on the TV (think the kind of placeholder card with "Now Streaming" text in a Netflix-style red — evokes the idea without using their actual logo).

**Which would you like — A or B?**

### 9. "Le Mérévillois" vs "Méréville" — naming

While correcting the address last round I noticed the area's official commune name changed to **Le Mérévillois** in 2016, but historically (and in every search result, every Google Maps reference, every guidebook) it's still **Méréville**.

What's currently on the site:

- **Official address:** `14, 16, 18 Rue des Crocs au Renard, 91660 Le Mérévillois` (the legally correct postal commune).
- **Marketing copy throughout:** "Méréville" (because that's what people search for and recognise).

I think this mix is correct — be legally accurate where it matters (the address) and use the searchable historical name in marketing copy where SEO matters. **Confirm you're OK with this approach?**

### 10. "Join us!" vs "When would you like to visit?" — final answer

> "Replace When You Can Stay at Bottom of all pages with Joine Us!" *(May 1 round)*
>
> "Change when can you stay to When would you like to visit?" *(May 1 round)*

Your May 1 round had two contradictory phrases for the same thing — "Join us!" in one place and "When would you like to visit?" in another. The May 5 round resolved it as **"Join us!"** so that's what I shipped everywhere.

**Confirm "Join us!" is the final answer site-wide — or pick a different phrase if you've changed your mind.** (See also Get in Touch #2 — there's a related note from May 1 specifically about the contact-page hero.)

### 11. Cross-round resolution — "Bonjour" → "Bienvenue!" (already shipped, confirming)

> "Plan your stay box is good but replace bonjour with Bienvenue!" *(April 30 round, repeated May 1)*

Earlier in the project the "Plan your stay" CTA box said **"Bonjour!"** — your April 30 round asked to change it to **"Bienvenue!"** — May 1 didn't readdress it — May 5 didn't address it either. I treated April 30 as the most recent direction and shipped the rename to **"Bienvenue!"** this round.

**Confirm "Bienvenue!" is correct — or revert to "Bonjour" if you preferred the earlier wording.**

---
