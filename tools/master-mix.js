/* Master mix calculator */
(function () {
  'use strict';
  var P = window.PTools, T = P.T, $ = function (id) { return document.getElementById(id); };
  var PRESETS = {
    pcr: { total: 25, rows: [
      [['2× PCR master mix', '2× PCR 预混液', '2× PCR マスターミックス'], 12.5],
      [['Forward primer (10 µM)', '正向引物 (10 µM)', 'フォワードプライマー (10 µM)'], 1],
      [['Reverse primer (10 µM)', '反向引物 (10 µM)', 'リバースプライマー (10 µM)'], 1],
      [['Template DNA', '模板 DNA', 'テンプレート DNA'], 1, 'tube'],
      [['Nuclease-free water', '无酶水', 'ヌクレアーゼフリー水'], 0, 'fill']] },
    qpcr: { total: 20, rows: [
      [['2× SYBR Green mix', '2× SYBR Green 预混液', '2× SYBR Green ミックス'], 10],
      [['Forward primer (10 µM)', '正向引物 (10 µM)', 'フォワードプライマー (10 µM)'], 0.4],
      [['Reverse primer (10 µM)', '反向引物 (10 µM)', 'リバースプライマー (10 µM)'], 0.4],
      [['cDNA', 'cDNA', 'cDNA'], 2, 'tube'],
      [['Nuclease-free water', '无酶水', 'ヌクレアーゼフリー水'], 0, 'fill']] },
    digest: { total: 50, rows: [
      [['10× reaction buffer', '10× 反应缓冲液', '10× 反応バッファー'], 5],
      [['Enzyme 1', '酶 1', '酵素 1'], 1],
      [['Enzyme 2', '酶 2', '酵素 2'], 1],
      [['DNA (1 µg)', 'DNA (1 µg)', 'DNA (1 µg)'], 5, 'tube'],
      [['Nuclease-free water', '无酶水', 'ヌクレアーゼフリー水'], 0, 'fill']] },
    blank: { total: 20, rows: [
      [['', '', ''], ''],
      [['Water', '水', '水'], 0, 'fill']] }
  };
  var body = document.querySelector('#mmTable tbody');

  function rowHtml(name, vol, flag) {
    return '<tr><td><input class="mm-name" value="' + P.esc(name) + '" aria-label="' + P.esc(T('Component', '组分', '成分')) + '" placeholder="' +
      P.esc(T('Component', '组分', '成分')) + '"></td>' +
      '<td><input class="mm-vol" inputmode="decimal" autocomplete="off" value="' + P.esc(String(vol)) + '" aria-label="µL"></td>' +
      '<td style="text-align:center"><input type="checkbox" class="mm-tube"' + (flag === 'tube' ? ' checked' : '') + ' style="width:17px;min-width:0;accent-color:#1e4937"></td>' +
      '<td style="text-align:center"><input type="radio" name="mm-fill" class="mm-fill"' + (flag === 'fill' ? ' checked' : '') + ' style="width:17px;min-width:0;accent-color:#1e4937"></td>' +
      '<td><button type="button" class="tl-x" aria-label="' + P.esc(T('Remove', '删除', '削除')) + '">×</button></td></tr>';
  }
  function load(key) {
    var p = PRESETS[key]; $('total').value = p.total;
    body.innerHTML = p.rows.map(function (r) { return rowHtml(T({ en: r[0][0], zh: r[0][1], ja: r[0][2] }), r[1], r[2]); }).join('');
    render();
  }
  function rows() {
    return Array.prototype.map.call(body.querySelectorAll('tr'), function (tr) {
      return { tr: tr, name: tr.querySelector('.mm-name').value.trim(), vol: P.num(tr.querySelector('.mm-vol').value) || 0,
        tube: tr.querySelector('.mm-tube').checked, fill: tr.querySelector('.mm-fill').checked };
    });
  }
  function render() {
    var list = rows(), n = Math.round(P.val('n')), extra = P.val('extra'), total = P.val('total'), out = $('out');
    if (!(n >= 1) || !(total > 0)) { out.innerHTML = '<p class="tl-note">' + P.esc(T('Enter the number of reactions and the volume per reaction.', '请填写反应数和每个反应的体积。', '反応数と 1 反応あたりの量を入力してください。')) + '</p>'; return; }
    if (!(extra >= 0)) extra = 0;
    var fill = list.filter(function (r) { return r.fill; })[0];
    var fixedSum = list.reduce(function (s, r) { return s + (r.fill ? 0 : r.vol); }, 0);
    if (fill) { fill.vol = total - fixedSum; fill.tr.querySelector('.mm-vol').value = P.plain(Math.round(fill.vol * 1000) / 1000); }
    fill && (fill.tr.querySelector('.mm-vol').readOnly = true);
    list.forEach(function (r) { if (!r.fill) r.tr.querySelector('.mm-vol').readOnly = false; });
    var sum = list.reduce(function (s, r) { return s + r.vol; }, 0);
    var mult = n * (1 + extra / 100);
    var mix = list.filter(function (r) { return !r.tube && (r.name || r.vol); });
    var tube = list.filter(function (r) { return r.tube && (r.name || r.vol); });
    var mixPer = mix.reduce(function (s, r) { return s + r.vol; }, 0);
    var tsv = [[T('Component', '组分', '成分'), T('Per reaction (µL)', '每个反应 (µL)', '1 反応 (µL)'), T('Master mix (µL)', '预混液 (µL)', 'マスターミックス (µL)')].join('\t')];
    var trs = mix.map(function (r) {
      var v = r.vol * mult;
      tsv.push([r.name, P.plain(r.vol), v.toFixed(1)].join('\t'));
      if (r.vol < 0) return '<tr><td>' + P.esc(r.name || '—') + '</td><td>—</td><td>—</td></tr>';
      return '<tr><td>' + P.esc(r.name || '—') + '</td><td>' + P.fmt(r.vol, 4) + '</td><td><strong>' + v.toFixed(1) + '</strong></td></tr>';
    }).join('');
    var warn = '';
    if (fill && fill.vol < -1e-9) warn = T('The components add up to more than the reaction volume, so there is no room for water.',
      '各组分加起来已经超过反应总体积，没有空间加水了。', '成分の合計が反応液量を超えていて、水を入れる余地がありません。');
    else if (!fill && Math.abs(sum - total) > 1e-6) warn = T('Components add up to ', '各组分合计 ', '成分の合計は ') + P.fmt(sum, 4) +
      T(' µL, not ', ' µL，不等于 ', ' µL で、') + P.fmt(total, 4) + T(' µL. Tick “fill to volume” on the water row.', ' µL。可以在水那一行勾选“补足到总体积”。', ' µL と一致しません。水の行で「全量まで調整」を選んでください。');
    var per = mixPer;
    var steps = [T('Mix the components above for ', '按上表配制 ', '上の成分で ') + P.fmt(mult, 4) + T(' reactions (' + n + ' + ' + P.fmt(extra, 3) + '% extra).', ' 个反应的预混液（' + n + ' 个 + ' + P.fmt(extra, 3) + '% 余量）。', ' 反応分（' + n + ' 反応 + ' + P.fmt(extra, 3) + '% 余裕分）のミックスを作ります。'),
      T('Dispense ', '每管分装 ', '各チューブに ') + P.fmt(per, 4) + T(' µL into each of ' + n + ' tubes.', ' µL，共 ' + n + ' 管。', ' µL ずつ、' + n + ' 本に分注します。')];
    tube.forEach(function (r) { steps.push(T('Add ', '每管再加 ', '各チューブに ') + P.fmt(r.vol, 4) + T(' µL ' + r.name + ' to each tube.', ' µL ' + r.name + '。', ' µL の ' + r.name + ' を加えます。')); });
    out.innerHTML = '<div class="tl-table-wrap"><table class="tl-table"><thead><tr><th>' + T('Component', '组分', '成分') + '</th><th>' +
      T('Per reaction (µL)', '每个反应 (µL)', '1 反応 (µL)') + '</th><th>' + T('Master mix (µL)', '预混液 (µL)', 'マスターミックス (µL)') + '</th></tr></thead><tbody>' + trs +
      '</tbody><tfoot><tr><td>' + T('Total', '合计', '合計') + '</td><td>' + P.fmt(mixPer, 4) + '</td><td>' + (mixPer * mult).toFixed(1) + '</td></tr></tfoot></table></div>' +
      '<ol class="tl-steps">' + steps.map(function (s) { return '<li>' + P.esc(s) + '</li>'; }).join('') + '</ol>' +
      '<p class="tl-warn">' + P.esc(warn) + '</p>' +
      '<div class="tl-btns"><button type="button" class="tl-btn" id="copy">' + T('Copy table', '复制表格', '表をコピー') + '</button></div>';
    $('copy').onclick = function () { P.copy(tsv.join('\n'), this); };
  }

  var preset = P.seg('preset', function (v) { load(v); });
  body.addEventListener('click', function (ev) {
    var x = ev.target.closest('.tl-x'); if (!x) return;
    x.closest('tr').remove(); render();
  });
  $('addRow').addEventListener('click', function () {
    var fillRow = body.querySelector('.mm-fill:checked');
    var tmp = document.createElement('tbody'); tmp.innerHTML = rowHtml('', '', null);
    var tr = tmp.firstChild;
    if (fillRow) body.insertBefore(tr, fillRow.closest('tr')); else body.appendChild(tr);
    tr.querySelector('.mm-name').focus(); render();
  });
  /* names follow the language only while they are untouched preset names */
  P.onLang(function () {
    var key = preset(); var p = PRESETS[key]; if (!p) return;
    var trs = body.querySelectorAll('tr');
    p.rows.forEach(function (r, i) {
      var inp = trs[i] && trs[i].querySelector('.mm-name');
      if (inp && r[0].indexOf(inp.value) >= 0) inp.value = T({ en: r[0][0], zh: r[0][1], ja: r[0][2] });
    });
  });
  var main = document.querySelector('main');
  main.addEventListener('input', render); main.addEventListener('change', render);
  P.onLang(render);
  load('pcr');
})();
