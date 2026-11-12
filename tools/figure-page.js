/* Pasero figure canvas page: keeps the canvas frame in the page language and sized to the window.
   The canvas itself (figure/app.html) runs in the browser and only reads its own icon files. */
(function () {
  'use strict';
  var frame = document.getElementById('figureFrame');
  if (!frame) return;
  function lang() {
    try { var l = window.PaseroI18n && window.PaseroI18n.getLanguage(); return l === 'zh' || l === 'ja' ? l : 'en'; } catch (e) { return 'en'; }
  }
  var current = lang();
  frame.src = 'figure/app.html?lang=' + current;
  function tell() {
    var l = lang();
    if (l === current) return;
    current = l;
    try { frame.contentWindow.postMessage({ type: 'pasero-lang', lang: l }, location.origin); } catch (e) { /* frame not ready */ }
  }
  document.addEventListener('pasero:language', tell);
  if (window.MutationObserver && document.body) {
    new MutationObserver(tell).observe(document.body, { attributes: true, attributeFilter: ['data-pasero-language'] });
  }
})();
