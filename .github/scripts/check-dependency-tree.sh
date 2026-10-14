#!/usr/bin/env bash
set -euo pipefail

ALLOWLIST=.github/dependency-tree-allowlist.txt
REPORT=$(mktemp)

npm ls --all --json > "$REPORT" 2> /dev/null || true

if ! jq -e 'type == "object"' "$REPORT" > /dev/null; then
  echo "::error::npm ls produced no dependency tree — run npm ci first"
  exit 1
fi

found=$(jq -r '.problems // [] | .[] | split(" ")[0:2] | join(" ")' "$REPORT" | sort -u)
allowed=$( (grep -v '^\s*$' "$ALLOWLIST" 2> /dev/null || true) | sort -u)

unexpected=$(comm -23 <(printf '%s\n' "$found" | sed '/^$/d') <(printf '%s\n' "$allowed" | sed '/^$/d'))
stale=$(comm -13 <(printf '%s\n' "$found" | sed '/^$/d') <(printf '%s\n' "$allowed" | sed '/^$/d'))

if [ -n "$unexpected" ]; then
  echo "::error::dependency tree has peer or version problems (npm ls --all):"
  printf '%s\n' "$unexpected"
  npm ls --all 2>&1 | grep -E 'invalid|missing' | sed -E 's/^[│├└─┬ ]+//' | sort -u || true
fi

if [ -n "$stale" ]; then
  echo "::error::$ALLOWLIST lists problems that no longer occur — delete these lines:"
  printf '%s\n' "$stale"
fi

if [ -n "$unexpected" ] || [ -n "$stale" ]; then
  exit 1
fi

echo "dependency tree clean ($(printf '%s\n' "$allowed" | sed '/^$/d' | wc -l | tr -d ' ') allowlisted)"
