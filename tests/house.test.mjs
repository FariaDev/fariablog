import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../assets/js/house.js', import.meta.url), 'utf8');
const inline = readFileSync(new URL('../layouts/partials/house-layer.html', import.meta.url), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const hours = ['noon', 'dusk', 'midnight'];
function layer(hour) {
  const source = { dataset: { srcset: '/test.avif 720w' } };
  return { parentElement: { querySelector: () => source }, classList: { add() {}, remove() {} }, dataset: { hour, src: `/${hour}.webp`, srcset: `/${hour}-720.webp 720w` }, src: '', fetchPriority: 'low', naturalWidth: 720,
    setAttribute() {}, removeAttribute() {}, decode: () => Promise.resolve() };
}
for (const hour of hours) test(`first paint requests only ${hour}, at high priority`, () => {
  const layers = hours.map(layer);
  for (const img of layers) vm.runInNewContext(inline, { document: { documentElement: { dataset: { hour } }, currentScript: { previousElementSibling: { querySelector: q => q === 'img' ? img : img.parentElement.querySelector() } } } });
  assert.deepEqual(layers.filter(i => i.src).map(i => i.dataset.hour), [hour]);
  assert.equal(layers.find(i => i.src).fetchPriority, 'high');
  assert.ok(layers.find(i => i.src).srcset.includes('720w'));
});
function fixture({ saveData = false } = {}) {
  const layers = hours.map(layer), listeners = {}, idle = [];
  const element = { dataset: { hour: 'noon' }, classList: { add() {} } };
  let clockHour = 12, clockMinute = 0;
  const root = { classList: { add() {}, remove() {} }, dataset: {}, querySelector: () => null, querySelectorAll: () => layers };
  const window = { clearTimeout() {}, setTimeout() {}, matchMedia: () => ({ matches: false }), setInterval: f => { listeners.interval = f; },
    addEventListener: (name, f) => { listeners[name] = f; }, requestIdleCallback: f => idle.push(f) };
  const document = { readyState: 'interactive', documentElement: element, querySelector: () => root, addEventListener() {} };
  vm.runInNewContext(source, { window, document, navigator: { connection: { saveData, effectiveType: '4g' } },
    Date: class { getHours() { return clockHour; } getMinutes() { return clockMinute; } }, requestAnimationFrame: f => f() });
  return { layers, listeners, idle, element,
    setHour: h => { clockHour = h; clockMinute = 0; },
    setTime: (h, m) => { clockHour = h; clockMinute = m; } };
}
const flush = async () => { for(let i=0;i<5;i++) await Promise.resolve(); };
test('invisible variants wait for load and idle', async () => {
  const f = fixture(); await flush();
  assert.deepEqual(f.layers.filter(i=>i.src).map(i=>i.dataset.hour), ['noon']);
  assert.equal(f.idle.length, 0);
  f.listeners.load();
  assert.equal(f.layers.filter(i=>i.src).length, 1);
  f.idle[0]();
  assert.equal(f.layers.filter(i=>i.src).length, 3);
});
test('save-data skips warming but a clock change loads the new scene', async () => {
  const f = fixture({ saveData: true }); await flush(); f.listeners.load();
  assert.equal(f.idle.length, 0);
  f.setHour(18); f.listeners.interval(); await flush();
  assert.equal(f.element.dataset.hour, 'dusk');
  assert.equal(f.layers[2].src, '');
});
test('room lighting follows sunrise, dusk and night boundaries', async () => {
  const f = fixture(); await flush();
  for (const [hour, minute, expected] of [
    [0, 0, 'midnight'], [5, 59, 'midnight'], [6, 0, 'noon'],
    [17, 29, 'noon'], [17, 30, 'dusk'], [18, 59, 'dusk'],
    [19, 0, 'midnight'], [21, 0, 'midnight'], [23, 59, 'midnight']
  ]) {
    f.setTime(hour, minute); f.listeners.interval(); await flush();
    assert.equal(f.element.dataset.hour, expected,
      `${hour}:${String(minute).padStart(2, '0')} should use ${expected}`);
  }
});
test('a stale decode cannot change the current room lighting', async () => {
  const f = fixture(); await flush();
  let finish;
  f.layers[1].decode = () => new Promise(resolve => { finish = resolve; });
  f.setHour(18); f.listeners.interval();
  f.setHour(22); f.listeners.interval(); await flush();
  finish(); await flush();
  assert.equal(f.element.dataset.hour, 'midnight');
});
test('mouse motion requires fine pointer and stops when reduced motion changes', () => {
  const events = {}, frames = [];
  const reduced = { matches: false, addEventListener: (_, f) => { events.reduce = f; } };
  const fine = { matches: false, addEventListener() {} };
  const scene = { style: {} };
  const root = { dataset: {}, offsetHeight: 800, offsetTop: 0, querySelector: q => q === '[data-house-scene]' ? scene : null, querySelectorAll: () => [], addEventListener: (name, f) => { events[name] = f; } };
  const window = { innerWidth: 1200, scrollY: 0, matchMedia: q => q.includes('reduced') ? reduced : fine, setInterval() {}, addEventListener() {} };
  vm.runInNewContext(source, { window, document: { documentElement: { dataset: {} }, querySelector: () => root, addEventListener() {} }, navigator: {}, requestAnimationFrame: f => { frames.push(f); return frames.length; } });
  const move = () => events.pointermove({ clientX: 100, clientY: 100, pointerType: 'mouse' });
  move(); assert.equal(frames.length, 0);
  fine.matches = true;
  move(); assert.equal(frames.length, 1);
  frames.shift()(); assert.ok(scene.style.transform.includes('translate'));
  reduced.matches = true; events.reduce();
  frames.shift()(); assert.equal(scene.style.transform, '');
  move(); assert.equal(frames.length, 0);
});

function lampFixture({ stored = 'on', reduced = false } = {}) {
  const layers = [layer('noon'), ...['dusk', 'midnight'].flatMap(h => ['on', 'off'].map(l => {
    const img = layer(h); img.dataset.lamp = l; img.dataset.src = `/${h}-${l}.webp`; return img;
  }))];
  const events = {}, attrs = {}, idle = [], storage = {}, timers = [];
  const label = { textContent: '' };
  const lamp = { dataset: { onLabel: 'Acender', offLabel: 'Apagar' }, hidden: true,
    addEventListener: (name, f) => { events[name] = f; }, setAttribute: (k, v) => { attrs[k] = v; }, querySelector: () => label };
  const html = { dataset: { hour: 'midnight', lamp: stored }, classList: { add() {} } };
  const root = { dataset: {}, classList: { add() {}, remove() {} }, querySelector: q => q === '[data-desk-lamp]' ? lamp : null, querySelectorAll: () => layers };
  const window = { matchMedia: () => ({ matches: reduced }), setInterval: f => { events.interval = f; }, addEventListener: (n, f) => { events[n] = f; },
    clearTimeout() {}, setTimeout: f => { timers.push(f); }, requestIdleCallback: f => idle.push(f), sessionStorage: { getItem: k => k in storage ? storage[k] : stored, setItem: (k, v) => { storage[k] = v; } } };
  let clock = 23;
  vm.runInNewContext(source, { window, document: { documentElement: html, readyState: 'interactive', querySelector: () => root, addEventListener() {} }, navigator: {}, Date: class { getHours() { return clock; } getMinutes() { return 0; } }, requestAnimationFrame: f => f() });
  return { layers, events, attrs, idle, storage, html, lamp, timers, setHour: h => { clock = h; } };
}
test('About initial paint selects exactly one lamp exposure, AVIF before WebP', () => {
  for (const lamp of ['on', 'off']) {
    const f = lampFixture({ stored: lamp });
    f.layers.forEach(i => { i.src = ''; });
    for (const img of f.layers) vm.runInNewContext(inline, { document: { documentElement: f.html, currentScript: { previousElementSibling: { querySelector: q => q === 'img' ? img : img.parentElement.querySelector() } } } });
    assert.deepEqual(f.layers.filter(i => i.src).map(i => [i.dataset.hour, i.dataset.lamp]), [['midnight', lamp]]);
    assert.ok(f.layers.find(i => i.src).parentElement.querySelector().srcset.endsWith('720w'));
  }
});
test('lamp saves the choice immediately but waits for decoded exposure', async () => {
  const f = lampFixture(); await flush();
  let finish;
  f.layers[4].decode = () => new Promise(r => { finish = r; });
  f.events.click();
  assert.equal(f.html.dataset.lamp, 'on');
  assert.equal(f.attrs['aria-busy'], 'true');
  assert.equal(f.storage['fariablog-lamp'], 'off');
  finish(); await flush();
  assert.equal(f.html.dataset.lamp, 'off');
  assert.equal(f.attrs['aria-pressed'], 'false');
  assert.equal(f.storage['fariablog-lamp'], 'off');
  assert.equal(f.attrs['aria-busy'], 'false');
});
test('failed and stale lamp decodes preserve the latest valid exposure', async () => {
  const f = lampFixture(); await flush();
  f.layers[4].naturalWidth = 0;
  f.layers[4].decode = () => Promise.reject(new Error('network'));
  f.events.click(); await flush();
  assert.equal(f.html.dataset.lamp, 'on');
  assert.equal(f.storage['fariablog-lamp'], 'off');
  f.layers[4].naturalWidth = 720;
  let finish;
  f.layers[4].decode = () => new Promise(r => { finish = r; });
  f.events.click(); await flush();
  f.events.click(); f.events.click(); await flush(); finish(); await flush();
  assert.equal(f.html.dataset.lamp, 'on');
  assert.equal(f.attrs['aria-busy'], 'false');
});
test('warm-up only loads the preferred lamp exposures and noon hides the control', async () => {
  const f = lampFixture({ stored: 'off', reduced: true }); await flush();
  f.events.load(); f.idle[0]();
  assert.deepEqual(f.layers.filter(i => i.src).map(i => i.dataset.lamp || 'noon'), ['noon', 'off', 'off']);
  f.events.click(); await flush();
  assert.equal(f.timers.length, 0, 'reduced motion has no fade timer');
  f.setHour(12); f.events.interval(); await flush();
  assert.equal(f.lamp.hidden, true);
});
test('a restored room rereads the lamp choice made on another page', async () => {
  const f = lampFixture(); await flush();
  f.storage['fariablog-lamp'] = 'off';
  f.events.pageshow(); await flush();
  assert.equal(f.html.dataset.lamp, 'off');
  assert.equal(f.layers[4].src, '/midnight-off.webp');
  f.storage['fariablog-lamp'] = 'on';
  f.events.pageshow(); await flush();
  assert.equal(f.html.dataset.lamp, 'on');
});
test('page refresh events cannot cancel an in-flight lamp choice', async () => {
  const f = lampFixture(); await flush();
  let finish;
  f.layers[4].decode = () => new Promise(r => { finish = r; });
  f.events.click(); f.events.pageshow(); f.events.interval();
  finish(); await flush();
  assert.equal(f.html.dataset.lamp, 'off');
  assert.equal(f.storage['fariablog-lamp'], 'off');
});
for (const reduced of [false, true]) test(`descent preserves focus and history with reduced motion ${reduced}`, () => {
  const calls = []; let click;
  const target = { focus: options => calls.push(['focus', options.preventScroll]), scrollIntoView: options => calls.push(['scroll', options.behavior]) };
  const root = { dataset: {}, querySelectorAll: () => [], querySelector: q => q === '.scene-descent' ? { addEventListener: (_, f) => { click = f; } } : null };
  const document = { documentElement: { dataset: {} }, querySelector: () => root, getElementById: () => target, addEventListener() {} };
  const window = { matchMedia: () => ({ matches: reduced }), addEventListener() {}, setInterval() {}, location: { hash: '' }, history: { pushState: (_, __, hash) => calls.push(['hash', hash]) } };
  vm.runInNewContext(source, { window, document, navigator: {} });
  click({ button: 0, preventDefault: () => calls.push(['prevent']) });
  assert.deepEqual(calls, [['prevent'], ['hash', '#leitura'], ['focus', true], ['scroll', reduced ? 'instant' : 'smooth']]);
  calls.length = 0;
  click({ button: 0, ctrlKey: true });
  assert.equal(calls.length, 0, 'modified links retain native navigation');
});

test('navigation before decode carries the chosen light into the next room', async () => {
  const first = lampFixture(); await flush();
  first.layers[4].decode = () => new Promise(() => {});
  first.events.click();
  const next = lampFixture({ stored: first.storage['fariablog-lamp'] }); await flush();
  assert.equal(next.html.dataset.lamp, 'off');
  assert.equal(next.attrs['aria-pressed'], 'false');
});
test('BFCache restore replaces a pending choice with the latest room preference', async () => {
  const f = lampFixture(); await flush();
  let finish;
  f.layers[4].decode = () => new Promise(resolve => { finish = resolve; });
  f.events.click();
  f.storage['fariablog-lamp'] = 'on';
  f.events.pageshow({ persisted: true }); await flush();
  finish(); await flush();
  assert.equal(f.html.dataset.lamp, 'on');
  assert.equal(f.attrs['aria-busy'], 'false');
});
