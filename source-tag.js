/* Channel tag for launch links, e.g. https://pasero.app/?src=reddit
   The tag is kept in this tab's sessionStorage (gone when the tab closes) and is sent
   to us only if the visitor signs up for the beta discount on the download page.
   It is removed from the address bar so a copied link doesn't carry it on. */
(function () {
  'use strict';
  var KEY = 'pasero-source', RE = /^[a-z0-9][a-z0-9_-]{0,31}$/;
  try {
    var url = new URL(window.location.href);
    var tag = (url.searchParams.get('src') || '').trim().toLowerCase();
    if (url.searchParams.has('src')) {
      if (RE.test(tag) && !window.sessionStorage.getItem(KEY)) window.sessionStorage.setItem(KEY, tag);
      url.searchParams.delete('src');
      window.history.replaceState(window.history.state, '', url.pathname + (url.search ? url.search : '') + url.hash);
    }
  } catch (e) {}
  window.PaseroSource = function () {
    try { var v = window.sessionStorage.getItem(KEY); return v && RE.test(v) ? v : null; } catch (e) { return null; }
  };
})();
