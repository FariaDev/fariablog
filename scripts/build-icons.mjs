import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

// Same vector source as the colophon; resvg preserves the glass gradient.
const svg = readFileSync(new URL('../assets/brand/window.svg', import.meta.url));
writeFileSync(new URL('../static/favicon.svg', import.meta.url), svg);
for (const size of [16, 32, 48, 180, 192, 512]) {
  const name = size === 180 ? 'apple-touch-icon.png' : size <= 48 ? `favicon-${size}x${size}.png` : `favicon-${size}.png`;
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size }, font: { loadSystemFonts: false } }).render().asPng();
  writeFileSync(new URL(`../static/${name}`, import.meta.url), png);
}
