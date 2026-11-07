/* Ligation calculator: insert ng = vector ng × (insert bp / vector bp) × ratio */
(function () {
  'use strict';
  var P = window.PTools, T = P.T, $ = function (id) { return document.getElementById(id); };
  function mwDs(bp) { return bp * 617.96 + 36.04; }
  function ul(v) { return P.fmt(v, 3) + ' µL'; }

  function render() {
    var vLen = P.val('vLen'), vNg = P.val('vNg'), iLen = P.val('iLen'), ratio = P.val('ratio');
    var vConc = P.val('vConc'), iConc = P.val('iConc'), rxn = P.val('rxn'), buf = P.val('buf') || 0, lig = P.val('lig') || 0;
    var out = $('out');
    if (!(vLen > 0 && vNg > 0 && iLen > 0 && ratio > 0)) {
      out.innerHTML = '<p class="tl-note">' + P.esc(T('Enter both lengths, the vector amount and the ratio.', '请填写两个长度、载体用量和摩尔比。', '2 つの長さ、ベクター量、モル比を入力してください。')) + '</p>';
      return;
    }
    var iNg = vNg * (iLen / vLen) * ratio;
    var vPmol = vNg * 1000 / mwDs(vLen), iPmol = iNg * 1000 / mwDs(iLen);
    var html = '<div class="tl-big"><span class="k">' + P.esc(T('Insert to add', '插入片段用量', 'インサート量')) + '</span><span class="v">' + P.fmt(iNg, 3) + '<small>ng</small></span>' +
      '<span class="s">' + P.esc(T('for ', '对应载体 ', 'ベクター ')) + P.fmt(vNg, 4) + ' ng ' + P.esc(T('vector at ', '，摩尔比 ', '、モル比 ')) + P.fmt(ratio, 3) + ' : 1' + P.esc(T('', '', '')) + '</span></div>' +
      '<dl class="tl-kv"><dt>' + T('Vector', '载体', 'ベクター') + '</dt><dd>' + P.fmt(vPmol * 1000, 4) + ' fmol</dd>' +
      '<dt>' + T('Insert', '插入片段', 'インサート') + '</dt><dd>' + P.fmt(iPmol * 1000, 4) + ' fmol</dd></dl>';
    var steps = [], warn = '';
    if (vConc > 0 && iConc > 0) {
      var vVol = vNg / vConc, iVol = iNg / iConc;
      steps.push(T('Vector: ', '载体：', 'ベクター：') + ul(vVol));
      steps.push(T('Insert: ', '插入片段：', 'インサート：') + ul(iVol));
      if (rxn > 0) {
        var water = rxn - buf - lig - vVol - iVol;
        if (buf > 0) steps.push(T('Buffer: ', '缓冲液：', 'バッファー：') + ul(buf));
        if (lig > 0) steps.push(T('Ligase: ', '连接酶：', 'リガーゼ：') + ul(lig));
        steps.push(T('Water to ', '加水补足到 ', '水で全量 ') + ul(rxn) + T(': ', '：', ' に：') + (water >= 0 ? ul(water) : '—'));
        if (water < 0) warn = T('The DNA does not fit in this reaction volume. Use more concentrated DNA, less vector, or a larger reaction.',
          'DNA 体积超出了反应总体积。可以用更浓的 DNA、减少载体用量，或增大反应体积。',
          'DNA がこの反応液量に収まりません。DNA を濃くするか、ベクター量を減らすか、反応液量を増やしてください。');
      }
      if (vVol < 0.5 || iVol < 0.5) warn = (warn ? warn + ' ' : '') + T('Volumes under 0.5 µL are hard to pipette; dilute the DNA first.',
        '不到 0.5 µL 很难移准，建议先稀释 DNA。', '0.5 µL 未満は量りにくいので、先に DNA を希釈してください。');
    }
    if (steps.length) html += '<h3>' + T('Pipetting', '加样', '添加量') + '</h3><ul class="tl-steps">' + steps.map(function (s) { return '<li>' + P.esc(s) + '</li>'; }).join('') + '</ul>';
    html += '<p class="tl-warn">' + P.esc(warn) + '</p>';
    /* quick comparison of common ratios */
    var rs = [1, 3, 5, 7];
    html += '<h3>' + T('Other ratios', '其他摩尔比', 'ほかのモル比') + '</h3><div class="tl-table-wrap"><table class="tl-table"><thead><tr><th>' +
      T('Ratio', '摩尔比', 'モル比') + '</th><th>' + T('Insert (ng)', '插入片段 (ng)', 'インサート (ng)') + '</th>' +
      (iConc > 0 ? '<th>' + T('Insert (µL)', '插入片段 (µL)', 'インサート (µL)') + '</th>' : '') + '</tr></thead><tbody>' +
      rs.map(function (r) {
        var ng = vNg * (iLen / vLen) * r;
        return '<tr><td>' + r + ' : 1</td><td>' + P.fmt(ng, 3) + '</td>' + (iConc > 0 ? '<td>' + P.fmt(ng / iConc, 3) + '</td>' : '') + '</tr>';
      }).join('') + '</tbody></table></div>';
    out.innerHTML = html;
  }
  P.live('main', render);
})();
