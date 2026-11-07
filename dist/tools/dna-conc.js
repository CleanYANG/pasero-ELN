/* DNA / RNA concentration converter: ng/µL <-> nM <-> copies/µL */
(function () {
  'use strict';
  var P = window.PTools, T = P.T, $ = function (id) { return document.getElementById(id); };
  var NA = 6.02214076e23;
  var MW = {
    ds: function (n) { return n * 617.96 + 36.04; },
    ss: function (n) { return n * 308.97 + 18.02; },
    rna: function (n) { return n * 320.5 + 159.0; }
  };
  var kind = P.seg('kind', function () { render(); });

  function render() {
    var k = kind(), len = P.val('len'), v = P.val('cv'), u = $('cu').value, out = $('out');
    $('lenU').textContent = k === 'ds' ? 'bp' : 'nt';
    if (!(len > 0 && v > 0)) {
      out.innerHTML = '<p class="tl-note">' + P.esc(T('Enter the length and a concentration.', '请填写长度和浓度。', '長さと濃度を入力してください。')) + '</p>';
      return;
    }
    var mw = MW[k](len);                       /* g/mol */
    var ngul, nM, cpu;
    if (u === 'ng/µL') { ngul = v; nM = v * 1e6 / mw; }
    else if (u === 'nM') { nM = v; ngul = v * mw / 1e6; }
    else { cpu = v; nM = v / NA * 1e6 * 1e9; ngul = nM * mw / 1e6; }
    cpu = nM * 1e-9 * 1e-6 * NA;               /* mol/L -> mol/µL -> copies/µL */
    var copyMassG = mw / NA;
    var rows = [
      ['ng/µL', P.fmt(ngul, 4)],
      ['nM', P.fmt(nM, 4)],
      [T('copies/µL', '拷贝/µL', 'コピー/µL'), P.fmt(cpu, 4)],
      ['pmol/µg', P.fmt(1e6 / mw, 4)],
      [T('Molecular weight', '分子量', '分子量'), P.fmt(mw, 6) + ' g/mol'],
      [T('One molecule weighs', '单个分子质量', '1 分子の質量'), P.fmt(copyMassG * 1e15, 4) + ' fg']
    ];
    var main = u === 'nM' ? ['ng/µL', P.fmt(ngul, 4)] : ['nM', P.fmt(nM, 4)];
    out.innerHTML = '<div class="tl-big"><span class="k">' + P.esc(main[0]) + '</span><span class="v">' + main[1] + '</span>' +
      '<span class="s">' + P.fmt(cpu, 3) + ' ' + P.esc(T('copies/µL', '拷贝/µL', 'コピー/µL')) + '</span></div>' +
      '<dl class="tl-kv">' + rows.map(function (r) { return '<dt>' + P.esc(r[0]) + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>' +
      '<h3>' + T('Dilute to a target', '稀释到目标浓度', '目標濃度への希釈') + '</h3>' +
      '<p class="tl-note">' + P.esc(T('Need 10 nM for a library pool or 10⁶ copies/µL for a standard? Use the',
        '文库混样要 10 nM，或者标准曲线要 10⁶ 拷贝/µL？用', 'ライブラリのプールに 10 nM、検量線に 10⁶ コピー/µL が必要なら、')) +
      ' <a href="dilution-calculator.html" style="color:#6f58a8;text-decoration:underline">' + P.esc(T('dilution calculator', '稀释计算器', '希釈計算')) + '</a>' +
      P.esc(T(' with the values above.', '，填入上面的数值即可。', 'で上の値を使ってください。')) + '</p>';
  }
  P.live('main', render);
})();
