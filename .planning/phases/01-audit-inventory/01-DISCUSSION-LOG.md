# Phase 1: Audit & Inventory - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 1-Audit & Inventory
**Areas discussed:** Item granularity, i18n coverage, "Already Done" verification rigor, Inventory structure

---

## Item granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid | One parent row per PDF bullet, with sub-actions as atomic children. Preserves source traceability + enables Phase 2 to ship sub-actions independently. | ✓ |
| Atomic only | Split every compound item into separate rows. Loses parent-bullet context but cleanest Phase 2 input. | |
| As-is | Keep PDF bullets one-to-one. Phase 2 has to parse them — slower. | |

**User's choice:** Hybrid (Recommended)
**Notes:** Preserves the verbatim bullet so Phase 3 can quote the client back to herself, while atomic children give Phase 2 a clean ship list.

---

## i18n coverage

| Option | Description | Selected |
|--------|-------------|----------|
| EN + flag FR | Audit English copy in pages/components/content. Cross-check translations.json for each copy edit — flag missing FR translations as separate atomic action items in Phase 2. | ✓ |
| EN only | Audit English. Phase 2 ships English, leaves translations.json out-of-sync. Risky — client uses FR toggle. | |
| EN + FR full | Audit both. Phase 2 ships both. Most thorough; doubles the audit time. | |

**User's choice:** EN + flag FR (Recommended)
**Notes:** STATE.md flagged i18n dual-update as a recurring concern. This balances coverage against deadline.

---

## "Already Done" verification rigor

| Option | Description | Selected |
|--------|-------------|----------|
| Verify-in-code | Mark done only if I can show file:line proof in current code. Annotate with commit hash if it was in today's photo batch (742fb89..ad07395). Lowest false-positive. | ✓ |
| Trust recent commits | Mark done if the commit message/diff suggests it was addressed, even if I don't independently verify. Fastest, but risk of false-positives the client will catch. | |

**User's choice:** Verify-in-code (Recommended)
**Notes:** Client trust is at stake. A false-positive "Already Done" tag that turns out wrong would undermine the entire clarification doc.

---

## Inventory structure

| Option | Description | Selected |
|--------|-------------|----------|
| One by-page file | `.planning/phases/01-audit-inventory/AUDIT.md` — grouped by page, each item annotated with tag + atomic sub-actions. Phase 2 and Phase 3 both extract from this. | ✓ |
| Two files | AUDIT.md (full inventory) + SHIP-LIST.md (just Clear-to-Ship items, sorted for Phase 2). More artifacts but cleaner Phase 2 input. | |
| By-tag file | Group by tag (all Already-Done together, all Needs-Clarification together). Loses page context that Phase 3 wants. | |

**User's choice:** One by-page file (Recommended)
**Notes:** Single source of truth. Both Phase 2 (by tag) and Phase 3 (by page) extract from the same file via grep/section-extraction.

---

## Claude's Discretion

- Exact line counts and formatting of AUDIT.md (subject to schema D-03 in CONTEXT.md).
- Whether to include a top-level table-of-contents in AUDIT.md (planned: yes, for scanability).
- Sub-section ordering within each page (planned: Copy → Typography → Sections → Photos → Layout → Behavior).
- Whether to explicitly cite line numbers vs just file names (planned: file:line where helpful for the clarification doc; file-only when structural).

## Deferred Ideas

- Spike on FR-translation-quality for idiomatic phrases (e.g., "Bienvenue Chez Vous"). Out of scope for tonight.
- Decap CMS field-divergence audit — confirm whether client-editable CMS fields overlap with `.astro` hardcoded strings. Possible Milestone 2 hygiene task.
- Visual diff / screenshot grid for client comparison. Possible v2 enhancement.
