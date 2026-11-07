/* Cell counting (hemocytometer) and seeding calculator */
(function () {
  'use strict';
  var P = window.PTools, T = P.T, $ = function (id) { return document.getElementById(id); };
  var PLATES = [
    ['96', { en: '96-well plate', zh: '96 孔板', ja: '96 ウェルプレート' }, 96, 100, 'µL'],
    ['48', { en: '48-well plate', zh: '48 孔板', ja: '48 ウェルプレート' }, 48, 300, 'µL'],
    ['24', { en: '24-well plate', zh: '24 孔板', ja: '24 ウェルプレート' }, 24, 500, 'µL'],
    ['12', { en: '12-well plate', zh: '12 孔板', ja: '12 ウェルプレート' }, 12, 1, 'mL'],
    ['6', { en: '6-well plate', zh: '6 孔板', ja: '6 ウェルプレート' }, 6, 2, 'mL'],
    ['d35', { en: '35 mm dish', zh: '35 mm 皿', ja: '35 mm ディッシュ' }, 1, 2, 'mL'],
    ['d60', { en: '60 mm dish', zh: '60 mm 皿', ja: '60 mm ディッシュ' }, 1, 4, 'mL'],
    ['d100', { en: '100 mm dish', zh: '100 mm 皿', ja: '100 mm ディッシュ' }, 1, 10, 'mL'],
    ['t25', { en: 'T25 flask', zh: 'T25 培养瓶', ja: 'T25 フラスコ' }, 1, 5, 'mL'],
    ['t75', { en: 'T75 flask', zh: 'T75 培养瓶', ja: 'T75 フラスコ' }, 1, 12, 'mL'],
    ['custom', { en: 'Other', zh: '其他', ja: 'その他' }, null, null, null]
  ];
  var plate = $('plate');
  function fillPlates() {
    var v = plate.value || '24';
    plate.innerHTML = PLATES.map(function (p) { return '<option value="' + p[0] + '">' + P.esc(T(p[1])) + '</option>'; }).join('');
    plate.value = v;
  }
  plate.addEventListener('change', function () {
    var p = PLATES.filter(function (x) { return x[0] === plate.value; })[0];
    if (p && p[2]) { $('wells').value = p[2]; $('vpw').value = p[3]; $('vpwU').value = p[4]; }
  });
  var mode = P.seg('mode', function (v) { $('hemoBox').hidden = v !== 'hemo'; $('directBox').hidden = v === 'hemo'; render(); });

  function counts(id) {
    return String($(id).value || '').split(/[\s,;，、]+/).map(P.num).filter(function (x) { return isFinite(x) && x >= 0; });
  }
  function cellsText(x) { return P.fmt(x, 3); }

  function count() {
    var out = $('countOut');
    if (mode() === 'direct') {
      var d = P.val('direct');
      out.innerHTML = '';
      return d > 0 ? { perMl: d } : null;
    }
    var live = counts('live'), dead = counts('dead'), df = P.val('df');
    if (!live.length || !(df > 0)) {
      out.innerHTML = '<p class="tl-note">' + P.esc(T('Enter the live counts and the dilution factor.', '请填写活细胞计数和稀释倍数。', '生細胞のカウントと希釈倍率を入力してください。')) + '</p>';
      return null;
    }
    var mLive = live.reduce(function (a, b) { return a + b; }, 0) / live.length;
    var perMl = mLive * df * 1e4;
    var html = '<div class="tl-big" style="margin-top:6px"><span class="k">' + P.esc(T('Live cells', '活细胞', '生細胞')) + '</span><span class="v">' + cellsText(perMl) +
      '<small>' + P.esc(T('cells/mL', '个/mL', '個/mL')) + '</small></span><span class="s">' +
      P.esc(T('Mean ' + P.fmt(mLive, 4) + ' per square × ' + P.fmt(df, 3) + ' × 10⁴', '每格平均 ' + P.fmt(mLive, 4) + ' 个 × ' + P.fmt(df, 3) + ' × 10⁴', '1 区画平均 ' + P.fmt(mLive, 4) + ' 個 × ' + P.fmt(df, 3) + ' × 10⁴')) + '</span></div>';
    var warn = '';
    if (dead.length) {
      var mDead = dead.reduce(function (a, b) { return a + b; }, 0) / dead.length;
      var via = mLive / (mLive + mDead) * 100;
      html += '<dl class="tl-kv"><dt>' + T('Viability', '活率', '生存率') + '</dt><dd>' + P.fixed(via, 1) + ' %</dd>' +
        '<dt>' + T('Total cells', '总细胞', '総細胞数') + '</dt><dd>' + cellsText((mLive + mDead) * df * 1e4) + ' ' + P.esc(T('cells/mL', '个/mL', '個/mL')) + '</dd></dl>';
      if (via < 80) warn = T('Viability below 80%. Check the culture before seeding an experiment.', '活率低于 80%，铺板做实验前先检查一下细胞状态。', '生存率が 80% 未満です。実験に使う前に細胞の状態を確認してください。');
    }
    if (mLive < 20 || mLive > 200) warn = (warn ? warn + ' ' : '') + T('Counts are most reliable at about 20–200 cells per square; adjust the dilution if you are far outside that.',
      '每格约 20–200 个细胞时计数最准，偏离太多建议调整稀释倍数。', '1 区画 20〜200 個程度が最も正確です。大きく外れる場合は希釈を調整してください。');
    out.innerHTML = html + '<p class="tl-warn">' + P.esc(warn) + '</p>';
    return { perMl: perMl };
  }

  function render() {
    var c = count(), out = $('seedOut');
    var wells = Math.round(P.val('wells')), cpw = P.val('cpw'), vpw = P.val('vpw') * ($('vpwU').value === 'mL' ? 1e-3 : 1e-6), extra = P.val('extra');
    if (!(extra >= 0)) extra = 0;
    if (!c) { out.innerHTML = '<p class="tl-note">' + P.esc(T('Count the cells first.', '请先完成细胞计数。', 'まず細胞を数えてください。')) + '</p>'; return; }
    if (!(wells >= 1 && cpw > 0 && vpw > 0)) { out.innerHTML = '<p class="tl-note">' + P.esc(T('Enter wells, cells per well and medium per well.', '请填写孔数、每孔细胞数和每孔培养基体积。', 'ウェル数、1 ウェルあたりの細胞数と培地量を入力してください。')) + '</p>'; return; }
    var n = wells * (1 + extra / 100);
    var cells = n * cpw, totalL = n * vpw, suspL = cells / c.perMl / 1e3; /* perMl -> per L: ×1e3 */
    var mediumL = totalL - suspL;
    var density = cpw / (vpw * 1e3); /* cells per mL in the mix */
    var vol = function (l) { if (!(l > 0)) return '0 µL'; var b = P.bestVol(l); return P.fmt(b.v, 4) + ' ' + b.u; };
    var html = '<div class="tl-big"><span class="k">' + P.esc(T('Cell suspension', '细胞悬液', '細胞懸濁液')) + '</span><span class="v">' + vol(suspL).replace(' ', '<small>') + '</small></span>' +
      '<span class="s">' + (mediumL < 0 ? P.esc(T('More than the total volume — see below.', '超过了总体积，见下方提示。', '全量を超えています（下の注意を参照）。')) : P.esc(T('+ ' + vol(Math.max(mediumL, 0)) + ' medium = ' + vol(totalL), '+ ' + vol(Math.max(mediumL, 0)) + ' 培养基 = ' + vol(totalL), '+ 培地 ' + vol(Math.max(mediumL, 0)) + ' = ' + vol(totalL)))) + '</span></div>';
    var steps = mediumL < 0 ? [] : [
      T('Mix ' + vol(suspL) + ' of cell suspension with ' + vol(Math.max(mediumL, 0)) + ' of medium (' + P.fmt(n, 4) + ' wells’ worth, ' + P.fmt(extra, 3) + '% extra).',
        '取 ' + vol(suspL) + ' 细胞悬液，加 ' + vol(Math.max(mediumL, 0)) + ' 培养基混匀（按 ' + P.fmt(n, 4) + ' 孔配制，含 ' + P.fmt(extra, 3) + '% 余量）。',
        '細胞懸濁液 ' + vol(suspL) + ' と培地 ' + vol(Math.max(mediumL, 0)) + ' を混ぜます（' + P.fmt(n, 4) + ' ウェル分、余裕分 ' + P.fmt(extra, 3) + '%）。'),
      T('The mix is ' + cellsText(density) + ' cells/mL.', '混合后细胞浓度为 ' + cellsText(density) + ' 个/mL。', '混合後の細胞濃度は ' + cellsText(density) + ' 個/mL です。'),
      T('Add ' + vol(vpw) + ' to each of ' + wells + ' wells (' + cellsText(cpw) + ' cells each).', '每孔加 ' + vol(vpw) + '，共 ' + wells + ' 孔（每孔 ' + cellsText(cpw) + ' 个细胞）。', '各ウェルに ' + vol(vpw) + ' ずつ、' + wells + ' ウェルに加えます（1 ウェル ' + cellsText(cpw) + ' 個）。')
    ];
    var warn = '';
    if (mediumL < 0) warn = T('The cells are too dilute for this volume. Spin them down and resuspend at ' + cellsText(density) + ' cells/mL or higher.',
      '细胞太稀，装不下这个体积。离心后用更少的培养基重悬，浓度至少 ' + cellsText(density) + ' 个/mL。',
      '細胞が薄すぎてこの量に収まりません。遠心して、' + cellsText(density) + ' 個/mL 以上で再懸濁してください。');
    else if (suspL < 2e-6) warn = T('Less than 2 µL of suspension is hard to pipette accurately; dilute the cells first.', '细胞悬液不到 2 µL，很难移准，建议先稀释。', '細胞懸濁液が 2 µL 未満で正確に量りにくいので、先に希釈してください。');
    html += '<ol class="tl-steps">' + steps.map(function (s) { return '<li>' + P.esc(s) + '</li>'; }).join('') + '</ol><p class="tl-warn">' + P.esc(warn) + '</p>' +
      '<p class="tl-note" style="margin-top:10px">' + P.esc(T('Mix the tube gently between wells so the cells don’t settle.', '分装时轻轻混匀，避免细胞沉底。', 'ウェルごとに軽く混ぜて、細胞が沈まないようにします。')) + '</p>';
    out.innerHTML = html;
  }
  fillPlates();
  P.onLang(fillPlates);
  P.live('main', render);
})();
