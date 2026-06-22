# 前端样式重构 —「极简静默」落地实现设计

- 日期：2026-06-22
- 设计稿：`designs/design.pen`（14 个顶层画板：3 桌面页 + 3 移动页 + 1 规范画板 + 6 组件画板）
- 上游规范：`docs/superpowers/specs/2026-06-22-quiet-minimal-redesign-design.md`（视觉方向已确认）
- 本文：把已确认的 Pencil 设计稿落地为代码

## 0. 目标与范围

把 `design.pen` 里的「极简静默」视觉方向，落地为前端样式与组件代码。

**确认的范围**：

1. **3 个核心页面内容重构**：首页 `/`、写作归档页 `/writing`、文章详情页 `/blogs/[slug]`。
2. **全局顶栏/页脚替换**：`SiteHeader.astro` / `SiteFooter.astro` 重构为新设计，作为全局组件应用到**所有页面**。
3. **新设计 token 基座**：`theme.css` 重写为 Pencil variables 的 1:1 映射，成为全站基座。

**不在本次范围**（后续迭代）：

- 专栏（`/columns`）、关于（`/about`）、技术栈（`/techStack`）、标签（`/tags`）、简历（`/resume`）、英文镜像（`/en/*`）等页面的**内容区**重构。
- 这些页面会自动继承新顶/底栏和新 token，可能出现「新顶栏 + 旧卡片」的过渡态——**可接受**，不破坏功能。

**实现策略**：方案 A（设计 token 基座 + 组件渐进重构）。每步可独立 `pnpm build` 验证。

## 1. 设计 Token 基座

### 1.1 `src/styles/theme.css` 重写

把 `design.pen` 的 variables 1:1 落地为 CSS 变量。**完全替换**现有 `theme.css` 内容。

| Token | 浅色 | 深色 | 来源 |
|---|---|---|---|
| `--accent` | `#2E8B5E` | `#7FD0A6` | `$accent` |
| `--accent-soft` | `rgba(46,139,94,0.12)` | `rgba(127,208,166,0.15)` | `$accent-soft`（alpha 扩展） |
| `--page-bg` | `#FAF8F3` | `#131714` | `$page-bg` |
| `--surface` | `#FFFFFF` | `#1A201C` | `$surface` |
| `--text-strong` | `#1A1F1C` | `#E8EDE9` | `$text-strong` |
| `--text-muted` | `#6B756F` | `#9CA8A1` | `$text-muted` |
| `--hairline` | `rgba(26,31,28,0.08)` | `rgba(232,237,233,0.10)` | `$hairline` |
| `--font-serif` | `"Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif` | — | `$font-serif` |
| `--font-sans` | `"Inter", system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif` | — | `$font-sans` |

### 1.2 容器宽度与间距尺度

| Token | 值 | 用途 |
|---|---|---|
| `--shell-width` | `1000px` | 外壳（原 `82rem`≈1312px，收窄聚焦） |
| `--reading-width` | `680px` | 阅读区（原 `46rem`≈736px） |
| `--shell-pad` | `clamp(1.5rem, 5vw, 5rem)` | 外壳左右内边距（桌面 80px，窄屏收窄） |

间距刻度（8px 基准，留白偏大），以 CSS 变量登记便于复用：
`--sp-1: 4px · --sp-2: 8px · --sp-3: 16px · --sp-4: 24px · --sp-5: 40px · --sp-6: 64px · --sp-7: 96px · --sp-8: 128px`

### 1.3 移除的旧 token / 体系

卡片体系整体退场，删除：`--surface-bg`、`--surface-bg-strong`、`--surface-border`、`--shadow-soft`、`--grid-color`、大圆角 `--radius-m`（圆角改用局部小值 4–8px，按需内联）。

### 1.4 `src/styles/styles.css` 调整

- `body` 默认 `font-family: var(--font-serif)`、`line-height: 1.8`。
- `h1–h6` 改回 serif（现状误把标题设为 sans），`button/input/textarea` 保持 sans。
- 新增两个复用容器类：
  - `.shell` — `max-width: var(--shell-width); margin-inline: auto; padding-inline: var(--shell-pad);`
  - `.reading` — `max-width: var(--reading-width); margin-inline: auto;`
- 新增 `.hairline` 工具类 — `height: 1px; background: var(--hairline); border: 0;`。
- meta 文字工具类 `.meta` — `font-family: var(--font-sans); font-size: 13px; letter-spacing: 0.08em; color: var(--text-muted);`

### 1.5 字体加载

`SiteLayout.astro` 的 Google Fonts `<link>`：
- 现状只加载 `Inter`。新增 `Noto Serif SC`（weights 400/500/600）。
- 两个 family 合并到一个 `<link>`，`display=swap`，配合本地中文衬线 fallback 避免 FOIT。
- 保留 `preconnect` 到 `fonts.googleapis.com` / `fonts.gstatic.com`。

## 2. 全局组件

### 2.1 顶栏 `SiteHeader.astro`（重构）

对照设计稿 `组件/顶栏`（`zQaMS`）。

- **去背景**：删除 `backdrop-filter`、`surface-bg`、`shadow-soft`、`border`、`border-radius`。透明，直接坐在 `page-bg` 上。
- **结构**：`.shell` 容器，`display: flex; justify-content: space-between; align-items: center; padding-block: 28px;`（设计稿 `padding: [28, 80]`）。
  - 左：Logo `<a href="/">`「Ginlon」—— `font-serif`, 20px, 600, `text-strong`。**删除绿底白字圆形徽章 "G"** 和「写作档案」副标题。
  - 中/右：导航 `<ul>`（`gap: 32px`）+ `<ThemeToggleButton />`。
- **导航项**：`font-sans`, 14px, `text-muted`；hover/active 变 `accent`。**删除胶囊背景**（`border-radius: 999px` + `accent-soft` 背景），改为纯文字链接。
- **底部分隔**：栏底部一条 `.hairline`（`fill_container` 宽度，贯穿外壳）——新设计标志元素。
- **sticky**：保留 `position: sticky; top: 0;`，但背景透明（滚动时内容从下方透过，不发虚）。
- **移动端**：沿用现有折叠断点，去胶囊容器，导航横向滚动或换行。

### 2.2 页脚 `SiteFooter.astro`（重构）

对照设计稿 `组件/页脚`（`tOurA`）。

- 顶部一条 `.hairline`。
- `.shell` 容器，`display: flex; justify-content: space-between; align-items: center; padding-block: 32px;`（设计稿 `padding: [32, 80]`）。
  - 左：版权「© 2026 Ginlon」—— `.meta`（sans 13px, `text-muted`）。
  - 右：页脚链接（`gap: 24px`，GitHub / RSS 等）—— `.meta`，hover `text-strong`。
- **删除**任何卡片/边框/阴影。

### 2.3 布局 `SiteLayout.astro`

- `editorial-main` 的 `padding: 0.9rem 0 2.2rem` 改为 `padding: 0`——间距交由各页面/区段自己控制（匹配设计稿每段独立 `padding`）。
- `editorial-shell` / `editorial-body` 保留（仍提供 `page-bg` 底色和最小高度）。
- `skip-link` 保留。

### 2.4 主题切换 `ThemeToggleButton.astro`

保留功能（亮/暗切换 + 持久化），只微调样式：去掉胶囊背景，变成纯图标按钮。

## 3. 首页 `/`（`src/pages/index.astro`）

对照设计稿 `首页-浅色`（`UTW5X`）+ 移动端 `移动端-首页`（`JwRht`）。

### 3.1 整体结构

垂直流，区段间用 `.hairline` 分隔。每段是独立 `.shell` 容器，自带垂直内边距。

```
顶栏（全局）
─── hairline ───
Hero（padding-block: 80px）
─── hairline ───
精选写作（padding-block: 64px）
─── hairline ───
当前关注（padding-block: 64px）
─── hairline ───
页脚（全局）
```

### 3.2 Hero（去背景卡片）

对照 `Hero`（`JfJO5`，`padding: 80`, `gap: 32`, 头像 144×144）。

- **删除** `.home-hero` 的 border / border-radius / surface-bg-strong / shadow。
- 布局：`.shell` 内 `display: flex; gap: 32px; align-items: center;`（桌面横向）；移动端 `flex-direction: column; gap: 20px;`（设计稿 `JwRht` 的 `gap: 20`）。
- 头像：圆形，桌面 144px / 移动 72px（设计稿 `q0dRjL`）。**去掉 border 和 shadow**。保留 `<img src="...avatar_512.png">`。
- Hero 文字（垂直 `gap: 16px`，`flex: 1`）：
  - **Eyebrow**「关于我」—— `.meta` 风格但用 `accent` 色（sans 13px, 500, `letter-spacing: 1px`）。
  - **标题**「Ginlon」—— serif，桌面 `clamp(2.5rem, 1.5rem + 3vw, 3.5rem)`（~56px 上限），600，`letter-spacing: -0.02em`，`text-strong`。
  - **标语**—— serif 17px, `line-height: 1.8`, `text-muted`。保留现有两行标语内容。

### 3.3 精选写作（卡片 → 目录清单）

对照 `精选写作`（`PkYsQ`，`padding: [64, 80]`）。

- 区段头：「精选写作」（serif 24px, 600, `text-strong`）。**去掉 eyebrow 和 description**（设计稿首页只有纯标题）。
- 清单：每条 `<a>` 行，桌面 `display: grid; grid-template-columns: 120px 1fr; gap: 32px; padding-block: 28px;`：
  - 左列：日期—— `.meta`（sans 13px, `text-muted`）。
  - 右列：标题（serif, `text-strong`, hover `accent`）+ 摘要（serif, `text-muted`, 单行省略或两行）。
- 顶部一条 `.hairline`，每条之间一条 `.hairline`。
- **删除** `ArticleCard.astro` 的卡片样式（border/radius/shadow/surface-bg）。
- 移动端：日期在上、标题摘要在下，纵向堆叠（`gap: 8px`）。

### 3.4 当前关注（去卡片，纯文字列表）

对照 `当前关注`（`eqOqL`，`padding: [64, 80]`，列表 `gap: 28`）。

- 区段头：「当前关注」（serif 24px, 600）。
- 列表 `display: flex; flex-direction: column; gap: 28px;`，每项 = `<h3 serif text-strong>` + `<p serif text-muted>`。**纯文字无边框无卡片**。
- 保留现有三个关注主题内容（Harness Engineering / 写作流程系统化 / 长期主义执行力）。

### 3.5 移动端（对照 `JwRht`）

- `padding-inline: 24px`。
- Hero 头像 72px，纵向（`gap: 20`）。
- 区段垂直内边距 36px（设计稿 `JsXlA` / `P5i4zz` 的 `padding: [36, 24]`）。

### 3.6 数据层不变

`getBlogs('zh')` 取数、`featured` 过滤、SEO meta 全部保留，只改呈现。

## 4. 写作归档页 `/writing`（`src/pages/writing/index.astro`）

对照设计稿 `写作归档页-浅色`（`f9v28`）+ 移动端 `移动端-写作归档`（`UOUz7`）。结构变化最大的一页。

### 4.1 整体结构

```
顶栏
页头（padding: [72, 80, 40, 80]）
筛选工具栏（计数 + 标签下拉，padding: [0, 80, 28, 80]）
─── hairline 顶线 ───
归档列表（条目 + 分线，padding: [0, 80, 72, 80]）
页脚
```

### 4.2 页头（对照 `页头` `GKl7S`，`gap: 12`）

`.shell` 内垂直三行：
- **Eyebrow**「写作归档」—— `.meta` + `accent`（sans 13px, 500, `letter-spacing: 1px`）。
- **标题**「全部文章」—— serif 36px, 600, `text-strong`。
- **描述**「按时间倒序归档的全部文章，可按标签过滤。」—— serif 16px, `line-height: 1.8`, `text-muted`。

### 4.3 筛选工具栏（对照 `筛选工具栏` `mGkvG`，`space_between`）

`.shell` 内 `display: flex; justify-content: space-between; align-items: center;`：
- 左：**计数**「共 N 篇文章」—— `.meta`（sans 13px, `text-muted`）。
- 右：**标签下拉**（宽 216px，桌面）。

### 4.4 标签下拉（重构 `ArticleList.vue` 内的筛选器）

对照 `组件/下拉列表`（`HB2oi`）——设计稿里唯一带 shadow 的元素。

**现状澄清**：写作页的标签筛选和文章清单**都在 `ArticleList.vue` 这一个 Vue 组件里**（桌面端 sticky 侧栏 + 窄屏折叠按钮）。不存在单独的 `TagFilterBar.astro`。本次重构**就地改造 `ArticleList.vue`**，不新建组件。

- **触发器**（替换现有 `.tag-toggle` / 桌面侧栏）：`surface` 底 + `hairline` 1px 边 + `border-radius: 6px`，`padding: 10px 14px`，内部「左侧当前标签 + 右侧 chevron-down 图标（lucide）」，`space_between`。桌面宽 216px、移动端整宽。
- **弹层**（替换现有 `.tag-filter-bar`）：`surface` 底 + `hairline` 边 + `border-radius: 10px` + **阴影** `0 8px 24px rgba(26,31,28,0.12)`（设计稿唯一 shadow）。选项 `padding: 9px 12px`，选中项 `accent-soft` 底。点击外部关闭。
- **保留 `ArticleList.vue` 的全部数据逻辑**：`currentTag` ref、`uniqueTags`/`filteredArticles` computed、`handleTagClick` 的 `history.pushState` URL 同步、`handlePopState` 前进后退、`updateDescription`。这些是 commit `508d130`/`1238164` 已验证的逻辑，只改 UI 呈现。
- **来源徽章**：保留 `article.source === 'column'` 的专栏徽章逻辑，样式改为极简 sans 12px（见 4.5）。

### 4.5 归档列表（对照 `归档列表` `HA8cP`）

每条 `<a>`（`padding: [28, 0]`, `gap: 32`），桌面三列：

```
日期(sans 13px muted, 120px) | 标题(serif 强)+摘要(serif muted) | 标签(sans 12px) + 来源徽章(sans 12px)
                              ↑ 1fr
─── hairline 分线 ───
```

- 顶部一条 `.hairline`（顶线），每条之间一条 `.hairline`（分线），共 N+1 条。
- **标签**：sans 12px，多个标签用 `·` 分隔。
- **来源徽章**：保留现有「专栏文章混排 + 来源徽章」功能（commits `6629cdc`、`a2a34e4`），用极简 sans 12px 标记（专栏来源用 `accent`，博客来源不显示或 `text-muted`），不破坏清单节奏。

### 4.6 移动端（对照 `UOUz7`）

- 页头 `padding: [36, 24, 20, 24]`，Eyebrow sans 12px、标题 serif 30px、计数 sans 12px。
- 工具栏 `padding: [0, 24, 24, 24]`，下拉触发器 `fill_container` 整宽。
- 条目纵向堆叠（`padding: [20, 0]`, `gap: 8`）：日期 → 标题 → 摘要 → 标签。

## 5. 文章详情页 `/blogs/[slug]`（`src/pages/blogs/[slug].astro`）

对照设计稿 `文章详情页-浅色`（`xV2hU`）+ 移动端 `移动端-文章详情`（`ibe65`）+ `移动端-文章详情-目录抽屉`（`WvwJq`）。双栏布局，最复杂。

### 5.1 整体结构

```
顶栏
文章 Hero（padding: [72, 160, 48, 160]，居中窄区）
─── hairline Hero 分隔线 ───
双栏布局（正文 680 + TOC 140，居中，padding: [56, 0, 72, 0]）
─── hairline 翻页分隔线 ───
翻页（上一篇 / 下一篇，padding: [40, 160]）
页脚
```

### 5.2 文章 Hero（对照 `文章Hero` `tui6N`，`gap: 20`）

居中窄区（左右 160 内边距，在 1000px 外壳里阅读宽 ~680px）。垂直四行：
- **Eyebrow**—— category 映射（如「工程 · 长读」），`.meta` + `accent`（sans 13px, 500, `letter-spacing: 1px`）。
- **标题**—— serif 42px, 600, `line-height: 1.3`, `text-strong`。
- **摘要**—— serif 18px, `line-height: 1.8`, `text-muted`。
- **元信息**—— horizontal `gap: 20px`：日期 · 阅读时长 · 标签（全 `.meta` sans 13px, `text-muted`，`·` 分隔）。

删除现有 `.article-hero` 卡片化样式，改纯文字 + 超大留白。

### 5.3 Hero 分隔线

一条 `.hairline`（`fill_container`），分隔 Hero 和正文。

### 5.4 双栏布局（对照 `双栏布局` `fHp2d`，`justify-content: center`）

CSS Grid：`grid-template-columns: 680px 140px; gap: 26px; justify-content: center; padding-block: 56px 72px;`（680 + 26 + 140 = 846，匹配设计稿 TOC 的 `x: 846`）。

- **正文列**（`EBlPC`，宽 680px，垂直 `gap: 24`）：Markdown 渲染区，应用 `.reading` + prose 样式。
- **目录侧栏**（`OkXMk`，宽 140px）：`position: sticky; top: <顶栏高 + 间距>; align-self: start;`。

### 5.5 目录侧栏（对照 `目录侧栏`，桌面 sticky）

- 区标题「目录」—— `.meta`（sans, `text-muted`）。
- 各级标题项（H2/H3 缩进）—— sans 13px，当前可见项 `accent` 高亮 + 左侧发丝线指示。
- **复用** `ArticleTocRail.astro` 的 IntersectionObserver 滚动监听逻辑，只改样式匹配新设计。

### 5.6 正文排版（prose 覆盖）

Tailwind typography 插件继续负责 Markdown 排版，覆盖样式匹配新 token：
- 正文 serif 17px、`line-height: 1.8`。
- 标题 serif、`text-strong`。
- 链接 `accent`、下划线 + `text-underline-offset`。
- 代码块/引用块：`surface` 底 + `hairline` 左边线（引用块对照移动端 `引用` 节点用 `accent` 3px 左边线）。**去阴影**。
- Mermaid / KaTeX 渲染不受影响（继承新字体/颜色变量）。

### 5.7 翻页（对照 `翻页` `AqEAi`，`space_between`, `gap: 24`, `padding: [40, 160]`）

上方一条 `.hairline`。下方两列：
- **上一篇**（左，垂直 `gap: 6`）：小标「上一篇」（`.meta` sans 12px）+ 标题（serif, `text-strong`, hover `accent`）。
- **下一篇**（右，同结构，文字右对齐）。

### 5.8 移动端（对照 `ibe65` + `WvwJq`）

- Hero `padding: [36, 24, 28, 24]`，`gap: 16`。标题 serif 28px（`line-height: 1.35`），摘要 serif 15px。
- 元信息 `gap: 16`。
- 双栏 → 单栏，正文 `padding: [28, 24, 36, 24]`，`gap: 20`，正文 serif 16px `line-height: 1.9`。
- 翻页纵向堆叠（`gap: 20`, `padding: 24`），每项 `gap: 5`。
- **TOC 侧栏 → 底部抽屉**：桌面 sticky 隐藏。右下角浮动按钮「目录」（圆形 56px，`accent` 底，白色 `list` 图标 lucide，带阴影 `0 6px 18px rgba(26,31,28,0.25)`——对照 `OCaKW`）。点击从底部滑入抽屉（复用 `ArticleTocDrawer.astro`），抽屉样式 = `surface` 底 + 顶部圆角 + 阴影。

### 5.9 数据层不变

`getBlogs`、`[slug]` 路由、MDX 渲染、`remark-modified-time`、SEO meta 全部保留。

## 6. 组件清单（新增 / 修改 / 删除）

| 组件 | 操作 | 说明 |
|---|---|---|
| `src/styles/theme.css` | 重写 | 1:1 映射 Pencil variables（第 1 节） |
| `src/styles/styles.css` | 修改 | 字体默认 serif + `.shell`/`.reading`/`.hairline`/`.meta` 工具类 |
| `src/layouts/SiteLayout.astro` | 修改 | 去 main padding + 加载 Noto Serif SC |
| `src/components/site/SiteHeader.astro` | 重构 | 去背景、serif Logo、发丝线分隔（第 2.1） |
| `src/components/site/SiteFooter.astro` | 重构 | 发丝线 + 极简栏（第 2.2） |
| `src/components/site/ThemeToggleButton.astro` | 修改 | 去胶囊背景，纯图标 |
| `src/components/site/ArticleList.vue` | 重构 | 桌面侧栏 → 标签下拉；卡片清单 → 目录清单行；保留全部数据/URL 逻辑（第 4.4、4.5） |
| `src/components/site/ArticleCard.astro` | **删除** | 仅 `index.astro` 引用（`columns/index.astro` 用的是 `ColumnCard`），首页改清单后无引用，可删 |
| `src/components/site/ArticleHero.astro` | 重构 | 去卡片，纯文字 Hero（第 5.2） |
| `src/components/site/ArticleTocRail.astro` | 修改样式 | sticky 侧栏匹配新设计（第 5.5） |
| `src/components/site/ArticleTocDrawer.astro` | 修改样式 | 移动抽屉 + 浮动按钮（第 5.8） |
| `src/components/site/ArticlePager.astro` | 重构 | 翻页两列（第 5.7） |
| `src/components/site/PageSection.astro` | 简化 | 去卡片，只留 `.shell` + 内边距 |
| `src/components/site/SectionHeading.astro` | 简化 | 去 eyebrow/description 选项（首页用纯标题） |
| `src/pages/index.astro` | 重构 | 第 3 节 |
| `src/pages/writing/index.astro` | 重构 | 第 4 节 |
| `src/pages/blogs/[slug].astro` | 重构 | 第 5 节 |

## 7. 验证约定

遵循 `AGENTS.md` 的构建验证约定。每步改完：

1. `pnpm build`（`astro check` 类型检查 + frontmatter schema + 完整静态构建）必须通过。
2. `pnpm dev` 浏览器对照 `designs/design.pen` 对应画板，核对：
   - 配色（暖白 `#FAF8F3`、绿 `#2E8B5E`、发丝线）。
   - 字体（serif 统一、meta 用 sans）。
   - 留白节奏（区段间发丝线分隔、超大留白）。
   - 无卡片/无大圆角/无阴影（除标签下拉弹层和移动抽屉）。
3. 深色模式切换正常（`#131714` 底、`#7FD0A6` 强调、发丝线深色版）。
4. 移动端响应式（390px 宽对照移动端画板）。
5. 文章详情页 TOC sticky + 滚动高亮正常；移动端抽屉开关正常。
6. 写作页标签下拉展开/选中/URL 同步正常；专栏文章来源徽章正常。

**回归检查**（全局顶/底栏替换的影响）：
- 访问专栏（`/columns`）、关于（`/about`）、技术栈（`/techStack`）、标签（`/tags`）、英文镜像（`/en/*`）页面，确认顶/底栏不破坏布局、功能正常（内容区允许过渡期混搭）。

## 8. 风险与权衡

- **全局顶/底栏替换的过渡态**：其他页面会出现「新顶栏 + 旧卡片」混搭。已确认为可接受，后续迭代。
- **Noto Serif SC 加载体积**：中文字体较大，靠 `display=swap` + 本地衬线 fallback 缓解。如加载慢，后续可考虑子集化（本次不做）。
- **容器宽度收窄**（1312px → 1000px）：其他页面内容区会变窄。已确认全局替换，过渡期可接受。
- **`ArticleList.vue` 重构风险**：该组件同时承担标签筛选 + 文章清单 + URL 同步（commit `508d130`/`1238164` 已验证）。重构时必须**保留全部 `<script setup>` 数据逻辑**（`currentTag`/`uniqueTags`/`filteredArticles`/`handleTagClick`/`handlePopState`），只改 `<template>` 和 `<style scoped>`。`client:only="vue"` island 模式不变。
- **`ArticleCard` 删除前确认**：全局搜索确认仅 `index.astro` 引用（`columns/index.astro` 用独立的 `ColumnCard`，不受影响）。首页改清单后删除。
