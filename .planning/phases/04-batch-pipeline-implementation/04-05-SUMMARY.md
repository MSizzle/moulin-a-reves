---
phase: 04-batch-pipeline-implementation
plan: 05
subsystem: feedback
tags:
  - feedback
  - action
  - claude-feedback-md
  - docs
  - prompt-injection-safety
  - batch-v2
  - operating-manual

# Dependency graph
requires:
  - phase: 04-batch-pipeline-implementation/03
    provides: "v2 batch issue body shape (title `[Feedback] batch of N edits — <pageRoutes>`, per-edit renderHuman() blocks separated by `---`, single fenced ```json``` block holding the entire edits[] array, autonomy hint)"
provides:
  - ".github/CLAUDE_FEEDBACK.md §8 (Batch submissions) — LLM operating manual telling the Claude Code Action how to detect (`schemaVersion: 2 && batch: true`), read (`gh issue view --json body`), validate per-edit (§0 disallowed paths + §2 EN/FR), roll up the per-edit autonomy verdict (AND of §4 outcomes), and ship one batch as ONE branch (`feedback/issue-<n>-batch-<N>`) / ONE commit / ONE PR / ONE result comment (`Applied X of N edits`)."
affects:
  - "Phase 05 OPS-05 (canary): the Action's first live v2 batch run will be guided by §8 — if §8 wording is ambiguous, the canary surfaces it."
  - "Future plans editing CLAUDE_FEEDBACK.md: §8 references §0/§2/§3/§4 — keep those sections' rule wording stable or update §8 in lockstep."

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Additive-only doc edit pattern (§0–§7 byte-for-byte preserved; new section appended at end). Verified via sha256 equality of head -192 against main's full file."
    - "Mirror-the-neighbour H2 section style (§8 borrows the `—` subtitle, `**Bold lead.**` bullet shape, and ASCII decision-tree convention from existing §3/§4)."
    - "Prompt-injection-safety reinforced in documentation: explicit DO NOT YAML-interpolate the JSON block, READ via `gh issue view <n> --json body`. Future maintainers who skim the doc to 'optimise' will hit the rationale paragraph."

key-files:
  created:
    - ".planning/phases/04-batch-pipeline-implementation/04-05-SUMMARY.md"
  modified:
    - ".github/CLAUDE_FEEDBACK.md (+89 lines, 192 → 281 lines): appended `## 8. Batch submissions — one issue, N edits, one PR` after the existing §7. §0–§7 unchanged."

key-decisions:
  - "Used `§N` section references (not `section N`) — existing file uses §6, §3, §4, §2, §5, §0 throughout, so §8 matches the established cross-reference style. Acceptance criterion accepts either; consistency was the tiebreaker."
  - "Inserted the §8 H2 subtitle as `— one issue, N edits, one PR` (mirrors §3's `— Sharp pipeline (zero source edits)` and §4's `— auto-merge vs defer`). One-line value proposition before the body."
  - "Reused the §4 ASCII decision-tree code-fence convention (\\`\\`\\` plain text, not language-tagged) for the per-edit→batch autonomy roll-up so the visual rhyme makes the relationship obvious."
  - "Anchored the prompt-injection-safety warning with an explicit 'Future maintainers reading this section: this is load-bearing, not stylistic' aside — addresses threat T-04-26 (well-meaning future optimisation breaking the safety property) by surfacing the rationale rather than hiding it."
  - "Result-comment section includes THREE example phrasings (all-clean auto-merge, mixed verdict with one edit failing locator signals, mixed verdict with one edit failing the diff-scope check) rather than just ACTION-03's single example. Worth the extra lines because the Action will likely lift these as templates."

patterns-established:
  - "Cross-link footer pattern: §8 closes with a one-liner pointing back to §3 and §4 for the per-edit mechanics it composes. Future operating-manual sections that introduce a new layer over existing rules should do the same — keep the new section focused on the new layer, defer to existing sections for unchanged mechanics."
  - "Three-example result-comment template (all-clean / mixed-locator / mixed-scope) gives the Action concrete phrasings for the most likely batch outcomes."

requirements-completed:
  - ACTION-01
  - ACTION-02
  - ACTION-03

# Metrics
duration: "~12 min"
completed: 2026-05-21
loc_changed: "+89 / -0 in .github/CLAUDE_FEEDBACK.md"
---

# Phase 04 Plan 05: Claude Code Action manual — §8 Batch submissions

**Appended `## 8. Batch submissions — one issue, N edits, one PR` to `.github/CLAUDE_FEEDBACK.md` so the Action can detect a v2 `schemaVersion: 2 + batch: true` issue, validate per edit (§0 disallowed paths + §2 EN/FR inherited per edit), roll up the per-edit autonomy verdicts (batch AUTO iff every edit AUTO), and ship the batch as ONE branch / ONE commit / ONE PR / ONE result comment — all while preserving the prompt-injection-safety property by reading the JSON block via `gh issue view --json body` and never via YAML interpolation.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-05-21T00:16:00Z (approx — first context read)
- **Completed:** 2026-05-21T00:28:02Z (commit timestamp)
- **Tasks:** 1 / 1
- **Files modified:** 1 (`.github/CLAUDE_FEEDBACK.md`)

## Accomplishments

- ACTION-01 delivered: schema-detection rule (`schemaVersion: 2 && batch: true` inside the fenced ```json``` block) documented; per-edit inheritance of §0 (disallowed paths) and §2 (EN/FR) rules documented explicitly (D-17).
- ACTION-02 delivered: ONE branch (`feedback/issue-<n>-batch-<N>`) / ONE atomic commit / ONE PR / ONE result comment convention spelled out, with explicit guidance for the passing-subset case (apply the subset in one commit, note skipped edits in the PR description).
- ACTION-03 delivered: result-comment format (`Applied X of N edits.`) with three concrete example phrasings covering the most likely batch outcomes (all-clean auto-merge, mixed verdict due to locator-signal failure, mixed verdict due to diff-scope failure).
- ISSUE-04 / D-10 covered: per-edit autonomy roll-up decision tree (AND of per-edit verdicts) mirrors §4's existing ASCII tree shape.
- Prompt-injection-safety property (CLAUDE.md "prompt-injection-safe issue body pattern" + ISSUE-03) reinforced in the doc with an explicit DO-NOT-YAML-interpolate paragraph and the load-bearing rationale visible for future maintainers (threat T-04-26 mitigation).
- §0–§7 preserved byte-for-byte (sha256 of first 192 lines == main's full-file sha256).

## Task Commits

1. **Task 1: Append `## 8. Batch submissions` section to .github/CLAUDE_FEEDBACK.md** — `99bad3d` (docs)

## Files Created/Modified

- `.github/CLAUDE_FEEDBACK.md` — +89 lines appended (192 → 281). New `## 8. Batch submissions — one issue, N edits, one PR` H2 with: schema-detection rule, JSON-block read-via-`gh issue view` protocol, per-edit inheritance of §0/§2, per-edit autonomy roll-up with ASCII decision tree, branch/commit/PR convention, bilingual edge-case clarification, three example result-comment phrasings, and a closing cross-link to §3/§4 for unchanged per-edit mechanics.
- `.planning/phases/04-batch-pipeline-implementation/04-05-SUMMARY.md` — this file (created by execution).

## Decisions Made

1. **`§N` section references over `section N`.** The existing file uses `§6`, `§3`, `§4`, `§2`, `§5`, `§0` everywhere — matching that convention keeps the cross-reference graph greppable and visually consistent. Acceptance criteria accept either, so consistency was the tiebreaker.

2. **Three result-comment example phrasings instead of one.** ACTION-03 specifies a single example (`Applied X of N edits; edit #Y had only 1 locator signal so the whole set is in review`). I added two more — an all-clean auto-merge case and a diff-scope-failure case — because the Action will likely lift these phrasings as templates, and a single example only covers the locator-signal failure mode. The cost is ~10 extra lines; the value is the Action having a complete starter palette for the three most common batch outcomes.

3. **Load-bearing aside on prompt-injection safety.** Added an explicit "Future maintainers reading this section: this is load-bearing, not stylistic" line after the DO-NOT-YAML-interpolate paragraph. The threat model entry T-04-26 (a maintainer adding YAML interpolation "as an optimisation") is mitigated by surfacing the rationale where it would actually be read. Without this, a future drive-by edit could quietly compromise the safety property.

4. **Closing cross-link footer pattern.** The §8 section ends with a one-liner pointing back to §3 (Sharp pipeline per edit) and §4 (per-edit autonomy gate) for the unchanged mechanics. Keeps §8 focused on the new layer (batch composition) without duplicating rules from sections that still apply per edit.

## Deviations from Plan

None — plan executed exactly as written. Every required substring from the plan's `<behavior>` block and `<acceptance_criteria>` is present in the new §8. No new files created beyond the SUMMARY. No edits to §0–§7. No edits to peer files (`submit.ts`, `feedback-inject.js` — Plan 04-03 and 04-04's domain). OPS-02 scope fence verified clean (0 lines).

## Issues Encountered

None.

## Verification

### Plan acceptance criteria (15 grep gates)

All 15 acceptance-criteria grep checks PASS:

| # | Check | Required | Actual |
|---|-------|----------|--------|
| 1 | `^## 8\. Batch submissions` | ==1 | **1** |
| 2 | `schemaVersion: 2` | ≥1 | **1** |
| 3 | `batch: true` | ≥1 | **1** |
| 4 | `gh issue view` | ≥1 | **2** |
| 5 | `--json body` | ≥1 | **1** |
| 6 | `feedback/issue-<n>-batch-` | ≥1 | **1** |
| 7 | `AUTO-ELIGIBLE\|AUTO ` | ≥1 | **2** |
| 8 | `NEEDS-REVIEW` | ≥1 | **4** |
| 9 | `per[- ]edit\|PER EDIT` | ≥1 | **11** |
| 10 | `EN/FR\|bilingual` | ≥1 | **6** |
| 11 | `Applied` | ≥1 | **4** |
| 12 | `§0\|section 0` | ≥1 | **4** |
| 13 | `§4\|section 4` | ≥1 | **4** |
| 14 | H2 section count | was 8, now ≥9 | **9** |
| 15 | `${{` (prompt-injection safety) | ==0 | **0** |

### Scope fences

- **OPS-02 / D-13 editor-flow fence:** `git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts` returns **0 lines**. PASS.
- **Peer-plan-file fence (this plan only touches CLAUDE_FEEDBACK.md):** `git diff main -- src/pages/api/feedback/submit.ts public/feedback-inject.js` returns **0 lines**. PASS.

### §0–§7 byte-for-byte preservation

`sha256(head -192 .github/CLAUDE_FEEDBACK.md) == sha256(main:.github/CLAUDE_FEEDBACK.md)` →
`ea137f46862240c04649b5f12895923a77515337c3bb877f95d9b0710ce7929d` on both sides. PASS.

`git diff main -- .github/CLAUDE_FEEDBACK.md | grep -E "^-[^-]" | wc -l` returns **0** — purely additive. PASS.

## User Setup Required

None — this is a doc-only change. The new §8 takes effect the next time the Claude Code Action runs on a `client-feedback`-labelled issue whose body carries a v2 batch payload (i.e., once Plans 04-03 and 04-04 are also merged and a client submits a multi-edit batch). No env vars, no dashboard config, no token rotation.

## Next Phase Readiness

- **Wave 3 complete (Plan 04-04 parallel peer):** This plan was the second of two wave-3 plans both depending on Plan 04-03's v2 server contract. Plan 04-04 (`public/feedback-inject.js` client state machine) runs concurrently in another worktree and touches only `feedback-inject.js` — no overlap with this plan's only-modified file `.github/CLAUDE_FEEDBACK.md`. Both can merge in any order.
- **Phase 04 docs:** Plan 04-06 (CLAUDE.md "Feedback mode" one-line note per OPS-03 / D-19) is the natural follow-up — the new bullet should mention that v2 batched issues are described in CLAUDE_FEEDBACK.md §8, which now exists.
- **Phase 05 OPS-05 canary:** The first live v2 batch will exercise §8 end-to-end. If the wording is ambiguous (e.g., the Action labels the issue `needs-review` when ACTION-03 expected a per-edit summary), iterate on §8 before declaring Phase 5 done.

## Threat Flags

None. This plan only added documentation; no new network endpoints, auth paths, file-access patterns, or trust-boundary surface introduced. The doc reinforces the existing prompt-injection-safety property (T-04-25) and adds an anti-regression aside for it (T-04-26).

## Self-Check: PASSED

- **Created file:** `.planning/phases/04-batch-pipeline-implementation/04-05-SUMMARY.md` — verified exists.
- **Modified file:** `.github/CLAUDE_FEEDBACK.md` — verified §8 present, §0–§7 sha-equal to main.
- **Task commit:** `99bad3d` — verified exists in `git log` (`git log --oneline | grep 99bad3d`).
- **All 15 acceptance grep gates:** pass (table above).
- **Both scope fences:** clean (0 lines).
- **Self-check executed:** 2026-05-21.

---
*Phase: 04-batch-pipeline-implementation*
*Completed: 2026-05-21*
