/* Pasero free lab tools: post-hoc tests for "Paste to plot". Runs in the browser only.
   Tukey–Kramer HSD and two-sided Dunnett use the studentised range / multivariate t
   probabilities, integrated numerically over the pooled-SD distribution (as in R's ptukey
   and the classic Dunnett integral). Dunn's test follows Dunn (1964) with tie correction. */
(function () {
  'use strict';
  var S = window.PStats;

  function phi(x) { return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); }
  /* Normal CDF from the complementary error function in stats.js (|error| < 1.2e-7) */
  function cdf(x) { var t = 0.5 * S.pZ(x); return x >= 0 ? 1 - t : t; }

  /* Simpson's rule on [a, b] with an even number of steps */
  function simpson(f, a, b, n) {
    if (n % 2) n++;
    var h = (b - a) / n, s = f(a) + f(b);
    for (var i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
    return s * h / 3;
  }
  /* Density of s = sqrt(chi2_df / df) */
  function sDensity(df) {
    var logc = (df / 2) * Math.log(df) - S.lgamma(df / 2) - (df / 2 - 1) * Math.LN2;
    return function (s) { return s <= 0 ? 0 : Math.exp(logc + (df - 1) * Math.log(s) - df * s * s / 2); };
  }
  /* E_s[g(s)] for the pooled-SD ratio; infinite df -> g(1) */
  function overS(g, df) {
    if (!(df < 5000)) return g(1);
    var dens = sDensity(df), sd = 1 / Math.sqrt(2 * df);
    var lo = Math.max(0, 1 - 9 * sd), hi = 1 + 12 * sd + (df < 10 ? 6 / df : 0);
    return simpson(function (s) { return dens(s) * g(s); }, lo, hi, df < 10 ? 400 : 200);
  }

  /* P(range of k standard normals <= w) */
  function rangeCdf(w, k) {
    if (!(w > 0)) return 0;
    return simpson(function (z) {
      var d = cdf(z) - cdf(z - w);
      return d > 0 ? k * phi(z) * Math.pow(d, k - 1) : 0;
    }, -8, 8 + w, 160);
  }
  /* Studentised range: P(Q <= q) for k groups, df error degrees of freedom */
  function ptukey(q, k, df) {
    if (!(q > 0)) return 0;
    return Math.min(1, overS(function (s) { return rangeCdf(q * s, k); }, df));
  }

  /* Pooled within-group variance and its df */
  function pooled(groups) {
    var ss = 0, n = 0;
    groups.forEach(function (g) { var m = S.mean(g); g.forEach(function (x) { ss += (x - m) * (x - m); }); n += g.length; });
    var df = n - groups.length;
    return { mse: ss / df, df: df };
  }

  /* Tukey–Kramer HSD for all pairs: [{i, j, diff, q, p}] */
  function tukey(groups) {
    var k = groups.length, pv = pooled(groups), out = [];
    for (var i = 0; i < k; i++) for (var j = i + 1; j < k; j++) {
      var a = groups[i], b = groups[j], diff = S.mean(b) - S.mean(a);
      var se = Math.sqrt(pv.mse / 2 * (1 / a.length + 1 / b.length)), q = Math.abs(diff) / se;
      out.push({ i: i, j: j, diff: diff, q: q, df: pv.df, p: Math.max(0, Math.min(1, 1 - ptukey(q, k, pv.df))) });
    }
    return out;
  }

  /* Two-sided Dunnett: every group vs groups[control]. [{i, j, diff, t, p}] */
  function dunnett(groups, control) {
    var pv = pooled(groups), n0 = groups[control].length, m0 = S.mean(groups[control]);
    var idx = [], lam = [];
    groups.forEach(function (g, i) { if (i !== control) { idx.push(i); lam.push(Math.sqrt(g.length / (g.length + n0))); } });
    function pMaxBelow(c) {
      return overS(function (s) {
        return simpson(function (z) {
          var prod = phi(z);
          for (var j = 0; j < lam.length; j++) {
            var r = Math.sqrt(1 - lam[j] * lam[j]);
            prod *= cdf((c * s + lam[j] * z) / r) - cdf((-c * s + lam[j] * z) / r);
            if (prod < 1e-300) return 0;
          }
          return prod;
        }, -8, 8, 160);
      }, pv.df);
    }
    return idx.map(function (i) {
      var g = groups[i], diff = S.mean(g) - m0;
      var t = diff / Math.sqrt(pv.mse * (1 / g.length + 1 / n0));
      return { i: control, j: i, diff: diff, t: t, df: pv.df, p: Math.max(0, Math.min(1, 1 - pMaxBelow(Math.abs(t)))) };
    });
  }

  /* Dunn's test after Kruskal–Wallis; pairs = [[i, j], ...]; raw two-sided p, Holm applied by caller */
  function dunn(groups, pairs) {
    var all = [], lab = [];
    groups.forEach(function (g, gi) { g.forEach(function (x) { all.push(x); lab.push(gi); }); });
    var N = all.length, order = all.map(function (v, i) { return [v, i]; }).sort(function (a, b) { return a[0] - b[0]; });
    var r = new Array(N), tie = 0, i = 0;
    while (i < N) {
      var j = i; while (j + 1 < N && order[j + 1][0] === order[i][0]) j++;
      var avg = (i + j) / 2 + 1, t = j - i + 1;
      for (var q = i; q <= j; q++) r[order[q][1]] = avg;
      if (t > 1) tie += t * t * t - t;
      i = j + 1;
    }
    var mr = groups.map(function () { return 0; }), cnt = groups.map(function (g) { return g.length; });
    for (var x = 0; x < N; x++) mr[lab[x]] += r[x];
    mr = mr.map(function (s, gi) { return s / cnt[gi]; });
    var base = N * (N + 1) / 12 - tie / (12 * (N - 1));
    return pairs.map(function (pr) {
      var a = pr[0], b = pr[1], z = (mr[b] - mr[a]) / Math.sqrt(base * (1 / cnt[a] + 1 / cnt[b]));
      return { i: a, j: b, z: z, p: Math.min(1, S.pZ(z)) };
    });
  }

  /* One-way repeated-measures ANOVA; rows = subjects, each an array over conditions */
  function rmAnova(rows) {
    var n = rows.length, k = rows[0].length, all = [].concat.apply([], rows), gm = S.mean(all);
    var ssCond = 0, ssSubj = 0, ssTot = 0;
    for (var c = 0; c < k; c++) { var mc = S.mean(rows.map(function (r) { return r[c]; })); ssCond += n * (mc - gm) * (mc - gm); }
    rows.forEach(function (r) { var ms = S.mean(r); ssSubj += k * (ms - gm) * (ms - gm); });
    all.forEach(function (v) { ssTot += (v - gm) * (v - gm); });
    var ssErr = ssTot - ssCond - ssSubj, d1 = k - 1, d2 = (k - 1) * (n - 1), F = (ssCond / d1) / (ssErr / d2);
    return { F: F, df1: d1, df2: d2, p: S.pF(F, d1, d2) };
  }

  window.PPlotStats = { ptukey: ptukey, tukey: tukey, dunnett: dunnett, dunn: dunn, rmAnova: rmAnova, cdf: cdf };
})();
