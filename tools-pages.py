#!/usr/bin/env python3
"""Generate pasero.app/tools/*.html from privacy.html's shell (head styles, header, footer).

Run:  python3 tools-pages.py
The tool logic lives in tools/*.js; this script only writes the HTML pages.
Re-run it after changing the site header in privacy.html or any page copy below."""
import html, re, sys, os
ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'tools')
src = open(os.path.join(ROOT, 'privacy.html'), encoding='utf8').read()

# ---- shell pieces from privacy.html -------------------------------------
head_open = src[:src.find('<title>')]
styles = src[src.find('<style>'):src.find('</head>')]
styles = styles.replace('<link rel="stylesheet" href="pasero-privacy.css?v=1">', '')
styles = re.sub(r'href="(?!https?:|#|\.\./)([^"]+)"', r'href="../\1"', styles)
header = src[src.find('<header'):src.find('</header>') + 9]
header = re.sub(r'(href|src)="(?!https?:|#|mailto:|\.\./)([^"]+)"', r'\1="../\2"', header)
header = header.replace('<a href="../tools/index.html">Tools</a>', '<a href="index.html" aria-current="page">Tools</a>')
assert 'Tools</a>' in header
footer = src[src.find('<footer'):src.find('</footer>') + 9]
footer = footer.replace('href="download.html"', 'href="../download.html"')

CSP = ("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
       "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net https://raw.githubusercontent.com; "
       "img-src 'self' data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'")

def a(s): return html.escape(s, quote=True)
def t(en, zh, ja, tag='span', cls=None, attrs=''):
    c = f' class="{cls}"' if cls else ''
    inner = en if tag in ('h1', 'h2', 'h3') else html.escape(en)
    return f'<{tag}{c}{attrs} data-en="{a(en)}" data-zh="{a(zh)}" data-ja="{a(ja)}">{inner}</{tag}>'

V = '20261108'
LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'
PRIVATE = (f'<p class="tl-private">{LOCK}' +
           t('Runs entirely in your browser. Nothing you type or paste is uploaded — it even works with Wi-Fi off.',
             '全部在你的浏览器里计算，输入或粘贴的内容不会上传。断网也能用。',
             '計算はすべてブラウザ内で行われ、入力・貼り付けた内容は送信されません。Wi-Fi を切っても使えます。') + '</p>')

# ---- tool catalogue -----------------------------------------------------
TOOLS = [
 dict(slug='molarity-calculator', group='sol', shot='d-notes-resources',
      name=('Molarity calculator', '摩尔浓度计算器', 'モル濃度計算'),
      blurb=('How many grams for a 50 mM solution? Mass, concentration and volume from molecular weight.',
             '配 50 mM 溶液要称多少克？用分子量在质量、浓度、体积之间换算。',
             '50 mM の溶液に何 g 必要？分子量から質量・濃度・体積を計算。')),
 dict(slug='dilution-calculator', group='sol', shot='d-notes-new',
      name=('Dilution calculator', '稀释计算器', '希釈計算'),
      blurb=('C1V1 = C2V2 for any unknown, plus a serial dilution planner.',
             'C1V1 = C2V2 求任意一项，另有梯度稀释规划。',
             'C1V1 = C2V2 のどの値でも計算。段階希釈の計画も。')),
 dict(slug='master-mix-calculator', group='sol', shot='d-notes-digest',
      name=('Master mix calculator', 'Master Mix 计算器', 'マスターミックス計算'),
      blurb=('Scale a PCR, qPCR or digest recipe to n reactions with overage.',
             '把 PCR、qPCR 或酶切配方放大到 n 个反应，自动加余量。',
             'PCR・qPCR・制限酵素処理のレシピを n 反応分に。余裕分も自動で。')),
 dict(slug='ligation-calculator', group='clone', shot='d-plasmid-library',
      name=('Ligation calculator', '连接反应计算器', 'ライゲーション計算'),
      blurb=('Insert:vector molar ratio to nanograms and microlitres.',
             '按插入片段与载体的摩尔比算出 ng 和 µL。',
             'インサート：ベクターのモル比から ng と µL を計算。')),
 dict(slug='dna-concentration-converter', group='clone', shot='d-plasmid-map',
      name=('DNA concentration converter', 'DNA 浓度换算', 'DNA 濃度換算'),
      blurb=('ng/µL ↔ nM ↔ copies/µL for dsDNA, ssDNA and RNA.',
             'dsDNA、ssDNA 和 RNA 的 ng/µL ↔ nM ↔ 拷贝数/µL。',
             'dsDNA・ssDNA・RNA の ng/µL ↔ nM ↔ コピー数/µL。')),
 dict(slug='primer-tm-calculator', group='clone', shot='d-plasmid-primer',
      name=('Primer Tm calculator', '引物 Tm 计算器', 'プライマー Tm 計算'),
      blurb=('Nearest-neighbor Tm, GC%, 3′ end check and reverse complement for a primer pair.',
             '最近邻法 Tm、GC%、3′ 端检查和反向互补，一次看一对引物。',
             '最近接塩基対法の Tm、GC%、3′ 末端チェック、逆相補配列をペアで。')),
 dict(slug='qpcr-ddct-calculator', group='data', shot='d-analysis-oneclick',
      name=('qPCR ΔΔCt calculator', 'qPCR ΔΔCt 计算器', 'qPCR ΔΔCt 計算'),
      blurb=('Paste Ct values, get ΔCt, ΔΔCt, fold change and p values against your control.',
             '粘贴 Ct 值，得到 ΔCt、ΔΔCt、倍数变化以及与对照组的 p 值。',
             'Ct 値を貼り付けるだけで ΔCt・ΔΔCt・発現倍率と対照群との p 値。')),
 dict(slug='plot', group='data', shot='d-analysis-oneclick', soon=True,
      name=('Paste to plot', '粘贴出图', '貼るだけでグラフ'),
      blurb=('Paste a table, get a bar, box or dot plot with the right statistical test.',
             '粘贴表格，自动出柱状图、箱型图或点图，并推荐合适的统计检验。',
             '表を貼ると、棒・箱ひげ・ドットプロットと適切な検定を提案。')),
 dict(slug='cell-seeding-calculator', group='cell', shot='d-db-culture',
      name=('Cell counting & seeding', '细胞计数与铺板', '細胞計数と播種'),
      blurb=('Hemocytometer counts to cells/mL and viability, then volumes for every plate.',
             '血球计数板读数换算成细胞/mL 和活率，再算出铺板所需体积。',
             '血球計算盤のカウントから細胞数/mL と生存率、播種量まで。')),
]
GROUPS = [('data', ('Data', '数据', 'データ')),
          ('clone', ('Molecular cloning', '分子克隆', '分子クローニング')),
          ('sol', ('Solutions & reactions', '溶液与反应', '溶液と反応')),
          ('cell', ('Cell culture', '细胞培养', '細胞培養'))]
BY = {x['slug']: x for x in TOOLS}
SOON = ('Coming soon', '即将上线', '近日公開')

def card(x):
    n, b = x['name'], x['blurb']
    badge = t(*SOON, tag='em') if x.get('soon') else ''
    return (f'<a class="tl-tool-card" href="{x["slug"]}.html">{badge}' + t(*n, tag='strong') + t(*b) + '</a>')

def more(current):
    cards = ''.join(card(x) for x in TOOLS if x['slug'] != current)
    return ('<section class="tl-more" aria-labelledby="more-h">' +
            t('More free lab tools', '更多免费实验工具', 'ほかの無料ツール', tag='h2', attrs=' id="more-h"') +
            f'<div class="tl-cards">{cards}</div></section>')

def cta(shot, eyebrow, h2, p):
    return (f'<aside class="tl-cta"><div><p class="dl-eyebrow">' + t(*eyebrow) + '</p>' + t(*h2, tag='h2') + t(*p, tag='p') +
            '<a class="tl-dl" href="../download.html">' + t('Download Pasero free', '免费下载 Pasero', 'Pasero を無料でダウンロード') +
            ' <span aria-hidden="true">↗︎</span></a></div>'
            f'<img data-shot="{shot}" src="../assests/shots/{shot}.en.webp" alt="" loading="lazy" decoding="async"></aside>')

def page(slug, titles, desc, body, scripts=(), noindex=False):
    te, tz, tj = titles
    robots = '<meta name="robots" content="noindex">' if noindex else ''
    sc = ''.join(f'<script src="{s}?v={V}"></script>' for s in scripts)
    doc = (head_open +
           f'<meta http-equiv="Content-Security-Policy" content="{CSP}">'
           f'<title>{html.escape(te)}</title><meta name="description" content="{a(desc)}">{robots}'
           f'<link rel="canonical" href="https://pasero.app/tools/{"" if slug == "index" else slug + ".html"}">'
           + styles + f'<link rel="stylesheet" href="tools.css?v={V}b"><script src="../source-tag.js?v=1"></script></head>'
           f'<body class="dl-page" id="top" data-title-en="{a(te)}" data-title-zh="{a(tz)}" data-title-ja="{a(tj)}">'
           + header + '<main class="dl tl" data-copy><div class="dl-wrap">' + body + '</div></main>' + footer +
           f'<script src="../pasero-ja.js?v=20261108-tools"></script><script src="../pasero-i18n.js?v=20261108-tools"></script>'
           f'<script src="tools-core.js?v={V}"></script>{sc}</body></html>\n')
    with open(os.path.join(OUT, slug + '.html'), 'w', encoding='utf8') as f:
        f.write(doc)

def tool_page(slug, eyebrow, h1, lead, body, cta_args, scripts, desc, noindex=False):
    x = BY[slug]; n = x['name']
    crumb = ('<nav class="tl-crumb" aria-label="Breadcrumb"><a href="index.html">' +
             t('Free lab tools', '免费实验工具', '無料の実験ツール') + '</a> / ' + t(*n) + '</nav>')
    head = ('<div class="tl-head"><p class="dl-eyebrow">' + t(*eyebrow) + '</p>' + t(*h1, tag='h1') +
            t(*lead, tag='p', cls='dl-lead') + PRIVATE + '</div>')
    titles = tuple(f'{nm} — {sfx}' for nm, sfx in zip(n, ('Free lab tools · Pasero', '免费实验工具 · 雀角 Pasero', '無料の実験ツール · 雀角 Pasero')))
    page(slug, titles, desc, crumb + head + body + cta(x['shot'], *cta_args) + more(slug), scripts, noindex)

# ---- small builders -----------------------------------------------------
def field(label, inner, hint=None, fid=None):
    lab = t(*label) if isinstance(label, tuple) else html.escape(label)
    h = t(*hint, tag='small') if hint else ''
    fr = f' for="{fid}"' if fid else ''
    return f'<div class="tl-field"><label{fr} class="tl-label">{lab}</label><span class="tl-in">{inner}</span>{h}</div>'
def inp(fid, value='', ph='', mode='decimal'):
    return f'<input id="{fid}" inputmode="{mode}" autocomplete="off" spellcheck="false" value="{a(value)}" placeholder="{a(ph)}">'
def sel(fid, opts, chosen=None):
    o = ''.join(f'<option value="{a(v)}"{" selected" if v == chosen else ""}>{html.escape(v)}</option>' for v in opts)
    return f'<select id="{fid}" aria-label="unit">{o}</select>'
def unit(u): return f'<span class="tl-unit">{html.escape(u)}</span>'
def seg(name, items, on):
    b = ''.join(f'<button type="button" data-v="{v}" aria-pressed="{str(v == on).lower()}"' +
                f' data-en="{a(l[0])}" data-zh="{a(l[1])}" data-ja="{a(l[2])}">{html.escape(l[0])}</button>' for v, l in items)
    return f'<div class="tl-seg" data-seg="{name}" role="group">{b}</div>'
def card_(title, inner, cls=''):
    return f'<section class="tl-card {cls}">' + (t(*title, tag='h2') if title else '') + inner + '</section>'
RESULT = ('Result', '结果', '結果')

MASS = ['g', 'mg', 'µg', 'ng']; VOL = ['L', 'mL', 'µL']; MOLAR = ['M', 'mM', 'µM', 'nM', 'pM']
CONC_ALL = ['M', 'mM', 'µM', 'nM', 'pM', 'mg/mL', 'µg/mL', 'ng/µL', 'ng/mL', '% (w/v)', '×']

# ======================= 1. Molarity =====================================
body = '<div class="tl-grid">' + card_(None,
  '<div class="tl-fields">' +
  '<div class="tl-field"><span class="tl-label">' + t('Calculate', '要计算', '求める値') + '</span>' +
  seg('solve', [('mass', ('Mass', '质量', '質量')), ('conc', ('Concentration', '浓度', '濃度')), ('vol', ('Volume', '体积', '体積'))], 'mass') + '</div>' +
  field(('Molecular weight', '分子量', '分子量'), inp('mw', '58.44') + unit('g/mol'),
        ('From the bottle or the supplier page. Use the formula weight including water of hydration (e.g. CaCl₂·2H₂O = 147.01).',
         '看试剂瓶或供应商页面。含结晶水的要用含水分子量（如 CaCl₂·2H₂O = 147.01）。',
         '試薬瓶やメーカーのページで確認。水和物は水和水を含む式量で（例：CaCl₂·2H₂O = 147.01）。'), 'mw') +
  field(('Concentration', '浓度', '濃度'), inp('conc', '50') + sel('concU', MOLAR, 'mM'), fid='conc') +
  field(('Volume', '体积', '体積'), inp('vol', '100') + sel('volU', VOL, 'mL'), fid='vol') +
  field(('Mass', '质量', '質量'), inp('mass', '') + sel('massU', MASS, 'g'), fid='mass') +
  '</div>') + card_(RESULT, '<div data-copy id="out"></div>', 'tl-result') + '</div>'
tool_page('molarity-calculator', ('Solutions & reactions', '溶液与反应', '溶液と反応'),
  ('How much do I <em>weigh out?</em>', '到底要称<em>多少克？</em>', '何グラム<em>量ればいい？</em>'),
  ('Enter the molecular weight and any two of mass, concentration and volume. The third one is calculated as you type.',
   '输入分子量，再填质量、浓度、体积中的任意两项，第三项会随输入自动算出。',
   '分子量と、質量・濃度・体積のうち 2 つを入力すると、残りの 1 つがすぐに計算されます。'),
  body, (('In Pasero', '在 Pasero 里', 'Pasero なら'),
         ('The recipe stays with the experiment.', '配方和实验记在一起。', 'レシピは実験と一緒に残る。'),
         ('Pasero notes have molarity, dilution and master-mix calculators built in, and link each reagent to every experiment that used it.',
          'Pasero 的实验笔记里自带摩尔浓度、稀释和 Master Mix 计算器，每种试剂都关联到用过它的实验。',
          'Pasero の実験ノートにはモル濃度・希釈・マスターミックスの計算機が組み込まれ、試薬ごとに使った実験がつながります。')),
  ['molarity.js'], 'Free molarity calculator: grams to weigh out from molecular weight, concentration and volume. Runs in your browser; nothing is uploaded.')

# ======================= 2. Dilution =====================================
body = '<div class="tl-grid">' + card_(('C1V1 = C2V2', 'C1V1 = C2V2', 'C1V1 = C2V2'),
  '<div class="tl-fields">' +
  '<div class="tl-field"><span class="tl-label">' + t('Calculate', '要计算', '求める値') + '</span>' +
  seg('solve', [('v1', ('Stock volume V1', '原液体积 V1', '原液量 V1')), ('c2', ('Final conc. C2', '终浓度 C2', '最終濃度 C2')),
                ('c1', ('Stock conc. C1', '原液浓度 C1', '原液濃度 C1')), ('v2', ('Final volume V2', '终体积 V2', '最終量 V2'))], 'v1') + '</div>' +
  '<div class="tl-row">' + field(('Stock concentration C1', '原液浓度 C1', '原液濃度 C1'), inp('c1', '10') + sel('c1U', CONC_ALL, 'mM'), fid='c1') +
  field(('Stock volume V1', '原液体积 V1', '原液量 V1'), inp('v1', '') + sel('v1U', VOL, 'µL'), fid='v1') + '</div>' +
  '<div class="tl-row">' + field(('Final concentration C2', '终浓度 C2', '最終濃度 C2'), inp('c2', '100') + sel('c2U', CONC_ALL, 'µM'), fid='c2') +
  field(('Final volume V2', '终体积 V2', '最終量 V2'), inp('v2', '1') + sel('v2U', VOL, 'mL'), fid='v2') + '</div>' +
  field(('Molecular weight (only to convert mass ↔ molar)', '分子量（仅在质量浓度与摩尔浓度互换时需要）', '分子量（質量濃度とモル濃度の換算時のみ）'),
        inp('mw', '') + unit('g/mol'), fid='mw') +
  '</div>') + card_(RESULT, '<div data-copy id="out"></div>', 'tl-result') + '</div>' + \
  '<div class="tl-grid" style="margin-top:22px">' + card_(('Serial dilution', '梯度稀释', '段階希釈'),
  '<div class="tl-fields"><div class="tl-row">' +
  field(('Starting concentration', '起始浓度', '開始濃度'), inp('sStart', '1') + sel('sU', CONC_ALL, 'mg/mL'), fid='sStart') +
  field(('Dilution factor per step', '每步稀释倍数', '1 段ごとの希釈倍率'), inp('sFold', '2') + unit('×'), fid='sFold') + '</div><div class="tl-row">' +
  field(('Number of tubes', '管数', '本数'), inp('sN', '8', mode='numeric'), fid='sN') +
  field(('Volume left in each tube', '每管最终留下的体积', '各チューブに残す量'), inp('sV', '100') + sel('sVU', VOL, 'µL'), fid='sV') + '</div>' +
  t('Tube 1 is made from the stock. Each tube is made a little larger so that, after you take the transfer volume for the next tube, every tube is left with the same volume.',
    '第 1 管从原液稀释。每管会多配一点，取走给下一管的转移量后，每管剩下的体积都一样。',
    '1 本目は原液から作ります。次のチューブへ移す分を見込んで少し多めに作るので、移した後はどのチューブも同じ量になります。', tag='p', cls='tl-note') +
  '</div>') + card_(('Pipetting plan', '加样方案', 'ピペッティング計画'), '<div data-copy id="sOut"></div>', 'tl-result') + '</div>'
tool_page('dilution-calculator', ('Solutions & reactions', '溶液与反应', '溶液と反応'),
  ('Dilute it <em>right the first time.</em>', '稀释，<em>一次算对。</em>', '希釈は<em>一回で正確に。</em>'),
  ('Pick the unknown, fill in the other three. Mass and molar units can be mixed when you add a molecular weight.',
   '选好要算的那一项，填其余三项。填入分子量后，质量浓度和摩尔浓度也可以混用。',
   '求める値を選び、残りの 3 つを入力。分子量を入れれば質量濃度とモル濃度も混在できます。'),
  body,
  (('In Pasero', '在 Pasero 里', 'Pasero なら'),
   ('Dilutions written into the note, not on your glove.', '稀释算在笔记里，不再写在手套上。', '希釈の計算は手袋ではなくノートに。'),
   ('Start a note from a protocol template and the calculators sit right next to the steps they belong to — on the bench phone too.',
    '用方案模板新建笔记，计算器就在对应步骤旁边，手机上在实验台边也能用。',
    'プロトコルのテンプレートからノートを作ると、計算機は該当ステップのすぐ横に。実験台のスマホでも使えます。')),
  ['dilution.js'], 'Free dilution calculator (C1V1 = C2V2) with a serial dilution planner. Molar and mass units. Runs in your browser; nothing is uploaded.')

# ======================= 3. Master mix ===================================
body = '<div class="tl-grid tl-wide">' + card_(None,
  '<div class="tl-fields">' +
  '<div class="tl-field"><span class="tl-label">' + t('Start from', '从模板开始', 'テンプレート') + '</span>' +
  seg('preset', [('pcr', ('PCR, 2× mix', 'PCR（2× 预混液）', 'PCR（2× ミックス）')), ('qpcr', ('qPCR, SYBR', 'qPCR（SYBR）', 'qPCR（SYBR）')),
                 ('digest', ('Restriction digest', '酶切', '制限酵素処理')), ('blank', ('Blank', '空白', '空白'))], 'pcr') + '</div>' +
  '<div class="tl-row three">' + field(('Reactions', '反应数', '反応数'), inp('n', '12', mode='numeric'), fid='n') +
  field(('Extra', '余量', '余裕分'), inp('extra', '10') + unit('%'), fid='extra') +
  field(('Volume per reaction', '每个反应体积', '1 反応あたりの量'), inp('total', '25') + unit('µL'), fid='total') + '</div>' +
  '<div class="tl-table-wrap"><table class="tl-table" id="mmTable"><thead><tr><th>' + t('Component', '组分', '成分') + '</th><th>' +
  t('Per reaction (µL)', '每个反应 (µL)', '1 反応 (µL)') + '</th><th>' + t('Add per tube instead', '单独加到每管', '各チューブに個別添加') +
  '</th><th>' + t('Fill to volume', '补足到总体积', '全量まで調整') + '</th><th><span class="tl-sr">' + t('Remove', '删除', '削除') + '</span></th></tr></thead><tbody></tbody></table></div>' +
  '<div class="tl-btns"><button type="button" class="tl-btn" id="addRow">' + t('+ Add component', '+ 添加组分', '+ 成分を追加') + '</button></div>' +
  t('Tick “fill to volume” on water: it becomes whatever is left after the other components. Components ticked “add per tube” (usually the template) stay out of the mix.',
    '把“补足到总体积”勾在水上，水量会自动等于总体积减去其他组分。勾选“单独加到每管”的组分（一般是模板）不进预混液。',
    '水に「全量まで調整」をチェックすると、他の成分を引いた残りが水の量になります。「各チューブに個別添加」の成分（通常はテンプレート）はミックスに入りません。', tag='p', cls='tl-note') +
  '</div>') + card_(('Master mix', '预混液', 'マスターミックス'), '<div data-copy id="out"></div>') + '</div>'
tool_page('master-mix-calculator', ('Solutions & reactions', '溶液与反应', '溶液と反応'),
  ('One mix, <em>n</em> reactions.', '一管预混液，<em>n</em> 个反应。', 'ミックスひとつで<em> n </em>反応。'),
  ('Start from a template or your own recipe. Water fills the reaction to volume, and a little extra covers pipetting loss.',
   '从模板或你自己的配方开始。水自动补足到总体积，再多配一点抵消移液损耗。',
   'テンプレートか自分のレシピから。水は全量まで自動で調整し、ピペッティングのロス分も上乗せします。'),
  body, (('In Pasero', '在 Pasero 里', 'Pasero なら'),
         ('Set up the reaction once. Reuse it next time.', '反应设置一次，下次直接复用。', '反応は一度設定すれば、次からは再利用。'),
         ('Digest and PCR setups in Pasero record each sample, the volumes and the reagents used, then write the whole thing into your note.',
          'Pasero 的酶切和 PCR 反应设置会记录每个样品、加样量和用到的试剂，并整份写进实验笔记。',
          'Pasero の制限酵素処理や PCR の設定は、サンプル・添加量・使った試薬を記録し、そのまま実験ノートに書き込みます。')),
  ['master-mix.js'], 'Free master mix calculator for PCR, qPCR and restriction digests: scale any recipe to n reactions with overage. Runs in your browser; nothing is uploaded.')

# ======================= 4. Ligation =====================================
body = '<div class="tl-grid">' + card_(None,
  '<div class="tl-fields"><div class="tl-row">' +
  field(('Vector length', '载体长度', 'ベクター長'), inp('vLen', '5000', mode='numeric') + unit('bp'), fid='vLen') +
  field(('Vector amount', '载体用量', 'ベクター量'), inp('vNg', '50') + unit('ng'), fid='vNg') + '</div><div class="tl-row">' +
  field(('Insert length', '插入片段长度', 'インサート長'), inp('iLen', '1000', mode='numeric') + unit('bp'), fid='iLen') +
  field(('Insert : vector molar ratio', '插入片段 : 载体摩尔比', 'インサート：ベクターのモル比'), inp('ratio', '3') + unit(': 1'), fid='ratio') + '</div>' +
  t('Volumes (optional)', '体积（可选）', '液量（任意）', tag='h3') +
  '<div class="tl-row">' +
  field(('Vector concentration', '载体浓度', 'ベクター濃度'), inp('vConc', '25') + unit('ng/µL'), fid='vConc') +
  field(('Insert concentration', '插入片段浓度', 'インサート濃度'), inp('iConc', '20') + unit('ng/µL'), fid='iConc') + '</div><div class="tl-row three">' +
  field(('Reaction volume', '反应总体积', '反応液量'), inp('rxn', '20') + unit('µL'), fid='rxn') +
  field(('Buffer (10×)', '缓冲液 (10×)', 'バッファー (10×)'), inp('buf', '2') + unit('µL'), fid='buf') +
  field(('Ligase', '连接酶', 'リガーゼ'), inp('lig', '1') + unit('µL'), fid='lig') + '</div></div>') + \
  card_(RESULT, '<div data-copy id="out"></div>', 'tl-result') + '</div>'
tool_page('ligation-calculator', ('Molecular cloning', '分子克隆', '分子クローニング'),
  ('Get the <em>ratio</em> right.', '把<em>摩尔比</em>算对。', '<em>モル比</em>を正しく。'),
  ('Insert ng = vector ng × (insert length ÷ vector length) × ratio. 3:1 is a common start; short inserts often do better at 5:1 to 7:1.',
   '插入片段 ng = 载体 ng ×（插入片段长度 ÷ 载体长度）× 摩尔比。一般从 3:1 开始，短片段常用 5:1 到 7:1。',
   'インサート ng ＝ ベクター ng ×（インサート長 ÷ ベクター長）× モル比。まずは 3:1、短いインサートは 5:1〜7:1 がよく使われます。'),
  body, (('In Pasero', '在 Pasero 里', 'Pasero なら'),
         ('Every plasmid remembers how it was made.', '每个质粒都记得自己是怎么来的。', 'どのプラスミドも、作り方を覚えている。'),
         ('Pasero keeps your plasmid library with maps, digests, primers and Sanger results, and links each one to the notes that used it.',
          'Pasero 的质粒库保存图谱、酶切、引物和 Sanger 结果，每个质粒都关联到用过它的笔记。',
          'Pasero のプラスミドライブラリには、マップ・制限酵素処理・プライマー・Sanger の結果が残り、使ったノートとつながります。')),
  ['ligation.js'], 'Free ligation calculator: insert to vector molar ratio in ng, pmol and µL. Runs in your browser; nothing is uploaded.')

# ======================= 5. DNA concentration ============================
body = '<div class="tl-grid">' + card_(None,
  '<div class="tl-fields">' +
  '<div class="tl-field"><span class="tl-label">' + t('Molecule', '分子类型', '分子の種類') + '</span>' +
  seg('kind', [('ds', ('dsDNA', 'dsDNA', 'dsDNA')), ('ss', ('ssDNA / oligo', 'ssDNA / 寡核苷酸', 'ssDNA / オリゴ')), ('rna', ('ssRNA', 'ssRNA', 'ssRNA'))], 'ds') + '</div>' +
  '<div class="tl-row">' + field(('Length', '长度', '長さ'), inp('len', '5000', mode='numeric') + '<span class="tl-unit" id="lenU">bp</span>', fid='len') +
  field(('Concentration', '浓度', '濃度'), inp('cv', '100') + sel('cu', ['ng/µL', 'nM', 'copies/µL'], 'ng/µL'), fid='cv') + '</div>' +
  t('Molecular weights use the averages published by NEB: dsDNA = bp × 617.96 + 36.04, ssDNA = nt × 308.97 + 18.02, ssRNA = nt × 320.5 + 159.0 g/mol.',
    '分子量采用 NEB 公布的平均值：dsDNA = bp × 617.96 + 36.04，ssDNA = nt × 308.97 + 18.02，ssRNA = nt × 320.5 + 159.0 g/mol。',
    '分子量は NEB の平均値を使用：dsDNA = bp × 617.96 + 36.04、ssDNA = nt × 308.97 + 18.02、ssRNA = nt × 320.5 + 159.0 g/mol。', tag='p', cls='tl-note') +
  '</div>') + card_(RESULT, '<div data-copy id="out"></div>', 'tl-result') + '</div>'
tool_page('dna-concentration-converter', ('Molecular cloning', '分子克隆', '分子クローニング'),
  ('ng/µL, nM, <em>copies.</em>', 'ng/µL、nM、<em>拷贝数。</em>', 'ng/µL、nM、<em>コピー数。</em>'),
  ('Convert a NanoDrop reading into molar concentration and copy number — for Gibson assembly, standard curves or library pooling.',
   '把 NanoDrop 读数换算成摩尔浓度和拷贝数，适用于 Gibson 组装、标准曲线和文库混样。',
   'NanoDrop の値をモル濃度とコピー数に換算。Gibson アセンブリ、検量線、ライブラリのプールに。'),
  body, (('In Pasero', '在 Pasero 里', 'Pasero なら'),
         ('Sequence, map and concentration in one place.', '序列、图谱和浓度放在一起。', '配列もマップも濃度も、一か所に。'),
         ('Import GenBank files into Pasero to get circular maps, restriction analysis and primer design, with every plasmid linked to its experiments.',
          '把 GenBank 文件导入 Pasero，就有环形图谱、酶切分析和引物设计，每个质粒都关联到相关实验。',
          'GenBank ファイルを Pasero に取り込めば、環状マップ・制限酵素解析・プライマー設計まで。プラスミドは実験とつながります。')),
  ['dna-conc.js'], 'Free DNA concentration converter: ng/µL to nM to copies/µL for dsDNA, ssDNA and RNA. Runs in your browser; nothing is uploaded.')

# ======================= 6. Primer Tm ====================================
def seqfield(fid, label, value):
    return (f'<div class="tl-field"><label class="tl-label" for="{fid}">' + t(*label) + '</label>'
            f'<input id="{fid}" class="tl-text tl-seq" autocomplete="off" autocapitalize="characters" spellcheck="false" value="{value}" placeholder="5′ … 3′"></div>')
body = '<div class="tl-grid">' + card_(None,
  '<div class="tl-fields">' +
  seqfield('fwd', ('Forward primer (5′→3′)', '正向引物（5′→3′）', 'フォワードプライマー（5′→3′）'), 'AGCGGATAACAATTTCACACAGGA') +
  seqfield('rev', ('Reverse primer (5′→3′, optional)', '反向引物（5′→3′，可选）', 'リバースプライマー（5′→3′、任意）'), 'GTAAAACGACGGCCAGT') +
  t('Reaction conditions', '反应条件', '反応条件', tag='h3') +
  '<div class="tl-row">' + field(('Na⁺ / K⁺', 'Na⁺ / K⁺', 'Na⁺ / K⁺'), inp('na', '50') + unit('mM'), fid='na') +
  field(('Mg²⁺', 'Mg²⁺', 'Mg²⁺'), inp('mg', '1.5') + unit('mM'), fid='mg') + '</div><div class="tl-row">' +
  field(('dNTPs (total)', 'dNTP（总浓度）', 'dNTP（合計）'), inp('dntp', '0.8') + unit('mM'), fid='dntp') +
  field(('Primer', '引物', 'プライマー'), inp('pc', '250') + unit('nM'), fid='pc') + '</div>' +
  t('Tm uses SantaLucia (1998) nearest-neighbor values with a salt correction, assuming the primer is in large excess over the template; Mg²⁺ is converted to a Na⁺ equivalent (von Ahsen et al., 2001). Different tools use different formulas and defaults, so compare Tm values from the same calculator. For polymerases with their own Tm rules (e.g. Phusion, Q5), follow the supplier’s calculator.',
    'Tm 采用 SantaLucia（1998）最近邻参数并做盐校正（假设引物相对模板大量过量），Mg²⁺ 按 von Ahsen 等（2001）折算为 Na⁺ 当量。不同工具的公式和默认值不同，比较 Tm 时请用同一个计算器。Phusion、Q5 等有自己 Tm 规则的聚合酶，请以厂家计算器为准。',
    'Tm は SantaLucia（1998）の最近接塩基対パラメータと塩補正で計算し（プライマーがテンプレートより大過剰と仮定）、Mg²⁺ は von Ahsen ら（2001）の式で Na⁺ 当量に換算しています。ツールごとに式と既定値が異なるため、Tm の比較は同じ計算機で。Phusion や Q5 など独自の Tm 規則がある酵素は、メーカーの計算機に従ってください。', tag='p', cls='tl-note') +
  '</div>') + card_(RESULT, '<div data-copy id="out"></div>', 'tl-result') + '</div>'
tool_page('primer-tm-calculator', ('Molecular cloning', '分子克隆', '分子クローニング'),
  ('Check the pair <em>before you order.</em>', '下单前，<em>先把引物对检查一遍。</em>', '注文する前に、<em>ペアを確認。</em>'),
  ('Tm, GC content, 3′ end and the reverse complement for each primer, plus how well the pair matches.',
   '每条引物的 Tm、GC 含量、3′ 端情况和反向互补序列，以及两条引物是否匹配。',
   '各プライマーの Tm、GC 含量、3′ 末端、逆相補配列と、ペアの釣り合いをチェック。'),
  body, (('In Pasero', '在 Pasero 里', 'Pasero なら'),
         ('Design primers on the plasmid itself.', '直接在质粒上设计引物。', 'プラスミドの上で、そのままプライマー設計。'),
         ('In Pasero, pick a region on the map and get primer pairs with Tm and GC%, then check them against Sanger traces later.',
          '在 Pasero 里，选中图谱上的区域就能得到带 Tm 和 GC% 的引物对，之后还能和 Sanger 峰图比对。',
          'Pasero ではマップ上の領域を選ぶだけで Tm と GC% 付きのプライマーペアを提案。あとで Sanger の波形とも照合できます。')),
  ['primer.js'], 'Free primer Tm calculator: nearest-neighbor Tm with salt and Mg correction, GC%, 3′ end check and reverse complement. Runs in your browser; nothing is uploaded.')

# ======================= 7. qPCR ΔΔCt ====================================
SAMPLE = ("Sample\tTarget Ct\tReference Ct\n"
          "Control\t24.8\t17.9\nControl\t25.1\t18.1\nControl\t24.6\t17.8\n"
          "Treated\t22.9\t18.0\nTreated\t23.3\t18.3\nTreated\t22.7\t17.8\n"
          "Knockdown\t27.4\t18.1\nKnockdown\t27.9\t18.4\nKnockdown\t27.1\t17.9")
body = '<div class="tl-grid tl-wide">' + card_(None,
  '<div class="tl-fields">' +
  '<div class="tl-field"><label class="tl-label" for="paste">' + t('Paste three columns: sample, target Ct, reference Ct', '粘贴三列：样品、目的基因 Ct、内参 Ct', '3 列を貼り付け：サンプル、標的遺伝子 Ct、リファレンス Ct') + '</label>'
  f'<textarea id="paste" class="tl-paste" spellcheck="false" autocomplete="off" translate="no">{html.escape(SAMPLE)}</textarea>' +
  t('Copy straight from Excel or your instrument export. One row per biological replicate (average technical replicates first). Rows sharing a sample name are one group. A header row is optional; “Undetermined” is skipped.',
    '可以直接从 Excel 或仪器导出的表格复制。每行一个生物学重复（技术重复先取平均）。样品名相同的行算一组。表头可有可无，“Undetermined” 会被跳过。',
    'Excel や装置のエクスポートからそのままコピーできます。1 行に 1 生物学的反復（技術的反復は先に平均）。同じサンプル名の行が 1 群になります。見出し行は任意で、「Undetermined」はスキップされます。', tag='small') + '</div>' +
  '<div class="tl-row three"><div class="tl-field"><label class="tl-label" for="ctrl">' + t('Control sample', '对照组', '対照サンプル') + '</label><select id="ctrl" class="tl-select"></select></div>' +
  field(('Target efficiency', '目的基因扩增效率', '標的遺伝子の増幅効率'), inp('effT', '100') + unit('%'), fid='effT') +
  field(('Reference efficiency', '内参扩增效率', 'リファレンスの増幅効率'), inp('effR', '100') + unit('%'), fid='effR') + '</div>' +
  '<div class="tl-btns"><button type="button" class="tl-btn" id="clear">' + t('Clear', '清空', 'クリア') + '</button><button type="button" class="tl-btn" id="example">' +
  t('Load example', '载入示例', '例を読み込む') + '</button></div></div>') + \
  card_(RESULT, '<div data-copy id="out"></div>') + '</div>'
tool_page('qpcr-ddct-calculator', ('Data', '数据', 'データ'),
  ('From Ct values to <em>fold change.</em>', '从 Ct 值到<em>倍数变化。</em>', 'Ct 値から<em>発現倍率</em>へ。'),
  ('Paste your Ct table, choose the control, and get ΔCt, ΔΔCt, 2^−ΔΔCt and a t-test for every sample.',
   '粘贴 Ct 表格，选好对照组，每个样品的 ΔCt、ΔΔCt、2^−ΔΔCt 和 t 检验都会算好。',
   'Ct の表を貼って対照を選ぶだけで、各サンプルの ΔCt・ΔΔCt・2^−ΔΔCt と t 検定を計算。'),
  body, (('In Pasero', '在 Pasero 里', 'Pasero なら'),
         ('Ct values in, figure out, saved to the note.', '粘贴 Ct 值，出图，存进笔记。', 'Ct 値を入れれば、図になってノートに残る。'),
         ('Pasero’s data analysis turns the same table into a publication-style relative-expression figure with statistics and a methods paragraph, and keeps it in your lab notes.',
          'Pasero 的数据分析能把同一张表直接画成期刊风格的相对表达量图，附带统计结果和方法描述，并保存在实验笔记里。',
          'Pasero のデータ解析なら、同じ表から論文スタイルの相対発現量の図を統計結果・方法の記述付きで作成し、実験ノートに保存できます。')),
  ['stats.js', 'qpcr.js'], 'Free qPCR ΔΔCt calculator: paste Ct values, get ΔCt, ΔΔCt, 2^-ΔΔCt fold change, Pfaffl efficiency correction and t-tests. Runs in your browser; nothing is uploaded.')

# ======================= 8. Cell counting & seeding ======================
body = '<div class="tl-grid">' + card_(('1 · Count', '1 · 计数', '1 · 計数'),
  '<div class="tl-fields">' +
  '<div class="tl-field"><span class="tl-label">' + t('Method', '方式', '方法') + '</span>' +
  seg('mode', [('hemo', ('Hemocytometer', '血球计数板', '血球計算盤')), ('direct', ('I already have cells/mL', '已有细胞浓度', '細胞数/mL がわかっている'))], 'hemo') + '</div>' +
  '<div id="hemoBox" class="tl-fields">' +
  '<div class="tl-field"><label class="tl-label" for="live">' + t('Live cells in each large square', '每个大方格的活细胞数', '各大区画の生細胞数') + '</label>'
  '<input id="live" class="tl-text" inputmode="decimal" autocomplete="off" spellcheck="false" value="48 52 45 50">' +
  t('Separate counts with spaces or commas — usually the 4 corner squares.', '用空格或逗号隔开，通常数四个角的大方格。', 'スペースかカンマで区切って入力（通常は四隅の 4 区画）。', tag='small') + '</div>' +
  '<div class="tl-field"><label class="tl-label" for="dead">' + t('Dead (blue) cells in the same squares, optional', '同样方格里的死细胞（蓝色），可选', '同じ区画の死細胞（青）、任意') + '</label>'
  '<input id="dead" class="tl-text" inputmode="decimal" autocomplete="off" spellcheck="false" value="3 2 4 3"></div>' +
  field(('Dilution factor', '稀释倍数', '希釈倍率'), inp('df', '2') + unit('×'),
        ('2 for a 1:1 mix with trypan blue.', '与台盼蓝 1:1 混合时为 2。', 'トリパンブルーと 1:1 で混ぜた場合は 2。'), 'df') + '</div>' +
  '<div id="directBox" class="tl-fields" hidden>' +
  field(('Live cells per mL', '活细胞浓度', '生細胞数'), inp('direct', '1.2e6') + unit('cells/mL'),
        ('From an automated counter. 1.2e6 means 1.2 × 10⁶.', '来自自动细胞计数仪。1.2e6 表示 1.2 × 10⁶。', '自動セルカウンターの値など。1.2e6 は 1.2 × 10⁶。'), 'direct') + '</div>' +
  '<div id="countOut" data-copy></div></div>') + \
  card_(('2 · Seed', '2 · 铺板', '2 · 播種'),
  '<div class="tl-fields">' +
  '<div class="tl-field"><label class="tl-label" for="plate">' + t('Vessel', '培养器皿', '培養容器') + '</label><select id="plate" class="tl-select"></select></div>' +
  '<div class="tl-row">' + field(('Wells or dishes', '孔数或皿数', 'ウェル数・ディッシュ数'), inp('wells', '24', mode='numeric'), fid='wells') +
  field(('Cells per well', '每孔细胞数', '1 ウェルあたりの細胞数'), inp('cpw', '5e4'), fid='cpw') + '</div><div class="tl-row">' +
  field(('Medium per well', '每孔培养基', '1 ウェルあたりの培地量'), inp('vpw', '500') + sel('vpwU', ['µL', 'mL'], 'µL'), fid='vpw') +
  field(('Extra', '余量', '余裕分'), inp('extra', '10') + unit('%'), fid='extra') + '</div>' +
  '<div id="seedOut" data-copy></div></div>', 'tl-result') + '</div>'
tool_page('cell-seeding-calculator', ('Cell culture', '细胞培养', '細胞培養'),
  ('Count once. <em>Seed every well the same.</em>', '数一次，<em>每孔铺得一样。</em>', '一度数えて、<em>どのウェルも同じに。</em>'),
  ('Turn hemocytometer counts into cells/mL and viability, then get how much cell suspension and medium to mix for your plate.',
   '把血球计数板的读数换算成细胞浓度和活率，再算出铺板要混多少细胞悬液和培养基。',
   '血球計算盤のカウントを細胞数/mL と生存率に換算し、プレートに必要な細胞懸濁液と培地の量を計算します。'),
  body, (('In Pasero', '在 Pasero 里', 'Pasero なら'),
         ('Every passage, on record.', '每一次传代，都有记录。', '継代のたびに、ちゃんと残る。'),
         ('Pasero tracks each culture from thaw to freeze: passage number, days in culture, vials and where they are, with a reminder when it’s time to split.',
          'Pasero 记录每瓶细胞从复苏到冻存的全过程：代数、培养天数、冻存支数和位置，该传代时还会提醒你。',
          'Pasero は細胞を融解から凍結まで記録します。継代数、培養日数、凍結本数と保管場所、継代のタイミングもお知らせ。')),
  ['cells.js'], 'Free cell counting and seeding calculator: hemocytometer counts to cells/mL and viability, then volumes for 96-, 24-, 12-, 6-well plates and dishes. Runs in your browser; nothing is uploaded.')

# ======================= 9. Plot (placeholder) ===========================
body = ('<section class="tl-card" id="plot-app" aria-live="polite">' +
        t('Coming soon', '即将上线', '近日公開', tag='p', cls='dl-eyebrow') +
        t('Paste a table and get a bar, box or dot plot, the recommended statistical test and a methods sentence — all in your browser.',
          '粘贴表格，就能得到柱状图、箱型图或点图，以及推荐的统计检验和方法描述，全部在你的浏览器里完成。',
          '表を貼るだけで、棒グラフ・箱ひげ図・ドットプロット、推奨される検定、方法の一文まで。すべてブラウザ内で。', tag='p') +
        t('Until then, the same feature is free in the Pasero desktop app.', '在这之前，Pasero 桌面端里已经可以免费使用同样的功能。',
          'それまでは、Pasero のデスクトップアプリで同じ機能を無料で使えます。', tag='p', cls='tl-note') +
        '</section>')
tool_page('plot', ('Data', '数据', 'データ'),
  ('Paste. <em>Plot.</em>', '粘贴，<em>就出图。</em>', '貼るだけで、<em>グラフに。</em>'),
  ('Bar, box and dot plots with the right test, ready for a figure.', '柱状图、箱型图、点图，配好合适的检验，直接可以放进论文。',
   '棒グラフ・箱ひげ図・ドットプロットを、適切な検定つきで。そのまま論文の図に。'),
  body, (('In Pasero', '在 Pasero 里', 'Pasero なら'),
         ('Figures are free in Pasero today.', 'Pasero 里出图现在就免费。', 'Pasero なら、グラフ作成はいまも無料。'),
         ('Paste data, get the recommended chart and test, p values and a methods paragraph. Vector export: 5 free, unlimited with Pro.',
          '粘贴数据，自动推荐图表类型和统计检验，给出 p 值和方法描述。矢量导出免费 5 次，Pro 无限次。',
          'データを貼ると、推奨のグラフと検定、p 値、方法の記述まで。ベクター書き出しは 5 回まで無料、Pro は無制限。')),
  [], 'Paste a table, get a bar, box or dot plot with the right statistical test. Coming soon to Pasero free lab tools.', noindex=True)

# ======================= Hub =============================================
groups_html = ''
for key, label in GROUPS:
    cards = ''.join(card(x) for x in TOOLS if x['group'] == key)
    groups_html += '<div class="tl-group">' + t(*label, tag='h3') + f'<div class="tl-cards">{cards}</div></div>'
hub = ('<div class="tl-head tl-hub-hero"><p class="dl-eyebrow">' + t('Free lab tools', '免费实验工具', '無料の実験ツール') + '</p>' +
       t('Small tools for <em>everyday bench math.</em>', '实验台上的<em>日常计算。</em>', '実験台の<em>毎日の計算に。</em>', tag='h1') +
       t('Molarity, dilutions, master mixes, ligations, primers, qPCR and cell seeding. Free, no sign-up, in English, 中文 and 日本語.',
         '摩尔浓度、稀释、预混液、连接反应、引物、qPCR、细胞铺板，常用的计算都在这里。免费，无需注册，支持中文、English、日本語。',
         'モル濃度、希釈、マスターミックス、ライゲーション、プライマー、qPCR、細胞播種。無料・登録不要、日本語・English・中文に対応。', tag='p', cls='dl-lead') +
       PRIVATE + '</div>' + groups_html +
       cta('d-home', ('In Pasero', '在 Pasero 里', 'Pasero なら'),
           ('These tools, connected to your notes.', '这些工具，和你的笔记连在一起。', 'これらのツールが、ノートとつながる。'),
           ('Pasero is a lab notebook for molecular biology: notes, plasmids, cells, data analysis and lab-meeting slides in one place, on your desktop and phone.',
            'Pasero 是为分子生物学做的实验记录软件：实验笔记、质粒、细胞、数据分析和组会 PPT 都在一个地方，电脑和手机都能用。',
            'Pasero は分子生物学のための実験ノートです。ノート、プラスミド、細胞、データ解析、ラボミーティングの資料をひとつに。デスクトップでもスマホでも。')) +
       '<div style="height:clamp(30px,4vw,56px)"></div>')
page('index', ('Free lab tools — Pasero', '免费实验工具 — 雀角 Pasero', '無料の実験ツール — 雀角 Pasero'),
     'Free lab calculators for molecular biology: molarity, dilution, master mix, ligation, DNA concentration, primer Tm, qPCR ΔΔCt and cell seeding. Runs in your browser; nothing is uploaded.',
     hub, [])
print('ok', len(TOOLS) + 1, 'pages')
