#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# scripts/canary.sh
#
# Phase 5 canary wrapper — thin bash entry point for the smoke harness in
# canary mode. Ref: CONTEXT D-02 (wrapper rationale) and D-03 (DEPLOY_URL
# override semantics).
#
# USAGE:
#   scripts/canary.sh v1      # OPS-04: v1 back-compat canary
#   scripts/canary.sh v2      # OPS-05: v2 batch canary
#   scripts/canary.sh         # Run both v1 and v2 sequentially (D-02 default)
#
# Or via npm:
#   npm run canary:v1
#   npm run canary:v2
#   npm run canary
#
# DEPLOY_URL (D-03):
#   Defaults to https://www.moulinareves.com. Override via env:
#     DEPLOY_URL=https://my-preview.vercel.app npm run canary:v1
#
# DASHBOARD_PASSWORD (pre-condition — REQUIRED):
#   The harness mints a maison_session cookie using createSession() from
#   src/lib/auth.ts, which reads DASHBOARD_PASSWORD. This value MUST match
#   the Vercel project's DASHBOARD_PASSWORD env var exactly. If they differ,
#   checkAuth on the deployed endpoint returns 401 and the canary fails.
#   Source your local .env.local before running:
#     source .env.local && npm run canary:v1
#   Or set it explicitly:
#     DASHBOARD_PASSWORD=<secret> npm run canary:v1
# ---------------------------------------------------------------------------

set -euo pipefail

# D-03: Default to production URL; operator can override via env var.
DEPLOY_URL="${DEPLOY_URL:-https://www.moulinareves.com}"

ARG="${1:-}"

case "$ARG" in
  v1)
    # OPS-04: Run the v1 back-compat canary only.
    TARGET_URL="$DEPLOY_URL" npx tsx scripts/smoke-feedback-v2.mjs --canary v1
    ;;
  v2)
    # OPS-05: Run the v2 batch canary only.
    TARGET_URL="$DEPLOY_URL" npx tsx scripts/smoke-feedback-v2.mjs --canary v2
    ;;
  "")
    # No arg: run both v1 and v2 sequentially (D-02 default behaviour).
    TARGET_URL="$DEPLOY_URL" npx tsx scripts/smoke-feedback-v2.mjs
    ;;
  *)
    echo "usage: scripts/canary.sh [v1|v2]" >&2
    exit 2
    ;;
esac
