/* Molarity calculator: mass = concentration × volume × molecular weight */
(function () {
  'use strict';
  var P = window.PTools, T = P.T, $ = function (id) { return document.getElementById(id); };
  var solve = P.seg('solve', function () { setSolve(); render(); });
  var map = { mass: 'mass', conc: 'conc', vol: 'vol' };

  function setSolve() {
    var s = solve();
    Object.keys(map).forEach(function (k) {
      var el = $(map[k]), box = el.closest('.tl-in');
      var on = k === s;
      el.readOnly = on; box.classList.toggle('solve', on);
      if (on) el.value = '';
    });
  }

  function render() {
    var s = solve(), mw = P.val('mw');
    var c = P.val('conc') * P.U.molar[$('concU').value];
    var v = P.val('vol') * P.U.vol[$('volU').value];
    var m = P.val('mass') * P.U.mass[$('massU').value];
    var out = $('out'), res, big, sub;
    if (!(mw > 0)) { out.innerHTML = msg(T('Enter the molecular weight.', '请输入分子量。', '分子量を入力してください。')); return; }
    if (s === 'mass') {
      res = c * v * mw;
      if (!(res >= 0) || !(c > 0) || !(v > 0)) { out.innerHTML = msg(T('Enter concentration and volume.', '请输入浓度和体积。', '濃度と体積を入力してください。')); $('mass').value = ''; return; }
      var b = P.bestMass(res);
      $('mass').value = P.plain(res / P.U.mass[$('massU').value]);
      big = P.fmt(b.v, 4) + '<small>' + b.u + '</small>';
      sub = T('Weigh this out and make up to ', '称取后定容到 ', '量り取り、') + P.fmt(P.val('vol'), 4) + ' ' + $('volU').value + T('.', '。', ' にメスアップします。');
      show(T('Weigh out', '称取', '量り取る量'), big, sub, res, c, v, mw);
    } else if (s === 'conc') {
      res = m / (v * mw);
      if (!(m > 0) || !(v > 0)) { out.innerHTML = msg(T('Enter mass and volume.', '请输入质量和体积。', '質量と体積を入力してください。')); $('conc').value = ''; return; }
      var bc = P.bestMolar(res); $('conc').value = P.plain(res / P.U.molar[$('concU').value]);
      show(T('Concentration', '浓度', '濃度'), P.fmt(bc.v, 4) + '<small>' + bc.u + '</small>', '', m, res, v, mw);
    } else {
      res = m / (c * mw);
      if (!(m > 0) || !(c > 0)) { out.innerHTML = msg(T('Enter mass and concentration.', '请输入质量和浓度。', '質量と濃度を入力してください。')); $('vol').value = ''; return; }
      var bv = P.bestVol(res); $('vol').value = P.plain(res / P.U.vol[$('volU').value]);
      show(T('Make up to', '定容到', 'メスアップ量'), P.fmt(bv.v, 4) + '<small>' + bv.u + '</small>', '', m, c, res, mw);
    }
  }
  function msg(t) { return '<p class="tl-note">' + P.esc(t) + '</p>'; }
  function show(k, big, sub, mass, conc, vol, mw) {
    var mc = mass / vol; /* g/L = mg/mL */
    var mmol = conc * vol * 1e3;
    $('out').innerHTML = '<div class="tl-big"><span class="k">' + P.esc(k) + '</span><span class="v">' + big + '</span>' +
      (sub ? '<span class="s">' + P.esc(sub) + '</span>' : '') + '</div>' +
      '<dl class="tl-kv">' +
      '<dt>' + T('Amount', '物质的量', '物質量') + '</dt><dd>' + amount(mmol) + '</dd>' +
      '<dt>' + T('Mass concentration', '质量浓度', '質量濃度') + '</dt><dd>' + P.fmt(mc, 4) + ' mg/mL</dd>' +
      '<dt>' + T('Percent (w/v)', '质量体积百分比 (w/v)', '重量/体積 %') + '</dt><dd>' + P.fmt(mc / 10, 4) + ' %</dd>' +
      '</dl>';
  }
  function amount(mmol) {
    if (mmol >= 1000) return P.fmt(mmol / 1000, 4) + ' mol';
    if (mmol >= 1) return P.fmt(mmol, 4) + ' mmol';
    if (mmol >= 1e-3) return P.fmt(mmol * 1e3, 4) + ' µmol';
    return P.fmt(mmol * 1e6, 4) + ' nmol';
  }
  setSolve();
  P.live('main', function (ev) {
    if (ev && ev.target && ev.target.id === solve()) return;
    render();
  });
})();
