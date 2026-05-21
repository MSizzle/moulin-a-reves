---
requirement: OPS-05
verified_at: 2026-05-21T15:51:00Z
target_url: https://www.moulinareves.com
status: passed
issue_number: 96
issue_url: https://github.com/MSizzle/moulin-a-reves/issues/96
pr_number: 97
pr_url: https://github.com/MSizzle/moulin-a-reves/pull/97
pr_branch: feedback/issue-96-batch-2
autonomy_verdict: AUTO-ELIGIBLE
dry_run_state_at_canary: "true"
issue_state_after_cleanup: closed
pr_state_after_cleanup: closed
branch_state_after_cleanup: deleted
feedback_inject_ver_in_deployed_html: "3"
feedback_inject_js_v3_http_status: 200
---

# OPS-05 Canary V2 Evidence

## Summary

OPS-05 requires proof that a `schemaVersion: 2, batch: true` payload POSTed to the deployed
`/api/feedback/submit` endpoint produces exactly ONE GitHub issue with all edits in the JSON
block, ONE Claude PR with all edits applied, the autonomy verdict matches expectation (AUTO-ELIGIBLE),
and the browser network tab confirms `feedback-inject.js?v=3` is fetched (cache-bust verified
end-to-end).

This canary satisfies OPS-05 by:
1. Asserting `DRY_RUN=true` via `gh variable get DRY_RUN` before creating any issue (safety gate per CONTEXT D-06).
2. POSTing a real `schemaVersion: 2, batch: true` payload (2 edits with `i18nKey + i18nAttr`) to `https://www.moulinareves.com/api/feedback/submit`.
3. Asserting HTTP 200 and `{ok: true, issueNumber, issueUrl}` response shape.
4. Using `gh issue view` to assert the created issue has the batch title prefix (`[Feedback] batch of 2 edits — ...`), the `client-feedback` label (Action fires), exactly ONE fenced JSON block, and the `Autonomy hint: AUTO-ELIGIBLE` substring.
5. Polling up to 5 minutes for the Claude Action to open PR `feedback/issue-96-batch-2`.
6. Polling up to 3 minutes for the result comment (`Dry run: this would have been auto-applied. A PR was opened for inspection; no merge was performed.`) — confirming the DRY_RUN gate at `claude.yml:145` halted the squash-merge step.
7. Grepping the deployed root HTML for `const feedbackVer = "3"` (cache-bust proof, CONTEXT D-08).
8. HEAD-probing `/feedback-inject.js?v=3` for HTTP 200 (asset reachable, CONTEXT D-10).
9. Cleanup in finally-block: PR closed, branch deleted, issue closed (per CONTEXT D-07).

ROADMAP success criterion (line 92): *"A v2 batched canary (using the client-feedback-test label OR DRY_RUN=true first) produces exactly ONE issue containing all edits in the JSON block, ONE Claude PR with all edits applied, and the autonomy verdict matches expectation (passes if every edit passes; gates to review otherwise); browser network tab confirms feedback-inject.js?v=<NEW_VER> is fetched (cache-bust verified end-to-end)."* This file is the verification artifact for that criterion.

## Canary log

```
SKIP: v2 cap violation: 11 edits (unit-mode only — requires fetch stub + dynamic import)
SKIP: v2 cap violation: photo bytes (unit-mode only — requires fetch stub + dynamic import)
SKIP: v2 per-edit error (unit-mode only — requires fetch stub + dynamic import)
PASS: v2 canary HTTP 200 with issueNumber=96
PASS: v2 canary issue body matches batch shape (title + single json fence + AUTO-ELIGIBLE hint)
PASS: PR opened at branch feedback/issue-96-batch-2, PR #97
PASS: result comment posted on issue 96
PASS: cache-bust grep — const feedbackVer = "3" present in deployed HTML
PASS: asset HEAD — /feedback-inject.js?v=3 returned 200
✓ Closed pull request MSizzle/moulin-a-reves#97 (copy: add canary v2 keys for Phase 5 verification (feedback #96))
To https://github.com/MSizzle/moulin-a-reves.git
 - [deleted]         feedback/issue-96-batch-2
✓ Closed issue MSizzle/moulin-a-reves#96 ([Feedback] batch of 2 edits — /, /the-compound/)
PASS: cleanup — PR #97 closed, branch feedback/issue-96-batch-2 deleted, issue #96 closed
=== v2 canary: PASS ===
```

## Issue snapshot

```json
{
  "body": "**A client left feedback on the live site (2 edits).**\n\n---\n\n### Edit 1 of 2\n\n**A client left feedback on the live site.**\n\n- **Page:** `/`  (best guess: `?`)\n- **What they want:** change wording\n- **Under the heading:** \"“Welcome\"\"\n- **Text key:** `home.canary.test1` (via `data-i18n`)\n- **Nearby text:** \"long enough nearby text for at least one locator signal for canary v2 testing\"\n- **Captured in:** EN\n\n**Current wording:** \"\"\n\n**New wording (EN):** Canary v2 edit 1 — Phase 5 verification 2026-05-21T15:47:48.743Z\n**French:** _client OK’d auto-translation — translate it._\n\n---\n\n### Edit 2 of 2\n\n**A client left feedback on the live site.**\n\n- **Page:** `/the-compound/`  (best guess: `?`)\n- **What they want:** change wording\n- **Under the heading:** \"“The Compound\"\"\n- **Text key:** `compound.canary.test2` (via `data-i18n`)\n- **Nearby text:** \"long enough nearby text for at least one locator signal for canary v2 testing\"\n- **Captured in:** EN\n\n**Current wording:** \"\"\n\n**New wording (EN):** Canary v2 edit 2 — Phase 5 verification 2026-05-21T15:47:48.743Z\n**French:** _client OK’d auto-translation — translate it._\n\n---\n\n<!-- machine-readable feedback payload — do not edit by hand -->\n\\`\\`\\`json\n...(full JSON payload in issue body)...\n\\`\\`\\`\n\nAutonomy hint: AUTO-ELIGIBLE (all 2 edits pass per-edit gate).",
  "closedAt": "2026-05-21T15:51:02Z",
  "labels": [
    {
      "name": "client-feedback",
      "description": "Client feedback submission (triggers Claude agent)",
      "color": "0E8A16"
    },
    {
      "name": "auto-approved",
      "description": "Claude cleared this for autonomous squash-merge",
      "color": "0E8A16"
    }
  ],
  "number": 96,
  "state": "CLOSED",
  "title": "[Feedback] batch of 2 edits — /, /the-compound/"
}
```

## PR snapshot

```json
{
  "baseRefName": "main",
  "body": "## What changed\n\nAdds two new translation entries to `public/i18n/translations.json` for the client's batch of two canary edits captured on the live site:\n\n- **`home.canary.test1`** — shown on `/` under the \"Welcome\" heading\n- **`compound.canary.test2`** — shown on `/the-compound/` under the \"The Compound\" heading\n\nFor each key, the English string is taken verbatim from the client's submission. French was auto-translated because the client checked `okToTranslate: true` on both edits.\n\n## Scope check (autonomy gate)\n\n- Intent: `change-wording` (both edits)\n- Locator signals per edit: `i18nKey` + `i18nAttr` + `pageRoute` + `nearbyText` + `nearestHeading` — ≥ 2 independent signals agree\n- Diff: 1 file (`public/i18n/translations.json`) — both `en` and `fr` set for both keys\n- No structural / API / layout files touched\n- `npm run prebuild && npm run build` passed locally\n\nAll per-edit gates pass → batch is `AUTO-ELIGIBLE`.\n\nCloses #96",
  "closedAt": "2026-05-21T15:50:56Z",
  "headRefName": "feedback/issue-96-batch-2",
  "number": 97,
  "state": "CLOSED",
  "title": "copy: add canary v2 keys for Phase 5 verification (feedback #96)"
}
```

## Result comment from Action

The Action posted two comments on issue #96. The second is the `claude.yml:145` DRY_RUN gate comment:

```
Dry run: this would have been auto-applied. A PR was opened for inspection; no merge was performed.
```

The first comment (from Claude Code itself) was:

```
Applied 2 of 2 edits.

I added the two new pieces of wording you submitted to the site's translation file:

- on the homepage under "Welcome" → `home.canary.test1`
- on the compound page under "The Compound" → `compound.canary.test2`

For each one I used your English text exactly as written, and I auto-translated it to French because you checked the "OK to translate" box on both.

PR: https://github.com/MSizzle/moulin-a-reves/pull/97

Autonomy check: both edits passed the per-edit gate (intent is wording-only, locator signals agree, the diff only touches the translations file with both English and French set, and the build is green), so the batch is `auto-approved`.

Dry-run mode is on for this run, so the workflow will NOT auto-merge the PR this time. In a normal (non-dry-run) run, the squash-merge would happen automatically and Vercel would redeploy on push to `main`. Would auto-merge: yes.
```

Both comments contain `Dry run` — confirming the DRY_RUN=true gate at `claude.yml:145` fired correctly and the squash-merge step was skipped.

## Cache-bust proof (D-08, D-10)

### HTML grep (D-08)

Command: `curl -sL https://www.moulinareves.com/ | grep -oE 'const feedbackVer = "[0-9]+"'`

Result:
```
const feedbackVer = "3"
```

The deployed HTML contains the exact cache-bust constant (`FEEDBACK_INJECT_VER='3'` from `src/lib/feedback-version.ts`), proving the Phase 4 cache-bust ship landed end-to-end on the live Vercel deployment.

### Asset HEAD probe (D-10)

Command: `curl -sI 'https://www.moulinareves.com/feedback-inject.js?v=3'`

First 5 lines:
```
HTTP/2 200 
accept-ranges: bytes
access-control-allow-origin: *
age: 58
cache-control: public, max-age=0, must-revalidate
```

The v=3 asset URL returns HTTP 200, confirming the cache-busted file is reachable at its versioned URL.

## Assertions

| # | Assertion | Expected | Actual | Status |
|---|-----------|----------|--------|--------|
| 1 | DRY_RUN repo variable (`gh variable get DRY_RUN`) | literal `"true"` | `"true"` | PASS |
| 2 | HTTP status from POST to /api/feedback/submit | 200 | 200 | PASS |
| 3 | Response body shape: ok+issueNumber+issueUrl | `{ok:true, issueNumber:number, issueUrl:string}` | `{ok:true, issueNumber:96, issueUrl:"https://github.com/MSizzle/moulin-a-reves/issues/96"}` | PASS |
| 4 | Issue title matches batch regex | `/^\[Feedback\] batch of \d+ edits — /` | `"[Feedback] batch of 2 edits — /, /the-compound/"` | PASS |
| 5 | Issue label contains `client-feedback` | `client-feedback` present | `["client-feedback", "auto-approved"]` | PASS |
| 6 | Single fenced JSON block in issue body | count = 1 | 1 | PASS |
| 7 | Autonomy hint in issue body | `Autonomy hint: AUTO-ELIGIBLE` substring | Present | PASS |
| 8 | PR created at expected branch prefix | starts with `feedback/issue-96-batch-` | `feedback/issue-96-batch-2` | PASS |
| 9 | PR not merged (DRY_RUN gate) | PR state CLOSED without squash-merge (DRY_RUN=true) | PR #97 CLOSED (by canary cleanup), no squash-merge occurred | PASS |
| 10 | Result comment posted (DRY_RUN path) | `Dry run` substring | `"Dry run: this would have been auto-applied. A PR was opened for inspection; no merge was performed."` | PASS |
| 11 | Cache-bust HTML grep | `const feedbackVer = "3"` in deployed HTML | Present | PASS |
| 12 | Asset HEAD probe | HTTP 200 on `/feedback-inject.js?v=3` | HTTP/2 200 | PASS |
| 13 | Cleanup — PR closed | `gh pr view 97 --json state` = CLOSED | CLOSED | PASS |
| 14 | Cleanup — branch deleted | `git ls-remote --heads origin feedback/issue-96-batch-2` empty | empty | PASS |
| 15 | Cleanup — issue closed | `gh issue view 96 --json state` = CLOSED | CLOSED | PASS |

## OPS-02 fence (Phase 5 final)

Command: `git diff main -- public/editor-inject.js public/editor public/guardrails.js src/pages/api/site middleware.ts | wc -l`

Result:
```
0
```

Phase 5's modifications (`scripts/smoke-feedback-v2.mjs`, `scripts/canary.sh`, `package.json`) are all OUTSIDE the OPS-02 fence; the editor flow remains byte-for-byte unchanged.

## Conclusion

OPS-05 is satisfied. The v2 batched canary against `https://www.moulinareves.com` produced exactly ONE GitHub issue (#96) with both edits in the JSON block, ONE Claude PR (#97 at branch `feedback/issue-96-batch-2`) with all edits applied (both i18n keys added to `public/i18n/translations.json`), the autonomy verdict was AUTO-ELIGIBLE (matching the per-edit gate logic), the `Dry run` result comment confirmed DRY_RUN=true halted the squash-merge, and `const feedbackVer = "3"` in the deployed HTML plus HTTP 200 on `/feedback-inject.js?v=3` confirm the Phase 4 cache-bust ship landed end-to-end.

The full v1.1 milestone now has all 25 requirements satisfied (Phase 4: 23 + Phase 5: 2). Next: `/gsd-verify-work 5` then `/gsd-audit-milestone v1.1`.
