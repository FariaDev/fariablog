(() => {
  'use strict';

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
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = document.body.dataset.copyCode || 'Copy';
    button.addEventListener('click', () => copy(
      pre.textContent,
      button,
      document.body.dataset.codeCopied || 'Copied',
      document.body.dataset.codeCopyFailed || 'Select the code',
    ));
    pre.after(button);
  });

  const content = document.querySelector('.article-content');
  if (!content) return;
  const label = content.dataset.anchorLabel || 'Link to section';
  content.querySelectorAll('h2[id], h3[id]').forEach((heading) => {
    const anchor = document.createElement('a');
    anchor.className = 'heading-anchor';
    anchor.href = `#${heading.id}`;
    anchor.setAttribute('aria-label', `${label}: ${heading.textContent.trim()}`);
    anchor.textContent = '¶';
    heading.append(anchor);
  });
})();
