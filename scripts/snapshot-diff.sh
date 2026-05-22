#!/usr/bin/env bash
# snapshot-diff.sh — diff current branch/tag state vs the latest pre-agent snapshot.
# Prints NEW / REMOVED / CHANGED sections and the exact rollback command.
# Usage: ./scripts/snapshot-diff.sh
set -euo pipefail

LATEST=$(ls -1 .planning/snapshots/ 2>/dev/null | sort | tail -1)

if [ -z "$LATEST" ]; then
  echo "No snapshots found. Run scripts/snapshot-pre.sh first."
  exit 1
fi

SNAPSHOT_DIR=".planning/snapshots/$LATEST"

# Capture current branch state
git for-each-ref \
  --format='%(refname:short)|%(objectname)|%(creatordate:iso8601)' \
  refs/heads/ refs/remotes/origin/ \
  > /tmp/snapshot-current-branches.txt

# Extract branch names only (first column) for set-diff
cut -d'|' -f1 "$SNAPSHOT_DIR/branches.txt" | sort > /tmp/snap-names.txt
cut -d'|' -f1 /tmp/snapshot-current-branches.txt | sort > /tmp/curr-names.txt

echo "Branches NEW (added by agent):"
comm -13 /tmp/snap-names.txt /tmp/curr-names.txt

echo ""
echo "Branches REMOVED (deleted by agent):"
comm -23 /tmp/snap-names.txt /tmp/curr-names.txt

echo ""
echo "Branches CHANGED (SHA differs):"
diff "$SNAPSHOT_DIR/branches.txt" /tmp/snapshot-current-branches.txt | grep -E '^[<>]' || true

echo ""
echo "Rollback to pre-agent state: git reset --hard snapshot/pre-agent/$LATEST"
