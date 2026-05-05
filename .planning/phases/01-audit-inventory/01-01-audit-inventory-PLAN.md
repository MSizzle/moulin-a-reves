---
phase: 01-audit-inventory
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/phases/01-audit-inventory/AUDIT.md
  - .planning/phases/01-audit-inventory/_audit-bullets.json
autonomous: true
requirements: [AUDIT-01, AUDIT-02, AUDIT-03]

must_haves:
  truths:
    - "AUDIT.md exists at .planning/phases/01-audit-inventory/AUDIT.md"
    - "Every parent bullet from MMM may.5.pdf (all 3 rounds) appears in AUDIT.md exactly once with one of the four locked tags (✅ / 🔧 / ❓ / ⚠️)"
    - "Items addressed by recent commits 742fb89, ab1ac5d, 8bd51b9, 182b810, fd8e979, ad07395 (and older c04e333, 064839a, 7b264e7, 250733e, plus all PR-numbered editorial/copy commits 0ef4dc8, d6d95d4, 1a658c2, d626c4b, f5579e8, ddbfc9b, e50f118, 333254d, 111cf9b, 8b002c9, b7a2f19, 4b10384, cc3ac01, d120aed, 73fcd9e, 9476f6c, 4819a7d, 7109a08, 450c6a9) are tagged ✅ Already Done with the commit hash cited inline"
    - "Every ❓ Needs Clarification row contains at least one specific question and a current-code-state note (file path, and a line number or quoted current text where applicable)"
    - "Every ⚠️ Cross-round Conflict row records the 'newest round wins' resolution AND lists the rounds in which the contradiction appeared"
    - "Every COPY/TYPOG row carries either a translations.json sub-action (with the affected i18n key) OR an explicit 'no FR change required' note — enforced by Task 5 Check 6 grep-and-assert gate"
    - "AUDIT.md is grouped by page in the locked order: Universal → Home → Le Moulin → Hollywood Hideaway → Maison de la Rivière → Les Maisons → Get in Touch → About → La Grange (sub) — section ordinal positions verified, not just count"
    - "AUDIT.md uses the D-03 row schema for every parent bullet: PDF-bullet quote → tag → current code state → atomic sub-actions (if compound) → cross-round annotation"
    - "MMM may.5.pdf is NOT added to git (verify with `git status --porcelain MMM\\ may.5.pdf` returning untracked, never staged)"
  artifacts:
    - path: ".planning/phases/01-audit-inventory/AUDIT.md"
      provides: "Tagged inventory of every client-feedback bullet, the contract for Phase 2 and Phase 3"
      contains:
        - "## Universal"
        - "## Home"
        - "## Le Moulin"
        - "## Hollywood Hideaway"
        - "## Maison de la Rivière"
        - "## Les Maisons"
        - "## Get in Touch"
        - "## About"
        - "## La Grange"
        - "Source: MMM may.5.pdf"
    - path: ".planning/phases/01-audit-inventory/_audit-bullets.json"
      provides: "Intermediate normalized bullet list (round + page + verbatim quote per item) used as the structured input to the AUDIT.md writer"
      contains: "round"
  key_links:
    - from: ".planning/phases/01-audit-inventory/AUDIT.md"
      to: "MMM may.5.pdf"
      via: "Source citation on every row (round + page number)"
      pattern: "Source: MMM may.5.pdf p\\.[0-9]+"
    - from: ".planning/phases/01-audit-inventory/AUDIT.md"
      to: "git history"
      via: "Commit hash citations on every ✅ Already Done row"
      pattern: "Done in [0-9a-f]{7}"
    - from: ".planning/phases/01-audit-inventory/AUDIT.md"
      to: "public/i18n/translations.json"
      via: "i18n key reference on copy-related sub-actions"
      pattern: "translations\\.json"
    - from: ".planning/phases/01-audit-inventory/AUDIT.md"
      to: ".planning/REQUIREMENTS.md"
      via: "Requirement ID cross-reference on Clear-to-Ship rows"
      pattern: "(COPY|TYPOG|SECT|PHOTO)-[0-9]{2}"
---

<objective>
Produce `/workspace/.planning/phases/01-audit-inventory/AUDIT.md` — the single tagged inventory of every client-feedback item from `MMM may.5.pdf` (3 rounds: April 30, May 1, May 5), cross-referenced against current `HEAD` code, grouped by page, with each item tagged ✅ / 🔧 / ❓ / ⚠️ per D-13.

Purpose: AUDIT.md IS the contract for Phase 2 (ship-the-clear edits) and Phase 3 (CLIENT-CLARIFICATION.md). Both downstream phases consume it. Without code-deep verification, the client will keep re-flagging already-shipped items (the recurring frustration this milestone exists to break).

Output: One Markdown file at the canonical path above, plus an intermediate `_audit-bullets.json` (working artifact, also committed) that the AUDIT.md writer consumes. NO user-facing site code changes in this phase.
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
@.planning/phases/01-audit-inventory/01-CONTEXT.md
@.planning/codebase/STRUCTURE.md
@.planning/codebase/STACK.md
@.planning/codebase/ARCHITECTURE.md
@.planning/codebase/CONVENTIONS.md
@CLAUDE.md

<source_document>
The compiled client feedback PDF lives at `/workspace/MMM may.5.pdf` (12 pages, 3 rounds layered chronologically: May 5 round on top, then May 1, then April 30). It is **NOT in git and MUST NOT be added to git** (D-11). Read its text via Python `pypdf` (already available — `pypdf 6.10.2` is installed at the system level; `python3 -c "import pypdf"` succeeds).

Reference example to extract text page-by-page:

```python
from pypdf import PdfReader
reader = PdfReader("/workspace/MMM may.5.pdf")
for i, page in enumerate(reader.pages, start=1):
    text = page.extract_text() or ""
    # round detection: pages are layered May 5 → May 1 → April 30 in source order
    print(f"--- p.{i} ---")
    print(text)
```
</source_document>

<locked_decisions>
The following are LOCKED from `.planning/phases/01-audit-inventory/01-CONTEXT.md`. Do NOT revisit:

- **D-01**: Single output file at `.planning/phases/01-audit-inventory/AUDIT.md`. One inventory, by-page grouping.
- **D-02**: Page-level grouping order: **Universal → Home → Le Moulin → Hollywood Hideaway → Maison de la Rivière → Les Maisons → Get in Touch → About → La Grange (sub)**.
- **D-03**: Row schema — PDF-bullet quote → tag → current code state (file:line + quoted current text where helpful) → atomic sub-actions (if compound) → cross-round annotation.
- **D-04**: Hybrid item granularity — preserve parent PDF bullet verbatim, list atomic sub-actions as nested checkboxes underneath.
- **D-05**: Verify-in-code only. ✅ tag requires file:line proof in current `HEAD`. NEVER trust commit messages alone.
- **D-06**: When ✅, cite the commit hash that landed it (e.g., `Done in 8bd51b9`).
- **D-07**: ✅ items done BEFORE 742fb89 still get the ✅ tag with their original commit cited.
- **D-08**: For every Clear-to-Ship copy edit, cross-check `public/i18n/translations.json` for the FR sibling.
- **D-09**: When EN+FR both need updating, list as TWO atomic sub-actions under the parent bullet (so Phase 2 ships them in one atomic commit).
- **D-10**: Pure structural edits (section removal, image swap, layout fix) skip the FR check — only copy text changes trigger it.
- **D-11**: Reference PDF as `MMM may.5.pdf` (project root). NEVER add to git.
- **D-12**: Each row cites round + page (e.g., `Source: MMM may.5.pdf p.7 (April 30 round)`).
- **D-13**: Four tags only — ✅ Already Done / 🔧 Clear-to-Ship / ❓ Needs Clarification / ⚠️ Cross-round Conflict.
- **D-14**: Implicit fifth flag — items mapping to v2 (STRUCT-01..06, NEW-01..05, AUDIT-DEEP-01..03) get 🔧 or ✅ on the parent and an explicit "deferred to v2" note for downstream agents.

**Newest round wins** for cross-round contradictions (May 5 > May 1 > April 30); contradiction still flagged in ⚠️ row and routed to CLIENT-CLARIFICATION.md.
</locked_decisions>

<commits_to_verify>
**This is the COMPLETE high-prior set of site-touching commits the client may have already received but not noticed.** The original list of 10 was incomplete — the bold/italicized rows below were missed and several of them directly address the most prominent client items in the PDF (rename to "Join us", "Le Moulin" naming, address canonicalization, modal/lightbox fixes, etc.). Mis-tagging any of these as 🔧 Clear-to-Ship instead of ✅ Already Done is exactly the recurring frustration this milestone exists to break.

**Recent (May 5 photo work) — most likely ✅ Already Done candidates:**

```
ad07395  feat(about): extend history gallery with six Borrah Minevitch family photos
fd8e979  feat(wellness): add yoga + massage galleries with new May 5 photos
182b810  feat(explore): replace Méréville placeholder photos + wire Cyclop and Barbizon mural
8bd51b9  feat(catering): add Pâtisseries section + food gallery with new May 5 photos
ab1ac5d  feat(homes): wire May 5 photos into HH, Le Moulin, and the compound
742fb89  feat(photos): add 67 May 5 photos via processing pipeline
```

**Recent typography / layout / mobile (PR-numbered):**

```
c04e333  fix(home): remove duplicate tagline + match h2 sizing (#52)         — hero / typography (COPY-06 / TYPOG)
064839a  feat(scale): typography + layout scale on wide displays (#51)        — wide-display layout
7b264e7  hotfix(layout): fully revert PR #42 mobile overflow CSS (#50)        — mobile (deferred)
250733e  hotfix(layout): drop max-width:100% and overflow-x:clip from <body> (#49) — mobile (deferred)
9476f6c  fix(mobile): clip horizontal overflow on html/body (#42)             — mobile (deferred)
```

**Editorial / copy / structural commits (the previously-missed batch — all PR-numbered, very high client-signal):**

```
0ef4dc8  copy: rename availability heading "When You Can Stay" → "Join us" (#47)         — COPY-01 likely DONE
d6d95d4  copy: remove "Tell us your dates" hero subheader (#48)                          — COPY-15 / hero subheader
1a658c2  fix(rooms): cream stage + trimmed modal text + drop HH laundry (#46)            — SECT-04 (laundry remove) + room modal
d626c4b  fix(rooms): room modal adapts to viewport, shows photos fully (#41)             — STRUCT-01 partial (modal cutoff)
f5579e8  fix(home): cream lightbox background for Discover the Compound photos (#40)      — lightbox black→white
ddbfc9b  fix(home): match Hollywood Hideaway photo width to other maison rows (#39)       — HH width parity
e50f118  fix(cta): "Start Your Conversation" → "Bonjour!" (#38)                           — POSSIBLY CONFLICTS with current "bonjour → Bienvenue!" (COPY-10) request
b7a2f19  fix(home/homes): stats intro line; align HH card on /homes/ (#37)               — stats bar / HH alignment
333254d  feat: rename house "Le Moulin à Rêves" → "Le Moulin"; HH home card photo (#35)   — COPY-07 ALREADY DONE
111cf9b  fix(address): canonicalize visible address everywhere (#32)                      — COPY-05 ALREADY DONE (verify against "14, 16, 18 ..." format)
8b002c9  fix(home): remove tagline under hero h1 (#33)                                    — hero tagline removal
4b10384  feat(home): tighten Les Maisons spacing, decommission group-card links, route Plan a Group Stay → /contact/ (#26) — Les Maisons spacing
cc3ac01  Editorial pass: Les Maisons split layout, light area cards, copy & address fixes (#29) — multi-item
d120aed  Editorial pass — compound copy, Hideaway hero/rooms, Wellness photos, About archive, Catering/Wellness overlays, Explore restructure (#30) — wide-ranging
73fcd9e  fix(wellness/home): drop massage carousel; Discover the Area now white (#31)    — Discover Area white background
4819a7d  fix(home): stop hero h1 flashing "Live the countryside, unhurried." on reload (#28) — hero flash bug
7109a08  fix(maison): use fireplace shot as Living Room key photo (#27)                  — maison living room photo
450c6a9  feat: move stats bar to home page; hide compound page (#36)                     — stats bar / compound hide
50c11ab  Update translations via dashboard                                                — translation updates
```

**Use this list as a STARTING set, but ALSO run the following discovery command to catch anything we missed:**

```bash
git log --oneline -50 -- src/ public/i18n/ src/content/ public/admin/
```

For any commit returned by that command whose subject line suggests it touches a client-feedback item (keywords: copy, fix, feat, photo, hero, modal, lightbox, gallery, address, rename, header, tagline, italic, sleeps, beds, room, home, maison, moulin, hollywood, grange, riviere, contact, about, footer, nav, lang, i18n), audit it for at least one ✅ tag in AUDIT.md.
</commits_to_verify>

<key_codebase_paths>
- Pages: `src/pages/index.astro` (home), `src/pages/about.astro`, `src/pages/contact.astro`, `src/pages/the-compound.astro`, `src/pages/homes/le-moulin.astro`, `src/pages/homes/hollywood-hideaway.astro`, `src/pages/homes/maison-de-la-riviere.astro`, `src/pages/homes/index.astro`
- Layout: `src/layouts/BaseLayout.astro` (1810 lines — nav, footer, lang toggle, popup all live here)
- Components: `src/components/PhotoCarousel.astro`, `src/components/RoomShowcase.astro`, `src/components/AmenitiesSection.astro`, `src/components/AvailabilityCalendar.astro`
- Content (frontmatter source-of-truth): `src/content/homes/{le-moulin,la-grange,le-jardin}.md` (stats), `src/content/pages/{homepage,about,compound,le-moulin,hollywood-hideaway,maison-de-la-riviere}.md` (hero copy + galleries)
- Runtime translations: `public/i18n/translations.json` (~3170 lines — RUNTIME source of truth)
- Typed seed (NOT runtime): `src/i18n/translations.ts` — do not rely on for runtime, but useful as a typed reference
- Photo mapping: `scripts/photo-mapping.json`
- Global styles: `src/styles/global.css`

**Naming convention reminder:** Hollywood Hideaway photos use `hh-*.webp` prefix; some grange photos still use legacy `la-grange-*.webp` prefix.
</key_codebase_paths>

<requirement_anchors>
This plan addresses ALL three Phase 1 requirement IDs:
- **AUDIT-01**: Every item categorized into one of the four tags. → Task 3 + Task 4 + Task 5 verify gates.
- **AUDIT-02**: Items addressed by recent commits explicitly flagged ✅ DONE with file/commit refs. → Task 3 verify gate (every ✅ row contains a 7-hex commit hash).
- **AUDIT-03**: Each ❓ item has at least one specific question + current code-state context. → Task 3 + Task 5 verify gates (every ❓ row has a `?` AND a file path or quoted text).
</requirement_anchors>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Parse MMM may.5.pdf and emit normalized bullet list</name>
  <files>.planning/phases/01-audit-inventory/_audit-bullets.json, .planning/phases/01-audit-inventory/_pdf-text.txt</files>
  <read_first>
    - /workspace/MMM may.5.pdf (via Python pypdf)
    - /workspace/.planning/phases/01-audit-inventory/01-CONTEXT.md (D-04, D-11, D-12 — granularity, source handling)
  </read_first>
  <action>
    Run Python (pypdf 6.10.2 is preinstalled at system level — verify with `python3 -c "import pypdf; print(pypdf.__version__)"`) to extract every page of `/workspace/MMM may.5.pdf` to plain text. Write the raw extraction to `.planning/phases/01-audit-inventory/_pdf-text.txt` as a debug artifact (commit it; helps Phase 3 cross-checks).

    From that text, produce a normalized JSON file at `.planning/phases/01-audit-inventory/_audit-bullets.json` with this shape:

    ```json
    {
      "source": "MMM may.5.pdf",
      "extracted_at": "<ISO-8601 timestamp>",
      "rounds": [
        {
          "name": "May 5",
          "page_range": [1, N],
          "bullets": [
            {
              "id": "may5-001",
              "page": 1,
              "page_section": "Home" | "Le Moulin" | "Hollywood Hideaway" | "Maison de la Rivière" | "Les Maisons" | "Get in Touch" | "About" | "La Grange" | "Universal" | "Unclassified",
              "verbatim": "<exact quote, copy-paste from PDF text — preserve original capitalization, punctuation, line breaks as ' / '>",
              "is_compound": <true|false — true if the bullet contains 'and' / multiple ask verbs / multiple sentences>
            }
          ]
        },
        { "name": "May 1", ... },
        { "name": "April 30", ... }
      ]
    }
    ```

    Round detection rule: the PDF is layered chronologically with **May 5 on top, then May 1, then April 30** (per CONTEXT.md `<specifics>`). Determine the page-range boundary for each round by scanning the extracted text for round markers (e.g., date headings "April 30", "May 1", "May 5", or visual separators). If round boundaries are ambiguous, document the heuristic in a `// round_detection_note` field at the top of the JSON.

    Page-section classification heuristic per bullet: scan the bullet text for keywords:
      - "home"/"landing"/"hero" + no house name → `Home`
      - "le moulin"/"moulin" + not "moulin à rêves" estate context → `Le Moulin`
      - "hollywood"/"HH"/"hideaway" → `Hollywood Hideaway`
      - "rivière"/"riviere"/"river"/"maison de la" → `Maison de la Rivière`
      - "les maisons"/"three maisons"/"three homes" → `Les Maisons`
      - "contact"/"get in touch"/"join us"/"speak with a concierge" → `Get in Touch`
      - "about"/"history"/"family" → `About`
      - "grange"/"toilet"/"laundry photos" (in la grange context) → `La Grange`
      - applies-everywhere copy/typography/font policy → `Universal`
      - none match → `Unclassified` (will be classified by hand in Task 3)

    Granularity per D-04: ONE entry per parent PDF bullet — DO NOT pre-split compound bullets into atomic actions yet. The atomic split happens in Task 3 when writing AUDIT.md sub-action checkboxes. Mark `is_compound: true` when applicable so Task 3 knows which to split.

    **Verbatim discipline:** Quote the bullet text exactly as it appears in the PDF, including any spelling/punctuation oddities. Use `' / '` as a separator if the bullet wraps across multiple visual lines in the source.

    Target ≥80 parent bullets total across all 3 rounds (the PDF is 12 pages of dense feedback). If the count is dramatically lower (<40), the parser is missing bullets — re-tune the splitter regex.
  </action>
  <verify>
    <automated>
    test -f .planning/phases/01-audit-inventory/_audit-bullets.json && \
    test -f .planning/phases/01-audit-inventory/_pdf-text.txt && \
    python3 -c "import json; d = json.load(open('.planning/phases/01-audit-inventory/_audit-bullets.json')); rounds = d['rounds']; assert len(rounds) == 3, f'expected 3 rounds, got {len(rounds)}'; total = sum(len(r['bullets']) for r in rounds); assert total >= 60, f'expected >=60 bullets total, got {total}'; assert all(b.get('verbatim') and b.get('page') and b.get('page_section') for r in rounds for b in r['bullets']), 'every bullet must have verbatim, page, page_section'; print(f'OK: {total} bullets across 3 rounds')" && \
    git status --porcelain "MMM may.5.pdf" | grep -q "^??" && echo "PDF correctly untracked" || (echo "PDF must NOT be staged" && exit 1)
    </automated>
  </verify>
  <acceptance_criteria>
    - `.planning/phases/01-audit-inventory/_audit-bullets.json` exists with 3 round objects (May 5, May 1, April 30) and ≥60 total parent bullets (target ≥80).
    - Every bullet has non-empty `verbatim`, `page` (integer), and `page_section` (one of the 10 enum values).
    - `_pdf-text.txt` exists with the raw extracted text for downstream cross-checks.
    - `git status --porcelain "MMM may.5.pdf"` shows `??` (untracked) — never staged.
  </acceptance_criteria>
  <done>
    Both artifacts exist, JSON validates, bullet count is reasonable, PDF is still untracked.
  </done>
</task>

<task type="auto">
  <name>Task 2: Cross-reference each bullet against current HEAD code</name>
  <files>.planning/phases/01-audit-inventory/_audit-bullets.json (in-place enrichment)</files>
  <read_first>
    - .planning/phases/01-audit-inventory/_audit-bullets.json (Task 1 output)
    - src/pages/index.astro
    - src/pages/about.astro
    - src/pages/contact.astro
    - src/pages/the-compound.astro
    - src/pages/homes/index.astro
    - src/pages/homes/le-moulin.astro
    - src/pages/homes/hollywood-hideaway.astro
    - src/pages/homes/maison-de-la-riviere.astro
    - src/layouts/BaseLayout.astro (read in chunks — 1810 lines; use grep first, then targeted Read with offset/limit for hits)
    - src/components/PhotoCarousel.astro
    - src/components/RoomShowcase.astro
    - src/components/AmenitiesSection.astro
    - src/content/homes/le-moulin.md
    - src/content/homes/la-grange.md
    - src/content/homes/le-jardin.md
    - src/content/pages/homepage.md
    - src/content/pages/about.md
    - src/content/pages/compound.md
    - src/content/pages/le-moulin.md
    - src/content/pages/hollywood-hideaway.md
    - src/content/pages/maison-de-la-riviere.md
    - public/i18n/translations.json (~3170 lines — grep first for keys, do not full-read)
  </read_first>
  <action>
    For each bullet in `_audit-bullets.json`, locate the relevant file:line in current `HEAD` code and capture the current text. Enrich each bullet object in-place by adding three new fields:

    ```json
    {
      ...existing fields...,
      "code_state": [
        {
          "file": "src/pages/index.astro",
          "line": 142,
          "current_text": "<exact quoted text from the file at that location>"
        }
      ],
      "i18n_keys": ["home.hero.heading", "home.hero.tagline"],
      "search_log": "grep -n 'when you can stay' src/ public/i18n/translations.json → 3 hits"
    }
    ```

    Search strategy per bullet (use Grep with literal patterns for known phrases, then narrow Read with offset/limit):

    1. **Copy bullets** (e.g., "When you can stay" → "Join us!", "sleeps 12 in 10 beds" → "sleeps 10 in 8 beds", "Bonjour" → "Bienvenue!"):
       - `grep -nri "<exact phrase>" src/ public/i18n/translations.json public/admin/config.yml`
       - For every hit, record file + line + the surrounding line as `current_text`.
       - Cross-check `public/i18n/translations.json` for the i18n key whose `en` value matches; record the key in `i18n_keys`.

    2. **Section-removal bullets** (e.g., "remove office block on Le Moulin", "remove Hollywood What's Here 3-photo section"):
       - Grep for the section's heading text or distinctive copy (e.g., `grep -ni "what's here" src/pages/homes/hollywood-hideaway.astro`).
       - If the section IS present in current code → record file:line and quoted heading.
       - If the section is ABSENT → record `"current_text": "<not present in HEAD — likely already removed>"` (Task 3 confirms with git log whether it was ever there).

    3. **Photo-swap bullets** (e.g., "Hollywood lead photo → patio breakfast"):
       - Grep `src/content/pages/hollywood-hideaway.md` and `src/pages/homes/hollywood-hideaway.astro` for current `heroImage` / `lead` / `gallery[0]` paths.
       - Record the current file path/string. Cross-check `scripts/photo-mapping.json` for the source mapping.

    4. **Typography bullets** (italics removal):
       - Grep for `<span class="serif-italic">`, `<em>`, or italicized header markup. Capture file:line of the specific instances called out in the PDF.

    5. **Layout/structural bullets** (e.g., gallery modal X-button, calendar 12-month, dark filter):
       - These are deferred to v2 per CONTEXT.md `<deferred>` and `STATE.md`. Still locate the relevant component file for context (e.g., `PhotoCarousel.astro`, `RoomShowcase.astro`, `AvailabilityCalendar.astro`, `BaseLayout.astro`) and record file path so Task 3 can flag with the v2 deferred annotation per D-14.

    **Use Grep liberally; do NOT re-read full files.** For each grep hit you want to inspect, use `Read` with `offset` and `limit` (e.g., 10 lines around the hit). The CRITICAL RULES section forbids re-reading the same range.

    **Cap effort:** Per D-05, only mark a bullet as code-located when grep produces a confident hit. If no hit is found after a reasonable pattern search (try 2-3 phrasings), record `"code_state": [{"file": null, "line": null, "current_text": "<NOT FOUND — see search_log>"}]` and let Task 3 decide between ✅ (already removed/done in older commit), ❓ (need clarification), or 🔧 (still to do).

    **i18n cross-check (D-08):** For every bullet flagged as a copy edit, also grep `public/i18n/translations.json` for the EN value. If found, record the i18n key in `i18n_keys` so Task 3 can plumb the FR sub-action. If the EN copy is NOT in translations.json (i.e., it's hard-coded in `.astro` only), record `i18n_keys: []` and add `"i18n_status": "hardcoded-no-key-yet"` so Task 3 can flag this as a Phase 2 plumbing concern.

    **Per CRITICAL RULES:** Read each codebase file ONCE. Extract all needed patterns in that pass. Use Grep for additional searches; do not re-Read.
  </action>
  <verify>
    <automated>
    python3 -c "
import json
d = json.load(open('.planning/phases/01-audit-inventory/_audit-bullets.json'))
total = 0; located = 0; copy_with_keys = 0; copy_total = 0
for r in d['rounds']:
    for b in r['bullets']:
        total += 1
        assert 'code_state' in b, f'bullet {b[\"id\"]} missing code_state'
        assert 'i18n_keys' in b, f'bullet {b[\"id\"]} missing i18n_keys'
        if b['code_state'] and b['code_state'][0].get('file'):
            located += 1
        verbatim_lower = b['verbatim'].lower()
        if any(w in verbatim_lower for w in ['copy','italic','word','header','sleeps','says','says ','rename','change','replace','text','label','title']):
            copy_total += 1
print(f'total={total} located={located} ({100*located//total}%)')
assert total > 0
assert located >= total * 0.6, f'expected >=60% bullets to have a file:line hit, got {100*located//total}%'
print('OK')
"
    </automated>
  </verify>
  <acceptance_criteria>
    - Every bullet object has `code_state` (array, may contain a NOT-FOUND record) and `i18n_keys` (array, may be empty).
    - At least 60% of bullets have a concrete `file:line` hit (the rest are NOT-FOUND or layout-deferred — Task 3 will categorize).
    - For every bullet whose verbatim text mentions copy/wording/header text, at least one search of `public/i18n/translations.json` was attempted (record the search in `search_log` even if no hit).
    - `MMM may.5.pdf` remains untracked in git.
  </acceptance_criteria>
  <done>
    `_audit-bullets.json` is enriched with `code_state`, `i18n_keys`, and `search_log` for every bullet; ≥60% file-located.
  </done>
</task>

<task type="auto">
  <name>Task 3: Tag every bullet, detect cross-round conflicts, verify ✅ items via git log</name>
  <files>.planning/phases/01-audit-inventory/_audit-bullets.json (in-place enrichment)</files>
  <read_first>
    - .planning/phases/01-audit-inventory/_audit-bullets.json (Task 2 output)
    - .planning/REQUIREMENTS.md (for v1 ID anchors COPY-01..15, TYPOG-01..03, SECT-01..08, PHOTO-01..03 and v2 IDs STRUCT-01..06, NEW-01..05, AUDIT-DEEP-01..03)
    - .planning/phases/01-audit-inventory/01-CONTEXT.md (D-05, D-06, D-07, D-13, D-14)
  </read_first>
  <action>
    Add new fields to every bullet:

    ```json
    {
      ...existing fields...,
      "tag": "✅" | "🔧" | "❓" | "⚠️",
      "tag_rationale": "<one-line reason — why this tag>",
      "commit_hash": "<7-hex hash if ✅, else null>",
      "rounds_appeared": ["May 5", "May 1", "April 30"],   // from Task 1 — cross-bullet dedupe by verbatim+section
      "v2_deferred": "STRUCT-01" | null,                    // per D-14
      "requirement_id": "COPY-01" | "TYPOG-02" | ... | null,// match against REQUIREMENTS.md when applicable
      "atomic_subactions": [                                // per D-04, only if compound
        { "kind": "en-copy",  "description": "Replace 'When you can stay' with 'Join us!' in src/layouts/BaseLayout.astro:127" },
        { "kind": "fr-copy",  "description": "Update translations.json key 'home.availability.heading' fr value to 'Rejoignez-nous!'" },
        { "kind": "v2-defer", "description": "Forward arrow cut-off → STRUCT-01" }
      ],
      "clarification_question": "<specific question for Phase 3 if tag = ❓ or ⚠️, else null>",
      "conflict_note": "<round contradiction text if tag = ⚠️, else null>"
    }
    ```

    **Tagging algorithm (D-13 + D-05):**

    1. **✅ Already Done** — assign ONLY if BOTH conditions hold:
       (a) Task 2 found a `code_state` showing the requested change is in current `HEAD` (e.g., `When you can stay` is no longer in any file, OR `sleeps: 10` appears in `src/content/homes/le-moulin.md` frontmatter).
       (b) `git log --oneline --all -- <file>` (run via Bash) returns a commit that plausibly landed the change. Cite the SHORTEST commit hash (7 hex chars) in `commit_hash`.

       For section-removal bullets where the section is NOT present in HEAD: confirm with `git log --diff-filter=D --oneline -- <expected_path>` or `git log -S "<removed phrase>" --oneline` to find the deleting commit. If no commit is found but the section is provably absent, mark ✅ with `commit_hash: null` AND add a note in `tag_rationale` ("absent in HEAD; deletion commit not located").

       Reference the COMPLETE commit list in `<commits_to_verify>` above as the high-prior set. The list now includes the previously-missed editorial PR commits (0ef4dc8, d6d95d4, 1a658c2, d626c4b, f5579e8, ddbfc9b, e50f118, 333254d, 111cf9b, 8b002c9, b7a2f19, 4b10384, cc3ac01, d120aed, 73fcd9e, 9476f6c, 4819a7d, 7109a08, 450c6a9) — these are the commits most likely to surface ✅ tags the original list missed.

    2. **🔧 Clear-to-Ship** — assign when:
       - The current code clearly does NOT match the request (e.g., `When you can stay` still appears in 3 files), AND
       - The change is unambiguous (no design judgment needed), AND
       - It maps to a v1 requirement ID (COPY-XX / TYPOG-XX / SECT-XX / PHOTO-XX). Set `requirement_id` accordingly.

    3. **❓ Needs Clarification** — assign when:
       - The request is ambiguous, references missing assets ("jacuzzi photos", "Stars Who Stayed Here photos", "Monet Giverny image", "Netflix on TV"), or asks a yes/no question without enough context.
       - REQUIRED: write `clarification_question` as a SPECIFIC, answerable question that includes file context. Example: "On `src/pages/homes/hollywood-hideaway.astro:84`, the hero currently says '<current text>'. Do you want this changed to <X>, <Y>, or <Z>?"

    4. **⚠️ Cross-round Conflict** — assign when the same bullet (or semantically equivalent bullets) appear with DIFFERENT instructions across rounds. Newest round wins (May 5 > May 1 > April 30). Examples from CONTEXT.md `<specifics>`:
       - "Join us!" (May 5) vs "When would you like to visit?" (April 30 on Riviere page)
       - Italics universal-policy contradictions across rounds
       - Le Mérévillois vs Méréville commune naming variations
       - "Bonjour!" CTA in commit e50f118 (#38) vs "Bienvenue!" requested in COPY-10 — verify whether this cross-round conflict materializes against current HEAD

       Set `conflict_note` to describe both versions and which round wins.

    **Cross-round dedupe step:** Before tagging, scan the JSON for bullets whose `verbatim` text is semantically equivalent across rounds. Use a normalized lowercase fuzzy comparison — compute `key = re.sub(r'\W+', '', verbatim.lower())[:60]` per bullet. Group equivalents into a single representative bullet and merge their `rounds_appeared` arrays. Do NOT delete duplicates outright; preserve the round-history for the audit trail. After dedupe, only one row per concept will be written to AUDIT.md (Task 4). The Task 3 verify gate enforces this dedupe algorithmically.

    **v2 deferral (D-14):** Cross-reference REQUIREMENTS.md `## v2 Requirements`:
       - "gallery modal X-button / forward arrow / bottom crop" → `v2_deferred: "STRUCT-01"`
       - "calendar 12 months" → `STRUCT-02`
       - "Discover the Area split" → `STRUCT-03`
       - "Google Maps embed" → `STRUCT-04`
       - "We Make It Easy" / "Dogs Welcome" / "Make your life a masterpiece" / "Stars Who Stayed Here" / "gardens-as-individual-galleries" → `NEW-01..05`
       - "editor flow / mobile / perf-SEO audit" → `AUDIT-DEEP-01..03`

    The parent bullet still gets the appropriate ✅/🔧/❓/⚠️ tag (per D-14: tag is for the parent, deferral is a separate flag for downstream agents).

    **Atomic sub-actions (D-04, D-09):** For every bullet where `is_compound: true` OR where the bullet implies multiple discrete edits, populate `atomic_subactions[]`. CRITICAL per D-09: when a copy change needs both EN and FR, list TWO sub-actions (one for the `.astro`/`.md` file, one for `translations.json`) so Phase 2 ships both atomically.

    **Use Bash for git log lookups.** Sample commands:
    - `git log --oneline -- src/pages/homes/le-moulin.astro | head -20`
    - `git log --oneline -S "sleeps 12" -- src/content/homes/le-moulin.md`
    - `git log --diff-filter=D --oneline -- src/components/<deleted>.astro`
  </action>
  <verify>
    <automated>
    python3 -c "
import json, re
d = json.load(open('.planning/phases/01-audit-inventory/_audit-bullets.json'))
allowed_tags = {'✅', '🔧', '❓', '⚠️'}
total = 0; done = 0; clear = 0; clar = 0; conflict = 0
done_with_hash = 0; clar_with_q = 0; conflict_with_note = 0
bullets = []
for r in d['rounds']:
    for b in r['bullets']:
        bullets.append({**b, 'round': r['name']})
        total += 1
        tag = b.get('tag')
        assert tag in allowed_tags, f'bullet {b[\"id\"]} has invalid tag: {tag!r}'
        if tag == '✅':
            done += 1
            ch = b.get('commit_hash')
            if ch:
                assert re.match(r'^[0-9a-f]{7,40}\$', ch), f'bullet {b[\"id\"]} bad commit_hash: {ch}'
                done_with_hash += 1
            else:
                rat = (b.get('tag_rationale') or '').lower()
                assert 'absent' in rat or 'not located' in rat or 'before' in rat, f'bullet {b[\"id\"]} ✅ without hash needs rationale'
        elif tag == '🔧': clear += 1
        elif tag == '❓':
            clar += 1
            q = b.get('clarification_question') or ''
            assert '?' in q and len(q) > 20, f'bullet {b[\"id\"]} ❓ needs a real question'
            clar_with_q += 1
        elif tag == '⚠️':
            conflict += 1
            assert (b.get('conflict_note') or '').strip(), f'bullet {b[\"id\"]} ⚠️ missing conflict_note'
            conflict_with_note += 1

# Cross-round dedupe gate: no two bullets from different rounds should share
# the same normalized verbatim prefix unless flagged ⚠️ or rounds_appeared has length >= 2
def norm(s): return re.sub(r'\W+', '', s.lower())[:60]
seen = {}
for b in bullets:
    key = norm(b['verbatim'])
    if key in seen:
        prev = seen[key]
        # If both survived, at least one MUST be ⚠️ OR have rounds_appeared >= 2
        ok = (b.get('tag') == '⚠️' or prev.get('tag') == '⚠️'
              or len(b.get('rounds_appeared', [b['round']])) >= 2
              or len(prev.get('rounds_appeared', [prev['round']])) >= 2)
        assert ok, f\"Cross-round duplicate not deduped: '{b['verbatim'][:50]}' in rounds {b['round']} and {prev['round']}\"
    seen[key] = b

print(f'total={total}: ✅={done} (with hash: {done_with_hash}) 🔧={clear} ❓={clar} ⚠️={conflict}')
assert total > 0 and done > 0 and clear > 0
print('OK')
"
    </automated>
  </verify>
  <acceptance_criteria>
    - Every bullet has `tag` ∈ {✅, 🔧, ❓, ⚠️}.
    - Every ✅ bullet has either a 7-40 hex `commit_hash` OR a `tag_rationale` explaining why no hash was located.
    - Every ❓ bullet has a `clarification_question` containing `?` and ≥20 chars.
    - Every ⚠️ bullet has a non-empty `conflict_note`.
    - At least one bullet exists per tag category (sanity check that the tagging covered the spectrum).
    - At least the recent-photo-batch commits (742fb89, ab1ac5d, 8bd51b9, fd8e979, ad07395) are cited on at least one ✅ bullet each.
    - Cross-round dedupe gate passes: no normalized-verbatim collision between rounds without ⚠️ tag or merged `rounds_appeared`.
  </acceptance_criteria>
  <done>
    Every bullet tagged with full justification fields; ✅ items cite commits per D-06/D-07; ❓ items have specific questions per AUDIT-03; ⚠️ items document the contradiction per D-13; cross-round dedupe enforced.
  </done>
</task>

<task type="auto">
  <name>Task 4: Write AUDIT.md from the enriched JSON</name>
  <files>.planning/phases/01-audit-inventory/AUDIT.md</files>
  <read_first>
    - .planning/phases/01-audit-inventory/_audit-bullets.json (Task 3 output, fully enriched)
    - .planning/phases/01-audit-inventory/01-CONTEXT.md (D-02, D-03, D-04 — grouping order, row schema, hybrid granularity)
  </read_first>
  <action>
    Write `.planning/phases/01-audit-inventory/AUDIT.md` directly from the enriched JSON. Use Write (NEVER cat/heredoc — see CRITICAL RULES).

    **Document structure:**

    ```markdown
    # AUDIT — MMM may.5.pdf vs current code (HEAD)

    **Source:** `MMM may.5.pdf` (project root, untracked) — 3 rounds: April 30, May 1, May 5
    **Generated:** <ISO-8601 date>
    **Compiled at HEAD:** <output of `git rev-parse --short HEAD`>
    **Total parent bullets:** <N>  (✅ <a>  /  🔧 <b>  /  ❓ <c>  /  ⚠️ <d>)

    ## How to read this document

    Each row is one parent bullet from the PDF, quoted verbatim. Tags:
    - ✅ **Already Done** — verified in current HEAD; commit hash cited
    - 🔧 **Clear-to-Ship** — unambiguous, ready for Phase 2 atomic commit
    - ❓ **Needs Clarification** — routes to Phase 3's CLIENT-CLARIFICATION.md
    - ⚠️ **Cross-round Conflict** — newest round wins; flagged for client confirmation

    Compound bullets are split into atomic sub-actions as nested checkboxes.

    ## Table of contents

    - [Universal](#universal)
    - [Home](#home)
    - [Le Moulin](#le-moulin)
    - [Hollywood Hideaway](#hollywood-hideaway)
    - [Maison de la Rivière](#maison-de-la-rivi%C3%A8re)
    - [Les Maisons](#les-maisons)
    - [Get in Touch](#get-in-touch)
    - [About](#about)
    - [La Grange](#la-grange)
    - [Summary statistics](#summary-statistics)

    ---

    ## Universal

    ### "<verbatim PDF bullet quote>"

    - **Tag:** 🔧 Clear-to-Ship
    - **Source:** `MMM may.5.pdf` p.7 (May 5 round)
    - **Rounds appeared:** May 5, May 1, April 30  ← repeat-flag (high-priority client signal)
    - **Requirement:** COPY-01
    - **Current code state:**
      - `src/layouts/BaseLayout.astro:127` — current text: `"When you can stay"`
      - `public/i18n/translations.json` key `home.availability.heading` — `en: "When you can stay"`, `fr: "Quand vous pouvez séjourner"`
    - **Atomic sub-actions:**
      - [ ] Replace `"When you can stay"` → `"Join us!"` in `src/layouts/BaseLayout.astro:127`
      - [ ] Update `home.availability.heading` in `public/i18n/translations.json` (en: `"Join us!"`, fr: `"Rejoignez-nous!"`)
      - [ ] (Repeat for `src/pages/index.astro`, `src/pages/contact.astro`, `src/pages/homes/*.astro` — confirm all 3 hits)
    - **i18n:** EN+FR both update (D-09)

    ### "<another verbatim>"

    - **Tag:** ✅ Already Done — `Done in 8bd51b9` (catering Pâtisseries section)
    - **Source:** `MMM may.5.pdf` p.4 (May 5 round)
    - **Current code state:** `src/pages/catering.astro:N` — Pâtisseries section present
    - **Note:** Client may not have noticed this shipped on 2026-05-05.

    ---

    ## Home

    [...rows in same format...]

    ---

    ## Le Moulin

    [...]

    ## Summary statistics

    | Tag | Count |
    |-----|-------|
    | ✅ Already Done | <N> |
    | 🔧 Clear-to-Ship | <N> |
    | ❓ Needs Clarification | <N> |
    | ⚠️ Cross-round Conflict | <N> |
    | **Total parent bullets** | **<N>** |

    ### v2-deferred items

    | Bullet | v2 ID |
    |--------|-------|
    | "<truncated bullet>" | STRUCT-01 |
    | ... | ... |

    ### Requirement coverage

    | Requirement | Bullet count |
    |-------------|--------------|
    | COPY-01 | 1 |
    | COPY-02 | 1 |
    | ... | ... |
    ```

    **Strict adherence to D-02 (page order):** Sections MUST appear in this exact order — `Universal` → `Home` → `Le Moulin` → `Hollywood Hideaway` → `Maison de la Rivière` → `Les Maisons` → `Get in Touch` → `About` → `La Grange`. Any "Unclassified" bullets from Task 1 must be hand-classified into one of these nine sections during this task (or assigned to `Universal` if they truly cross-cut).

    **Strict adherence to D-03 (row schema):** Every parent-bullet row contains, in order:
    1. The PDF-bullet quote as an `### "<quote>"` heading
    2. `**Tag:** <emoji> <category>` (and commit hash if ✅)
    3. `**Source:** MMM may.5.pdf p.<N> (<round> round)`
    4. `**Rounds appeared:** <list>` (cross-round annotation per D-12)
    5. `**Requirement:** <ID>` (when applicable)
    6. `**Current code state:**` block with file:line + quoted text
    7. `**Atomic sub-actions:**` checkbox list (only if compound, per D-04)
    8. `**Conflict note:** ...` (only if ⚠️)
    9. `**Question:** ...` (only if ❓)
    10. `**Note:** ...` (free-form, e.g., v2-deferred annotation per D-14)

    **Sub-section ordering within each page section** (per CONTEXT.md `<decisions>` Claude's Discretion): Copy → Typography → Sections → Photos → Layout → Behavior. Use `### Copy`, `### Typography`, etc. as h3 dividers ABOVE the bullet quotes WITHIN each page section, OR omit if a page has only 1-2 bullets.

    **i18n footnote on every COPY/TYPOG row:** either list the EN+FR sub-actions (D-09) or write `_i18n: no FR change required (structural-only edit per D-10)_`.

    **No bullets dropped:** Every bullet from `_audit-bullets.json` MUST appear in AUDIT.md exactly once, after cross-round dedupe (the deduped representative gets one row; its `rounds_appeared` array tells the reader the bullet was repeated).

    **Verbatim quotes preserved:** Use the exact `verbatim` field from JSON inside the `### "..."` heading. If the PDF text contains characters that would break Markdown headings (e.g., trailing colons), wrap in plain quotes but keep the inner content intact.
  </action>
  <verify>
    <automated>
    test -f .planning/phases/01-audit-inventory/AUDIT.md && \
    python3 -c "
import re
md = open('.planning/phases/01-audit-inventory/AUDIT.md').read()
# D-02 ORDERED section verification — positions, not just count
order = ['Universal','Home','Le Moulin','Hollywood Hideaway','Maison de la Rivière','Les Maisons','Get in Touch','About','La Grange']
positions = []
for s in order:
    pos = md.find(f'## {s}')
    if pos == -1:
        raise AssertionError(f'Section \"## {s}\" missing — D-02 order requires all 9 sections')
    positions.append(pos)
assert positions == sorted(positions), f'Sections out of D-02 order: positions={positions}'
print('OK: 9 sections present in D-02 order')
# count parent rows (### \"...\" headings)
rows = re.findall(r'^### \".+?\"', md, re.M)
print(f'parent rows: {len(rows)}')
assert len(rows) >= 50, f'expected >=50 parent rows in AUDIT.md, got {len(rows)}'
# every row must have a Tag line
for q in rows:
    pos = md.index(q)
    chunk = md[pos:pos+1500]
    assert '**Tag:**' in chunk, f'row missing Tag: {q[:80]}'
    assert '**Source:** ' in chunk and 'MMM may.5.pdf' in chunk, f'row missing Source: {q[:80]}'
print('every row has Tag + Source')
# count tags
done = len(re.findall(r'\*\*Tag:\*\* ✅', md))
clear = len(re.findall(r'\*\*Tag:\*\* 🔧', md))
clar = len(re.findall(r'\*\*Tag:\*\* ❓', md))
conflict = len(re.findall(r'\*\*Tag:\*\* ⚠️', md))
print(f'tags: ✅={done} 🔧={clear} ❓={clar} ⚠️={conflict}')
assert done + clear + clar + conflict == len(rows), 'tag count mismatch'
# every ✅ has a commit hash near the tag (within 200 chars)
done_blocks = re.findall(r'\*\*Tag:\*\* ✅[^#]{0,400}', md)
no_hash = [b for b in done_blocks if not re.search(r'[0-9a-f]{7,40}', b) and 'absent' not in b.lower() and 'not located' not in b.lower()]
assert not no_hash, f'{len(no_hash)} ✅ rows missing commit hash and rationale'
print('every ✅ row has hash or rationale')
"
    </automated>
  </verify>
  <acceptance_criteria>
    - `AUDIT.md` exists at canonical path.
    - Contains all 9 page sections, IN D-02 ORDER (positional verification, not just count).
    - Has ≥50 parent-bullet rows (matches dedupe output from Task 3).
    - Every row has `**Tag:**` and `**Source:** MMM may.5.pdf p.N`.
    - Every ✅ row contains a 7-40 hex commit hash OR an explicit "absent / not located" rationale.
    - Has a Summary statistics section with tag counts.
    - Includes a v2-deferred items table referencing v2 IDs (STRUCT-01 etc.) when applicable.
    - Includes a Requirement coverage table mapping bullets to v1 requirement IDs.
  </acceptance_criteria>
  <done>
    AUDIT.md is the complete contract for Phase 2 and Phase 3 — readable end-to-end, organized by page in D-02 order, every bullet tagged.
  </done>
</task>

<task type="auto">
  <name>Task 5: Self-verify AUDIT.md against goal-backward truths</name>
  <files>.planning/phases/01-audit-inventory/AUDIT.md (read-only check; only modified if gaps found)</files>
  <read_first>
    - .planning/phases/01-audit-inventory/AUDIT.md (Task 4 output)
    - .planning/phases/01-audit-inventory/_audit-bullets.json (for cross-check)
  </read_first>
  <action>
    Run a series of grep-verifiable checks corresponding to the `must_haves.truths` in this plan's frontmatter. For any failure, fix AUDIT.md in place (or update upstream JSON + re-run Task 4 logic) BEFORE returning success. Document each check + result in the SUMMARY.

    **Check 1 — All 9 page sections present, in D-02 ORDER:**
    Use a Python positional check (NOT a count check): find each `## <section>` heading and assert that positions are monotonically increasing in the D-02 order. See the verify block below for the exact code.

    **Check 2 — Tag taxonomy is exclusive (D-13):**
    `grep -E '\*\*Tag:\*\* ' AUDIT.md | grep -vE '\*\*Tag:\*\* (✅|🔧|❓|⚠️) ' | wc -l`
    Must equal 0. Anything else means a non-canonical tag slipped in.

    **Check 3 — Every ✅ row cites a commit (D-06/D-07):**
    Use Python:
    ```python
    import re
    md = open('.planning/phases/01-audit-inventory/AUDIT.md').read()
    done_chunks = re.findall(r'\*\*Tag:\*\* ✅[^#]+', md)
    bad = [c for c in done_chunks if not re.search(r'[0-9a-f]{7,40}', c) and not re.search(r'absent|not located|before HEAD', c, re.I)]
    assert not bad, f'{len(bad)} ✅ rows lack hash/rationale'
    ```

    **Check 4 — Every ❓ row has a real question (AUDIT-03):**
    Find every chunk after `**Tag:** ❓` up to the next `### ` heading and confirm it contains `**Question:**` (or `**Clarification:**`) followed by a sentence ending in `?` with at least one file path or quoted current text.

    **Check 5 — Every ⚠️ row has a conflict_note + rounds (D-13):**
    Find every chunk after `**Tag:** ⚠️` and confirm it contains `**Conflict note:**` AND `**Rounds appeared:**` listing ≥2 rounds.

    **Check 6 — i18n discipline (D-08/D-09/D-10) — IMPLEMENTED in Python verify block:**
    For every 🔧 or ❓ row whose verbatim text references copy/wording (regex below), assert the row body contains EITHER a `translations.json` sub-action OR the literal phrase `no FR change required`. This is now an automated grep-and-assert gate, not just a manual reminder. See verify block below for the exact code.

    **Check 7 — All high-prior commits considered (AUDIT-02):**
    For every PR-numbered commit in `<commits_to_verify>` whose subject contains one of [join us, bonjour, address, le moulin, hollywood, laundry, modal, lightbox, gallery, photo width, hero, tagline, rename]:
    - The commit MUST have been considered for at least one ✅ tag in AUDIT.md.
    - Algorithm: grep AUDIT.md for the relevant copy substring (e.g., "join us", "le moulin", "address"); if found and tagged ✅, the commit is cited; if found and tagged anything else, raise a warning to the SUMMARY.
    - Verify block automates this against the explicit hash list.

    **Check 8 — PDF stays untracked (D-11):**
    `git status --porcelain "MMM may.5.pdf"` must return `??` (untracked) — never `A `, `M `, or empty.

    **Check 9 — Coverage: every JSON bullet → AUDIT.md row (after dedupe):**
    Use Python to load `_audit-bullets.json`, dedupe by (verbatim normalized + page_section), and confirm each unique bullet's verbatim text appears in AUDIT.md (substring match on the first 60 chars).

    **Check 10 — Bullet count sanity:**
    Total parent rows in AUDIT.md ≥ 50. Total summary-stats sum equals row count.

    **If any check fails:**
    - Document the failure in the SUMMARY.
    - Fix AUDIT.md directly via Edit (small fixes) OR re-run Task 4 generation (large structural fixes).
    - Re-run all checks until all pass.
  </action>
  <verify>
    <automated>
    set -e
    cd /workspace
    # Check 2: tag taxonomy exclusive (bash-side, before Python)
    BADTAG=$(grep -E '\*\*Tag:\*\* ' .planning/phases/01-audit-inventory/AUDIT.md | grep -vE '\*\*Tag:\*\* (✅|🔧|❓|⚠️)( |$)' | wc -l)
    [ "$BADTAG" -eq 0 ] || (echo "FAIL: $BADTAG non-canonical tag rows" && exit 1)
    # Checks 1, 3, 4, 5, 6, 7, 9, 10 via python
    python3 - <<'PY'
import re, json
md = open('.planning/phases/01-audit-inventory/AUDIT.md').read()

# Check 1: D-02 ORDERED section verification (positions, not count)
order = ['Universal','Home','Le Moulin','Hollywood Hideaway','Maison de la Rivière','Les Maisons','Get in Touch','About','La Grange']
positions = []
for s in order:
    pos = md.find(f'## {s}')
    if pos == -1:
        raise AssertionError(f'Section "## {s}" missing — D-02 order requires all 9 sections')
    positions.append(pos)
assert positions == sorted(positions), f'Sections out of D-02 order: positions={positions}'

rows = re.findall(r'^### \".+?\"', md, re.M)
assert len(rows) >= 50, f'FAIL: only {len(rows)} parent rows'
# split into per-row chunks
chunks_text = re.split(r'(?=^### \".+?\")', md, flags=re.M)[1:]

# Build per-chunk dict for Check 6
chunks = []
for ct in chunks_text:
    anchor_m = re.search(r'^### (\".+?\")', ct, re.M)
    tag_m = re.search(r'\*\*Tag:\*\* (✅|🔧|❓|⚠️)', ct)
    chunks.append({
        'anchor': anchor_m.group(1) if anchor_m else ct[:60],
        'verbatim': anchor_m.group(1) if anchor_m else '',
        'tag': tag_m.group(1) if tag_m else None,
        'body': ct,
    })

# Checks 3, 4, 5
for ch in chunks:
    tag = ch['tag']
    body = ch['body']
    assert tag, f'FAIL: row has no tag: {body[:100]}'
    if tag == '✅':
        assert re.search(r'[0-9a-f]{7,40}', body) or re.search(r'absent|not located|before HEAD', body, re.I), f'FAIL: ✅ row lacks hash/rationale: {body[:120]}'
    if tag == '❓':
        assert '?' in body and re.search(r'\*\*Question:\*\*|\*\*Clarification:\*\*', body), f'FAIL: ❓ row lacks Question: {body[:120]}'
    if tag == '⚠️':
        assert re.search(r'\*\*Conflict note:\*\*', body) and re.search(r'\*\*Rounds appeared:\*\*', body), f'FAIL: ⚠️ row missing conflict/rounds: {body[:120]}'

# Check 6: i18n discipline (D-08, D-09, D-10) — every copy/typography 🔧 or ❓ row must
# either link a translations.json sub-action or explicitly note "no FR change required"
copy_keywords = re.compile(r'(quotes?|italic|says|rename|header|label|footer|hero|tagline|subheader|caption|microcopy|join us|bonjour|bienvenue|come and (see|visit)|sleep|address|paris|moulin|hideaway|maison)', re.I)
violations_check6 = []
for chunk in chunks:
    if chunk['tag'] not in ['🔧', '❓']:
        continue
    if not copy_keywords.search(chunk['verbatim']):
        continue  # not a copy row
    if 'translations.json' not in chunk['body'] and 'no FR change required' not in chunk['body']:
        violations_check6.append(chunk['anchor'])
assert not violations_check6, f"Check 6 (i18n discipline) failed for {len(violations_check6)} copy rows: {violations_check6[:5]}"

# Check 7: high-prior commits considered. For each PR-numbered commit whose subject contains
# a known client-feedback keyword, the corresponding copy substring MUST appear in AUDIT.md
# AND be tagged ✅. If found and tagged otherwise, raise a warning (non-fatal).
high_prior = [
    # (hash, copy_substring_to_grep, lower-case)
    ('0ef4dc8',  'join us'),       # rename "When You Can Stay" → "Join us"
    ('d6d95d4',  'tell us your dates'),  # remove hero subheader
    ('1a658c2',  'laundry'),       # drop HH laundry photos
    ('d626c4b',  'modal'),         # room modal viewport fix
    ('f5579e8',  'lightbox'),      # cream lightbox background
    ('ddbfc9b',  'hollywood hideaway'),  # HH photo width parity
    ('e50f118',  'bonjour'),       # CTA bonjour (potentially conflicts with Bienvenue)
    ('333254d',  'le moulin'),     # rename Moulin à Rêves → Le Moulin
    ('111cf9b',  'address'),       # canonicalize address
    ('8b002c9',  'tagline'),       # remove tagline under hero
    ('b7a2f19',  'stats'),         # stats intro line
    ('4b10384',  'les maisons'),   # tighten Les Maisons spacing
    ('cc3ac01',  'les maisons'),   # editorial pass — split layout
    ('d120aed',  'compound'),      # compound copy editorial
    ('73fcd9e',  'discover the area'),   # white background
]
md_lower = md.lower()
warnings = []
for h, substr in high_prior:
    if substr.lower() not in md_lower:
        warnings.append(f'commit {h}: "{substr}" not found in AUDIT.md — possible coverage gap')
        continue
    # Found. Check whether it appears in a ✅ block. Locate first occurrence and walk back to nearest Tag line.
    idx = md_lower.find(substr.lower())
    preceding = md[max(0, idx-1500):idx]
    last_tag = None
    for m in re.finditer(r'\*\*Tag:\*\* (✅|🔧|❓|⚠️)', preceding):
        last_tag = m.group(1)
    if last_tag != '✅':
        warnings.append(f'commit {h}: "{substr}" found but tagged {last_tag} (expected ✅ — it shipped in {h})')
if warnings:
    print('WARNINGS (non-fatal but document in SUMMARY):')
    for w in warnings:
        print(f'  - {w}')

# Check 9: every JSON bullet appears in AUDIT.md (after dedupe by lower+strip)
data = json.load(open('.planning/phases/01-audit-inventory/_audit-bullets.json'))
seen = set()
for r in data['rounds']:
    for b in r['bullets']:
        key = re.sub(r'\s+', ' ', b['verbatim'].lower().strip())[:60]
        seen.add(key)
md_lower = re.sub(r'\s+', ' ', md.lower())
missing = [k for k in seen if k not in md_lower]
miss_ratio = len(missing) / max(len(seen), 1)
assert miss_ratio < 0.10, f'FAIL: {len(missing)} of {len(seen)} bullets missing from AUDIT.md ({miss_ratio:.1%})'

print(f'OK: {len(rows)} rows; D-02 order verified; i18n discipline enforced ({len(violations_check6)} violations); {len(warnings)} commit-coverage warnings; {miss_ratio:.1%} bullets dropped (within 10% dedupe tolerance)')
PY
    # Check 8: PDF still untracked
    git status --porcelain "MMM may.5.pdf" | grep -q '^??' || (echo "FAIL: MMM may.5.pdf is staged/tracked" && exit 1)
    echo "ALL CHECKS PASSED"
    </automated>
  </verify>
  <acceptance_criteria>
    - All 10 checks pass; Check 8 specifically protects D-11 (PDF stays untracked).
    - Check 1 verifies D-02 section ORDER (positional), not just count.
    - Check 6 (i18n discipline) is implemented as automated Python grep-and-assert.
    - Check 7 covers ALL high-prior PR-numbered commits (the broader list, not just the 6 photo-batch hashes).
    - If any check failed, the iteration log appears in SUMMARY.md describing what was wrong and how it was fixed.
    - <10% bullet drop rate from JSON to AUDIT.md (dedupe tolerance).
  </acceptance_criteria>
  <done>
    All goal-backward truths from `must_haves` are verified by passing automated checks (including the formerly-claimed-but-not-implemented Check 6).
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

This phase produces ZERO user-facing site code, ZERO API endpoints, and ZERO new runtime surface. The single output is a Markdown analysis document inside `.planning/`, plus an intermediate JSON working artifact (also inside `.planning/`). No new code paths consume untrusted input, no new auth flows, no new data writes.

| Boundary | Description |
|----------|-------------|
| `MMM may.5.pdf` (project root, untracked) → `pypdf` reader → in-memory text | The PDF is from a trusted source (the property owner's compiled feedback). It never reaches production runtime. The risk surface is at most a transient process reading a local file we ourselves placed there. |
| Local filesystem write → `.planning/phases/01-audit-inventory/AUDIT.md` | Writing to a planning-only path; not deployed by Vercel; not in any served route. `astro.config.mjs` only ships from `dist/` and `public/`. |
| Local filesystem write → `.planning/phases/01-audit-inventory/_audit-bullets.json` | Same as above. Working artifact, planning-only. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-01 | Information Disclosure | `MMM may.5.pdf` accidentally committed to git | mitigate | Task 1, Task 2, Task 5 verify gates each run `git status --porcelain "MMM may.5.pdf"` and fail unless the file is untracked (`??`). D-11 is the locked decision; this enforces it programmatically. |
| T-01-02 | Information Disclosure | Verbatim client copy and current code text quoted in `AUDIT.md` (committed) | accept | Phase 2 + Phase 3 require this content to function. The repo is the team's working space; client copy is not secret (it lives on the public site). No PII; no credentials. ASVS L1 N/A. |
| T-01-03 | Tampering | `pypdf` parsing produces malformed JSON, downstream Tasks 2-5 silently produce wrong audit | mitigate | Task 1 verify gate validates JSON shape (3 rounds, ≥60 bullets, every bullet has verbatim+page+page_section). Task 5 cross-checks JSON-to-AUDIT.md coverage. Failure is loud, not silent. |
| T-01-04 | Repudiation | Future review can't tell which commit landed which audit decision | mitigate | The phase commit message will reference all artifacts; `_audit-bullets.json` is committed alongside `AUDIT.md` so the chain of evidence (PDF text → JSON → MD) is reproducible from git history alone. |
| T-01-05 | Spoofing / Elevation of Privilege | N/A | N/A | No new auth, no new endpoints, no new identity surface. |
| T-01-06 | Denial of Service | N/A | N/A | No new runtime. AUDIT.md generation is a one-shot local task, not deployed. |

ASVS L1 applicability: this phase has no production code change, so L1 controls (input validation, output encoding, auth, session) do not apply. The two real risks are the data-exposure of the source PDF (T-01-01, mitigated by the verify gate) and parser correctness (T-01-03, mitigated by JSON shape checks).
</threat_model>

<verification>
The phase is complete when ALL of the following hold simultaneously:

1. `.planning/phases/01-audit-inventory/AUDIT.md` exists at the canonical path.
2. `.planning/phases/01-audit-inventory/_audit-bullets.json` exists alongside it (working artifact).
3. `.planning/phases/01-audit-inventory/_pdf-text.txt` exists (raw extraction debug artifact).
4. All Task 5 self-verification checks pass.
5. `MMM may.5.pdf` is still untracked (`git status --porcelain "MMM may.5.pdf"` returns `^??`).
6. The phase commit (when this plan ships) includes all three planning-dir artifacts and does NOT include the PDF.

Phase 2 and Phase 3 planners can read AUDIT.md and immediately know what to ship and what to ask without re-reading the PDF.
</verification>

<success_criteria>
- AUDIT-01: ≥95% of PDF parent bullets (post-dedupe) categorized with one of the four locked tags. Tracked by Task 5 Check 9 (allowed drop: <10%).
- AUDIT-02: All high-prior PR-numbered commits in `<commits_to_verify>` (not only the 6 photo-batch hashes) considered against AUDIT.md and cited as `Done in <hash>` where the corresponding copy/structural change is present in HEAD. Tracked by Task 5 Check 7 (warnings logged for any miss).
- AUDIT-03: Every ❓ row has a specific, file-anchored question. Tracked by Task 5 Check 4.
- D-02: Page-section ORDER (positional, not just count) verified. Tracked by Task 4 verify + Task 5 Check 1.
- D-11: Source PDF NEVER staged. Tracked by Task 1, Task 2, Task 5 Check 8.
- D-13: Tag taxonomy strictly enforced. Tracked by Task 5 Check 2.
- D-06/D-07: Every ✅ row carries a commit hash or an explicit "absent / not located" rationale. Tracked by Task 5 Check 3.
- D-08/D-09/D-10 (i18n discipline): Tracked by Task 2 `i18n_keys` field, Task 3 atomic_subactions splits, AND Task 5 Check 6 grep-and-assert gate (implemented in Python verify block).
</success_criteria>

<output>
After all tasks complete and verification passes, create `.planning/phases/01-audit-inventory/01-01-SUMMARY.md` describing:

1. **Outcome:** total parent bullets, tag distribution (✅/🔧/❓/⚠️), v2-deferred count, recent-commit citation count, Check 7 commit-coverage warnings (if any).
2. **Surprises:** any bullets that flipped tag during cross-reference (e.g., "thought it was Clear-to-Ship, found it Already Done in 333254d"), any cross-round contradictions discovered, any high-frustration items (repeated across all 3 rounds), any commits in `<commits_to_verify>` that surprised by addressing items the original 10-commit list missed.
3. **Self-verification log:** which Task 5 checks passed on first run, which required iteration, what was fixed.
4. **Inputs to Phase 2:** count of 🔧 rows, grouped by requirement ID (so Phase 2 planner can size atomic commits).
5. **Inputs to Phase 3:** count of ❓ rows + ⚠️ rows + already-done items the client may not have noticed (so Phase 3 planner can size CLIENT-CLARIFICATION.md).
6. **Files committed:** AUDIT.md, _audit-bullets.json, _pdf-text.txt, 01-01-SUMMARY.md. Confirm MMM may.5.pdf remains untracked.
</output>
</content>
</invoke>