/* Optional research page. Returning to the application preserves the reading position. */
(() => {
  'use strict';
  const returnLinks = document.querySelectorAll('[data-return]');
  const key = 'the_application_detail_return_v055';
  for (const link of returnLinks) {
    link.addEventListener('click', (event) => {
      let fromApplication = false;
      try {
        const raw = sessionStorage.getItem(key);
        const saved = raw ? JSON.parse(raw) : null;
        const ref = document.referrer ? new URL(document.referrer) : null;
        const refPath = ref && ref.pathname;
        fromApplication = !!(saved && saved.savedAt && (Date.now() - saved.savedAt < 30 * 60 * 1000) &&
          ref && ref.origin === location.origin &&
          (refPath.endsWith('/index.html') || refPath.endsWith('/')) && history.length > 1);
      } catch (_) { /* Standard fallback link remains available. */ }
      if (fromApplication) {
        event.preventDefault();
        history.back();
      }
    });
  }
})();
