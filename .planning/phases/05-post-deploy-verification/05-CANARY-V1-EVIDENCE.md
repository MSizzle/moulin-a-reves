---
requirement: OPS-04
verified_at: 2026-05-21T15:15:05Z
target_url: https://www.moulinareves.com
status: passed
issue_number: 89
issue_url: https://github.com/MSizzle/moulin-a-reves/issues/89
issue_state_after_cleanup: closed
isolation: "Test issue labeled `client-feedback-test` (not `client-feedback`). claude.yml:42 gate uses `contains(github.event.issue.labels.*.name, 'client-feedback')` — exact match only, so `client-feedback-test` is excluded. Action does NOT fire; no PR created; no merge risk."
---

# OPS-04 Canary V1 Evidence

## Summary

OPS-04 requires proof that a `schemaVersion: 1` payload POSTed to the deployed `/api/feedback/submit` endpoint still produces a single-edit GitHub issue via the existing v1 (`handleV1`) dispatch arm — proving that cached browsers using the old payload shape will not break after the Phase 4 batch-pipeline deployment.

This canary satisfies OPS-04 by:
1. POSTing a real `schemaVersion: 1` payload with `testMode: true` to `https://www.moulinareves.com/api/feedback/submit`.
2. Asserting HTTP 200 and `{ok: true, issueNumber, issueUrl}` response shape.
3. Using `gh issue view` to assert the created issue has the v1 single-edit title prefix, the `client-feedback-test` label (Action exclusion per `claude.yml:42`), and no `[Feedback] batch of` substring in the body.
4. Closing the test issue in the `finally` block with a "Closed by canary" comment.

ROADMAP success criterion (line 91): *"A schemaVersion: 1 regression canary (curl with old-shape JSON) against the deployed /api/feedback/submit produces a single-edit issue via the existing v1 path — proving cached clients won't break."* This file is the verification artifact for that criterion.

## Canary log

```
SKIP: v2 cap violation: 11 edits (unit-mode only — requires fetch stub + dynamic import)
SKIP: v2 cap violation: photo bytes (unit-mode only — requires fetch stub + dynamic import)
SKIP: v2 per-edit error (unit-mode only — requires fetch stub + dynamic import)
PASS: v1 canary HTTP 200 with issueNumber=89
PASS: v1 canary issue body matches single-edit shape
✓ Closed issue MSizzle/moulin-a-reves#89 ([TEST] [Feedback] change wording — /: "long enough nearby text for at least one")
=== v1 canary: PASS ===
PASS: canary v1 (OPS-04)

1 passed, 0 failed
```

## Issue snapshot (gh issue view --json number,title,labels,state,closedAt,body)

```json
{
  "body": "**A client left feedback on the live site.**\n\n- **Page:** `/`  (best guess: `?`)\n- **What they want:** change wording\n- **Under the heading:** \"Welcome\"\n- **Text key:** `home.hero.title` (via `data-i18n`)\n- **Nearby text:** \"long enough nearby text for at least one locator signal\"\n- **Captured in:** EN\n\n**Current wording:** \"\"\n\n**New wording (EN):** Canary test edit — Phase 5 verification 2026-05-21T15:15:02.239Z\n**French:** _client OK'd auto-translation — translate it._\n\n---\n\n<!-- machine-readable feedback payload — do not edit by hand -->\n```json\n{\n  \"schemaVersion\": 1,\n  \"pageRoute\": \"/\",\n  \"astroFileGuess\": \"\",\n  \"intent\": \"change-wording\",\n  \"i18nKey\": \"home.hero.title\",\n  \"i18nAttr\": \"data-i18n\",\n  \"imageRef\": null,\n  \"galleryAttrRaw\": null,\n  \"galleryIndex\": null,\n  \"domPath\": \"\",\n  \"nearbyText\": \"long enough nearby text for at least one locator signal\",\n  \"nearestHeading\": \"Welcome\",\n  \"outerHTMLSnippet\": \"\",\n  \"boundingInfo\": null,\n  \"computedStyle\": null,\n  \"langAtCapture\": \"en\",\n  \"intentDetail\": {\n    \"currentText\": \"\",\n    \"newTextEn\": \"Canary test edit — Phase 5 verification 2026-05-21T15:15:02.239Z\",\n    \"newTextFr\": \"\",\n    \"okToTranslate\": true,\n    \"change\": null,\n    \"detail\": \"\",\n    \"confirmed\": false\n  },\n  \"image\": {\n    \"present\": false,\n    \"committedPath\": null,\n    \"originalFilename\": null,\n    \"mime\": null,\n    \"bytes\": null,\n    \"sha256\": null\n  }\n}\n```\n\nAutonomy hint: AUTO-ELIGIBLE (intent=change-wording, 2 locator signals agree). Verify against the autonomy gate in .github/CLAUDE_FEEDBACK.md before labelling `auto-approved`.",
  "closedAt": "2026-05-21T15:15:05Z",
  "labels": [
    {
      "id": "LA_kwDOR1SAKM8AAAACjnSrSA",
      "name": "client-feedback-test",
      "description": "TEST feedback submission (Action ignores)",
      "color": "C5DEF5"
    }
  ],
  "number": 89,
  "state": "CLOSED",
  "title": "[TEST] [Feedback] change wording — /: \"long enough nearby text for at least one\""
}
```

## Assertions

| # | Assertion | Expected | Actual | Status |
|---|-----------|----------|--------|--------|
| 1 | HTTP status from POST to /api/feedback/submit | 200 | 200 | PASS |
| 2 | Response body shape: ok+issueNumber+issueUrl | `{ok:true, issueNumber:number, issueUrl:string}` | `{ok:true, issueNumber:89, issueUrl:"https://github.com/MSizzle/moulin-a-reves/issues/89"}` | PASS |
| 3 | Issue title prefix (v1 single-edit shape) | Starts with `[TEST] [Feedback] change wording — ` | `[TEST] [Feedback] change wording — /: "long enough nearby text for at least one"` | PASS |
| 4 | Issue labels contain client-feedback-test | `client-feedback-test` present | `["client-feedback-test"]` | PASS |
| 5 | Issue body does NOT contain batch shape prefix | No `[Feedback] batch of` substring | Absent — v1 `handleV1` dispatch arm used | PASS |
| 6 | Cleanup: issue state after canary | CLOSED | CLOSED (closedAt: 2026-05-21T15:15:05Z) | PASS |

## Conclusion

OPS-04 is satisfied. The `schemaVersion: 1` payload posted to `https://www.moulinareves.com/api/feedback/submit` produced a single-edit GitHub issue (#89) via the existing `handleV1` dispatch arm in `submit.ts`, confirming that cached browsers will not break after Phase 4's batch pipeline deployment. This file serves as the verification artifact for OPS-04 in any future re-verification run.
