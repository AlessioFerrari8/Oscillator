/*
  This file powers up the trace before angular exists

  That's because when we open this page many times, you can see the small detail, and that's not pleasant.
  This script creates the base portant; when the Scope component is mounted, adots this canvas and thsi loop, instead of
  recreating them, so there's no delay and no visual jump
*/


(function () {
  var host = document.getElementById('scope-host');
  if (!host) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'scope-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var raf = 0;
  var startedAt = performance.now();
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
  }

  function draw(now) {
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    var t = still ? 0 : now - startedAt;
    for (var i = 0; i <= w; i++) {
      var x = i / w;
      var v = 0.18 * Math.sin(2 * Math.PI * (x * 2 + t / 1000 * 0.35));
      var y = h / 2 - v * h * 0.42;
      if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
    }
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent').trim() || '#6ee7a8';
    ctx.lineWidth = Math.max(1, canvas.width / 900);
    ctx.stroke();
    if (!still) raf = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  raf = requestAnimationFrame(draw);

  window.__oscilla = {
    canvas: canvas,
    startedAt: startedAt,
    stop: function () { if (raf) cancelAnimationFrame(raf); raf = 0; }
  };
})();
