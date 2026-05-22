---
quick_id: 260521-sjf
plan: 260521-sjf-01
status: complete
commit: 6310fe6
completed: 2026-05-21
---

## What shipped

Four file changes (3 new + 1 modified):

1. `scripts/snapshot-pre.sh` (chmod 0755) — captures branches, tags, HEAD, and working-tree status into `.planning/snapshots/<STAMP>/` and creates a local lightweight git tag `snapshot/pre-agent/<STAMP>`.
2. `scripts/snapshot-diff.sh` (chmod 0755) — diffs current branch state against the latest snapshot dir; prints NEW / REMOVED / CHANGED sections and the exact `git reset --hard` rollback command.
3. `.github/workflows/snapshot.yml` — daily 07:00 UTC cron + `workflow_dispatch` job; creates and pushes `snapshot/<DATE>-<HHMMSS>` tags scoped to `refs/tags/snapshot/*`.
4. `.gitignore` — appended `.planning/snapshots/` so local log dirs stay local (git tags are the canonical rollback markers).

## Verified

```
# Syntax check
$ bash -n scripts/snapshot-pre.sh && bash -n scripts/snapshot-diff.sh
# => Syntax check PASSED

# Run snapshot (creates dir + tag)
$ ./scripts/snapshot-pre.sh
Snapshot: .planning/snapshots/2026-05-21T20-38-56 (tag: snapshot/pre-agent/2026-05-21T20-38-56)

# Confirm 4 log files created
$ ls .planning/snapshots/2026-05-21T20-38-56/
branches.txt  head.txt  status.txt  tags.txt

# Confirm tag exists
$ git tag -l "snapshot/pre-agent/*"
snapshot/pre-agent/2026-05-21T20-38-56

# Run diff (no changes since snapshot — all sections empty)
$ ./scripts/snapshot-diff.sh
Branches NEW (added by agent):

Branches REMOVED (deleted by agent):

Branches CHANGED (SHA differs):

Rollback to pre-agent state: git reset --hard snapshot/pre-agent/2026-05-21T20-38-56

# .gitignore line present
$ grep -q "^\.planning/snapshots/" .gitignore && echo "gitignore line present"
gitignore line present

# YAML header sanity
$ head -5 .github/workflows/snapshot.yml
name: Daily Snapshot Tag

on:
  schedule:
    - cron: '0 7 * * *'   # 07:00 UTC daily
```

## Files touched

- `scripts/snapshot-pre.sh` (new, 0755)
- `scripts/snapshot-diff.sh` (new, 0755)
- `.github/workflows/snapshot.yml` (new)
- `.gitignore` (appended 2 lines — comment + `.planning/snapshots/`)

## Usage

```bash
./scripts/snapshot-pre.sh   # run before any agent session
./scripts/snapshot-diff.sh  # run after to see what changed
# rollback: git reset --hard snapshot/pre-agent/<timestamp>
```
