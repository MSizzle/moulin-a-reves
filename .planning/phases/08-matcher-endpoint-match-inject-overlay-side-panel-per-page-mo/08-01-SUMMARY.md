---
phase: 08-matcher-endpoint-match-inject-overlay-side-panel-per-page-mo
plan: 01
subsystem: feedback
tags: [v1.3, cache-bust, ops-discovery, additive-only]
requirements-completed: [OPS-01, OPS-04]
dependency-graph:
  requires:
    - "src/lib/feedback-version.ts (existing FEEDBACK_INJECT_VER export from v1.1)"
    - "CLAUDE.md §Feedback mode subsection (existing v1.1/v1.2 documentation)"
  provides:
    - "MATCH_INJECT_VER named export from src/lib/feedback-version.ts (initial value '1')"
    - "CLAUDE.md operator-discovery bullet pointing at /api/feedback/match + per-page review flow"
  affects:
    - "Plan 03 (BaseLayout loader): can now import { MATCH_INJECT_VER } from '../lib/feedback-version'"
    - "Plan 04 (feedback.astro iframe builder): can now import { MATCH_INJECT_VER as MVER } alongside the existing FEEDBACK_INJECT_VER"
tech-stack:
  added: []
  patterns:
    - "Named-const cache-bust constant with bump-on-change comment block (mirrors FEEDBACK_INJECT_VER)"
key-files:
  created: []
  modified:
    - "src/lib/feedback-version.ts (appended 15 lines: blank line + 13-line comment block + new export at line 27)"
    - "CLAUDE.md (appended 1 bullet at line 263, end of §Feedback mode subsection)"
decisions:
  - id: "D-23"
    summary: "MATCH_INJECT_VER co-located with FEEDBACK_INJECT_VER in src/lib/feedback-version.ts (not a separate match-version.ts module)"
    rationale: "Single source-of-truth file for all v1.3 cache-bust constants; both consumers (BaseLayout + feedback.astro) import from the same path"
metrics:
  duration: "~3 min"
  completed: "2026-05-26"
  tasks: 2
  files-changed: 2
  insertions: 16
  deletions: 0
---

# Phase 8 Plan 1: Cache-Bust Constant + Operator-Discovery Doc Note Summary

Added the `MATCH_INJECT_VER` cache-bust constant for `public/feedback-match-inject.js` to the existing `src/lib/feedback-version.ts` (alongside the v1.1 `FEEDBACK_INJECT_VER = '4'` which stays byte-identical), and added a one-line operator/agent-discovery bullet to `CLAUDE.md` §Feedback mode pointing future Claude sessions at the v1.3 per-page review flow + `/api/feedback/match` endpoint.

## Confirmation: FEEDBACK_INJECT_VER stayed at '4'

Verified byte-for-byte:

```
$ grep -nE "^export const FEEDBACK_INJECT_VER" src/lib/feedback-version.ts
12:export const FEEDBACK_INJECT_VER = '4';

$ git diff main -- src/lib/feedback-version.ts | grep -c '^-[^-]'
0   # zero deletions/modifications to the pre-v1.3 baseline (Lines 1-13 unchanged)
```

This satisfies the OPS-02 fence prerequisite (Phase 9 will assert `public/feedback-inject.js` is byte-identical; since the script body is unchanged, its companion version constant must also stay at `'4'`).

## MATCH_INJECT_VER location

- **File:** `src/lib/feedback-version.ts`
- **Line:** 27
- **Declaration:** `export const MATCH_INJECT_VER = '1';`
- **Comment block:** Lines 14-26 (mirrors the FEEDBACK_INJECT_VER comment style: what it cache-busts, the two import sites — `BaseLayout.astro` for the `?feedback=1&matchSet=…` conditional loader per D-22, and `feedback.astro` for the iframe `src` query string — plus the standard BUMP-on-change instruction).

Downstream plans (03 BaseLayout loader, 04 feedback.astro iframe builder) can now `import { MATCH_INJECT_VER } from '../lib/feedback-version';` or extend the existing named import in `BaseLayout.astro:3` and `feedback.astro:4` to `import { FEEDBACK_INJECT_VER, MATCH_INJECT_VER }`.

## CLAUDE.md bullet location

- **File:** `CLAUDE.md`
- **Line:** 263
- **Section anchor:** `### Feedback mode (\`?feedback=1\` → auto-code → auto-deploy)` (subsection of `## Architectural Constraints`)
- **Ordinal position:** 6th and final bullet of the §Feedback mode bullet list, immediately after `**Batch submissions (v2 schema).**`.

Pre-existing bullets in the section (positions 1-5) are unchanged:
1. **Sibling of the editor flow, NOT part of it.** (line 258)
2. **Cache-bust constant.** (line 259)
3. **`feedback-incoming/` rule.** (line 260)
4. **The feedback pipeline self-codes.** (line 261)
5. **Batch submissions (v2 schema).** (line 262)
6. **Per-page review (v1.3).** ← NEW, line 263

The next section (`## Anti-Patterns` at line 264) is unchanged.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Append MATCH_INJECT_VER export to src/lib/feedback-version.ts (D-23, OPS-01) | `e26fadf` | `src/lib/feedback-version.ts` |
| 2 | Add per-page review pointer to CLAUDE.md §Feedback mode (OPS-04) | `691bb02` | `CLAUDE.md` |

## Verification Results

All five verification checks from the plan passed:

| # | Check | Expected | Actual | Status |
|---|-------|----------|--------|--------|
| 1 | `git diff src/lib/feedback-version.ts | grep -c '^-[^-]'` | `0` | `0` | PASS |
| 2 | `git diff CLAUDE.md | grep -c '^-[^-]'` | `0` | `0` | PASS |
| 3 | `grep -cE "^export const (FEEDBACK_INJECT_VER|MATCH_INJECT_VER)" src/lib/feedback-version.ts` | `2` | `2` | PASS |
| 4 | Build-time const usable as ES export (`grep -c "^export const MATCH_INJECT_VER = '1';"`) | `1` | `1` | PASS (grep-fallback path of the chained verify; TS direct `node -e require()` not used because TS sources aren't loadable by raw Node) |
| 5 | OPS-02 fence: `git diff` on the 8 fenced paths | `0` lines | `0` lines | PASS |

### Per-task done-criteria

**Task 1:**
- `grep -c "^export const FEEDBACK_INJECT_VER = '4';" src/lib/feedback-version.ts` = `1` ✓
- `grep -c "^export const MATCH_INJECT_VER = '1';" src/lib/feedback-version.ts` = `1` ✓
- `grep -cE '^export const' src/lib/feedback-version.ts` = `2` ✓
- `git diff` shows only additions on the FEEDBACK_INJECT_VER line and around it (0 deletions, 0 modifications to lines 1-13) ✓
- Astro build not run in this minimal change set; verification block #4 used the grep fallback path of the chained verify (mirrors how the plan was authored).

**Task 2:**
- `grep -c "Per-page review (v1.3)" CLAUDE.md` = `1` ✓
- `grep -c "/api/feedback/match" CLAUDE.md` = `1` ✓
- `grep -c "MATCH_INJECT_VER" CLAUDE.md` = `1` ✓
- `grep -c "Batch submissions (v2 schema)" CLAUDE.md` = `1` (still present, unmodified) ✓
- Section-range check via `awk '/### Feedback mode/,/^### /'` returned `0` because the §Feedback mode subsection is terminated by `## Anti-Patterns` (an H2), not an H3. The bullet IS in the correct subsection per direct line-number inspection (`### Feedback mode` at 257 → new bullet at 263 → `## Anti-Patterns` at 264). This is a minor flaw in the plan's awk-range pattern — not a placement defect. See Deviations below.

## Deviations from Plan

### Auto-fixed / Documented

**1. [Rule 3 - Verification expression] Section-range awk pattern in Task 2 verify**
- **Found during:** Task 2 done-criteria run
- **Issue:** Plan's awk command `awk '/### Feedback mode/,/^### /' CLAUDE.md | grep -c "Per-page review (v1.3)"` returns `0`. The §Feedback mode subsection is the last `###` in the file before `## Anti-Patterns` (an H2), so `/^### /` never matches inside the slice — awk consumes the entire file from line 257 to EOF. But the new bullet at line 263 IS inside the §Feedback mode subsection (the H2 header at line 264 is its sibling/parent boundary, not a sub-section).
- **Fix:** None applied to the file itself. The plan's verify command is informational. The bullet is in the correct location per direct inspection of lines 257-264 and the diff hunk. Verified independently via `grep -n "Per-page review (v1.3)\|### Feedback mode\|## Anti-Patterns" CLAUDE.md` which shows the ordering: line 257 `### Feedback mode` → line 263 new bullet → line 264 `## Anti-Patterns`.
- **Files modified:** none
- **Commit:** n/a (verification-expression issue only; documented here for the planner's awareness for future similar checks; could be amended to `awk '/### Feedback mode/,/^##/'`).

No other deviations. All plan constraints honored — OPS-02 fence untouched, FEEDBACK_INJECT_VER unchanged, additive-only diffs.

## OPS-02 Fence Status

Verified passive — none of the fenced paths appear in this plan's `files_modified` and `git diff main` against the full fence list returns `0` lines:

```
$ git diff main -- public/editor-inject.js public/editor public/guardrails.js \
                  src/pages/api/site middleware.ts public/feedback-inject.js \
                  src/pages/api/feedback/submit.ts src/pages/api/feedback/validate.ts | wc -l
0
```

The Phase 9 final fence assertion will continue to hold across this plan.

## Threat Model Outcome

All STRIDE entries from the plan's threat register `accept`-disposed (T-08-01-01 tampering on cache-bust constant — same threat-model inheritance as FEEDBACK_INJECT_VER; T-08-01-02 information disclosure on the operator note — documents an auth-gated public route, intentional disclosure per OPS-04). T-08-01-SC (supply-chain) is N/A — this plan adds zero npm packages.

No new threat surface introduced.

## Known Stubs

None. Both changes are complete, load-bearing only for downstream plans (which import the new constant). No hardcoded empty values, placeholder text, or unwired components.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries.

## Self-Check

- [x] `src/lib/feedback-version.ts` exists and contains both exports (verified via `grep -cE '^export const' = 2`)
- [x] `CLAUDE.md` contains the new bullet at line 263 (verified via `grep -n "Per-page review (v1.3)" CLAUDE.md`)
- [x] Commit `e26fadf` exists (`git log --all --oneline | grep e26fadf`)
- [x] Commit `691bb02` exists (`git log --all --oneline | grep 691bb02`)
- [x] OPS-02 fence files byte-identical to pre-v1.3 baseline (`git diff main -- <fence list> | wc -l = 0`)

## Self-Check: PASSED
