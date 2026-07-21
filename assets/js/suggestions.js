(() => {
  'use strict';

  const normalize = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();

  document.querySelectorAll('[data-suggestions]').forEach((input) => {
    const panel = document.getElementById(input.dataset.suggestions);
    if (!panel) return;

    const options = [...panel.querySelectorAll('[role="option"]')];
    let visible = [];
    let activeIndex = -1;

    const setActive = (index) => {
      visible.forEach((option) => option.removeAttribute('aria-selected'));
      activeIndex = index;
      if (activeIndex < 0 || !visible[activeIndex]) {
        input.removeAttribute('aria-activedescendant');
        return;
      }
      const option = visible[activeIndex];
      option.setAttribute('aria-selected', 'true');
      input.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    };

    const close = () => {
      panel.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      setActive(-1);
    };

    const render = () => {
      const query = normalize(input.value.trim());
      visible = options.filter((option) => !query || normalize(option.dataset.value).includes(query)).slice(0, 7);
      options.forEach((option) => { option.hidden = !visible.includes(option); });
      if (!visible.length) {
        close();
        return;
      }
      panel.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      setActive(-1);
    };

    const choose = (option) => {
      input.value = option.dataset.value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      close();
      input.focus();
    };

    input.addEventListener('input', render);
    input.addEventListener('focus', render);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (panel.hidden) render();
        if (!visible.length) return;
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActive((activeIndex + step + visible.length) % visible.length);
        return;
      }
      if (event.key === 'Enter' && activeIndex >= 0) {
        event.preventDefault();
        choose(visible[activeIndex]);
      }
    });

    panel.addEventListener('mousedown', (event) => event.preventDefault());
    panel.addEventListener('click', (event) => {
      const option = event.target.closest('[role="option"]');
      if (option) choose(option);
    });
    input.addEventListener('blur', () => window.setTimeout(close, 100));
  });
})();
