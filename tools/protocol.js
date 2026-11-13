/* Protocol finder & AI organiser (pasero.app/tools/protocol-organizer.html).
   Search and PDF links: Europe PMC, straight from this browser.
   AI organise / ask / rewrite: Pasero AI (Supabase function "reporter"), signed in with the Pasero account (e-mail code).
   The page keeps the sign-in session in this browser only. */
(function () {
  'use strict';
  var P = window.PTools, T = P.T, esc = P.esc;
  var EPMC = 'https://www.ebi.ac.uk/europepmc/webservices/rest';
  var SUPA = 'https://gnfxemlrgjwcqxqruzev.supabase.co';
  var KEY = 'sb_publishable_2MJ_yQEUabbfZr14Tv5gBg_BpJkZ5uU'; // public publishable key
  var AI = SUPA + '/functions/v1/reporter';
  var SESSION_KEY = 'pasero-tools-session';
  var JOURNALS = ['Bio-protocol', 'Bio Protoc', 'STAR Protoc', 'STAR Protocols', 'Nat Protoc', 'Nature Protocols', 'Curr Protoc', 'Current Protocols',
    'J Vis Exp', 'MethodsX', 'Cold Spring Harb Protoc', 'Protocol Exchange'];
  var $ = function (id) { return document.getElementById(id); };

  /* ---------------- session (e-mail code sign-in) ---------------- */
  function loadSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; } }
  function saveSession(s) { try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch (e) {} }
  var session = loadSession();
  function authPost(path, body) {
    return fetch(SUPA + '/auth/v1/' + path, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error_code || j.msg || j.error || 'auth'); return j; }); });
  }
  function keep(j) {
    session = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (Number(j.expires_in) || 3600) * 1000, email: (j.user && j.user.email) || (session && session.email) || '' };
    saveSession(session);
  }
  function token() {
    if (!session) return Promise.resolve(null);
    if (Date.now() < session.expires_at - 60000) return Promise.resolve(session.access_token);
    return authPost('token?grant_type=refresh_token', { refresh_token: session.refresh_token })
      .then(function (j) { keep(j); return session.access_token; })
      .catch(function () { session = null; saveSession(null); renderAccount(); return null; });
  }

  var pendingEmail = '', pending = null;
  function renderAccount(message) {
    var box = $('pAccount');
    if (session) {
      box.classList.add('in');
      box.innerHTML = '<span>' + esc(T('Signed in as ', '已登录：', 'ログイン中：') + session.email) + '</span> <button type="button" class="tl-btn" id="pOut">' +
        esc(T('Sign out', '退出', 'ログアウト')) + '</button>';
      $('pOut').onclick = function () { session = null; saveSession(null); renderAccount(); };
      refreshLeft();
      return;
    }
    box.classList.remove('in');
    box.innerHTML = '<p class="tl-note">' + esc(T('Sign in with your Pasero account to use AI (the same account as the app; new e-mails get one automatically).',
      '用 Pasero 账号登录后才能用 AI（和 App 是同一个账号；新邮箱会自动注册）。', 'AI を使うには Pasero アカウントでログインしてください（アプリと同じアカウント。新しいメールアドレスは自動で登録されます）。')) + '</p>' +
      '<div class="tl-proto-signin">' + (pendingEmail
        ? '<span class="tl-in"><input id="pCode" inputmode="numeric" autocomplete="one-time-code" placeholder="' + esc(T('Code from the e-mail', '邮件里的验证码', 'メールのコード')) + '"></span>' +
          '<button type="button" class="tl-btn primary" id="pVerify">' + esc(T('Sign in', '登录', 'ログイン')) + '</button>'
        : '<span class="tl-in"><input id="pEmail" type="email" autocomplete="email" placeholder="name@example.com"></span>' +
          '<button type="button" class="tl-btn primary" id="pSend">' + esc(T('Send code', '发送验证码', 'コードを送信')) + '</button>') + '</div>' +
      (message ? '<p class="tl-warn">' + esc(message) + '</p>' : '');
    if (pendingEmail) {
      $('pVerify').onclick = function () {
        var code = ($('pCode').value || '').trim();
        if (!code) return;
        authPost('verify', { type: 'email', email: pendingEmail, token: code }).then(function (j) { keep(j); pendingEmail = ''; renderAccount(); if (pending) { var go = pending; pending = null; go(); } })
          .catch(function () { renderAccount(T('That code did not work. Check it, or send a new one.', '验证码不对，请检查或重新发送。', 'コードが正しくありません。確認するか、もう一度送信してください。')); });
      };
    } else {
      $('pSend').onclick = function () {
        var email = ($('pEmail').value || '').trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { renderAccount(T('Enter a valid e-mail address.', '请输入有效的邮箱。', '有効なメールアドレスを入力してください。')); return; }
        authPost('otp', { email: email, create_user: true }).then(function () {
          pendingEmail = email; renderAccount(T('We sent a code to ', '验证码已发到 ', 'コードを送信しました：') + email);
        }).catch(function () { renderAccount(T('The code could not be sent. Try again in a minute.', '验证码发送失败，请一分钟后再试。', 'コードを送信できませんでした。1 分後にもう一度お試しください。')); });
      };
    }
  }

  /* ---------------- Pasero AI ---------------- */
  var ERR = {
    AUTH_REQUIRED: ['Sign in first.', '请先登录。', '先にログインしてください。'],
    QUOTA_EXCEEDED: ['This period’s Pasero AI allowance is used up.', '本期 Pasero AI 额度已用完。', '今期の Pasero AI 利用枠を使い切りました。'],
    RATE_LIMIT: ['Too many requests. Wait a minute.', '请求太频繁，请稍等一分钟。', 'リクエストが多すぎます。1 分お待ちください。'],
    BETA_INACTIVE: ['Pasero AI is not available right now.', 'Pasero AI 暂时不可用。', 'Pasero AI は現在利用できません。']
  };
  ERR.NETWORK = ['Pasero AI could not be reached. Check the connection and try again.', '连不上 Pasero AI，请检查网络后重试。', 'Pasero AI に接続できません。接続を確認してもう一度お試しください。'];
  function aiError(code) { var e = ERR[code]; return e ? T(e[0], e[1], e[2]) : T('Pasero AI could not finish. Try again.', 'Pasero AI 没有完成，请重试。', 'Pasero AI が完了できませんでした。再試行してください。'); }
  function ai(body) {
    return token().then(function (tk) {
      if (!tk) { renderAccount(); throw new Error('AUTH_REQUIRED'); }
      return fetch(AI, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ client: 'web', lang: P.lang() }, body)) })
        .catch(function () { throw new Error('NETWORK'); });
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (j.quota) quota = j.quota;
        if (!r.ok) throw new Error(j.code || 'UPSTREAM');
        return j;
      });
    });
  }
  var quota = null;
  function refreshLeft() {
    if (!session) { $('pLeft').textContent = ''; return; }
    var show = function () {
      if (!quota || !quota.limit) return;
      var left = function (k) { return Math.max(0, (quota.limit[k] || 0) - ((quota.used || {})[k] || 0)); };
      $('pLeft').textContent = T('Beta: free. Left — organise {a}, questions {b}, rewrites {c}.', '测试期免费，剩余：整理 {a} 次 · 提问 {b} 次 · 改写 {c} 次', 'テスト期間は無料。残り：整理 {a} 回・質問 {b} 回・書き直し {c} 回')
        .replace('{a}', left('protocol')).replace('{b}', left('protocol_ask')).replace('{c}', left('protocol_revise'));
    };
    if (quota) { show(); return; }
    ai({ action: 'quota' }).then(show).catch(function () {});
  }

  /* ---------------- Europe PMC ---------------- */
  function stripTags(v) { return String(v || '').replace(/<[^>]+>/g, '').trim(); }
  function reusable(lic) {
    var tk = String(lic || '').trim().toLowerCase().replace(/-/g, ' ').split(/\s+/).filter(Boolean);
    if (!tk.length || tk.indexOf('nc') >= 0 || tk.indexOf('nd') >= 0) return false;
    var j = tk.join(' ');
    return j.indexOf('cc by') === 0 || j.indexOf('cc0') === 0 || j.indexOf('public domain') === 0;
  }
  function pdfUrl(item) {
    var list = (item.fullTextUrlList && item.fullTextUrlList.fullTextUrl) || [];
    var pdfs = list.filter(function (e) { return String(e.documentStyle || '').toLowerCase() === 'pdf' && ['OA', 'F'].indexOf(String(e.availabilityCode || '').toUpperCase()) >= 0 && /^https?:/.test(e.url || ''); });
    pdfs.sort(function (a, b) { return (String(a.availabilityCode).toUpperCase() !== 'OA') - (String(b.availabilityCode).toUpperCase() !== 'OA') || (a.site !== 'Europe_PMC') - (b.site !== 'Europe_PMC'); });
    return pdfs.length ? pdfs[0].url : '';
  }
  function parse(payload) {
    return ((payload.resultList || {}).result || []).map(function (r) {
      var pmcid = String(r.pmcid || ''), pmid = String(r.pmid || ''), doi = String(r.doi || ''), lic = String(r.license || '');
      return { title: stripTags(r.title).replace(/\.$/, ''), journal: ((r.journalInfo || {}).journal || {}).title || r.journalTitle || '', year: String(r.pubYear || ''),
        authors: String(r.authorString || ''), abstract: stripTags(r.abstractText), pmcid: pmcid, doi: doi, licence: lic, reusable: !!pmcid && reusable(lic),
        url: pmcid ? 'https://europepmc.org/article/PMC/' + encodeURIComponent(pmcid) : pmid ? 'https://europepmc.org/article/MED/' + encodeURIComponent(pmid) : doi ? 'https://doi.org/' + doi : '',
        pdf: pdfUrl(r) };
    });
  }
  function fullText(xml) {
    var pick = function (re) { return (xml.match(re) || [''])[0]; };
    return [pick(/<article-title[\s\S]*?<\/article-title>/i), pick(/<abstract[\s\S]*?<\/abstract>/i), pick(/<body[\s\S]*?<\/body>/i)].join('\n\n')
      .replace(/<title>([\s\S]*?)<\/title>/gi, '\n\n$1\n').replace(/<list-item[^>]*>/gi, '\n- ').replace(/<\/(p|tr|caption)>/gi, '\n').replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&#x([0-9a-f]+);/gi, function (m, h) { return String.fromCharCode(parseInt(h, 16)); })
      .replace(/[ \t]+/g, ' ').split('\n').map(function (l) { return l.trim(); }).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  /* ---------------- query help: spelling, synonyms, Chinese / Japanese ---------------- */
  var GROUPS = window.PaseroProtocolTerms || [];
  var BASICS = window.PaseroBasicProtocols || [];
  var VOCAB = {};
  GROUPS.forEach(function (g) { g.w.forEach(function (w) { w.split(/[\s-]+/).forEach(function (t) { if (/^[a-z0-9]{3,}$/.test(t)) VOCAB[t] = 1; }); }); });
  ['protocol', 'method', 'methods', 'cells', 'cell', 'mouse', 'human', 'tissue', 'yeast', 'bacteria', 'coli', 'plant', 'primary', 'stem', 'neuron', 'blood',
   'serum', 'plasma', 'antibody', 'staining', 'assay', 'kit', 'protein', 'buffer', 'extraction', 'isolation', 'purification', 'preparation'].forEach(function (t) { VOCAB[t] = 1; });
  function dist(a, b) {  // Damerau–Levenshtein (optimal string alignment)
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) { d[0][j] = j; }
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
      var c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[a.length][b.length];
  }
  function correctWord(t) {
    if (!/^[a-z]{4,}$/.test(t) || VOCAB[t]) return t;
    var best = t, bestD = t.length >= 8 ? 3 : t.length >= 5 ? 2 : 1;
    Object.keys(VOCAB).forEach(function (v) { if (Math.abs(v.length - t.length) > 2) return; var dd = dist(t, v); if (dd < bestD || (dd === bestD && best === t && dd <= (t.length >= 8 ? 2 : 1))) { bestD = dd; best = v; } });
    return best;
  }
  var STOP = ['method', 'methods', 'protocol', 'protocols', 'procedure', 'how', 'to', 'the', 'of', 'for', 'in', 'a', 'an', 'and', 'with', 'by', 'using', 'step', 'steps', '方法', '方案', '步骤', '实验', '方法論', 'プロトコル', '方法'];
  function understand(raw) {
    var low = raw.toLowerCase().replace(/[，、。,;；]+/g, ' ').replace(/\s+/g, ' ').trim();
    var fixed = low.split(' ').map(correctWord).join(' ');
    var has = function (text, w) {  // whole words for Latin terms ("pcr" is not inside "qpcr"), plain substring for Chinese / Japanese
      if (/[\u3040-\u30ff\u3400-\u9fff]/.test(w)) return text.indexOf(w) >= 0;
      return new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])').test(text);
    };
    var groups = GROUPS.filter(function (g) { return g.w.some(function (w) { return has(fixed, w); }); });
    var rest = ' ' + fixed + ' ';
    groups.forEach(function (g) { g.w.slice().sort(function (a, b) { return b.length - a.length; }).forEach(function (w) { if (has(rest.trim(), w)) rest = rest.split(w).join(' '); }); });
    rest = rest.split(' ').filter(function (t) { return t && STOP.indexOf(t) < 0; }).join(' ');
    rest = rest.replace(/[぀-ヿ㐀-鿿]+/g, ' ').replace(/\s+/g, ' ').trim();  // CJK words without a mapping cannot go to Europe PMC
    var expr = groups.map(function (g) { return '(' + g.q.join(' OR ') + ')'; }).join(' AND ');
    var restExpr = rest ? rest.split(' ').filter(function (t) { return t.length > 1; }).join(' ') : '';
    var q = [expr, restExpr].filter(Boolean).join(' AND ') || fixed;
    var titleQ = groups.length ? groups.map(function (g) { return 'TITLE:(' + g.q.join(' OR ') + ')'; }).join(' AND ') + (restExpr ? ' AND ' + restExpr : '') : 'TITLE:(' + fixed + ')';
    // protocol journals: the method has to be in the title or abstract, not just mentioned somewhere in the full text
    var ta = function (terms) { return '(TITLE:(' + terms + ') OR ABSTRACT:(' + terms + '))'; };
    var taQ = groups.length ? groups.map(function (g) { return ta(g.q.join(' OR ')); }).join(' AND ') + (restExpr ? ' AND ' + restExpr : '') : ta(fixed);
    return { raw: raw, fixed: fixed, changed: fixed !== low, groups: groups, q: q, titleQ: titleQ, taQ: taQ };
  }
  function basicsFor(u) {
    var ids = u.groups.map(function (g) { return g.id; });
    var words = u.fixed.split(' ').filter(function (t) { return t.length > 2; });
    return BASICS.map(function (b) {
      var hay = (b.title + ' ' + b.summary).toLowerCase(), score = 0;
      b.tags.forEach(function (t) { if (ids.indexOf(t) >= 0) score += t === b.tags[0] ? 3 : 1; });
      words.forEach(function (w) { if (hay.indexOf(w) >= 0) score += 1; });
      if (hay.indexOf(u.fixed) >= 0) score += 2;
      return { b: b, score: score };
    }).filter(function (x) { return x.score > 0 && (!ids.length || x.b.tags.some(function (t) { return ids.indexOf(t) >= 0; })); }).sort(function (a, b) { return b.score - a.score; }).slice(0, 6).map(function (x) { return x.b; });
  }

  /* ---------------- search: Pasero basics + three Europe PMC tiers ---------------- */
  var results = [], basics = [], tiers = { journal: [], oa: [], classic: [] }, lastU = null;
  function epmc(query, size, sort) {
    var params = new URLSearchParams({ query: query, format: 'json', resultType: 'core', pageSize: String(size) });
    if (sort) params.set('sort', sort);
    return fetch(EPMC + '/search?' + params.toString(), { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('epmc'); return r.json(); })
      .then(function (j) { return parse(j).map(function (it, k) { it.cited = Number((((j.resultList || {}).result || [])[k] || {}).citedByCount || 0); return it; }); });
  }
  function card(it, i) {
    var meta = [it.journal, it.year, (it.licence || '').toUpperCase() || T('licence not stated', '未注明许可', 'ライセンス不明')].filter(Boolean).join(' · ');
    if (it.cited) meta += ' · ' + T('cited ', '被引 ', '被引用 ') + it.cited;
    return '<article class="tl-proto-item' + (it.reusable ? ' ai' : '') + '">' + (it.reusable ? '<em class="tl-proto-badge">AI</em>' : '') + '<strong>' + esc(it.title) + '</strong><small>' + esc(meta) + '</small>' +
      (it.abstract ? '<details><summary>' + esc(T('Abstract', '摘要', '要旨')) + '</summary><p>' + esc(it.abstract) + '</p></details>' : '') +
      '<div class="tl-btns">' +
      (it.reusable ? '<button type="button" class="tl-btn primary" data-ai="' + i + '">' + esc(T('AI organise · 5 pts', 'AI 整理 · 5 点', 'AI 整理 · 5 pt')) + '</button>' : '') +
      (it.pdf ? '<a class="tl-btn" href="' + esc(it.pdf) + '" target="_blank" rel="noopener" download>' + esc(T('Download PDF', '下载 PDF', 'PDF をダウンロード')) + '</a>' : '') +
      (it.url ? '<a class="tl-btn" href="' + esc(it.url) + '" target="_blank" rel="noopener">' + esc(T('Open article', '打开原文', '原文を開く')) + '</a>' : '') +
      '</div></article>';
  }
  function basicCard(b, i) {
    return '<article class="tl-proto-item basic"><em class="tl-proto-badge basic">Pasero</em><strong>' + esc(b.title) + '</strong>' +
      '<small>' + esc(T('Source: organised by Pasero · generic template', '来源：Pasero 整理 · 通用模板', '出典：Pasero が整理 · 汎用テンプレート')) + '</small>' +
      '<p class="tl-proto-sum">' + esc(b.summary) + '</p>' +
      '<div class="tl-btns"><button type="button" class="tl-btn primary" data-basic="' + i + '">' + esc(T('Open', '查看', '開く')) + '</button></div></article>';
  }
  function section(title, note, html) {
    return html ? '<section class="tl-proto-tier"><h3>' + esc(title) + (note ? ' <small>' + esc(note) + '</small>' : '') + '</h3><div class="tl-proto-grid">' + html + '</div></section>' : '';
  }
  function renderResults(msg) {
    var box = $('pResults');
    if (msg) { box.innerHTML = '<p class="tl-note">' + esc(msg) + '</p>'; return; }
    var u = lastU, notice = '';
    if (u && (u.changed || u.groups.length)) {
      var shown = u.groups.length ? u.groups.map(function (g) { return g.q.map(function (x) { return x.replace(/"/g, ''); }).join(' / '); }).join(' + ') : u.fixed;
      notice = '<p class="tl-proto-notice">' + esc(T('Searched for: ', '已按以下关键词搜索：', '次の語で検索しました：') + shown) + (u.changed ? ' · <span>' + esc(T('spelling corrected', '已纠正拼写', 'スペルを修正')) + '</span>' : '') + '</p>';
    }
    results = [];
    var tierHtml = function (list) { return list.map(function (it) { results.push(it); return card(it, results.length - 1); }).join(''); };
    var html = notice +
      section(T('Pasero basic protocols', 'Pasero 基础方案', 'Pasero 基本プロトコル'), T('organised by Pasero', 'Pasero 整理', 'Pasero が整理'), basics.map(basicCard).join('')) +
      section(T('Protocol journals', '方案期刊', 'プロトコル誌'), 'Europe PMC', tierHtml(tiers.journal)) +
      section(T('Other open-access methods', '其他开放获取的方法文章', 'その他のオープンアクセスの方法論文'), 'Europe PMC', tierHtml(tiers.oa)) +
      section(T('Classic papers', '经典文献', '定番の論文'), T('most cited', '按被引次数', '被引用数順'), tierHtml(tiers.classic));
    box.innerHTML = html || '<p class="tl-note">' + esc(T('No protocols found. Try another word, or English terms.', '没有找到方案。换个说法，或者用英文关键词试试。', '見つかりませんでした。別の言い方や英語で試してください。')) + '</p>';
  }
  $('pSearch').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var q = ($('pQuery').value || '').trim();
    if (!q) return;
    var u = lastU = understand(q);
    basics = basicsFor(u);
    tiers = { journal: [], oa: [], classic: [] };
    renderResults();
    $('pResults').insertAdjacentHTML('beforeend', '<p class="tl-note" id="pSearching">' + esc(T('Searching Europe PMC…', '正在搜索 Europe PMC…', 'Europe PMC を検索中…')) + '</p>');
    var J = '(' + JOURNALS.map(function (j) { return 'JOURNAL:"' + j + '"'; }).join(' OR ') + ')';
    var seen = {};
    var keep = function (list) { return list.filter(function (it) { var k = it.pmcid || it.doi || it.title; if (seen[k]) return false; seen[k] = 1; return true; }); };
    Promise.all([
      epmc('(' + u.taQ + ') AND ' + J, 12).catch(function () { return null; }),
      epmc(u.titleQ + ' AND OPEN_ACCESS:y NOT ' + J, 9).catch(function () { return null; }),
      epmc(u.titleQ, 6, 'CITED desc').catch(function () { return null; })
    ]).then(function (all) {
      if (all.every(function (x) { return x === null; }) && !basics.length) { renderResults(T('Europe PMC could not be reached. Check the connection.', '连不上 Europe PMC，请检查网络。', 'Europe PMC に接続できません。')); return; }
      tiers = { journal: keep(all[0] || []), oa: keep(all[1] || []), classic: keep(all[2] || []) };
      renderResults();
    });
  });
  $('pResults').addEventListener('click', function (ev) {
    var bb = ev.target.closest('button[data-basic]');
    if (bb) { openBasic(basics[+bb.getAttribute('data-basic')]); return; }
    var b = ev.target.closest('button[data-ai]'); if (!b) return;
    var it = results[+b.getAttribute('data-ai')];
    organise({ kind: 'europepmc', title: it.title, journal: it.journal, year: it.year, doi: it.doi, licence: it.licence, url: it.url, authors: it.authors }, null, it.pmcid);
  });
  $('pPasteGo').addEventListener('click', function () {
    var text = ($('pPaste').value || '').trim();
    if (!text) return;
    organise({ kind: 'upload', title: T('Pasted text', '粘贴的文字', '貼り付けた文章') }, text, null);
  });

  /* ---------------- organised protocol ---------------- */
  var draft = null;
  function lab(k) {
    return ({ time: T('Time: ', '用时：', '所要時間：'), materials: T('Materials and reagents:', '材料与试剂：', '材料・試薬：'), equipment: T('Equipment:', '仪器：', '機器：'),
      critical: T('Critical points:', '注意事项：', '注意点：'), organised: T('Organised by Pasero AI on ', '由 Pasero AI 整理于 ', 'Pasero AI で整理：'), source: T('Source: ', '来源：', '出典：'),
      licence: T('Licence: ', '许可：', 'ライセンス：') })[k];
  }
  function list(v) { return (Array.isArray(v) ? v : String(v || '').split('\n')).map(function (x) { return String(x || '').replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim(); }).filter(Boolean); }
  function content(p, src) {
    var bul = function (a) { return a.map(function (x) { return '- ' + x; }).join('\n'); };
    var mats = list(p.materials), eq = list(p.equipment), crit = list(p.critical), vars = list(p.variable_fields);
    var summary = [p.purpose || '', p.timing ? lab('time') + p.timing : '', mats.length ? lab('materials') + '\n' + bul(mats) : '', eq.length ? lab('equipment') + '\n' + bul(eq) : ''].filter(Boolean).join('\n\n');
    var steps = (p.steps || []).map(function (s, i) { s = typeof s === 'object' && s ? s : { title: '', detail: String(s || '') };
      return ((i + 1) + '. ' + (s.title || '')).trim() + (s.detail ? '\n   ' + String(s.detail).replace(/\n/g, '\n   ') : ''); }).join('\n');
    var srcLines = [lab('organised') + new Date().toISOString().slice(0, 10)];
    if (src.kind === 'pasero') {
      srcLines.push(lab('source') + T('organised by Pasero (generic template)', 'Pasero 整理（通用模板）', 'Pasero が整理（汎用テンプレート）'));
    } else if (src.kind !== 'upload') {
      srcLines.push(lab('source') + [src.authors, src.title, src.journal, src.year].filter(Boolean).join(' '));
      if (src.doi) srcLines.push('DOI: ' + src.doi);
      if (src.url) srcLines.push(src.url);
      if (src.licence) srcLines.push(lab('licence') + src.licence + ' (Europe PMC)');
    }
    return [T('Summary', '概要', '概要') + '\n' + summary, T('Steps', '步骤', '手順') + '\n' + steps,
      vars.length ? T('Variable fields', '可变参数', '変数フィールド') + '\n' + vars.join('\n') : '',
      T('Notes', '备注', 'メモ') + '\n' + [crit.length ? lab('critical') + '\n' + bul(crit) : '', srcLines.join('\n')].filter(Boolean).join('\n\n')].filter(Boolean).join('\n\n');
  }
  function apply(p) {
    $('pTitle').value = String(p.name || draft.source.title || '').slice(0, 150);
    $('pCat').value = String(p.category || draft.source.journal || '');
    $('pBody').value = content(p, draft.source);
  }
  function busy(on) {
    $('pBusy').hidden = !on;
    ['pAsk', 'pRewrite', 'pPasteGo'].forEach(function (id) { $(id).disabled = on; });
  }
  var findScroll = 0;
  function showView(on) {
    if (on) findScroll = window.scrollY;
    $('pFind').hidden = on; $('pView').hidden = !on;
    var head = document.querySelector('.tl-head'); if (head) head.hidden = on;
    window.scrollTo(0, on ? Math.max(0, $('pView').getBoundingClientRect().top + window.scrollY - 90) : findScroll);
  }
  $('pBack').addEventListener('click', function () { pending = null; showView(false); });
  function organise(source, text, pmcid) {
    $('pSrc').textContent = [source.title, source.journal, source.year, (source.licence || '').toUpperCase()].filter(Boolean).join(' · ');
    $('pDoc').hidden = true; $('pHistory').innerHTML = '';
    showView(true);
    if (!session) {
      pending = function () { organise(source, text, pmcid); };
      $('pWork').style.display = 'none';
      renderAccount(T('Sign in first; organising starts as soon as you are signed in.', '请先登录，登录后会自动开始整理。', '先にログインしてください。ログインするとすぐに整理が始まります。'));
      return;
    }
    $('pWork').style.display = '';
    draft = { source: source, text: text || '', history: [] };
    $('pEmpty').hidden = true; busy(true);
    (pmcid ? fetch(EPMC + '/' + encodeURIComponent(pmcid) + '/fullTextXML').then(function (r) { if (!r.ok) throw new Error('epmc'); return r.text(); }).then(fullText) : Promise.resolve(text))
      .then(function (t) { draft.text = t; return ai({ action: 'protocol', text: t.slice(0, 120000), source: source }); })
      .then(function (j) { apply(j.protocol || {}); if (j.reply) draft.history.push({ role: 'assistant', content: j.reply }); $('pDoc').hidden = false; history(); refreshLeft(); })
      .catch(function (e) { $('pEmpty').hidden = false; $('pEmpty').innerHTML = '<p class="tl-warn">' + esc(aiError(e.message)) + '</p>'; })
      .then(function () { busy(false); });
  }
  function basicText(b) {
    return [T('Summary', '概要', '概要') + '\n' + b.summary, b.vars ? T('Variable fields', '可变参数', '変数フィールド') + '\n' + b.vars : '',
      T('Steps', '步骤', '手順') + '\n' + b.steps, T('Notes', '备注', 'メモ') + '\n' + [b.notes, T('Source: organised by Pasero (generic template; adjust to your kit and lab SOPs).', '来源：Pasero 整理（通用模板，请按试剂盒说明书和本实验室规范调整）。', '出典：Pasero が整理（汎用テンプレート。キットの説明書と研究室の規定に合わせて調整してください）。')].filter(Boolean).join('\n\n')]
      .filter(Boolean).join('\n\n');
  }
  function openBasic(b) {
    $('pSrc').textContent = T('Source: organised by Pasero · generic template', '来源：Pasero 整理 · 通用模板', '出典：Pasero が整理 · 汎用テンプレート');
    showView(true);
    $('pWork').style.display = '';
    pending = null;
    draft = { source: { kind: 'pasero', title: b.title }, text: basicText(b), history: [] };
    $('pTitle').value = b.title; $('pCat').value = 'Pasero'; $('pBody').value = draft.text;
    $('pEmpty').hidden = true; $('pBusy').hidden = true; $('pDoc').hidden = false;
    history(); renderAccount();
  }
  function history() {
    $('pHistory').innerHTML = draft.history.map(function (m) {
      return '<p class="tl-proto-msg ' + (m.role === 'assistant' ? 'ai' : 'me') + '">' + esc(m.content).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }
  function current() { return $('pTitle').value + '\n' + $('pCat').value + '\n\n' + $('pBody').value; }
  function send(kind) {
    var q = ($('pQ').value || '').trim(); if (!q || !draft) return;
    var past = draft.history.slice(-6);
    draft.history.push({ role: 'user', content: q }); history(); $('pQ').value = ''; busy(true);
    var body = { text: draft.text.slice(0, 120000), source: draft.source, protocol: { text: current() }, history: past };
    (kind === 'ask' ? ai(Object.assign({ action: 'protocol_ask', question: q }, body)) : ai(Object.assign({ action: 'protocol_revise', instruction: q }, body)))
      .then(function (j) {
        if (kind !== 'ask') apply(j.protocol || {});
        draft.history.push({ role: 'assistant', content: j.reply || T('Updated.', '已按要求修改。', '修正しました。') });
      })
      .catch(function (e) { draft.history.pop(); $('pQ').value = q; draft.history.push({ role: 'assistant', content: aiError(e.message) }); })
      .then(function () { history(); busy(false); refreshLeft(); });
  }
  $('pAsk').addEventListener('click', function () { send('ask'); });
  $('pRewrite').addEventListener('click', function () { send('revise'); });
  function placeholders() {
    $('pQ').setAttribute('placeholder', T('e.g. Can step 3 be done on ice? / Scale it to a 6-well plate', '例如：第 3 步能在冰上做吗？ / 改成 6 孔板的用量', '例：手順 3 は氷上でできますか？ / 6 ウェルプレート用に換算して'));
  }
  placeholders();
  P.onLang(placeholders);

  /* ---------------- export ---------------- */
  function printable() {
    return '<!doctype html><html><head><meta charset="utf-8"><title>' + esc($('pTitle').value) + '</title><style>body{font-family:"Noto Sans SC","Noto Sans JP",system-ui,sans-serif;color:#14241f;margin:32px 40px;font-size:12.5pt;line-height:1.6}h1{font-size:20pt;margin:0}.c{color:#62756b;margin:2px 0 14px}pre{white-space:pre-wrap;font:inherit}</style></head><body><h1>' +
      esc($('pTitle').value) + '</h1><p class="c">' + esc($('pCat').value) + '</p><pre>' + esc($('pBody').value) + '</pre></body></html>';
  }
  $('pWord').addEventListener('click', function () {
    P.save(new Blob(['﻿' + printable()], { type: 'application/msword' }), (($('pTitle').value || 'protocol').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 80) || 'protocol') + '.doc');
  });
  $('pPdf').addEventListener('click', function () {
    var frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0';
    document.body.appendChild(frame);
    frame.srcdoc = printable();
    frame.onload = function () { try { frame.contentWindow.focus(); frame.contentWindow.print(); } finally { setTimeout(function () { frame.remove(); }, 2000); } };
  });
  $('pCopy').addEventListener('click', function () { P.copy(current(), $('pCopy')); });

  P.onLang(function () { renderAccount(); if (results.length) renderResults(); });
  renderAccount();
})();
