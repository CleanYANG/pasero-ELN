/* Pasero Reporter — local material parsing.
   Everything here runs in the browser. Nothing in this file sends data anywhere. */
(function (global) {
  'use strict';

  const HEAD_RE = /^(\d+(\.\d+)*\.?\s*)?(abstract|summary|introduction|background|results?(\s+and\s+discussion)?|methods?|materials?\s+and\s+methods|experimental\s+procedures|star\s*methods|discussion|conclusions?|references|bibliography|acknowledge?ments?|funding|author\s+contributions|competing\s+interests|supplementary.*|要旨|要約|緒言|はじめに|序論|背景|結果|方法|材料と方法|実験方法|考察|結論|おわりに|参考文献|引用文献|謝辞|摘要|引言|结果|讨论|结论|致谢)\s*[:：]?$/i;
  const CAP_RE = /^(fig(?:ure)?\.?|図|图|table|表|extended\s+data\s+fig(?:ure)?\.?)\s*(S?\d+)/i;
  const SKIP_HEAD = /references|bibliography|acknowledg|funding|author\s+contributions|competing|参考文献|引用文献|謝辞|致谢/i;

  let seq = 0;
  const nid = (p) => p + (++seq).toString(36);

  function needSpace(a, b) {
    return !(/[　-鿿]$/.test(a) || /^[　-鿿]/.test(b) || /\s$/.test(a) || /^\s/.test(b));
  }
  function joinLine(a, b) {
    if (/[a-z]-$/.test(a) && /^[a-z]/.test(b)) return a.slice(0, -1) + b;
    return a + (needSpace(a, b) ? ' ' : '') + b;
  }
  function median(a) { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] || 10; }

  function makeBlock(source, heading, text, extra) {
    const m = text.match(CAP_RE);
    const kind = m ? 'cap' : SKIP_HEAD.test(heading) ? 'ref' : 'para';
    return Object.assign({
      id: nid('b'), source, heading, text, kind,
      capNum: m ? m[2] : null,
      capKind: m ? (/tab|表/i.test(m[1]) ? 'Table' : 'Figure') : null,
      sel: kind === 'para' && text.length > 40
    }, extra || {});
  }

  /* ---------- PDF ---------- */
  async function parsePdf(file) {
    const lib = global.pdfjsLib;
    lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
    const lines = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const tc = await (await pdf.getPage(p)).getTextContent();
      let cur = null;
      for (const it of tc.items) {
        if (!it.str) continue;
        const y = it.transform[5], x = it.transform[4], w = it.width || 0;
        const sz = Math.round(Math.hypot(it.transform[2], it.transform[3]) * 10) / 10 || it.height || 10;
        if (cur && Math.abs(cur.y - y) < sz * 0.5 && x >= cur.x1 - sz && x - cur.x1 < sz * 4) { cur.text += (needSpace(cur.text, it.str) ? ' ' : '') + it.str; cur.size = Math.max(cur.size, sz); cur.x1 = Math.max(cur.x1, x + w); }
        else { if (cur) lines.push(cur); cur = { text: it.str, y, size: sz, page: p, x0: x, x1: x + w }; }
      }
      if (cur) lines.push(cur);
    }
    const L = lines.map(l => ({ ...l, text: l.text.replace(/\s+/g, ' ').trim() })).filter(l => l.text && !/^\d{1,3}$/.test(l.text));
    if (!L.length) return { blocks: [], meta: {}, pages: pdf.numPages, scanned: true };
    const p1 = L.filter(l => l.page === 1);
    const maxS = Math.max(...p1.map(l => l.size));
    const tl = p1.filter(l => l.size >= maxS - 0.3).slice(0, 3);
    const body = median(L.map(l => l.size));
    const raw = []; let heading = 'Front matter', para = null, prev = null;
    const flush = () => { if (para && para.text.length >= 25) raw.push(para); para = null; };
    for (const l of L) {
      if (tl.includes(l)) continue;
      if (l.text.length < 70 && HEAD_RE.test(l.text)) { flush(); heading = l.text.replace(/^[\d.\s]+/, '').replace(/[:：]$/, ''); prev = l; continue; }
      const gap = prev && prev.page === l.page ? prev.y - l.y : 0;
      const brk = !para || CAP_RE.test(l.text) || gap > l.size * 1.75 || (gap < 0 && prev.page === l.page) || Math.abs(l.size - para.size) > 1.2;
      if (brk) { flush(); para = { heading, text: l.text, size: l.size, page: l.page, box: [l.x0, l.y - l.size * 0.35, l.x1, l.y + l.size] }; }
      else { para.text = joinLine(para.text, l.text); if (para.page === l.page) para.box = [Math.min(para.box[0], l.x0), Math.min(para.box[1], l.y - l.size * 0.35), Math.max(para.box[2], l.x1), Math.max(para.box[3], l.y + l.size)]; }
      prev = l;
    }
    flush();
    const blocks = raw.map(b => {
      const blk = makeBlock(file.name, b.heading, b.text, b.box ? { page: b.page, box: b.box } : null);
      blk.sel = blk.kind === 'para' && Math.abs(b.size - body) < 1.5 && b.text.length > 60;
      return blk;
    });
    const all = L.map(l => l.text).join(' ');
    const i = p1.indexOf(tl[tl.length - 1]);
    const next = p1[i + 1];
    // Figures in journal PDFs are often vector drawings, not embedded images: find each figure's region
    // next to its caption by rendering the page locally and cropping it (nothing leaves the browser).
    DOCS[file.name] = { pdf, lines: L, body };
    const figures = [];
    for (const b of blocks.filter(b => b.kind === 'cap' && b.capKind === 'Figure' && b.page)) {
      if (figures.find(f => f.num === b.capNum)) continue;
      try { const c = await autoCrop(file.name, b.page, b.box); if (c) figures.push({ num: b.capNum, ...c }); } catch (e) { console.warn('crop', e); }
    }
    return {
      blocks, pages: pdf.numPages, figures,
      meta: {
        title: tl.map(l => l.text).join(' '),
        authors: next && next.text.length < 300 && !HEAD_RE.test(next.text) ? next.text.replace(/[\d*†‡§¶]+(?=\s|,|$)/g, '').replace(/\s+,/g, ',') : '',
        doi: ((all.match(/10\.\d{4,9}\/[^\s"<>,;)]+/) || [''])[0]).replace(/\.$/, '')
      }
    };
  }

  /* ---------- figure cropping from rendered PDF pages ---------- */
  const DOCS = {};
  async function renderPage(doc, pageNo, scale) {
    const page = await DOCS[doc].pdf.getPage(pageNo);
    const vp = page.getViewport({ scale });
    const c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: g, viewport: vp }).promise;
    return { canvas: c, vp, page };
  }
  // rect in PDF units, origin top-left: [x0, y0, x1, y1]
  async function cropRect(doc, pageNo, rect, scale) {
    scale = scale || 3;
    const { canvas } = await renderPage(doc, pageNo, scale);
    const [x0, y0, x1, y1] = rect.map(v => Math.round(v * scale));
    const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
    const out = document.createElement('canvas'); out.width = w; out.height = h;
    out.getContext('2d').drawImage(canvas, x0, y0, w, h, 0, 0, w, h);
    return { img: out.toDataURL('image/png'), w, h, src: { doc, page: pageNo, rect } };
  }
  async function autoCrop(doc, pageNo, capBox) {
    const D = DOCS[doc]; const S = 1.5;
    const { canvas, vp } = await renderPage(doc, pageNo, S);
    const W = vp.width / S, H = vp.height / S;        // page size in PDF units
    const g = canvas.getContext('2d'); g.fillStyle = '#fff';
    const toTop = (x0, yb, x1, yt) => [x0, H - yt, x1, H - yb];   // PDF (bottom-left) → top-left
    const erase = (r, pad) => { pad = pad || 2; g.fillRect((r[0] - pad) * S, (r[1] - pad) * S, (r[2] - r[0] + 2 * pad) * S, (r[3] - r[1] + 2 * pad) * S); };
    // remove running text (body-size lines), the caption itself, and header/footer bands
    for (const l of D.lines.filter(l => l.page === pageNo)) {
      const r = toTop(l.x0, l.y - l.size * 0.35, l.x1, l.y + l.size);
      const bodyLike = Math.abs(l.size - D.body) <= 0.8 && l.text.length > 20;
      if (bodyLike || r[1] > H * 0.94 || (r[3] < H * 0.05 && l.text.length > 3)) erase(r);
    }
    const cap = toTop(capBox[0], capBox[1], capBox[2], capBox[3]); erase(cap, 4);
    // occupancy grid (3 pt cells) → dilate → connected components
    const cell = 3, gw = Math.ceil(W / cell), gh = Math.ceil(H / cell);
    const px = g.getImageData(0, 0, canvas.width, canvas.height).data, occ = new Uint8Array(gw * gh);
    for (let y = 0; y < canvas.height; y += 2) for (let x = 0; x < canvas.width; x += 2) {
      const i = (y * canvas.width + x) * 4; if (255 - Math.min(px[i], px[i + 1], px[i + 2]) > 30) occ[Math.floor(y / S / cell) * gw + Math.floor(x / S / cell)] = 1;
    }
    const R = 3, dil = new Uint8Array(gw * gh);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (occ[y * gw + x])
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < gh && xx >= 0 && xx < gw) dil[yy * gw + xx] = 1; }
    const lab = new Int32Array(gw * gh), comps = []; let n = 0;
    for (let i = 0; i < gw * gh; i++) if (dil[i] && !lab[i]) {
      n++; const st = [i]; lab[i] = n; let bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1, cnt = 0;
      while (st.length) { const k = st.pop(), x = k % gw, y = (k / gw) | 0; cnt++; if (x < bx0) bx0 = x; if (y < by0) by0 = y; if (x > bx1) bx1 = x; if (y > by1) by1 = y;
        for (const k2 of [k - 1, k + 1, k - gw, k + gw]) if (k2 >= 0 && k2 < gw * gh && dil[k2] && !lab[k2] && Math.abs((k2 % gw) - x) <= 1) { lab[k2] = n; st.push(k2); } }
      comps.push({ box: [bx0 * cell, by0 * cell, (bx1 + 1) * cell, (by1 + 1) * cell], cnt });
    }
    if (!comps.length) return null;
    comps.sort((a, b) => b.cnt - a.cnt);
    const area = b => (b[2] - b[0]) * (b[3] - b[1]);
    if (area(comps[0].box) < W * H * 0.04) return null;
    let u = comps[0].box.slice();
    const near = (a, b, d) => !(a[2] + d < b[0] || b[2] + d < a[0] || a[3] + d < b[1] || b[3] + d < a[1]);
    for (let changed = true; changed;) { changed = false;
      for (const c of comps.slice(1)) if (!c.used && area(c.box) > W * H * 0.006 && near(u, c.box, 14)) { c.used = true; changed = true; u = [Math.min(u[0], c.box[0]), Math.min(u[1], c.box[1]), Math.max(u[2], c.box[2]), Math.max(u[3], c.box[3])]; } }
    // dilation grew the box by R cells; shrink back and keep inside the page
    const pad = R * cell - 4; u = [Math.max(0, u[0] + pad), Math.max(0, u[1] + pad), Math.min(W, u[2] - pad), Math.min(H, u[3] - pad)];
    return cropRect(doc, pageNo, u, 3);
  }
  async function pageImage(doc, pageNo, scale) { const { canvas, vp } = await renderPage(doc, pageNo, scale); return { img: canvas.toDataURL('image/jpeg', 0.85), w: vp.width / scale, h: vp.height / scale, pages: DOCS[doc].pdf.numPages }; }

  /* ---------- plain text / markdown / pasted ---------- */
  function parseText(text, source) {
    const blocks = []; let heading = source;
    const paras = String(text).replace(/\r/g, '').split(/\n\s*\n/);
    for (let p of paras) {
      p = p.trim(); if (!p) continue;
      const lines = p.split('\n');
      const first = lines[0].replace(/^#+\s*/, '').trim();
      if ((/^#+\s/.test(lines[0]) || HEAD_RE.test(first)) && first.length < 70) {
        heading = first.replace(/[:：]$/, '');
        const rest = lines.slice(1).join(' ').trim();
        if (rest) blocks.push(makeBlock(source, heading, rest));
        continue;
      }
      blocks.push(makeBlock(source, heading, lines.map(s => s.trim()).join(' ')));
    }
    blocks.forEach(b => { if (b.kind === 'para') b.sel = b.text.length > 20; });
    return { blocks, meta: {} };
  }

  /* ---------- Word (.docx) ---------- */
  async function parseDocx(file) {
    const res = await global.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return parseText(res.value, file.name);
  }

  /* ---------- Excel / CSV: kept as data tables ---------- */
  async function parseSheet(file) {
    const wb = global.XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const blocks = [];
    for (const name of wb.SheetNames.slice(0, 8)) {
      const rows = global.XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, blankrows: false, defval: '' });
      if (!rows.length) continue;
      const shown = rows.slice(0, 60).map(r => r.slice(0, 16).map(c => String(c).trim()).join(' | '));
      const more = rows.length > 60 ? `\n… (${rows.length - 60} more rows not included)` : '';
      blocks.push({
        id: nid('b'), source: file.name, heading: 'Table: ' + name, kind: 'table', sel: true,
        text: shown.join('\n') + more, rows: rows.length
      });
    }
    return { blocks, meta: {} };
  }

  /* ---------- PowerPoint (.pptx): slide text ---------- */
  async function parsePptx(file) {
    const zip = await global.JSZip.loadAsync(await file.arrayBuffer());
    const names = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));
    const blocks = [];
    for (const n of names) {
      const xml = await zip.file(n).async('string');
      const paras = [...xml.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)]
        .map(m => [...m[1].matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(x => x[1]).join(''))
        .map(s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()).filter(Boolean);
      if (!paras.length) continue;
      const num = n.match(/\d+/)[0];
      blocks.push(makeBlock(file.name, 'Slide ' + num + ': ' + paras[0].slice(0, 50), paras.slice(1).join('\n') || paras[0]));
    }
    blocks.forEach(b => { if (b.kind === 'para') b.sel = true; });
    return { blocks, meta: {} };
  }

  /* ---------- images (original files never leave the device) ---------- */
  function readImage(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => { const im = new Image(); im.onload = () => res({ img: r.result, w: im.naturalWidth, h: im.naturalHeight }); im.onerror = rej; im.src = r.result; };
      r.onerror = rej; r.readAsDataURL(file);
    });
  }
  function figNumFromName(name) {
    const m = name.match(/(?:fig(?:ure)?|図|图)[_\s.-]*(S?\d+)/i) || name.match(/(?:^|[_\s-])(\d{1,2})(?=[_.\s-])/);
    return m ? m[1] : null;
  }

  function kindOf(file) {
    const n = file.name.toLowerCase();
    if (file.type === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
    if (n.endsWith('.docx')) return 'docx';
    if (/\.(xlsx|xls|csv|tsv)$/.test(n)) return 'sheet';
    if (n.endsWith('.pptx')) return 'pptx';
    if (/^image\/(png|jpeg|webp)$/.test(file.type)) return 'image';
    if (/\.(txt|md|markdown)$/.test(n) || file.type.startsWith('text/')) return 'text';
    return null;
  }

  async function parseFile(file) {
    const k = kindOf(file);
    if (k === 'pdf') return parsePdf(file);
    if (k === 'docx') return parseDocx(file);
    if (k === 'sheet') return parseSheet(file);
    if (k === 'pptx') return parsePptx(file);
    if (k === 'text') return parseText(await file.text(), file.name);
    throw new Error('unsupported');
  }

  global.RGParse = { parseFile, parseText, readImage, figNumFromName, kindOf, CAP_RE, cropRect, pageImage, hasDoc: d => !!DOCS[d] };
})(window);
