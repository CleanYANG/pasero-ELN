# Screenshot slots

Every product screenshot on pasero.app is a named slot. Until a file exists, the site shows a labelled placeholder that names the screen.

To publish a capture, save it in this folder under the slot name and redeploy. No code change is needed.

- Images: `<id>.<lang>.webp` with lang = `en`, `ja` or `zh`. Desktop feature shots keep their own shape (very tall ones are capped at 74% of the window height); the hero `d-home` is framed at 1600:880 so the pen marks line up.
- Video slots: `<id>.<lang>.mp4` (H.264, muted, short) plus `<id>.<lang>.webp` as the poster; on phones the video waits on that poster until tapped.
- Each visitor sees the file for the page language. A missing language falls back to `.en`, then to a legacy `<id>.png` / `<id>.mp4`.
- Desktop shots (2026-11-03) are Hong Yang's own screenshots and recordings from the desktop app, converted to webp (max 2000 px wide) and H.264 (max 1920 px wide, CRF 25). ZH shots (from 中文/) cover every slot except `d-notes-resources` and `d-plasmid-trace`, which fall back to English; JA falls back to English until 日文/ arrives.

## Slots in use on the homepage

| Feature | Slot | Source file (英文/) |
|---|---|---|
| Hero | `d-home` | 首页.png |
| Notes | `d-notes-new`, `d-notes-cells`, `d-notes-digest`, `d-notes-resources` | notes.png, Notes+cells.png, Notes+酶切.png, 图片+资源关联.png |
| Data analysis | `d-analysis-oneclick` (video) | data analysis.mp4 |
| Plasmids | `d-plasmid-library`, `d-plasmid-map`, `d-plasmid-primer`, `d-plasmid-sanger` (video), `d-plasmid-trace` | Plasmid overview.png, Plasmid+sequencing overview.png, Plasmid+primer.png, plasmid+sanger.mp4, Plasmid+trace.png |
| Database | `d-db-libraries`, `d-db-culture` | database overview.png, database+cell.png |
| Literature | `d-lit-library` | 文献.png |
| Presentations | `d-pres-slides`, `d-pres-journal` (video), `d-pres-poster` (video) | lab meetings.png, presentation+AI论文.mp4, presentation+poster+AI.mp4 |
| Research assistant | `d-ra-notes`, `d-ra-search` | research assistant.png, research assistant+public search.png |

The full slot catalogue below also lists slots that are defined in `pasero-shots.js` but not shown right now.

## Desktop (Windows)

| File | Screen | What to show |
|---|---|---|
| `d-home.png` | 桌面端 · 首页 / Desktop · Home | 最近笔记、进行中的细胞培养和待办一屏可见 |
| `d-notes-editor.png` | 实验笔记 · 编辑器 / Lab notes · Editor | 一篇完整笔记：带公式的表格、标注图片、实验结果和关联资源 |
| `d-notes-new.png` | 实验笔记 · 新建笔记 / Lab notes · New note | 四种新建方式：空白、方案模板、酶切反应、细胞实验 |
| `d-notes-import.png` | 实验笔记 · 批量导入 / Lab notes · Batch import | Excel、CSV 或文档批量生成笔记，并构建自己的词汇库 |
| `d-notes-export.png` | 实验笔记 · 导出 / Lab notes · Export | 笔记导出 Word / PDF 的预览 |
| `d-analysis-oneclick.mp4` | 数据分析 · 一键出图 / Data analysis · One-click figures | 粘贴表格 → 期刊级图表、统计结果和方法描述的短录屏 |
| `d-analysis-overview.png` | 数据分析 · 导入与出图 / Data analysis · Import and plot | 数据表与对应的柱状图、折线图或箱型图并排 |
| `d-analysis-stats.png` | 数据分析 · 统计与拟合 / Data analysis · Statistics and fitting | 统计检验结果和一条拟合曲线（如 IC50） |
| `d-analysis-qpcr.png` | 数据分析 · qPCR / Data analysis · qPCR | ΔΔCt 结果表与相对表达量图 |
| `d-analysis-wb.png` | 数据分析 · Western blot / Data analysis · Western blot | 条带灰度及内参归一化结果 |
| `d-analysis-export.png` | 数据分析 · 数据图导出 / Data analysis · Figure export | Nature / Cell / Science 样式选择与 PDF / SVG 导出 |
| `d-plasmid-map.png` | 质粒 · 质粒库与图谱 / Plasmids · Library and map | GenBank 导入后的环形图谱和注释列表 |
| `d-plasmid-seq.png` | 质粒 · 序列编辑 / Plasmids · Sequence editor | 序列视图中编辑一个选中的特征 |
| `d-plasmid-restriction.png` | 质粒 · 酶切分析 / Plasmids · Restriction analysis | 切点、片段大小、电泳预览和缓冲液推荐 |
| `d-plasmid-digest.png` | 质粒 · 酶切反应设置 / Plasmids · Digest reaction | 样品表、加样量，以及开始反应并写入笔记的按钮 |
| `d-plasmid-primer.png` | 质粒 · 引物设计 / Plasmids · Primer design | 模板上的一对引物及其 Tm 和 GC% |
| `d-plasmid-primer-adv.png` | 质粒 · 高级引物设计 / Plasmids · Advanced primer design | 定点突变引物设计结果 |
| `d-plasmid-sanger.png` | 质粒 · Sanger 比对 / Plasmids · Sanger alignment | AB1 峰图与参考序列比对，选中一处差异 |
| `d-db-libraries.png` | 数据库 · 方案、试剂与细胞库 / Database · Libraries | 一条试剂或细胞记录，以及用到它的笔记 |
| `d-db-culture.png` | 数据库 · 细胞培养追踪 / Database · Cell culture tracking | 一条培养时间线：复苏、传代、冻存、冻存支数、传代提醒 |
| `d-db-trace.png` | 数据库 · 资源追溯 / Database · Trace usage | 从一个资源跳到所有用过它的实验 |
| `d-db-protocol.png` | 数据库 · 从记录整理方案 / Database · Protocol from records | 从历史笔记整理出的可复用方案 |
| `d-lit-library.png` | 文献 · 文献库与阅读器 / Literature · Library and reader | 双页 PDF 阅读，带高亮与笔记 |
| `d-lit-search.png` | 文献 · 检索 / Literature · Search | 检索结果与开放获取 PDF 下载 |
| `d-lit-terms.png` | 文献 · 术语与引用 / Literature · Terms and citations | 术语解释弹窗与引用格式选择 |
| `d-pres-slides.png` | 研究汇报 · 用结果生成 PPT / Presentations · Slides from results | 选择已保存的结果，以及生成的幻灯片预览 |
| `d-pres-ai.png` | 研究汇报 · Pasero AI / Presentations · Pasero AI | 用 Pasero AI 起草的组会文献汇报或海报 |
| `d-ra-notes.png` | 研究助手 · 查找与写入笔记 / Research Assistant · Notes | 自然语言提问、找到的笔记，以及保存前的确认 |
| `d-ra-search.png` | 研究助手 · 资源检索 / Research Assistant · Lookup | 基因、蛋白、术语、细胞系、试剂的检索结果 |
| `d-ra-calc.png` | 研究助手 · 实验计算 / Research Assistant · Lab calculations | 在对话中完成 GC 含量、Tm 或稀释计算 |
| `d-sync.png` | 桌面端 · 手机同步 / Desktop · Phone sync | 配对二维码与上次同步摘要 |

## Mobile

| File | Screen | What to show |
|---|---|---|
| `m-home.png` | 移动端 · 首页 / Mobile · Home | 笔记列表与快速记录按钮 |
| `m-notes-editor.png` | 笔记 · 编辑 / Notes · Editor | 带表格、照片和实验结果的笔记 |
| `m-notes-quick.png` | 笔记 · 快速记录 / Notes · Quick note | 锁屏快速记录或拍照，离线保存 |
| `m-notes-tools.png` | 笔记 · 计算器 / Notes · Calculators | 笔记内的摩尔浓度、稀释、Master Mix 或单位换算 |
| `m-notes-todo.png` | 笔记 · 待办与计时 / Notes · To-dos and timers | 运行中的实验计时和锁屏提醒 |
| `m-notes-pdf.png` | 笔记 · 导出 PDF / Notes · PDF export | 导出面板：单条笔记，或多条合并成一个 PDF |
| `m-reagent-library.png` | 试剂 · 试剂库 / Reagents · Library | 可搜索的试剂列表，以及某个试剂关联的实验 |
| `m-reagent-safety.png` | 试剂 · 安全信息 / Reagents · Safety | 来自 PubChem 的 GHS 危害图标和说明 |
| `m-cell-library.png` | 细胞 · 细胞库 / Cells · Library | 一条细胞系记录，含来源和亲本细胞 |
| `m-cell-track.png` | 细胞 · 培养追踪 / Cells · Culture tracking | 培养时间线：传代、冻存和下次提醒 |
| `m-plasmid-library.png` | 质粒 · 质粒库 / Plasmids · Library | 一个质粒的序列特征和来源 |
| `m-plasmid-restriction.png` | 质粒 · 酶切分析 / Plasmids · Restriction analysis | 切点图、片段和虚拟电泳 |
| `m-plasmid-digest.png` | 质粒 · 酶切反应设置 / Plasmids · Digest reaction | 样品表、加样量和反应计时 |
| `m-lit-library.png` | 文献 · 阅读器 / Literature · Reader | 阅读器中打开的论文和阅读进度 |
| `m-lit-search.png` | 文献 · 生命科学检索 / Literature · Life-science search | 来自 NCBI、Europe PMC、UniProt、PubChem 或 PDB 的结果 |
| `m-discovery.mp4` | 发现 · 论文卡片 / Discovery · Paper cards | 短录屏：滑动推荐论文并收藏一篇 |
| `m-seek-chat.png` | Seek · Pasero AI 对话 / Seek · Pasero AI chat | 一段对话和“保存到笔记”操作 |
| `m-seek-context.png` | Seek · 笔记作为上下文 / Seek · Notes as context | 选择要带入提问的笔记 |
| `m-sync.png` | 移动端 · 与桌面端同步 / Mobile · Sync with desktop | 扫描桌面端二维码以及同步结果 |

## Where each slot appears

- Home hero: `d-home` (wide screens), `m-home` (phones)
- Home, desktop feature explorer: all `d-notes-*`, `d-analysis-*`, `d-plasmid-*`, `d-db-*`, `d-lit-*`, `d-pres-*`, `d-ra-*`
- Home, mobile chapter: `m-home`, `d-home`
- Mobile page hero: `m-home`
- Mobile page explorer: all `m-notes-*`, `m-reagent-*`, `m-cell-*`, `m-plasmid-*`, `m-lit-*`, `m-discovery`, `m-seek-*`
- Mobile page sync chapter: `d-sync`, `m-sync`

## Hero pen marks (home and mobile page)

The hand-drawn circle, arrows and notes on the home hero sit on top of `d-home`. When the real capture lands,
move them to the right spots: the three `<g class="ink …">` groups in `index.html` (1000 × 625 coordinates)
and the matching `.hx-note-1/2/3` positions in `pasero-hero-2026.css` (percentages of the same box).

The mobile page hero works the same way around `m-home`: the `<g class="ink …">` groups in `mobile.html`
(1000 × 800 board, phone spans x 315–685) and the `.hx-m .hx-note-1/2/3` positions in `pasero-hero-2026.css`.
