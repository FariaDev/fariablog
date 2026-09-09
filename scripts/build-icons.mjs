import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

// Keep the full window for large marks; use a pixel-aligned drawing in tabs.
const svg = readFileSync(new URL('../assets/brand/window.svg', import.meta.url));
const favicon = readFileSync(new URL('../assets/brand/favicon.svg', import.meta.url));
writeFileSync(new URL('../static/window-signature.svg', import.meta.url), svg);
writeFileSync(new URL('../static/favicon.svg', import.meta.url), favicon);
for (const size of [16, 32, 48, 180, 192, 512]) {
  const name = size === 180 ? 'apple-touch-icon.png' : size <= 48 ? `favicon-${size}x${size}.png` : `favicon-${size}.png`;
  const png = new Resvg(size <= 48 ? favicon : svg, { fitTo: { mode: 'width', value: size }, font: { loadSystemFonts: false } }).render().asPng();
  writeFileSync(new URL(`../static/${name}`, import.meta.url), png);
}
