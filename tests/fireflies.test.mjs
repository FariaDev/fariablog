import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../assets/js/fireflies.js', import.meta.url), 'utf8');
function fixture({ random = 0, reduced = false, saveData = false, stored = null, hour = 'midnight' } = {}) {
  const events = {}, timers = new Map(), appended = [];
  let seq = 0, state = stored;
  const motion = { matches: reduced, addEventListener: (_, f) => { events.motion = f; } };
  const scene = { appendChild: el => appended.push(el) };
  const root = { querySelector: () => scene };
  const document = { hidden: false, documentElement: { dataset: { hour } }, querySelector: () => root,
    addEventListener: (n, f) => { events[n] = f; }, createElement: () => ({ children: [], setAttribute() {}, appendChild(el) { this.children.push(el); }, remove() { this.removed = true; } }) };
  const connection = { saveData, effectiveType: '4g', addEventListener: (_, f) => { events.connection = f; } };
  const Observer = class { constructor(f) { events.intersection = f; } observe() {} };
  const MutationObserver = class { constructor(f) { events.hour = f; } observe() {} };
  const window = { IntersectionObserver: Observer, MutationObserver, matchMedia: () => motion, sessionStorage: { getItem: () => state, setItem: (_, v) => { state = v; } },
    setTimeout: f => { timers.set(++seq, f); return seq; }, clearTimeout: id => timers.delete(id), addEventListener: (n, f) => { events[n] = f; } };
  vm.runInNewContext(source, { document, window, navigator: { connection }, Math: { random: () => random }, IntersectionObserver: Observer, MutationObserver });
  const visible = ratio => events.intersection([{ intersectionRatio: ratio }]);
  const run = () => { const [id, fn] = [...timers][0]; timers.delete(id); fn(); };
  return { document, motion, connection, events, timers, appended, visible, run, state: () => state };
}
test('fireflies are rare and wait for a visible night window', () => {
  const quiet = fixture({ random: .5 }); quiet.visible(1);
  assert.equal(quiet.state(), 'quiet'); assert.equal(quiet.timers.size, 0);
  const f = fixture(); f.visible(.4); assert.equal(f.timers.size, 0);
  f.visible(.8); assert.equal(f.timers.size, 1); assert.equal(f.appended.length, 0);
  f.run(); assert.equal(f.appended[0].children.length, 3); assert.equal(f.state(), 'seen');
  f.run(); assert.equal(f.appended[0].removed, true);
  f.visible(1); assert.equal(f.timers.size, 0);
  const revisit = fixture({ stored: 'seen' }); revisit.visible(1); assert.equal(revisit.timers.size, 0);
});
test('motion, data saving and daytime prevent both scheduling and particles', () => {
  for (const options of [{ reduced: true }, { saveData: true }, { hour: 'noon' }]) {
    const f = fixture(options); f.visible(1); assert.equal(f.timers.size, 0); assert.equal(f.appended.length, 0);
  }
});
test('leaving the hero cancels the pending visit; hiding the tab removes active lights', () => {
  const f = fixture(); f.visible(1); f.visible(0); assert.equal(f.timers.size, 0);
  f.visible(1); f.run(); f.document.hidden = true; f.events.visibilitychange();
  assert.equal(f.appended[0].removed, true); assert.equal(f.timers.size, 0);
  f.document.hidden = false; f.events.visibilitychange(); assert.equal(f.timers.size, 0);
});
