/* Reporter Generator — offline sample (fictional paper). No AI is called in sample mode. */
(function (global) {
  'use strict';
  const RG = global.RG;

  const PASSAGES = [
    ['d1', 'Abstract', 'Axon regeneration requires a large local supply of ATP. Here we identify the mitochondrial outer-membrane protein MTX9 as a factor required for mitochondrial transport into injured axons. In mtx9 mutant zebrafish larvae, the number of mitochondria entering the injured axon segment was reduced by 58% compared with wild type (n = 24 axons, p < 0.001), and axon regrowth at 48 h post-injury was reduced to 41% of wild-type length. Re-expression of MTX9 specifically in neurons restored both mitochondrial transport and regrowth.'],
    ['d2', 'Introduction', 'Peripheral axons of fish regenerate robustly after injury, but the cellular supply chains that support regrowth are incompletely understood. Mitochondria are transported along microtubules by kinesin and dynein motors and are thought to provide ATP and calcium buffering at the growth cone.'],
    ['d3', 'Introduction', 'Several adaptor proteins link mitochondria to motors, yet whether additional outer-membrane proteins regulate transport specifically after injury remains unclear. We screened outer-membrane proteins upregulated after injury and focused on MTX9.'],
    ['d4', 'Results', 'mtx9 transcripts increased 3.2-fold in posterior lateral line neurons 6 h after laser axotomy. Using live imaging of mito-GFP, we found that in mtx9 mutants the anterograde flux of mitochondria into the injured segment was reduced by 58% (Figure 2), while transport in uninjured axons was unchanged.'],
    ['d5', 'Results', 'Axon regrowth was measured 48 h after injury. Mutant axons reached 41% of wild-type regrowth length (Figure 3). Neuron-specific re-expression of MTX9 under the HuC promoter restored regrowth to 92% of wild type.'],
    ['d6', 'Methods', 'Zebrafish larvae (5 dpf) expressing mito-GFP in lateral line neurons were axotomised with a two-photon laser. Time-lapse imaging was acquired every 2 s for 10 min. Kymographs were analysed blind to genotype. Statistics: two-tailed Mann–Whitney test.'],
    ['d7', 'Discussion', 'Our data suggest that MTX9 is selectively required for injury-induced mitochondrial transport rather than baseline transport. Limitations include the use of a single injury model and the lack of direct ATP measurements at the growth cone.']
  ];
  const CAPS = [
    'Figure 1. Mitochondrial flux into the injured axon segment in wild type and mtx9 mutants (n = 24 axons; p < 0.001).',
    'Figure 2. Axon regrowth 48 h after injury in wild type, mtx9 mutant and neuron-specific rescue.'
  ];

  function chart(vals, ylab) {
    const c = document.createElement('canvas'); c.width = 1400; c.height = 1000; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 1400, 1000); g.strokeStyle = '#333'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(200, 100); g.lineTo(200, 850); g.lineTo(1300, 850); g.stroke();
    g.font = 'bold 40px Arial'; const step = vals.length === 2 ? 420 : 320;
    vals.forEach(([v, col, l], j) => { const x = 330 + j * step; g.fillStyle = col; g.fillRect(x, 850 - 700 * v, 220, 700 * v); g.fillStyle = '#222'; g.fillText(l, x + 40, 920); });
    g.save(); g.translate(110, 640); g.rotate(-Math.PI / 2); g.fillText(ylab, 0, 0); g.restore();
    return { img: c.toDataURL('image/png'), w: 1400, h: 1000 };
  }

  function load() {
    const S = RG.S;
    Object.assign(S, { blocks: [], figs: [], schematics: [], structure: null, structSig: '', reports: { poster: null, ppt: null }, demo: true, status: 'published', sentText: '' });
    S.meta = { title: 'Loss of the mitochondrial protein MTX9 impairs axon regeneration in zebrafish', authors: 'A. Tanaka, B. Li, C. Sato', affiliation: 'Sample Institute of Neurobiology (fictional sample)', doi: '10.0000/sample.2026.001' };
    S.blocks = PASSAGES.map(([id, h, text]) => ({ id, heading: h, text, source: 'sample-paper.pdf', kind: 'para', sel: true }));
    CAPS.forEach((c, i) => S.blocks.push({ id: 'dc' + (i + 1), heading: 'Results', text: c, source: 'sample-paper.pdf', kind: 'cap', capKind: 'Figure', capNum: String(i + 1), sel: false }));
    S.figs = [
      { id: 'F1', num: '1', label: 'Figure 1', caption: CAPS[0], sel: true, name: 'fig1.png', ...chart([[1, '#1A0080', 'WT'], [0.42, '#8E73CF', 'mtx9']], 'Mito flux (rel.)') },
      { id: 'F2', num: '2', label: 'Figure 2', caption: CAPS[1], sel: true, name: 'fig2.png', ...chart([[1, '#1A0080', 'WT'], [0.41, '#8E73CF', 'mtx9'], [0.92, '#6ea88d', 'rescue']], 'Regrowth (rel.)') }
    ];
    S.chat = [];
  }

  const TXT = {
    ja: {
      title: 'ミトコンドリアタンパク質MTX9の欠損はゼブラフィッシュの軸索再生を阻害する', short: 'MTX9と軸索再生',
      sch: ['損傷後のミトコンドリア輸送モデル', '軸索損傷 → MTX9発現上昇 → ミトコンドリアが損傷部へ輸送され成長円錐を支えるという流れの模式図'],
      headline: 'MTX9は損傷時のミトコンドリア輸送を支え、軸索再生に必要である',
      bg: ['背景', ['軸索再生には局所的に大量のATPが必要', '損傷時に輸送を調節する因子は不明']],
      aim: ['問い', ['損傷部へのミトコンドリア輸送を制御する外膜タンパク質は何か']],
      me: ['方法', ['側線ニューロンを2光子レーザーで切断', 'mito-GFPのライブイメージングとキモグラフ解析']],
      r1: ['結果1：輸送が58%低下', ['mtx9変異体で損傷部への流入が58%減少（n = 24軸索）', '非損傷軸索の輸送は変化なし']],
      r2: ['結果2：再生の低下と回復', ['再生長は野生型の41%', 'ニューロン特異的発現で92%まで回復']],
      co: ['結論', ['MTX9は損傷誘導性の輸送に選択的に必要', '課題：成長円錐でのATP測定']],
      take: ['MTX9は損傷時だけミトコンドリア輸送を支える', '輸送の低下が再生の低下につながる'],
      s_bg: '軸索再生にはミトコンドリアの供給が必要', s_me: '方法：生きたまま輸送を観察する', s_r1: 'mtx9変異体では損傷部への流入が58%減少', s_r2: '再生長は41%に低下し、ニューロンでの発現で回復', s_sum: 'まとめ', s_model: '提案するモデル',
      reply: 'サンプル結果です（AIは呼び出していません）。ログインすると、ここで「もっと簡潔に」などと伝えて修正できます。'
    },
    zh: {
      title: '线粒体蛋白 MTX9 缺失会阻碍斑马鱼轴突再生', short: 'MTX9 与轴突再生',
      sch: ['损伤后线粒体运输模型', '示意流程：轴突损伤 → MTX9 表达上升 → 线粒体被运往损伤部位、支持生长锥'],
      headline: 'MTX9 支撑损伤时的线粒体运输，是轴突再生所必需的',
      bg: ['背景', ['轴突再生需要局部大量 ATP', '损伤时调节运输的因子尚不清楚']],
      aim: ['问题', ['哪种外膜蛋白调控线粒体向损伤部位的运输？']],
      me: ['方法', ['双光子激光切断侧线神经元轴突', 'mito-GFP 活体成像与 kymograph 分析']],
      r1: ['结果 1：运输下降 58%', ['mtx9 突变体中进入损伤段的线粒体减少 58%（n = 24 条轴突）', '未损伤轴突的运输不变']],
      r2: ['结果 2：再生下降与恢复', ['再生长度为野生型的 41%', '神经元特异性回补后恢复到 92%']],
      co: ['结论', ['MTX9 选择性地参与损伤诱导的运输', '待解决：生长锥 ATP 的直接测量']],
      take: ['MTX9 只在损伤时支撑线粒体运输', '运输下降导致再生下降'],
      s_bg: '轴突再生需要线粒体供给', s_me: '方法：活体观察运输过程', s_r1: 'mtx9 突变体进入损伤部位的线粒体减少 58%', s_r2: '再生长度降至 41%，神经元回补后恢复', s_sum: '总结', s_model: '提出的模型',
      reply: '这是示例结果（没有调用 AI）。登录后可以在这里说“更精简一些”等要求来修改。'
    },
    en: {
      title: 'Loss of the mitochondrial protein MTX9 impairs axon regeneration in zebrafish', short: 'MTX9 & axon regeneration',
      sch: ['Model of post-injury mitochondrial transport', 'Flow: axon injury → MTX9 up-regulated → mitochondria transported to the injured segment, supporting the growth cone'],
      headline: 'MTX9 supports injury-induced mitochondrial transport and is required for axon regrowth',
      bg: ['Background', ['Axon regrowth needs a large local ATP supply', 'Factors that tune transport after injury are unknown']],
      aim: ['Question', ['Which outer-membrane protein controls mitochondrial delivery to injured axons?']],
      me: ['Approach', ['Two-photon laser axotomy of lateral line neurons', 'Live mito-GFP imaging and kymograph analysis']],
      r1: ['Result 1: transport drops 58%', ['Mitochondrial influx reduced by 58% in mtx9 mutants (n = 24 axons)', 'Uninjured axons unchanged']],
      r2: ['Result 2: regrowth lost and rescued', ['Regrowth only 41% of wild type', 'Neuron-specific MTX9 restores 92%']],
      co: ['Conclusion', ['MTX9 is selectively required for injury-induced transport', 'Open: direct ATP measurement at the growth cone']],
      take: ['MTX9 supports mitochondrial transport only after injury', 'Less transport means less regrowth'],
      s_bg: 'Regrowing axons need a supply of mitochondria', s_me: 'Approach: watching transport in live larvae', s_r1: 'Mitochondrial influx drops 58% in mtx9 mutants', s_r2: 'Regrowth falls to 41% and is rescued in neurons', s_sum: 'Summary', s_model: 'Proposed model',
      reply: 'Sample result (no AI was called). Sign in to refine it here, e.g. “make it more concise”.'
    }
  };

  function plan(kind, lang) {
    const x = TXT[lang] || TXT.en, S = RG.S;
    const structure = { title: x.title, short_title: x.short, authors: S.meta.authors, affiliation: S.meta.affiliation };
    const schematics = [{ id: 'S1', title: x.sch[0], description: x.sch[1] }];
    const sec = (p, figs, sch, src, emphasis) => ({ heading: p[0], bullets: p[1], figure_ids: figs, schematic_ids: sch, sources: src, emphasis: !!emphasis });
    const report = kind === 'poster'
      ? { headline: x.headline, take_home: x.take, sections: [sec(x.bg, [], [], ['d2']), sec(x.aim, [], ['S1'], ['d3']), sec(x.me, [], [], ['d6']), sec(x.r1, ['F1'], [], ['d4', 'd1'], true), sec(x.r2, ['F2'], [], ['d5']), sec(x.co, [], [], ['d7'])] }
      : {
        slides: [
          { layout: 'title', title: x.title, bullets: [S.meta.authors, S.meta.affiliation], sources: [] },
          { layout: 'bullets', title: x.s_bg, bullets: x.bg[1].concat(x.aim[1]), sources: ['d2', 'd3'], notes: '' },
          { layout: 'bullets', title: x.s_me, bullets: x.me[1], sources: ['d6'], notes: '' },
          { layout: 'figure_bullets', title: x.s_r1, bullets: x.r1[1], figure_id: 'F1', sources: ['d4'], notes: '' },
          { layout: 'figure_bullets', title: x.s_r2, bullets: x.r2[1], figure_id: 'F2', sources: ['d5'], notes: '' },
          { layout: 'figure', title: x.s_model, bullets: [], schematic_id: 'S1', sources: ['d7'], notes: '' },
          { layout: 'conclusion', title: x.s_sum, bullets: x.take.concat(x.co[1].slice(1)), sources: ['d7'], notes: '' }
        ]
      };
    return { structure, schematics, report, reply: x.reply };
  }

  function schematic(s) {
    const c = document.createElement('canvas'); c.width = 1536; c.height = 1024; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 1536, 1024);
    const box = (x, col, label) => { g.fillStyle = col; g.beginPath(); g.roundRect(x, 380, 360, 220, 40); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 44px Arial'; g.textAlign = 'center'; g.fillText(label, x + 180, 505); };
    box(90, '#8E73CF', 'Injury'); box(588, '#1A0080', 'MTX9 ↑'); box(1086, '#6ea88d', 'Mito → cone');
    g.strokeStyle = '#555'; g.lineWidth = 10;[470, 968].forEach(x => { g.beginPath(); g.moveTo(x, 490); g.lineTo(x + 100, 490); g.stroke(); g.beginPath(); g.moveTo(x + 112, 490); g.lineTo(x + 82, 466); g.lineTo(x + 82, 514); g.fillStyle = '#555'; g.fill(); });
    g.fillStyle = '#999'; g.font = '30px Arial'; g.fillText('(sample schematic — not a real AI image)', 768, 860);
    return { image: c.toDataURL('image/png'), w: 1536, h: 1024 };
  }

  global.RGDemo = { load, plan, schematic };
})(window);
