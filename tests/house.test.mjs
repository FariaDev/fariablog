import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../assets/js/house.js', import.meta.url), 'utf8');
const inline = readFileSync(new URL('../layouts/partials/house-layer.html', import.meta.url), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const hours = ['noon', 'dusk', 'midnight'];
function layer(hour) {
  return { dataset: { hour, src: `/${hour}.webp`, srcset: `/${hour}-720.webp 720w` }, src: '', fetchPriority: 'low', naturalWidth: 720,
    setAttribute() {}, removeAttribute() {}, decode: () => Promise.resolve() };
}
for (const hour of hours) test(`first paint requests only ${hour}, at high priority`, () => {
  const layers = hours.map(layer);
  for (const img of layers) vm.runInNewContext(inline, { document: { documentElement: { dataset: { hour } }, currentScript: { previousElementSibling: img } } });
  assert.deepEqual(layers.filter(i => i.src).map(i => i.dataset.hour), [hour]);
  assert.equal(layers.find(i => i.src).fetchPriority, 'high');
  assert.ok(layers.find(i => i.src).srcset.includes('720w'));
});
function fixture({ saveData = false } = {}) {
  const layers = hours.map(layer), listeners = {}, idle = [];
  const element = { dataset: { hour: 'noon' }, classList: { add() {} } };
  let clockHour = 12;
  const root = { dataset: {}, querySelector: () => null, querySelectorAll: () => layers };
  const window = { matchMedia: () => ({ matches: false }), setInterval: f => { listeners.interval = f; },
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
  const root = { dataset: {}, offsetHeight: 800, offsetTop: 0, querySelector: () => scene, querySelectorAll: () => [], addEventListener: (name, f) => { events[name] = f; } };
  const window = { innerWidth: 1200, scrollY: 0, matchMedia: q => q.includes('reduced') ? reduced : fine, setInterval() {}, addEventListener() {} };
  vm.runInNewContext(source, { window, document: { querySelector: () => root, addEventListener() {} }, navigator: {}, requestAnimationFrame: f => { frames.push(f); return frames.length; } });
  const move = () => events.pointermove({ clientX: 100, clientY: 100, pointerType: 'mouse' });
  move(); assert.equal(frames.length, 0);
  fine.matches = true;
  move(); assert.equal(frames.length, 1);
  frames.shift()(); assert.ok(scene.style.transform.includes('translate'));
  reduced.matches = true; events.reduce();
  frames.shift()(); assert.equal(scene.style.transform, '');
  move(); assert.equal(frames.length, 0);
});
