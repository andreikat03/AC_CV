/* V0.5.3 — Only the native player and its intentional play button. */
(() => {
  'use strict';
  const video = document.getElementById('detailLaneVideo');
  const button = document.getElementById('detailLaneVideoPlay');
  if (!video || !button) return;
  button.addEventListener('click', () => {
    const request = video.play();
    if (request && typeof request.then === 'function') {
      request.then(() => { button.hidden = true; }).catch(() => {
        video.setAttribute('controls', '');
        button.hidden = true; // Native controls let the user retry even if autoplay is blocked.
      });
    } else { button.hidden = true; }
  });
  video.addEventListener('play', () => { button.hidden = true; });
  video.addEventListener('error', () => {
    button.hidden = true;
    const figcaption = video.closest('figure')?.querySelector('.proof-video-caption');
    if (figcaption) figcaption.lastElementChild.textContent = 'Video indisponibil. Verifică fișierul local din assets/video/.';
  });
})();
