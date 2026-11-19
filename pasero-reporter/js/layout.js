/* Pasero Reporter — layout engine.
   One element list (inches / pt) feeds the on-screen preview, the PPTX export and the print PDF,
   so what users edit is what they export. */
(function (global) {
  'use strict';
  const RG = global.RG;

  const PALETTES = {
    pasero: { pri: '1A0080', acc: '8E73CF', light: 'F1ECFB', ink: '14241F', sub: '62756B', line: 'E5DEF4' },
    blue:   { pri: '1F4E79', acc: 'D9822B', light: 'EAF1F8', ink: '1E2329', sub: '5B6670', line: 'D7E0EA' },
    forest: { pri: '2F5D50', acc: 'C8553D', light: 'EDF4F1', ink: '1E2622', sub: '5C6B5E', line: 'D5E2DA' },
    mono:   { pri: '1F1F1F', acc: '7A7A7A', light: 'F1F2F3', ink: '1A1A1A', sub: '666666', line: 'DDDDDD' }
  };
  const SIZES = { A0P: [33.11, 46.81], A0L: [46.81, 33.11], A1P: [23.39, 33.11], A1L: [33.11, 23.39], U48P: [36, 48], U48L: [48, 36] };

  const units = s => { let u = 0; for (const ch of String(s)) u += /[⺀-鿿가-힯＀-￯]/.test(ch) ? 1 : 0.52; return u; };
  function estH(text, w, pt, lh) { lh = lh || 1.3; let n = 0; for (const l of String(text || '').split('\n')) n += Math.max(1, Math.ceil(units(l) * 1.08 * pt / 72 / w)); return n * pt / 72 * lh; }
  function estBullets(items, w, pt) { return (items || []).reduce((a, s) => a + estH(s, w - pt / 72 * 1.1, pt) + pt / 72 * 0.35, 0); }
  function fitPt(text, w, h, pt, min) { while (pt > min && estH(text, w, pt, 1.25) > h) pt -= 1; return pt; }
  function fitBulletPt(items, w, h, pt, min) { while (pt > min && estBullets(items, w, pt) > h) pt -= 1; return pt; }
  function fitBox(x, y, w, h, a) { const ar = a && a.w ? a.w / a.h : 4 / 3; let iw = w, ih = w / ar; if (ih > h) { ih = h; iw = h * ar; } return { x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih }; }
  const fontFace = () => RG.S.settings.lang === 'ja' ? 'Yu Gothic' : RG.S.settings.lang === 'zh' ? 'Microsoft YaHei' : 'Arial';

  /* image element + mandatory AI label for generated schematics (cannot be removed by the model) */
  function imageEls(id, box, aiPt) {
    const a = RG.assetById(id); const E = [{ t: 'image', ...box, asset: id }];
    if (a && a.ai) {
      const lw = Math.min(box.w, units(RG.t('ai_label')) * aiPt / 72 + 0.25);
      E.push({ t: 'text', x: box.x, y: box.y + box.h - aiPt / 72 * 1.6, w: lw, h: aiPt / 72 * 1.6, text: RG.t('ai_label'), size: aiPt, color: '555555', fill: 'FFFFFF', valign: 'middle', align: 'center', locked: true });
    }
    return E;
  }

  /* ================= slides ================= */
  function slideEls(sl, i, n) {
    const S = RG.S, pal = PALETTES[S.settings.palette], tpl = S.settings.pptTemplate;
    const W = 13.333, H = 7.5, E = [], P = `report.slides.${i}`;
    const short = (S.structure && S.structure.short_title) || '';
    const big = tpl === 'lecture' ? 1.15 : tpl === 'seminar' ? 0.9 : 1;
    if (sl.layout === 'title') {
      if (tpl === 'lecture') {
        E.push({ t: 'rect', x: 0, y: H - 0.5, w: W, h: 0.5, fill: pal.pri });
        E.push({ t: 'text', x: 0.9, y: 1.2, w: W - 1.8, h: 3.0, text: sl.title, size: fitPt(sl.title, W - 1.8, 3.0, 40, 26), bold: true, color: pal.pri, valign: 'bottom', path: P + '.title' });
        E.push({ t: 'rect', x: 0.9, y: 4.4, w: 2.2, h: 0.06, fill: pal.acc });
        E.push({ t: 'bullets', plain: true, x: 0.9, y: 4.7, w: W - 1.8, h: 1.9, items: sl.bullets, size: 18, color: pal.sub, path: P + '.bullets' });
      } else {
        E.push({ t: 'rect', x: 0, y: 0, w: W, h: H, fill: pal.pri }, { t: 'rect', x: 0.8, y: 4.05, w: 1.6, h: 0.08, fill: pal.acc });
        E.push({ t: 'text', x: 0.8, y: 1.0, w: W - 1.6, h: 2.9, text: sl.title, size: fitPt(sl.title, W - 1.6, 2.9, 36, 24), bold: true, color: 'FFFFFF', valign: 'bottom', path: P + '.title' });
        E.push({ t: 'bullets', plain: true, x: 0.8, y: 4.35, w: W - 1.6, h: 2.4, items: sl.bullets, size: 18, color: 'E6E1F5', path: P + '.bullets' });
      }
      return E;
    }
    if (sl.layout === 'section') {
      E.push({ t: 'rect', x: 0, y: 0, w: 0.35, h: H, fill: pal.acc });
      E.push({ t: 'text', x: 1.0, y: 2.6, w: W - 2, h: 1.6, text: sl.title, size: 34 * big, bold: true, color: pal.pri, valign: 'middle', path: P + '.title' });
      if (sl.bullets.length) E.push({ t: 'bullets', plain: true, x: 1.0, y: 4.3, w: W - 2, h: 2, items: sl.bullets, size: 18, color: pal.sub, path: P + '.bullets' });
      return E;
    }
    // header per template
    let top = 1.5;
    if (tpl === 'seminar') {
      E.push({ t: 'rect', x: 0, y: 0, w: W, h: 1.05, fill: pal.pri });
      E.push({ t: 'text', x: 0.5, y: 0.1, w: W - 1, h: 0.85, text: sl.title, size: fitPt(sl.title, W - 1, 0.85, 24, 16), bold: true, color: 'FFFFFF', valign: 'middle', path: P + '.title' });
      top = 1.35;
    } else if (tpl === 'lecture') {
      E.push({ t: 'text', x: 0.7, y: 0.35, w: W - 1.4, h: 1.0, text: sl.title, size: fitPt(sl.title, W - 1.4, 1.0, 32, 20), bold: true, color: pal.pri, valign: 'middle', path: P + '.title' });
      E.push({ t: 'rect', x: 0.7, y: 1.38, w: W - 1.4, h: 0.03, fill: pal.line });
      top = 1.65;
    } else {
      E.push({ t: 'rect', x: 0.5, y: 0.42, w: 0.09, h: 0.82, fill: pal.acc });
      E.push({ t: 'text', x: 0.75, y: 0.32, w: W - 1.3, h: 1.0, text: sl.title, size: fitPt(sl.title, W - 1.3, 1.0, 28, 18), bold: true, color: pal.pri, valign: 'middle', path: P + '.title' });
    }
    E.push({ t: 'text', x: 0.5, y: H - 0.42, w: 9, h: 0.3, text: short, size: 10, color: pal.sub, locked: true });
    E.push({ t: 'text', x: W - 1.5, y: H - 0.42, w: 1, h: 0.3, text: `${i + 1} / ${n}`, size: 10, color: pal.sub, align: 'right', locked: true });
    const imgId = sl.figure_id || sl.schematic_id; const a = imgId && RG.assetById(imgId);
    const bodyH = H - top - 0.65;
    if (sl.layout === 'figure' && a) {
      const capH = sl.bullets.length ? 0.6 : 0;
      const b = fitBox(0.6, top, W - 1.2, bodyH - capH, a); E.push(...imageEls(imgId, b, 11));
      if (capH) E.push({ t: 'bullets', plain: true, x: 0.6, y: top + bodyH - capH + 0.05, w: W - 1.2, h: capH, items: sl.bullets.slice(0, 1), size: 15 * big, color: pal.sub, align: 'center', path: P + '.bullets' });
      return E;
    }
    if (sl.layout === 'figure_bullets' && a) {
      const ar = a.w ? a.w / a.h : 4 / 3, fw = ar > 1.6 ? 8.2 : 7.0;
      const b = fitBox(0.5, top, fw, bodyH, a); E.push(...imageEls(imgId, b, 11));
      E.push({ t: 'bullets', x: fw + 0.8, y: top + 0.2, w: W - fw - 1.3, h: bodyH - 0.2, items: sl.bullets, size: fitBulletPt(sl.bullets, W - fw - 1.3, bodyH - 0.2, 20 * big, 13), color: pal.ink, path: P + '.bullets' });
      return E;
    }
    if (sl.layout === 'conclusion') {
      E.push({ t: 'rect', x: 0.6, y: top + 0.05, w: W - 1.2, h: bodyH, fill: pal.light });
      E.push({ t: 'bullets', x: 1.0, y: top + 0.35, w: W - 2, h: bodyH - 0.5, items: sl.bullets, size: fitBulletPt(sl.bullets, W - 2, bodyH - 0.5, 24 * big, 15), color: pal.ink, bold: true, path: P + '.bullets' });
      return E;
    }
    E.push({ t: 'bullets', x: 0.8, y: top + 0.1, w: W - 1.6, h: bodyH, items: sl.bullets, size: fitBulletPt(sl.bullets, W - 1.6, bodyH, 24 * big, 14), color: pal.ink, path: P + '.bullets' });
    return E;
  }

  /* ================= poster ================= */
  function posterEls() {
    const S = RG.S, R = S.report, pal = PALETTES[S.settings.palette], tpl = S.settings.posterTemplate;
    const [W, H] = SIZES[S.settings.posterSize], k = Math.min(W, H) / 33.11, m = 1.0 * k, gap = 0.75 * k, st = S.structure || {};
    const secs = R.sections.map((s, i) => ({ ...s, path: 'report.sections.' + i }));
    secs.push({ heading: 'Take-home', bullets: R.take_home || [], figure_ids: [], schematic_ids: [], emphasis: true, take: true, path: 'report' });
    let best = null;
    for (let fs = 1.7; fs > 0.45; fs *= 0.94) {
      const E = []; let ovf = false;
      /* header */
      const title = st.title || S.meta.title || '', tPath = st.title ? 'structure.title' : 'meta.title';
      let tpt = 78 * k; while (tpt > 40 * k && estH(title, W - 2 * m, tpt, 1.3) > 4.6 * k) tpt -= 2 * k;
      const th1 = estH(title, W - 2 * m, tpt, 1.3);
      const auth = [S.meta.authors || st.authors, S.meta.affiliation || st.affiliation].filter(Boolean).join('\n');
      const ah = auth ? estH(auth, W - 2 * m, 30 * k, 1.3) : 0, hh = m * 0.9 + th1 + 0.35 * k + ah + m * 0.7;
      E.push({ t: 'rect', x: 0, y: 0, w: W, h: hh, fill: pal.pri });
      E.push({ t: 'text', x: m, y: m * 0.9, w: W - 2 * m, h: th1, text: title, size: tpt, bold: true, color: 'FFFFFF', path: tPath });
      if (auth) E.push({ t: 'text', x: m, y: m * 0.9 + th1 + 0.35 * k, w: W - 2 * m, h: ah + 0.2 * k, text: auth, size: 30 * k, color: 'E6E1F5', locked: true });
      /* headline */
      const bill = tpl === 'billboard';
      let hpt = (bill ? 96 : 58) * k; const hlW = W - 2 * m - 1.2 * k;
      while (hpt > 36 * k && estH(R.headline, hlW, hpt, 1.3) > (bill ? 7.5 : 3.0) * k) hpt -= 2 * k;
      const hlH = estH(R.headline, hlW, hpt, 1.3) + (bill ? 2.4 : 1.0) * k, hy = hh + 0.7 * k;
      E.push({ t: 'rect', x: m, y: hy, w: W - 2 * m, h: hlH, fill: pal.light }, { t: 'rect', x: m, y: hy, w: 0.35 * k, h: hlH, fill: pal.acc });
      E.push({ t: 'text', x: m + 0.9 * k, y: hy + (bill ? 1.2 : 0.5) * k, w: hlW, h: hlH - (bill ? 2.4 : 1.0) * k, text: R.headline, size: hpt, bold: true, color: pal.pri, valign: 'middle', align: bill ? 'center' : 'left', path: 'report.headline' });
      const top = hy + hlH + 0.9 * k, footH = 1.5 * k, bottom = H - m - footH;
      const bpt = 30 * k * fs * (bill ? 0.85 : 1), hpt2 = 40 * k * fs * (bill ? 0.85 : 1), cpt = 21 * k * fs, pad = 0.45 * k;

      const layoutSec = (s, x, y, colW) => {
        const out = []; let cy = y; const hH = hpt2 / 72 * 1.5;
        out.push({ t: 'rect', x, y: cy, w: colW, h: hH, fill: s.take ? pal.acc : pal.pri });
        out.push({ t: 'text', x: x + pad, y: cy, w: colW - 2 * pad, h: hH, text: s.heading, size: Math.min(hpt2, (colW - 2 * pad) * 72 / Math.max(1, units(s.heading)) / 1.08), bold: true, color: 'FFFFFF', valign: 'middle', path: s.take ? null : s.path + '.heading' });
        cy += hH + pad; const iw = colW - 2 * pad;
        if (s.bullets.length) { const bh = estBullets(s.bullets, iw, bpt); out.push({ t: 'bullets', x: x + pad, y: cy, w: iw, h: bh + 0.1 * k, items: s.bullets, size: bpt, color: pal.ink, bold: !!s.take, path: s.take ? 'report.take_home' : s.path + '.bullets' }); cy += bh + pad * 0.6; }
        for (const id of [...(s.figure_ids || []), ...(s.schematic_ids || [])]) {
          const a = RG.assetById(id); if (!a) continue;
          const ar = a.w ? a.w / a.h : 4 / 3; const ih = Math.min(iw / ar, iw * 1.05, (bottom - top) * 0.55);
          out.push(...imageEls(id, fitBox(x + pad, cy, iw, ih, a), 16 * k)); cy += ih + 0.2 * k;
          const cap = a.ai ? (a.label + ' — ' + RG.t('ai_label')) : (a.label + '. ' + String(a.caption || '').replace(RGParse.CAP_RE, '').replace(/^[.:\s|]+/, ''));
          const capS = cap.length > 170 ? cap.slice(0, 168) + '…' : cap; const chh = estH(capS, iw, cpt, 1.25);
          out.push({ t: 'text', x: x + pad, y: cy, w: iw, h: chh + 0.1 * k, text: capS, size: cpt, color: pal.sub, locked: true }); cy += chh + pad * 0.6;
        }
        const h = cy - y + pad * 0.4;
        if (s.emphasis || s.take) out.unshift({ t: 'rect', x, y, w: colW, h, fill: pal.light });
        return { h, out };
      };
      const fill = (list, cols) => {
        // balanced columns: aim for equal column heights, never past the bottom margin
        const total = list.reduce((a, s) => a + layoutSec(s, 0, 0, cols[0].w).h + gap, 0);
        const target = Math.min(bottom - top, total / cols.length * 1.08);
        let ci = 0, y = top;
        for (const s of list) {
          let r = layoutSec(s, 0, 0, cols[ci].w);
          if ((y + r.h > bottom || y - top + r.h > target) && y > top && ci < cols.length - 1) { ci++; y = top; r = layoutSec(s, 0, 0, cols[ci].w); }
          r = layoutSec(s, cols[ci].x, y, cols[ci].w); E.push(...r.out); y += r.h + gap;
          if (y - gap > bottom + 0.01) ovf = true;
        }
      };
      if (tpl === 'centerfig') {
        const unit = (W - 2 * m - 2 * gap) / 3.6;
        const L = { x: m, w: unit }, C = { x: m + unit + gap, w: unit * 1.6 }, Rr = { x: m + unit * 2.6 + 2 * gap, w: unit };
        const center = secs.filter(s => s.emphasis || s.take), side = secs.filter(s => !s.emphasis && !s.take);
        fill(center, [C]); fill(side, [L, Rr]);
      } else {
        const ncol = (W > H ? 4 : 3) + (bill ? 1 : 0) - (W < 25 ? 1 : 0);
        const cw = (W - 2 * m - (ncol - 1) * gap) / ncol;
        fill(secs, Array.from({ length: ncol }, (_, i) => ({ x: m + i * (cw + gap), w: cw })));
      }
      /* footer */
      E.push({ t: 'rect', x: m, y: H - m - footH + 0.3 * k, w: W - 2 * m, h: 0.04 * k, fill: pal.line });
      E.push({ t: 'text', x: m, y: H - m - footH + 0.5 * k, w: W - 2 * m, h: footH - 0.5 * k, text: [S.meta.doi ? 'DOI: ' + S.meta.doi : '', RG.t('ai_note')].filter(Boolean).join('   ·   '), size: 18 * k, color: '777777', valign: 'middle', locked: true });
      best = { E, W, H, ovf }; if (!ovf) break;
    }
    return best;
  }

  function pages() {
    const S = RG.S; if (!S.report) return null;
    if (S.settings.kind === 'ppt') { const n = S.report.slides.length; return { W: 13.333, H: 7.5, kind: 'ppt', pages: S.report.slides.map((s, i) => slideEls(s, i, n)) }; }
    const r = posterEls(); return { W: r.W, H: r.H, kind: 'poster', pages: [r.E], ovf: r.ovf };
  }

  /* ================= render (preview / print) ================= */
  function getPath(p) { return p.split('.').reduce((o, k) => (o == null ? o : o[k]), RG.S); }
  function setPath(p, v) { const ks = p.split('.'), last = ks.pop(); const o = ks.reduce((o, k) => o[k], RG.S); o[last] = v; }

  function render(box, E, W, H, print) {
    const k = print ? 1 : box.clientWidth / W, u = v => print ? v + 'in' : v * k + 'px', fz = pt => print ? pt + 'pt' : pt / 72 * k + 'px';
    box.innerHTML = ''; box.style.position = 'relative'; box.style.height = u(H); if (print) box.style.width = W + 'in';
    for (const el of E) {
      const d = document.createElement('div'); d.className = 'el el-' + el.t;
      Object.assign(d.style, { left: u(el.x), top: u(el.y), width: u(el.w), height: u(el.h) });
      if (el.t === 'rect') d.style.background = '#' + el.fill;
      else if (el.t === 'text') {
        Object.assign(d.style, { fontSize: fz(el.size), color: '#' + el.color, fontWeight: el.bold ? 700 : 400, alignItems: el.valign === 'middle' ? 'center' : el.valign === 'bottom' ? 'flex-end' : 'flex-start' });
        if (el.fill) d.style.background = '#' + el.fill;
        const sp = document.createElement('span'); sp.textContent = el.text; sp.style.textAlign = el.align || 'left';
        if (!print && el.path && !el.locked) { sp.contentEditable = 'true'; sp.oninput = () => setPath(el.path, sp.innerText.trim()); }
        if (!print && RG.flagNumbers(el.text).length) { d.classList.add('warn'); d.title = RG.t('num_warn') + RG.flagNumbers(el.text).join(', '); }
        d.append(sp);
      } else if (el.t === 'bullets') {
        Object.assign(d.style, { fontSize: fz(el.size), color: '#' + el.color, fontWeight: el.bold ? 600 : 400, textAlign: el.align || 'left' });
        const ul = document.createElement('ul'); if (el.plain) ul.className = 'plain';
        el.items.forEach((s, j) => {
          const li = document.createElement('li'); li.textContent = s;
          if (!print && el.path) { li.contentEditable = 'true'; li.oninput = () => { getPath(el.path)[j] = li.innerText.trim(); }; }
          const bad = !print && RG.flagNumbers(s);
          if (bad && bad.length) { li.classList.add('warn'); li.title = RG.t('num_warn') + bad.join(', '); }
          ul.append(li);
        });
        d.append(ul);
      } else if (el.t === 'image') {
        const a = RG.assetById(el.asset);
        if (a && a.img) { const im = document.createElement('img'); im.src = a.img; im.alt = a.label || ''; d.append(im); }
        else { const ph = document.createElement('div'); ph.className = 'ph'; ph.style.fontSize = fz(14 * (W / 13.333)); ph.textContent = RG.t(a && a.ai ? 'ph_schematic' : 'ph_figure', { l: (a && a.label) || el.asset }); d.append(ph); }
      }
      box.append(d);
    }
    if (!print) requestAnimationFrame(() => box.querySelectorAll('.el-text,.el-bullets').forEach(d => { const c = d.firstChild; if (c && c.scrollHeight > d.clientHeight + 2) d.classList.add('ovf'); }));
  }

  /* ================= export ================= */
  async function exportPptx(fileBase) {
    const P = pages(); if (!P) return;
    const pptx = new global.PptxGenJS(); const ff = fontFace();
    if (P.kind === 'ppt') pptx.layout = 'LAYOUT_WIDE'; else { pptx.defineLayout({ name: 'POSTER', width: P.W, height: P.H }); pptx.layout = 'POSTER'; }
    pptx.title = RG.S.meta.title || 'Report';
    P.pages.forEach((E, i) => {
      const sl = pptx.addSlide();
      for (const el of E) {
        const box = { x: el.x, y: el.y, w: el.w, h: el.h };
        if (el.t === 'rect') sl.addShape(pptx.ShapeType.rect, { ...box, fill: { color: el.fill }, line: { color: el.fill, width: 0 } });
        else if (el.t === 'text') sl.addText(el.text || ' ', { ...box, fontSize: +el.size.toFixed(1), bold: !!el.bold, color: el.color, align: el.align || 'left', valign: el.valign || 'top', fontFace: ff, margin: 0, fit: 'shrink', fill: el.fill ? { color: el.fill } : undefined });
        else if (el.t === 'bullets' && el.items.length) sl.addText(el.items.map((s, j) => ({ text: s, options: { bullet: el.plain ? false : { indent: Math.round(el.size * 0.9) }, breakLine: j < el.items.length - 1, paraSpaceAfter: Math.round(el.size * 0.35) } })), { ...box, fontSize: +el.size.toFixed(1), color: el.color, bold: !!el.bold, align: el.align || 'left', valign: 'top', fontFace: ff, margin: 0, fit: 'shrink' });
        else if (el.t === 'image') {
          const a = RG.assetById(el.asset);
          if (a && a.img) sl.addImage({ data: a.img.replace(/^data:/, ''), ...box, altText: a.ai ? RG.t('ai_label') : a.label });
          else { sl.addShape(pptx.ShapeType.rect, { ...box, fill: { color: 'EEEEEE' }, line: { color: 'BBBBBB', dashType: 'dash' } }); sl.addText(RG.t(a && a.ai ? 'ph_schematic' : 'ph_figure', { l: (a && a.label) || el.asset }), { ...box, align: 'center', valign: 'middle', color: '777777', fontSize: P.kind === 'ppt' ? 14 : 28, fontFace: ff }); }
        }
      }
      if (P.kind === 'ppt' && RG.S.report.slides[i].notes) sl.addNotes(RG.S.report.slides[i].notes);
    });
    return pptx.writeFile({ fileName: `${fileBase}_${P.kind === 'ppt' ? 'slides' : 'poster'}.pptx` });
  }

  function printPdf() {
    const P = pages(); if (!P) return; const root = document.getElementById('printRoot'); root.innerHTML = '';
    let st = document.getElementById('pageStyle'); if (!st) { st = document.createElement('style'); st.id = 'pageStyle'; document.head.append(st); }
    st.textContent = `@page{size:${P.W}in ${P.H}in;margin:0}`;
    P.pages.forEach(E => { const pg = document.createElement('div'); pg.className = 'pp'; root.append(pg); render(pg, E, P.W, P.H, true); });
    setTimeout(() => global.print(), 300);
  }

  global.RGLayout = { PALETTES, SIZES, pages, render, exportPptx, printPdf, getPath, setPath };
})(window);
