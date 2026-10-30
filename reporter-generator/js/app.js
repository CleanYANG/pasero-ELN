/* Reporter Generator — application logic. */
(function (global) {
  'use strict';
  const CFG = global.RG_CONFIG || {};
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { } }
  };

  const S = {
    ui: 'zh', meta: { title: '', authors: '', affiliation: '', doi: '' },
    blocks: [], figs: [], schematics: [], status: null,
    settings: { kind: 'poster', posterTemplate: 'classic', pptTemplate: 'conference', palette: 'pasero', style: 'flat', posterSize: 'A0P', density: 'standard', aud: 'specialist', minutes: 10, notes: true, lang: 'ja' },
    structure: null, structSig: '', reports: { poster: null, ppt: null }, chat: [], demo: false, payloadEdited: false,
    session: null, quota: null, sentText: '', busy: false
  };
  Object.defineProperty(S, 'report', { get() { return S.reports[S.settings.kind]; }, set(v) { S.reports[S.settings.kind] = v; } });

  function t(k, v) {
    const d = global.RG_I18N; let s = (d[S.ui] && d[S.ui][k]) != null ? d[S.ui][k] : (d.zh[k] != null ? d.zh[k] : k);
    if (v) for (const x in v) s = s.split('{' + x + '}').join(v[x]);
    return s;
  }

  /* ---------- assets (user originals + AI schematics) ---------- */
  function assetById(id) {
    const f = S.figs.find(x => x.id === id);
    if (f) return { img: f.img, w: f.w, h: f.h, label: f.label, caption: f.caption, ai: false };
    const s = S.schematics.find(x => x.id === id);
    if (s) return { img: s.img, w: s.w || 4, h: s.h || 3, label: s.title || s.id, caption: s.description, ai: true };
    return null;
  }

  /* ---------- numbers not present in what was sent ---------- */
  let numSet = new Set();
  function numTokens(text) { return (String(text).match(/\d+(?:[.,]\d+)*/g) || []).map(x => x.replace(/,(?=\d{3}\b)/g, '').replace(',', '.')); }
  function refreshNumSet(text) { numSet = new Set(numTokens(text)); }
  function flagNumbers(text) {
    if (!numSet.size) return [];
    return numTokens(text).filter(n => !(Number.isInteger(+n) && +n < 10) && !numSet.has(n));
  }

  /* ---------- material payload ---------- */
  function buildMaterial() {
    return {
      paper: { ...S.meta }, material_status: S.status, requirements: $('reqMore').value.trim(),
      passages: S.blocks.filter(b => b.sel && b.kind !== 'cap').map(b => ({ id: b.id, section: b.heading, source: b.source, text: b.text })),
      figures: S.figs.filter(f => f.sel).map(f => ({ id: f.id, label: f.label, caption: f.caption, aspect_ratio: f.w ? +(f.w / f.h).toFixed(2) : null, has_original: !!f.img }))
    };
  }
  function settingsPayload() {
    const st = S.settings, sz = global.RGLayout ? global.RGLayout.SIZES[st.posterSize] : [0, 0];
    return st.kind === 'poster'
      ? { kind: 'poster', template: st.posterTemplate, density: st.density, size_in: sz, orientation: sz[0] > sz[1] ? 'landscape' : 'portrait', lang: st.lang, schematic_style: st.style }
      : { kind: 'ppt', template: st.pptTemplate, audience: st.aud, minutes: st.minutes, speaker_notes: st.notes, lang: st.lang, schematic_style: st.style };
  }
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h.toString(36); }

  /* ---------- backend ---------- */
  let sb = null;
  const configured = () => CFG.supabaseKey && !/REPLACE/.test(CFG.supabaseKey);
  async function api(action, body) {
    if (!S.session) throw Object.assign(new Error(t('need_login')), { code: 'AUTH_REQUIRED' });
    const r = await fetch(`${CFG.supabaseUrl}/functions/v1/${CFG.functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: CFG.supabaseKey, Authorization: 'Bearer ' + S.session.access_token },
      body: JSON.stringify({ action, ...body })
    });
    const j = await r.json().catch(() => ({}));
    if (j.quota) { S.quota = j.quota; renderQuota(); }
    if (!r.ok) throw Object.assign(new Error(j.error || 'HTTP ' + r.status), { code: j.code });
    return j;
  }
  function errText(e) {
    return ({ QUOTA_EXCEEDED: t('err_quota'), BETA_INACTIVE: t('err_beta'), AUTH_REQUIRED: t('err_auth'), REFUSED_RESULT_FIGURE: t('err_refused') })[e.code] || (t('err_generic') + e.message);
  }

  /* ---------- sanitising model output (code-level guard rails) ---------- */
  function cleanReport(kind, r, material) {
    const figIds = new Set((material.figures || []).map(f => f.id)), schIds = new Set(S.schematics.map(s => s.id)), srcIds = new Set((material.passages || []).map(p => p.id));
    const srcs = a => (a || []).filter(x => srcIds.has(x));
    const strs = a => (a || []).map(s => String(s)).filter(Boolean);
    if (kind === 'ppt') {
      const L = ['title', 'section', 'bullets', 'figure', 'figure_bullets', 'conclusion'];
      return {
        slides: (r.slides || []).map(s => {
          const o = { layout: L.includes(s.layout) ? s.layout : 'bullets', title: String(s.title || ''), bullets: strs(s.bullets), figure_id: figIds.has(s.figure_id) ? s.figure_id : '', schematic_id: !figIds.has(s.figure_id) && schIds.has(s.schematic_id) ? s.schematic_id : '', notes: String(s.notes || ''), sources: srcs(s.sources) };
          if (/figure/.test(o.layout) && !o.figure_id && !o.schematic_id) o.layout = 'bullets';
          return o;
        })
      };
    }
    return {
      headline: String(r.headline || ''), take_home: strs(r.take_home),
      sections: (r.sections || []).map(s => ({ heading: String(s.heading || ''), bullets: strs(s.bullets), figure_ids: (s.figure_ids || []).filter(i => figIds.has(i)), schematic_ids: (s.schematic_ids || []).filter(i => schIds.has(i)), emphasis: !!s.emphasis, sources: srcs(s.sources) }))
    };
  }
  function mergeSchematics(list) {
    const old = S.schematics;
    S.schematics = (list || []).slice(0, 6).map((s, i) => {
      const id = /^S\d+$/.test(s.id) ? s.id : 'S' + (i + 1);
      const prev = old.find(o => o.id === id && o.description === s.description);
      return prev || { id, title: String(s.title || id), description: String(s.description || ''), img: null };
    });
  }

  /* ---------- actions ---------- */
  function setStatus(msg, err) { const e = $('genStatus'); e.textContent = msg || ''; e.classList.toggle('err', !!err); }
  function busy(on) { S.busy = on; $('genBtn').disabled = on; $('chatForm').querySelector('button').disabled = on; }

  async function generate() {
    if (!S.status) return setStatus(t('need_status'), true);
    let material; try { material = JSON.parse($('payload').value); } catch (e) { return setStatus(t('bad_json'), true); }
    if (!material.passages || !material.passages.length) return setStatus(t('need_sel'), true);
    const offline = S.demo && !S.session;
    if (!offline && !S.session) { openLogin(); return setStatus(t('need_login'), true); }
    if (S.status === 'unpublished' && !offline && !confirm(t('confirm_unpub'))) return;
    busy(true); setStatus(t('w_plan'));
    try {
      const sig = hash(JSON.stringify(material) + S.settings.lang);
      let res;
      if (offline) res = global.RGDemo.plan(S.settings.kind, S.settings.lang);
      else res = await api('plan', { material, settings: settingsPayload(), structure: S.structSig === sig ? S.structure : null });
      S.structure = res.structure || S.structure; S.structSig = sig;
      mergeSchematics(res.schematics);
      S.report = cleanReport(S.settings.kind, res.report || {}, material);
      S.sentText = JSON.stringify(material); refreshNumSet(S.sentText);
      pushChat('ai', res.reply || t('done'));
      setStatus(t('done')); renderOutput(); showTab('prev');
      $('feedback').hidden = false;
    } catch (e) { console.error(e); setStatus(errText(e), true); }
    finally { busy(false); }
  }

  async function revise(text) {
    if (!text.trim()) return;
    pushChat('me', text);
    if (!S.report) { $('reqMore').value = ($('reqMore').value + '\n' + text).trim(); renderScope(); pushChat('ai', t('chat_hello')); return; }
    if (!S.session) { pushChat('ai', t('demo_no_chat')); return; }
    busy(true); setStatus(t('w_revise'));
    try {
      const material = JSON.parse(S.sentText || $('payload').value);
      const res = await api('revise', { material, settings: settingsPayload(), structure: S.structure, report: S.report, schematics: S.schematics.map(({ id, title, description }) => ({ id, title, description })), instruction: text, history: S.chat.slice(-8) });
      if (res.settings_patch) applyPatch(res.settings_patch);
      if (res.schematics) mergeSchematics(res.schematics);
      if (res.report) S.report = cleanReport(S.settings.kind, res.report, material);
      pushChat('ai', res.reply || t('done')); setStatus(t('done')); renderOutput();
    } catch (e) { console.error(e); pushChat('ai', errText(e)); setStatus(errText(e), true); }
    finally { busy(false); }
  }

  function applyPatch(p) {
    const allow = { posterTemplate: ['classic', 'centerfig', 'billboard'], pptTemplate: ['conference', 'seminar', 'lecture'], palette: ['pasero', 'blue', 'forest', 'mono'], posterSize: Object.keys(global.RGLayout.SIZES), density: ['concise', 'standard', 'detailed'] };
    for (const k in allow) if (p[k] && allow[k].includes(p[k])) S.settings[k] = p[k];
    syncSettingsUI();
  }

  async function genSchematic(id) {
    const s = S.schematics.find(x => x.id === id); if (!s) return;
    busy(true); setStatus(t('w_img'));
    try {
      let r;
      if (!S.session) { if (!S.demo) { openLogin(); throw Object.assign(new Error(''), { code: 'AUTH_REQUIRED' }); } r = global.RGDemo.schematic(s); }
      else r = await api('schematic', { schematic: { id: s.id, title: s.title, description: s.description }, style: S.settings.style, lang: S.settings.lang });
      Object.assign(s, { img: r.image, w: r.w || 1536, h: r.h || 1024 });
      setStatus(t('done')); renderOutput();
    } catch (e) { console.error(e); setStatus(errText(e), true); }
    finally { busy(false); }
  }

  /* ---------- files ---------- */
  async function addFiles(files) {
    const msgs = [];
    for (const file of files) {
      const kind = global.RGParse.kindOf(file);
      if (!kind) { msgs.push(t('unsupported', { f: file.name })); continue; }
      try {
        if (kind === 'image') { await addImage(file); continue; }
        const r = await global.RGParse.parseFile(file);
        if (r.scanned) msgs.push(t('scanned', { f: file.name }));
        if (S.demo) resetAll();
        S.blocks.push(...r.blocks);
        for (const k of ['title', 'authors', 'doi']) if (r.meta && r.meta[k] && !S.meta[k]) S.meta[k] = r.meta[k];
        r.blocks.filter(b => b.kind === 'cap' && b.capKind === 'Figure').forEach(b => {
          if (!S.figs.find(f => f.num === b.capNum)) S.figs.push({ id: 'F' + b.capNum, num: b.capNum, label: 'Figure ' + b.capNum, caption: b.text, img: null, w: 0, h: 0, sel: true });
        });
      } catch (e) { console.error(e); msgs.push(file.name + ': ' + e.message); }
    }
    S.figs.sort((a, b) => parseInt(a.num) - parseInt(b.num));
    $('fileMsgs').innerHTML = msgs.map(m => `<p>${esc(m)}</p>`).join('');
    fillMeta(); changed();
  }
  async function addImage(file, target) {
    if (S.demo) resetAll();
    const img = await global.RGParse.readImage(file);
    let f = target;
    if (!f) {
      const n = global.RGParse.figNumFromName(file.name);
      f = S.figs.find(x => n && x.num.toLowerCase() === n.toLowerCase());
      if (!f) { const num = n || String(S.figs.length + 1); f = { id: 'F' + num, num, label: 'Figure ' + num, caption: '', sel: true }; while (S.figs.find(x => x.id === f.id)) f.id += 'b'; S.figs.push(f); }
    }
    Object.assign(f, img, { name: file.name });
  }
  function resetAll() {
    Object.assign(S, { blocks: [], figs: [], schematics: [], structure: null, structSig: '', reports: { poster: null, ppt: null }, demo: false, status: null, sentText: '' });
    S.meta = { title: '', authors: '', affiliation: '', doi: '' };
    document.querySelectorAll('input[name=st]').forEach(r => r.checked = false);
    numSet = new Set(); S.chat = []; renderChat(); $('feedback').hidden = true;
  }

  /* ---------- rendering: material ---------- */
  function renderBlocks() {
    const box = $('blocks'); box.innerHTML = '';
    if (!S.blocks.length) { box.innerHTML = `<p class="hint">${t('files_empty')}</p>`; }
    const groups = [];
    S.blocks.forEach(b => { let g = groups[groups.length - 1]; if (!g || g.h !== b.heading || g.src !== b.source) groups.push(g = { h: b.heading, src: b.source, items: [] }); g.items.push(b); });
    groups.forEach(g => {
      const d = document.createElement('details'); d.className = 'blk';
      const sel = g.items.filter(b => b.kind !== 'cap'), on = sel.filter(b => b.sel).length;
      d.innerHTML = `<summary><input type="checkbox" ${sel.length && on === sel.length ? 'checked' : ''}><b>${esc(g.h)}</b><span class="hint">${on}/${sel.length}</span><span class="src">${esc(g.src)}</span></summary><div></div>`;
      const cb = d.querySelector('summary input'); cb.indeterminate = on > 0 && on < sel.length;
      cb.onclick = e => { e.stopPropagation(); sel.forEach(b => b.sel = cb.checked); changed(); };
      const ps = d.querySelector('div');
      g.items.forEach(b => {
        const r = document.createElement('label'); r.className = 'para' + (b.kind === 'cap' ? ' cap' : b.sel ? '' : ' off');
        if (b.kind === 'cap') r.innerHTML = `<span class="badge">${esc(b.capKind + ' ' + b.capNum)}</span><span>${esc(b.text.slice(0, 160))}${b.text.length > 160 ? '…' : ''}</span>`;
        else {
          r.innerHTML = `<input type="checkbox" ${b.sel ? 'checked' : ''}>` + (b.kind === 'table' ? `<pre>${esc(b.text.slice(0, 600))}${b.text.length > 600 ? '\n…' : ''}</pre>` : `<span>${esc(b.text)}</span>`);
          r.querySelector('input').onchange = e => { b.sel = e.target.checked; changed(); };
        }
        ps.append(r);
      });
      box.append(d);
    });
    const s = S.blocks.filter(b => b.sel && b.kind !== 'cap');
    $('selCnt').textContent = t('sel_cnt', { n: s.length, c: s.reduce((a, b) => a + b.text.length, 0) });
  }
  function renderFigs() {
    const box = $('figs'); box.innerHTML = '';
    S.figs.forEach(f => {
      const d = document.createElement('div'); d.className = 'fig';
      d.innerHTML = `<div class="th">${f.img ? `<img src="${f.img}" alt="">` : `<span class="hint">${t('fig_none')}</span>`}</div>
        <div class="row between"><label class="check"><input type="checkbox" ${f.sel ? 'checked' : ''}> <span><b>${esc(f.label)}</b></span></label></div>
        ${f.img ? `<span class="badge local">${t('fig_local')}</span>` : ''}
        <textarea placeholder="caption">${esc(f.caption)}</textarea><button class="btn-line sm">${t('fig_add')}</button>`;
      d.querySelector('input').onchange = e => { f.sel = e.target.checked; changed(); };
      d.querySelector('textarea').oninput = e => { f.caption = e.target.value; changed(false); };
      d.querySelector('button').onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/png,image/jpeg,image/webp'; i.onchange = async () => { if (i.files[0]) { await addImage(i.files[0], f); changed(); } }; i.click(); };
      box.append(d);
    });
  }
  function fillMeta() { $('mTitle').value = S.meta.title; $('mAuthors').value = S.meta.authors; $('mAff').value = S.meta.affiliation; $('mDoi').value = S.meta.doi; }

  /* ---------- rendering: request ---------- */
  const TPL = { poster: ['classic', 'centerfig', 'billboard'], ppt: ['conference', 'seminar', 'lecture'] };
  function tplSvg(id) {
    const p = global.RGLayout.PALETTES[S.settings.palette], c = '#' + p.pri, a = '#' + p.acc, l = '#' + p.light, g = '#d9d9d9';
    const posterHead = `<rect x="0" y="0" width="60" height="12" fill="${c}"/>`;
    const svgs = {
      classic: `${posterHead}<rect x="4" y="15" width="52" height="6" fill="${l}"/>${[4, 23, 42].map(x => `<rect x="${x}" y="24" width="14" height="4" fill="${c}"/><rect x="${x}" y="30" width="14" height="14" fill="${g}"/><rect x="${x}" y="47" width="14" height="4" fill="${c}"/><rect x="${x}" y="53" width="14" height="22" fill="${g}"/>`).join('')}`,
      centerfig: `${posterHead}<rect x="4" y="15" width="52" height="6" fill="${l}"/><rect x="4" y="24" width="12" height="51" fill="${g}"/><rect x="19" y="24" width="22" height="51" fill="${l}"/><rect x="21" y="30" width="18" height="24" fill="${a}" opacity=".7"/><rect x="44" y="24" width="12" height="51" fill="${g}"/>`,
      billboard: `${posterHead}<rect x="4" y="15" width="52" height="26" fill="${l}"/><rect x="10" y="22" width="40" height="5" fill="${c}"/><rect x="14" y="30" width="32" height="5" fill="${c}"/>${[4, 17.5, 31, 44.5].map(x => `<rect x="${x}" y="45" width="11.5" height="30" fill="${g}"/>`).join('')}`,
      conference: `<rect x="0" y="0" width="60" height="34" fill="#fff"/><rect x="3" y="3" width="1.5" height="6" fill="${a}"/><rect x="6" y="4" width="40" height="4" fill="${c}"/><rect x="5" y="12" width="30" height="19" fill="${g}"/><rect x="38" y="13" width="18" height="2" fill="${g}"/><rect x="38" y="18" width="16" height="2" fill="${g}"/>`,
      seminar: `<rect x="0" y="0" width="60" height="34" fill="#fff"/><rect x="0" y="0" width="60" height="8" fill="${c}"/>${[11, 15, 19, 23, 27].map(y => `<rect x="4" y="${y}" width="${y % 8 ? 50 : 40}" height="2" fill="${g}"/>`).join('')}`,
      lecture: `<rect x="0" y="0" width="60" height="34" fill="#fff"/><rect x="5" y="4" width="34" height="5" fill="${c}"/><rect x="5" y="11" width="50" height=".6" fill="${g}"/><rect x="5" y="15" width="44" height="3.2" fill="${g}"/><rect x="5" y="21" width="38" height="3.2" fill="${g}"/>`
    };
    const h = S.settings.kind === 'poster' ? 80 : 34;
    return `<svg viewBox="0 0 60 ${h}" xmlns="http://www.w3.org/2000/svg">${svgs[id]}</svg>`;
  }
  function renderRequest() {
    const st = S.settings, k = st.kind, cur = k === 'poster' ? st.posterTemplate : st.pptTemplate;
    document.querySelectorAll('#kindSeg button').forEach(b => b.classList.toggle('on', b.dataset.k === k));
    $('tpls').innerHTML = TPL[k].map(id => `<button class="tpl ${id === cur ? 'on' : ''}" data-tpl="${id}">${tplSvg(id)}<b>${t('tp_' + id)}</b><small>${t('tp_' + id + '_d')}</small></button>`).join('');
    $('tpls').querySelectorAll('.tpl').forEach(b => b.onclick = () => { if (k === 'poster') st.posterTemplate = b.dataset.tpl; else st.pptTemplate = b.dataset.tpl; renderRequest(); renderOutput(); });
    const P = global.RGLayout.PALETTES;
    $('pals').innerHTML = Object.keys(P).map(id => `<button class="pal ${id === st.palette ? 'on' : ''}" data-p="${id}"><i><b style="background:#${P[id].pri}"></b><b style="background:#${P[id].acc}"></b><b style="background:#${P[id].light}"></b></i>${t('pal_' + id)}</button>`).join('');
    $('pals').querySelectorAll('.pal').forEach(b => b.onclick = () => { st.palette = b.dataset.p; renderRequest(); renderOutput(); });
    $('styles').innerHTML = ['flat', 'line', 'soft3d', 'sketch', 'pasero'].map(id => `<button class="chip ${id === st.style ? 'on' : ''}" data-s="${id}">${t('sty_' + id)}</button>`).join('');
    $('styles').querySelectorAll('.chip').forEach(b => b.onclick = () => { st.style = b.dataset.s; renderRequest(); });
    $('posterOpts').hidden = k !== 'poster'; $('pptOpts').hidden = k !== 'ppt';
    $('genBtn').textContent = S.report ? t('gen_again') : t('gen');
  }
  function syncSettingsUI() {
    const st = S.settings;
    $('psize').value = st.posterSize; $('density').value = st.density; $('aud').value = st.aud; $('minutes').value = st.minutes; $('notes').checked = st.notes; $('lang').value = st.lang;
    renderRequest();
  }
  function renderScope() {
    if (!S.payloadEdited) $('payload').value = JSON.stringify(buildMaterial(), null, 1);
    const m = buildMaterial(), c = m.passages.reduce((a, p) => a + p.text.length, 0);
    const offline = S.demo && !S.session;
    $('scope').innerHTML = `<b>${t('scope_t')}</b>` + (offline ? `<p>${t('scope_demo')}</p>` : `<p>${t('scope_send', { n: m.passages.length, c, f: m.figures.length })}</p>`) +
      `<p>${t('scope_local', { i: S.figs.filter(f => f.img).length })}</p><p class="hint">${t('scope_edit')} <a href="privacy.html" target="_blank">${t('scope_more')}</a></p>` +
      (S.payloadEdited ? `<p style="color:var(--warn)">${t('payload_edited')}</p>` : '');
    $('payloadInfo').textContent = $('payload').value.length.toLocaleString() + ' chars';
  }
  function renderQuota() {
    const q = S.quota, el = $('quota');
    if (!S.session || !q) { el.textContent = ''; return; }
    if (!q.active) { el.textContent = t('quota_off'); return; }
    const left = k => Math.max(0, (q.limit[k] || 0) - (q.used[k] || 0));
    el.textContent = t('quota', { p: left('plan'), r: left('revise'), i: left('image') });
  }
  function changed(full) { S.payloadEdited = false; if (full !== false) { renderBlocks(); renderFigs(); } renderScope(); }

  /* ---------- rendering: chat ---------- */
  function pushChat(role, text) { S.chat.push({ role, text }); renderChat(); }
  function renderChat() {
    const log = $('chatlog');
    const items = S.chat.length ? S.chat : [{ role: 'ai', text: t('chat_hello') }];
    log.innerHTML = items.map(m => `<div class="msg ${m.role === 'me' ? 'me' : 'ai'}">${esc(m.text)}</div>`).join('');
    log.scrollTop = log.scrollHeight;
    $('quick').innerHTML = ['chip_concise', 'chip_bg', 'chip_res', 'chip_land', 'chip_more_fig'].map(k => `<button class="chip" data-q="${k}">${t(k)}</button>`).join('');
    $('quick').querySelectorAll('.chip').forEach(b => b.onclick = () => revise(t(b.dataset.q)));
  }

  /* ---------- rendering: preview ---------- */
  function renderSchem() {
    const box = $('schemBox');
    if (!S.report) { box.innerHTML = ''; return; }
    if (!S.schematics.length) { box.innerHTML = `<p class="hint">${t('schem_none')}</p>`; return; }
    box.innerHTML = `<h3>${t('schem')}</h3><p class="hint">${t('schem_hint')}</p>` + S.schematics.map(s => `<div class="it">${s.img ? `<img src="${s.img}" alt="">` : ''}<div><b>${esc(s.title)}</b><br><span class="hint">${esc(s.description)}</span></div><button class="btn-line sm" data-g="${s.id}">${s.img ? t('schem_regen') : t('schem_gen')}</button></div>`).join('');
    box.querySelectorAll('[data-g]').forEach(b => b.onclick = () => genSchematic(b.dataset.g));
  }
  function srcChips(ids) {
    return (ids || []).map(id => { const b = S.blocks.find(x => x.id === id); return b ? `<button class="chip" data-src="${id}">${esc(b.heading.slice(0, 24))}</button>` : ''; }).join('');
  }
  function renderOutput() {
    renderRequest(); renderSchem();
    const box = $('pages'); const P = global.RGLayout.pages();
    if (!P) { box.innerHTML = `<p class="hint empty">${t('empty_prev')}</p>`; return; }
    box.innerHTML = '';
    P.pages.forEach((E, i) => {
      const lab = document.createElement('div'); lab.className = 'pagelab';
      const srcIds = P.kind === 'ppt' ? S.report.slides[i].sources : S.report.sections.flatMap(s => s.sources || []);
      const notes = P.kind === 'ppt' && S.report.slides[i].notes;
      lab.innerHTML = (P.kind === 'ppt' ? `<b>#${i + 1}</b>` : '') + (srcIds && srcIds.length ? ` ${t('sources')}: ${srcChips([...new Set(srcIds)])}` : '') + (notes ? `<span title="${esc(notes)}">🗒</span>` : '');
      box.append(lab);
      const pb = document.createElement('div'); pb.className = 'pagebox' + (P.kind === 'poster' ? ' poster' : ''); box.append(pb);
      global.RGLayout.render(pb, E, P.W, P.H, false);
    });
    box.querySelectorAll('[data-src]').forEach(b => b.onclick = () => { const bl = S.blocks.find(x => x.id === b.dataset.src); $('srcBody').textContent = bl ? `${bl.source} · ${bl.heading}\n\n${bl.text}` : ''; $('srcDlg').showModal(); });
  }

  /* ---------- tabs (mobile) ---------- */
  function showTab(tab) {
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    const map = { mat: 'colMat', req: 'colReq', prev: 'colPrev' };
    for (const k in map) $(map[k]).classList.toggle('hide', k !== tab);
    if (tab === 'prev') requestAnimationFrame(renderOutput);
  }

  /* ---------- auth ---------- */
  function openLogin() { if (!configured()) { alert('Supabase publishable key not configured (config.js).'); return; } $('loginMsg').textContent = ''; $('loginDlg').showModal(); }
  async function initAuth() {
    if (!configured() || !global.supabase) { $('loginBtn').disabled = !configured(); return; }
    sb = global.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey);
    const { data } = await sb.auth.getSession(); setSession(data.session);
    sb.auth.onAuthStateChange((_e, session) => setSession(session));
  }
  async function setSession(session) {
    S.session = session || null;
    $('loginBtn').textContent = S.session ? t('logout') : t('login');
    $('loginBtn').title = S.session ? S.session.user.email : '';
    if (S.session) { try { await api('quota', {}); } catch (e) { console.warn(e); } }
    renderQuota(); renderScope();
  }

  /* ---------- i18n ---------- */
  function applyI18n() {
    document.documentElement.lang = S.ui === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i]').forEach(e => { e.textContent = t(e.dataset.i); });
    document.querySelectorAll('[data-ph]').forEach(e => { e.placeholder = t(e.dataset.ph); });
    document.querySelectorAll('#uiSeg button').forEach(b => b.classList.toggle('on', b.dataset.l === S.ui));
    $('loginBtn').textContent = S.session ? t('logout') : t('login');
    renderBlocks(); renderFigs(); renderScope(); renderChat(); renderQuota(); renderOutput();
  }

  /* ---------- wiring ---------- */
  function init() {
    S.ui = store.get('rg_ui') || ((navigator.language || '').startsWith('zh') ? 'zh' : 'en');
    if ((navigator.language || '').startsWith('ja')) S.settings.lang = 'ja'; else if (S.ui === 'zh') S.settings.lang = 'zh';
    const drop = $('drop');
    $('fileIn').onchange = () => { addFiles([...$('fileIn').files]); $('fileIn').value = ''; };
    drop.ondragover = e => { e.preventDefault(); drop.classList.add('on'); }; drop.ondragleave = () => drop.classList.remove('on');
    drop.ondrop = e => { e.preventDefault(); drop.classList.remove('on'); addFiles([...e.dataTransfer.files]); };
    $('pasteBtn').onclick = () => { $('pasteBox').hidden = false; $('pasteText').focus(); };
    $('pasteCancel').onclick = () => { $('pasteBox').hidden = true; };
    $('pasteAdd').onclick = () => { const v = $('pasteText').value.trim(); if (!v) return; if (S.demo) resetAll(); S.blocks.push(...global.RGParse.parseText(v, t('paste')).blocks); $('pasteText').value = ''; $('pasteBox').hidden = true; changed(); };
    $('demoBtn').onclick = () => { global.RGDemo.load(); fillMeta(); document.querySelector('input[name=st][value=published]').checked = true; changed(); };
    [['mTitle', 'title'], ['mAuthors', 'authors'], ['mAff', 'affiliation'], ['mDoi', 'doi']].forEach(([id, k]) => $(id).oninput = e => { S.meta[k] = e.target.value; changed(false); });
    document.querySelectorAll('input[name=st]').forEach(r => r.onchange = () => { S.status = r.value; changed(false); });
    $('selAll').onclick = () => { S.blocks.forEach(b => { if (b.kind !== 'cap' && b.kind !== 'ref') b.sel = true; }); changed(); };
    $('selNone').onclick = () => { S.blocks.forEach(b => b.sel = false); changed(); };
    document.querySelectorAll('#kindSeg button').forEach(b => b.onclick = () => { S.settings.kind = b.dataset.k; renderOutput(); });
    $('psize').onchange = e => { S.settings.posterSize = e.target.value; renderOutput(); };
    $('density').onchange = e => S.settings.density = e.target.value;
    $('aud').onchange = e => S.settings.aud = e.target.value;
    $('minutes').onchange = e => S.settings.minutes = Math.min(60, Math.max(3, +e.target.value || 10));
    $('notes').onchange = e => S.settings.notes = e.target.checked;
    $('lang').onchange = e => { S.settings.lang = e.target.value; };
    $('reqMore').oninput = () => changed(false);
    $('payload').oninput = () => { S.payloadEdited = true; renderScope(); };
    $('payloadReset').onclick = () => { S.payloadEdited = false; renderScope(); };
    $('genBtn').onclick = generate;
    $('chatForm').onsubmit = e => { e.preventDefault(); const v = $('chatIn').value; $('chatIn').value = ''; revise(v); };
    $('chatIn').onkeydown = e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) $('chatForm').requestSubmit(); };
    $('expPptx').onclick = async () => { const base = ((S.structure && S.structure.short_title) || 'report').replace(/[\\/:*?"<>|]/g, '').slice(0, 40); await global.RGLayout.exportPptx(base); setStatus(t('exported')); track('export_pptx'); };
    $('expPdf').onclick = () => { global.RGLayout.printPdf(); track('export_pdf'); };
    $('relayout').onclick = renderOutput;
    $('expJson').onclick = () => { const b = new Blob([JSON.stringify({ meta: S.meta, structure: S.structure, report: S.report, settings: S.settings }, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'content_structure.json'; a.click(); };
    document.querySelectorAll('[data-fb]').forEach(b => b.onclick = () => { track('feedback', b.dataset.fb); $('feedback').innerHTML = `<span>${t('fb_thanks')}</span>`; });
    document.querySelectorAll('#uiSeg button').forEach(b => b.onclick = () => { S.ui = b.dataset.l; store.set('rg_ui', S.ui); applyI18n(); });
    document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => showTab(b.dataset.t));
    $('loginBtn').onclick = async () => { if (S.session) { await sb.auth.signOut(); } else openLogin(); };
    $('sendLink').onclick = async e => {
      e.preventDefault(); const email = $('email').value.trim(); if (!email) return;
      const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
      $('loginMsg').textContent = error ? error.message : t('link_sent');
    };
    global.addEventListener('afterprint', () => { $('printRoot').innerHTML = ''; });
    let rz; global.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(renderOutput, 200); });
    if (global.matchMedia('(max-width:760px)').matches) showTab('mat');
    syncSettingsUI(); applyI18n(); initAuth();
  }

  /* usage events: counts only, never content */
  function track(event, value) { if (S.session) api('event', { event, value: value || null, kind: S.settings.kind }).catch(() => { }); }

  global.RG = { S, t, init, assetById, flagNumbers, refreshNumSet, renderOutput, changed, _test: { cleanReport, applyPatch, buildMaterial } };
})(window);
