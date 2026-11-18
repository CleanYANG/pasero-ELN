/* Temporary test page for photo -> note transcription (function note-scan-test). Not linked from the site. */
(function () {
  'use strict';
  var SUPA = 'https://gnfxemlrgjwcqxqruzev.supabase.co';
  var KEY = 'sb_publishable_2MJ_yQEUabbfZr14Tv5gBg_BpJkZ5uU'; // public publishable key
  var FN = SUPA + '/functions/v1/note-scan-test';
  var SK = 'pasero-tools-session';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var mark = function (s) { return esc(s).replace(/(\S*\[\?\]|\[unreadable\])/g, '<mark>$1</mark>'); };
  var session = null; try { session = JSON.parse(localStorage.getItem(SK) || 'null'); } catch (e) {}
  function save(s) { session = s; try { s ? localStorage.setItem(SK, JSON.stringify(s)) : localStorage.removeItem(SK); } catch (e) {} }
  function auth(path, body) {
    return fetch(SUPA + '/auth/v1/' + path, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error_code || j.msg || 'auth'); return j; }); });
  }
  function keep(j) { save({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (Number(j.expires_in) || 3600) * 1000, email: (j.user && j.user.email) || (session && session.email) || '' }); }
  function token() {
    if (!session) return Promise.resolve(null);
    if (Date.now() < session.expires_at - 60000) return Promise.resolve(session.access_token);
    return auth('token?grant_type=refresh_token', { refresh_token: session.refresh_token }).then(function (j) { keep(j); return session.access_token; }).catch(function () { save(null); account(); return null; });
  }
  var pendingEmail = '';
  function account(msg) {
    var a = $('acc');
    if (session) { a.innerHTML = '<div class="row">已登录 ' + esc(session.email) + ' <button id="out1">退出</button></div>'; $('out1').onclick = function () { save(null); account(); }; $('go').disabled = !$('files').files.length; return; }
    $('go').disabled = true;
    a.innerHTML = pendingEmail
      ? '<div class="row"><input type="text" id="code" placeholder="邮箱验证码" inputmode="numeric"><button class="primary" id="vf">登录</button></div><p class="meta">' + esc(msg || '') + '</p>'
      : '<div class="row"><input type="email" id="em" placeholder="Pasero 账号邮箱"><button class="primary" id="send">发送验证码</button></div><p class="meta">' + esc(msg || '') + '</p>';
    if (pendingEmail) $('vf').onclick = function () { auth('verify', { type: 'email', email: pendingEmail, token: $('code').value.trim() }).then(function (j) { keep(j); pendingEmail = ''; account(); }).catch(function (e) { account('验证失败：' + e.message); }); };
    else $('send').onclick = function () { var em = $('em').value.trim(); auth('otp', { email: em, create_user: false }).then(function () { pendingEmail = em; account('验证码已发到 ' + em); }).catch(function (e) { account('发送失败：' + e.message); }); };
  }
  function shrink(file) {
    return new Promise(function (ok, bad) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        ok(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = bad; img.src = url;
    });
  }
  function render(p) {
    var parts = [];
    (p.blocks || []).forEach(function (b) {
      if (b.kind === 'table') parts.push('<table>' + (b.rows || []).map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + mark(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>');
      else if (b.kind === 'list') parts.push('<ul class="b">' + (b.items || []).map(function (x) { return '<li>' + mark(x) + '</li>'; }).join('') + '</ul>');
      else parts.push('<div class="b ' + esc(b.kind) + '">' + (b.kind === 'figure' ? '［图］' : '') + (b.number ? esc(b.number) + '. ' : '') + mark(b.text || (b.items || []).join(' / ')) + '</div>');
    });
    if ((p.crossed_out || []).length) parts.push('<p class="meta">划掉的：' + esc(p.crossed_out.join('；')) + '</p>');
    return parts.join('');
  }
  window.__scan = [];
  $('files').onchange = function () { $('go').disabled = !session || !this.files.length; };
  $('go').onclick = function () {
    var files = Array.prototype.slice.call($('files').files); if (!files.length) return;
    $('go').disabled = true; $('out').innerHTML = ''; window.__scan = [];
    var chain = Promise.resolve();
    files.forEach(function (f, i) {
      var box = document.createElement('section'); box.className = 'card'; box.innerHTML = '<p class="meta">第 ' + (i + 1) + ' 页：' + esc(f.name) + ' · 等待中…</p>'; $('out').appendChild(box);
      chain = chain.then(function () {
        box.querySelector('p').textContent = '第 ' + (i + 1) + ' 页：' + f.name + ' · 识别中…';
        var t0 = Date.now(), img;
        return shrink(f).then(function (d) { img = d; return token(); }).then(function (tk) {
          return fetch(FN, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' }, body: JSON.stringify({ image: img, lang: 'zh', detail: $('detail').value, effort: $('effort').value }) });
        }).then(function (r) { return r.json().then(function (j) { j.http = r.status; return j; }); }).then(function (j) {
          var wall = Date.now() - t0, u = j.usage || {};
          window.__scan.push({ file: f.name, http: j.http, wall_ms: wall, server_ms: j.ms, usage: j.usage, page: j.page, code: j.code });
          if (!j.page) { box.innerHTML = '<p class="meta">第 ' + (i + 1) + ' 页失败：' + esc(j.code || j.http) + '</p>'; return; }
          var p = j.page;
          box.innerHTML = '<p class="meta">第 ' + (i + 1) + ' 页 · ' + esc(f.name) + ' · ' + (wall / 1000).toFixed(1) + ' 秒 · 输入 ' + (u.input_tokens || '?') + ' / 输出 ' + (u.output_tokens || '?') + ' tokens · 旋转 ' + esc(p.rotation) + '° · 存疑 ' + esc(p.uncertain_count) + ' 处 · ' + esc(p.page_type || '') + '</p>' +
            '<div class="page"><img alt="" src="' + img + '"><div><p><b>' + esc(p.title_suggestion || p.title_written || '') + '</b> <span class="meta">' + esc(p.date_written || '') + (p.date_iso ? ' → ' + esc(p.date_iso) : '') + '</span></p><p class="meta">' + esc(p.summary || '') + '</p>' + render(p) + '</div></div>';
        }).catch(function (e) { window.__scan.push({ file: f.name, error: String(e) }); box.innerHTML = '<p class="meta">第 ' + (i + 1) + ' 页出错：' + esc(e.message) + '</p>'; });
      });
    });
    chain.then(function () {
      var ok = window.__scan.filter(function (x) { return x.page; });
      var tin = ok.reduce(function (n, x) { return n + ((x.usage || {}).input_tokens || 0); }, 0), tout = ok.reduce(function (n, x) { return n + ((x.usage || {}).output_tokens || 0); }, 0);
      $('sum').innerHTML = '完成 ' + ok.length + ' / ' + window.__scan.length + ' 页 · 输入 ' + tin + ' tokens · 输出 ' + tout + ' tokens';
      $('go').disabled = false;
    });
  };
  account();
})();
