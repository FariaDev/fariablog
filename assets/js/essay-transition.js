/* Loaded inline in the head so pagereveal can prepare the first snapshot. */
(function () {
  function sharedTitle(peerURL) {
    if (!peerURL) return null;
    var peer = new URL(peerURL, location.href);
    var title = document.querySelector('[data-essay-title]');
    if (title && new URL(title.dataset.essayIndex, location.href).pathname === peer.pathname) return title;
    var links = document.querySelectorAll('.texts-row');
    for (var i = 0; i < links.length; i++) {
      if (new URL(links[i].href).pathname === peer.pathname) return links[i].querySelector('.texts-label');
    }
    return null;
  }
  function prepare(event, peerURL, incoming) {
    var transition = event.viewTransition;
    if (!transition) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      transition.skipTransition();
      return;
    }
    var title = sharedTitle(peerURL);
    if (!title) return;
    var rect = title.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight) return;
    title.style.viewTransitionName = 'essay-title';
    // Clear names after capture, also when a transition is skipped/rejected.
    // This keeps restored BFCache documents ready for another selection.
    function clear() { title.style.viewTransitionName = ''; }
    (incoming ? transition.ready : transition.finished).then(clear, clear);
  }
  window.addEventListener('pageswap', function (event) {
    prepare(event, event.activation && event.activation.entry && event.activation.entry.url, false);
  });
  window.addEventListener('pagereveal', function (event) {
    var activation = window.navigation && window.navigation.activation;
    prepare(event, activation && activation.from && activation.from.url, true);
  });
})();
