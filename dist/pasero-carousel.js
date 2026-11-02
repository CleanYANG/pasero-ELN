/* Phone feature carousel (2026-11). Used by the desktop explorer on index.html and the mobile explorer on
   mobile.html at phone widths. Swipe the screen, dots underneath, then the feature name, one line, the screens
   you can switch between (wrapping chips) and the key points. Videos stay on their poster until tapped. */
(function () {
  'use strict';
  function tr(t) { var i = window.PaseroI18n; return i ? i.translate(t[0], t[1], t[2]) : t[0]; }
  function setText(el, t) {
    el.setAttribute('data-en', t[0]); el.setAttribute('data-zh', t[1]); el.setAttribute('data-ja', t[2]);
    el.textContent = tr(t);
  }
  function make(tag, cls, t) { var el = document.createElement(tag); if (cls) el.className = cls; if (t) setText(el, t); return el; }
  var pad = function (n) { return String(n).padStart(2, '0'); };

  function mount(host, cfg) {
    var groups = cfg.groups, active = 0, views = groups.map(function () { return 0; });
    var root = make('div', 'pc');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carousel');
    if (cfg.label) root.setAttribute('aria-label', tr(cfg.label));

    var track = make('div', 'pc-track');
    track.tabIndex = 0;
    var slides = groups.map(function (g, i) {
      var s = make('div', 'pc-slide');
      s.setAttribute('role', 'group');
      s.setAttribute('aria-roledescription', 'slide');
      s.setAttribute('aria-label', pad(i + 1) + ' / ' + pad(groups.length) + ' · ' + tr(g.name));
      var m = make('div', 'pc-media');
      s.appendChild(m);
      track.appendChild(s);
      return { el: s, media: m };
    });

    var nav = make('div', 'pc-nav');
    var prev = make('button', 'pc-step');
    prev.type = 'button'; prev.setAttribute('aria-label', tr(['Previous feature', '上一个功能', '前の機能']));
    prev.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
    var next = make('button', 'pc-step');
    next.type = 'button'; next.setAttribute('aria-label', tr(['Next feature', '下一个功能', '次の機能']));
    next.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
    var dots = make('div', 'pc-dots');
    var dotEls = groups.map(function (g, i) {
      var d = make('button', 'pc-dot');
      d.type = 'button';
      d.setAttribute('aria-label', pad(i + 1) + ' · ' + tr(g.name));
      d.addEventListener('click', function () { go(i, true); });
      dots.appendChild(d);
      return d;
    });
    prev.addEventListener('click', function () { go(active - 1, true); });
    next.addEventListener('click', function () { go(active + 1, true); });
    nav.append(prev, dots, next);

    var detail = make('div', 'pc-detail');
    detail.setAttribute('aria-live', 'polite');
    var count = make('p', 'pc-count');
    var name = make('h3', 'pc-name');
    var line = make('p', 'pc-line');
    var viewWrap = make('div', 'pc-views');
    viewWrap.setAttribute('role', 'group');
    var viewLabel = make('span', 'pc-views-label', ['Screens', '画面', '画面']);
    var chips = make('div', 'pc-chips');
    viewWrap.append(viewLabel, chips);
    var points = make('ul', 'pc-points');
    detail.append(count, name, line, viewWrap, points);

    root.append(track, nav, detail);
    host.replaceChildren(root);

    function renderMedia(i) {
      var g = groups[i], v = g.views[views[i]];
      window.PaseroShots.fill(slides[i].media, v.shot, { tapToPlay: true });
    }
    function renderDetail() {
      var g = groups[active];
      count.textContent = pad(active + 1) + ' / ' + pad(groups.length);
      setText(name, g.name);
      setText(line, g.line);
      viewWrap.hidden = g.views.length < 2;
      viewWrap.setAttribute('aria-label', tr(['Screens', '画面', '画面']));
      chips.replaceChildren.apply(chips, g.views.map(function (v, n) {
        var b = make('button', 'pc-chip');
        b.type = 'button';
        b.setAttribute('aria-pressed', String(n === views[active]));
        b.appendChild(make('span', '', v.label));
        if (v.flag) b.appendChild(make('span', 'pc-flag', v.flag));
        b.addEventListener('click', function () {
          views[active] = n;
          renderMedia(active);
          [].forEach.call(chips.children, function (c, k) { c.setAttribute('aria-pressed', String(k === n)); });
        });
        return b;
      }));
      points.replaceChildren.apply(points, (g.points || []).map(function (p) { return make('li', '', p); }));
      dotEls.forEach(function (d, k) { d.setAttribute('aria-current', k === active ? 'true' : 'false'); });
      prev.disabled = active === 0;
      next.disabled = active === groups.length - 1;
      if (cfg.onChange) cfg.onChange(active);
    }
    function go(i, scroll) {
      i = Math.max(0, Math.min(groups.length - 1, i));
      if (scroll) {
        var s = slides[i].el;
        var smooth = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.clientWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
      }
      if (i === active && name.textContent) return;
      active = i;
      renderDetail();
    }
    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var mid = track.scrollLeft + track.clientWidth / 2, best = 0, dist = Infinity;
        slides.forEach(function (s, k) {
          var c = s.el.offsetLeft + s.el.clientWidth / 2, d = Math.abs(c - mid);
          if (d < dist) { dist = d; best = k; }
        });
        if (best !== active) go(best, false);
      });
    }, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1, true); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1, true); }
    });

    function relabel() {
      if (cfg.label) root.setAttribute('aria-label', tr(cfg.label));
      slides.forEach(function (s, i) { s.el.setAttribute('aria-label', pad(i + 1) + ' / ' + pad(groups.length) + ' · ' + tr(groups[i].name)); });
      dotEls.forEach(function (d, i) { d.setAttribute('aria-label', pad(i + 1) + ' · ' + tr(groups[i].name)); });
      prev.setAttribute('aria-label', tr(['Previous feature', '上一个功能', '前の機能']));
      next.setAttribute('aria-label', tr(['Next feature', '下一个功能', '次の機能']));
      viewWrap.setAttribute('aria-label', tr(['Screens', '画面', '画面']));
    }
    if (document.body) new MutationObserver(relabel).observe(document.body, { attributes: true, attributeFilter: ['data-pasero-language'] });

    groups.forEach(function (g, i) { renderMedia(i); });
    renderDetail();
    return {
      refresh: function () { renderDetail(); },
      go: function (i) { go(i, true); }
    };
  }
  window.PaseroCarousel = { mount: mount };
})();
