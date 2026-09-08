import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
const source = readFileSync(new URL('../assets/js/dock.js', import.meta.url), 'utf8');
function fixture() {
  const { document, window } = parseHTML('<html><body><nav data-threshold-nav><a data-search-open href="/search/">Search</a><form data-dock-search hidden><input data-search-input><button data-search-close>Close</button></form></nav><textarea></textarea><div contenteditable="true"></div></body></html>');
  const input = document.querySelector('input'), form = document.querySelector('form'), lens = document.querySelector('a');
  let focused;
  input.focus = () => { focused = input; };
  lens.focus = () => { focused = lens; };
  input.scrollIntoView = () => {};
  vm.runInNewContext(source, { document, window: { setTimeout: f => f() }, Event: window.Event });
  function key(target, value, extra = {}) {
    const event = new window.Event('keydown', { bubbles: true, cancelable: true });
    Object.assign(event, { key: value }, extra);
    target.dispatchEvent(event);
    return event;
  }
  return { document, input, form, lens, key, focus: () => focused };
}
test('/ opens and focuses search; Escape closes and restores focus', () => {
  const f = fixture();
  f.key(f.document.body, '/');
  assert.equal(f.form.hidden, false);
  assert.equal(f.focus(), f.input);
  f.key(f.input, 'Escape');
  assert.equal(f.form.hidden, true);
  assert.equal(f.focus(), f.lens);
});
test('typing or modified shortcuts never open search', () => {
  const f = fixture();
  for(const target of f.document.querySelectorAll('input,textarea,[contenteditable]')) {
    f.key(target, '/'); assert.equal(f.form.hidden, true);
  }
  for(const modifier of ['ctrlKey', 'metaKey', 'altKey']) {
    f.key(f.document.body, '/', { [modifier]: true }); assert.equal(f.form.hidden, true);
  }
});
