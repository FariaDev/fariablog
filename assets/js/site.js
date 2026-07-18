(() => {
  'use strict';

  const root = document.documentElement;
  const themeKey = 'fariablog-theme';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setTheme(theme, persist) {
    root.dataset.theme = theme;
    if (persist) {
      try { localStorage.setItem(themeKey, theme); } catch (_) { /* storage can be disabled */ }
    }
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const nextIsDark = theme !== 'dark';
      const label = nextIsDark ? button.dataset.darkLabel : button.dataset.lightLabel;
      const glyph = button.querySelector('.theme-glyph');
      if (glyph) glyph.textContent = nextIsDark ? '☾' : '☀';
      button.setAttribute('aria-label', label || (nextIsDark ? 'Switch to dark mode' : 'Switch to light mode'));
      button.title = label || '';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.dataset.darkLabel = button.getAttribute('aria-label') || 'Switch to dark mode';
      button.dataset.lightLabel = button.dataset.lightLabel || 'Switch to light mode';
      button.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
    });
    setTheme(root.dataset.theme || 'light', false);

    setupSearch();
    setupCopyButtons();
    setupComments();
    setupHeadingAnchors();
    setupReadingRail();
  });

  const searchCache = new Map();
  const searchEngineCache = new WeakMap();
  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();

  function loadIndex(endpoint) {
    if (!searchCache.has(endpoint)) {
      searchCache.set(endpoint, fetch(endpoint, { headers: { Accept: 'application/json' } })
        .then((response) => {
          if (!response.ok) throw new Error(`Search index returned ${response.status}`);
          return response.json();
        }));
    }
    return searchCache.get(endpoint);
  }

  function getSearchEngine(records) {
    if (!searchEngineCache.has(records)) {
      const searchable = records.map((record) => ({
        ...record,
        _title: normalize(record.title),
        _summary: normalize(record.summary),
        _content: normalize(record.content),
        _tags: normalize((record.tags || []).join(' ')),
      }));
      searchEngineCache.set(records, new window.Fuse(searchable, {
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
      }));
    }
    return searchEngineCache.get(records);
  }

  function setupSearch() {
    const search = document.querySelector('.site-search');
    if (!search || typeof window.Fuse !== 'function') return;

    const input = search.querySelector('[data-search-input]');
    const clear = search.querySelector('[data-clear-search]');
    const status = search.querySelector('[data-search-status]');
    const results = search.querySelector('[data-search-results]');
    const entries = search.querySelector('[data-search-entries]');
    const template = search.querySelector('[data-search-result-template]');
    const endpoint = search.dataset.searchEndpoint;
    if (!input || !clear || !results || !entries || !template || !endpoint) return;

    const labels = {
      empty: search.dataset.searchEmpty || 'Type a term to search the archive.',
      one: search.dataset.searchOne || 'publication found',
      many: search.dataset.searchMany || 'publications found',
      none: search.dataset.searchNone || 'No document found.',
      error: search.dataset.searchError || 'The search index could not be loaded.',
    };

    const renderResults = (records, query) => {
      const matches = getSearchEngine(records)
        .search(normalize(query), { limit: 50 })
        .map((result) => result.item);
      results.replaceChildren();

      matches.forEach((record, index) => {
        const item = template.content.firstElementChild.cloneNode(true);
        const link = item.querySelector('[data-result-link]');
        const summary = item.querySelector('[data-result-summary]');
        const date = item.querySelector('[data-result-date]');
        item.querySelector('[data-result-number]').textContent = `[${String(index + 1).padStart(3, '0')}]`;
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
        return;
      }
      loadIndex(endpoint)
        .then((records) => {
          if (input.value.trim() === query) renderResults(records, query);
        })
        .catch(() => {
          if (status) status.textContent = labels.error;
          entries.hidden = false;
          results.hidden = true;
        });
    };

    input.addEventListener('input', run);
    clear.addEventListener('click', () => {
      input.value = '';
      run();
      input.focus();
    });

    const query = new URLSearchParams(window.location.search).get('q');
    if (query) {
      input.value = query;
      run();
    }
  }

  function setupCopyButtons() {
    const copy = (text, button, success, failure) => {
      const done = (label) => {
        const original = button.textContent;
        button.textContent = label;
        window.setTimeout(() => { button.textContent = original; }, 1600);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => done(success)).catch(() => done(failure));
        return;
      }
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      try { done(document.execCommand('copy') ? success : failure); } catch (_) { done(failure); }
      area.remove();
    };

    document.querySelectorAll('[data-copy-link]').forEach((button) => {
      button.addEventListener('click', () => copy(
        window.location.href,
        button,
        button.dataset.copiedLabel || 'link copied',
        button.dataset.copyFailedLabel || 'could not copy',
      ));
    });

    document.querySelectorAll('.article-content pre').forEach((pre) => {
      if (pre.querySelector('[data-copy-code]')) return;
      const wrapper = pre.parentElement;
      if (wrapper) wrapper.classList.add('code-frame');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-code';
      button.dataset.copyCode = '';
      button.textContent = document.body.dataset.copyCode || 'Copy';
      button.addEventListener('click', () => copy(
        pre.textContent,
        button,
        document.body.dataset.codeCopied || 'Copied',
        document.body.dataset.codeCopyFailed || 'Select the code',
      ));
      (wrapper || pre).append(button);
    });
  }

  function setupComments() {
    document.querySelectorAll('[data-load-comments]').forEach((button) => {
      button.addEventListener('click', () => {
        const section = button.closest('[data-comments-section]');
        const thread = section && section.querySelector('[data-disqus-thread]');
        if (!section || !thread) return;
        button.hidden = true;
        thread.hidden = false;
        window.disqus_config = function () {
          this.page.url = section.dataset.disqusUrl;
          this.page.identifier = section.dataset.disqusIdentifier;
        };
        const shortname = section.dataset.disqusShortname;
        if (!shortname || document.querySelector('script[data-fariablog-disqus]')) return;
        const script = document.createElement('script');
        script.src = `https://${shortname}.disqus.com/embed.js`;
        script.async = true;
        script.dataset.fariablogDisqus = '';
        (document.head || document.body).append(script);
      });
    });
  }

  function setupHeadingAnchors() {
    const content = document.querySelector('.article-content');
    if (!content) return;
    const label = content.dataset.anchorLabel || 'Link to section';
    content.querySelectorAll('h2[id], h3[id]').forEach((heading) => {
      if (heading.querySelector('.heading-anchor')) return;
      const anchor = document.createElement('a');
      anchor.className = 'heading-anchor';
      anchor.href = `#${heading.id}`;
      anchor.setAttribute('aria-label', `${label}: ${heading.textContent.trim()}`);
      anchor.textContent = '¶';
      heading.append(anchor);
    });
  }

  function setupReadingRail() {
    const rail = document.querySelector('[data-reading-rail]');
    const article = document.querySelector('.article-sheet');
    if (!rail || !article || !('IntersectionObserver' in window)) return;
    const sections = [...article.querySelectorAll('.reading-section, .article-content h2')];
    if (!sections.length) return;
    const position = rail.querySelector('[data-rail-position]');
    const current = rail.querySelector('[data-current-section]');
    const fill = rail.querySelector('[data-progress-fill]');
    const output = rail.querySelector('[data-reading-progress]');
    let active = 0;

    const sectionTitle = (section) => {
      const heading = section.matches('h2') ? section : section.querySelector('h2');
      if (!heading) return section.textContent.trim().slice(0, 38);
      const copy = heading.cloneNode(true);
      copy.querySelector('.heading-anchor')?.remove();
      return copy.textContent.trim();
    };

    const update = (index) => {
      active = Math.max(0, Math.min(index, sections.length - 1));
      const percent = Math.round(((active + 1) / sections.length) * 100);
      if (position) position.textContent = `${String(active + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')}`;
      if (current) current.textContent = sectionTitle(sections[active]);
      if (fill) fill.style.width = `${percent}%`;
      if (output) output.textContent = `${percent}%`;
    };

    update(0);
    const observer = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
        const index = sections.indexOf(entry.target);
        if (index >= 0) update(index);
      });
    }, { rootMargin: '-18% 0px -65% 0px', threshold: reducedMotion ? 0 : [0, 0.2, 0.8] });
    sections.forEach((section) => observer.observe(section));
  }
})();
