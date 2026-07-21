#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

for command in hugo python3 node npm; do
  command -v "$command" >/dev/null 2>&1 || {
    printf 'verify: %s is required\n' "$command" >&2
    exit 1
  }
done

hugo_output="$(hugo version 2>&1)"
printf '%s\n' "$hugo_output" | grep -Eiq '\+extended([+ ]|$)' || {
  printf 'verify: Hugo Extended is required\n' >&2
  exit 1
}

python3 -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)' || {
  printf 'verify: Python 3.11 or newer is required (detected %s)\n' "$(python3 --version 2>&1)" >&2
  exit 1
}

node_major="$(node -p 'process.versions.node.split(".")[0]')"
if (( node_major < 18 )); then
  printf 'verify: Node.js 18 or newer is required (detected %s)\n' "$(node --version 2>&1)" >&2
  exit 1
fi

hugo_version="$(printf '%s\n' "$hugo_output" | sed -E 's/^hugo v([0-9]+\.[0-9]+\.[0-9]+).*/\1/')"
python3 - "$hugo_version" <<'PY' || {
import sys
try:
    detected = tuple(int(part) for part in sys.argv[1].split("."))
except ValueError:
    raise SystemExit(1)
raise SystemExit(0 if detected >= (0, 148, 1) else 1)
PY
  printf 'verify: Hugo 0.148.1 or newer is required (detected %s)\n' "$hugo_version" >&2
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
npm test

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git diff --check
fi
printf '%s\n' "Verification passed: builds, metadata, JSON-LD, links, HTML attributes, responsive images, search assets, and cache policy."
