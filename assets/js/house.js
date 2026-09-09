(function () {
  var root = document.querySelector('[data-house-window]');
  if (!root) return;
  var scene = root.querySelector('[data-house-scene]');
  var layers = Array.from(root.querySelectorAll('img[data-src]'));
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  function hourFromClock() {
    var hour = new Date().getHours();
    return hour >= 10 && hour < 17 ? 'noon' : hour >= 17 && hour < 21 ? 'dusk' : 'midnight';
  }
  function load(img) {
    if (!img.src) {
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      img.src = img.dataset.src;
    }
    return img.decode().catch(function () {});
  }
  var revision = 0;
  function apply() {
    var hour = hourFromClock();
    var current = ++revision;
    var img = layers.find(function (layer) { return layer.dataset.hour === hour; });
    if (!img) return;
    load(img).then(function () {
      if (current !== revision || !img.naturalWidth) return;
      document.documentElement.dataset.hour = hour;
      root.dataset.activeHour = hour;
      layers.forEach(function (layer) { layer.setAttribute('aria-hidden', String(layer !== img)); });
      requestAnimationFrame(function () { document.documentElement.classList.add('hours-armed'); });
    });
  }
  function warm() {
    var connection = navigator.connection;
    if (connection && (connection.saveData || /2g/.test(connection.effectiveType))) return;
    var run = function () { layers.forEach(load); };
    if ('requestIdleCallback' in window) window.requestIdleCallback(run);
    else window.setTimeout(run, 1500);
  }
  if (document.readyState === 'complete') warm();
  else window.addEventListener('load', warm, { once: true });
  apply();
  window.setInterval(apply, 60000);
  window.addEventListener('pageshow', apply);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) apply(); });
  if (!scene) return;
  var x = 0, y = 0, targetX = 0, targetY = 0, frame = 0;
  var height = root.offsetHeight;
  var top = root.offsetTop;
  function tick() {
    frame = 0;
    if (motion.matches) { scene.style.transform = ''; return; }
    x += (targetX - x) * .12;
    y += (targetY - y) * .12;
    var progress = Math.max(0, Math.min(1, (window.scrollY - top) / height));
    scene.style.transform = 'translate(' + x.toFixed(2) + 'px,' + (y + progress * 4).toFixed(2) + 'px) scale(' + (1.04 + progress * .02).toFixed(4) + ')';
    if (Math.abs(x - targetX) > .05 || Math.abs(y - targetY) > .05) schedule();
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(tick); }
  root.addEventListener('pointermove', function (event) {
    if (motion.matches || !pointer.matches || event.pointerType === 'touch') return;
    targetX = -(event.clientX / window.innerWidth - .5) * 12;
    targetY = -((event.clientY + window.scrollY - top) / height - .5) * 12;
    schedule();
  }, { passive: true });
  function reset() { targetX = targetY = 0; schedule(); }
  root.addEventListener('pointerleave', reset);
  motion.addEventListener('change', reset);
  pointer.addEventListener('change', reset);
  window.addEventListener('scroll', function () { if (!motion.matches) schedule(); }, { passive: true });
  window.addEventListener('resize', function () { height = root.offsetHeight; top = root.offsetTop; schedule(); });
})();
