#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/build-icons.mjs
magick static/favicon-16x16.png static/favicon-32x32.png static/favicon-48x48.png static/favicon.ico
