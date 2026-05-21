---
phase: 03-client-clarification
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - CLIENT-CLARIFICATION.md
autonomous: true
requirements:
  - CLAR-01
  - CLAR-02
  - CLAR-03
  - CLAR-04
  - CLAR-05
  - CLAR-06
tags:
  - documentation
  - client-deliverable
  - markdown

must_haves:
  truths:
    - "CLIENT-CLARIFICATION.md exists at the project root, ready to send directly to the client (Melissa)."
    - "The doc opens with a short, plain-English intro explaining what it is and how to read it."
    - "It is grouped by the seven required page-level sections: Home, Le Moulin, Hollywood Hideaway, Maison de la Rivière, Les Maisons, Get in Touch, Universal."
    - "Every one of the 29 ❓ items from AUDIT.md is represented with (a) verbatim quote of the client's request, (b) plain-English description of current state, (c) at least one specific answerable question."
    - "An 'Already Done — please re-review' section lists every ✅ item the client has been re-flagging, written for a non-technical reader (no src/ paths)."
    - "All cross-round contradictions are surfaced (Bonjour→Bienvenue resolution, italics global policy, 'Join us!' vs 'When would you like to visit?', Le Mérévillois vs Méréville)."
    - "All asset-asks are listed: jacuzzi photos, Stars Who Stayed Here photos, biking photos, Monet Giverny image, Netflix-on-TV decision."
    - "Includes Monty's Groups-page question (CLAR-04 — not from client)."
    - "Tone is warm, plain English, no jargon, no exposed file paths in the body (file refs allowed only as parenthetical context where helpful)."
  artifacts:
    - path: "CLIENT-CLARIFICATION.md"
      provides: "Client-facing markdown doc compiled from AUDIT.md ❓/⚠️/✅ rows"
      contains: "## Home, ## Le Moulin, ## Hollywood Hideaway, ## Maison de la Rivière, ## Les Maisons, ## Get in Touch, ## Universal, ## Already Done — please re-review, ## A question from Monty"
  key_links:
    - from: "CLIENT-CLARIFICATION.md"
      to: ".planning/phases/01-audit-inventory/AUDIT.md"
      via: "Each item compiled from AUDIT ❓/⚠️/✅ rows; verbatim quotes + code_state notes are the source of truth."
      pattern: "Verbatim quotes lifted from .verbatim fields; current-state plain-English summarized from .code_state[].current_text"
    - from: "CLIENT-CLARIFICATION.md"
      to: ".planning/phases/01-audit-inventory/_audit-bullets.json"
      via: "Structured iteration source — use jq to enumerate ❓ ids and ✅ ids cleanly."
      pattern: "jq '.rounds[].bullets[] | select(.tag == \"❓\")'"
---

<objective>
Compile every ambiguous client-feedback item from `MMM may.5.pdf` (already tagged in `AUDIT.md` as ❓ / ⚠️ / ✅) into a single client-readable Markdown file at the project root: `/workspace/CLIENT-CLARIFICATION.md`.

Purpose: Give Melissa (the property owner / client) one consolidated document she can read in plain English to (1) answer Monty's specific questions so the rest of the work can ship, (2) verify items that ARE already shipped so she stops re-flagging them, (3) confirm or reject the cross-round contradictions Monty resolved with "newest round wins", and (4) authorize one new piece of structure (a Groups page) Monty thinks would help the site convert.

Output: 1 Markdown file at `/workspace/CLIENT-CLARIFICATION.md` (project root, NOT inside `.planning/`). Across this plan's tasks the file is built incrementally and committed atomically per task.

This is pure markdown compilation. No code changes, no Astro changes, no translations.json edits. The audit phase (Phase 1) already did the cross-referencing work — every ❓ row already has a `clarification_question` and a `code_state` array; every ✅ row has a `commit_hash`; the single ⚠️ row has a `conflict_note`. This plan reformats that data for the client.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/STATE.md
@.planning/phases/01-audit-inventory/AUDIT.md
@.planning/phases/01-audit-inventory/_audit-bullets.json
@.planning/phases/01-audit-inventory/01-01-SUMMARY.md

<interfaces>
<!-- _audit-bullets.json shape (extracted from the file). Use jq to iterate. -->
<!-- File path: /workspace/.planning/phases/01-audit-inventory/_audit-bullets.json -->

Top-level shape:
```json
{
  "extracted_at": "<iso>",
  "round_detection_note": "<string>",
  "source": "MMM may.5.pdf",
  "rounds": [
    { "name": "May 5",   "page_range": [1,2], "bullets": [ /* ... */ ] },
    { "name": "May 1",   "page_range": [3,5], "bullets": [ /* ... */ ] },
    { "name": "April 30","page_range": [6,9], "bullets": [ /* ... */ ] }
  ]
}
```

Per-bullet shape (only the fields this plan needs):
```typescript
interface Bullet {
  id: string;                   // e.g. "may1-002", "april30-007"
  page: number;                 // PDF page number
  page_section: string;         // "Home" | "Le Moulin" | "Hollywood Hideaway" | "Maison de la Rivière" | "Les Maisons" | "Get in Touch" | "Universal" | "Unclassified" | "Le Loft Suite" | "Le Grange" | "About"
  verbatim: string;             // EXACT client quote — use directly inside a Markdown blockquote
  code_state: Array<{           // Files Phase 1 inspected when classifying this bullet
    file: string | null;
    line: number | null;
    current_text: string;
  }>;
  i18n_keys: string[];
  tag: "✅" | "🔧" | "❓" | "⚠️";
  tag_rationale: string;
  commit_hash: string | null;   // Set on ✅ rows — cite this in "Already Done"
  requirement_id: string | null;// e.g. "COPY-01", "TYPOG-01"
  v2_deferred: string | null;   // e.g. "NEW-04" → asset-ask category
  clarification_question: string | null;  // PRIMARY SOURCE for the question prompt — already written by Phase 1 in plain English
  conflict_note: string | null; // Set on ⚠️ rows
  rounds_appeared: string[];    // ["May 5", "May 1", "April 30"]
}
```

Counts (verified by Phase 1):
- ✅ Already Done: 10 bullets (10 distinct `commit_hash` cites)
- 🔧 Clear-to-Ship: 52 bullets (all shipped in Phase 2 — IGNORE in this plan)
- ❓ Needs Clarification: 29 bullets (THIS PLAN compiles these)
- ⚠️ Cross-round Conflict: 1 bullet (`may1-023` — Bonjour vs Bienvenue)

The 29 ❓ ids in iteration order:
may1-002, may1-008, may1-014, may1-015, may1-024, may1-025, may1-026,
april30-004, april30-007, april30-009, april30-010, april30-013, april30-014, april30-023, april30-024,
april30-027, april30-028, april30-029, april30-035, april30-037, april30-040,
april30-042, april30-043, april30-045, april30-046, april30-047, april30-048, april30-049, april30-055

The 10 ✅ ids in iteration order:
may1-004 (Le Moulin margin/galleries — `ab1ac5d`),
april30-005 (cream lightbox — `f5579e8`),
april30-006 (La Grange toilet/laundry photos removed — `1a658c2`),
april30-016 (Hollywood "The Sanctuary" → "The Refuge" — `d120aed`),
april30-017 (Wellness photo links — `fd8e979`),
april30-022 (address corrected — `111cf9b`),
april30-030 (compound private-walled tagline — `d120aed`),
april30-033 (house renamed "Le Moulin" — `333254d`),
april30-034 (estate vs house naming distinction — `333254d`),
april30-039 (Le Loft Suite is the only working modal — `d626c4b`).

Plus secondary ✅ commits the audit cites that the client likely hasn't noticed (from STATE.md decisions log):
  ad07395 (about/history gallery), 8bd51b9 (Pâtisseries section), 182b810 (Méréville explore photos), 742fb89 (May 5 photos batch), ab1ac5d (more May 5 photos).

The 1 ⚠️ row:
  may1-023 — `Plan your stay box is good but replace bonjour with Bienvenue!`
  Resolved as Bienvenue (April 30 wins; May 5 didn't readdress). Already shipped in Phase 2 (COPY-10).
</interfaces>

<page_section_grouping>
<!-- The audit's `page_section` field doesn't perfectly match the 7 required output sections. -->
<!-- Map "Unclassified" bullets to the right output section using the file paths in `code_state[].file`: -->

  | If files include …                                  | Place under output section |
  |-----------------------------------------------------|----------------------------|
  | `homes/hollywood-hideaway` (only)                   | Hollywood Hideaway         |
  | `homes/le-moulin` (only)                            | Le Moulin                  |
  | `homes/maison-de-la-riviere` (only)                 | Maison de la Rivière       |
  | `homes/index` or "Les Maisons" page_section         | Les Maisons                |
  | `pages/contact` or "Get in Touch" page_section      | Get in Touch               |
  | `pages/index` (homepage) or "Home" page_section     | Home                       |
  | Cuts across 3+ houses, OR `RoomShowcase`/`PhotoCarousel`/`AvailabilityCalendar`/`global.css` only, OR `code_state[].file` is null and verbatim describes a site-wide policy | Universal |

  Edge cases (place explicitly):
  - `april30-007` (jacuzzi photos): Universal section under "Asset asks"
  - `april30-009` (biking photos): Universal section under "Asset asks"
  - `april30-010` (Netflix logo on TV): Universal section under "Asset asks"
  - `april30-027` (Monet Giverny): Home (the new section is on the homepage) under "Asset asks"
  - `april30-047` (Stars Who Stayed Here): Hollywood Hideaway under "Asset asks"
  - `april30-014` and `april30-048` (Les Maisons header / "Les Autre Maisons" font): Les Maisons
  - `april30-049` (Where you'll gather header — single font): Universal (typography policy)
  - `may1-002` (italics readability): Universal (typography policy)
  - `april30-013` (one-hour-from-Paris caption): Home (homepage hero block)
  - `april30-023` and `april30-024` (Orly/CDG directions): Get in Touch (contact page)
  - `april30-028` (paintings included): Home (this is the Monet pairing follow-up)
  - `april30-029` (Compound Button "Three houses"): Home
  - `april30-035` ("Please change it on the house listing"): Home (refers to Compound Button)
  - `april30-037` (gallery photo bottom on first open): Universal (modal behavior — STRUCT-01 v2)
  - `april30-040` (gathering spaces too): Universal (modal — same as -037)
  - `april30-042` and `april30-043` (grounds = biggest selling part / bigger boxes): Le Moulin
  - `april30-045` (X-button missing): Universal (modal — STRUCT-01 v2)
  - `april30-046` (white space on right): Universal (gallery layout)
  - `april30-055` (any remaining bullet — verify with jq): place by file path
  - `april30-004` (formatting everywhere): Universal (gallery layout policy)
</page_section_grouping>

<style_guide>
<!-- This file is read directly by a non-technical client. -->

DO:
- Open every section with one warm sentence introducing what's in it.
- Quote the client's words verbatim inside Markdown blockquotes (`> "…"`).
- Describe the "current state" in plain English. Example:
  *"Right now the Compound page solarium gallery shows a sink and garden photo. You mentioned uploading 3 jacuzzi photos to Google Drive — could you share the folder link so I can swap them in?"*
- Bold the question the client needs to answer. End with a single concrete ask.
- For asset-asks, propose the next step (e.g., "Drop the file in the Google Drive folder we use for site photos and I'll process it.").
- For universal-policy questions (italics, fonts), present 2 clear options and ask her to pick one.
- Use H2 (`##`) for the seven page sections. Use H3 (`###`) for individual items inside a section. Use H2 for the "Already Done" and "A question from Monty" sections.
- Number items inside sections (`### 1. <one-line summary>`) so she can reply by number.

DO NOT:
- Show `src/...` paths or i18n keys to the client. (One exception: in the "Already Done" section, citing a commit hash is fine because she's used to those from prior PDFs. Keep it inline and short, e.g., "(shipped in commit `333254d`)".)
- Use words like "i18n", "translations.json", "frontmatter", "Astro", "BEM", "selector", "Vercel".
- Write more than 2-3 sentences of "current state" before getting to the question.
- Combine multiple questions into one bullet — split them.
- Skip an item because it overlaps with another. If two items are duplicates, merge them under a single H3 and cite both verbatim quotes.

LENGTH TARGET: ~600-1000 lines total. Plain-English over precision.
</style_guide>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Skeleton + Universal section (asset asks + typography policy + modal behavior)</name>
  <files>CLIENT-CLARIFICATION.md</files>
  <action>
Create a NEW file at the project root: `/workspace/CLIENT-CLARIFICATION.md`. (Do NOT place it under `.planning/` — the client receives this directly.)

Structure of this initial pass:

1. **Front matter / intro block** (no YAML — this is for the client, not for tooling). Open with:
   - `# Clarifications for Moulin à Rêves Site — May 5, 2026`
   - One short paragraph: "Hi Melissa — this is a single document with all the items from your three rounds of feedback that I need a quick answer on before I can finish them. There's also an 'Already Done' section at the bottom — please skim it and you'll see several things you've been flagging are actually already live (we may have just been writing past each other). Thanks!"
   - One short note: "How to reply: each numbered item ends with **a single bold question**. Just reply with the item number and your answer (e.g., '1: Yes, use the Monet Water Lilies one.')."

2. **Table of contents** with anchor links to:
   - Home, Le Moulin, Hollywood Hideaway, Maison de la Rivière, Les Maisons, Get in Touch, Universal, Already Done — please re-review, A question from Monty (Groups page)

3. **`## Universal` section** — write it now in this task. Inside Universal cover the following ❓ items, in this order, each as `### N. <one-line summary>`:
   - **(a) Italics readability — universal policy** — pulls from `may1-002` ("Can you make italicised text easier to read?"). Frame as the global-policy question that came up while shipping TYPOG-01: explain the listed cases (stay / Maisons / Rêves / Where you'll sleep / gather / etc.) are now de-italicized, but ~8 body-prose section heads (about/getting/catering/the-compound/explore) still use italic on their final word. Also note the global `.hero__tagline` italic still applies to ~15 other hero taglines (le-moulin, riviere, the-compound, about, explore). Present two options: **(A)** Remove italic globally site-wide. **(B)** Keep italic everywhere except the listed cases. End with the bold question.
   - **(b) "Where you'll gather" header — single font** — pulls from `april30-049`. Verbatim quote. Current state: "Where you'll gather" headers currently mix Cormorant Garamond (italic) with DM Sans body text. Two options: full Cormorant, or full DM Sans. Bold question: which one.
   - **(c) Gallery photo bottom cropped on first open** — pulls from `april30-037` AND `april30-040` (merge — both describe the same modal-on-open issue). Current state: known issue scoped under Phase 1 finding STRUCT-01 (deferred to Milestone 2). State explicitly: "I'm noting this for Milestone 2 because it needs a structural fix to the photo modal component. **Confirming you're OK with this landing in the next round (not tomorrow)?**"
   - **(d) Modal X-button cropped — same fix as (c)** — pulls from `april30-045`. Same disposition (STRUCT-01 v2).
   - **(e) White-space-on-the-right in galleries** — pulls from `april30-046` AND `april30-004`. Bold question: "Do you want me to make the photos take the full width with no text beside them on the homes' room/gathering galleries (matching the format you liked elsewhere)?"
   - **(f) Asset asks (jacuzzi photos)** — pulls from `april30-007`. Current state: "the solarium/jacuzzi gallery on the Compound page currently shows a sink and a garden photo." Bold question: "Can you share the Google Drive folder link with the 3 jacuzzi photos? I'll process and wire them in tomorrow."
   - **(g) Asset asks (biking photos)** — pulls from `april30-009`. Current state: "the Gym & Bikes section currently has a single bike-by-gate photo (the antique-carriage shot was removed last round)." Bold question: "Have the biking photos arrived in Google Drive yet? Folder link, please."
   - **(h) Netflix logo on TV** — pulls from `april30-010`. Current state: "the screening-room photo currently shows a blank TV." Two options: (A) leave the TV blank, (B) generic 'streaming' card mockup. Note brand-licensing concern with using the Netflix logo specifically. Bold question: "Which would you like — A or B?"
   - **(i) Le Mérévillois vs Méréville** — cross-round naming question. Current state: "the corrected address says **Le Mérévillois** (the new commune name), but throughout the marketing copy the area is referred to as **Méréville** (the historical name people search for). I think mixing them is fine: official address = Le Mérévillois, marketing copy = Méréville for SEO. **Confirm you're OK with this?**"
   - **(j) "Join us!" vs "When would you like to visit?"** — cross-round flag from `may1-024` AND `may1-025`. Current state: "I went with **'Join us!'** everywhere because that's what the May 5 round asked for, but May 1 round had two contradictory suggestions ('When would you like to visit?' and 'Maybe this looks better than Join Us!'). **Confirm 'Join us!' is the final answer or pick a different phrase.**"

CRITICAL — preserve the verbatim quote rule: every numbered item must include a `>` blockquote with the client's exact wording from her PDF (use the `verbatim` field from `_audit-bullets.json`). For items merged from two bullets, include both quotes.

After writing, run a verify check (see verify block).

After file write succeeds, commit atomically:
```bash
git add CLIENT-CLARIFICATION.md
git commit -m "docs(03): start CLIENT-CLARIFICATION.md — intro + Universal section (CLAR-01, CLAR-05, CLAR-06)"
```
Do NOT skip hooks. Do not add any other files.
  </action>
  <verify>
    <automated>test -f /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -c '^## ' /workspace/CLIENT-CLARIFICATION.md | awk '$1 &gt;= 1 {exit 0} {exit 1}' &amp;&amp; grep -q '^## Universal' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q 'jacuzzi' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q 'Netflix' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q 'Le Mérévillois' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q 'Bienvenue' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; ! grep -qE 'src/(pages|components|layouts)/' /workspace/CLIENT-CLARIFICATION.md</automated>
  </verify>
  <done>
- File exists at `/workspace/CLIENT-CLARIFICATION.md` (NOT inside `.planning/`).
- Has H1 title, intro paragraph, table of contents, and complete `## Universal` section.
- Universal section contains 10 numbered items covering: italics policy, gather-header font, gallery bottom-crop, modal X-button, gallery white-space, jacuzzi photos, biking photos, Netflix logo, Le Mérévillois naming, Join-us-vs-visit-us.
- Each item has a verbatim blockquote from the client's PDF.
- No `src/...` paths exposed in the body.
- Atomic commit landed on `feat/may-5-2026-photos`.
  </done>
</task>

<task type="auto">
  <name>Task 2: Home + Le Moulin sections</name>
  <files>CLIENT-CLARIFICATION.md</files>
  <action>
APPEND `## Home` and `## Le Moulin` sections to `/workspace/CLIENT-CLARIFICATION.md`. Insert them in the correct place per the TOC ordering (between intro/TOC and `## Universal` — re-arrange existing content if needed so final order is: Home → Le Moulin → Hollywood Hideaway → Maison de la Rivière → Les Maisons → Get in Touch → Universal → Already Done → Question from Monty).

**`## Home` section** — open with one warm sentence ("These are the items from your notes that touch the homepage."). Then numbered items:

1. **"One hour from Paris" caption placement** — pulls from `april30-013`. Verbatim quote: "One hour from Paris" as we say that right below the photo. Current state: the homepage hero now reads "A Private Luxurious Compound, One Hour From Paris" with "Méréville, France" beneath (per COPY-06). The "one hour from Paris" line ALSO appears in the homepage stats-bar intro and in the page meta description. Bold question: "Should I keep both — the hero subtitle AND the stats-bar intro saying 'one hour from Paris' — or remove the stats-bar one to avoid repetition?"

2. **Compound Button "Three houses" change** — pulls from `april30-029`. Verbatim quote. Current state: the Compound section button copy was already updated last round to "This is a private walled compound where you are master of your own domaine. Peace, privacy. Tranquility." (COPY-08 — shipped). Your "Three houses" line in the PDF didn't have a clear before/after. Bold question: "Did you mean to change something else on this button — or are you happy with the new 'private walled compound' wording I shipped (you can see it on the homepage scroll-down)?"

3. **"Please change it on the house listing"** — pulls from `april30-035`. This bullet appears next to the Compound Button section in the PDF. Bold question: "This one needs a pointer — what specifically am I changing on the house listing? (I think you may have meant 'rename Houses → Homes' on the stats-bar at the top of the page, which IS shipped — but I want to make sure.)"

4. **Monet Giverny + Moulin bridge pairing (asset ask)** — pulls from `april30-027` AND `april30-028`. Current state: the new "Make your life a masterpiece" section (NEW-03 in my notes — Milestone 2 work) is queued for next round but needs the Monet image. Bold question: "Which Monet Water Lilies / Giverny painting do you want? You could (a) point me at a public-domain image on Wikipedia (Met Museum has clean PD scans of several), or (b) drop one in the Google Drive folder and I'll downscale it. Either way, this section ships next round."

**`## Le Moulin` section** — open with one warm sentence. Then numbered items:

1. **Grounds = "biggest selling part"** — pulls from `april30-042` AND `april30-043` (merge — both about gardens-as-galleries). Verbatim quotes (both). Current state: "Right now Le Moulin's grounds section renders one combined gallery (gardens + bridge + patios in one carousel)." Bold question: "Do you want me to split it into THREE separate clickable galleries (Gardens / Bridge / Patios) — yes/no? If yes, this is Milestone 2 work and I'll get it in the next round." (Note: this is the same as the May 5 universal note may5-002 about per-house garden galleries — surface that overlap inline.)

After writing, commit:
```bash
git add CLIENT-CLARIFICATION.md
git commit -m "docs(03): add Home + Le Moulin sections to CLIENT-CLARIFICATION.md (CLAR-01, CLAR-02)"
```
  </action>
  <verify>
    <automated>grep -q '^## Home' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q '^## Le Moulin' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q 'Monet' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q 'Giverny' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q 'one hour from Paris' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q -i 'gardens' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; ! grep -qE 'src/(pages|components|layouts)/' /workspace/CLIENT-CLARIFICATION.md</automated>
  </verify>
  <done>
- `## Home` section appended with 4 items including the Monet asset-ask, Compound Button question, "house listing" pointer ask, and "one hour from Paris" placement question.
- `## Le Moulin` section appended with the gardens-as-galleries merged item.
- Each item has a verbatim blockquote.
- File order is Home → Le Moulin → … (other sections appended in later tasks).
- Atomic commit landed.
  </done>
</task>

<task type="auto">
  <name>Task 3: Hollywood Hideaway + Maison de la Rivière sections</name>
  <files>CLIENT-CLARIFICATION.md</files>
  <action>
APPEND `## Hollywood Hideaway` and `## Maison de la Rivière` sections AFTER `## Le Moulin` and BEFORE `## Universal`.

**`## Hollywood Hideaway` section** — open with one warm sentence. Then numbered items:

1. **"What's Here" 3-photo section — remove?** — pulls from `may1-014`. Verbatim quote. Current state: "The Hollywood Hideaway page still has the 3-photo 'What's here' section (showing patio, gardens, X). Last round you said to remove it — and I deferred that to this clarification doc because the May 5 'Stars Who Stayed Here' note hinted at replacing it with the new section instead." Bold question: "Two options — (A) **delete** the 'What's here' 3-photo section now and leave the slot empty until the Stars photos arrive, or (B) **keep** the 3-photo section and put the Stars section underneath. Which?"

2. **Gathering rooms photos — bigger?** — pulls from `may1-008`. Verbatim quote. Current state: "Right now the gathering-room tiles in Hollywood Hideaway are sized smaller than the bedroom tiles. (RoomShowcase grid uses one size; AmenitiesSection uses a smaller size for the gathering tiles.)" Bold question: "Should I match the gathering-room tile size to the bedroom-room tile size (yes/no)? If yes, this is a Milestone 2 fix because it touches a shared component."

3. **Modal X-button missing here too** — pulls from `april30-045` (also surfaced in Universal). Cross-reference: "this is the same modal issue from Universal item (d) — including it here so you can see Hollywood Hideaway's rooms exhibit it." No new question — point back to the Universal item.

4. **"Stars Who Stayed Here" section (asset ask)** — pulls from `april30-047`. Verbatim quote. Current state: "the section is queued (NEW-04 in my notes) but I'm waiting on the photos you mentioned uploading 'tonight'." Bold question: "Have those star photos landed in Google Drive? If yes, share the folder link and a one-line caption per photo (who's the celebrity / what film are they known for)."

**`## Maison de la Rivière` section** — open with: "There aren't any open clarification questions specific to Maison de la Rivière — last round's edits (PHOTO-02 dining-room horizontal swap, SECT-03 exterior + gardens removal, hero centering) all shipped. Two reminders that touch this page:"

1. Cross-reference: "the gallery white-space and modal X-button issues (Universal items (e) and (d)) apply to this house's room galleries too — same fix, no separate answer needed."

2. Note: "the dining-room lead photo was swapped to the horizontal tables-set-with-plates shot last round (commit `10c9007`). If that's not the photo you intended, **let me know** and I'll switch."

After writing, commit:
```bash
git add CLIENT-CLARIFICATION.md
git commit -m "docs(03): add Hollywood Hideaway + Maison de la Rivière sections (CLAR-01, CLAR-02, CLAR-06)"
```
  </action>
  <verify>
    <automated>grep -q '^## Hollywood Hideaway' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q '^## Maison de la Rivière' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q -i 'stars who stayed' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q -i "what's here" /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q '10c9007' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; ! grep -qE 'src/(pages|components|layouts)/' /workspace/CLIENT-CLARIFICATION.md</automated>
  </verify>
  <done>
- `## Hollywood Hideaway` section with 4 items including "What's Here" deferral, gathering tile size, Stars asset ask.
- `## Maison de la Rivière` section with the dining-photo confirmation note and cross-references to Universal.
- Each item has a verbatim blockquote where one exists in the source.
- Atomic commit landed.
  </done>
</task>

<task type="auto">
  <name>Task 4: Les Maisons + Get in Touch sections</name>
  <files>CLIENT-CLARIFICATION.md</files>
  <action>
APPEND `## Les Maisons` and `## Get in Touch` sections AFTER `## Maison de la Rivière` and BEFORE `## Universal`.

**`## Les Maisons` section** — open with one warm sentence ("These are the open items on the /homes/ page where the three houses are listed."). Then:

1. **"Les Maisons" header size** — pulls from `april30-014`. Verbatim quote. Current state: "the Les Maisons hero h1 currently renders larger than the section header above it (and uses italic on 'Maisons')." Bold question: "Two options — (A) **shrink** the Les Maisons h1 to match the section header above it, or (B) **enlarge** the section header above it to match the Les Maisons h1. Which feels right?"

2. **"Les Autres Maisons" — single font** — pulls from `april30-048`. Verbatim quote. Current state: "Right now 'Les Autres Maisons' renders with the title in Cormorant Garamond italic ('Maisons' specifically) and the body in DM Sans." Bold question: "Use one font for the whole 'Les Autres Maisons' header — Cormorant or DM Sans? (This is the same family as the Universal italic-policy question — answering one likely answers both.)"

3. **Universal note: per-house garden galleries** — surface `may5-002` here as it relates to the Les Maisons listing surface. Verbatim quote: "This is a universal note for all the houses. the grounds each one of these should be a Gallery so it's a Gallery for the gardens and the bridge and a Gallery for the patios." Bold question: "Confirming this is Milestone 2 work — split the grounds into separate Gardens / Bridge / Patios galleries on EACH home page (Le Moulin, Hollywood Hideaway, Maison de la Rivière). Yes / no?"

**`## Get in Touch` section** — open with one warm sentence ("Open items on the contact page."). Then:

1. **Contact form ABOVE calendar?** — pulls from `may1-026`. Verbatim quote. Current state: "currently the contact page renders the availability calendar first, then the form below it." Bold question: "Want me to swap the order so the form is above the calendar? (yes/no — this is a 5-minute change.)"

2. **"Maybe this looks better than Join Us!"** — pulls from `may1-025`. Verbatim quote. This is the same family as the Universal "Join us!" item but specifically about the Get in Touch page hero. Note: "I shipped 'Join us!' everywhere per the May 5 round. **If you want a different phrase on the contact page hero specifically, tell me what.**"

3. **Orly + CDG directions** — pulls from `april30-023` AND `april30-024` (merge). Verbatim quotes (both). Current state: "I haven't found the existing 'Getting Here' formatting block in the contact page — it may live on a different page or have been removed. The address (14, 16, 18 Rue des Crocs au Renard, 91660 Le Mérévillois) is shipped, but the 'specific directions from Orly 55 min, Charles de Gaulle 75 min' aren't surfaced anywhere I can find." Bold question: "Where exactly should this directions block live — on the contact page, on a new 'Getting Here' page, or in the existing 'Discover the Area' page? And do you want me to draft the actual driving directions, or do you have copy ready?"

After writing, commit:
```bash
git add CLIENT-CLARIFICATION.md
git commit -m "docs(03): add Les Maisons + Get in Touch sections (CLAR-01, CLAR-02, CLAR-05)"
```
  </action>
  <verify>
    <automated>grep -q '^## Les Maisons' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q '^## Get in Touch' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q -i 'orly' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q -i 'gaulle' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q -i 'les autres maisons' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; ! grep -qE 'src/(pages|components|layouts)/' /workspace/CLIENT-CLARIFICATION.md</automated>
  </verify>
  <done>
- `## Les Maisons` section with header-size, single-font, and per-house-garden-galleries items.
- `## Get in Touch` section with form-above-calendar, Join-us-page-specific, and Orly/CDG directions items.
- Section order in file is now: Home → Le Moulin → Hollywood Hideaway → Maison de la Rivière → Les Maisons → Get in Touch → Universal.
- Atomic commit landed.
  </done>
</task>

<task type="auto">
  <name>Task 5: "Already Done — please re-review" + "A question from Monty (Groups page)" + final verification pass</name>
  <files>CLIENT-CLARIFICATION.md</files>
  <action>
APPEND two final sections AFTER `## Universal`.

**`## Already Done — please re-review`** — open with: "Several things you've been re-flagging across rounds are actually already shipped. Please skim this list and verify on the live site so we can stop the back-and-forth on these. (Commit hashes are included in case you want to confirm with me.)"

Format each as a one-line bullet. Pull from the 10 ✅ rows AND the 4 commits-the-client-may-not-have-noticed (per STATE.md and 01-01-SUMMARY.md):

The 10 verified ✅ items (one bullet each, in this order):
- Address corrected to **14, 16, 18 Rue des Crocs au Renard, 91660 Le Mérévillois** (no trailing X on "au"). — `commit 111cf9b`
- House page renamed to **"Le Moulin"** (estate-vs-house naming distinction respected). — `commit 333254d`
- "The Sanctuary" above Hollywood Hideaway → **"The Refuge"**. — `commit d120aed`
- Compound section copy updated to **"This is a private walled compound where you are master of your own domaine. Peace, privacy. Tranquility."** — `commit d120aed`
- Photo gallery backdrop on rooms changed from black → **cream**. — `commit f5579e8`
- La Grange — toilet and laundry photos **removed**. — `commit 1a658c2`
- Le Moulin page — hero-to-text margin **shrunk**, photo galleries cleaned up. — `commit ab1ac5d`
- Wellness section now links to massages tab; nearby-adventures links wired. — `commit fd8e979`
- Le Loft Suite modal works correctly (the "only working one" you noted is the reference for the rest). — `commit d626c4b`
- Cross-round resolution: plan-your-stay box says **Bienvenue!** (was Bonjour). — shipped this round in COPY-10.

PLUS — the commits the client likely hasn't noticed (these are NEW since the last PDF round and are easy to miss):
- About / History gallery refreshed. — `commit ad07395`
- New **Pâtisseries** section added on the catering page. — `commit 8bd51b9`
- Méréville / Discover-the-Area photo gallery updated. — `commit 182b810`
- Large May 5 photo batch processed and deployed. — `commit 742fb89`

End with: "**If any of these look wrong on the live site, flag the bullet and I'll fix it. Otherwise no action needed — we're done with these.**"

**`## A question from Monty (Groups page)`** — pulls from CLAR-04. Open with: "This one isn't from your PDF — it's a suggestion from me." Then:

> Right now if a corporate client, wedding planner, or yoga retreat organizer lands on the site, they need to piece together "this is a 10-bedroom compound that sleeps 20" by reading three home pages and the Compound page. There's no single page that says **"Here's what we offer for groups"** with: (a) the all-three-houses-rented configuration, (b) the catering + wellness + nearby-adventures bundle, (c) a direct-inquiry CTA framed for organizers (not couples).
>
> My instinct is that a top-level **Groups** page in the nav would convert these visitors better. It would lift content that already exists (Bienvenue Chez Vous section, retreats list, catering / wellness cards) and reframe it for group bookers.
>
> **Bold question — do you want me to build this in Milestone 2? Yes / no / "let me think about it".**

**Final verification pass** — after appending, do a final read of the whole file and check:
1. The seven required sections (Home, Le Moulin, Hollywood Hideaway, Maison de la Rivière, Les Maisons, Get in Touch, Universal) are all present, in TOC order, with at least one numbered item each (Maison de la Rivière may have only cross-references — that's OK because last round shipped its main edits).
2. The "Already Done" section lists at least 10 ✅ items + the 4 unnoticed commits.
3. The "A question from Monty (Groups page)" section is present.
4. Run a coverage check: `jq '.rounds[].bullets[] | select(.tag == "❓") | .id' /workspace/.planning/phases/01-audit-inventory/_audit-bullets.json` produces 29 ids — for each, search the doc for at least one identifying phrase from its `verbatim` field. Use these representative phrases (one per ❓ id, picked so each is unique enough to grep):
   - may1-002 → "italicised text easier to read" OR rephrased: "Universal items (e)"; ANY trace of italics-policy discussion is sufficient.
   - may1-008 → "gathering rooms photos" OR "gathering room tile"
   - may1-014 → "What's here" OR "What's Here"
   - may1-015 → covered by Universal "Join us!" item — no separate trace needed if Universal item exists
   - may1-024 → covered by same Universal "Join us!" item
   - may1-025 → present in Get in Touch
   - may1-026 → "above the calendar" OR "form is above"
   - april30-004 → covered by Universal item (e) white-space
   - april30-007 → "jacuzzi"
   - april30-009 → "biking"
   - april30-010 → "Netflix"
   - april30-013 → "one hour from Paris"
   - april30-014 → "Les Maisons" header item
   - april30-023 → "Orly"
   - april30-024 → "Charles de Gaulle" or "Gaulle"
   - april30-027 → "Monet"
   - april30-028 → covered by same Monet item
   - april30-029 → "Compound Button" or "Three houses"
   - april30-035 → "house listing"
   - april30-037 → "bottom of the photos" OR Universal modal item
   - april30-040 → covered by same modal item
   - april30-042 → "biggest selling" OR "gardens"
   - april30-043 → covered by same gardens item
   - april30-045 → "X-button" OR Universal modal item
   - april30-046 → "white space" OR Universal item (e)
   - april30-047 → "Stars Who Stayed"
   - april30-048 → "Les Autres Maisons" or "Autre Maisons"
   - april30-049 → "gather header" or "gather" (font item)
   - april30-055 → check this one's verbatim — pick a representative phrase

If any ❓ item is NOT traceable in the file, ADD a one-line bullet for it to the most appropriate section before committing.

Final commit:
```bash
git add CLIENT-CLARIFICATION.md
git commit -m "docs(03): finish CLIENT-CLARIFICATION.md — Already Done re-review + Groups page question (CLAR-03, CLAR-04)"
```
  </action>
  <verify>
    <automated>grep -q '^## Already Done — please re-review' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -q 'Groups' /workspace/CLIENT-CLARIFICATION.md &amp;&amp; grep -c '111cf9b\|333254d\|d120aed\|f5579e8\|1a658c2\|ab1ac5d\|fd8e979\|d626c4b\|ad07395\|8bd51b9\|182b810\|742fb89' /workspace/CLIENT-CLARIFICATION.md | awk '{ if ($1 &gt;= 10) exit 0; else exit 1 }' &amp;&amp; for s in '^## Home' '^## Le Moulin' '^## Hollywood Hideaway' '^## Maison de la Rivière' '^## Les Maisons' '^## Get in Touch' '^## Universal'; do grep -q "$s" /workspace/CLIENT-CLARIFICATION.md || exit 1; done &amp;&amp; ! grep -qE 'src/(pages|components|layouts)/' /workspace/CLIENT-CLARIFICATION.md</automated>
  </verify>
  <done>
- All seven required H2 sections present in correct TOC order.
- "Already Done — please re-review" lists ≥10 commit-cited bullets.
- "A question from Monty (Groups page)" section present with a clear yes/no question.
- All 29 ❓ items from `_audit-bullets.json` traceable to at least one phrase in the file (or merged under a parent item with a cross-reference).
- No `src/...` paths leaked into the body.
- Final atomic commit landed; phase deliverable complete.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Plan→Repo | Markdown file written to working tree at project root, committed to `feat/may-5-2026-photos`. No new auth, runtime, or API surface. |
| Commit→Vercel | Atomic commits to current branch; auto-deploy is `main`-gated, so this branch's commits do NOT auto-deploy. The file is repo-internal until intentionally merged. |
| Repo→Client | Client receives the file out-of-band (email/Slack copy-paste). Not a server-side disclosure surface. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-01 | Information Disclosure | `CLIENT-CLARIFICATION.md` body | mitigate | Style-guide rule + verify gate: `! grep -qE 'src/(pages|components|layouts)/' CLIENT-CLARIFICATION.md` is run after every task. Prevents accidental leak of internal file paths to a non-technical recipient. |
| T-03-02 | Information Disclosure | Commit hashes in "Already Done" | accept | Commit hashes are not secrets; they're how Monty has communicated with this client across prior PDFs. ASVS L1 N/A — public repo metadata. |
| T-03-03 | Information Disclosure | Embedded verbatim client quotes | accept | Quotes are the client's own words, supplied by her. No PII beyond names/property addresses already public on the marketing site. |
| T-03-04 | Tampering | Multi-task incremental writes | mitigate | Each task commits atomically; if a later task corrupts the file, `git revert` rolls back to the last good state. The verify gate after each task gates commit acceptance. |
| T-03-05 | Repudiation | Atomic commits without author | accept | All commits use the configured git author (Monty); GSD enforces no `--no-verify`. Git history is the audit trail. |
| T-03-06 | Denial of Service | n/a — static markdown | n/a | No runtime surface. |
| T-03-07 | Elevation of Privilege | n/a — no auth surface | n/a | This phase touches no auth, env, secret, or API code. |

ASVS L1 mapping: N/A. No HTTP, no auth, no input handling. Standard markdown-doc threat surface only.
</threat_model>

<verification>
After all 5 tasks complete, run these commands from the repo root and confirm output:

1. **File exists at the right place:**
   ```bash
   test -f /workspace/CLIENT-CLARIFICATION.md && echo OK
   ```

2. **All seven required H2 page sections present:**
   ```bash
   for s in 'Home' 'Le Moulin' 'Hollywood Hideaway' 'Maison de la Rivière' 'Les Maisons' 'Get in Touch' 'Universal'; do
     grep -q "^## $s" /workspace/CLIENT-CLARIFICATION.md || echo "MISSING: $s"
   done
   ```

3. **Already Done section with ≥10 commit citations:**
   ```bash
   grep -c '111cf9b\|333254d\|d120aed\|f5579e8\|1a658c2\|ab1ac5d\|fd8e979\|d626c4b\|ad07395\|8bd51b9\|182b810\|742fb89' /workspace/CLIENT-CLARIFICATION.md
   # expect ≥ 10
   ```

4. **Groups-page question present (CLAR-04):**
   ```bash
   grep -q 'A question from Monty' /workspace/CLIENT-CLARIFICATION.md && grep -q -i 'groups' /workspace/CLIENT-CLARIFICATION.md && echo OK
   ```

5. **All asset-asks present (CLAR-06):**
   ```bash
   grep -q 'jacuzzi' /workspace/CLIENT-CLARIFICATION.md && \
   grep -q -i 'biking' /workspace/CLIENT-CLARIFICATION.md && \
   grep -q 'Stars Who Stayed' /workspace/CLIENT-CLARIFICATION.md && \
   grep -q 'Monet' /workspace/CLIENT-CLARIFICATION.md && \
   grep -q 'Netflix' /workspace/CLIENT-CLARIFICATION.md && echo OK
   ```

6. **Cross-round contradictions present (CLAR-05):**
   ```bash
   grep -q 'Bienvenue' /workspace/CLIENT-CLARIFICATION.md && \
   grep -q -E 'Join us|Join Us' /workspace/CLIENT-CLARIFICATION.md && \
   grep -q 'Le Mérévillois' /workspace/CLIENT-CLARIFICATION.md && \
   grep -q -i 'italic' /workspace/CLIENT-CLARIFICATION.md && echo OK
   ```

7. **No internal file paths leaked to client body:**
   ```bash
   ! grep -qE 'src/(pages|components|layouts|styles|content)/' /workspace/CLIENT-CLARIFICATION.md && echo OK
   ```

8. **Coverage of all 29 ❓ ids — manual scan:** read the final file end-to-end against the 29-id list in `<interfaces>` above; confirm each id's content shows up (some merged under shared parent items with a cross-reference — that's fine).

9. **Git log shows 5 atomic commits on `feat/may-5-2026-photos` for this phase:**
   ```bash
   git log --oneline feat/may-5-2026-photos -- CLIENT-CLARIFICATION.md | wc -l
   # expect 5
   ```
</verification>

<success_criteria>
This phase is complete when:

1. ✓ `/workspace/CLIENT-CLARIFICATION.md` exists at repo root, NOT inside `.planning/`. (CLAR-01)
2. ✓ Organized into the seven page-level sections in this order: Home, Le Moulin, Hollywood Hideaway, Maison de la Rivière, Les Maisons, Get in Touch, Universal. (CLAR-01)
3. ✓ Every one of the 29 ❓ items from `_audit-bullets.json` is represented (some merged under a shared parent item with a cross-reference). Each represented item has (a) verbatim client quote, (b) plain-English current state, (c) ≥1 specific bold question. (CLAR-02)
4. ✓ "Already Done — please re-review" section lists ≥10 ✅ commit-cited items + 4 commits the client likely hasn't noticed. (CLAR-03)
5. ✓ Doc includes a Monty-originated question proposing a top-level Groups page. (CLAR-04)
6. ✓ Cross-round contradictions surfaced: Bonjour→Bienvenue (resolved), italics universal policy (open), "Join us!" vs "When would you like to visit?" (open), Le Mérévillois vs Méréville (resolution proposed). (CLAR-05)
7. ✓ Asset-asks listed: jacuzzi photos, Stars Who Stayed Here, biking photos, Monet Giverny, Netflix-on-TV decision. (CLAR-06)
8. ✓ No `src/...` paths exposed in the client-facing body.
9. ✓ Five atomic commits land on branch `feat/may-5-2026-photos`, one per task.
</success_criteria>

<output>
After completion, create `.planning/phases/03-client-clarification/03-01-SUMMARY.md` summarizing:
- Total ❓ items represented (target: 29 — note any merged-under-parent counts)
- Total ✅ items in "Already Done" (target: ≥10 + 4 = 14)
- Final file size (lines)
- Commits landed (5 atomic per the 5 tasks)
- Final disposition of CLAR-01..CLAR-06 (all ✓)
- Any items the client will need to answer for Milestone 2 (Groups page, italics policy, Monet image, asset-asks)
</output>
