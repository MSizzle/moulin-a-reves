# Deferred Items — Phase 2

## Build environment

**Discovered during plan 02-04 (PHOTO):** `npm run build` fails with:
```
Error: Cannot find module @rollup/rollup-linux-arm64-gnu
```

This is a pre-existing npm optional-dependencies bug (npm/cli#4828), unrelated to
any PHOTO edits in this plan (our changes are pure CSS rules, class additions, and
a photo-array reorder — none can trigger rollup native-module resolution). Out of
scope for plan 02-04 per scope-boundary rule.

**Suggested fix:** `rm -rf node_modules package-lock.json && npm i` on a Linux host.
On Vercel the build runs against the linux-x64 native module so the issue does not
affect deploy; this only blocks local sandbox builds.
