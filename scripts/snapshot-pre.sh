#!/usr/bin/env bash
# snapshot-pre.sh — capture branch/tag/HEAD state before an agent run.
# Creates .planning/snapshots/<STAMP>/{branches,tags,head,status}.txt
# and a local lightweight git tag snapshot/pre-agent/<STAMP> as the rollback marker.
# Usage: ./scripts/snapshot-pre.sh
set -euo pipefail

STAMP=$(date '+%Y-%m-%dT%H-%M-%S')
SNAPSHOT_DIR=".planning/snapshots/$STAMP"

mkdir -p "$SNAPSHOT_DIR"

# Create lightweight rollback tag (no -a; cheap, no annotation needed)
git tag "snapshot/pre-agent/$STAMP"

# Log all branch refs with SHA and timestamp
git for-each-ref \
  --format='%(refname:short)|%(objectname)|%(creatordate:iso8601)' \
  refs/heads/ refs/remotes/origin/ \
  > "$SNAPSHOT_DIR/branches.txt"

# Log all tags with SHA and timestamp
git for-each-ref \
  --format='%(refname:short)|%(objectname)|%(creatordate:iso8601)' \
  refs/tags/ \
  > "$SNAPSHOT_DIR/tags.txt"

# Log current HEAD commit
git rev-parse HEAD > "$SNAPSHOT_DIR/head.txt"

# Log working-tree status (empty = clean)
git status --porcelain > "$SNAPSHOT_DIR/status.txt"

echo "Snapshot: $SNAPSHOT_DIR (tag: snapshot/pre-agent/$STAMP)"
