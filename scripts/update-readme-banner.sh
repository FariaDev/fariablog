#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
output_dir="$(mktemp -d "${TMPDIR:-/tmp}/fariablog-banner.XXXXXX")"
trap 'rm -rf "$output_dir"' EXIT
hugo --environment production --destination "$output_dir/site" --cacheDir "$output_dir/cache"
python3 - "$output_dir/site" <<'PY'
import html.parser
from pathlib import Path
import shutil
import sys
from urllib.parse import unquote, urlparse
class ImageParser(html.parser.HTMLParser):
    image = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta' and attrs.get('property') == 'og:image':
            self.image = attrs['content']
root = Path(sys.argv[1])
parser = ImageParser()
parser.feed((root / 'pt-br/index.html').read_text())
assert parser.image, 'home has no social image'
source = root / unquote(urlparse(parser.image).path).lstrip('/')
shutil.copyfile(source, 'static/og/fariablog.jpg')
PY
# Preserve the historical public image URL with the current identity.
magick static/og/fariablog.jpg -quality 88 static/fariablog.webp
