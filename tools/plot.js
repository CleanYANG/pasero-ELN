/* Paste to plot: group comparison figure with the recommended test, in the browser only.
   Mirrors Pasero desktop defaults: mean ± SEM with every point, Okabe–Ito colours with a grey
   control, 2 groups -> Welch t-test, 3+ groups -> one-way ANOVA with Dunnett (vs control) or
   Tukey HSD (all pairs). Nothing is uploaded; the page's CSP blocks all network requests. */
(function () {
  'use strict';
  var P = window.PTools, S = window.PStats, PS = window.PPlotStats, T = P.T;
  var $ = function (id) { return document.getElementById(id); };
  var EXAMPLE = $('paste').value;
  var PALETTE = ['#0072B2', '#E69F00', '#009E73', '#D55E00', '#CC79A7', '#56B4E9', '#F0E442', '#000000'];
  var GREY = '#9E9E9E';
  var CONTROL_RE = /(^|[^a-z])(control|ctrl|untreated|vehicle|mock|wild[\s-]?type|wt|dmso|nc|neg(ative)?|empty|vector|scramble[d]?|sham|baseline|pbs|saline|sicontrol|sictrl|shcontrol|shctrl|sinc|shnc)([^a-z]|$)|对照|対照|コントロール/i;
  var SUBJECT_RE = /patient|subject|donor|mouse|mice|animal|individual|participant|pair|case|rat|^id$|_id$|\bid\b|患者|受试者|小鼠|个体|被験者|マウス|個体/i;
  var IDLIKE_RE = /^(rep(licate)?|biological[_\s]?replicate|well|no\.?|#|index|n|sample[_\s]?(no|number))$/i;
  var state = { chart: 'dot', err: 'sem', test: 'param', touchedChart: false, lastSig: '' };

  /* ------------------------------------------------------------ parsing */
  function isNum(c) { return isFinite(P.num(c)); }
  function parse(text) {
    var rows = P.parseTable(text).filter(function (r) { return r.some(function (c) { return String(c).trim() !== ''; }); });
    if (!rows.length) return null;
    var width = Math.max.apply(null, rows.map(function (r) { return r.length; }));
    var header = rows[0].some(function (c) { return String(c).trim() !== '' && !isNum(c); }) ? rows[0] : null;
    var body = header ? rows.slice(1) : rows;
    if (!body.length) return null;
    var cols = [];
    for (var c = 0; c < width; c++) {
      var cells = body.map(function (r) { return r[c] === undefined ? '' : String(r[c]).trim(); });
      var filled = cells.filter(function (x) { return x !== '' && !/^(na|n\/a|nan|undetermined|-|—)$/i.test(x); });
      var nums = filled.filter(isNum);
      var uniq = {}; filled.forEach(function (x) { uniq[x] = 1; });
      cols.push({ i: c, name: header && String(header[c] || '').trim() || '', cells: cells, filled: filled.length,
        numFrac: filled.length ? nums.length / filled.length : 0, uniq: Object.keys(uniq).length });
    }
    cols = cols.filter(function (x) { return x.filled > 0; });
    var textCols = cols.filter(function (x) { return x.numFrac < 0.5; });
    var numCols = cols.filter(function (x) { return x.numFrac >= 0.8; });
    var groupCol = textCols.find(function (x) { return x.uniq >= 2 && x.uniq <= 24 && x.uniq < x.filled; });
    if (groupCol && numCols.length) return parseLong(body, cols, groupCol, numCols);
    if (numCols.length >= 2) return parseWide(body, cols, numCols, textCols, header);
    return { error: 'shape' };
  }
  function parseLong(body, cols, gc, numCols) {
    var candidates = numCols.filter(function (x) { return !IDLIKE_RE.test(x.name); });
    if (!candidates.length) candidates = numCols;
    var varying = candidates.filter(function (x) { return x.uniq > 1; });
    var chosen = $('valueCol').value, vc = candidates.find(function (x) { return String(x.i) === chosen; }) || varying[0] || candidates[0];
    var order = [], map = {}, skipped = 0;
    body.forEach(function (r, ri) {
      var g = String(r[gc.i] === undefined ? '' : r[gc.i]).trim(), v = P.num(r[vc.i]);
      if (!g) return;
      if (!(g in map)) { map[g] = []; order.push(g); }
      if (isFinite(v)) map[g].push({ v: v, row: ri }); else if (String(r[vc.i] || '').trim()) skipped++;
    });
    /* A subject column: repeats across groups, at most once per group */
    var subj = cols.find(function (x) {
      if (x === gc || x === vc || !SUBJECT_RE.test(x.name) && x.numFrac >= 0.5) return false;
      var seen = {}, ok = true, repeats = false;
      body.forEach(function (r) {
        var s = String(r[x.i] || '').trim(), g = String(r[gc.i] || '').trim(); if (!s || !g) return;
        var key = s + '\u0000' + g; if (seen[key]) ok = false; seen[key] = 1;
      });
      var per = {}; body.forEach(function (r) { var s = String(r[x.i] || '').trim(); if (s) per[s] = (per[s] || 0) + 1; });
      repeats = Object.keys(per).some(function (k) { return per[k] > 1; });
      return ok && repeats && x.uniq < x.filled;
    });
    var groups = order.map(function (g) { return { name: g, values: map[g].map(function (o) { return o.v; }), rows: map[g] }; });
    var subjects = null;
    if (subj) {
      var bySubj = {};
      body.forEach(function (r, ri) {
        var s = String(r[subj.i] || '').trim(), g = String(r[gc.i] || '').trim(), v = P.num(r[vc.i]);
        if (!s || !g || !isFinite(v)) return;
        (bySubj[s] = bySubj[s] || {})[g] = v;
      });
      subjects = Object.keys(bySubj).map(function (s) { return { id: s, v: bySubj[s] }; });
    }
    return { layout: 'long', groups: groups, valueLabel: vc.name, groupLabel: gc.name, valueCols: candidates, valueCol: vc,
      subjects: subjects, subjectLabel: subj ? subj.name : '', skipped: skipped };
  }
  function parseWide(body, cols, numCols, textCols, header) {
    var skipped = 0;
    var groups = numCols.map(function (c, k) {
      var vals = [];
      c.cells.forEach(function (x) { if (x === '') return; var v = P.num(x); if (isFinite(v)) vals.push(v); else skipped++; });
      return { name: c.name || T('Group ', '组 ', '群 ') + (k + 1), values: vals, col: c.i };
    });
    var idCol = textCols.find(function (x) { return x.uniq === x.filled; });
    var subjects = null;
    var complete = body.every(function (r) { return numCols.every(function (c) { return isNum(r[c.i]); }); });
    if (complete && body.length >= 2) {
      subjects = body.map(function (r, ri) {
        var v = {}; numCols.forEach(function (c, k) { v[groups[k].name] = P.num(r[c.i]); });
        return { id: idCol ? String(r[idCol.i]) : String(ri + 1), v: v };
      });
    }
    return { layout: 'wide', groups: groups, valueLabel: '', groupLabel: '', valueCols: [], subjects: subjects,
      subjectLabel: idCol ? idCol.name : '', pairedHint: !!(idCol && SUBJECT_RE.test(idCol.name)), skipped: skipped };
  }

  /* ------------------------------------------------------------ statistics */
  function pairedRows(groups, a, b, subjects) {
    var x = [], y = [];
    (subjects || []).forEach(function (s) {
      var va = s.v[groups[a].name], vb = s.v[groups[b].name];
      if (isFinite(va) && isFinite(vb)) { x.push(va); y.push(vb); }
    });
    return { a: x, b: y };
  }
  function friedman(rows) {
    var n = rows.length, k = rows[0].length, R = new Array(k).fill(0), tie = 0;
    rows.forEach(function (r) {
      var o = r.map(function (v, i) { return [v, i]; }).sort(function (p, q) { return p[0] - q[0]; }), i = 0;
      while (i < k) { var j = i; while (j + 1 < k && o[j + 1][0] === o[i][0]) j++; var t = j - i + 1;
        for (var q = i; q <= j; q++) R[o[q][1]] += (i + j) / 2 + 1; if (t > 1) tie += t * t * t - t; i = j + 1; }
    });
    var chi = 12 / (n * k * (k + 1)) * R.reduce(function (s, x) { return s + x * x; }, 0) - 3 * n * (k + 1);
    chi /= 1 - tie / (n * (k * k * k - k));
    return { chi2: chi, df: k - 1, p: S.pChi2(chi, k - 1) };
  }
  /* pairs to test: vs control, or all pairs */
  function pairList(k, control) {
    var out = [];
    if (control >= 0) { for (var i = 0; i < k; i++) if (i !== control) out.push([control, i]); }
    else for (var a = 0; a < k; a++) for (var b = a + 1; b < k; b++) out.push([a, b]);
    return out;
  }
  function analyse(groups, opt) {
    var k = groups.length, vals = groups.map(function (g) { return g.values; });
    var res = { omnibus: null, pairs: [], method: '', post: '', note: [] };
    if (k < 2) return res;
    if (vals.some(function (v) { return v.length < 2; })) { res.note.push('small'); return res; }
    if (vals.every(function (v) { return S.sd(v) === 0; })) { res.note.push('flat'); return res; }
    var ref = opt.control >= 0 ? opt.control : 0;
    var paired = opt.paired && opt.subjects;
    if (k === 2) {
      var a = ref, b = 1 - ref, r, test;
      if (paired) {
        var pr = pairedRows(groups, a, b, opt.subjects);
        if (pr.a.length < 2) { res.note.push('pairs'); return res; }
        if (opt.test === 'param') { r = S.paired(pr.b, pr.a); test = 'paired_t'; res.pairs.push({ a: a, b: b, test: test, stat: r.t, statName: 't', df: r.df, p: r.p, n: pr.a.length }); }
        else { r = S.wilcoxon(pr.b, pr.a); test = 'wilcoxon'; res.pairs.push({ a: a, b: b, test: test, stat: r.W, statName: 'W', df: NaN, p: r.p, n: pr.a.length }); }
      } else if (opt.test === 'param') {
        r = S.welch(vals[b], vals[a]); test = 'welch';
        res.pairs.push({ a: a, b: b, test: test, stat: r.t, statName: 't', df: r.df, p: r.p });
      } else {
        r = S.mannWhitney(vals[b], vals[a]); test = 'mann_whitney';
        res.pairs.push({ a: a, b: b, test: test, stat: r.U, statName: 'U', df: NaN, p: r.p });
      }
      res.method = test; return res;
    }
    var pairs = pairList(k, opt.control);
    if (paired) {
      var names = groups.map(function (g) { return g.name; });
      var complete = opt.subjects.filter(function (s) { return names.every(function (n) { return isFinite(s.v[n]); }); });
      if (complete.length < 2) { res.note.push('pairs'); return res; }
      var rows = complete.map(function (s) { return names.map(function (n) { return s.v[n]; }); });
      if (opt.test === 'param') { var rm = PS.rmAnova(rows); res.omnibus = { test: 'rm_anova', stat: rm.F, statName: 'F', df: rm.df1 + ', ' + rm.df2, p: rm.p }; res.method = 'rm_anova'; res.post = 'paired_t_holm'; }
      else { var fr = friedman(rows); res.omnibus = { test: 'friedman', stat: fr.chi2, statName: 'χ²', df: fr.df, p: fr.p }; res.method = 'friedman'; res.post = 'wilcoxon_holm'; }
      var raw = pairs.map(function (pr) {
        var x = rows.map(function (r) { return r[pr[0]]; }), y = rows.map(function (r) { return r[pr[1]]; });
        var t = opt.test === 'param' ? S.paired(y, x) : S.wilcoxon(y, x);
        return { a: pr[0], b: pr[1], test: opt.test === 'param' ? 'paired_t' : 'wilcoxon', stat: opt.test === 'param' ? t.t : t.W,
          statName: opt.test === 'param' ? 't' : 'W', df: opt.test === 'param' ? t.df : NaN, praw: t.p, n: rows.length };
      });
      var adj = S.holm(raw.map(function (x) { return x.praw; }));
      raw.forEach(function (x, i) { x.p = adj[i]; });
      res.pairs = raw; res.nPairs = rows.length; return res;
    }
    if (opt.test === 'param') {
      var an = S.anova(vals);
      res.omnibus = { test: 'anova', stat: an.F, statName: 'F', df: an.df1 + ', ' + an.df2, p: an.p };
      res.method = 'anova';
      if (opt.control >= 0) {
        res.post = 'dunnett';
        res.pairs = PS.dunnett(vals, opt.control).map(function (x) { return { a: x.i, b: x.j, test: 'dunnett', stat: x.t, statName: 't', df: x.df, p: x.p }; });
      } else {
        res.post = 'tukey';
        res.pairs = PS.tukey(vals).map(function (x) { return { a: x.i, b: x.j, test: 'tukey', stat: x.q, statName: 'q', df: x.df, p: x.p }; });
      }
    } else {
      var kw = S.kruskal(vals);
      res.omnibus = { test: 'kruskal', stat: kw.H, statName: 'H', df: kw.df, p: kw.p };
      res.method = 'kruskal'; res.post = 'dunn_holm';
      var d = PS.dunn(vals, pairs), adj2 = S.holm(d.map(function (x) { return x.p; }));
      res.pairs = d.map(function (x, i) { return { a: x.i, b: x.j, test: 'dunn', stat: x.z, statName: 'z', df: NaN, praw: x.p, p: adj2[i] }; });
    }
    return res;
  }

  /* ------------------------------------------------------------ text */
  var TEST_NAME = {
    welch: ['Welch’s t-test', 'Welch t 检验', 'Welch の t 検定'],
    paired_t: ['paired t-test', '配对 t 检验', '対応のある t 検定'],
    mann_whitney: ['Mann–Whitney U test', 'Mann–Whitney U 检验', 'Mann–Whitney の U 検定'],
    wilcoxon: ['Wilcoxon signed-rank test', 'Wilcoxon 符号秩检验', 'Wilcoxon の符号付順位検定'],
    anova: ['one-way ANOVA', '单因素方差分析（one-way ANOVA）', '一元配置分散分析（one-way ANOVA）'],
    rm_anova: ['one-way repeated-measures ANOVA', '单因素重复测量方差分析', '一元配置反復測定分散分析'],
    kruskal: ['Kruskal–Wallis test', 'Kruskal–Wallis 检验', 'Kruskal–Wallis 検定'],
    friedman: ['Friedman test', 'Friedman 检验', 'Friedman 検定'],
    dunnett: ['Dunnett’s test', 'Dunnett 检验', 'Dunnett 検定'],
    tukey: ['Tukey’s HSD test', 'Tukey HSD 检验', 'Tukey の HSD 検定'],
    dunn: ['Dunn’s test (Holm)', 'Dunn 检验（Holm 校正）', 'Dunn 検定（Holm 補正）']
  };
  function tn(key) { var x = TEST_NAME[key] || [key, key, key]; return T(x[0], x[1], x[2]); }
  function nText(groups) {
    var ns = groups.map(function (g) { return g.values.length; }), lo = Math.min.apply(null, ns), hi = Math.max.apply(null, ns);
    return lo === hi ? String(lo) : lo + '–' + hi;
  }
  function methods(groups, res, opt) {
    var n = nText(groups), ctrl = opt.control >= 0 ? groups[opt.control].name : '', err = opt.err === 'sd' ? 'SD' : 'SEM', parts = [];
    if (opt.chart === 'box') parts.push(T('Box plots show the median and interquartile range, whiskers extend to the most extreme values within 1.5 × IQR, and dots show individual data points (n = ' + n + ' per group).',
      '箱型图显示中位数和四分位距，须线延伸至 1.5 倍四分位距以内的最极端值，圆点为各数据点（每组 n = ' + n + '）。',
      '箱ひげ図は中央値と四分位範囲を示し、ひげは 1.5 × IQR 以内の最も外側の値まで、点は個々のデータ（各群 n = ' + n + '）を示す。'));
    else parts.push(T('Data are shown as mean ± ' + err + ' with individual data points (n = ' + n + ' per group).',
      '数据以平均值 ± ' + err + ' 表示，圆点为各数据点（每组 n = ' + n + '）。',
      'データは平均値 ± ' + err + ' で示し、点は個々のデータ（各群 n = ' + n + '）を示す。'));
    var k = groups.length;
    if (!res.pairs.length) return parts.join(' ');
    if (k === 2) {
      var t0 = res.pairs[0].test, other = groups[res.pairs[0].b].name, base = groups[res.pairs[0].a].name;
      parts.push(T(other + ' was compared with ' + base + ' using a two-sided ' + tn(t0) + (opt.paired ? ' on ' + res.pairs[0].n + ' matched pairs' : '') + ' (α = 0.05).',
        other + ' 与 ' + base + ' 的比较采用双侧' + tn(t0) + (opt.paired ? '（' + res.pairs[0].n + ' 对配对样本）' : '') + '（α = 0.05）。',
        other + ' と ' + base + ' を両側の' + tn(t0) + (opt.paired ? '（' + res.pairs[0].n + ' 組の対応データ）' : '') + 'で比較した（α = 0.05）。'));
      return parts.join(' ');
    }
    var om = tn(res.method), post;
    if (res.post === 'dunnett') post = T('Dunnett’s multiple comparisons test against ' + ctrl, '以 ' + ctrl + ' 为对照的 Dunnett 多重比较检验', ctrl + ' を対照とした Dunnett の多重比較検定');
    else if (res.post === 'tukey') post = T('Tukey’s HSD test for all pairwise comparisons', 'Tukey HSD 检验进行所有两两比较', 'Tukey の HSD 検定による全ペア比較');
    else {
      var pt = { dunn_holm: ['Dunn’s test', 'Dunn 检验', 'Dunn 検定'], paired_t_holm: ['paired t-tests', '配对 t 检验', '対応のある t 検定'], wilcoxon_holm: ['Wilcoxon signed-rank tests', 'Wilcoxon 符号秩检验', 'Wilcoxon の符号付順位検定'] }[res.post];
      post = ctrl
        ? T(pt[0] + ' against ' + ctrl + ' with Holm correction', '与 ' + ctrl + ' 比较的' + pt[1] + '（Holm 校正）', ctrl + ' との' + pt[2] + '（Holm 補正）')
        : T(pt[0] + ' for all pairwise comparisons with Holm correction', pt[1] + '进行所有两两比较（Holm 校正）', pt[2] + 'による全ペア比較（Holm 補正）');
    }
    parts.push(T('Groups were compared by ' + om + ' followed by ' + post + (opt.paired ? ', using ' + res.nPairs + ' subjects measured in every group' : '') + '. All tests were two-sided (α = 0.05).',
      '组间比较采用' + om + '，随后进行' + post + (opt.paired ? '（纳入每组都有测量值的 ' + res.nPairs + ' 个对象）' : '') + '。所有检验均为双侧（α = 0.05）。',
      '群間比較には' + om + 'を用い、続いて' + post + 'を行った' + (opt.paired ? '（全群で測定された ' + res.nPairs + ' 対象）' : '') + '。検定はすべて両側（α = 0.05）とした。'));
    return parts.join(' ');
  }

  /* ------------------------------------------------------------ figure */
  function niceStep(span, target) {
    var raw = span / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
  }
  function textW(s, px) { var w = 0; for (var i = 0; i < s.length; i++) w += /[　-鿿＀-￯]/.test(s[i]) ? px : px * 0.56; return w; }
  function tickLabel(v, step) {
    var d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
    var s = Number(v.toFixed(Math.min(d, 6)));
    return Math.abs(s) >= 1e5 || (Math.abs(s) > 0 && Math.abs(s) < 1e-4) ? s.toExponential(1) : String(s);
  }
  function summary(g) {
    var v = g.values, s = S.sorted ? null : null;
    var q1 = S.quantile(v, 0.25), q3 = S.quantile(v, 0.75), iqr = q3 - q1;
    var inside = v.filter(function (x) { return x >= q1 - 1.5 * iqr && x <= q3 + 1.5 * iqr; });
    return { n: v.length, mean: S.mean(v), sd: S.sd(v), sem: S.sem(v), median: S.median(v), q1: q1, q3: q3,
      lo: Math.min.apply(null, inside), hi: Math.max.apply(null, inside), min: Math.min.apply(null, v), max: Math.max.apply(null, v) };
  }
  function esc(s) { return P.esc(String(s)); }
  function figure(groups, res, opt) {
    var k = groups.length, horiz = opt.horiz, sums = groups.map(summary);
    var W = 480, FONT = "Arial, Helvetica, 'Noto Sans SC', 'Noto Sans JP', sans-serif", TICK = 11.5, LAB = 13;
    var colors = groups.map(function (g, i) {
      if (i === opt.control) return GREY;
      var j = opt.control >= 0 && i > opt.control ? i - 1 : i; return PALETTE[j % PALETTE.length];
    });
    /* value domain */
    var lo = Infinity, hi = -Infinity;
    groups.forEach(function (g, i) {
      var s = sums[i], e = opt.err === 'sd' ? s.sd : s.sem;
      lo = Math.min(lo, s.min, opt.chart === 'box' ? s.lo : s.mean - (e || 0));
      hi = Math.max(hi, s.max, opt.chart === 'box' ? s.hi : s.mean + (e || 0));
    });
    if (opt.chart === 'bar' || (lo >= 0 && lo <= 0.35 * hi)) lo = Math.min(lo, 0);
    if (opt.chart === 'bar' && hi < 0) hi = 0;
    if (hi === lo) { hi += 1; lo -= 1; }
    var step = niceStep(hi - lo, 5), v0 = Math.floor(lo / step + 1e-9) * step, v1 = Math.ceil(hi / step - 1e-9) * step;
    if (v1 - hi < step * 0.05) v1 += 0; var ticks = []; for (var tv = v0; tv <= v1 + step * 1e-6; tv += step) ticks.push(Math.abs(tv) < step * 1e-9 ? 0 : tv);
    /* significance brackets */
    var show = res.pairs.filter(function (p) { return isFinite(p.p) && (res.pairs.length === 1 || p.p < 0.05); });
    show.sort(function (a, b) { return Math.abs(a.b - a.a) - Math.abs(b.b - b.a); });
    var levels = [];
    show.forEach(function (p) {
      var x0 = Math.min(p.a, p.b), x1 = Math.max(p.a, p.b), L = 0;
      while (levels[L] && levels[L].some(function (r) { return !(x1 < r[0] || x0 > r[1]); })) L++;
      (levels[L] = levels[L] || []).push([x0, x1]); p.level = L;
    });
    var bracketBand = levels.length ? levels.length * 17 + 6 : 0;
    var labels = groups.map(function (g) { return g.name; }), maxLabel = Math.max.apply(null, labels.map(function (s) { return textW(s, TICK); }));
    var tickW = Math.max.apply(null, ticks.map(function (v) { return textW(tickLabel(v, step), TICK); }));
    var m, H, rot = false, band;
    if (!horiz) {
      band = (W - 70) / k;
      rot = maxLabel > band - 6;
      var bottom = rot ? Math.min(150, maxLabel * 0.72 + 22) : 30;
      m = { l: Math.max(48, tickW + 30), r: 12, t: 12 + bracketBand, b: bottom };
      H = Math.round(W * 0.82) + (rot ? bottom - 30 : 0) + bracketBand * 0.6;
      band = (W - m.l - m.r) / k;
    } else {
      m = { l: Math.min(220, maxLabel + 18), r: 12 + bracketBand, t: 10, b: 46 };
      H = Math.max(200, k * 46 + m.t + m.b);
      band = (H - m.t - m.b) / k;
    }
    var pw = W - m.l - m.r, ph = H - m.t - m.b;
    function vpos(v) { return horiz ? m.l + (v - v0) / (v1 - v0) * pw : m.t + ph - (v - v0) / (v1 - v0) * ph; }
    function cpos(i) { return horiz ? m.t + band * (i + 0.5) : m.l + band * (i + 0.5); }
    function xy(c, v) { return horiz ? [v, c] : [c, v]; }
    function line(c1, v1_, c2, v2, attrs) { var a = xy(c1, v1_), b = xy(c2, v2); return '<line x1="' + a[0].toFixed(2) + '" y1="' + a[1].toFixed(2) + '" x2="' + b[0].toFixed(2) + '" y2="' + b[1].toFixed(2) + '" ' + attrs + '/>'; }
    var out = [];
    out.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + Math.round(H) + '" width="' + W + '" height="' + Math.round(H) + '" font-family="' + FONT + '" role="img" aria-label="' + esc(T('Group comparison plot', '组间比较图', '群間比較のグラフ')) + '">');
    out.push('<rect width="100%" height="100%" fill="#fff"/>');
    /* value axis */
    var axisAttr = 'stroke="#000" stroke-width="1" stroke-linecap="square"';
    if (!horiz) {
      out.push('<line x1="' + m.l + '" y1="' + vpos(v0) + '" x2="' + m.l + '" y2="' + vpos(v1) + '" ' + axisAttr + '/>');
      ticks.forEach(function (v) { var y = vpos(v).toFixed(2); out.push('<line x1="' + (m.l - 4) + '" y1="' + y + '" x2="' + m.l + '" y2="' + y + '" ' + axisAttr + '/><text x="' + (m.l - 7) + '" y="' + y + '" font-size="' + TICK + '" text-anchor="end" dominant-baseline="central">' + esc(tickLabel(v, step)) + '</text>'); });
      out.push('<text transform="translate(' + (m.l - tickW - 18) + ',' + (m.t + ph / 2) + ') rotate(-90)" font-size="' + LAB + '" text-anchor="middle">' + esc(opt.ylab) + '</text>');
      out.push('<line x1="' + m.l + '" y1="' + (m.t + ph) + '" x2="' + (W - m.r) + '" y2="' + (m.t + ph) + '" ' + axisAttr + '/>');
      labels.forEach(function (s, i) {
        var x = cpos(i), y = m.t + ph + 8;
        out.push(rot ? '<text transform="translate(' + x.toFixed(2) + ',' + (y + 2) + ') rotate(-40)" font-size="' + TICK + '" text-anchor="end" dominant-baseline="hanging">' + esc(s) + '</text>'
          : '<text x="' + x.toFixed(2) + '" y="' + (y + 2) + '" font-size="' + TICK + '" text-anchor="middle" dominant-baseline="hanging">' + esc(s) + '</text>');
      });
    } else {
      out.push('<line x1="' + vpos(v0) + '" y1="' + (m.t + ph) + '" x2="' + vpos(v1) + '" y2="' + (m.t + ph) + '" ' + axisAttr + '/>');
      ticks.forEach(function (v) { var x = vpos(v).toFixed(2); out.push('<line x1="' + x + '" y1="' + (m.t + ph) + '" x2="' + x + '" y2="' + (m.t + ph + 4) + '" ' + axisAttr + '/><text x="' + x + '" y="' + (m.t + ph + 8) + '" font-size="' + TICK + '" text-anchor="middle" dominant-baseline="hanging">' + esc(tickLabel(v, step)) + '</text>'); });
      out.push('<text x="' + (m.l + pw / 2) + '" y="' + (H - 6) + '" font-size="' + LAB + '" text-anchor="middle">' + esc(opt.ylab) + '</text>');
      out.push('<line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ph) + '" ' + axisAttr + '/>');
      labels.forEach(function (s, i) { out.push('<text x="' + (m.l - 8) + '" y="' + cpos(i).toFixed(2) + '" font-size="' + TICK + '" text-anchor="end" dominant-baseline="central">' + esc(s) + '</text>'); });
    }
    /* groups */
    var R = Math.max(2.6, Math.min(3.8, band / 9)), pairedMode = !!(opt.paired && opt.subjects);
    var meanHalf = Math.min(band * 0.26, 30), capHalf = Math.min(band * 0.13, 11);
    /* paired: one thin line per subject across the groups, points sit on the group centre */
    if (pairedMode) opt.subjects.forEach(function (sj) {
      var pts = []; groups.forEach(function (g, i) { var v = sj.v[g.name]; if (isFinite(v)) pts.push(xy(cpos(i), vpos(v))); });
      if (pts.length > 1) out.push('<polyline points="' + pts.map(function (q) { return q[0].toFixed(2) + ',' + q[1].toFixed(2); }).join(' ') + '" fill="none" stroke="#B8B8B8" stroke-width="0.9"/>');
    });
    groups.forEach(function (g, i) {
      var s = sums[i], c = cpos(i), col = colors[i], e = opt.err === 'sd' ? s.sd : s.sem;
      if (opt.chart === 'bar') {
        var bw = Math.min(band * 0.62, 72), base = vpos(Math.max(v0, Math.min(0, v1))), top = vpos(s.mean);
        var a = horiz ? [Math.min(base, top), c - bw / 2, Math.abs(top - base), bw] : [c - bw / 2, Math.min(base, top), bw, Math.abs(top - base)];
        out.push('<rect x="' + a[0].toFixed(2) + '" y="' + a[1].toFixed(2) + '" width="' + a[2].toFixed(2) + '" height="' + a[3].toFixed(2) + '" fill="' + col + '" fill-opacity="0.22" stroke="' + col + '" stroke-width="1.4"/>');
      }
      if (opt.chart === 'box') {
        var w = Math.min(band * 0.5, 60), q1 = vpos(s.q1), q3 = vpos(s.q3);
        var r = horiz ? [Math.min(q1, q3), c - w / 2, Math.abs(q3 - q1), w] : [c - w / 2, Math.min(q1, q3), w, Math.abs(q3 - q1)];
        out.push(line(c, vpos(s.lo), c, vpos(s.q1), 'stroke="' + col + '" stroke-width="1.3"'));
        out.push(line(c, vpos(s.q3), c, vpos(s.hi), 'stroke="' + col + '" stroke-width="1.3"'));
        out.push(line(c - w * 0.25, vpos(s.lo), c + w * 0.25, vpos(s.lo), 'stroke="' + col + '" stroke-width="1.3"'));
        out.push(line(c - w * 0.25, vpos(s.hi), c + w * 0.25, vpos(s.hi), 'stroke="' + col + '" stroke-width="1.3"'));
        out.push('<rect x="' + r[0].toFixed(2) + '" y="' + r[1].toFixed(2) + '" width="' + r[2].toFixed(2) + '" height="' + r[3].toFixed(2) + '" fill="' + col + '" fill-opacity="0.14" stroke="' + col + '" stroke-width="1.4"/>');
        out.push(line(c - w / 2, vpos(s.median), c + w / 2, vpos(s.median), 'stroke="#000" stroke-width="1.8"'));
      }
      /* points: compact swarm */
      var placed = [], half = pairedMode ? 0 : Math.min(band * (opt.chart === 'box' ? 0.22 : 0.3), 26), d = R * 2.1;
      g.values.slice().sort(function (p, q) { return p - q; }).forEach(function (v) {
        var vp = vpos(v), off = 0;
        for (var t = 0; t < 40; t++) {
          var cand = (t % 2 ? 1 : -1) * Math.ceil(t / 2) * d * 0.55;
          if (Math.abs(cand) > half) { cand = (t % 2 ? 1 : -1) * half * ((t * 0.37) % 1); }
          if (placed.every(function (pp) { var dx = pp[0] - cand, dv = pp[1] - vp; return dx * dx + dv * dv >= d * d * 0.95; })) { off = cand; break; }
        }
        placed.push([off, vp]);
        var pt = xy(c + off, vp);
        out.push('<circle cx="' + pt[0].toFixed(2) + '" cy="' + pt[1].toFixed(2) + '" r="' + R.toFixed(2) + '" fill="' + col + '" fill-opacity="0.9" stroke="#fff" stroke-width="0.7"/>');
      });
      if (opt.chart !== 'box' && isFinite(e) && s.n > 1) {
        var cap = capHalf;
        out.push(line(c, vpos(s.mean - e), c, vpos(s.mean + e), 'stroke="#000" stroke-width="1.2"'));
        out.push(line(c - cap, vpos(s.mean + e), c + cap, vpos(s.mean + e), 'stroke="#000" stroke-width="1.2"'));
        if (opt.chart === 'dot') out.push(line(c - cap, vpos(s.mean - e), c + cap, vpos(s.mean - e), 'stroke="#000" stroke-width="1.2"'));
      }
      if (opt.chart === 'dot') out.push(line(c - meanHalf, vpos(s.mean), c + meanHalf, vpos(s.mean), 'stroke="#000" stroke-width="2"'));
    });
    /* brackets */
    show.forEach(function (p) {
      var c0 = cpos(Math.min(p.a, p.b)), c1 = cpos(Math.max(p.a, p.b)), lab = opt.exactP ? S.fmtP(p.p).replace('p = ', 'p = ') : S.stars(p.p);
      var vv = horiz ? m.l + pw + 8 + p.level * 17 : m.t - 8 - p.level * 17;
      var tick = 4;
      if (!horiz) {
        out.push('<path d="M' + (c0 + 2).toFixed(2) + ',' + (vv + tick) + ' V' + vv + ' H' + (c1 - 2).toFixed(2) + ' V' + (vv + tick) + '" fill="none" stroke="#000" stroke-width="0.9"/>');
        out.push('<text x="' + ((c0 + c1) / 2).toFixed(2) + '" y="' + (vv - 2) + '" font-size="' + (opt.exactP ? 10.5 : 12) + '" text-anchor="middle">' + esc(lab) + '</text>');
      } else {
        out.push('<path d="M' + (vv - tick) + ',' + (c0 + 2).toFixed(2) + ' H' + vv + ' V' + (c1 - 2).toFixed(2) + ' H' + (vv - tick) + '" fill="none" stroke="#000" stroke-width="0.9"/>');
        out.push('<text transform="translate(' + (vv + 4) + ',' + ((c0 + c1) / 2).toFixed(2) + ') rotate(90)" font-size="' + (opt.exactP ? 10.5 : 12) + '" text-anchor="middle">' + esc(lab) + '</text>');
      }
    });
    out.push('</svg>');
    return { svg: out.join(''), w: W, h: Math.round(H) };
  }

  /* ------------------------------------------------------------ export */
  function downloadPng(fig, btn) {
    var scale = 2102 / fig.w; /* 89 mm single column at 600 dpi */
    var svg = fig.svg.replace('width="' + fig.w + '" height="' + fig.h + '"', 'width="' + Math.round(fig.w * scale) + '" height="' + Math.round(fig.h * scale) + '"');
    var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })), img = new Image();
    img.onload = function () {
      var cv = document.createElement('canvas'); cv.width = Math.round(fig.w * scale); cv.height = Math.round(fig.h * scale);
      var ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      cv.toBlob(function (b) { P.save(b, 'pasero-plot.png'); }, 'image/png');
    };
    img.src = url;
  }

  /* ------------------------------------------------------------ UI */
  var getChart = P.seg('chart', function (v) { state.chart = v; state.touchedChart = true; render(); });
  var getErr = P.seg('err', function (v) { state.err = v; render(); });
  var getTest = P.seg('test', function (v) { state.test = v; render(); });
  function setSeg(name, v) { document.querySelectorAll('[data-seg="' + name + '"] button[data-v]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); }); }

  function render(ev) {
    if (ev && ev.target && (ev.target.tagName === 'BUTTON' || ev.target.id === 'out')) return;
    var out = $('out'), d = parse($('paste').value);
    if (!d || d.error) {
      out.innerHTML = '<p class="tl-note">' + esc(d && d.error ? T('Couldn’t find groups in this table. Use one column per group with group names in the first row, or a group column next to a value column.',
        '没有在表格里找到分组。请每组一列、第一行写组名，或者一列组名加一列数值。', '表から群を見つけられませんでした。1 群 1 列で 1 行目に群名を書くか、群の列と値の列を並べてください。')
        : T('Paste a table to see the plot.', '粘贴表格后这里会显示图。', '表を貼り付けるとグラフが表示されます。')) + '</p>';
      return;
    }
    var groups = d.groups.filter(function (g) { return g.values.length; });
    /* value column picker (long tables with several numeric columns) */
    var vcBox = $('valueColBox'), vcSel = $('valueCol');
    if (d.layout === 'long' && d.valueCols.length > 1) {
      vcBox.hidden = false;
      var cur = String(d.valueCol.i);
      vcSel.innerHTML = d.valueCols.map(function (c) { return '<option value="' + c.i + '"' + (String(c.i) === cur ? ' selected' : '') + '>' + esc(c.name || ('#' + (c.i + 1))) + '</option>'; }).join('');
    } else vcBox.hidden = true;
    /* control picker */
    var sig = groups.map(function (g) { return g.name; }).join('\u0001');
    var sel = $('ctrl'), prev = sel.value;
    var detected = groups.findIndex(function (g) { return CONTROL_RE.test(g.name); });
    sel.innerHTML = '<option value="-1">' + esc(T('All pairs (no control)', '所有两两比较（无对照组）', '全ペア比較（対照なし）')) + '</option>' +
      groups.map(function (g, i) { return '<option value="' + i + '">' + esc(T('Control: ', '对照组：', '対照：') + g.name) + '</option>'; }).join('');
    if (sig !== state.lastSig) {
      sel.value = String(detected >= 0 ? detected : (groups.length === 2 ? 0 : -1));
      /* recommended chart when the data change, unless the visitor picked one */
      var minN = Math.min.apply(null, groups.map(function (g) { return g.values.length; }));
      var maxLab = Math.max.apply(null, groups.map(function (g) { return g.name.length; }));
      if (!state.touchedChart) { state.chart = minN >= 8 ? 'box' : 'dot'; setSeg('chart', state.chart); }
      $('horiz').checked = groups.length > 6 || maxLab > 22;
      $('paired').checked = false;
      if (!$('ylab').dataset.touched) $('ylab').value = d.valueLabel || '';
      state.lastSig = sig;
    } else if (prev && sel.querySelector('option[value="' + prev + '"]')) sel.value = prev;
    if (groups.length === 2 && sel.value === '-1') sel.value = '0';
    var control = Number(sel.value);
    var pairedOk = !!(d.subjects && d.subjects.length >= 2);
    $('pairedBox').hidden = !pairedOk;
    var opt = { chart: state.chart, err: state.err, test: state.test, control: control, paired: pairedOk && $('paired').checked,
      subjects: d.subjects, horiz: $('horiz').checked, exactP: $('exactP').checked, ylab: $('ylab').value.trim() || T('Value', '数值', '値') };

    if (groups.length < 2) { out.innerHTML = '<p class="tl-note">' + esc(T('At least two groups are needed.', '至少需要两组。', '少なくとも 2 群必要です。')) + '</p>'; return; }
    var res = analyse(groups, opt), fig = figure(groups, res, opt), meth = methods(groups, res, opt);

    /* recommendation line */
    var rec = [];
    var nG = groups.length;
    rec.push(nG === 2 ? T('2 groups', '2 组', '2 群') : T(nG + ' groups', nG + ' 组', nG + ' 群'));
    if (res.pairs.length) rec.push(T('test: ', '检验：', '検定：') + (res.omnibus ? tn(res.method) + ' → ' + tn(res.pairs[0].test) : tn(res.pairs[0].test)));
    var notes = [];
    if (d.skipped) notes.push(T(d.skipped + ' non-numeric cell(s) skipped.', '跳过了 ' + d.skipped + ' 个非数字格子。', '数値でないセルを ' + d.skipped + ' 個スキップしました。'));
    if (res.note.indexOf('small') >= 0) notes.push(T('Every group needs at least 2 values for a test; the plot is shown without statistics.', '每组至少要有 2 个数值才能做检验，现在只显示图。', '検定には各群 2 つ以上の値が必要です。統計なしでグラフを表示しています。'));
    if (res.note.indexOf('flat') >= 0) notes.push(T('Values do not vary within any group, so no test can be run.', '各组内数值完全相同，无法做检验。', 'どの群でも値にばらつきがないため、検定できません。'));
    if (res.note.indexOf('pairs') >= 0) notes.push(T('Not enough matched pairs for a paired test.', '配对样本不足，无法做配对检验。', '対応のある検定に十分なペアがありません。'));
    if (pairedOk && !opt.paired && (d.pairedHint || d.layout === 'long')) notes.push(T('If the same subjects were measured in every group, tick “Paired”.', '如果每组测的是同一批对象，请勾选“配对”。', '各群で同じ対象を測定した場合は「対応あり」にチェックしてください。'));
    if (groups.some(function (g) { return g.values.length < 3; }) && res.pairs.length) notes.push(T('Some groups have fewer than 3 values; treat p values with caution.', '有的组少于 3 个数值，p 值仅供参考。', '値が 3 つ未満の群があります。p 値の解釈には注意してください。'));

    /* tables */
    var sums = groups.map(summary);
    var sh = [T('Group', '组', '群'), 'n', T('Mean', '平均值', '平均'), 'SD', 'SEM', T('Median', '中位数', '中央値')];
    var stsv = [sh.join('\t')];
    var srows = groups.map(function (g, i) {
      var s = sums[i], cells = [g.name + (i === control ? ' (' + T('control', '对照', '対照') + ')' : ''), s.n, P.fmt(s.mean, 4), P.fmt(s.sd, 3), P.fmt(s.sem, 3), P.fmt(s.median, 4)];
      stsv.push(cells.join('\t'));
      return '<tr>' + cells.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
    }).join('');
    var ph = [T('Comparison', '比较', '比較'), T('Difference', '差值', '差'), T('Statistic', '统计量', '統計量'), 'df', res.pairs.length > 1 ? T('p (adjusted)', 'p（校正后）', 'p（補正後）') : 'p', ''];
    var ptsv = [ph.join('\t')];
    var omRow = '';
    if (res.omnibus) {
      var oc = [tn(res.omnibus.test), '—', res.omnibus.statName + ' = ' + P.fmt(res.omnibus.stat, 4), res.omnibus.df, S.fmtP(res.omnibus.p).replace('p = ', '').replace('p < ', '< '), S.stars(res.omnibus.p)];
      ptsv.push(oc.join('\t'));
      omRow = '<tr class="tl-omni">' + oc.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
    }
    var prow = res.pairs.map(function (p) {
      var diff = sums[p.b].mean - sums[p.a].mean;
      var cells = [groups[p.b].name + ' vs ' + groups[p.a].name, P.fmt(diff, 4), p.statName + ' = ' + P.fmt(p.stat, 4), isFinite(p.df) ? P.fmt(p.df, 4) : '—',
        S.fmtP(p.p).replace('p = ', '').replace('p < ', '< '), S.stars(p.p)];
      ptsv.push(cells.join('\t'));
      return '<tr>' + cells.map(function (c, i) { return '<td>' + (i === 4 ? '<strong>' + esc(c) + '</strong>' : esc(c)) + '</td>'; }).join('') + '</tr>';
    }).join('');

    var figHtml = '<figure class="tl-figure tl-plot" id="fig">' + fig.svg + '</figure>';
    out.innerHTML =
      '<p class="tl-rec">' + esc(T('Recommended for your data — ', '根据你的数据推荐：', 'データに合わせた推奨：') + rec.join(' · ')) + '</p>' +
      figHtml +
      '<div class="tl-btns"><button type="button" class="tl-btn primary" id="png">' + esc(T('Download PNG (600 dpi)', '下载 PNG（600 dpi）', 'PNG を保存（600 dpi）')) + '</button>' +
      '<button type="button" class="tl-btn" id="copyM">' + esc(T('Copy methods', '复制方法描述', '方法をコピー')) + '</button>' +
      '<button type="button" class="tl-btn" id="copyT">' + esc(T('Copy statistics', '复制统计结果', '統計結果をコピー')) + '</button></div>' +
      '<p class="tl-note" style="margin-top:8px">' + esc(T('PNG is sized for a journal single column (89 mm). Vector PDF/SVG export is in the Pasero desktop app.',
        'PNG 按期刊单栏宽度（89 mm）输出。PDF/SVG 矢量导出请用 Pasero 桌面端。', 'PNG はジャーナルの 1 段幅（89 mm）で出力されます。PDF/SVG のベクター書き出しは Pasero デスクトップ版で。')) + '</p>' +
      (notes.length ? '<p class="tl-warn">' + esc(notes.join(' ')) + '</p>' : '') +
      (res.pairs.length ? '<h3>' + esc(T('Statistics', '统计结果', '統計結果') + ' · ' + tn(res.pairs[0].test)) + '</h3><div class="tl-table-wrap"><table class="tl-table"><thead><tr>' + ph.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + omRow + prow + '</tbody></table></div>' +
        '<p class="tl-note" style="margin-top:8px">' + esc((res.pairs.length > 1 ? T('Multiple comparisons are adjusted (Dunnett and Tukey control the family-wise error rate; others use Holm). ', '已做多重比较校正（Dunnett 和 Tukey 自带族错误率控制，其他方法用 Holm 校正）。', '多重比較は補正済みです（Dunnett と Tukey はファミリーワイズ誤り率を制御、その他は Holm 補正）。') : '') +
          '* p < 0.05, ** p < 0.01, *** p < 0.001, **** p < 0.0001. ' + T('The plot marks significant comparisons only.', '图上只标出有显著差异的比较。', 'グラフには有意な比較のみを表示しています。')) + '</p>' : '') +
      '<h3>' + esc(T('Groups', '各组数据', '各群のデータ')) + '</h3><div class="tl-table-wrap"><table class="tl-table"><thead><tr>' + sh.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + srows + '</tbody></table></div>' +
      '<h3>' + esc(T('Methods', '方法描述', '方法の記述')) + '</h3><p class="tl-methods" id="methods">' + esc(meth) + '</p>';
    $('png').onclick = function () { downloadPng(fig, this); };
    $('copyM').onclick = function () { P.copy(meth, this); };
    $('copyT').onclick = function () { P.copy(ptsv.join('\n') + '\n\n' + stsv.join('\n'), this); };
  }

  $('ylab').addEventListener('input', function () { this.dataset.touched = this.value ? '1' : ''; });
  $('valueCol').addEventListener('change', function () { state.lastSig = ''; });
  $('clear').addEventListener('click', function () { $('paste').value = ''; state.touchedChart = false; render(); $('paste').focus(); });
  $('example').addEventListener('click', function () { $('paste').value = EXAMPLE; state.touchedChart = false; state.lastSig = ''; render(); });
  $('paste').addEventListener('input', function () { state.touchedChart = state.touchedChart && $('paste').value !== ''; });
  P.live('main', render);
  window.PPlot = { parse: parse, analyse: analyse, methods: methods, figure: figure };
})();
