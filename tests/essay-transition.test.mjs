import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
const source = readFileSync(new URL('../assets/js/essay-transition.js', import.meta.url), 'utf8');
function fixture({ essay = false, reduced = false } = {}) {
  const { document } = parseHTML(`<html><body>${essay ? '<span data-essay-title data-essay-index="/en/posts/">Reading</span>' : '<a class="texts-row" href="https://example.com/en/posts/reading/"><span class="texts-label">Reading</span></a><a class="texts-row" href="https://example.com/en/posts/latin/"><span class="texts-label">Latin</span></a>'}</body></html>`);
  for (const el of document.querySelectorAll('span')) el.getBoundingClientRect = () => ({ top: 100, bottom: 140 });
  const events = {}, navigation = { activation: { from: { url: 'https://example.com/en/posts/reading/' } } };
  vm.runInNewContext(source, { document, location: { href: 'https://example.com/en/posts/' }, URL, innerHeight: 800,
    matchMedia: () => ({ matches: reduced }), window: { navigation, addEventListener: (name, f) => { events[name] = f; } } });
  let finish, ready, skipped = false;
  const transition = { finished: new Promise(r => { finish = r; }), ready: new Promise(r => { ready = r; }), skipTransition: () => { skipped = true; } };
  return { document, events, transition, finish, ready, skipped: () => skipped, navigation };
}
test('only the selected title participates, and outgoing names are cleaned for BFCache', async () => {
  const f = fixture();
  f.events.pageswap({ viewTransition: f.transition, activation: { entry: { url: 'https://example.com/en/posts/latin/' } } });
  const titles = f.document.querySelectorAll('span');
  assert.equal(titles[0].style.viewTransitionName, '');
  assert.equal(titles[1].style.viewTransitionName, 'essay-title');
  f.finish(); await Promise.resolve();
  assert.equal(titles[1].style.viewTransitionName, '');
});
test('returning to the catalogue matches the originating essay', async () => {
  const f = fixture();
  f.events.pagereveal({ viewTransition: f.transition });
  const title = f.document.querySelector('span');
  assert.equal(title.style.viewTransitionName, 'essay-title');
  f.ready(); await Promise.resolve();
  assert.equal(title.style.viewTransitionName, '');
});
test('the essay title joins only transitions involving its catalogue', () => {
  const f = fixture({ essay: true });
  f.navigation.activation.from.url = 'https://example.com/en/';
  f.events.pagereveal({ viewTransition: f.transition });
  assert.equal(f.document.querySelector('span').style.viewTransitionName, '');
  f.navigation.activation.from.url = 'https://example.com/en/posts/';
  f.events.pagereveal({ viewTransition: f.transition });
  assert.equal(f.document.querySelector('span').style.viewTransitionName, 'essay-title');
});
test('reduced motion skips transitions; unsupported navigations remain ordinary links', () => {
  const f = fixture({ reduced: true });
  f.events.pageswap({ viewTransition: f.transition });
  assert.equal(f.skipped(), true);
  assert.doesNotThrow(() => f.events.pageswap({}));
});
