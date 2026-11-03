/* Page flow (2026-11): colour fades between chapters, a quiet entrance for chapter headlines, and one
   scroll-linked moment in the home page's mobile chapter.
   Without JS every section keeps its own flat background; with reduced motion nothing moves. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sections = [].slice.call(document.querySelectorAll('main > section, body > footer'));
  if (!sections.length) return;

  /* ---------- Colour hand-over between chapters ----------
     Where two neighbouring chapters have different backgrounds, the colour fades across the empty gap
     between their content (bottom padding of one, top padding of the next). Text always stays on its own
     chapter's colour, so nothing is ever hard to read mid-scroll. */
  function parse(c) {
    var m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    var p = m[1].split(',').map(function (x) { return parseFloat(x); });
    if (p.length > 3 && p[3] === 0) return null;
    return [p[0], p[1], p[2]];
  }
  var bodyColor = parse(getComputedStyle(document.body).backgroundColor) || [255, 255, 255];
  function colorOf(s) { return parse(getComputedStyle(s).backgroundColor) || bodyColor; }
  function lum(c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  function css(c) { return 'rgb(' + c.map(Math.round).join(',') + ')'; }
  // Some chapters set their background with !important, so the fade is set the same way.
  function paint(el, stops) {
    el.style.setProperty('background-image', 'linear-gradient(in oklab ' + stops + ')', 'important');
    if (!el.style.backgroundImage) el.style.setProperty('background-image', 'linear-gradient(' + stops + ')', 'important');
  }
  function blend() {
    var colors = sections.map(colorOf);
    var edges = sections.map(function () { return {}; });
    sections.forEach(function (s) { s.style.removeProperty('background-image'); });
    for (var i = 0; i < sections.length - 1; i++) {
      var a = colors[i], b = colors[i + 1];
      if (a.join() === b.join()) continue;
      // Dark next to light: a fade would pass through a muddy grey band, so the edge stays clean.
      if (Math.abs(lum(a) - lum(b)) > 0.45) continue;
      var mid = css([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]);
      edges[i].bottom = mid;
      edges[i + 1].top = mid;
    }
    // Each chapter fades from the midpoint into its own colour across its padding, so the seam is invisible.
    sections.forEach(function (s, i) {
      var e = edges[i];
      if (!e.top && !e.bottom) return;
      var cs = getComputedStyle(s), own = css(colors[i]), stops = [];
      if (e.top) stops.push(e.top + ' 0', own + ' ' + Math.round((parseFloat(cs.paddingTop) || 0) * 0.95) + 'px');
      else stops.push(own + ' 0');
      if (e.bottom) stops.push(own + ' calc(100% - ' + Math.round((parseFloat(cs.paddingBottom) || 0) * 0.95) + 'px)', e.bottom + ' 100%');
      else stops.push(own + ' 100%');
      paint(s, 'to bottom, ' + stops.join(', '));
    });
  }
  root.classList.add('flow-bg');
  if (!reduce && 'IntersectionObserver' in window) root.classList.add('flow-motion');
  blend();
  window.addEventListener('resize', function () { requestAnimationFrame(blend); });

  /* Two screens that come together as their chapter scrolls in: the home page's mobile chapter and
     mobile.html's sync chapter (anything marked data-flow-converge). */
  var stages = [].slice.call(document.querySelectorAll('#mobile-story .editorial-stage, [data-flow-converge]'));
  var wide = window.matchMedia('(min-width: 801px)');
  var ticking = false;
  function frame() {
    ticking = false;
    var on = wide.matches && root.classList.contains('flow-motion'), vh = window.innerHeight;
    stages.forEach(function (stage) {
      if (!on) { stage.style.removeProperty('--flow-p'); return; }
      var s = stage.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (vh * 0.92 - s.top) / (vh * 0.62)));
      stage.style.setProperty('--flow-p', p.toFixed(3));
    });
  }
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  frame();

  /* ---------- Chapter headlines ---------- */
  if (!root.classList.contains('flow-motion')) return;
  var heads = [].slice.call(document.querySelectorAll(
    '.explorer-title, .mobile-headline, #pricing .px-intro h2, .brand-story h2, #explorer .explorer-intro h2, .sync-copy h2, .mobile-end h2'));
  heads.forEach(function (h) { h.classList.add('flow-reveal'); });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
  heads.forEach(function (h) { io.observe(h); });
})();
