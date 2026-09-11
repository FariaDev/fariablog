(function () {
  var dock = document.querySelector('[data-threshold-nav]');
  if (!dock) return;

  var openBtn = dock.querySelector('[data-search-open]');
  var form = dock.querySelector('[data-dock-search]');
  var input = form && form.querySelector('[data-search-input]');
  var closeBtn = dock.querySelector('[data-search-close]');
  var clearBtn = dock.querySelector('[data-clear-search]');
  var reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var closeTimer = 0;
  if (!openBtn || !form || !input) return;

  function isSearchPage() {
    return document.body.classList.contains('is-search');
  }

  function open(focus) {
    window.clearTimeout(closeTimer);
    dock.classList.remove('is-search-closing');
    form.hidden = false;
    dock.classList.add('is-searching');
    openBtn.setAttribute('aria-expanded', 'true');
    if (focus !== false) {
      window.setTimeout(function () { input.focus(); }, 20);
    }
  }

  function finishClose() {
    window.clearTimeout(closeTimer);
    dock.classList.remove('is-search-closing');
    dock.classList.remove('is-searching');
    form.hidden = true;
    openBtn.focus();
  }

  function close() {
    openBtn.setAttribute('aria-expanded', 'false');
    if (reducedMotion.matches) { finishClose(); return; }
    dock.classList.add('is-search-closing');
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(finishClose, 180);
  }

  if (isSearchPage() || (input.value && input.value.trim())) open(false);

  openBtn.addEventListener('click', function (event) {
    event.preventDefault();
    open(true);
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      if (isSearchPage() && input.value.trim()) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      close();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !(event.target.closest && event.target.closest('input, textarea, select, [contenteditable]'))) {
      event.preventDefault();
      open(true);
      input.scrollIntoView({ block: 'center' });
    }
    if (event.key === 'Escape' && dock.classList.contains('is-searching')) {
      close();
    }
  });
})();
