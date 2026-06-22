# 设计稿迭代 v2 极简静默重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按设计稿迭代将站点重构为极简静默布局——统一 token、抽象容器/文章/卡片组件、正文居中 + 右侧悬浮栏、轻量专栏页、移动端专栏页、回到顶部按钮。

**Architecture:** Astro 5 静态站点。用全局 CSS 自定义属性（token）驱动主题，Astro 组件做布局抽象，岛屿化交互（BackToTop、TOC 高亮）。本次为纯前端样式/结构重构，无后端无数据变更。

**Tech Stack:** Astro 5、TailwindCSS 4（仅 @import，样式以原生 CSS + scoped style 为主）、lucide-astro（图标）、TypeScript。

> **验证方式说明：** 本计划为前端重构，不采用单元测试 TDD。每个任务的验证 = `pnpm build`（含 `astro check` 类型检查）通过 + 指定的视觉/结构核对点。每个任务结束即提交。

## Global Constraints

- 包管理器一律用 `pnpm`（版本 10.20.0），不用 npm。
- 主语言中文（`zh`），英文（`en`）为次。本次以 zh 主站为准。
- 布局优先用父容器 `padding`/`gap`/`max-width`/`width:100%`；绝对定位仅用于：回到顶部按钮、桌面文章右侧悬浮栏、弹层。
- 内容宽度容器 `--shell-width: 1000px`，阅读宽度 `--reading-width: 680px`。分割线/列表/页头/翻页跟随内容宽度，不贯穿全屏。
- 所有新增 token 必须有 light 与 dark 两套值。
- 移动端断点 `max-width: 720px`；桌面悬浮/双栏断点 `min-width: 1024px`。
- lucide 图标用法：`import { IconName } from 'lucide-astro'`，PascalCase 命名（如 `ArrowRight`、`ArrowUp`、`Calendar`、`RefreshCw`）。
- 字体：正文衬线 `var(--font-serif)`，元信息/按钮/控件无衬线 `var(--font-sans)`。

---

## 文件结构

| 文件 | 责任 |
|---|---|
| `src/styles/theme.css` | 设计 token（light/dark）单一来源 |
| `src/components/site/Content.astro` | 内容宽度约束容器 |
| `src/components/site/BackToTop.astro` | 回到顶部浮动按钮 |
| `src/components/site/ColumnCard.astro` | 轻量专栏卡片（桌面+移动复用） |
| `src/components/site/ArticleHeader.astro` | 文章头部（column/tags/meta 条件渲染） |
| `src/components/site/ArticleAside.astro` | 桌面右侧悬浮栏（专栏模块+文章导航） |
| `src/layouts/SiteLayout.astro` | 挂载 BackToTop |
| `src/pages/index.astro` | 首页，改用 Content |
| `src/pages/writing/index.astro` | 写作归档，改用 Content |
| `src/pages/columns/index.astro` | 轻量专栏索引页（含移动端响应式） |
| `src/pages/blogs/[slug].astro` | 文章详情（无专栏），用新组件 |
| `src/pages/columns/[slug]/[article].astro` | 专栏文章详情，用新组件 |
| `src/pages/about.astro`、`resume.astro`、`techStack.astro`、`tags/[tag].astro`、`tags/index.astro` | 仅迁 token |
| `src/components/site/TagFilterBar.astro`、`ColumnSidebar.astro` | 仅迁 token / 评估移除 |

---

## Task 1: 重写设计 Token（theme.css）

**Files:**
- Modify: `src/styles/theme.css`（整文件替换 `:root` 与 dark 块）

**Interfaces:**
- Consumes: 无
- Produces: 全局 CSS 变量 —— `--accent`、`--accent-hover`、`--accent-deep`、`--accent-soft`、`--accent-warm`、`--page-bg`、`--surface`、`--surface-tint`、`--surface-hover`、`--surface-pressed`、`--surface-ink`、`--tag-bg`、`--text-strong`、`--text-muted`、`--hairline`、`--shadow-soft`，以及保留的 `--font-serif`/`--font-sans`/`--shell-width`/`--reading-width`/`--shell-pad`/`--sp-*`。移除 `--surface-bg`/`--surface-bg-strong`/`--surface-border`/`--radius-m`。

- [ ] **Step 1: 替换 theme.css 全文**

```css
@layer base {
  :root {
    /* 色彩 token —— 1:1 映射 designs/design.pen variables */
    --accent: #2e8b5e;
    --accent-hover: #24744e;
    --accent-deep: #1e3322;
    --accent-soft: #2e8b5e1f;
    --accent-warm: #a45e3b;

    --page-bg: #faf8f3;
    --surface: #ffffff;
    --surface-tint: #f1f4ec;
    --surface-hover: #f1f4ec;
    --surface-pressed: #e7ede3;
    --surface-ink: #1e3322;
    --tag-bg: #2e8b5e1f;

    --text-strong: #1a1f1c;
    --text-muted: #6b756f;
    --hairline: #1a1f1c14;

    /* 阴影（正式 token，非垫片） */
    --shadow-soft: 0 8px 24px rgba(26, 31, 28, 0.08);

    /* 字体 token */
    --font-serif:
      "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
    --font-sans:
      "Inter", system-ui, -apple-system, "PingFang SC", "Microsoft YaHei",
      sans-serif;

    /* 容器宽度 */
    --shell-width: 1000px;
    --reading-width: 680px;
    --shell-pad: clamp(1.5rem, 5vw, 5rem);

    /* 间距刻度（8px 基准） */
    --sp-1: 4px;
    --sp-2: 8px;
    --sp-3: 16px;
    --sp-4: 24px;
    --sp-5: 40px;
    --sp-6: 64px;
    --sp-7: 96px;
    --sp-8: 128px;
  }

  :root[data-theme='dark'],
  .dark {
    --accent: #7fd0a6;
    --accent-hover: #96ddb8;
    --accent-deep: #d9f2dd;
    --accent-soft: #7fd0a626;
    --accent-warm: #e3a17f;

    --page-bg: #131714;
    --surface: #1a201c;
    --surface-tint: #1e2720;
    --surface-hover: #202a23;
    --surface-pressed: #263329;
    --surface-ink: #e8ede9;
    --tag-bg: #7fd0a626;

    --text-strong: #e8ede9;
    --text-muted: #9ca8a1;
    --hairline: #e8ede91a;

    --shadow-soft: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
}
```

- [ ] **Step 2: 迁移旧页面 token 引用**

依次在以下文件中替换（用 Edit 工具，逐处）：
- `--surface-bg` → `--surface`
- `--surface-bg-strong` → `--surface`
- `--surface-border` → `--hairline`
- `var(--radius-m)` → `8px`
- `calc(var(--radius-m) * 0.5)` → `4px`

涉及文件（grep 已确认引用）：
- `src/pages/about.astro`（`--surface-border`、`--surface-bg`）
- `src/pages/resume.astro`（`--surface-bg-strong`、`--surface-border` ×2、`--radius-m`、`--shadow-soft` 保留不动）
- `src/components/site/TagFilterBar.astro`（`--surface-border`）
- `src/components/site/ColumnSidebar.astro`（`--surface-border` ×2、`--surface-bg`、`--radius-m`、`calc(--radius-m*0.5)`）

注：columns 系列页面（`columns/index.astro`、`columns/[slug].astro`、`columns/[slug]/[article].astro`、`ColumnCard.astro`）将在后续任务整体重写，本步不处理它们；但 `columns/[slug].astro`（专栏详情页，本次不重写）需在此一并迁移其 `--surface-border`/`--surface-bg`/`--surface-bg-strong`/`--radius-m` 引用，避免构建后视觉错乱。

- [ ] **Step 3: 验证构建**

Run: `pnpm build`
Expected: 构建成功，无 `astro check` 类型错误。CSS 中不再有对已移除 token 的引用（除将被重写的 columns 系列与 ColumnCard 外，它们在后续任务处理）。

- [ ] **Step 4: 提交**

```bash
git add src/styles/theme.css src/pages/about.astro src/pages/resume.astro src/components/site/TagFilterBar.astro src/components/site/ColumnSidebar.astro src/pages/columns/[slug].astro
git commit -m "refactor(theme): 引入设计稿全套 token，迁移旧页面引用"
```

---

## Task 2: Content 容器组件

**Files:**
- Create: `src/components/site/Content.astro`

**Interfaces:**
- Consumes: token `--shell-width`、`--reading-width`、`--shell-pad`
- Produces: `Content` 组件，Props：`as?: 'div' | 'section' | 'header' | 'main' | 'article'`（默认 `div`）、`width?: 'default' | 'reading'`（默认 `default`）、`class?: string`。渲染一个居中、带响应式左右内边距、max-width 受控的容器，slot 透传内容。

- [ ] **Step 1: 创建 Content.astro**

```astro
---
interface Props {
  as?: 'div' | 'section' | 'header' | 'main' | 'article';
  width?: 'default' | 'reading';
  class?: string;
}

const { as = 'div', width = 'default', class: className } = Astro.props;
const Tag = as;
---

<Tag class:list={['content', `content-${width}`, className]}>
  <slot />
</Tag>

<style>
  .content {
    width: 100%;
    margin-inline: auto;
    padding-inline: var(--shell-pad);
  }

  .content-default {
    max-width: var(--shell-width);
  }

  .content-reading {
    max-width: calc(var(--reading-width) + var(--shell-pad) * 2);
  }
</style>
```

- [ ] **Step 2: 验证构建**

Run: `pnpm build`
Expected: 构建成功（组件尚无消费者，仅验证语法/类型）。

- [ ] **Step 3: 提交**

```bash
git add src/components/site/Content.astro
git commit -m "feat(layout): 新增 Content 内容宽度约束容器"
```

---

## Task 3: BackToTop 回到顶部按钮

**Files:**
- Create: `src/components/site/BackToTop.astro`
- Modify: `src/layouts/SiteLayout.astro`（import 并在 shell 内挂载）

**Interfaces:**
- Consumes: token `--accent`、`--accent-hover`、`--shadow-soft`；lucide `ArrowUp`
- Produces: 全局固定定位的圆形按钮，滚动超过一屏淡入，点击平滑滚顶。无 Props。

- [ ] **Step 1: 创建 BackToTop.astro**

```astro
---
import { ArrowUp } from 'lucide-astro';
---

<button type="button" class="back-to-top" aria-label="回到顶部" data-back-to-top hidden>
  <ArrowUp size={20} />
</button>

<script>
  function installBackToTop() {
    const btn = document.querySelector('[data-back-to-top]');
    if (!(btn instanceof HTMLButtonElement)) return;
    if (btn.getAttribute('data-bound') === 'true') return;
    btn.setAttribute('data-bound', 'true');

    const onScroll = () => {
      const show = window.scrollY > window.innerHeight;
      btn.hidden = !show;
    };

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  document.addEventListener('astro:page-load', installBackToTop);
  document.addEventListener('astro:after-swap', installBackToTop);
  installBackToTop();
</script>

<style>
  .back-to-top {
    position: fixed;
    right: 24px;
    bottom: 24px;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 22px;
    background: var(--accent);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-soft);
    z-index: 30;
    transition: background-color 150ms ease, opacity 150ms ease;
  }

  .back-to-top[hidden] {
    display: none;
  }

  .back-to-top:hover {
    background: var(--accent-hover);
  }

  /* 移动端：与 TOC 抽屉浮钮（right:20 bottom:20，56px）错开，堆叠在其上方 */
  @media (max-width: 720px) {
    .back-to-top {
      right: 22px;
      bottom: 88px;
    }
  }
</style>
```

- [ ] **Step 2: 在 SiteLayout 挂载**

在 `src/layouts/SiteLayout.astro` 顶部 frontmatter import：

```astro
import BackToTop from '../components/site/BackToTop.astro';
```

在 `editorial-shell` 内、`{!hideFooter && <SiteFooter />}` 之后插入：

```astro
    <div class="editorial-shell">
      <SiteHeader />
      <main id="main-content" class="editorial-main">
        <slot />
      </main>
      {!hideFooter && <SiteFooter />}
      <BackToTop />
    </div>
```

- [ ] **Step 3: 验证构建与行为**

Run: `pnpm build`
Expected: 构建成功。视觉核对：任意长页面向下滚动超过一屏后右下角出现圆形绿色按钮，点击平滑回顶；移动端按钮位于底部偏上（bottom:88px），不与文章页 TOC 浮钮重叠。

- [ ] **Step 4: 提交**

```bash
git add src/components/site/BackToTop.astro src/layouts/SiteLayout.astro
git commit -m "feat(ui): 新增全局回到顶部浮动按钮"
```

---

## Task 4: ColumnCard 轻量化重写

**Files:**
- Modify: `src/components/site/ColumnCard.astro`（整文件重写）

**Interfaces:**
- Consumes: `Column` 类型（来自 `../../utils/getColumns`，含 `slug`、`title`、`description`、`status`）；token `--surface`、`--hairline`、`--tag-bg`、`--accent`、`--accent-hover`、`--surface-hover`、`--text-strong`、`--text-muted`；lucide `ArrowRight`
- Produces: `ColumnCard` 组件，Props：`column: Column`。整卡为 `<a>`，含状态标签、标题、简介、「进入专栏」按钮视觉块。移除 `compact` prop、封面图、文章计数。

- [ ] **Step 1: 重写 ColumnCard.astro**

```astro
---
import { ArrowRight } from 'lucide-astro';
import type { Column } from '../../utils/getColumns';

interface Props {
  column: Column;
}

const { column } = Astro.props;

const statusLabel = column.status === 'ongoing' ? '持续更新' : '已完结';
---

<a href={`/columns/${column.slug}`} class="column-card">
  <span class:list={['column-status', column.status === 'ongoing' ? 'is-ongoing' : 'is-done']}>
    <span class="column-status-dot" aria-hidden="true"></span>
    {statusLabel}
  </span>

  <div class="column-card-info">
    <h3 class="column-card-title">{column.title}</h3>
    <p class="column-card-desc">{column.description}</p>
  </div>

  <span class="column-enter">
    进入专栏
    <ArrowRight size={15} />
  </span>
</a>

<style>
  .column-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
    padding: 24px;
    border: 1px solid var(--hairline);
    border-radius: 8px;
    background: var(--surface);
    text-decoration: none;
    transition: border-color 150ms ease, background-color 150ms ease;
  }

  .column-card:hover {
    background: var(--surface-hover);
    border-color: var(--accent);
  }

  .column-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 9px;
    border-radius: 999px;
    background: var(--tag-bg);
    color: var(--accent);
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .column-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
  }

  .column-card-info {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .column-card-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 24px;
    font-weight: 600;
    line-height: 1.35;
    color: var(--text-strong);
    transition: color 150ms ease;
  }

  .column-card:hover .column-card-title {
    color: var(--accent);
  }

  .column-card-desc {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 15px;
    line-height: 1.8;
    color: var(--text-muted);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .column-enter {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 14px;
    border-radius: 6px;
    background: var(--accent);
    color: #fff;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    transition: background-color 150ms ease;
  }

  .column-card:hover .column-enter {
    background: var(--accent-hover);
  }

  @media (max-width: 720px) {
    .column-card {
      padding: 20px;
      gap: 16px;
    }

    .column-card-title {
      font-size: 20px;
    }
  }
</style>
```

- [ ] **Step 2: 验证构建**

Run: `pnpm build`
Expected: 构建成功。注意：`columns/index.astro` 当前仍用旧 ColumnCard 用法（含 `compact`）——下一个任务重写它；本步若构建报 `compact` 相关类型问题，确认 index 页未传 `compact`（grep 显示无），应通过。

- [ ] **Step 3: 提交**

```bash
git add src/components/site/ColumnCard.astro
git commit -m "refactor(column): ColumnCard 按设计稿轻量化（状态标签/标题/简介/进入按钮）"
```

---

## Task 5: 专栏索引页重写（含移动端响应式）

**Files:**
- Modify: `src/pages/columns/index.astro`（整文件重写）

**Interfaces:**
- Consumes: `Content` 组件、`ColumnCard` 组件、`getColumns()`、`SiteLayout`
- Produces: 轻量索引页，结构 Header / Content / Footer；Content 内含专栏页头 + 分隔线 + 纵向卡片列表。桌面与移动端同页响应式。

- [ ] **Step 1: 重写 columns/index.astro**

```astro
---
import Content from '../../components/site/Content.astro';
import ColumnCard from '../../components/site/ColumnCard.astro';
import SiteLayout from '../../layouts/SiteLayout.astro';
import { getColumns } from '../../utils/getColumns';

const columns = await getColumns();

const pageMeta = {
  title: '专栏 | Ginlon',
  description: '围绕一个长期主题持续写作，把分散的文章组织成可按顺序阅读的知识路径。',
};
---

<SiteLayout pageMeta={pageMeta}>
  <Content as="section" class="columns-page">
    <header class="columns-head">
      <p class="eyebrow">COLUMNS</p>
      <h1 class="columns-title">专栏</h1>
      <p class="columns-desc">{pageMeta.description}</p>
    </header>

    <hr class="hairline" />

    {columns.length > 0 ? (
      <div class="columns-list">
        {columns.map((column) => (
          <ColumnCard column={column} />
        ))}
      </div>
    ) : (
      <p class="columns-empty">暂无专栏，敬请期待。</p>
    )}
  </Content>
</SiteLayout>

<style>
  .columns-head {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-block: 72px 44px;
  }

  .eyebrow {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: var(--accent);
  }

  .columns-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 36px;
    font-weight: 600;
    color: var(--text-strong);
  }

  .columns-desc {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 16px;
    line-height: 1.8;
    color: var(--text-muted);
  }

  .hairline {
    height: 1px;
    border: 0;
    background: var(--hairline);
    margin: 0;
  }

  .columns-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-block: 44px 72px;
  }

  .columns-empty {
    padding-block: 44px 72px;
    color: var(--text-muted);
    font-family: var(--font-serif);
  }

  @media (max-width: 720px) {
    .columns-head {
      padding-block: 36px 24px;
      gap: 10px;
    }

    .columns-title {
      font-size: 30px;
    }

    .columns-desc {
      font-size: 15px;
    }

    .columns-list {
      gap: 16px;
      padding-block: 32px 44px;
    }
  }
</style>
```

- [ ] **Step 2: 验证构建与视觉**

Run: `pnpm build`
Expected: 构建成功。视觉核对（对照 `A21GI` / `a2E0au`）：页头 eyebrow + 标题 + 简介，下方分隔线跟随 1000px 内容宽度（不贯穿全屏），卡片纵向堆叠且轻量（状态标签/标题/简介/进入按钮，无封面无计数）。移动端 390 宽下卡片 padding 收窄。

- [ ] **Step 3: 提交**

```bash
git add src/pages/columns/index.astro
git commit -m "refactor(column): 专栏索引页改为轻量索引布局"
```

---

## Task 6: ArticleHeader 组件

**Files:**
- Create: `src/components/site/ArticleHeader.astro`

**Interfaces:**
- Consumes: token `--accent`、`--text-strong`、`--text-muted`、`--hairline`、`--reading-width`；lucide `Calendar`、`RefreshCw`
- Produces: `ArticleHeader` 组件，Props：
  - `title: string`
  - `summary?: string`
  - `publishedLabel: string`、`publishedAtIso?: string`
  - `lastModifiedLabel?: string`、`lastModifiedIso?: string`
  - `tags?: string[]`
  - `categoryLabel?: string`（默认 `'写作'`）
  - `column?: { title: string; slug: string }`
  - `poster?: string`、`posterDescription?: string`

  渲染：分类 eyebrow → 专栏+标签行（有 column 显示 `专栏 · {title}  #tag…`，无 column 仅 `#tag…`）→ 标题 → 摘要 → meta（日历+发布、刷新+更新）→ 可选封面。标题块约束在阅读宽度，压缩与正文间距。

- [ ] **Step 1: 创建 ArticleHeader.astro**

```astro
---
import { Calendar, RefreshCw } from 'lucide-astro';

interface Props {
  title: string;
  summary?: string | undefined;
  publishedLabel: string;
  publishedAtIso?: string | undefined;
  lastModifiedLabel?: string | undefined;
  lastModifiedIso?: string | undefined;
  tags?: string[] | undefined;
  categoryLabel?: string | undefined;
  column?: { title: string; slug: string } | undefined;
  poster?: string | undefined;
  posterDescription?: string | undefined;
}

const {
  title,
  summary,
  publishedLabel,
  publishedAtIso,
  lastModifiedLabel,
  lastModifiedIso,
  tags = [],
  categoryLabel = '写作',
  column,
  poster,
  posterDescription,
} = Astro.props;
---

<header class="article-header">
  <div class="article-header-inner">
    <p class="article-eyebrow">{categoryLabel}</p>

    {(column || tags.length > 0) && (
      <p class="article-column-tags">
        {column && (
          <a href={`/columns/${column.slug}`} class="article-column-link">专栏 · {column.title}</a>
        )}
        {tags.map((tag) => (
          <span class="article-tag">#{tag}</span>
        ))}
      </p>
    )}

    <h1 class="article-title">{title}</h1>
    {summary && <p class="article-summary">{summary}</p>}

    <div class="article-meta">
      <span class="article-meta-item">
        <Calendar size={14} />
        <time datetime={publishedAtIso}>{publishedLabel}</time>
      </span>
      {lastModifiedLabel && (
        <span class="article-meta-item">
          <RefreshCw size={14} />
          <span>更新于 <time datetime={lastModifiedIso}>{lastModifiedLabel}</time></span>
        </span>
      )}
    </div>
  </div>

  {poster && (
    <figure class="article-cover">
      <img src={poster} alt={posterDescription ?? title} loading="eager" />
    </figure>
  )}
</header>

<style>
  .article-header {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: var(--reading-width);
    margin-inline: auto;
    padding-block: 48px 32px;
  }

  .article-header-inner {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .article-eyebrow {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: var(--accent);
  }

  .article-column-tags {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    color: var(--accent);
  }

  .article-column-link {
    color: var(--accent);
    text-decoration: none;
  }

  .article-column-link:hover {
    text-decoration: underline;
  }

  .article-tag {
    color: var(--accent);
  }

  .article-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: clamp(1.9rem, 1.3rem + 2vw, 2.625rem);
    font-weight: 600;
    line-height: 1.3;
    color: var(--text-strong);
  }

  .article-summary {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 18px;
    line-height: 1.8;
    color: var(--text-muted);
  }

  .article-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 20px;
  }

  .article-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-sans);
    font-size: 13px;
    color: var(--text-muted);
  }

  .article-cover {
    margin: 16px 0 0;
  }

  .article-cover img {
    display: block;
    width: 100%;
    max-height: 34rem;
    object-fit: cover;
    border-radius: 4px;
  }

  @media (max-width: 720px) {
    .article-header {
      padding-block: 36px 24px;
      gap: 16px;
    }

    .article-title {
      font-size: 28px;
      line-height: 1.35;
    }

    .article-summary {
      font-size: 15px;
    }
  }
</style>
```

- [ ] **Step 2: 验证构建**

Run: `pnpm build`
Expected: 构建成功（组件尚无消费者）。

- [ ] **Step 3: 提交**

```bash
git add src/components/site/ArticleHeader.astro
git commit -m "feat(article): 新增 ArticleHeader，支持 column/tags/meta 条件渲染"
```

---

## Task 7: ArticleAside 组件

**Files:**
- Create: `src/components/site/ArticleAside.astro`

**Interfaces:**
- Consumes: token `--surface-tint`、`--accent`、`--accent-soft`、`--surface-ink`、`--text-muted`、`--shadow-soft`、`--hairline`
- Produces: `ArticleAside` 组件，Props：
  - `headings: { depth: number; slug: string; text: string }[]`
  - `column?: { title: string; slug: string; articles: { slug: string; title: string }[]; currentSlug: string }`

  桌面 fixed 悬浮层；含「所属专栏」模块（有 column 时）+「文章导航」模块（TOC，复用 `data-toc-link` 高亮约定）。`< 1024px` 隐藏。

- [ ] **Step 1: 创建 ArticleAside.astro**

```astro
---
interface Heading {
  depth: number;
  slug: string;
  text: string;
}

interface Props {
  headings: Heading[];
  column?: {
    title: string;
    slug: string;
    articles: { slug: string; title: string }[];
    currentSlug: string;
  } | undefined;
}

const { headings, column } = Astro.props;
const tocItems = headings.filter((h) => h.depth >= 2 && h.depth <= 4);
---

<aside class="article-aside" aria-label="文章快捷栏">
  {column && (
    <nav class="aside-module" aria-label="所属专栏">
      <p class="aside-module-title">所属专栏</p>
      <a href={`/columns/${column.slug}`} class="aside-column-name">{column.title}</a>
      <ul class="aside-column-list">
        {column.articles.map((article, index) => (
          <li>
            <a
              href={`/columns/${column.slug}/${article.slug}`}
              class:list={['aside-column-link', article.slug === column.currentSlug && 'is-current']}
            >
              {String(index + 1).padStart(2, '0')} {article.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )}

  {column && tocItems.length > 0 && <div class="aside-divider"></div>}

  {tocItems.length > 0 && (
    <nav class="aside-module" aria-label="文章导航">
      <p class="aside-module-title">文章导航</p>
      <ul class="aside-toc-list">
        {tocItems.map((heading) => (
          <li class:list={[`aside-toc-depth-${heading.depth}`]}>
            <a href={`#${heading.slug}`} class="aside-toc-link" data-toc-link>{heading.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  )}
</aside>

<style>
  .article-aside {
    display: none;
  }

  @media (min-width: 1024px) {
    .article-aside {
      display: flex;
      flex-direction: column;
      gap: 18px;
      position: fixed;
      top: 120px;
      /* 定位在 1000px Content 右外侧：视口中线 + 半个内容宽 + 间距 */
      left: calc(50% + 500px + 24px);
      width: 220px;
      max-height: calc(100vh - 160px);
      overflow-y: auto;
      padding: 20px 18px;
      border: 1px solid var(--accent-soft);
      border-radius: 8px;
      background: var(--surface-tint);
      box-shadow: var(--shadow-soft);
      z-index: 10;
    }

    /* 窄于约 1500px 时右外侧空间不足，隐藏避免压住正文 */
    @media (max-width: 1499px) {
      .article-aside {
        display: none;
      }
    }
  }

  .aside-module {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .aside-module-title {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1.5px;
    color: var(--text-muted);
  }

  .aside-column-name {
    font-family: var(--font-serif);
    font-size: 18px;
    font-weight: 600;
    color: var(--surface-ink);
    text-decoration: none;
  }

  .aside-column-name:hover {
    color: var(--accent);
  }

  .aside-column-list,
  .aside-toc-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .aside-column-link,
  .aside-toc-link {
    display: block;
    font-family: var(--font-serif);
    font-size: 13px;
    line-height: 1.5;
    color: var(--surface-ink);
    text-decoration: none;
    transition: color 150ms ease;
  }

  .aside-column-link.is-current,
  .aside-column-link:hover,
  .aside-toc-link:hover,
  .aside-toc-link.is-active {
    color: var(--accent);
    font-weight: 600;
  }

  .aside-toc-link {
    font-size: 14px;
    color: var(--text-muted);
  }

  .aside-toc-depth-3 { padding-left: 12px; }
  .aside-toc-depth-4 { padding-left: 24px; }

  .aside-divider {
    height: 1px;
    background: var(--accent-soft);
  }
</style>
```

- [ ] **Step 2: 验证构建**

Run: `pnpm build`
Expected: 构建成功（组件尚无消费者）。

- [ ] **Step 3: 提交**

```bash
git add src/components/site/ArticleAside.astro
git commit -m "feat(article): 新增 ArticleAside 桌面右侧悬浮栏"
```

---

## Task 8: 共享 Markdown 正文样式

**Files:**
- Create: `src/styles/article-content.css`
- Modify: `src/styles/styles.css`（import 新文件）

**Interfaces:**
- Consumes: token（`--text-strong`、`--text-muted`、`--accent`、`--accent-soft`、`--surface`、`--surface-tint`、`--hairline`、`--font-serif`、`--font-sans`）
- Produces: 全局 class `.article-body` 的排版样式（标题、段落、列表、引用、代码、表格、图片、hr），供 blogs 与 columns 文章页共用。表格对照设计稿 `ebsuK`。

- [ ] **Step 1: 创建 article-content.css**

```css
/* 文章正文共享排版样式，作用于 .article-body 容器 */
.article-body {
  color: var(--text-strong);
  font-family: var(--font-serif);
  font-size: 17px;
  line-height: 1.9;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.article-body h2,
.article-body h3,
.article-body h4,
.article-body h5 {
  margin-top: 2.6rem;
  margin-bottom: 0.9rem;
  font-family: var(--font-serif);
  color: var(--text-strong);
  line-height: 1.3;
  letter-spacing: -0.01em;
  scroll-margin-top: 100px;
}

.article-body h2 { font-size: 1.75rem; font-weight: 600; }
.article-body h3 { font-size: 1.35rem; font-weight: 600; }
.article-body h4 { font-size: 1.1rem; font-weight: 600; }

.article-body p,
.article-body ul,
.article-body ol,
.article-body blockquote,
.article-body pre,
.article-body table {
  margin-block: 1rem;
}

.article-body ul,
.article-body ol { padding-left: 1.4rem; }

.article-body li { margin-block: 0.45rem; }

.article-body a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 0.18em;
}

.article-body img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.article-body blockquote {
  border-left: 3px solid var(--accent);
  margin-inline: 0;
  padding: 0.2rem 0 0.2rem 1rem;
  color: var(--text-muted);
}

.article-body code:not(pre code) {
  background: var(--accent-soft);
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: var(--font-sans);
}

.article-body pre {
  overflow-x: auto;
  max-width: 100%;
  background: rgba(15, 23, 42, 0.96);
  padding: 1rem;
  border-radius: 6px;
  color: #f8fafc;
  font-family: var(--font-sans);
}

.article-body pre.mermaid {
  background: transparent;
  color: inherit;
  overflow: visible;
}

.article-body pre code {
  display: block;
  width: max-content;
  min-width: 100%;
  background: transparent;
  padding: 0;
  color: inherit;
}

/* Markdown 表格 —— 对照设计稿 ebsuK：外框 + 圆角 + 表头浅底 */
.article-body table {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  font-size: 0.95em;
  table-layout: fixed;
  word-break: break-word;
  border: 1px solid var(--hairline);
  border-radius: 8px;
  overflow: hidden;
}

.article-body thead {
  background: var(--surface-tint);
}

.article-body th,
.article-body td {
  border-bottom: 1px solid var(--hairline);
  padding: 0.6rem 0.85rem;
  text-align: left;
}

.article-body tbody tr:last-child td {
  border-bottom: 0;
}

.article-body th {
  font-family: var(--font-sans);
  font-weight: 600;
  color: var(--text-strong);
}

.article-body td {
  background: var(--surface);
  color: var(--text-strong);
}

.article-body hr {
  border: 0;
  border-top: 1px solid var(--hairline);
  margin: 2.5rem 0;
}

@media (max-width: 720px) {
  .article-body {
    font-size: 16px;
    line-height: 1.9;
  }
}
```

- [ ] **Step 2: 在 styles.css 引入**

在 `src/styles/styles.css` 顶部 import 区追加（`@import "./theme.css";` 之后）：

```css
@import "./article-content.css";
```

- [ ] **Step 3: 验证构建**

Run: `pnpm build`
Expected: 构建成功。样式尚未被页面引用 class 触发，仅验证 CSS 合法。

- [ ] **Step 4: 提交**

```bash
git add src/styles/article-content.css src/styles/styles.css
git commit -m "feat(article): 抽取共享 markdown 正文样式，补充表格样式"
```

---

## Task 9: 文章详情页（无专栏）接入新组件

**Files:**
- Modify: `src/pages/blogs/[slug].astro`（整文件重写 template 与 style）

**Interfaces:**
- Consumes: `ArticleHeader`、`ArticleAside`、`ArticlePager`、`ArticleTocDrawer`、`Content`、共享 `.article-body` 样式
- Produces: 正文居中布局；ArticleHeader（无 column）+ 正文 `.article-body` + ArticleAside（无专栏，仅文章导航）+ ArticlePager；移动端 ArticleTocDrawer 保留。

- [ ] **Step 1: 重写 blogs/[slug].astro 的 frontmatter import 与 template**

frontmatter 顶部 import 替换 `ArticleHero`/`ArticleTocRail` 为新组件：

```astro
---
import { render } from 'astro:content';
import ArticleHeader from '../../components/site/ArticleHeader.astro';
import ArticleAside from '../../components/site/ArticleAside.astro';
import ArticlePager from '../../components/site/ArticlePager.astro';
import ArticleTocDrawer from '../../components/site/ArticleTocDrawer.astro';
import Content from '../../components/site/Content.astro';
import SiteLayout from '../../layouts/SiteLayout.astro';
import { siteConfig } from '../../data/site';
import { dayjs, format } from '../../utils/dayjs';
import type { PageMeta } from '../../types/seo';
import { getBlogs, type Blog } from '../../utils/getBlogs';
```

`getStaticPaths` 与 props 解构、`render`、summary/label 计算、pageMeta 保持现有不变（见现文件 13-65 行）。

template 替换 `<article>...</article>` 为：

```astro
<SiteLayout pageMeta={pageMeta}>
  <article>
    <Content as="div">
      <ArticleHeader
        title={article.data.title}
        summary={summary}
        publishedLabel={publishedLabel}
        publishedAtIso={publishedTime}
        lastModifiedLabel={lastModifiedLabel}
        lastModifiedIso={modifiedTime}
        tags={article.data.tags}
        poster={article.data.poster}
        posterDescription={article.data.posterDescription}
        categoryLabel={categoryLabel}
      />

      <hr class="article-rule" />

      <div class="article-body reading-center">
        <Content />

        {lastModifiedLabel && (
          <footer class="article-body-footer">
            <span class="meta">最后更新 <time datetime={lastModifiedValue}>{lastModifiedLabel}</time></span>
          </footer>
        )}
      </div>

      <hr class="article-rule" />

      <ArticlePager
        prev={prev ? { slug: prev.slug, title: prev.title } : undefined}
        next={next ? { slug: next.slug, title: next.title } : undefined}
      />
    </Content>

    <ArticleAside headings={filteredHeadings} />
    <ArticleTocDrawer headings={filteredHeadings} buttonLabel="目录" />
  </article>
</SiteLayout>
```

> 注意：`<Content />`（无 props）在 `.article-body` 内是 Astro 内容组件渲染（来自 `render(article)` 解构的 `Content`），与布局组件 `Content.astro` 同名。**为避免冲突，将布局容器 import 改别名**：把 frontmatter 里 `import Content from '../../components/site/Content.astro';` 改为 `import Shell from '../../components/site/Content.astro';`，并将 template 中两处布局容器 `<Content as="div">…</Content>` 改为 `<Shell as="div">…</Shell>`。文章内容渲染仍用 `<Content />`。

- [ ] **Step 2: 保留并调整 `<script>`**

现有 TOC 高亮与 Viewer.js 图片预览 `<script>`（现文件 112-176 行）原样保留。

- [ ] **Step 3: 替换 `<style>`**

```astro
<style>
  .article-rule {
    height: 1px;
    border: 0;
    background: var(--hairline);
    margin: 0;
    max-width: var(--reading-width);
    margin-inline: auto;
  }

  .reading-center {
    max-width: var(--reading-width);
    margin-inline: auto;
    padding-block: 32px 56px;
  }

  .article-body-footer {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--hairline);
    text-align: right;
  }

  @media (max-width: 720px) {
    .reading-center {
      padding-block: 24px 36px;
    }
  }
</style>
```

> `.article-body` 的排版（标题/段落/表格等）来自 Task 8 的全局 `article-content.css`，本页不再重复定义。

- [ ] **Step 4: 验证构建与视觉**

Run: `pnpm build`
Expected: 构建成功。视觉核对（对照 `oVGUc`）：正文居中于阅读宽度；分隔线跟随阅读宽度不贯穿全屏；标题块与正文间距收紧；宽屏（≥1500px）右侧出现悬浮「文章导航」栏（无专栏模块）；移动端右下角 TOC 浮钮可用；表格样式生效；图片可点击放大。

- [ ] **Step 5: 提交**

```bash
git add src/pages/blogs/[slug].astro
git commit -m "refactor(article): 博客详情页接入 ArticleHeader/ArticleAside，正文居中"
```

---

## Task 10: 专栏文章详情页接入新组件

**Files:**
- Modify: `src/pages/columns/[slug]/[article].astro`（整文件重写 template 与 style）

**Interfaces:**
- Consumes: `ArticleHeader`（带 column）、`ArticleAside`（带 column）、`ArticlePager`、`ArticleTocDrawer`、`Content`（别名 `Shell`）、共享 `.article-body` 样式
- Produces: 与 Task 9 同构，但 ArticleHeader/ArticleAside 传入 column 信息。

- [ ] **Step 1: 重写 frontmatter import 与 categoryLabel**

import 区（替换 ColumnSidebar/ArticleHero/ArticleTocRail）：

```astro
---
import { render } from 'astro:content';
import ArticleHeader from '../../../components/site/ArticleHeader.astro';
import ArticleAside from '../../../components/site/ArticleAside.astro';
import ArticlePager from '../../../components/site/ArticlePager.astro';
import ArticleTocDrawer from '../../../components/site/ArticleTocDrawer.astro';
import Shell from '../../../components/site/Content.astro';
import SiteLayout from '../../../layouts/SiteLayout.astro';
import { siteConfig } from '../../../data/site';
import { dayjs, format } from '../../../utils/dayjs';
import { getColumns, getColumnArticle } from '../../../utils/getColumns';
---
```

`getStaticPaths`、`detail` 取值、`render`、summary/publishedLabel/articleIndex/pageMeta 保持现有（现文件 13-62 行）。新增一行 categoryLabel：

```astro
const categoryLabel = '工程 · 长读';
```

- [ ] **Step 2: 替换 template**

```astro
<SiteLayout pageMeta={pageMeta}>
  <article>
    <Shell as="div">
      <ArticleHeader
        title={detail.title}
        summary={summary}
        publishedLabel={publishedLabel}
        publishedAtIso={publishedTime}
        lastModifiedIso={modifiedTime}
        tags={detail.tags}
        poster={detail.poster}
        categoryLabel={categoryLabel}
        column={{ title: detail.column.title, slug: slug! }}
      />

      <hr class="article-rule" />

      <div class="article-body reading-center">
        <Content />
      </div>

      <hr class="article-rule" />

      <ArticlePager
        prev={detail.prev ? { slug: `/columns/${slug}/${detail.prev.slug}`, title: detail.prev.title } : undefined}
        next={detail.next ? { slug: `/columns/${slug}/${detail.next.slug}`, title: detail.next.title } : undefined}
      />
    </Shell>

    <ArticleAside
      headings={filteredHeadings}
      column={{
        title: detail.column.title,
        slug: slug!,
        articles: detail.articles.map((a) => ({ slug: a.slug, title: a.title })),
        currentSlug: articleSlug!,
      }}
    />
    <ArticleTocDrawer headings={filteredHeadings} buttonLabel="目录" />
  </article>
</SiteLayout>
```

> `<Content />` 仍指 `render(detail.content)` 解构出的内容组件；布局容器用别名 `<Shell>`。

- [ ] **Step 3: 替换 `<style>`**

```astro
<style>
  .article-rule {
    height: 1px;
    border: 0;
    background: var(--hairline);
    margin: 0;
    max-width: var(--reading-width);
    margin-inline: auto;
  }

  .reading-center {
    max-width: var(--reading-width);
    margin-inline: auto;
    padding-block: 32px 56px;
  }

  @media (max-width: 720px) {
    .reading-center {
      padding-block: 24px 36px;
    }
  }
</style>
```

- [ ] **Step 4: 验证构建与视觉**

Run: `pnpm build`
Expected: 构建成功。视觉核对（对照 `xV2hU`）：头部显示「专栏 · {专栏名}  #标签」；正文居中；宽屏右侧悬浮栏含「所属专栏」（当前篇高亮）+「文章导航」两模块；移动端 TOC 抽屉可用。

- [ ] **Step 5: 提交**

```bash
git add src/pages/columns/[slug]/[article].astro
git commit -m "refactor(article): 专栏文章页接入新文章组件，右侧悬浮栏含专栏模块"
```

---

## Task 11: 首页与写作归档页接入 Content

**Files:**
- Modify: `src/pages/index.astro`（template 中 `.shell` → `Content`，hr 入容器）
- Modify: `src/pages/writing/index.astro`（页头入 Content）

**Interfaces:**
- Consumes: `Content` 组件
- Produces: 首页分割线/区段跟随内容宽度；写作归档页头进入 Content。

- [ ] **Step 1: 首页改用 Content**

`src/pages/index.astro` frontmatter import 追加：

```astro
import Content from '../components/site/Content.astro';
```

将三处 `<section class="hero shell">` / `<section class="section shell">` 的 `shell` 类去掉，改为外层包 `<Content>`；贯穿的 `<hr class="hairline" />` 移入 Content 内、改 class 为跟随容器宽度。具体 template 调整为：

```astro
<SiteLayout pageMeta={pageMeta}>
  <Content as="section" class="hero">
    <img src="https://bucket.ginlon.site/avatar_512.png" alt="Ginlon" class="hero-avatar" />
    <div class="hero-text">
      <p class="hero-eyebrow">关于我</p>
      <h1 class="hero-title">Ginlon</h1>
      <p class="hero-tagline">
        全干工程师，写作爱好者。<br />
        相信工程是理解世界的方式，写作是理解自己的方式。
      </p>
    </div>
  </Content>

  <Content><hr class="hairline" /></Content>

  <Content as="section" class="section">
    <h2 class="section-title">精选写作</h2>
    <div class="writing-list">
      <hr class="hairline" />
      {selectedWriting.map((article) => (
        <a class="writing-row" href={`/blogs/${article.data.permalink}`}>
          <time class="writing-date meta">{dayjs(article.data.createdAt).format('YYYY-MM-DD')}</time>
          <div class="writing-main">
            <h3 class="writing-title">{article.data.title}</h3>
            <p class="writing-summary">{article.data.description ?? article.data.subtitle ?? ''}</p>
          </div>
        </a>
      ))}
    </div>
  </Content>

  <Content><hr class="hairline" /></Content>

  <Content as="section" class="section">
    <h2 class="section-title">当前关注</h2>
    <ul class="focus-list">
      {focusList.map((item) => (
        <li class="focus-item">
          <h3 class="focus-title">{item.title}</h3>
          <p class="focus-desc">{item.description}</p>
        </li>
      ))}
    </ul>
  </Content>
</SiteLayout>
```

style 中 `.hero` / `.section` 不再依赖 `.shell`，移除可能与 Content 重复的 `max-width`/`padding-inline`（这两个类原本未设，故无需改），其余样式（hero-avatar、writing-row 等）保留不动。`.hairline` 样式若页面未定义则依赖全局 `.hairline`（styles.css 已有 component 层 `.hairline`），无需新增。

- [ ] **Step 2: 写作归档页头改用 Content**

`src/pages/writing/index.astro` frontmatter import 追加：

```astro
import Content from '../../components/site/Content.astro';
```

将 `<header class="writing-head shell">…</header>` 改为：

```astro
<Content as="header" class="writing-head">
  <p class="eyebrow">写作归档</p>
  <h1 class="writing-title">全部文章</h1>
  <p class="writing-desc">{pageMeta.description}</p>
</Content>
```

style 中 `.writing-head` 保留（去掉对 `.shell` 的隐式依赖，原本就是独立类，无需改）。`<ArticleList>` 保持不变。

- [ ] **Step 3: 验证构建与视觉**

Run: `pnpm build`
Expected: 构建成功。视觉核对（对照 `UTW5X`）：首页宽屏时内容居中、两侧留白，分割线跟随 1000px 内容宽度不贯穿全屏；写作归档页头宽度与列表一致。

- [ ] **Step 4: 提交**

```bash
git add src/pages/index.astro src/pages/writing/index.astro
git commit -m "refactor(layout): 首页与写作归档页接入 Content，分割线跟随内容宽度"
```

---

## Task 12: 清理与收尾

**Files:**
- 评估删除：`src/components/site/ArticleHero.astro`、`src/components/site/ArticleTocRail.astro`、`src/components/site/ColumnSidebar.astro`
- 检查：`src/pages/en/**`（英文文章页是否引用被改组件）

**Interfaces:**
- Consumes: 无新增
- Produces: 移除无引用的旧组件，确保全站构建干净。

- [ ] **Step 1: grep 确认旧组件引用**

Run:
```bash
grep -rn "ArticleHero\|ArticleTocRail\|ColumnSidebar" src/
```
Expected: 若仅剩组件自身定义、无页面 import，则可删；若 en 页面仍引用 `ArticleHero`，则保留该组件不删（en 本次不重构），仅删确实无引用者。

- [ ] **Step 2: 删除确认无引用的组件**

对每个确认无引用的组件：

```bash
git rm src/components/site/ArticleTocRail.astro
```
（ArticleHero/ColumnSidebar 视 grep 结果决定；ColumnSidebar 若已无引用则 `git rm`，其 token 迁移随删除作废。）

- [ ] **Step 3: 全站构建验证**

Run: `pnpm build`
Expected: 构建成功，无对已删组件或已移除 token 的引用错误。

- [ ] **Step 4: 全站 token 残留检查**

Run:
```bash
grep -rn "surface-bg\|surface-bg-strong\|surface-border\|radius-m" src/
```
Expected: 无结果（全部已迁移或随组件删除）。若有残留，逐个按 Task 1 映射修正后重新构建。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "chore(cleanup): 移除被替代的旧组件，确认 token 全量迁移"
```

---

## Self-Review

**Spec 覆盖核对：**
- §1 Token 体系 → Task 1 ✓
- §2 Content 容器 → Task 2 ✓；PageShell 复用 SiteLayout（Task 3 挂 BackToTop）✓
- §3 ArticleHeader → Task 6 ✓；ArticleAside → Task 7 ✓；正文居中 → Task 9/10 ✓；表格样式 → Task 8 ✓
- §4 专栏索引页 → Task 5 ✓；ColumnCard 轻量化 → Task 4 ✓
- §5 移动端专栏页（响应式同页）→ Task 5 ✓；交互状态 → Task 4（卡片/按钮 hover）+ 既有导航 hover ✓；BackToTop → Task 3 ✓；旧页面 token 迁移 → Task 1 ✓
- 文章页头部专栏/标签 → Task 6 ✓；目录与正文间距 → Task 9/10 `.reading-center` padding ✓

**类型一致性核对：**
- `Content.astro` Props `as`/`width`/`class` 在 Task 5/9/10/11 用法一致 ✓
- 文章页布局容器统一别名为 `Shell`，避免与内容渲染组件 `Content` 冲突（Task 9/10）✓
- `ArticleAside` 的 `column` 结构（title/slug/articles[{slug,title}]/currentSlug）在 Task 7 定义、Task 10 传入一致 ✓
- `ArticleHeader` 的 `column`（{title,slug}）在 Task 6 定义、Task 10 传入一致 ✓
- ColumnCard 移除 `compact`，消费者（Task 5）不传 ✓

**占位符扫描：** 无 TBD/TODO，所有代码步骤含完整代码 ✓

**已知风险（执行时注意）：**
- ArticleAside 用 `left: calc(50% + 500px + 24px)` 在 <1500px 视口隐藏，避免压正文——这是对设计稿"悬浮在 1000px Content 右外侧"的合理落地，执行时按实际视觉微调断点阈值。
- en 英文文章页本次不重构，若其 import 被删组件需保留对应组件。
