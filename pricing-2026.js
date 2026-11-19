/* Pasero pricing (2026-11-19): free trial, then a one-time purchase; AI is sold separately as points.
   Source of truth: project doc "付费与定价方案" (2026-11-19).
   Renders its own EN / ZH / JA copy; the container carries data-copy so the site translator skips it. */
(function () {
  'use strict';

  // One-time purchase: [early bird (first 200), regular]. Includes one year of updates.
  var PRICES = {
    USD: { sym: '$', dec: 0, free: [0, 0], mobile: [10, 15], desktop: [29, 39], complete: [35, 49], packs: [10, 25, 60] },
    JPY: { sym: '¥', dec: 0, free: [0, 0], mobile: [1500, 2300], desktop: [4400, 5800], complete: [5300, 7400], packs: [1500, 3800, 9000] },
    CNY: { sym: '¥', dec: 0, free: [0, 0], mobile: [48, 68], desktop: [128, 168], complete: [158, 228], packs: [68, 168, 398] }
  };
  // Pasero AI points (same table as the reporter function's quota-policy.ts).
  var POINTS = { cost: [['chat', 1], ['image', 2], ['ask', 2], ['layout', 5], ['rewrite', 5], ['protocol', 8], ['revise', 10], ['protocolLong', 12], ['paper', 20], ['ppt', 20], ['poster', 20]], packs: [200, 550, 1500], beta: 100 };
  var DEFAULT_CURRENCY = { en: 'USD', ja: 'JPY', zh: 'CNY' };

  var T = {
    lead: {
      en: 'Try every Pro feature free. If Pasero works for you, buy it once — no subscription. Free covers everyday research, and your data is never locked.',
      zh: '先免费试用全部 Pro 功能，觉得好用再一次买断，不用订阅。免费版覆盖日常科研，已有数据永远不会被锁住。',
      ja: 'Pro の全機能をまず無料で試せます。気に入ったら一度買うだけ、サブスクリプションはありません。無料版で日々の研究をカバーし、データがロックされることはありません。'
    },
    beta: {
      en: 'Public trial until 10 Jan 2027 (Japan time): every Pro feature is free and purchasing is not open yet. The first 200 licences sell at the early-bird price.',
      zh: '公开试用至 2027/1/10（日本时间）：Pro 功能全部免费，暂不收费。正式开售后前 200 份为早鸟价。',
      ja: '公開トライアルは 2027/1/10（日本時間）まで：Pro の全機能を無料で使えます。購入はまだ受け付けていません。販売開始後、最初の 200 本は早割価格です。'
    },
    annual: { en: 'Early bird', zh: '早鸟价', ja: '早割' },
    monthly: { en: 'Regular', zh: '正式价', ja: '通常価格' },
    billingLabel: { en: 'Price', zh: '价格', ja: '価格' },
    currencyLabel: { en: 'Currency', zh: '货币', ja: '通貨' },
    once: { en: 'one-time', zh: '一次买断', ja: '買い切り' },
    forever: { en: 'Free forever', zh: '永久免费', ja: 'ずっと無料' },
    earlySub: { en: 'First 200 licences · regular {p}', zh: '前 200 份 · 正式价 {p}', ja: '最初の 200 本 · 通常 {p}' },
    regularSub: { en: 'Early bird {p} for the first 200', zh: '前 200 份早鸟价 {p}', ja: '最初の 200 本は早割 {p}' },
    updates: { en: 'Keep it forever · 1 year of updates included', zh: '永久使用 · 含 1 年更新', ja: 'ずっと使えます · 1 年間のアップデート込み' },
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
        covers: { en: 'Android', zh: 'Android', ja: 'Android' },
        what: { en: 'Unlimited digest setups and cell tracking, multi-note PDF. 20 AI points included.', zh: '酶切反应和细胞追踪不限次数，多条笔记合并 PDF。送 20 点 AI。', ja: '制限酵素反応と細胞トラッキングが無制限、複数ノートの PDF 化。AI 20 ポイント付き。' }
      },
      desktop: {
        name: { en: 'Desktop Pro', zh: '桌面 Pro', ja: 'デスクトップ Pro' },
        covers: { en: 'Windows and macOS', zh: 'Windows 和 macOS', ja: 'Windows・macOS' },
        what: { en: 'qPCR, Western blot, Sanger, advanced primers, clean and vector figure export, weekly review and plasmid lineage. 50 AI points included.', zh: 'qPCR、WB、Sanger、高级引物、无水印和矢量图导出、周回顾与质粒来源谱系。送 50 点 AI。', ja: 'qPCR、ウェスタンブロット、サンガー、高度なプライマー設計、透かしなし・ベクター図の書き出し、週の振り返り、プラスミドの由来。AI 50 ポイント付き。' }
      },
      complete: {
        name: { en: 'Complete', zh: '完整版', ja: 'コンプリート' },
        covers: { en: 'Desktop + mobile', zh: '桌面 + 手机', ja: 'デスクトップ + モバイル' },
        what: { en: 'Everything in Desktop Pro and Mobile Pro, on one account. 50 AI points included.', zh: '桌面 Pro 和移动 Pro 的全部功能，一个账号通用。送 50 点 AI。', ja: 'デスクトップ Pro とモバイル Pro のすべてを 1 つのアカウントで。AI 50 ポイント付き。' }
      }
    },
    ai: {
      title: { en: 'Pasero AI points', zh: 'Pasero AI 点数', ja: 'Pasero AI ポイント' },
      lead: { en: 'AI is sold separately from the app: every AI action uses points, shared between desktop and mobile. Buy points only if you use AI.', zh: 'AI 和软件分开卖：每次使用 AI 扣点数，桌面端和手机端共用。用 AI 才需要买点数。', ja: 'AI はアプリとは別売りです。AI を使うたびにポイントを消費し、デスクトップとモバイルで共通です。AI を使う人だけポイントを購入します。' },
      proName: { en: 'Trial gift', zh: '试用期赠点', ja: 'トライアル特典' },
      proCovers: { en: 'Every account', zh: '每个账号', ja: '全アカウント' },
      ptsBig: { en: '{n} pts', zh: '{n} 点', ja: '{n} pt' },
      proSub: { en: 'Free during the public trial', zh: '公开试用期间免费', ja: '公開トライアル期間中は無料' },
      proWhat: { en: 'Try journal-club slides, posters, protocol organising and chat. Pasero AI is not yet available in mainland China.', zh: '可以试文献汇报、海报、Protocol 整理和聊天。中国大陆暂不提供 Pasero AI。', ja: '論文紹介スライド、ポスター、プロトコル整理、チャットを試せます。中国本土では Pasero AI はまだ提供していません。' },
      costTitle: { en: 'Points per use', zh: '每次用多少点', ja: '1 回あたりのポイント' },
      pts: { en: '{n} pts', zh: '{n} 点', ja: '{n} pt' },
      labels: {
        chat: { en: 'AI chat message (mobile)', zh: 'AI 对话（手机，每条）', ja: 'AI チャット（モバイル、1 件）' },
        image: { en: 'AI image or schematic', zh: 'AI 生图 / 示意图', ja: 'AI 画像・模式図' },
        ask: { en: 'Ask about a protocol', zh: '方案提问', ja: 'プロトコルへの質問' },
        rewrite: { en: 'Rewrite a protocol', zh: '方案改写', ja: 'プロトコルの書き換え' },
        protocol: { en: 'Organize a protocol with AI', zh: 'AI 方案整理', ja: 'AI でプロトコルを整理' },
        protocolLong: { en: 'Organize a protocol (long document)', zh: 'AI 方案整理（长文档）', ja: 'AI でプロトコルを整理（長い文書）' },
        layout: { en: 'AI figure layout', zh: 'AI 作图排版', ja: 'AI で図のレイアウト' },
        revise: { en: 'AI edit to slides or a poster', zh: 'AI 修改幻灯片或海报', ja: 'スライド・ポスターの AI 修正' },
        paper: { en: 'Journal club slides', zh: '论文分享幻灯片', ja: '論文紹介スライド' },
        ppt: { en: 'Conference talk slides', zh: '学会 PPT', ja: '学会スライド' },
        poster: { en: 'Conference poster', zh: '学会海报', ja: '学会ポスター' }
      },
      inclTitle: { en: 'Points included', zh: '方案内含点数', ja: 'プランに含まれるポイント' },
      incl: [
        { en: 'Free account · 20 points once', zh: '免费账号 · 一次性 20 点', ja: '無料アカウント · 初回 20 ポイント' },
        { en: 'Mobile Pro · 20 points once', zh: '移动 Pro · 一次性 20 点', ja: 'モバイル Pro · 初回 20 ポイント' },
        { en: 'Desktop Pro or Complete · 50 points once', zh: '桌面 Pro 或完整版 · 一次性 50 点', ja: 'デスクトップ Pro・コンプリート · 初回 50 ポイント' }
      ],
      packTitle: { en: 'Points packs', zh: '点数包', ja: 'ポイントパック' },
      pack: { en: '{n} points', zh: '{n} 点', ja: '{n} ポイント' },
      packNote: { en: 'One-time purchase, valid for 12 months.', zh: '一次性购买，12 个月内有效。', ja: '買い切り、12 か月有効。' }
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
    colProDesktop: { en: 'Desktop Pro or Complete', zh: '桌面 Pro 或完整版', ja: 'デスクトップ Pro / コンプリート' },
    colProMobile: { en: 'Mobile Pro or Complete', zh: '移动 Pro 或完整版', ja: 'モバイル Pro / コンプリート' },
    v: {
      yes: { en: 'Included', zh: '包含', ja: '含まれる' },
      no: { en: 'Not included', zh: '不包含', ja: '含まれない' },
      five: { en: '5 uses', zh: '5 次', ja: '5 回' },
      unlimited: { en: 'Unlimited', zh: '不限', ja: '無制限' },
      one: { en: '1 per import', zh: '每次 1 条', ja: '1 件ずつ' },
      many: { en: 'Many at once', zh: '一次多条', ja: '一括' },
      ai: { en: 'AI points', zh: 'AI 点数', ja: 'AI ポイント' }
    },
    notes: {
      en: [
        'Free trial: every Pro feature is free during the public trial (until 10 Jan 2027, Japan time). After that, new accounts get a 30-day trial.',
        '5 uses: each account gets 5 free uses on desktop and 5 on mobile for each of these features; after that it needs the matching Pro.',
        'A licence is yours to keep and includes one year of updates. After that you can keep using the last version you have, or buy another year of updates. Your notes, resources and results can always be viewed, edited and synced.',
        'Pasero AI uses points and is sold separately from the app. Points packs are one-time purchases valid for 12 months. Pasero AI is not yet available in mainland China; the app itself works the same there.',
        'Licences are sold on this website (payments handled by Paddle). Mobile Pro is for the Android app; Pro is not yet sold inside the iPhone and iPad apps.',
        'Yen prices include consumption tax. Prices are final when purchasing opens.'
      ],
      zh: [
        '免费试用：公开试用期内（至 2027/1/10，日本时间）Pro 功能全部免费；之后的新账号有 30 天试用。',
        '“5 次”：每个账号的这些功能在桌面端、移动端各有 5 次免费，用完后需要对应的 Pro。',
        '买断后永久使用，含 1 年更新；之后可以继续用手上最后一个版本，也可以另购一年更新。已有笔记、资源和结果永远可以查看、编辑和同步。',
        'Pasero AI 按点数计费，和软件分开卖；点数包一次性购买，12 个月内有效。中国大陆暂不提供 Pasero AI，软件其他功能不受影响。',
        '在官网购买（由 Paddle 处理付款）。移动 Pro 适用于 Android App；iPhone 和 iPad App 内暂不出售 Pro。',
        '日元价格含消费税。价格以正式开放购买时为准。'
      ],
      ja: [
        '無料トライアル：公開トライアル期間中（2027/1/10、日本時間まで）は Pro の全機能が無料です。その後の新規アカウントには 30 日間のトライアルがあります。',
        '「5 回」：各アカウントは、これらの機能をデスクトップとモバイルでそれぞれ 5 回まで無料で使えます。それ以降は対応する Pro が必要です。',
        'ライセンスは買い切りで、1 年間のアップデートが含まれます。その後も手元の最新版をずっと使えるほか、アップデートを 1 年分追加購入することもできます。ノート、リソース、結果はいつでも閲覧・編集・同期できます。',
        'Pasero AI はポイント制で、アプリとは別売りです。ポイントパックは買い切りで 12 か月有効です。中国本土では Pasero AI はまだ提供していませんが、アプリ自体は同じように使えます。',
        'ライセンスはこのサイトで購入できます（決済は Paddle）。モバイル Pro は Android アプリ用です。iPhone・iPad アプリ内では Pro を販売していません。',
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
        [{ en: 'Plasmid source and derived plasmids', zh: '质粒来源与衍生谱系', ja: 'プラスミドの由来と派生' }, { en: 'Chain back to the public source and every plasmid made from it', zh: '追溯到公开来源，以及由它构建的全部质粒', ja: '公開元までの系譜と、そこから作ったすべてのプラスミド' }, 'no', 'yes'],
        [{ en: 'Basic primer design', zh: '基础引物设计', ja: '基本的なプライマー設計' }, null, 'yes', 'yes'],
        [{ en: 'Advanced primer design', zh: '高级引物设计', ja: '高度なプライマー設計' }, null, 'no', 'yes'],
        [{ en: 'Sanger alignment', zh: 'Sanger 测序比对', ja: 'サンガー配列アラインメント' }, { en: 'AB1 files', zh: 'AB1 文件', ja: 'AB1 ファイル' }, 'five', 'unlimited']
      ] },
      { group: { en: 'Cells and resources', zh: '细胞与资源库', ja: '細胞とリソース' }, rows: [
        [{ en: 'Start a cell culture track', zh: '新建细胞培养追踪', ja: '細胞培養トラッキングの開始' }, { en: 'Thaw or start a new culture', zh: '复苏或开始新培养', ja: '起眠または新しい培養の開始' }, 'five', 'unlimited'],
        [{ en: 'Keep recording existing cultures', zh: '已有培养继续记录', ja: '既存の培養の記録' }, { en: 'Passages, freezing, vial counts, passage reminders', zh: '传代、冻存、冻存支数、传代提醒', ja: '継代、凍結、ストック本数、継代リマインダー' }, 'yes', 'yes'],
        [{ en: 'Protocol, reagent and cell libraries', zh: '方案、试剂和细胞库', ja: 'プロトコル・試薬・細胞ライブラリ' }, { en: 'Public search: Europe PMC protocols, PubChem, NCBI plasmids, Cellosaurus', zh: '公开检索：Europe PMC 方案、PubChem、NCBI 质粒、Cellosaurus', ja: '公開データ検索：Europe PMC のプロトコル、PubChem、NCBI プラスミド、Cellosaurus' }, 'yes', 'yes'],
        [{ en: 'Build protocols from your records', zh: '从实验记录整理方案', ja: '記録からプロトコルを作成' }, null, 'five', 'unlimited']
      ] },
      { group: { en: 'Literature and presenting', zh: '文献与汇报', ja: '文献と発表' }, rows: [
        [{ en: 'Literature library', zh: '文献管理', ja: '文献管理' }, { en: 'PDF reading and notes, term lookup, citation styles, open-access PDFs', zh: 'PDF 阅读与标注、术语解释、引用格式、开放获取 PDF', ja: 'PDF の閲覧と注釈、用語解説、引用形式、オープンアクセス PDF' }, 'yes', 'yes'],
        [{ en: 'Slides from your results', zh: '用实验结果生成 PPT', ja: '結果からスライド作成' }, null, 'five', 'unlimited'],
        [{ en: 'Pasero AI', zh: 'Pasero AI', ja: 'Pasero AI' }, { en: 'Journal club, conference talks, posters, schematics', zh: '组会读文献、学会报告、海报、示意图', ja: '論文抄読会、学会発表、ポスター、模式図' }, 'ai', 'ai']
      ] },
      { group: { en: 'Overview', zh: '实验总览', ja: '実験の概要' }, rows: [
        [{ en: 'Today', zh: '今天', ja: '今日' }, { en: 'Work in progress, to-dos and notes written today', zh: '进行中、待办和今天写的笔记', ja: '進行中の作業、To-do、今日のノート' }, 'yes', 'yes'],
        [{ en: 'Week and custom-range review, material tracking', zh: '本周 / 自定义时段回顾、材料追踪图', ja: '週・期間の振り返り、材料トラッキング' }, { en: 'What you did, and every plasmid, cell and primer across your notes', zh: '做了什么，以及各笔记里用到的质粒、细胞和引物', ja: '行った作業と、ノート全体のプラスミド・細胞・プライマー' }, 'no', 'yes']
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
  var state = { billing: 'early', currency: null, platform: 'desktop', currencyChosen: false, diffOnly: true };

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
    billing.querySelector('[data-value="early"]').textContent = tr(T.annual);
    billing.querySelector('[data-value="regular"]').textContent = tr(T.monthly);
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
    var cur = state.currency, idx = state.billing === 'early' ? 0 : 1, c = PRICES[cur];
    ['free', 'mobile', 'desktop', 'complete'].forEach(function (key) {
      var p = T.plans[key], card = el('article', 'px-plan px-plan-' + key);
      var head = el('div', 'px-plan-head');
      head.appendChild(el('h3', 'px-plan-name', tr(p.name)));
      head.appendChild(el('span', 'px-plan-covers', tr(p.covers)));
      card.appendChild(head);
      var price = el('p', 'px-price');
      var value = c[key][idx];
      price.appendChild(el('span', 'px-amount', money(cur, value)));
      if (key !== 'free') price.appendChild(el('span', 'px-per', tr(T.once)));
      card.appendChild(price);
      var sub;
      if (key === 'free') sub = tr(T.forever);
      else if (idx === 0) sub = tr(T.earlySub).replace('{p}', money(cur, c[key][1]));
      else sub = tr(T.regularSub).replace('{p}', money(cur, c[key][0]));
      if (cur === 'JPY' && key !== 'free') sub += ' · ' + tr(T.taxIncl);
      card.appendChild(el('p', 'px-sub', sub));
      if (key !== 'free') card.appendChild(el('p', 'px-sub', tr(T.updates)));
      card.appendChild(el('p', 'px-what', tr(p.what)));
      if (key === 'complete') {
        var saving = c.mobile[idx] + c.desktop[idx] - c.complete[idx];
        card.appendChild(el('p', 'px-save', tr(T.saveBoth).replace('{p}', money(cur, saving))));
      }
      grid.appendChild(card);
    });
  }

  function renderAi() {
    var box = root.querySelector('[data-px-ai]');
    if (!box) return;
    box.replaceChildren();
    var A = T.ai, cur = state.currency, c = PRICES[cur];
    var head = el('div', 'px-ai-head');
    head.appendChild(el('h3', 'px-ai-title', tr(A.title)));
    head.appendChild(el('p', 'px-ai-lead', tr(A.lead)));
    box.appendChild(head);
    var grid = el('div', 'px-ai-grid');
    var offer = el('article', 'px-plan px-plan-proai');
    var oh = el('div', 'px-plan-head');
    oh.appendChild(el('h3', 'px-plan-name', tr(A.proName)));
    oh.appendChild(el('span', 'px-plan-covers', tr(A.proCovers)));
    offer.appendChild(oh);
    var price = el('p', 'px-price');
    price.appendChild(el('span', 'px-amount', tr(A.ptsBig).replace('{n}', POINTS.beta)));
    offer.appendChild(price);
    offer.appendChild(el('p', 'px-sub', tr(A.proSub)));
    offer.appendChild(el('p', 'px-what', tr(A.proWhat)));
    grid.appendChild(offer);
    function list(title, rows) {
      var col = el('div', 'px-ai-col');
      col.appendChild(el('h4', 'px-ai-col-title', title));
      var ul = el('ul', 'px-ai-list');
      rows.forEach(function (r) {
        var li = el('li');
        li.appendChild(el('span', null, r[0]));
        if (r[1]) li.appendChild(el('b', null, r[1]));
        ul.appendChild(li);
      });
      col.appendChild(ul);
      return col;
    }
    grid.appendChild(list(tr(A.costTitle), POINTS.cost.map(function (x) { return [tr(A.labels[x[0]]), (x[1] === 1 && lang() === 'en' ? '1 pt' : tr(A.pts).replace('{n}', x[1]))]; })));
    var right = el('div', 'px-ai-col');
    right.appendChild(list(tr(A.inclTitle), A.incl.map(function (x) { return [tr(x)]; })));
    var packs = list(tr(A.packTitle), POINTS.packs.map(function (n, i) { return [tr(A.pack).replace('{n}', n.toLocaleString('en-US')), money(cur, c.packs[i])]; }));
    packs.appendChild(el('p', 'px-ai-note', tr(A.packNote)));
    right.appendChild(packs);
    grid.appendChild(right);
    box.appendChild(grid);
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
    renderStatic(); renderControls(); renderPlans(); renderAi(); renderTable();
  }

  root.querySelectorAll('[data-px-billing] button').forEach(function (b) {
    b.addEventListener('click', function () { state.billing = b.dataset.value; renderControls(); renderPlans(); });
  });
  root.querySelectorAll('[data-px-currency] button').forEach(function (b) {
    b.addEventListener('click', function () { state.currency = b.dataset.value; state.currencyChosen = true; renderControls(); renderPlans(); renderAi(); });
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
