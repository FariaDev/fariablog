(function () {
  var root = document.querySelector('[data-field-window]');
  if (!root || !window.IntersectionObserver || !window.MutationObserver) return;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var connection = navigator.connection;
  var visible = false, timer = 0, lights = null, finished = false;
  var key = 'fariablog-fireflies';
  function eligible() {
    return !finished && visible && !document.hidden && !motion.matches &&
      document.documentElement.dataset.hour === 'midnight' &&
      !(connection && (connection.saveData || /2g/.test(connection.effectiveType)));
  }
  function stop() {
    window.clearTimeout(timer);
    timer = 0;
    if (lights) { lights.remove(); lights = null; }
  }
  function consider() {
    if (!eligible()) { stop(); return; }
    if (timer || lights) return;
    try {
      var decision = window.sessionStorage.getItem(key);
      if (!decision) {
        decision = Math.random() < .12 ? 'waiting' : 'quiet';
        window.sessionStorage.setItem(key, decision);
      }
      if (decision !== 'waiting') return;
    } catch (_) { return; }
    timer = window.setTimeout(function () {
      timer = 0;
      if (!eligible()) return;
      // A second tab/page may have already shown this session's visit.
      try {
        if (window.sessionStorage.getItem(key) !== 'waiting') return;
        window.sessionStorage.setItem(key, 'seen');
      } catch (_) { return; }
      lights = document.createElement('div');
      lights.className = 'scene-objects field-fireflies';
      lights.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < 3; i++) lights.appendChild(document.createElement('i'));
      root.querySelector('[data-house-scene]').appendChild(lights);
      finished = true;
      timer = window.setTimeout(stop, 11000);
    }, 8000 + Math.random() * 12000);
  }
  new IntersectionObserver(function (entries) {
    visible = entries[0].intersectionRatio >= .55;
    consider();
  }, { threshold: [0, .55] }).observe(root);
  new MutationObserver(consider).observe(document.documentElement, { attributes: true, attributeFilter: ['data-hour'] });
  document.addEventListener('visibilitychange', consider);
  motion.addEventListener('change', consider);
  if (connection && connection.addEventListener) connection.addEventListener('change', consider);
  window.addEventListener('pagehide', stop);
})();
