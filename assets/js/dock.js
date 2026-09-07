(function () {
  var dock = document.querySelector('[data-gooey-dock]');
  if (!dock) return;

  var openBtn = dock.querySelector('[data-search-open]');
  var form = dock.querySelector('[data-dock-search]');
  var input = form && form.querySelector('[data-search-input]');
  var closeBtn = dock.querySelector('[data-search-close]');
  var clearBtn = dock.querySelector('[data-clear-search]');
  if (!openBtn || !form || !input) return;

  function isSearchPage() {
    return document.body.classList.contains('is-search');
  }

  function open(focus) {
    dock.classList.add('is-searching');
    openBtn.setAttribute('aria-expanded', 'true');
    form.hidden = false;
    if (focus !== false) {
      window.setTimeout(function () { input.focus(); }, 20);
    }
  }

  function close() {
    dock.classList.remove('is-searching');
    openBtn.setAttribute('aria-expanded', 'false');
    form.hidden = true;
    openBtn.focus();
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
    if (event.key === 'Escape' && dock.classList.contains('is-searching')) {
      close();
    }
  });
})();
