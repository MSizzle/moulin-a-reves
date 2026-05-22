---
phase: quick-260521-sjf
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/snapshot-pre.sh
  - scripts/snapshot-diff.sh
  - .github/workflows/snapshot.yml
  - .gitignore
autonomous: true
requirements:
  - SNAPSHOT-01
must_haves:
  truths:
    - "Running scripts/snapshot-pre.sh creates .planning/snapshots/<timestamp>/{branches,tags,head,status}.txt and a lightweight git tag snapshot/pre-agent/<timestamp>"
    - "Running scripts/snapshot-diff.sh after a snapshot prints three sections (NEW, REMOVED, CHANGED) and ends with the exact rollback command 'git reset --hard snapshot/pre-agent/<latest>'"
    - "Both shell scripts pass `bash -n` syntax check and are executable (mode 0755)"
    - ".gitignore contains a literal '.planning/snapshots/' line so local snapshot logs are not committed"
    - "The new GitHub Action .github/workflows/snapshot.yml is well-formed YAML, triggers on 07:00 UTC cron + workflow_dispatch, and pushes only refs/tags/snapshot/* with contents:write permission"
  artifacts:
    - path: "scripts/snapshot-pre.sh"
      provides: "Pre-agent snapshot capture: timestamped log dir + immutable lightweight rollback tag"
      contains: "snapshot/pre-agent/"
    - path: "scripts/snapshot-diff.sh"
      provides: "Diff current branch/tag state vs latest pre-agent snapshot; prints rollback command"
      contains: "git reset --hard snapshot/pre-agent/"
    - path: ".github/workflows/snapshot.yml"
      provides: "Daily 07:00 UTC snapshot tag pushed to origin; manually fireable via workflow_dispatch"
      contains: "snapshot/"
    - path: ".gitignore"
      provides: "Excludes local .planning/snapshots/ log dir from commits"
      contains: ".planning/snapshots/"
  key_links:
    - from: "scripts/snapshot-pre.sh"
      to: "git tag namespace snapshot/pre-agent/<STAMP>"
      via: "git tag (lightweight) — local-only marker, NOT pushed by this script"
      pattern: "git tag \"snapshot/pre-agent/\\$STAMP\""
    - from: "scripts/snapshot-diff.sh"
      to: ".planning/snapshots/<latest>/branches.txt"
      via: "ls -1 | sort | tail -1 to find latest stamp, then comm -23 / comm -13 set diff vs current branches"
      pattern: "ls -1 .planning/snapshots/"
    - from: ".github/workflows/snapshot.yml"
      to: "origin refs/tags/snapshot/*"
      via: "git push origin 'refs/tags/snapshot/*' (scoped push, never pushes non-snapshot tags)"
      pattern: "refs/tags/snapshot/\\*"
---

<objective>
Ship snapshot tooling for agent-paranoia rollback. Three new files (two bash scripts + one GitHub Action) plus one `.gitignore` line. No existing-code changes. Purpose: give the operator a one-command "freeze branch+tag state before letting an agent run" handle and a one-command "what did the agent touch?" diff, backed by a daily CI-side snapshot tag so even days without manual snapshots have a known-good rollback marker.

Output:
- `scripts/snapshot-pre.sh` (executable) — captures branches, tags, HEAD, status into `.planning/snapshots/<STAMP>/` AND creates a local lightweight tag `snapshot/pre-agent/<STAMP>` as the durable rollback marker.
- `scripts/snapshot-diff.sh` (executable) — diffs current ref state against the most recent snapshot dir; prints NEW / REMOVED / CHANGED sections + the exact `git reset --hard` rollback command.
- `.github/workflows/snapshot.yml` — daily 07:00 UTC + `workflow_dispatch` job that creates and pushes `snapshot/<DATE>-<HHMMSS>` tags scoped to the `snapshot/*` ref namespace.
- `.gitignore` — appends `.planning/snapshots/` so local log dirs stay local; only the tags are the canonical permanent rollback handles.

Out of scope: tests, test framework integration, edits to any existing script or workflow, integration with the `/gsd-*` command set.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

OPS-02 fence (DO NOT TOUCH, this plan respects the fence — none of the four target paths are inside the fence):
- public/editor-inject.js
- public/editor/
- public/guardrails.js
- src/pages/api/site/
- middleware.ts
- the `?edit=1` loader block in src/layouts/BaseLayout.astro

Naming convention note: project convention is `kebab-case.mjs` for `scripts/`, but `canary.sh` is the existing precedent for shell scripts in this repo, so `.sh` is acceptable here (the scope explicitly chose bash to keep the implementation small and dependency-free).

<interfaces>
<!-- These are the exact CLI surfaces and on-disk shapes the two scripts produce/consume. The executor should treat these as contracts. -->

scripts/snapshot-pre.sh produces:
  .planning/snapshots/<STAMP>/branches.txt   # `git for-each-ref --format='%(refname:short)|%(objectname)|%(creatordate:iso8601)' refs/heads/ refs/remotes/origin/`
  .planning/snapshots/<STAMP>/tags.txt       # same format, refs/tags/
  .planning/snapshots/<STAMP>/head.txt       # `git rev-parse HEAD`
  .planning/snapshots/<STAMP>/status.txt     # `git status --porcelain`
  git tag (local, lightweight): snapshot/pre-agent/<STAMP>
  stdout: "Snapshot: .planning/snapshots/<STAMP> (tag: snapshot/pre-agent/<STAMP>)"

Where <STAMP> = `date '+%Y-%m-%dT%H-%M-%S'` (colons replaced with hyphens so the path is portable).

scripts/snapshot-diff.sh consumes:
  .planning/snapshots/<latest>/branches.txt   (latest = `ls -1 .planning/snapshots/ | sort | tail -1`)

scripts/snapshot-diff.sh produces (stdout):
  Three labelled sections:
    "Branches NEW (added by agent):"      — branch names present now but not in snapshot
    "Branches REMOVED (deleted by agent):"— branch names present in snapshot but not now
    "Branches CHANGED (SHA differs):"     — branch names where the SHA in column 2 differs
  Trailing line: "Rollback to pre-agent state: git reset --hard snapshot/pre-agent/<latest>"

.github/workflows/snapshot.yml triggers:
  schedule: cron '0 7 * * *'   # 07:00 UTC daily
  workflow_dispatch:           # manual fire from Actions tab

.github/workflows/snapshot.yml produces:
  Pushed tag: snapshot/<YYYY-MM-DD>-<HHMMSS>  (UTC)
  Scoped push: `git push origin 'refs/tags/snapshot/*'` (never touches other tags)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create both snapshot bash scripts + GitHub Action + .gitignore line, then verify</name>
  <files>scripts/snapshot-pre.sh, scripts/snapshot-diff.sh, .github/workflows/snapshot.yml, .gitignore</files>
  <action>
Create exactly four file changes — no more, no less. Use the Write tool for the three new files and the Edit tool to append the single line to `.gitignore`. Do not modify any other file.

1. **Create `scripts/snapshot-pre.sh`** with:
   - Shebang `#!/usr/bin/env bash`
   - `set -euo pipefail`
   - `STAMP=$(date '+%Y-%m-%dT%H-%M-%S')`
   - `SNAPSHOT_DIR=".planning/snapshots/$STAMP"`
   - `mkdir -p "$SNAPSHOT_DIR"`
   - `git tag "snapshot/pre-agent/$STAMP"` (lightweight tag — NO `-a`; these are cheap rollback markers per the scope rationale)
   - Write `branches.txt`: `git for-each-ref --format='%(refname:short)|%(objectname)|%(creatordate:iso8601)' refs/heads/ refs/remotes/origin/ > "$SNAPSHOT_DIR/branches.txt"`
   - Write `tags.txt`: same shape, but `refs/tags/` → `"$SNAPSHOT_DIR/tags.txt"`
   - Write `head.txt`: `git rev-parse HEAD > "$SNAPSHOT_DIR/head.txt"`
   - Write `status.txt`: `git status --porcelain > "$SNAPSHOT_DIR/status.txt"`
   - Final echo: `echo "Snapshot: $SNAPSHOT_DIR (tag: snapshot/pre-agent/$STAMP)"`
   - Idempotency: do NOT guard `mkdir -p` or the tag creation — if the same-second timestamp dir exists, overwrite the log files. If the tag already exists, allow `git tag` to fail loudly (the next-second run will succeed). No fancy retry logic.

2. **Create `scripts/snapshot-diff.sh`** with:
   - Shebang `#!/usr/bin/env bash`
   - `set -euo pipefail`
   - `LATEST=$(ls -1 .planning/snapshots/ 2>/dev/null | sort | tail -1)` (note: tolerate the dir missing without -euo pipefail aborting — use `2>/dev/null` and let LATEST be empty)
   - Guard: if `LATEST` is empty, `echo "No snapshots found. Run scripts/snapshot-pre.sh first."` and `exit 1`
   - `SNAPSHOT_DIR=".planning/snapshots/$LATEST"`
   - Compute current branch state to a tmp file: `git for-each-ref --format='%(refname:short)|%(objectname)|%(creatordate:iso8601)' refs/heads/ refs/remotes/origin/ > /tmp/snapshot-current-branches.txt`
   - Set-diff by **name only** (first column of the `|`-delimited file). Extract name columns to sorted tmp files: `cut -d'|' -f1 "$SNAPSHOT_DIR/branches.txt" | sort > /tmp/snap-names.txt` and `cut -d'|' -f1 /tmp/snapshot-current-branches.txt | sort > /tmp/curr-names.txt`
   - Print `echo "Branches NEW (added by agent):"` then `comm -13 /tmp/snap-names.txt /tmp/curr-names.txt` (lines in current but not snapshot)
   - Print `echo ""` and `echo "Branches REMOVED (deleted by agent):"` then `comm -23 /tmp/snap-names.txt /tmp/curr-names.txt` (lines in snapshot but not current)
   - Print `echo ""` and `echo "Branches CHANGED (SHA differs):"` — for the CHANGED section, use `diff "$SNAPSHOT_DIR/branches.txt" /tmp/snapshot-current-branches.txt | grep -E '^[<>]' || true` (the `|| true` keeps `set -e` from aborting when diff finds nothing)
   - Print `echo ""` and the rollback instruction: `echo "Rollback to pre-agent state: git reset --hard snapshot/pre-agent/$LATEST"`
   - The literal substring `snapshot/pre-agent/` MUST appear in the script source so the must_haves grep gate passes.

3. **Create `.github/workflows/snapshot.yml`** as valid YAML with:
   - `name: Daily Snapshot Tag`
   - `on:` block with `schedule: - cron: '0 7 * * *'` and `workflow_dispatch: {}`
   - `permissions:` block with `contents: write`
   - Single job `tag-snapshot` on `runs-on: ubuntu-latest`
   - Steps:
     a. `uses: actions/checkout@v4` with `fetch-depth: 0` and `token: ${{ secrets.GITHUB_TOKEN }}`
     b. A `run:` step (bash) that:
        - Sets `DATE=$(date -u '+%Y-%m-%d')` and `TIME=$(date -u '+%H%M%S')` and `TAG="snapshot/$DATE-$TIME"`
        - Configures git user: `git config user.name 'github-actions[bot]'` and `git config user.email '41898282+github-actions[bot]@users.noreply.github.com'`
        - **Optional skip-if-quiet optimization**: `LAST_SNAP_SHA=$(git rev-list --tags='snapshot/*' --max-count=1 2>/dev/null || true)`; if non-empty AND equals `$(git rev-parse HEAD)`, `echo "No changes since last snapshot — skipping."` and `exit 0`
        - `git tag "$TAG"`
        - `git push origin "refs/tags/snapshot/*"` — scoped push, ONLY snapshot tags, never touches other tags
   - On failure the workflow just fails loudly. No rollback, no error swallowing.
   - The literal substring `snapshot/` MUST appear in the workflow source so the must_haves grep gate passes (it will — both the tag name and the push refspec contain it).

4. **Append to `.gitignore`** — use the Edit tool to add exactly one new line `.planning/snapshots/` at the end of the file. Read the file first to confirm the trailing newline situation, then append the line so the final file ends with a newline. Do NOT remove or reorder any existing lines. If `.planning/snapshots/` already happens to be in `.gitignore`, leave the file untouched (it's a no-op for that file but the other 3 still need to land).

After writing all four files, run the verification sequence below in order. The verify block's `<automated>` command runs them as one piped chain — if any step fails, the whole thing exits non-zero.

**Important — the verify run will create real artifacts that are intentionally kept:**
- A timestamped dir under `.planning/snapshots/` (gitignored, local-only)
- A local lightweight git tag `snapshot/pre-agent/<timestamp>` (NOT pushed; serves as the first rollback marker for the rest of the session)

Per the scope's explicit instruction, do NOT clean up either artifact after verification.
  </action>
  <verify>
    <automated>bash -n scripts/snapshot-pre.sh && bash -n scripts/snapshot-diff.sh && chmod +x scripts/snapshot-pre.sh scripts/snapshot-diff.sh && ./scripts/snapshot-pre.sh && LATEST=$(ls -1 .planning/snapshots/ | sort | tail -1) && test -f ".planning/snapshots/$LATEST/branches.txt" && test -f ".planning/snapshots/$LATEST/tags.txt" && test -f ".planning/snapshots/$LATEST/head.txt" && test -f ".planning/snapshots/$LATEST/status.txt" && git tag -l "snapshot/pre-agent/$LATEST" | grep -q "snapshot/pre-agent/$LATEST" && ./scripts/snapshot-diff.sh | grep -q "Rollback to pre-agent state: git reset --hard snapshot/pre-agent/$LATEST" && grep -qx ".planning/snapshots/" .gitignore && python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/snapshot.yml'))" && grep -q "refs/tags/snapshot/\*" .github/workflows/snapshot.yml && grep -q "cron: '0 7 \* \* \*'" .github/workflows/snapshot.yml && echo OK</automated>
  </verify>
  <done>
- `scripts/snapshot-pre.sh` exists, mode 0755, passes `bash -n`, runs end-to-end and produces the 4 log files + the `snapshot/pre-agent/<STAMP>` local tag
- `scripts/snapshot-diff.sh` exists, mode 0755, passes `bash -n`, runs after the snapshot and prints the rollback line containing `git reset --hard snapshot/pre-agent/<STAMP>` where `<STAMP>` matches the latest snapshot dir
- `.github/workflows/snapshot.yml` exists, parses as valid YAML, contains `cron: '0 7 * * *'`, `workflow_dispatch`, `contents: write`, `actions/checkout@v4` with `fetch-depth: 0`, and `refs/tags/snapshot/*` in the push refspec
- `.gitignore` contains the exact line `.planning/snapshots/` (no path prefix, no leading slash, no trailing wildcard)
- No other files modified, no other files created
- The verification-run artifacts (`.planning/snapshots/<STAMP>/` log dir, local `snapshot/pre-agent/<STAMP>` tag) are intentionally left in place per scope instruction
  </done>
</task>

</tasks>

<verification>
End-to-end smoke (covered by the `<automated>` chain above):
1. Both scripts pass `bash -n` and are made executable.
2. `./scripts/snapshot-pre.sh` runs cleanly, creates the 4 log files and the lightweight tag.
3. `./scripts/snapshot-diff.sh` reports against that fresh snapshot — since the working tree hasn't changed since the snapshot, the NEW/REMOVED/CHANGED sections will all be empty bodies, and the trailing rollback line will reference the just-created stamp.
4. `.gitignore` carries the new line.
5. The Action YAML is well-formed (Python `yaml.safe_load` parses it), schedules at 07:00 UTC, supports manual dispatch, and pushes only the `snapshot/*` ref namespace.

Manual operator follow-up (not blocking this plan's completion):
- On the next commit to `main`, the daily GitHub Action will run at 07:00 UTC and push the first `snapshot/<DATE>-<HHMMSS>` tag to `origin`. Visible under Actions → "Daily Snapshot Tag" and under Tags on the repo.
</verification>

<success_criteria>
- 4 file changes total: 3 new files + 1 single-line append to `.gitignore`
- Zero existing files (other than `.gitignore`) modified
- All four `must_haves.truths` observably hold after the task runs
- OPS-02 fence respected (none of the touched paths are inside the fence)
- The verification run's artifacts (snapshot dir + lightweight tag) are kept, not cleaned up
- No tests added, no test framework introduced, no `package.json` edits
</success_criteria>

<output>
Create `.planning/quick/260521-sjf-ship-snapshot-tooling-for-agent-paranoia/260521-sjf-SUMMARY.md` when done.
</output>
