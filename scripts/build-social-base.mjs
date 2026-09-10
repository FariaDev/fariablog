import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

// Only the empty card frame is rasterized here. Hugo adds page text and scenes.
const source = new URL('../assets/brand/social-base.svg', import.meta.url);
const output = new URL('../assets/brand/social-base.png', import.meta.url);
writeFileSync(output, new Resvg(readFileSync(source)).render().asPng());
