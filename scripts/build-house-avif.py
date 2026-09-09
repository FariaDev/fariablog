#!/usr/bin/env python3
"""Encode committed AVIF alternatives; CI checks fingerprints without an encoder."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'data/house_images.json'
SETTINGS = {
    'quality': 60,
    'depth': 10,
    'speed': 6,
    'widths': [720, 1080, 1280],
    # Only the newly generated desk/about sources are 1672 px wide. Keep
    # older 1280 px scenes at their native ceiling instead of upscaling them.
    'extra_widths': {'desk': [1536], 'about': [1536]},
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sources():
    return sorted(p for room in ('home', 'window', 'shelf', 'desk', 'about')
                  for p in (ROOT / 'assets/images' / room).glob('*.jpg'))


def widths_for(source):
    return SETTINGS['widths'] + SETTINGS['extra_widths'].get(source.parent.name, [])


def preview(source):
    raw = subprocess.check_output(['magick', str(source), '-resize', '48x', '-strip', '-quality', '35', 'jpg:-'])
    return 'data:image/jpeg;base64,' + base64.b64encode(raw).decode('ascii')


def check(manifest):
    assert manifest['settings'] == SETTINGS, 'AVIF encoding settings changed'
    expected = {p.relative_to(ROOT / 'assets').as_posix() for p in sources()}
    assert set(manifest['sources']) == expected, 'house image list changed'
    for source in sources():
        key = source.relative_to(ROOT / 'assets').as_posix()
        entry = manifest['sources'][key]
        thumbnail = base64.b64decode(entry['preview'].split(',', 1)[1], validate=True)
        assert thumbnail.startswith(b'\xff\xd8') and thumbnail.endswith(b'\xff\xd9'), f'invalid preview: {key}'
        assert len(entry['preview']) < 2400, f'oversized preview: {key}'
        assert digest(source) == entry['sha256'], f'changed source: {key}'
        assert [v['width'] for v in entry['variants']] == widths_for(source), f'missing sizes: {key}'
        for variant in entry['variants']:
            path = ROOT / 'assets' / variant['path']
            assert digest(path) == variant['sha256'], f'changed AVIF: {path}'
            assert path.stat().st_size == variant['bytes'], f'incorrect size: {path}'
            assert b'ftypavif' in path.read_bytes()[:32], f'not an AVIF: {path}'
    variant_count = sum(len(entry['variants']) for entry in manifest['sources'].values())
    print(f"Verified AVIF sources and fingerprints: {len(expected)} scenes, {variant_count} variants.")


def generate():
    previous = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    result = {'version': 1, 'settings': SETTINGS, 'sources': {}}
    for source in sources():
        key = source.relative_to(ROOT / 'assets').as_posix()
        old = previous.get('sources', {}).get(key, {})
        if (previous.get('settings') == SETTINGS and old.get('sha256') == digest(source)
            and all((ROOT / 'assets' / v['path']).exists()
                    and digest(ROOT / 'assets' / v['path']) == v['sha256'] for v in old.get('variants', []))
            and len(old.get('variants', [])) == len(widths_for(source))):
            if 'preview' not in old:
                old['preview'] = preview(source)
            result['sources'][key] = old
            continue
        variants = []
        for width in widths_for(source):
            output = ROOT / 'assets/house-avif' / source.parent.name / f'{source.stem}-{width}.avif'
            output.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(['magick', str(source), '-resize', f'{width}x', '-strip', '-depth', '10',
                            '-define', 'heic:speed=6', '-quality', '60', str(output)], check=True)
            variants.append({'path': output.relative_to(ROOT / 'assets').as_posix(), 'width': width,
                             'sha256': digest(output), 'bytes': output.stat().st_size})
        result['sources'][key] = {'sha256': digest(source), 'variants': variants, 'preview': preview(source)}
    MANIFEST.parent.mkdir(exist_ok=True)
    MANIFEST.write_text(json.dumps(result, indent=2) + '\n')
    check(result)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.check:
        try:
            check(json.loads(MANIFEST.read_text()))
        except (AssertionError, FileNotFoundError, KeyError) as error:
            raise SystemExit(f'{error}. Run python3 scripts/build-house-avif.py')
    else:
        generate()
