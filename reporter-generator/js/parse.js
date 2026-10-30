/* Reporter Generator — local material parsing.
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
        const y = it.transform[5];
        const sz = Math.round(Math.hypot(it.transform[2], it.transform[3]) * 10) / 10 || it.height || 10;
        if (cur && Math.abs(cur.y - y) < sz * 0.5) { cur.text += (needSpace(cur.text, it.str) ? ' ' : '') + it.str; cur.size = Math.max(cur.size, sz); }
        else { if (cur) lines.push(cur); cur = { text: it.str, y, size: sz, page: p }; }
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
      if (brk) { flush(); para = { heading, text: l.text, size: l.size }; }
      else para.text = joinLine(para.text, l.text);
      prev = l;
    }
    flush();
    const blocks = raw.map(b => {
      const blk = makeBlock(file.name, b.heading, b.text);
      blk.sel = blk.kind === 'para' && Math.abs(b.size - body) < 1.5 && b.text.length > 60;
      return blk;
    });
    const all = L.map(l => l.text).join(' ');
    const i = p1.indexOf(tl[tl.length - 1]);
    const next = p1[i + 1];
    return {
      blocks, pages: pdf.numPages,
      meta: {
        title: tl.map(l => l.text).join(' '),
        authors: next && next.text.length < 300 && !HEAD_RE.test(next.text) ? next.text.replace(/[\d*†‡§¶]+(?=\s|,|$)/g, '').replace(/\s+,/g, ',') : '',
        doi: ((all.match(/10\.\d{4,9}\/[^\s"<>,;)]+/) || [''])[0]).replace(/\.$/, '')
      }
    };
  }

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

  global.RGParse = { parseFile, parseText, readImage, figNumFromName, kindOf, CAP_RE };
})(window);
