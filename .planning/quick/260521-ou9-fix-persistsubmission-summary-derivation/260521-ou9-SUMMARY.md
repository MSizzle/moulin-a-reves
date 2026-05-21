---
quick_id: 260521-ou9
plan: 260521-ou9-01
requirements-completed: [STATUS-06]
status: complete
commit: 1495a10
completed: 2026-05-21
---

# 260521-ou9: Fix persistSubmission flat pageRoute reads

## What Changed

- Replaced `e && e.locator && e.locator.pageRoute` with `e && e.pageRoute` in the v2 `forEach` loop (line 273) — the `.locator` wrapper does not exist on the wire; v2 `editObj` entries spread locator fields flat to mirror v1.
- Replaced `payload && payload.locator && payload.locator.pageRoute` with `payload && payload.pageRoute` in the v1 `else-if` guard (line 276) — this guard was always `false`, causing v1 rows to show "0 edits".
- Replaced `payload.locator.pageRoute` with `payload.pageRoute` in the `routes.push()` call (line 278) — the route was never captured for v1 submissions.

## Verified

**1. Inline script parses cleanly:**
```
$ node -e "const fs = require('fs'); const txt = fs.readFileSync('src/pages/feedback.astro','utf8'); const m = txt.match(/<script is:inline[^>]*>([\s\S]*?)<\/script>/); new Function(m[1]); console.log('OK');"
OK
```

**2. No stale `.locator.pageRoute` references in persistSubmission block:**
```
$ grep -n "locator.pageRoute" src/pages/feedback.astro
(no output)
```

**3. Both flat reads present:**
```
$ grep -nE "e && e\.pageRoute|payload && payload\.pageRoute" src/pages/feedback.astro
273:                    var r = e && e.pageRoute;
276:                } else if (payload && payload.pageRoute) {
```

## Files Touched

- `src/pages/feedback.astro` — 3 line changes inside `persistSubmission()`, no other modifications
