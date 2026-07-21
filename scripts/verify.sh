#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

for command in hugo python3 node; do
  command -v "$command" >/dev/null 2>&1 || {
    printf 'verify: %s is required\n' "$command" >&2
    exit 1
  }
done

hugo version 2>&1 | grep -Eiq '\+extended([+ ]|$)' || {
  printf 'verify: Hugo Extended is required\n' >&2
  exit 1
}

verify_tmp="$(mktemp -d "${TMPDIR:-/tmp}/fariablog-verify.XXXXXX")"
trap 'rm -rf "$verify_tmp"' EXIT
export HUGO_CACHEDIR="$verify_tmp/cache"

production_dir="$verify_tmp/production"
development_dir="$verify_tmp/development"
hugo --gc --minify --environment production --destination "$production_dir"
hugo --gc --minify --environment development --destination "$development_dir"

python3 scripts/verify.py "$repo_root" "$production_dir" "$development_dir"
node --check assets/js/search.js
node --check assets/js/article.js

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git diff --check
fi
printf '%s\n' "Verification passed: builds, metadata, JSON-LD, links, HTML attributes, responsive images, search assets, and cache policy."
