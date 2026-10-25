/* V0.5.4: decorative timeline follows scroll; no content hidden, no fake results. */
(() => {
  'use strict';
  const timeline = document.querySelector('.plan-timeline');
  const progress = document.getElementById('planProgress');
  if (!timeline || !progress) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let queued = false;
  function update() {
    queued = false;
    if (reduce.matches) { progress.style.height = '100%'; return; }
    const rect = timeline.getBoundingClientRect();
    const travel = Math.max(1, rect.height);
    const readLine = window.innerHeight * 0.65;
    const pct = Math.max(0, Math.min(1, (readLine - rect.top) / travel));
    progress.style.height = (pct * 100).toFixed(2) + '%';
  }
  function request() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(update);
  }
  window.addEventListener('scroll', request, {passive: true});
  window.addEventListener('resize', request, {passive: true});
  if (reduce.addEventListener) reduce.addEventListener('change', request);
  request();
})();
