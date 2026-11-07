/* Pasero free lab tools: shared helpers.
   Everything here runs in the visitor's browser. Nothing is sent anywhere:
   the pages also carry a Content-Security-Policy with connect-src 'none'. */
(function () {
  'use strict';

  function lang() {
    try { return (window.PaseroI18n && window.PaseroI18n.getLanguage()) || 'en'; } catch (e) { return 'en'; }
  }
  /* T({en, zh, ja}) or T('en', 'zh', 'ja') */
  function T(en, zh, ja) {
    var o = typeof en === 'object' ? en : { en: en, zh: zh, ja: ja };
    var l = lang();
    return (o[l] !== undefined && o[l] !== null) ? o[l] : o.en;
  }
  var listeners = [];
  function onLang(fn) { listeners.push(fn); }
  document.addEventListener('pasero:language', function () {
    setTitle();
    listeners.forEach(function (fn) { try { fn(lang()); } catch (e) { console.error(e); } });
  });
  function setTitle() {
    var b = document.body; if (!b) return;
    var t = b.getAttribute('data-title-' + lang()) || b.getAttribute('data-title-en');
    if (t && document.title !== t) document.title = t;
  }

  /* Numbers ---------------------------------------------------------- */
  function num(v) {
    if (v === null || v === undefined) return NaN;
    var s = String(v).trim().replace(/\s+/g, '').replace(/[×x]10\^?/i, 'e').replace(/,/g, s2dot(String(v)));
    if (s === '') return NaN;
    var n = Number(s);
    return isFinite(n) ? n : NaN;
  }
  /* "1,5" -> decimal comma; "1,000" stays thousands */
  function s2dot(raw) {
    var s = raw.trim();
    if (/^-?\d+,\d{1,2}$/.test(s) || /^-?\d+,\d{4,}$/.test(s)) return '.';
    return '';
  }
  function val(id) { var el = document.getElementById(id); return el ? num(el.value) : NaN; }
  function fmt(x, sig) {
    if (x === null || x === undefined || !isFinite(x)) return '—';
    sig = sig || 4;
    if (x === 0) return '0';
    var a = Math.abs(x);
    if (a >= 1e6 || a < 1e-3) {
      var e = x.toExponential(sig - 1).replace(/\.?0+e/, 'e');
      var parts = e.split('e');
      return parts[0] + ' × 10' + sup(parseInt(parts[1], 10));
    }
    var s = Number(x.toPrecision(sig)).toString();
    if (Math.abs(Number(s)) >= 1000) return Number(s).toLocaleString('en-US', { maximumFractionDigits: 3 });
    return s;
  }
  /* plain number for an input field */
  function plain(x) { return isFinite(x) ? String(Number(x.toPrecision(6))) : ''; }
  function fixed(x, d) { return isFinite(x) ? Number(x.toFixed(d)).toString() : '—'; }
  function sup(n) {
    var m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return String(n).split('').map(function (c) { return m[c] || c; }).join('');
  }

  /* Units (factor to the base unit) ---------------------------------- */
  var U = {
    mass: { g: 1, mg: 1e-3, 'µg': 1e-6, ng: 1e-9, pg: 1e-12 },
    vol: { L: 1, mL: 1e-3, 'µL': 1e-6, nL: 1e-9 },
    molar: { M: 1, mM: 1e-3, 'µM': 1e-6, nM: 1e-9, pM: 1e-12 }
  };
  /* Pick a readable unit for a base-unit value */
  function best(value, table, order) {
    if (!isFinite(value)) return { v: NaN, u: order[0] };
    var a = Math.abs(value);
    for (var i = 0; i < order.length; i++) {
      var f = table[order[i]];
      if (a >= f * 0.9999 || i === order.length - 1) return { v: value / f, u: order[i] };
    }
  }
  function bestMass(g) { return best(g, U.mass, ['g', 'mg', 'µg', 'ng', 'pg']); }
  function bestVol(l) { return best(l, U.vol, ['L', 'mL', 'µL', 'nL']); }
  function bestMolar(m) { return best(m, U.molar, ['M', 'mM', 'µM', 'nM', 'pM']); }

  /* Clipboard (local only) ------------------------------------------- */
  function copy(text, btn) {
    function done() {
      if (!btn) return;
      var old = btn.getAttribute('data-label') || btn.textContent;
      btn.setAttribute('data-label', old);
      btn.textContent = T('Copied', '已复制', 'コピーしました');
      setTimeout(function () { btn.textContent = old; }, 1400);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  /* Save a Blob as a file (stays on the device) */
  function save(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  /* Parse pasted spreadsheet text into rows of cells */
  function parseTable(text) {
    var lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    var sample = lines.slice(0, 5).join('\n');
    var delim = sample.indexOf('\t') >= 0 ? '\t' : (sample.indexOf(';') >= 0 && sample.indexOf(',') < 0 ? ';' : (sample.indexOf(',') >= 0 ? ',' : null));
    return lines.map(function (line) {
      if (delim) return line.split(delim).map(function (c) { return c.trim().replace(/^"(.*)"$/, '$1'); });
      return line.trim() ? line.trim().split(/\s+/) : [];
    });
  }

  /* Render on input, on language change, and once on load */
  function live(root, fn) {
    var el = typeof root === 'string' ? document.querySelector(root) : root;
    if (!el) return;
    el.addEventListener('input', fn);
    el.addEventListener('change', fn);
    onLang(fn);
    fn();
  }

  /* Segmented buttons: <div class="tl-seg" data-seg="name"><button data-v="x"> */
  function seg(name, fn) {
    var box = document.querySelector('[data-seg="' + name + '"]');
    if (!box) return function () { return null; };
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-v]'); if (!b) return;
      box.querySelectorAll('button[data-v]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      fn && fn(b.getAttribute('data-v'));
    });
    return function () {
      var on = box.querySelector('button[aria-pressed="true"]');
      return on ? on.getAttribute('data-v') : null;
    };
  }

  /* Product screenshots follow the page language, falling back to English */
  function shots() {
    document.querySelectorAll('img[data-shot]').forEach(function (img) {
      var id = img.getAttribute('data-shot'), want = '../assests/shots/' + id + '.' + lang() + '.webp';
      if (img.getAttribute('src') === want) return;
      img.onerror = function () { img.onerror = null; img.src = '../assests/shots/' + id + '.en.webp'; };
      img.src = want;
    });
  }
  onLang(shots);

  function init() { setTitle(); shots(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.PTools = {
    lang: lang, T: T, onLang: onLang, num: num, val: val, fmt: fmt, plain: plain, fixed: fixed, sup: sup,
    U: U, bestMass: bestMass, bestVol: bestVol, bestMolar: bestMolar,
    copy: copy, save: save, esc: esc, parseTable: parseTable, live: live, seg: seg
  };
})();
