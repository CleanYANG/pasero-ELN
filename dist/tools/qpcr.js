/* qPCR relative quantification: 2^-ΔΔCt (Livak & Schmittgen 2001), Pfaffl (2001) when
   efficiencies are not 100%. Statistics on per-replicate log2 ratios (equivalent to ΔCt). */
(function () {
  'use strict';
  var P = window.PTools, S = window.PStats, T = P.T, $ = function (id) { return document.getElementById(id); };
  var EXAMPLE = $('paste').value;

  function parse(text) {
    var rows = P.parseTable(text), data = [], skipped = 0, header = false;
    rows.forEach(function (r, i) {
      if (!r.length || (r.length === 1 && !r[0])) return;
      if (r.length < 3) { skipped++; return; }
      var name = r[0], t = P.num(r[1]), ref = P.num(r[2]);
      if (i === 0 && !isFinite(t) && !isFinite(ref)) { header = true; return; }
      if (!name || !isFinite(t) || !isFinite(ref)) { skipped++; return; }
      data.push({ name: name, t: t, r: ref });
    });
    return { data: data, skipped: skipped, header: header };
  }

  function render() {
    var parsed = parse($('paste').value), data = parsed.data, out = $('out'), sel = $('ctrl');
    var names = [];
    data.forEach(function (d) { if (names.indexOf(d.name) < 0) names.push(d.name); });
    var prev = sel.value;
    sel.innerHTML = names.map(function (n) { return '<option>' + P.esc(n) + '</option>'; }).join('');
    if (names.indexOf(prev) >= 0) sel.value = prev;
    if (names.length < 2) {
      out.innerHTML = '<p class="tl-note">' + P.esc(T('Paste at least two samples (for example a control and a treatment).',
        '至少需要两个样品（比如对照组和处理组）。', '少なくとも 2 つのサンプル（例：対照と処理）を貼り付けてください。')) + '</p>';
      return;
    }
    var effT = P.val('effT'), effR = P.val('effR');
    if (!(effT > 0)) effT = 100; if (!(effR > 0)) effR = 100;
    var lt = Math.log2(1 + effT / 100), lr = Math.log2(1 + effR / 100);
    var pfaffl = Math.abs(effT - 100) > 1e-9 || Math.abs(effR - 100) > 1e-9;
    var ctrl = sel.value;
    var cRows = data.filter(function (d) { return d.name === ctrl; });
    var mT = S.mean(cRows.map(function (d) { return d.t; })), mR = S.mean(cRows.map(function (d) { return d.r; }));
    var dCtCtrl = S.mean(cRows.map(function (d) { return d.t - d.r; }));
    data.forEach(function (d) { d.y = (mT - d.t) * lt - (mR - d.r) * lr; });
    var ctrlY = cRows.map(function (d) { return d.y; });

    var groups = names.map(function (n) {
      var g = data.filter(function (d) { return d.name === n; });
      var y = g.map(function (d) { return d.y; }), dct = g.map(function (d) { return d.t - d.r; });
      var res = { name: n, n: g.length, t: S.mean(g.map(function (d) { return d.t; })), r: S.mean(g.map(function (d) { return d.r; })),
        dct: S.mean(dct), dctSd: S.sd(dct), y: S.mean(y), ySd: S.sd(y), p: NaN };
      res.ddct = res.dct - dCtCtrl;
      if (n !== ctrl && g.length >= 2 && ctrlY.length >= 2) res.p = S.welch(y, ctrlY).p;
      return res;
    });
    var test = groups.filter(function (g) { return g.name !== ctrl && isFinite(g.p); });
    var adj = S.holm(test.map(function (g) { return g.p; }));
    test.forEach(function (g, i) { g.padj = adj[i]; });

    var head = [T('Sample', '样品', 'サンプル'), 'n', T('Target Ct', '目的基因 Ct', '標的 Ct'), T('Reference Ct', '内参 Ct', 'リファレンス Ct'),
      'ΔCt (± SD)', 'ΔΔCt', T('Fold change', '倍数变化', '発現倍率'), T('Range (± SD)', '范围 (± SD)', '範囲 (± SD)'), T('p (Welch t)', 'p (Welch t)', 'p (Welch t)')];
    if (test.length > 1) head.push(T('p (Holm)', 'p (Holm 校正)', 'p (Holm 補正)'));
    var tsv = [head.join('\t')];
    var trs = groups.map(function (g) {
      var fold = Math.pow(2, g.y), lo = Math.pow(2, g.y - (g.ySd || 0)), hi = Math.pow(2, g.y + (g.ySd || 0));
      var isC = g.name === ctrl;
      var cells = [g.name + (isC && !/control|ctrl|对照|対照|コントロール/i.test(g.name) ? ' (' + T('control', '对照', '対照') + ')' : ''), g.n, P.fixed(g.t, 2), P.fixed(g.r, 2),
        P.fixed(g.dct, 2) + (g.n > 1 ? ' ± ' + P.fixed(g.dctSd, 2) : ''), P.fixed(g.ddct, 2), P.fmt(fold, 3),
        g.n > 1 ? P.fmt(lo, 3) + '–' + P.fmt(hi, 3) : '—',
        isC ? '—' : (isFinite(g.p) ? S.fmtP(g.p).replace('p = ', '').replace('p < ', '< ') + ' ' + S.stars(g.p) : T('n < 2', 'n < 2', 'n < 2'))];
      if (test.length > 1) cells.push(isC || !isFinite(g.padj) ? '—' : S.fmtP(g.padj).replace('p = ', '').replace('p < ', '< ') + ' ' + S.stars(g.padj));
      tsv.push(cells.join('\t'));
      return '<tr>' + cells.map(function (c, i) { return '<td>' + (i === 6 ? '<strong>' + P.esc(String(c)) + '</strong>' : P.esc(String(c))) + '</td>'; }).join('') + '</tr>';
    }).join('');

    var notes = [];
    if (parsed.skipped) notes.push(T(parsed.skipped + ' row(s) skipped (empty or non-numeric Ct).', '跳过了 ' + parsed.skipped + ' 行（空白或 Ct 不是数字）。', parsed.skipped + ' 行をスキップしました（空欄または数値でない Ct）。'));
    if (pfaffl) notes.push(T('Efficiencies other than 100%: fold change uses the Pfaffl method; ΔΔCt is shown for reference.',
      '扩增效率不是 100%，倍数变化按 Pfaffl 法计算；ΔΔCt 仅供参考。', '増幅効率が 100% 以外のため、発現倍率は Pfaffl 法で計算しています（ΔΔCt は参考値）。'));
    if (groups.some(function (g) { return g.n < 3; })) notes.push(T('Some samples have fewer than 3 replicates; treat p values with caution.',
      '有样品的重复数少于 3，p 值仅供参考。', '反復が 3 未満のサンプルがあります。p 値の解釈には注意してください。'));

    var others = groups.filter(function (g) { return g.name !== ctrl; }).map(function (g) { return g.name; });
    var method = pfaffl
      ? T('Relative expression was calculated with the Pfaffl method (Pfaffl, 2001) using amplification efficiencies of ' + P.fmt(effT, 4) + '% (target) and ' + P.fmt(effR, 4) + '% (reference), normalised to the reference gene and expressed relative to ' + ctrl + '.',
          '相对表达量采用 Pfaffl 法（Pfaffl, 2001）计算，目的基因与内参的扩增效率分别为 ' + P.fmt(effT, 4) + '% 和 ' + P.fmt(effR, 4) + '%，以内参基因校正，并以 ' + ctrl + ' 为对照。',
          '相対発現量は Pfaffl 法（Pfaffl, 2001）で算出し、増幅効率は標的遺伝子 ' + P.fmt(effT, 4) + '%、リファレンス ' + P.fmt(effR, 4) + '% とした。リファレンス遺伝子で補正し、' + ctrl + ' を基準とした。')
      : T('Relative expression was calculated with the 2^−ΔΔCt method (Livak & Schmittgen, 2001), normalised to the reference gene and expressed relative to ' + ctrl + '.',
          '相对表达量采用 2^−ΔΔCt 法（Livak & Schmittgen, 2001）计算，以内参基因校正，并以 ' + ctrl + ' 为对照。',
          '相対発現量は 2^−ΔΔCt 法（Livak & Schmittgen, 2001）で算出し、リファレンス遺伝子で補正して ' + ctrl + ' を基準とした。');
    if (test.length) method += ' ' + T('ΔCt values of ' + others.join(', ') + ' were compared with ' + ctrl + ' using Welch’s two-sided t-test' + (test.length > 1 ? ', with Holm correction for multiple comparisons.' : '.'),
      others.join('、') + ' 的 ΔCt 值与 ' + ctrl + ' 比较，采用双侧 Welch t 检验' + (test.length > 1 ? '，多重比较采用 Holm 法校正。' : '。'),
      others.join('、') + ' の ΔCt 値を ' + ctrl + ' と両側 Welch の t 検定で比較した' + (test.length > 1 ? '（多重比較は Holm 法で補正）。' : '。'));

    out.innerHTML = '<div class="tl-table-wrap"><table class="tl-table"><thead><tr>' + head.map(function (h) { return '<th>' + P.esc(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + trs + '</tbody></table></div>' +
      '<p class="tl-note" style="margin-top:10px">' + P.esc(T('Fold change = 2^(mean log₂ ratio), the same as 2^−ΔΔCt at 100% efficiency. Range shows ± 1 SD of the replicates on the log scale. * p < 0.05, ** p < 0.01, *** p < 0.001, **** p < 0.0001.',
        '倍数变化 = 2^(log₂ 比值的平均)，效率 100% 时等于 2^−ΔΔCt。范围为各重复在对数尺度上的 ± 1 SD。* p < 0.05，** p < 0.01，*** p < 0.001，**** p < 0.0001。',
        '発現倍率 = 2^(log₂ 比の平均)。効率 100% のときは 2^−ΔΔCt と同じです。範囲は反復の対数スケールでの ± 1 SD。* p < 0.05、** p < 0.01、*** p < 0.001、**** p < 0.0001。')) + '</p>' +
      (notes.length ? '<p class="tl-warn">' + P.esc(notes.join(' ')) + '</p>' : '') +
      '<h3>' + T('Methods', '方法描述', '方法の記述') + '</h3><p class="tl-methods" id="methods">' + P.esc(method) + '</p>' +
      '<div class="tl-btns"><button type="button" class="tl-btn primary" id="copyT">' + T('Copy table', '复制表格', '表をコピー') + '</button>' +
      '<button type="button" class="tl-btn" id="copyM">' + T('Copy methods', '复制方法描述', '方法をコピー') + '</button></div>';
    $('copyT').onclick = function () { P.copy(tsv.join('\n'), this); };
    $('copyM').onclick = function () { P.copy(method, this); };
  }
  $('clear').addEventListener('click', function () { $('paste').value = ''; render(); $('paste').focus(); });
  $('example').addEventListener('click', function () { $('paste').value = EXAMPLE; render(); });
  P.live('main', function (ev) { if (ev && ev.target && ev.target.tagName === 'BUTTON') return; render(); });
  window.PQpcr = { parse: parse };
})();
