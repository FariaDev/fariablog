(function () {
  var html = document.documentElement;
  var root = document.querySelector('[data-house-window]');
  var scene = root && root.querySelector('[data-house-scene]');
  var layers = root ? Array.from(root.querySelectorAll('img[data-src]')) : [];
  var lamp = root && root.querySelector('[data-desk-lamp]');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var desiredLamp = html.dataset.lamp === 'off' ? 'off' : 'on';
  var revision = 0, active = null, fadeTimer, lampPending = false;
  function hourFromClock() {
    var hour = new Date().getHours();
    return hour >= 10 && hour < 17 ? 'noon' : hour >= 17 && hour < 21 ? 'dusk' : 'midnight';
  }
  function selected(hour) {
    return layers.find(function (img) {
      return img.dataset.hour === hour && (!img.dataset.lamp || img.dataset.lamp === desiredLamp);
    });
  }
  function load(img) {
    if (!img.src) {
      var source = img.parentElement.querySelector('source');
      if (source && source.dataset.srcset) source.srcset = source.dataset.srcset;
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      img.src = img.dataset.src;
    }
    return img.decode().catch(function () {});
  }
  function updateLamp(hour, busy) {
    if (!lamp) return;
    lamp.hidden = hour === 'noon';
    lamp.setAttribute('aria-busy', String(busy));
    lamp.setAttribute('aria-pressed', String(html.dataset.lamp !== 'off'));
  }
  function clearFade() {
    window.clearTimeout(fadeTimer);
    layers.forEach(function (layer) { layer.classList.remove('is-outgoing'); });
    if (root) root.classList.remove('lamp-changing');
  }
  function apply(fromLamp) {
    if (!fromLamp && lampPending) return;
    // BFCache can restore a room opened before the lamp changed elsewhere.
    if (!fromLamp) {
      try { desiredLamp = window.sessionStorage.getItem('fariablog-lamp') === 'off' ? 'off' : 'on'; } catch (_) {}
    }
    var hour = hourFromClock();
    var current = ++revision;
    var img = selected(hour);
    if (!root) { html.dataset.hour = hour; html.dataset.lamp = desiredLamp; return; }
    if (!img) return;
    updateLamp(hour, Boolean(fromLamp));
    load(img).then(function () {
      if (current !== revision) return;
      lampPending = false;
      if (!img.naturalWidth) {
        updateLamp(html.dataset.hour, false);
        return;
      }
      if (active !== img) {
        clearFade();
        if (active && !motion.matches) {
          active.classList.add('is-outgoing');
          if (fromLamp) root.classList.add('lamp-changing');
          fadeTimer = window.setTimeout(clearFade, fromLamp ? 1100 : 1850);
        }
      }
      html.dataset.hour = hour;
      html.dataset.lamp = desiredLamp;
      root.dataset.activeHour = hour;
      active = img;
      layers.forEach(function (layer) { layer.setAttribute('aria-hidden', String(layer !== img)); });
      updateLamp(hour, false);
      requestAnimationFrame(function () { html.classList.add('hours-armed'); });
    });
  }
  function warm() {
    var connection = navigator.connection;
    if (connection && (connection.saveData || /2g/.test(connection.effectiveType))) return;
    var run = function () { ['noon', 'dusk', 'midnight'].map(selected).filter(Boolean).forEach(load); };
    if ('requestIdleCallback' in window) window.requestIdleCallback(run);
    else window.setTimeout(run, 1500);
  }
  if (root) {
    if (document.readyState === 'complete') warm();
    else window.addEventListener('load', warm, { once: true });
  }
  if (lamp) lamp.addEventListener('click', function () {
    lampPending = true;
    desiredLamp = desiredLamp === 'on' ? 'off' : 'on';
    // Save the choice before fetching: navigation must not undo a pending click.
    try { window.sessionStorage.setItem('fariablog-lamp', desiredLamp); } catch (_) {}
    apply(true);
  });
  apply(false);
  window.setInterval(function () { if (!document.hidden) apply(false); }, 60000);
  window.addEventListener('pageshow', function (event) {
    // A restored document may have left a decode pending before navigation.
    if (event && event.persisted) lampPending = false;
    apply(false);
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) apply(false); });
  var descent = root && root.querySelector('.scene-descent');
  if (descent) descent.addEventListener('click', function (event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var target = document.getElementById('leitura');
    if (!target) return;
    event.preventDefault();
    if (window.location.hash !== '#leitura') window.history.pushState(null, '', '#leitura');
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
  });
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
  root.addEventListener('pointerleave', function (event) {
    if (pointer.matches && event.pointerType !== 'touch') reset();
  });
  motion.addEventListener('change', function () { x = y = 0; reset(); });
  pointer.addEventListener('change', reset);
  window.addEventListener('scroll', function () { if (!motion.matches) schedule(); }, { passive: true });
  window.addEventListener('resize', function () { height = root.offsetHeight; top = root.offsetTop; schedule(); });

  // Relative tilt keeps the room centred at the reader's natural holding angle.
  var orientation = window.DeviceOrientationEvent;
  var touch = window.matchMedia('(pointer: coarse)');
  if (!orientation || !window.isSecureContext || !touch.matches) return;
  var baseline = null, listening = false, allowed = typeof orientation.requestPermission !== 'function';
  var control = null, pending = false;
  function neutral() { baseline = null; x = y = 0; reset(); }
  function tilt(event) {
    if (motion.matches || document.hidden || window.scrollY > top + height ||
        !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    if (!baseline) baseline = { beta: event.beta, gamma: event.gamma };
    var beta = (event.beta - baseline.beta + 540) % 360 - 180;
    var gamma = (event.gamma - baseline.gamma + 540) % 360 - 180;
    var angle = ((window.screen && window.screen.orientation && window.screen.orientation.angle) || window.orientation || 0) * Math.PI / 180;
    var horizontal = gamma * Math.cos(angle) + beta * Math.sin(angle);
    var vertical = beta * Math.cos(angle) - gamma * Math.sin(angle);
    targetX = -Math.max(-1, Math.min(1, horizontal / 25)) * 6;
    targetY = -Math.max(-1, Math.min(1, vertical / 25)) * 6;
    schedule();
  }
  function syncTilt() {
    var enabled = allowed && touch.matches && !motion.matches && !document.hidden;
    if (enabled && !listening) window.addEventListener('deviceorientation', tilt, { passive: true });
    if (!enabled && listening) window.removeEventListener('deviceorientation', tilt);
    listening = enabled;
    if (control) control.hidden = allowed || !touch.matches || motion.matches;
    neutral();
  }
  if (!allowed) {
    var english = html.lang === 'en';
    control = document.createElement('button');
    control.type = 'button';
    control.className = 'scene-motion';
    control.textContent = english ? 'Enable motion' : 'Ativar movimento';
    control.addEventListener('click', function () {
      if (pending) return;
      pending = true;
      control.disabled = true;
      // Invoke synchronously inside the click to preserve Safari's user activation.
      var permission;
      try { permission = orientation.requestPermission(); } catch (_) { permission = Promise.resolve('denied'); }
      Promise.resolve(permission).then(function (state) {
        allowed = state === 'granted';
      }).catch(function () {}).finally(function () {
        pending = false;
        if (!allowed) control.textContent = english ? 'Motion unavailable' : 'Movimento indisponível';
        syncTilt();
      });
    });
    root.appendChild(control);
  }
  motion.addEventListener('change', syncTilt);
  touch.addEventListener('change', syncTilt);
  document.addEventListener('visibilitychange', syncTilt);
  window.addEventListener('pageshow', syncTilt);
  window.addEventListener('orientationchange', neutral);
  if (window.screen && window.screen.orientation) window.screen.orientation.addEventListener('change', neutral);
  syncTilt();
})();
