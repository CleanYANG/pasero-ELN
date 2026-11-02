/* Pasero screenshot slots (2026-11).
   Every product screenshot on the site is a named slot. Until the new build is captured, a slot renders a
   clearly-labelled placeholder that says which screen belongs there. To publish a real capture, save it as
   assests/shots/<id>.png (or <id>.mp4 for a video slot); the slot picks it up automatically, no code change.
   The full list of slots lives in assests/shots/README.md. */
(function () {
  'use strict';
  var BASE = 'assests/shots/';
  var T = function (en, zh, ja) { return [en, zh, ja]; };

  // id: { device: 'desktop' | 'phone', kind: 'image' | 'video', screen: [en, zh, ja], show: [en, zh, ja] }
  var SHOTS = {
    /* Desktop */
    'd-home': { device: 'desktop', screen: T('Desktop · Home', '桌面端 · 首页', 'デスクトップ · ホーム'),
      show: T('Recent notes, active cell cultures and to-dos at a glance', '最近笔记、进行中的细胞培养和待办一屏可见', '最近のノート、進行中の細胞培養、To-do を一覧') },
    'd-notes-editor': { device: 'desktop', screen: T('Lab notes · Editor', '实验笔记 · 编辑器', '実験ノート · エディター'),
      show: T('One full note: a table with formulas, an annotated image, results and linked resources', '一篇完整笔记：带公式的表格、标注图片、实验结果和关联资源', '数式付きの表、注釈付き画像、結果、リンクしたリソースを含むノート') },
    'd-notes-new': { device: 'desktop', screen: T('Lab notes · New note', '实验笔记 · 新建笔记', '実験ノート · 新規作成'),
      show: T('The four ways to start: blank, protocol template, restriction digest, cell experiment', '四种新建方式：空白、方案模板、酶切反应、细胞实验', '4 つの作成方法：白紙、プロトコルテンプレート、制限酵素処理、細胞実験') },
    'd-notes-import': { device: 'desktop', screen: T('Lab notes · Batch import', '实验笔记 · 批量导入', '実験ノート · 一括取り込み'),
      show: T('Excel, CSV or documents turned into notes, plus your own vocabulary list', 'Excel、CSV 或文档批量生成笔记，并构建自己的词汇库', 'Excel・CSV・文書からノートを作成し、語彙集も作る') },
    'd-notes-export': { device: 'desktop', screen: T('Lab notes · Export', '实验笔记 · 导出', '実験ノート · 書き出し'),
      show: T('Word / PDF export preview of a note', '笔记导出 Word / PDF 的预览', 'ノートを Word / PDF に書き出すプレビュー') },
    'd-analysis-overview': { device: 'desktop', screen: T('Data analysis · Import and plot', '数据分析 · 导入与出图', 'データ解析 · 取り込みとグラフ'),
      show: T('A data table next to its bar, line or box plot', '数据表与对应的柱状图、折线图或箱型图并排', 'データ表と棒・折れ線・箱ひげ図を並べて') },
    'd-analysis-stats': { device: 'desktop', screen: T('Data analysis · Statistics and fitting', '数据分析 · 统计与拟合', 'データ解析 · 統計とフィッティング'),
      show: T('A statistical test result and a fitted curve such as an IC50', '统计检验结果和一条拟合曲线（如 IC50）', '統計検定の結果と IC50 などのフィッティング曲線') },
    'd-analysis-qpcr': { device: 'desktop', screen: T('Data analysis · qPCR', '数据分析 · qPCR', 'データ解析 · qPCR'),
      show: T('ΔΔCt results table and relative expression chart', 'ΔΔCt 结果表与相对表达量图', 'ΔΔCt の結果表と相対発現量のグラフ') },
    'd-analysis-wb': { device: 'desktop', screen: T('Data analysis · Western blot', '数据分析 · Western blot', 'データ解析 · ウェスタンブロット'),
      show: T('Band intensities normalized to a loading control', '条带灰度及内参归一化结果', 'バンド強度とローディングコントロールでの正規化') },
    'd-analysis-export': { device: 'desktop', screen: T('Data analysis · Figure export', '数据分析 · 数据图导出', 'データ解析 · 図の書き出し'),
      show: T('Nature / Cell / Science style picker with PDF / SVG export', 'Nature / Cell / Science 样式选择与 PDF / SVG 导出', 'Nature / Cell / Science 形式の選択と PDF / SVG 出力') },
    'd-plasmid-map': { device: 'desktop', screen: T('Plasmids · Library and map', '质粒 · 质粒库与图谱', 'プラスミド · ライブラリとマップ'),
      show: T('Circular map with annotations after a GenBank import', 'GenBank 导入后的环形图谱和注释列表', 'GenBank 取り込み後の環状マップと注釈') },
    'd-plasmid-seq': { device: 'desktop', screen: T('Plasmids · Sequence editor', '质粒 · 序列编辑', 'プラスミド · 配列エディター'),
      show: T('Sequence view with a selected feature being edited', '序列视图中编辑一个选中的特征', '配列ビューで選択したフィーチャーを編集') },
    'd-plasmid-restriction': { device: 'desktop', screen: T('Plasmids · Restriction analysis', '质粒 · 酶切分析', 'プラスミド · 制限酵素解析'),
      show: T('Cut sites, fragment sizes, gel preview and buffer advice', '切点、片段大小、电泳预览和缓冲液推荐', '切断部位、断片サイズ、泳動プレビュー、バッファー提案') },
    'd-plasmid-digest': { device: 'desktop', screen: T('Plasmids · Digest reaction', '质粒 · 酶切反应设置', 'プラスミド · 制限酵素反応'),
      show: T('Sample table with volumes and the start-reaction button that logs to a note', '样品表、加样量，以及开始反应并写入笔记的按钮', 'サンプル表と添加量、反応開始してノートに記録するボタン') },
    'd-plasmid-primer': { device: 'desktop', screen: T('Plasmids · Primer design', '质粒 · 引物设计', 'プラスミド · プライマー設計'),
      show: T('A primer pair on the template with Tm and GC%', '模板上的一对引物及其 Tm 和 GC%', 'テンプレート上のプライマー対と Tm・GC%') },
    'd-plasmid-primer-adv': { device: 'desktop', kind: 'video', screen: T('Plasmids · Advanced primer design', '质粒 · 高级引物设计', 'プラスミド · 高度なプライマー設計'),
      show: T('Short screen recording of the advanced primer workflow', '高级引物设计流程的短录屏', '高度なプライマー設計の短い画面録画') },
    'd-plasmid-sanger': { device: 'desktop', screen: T('Plasmids · Sanger alignment', '质粒 · Sanger 比对', 'プラスミド · サンガー配列比較'),
      show: T('AB1 trace aligned to the reference with a mismatch selected', 'AB1 峰图与参考序列比对，选中一处差异', 'AB1 波形とリファレンスの比較、不一致を選択') },
    'd-db-libraries': { device: 'desktop', screen: T('Database · Libraries', '数据库 · 方案、试剂与细胞库', 'データベース · ライブラリ'),
      show: T('A reagent or cell record and the notes that used it', '一条试剂或细胞记录，以及用到它的笔记', '試薬や細胞の記録と、それを使ったノート') },
    'd-db-culture': { device: 'desktop', screen: T('Database · Cell culture tracking', '数据库 · 细胞培养追踪', 'データベース · 細胞培養トラッキング'),
      show: T('One culture timeline: thaw, passages, freezing, vial count, next passage reminder', '一条培养时间线：复苏、传代、冻存、冻存支数、传代提醒', '起眠・継代・凍結・ストック本数・次回継代リマインダーのタイムライン') },
    'd-db-trace': { device: 'desktop', screen: T('Database · Trace usage', '数据库 · 资源追溯', 'データベース · 使用履歴'),
      show: T('Jumping from a resource to every experiment it appears in', '从一个资源跳到所有用过它的实验', 'リソースから使用したすべての実験へ移動') },
    'd-db-protocol': { device: 'desktop', screen: T('Database · Protocol from records', '数据库 · 从记录整理方案', 'データベース · 記録からプロトコル'),
      show: T('Steps pulled from past notes into a reusable protocol', '从历史笔记整理出的可复用方案', '過去のノートからまとめた再利用できるプロトコル') },
    'd-lit-library': { device: 'desktop', screen: T('Literature · Library and reader', '文献 · 文献库与阅读器', '文献 · ライブラリとリーダー'),
      show: T('Two-page PDF view with highlights and notes', '双页 PDF 阅读，带高亮与笔记', '見開き PDF 表示とハイライト・メモ') },
    'd-lit-search': { device: 'desktop', screen: T('Literature · Search', '文献 · 检索', '文献 · 検索'),
      show: T('Search results with open-access PDF download', '检索结果与开放获取 PDF 下载', '検索結果とオープンアクセス PDF の取得') },
    'd-lit-terms': { device: 'desktop', screen: T('Literature · Terms and citations', '文献 · 术语与引用', '文献 · 用語と引用'),
      show: T('Term lookup popover and citation style picker', '术语解释弹窗与引用格式选择', '用語解説のポップオーバーと引用形式の選択') },
    'd-pres-slides': { device: 'desktop', screen: T('Presentations · Slides from results', '研究汇报 · 用结果生成 PPT', '発表 · 結果からスライド'),
      show: T('Picking saved results and the generated slide preview', '选择已保存的结果，以及生成的幻灯片预览', '保存した結果の選択と生成されたスライドのプレビュー') },
    'd-pres-ai': { device: 'desktop', screen: T('Presentations · Pasero AI', '研究汇报 · Pasero AI', '発表 · Pasero AI'),
      show: T('A journal club deck or poster drafted with Pasero AI', '用 Pasero AI 起草的组会文献汇报或海报', 'Pasero AI で作成した論文抄読会スライドやポスター') },
    'd-ra-notes': { device: 'desktop', screen: T('Research Assistant · Notes', '研究助手 · 查找与写入笔记', 'リサーチアシスタント · ノート'),
      show: T('A plain-language request, the notes it found and the confirm-before-saving step', '自然语言提问、找到的笔记，以及保存前的确认', '自然な言葉での依頼、見つかったノート、保存前の確認') },
    'd-ra-search': { device: 'desktop', screen: T('Research Assistant · Lookup', '研究助手 · 资源检索', 'リサーチアシスタント · 検索'),
      show: T('Lookup across genes, proteins, terms, cell lines and reagents', '基因、蛋白、术语、细胞系、试剂的检索结果', '遺伝子・タンパク質・用語・細胞株・試薬の検索結果') },
    'd-ra-calc': { device: 'desktop', screen: T('Research Assistant · Lab calculations', '研究助手 · 实验计算', 'リサーチアシスタント · 実験計算'),
      show: T('GC content, Tm or a dilution worked out in the chat', '在对话中完成 GC 含量、Tm 或稀释计算', '会話の中で GC 含量・Tm・希釈を計算') },
    'd-sync': { device: 'desktop', screen: T('Desktop · Phone sync', '桌面端 · 手机同步', 'デスクトップ · スマホ同期'),
      show: T('The pairing QR code and the last sync summary', '配对二维码与上次同步摘要', 'ペアリング用 QR コードと前回の同期概要') },

    /* Phone */
    'm-home': { device: 'phone', screen: T('Mobile · Home', '移动端 · 首页', 'モバイル · ホーム'),
      show: T('Notes list with the quick-note button', '笔记列表与快速记录按钮', 'ノート一覧とクイックノートボタン') },
    'm-notes-editor': { device: 'phone', screen: T('Notes · Editor', '笔记 · 编辑', 'ノート · 編集'),
      show: T('A note with a table, a photo and a result', '带表格、照片和实验结果的笔记', '表・写真・結果を含むノート') },
    'm-notes-quick': { device: 'phone', screen: T('Notes · Quick note', '笔记 · 快速记录', 'ノート · クイックノート'),
      show: T('Lock-screen quick note or camera capture, saved offline', '锁屏快速记录或拍照，离线保存', 'ロック画面のクイックノートや撮影、オフライン保存') },
    'm-notes-tools': { device: 'phone', screen: T('Notes · Calculators', '笔记 · 计算器', 'ノート · 計算ツール'),
      show: T('Molarity, dilution, master mix or unit conversion inside a note', '笔记内的摩尔浓度、稀释、Master Mix 或单位换算', 'ノート内のモル濃度・希釈・マスターミックス・単位換算') },
    'm-notes-todo': { device: 'phone', screen: T('Notes · To-dos and timers', '笔记 · 待办与计时', 'ノート · To-do とタイマー'),
      show: T('A running lab timer and the lock-screen reminder', '运行中的实验计时和锁屏提醒', '実行中の実験タイマーとロック画面の通知') },
    'm-notes-pdf': { device: 'phone', screen: T('Notes · PDF export', '笔记 · 导出 PDF', 'ノート · PDF 書き出し'),
      show: T('Export sheet: one note, or several merged into one PDF', '导出面板：单条笔记，或多条合并成一个 PDF', '書き出し画面：1 件、または複数を 1 つの PDF に') },
    'm-reagent-library': { device: 'phone', screen: T('Reagents · Library', '试剂 · 试剂库', '試薬 · ライブラリ'),
      show: T('Searchable reagent list and one reagent with its linked experiments', '可搜索的试剂列表，以及某个试剂关联的实验', '検索できる試薬一覧と、試薬にリンクした実験') },
    'm-reagent-safety': { device: 'phone', screen: T('Reagents · Safety', '试剂 · 安全信息', '試薬 · 安全情報'),
      show: T('GHS hazard pictograms and statements from PubChem', '来自 PubChem 的 GHS 危害图标和说明', 'PubChem の GHS 絵表示と危険有害性情報') },
    'm-cell-library': { device: 'phone', screen: T('Cells · Library', '细胞 · 细胞库', '細胞 · ライブラリ'),
      show: T('A cell line record with source and parent line', '一条细胞系记录，含来源和亲本细胞', '由来と親株を含む細胞株の記録') },
    'm-cell-track': { device: 'phone', screen: T('Cells · Culture tracking', '细胞 · 培养追踪', '細胞 · 培養トラッキング'),
      show: T('Culture timeline with passages, freezing and the next reminder', '培养时间线：传代、冻存和下次提醒', '継代・凍結・次回リマインダーのタイムライン') },
    'm-plasmid-library': { device: 'phone', screen: T('Plasmids · Library', '质粒 · 质粒库', 'プラスミド · ライブラリ'),
      show: T('A plasmid with its sequence features and source', '一个质粒的序列特征和来源', 'プラスミドの配列フィーチャーと由来') },
    'm-plasmid-restriction': { device: 'phone', screen: T('Plasmids · Restriction analysis', '质粒 · 酶切分析', 'プラスミド · 制限酵素解析'),
      show: T('Cut-site map, fragments and the virtual gel', '切点图、片段和虚拟电泳', '切断部位マップ、断片、仮想電気泳動') },
    'm-plasmid-digest': { device: 'phone', screen: T('Plasmids · Digest reaction', '质粒 · 酶切反应设置', 'プラスミド · 制限酵素反応'),
      show: T('Sample table, volumes and the reaction timer', '样品表、加样量和反应计时', 'サンプル表、添加量、反応タイマー') },
    'm-lit-library': { device: 'phone', screen: T('Literature · Reader', '文献 · 阅读器', '文献 · リーダー'),
      show: T('A paper open in the reader with reading progress', '阅读器中打开的论文和阅读进度', 'リーダーで開いた論文と読書の進捗') },
    'm-lit-search': { device: 'phone', screen: T('Literature · Life-science search', '文献 · 生命科学检索', '文献 · ライフサイエンス検索'),
      show: T('Results from NCBI, Europe PMC, UniProt, PubChem or PDB', '来自 NCBI、Europe PMC、UniProt、PubChem 或 PDB 的结果', 'NCBI・Europe PMC・UniProt・PubChem・PDB の検索結果') },
    'm-discovery': { device: 'phone', kind: 'video', screen: T('Discovery · Paper cards', '发现 · 论文卡片', 'ディスカバリー · 論文カード'),
      show: T('Short recording: swiping recommended papers and saving one', '短录屏：滑动推荐论文并收藏一篇', '短い録画：おすすめ論文をスワイプして保存') },
    'm-seek-chat': { device: 'phone', screen: T('Seek · Pasero AI chat', 'Seek · Pasero AI 对话', 'Seek · Pasero AI との対話'),
      show: T('A conversation and the save-to-note action', '一段对话和“保存到笔记”操作', '会話と「ノートに保存」操作') },
    'm-seek-context': { device: 'phone', screen: T('Seek · Notes as context', 'Seek · 笔记作为上下文', 'Seek · ノートを文脈に'),
      show: T('Picking notes to include in a question', '选择要带入提问的笔记', '質問に含めるノートの選択') },
    'm-sync': { device: 'phone', screen: T('Mobile · Sync with desktop', '移动端 · 与桌面端同步', 'モバイル · デスクトップと同期'),
      show: T('Scanning the desktop QR code and the sync result', '扫描桌面端二维码以及同步结果', 'デスクトップの QR コードを読み取り、同期結果を表示') }
  };

  var BADGE = {
    image: T('Screenshot to come', '截图待替换', 'スクリーンショット準備中'),
    video: T('Demo video to come', '演示视频待替换', 'デモ動画準備中')
  };
  var probed = {}; // id -> true (file exists) | false (missing) | Array of callbacks (pending)

  function tr(triple) {
    var i18n = window.PaseroI18n;
    return i18n ? i18n.translate(triple[0], triple[1], triple[2]) : triple[0];
  }
  function textEl(tag, cls, triple) {
    var el = document.createElement(tag);
    el.className = cls;
    el.setAttribute('data-en', triple[0]);
    el.setAttribute('data-zh', triple[1]);
    el.setAttribute('data-ja', triple[2]);
    el.textContent = tr(triple);
    return el;
  }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function placeholder(id, spec) {
    var kind = spec.kind || 'image';
    var wrap = document.createElement('div');
    wrap.className = 'shot-ph';
    var badge = document.createElement('span');
    badge.className = 'shot-ph-badge';
    badge.innerHTML = kind === 'video'
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 10 4-2.5v9L17 14"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l1.6-2.4h6.8L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.4"/></svg>';
    badge.appendChild(textEl('span', '', BADGE[kind]));
    wrap.appendChild(badge);
    wrap.appendChild(textEl('strong', 'shot-ph-screen', spec.screen));
    wrap.appendChild(textEl('span', 'shot-ph-show', spec.show));
    var file = document.createElement('code');
    file.className = 'shot-ph-file';
    file.textContent = BASE + id + (kind === 'video' ? '.mp4' : '.png');
    wrap.appendChild(file);
    return wrap;
  }
  function realMedia(id, spec, opts) {
    var kind = spec.kind || 'image';
    var alt = 'Pasero — ' + tr(spec.screen);
    if (kind !== 'video') {
      var img = document.createElement('img');
      img.src = BASE + encodeURIComponent(id) + '.png';
      img.alt = alt;
      img.decoding = 'async';
      return img;
    }
    var v = document.createElement('video');
    v.src = BASE + encodeURIComponent(id) + '.mp4';
    v.poster = BASE + encodeURIComponent(id) + '.png';
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata';
    v.setAttribute('aria-label', alt);
    if (opts.tapToPlay || reducedMotion()) {
      // Poster first; nothing moves until the viewer asks for it.
      var holder = document.createElement('div');
      holder.className = 'shot-video';
      var play = document.createElement('button');
      play.type = 'button';
      play.className = 'shot-play';
      play.setAttribute('aria-label', tr(T('Play video', '播放视频', '動画を再生')));
      play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
      play.addEventListener('click', function () { v.controls = true; play.hidden = true; v.play().catch(function () {}); });
      holder.appendChild(v);
      holder.appendChild(play);
      return holder;
    }
    v.autoplay = true;
    v.controls = true;
    return v;
  }
  function probe(id, kind, cb) {
    var state = probed[id];
    if (state === true || state === false) { cb(state); return; }
    if (Array.isArray(state)) { state.push(cb); return; }
    probed[id] = [cb];
    var done = function (ok) { var list = probed[id]; probed[id] = ok; list.forEach(function (fn) { fn(ok); }); };
    if (kind === 'video') {
      var v = document.createElement('video');
      v.preload = 'metadata'; v.muted = true;
      v.onloadedmetadata = function () { done(true); };
      v.onerror = function () { done(false); };
      v.src = BASE + encodeURIComponent(id) + '.mp4';
    } else {
      var img = new Image();
      img.onload = function () { done(img.naturalWidth > 0); };
      img.onerror = function () { done(false); };
      img.src = BASE + encodeURIComponent(id) + '.png';
    }
  }

  /* Fill `host` with the slot. opts.tapToPlay keeps videos still until tapped. */
  function fill(host, id, opts) {
    opts = opts || {};
    var spec = SHOTS[id];
    if (!spec) { host.textContent = ''; return; }
    host.classList.add('shot');
    host.dataset.device = spec.device;
    host.dataset.shotId = id;
    host.classList.remove('shot-real');
    host.replaceChildren(placeholder(id, spec));
    probe(id, spec.kind || 'image', function (ok) {
      if (!ok || host.dataset.shotId !== id) return;
      host.classList.add('shot-real');
      host.replaceChildren(realMedia(id, spec, opts));
    });
  }
  function hydrate(root) {
    (root || document).querySelectorAll('[data-shot]').forEach(function (el) {
      if (el.dataset.shotId !== el.dataset.shot) fill(el, el.dataset.shot, { tapToPlay: el.hasAttribute('data-shot-tap') });
    });
  }

  window.PaseroShots = { fill: fill, hydrate: hydrate, spec: function (id) { return SHOTS[id]; }, list: SHOTS };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { hydrate(); });
  else hydrate();
})();
