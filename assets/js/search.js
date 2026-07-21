export function initSearch({
  root = document,
  fetchImpl = window.fetch.bind(window),
  Fuse = window.Fuse,
  location = window.location,
} = {}) {
  const search = root.querySelector('.site-search');
  if (!search || typeof Fuse !== 'function') return null;

  const input = search.querySelector('[data-search-input]');
  const clear = search.querySelector('[data-clear-search]');
  const status = search.querySelector('[data-search-status]');
  const results = search.querySelector('[data-search-results]');
  const entries = search.querySelector('[data-search-entries]');
  const template = search.querySelector('[data-search-result-template]');
  const endpoint = search.dataset.searchEndpoint;
  if (!input || !clear || !results || !entries || !template || !endpoint) return null;

  const labels = {
    empty: search.dataset.searchEmpty || 'Type a term to search the archive.',
    one: search.dataset.searchOne || 'publication found',
    many: search.dataset.searchMany || 'publications found',
    none: search.dataset.searchNone || 'No document found.',
    error: search.dataset.searchError || 'The search index could not be loaded.',
  };
  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
  let indexPromise;
  let engine;

  const loadIndex = () => {
    if (!indexPromise) {
      indexPromise = fetchImpl(endpoint, { headers: { Accept: 'application/json' } })
        .then((response) => {
          if (!response.ok) throw new Error(`Search index returned ${response.status}`);
          return response.json();
        });
    }
    return indexPromise;
  };

  const createEngine = (records) => new Fuse(records.map((record) => ({
    ...record,
    _title: normalize(record.title),
    _summary: normalize(record.summary),
    _content: normalize(record.content),
    _tags: normalize((record.tags || []).join(' ')),
  })), {
    shouldSort: true,
    ignoreLocation: true,
    threshold: 0.35,
    distance: 1000,
    minMatchCharLength: 1,
    keys: [
      { name: '_title', weight: 0.45 },
      { name: '_tags', weight: 0.25 },
      { name: '_summary', weight: 0.2 },
      { name: '_content', weight: 0.1 },
    ],
  });

  const render = (records, query) => {
    engine = engine || createEngine(records);
    const matches = engine.search(normalize(query), { limit: 50 })
      .map((result) => result.item);
    results.replaceChildren();

    matches.forEach((record) => {
      const item = template.content.firstElementChild.cloneNode(true);
      const link = item.querySelector('[data-result-link]');
      const summary = item.querySelector('[data-result-summary]');
      const date = item.querySelector('[data-result-date]');
      link.href = record.url;
      link.textContent = record.title;
      if (record.summary) {
        summary.textContent = record.summary;
        summary.hidden = false;
      }
      date.dateTime = record.date || '';
      date.textContent = record.date || '';
      results.append(item);
    });

    results.hidden = false;
    entries.hidden = true;
    if (status) status.textContent = matches.length
      ? `${matches.length} ${matches.length === 1 ? labels.one : labels.many}.`
      : labels.none;
  };

  const run = () => {
    const query = input.value.trim();
    clear.hidden = !query;
    if (!query) {
      results.hidden = true;
      results.replaceChildren();
      entries.hidden = false;
      if (status) status.textContent = labels.empty;
      return Promise.resolve();
    }
    return loadIndex()
      .then((records) => {
        if (input.value.trim() === query) render(records, query);
      })
      .catch(() => {
        if (input.value.trim() !== query) return;
        if (status) status.textContent = labels.error;
        entries.hidden = false;
        results.hidden = true;
      });
  };

  input.addEventListener('input', () => { void run(); });
  clear.addEventListener('click', () => {
    input.value = '';
    void run();
    input.focus();
  });

  const query = new URLSearchParams(location.search).get('q');
  if (query) {
    input.value = query;
    void run();
  }

  return { run };
}

if (typeof document !== 'undefined') initSearch();
