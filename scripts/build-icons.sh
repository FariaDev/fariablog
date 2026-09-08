#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# The 16px mark is optically drawn on its pixel grid; larger marks use the master.
magick -size 16x16 xc:'#f3eee4' +antialias -fill '#6e2430' -draw 'rectangle 3,2 12,13' -fill '#f3eee4' -draw 'rectangle 5,4 6,6 rectangle 5,8 6,11 polygon 9,4 10,5 10,6 9,6 polygon 9,8 10,8 10,10 9,11' -strip -depth 8 static/favicon-16x16.png
for size in 32 48 180 192 512; do
  target="static/favicon-${size}.png"
  case "$size" in
    32|48) target="static/favicon-${size}x${size}.png" ;;
    180) target="static/apple-touch-icon.png" ;;
  esac
  magick -density 1152 -background '#f3eee4' static/favicon.svg -resize "${size}x${size}" -strip -depth 8 "$target"
done
magick static/favicon-16x16.png static/favicon-32x32.png static/favicon-48x48.png static/favicon.ico
