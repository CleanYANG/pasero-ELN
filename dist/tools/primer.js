/* Primer Tm calculator
   Nearest-neighbor Tm: SantaLucia J. (1998) PNAS 95:1460, unified parameters,
   entropy salt correction 0.368·N·ln[Na+], primer in excess over template (C_T = primer); Mg2+ and dNTPs converted to a Na+
   equivalent with von Ahsen et al. (2001) Clin Chem 47:1956: Na_eq = Na + 120·√(Mg − dNTP). */
(function () {
  'use strict';
  var P = window.PTools, T = P.T, $ = function (id) { return document.getElementById(id); };
  var NN = { /* dH kcal/mol, dS cal/(K·mol) */
    AA: [-7.9, -22.2], TT: [-7.9, -22.2], AT: [-7.2, -20.4], TA: [-7.2, -21.3],
    CA: [-8.5, -22.7], TG: [-8.5, -22.7], GT: [-8.4, -22.4], AC: [-8.4, -22.4],
    CT: [-7.8, -21.0], AG: [-7.8, -21.0], GA: [-8.2, -22.2], TC: [-8.2, -22.2],
    CG: [-10.6, -27.2], GC: [-9.8, -24.4], GG: [-8.0, -19.9], CC: [-8.0, -19.9]
  };
  var COMP = { A: 'T', T: 'A', G: 'C', C: 'G', U: 'A', R: 'Y', Y: 'R', S: 'S', W: 'W', K: 'M', M: 'K', B: 'V', V: 'B', D: 'H', H: 'D', N: 'N' };

  function clean(s) { return String(s || '').toUpperCase().replace(/[^A-Z]/g, ''); }
  function revcomp(s) { return s.split('').reverse().map(function (c) { return COMP[c] || 'N'; }).join(''); }
  function selfComp(s) { return s === revcomp(s); }

  /* returns Tm in °C, or NaN when the sequence has non-ACGT bases */
  function tmNN(seq, naM, primerM) {
    if (!/^[ACGT]+$/.test(seq) || seq.length < 2) return NaN;
    var dH = 0, dS = 0;
    for (var i = 0; i < seq.length - 1; i++) { var p = NN[seq.substr(i, 2)]; dH += p[0]; dS += p[1]; }
    [seq[0], seq[seq.length - 1]].forEach(function (b) {
      if (b === 'G' || b === 'C') { dH += 0.1; dS += -2.8; } else { dH += 2.3; dS += 4.1; }
    });
    var sym = selfComp(seq);
    if (sym) dS += -1.4;
    dS += 0.368 * (seq.length - 1) * Math.log(naM);
    /* PCR primers are in large excess over template, so the primer concentration is used as C_T */
    var ct = primerM;
    return dH * 1000 / (dS + 1.98720425864083 * Math.log(ct)) - 273.15;
  }
  function tmBasic(seq) {
    var gc = (seq.match(/[GC]/g) || []).length, at = (seq.match(/[AT]/g) || []).length;
    if (seq.length < 14) return 2 * at + 4 * gc;
    return 64.9 + 41 * (gc - 16.4) / seq.length;
  }
  function analyse(raw, naEq, primerM) {
    var seq = clean(raw);
    if (!seq) return null;
    var gc = (seq.match(/[GC]/g) || []).length, n = seq.length;
    var odd = seq.replace(/[ACGT]/g, '');
    var tail5 = seq.slice(-5), gc3 = (tail5.match(/[GC]/g) || []).length;
    var run = (seq.match(/(A{4,}|C{4,}|G{4,}|T{4,})/) || [])[0];
    return { seq: seq, n: n, gc: gc / n * 100, tm: tmNN(seq, naEq, primerM), basic: /^[ACGT]+$/.test(seq) ? tmBasic(seq) : NaN,
      odd: odd, gc3: gc3, last: seq[n - 1], run: run, rc: revcomp(seq), mwt: mwOligo(seq) };
  }
  function mwOligo(seq) { /* anhydrous MW of an unmodified oligo, 5'-OH */
    var w = { A: 313.21, C: 289.18, G: 329.21, T: 304.2 }, s = 0;
    for (var i = 0; i < seq.length; i++) { if (!w[seq[i]]) return NaN; s += w[seq[i]]; }
    return s - 61.96;
  }
  function checks(a) {
    var c = [];
    function add(ok, text) { c.push('<li style="list-style:none;margin-left:-1.2em">' + (ok ? '✓ ' : '⚠︎ ') + P.esc(text) + '</li>'); }
    add(a.n >= 18 && a.n <= 30, T('Length ' + a.n + ' nt (18–30 is typical)', '长度 ' + a.n + ' nt（一般 18–30）', '長さ ' + a.n + ' nt（一般的には 18〜30）'));
    add(a.gc >= 40 && a.gc <= 60, T('GC ' + P.fixed(a.gc, 1) + '% (40–60% is typical)', 'GC ' + P.fixed(a.gc, 1) + '%（一般 40–60%）', 'GC ' + P.fixed(a.gc, 1) + '%（一般的には 40〜60%）'));
    add(a.last === 'G' || a.last === 'C', a.last === 'G' || a.last === 'C'
      ? T('Ends in G or C (GC clamp)', '3′ 端是 G 或 C（GC 夹）', '3′ 末端が G か C（GC クランプ）')
      : T('Ends in A or T: no GC clamp', '3′ 端是 A 或 T，没有 GC 夹', '3′ 末端が A か T：GC クランプなし'));
    add(a.gc3 <= 3, T(a.gc3 + ' G/C in the last 5 bases (more than 3 can prime non-specifically)', '最后 5 个碱基里有 ' + a.gc3 + ' 个 G/C（超过 3 个容易非特异扩增）', '末端 5 塩基中 G/C が ' + a.gc3 + ' 個（3 個を超えると非特異的に伸長しやすい）'));
    add(!a.run, a.run ? T('Run of ' + a.run.length + ' × ' + a.run[0], '有连续 ' + a.run.length + ' 个 ' + a.run[0], a.run[0] + ' が ' + a.run.length + ' 個連続') : T('No runs of 4 or more of one base', '没有 4 个以上的同种碱基连续', '同じ塩基の 4 個以上の連続なし'));
    return '<ul class="tl-steps" style="margin-top:10px">' + c.join('') + '</ul>';
  }
  function block(title, a) {
    if (!a) return '';
    var tm = isFinite(a.tm) ? P.fixed(a.tm, 1) + ' °C' : '—';
    var h = '<h3>' + P.esc(title) + '</h3><div class="tl-big"><span class="k">Tm</span><span class="v">' + tm + '</span>' +
      '<span class="s">' + a.n + ' nt · GC ' + P.fixed(a.gc, 1) + '%' + (isFinite(a.basic) ? ' · ' + P.esc(T('basic formula ', '经验公式 ', '簡易式 ')) + P.fixed(a.basic, 1) + ' °C' : '') + '</span></div>';
    if (a.odd) h += '<p class="tl-warn">' + P.esc(T('Contains non-ACGT bases (' + a.odd.slice(0, 12) + '). Tm needs a plain A/C/G/T sequence.',
      '含有非 ACGT 碱基（' + a.odd.slice(0, 12) + '），Tm 只能按纯 A/C/G/T 序列计算。', 'ACGT 以外の塩基（' + a.odd.slice(0, 12) + '）を含みます。Tm は A/C/G/T のみの配列で計算します。')) + '</p>';
    h += checks(a);
    h += '<dl class="tl-kv" style="margin-top:12px"><dt>' + T('Reverse complement', '反向互补', '逆相補配列') + '</dt><dd class="tl-mono" style="text-align:left">' + a.rc + '</dd>' +
      (isFinite(a.mwt) ? '<dt>' + T('Molecular weight', '分子量', '分子量') + '</dt><dd>' + P.fmt(a.mwt, 6) + ' g/mol</dd>' : '') + '</dl>';
    return h;
  }

  var last = {};
  function render() {
    var na = P.val('na'), mg = P.val('mg') || 0, dntp = P.val('dntp') || 0, pc = P.val('pc');
    var out = $('out');
    if (!(na > 0 && pc > 0)) { out.innerHTML = '<p class="tl-note">' + P.esc(T('Enter the salt and primer concentrations.', '请填写盐浓度和引物浓度。', '塩濃度とプライマー濃度を入力してください。')) + '</p>'; return; }
    var free = Math.max(0, mg - dntp);
    var naEq = (na + 120 * Math.sqrt(free)) / 1000;
    var f = analyse($('fwd').value, naEq, pc * 1e-9), r = analyse($('rev').value, naEq, pc * 1e-9);
    last = { f: f, r: r };
    if (!f && !r) { out.innerHTML = '<p class="tl-note">' + P.esc(T('Paste a primer sequence.', '请粘贴引物序列。', 'プライマー配列を貼り付けてください。')) + '</p>'; return; }
    var html = '';
    if (f && r && isFinite(f.tm) && isFinite(r.tm)) {
      var d = Math.abs(f.tm - r.tm), lo = Math.min(f.tm, r.tm);
      html += '<div class="tl-big"><span class="k">' + P.esc(T('Pair', '引物对', 'ペア')) + '</span><span class="v">ΔTm ' + P.fixed(d, 1) + '<small>°C</small></span>' +
        '<span class="s">' + P.esc(d <= 5 ? T('Well matched (within 5 °C).', '匹配良好（相差 5 °C 以内）。', '釣り合いは良好（差 5 °C 以内）。')
          : T('More than 5 °C apart; consider adjusting one primer.', '相差超过 5 °C，建议调整其中一条。', '5 °C 以上離れています。どちらかの調整を検討してください。')) + ' ' +
        P.esc((function () {
          var range = P.fixed(lo - 5, 0) + '–' + P.fixed(lo - 3, 0) + ' °C';
          return T('Annealing starting point: about ' + range + ' (3–5 °C below the lower Tm).',
            '退火温度可以从约 ' + range + ' 开始试（比两者中较低的 Tm 低 3–5 °C）。',
            'アニーリング温度の目安：約 ' + range + '（低い方の Tm より 3〜5 °C 低く）。');
        })()) + '</span></div>';
    }
    html += block(T('Forward', '正向引物', 'フォワード'), f) + block(T('Reverse', '反向引物', 'リバース'), r);
    html += '<p class="tl-note" style="margin-top:14px">' + P.esc(T('Conditions: ', '条件：', '条件：')) + 'Na⁺ ' + P.fmt(na, 3) + ' mM, Mg²⁺ ' + P.fmt(mg, 3) + ' mM, dNTP ' + P.fmt(dntp, 3) + ' mM, ' +
      P.esc(T('primer ', '引物 ', 'プライマー ')) + P.fmt(pc, 4) + ' nM → Na⁺ eq. ' + P.fmt(naEq * 1000, 4) + ' mM</p>';
    out.innerHTML = html;
  }
  ['fwd', 'rev'].forEach(function (id) {
    $(id).addEventListener('blur', function () { var c = clean(this.value); if (c && c !== this.value) this.value = c; });
  });
  P.live('main', render);
  window.PPrimer = { tmNN: tmNN, revcomp: revcomp, clean: clean }; /* for tests */
})();
