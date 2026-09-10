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
  let clockHour = 12;
  const root = { classList: { add() {}, remove() {} }, dataset: {}, querySelector: () => null, querySelectorAll: () => layers };
  const window = { clearTimeout() {}, setTimeout() {}, matchMedia: () => ({ matches: false }), setInterval: f => { listeners.interval = f; },
    addEventListener: (name, f) => { listeners[name] = f; }, requestIdleCallback: f => idle.push(f) };
  const document = { readyState: 'interactive', documentElement: element, querySelector: () => root, addEventListener() {} };
  vm.runInNewContext(source, { window, document, navigator: { connection: { saveData, effectiveType: '4g' } },
    Date: class { getHours() { return clockHour; } }, requestAnimationFrame: f => f() });
  return { layers, listeners, idle, element, setHour: h => { clockHour = h; } };
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
  vm.runInNewContext(source, { window, document: { documentElement: html, readyState: 'interactive', querySelector: () => root, addEventListener() {} }, navigator: {}, Date: class { getHours() { return clock; } }, requestAnimationFrame: f => f() });
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

function tiltFixture({ permission, reduced = false, secure = true } = {}) {
  function target(extra = {}) {
    const listeners = new Map();
    return Object.assign({ addEventListener(n, f) { if (!listeners.has(n)) listeners.set(n, new Set()); listeners.get(n).add(f); },
      removeEventListener(n, f) { listeners.get(n)?.delete(f); }, emit(n, e = {}) { listeners.get(n)?.forEach(f => f(e)); },
      count(n) { return listeners.get(n)?.size || 0; } }, extra);
  }
  const frames = [], controls = [];
  const motion = target({ matches: reduced }), coarse = target({ matches: true }), fine = target({ matches: false });
  const scene = { style: {} };
  const root = target({ dataset: {}, offsetHeight: 800, offsetTop: 0, querySelector: q => q === '[data-house-scene]' ? scene : null,
    querySelectorAll: () => [], appendChild: b => controls.push(b) });
  const document = target({ hidden: false, documentElement: { lang: 'pt-br', dataset: {} }, querySelector: () => root, createElement: () => target({}) });
  const orientation = target({ angle: 0 });
  const window = target({ isSecureContext: secure, DeviceOrientationEvent: permission ? { requestPermission: permission } : {},
    screen: { orientation }, scrollY: 0, innerWidth: 375, setInterval() {},
    matchMedia: q => q.includes('reduced') ? motion : q.includes('coarse') ? coarse : fine });
  vm.runInNewContext(source, { window, document, navigator: {}, requestAnimationFrame: f => { frames.push(f); return frames.length; } });
  function drain() { let n = 0; while (frames.length) { assert.ok(n++ < 200); frames.shift()(); } }
  function values() { drain(); return (scene.style.transform.match(/translate\(([-.\d]+)px,([-.\d]+)px/) || []).slice(1).map(Number); }
  return { root, window, document, motion, controls, scene, orientation, drain, values, tilt: (beta, gamma) => window.emit('deviceorientation', { beta, gamma }) };
}
test('phone tilt calibrates at the holding angle and bounds large movements', () => {
  const f = tiltFixture();
  f.tilt(60, 10); assert.deepEqual(f.values(), [0, 0]);
  f.tilt(85, 35); const [x, y] = f.values(); assert.ok(x < -17.9 && x >= -18); assert.ok(y < -17.9 && y >= -18);
  f.tilt(160, 85); const bounded = f.values(); assert.ok(bounded.every(v => v >= -18 && v < -17.9));
  f.tilt(null, NaN); assert.deepEqual(f.values(), bounded);
  f.root.emit('pointerleave', { pointerType: 'touch' }); assert.deepEqual(f.values(), bounded);
  assert.equal(f.controls.length, 0);
});
test('landscape maps tilt into screen axes and recalibrates on rotation', () => {
  const f = tiltFixture(); f.tilt(50, 0); f.drain();
  f.orientation.angle = 90; f.orientation.emit('change');
  f.tilt(60, 10); assert.deepEqual(f.values(), [0, 0]);
  f.tilt(85, 10); const [x, y] = f.values(); assert.ok(x < -17.9); assert.ok(Math.abs(y) < .01);
});
test('hidden pages and reduced motion stop sensors and reset the scene', () => {
  const f = tiltFixture(); f.tilt(40, 0); f.tilt(65, 25); f.drain();
  f.document.hidden = true; f.document.emit('visibilitychange'); assert.equal(f.window.count('deviceorientation'), 0);
  f.document.hidden = false; f.document.emit('visibilitychange'); f.tilt(70, 20); assert.deepEqual(f.values(), [0, 0]);
  f.motion.matches = true; f.motion.emit('change'); f.drain();
  assert.equal(f.window.count('deviceorientation'), 0); assert.equal(f.scene.style.transform, '');
  f.motion.matches = false; f.motion.emit('change'); assert.equal(f.window.count('deviceorientation'), 1);
});
test('sensor permission is requested only by its button and grant enables tilt', async () => {
  let calls = 0;
  const f = tiltFixture({ permission: () => { calls++; return Promise.resolve('granted'); } });
  assert.equal(calls, 0); assert.equal(f.window.count('deviceorientation'), 0);
  f.controls[0].emit('click'); assert.equal(calls, 1); await flush();
  assert.equal(f.controls[0].hidden, true); assert.equal(f.window.count('deviceorientation'), 1);
});
for (const response of ['denied', 'rejected']) test(`permission ${response} leaves a usable static scene`, async () => {
  const f = tiltFixture({ permission: () => response === 'denied' ? Promise.resolve('denied') : Promise.reject(new Error('blocked')) });
  f.controls[0].emit('click'); await flush();
  assert.equal(f.window.count('deviceorientation'), 0);
  assert.equal(f.controls[0].textContent, 'Movimento indisponível');
  assert.equal(f.controls[0].disabled, true);
});
test('insecure pages and reduced motion never start sensors', () => {
  assert.equal(tiltFixture({ secure: false }).window.count('deviceorientation'), 0);
  const f = tiltFixture({ reduced: true, permission: () => { throw new Error('must not request'); } });
  assert.equal(f.controls[0].hidden, true); assert.equal(f.window.count('deviceorientation'), 0);
});

test('a small phone tilt is visible and retains image coverage', () => {
  const f = tiltFixture();
  f.tilt(50, 0); f.tilt(57.5, 7.5);
  assert.ok(f.values().every(v => v < -8.9 && v >= -9));
  assert.ok(f.scene.style.transform.includes('scale(1.0800)'));
});
