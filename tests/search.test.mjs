import assert from 'node:assert/strict';
import test from 'node:test';
import { parseHTML } from 'linkedom';
import { initSearch } from '../assets/js/search.js';

const records = [
  {
    title: 'Antifragile Notes',
    url: '/en/posts/antifragile/',
    summary: 'Notes about chaos.',
    content: 'Benefit from disorder.',
    tags: ['Philosophy'],
    date: '2025-01-01',
  },
  {
    title: 'Reading and the Brain',
    url: '/en/posts/reading/',
    summary: 'Reading benefits.',
    content: 'Neuroscience and books.',
    tags: ['Reading'],
    date: '2025-01-02',
  },
];

class FakeFuse {
  static instances = 0;

  constructor(items) {
    this.items = items;
    FakeFuse.instances += 1;
  }

  search(query) {
    return this.items
      .filter((item) => [item._title, item._summary, item._content, item._tags].some((value) => value.includes(query)))
      .map((item) => ({ item }));
  }
}

function fixture({ url = 'https://fariablog.com/en/search/', fetchImpl } = {}) {
  const { window, document } = parseHTML(`<html><body>
    <article class="site-search" data-search-endpoint="/en/index.json"
      data-search-empty="Type a term." data-search-one="publication found"
      data-search-many="publications found" data-search-none="No document found."
      data-search-error="The search index could not be loaded.">
      <input data-search-input>
      <button type="button" data-clear-search hidden>Clear</button>
      <p data-search-status>Type a term.</p>
      <div data-search-results hidden></div>
      <template data-search-result-template>
        <article><h3><a data-result-link></a></h3><time data-result-date></time><p data-result-summary hidden></p></article>
      </template>
      <div data-search-entries><article>Fallback entry</article></div>
    </article></body></html>`);

  const calls = [];
  const resolvedFetch = fetchImpl || (async (endpoint, options) => {
    calls.push({ endpoint, options });
    return { ok: true, json: async () => records };
  });
  const controller = initSearch({
    root: document,
    fetchImpl: resolvedFetch,
    Fuse: FakeFuse,
    location: new URL(url),
  });
  return {
    window,
    controller,
    calls,
    input: document.querySelector('[data-search-input]'),
    clear: document.querySelector('[data-clear-search]'),
    status: document.querySelector('[data-search-status]'),
    results: document.querySelector('[data-search-results]'),
    entries: document.querySelector('[data-search-entries]'),
  };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test.beforeEach(() => {
  FakeFuse.instances = 0;
});

test('empty input preserves progressive-enhancement entries', async () => {
  const page = fixture();
  await page.controller.run();
  assert.equal(page.clear.hidden, true);
  assert.equal(page.results.hidden, true);
  assert.equal(page.entries.hidden, false);
  assert.equal(page.status.textContent, 'Type a term.');
  assert.equal(page.calls.length, 0);
});

test('successful query fetches and renders a result', async () => {
  const page = fixture();
  page.input.value = 'chaos';
  await page.controller.run();
  assert.equal(page.calls.length, 1);
  assert.equal(page.entries.hidden, true);
  assert.equal(page.results.hidden, false);
  assert.equal(page.results.querySelector('[data-result-link]').textContent, 'Antifragile Notes');
  assert.equal(page.results.querySelector('[data-result-link]').getAttribute('href'), '/en/posts/antifragile/');
  assert.equal(page.results.querySelector('[data-result-summary]').textContent, 'Notes about chaos.');
  assert.equal(page.results.querySelector('[data-result-date]').dateTime, '2025-01-01');
  assert.equal(page.status.textContent, '1 publication found.');
});

test('query without matches displays the localized empty state', async () => {
  const page = fixture();
  page.input.value = 'unfindable';
  await page.controller.run();
  assert.equal(page.results.children.length, 0);
  assert.equal(page.status.textContent, 'No document found.');
});

test('fetch rejection keeps fallback entries visible', async () => {
  const page = fixture({ fetchImpl: async () => { throw new Error('offline'); } });
  page.input.value = 'chaos';
  await page.controller.run();
  assert.equal(page.status.textContent, 'The search index could not be loaded.');
  assert.equal(page.entries.hidden, false);
  assert.equal(page.results.hidden, true);
});

test('q query parameter initializes the search', async () => {
  const page = fixture({ url: 'https://fariablog.com/en/search/?q=reading' });
  await settle();
  await settle();
  assert.equal(page.input.value, 'reading');
  assert.equal(page.results.querySelector('[data-result-link]').textContent, 'Reading and the Brain');
});

test('clear resets results and returns focus to the input', async () => {
  const page = fixture();
  page.input.value = 'chaos';
  await page.controller.run();
  let focused = false;
  page.input.focus = () => { focused = true; };
  page.clear.dispatchEvent(new page.window.Event('click'));
  await settle();
  assert.equal(page.input.value, '');
  assert.equal(page.results.hidden, true);
  assert.equal(page.entries.hidden, false);
  assert.equal(focused, true);
});

test('a stale query never replaces the current query results', async () => {
  let resolveFetch;
  const response = new Promise((resolve) => { resolveFetch = resolve; });
  let fetchCalls = 0;
  const page = fixture({
    fetchImpl: () => {
      fetchCalls += 1;
      return response;
    },
  });
  page.input.value = 'chaos';
  const first = page.controller.run();
  page.input.value = 'reading';
  const second = page.controller.run();
  resolveFetch({ ok: true, json: async () => records });
  await Promise.all([first, second]);
  assert.equal(fetchCalls, 1);
  assert.equal(page.results.children.length, 1);
  assert.equal(page.results.querySelector('[data-result-link]').textContent, 'Reading and the Brain');
});

test('repeated queries reuse the fetched index and Fuse engine', async () => {
  const page = fixture();
  page.input.value = 'chaos';
  await page.controller.run();
  page.input.value = 'reading';
  await page.controller.run();
  assert.equal(page.calls.length, 1);
  assert.equal(FakeFuse.instances, 1);
});
