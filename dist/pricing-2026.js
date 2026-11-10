/* Pasero pricing (2026-11): plans, prices and the Free / Pro comparison.
   Source of truth: "Pasero 功能清单与定价方案" (final pricing doc).
   Renders its own EN / ZH / JA copy; the container carries data-copy so the site translator skips it. */
(function () {
  'use strict';

  var PRICES = {
    USD: { sym: '$', dec: 2, free: [0, 0], mobile: [24.99, 2.99], desktop: [39.99, 4.99], complete: [49.99, 5.99] },
    JPY: { sym: '¥', dec: 0, free: [0, 0], mobile: [3800, 480], desktop: [6000, 780], complete: [7800, 980] },
    CNY: { sym: '¥', dec: 0, free: [0, 0], mobile: [98, 12], desktop: [148, 18], complete: [198, 25] }
  };
  var DEFAULT_CURRENCY = { en: 'USD', ja: 'JPY', zh: 'CNY' };

  var T = {
    lead: {
      en: 'Free covers everyday research. Pro adds advanced analysis, unlimited tracking and more ways to present your work. Your existing data is never locked.',
      zh: '免费版覆盖日常科研；Pro 增加高级分析、不限次数的追踪和更多成果输出。已有数据永远不会被锁住。',
      ja: '無料版で日々の研究をカバー。Pro では高度な解析、回数無制限のトラッキング、成果のまとめ機能が加わります。既存のデータがロックされることはありません。'
    },
    beta: {
      en: 'Public beta: every Pro feature is free and purchasing is not open yet. Beta users get 50% off their first paid year.',
      zh: '内测中：Pro 功能全部免费开放，暂不收费。内测用户在正式版首年享半价。',
      ja: 'ベータ版公開中：Pro の全機能を無料で使えます。購入はまだ受け付けていません。ベータ参加者は正式版の初年度が半額になります。'
    },
    annual: { en: 'Yearly', zh: '年付', ja: '年払い' },
    monthly: { en: 'Monthly', zh: '月付', ja: '月払い' },
    billingLabel: { en: 'Billing period', zh: '付费周期', ja: 'お支払い周期' },
    currencyLabel: { en: 'Currency', zh: '货币', ja: '通貨' },
    perYear: { en: '/ year', zh: '/ 年', ja: '/ 年' },
    perMonth: { en: '/ month', zh: '/ 月', ja: '/ 月' },
    forever: { en: 'Free forever', zh: '永久免费', ja: 'ずっと無料' },
    equiv: { en: 'About {p} a month', zh: '约合 {p} / 月', ja: '月あたり約 {p}' },
    billedMonthly: { en: 'Billed monthly', zh: '按月付费', ja: '毎月のお支払い' },
    taxIncl: { en: 'Tax included', zh: '含消费税', ja: '税込' },
    saveBoth: { en: 'Save {p} vs buying both', zh: '比分开买两档省 {p}', ja: '2 つ別々に買うより {p} お得' },
    plans: {
      free: {
        name: { en: 'Free', zh: '免费版', ja: '無料版' },
        covers: { en: 'Desktop + mobile', zh: '桌面 + 手机', ja: 'デスクトップ + モバイル' },
        what: { en: 'Notes, resources, literature, general analysis and LAN sync.', zh: '笔记、资源库、文献、通用分析和局域网同步。', ja: 'ノート、リソース、文献、一般的な解析、LAN 同期。' }
      },
      mobile: {
        name: { en: 'Mobile Pro', zh: '移动 Pro', ja: 'モバイル Pro' },
        covers: { en: 'Phone and tablet', zh: '手机和平板', ja: 'スマートフォン・タブレット' },
        what: { en: 'Unlimited digest setups and cell tracking, multi-note PDF.', zh: '酶切反应和细胞追踪不限次数，多条笔记合并 PDF。', ja: '制限酵素反応と細胞トラッキングが無制限、複数ノートの PDF 化。' }
      },
      desktop: {
        name: { en: 'Desktop Pro', zh: '桌面 Pro', ja: 'デスクトップ Pro' },
        covers: { en: 'Windows and macOS', zh: 'Windows 和 macOS', ja: 'Windows・macOS' },
        what: { en: 'qPCR, Western blot, advanced primers, vector figure export and more, unlimited.', zh: 'qPCR、WB、高级引物、矢量图导出等，全部不限次数。', ja: 'qPCR、ウェスタンブロット、高度なプライマー設計、ベクター図の書き出しなどが無制限。' }
      },
      complete: {
        name: { en: 'Complete Pro', zh: 'Complete Pro', ja: 'Complete Pro' },
        covers: { en: 'Desktop + mobile', zh: '桌面 + 手机', ja: 'デスクトップ + モバイル' },
        what: { en: 'Everything in Desktop Pro and Mobile Pro, on one account.', zh: '桌面 Pro 和移动 Pro 的全部功能，一个账号通用。', ja: 'デスクトップ Pro とモバイル Pro のすべてを 1 つのアカウントで。' }
      }
    },
    diffOnly: { en: 'Only features that differ between Free and Pro', zh: '只看免费和 Pro 不同的功能', ja: '無料版と Pro で違う機能だけ表示' },
    hiddenSame: { en: '{n} more features work the same in Free and Pro.', zh: '另有 {n} 项功能在免费版和 Pro 中相同。', ja: 'ほかに {n} 件の機能は無料版と Pro で同じです。' },
    showAll: { en: 'Show all', zh: '显示全部', ja: 'すべて表示' },
    compareTitle: { en: 'Free and Pro, side by side', zh: '免费版和 Pro 逐项对比', ja: '無料版と Pro の比較' },
    tabDesktop: { en: 'Desktop', zh: '桌面端', ja: 'デスクトップ' },
    tabMobile: { en: 'Mobile', zh: '移动端', ja: 'モバイル' },
    colFeature: { en: 'Feature', zh: '功能', ja: '機能' },
    colFree: { en: 'Free', zh: '免费', ja: '無料' },
    colPro: { en: 'Pro', zh: 'Pro', ja: 'Pro' },
    colProDesktop: { en: 'Desktop Pro or Complete', zh: '桌面 Pro 或 Complete', ja: 'デスクトップ Pro / Complete' },
    colProMobile: { en: 'Mobile Pro or Complete', zh: '移动 Pro 或 Complete', ja: 'モバイル Pro / Complete' },
    v: {
      yes: { en: 'Included', zh: '包含', ja: '含まれる' },
      no: { en: 'Not included', zh: '不包含', ja: '含まれない' },
      five: { en: '5 uses', zh: '5 次', ja: '5 回' },
      unlimited: { en: 'Unlimited', zh: '不限', ja: '無制限' },
      one: { en: '1 per import', zh: '每次 1 条', ja: '1 件ずつ' },
      many: { en: 'Many at once', zh: '一次多条', ja: '一括' },
      ai: { en: 'Pay per use', zh: '按次计费', ja: '従量課金' }
    },
    notes: {
      en: [
        '5 uses: each account gets 5 free uses on desktop and 5 on mobile for each of these features; after that it needs the matching Pro.',
        'Your notes, resources and results can always be viewed, edited and synced. When Pro ends, only new Pro actions are locked.',
        'Pasero AI is not part of any plan and is billed per use. During the beta, accounts outside mainland China get a free allowance; AI is not yet available in mainland China.',
        'All plans are sold on this website. Inside the iPhone, iPad and Android apps you can buy Mobile Pro and Complete Pro. Upgrading from one platform to Complete costs only the difference.',
        'Yen prices include consumption tax. Prices are final when purchasing opens.'
      ],
      zh: [
        '“5 次”：每个账号的这些功能在桌面端、移动端各有 5 次免费，用完后需要对应的 Pro。',
        '已有笔记、资源和结果永远可以查看、编辑和同步；Pro 到期只会锁住新的 Pro 操作。',
        'Pasero AI 不包含在任何套餐中，按次计费。内测期间中国大陆以外的账号有免费额度；中国大陆暂未开放 AI。',
        '官网可购买全部套餐；iPhone、iPad 和 Android App 内可购买移动 Pro 与 Complete Pro。从单端 Pro 升级到 Complete 只需补差价。',
        '日元价格含消费税。价格以正式开放购买时为准。'
      ],
      ja: [
        '「5 回」：各アカウントは、これらの機能をデスクトップとモバイルでそれぞれ 5 回まで無料で使えます。それ以降は対応する Pro が必要です。',
        'ノート、リソース、結果はいつでも閲覧・編集・同期できます。Pro が終了しても、ロックされるのは新しい Pro の操作だけです。',
        'Pasero AI はどのプランにも含まれず、利用ごとの課金です。ベータ期間中は中国本土以外のアカウントに無料枠があります。中国本土では AI はまだ提供していません。',
        'すべてのプランはこのサイトで購入できます。iPhone・iPad・Android アプリ内ではモバイル Pro と Complete Pro を購入できます。片方の Pro から Complete へのアップグレードは差額のみです。',
        '円の価格は税込です。価格は購入受付の開始時に確定します。'
      ]
    }
  };

  // [name, detail, free, pro]; values: yes | no | five | unlimited | one | many | ai
  var FEATURES = {
    desktop: [
      { group: { en: 'Notes and records', zh: '笔记与记录', ja: 'ノートと記録' }, rows: [
        [{ en: 'Lab notes', zh: '实验笔记', ja: '実験ノート' }, { en: 'Four ways to start, tables with formulas, annotated images, results, linked resources, Word / PDF export', zh: '四种新建方式、表格与公式、图片标注、实验结果、关联资源、导出 Word / PDF', ja: '4 種類の作成方法、数式付きの表、画像の注釈、結果、リソースの関連付け、Word / PDF 書き出し' }, 'yes', 'yes'],
        [{ en: 'Batch note import', zh: '批量导入笔记', ja: 'ノートの一括取り込み' }, { en: 'Excel, CSV and documents', zh: 'Excel、CSV 和文档', ja: 'Excel・CSV・文書' }, 'one', 'many'],
        [{ en: 'Research assistant', zh: '研究助手检索', ja: 'リサーチアシスタント' }, { en: 'Genes, proteins, terms, cell lines and reagents', zh: '基因、蛋白、术语、细胞系、试剂', ja: '遺伝子、タンパク質、用語、細胞株、試薬' }, 'yes', 'yes']
      ] },
      { group: { en: 'Data analysis', zh: '数据分析', ja: 'データ解析' }, rows: [
        [{ en: 'General analysis and statistics', zh: '通用分析与统计', ja: '一般的な解析と統計' }, { en: 'Statistical tests, curve fitting, charts saved to notes', zh: '统计检验、曲线拟合、图表存进笔记', ja: '統計検定、カーブフィッティング、グラフをノートに保存' }, 'yes', 'yes'],
        [{ en: 'Figure export', zh: '数据图导出', ja: '図の書き出し' }, { en: 'Nature / Cell / Science styles as PDF or SVG vector files', zh: '按 Nature / Cell / Science 格式导出 PDF / SVG 矢量图', ja: 'Nature / Cell / Science 形式で PDF / SVG ベクター出力' }, 'five', 'unlimited'],
        [{ en: 'qPCR analysis', zh: 'qPCR 分析', ja: 'qPCR 解析' }, null, 'no', 'yes'],
        [{ en: 'Western blot quantification', zh: 'Western blot 定量', ja: 'ウェスタンブロット定量' }, null, 'no', 'yes']
      ] },
      { group: { en: 'Plasmids and molecular tools', zh: '质粒与分子工具', ja: 'プラスミドと分子生物学ツール' }, rows: [
        [{ en: 'Plasmid library and maps', zh: '质粒库与图谱', ja: 'プラスミドライブラリとマップ' }, { en: 'GenBank import, auto-annotation, sequence editing, publication map export', zh: 'GenBank 导入、自动注释、序列编辑、出版用图谱导出', ja: 'GenBank 取り込み、自動アノテーション、配列編集、論文用マップ書き出し' }, 'yes', 'yes'],
        [{ en: 'Restriction analysis', zh: '酶切分析', ja: '制限酵素解析' }, { en: '272 enzymes, cut sites, fragment sizes, gel preview, buffer advice', zh: '272 种酶、切点、片段大小、电泳预览、缓冲液推荐', ja: '272 種類の酵素、切断部位、断片サイズ、泳動プレビュー、バッファー提案' }, 'yes', 'yes'],
        [{ en: 'Digest reaction setup', zh: '酶切反应设置', ja: '制限酵素反応の設定' }, { en: 'Sample table, volumes, start the reaction and log it to a note', zh: '样品表、加样量、开始反应并写入笔记', ja: 'サンプル表、添加量の計算、反応開始とノートへの記録' }, 'five', 'unlimited'],
        [{ en: 'Basic primer design', zh: '基础引物设计', ja: '基本的なプライマー設計' }, null, 'yes', 'yes'],
        [{ en: 'Advanced primer design', zh: '高级引物设计', ja: '高度なプライマー設計' }, null, 'no', 'yes'],
        [{ en: 'Sanger alignment', zh: 'Sanger 测序比对', ja: 'サンガー配列アラインメント' }, { en: 'AB1 files', zh: 'AB1 文件', ja: 'AB1 ファイル' }, 'five', 'unlimited']
      ] },
      { group: { en: 'Cells and resources', zh: '细胞与资源库', ja: '細胞とリソース' }, rows: [
        [{ en: 'Start a cell culture track', zh: '新建细胞培养追踪', ja: '細胞培養トラッキングの開始' }, { en: 'Thaw or start a new culture', zh: '复苏或开始新培养', ja: '起眠または新しい培養の開始' }, 'five', 'unlimited'],
        [{ en: 'Keep recording existing cultures', zh: '已有培养继续记录', ja: '既存の培養の記録' }, { en: 'Passages, freezing, vial counts, passage reminders', zh: '传代、冻存、冻存支数、传代提醒', ja: '継代、凍結、ストック本数、継代リマインダー' }, 'yes', 'yes'],
        [{ en: 'Protocol, reagent and cell libraries', zh: '方案、试剂和细胞库', ja: 'プロトコル・試薬・細胞ライブラリ' }, null, 'yes', 'yes'],
        [{ en: 'Build protocols from your records', zh: '从实验记录整理方案', ja: '記録からプロトコルを作成' }, null, 'five', 'unlimited']
      ] },
      { group: { en: 'Literature and presenting', zh: '文献与汇报', ja: '文献と発表' }, rows: [
        [{ en: 'Literature library', zh: '文献管理', ja: '文献管理' }, { en: 'PDF reading and notes, term lookup, citation styles, open-access PDFs', zh: 'PDF 阅读与标注、术语解释、引用格式、开放获取 PDF', ja: 'PDF の閲覧と注釈、用語解説、引用形式、オープンアクセス PDF' }, 'yes', 'yes'],
        [{ en: 'Slides from your results', zh: '用实验结果生成 PPT', ja: '結果からスライド作成' }, null, 'five', 'unlimited'],
        [{ en: 'Pasero AI', zh: 'Pasero AI', ja: 'Pasero AI' }, { en: 'Journal club, conference talks, posters, schematics', zh: '组会读文献、学会报告、海报、示意图', ja: '論文抄読会、学会発表、ポスター、模式図' }, 'ai', 'ai']
      ] },
      { group: { en: 'Sync', zh: '同步', ja: '同期' }, rows: [
        [{ en: 'LAN sync with your phone', zh: '局域网同步手机', ja: 'スマートフォンと LAN 同期' }, { en: 'Pair by QR code, two-way manual sync', zh: '扫码配对，双向手动同步', ja: 'QR コードでペアリング、双方向の手動同期' }, 'yes', 'yes']
      ] }
    ],
    mobile: [
      { group: { en: 'Notes and everyday tools', zh: '笔记与日常工具', ja: 'ノートと日常のツール' }, rows: [
        [{ en: 'Notes', zh: '笔记', ja: 'ノート' }, { en: 'Works offline, tables with formulas, photos, results, protocol templates, lock-screen quick notes', zh: '离线保存、表格与公式、拍照附件、实验结果、方案模板、锁屏快速记录', ja: 'オフライン保存、数式付きの表、写真、結果、プロトコルテンプレート、ロック画面からのメモ' }, 'yes', 'yes'],
        [{ en: 'Calculators in notes', zh: '笔记内计算器', ja: 'ノート内の計算ツール' }, { en: 'Molarity, dilution, master mix, unit conversion', zh: '摩尔浓度、稀释、Master Mix、单位换算', ja: 'モル濃度、希釈、マスターミックス、単位換算' }, 'yes', 'yes'],
        [{ en: 'To-dos and lab timers', zh: '待办与实验计时', ja: 'To-do と実験タイマー' }, { en: 'Exact alarms and lock-screen reminders', zh: '精确闹钟、锁屏提醒', ja: '正確なアラームとロック画面の通知' }, 'yes', 'yes']
      ] },
      { group: { en: 'Plasmids and cells', zh: '质粒与细胞', ja: 'プラスミドと細胞' }, rows: [
        [{ en: 'Plasmids and restriction analysis', zh: '质粒库与酶切分析', ja: 'プラスミドと制限酵素解析' }, { en: 'Cut-site map, fragments, virtual gel, buffer advice', zh: '切点图、片段、虚拟电泳、缓冲液推荐', ja: '切断部位マップ、断片、仮想電気泳動、バッファー提案' }, 'yes', 'yes'],
        [{ en: 'Digest reaction setup', zh: '酶切反应设置', ja: '制限酵素反応の設定' }, { en: 'Sample table, volumes, timer, logged to a note', zh: '样品表、加样量、计时、自动写入笔记', ja: 'サンプル表、添加量、タイマー、ノートへ自動記録' }, 'five', 'unlimited'],
        [{ en: 'Start a cell culture track', zh: '新建细胞培养追踪', ja: '細胞培養トラッキングの開始' }, null, 'five', 'unlimited'],
        [{ en: 'Keep recording existing cultures', zh: '已有培养继续记录', ja: '既存の培養の記録' }, { en: 'Passages, freezing, reminders, timeline', zh: '传代、冻存、传代提醒、时间线', ja: '継代、凍結、リマインダー、タイムライン' }, 'yes', 'yes'],
        [{ en: 'Reagents and safety', zh: '试剂库与安全信息', ja: '試薬と安全情報' }, { en: 'GHS hazards from PubChem', zh: 'GHS 危害信息（PubChem）', ja: 'PubChem の GHS 危険有害性情報' }, 'yes', 'yes']
      ] },
      { group: { en: 'Search and papers', zh: '检索与文献', ja: '検索と論文' }, rows: [
        [{ en: 'Life-science search', zh: '生命科学检索', ja: 'ライフサイエンス検索' }, { en: 'NCBI, Europe PMC, UniProt, PubChem, PDB, Cellosaurus, GTEx', zh: 'NCBI、Europe PMC、UniProt、PubChem、PDB、Cellosaurus、GTEx', ja: 'NCBI、Europe PMC、UniProt、PubChem、PDB、Cellosaurus、GTEx' }, 'yes', 'yes'],
        [{ en: 'Paper reading', zh: '文献阅读', ja: '論文の閲覧' }, { en: 'Open-access PDF download, reader, recommendations', zh: '开放获取 PDF 下载、阅读器、论文推荐', ja: 'オープンアクセス PDF の取得、リーダー、おすすめ論文' }, 'yes', 'yes']
      ] },
      { group: { en: 'Export, AI and sync', zh: '导出、AI 与同步', ja: '書き出し・AI・同期' }, rows: [
        [{ en: 'Single-note PDF', zh: '单条笔记 PDF', ja: '1 件のノートを PDF に' }, null, 'yes', 'yes'],
        [{ en: 'Multi-note PDF', zh: '多条笔记合并 PDF', ja: '複数ノートをまとめて PDF に' }, null, 'no', 'yes'],
        [{ en: 'Pasero AI', zh: 'Pasero AI', ja: 'Pasero AI' }, { en: 'Chat with your notes, image generation', zh: '带笔记内容的对话、生成图片', ja: 'ノートを使った対話、画像生成' }, 'ai', 'ai'],
        [{ en: 'LAN sync with desktop', zh: '局域网同步桌面端', ja: 'デスクトップと LAN 同期' }, null, 'yes', 'yes']
      ] }
    ]
  };

  var root = document.querySelector('[data-pricing-2026]');
  if (!root) return;
  var state = { billing: 'annual', currency: null, platform: 'desktop', currencyChosen: false, diffOnly: true };

  function lang() {
    var l = window.PaseroI18n && window.PaseroI18n.getLanguage ? window.PaseroI18n.getLanguage() : 'en';
    return l === 'zh' || l === 'ja' ? l : 'en';
  }
  function tr(obj) { var l = lang(); return obj[l] || obj.en; }
  function money(cur, value) {
    var c = PRICES[cur];
    if (!value) return c.sym + '0';
    var n = c.dec ? value.toFixed(c.dec) : Math.round(value).toLocaleString('en-US');
    return c.sym + n;
  }
  function perMonth(cur, value) {
    if (cur === 'CNY') return '¥' + String(Math.round(value * 10) / 10);
    return money(cur, value);
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  var CHECK = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><path d="M4.5 10.5l3.6 3.6L15.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function cellValue(v) {
    var span = el('span', 'px-v px-v-' + v);
    if (v === 'yes') { span.innerHTML = CHECK; span.setAttribute('role', 'img'); span.setAttribute('aria-label', tr(T.v.yes)); }
    else if (v === 'no') { span.textContent = '—'; span.setAttribute('aria-label', tr(T.v.no)); }
    else span.textContent = tr(T.v[v]);
    return span;
  }

  function renderStatic() {
    root.querySelector('[data-px-lead]').textContent = tr(T.lead);
    root.querySelector('[data-px-beta]').textContent = tr(T.beta);
    root.querySelector('[data-px-compare-title]').textContent = tr(T.compareTitle);
    var billing = root.querySelector('[data-px-billing]');
    billing.setAttribute('aria-label', tr(T.billingLabel));
    billing.querySelector('[data-value="annual"]').textContent = tr(T.annual);
    billing.querySelector('[data-value="monthly"]').textContent = tr(T.monthly);
    root.querySelector('[data-px-currency]').setAttribute('aria-label', tr(T.currencyLabel));
    root.querySelector('[data-px-tab="desktop"]').textContent = tr(T.tabDesktop);
    root.querySelector('[data-px-tab="mobile"]').textContent = tr(T.tabMobile);
    root.querySelector('[data-px-diff-label]').textContent = tr(T.diffOnly);
    var notes = root.querySelector('[data-px-notes]');
    notes.replaceChildren();
    tr(T.notes).forEach(function (n) { notes.appendChild(el('li', null, n)); });
  }

  function renderControls() {
    root.querySelectorAll('[data-px-billing] button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.value === state.billing)); });
    root.querySelectorAll('[data-px-currency] button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.value === state.currency)); });
    root.querySelector('[data-px-diff]').setAttribute('aria-checked', String(state.diffOnly));
    root.querySelectorAll('[data-px-tab]').forEach(function (b) {
      var on = b.dataset.pxTab === state.platform;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
    });
  }

  function renderPlans() {
    var grid = root.querySelector('[data-px-plans]');
    grid.replaceChildren();
    var cur = state.currency, idx = state.billing === 'annual' ? 0 : 1, c = PRICES[cur];
    ['free', 'mobile', 'desktop', 'complete'].forEach(function (key) {
      var p = T.plans[key], card = el('article', 'px-plan px-plan-' + key);
      var head = el('div', 'px-plan-head');
      head.appendChild(el('h3', 'px-plan-name', tr(p.name)));
      head.appendChild(el('span', 'px-plan-covers', tr(p.covers)));
      card.appendChild(head);
      var price = el('p', 'px-price');
      var value = c[key][idx];
      price.appendChild(el('span', 'px-amount', money(cur, value)));
      if (key !== 'free') price.appendChild(el('span', 'px-per', tr(state.billing === 'annual' ? T.perYear : T.perMonth)));
      card.appendChild(price);
      var sub;
      if (key === 'free') sub = tr(T.forever);
      else if (state.billing === 'annual') sub = tr(T.equiv).replace('{p}', perMonth(cur, value / 12));
      else sub = tr(T.billedMonthly);
      if (cur === 'JPY' && key !== 'free') sub += ' · ' + tr(T.taxIncl);
      card.appendChild(el('p', 'px-sub', sub));
      card.appendChild(el('p', 'px-what', tr(p.what)));
      if (key === 'complete') {
        var saving = c.mobile[idx] + c.desktop[idx] - c.complete[idx];
        card.appendChild(el('p', 'px-save', tr(T.saveBoth).replace('{p}', money(cur, saving))));
      }
      grid.appendChild(card);
    });
  }

  function renderTable() {
    var table = root.querySelector('[data-px-table]');
    table.replaceChildren();
    var platform = state.platform;
    table.setAttribute('aria-labelledby', 'px-tab-' + platform);
    var thead = el('thead'), hr = el('tr');
    var th0 = el('th', 'px-col-feature', tr(T.colFeature)); th0.scope = 'col';
    var th1 = el('th', 'px-col-free'); th1.scope = 'col';
    th1.appendChild(el('span', 'px-col-name', tr(T.colFree)));
    var th2 = el('th', 'px-col-pro'); th2.scope = 'col';
    th2.appendChild(el('span', 'px-col-name', tr(T.colPro)));
    th2.appendChild(el('span', 'px-col-note', tr(platform === 'desktop' ? T.colProDesktop : T.colProMobile)));
    hr.append(th0, th1, th2); thead.appendChild(hr); table.appendChild(thead);
    var hidden = 0;
    FEATURES[platform].forEach(function (section) {
      var rows = section.rows.filter(function (r) { return !state.diffOnly || r[2] !== r[3]; });
      hidden += section.rows.length - rows.length;
      if (!rows.length) return;
      var tbody = el('tbody');
      var gr = el('tr', 'px-group'), gth = el('th', null, tr(section.group));
      gth.colSpan = 3; gth.scope = 'colgroup'; gr.appendChild(gth); tbody.appendChild(gr);
      rows.forEach(function (r) {
        var tr_ = el('tr');
        var name = el('th', 'px-feature'); name.scope = 'row';
        name.appendChild(el('span', 'px-feature-name', tr(r[0])));
        if (r[1]) name.appendChild(el('span', 'px-feature-detail', tr(r[1])));
        var td1 = el('td', 'px-free'), td2 = el('td', 'px-pro');
        td1.appendChild(cellValue(r[2])); td2.appendChild(cellValue(r[3]));
        tr_.append(name, td1, td2); tbody.appendChild(tr_);
      });
      table.appendChild(tbody);
    });
    // Say how many rows are hidden, so the shorter table never reads as the whole list.
    var note = root.querySelector('[data-px-hidden-note]');
    note.replaceChildren();
    note.hidden = !hidden;
    if (hidden) {
      note.appendChild(document.createTextNode(tr(T.hiddenSame).replace('{n}', hidden) + ' '));
      var all = el('button', 'px-show-all', tr(T.showAll));
      all.type = 'button';
      all.addEventListener('click', function () { state.diffOnly = false; renderControls(); renderTable(); });
      note.appendChild(all);
    }
  }

  function render() {
    if (!state.currencyChosen) state.currency = DEFAULT_CURRENCY[lang()];
    root.lang = lang() === 'zh' ? 'zh-CN' : lang();
    renderStatic(); renderControls(); renderPlans(); renderTable();
  }

  root.querySelectorAll('[data-px-billing] button').forEach(function (b) {
    b.addEventListener('click', function () { state.billing = b.dataset.value; renderControls(); renderPlans(); });
  });
  root.querySelectorAll('[data-px-currency] button').forEach(function (b) {
    b.addEventListener('click', function () { state.currency = b.dataset.value; state.currencyChosen = true; renderControls(); renderPlans(); });
  });
  root.querySelector('[data-px-diff]').addEventListener('click', function () {
    state.diffOnly = !state.diffOnly; renderControls(); renderTable();
  });
  var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-px-tab]'));
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { state.platform = b.dataset.pxTab; renderControls(); renderTable(); });
    b.addEventListener('keydown', function (ev) {
      if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
      var next = tabs[(i + (ev.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus(); next.click(); ev.preventDefault();
    });
  });

  render();
  // Re-render when the site language changes (pasero-i18n.js sets body[data-pasero-language]).
  if (window.MutationObserver && document.body) {
    new MutationObserver(function () { render(); }).observe(document.body, { attributes: true, attributeFilter: ['data-pasero-language'] });
  }
})();
