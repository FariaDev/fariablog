(function () {
  var root = document.querySelector('[data-house-window]');
  if (!root) return;

  var hours = ['noon', 'dusk', 'midnight'];
  var scene = root.querySelector('[data-house-scene]');

  function hourFromClock(date) {
    var hour = date.getHours();
    if (hour >= 10 && hour < 17) return 'noon';
    if (hour >= 17 && hour < 21) return 'dusk';
    return 'midnight';
  }

  function apply(hour) {
    if (hours.indexOf(hour) === -1) hour = 'noon';
    document.documentElement.setAttribute('data-hour', hour);
    root.setAttribute('data-active-hour', hour);
  }

  try {
    localStorage.removeItem('fariablog-hour');
    sessionStorage.removeItem('fariablog-hour');
  } catch (error) {}

  apply(hourFromClock(new Date()));
  window.requestAnimationFrame(function () {
    document.documentElement.classList.add('hours-armed');
  });

  window.setInterval(function () {
    apply(hourFromClock(new Date()));
  }, 60000);

  window.addEventListener('pageshow', function () {
    apply(hourFromClock(new Date()));
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    apply(hourFromClock(new Date()));
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !scene) return;

  var max = 8;
  var x = 0;
  var y = 0;
  var targetX = 0;
  var targetY = 0;
  var frame = 0;

  function tick() {
    x += (targetX - x) * 0.08;
    y += (targetY - y) * 0.08;
    scene.style.transform = 'translate(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px) scale(1.04)';
    if (Math.abs(targetX - x) > 0.05 || Math.abs(targetY - y) > 0.05) {
      frame = window.requestAnimationFrame(tick);
    } else {
      frame = 0;
    }
  }

  window.addEventListener('mousemove', function (event) {
    var rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var px = (event.clientX - rect.left) / rect.width - 0.5;
    var py = (event.clientY - rect.top) / rect.height - 0.5;
    targetX = -px * max * 2;
    targetY = -py * max * 2;
    if (!frame) frame = window.requestAnimationFrame(tick);
  });
})();
