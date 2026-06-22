# 设计稿迭代 v2 实现设计（极简静默重构）

- 日期：2026-06-22
- 分支：feat/quiet-minimal-refactor
- 设计稿：designs/design.pen
- 关联前序 spec：docs/superpowers/specs/2026-06-22-quiet-minimal-frontend-refactor-design.md

## 背景与目标

设计稿迭代，按接近 HTML 文档流的方式组织页面：`Page → Header → Main → Content → Section/Article/Nav → Footer`。
主要用父容器布局、padding、gap、max-width、width:100% 控制尺寸；非必要不使用绝对定位与硬编码宽高。
绝对定位只用于脱离文档流的 UI：回到顶部按钮、桌面文章右侧悬浮导航、弹层。

本次范围（已与用户确认）：

- **彻底清理** theme.css 的过渡期兼容垫片 token，引入设计稿全套新 token。
- **严格按建议抽象**容器与文章组件：Content / ArticleHeader / ArticleAside / BackToTop（PageShell 复用现有 SiteLayout 壳，不新增嵌套层）。
- **ColumnCard 完全按设计稿轻量化**，桌面与移动端复用同一信息结构。
- **无设计稿的旧页面**（关于/技术栈/标签/简历）只迁移 token 保证不崩，不重做布局。
- **完整适配深色模式**：所有新增 token 提供 light/dark 两套值。

设计稿覆盖画板：首页 `UTW5X`、写作归档 `f9v28`、文章详情 `xV2hU`、无专栏文章 `oVGUc`、专栏页 `A21GI`、移动端专栏页 `a2E0au`、移动端首页 `JwRht`、移动端文章 `ibe65/WvwJq`、移动端写作归档 `UOUz7`。

## 1. 设计 Token 体系（src/styles/theme.css）

用设计稿 variables 全量替换垫片。最终 `:root`（light）与 `:root[data-theme='dark'], .dark`（dark）两套：

| Token | Light | Dark | 用途 |
|---|---|---|---|
| `--accent` | `#2E8B5E` | `#7FD0A6` | 链接、当前导航、主按钮 |
| `--accent-hover` | `#24744E` | `#96DDB8` | 主按钮 hover、导航图标 |
| `--accent-deep` | `#1E3322` | `#D9F2DD` | 深强调（备用） |
| `--accent-soft` | `#2E8B5E1F` | `#7FD0A626` | 浅强调底色 |
| `--accent-warm` | `#A45E3B` | `#E3A17F` | 暖色点缀（备用） |
| `--page-bg` | `#FAF8F3` | `#131714` | 页面大面积底色 |
| `--surface` | `#FFFFFF` | `#1A201C` | 正文块、表格 |
| `--surface-tint` | `#F1F4EC` | `#1E2720` | 浅底模块、悬浮栏、表头 |
| `--surface-hover` | `#F1F4EC` | `#202A23` | 卡片/导航 hover 背景 |
| `--surface-pressed` | `#E7EDE3` | `#263329` | 按下态 |
| `--surface-ink` | `#1E3322` | `#E8EDE9` | 浅底上的强调文字 |
| `--tag-bg` | `#2E8B5E1F` | `#7FD0A626` | 标签/专栏标识底色 |
| `--text-strong` | `#1A1F1C` | `#E8EDE9` | 主文字 |
| `--text-muted` | `#6B756F` | `#9CA8A1` | 次要文字 |
| `--hairline` | `#1A1F1C14` | `#E8EDE91A` | 分割线、表格边框 |

字体 token（`--font-serif` / `--font-sans`）与宽度/间距刻度（`--shell-width: 1000px` / `--reading-width: 680px` / `--shell-pad` / `--sp-*`）保留不变。

### 垫片处理

- **移除**：`--surface-bg`、`--surface-bg-strong`、`--surface-border`、`--radius-m`。
- `--shadow-soft` **提升为正式 token**（给 light/dark 两套值，例如 light `0 8px 24px rgba(26,31,28,0.08)`、dark 调暗），旧页面继续用。
- 旧页面引用统一改写：`--surface-bg → --surface`、`--surface-bg-strong → --surface`、`--surface-border → --hairline`、`--radius-m → 8px`（字面值）、`calc(var(--radius-m)*0.5) → 4px`。

涉及旧引用文件（grep 已确认）：`src/pages/about.astro`、`src/pages/resume.astro`、`src/components/site/TagFilterBar.astro`、`src/components/site/ColumnSidebar.astro`，以及待重构的 columns 系列页面（会在本次一并替换）。

## 2. 容器组件抽象

### PageShell（复用 SiteLayout，不新建）

`SiteLayout.astro` 已承担页面骨架（editorial-shell + SiteHeader + main + SiteFooter）。本次不新增 PageShell 组件层，仅在 SiteLayout 内挂载全局 `BackToTop`。

### Content.astro（新建）

- 职责：`max-width` + 居中 + 响应式 `padding-inline`，对应设计稿各画板 `Content` 节点（width:1000）。
- Props：
  - `as`：渲染标签，默认 `div`，可传 `section` / `header` / `main`。
  - `width`：`'default'`（1000px，= `--shell-width`）| `'reading'`（680px，= `--reading-width`），默认 `default`。
- 实现用 `--shell-pad` 做左右内边距，与现有 `.shell` 视觉一致。
- 关键约束：分割线、列表、页头、翻页都放进 Content，跟随内容宽度，不贯穿全屏。

### 迁移策略

- 现有 `.shell` / `.reading` 工具类保留（旧页面在用）。
- 新重构页面（首页/写作归档/文章详情/专栏页）改用 `<Content>`。

## 3. 文章详情页 + ArticleHeader + ArticleAside

对照 `xV2hU`（有专栏）/ `oVGUc`（无专栏）。核心变化：正文始终居中，右侧快捷栏改为悬浮层、不参与正文排版计算。当前 `grid-template-columns: 680px 140px` 把 TOC 当第二列导致正文偏左，需移除。

### ArticleHeader.astro（替代/增强 ArticleHero）

- 条件渲染 `column` / `tags` / `meta`：
  - 有专栏：eyebrow 行显示 `专栏 · {专栏名}   #标签1  #标签2`（设计稿 `t1LxJO`），accent 色。
  - 无专栏：只显示 `#标签`。
  - 顶部分类 eyebrow（如「工程 · 长读」）保留。
- meta 行用 lucide 图标：`calendar` + 发布日期、`refresh-cw` + 更新日期（设计稿 `HlfIQ`）。
- 压缩标题块与正文间距：去掉当前 `padding-block: 72px 48px` 的过大留白，正文紧接 Hero 分隔线（设计稿 Hero `padding: 48 * 32 *`）。
- 标题/摘要约束在阅读宽度内，水平居中于 Content。
- Props 设计：`title`、`summary`、`publishedLabel/Iso`、`lastModifiedLabel/Iso`、`tags`、`categoryLabel`、`column?: { title, slug }`、`poster?`。

### ArticleAside.astro（新建，替代 ColumnSidebar + 右侧 TocRail 组合）

- 桌面端 `position: fixed` 悬浮层（设计稿 `J1zeB`）：`width: 220`、`surface-tint` 底、`accent-soft` 描边、圆角 8、阴影；定位在 1000px Content 右外侧。**不参与正文 grid**。
- 两模块：
  1. **所属专栏**：模块标题「所属专栏」+ 专栏名 + 专栏文章列表（当前篇 accent 高亮）。
  2. **文章导航**：本文 TOC（复用现有 TOC 高亮逻辑 `data-toc-link` / `is-active`）。
  - 模块间用 `accent-soft` 分隔线。
- 无专栏（`oVGUc`）：只渲染「文章导航」模块（设计稿 `J2wrp`）。
- `< 1024px` 隐藏；移动端继续用现有 `ArticleTocDrawer`（抽屉 + 浮动按钮）。
- Props：`headings`、`column?: { title, slug, articles, currentSlug }`。

### 正文布局

- `.article-body` 直接 `max-width: 680px; margin: 0 auto` 居中，移除第二列 grid。
- aside 作为 fixed 浮层叠加，正文不为其留位。

### Markdown 表格样式（全局共享）

- 提取到全局样式（作用于 `.article-body` / `.article-content` 正文容器），blogs 与 columns 两个文章页共用同一套，消除当前两页表格样式不一致。
- 样式对照设计稿 `ebsuK`：表格外框 `hairline` + 圆角 8、表头 `surface-tint` 底、单元格 `hairline` 下边框、内边距适中、`text-strong`/`text-muted` 文字。

## 4. 专栏索引页 + ColumnCard 轻量化

对照 `A21GI`（桌面）/ `a2E0au`（移动）。专栏页为轻量索引页：只显示页面标题、简介、专栏卡片。

### 专栏索引页（src/pages/columns/index.astro 重写）

- 结构 `Header / Content / Footer`，移除 PageSection / SectionHeading 依赖。
- Content 内：专栏页头（eyebrow `COLUMNS` + 标题「专栏」+ 简介）→ 页头分隔线 → 专栏卡片列表（纵向堆叠，非网格）。
- 桌面页头 `padding: 72 0 44`，分隔线跟随 Content 宽度。

### ColumnCard.astro（重写）

- **移除**：封面图、`X 篇文章` 计数、`compact` prop（grep 确认无外部消费者）。
- **保留/新增**（设计稿 `qcI94`）：
  - 状态标签：圆点（accent）+ 文字「持续更新 / 已完结」，`tag-bg` 底、圆角 999、accent 文字 —— 替换当前硬编码 `#fef3c7/#92400e`、`#d1fae5/#065f46`。
  - 专栏标题（serif 24/600）。
  - 专栏简介（text-muted，最多 2 行）。
  - 「进入专栏」按钮：accent 实底 + 白字 + lucide `arrow-right`，圆角 6。
- 卡片本体：`surface` 底、`hairline` 描边、圆角 8、padding 24（移动端压缩至 ~20）。
- 交互：整卡可点击（外层 `<a>`），按钮为视觉强调，**不嵌套 `<a>`**（避免 a 套 a），按钮渲染为卡内的视觉元素。
- status → label/class 映射：`ongoing → 持续更新`、其他 → `已完结`。

## 5. 移动端 + 交互状态 + BackToTop + 旧页面迁移

### 移动端专栏页（a2E0au，390px）

- 结构 `Mobile Header / Content / ColumnCard / Footer`，由 `columns/index.astro` 响应式承载（同一页面，断点切换）。
- Content `padding: 36 24 44`、`gap: 32`；页头标题 30px。
- 卡片复用同一 `ColumnCard`，响应式压缩 padding。
- 不用悬浮右侧导航；移动端文章页继续用 `ArticleTocDrawer`。

### 交互状态（全局对齐设计稿）

- 导航 hover：文字 `accent`（现状保留）。
- 文章卡片 hover：`surface-hover` 背景 + 标题 `accent` + 箭头出现/移动。落到写作列表行、专栏卡片。
- 按钮 hover：主按钮 `accent-hover`，浅色按钮 `surface-hover`。落到「进入专栏」按钮、回到顶部按钮。

### BackToTop.astro（新建）

- 圆形浮动按钮：44px、`accent` 底、lucide `arrow-up`、右下角 `position: fixed`、阴影、圆角 22（设计稿 `nfGaJ`）。
- hover：`accent-hover`。
- 滚动超过一屏淡入；点击平滑滚顶（`scrollTo({ top:0, behavior:'smooth' })`）。
- 挂在 SiteLayout 全局。
- 与移动端 TOC 抽屉浮钮位置避让：文章页移动端 BackToTop 堆叠在 TOC 浮钮上方（bottom 错开）。

### 断点约定

- 统一用项目既有断点：移动端 `max-width: 720px`，桌面悬浮/双栏相关 `min-width: 1024px`。设计稿 390 画板对应 720px 以内移动样式。

### 旧页面 token 迁移（只迁不重做）

- 替换 about / resume / techStack / tags / TagFilterBar / ColumnSidebar 中的垫片引用为新 token 或字面值（见第 1 节映射）。
- 验证视觉不崩。

## 验证

- `pnpm build`（含类型检查）通过。
- 新增页面/路由后运行 `pnpm i18n:sync`（如涉及）。
- 逐页对照设计稿核对：首页、写作归档、文章详情（有/无专栏）、专栏索引、移动端各画板。
- 深色模式逐页检查。

## 组件清单（落点汇总）

| 文件 | 动作 |
|---|---|
| `src/styles/theme.css` | 重写 token（含 dark），移除垫片 |
| `src/components/site/Content.astro` | 新建容器组件 |
| `src/components/site/ArticleHeader.astro` | 新建（替代/增强 ArticleHero） |
| `src/components/site/ArticleAside.astro` | 新建（替代 ColumnSidebar + 右侧 TocRail 组合） |
| `src/components/site/BackToTop.astro` | 新建 |
| `src/components/site/ColumnCard.astro` | 重写轻量化 |
| `src/layouts/SiteLayout.astro` | 挂载 BackToTop |
| `src/pages/index.astro` | 改用 Content，hr 跟随内容宽度 |
| `src/pages/writing/index.astro` | 改用 Content（Header/Content/Footer） |
| `src/pages/blogs/[slug].astro` | 用 ArticleHeader + ArticleAside，正文居中，共享表格样式 |
| `src/pages/columns/[slug]/[article].astro` | 同上（有专栏分支） |
| `src/pages/columns/index.astro` | 重写为轻量索引页 |
| `src/pages/about.astro` / `resume.astro` / `techStack.astro` / `tags/*` | 仅迁 token |
| `src/components/site/TagFilterBar.astro` / `ColumnSidebar.astro` | 仅迁 token（ColumnSidebar 若被 ArticleAside 取代则评估移除） |

## 未决/风险

- ColumnSidebar 被 ArticleAside 取代后是否删除：实现时确认无其他引用再删，否则只迁 token 保留。
- en/ 英文页面镜像：本次以 zh 主站为准，en 页面如共享组件自动受益；如需同步调整在实现阶段评估。
