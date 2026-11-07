/* Dilution calculator: C1V1 = C2V2, plus a serial-dilution planner */
(function () {
  'use strict';
  var P = window.PTools, T = P.T, $ = function (id) { return document.getElementById(id); };
  /* concentration units -> [dimension, factor to base]; base: M, g/L, × */
  var CU = {
    'M': ['mol', 1], 'mM': ['mol', 1e-3], 'µM': ['mol', 1e-6], 'nM': ['mol', 1e-9], 'pM': ['mol', 1e-12],
    'mg/mL': ['mass', 1], 'µg/mL': ['mass', 1e-3], 'ng/µL': ['mass', 1e-3], 'ng/mL': ['mass', 1e-6], '% (w/v)': ['mass', 10],
    '×': ['x', 1]
  };
  var solve = P.seg('solve', function () { setSolve(); render(); });
  var fields = { c1: 'c1', v1: 'v1', c2: 'c2', v2: 'v2' };

  function setSolve() {
    var s = solve();
    Object.keys(fields).forEach(function (k) {
      var el = $(k), on = k === s;
      el.readOnly = on; el.closest('.tl-in').classList.toggle('solve', on);
      if (on) el.value = '';
    });
  }
  /* convert a concentration to the dimension of `toUnit`; returns NaN if impossible */
  function convC(value, fromU, toU, mw) {
    var a = CU[fromU], b = CU[toU];
    var base = value * a[1];
    if (a[0] === b[0]) return base / b[1];
    if (a[0] === 'mol' && b[0] === 'mass' && mw > 0) return base * mw / b[1];
    if (a[0] === 'mass' && b[0] === 'mol' && mw > 0) return base / mw / b[1];
    return NaN;
  }
  function cText(v, u) { return P.fmt(v, 4) + ' ' + u; }
  function vText(l) { var b = P.bestVol(l); return P.fmt(b.v, 4) + ' ' + b.u; }

  function render() {
    var s = solve(), mw = P.val('mw');
    var c1 = P.val('c1'), c2 = P.val('c2'), u1 = $('c1U').value, u2 = $('c2U').value;
    var v1 = P.val('v1') * P.U.vol[$('v1U').value], v2 = P.val('v2') * P.U.vol[$('v2U').value];
    var out = $('out');
    var dimOk = CU[u1][0] === CU[u2][0] || (CU[u1][0] !== 'x' && CU[u2][0] !== 'x' && mw > 0);
    if (!dimOk) {
      out.innerHTML = note(CU[u1][0] === 'x' || CU[u2][0] === 'x'
        ? T('“×” only works with “×” on the other side.', '“×” 只能和 “×” 对应。', '「×」は相手側も「×」にしてください。')
        : T('Mixing molar and mass units needs the molecular weight.', '摩尔浓度和质量浓度混用时需要填分子量。', 'モル濃度と質量濃度を混在させるには分子量が必要です。'));
      return;
    }
    var c2in1; /* C2 expressed in C1's unit */
    var res, k, big, steps = [];
    if (s === 'v1') {
      c2in1 = convC(c2, u2, u1, mw);
      res = c2in1 * v2 / c1;
      if (!(res > 0)) return need();
      $('v1').value = P.plain(res / P.U.vol[$('v1U').value]);
      v1 = res;
    } else if (s === 'v2') {
      c2in1 = convC(c2, u2, u1, mw);
      res = c1 * v1 / c2in1;
      if (!(res > 0)) return need();
      $('v2').value = P.plain(res / P.U.vol[$('v2U').value]);
      v2 = res;
    } else if (s === 'c2') {
      var c2b = c1 * v1 / v2; /* in u1 */
      if (!(c2b > 0)) return need();
      c2 = convC(c2b, u1, u2, mw); $('c2').value = P.plain(c2);
      c2in1 = c2b;
    } else {
      c2in1 = convC(c2, u2, u1, mw);
      c1 = c2in1 * v2 / v1;
      if (!(c1 > 0)) return need();
      $('c1').value = P.plain(c1);
    }
    if (!(v1 > 0 && v2 > 0 && c1 > 0 && c2in1 > 0)) return need();
    var fold = c1 / c2in1;
    if (s === 'v1') { k = T('Stock to add (V1)', '取原液 (V1)', '原液の量 (V1)'); big = vText(v1); }
    else if (s === 'v2') { k = T('Final volume (V2)', '终体积 (V2)', '最終量 (V2)'); big = vText(v2); }
    else if (s === 'c2') { k = T('Final concentration (C2)', '终浓度 (C2)', '最終濃度 (C2)'); big = cText(c2, u2); }
    else { k = T('Stock concentration needed (C1)', '需要的原液浓度 (C1)', '必要な原液濃度 (C1)'); big = cText(c1, u1); }
    var warn = '';
    if (v1 > v2 * 1.0000001) warn = T('V1 is larger than V2: the final concentration is higher than the stock. Check the numbers.',
      'V1 比 V2 还大，说明终浓度比原液还高，请检查数值。', 'V1 が V2 より大きく、最終濃度が原液より高くなっています。数値を確認してください。');
    else if (v1 < 0.5e-6) warn = T('Less than 0.5 µL is hard to pipette accurately. Consider an intermediate dilution.',
      '不到 0.5 µL 很难移准，建议先做一次中间稀释。', '0.5 µL 未満は正確に量りにくいので、中間希釈をおすすめします。');
    steps.push(T('Take ', '取 ', '原液を ') + vText(v1) + T(' of stock (' + cText(c1, u1) + ').', '原液（' + cText(c1, u1) + '）。', '（' + cText(c1, u1) + '）取ります。'));
    steps.push(T('Add ', '加入 ', '溶媒を ') + vText(v2 - v1) + T(' of diluent.', ' 稀释液。', ' 加えます。'));
    steps.push(T('Total ', '总体积 ', '全量 ') + vText(v2) + T(' at ', '，浓度 ', '、') + cText(convC(c2in1, u1, u2, mw), u2) + T('.', '。', ' になります。'));
    out.innerHTML = '<div class="tl-big"><span class="k">' + P.esc(k) + '</span><span class="v">' + P.esc(big) + '</span>' +
      '<span class="s">' + P.esc(T('Dilution: ', '稀释倍数：', '希釈倍率：')) + P.fmt(fold, 4) + '×</span></div>' +
      '<ol class="tl-steps">' + steps.map(function (x) { return '<li>' + P.esc(x) + '</li>'; }).join('') + '</ol>' +
      '<p class="tl-warn">' + P.esc(warn) + '</p>';
  }
  function need() {
    $('out').innerHTML = note(T('Fill in the other three values.', '请填写其余三项。', '残りの 3 つを入力してください。'));
  }
  function note(t) { return '<p class="tl-note">' + P.esc(t) + '</p>'; }

  /* Serial dilution: every tube ends with the same volume after transfer */
  function serial() {
    var c0 = P.val('sStart'), f = P.val('sFold'), n = Math.round(P.val('sN')), vEnd = P.val('sV') * P.U.vol[$('sVU').value];
    var u = $('sU').value, out = $('sOut');
    if (!(c0 > 0 && f > 1 && n >= 1 && n <= 48 && vEnd > 0)) {
      out.innerHTML = note(T('Use a factor above 1 and 1–48 tubes.', '稀释倍数需大于 1，管数 1–48。', '倍率は 1 より大きく、本数は 1〜48 にしてください。'));
      return;
    }
    /* walk backwards: tube i is made with total = vEnd + transfer to tube i+1 */
    var total = new Array(n), transfer = new Array(n);
    for (var i = n - 1; i >= 0; i--) {
      total[i] = vEnd + (i < n - 1 ? transfer[i + 1] : 0);
      transfer[i] = total[i] / f;
    }
    var rows = '', tsv = [[T('Tube', '管', 'チューブ'), T('Concentration', '浓度', '濃度') + ' (' + u + ')', T('Transfer in', '转入', '移す量'), T('Diluent', '稀释液', '溶媒')].join('\t')];
    for (var j = 0; j < n; j++) {
      var conc = c0 / Math.pow(f, j + 1), from = j === 0 ? T('stock', '原液', '原液') : '#' + j;
      var tv = vText(transfer[j]);
      var tr = T(tv + ' from ' + from, '从' + from + '取 ' + tv, from + 'から ' + tv);
      var dil = vText(total[j] - transfer[j]);
      rows += '<tr><td>#' + (j + 1) + '</td><td>' + P.fmt(conc, 4) + '</td><td>' + P.esc(tr) + '</td><td>' + dil + '</td></tr>';
      tsv.push(['#' + (j + 1), P.plain(conc), tr, dil].join('\t'));
    }
    var stockNeeded = transfer[0];
    out.innerHTML = '<div class="tl-table-wrap"><table class="tl-table"><thead><tr><th>' + T('Tube', '管', 'チューブ') + '</th><th>' +
      P.esc(T('Conc.', '浓度', '濃度')) + ' (' + P.esc(u) + ')</th><th>' + T('Transfer in', '转入', '移す量') + '</th><th>' + T('Diluent', '稀释液', '溶媒') +
      '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="tl-note" style="margin-top:12px">' + P.esc(T('Put the diluent in every tube first, then transfer and mix tube by tube. Stock needed: ',
        '先在每管加好稀释液，再逐管转移并混匀。需要原液：', '先に各チューブに溶媒を入れ、1 本ずつ移して混ぜます。必要な原液：') + vText(stockNeeded)) +
      P.esc(T('. Diluent in total: ', '；稀释液共 ', '。溶媒の合計：')) + vText(total.reduce(function (a, t, i) { return a + t - transfer[i]; }, 0)) + P.esc(T('.', '。', '。')) + '</p>' +
      '<div class="tl-btns"><button type="button" class="tl-btn" id="sCopy">' + T('Copy table', '复制表格', '表をコピー') + '</button></div>';
    $('sCopy').onclick = function () { P.copy(tsv.join('\n'), this); };
  }

  setSolve();
  P.live('main', function () { render(); serial(); });
})();
