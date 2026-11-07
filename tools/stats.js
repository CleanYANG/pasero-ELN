/* Pasero free lab tools: statistics. Runs in the browser only.
   Distribution functions follow Numerical Recipes (incomplete beta / gamma). */
(function () {
  'use strict';

  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  function mean(a) { return a.length ? sum(a) / a.length : NaN; }
  function variance(a) {
    if (a.length < 2) return NaN;
    var m = mean(a), s = 0;
    for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m);
    return s / (a.length - 1);
  }
  function sd(a) { return Math.sqrt(variance(a)); }
  function sem(a) { return sd(a) / Math.sqrt(a.length); }
  function sorted(a) { return a.slice().sort(function (x, y) { return x - y; }); }
  /* Quantile, type 7 (R / Excel default) */
  function quantile(a, p) {
    var s = sorted(a), n = s.length; if (!n) return NaN;
    var h = (n - 1) * p, lo = Math.floor(h), hi = Math.ceil(h);
    return s[lo] + (h - lo) * (s[hi] - s[lo]);
  }
  function median(a) { return quantile(a, 0.5); }

  /* ---------- special functions ---------- */
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
      -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    var ser = 1.000000000190015;
    for (var j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function betacf(a, b, x) {
    var MAXIT = 300, EPS = 3e-16, FPMIN = 1e-300;
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; var h = d;
    for (var m = 1; m <= MAXIT; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  /* Regularized incomplete beta I_x(a, b) */
  function ibeta(x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
  /* Regularized upper incomplete gamma Q(a, x) */
  function gammq(a, x) {
    if (x <= 0) return 1;
    if (x < a + 1) {
      var ap = a, del = 1 / a, s = del;
      for (var n = 0; n < 500; n++) { ap += 1; del *= x / ap; s += del; if (Math.abs(del) < Math.abs(s) * 3e-16) break; }
      return 1 - s * Math.exp(-x + a * Math.log(x) - lgamma(a));
    }
    var b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d;
    for (var i = 1; i < 500; i++) {
      var an = -i * (i - a); b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; var dl = d * c; h *= dl;
      if (Math.abs(dl - 1) < 3e-16) break;
    }
    return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
  }
  /* Two-sided p for Student t */
  function pT(t, df) { if (!isFinite(t)) return t === t ? 0 : NaN; return ibeta(df / (df + t * t), df / 2, 0.5); }
  /* Upper-tail p for F */
  function pF(f, d1, d2) { if (!(f > 0)) return 1; return ibeta(d2 / (d2 + d1 * f), d2 / 2, d1 / 2); }
  /* Upper-tail p for chi-square */
  function pChi2(x, k) { return gammq(k / 2, x / 2); }
  function erfc(x) {
    var z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
      t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
      t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }
  /* Two-sided p for a standard normal z */
  function pZ(z) { return erfc(Math.abs(z) / Math.SQRT2); }

  /* ---------- tests ---------- */
  function welch(a, b) {
    var va = variance(a) / a.length, vb = variance(b) / b.length;
    var t = (mean(a) - mean(b)) / Math.sqrt(va + vb);
    var df = (va + vb) * (va + vb) / (va * va / (a.length - 1) + vb * vb / (b.length - 1));
    return { t: t, df: df, p: pT(t, df) };
  }
  function student(a, b) {
    var na = a.length, nb = b.length, df = na + nb - 2;
    var sp = ((na - 1) * variance(a) + (nb - 1) * variance(b)) / df;
    var t = (mean(a) - mean(b)) / Math.sqrt(sp * (1 / na + 1 / nb));
    return { t: t, df: df, p: pT(t, df) };
  }
  function paired(a, b) {
    var d = a.map(function (x, i) { return x - b[i]; });
    var t = mean(d) / (sd(d) / Math.sqrt(d.length)), df = d.length - 1;
    return { t: t, df: df, p: pT(t, df) };
  }
  function ranks(values) {
    var idx = values.map(function (v, i) { return [v, i]; }).sort(function (x, y) { return x[0] - y[0]; });
    var r = new Array(values.length), ties = [];
    for (var i = 0; i < idx.length;) {
      var j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
      var avg = (i + j) / 2 + 1;
      for (var k = i; k <= j; k++) r[idx[k][1]] = avg;
      if (j > i) ties.push(j - i + 1);
      i = j + 1;
    }
    return { r: r, ties: ties };
  }
  /* Mann–Whitney U: exact when small and untied, else normal approximation */
  function mannWhitney(a, b) {
    var n1 = a.length, n2 = b.length, all = a.concat(b), rk = ranks(all);
    var r1 = 0; for (var i = 0; i < n1; i++) r1 += rk.r[i];
    var u1 = r1 - n1 * (n1 + 1) / 2, u = Math.min(u1, n1 * n2 - u1);
    if (!rk.ties.length && n1 + n2 <= 30) {
      var dist = uDist(n1, n2), total = 0, tail = 0;
      for (var k = 0; k < dist.length; k++) { total += dist[k]; if (k <= u) tail += dist[k]; }
      return { U: u1, p: Math.min(1, 2 * tail / total), exact: true };
    }
    var n = n1 + n2, tie = rk.ties.reduce(function (s, t) { return s + t * t * t - t; }, 0);
    var sigma = Math.sqrt(n1 * n2 / 12 * ((n + 1) - tie / (n * (n - 1))));
    var z = (Math.abs(u1 - n1 * n2 / 2) - 0.5) / sigma;
    return { U: u1, p: Math.min(1, pZ(Math.max(z, 0))), exact: false };
  }
  /* Number of arrangements giving each U (no ties) */
  function uDist(n1, n2) {
    var memo = {};
    function f(m, n, u) {
      if (u < 0) return 0;
      if (m === 0 || n === 0) return u === 0 ? 1 : 0;
      var key = m + ',' + n + ',' + u; if (memo[key] !== undefined) return memo[key];
      return (memo[key] = f(m - 1, n, u - n) + f(m, n - 1, u));
    }
    var out = []; for (var u = 0; u <= n1 * n2; u++) out.push(f(n1, n2, u));
    return out;
  }
  /* Wilcoxon signed-rank (paired): exact when small and untied */
  function wilcoxon(a, b) {
    var d = [];
    for (var i = 0; i < a.length; i++) { var x = a[i] - b[i]; if (x !== 0) d.push(x); }
    var n = d.length; if (n < 1) return { W: 0, p: 1, exact: true };
    var rk = ranks(d.map(Math.abs)), wp = 0;
    for (var j = 0; j < n; j++) if (d[j] > 0) wp += rk.r[j];
    var wm = n * (n + 1) / 2 - wp, w = Math.min(wp, wm);
    if (!rk.ties.length && n <= 25) {
      var max = n * (n + 1) / 2, cnt = new Array(max + 1).fill(0); cnt[0] = 1;
      for (var k = 1; k <= n; k++) for (var s = max; s >= k; s--) cnt[s] += cnt[s - k];
      var tail = 0; for (var q = 0; q <= w; q++) tail += cnt[q];
      return { W: wp, p: Math.min(1, 2 * tail / Math.pow(2, n)), exact: true };
    }
    var tie = rk.ties.reduce(function (s2, t) { return s2 + t * t * t - t; }, 0);
    var sigma = Math.sqrt(n * (n + 1) * (2 * n + 1) / 24 - tie / 48);
    var z = (Math.abs(wp - n * (n + 1) / 4) - 0.5) / sigma;
    return { W: wp, p: Math.min(1, pZ(Math.max(z, 0))), exact: false };
  }
  function anova(groups) {
    var all = [].concat.apply([], groups), gm = mean(all), k = groups.length, N = all.length;
    var ssb = 0, ssw = 0;
    groups.forEach(function (g) {
      var m = mean(g); ssb += g.length * (m - gm) * (m - gm);
      g.forEach(function (x) { ssw += (x - m) * (x - m); });
    });
    var d1 = k - 1, d2 = N - k, f = (ssb / d1) / (ssw / d2);
    return { F: f, df1: d1, df2: d2, p: pF(f, d1, d2) };
  }
  function kruskal(groups) {
    var all = [].concat.apply([], groups), N = all.length, rk = ranks(all), h = 0, pos = 0;
    groups.forEach(function (g) {
      var r = 0; for (var i = 0; i < g.length; i++) r += rk.r[pos + i];
      pos += g.length; h += r * r / g.length;
    });
    h = 12 / (N * (N + 1)) * h - 3 * (N + 1);
    var tie = rk.ties.reduce(function (s, t) { return s + t * t * t - t; }, 0);
    if (tie) h /= 1 - tie / (N * N * N - N);
    var df = groups.length - 1;
    return { H: h, df: df, p: pChi2(h, df) };
  }
  /* Holm–Bonferroni adjusted p values, same order as input */
  function holm(ps) {
    var m = ps.length, order = ps.map(function (p, i) { return [p, i]; }).sort(function (a, b) { return a[0] - b[0]; });
    var adj = new Array(m), run = 0;
    order.forEach(function (o, k) { run = Math.max(run, Math.min(1, (m - k) * o[0])); adj[o[1]] = run; });
    return adj;
  }
  function stars(p) {
    if (!isFinite(p)) return '';
    return p < 0.0001 ? '****' : p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : 'ns';
  }
  function fmtP(p) {
    if (!isFinite(p)) return '—';
    if (p < 0.0001) return 'p < 0.0001';
    return 'p = ' + (p < 0.001 ? p.toFixed(4) : p < 0.01 ? p.toFixed(3) : p.toFixed(3)).replace(/0+$/, '').replace(/\.$/, '.0');
  }

  window.PStats = {
    sum: sum, mean: mean, variance: variance, sd: sd, sem: sem, median: median, quantile: quantile,
    lgamma: lgamma, ibeta: ibeta, gammq: gammq, pT: pT, pF: pF, pChi2: pChi2, pZ: pZ,
    welch: welch, student: student, paired: paired, mannWhitney: mannWhitney, wilcoxon: wilcoxon,
    anova: anova, kruskal: kruskal, holm: holm, stars: stars, fmtP: fmtP
  };
})();
