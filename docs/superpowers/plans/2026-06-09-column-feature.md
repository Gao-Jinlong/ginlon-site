# 专栏功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为博客站点新增"专栏"功能，支持将多篇关联文章组织为有阅读顺序的技术系列。

**Architecture:** 新增 `columns` 和 `columnArticles` 两个 Astro 内容集合，专栏定义（`index.md`）和文章（`*.mdx`）存储在同一目录下。通过文件路径解析文章归属。新增 3 个页面路由（专栏列表、专栏详情、文章阅读），修改导航栏和写作页集成专栏入口。

**Tech Stack:** Astro 6, Vue 3, TailwindCSS, TypeScript

---

## File Structure

### 新建文件

| 文件 | 职责 |
|------|------|
| `src/utils/getColumns.ts` | 专栏数据获取工具函数（getColumns, getColumnBySlug, getColumnArticle） |
| `src/content/columns/deerflow-architecture/index.md` | 示例专栏定义（DeerFlow 架构分析系列） |
| `src/content/columns/deerflow-architecture/01-overview/index.mdx` | 示例专栏文章（从现有博客迁移） |
| `src/pages/columns/index.astro` | 专栏列表页 |
| `src/pages/columns/[slug].astro` | 专栏详情页 |
| `src/pages/columns/[slug]/[article].astro` | 专栏文章阅读页 |
| `src/components/site/ColumnCard.astro` | 专栏卡片组件（列表页 + 写作页使用） |
| `src/components/site/ColumnSidebar.astro` | 文章阅读页侧边栏专栏目录 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/content.config.ts` | 新增 `columns` 和 `columnArticles` 集合定义 |
| `src/components/site/SiteHeader.astro` | 导航栏新增"专栏"链接 |
| `src/pages/writing/index.astro` | 写作页新增专栏区域 |
| `src/i18n/common/zh.json` | 新增专栏相关翻译文案 |

---

### Task 1: 新增内容集合配置

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1: 在 `src/content.config.ts` 中新增 `columns` 和 `columnArticles` 集合**

在现有的 `resume` 集合定义之后、`export const collections` 之前，新增以下代码：

```typescript
const columns = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/columns' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    poster: z.string().optional(),
    status: z.enum(['ongoing', 'completed']).default('ongoing'),
    draft: z.boolean().default(false),
  }),
});

const columnArticles = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/columns' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    poster: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    order: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});
```

更新 `export const collections`：

```typescript
export const collections = {
  blogs,
  resume,
  columns,
  columnArticles,
};
```

- [ ] **Step 2: 验证配置无误**

Run: `cd D:\project\ginlon-site && pnpm astro check`
Expected: 无类型错误（此时还没有内容文件，集合为空是正常的）

- [ ] **Step 3: 提交**

```bash
git add src/content.config.ts
git commit -m "feat(columns): add columns and columnArticles content collections"
```

---

### Task 2: 新增专栏工具函数

**Files:**
- Create: `src/utils/getColumns.ts`

- [ ] **Step 1: 创建 `src/utils/getColumns.ts`**

```typescript
import { getCollection, type CollectionEntry } from 'astro:content';
import dayjs from 'dayjs';

// ── Types ──────────────────────────────────────────────

export type ColumnStatus = 'ongoing' | 'completed';

export interface Column {
  slug: string;
  title: string;
  description: string;
  poster?: string;
  status: ColumnStatus;
  articleCount: number;
}

export interface ColumnArticle {
  slug: string;
  fullSlug: string;
  title: string;
  subtitle?: string;
  poster?: string;
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  order?: number;
  summary: string;
  draft: boolean;
}

export interface ColumnDetail extends Column {
  articles: ColumnArticle[];
}

export interface ColumnArticleDetail extends ColumnArticle {
  content: CollectionEntry<'columnArticles'>;
  column: Column;
  prev?: ColumnArticle;
  next?: ColumnArticle;
}

// ── Helpers ─────────────────────────────────────────────

/**
 * 从文章的 id 路径中提取专栏 slug。
 * id 格式如: "langgraph-learning/01-intro/index.mdx"
 */
function extractColumnSlug(id: string): string {
  const parts = id.replace(/\\/g, '/').split('/');
  return parts[0];
}

/**
 * 从文章的 id 路径中提取文章 slug。
 * id 格式如: "langgraph-learning/01-intro/index.mdx"
 */
function extractArticleSlug(id: string): string {
  const parts = id.replace(/\\/g, '/').split('/');
  return parts.length >= 2 ? parts[1] : parts[0];
}

/**
 * 从文章 body 中提取纯文本摘要（前 140 字符）。
 */
function deriveSummaryFromBody(entry: CollectionEntry<'columnArticles'>): string {
  const rawBody = (entry as CollectionEntry<'columnArticles'> & { body?: string }).body;
  if (!rawBody) return '';

  const normalized = rawBody
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/[>*_-]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized.slice(0, 140);
}

function toArticleSummary(entry: CollectionEntry<'columnArticles'>): string {
  return entry.data.subtitle?.trim() || deriveSummaryFromBody(entry) || entry.data.title;
}

/**
 * 排序：有 order 的按 order 升序，无 order 的按 createdAt 升序，
 * 有 order 的排在无 order 的前面。
 */
function sortArticles(articles: ColumnArticle[]): ColumnArticle[] {
  return [...articles].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf();
  });
}

function toColumnArticle(entry: CollectionEntry<'columnArticles'>): ColumnArticle {
  const columnSlug = extractColumnSlug(entry.id);
  const articleSlug = extractArticleSlug(entry.id);

  return {
    slug: articleSlug,
    fullSlug: `${columnSlug}/${articleSlug}`,
    title: entry.data.title,
    subtitle: entry.data.subtitle,
    poster: entry.data.poster,
    createdAt: entry.data.createdAt,
    updatedAt: entry.data.updatedAt,
    tags: entry.data.tags,
    order: entry.data.order,
    summary: toArticleSummary(entry),
    draft: entry.data.draft,
  };
}

// ── Public API ──────────────────────────────────────────

/**
 * 获取所有专栏（含文章数量统计）。
 * 生产环境过滤草稿专栏和草稿文章。
 */
export async function getColumns(): Promise<Column[]> {
  const isDev = process.env.NODE_ENV === 'development';

  const allColumns = await getCollection('columns', (entry) => {
    return isDev || !entry.data.draft;
  });

  const allArticles = await getCollection('columnArticles', (entry) => {
    return isDev || !entry.data.draft;
  });

  return allColumns.map((col) => {
    const columnSlug = col.id.replace(/\\/g, '/').split('/')[0];
    const articleCount = allArticles.filter(
      (a) => extractColumnSlug(a.id) === columnSlug,
    ).length;

    return {
      slug: columnSlug,
      title: col.data.title,
      description: col.data.description,
      poster: col.data.poster,
      status: col.data.status,
      articleCount,
    };
  });
}

/**
 * 获取单个专栏详情 + 排序后的文章列表。
 */
export async function getColumnBySlug(slug: string): Promise<ColumnDetail | undefined> {
  const isDev = process.env.NODE_ENV === 'development';

  const allColumns = await getCollection('columns', (entry) => {
    return isDev || !entry.data.draft;
  });

  const col = allColumns.find((c) => {
    const colSlug = c.id.replace(/\\/g, '/').split('/')[0];
    return colSlug === slug;
  });

  if (!col) return undefined;

  const allArticles = await getCollection('columnArticles', (entry) => {
    return isDev || !entry.data.draft;
  });

  const articles = allArticles
    .filter((a) => extractColumnSlug(a.id) === slug)
    .map(toColumnArticle);

  const sorted = sortArticles(articles);

  return {
    slug,
    title: col.data.title,
    description: col.data.description,
    poster: col.data.poster,
    status: col.data.status,
    articleCount: sorted.length,
    articles: sorted,
  };
}

/**
 * 获取专栏内指定文章详情 + 上下篇信息。
 */
export async function getColumnArticle(
  columnSlug: string,
  articleSlug: string,
): Promise<ColumnArticleDetail | undefined> {
  const columnDetail = await getColumnBySlug(columnSlug);
  if (!columnDetail) return undefined;

  const articleIndex = columnDetail.articles.findIndex((a) => a.slug === articleSlug);
  if (articleIndex === -1) return undefined;

  const article = columnDetail.articles[articleIndex];

  const allEntries = await getCollection('columnArticles');
  const entry = allEntries.find((e) => {
    const colSlug = extractColumnSlug(e.id);
    const artSlug = extractArticleSlug(e.id);
    return colSlug === columnSlug && artSlug === articleSlug;
  });

  if (!entry) return undefined;

  return {
    ...article,
    content: entry,
    column: {
      slug: columnDetail.slug,
      title: columnDetail.title,
      description: columnDetail.description,
      poster: columnDetail.poster,
      status: columnDetail.status,
      articleCount: columnDetail.articleCount,
    },
    prev: articleIndex > 0 ? columnDetail.articles[articleIndex - 1] : undefined,
    next: articleIndex < columnDetail.articles.length - 1 ? columnDetail.articles[articleIndex + 1] : undefined,
  };
}
```

- [ ] **Step 2: 验证类型无误**

Run: `cd D:\project\ginlon-site && pnpm astro check`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add src/utils/getColumns.ts
git commit -m "feat(columns): add getColumns utility functions"
```

---

### Task 3: 创建示例专栏内容

**Files:**
- Create: `src/content/columns/deerflow-architecture/index.md`
- Create: `src/content/columns/deerflow-architecture/01-overview/index.mdx`

- [ ] **Step 1: 创建专栏目录和定义文件**

创建 `src/content/columns/deerflow-architecture/index.md`：

```markdown
---
title: 'DeerFlow 架构分析'
description: '深入分析 DeerFlow 项目的架构设计、技术选型和实现细节'
poster: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800'
status: 'ongoing'
draft: false
---
```

- [ ] **Step 2: 创建专栏文章**

从现有博客 `src/content/blogs/zh/deerflow-architecture/` 迁移内容。创建 `src/content/columns/deerflow-architecture/01-overview/index.mdx`：

```markdown
---
title: 'DeerFlow 架构概览'
subtitle: '了解 DeerFlow 的整体架构和技术栈'
poster: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800'
createdAt: '2026-06-09 10:00:00 +08:00'
tags: ['AI', '架构', 'DeerFlow']
order: 1
draft: false
---

这里是从现有 deerflow-architecture 博客文章中迁移过来的正文内容。
请将原 `src/content/blogs/zh/deerflow-architecture/index.mdx` 中的正文内容（frontmatter 以下的部分）完整复制到这里。
```

> **注意：** 请手动将原 `src/content/blogs/zh/deerflow-architecture/index.mdx` 中的正文内容复制到新文件中，然后删除原文件。

- [ ] **Step 3: 验证内容集合能正常读取**

Run: `cd D:\project\ginlon-site && pnpm dev`
Expected: 开发服务器正常启动，无构建错误

- [ ] **Step 4: 提交**

```bash
git add src/content/columns/
git commit -m "feat(columns): add DeerFlow architecture column with sample content"
```

---

### Task 4: 更新导航栏

**Files:**
- Modify: `src/components/site/SiteHeader.astro`

- [ ] **Step 1: 在 `SiteHeader.astro` 的 `navLinks` 数组中添加"专栏"链接**

将第 4-7 行的 `navLinks` 修改为：

```typescript
const navLinks = [
  { href: '/', label: '首页' },
  { href: '/writing', label: '写作' },
  { href: '/columns', label: '专栏' },
];
```

- [ ] **Step 2: 验证导航栏显示正常**

Run: `cd D:\project\ginlon-site && pnpm dev`
Expected: 导航栏显示"首页"、"写作"、"专栏"三个链接。"专栏"链接指向 `/columns`

- [ ] **Step 3: 提交**

```bash
git add src/components/site/SiteHeader.astro
git commit -m "feat(columns): add column link to navigation"
```

---

### Task 5: 更新 i18n 翻译文案

**Files:**
- Modify: `src/i18n/common/zh.json`

- [ ] **Step 1: 在 `zh.json` 中新增 `columns` 翻译节点**

在 JSON 根对象中，`"og"` 键之后添加：

```json
"columns": {
  "pageTitle": "技术专栏",
  "pageDescription": "系统化学习，深入掌握每一项技术",
  "statusOngoing": "连载中",
  "statusCompleted": "已完结",
  "articleCount": "篇文章",
  "articleList": "文章目录",
  "emptyState": "暂无专栏，敬请期待。",
  "columnEmpty": "专栏暂无文章，即将更新。",
  "viewAll": "查看全部",
  "columnSection": "技术专栏",
  "belongsTo": "本文属于专栏",
  "chapter": "第",
  "unit": "篇",
  "nextArticle": "下一篇",
  "prevArticle": "上一篇",
  "comingSoon": "敬请期待..."
}
```

- [ ] **Step 2: 提交**

```bash
git add src/i18n/common/zh.json
git commit -m "feat(columns): add column i18n translations"
```

---

### Task 6: 创建 ColumnCard 组件

**Files:**
- Create: `src/components/site/ColumnCard.astro`

- [ ] **Step 1: 创建 `src/components/site/ColumnCard.astro`**

```astro
---
import type { Column } from '../../utils/getColumns';

interface Props {
  column: Column;
  compact?: boolean;
}

const { column, compact = false } = Astro.props;

const statusLabel = column.status === 'ongoing' ? '连载中' : '已完结';
const statusClass = column.status === 'ongoing' ? 'status-ongoing' : 'status-completed';
---

<a href={`/columns/${column.slug}`} class:list={['column-card', compact && 'column-card-compact']}>
  {column.poster && !compact && (
    <div class="column-card-cover">
      <img src={column.poster} alt={column.title} loading="lazy" />
    </div>
  )}
  <div class="column-card-body">
    <h3 class="column-card-title">{column.title}</h3>
    {!compact && <p class="column-card-desc">{column.description}</p>}
    <div class="column-card-meta">
      <span class:list={['column-status', statusClass]}>{statusLabel}</span>
      <span class="column-count">{column.articleCount} 篇文章</span>
    </div>
  </div>
</a>

<style>
  .column-card {
    display: grid;
    gap: 0.65rem;
    border: 1px solid var(--surface-border);
    background: var(--surface-bg-strong);
    border-radius: var(--radius-m);
    overflow: hidden;
    text-decoration: none;
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }

  .column-card:hover {
    border-color: var(--accent);
    box-shadow: var(--shadow-soft);
  }

  .column-card-cover {
    width: 100%;
    height: 10rem;
    overflow: hidden;
  }

  .column-card-cover img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .column-card-body {
    padding: 1rem;
    display: grid;
    gap: 0.45rem;
  }

  .column-card-compact .column-card-body {
    padding: 0.75rem;
  }

  .column-card-title {
    margin: 0;
    color: var(--text-strong);
    font-size: 1.05rem;
    line-height: 1.35;
  }

  .column-card:hover .column-card-title {
    color: var(--accent);
  }

  .column-card-desc {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.88rem;
    line-height: 1.65;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .column-card-meta {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-size: 0.78rem;
  }

  .column-status {
    padding: 0.12rem 0.5rem;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.72rem;
  }

  .status-ongoing {
    background: #fef3c7;
    color: #92400e;
  }

  .status-completed {
    background: #d1fae5;
    color: #065f46;
  }

  .column-count {
    color: var(--text-muted);
    font-size: 0.78rem;
  }
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/components/site/ColumnCard.astro
git commit -m "feat(columns): add ColumnCard component"
```

---

### Task 7: 创建 ColumnSidebar 组件

**Files:**
- Create: `src/components/site/ColumnSidebar.astro`

- [ ] **Step 1: 创建 `src/components/site/ColumnSidebar.astro`**

```astro
---
import type { ColumnArticle, ColumnStatus } from '../../utils/getColumns';

interface Props {
  columnTitle: string;
  columnSlug: string;
  columnStatus: ColumnStatus;
  articles: ColumnArticle[];
  currentArticleSlug: string;
}

const { columnTitle, columnSlug, columnStatus, articles, currentArticleSlug } = Astro.props;

const statusLabel = columnStatus === 'ongoing' ? '连载中' : '已完结';
const statusClass = columnStatus === 'ongoing' ? 'status-ongoing' : 'status-completed';
---

<nav class="column-sidebar" aria-label="专栏目录">
  <div class="column-sidebar-header">
    <a href={`/columns/${columnSlug}`} class="column-sidebar-title">{columnTitle}</a>
    <span class:list={['column-status', statusClass]}>{statusLabel}</span>
  </div>
  <ul class="column-sidebar-list">
    {articles.map((article, index) => (
      <li>
        <a
          href={`/columns/${columnSlug}/${article.slug}`}
          class:list={[
            'column-sidebar-link',
            article.slug === currentArticleSlug && 'column-sidebar-link-active',
          ]}
        >
          <span class="column-sidebar-index">{index + 1}</span>
          <span class="column-sidebar-text">{article.title}</span>
        </a>
      </li>
    ))}
  </ul>
  <div class="column-sidebar-footer">
    共 {articles.length} 篇
  </div>
</nav>

<style>
  .column-sidebar {
    border: 1px solid var(--surface-border);
    background: var(--surface-bg);
    border-radius: var(--radius-m);
    padding: 1rem;
  }

  .column-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .column-sidebar-title {
    color: var(--accent);
    font-family: var(--font-sans);
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
    letter-spacing: 0.02em;
  }

  .column-sidebar-title:hover {
    text-decoration: underline;
  }

  .column-status {
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.68rem;
  }

  .status-ongoing {
    background: #fef3c7;
    color: #92400e;
  }

  .status-completed {
    background: #d1fae5;
    color: #065f46;
  }

  .column-sidebar-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.2rem;
  }

  .column-sidebar-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.4rem;
    border-radius: calc(var(--radius-m) * 0.5);
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-size: 0.82rem;
    text-decoration: none;
    transition: color 150ms ease, background-color 150ms ease;
  }

  .column-sidebar-link:hover {
    color: var(--accent);
    background: var(--accent-soft);
  }

  .column-sidebar-link-active {
    color: #fff;
    background: var(--accent);
    font-weight: 500;
  }

  .column-sidebar-link-active:hover {
    color: #fff;
    background: var(--accent);
  }

  .column-sidebar-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.3rem;
    height: 1.3rem;
    border-radius: 50%;
    font-size: 0.7rem;
    font-weight: 600;
    background: var(--accent-soft);
    color: var(--accent);
    flex-shrink: 0;
  }

  .column-sidebar-link-active .column-sidebar-index {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .column-sidebar-text {
    line-height: 1.4;
  }

  .column-sidebar-footer {
    margin-top: 0.75rem;
    padding-top: 0.6rem;
    border-top: 1px solid var(--surface-border);
    color: var(--text-muted);
    font-size: 0.75rem;
  }
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/components/site/ColumnSidebar.astro
git commit -m "feat(columns): add ColumnSidebar component"
```

---

### Task 8: 创建专栏列表页

**Files:**
- Create: `src/pages/columns/index.astro`

- [ ] **Step 1: 创建 `src/pages/columns/index.astro`**

```astro
---
import PageSection from '../../components/site/PageSection.astro';
import SectionHeading from '../../components/site/SectionHeading.astro';
import ColumnCard from '../../components/site/ColumnCard.astro';
import SiteLayout from '../../layouts/SiteLayout.astro';
import { getColumns } from '../../utils/getColumns';

const columns = await getColumns();

const pageMeta = {
  title: '技术专栏 | Ginlon',
  description: '系统化学习，深入掌握每一项技术',
};
---

<SiteLayout pageMeta={pageMeta}>
  <PageSection narrow={false} id="columns-list">
    <SectionHeading
      eyebrow="COLUMN"
      title="技术专栏"
      description={columns.length > 0 ? `共 ${columns.length} 个专栏，持续更新中。` : '暂无专栏，敬请期待。'}
    />

    {columns.length > 0 ? (
      <div class="columns-grid">
        {columns.map((column) => (
          <ColumnCard column={column} />
        ))}
      </div>
    ) : (
      <div class="columns-empty">
        <p>暂无专栏，敬请期待。</p>
      </div>
    )}
  </PageSection>
</SiteLayout>

<style>
  .columns-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
    gap: 1.2rem;
  }

  .columns-empty {
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-m);
    padding: 2rem;
    text-align: center;
    color: var(--text-muted);
    background: var(--surface-bg);
  }
</style>
```

- [ ] **Step 2: 验证专栏列表页**

Run: `cd D:\project\ginlon-site && pnpm dev`
Expected: 访问 `http://localhost:4321/columns` 能看到专栏列表页，显示 DeerFlow 架构分析专栏卡片

- [ ] **Step 3: 提交**

```bash
git add src/pages/columns/index.astro
git commit -m "feat(columns): add column list page"
```

---

### Task 9: 创建专栏详情页

**Files:**
- Create: `src/pages/columns/[slug].astro`

- [ ] **Step 1: 创建 `src/pages/columns/[slug].astro`**

```astro
---
import PageSection from '../../components/site/PageSection.astro';
import SiteLayout from '../../layouts/SiteLayout.astro';
import { getColumnBySlug, type ColumnDetail } from '../../utils/getColumns';
import { dayjs } from '../../utils/dayjs';

export async function getStaticPaths() {
  const { getColumns } = await import('../../utils/getColumns');
  const columns = await getColumns();

  return columns.map((col) => ({
    params: { slug: col.slug },
  }));
}

const { slug } = Astro.params;
const column = await getColumnBySlug(slug!);

if (!column) {
  return Astro.redirect('/columns');
}

const statusLabel = column.status === 'ongoing' ? '连载中' : '已完结';
const statusClass = column.status === 'ongoing' ? 'badge-ongoing' : 'badge-completed';

const pageMeta = {
  title: `${column.title} | Ginlon`,
  description: column.description,
};
---

<SiteLayout pageMeta={pageMeta}>
  <PageSection narrow={false} id="column-detail">
    <!-- Hero -->
    <div class="column-hero">
      <div class="column-hero-content">
        <p class="column-eyebrow">COLUMN</p>
        <h1 class="column-hero-title">{column.title}</h1>
        <p class="column-hero-desc">{column.description}</p>
        <div class="column-hero-meta">
          <span class:list={['column-badge', statusClass]}>{statusLabel}</span>
          <span class="column-meta-text">{column.articleCount} 篇文章</span>
        </div>
      </div>
      {column.poster && (
        <div class="column-hero-cover">
          <img src={column.poster} alt={column.title} loading="eager" />
        </div>
      )}
    </div>

    <!-- 文章目录 -->
    {column.articles.length > 0 ? (
      <div class="column-articles">
        <h2 class="column-articles-title">文章目录</h2>
        <ol class="column-articles-list">
          {column.articles.map((article, index) => (
            <li>
              <a href={`/columns/${slug}/${article.slug}`} class="column-article-item">
                <span class="column-article-index">{index + 1}</span>
                <div class="column-article-info">
                  <span class="column-article-title">{article.title}</span>
                  <span class="column-article-meta">
                    {dayjs(article.createdAt).format('YYYY-MM-DD')}
                    {article.subtitle && ` · ${article.subtitle}`}
                  </span>
                </div>
                <span class="column-article-arrow">→</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    ) : (
      <div class="column-empty">
        <p>专栏暂无文章，即将更新。</p>
      </div>
    )}
  </PageSection>
</SiteLayout>

<style>
  .column-hero {
    display: grid;
    gap: 1.5rem;
    border: 1px solid var(--surface-border);
    background: var(--surface-bg-strong);
    border-radius: var(--radius-m);
    padding: 1.5rem;
    box-shadow: var(--shadow-soft);
    margin-bottom: 1.5rem;
  }

  .column-hero-content {
    display: grid;
    gap: 0.65rem;
  }

  .column-eyebrow {
    margin: 0;
    color: var(--accent);
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.14em;
  }

  .column-hero-title {
    margin: 0;
    font-size: clamp(1.6rem, 1.2rem + 1vw, 2.5rem);
    line-height: 1.15;
    color: var(--text-strong);
    letter-spacing: -0.03em;
  }

  .column-hero-desc {
    margin: 0;
    color: var(--text-muted);
    line-height: 1.75;
    font-size: 1rem;
  }

  .column-hero-meta {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.3rem;
  }

  .column-badge {
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.75rem;
  }

  .badge-ongoing {
    background: #fef3c7;
    color: #92400e;
  }

  .badge-completed {
    background: #d1fae5;
    color: #065f46;
  }

  .column-meta-text {
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .column-hero-cover {
    border-radius: var(--radius-m);
    overflow: hidden;
    max-height: 16rem;
  }

  .column-hero-cover img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .column-articles {
    margin-top: 1rem;
  }

  .column-articles-title {
    margin: 0 0 0.75rem;
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .column-articles-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.55rem;
    counter-reset: none;
  }

  .column-article-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-m);
    background: var(--surface-bg-strong);
    text-decoration: none;
    transition: border-color 150ms ease, background-color 150ms ease;
  }

  .column-article-item:hover {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  .column-article-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.8rem;
    height: 1.8rem;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    font-size: 0.82rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  .column-article-info {
    flex: 1;
    display: grid;
    gap: 0.15rem;
    min-width: 0;
  }

  .column-article-title {
    color: var(--text-strong);
    font-size: 0.95rem;
    font-weight: 500;
    line-height: 1.4;
  }

  .column-article-item:hover .column-article-title {
    color: var(--accent);
  }

  .column-article-meta {
    color: var(--text-muted);
    font-size: 0.8rem;
  }

  .column-article-arrow {
    color: var(--accent);
    font-size: 0.9rem;
    flex-shrink: 0;
  }

  .column-empty {
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-m);
    padding: 2rem;
    text-align: center;
    color: var(--text-muted);
    background: var(--surface-bg);
  }

  @media (min-width: 1024px) {
    .column-hero {
      grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
      align-items: start;
    }
  }

  @media (max-width: 767px) {
    .column-hero {
      padding: 1rem;
    }
  }
</style>
```

- [ ] **Step 2: 验证专栏详情页**

Run: `cd D:\project\ginlon-site && pnpm dev`
Expected: 访问 `http://localhost:4321/columns/deerflow-architecture` 能看到专栏详情页，包含 Hero 和文章目录

- [ ] **Step 3: 提交**

```bash
git add src/pages/columns/[slug].astro
git commit -m "feat(columns): add column detail page"
```

---

### Task 10: 创建专栏文章阅读页

**Files:**
- Create: `src/pages/columns/[slug]/[article].astro`

- [ ] **Step 1: 创建 `src/pages/columns/[slug]/[article].astro`**

```astro
---
import { render } from 'astro:content';
import ArticleHero from '../../../components/site/ArticleHero.astro';
import ArticlePager from '../../../components/site/ArticlePager.astro';
import ArticleTocDrawer from '../../../components/site/ArticleTocDrawer.astro';
import ArticleTocRail from '../../../components/site/ArticleTocRail.astro';
import ColumnSidebar from '../../../components/site/ColumnSidebar.astro';
import SiteLayout from '../../../layouts/SiteLayout.astro';
import { siteConfig } from '../../../data/site';
import { dayjs, format } from '../../../utils/dayjs';
import { getColumns, getColumnArticle, type ColumnDetail } from '../../../utils/getColumns';

function toIsoString(value?: string | Date) {
  if (!value) return undefined;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export async function getStaticPaths() {
  const columns = await getColumns();
  const paths = [];

  for (const col of columns) {
    const { getColumnBySlug } = await import('../../../utils/getColumns');
    const detail = await getColumnBySlug(col.slug);
    if (!detail) continue;

    for (const article of detail.articles) {
      paths.push({
        params: { slug: col.slug, article: article.slug },
      });
    }
  }

  return paths;
}

const { slug, article: articleSlug } = Astro.params;
const detail = await getColumnArticle(slug!, articleSlug!);

if (!detail) {
  return Astro.redirect('/columns');
}

const { Content, headings } = await render(detail.content);
const filteredHeadings = headings.filter((h: { depth: number }) => h.depth >= 2 && h.depth <= 4);

const summary = detail.subtitle;
const publishedLabel = dayjs(detail.createdAt).format(format);
const articleIndex = detail.column.articles
  ? detail.column.articles.findIndex((a) => a.slug === articleSlug) + 1
  : 0;

const pageMeta = {
  title: `${detail.title} | ${detail.column.title} | ${siteConfig.name}`,
  description: summary || detail.column.description,
  ogType: 'article' as const,
  ogImage: siteConfig.articleOgImage,
  ...(detail.tags ? { tags: detail.tags } : {}),
  ...(toIsoString(detail.createdAt) ? { publishedTime: toIsoString(detail.createdAt) } : {}),
  ...(toIsoString(detail.updatedAt) ? { modifiedTime: toIsoString(detail.updatedAt) } : {}),
};
---

<SiteLayout pageMeta={pageMeta}>
  <article class="article-page-shell">
    <!-- 专栏归属提示 -->
    <div class="column-breadcrumb">
      <span class="column-breadcrumb-label">专栏</span>
      <a href={`/columns/${slug}`} class="column-breadcrumb-link">{detail.column.title}</a>
      <span class="column-breadcrumb-sep">·</span>
      <span>第 {articleIndex} 篇</span>
    </div>

    <ArticleHero
      title={detail.title}
      summary={summary}
      publishedLabel={publishedLabel}
      tags={detail.tags}
      poster={detail.poster}
    />

    <div class="article-layout">
      <div class="article-main-column">
        <ArticleTocDrawer headings={filteredHeadings} buttonLabel="目录" />

        <div class="article-body-surface">
          <div class="article-content">
            <Content />
          </div>
        </div>

        <ArticlePager
          prev={detail.prev ? { slug: `/columns/${slug}/${detail.prev.slug}`, title: detail.prev.title } : undefined}
          next={detail.next ? { slug: `/columns/${slug}/${detail.next.slug}`, title: detail.next.title } : undefined}
        />
      </div>

      <aside class="article-sidebar">
        <ColumnSidebar
          columnTitle={detail.column.title}
          columnSlug={slug!}
          columnStatus={detail.column.status}
          articles={detail.column.articles || []}
          currentArticleSlug={articleSlug!}
        />
        <div style="margin-top:0.75rem;">
          <ArticleTocRail headings={filteredHeadings} />
        </div>
      </aside>
    </div>
  </article>
</SiteLayout>

<style>
  .article-page-shell {
    display: grid;
    gap: 1.5rem;
    max-width: var(--shell-width);
    margin: 0 auto;
    padding: 0 0.75rem;
    align-items: start;
  }

  .column-breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.82rem;
    color: var(--text-muted);
  }

  .column-breadcrumb-label {
    color: var(--accent);
    font-weight: 600;
    font-size: 0.76rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .column-breadcrumb-link {
    color: var(--accent);
    text-decoration: none;
    font-weight: 500;
  }

  .column-breadcrumb-link:hover {
    text-decoration: underline;
  }

  .column-breadcrumb-sep {
    color: var(--surface-border);
  }

  .article-layout {
    display: grid;
    gap: 1.5rem;
    align-items: start;
  }

  .article-main-column {
    display: grid;
    gap: 1rem;
    min-width: 0;
  }

  .article-body-surface {
    border: 1px solid var(--surface-border);
    background: var(--surface-bg-strong);
    padding: 1.2rem;
    box-shadow: var(--shadow-soft);
  }

  .article-content {
    max-width: var(--reading-width);
    margin: 0 auto;
    color: var(--text-strong);
    font-size: 1rem;
    line-height: 1.9;
  }

  .article-content :global(h2),
  .article-content :global(h3),
  .article-content :global(h4),
  .article-content :global(h5) {
    margin-top: 2.6rem;
    margin-bottom: 0.9rem;
    color: var(--text-strong);
    line-height: 1.25;
    letter-spacing: -0.03em;
  }

  .article-content :global(h2) {
    font-size: clamp(1.6rem, 1.2rem + 1vw, 2.25rem);
  }

  .article-content :global(h3) {
    font-size: clamp(1.3rem, 1.15rem + 0.6vw, 1.7rem);
  }

  .article-content :global(p),
  .article-content :global(ul),
  .article-content :global(ol),
  .article-content :global(blockquote),
  .article-content :global(pre),
  .article-content :global(table) {
    margin-block: 1rem;
  }

  .article-content :global(ul),
  .article-content :global(ol) {
    padding-left: 1.4rem;
  }

  .article-content :global(li) {
    margin-block: 0.45rem;
  }

  .article-content :global(a) {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }

  .article-content :global(img) {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .article-content :global(blockquote) {
    border-left: 3px solid var(--accent);
    margin-inline: 0;
    padding: 0.2rem 0 0.2rem 1rem;
    color: var(--text-muted);
  }

  .article-content :global(code):not(:global(pre code)) {
    border: 1px solid var(--surface-border);
    background: var(--accent-soft);
    padding: 0.15rem 0.35rem;
    font-size: 0.9em;
  }

  .article-content :global(pre) {
    overflow-x: auto;
    border: 1px solid var(--surface-border);
    background: rgba(15, 23, 42, 0.96);
    padding: 1rem;
    color: #f8fafc;
  }

  .article-content :global(pre.mermaid) {
    background: transparent;
    border: none;
    color: inherit;
    overflow: visible;
  }

  .article-content :global(pre code) {
    display: block;
    min-width: max-content;
    background: transparent;
    padding: 0;
    color: inherit;
  }

  .article-content :global(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95em;
  }

  .article-content :global(th),
  .article-content :global(td) {
    border: 1px solid var(--surface-border);
    padding: 0.5rem 0.75rem;
    text-align: left;
  }

  .article-content :global(th) {
    background: var(--accent-soft);
    font-weight: 600;
    font-family: var(--font-sans);
  }

  .article-content :global(tr:nth-child(even) td) {
    background: var(--accent-soft);
  }

  .article-content :global(hr) {
    border: 0;
    border-top: 1px solid var(--surface-border);
    margin: 2.5rem 0;
  }

  @media (min-width: 1024px) {
    .article-layout {
      grid-template-columns: minmax(0, 1fr) 17rem;
    }

    .article-sidebar {
      display: block;
      position: sticky;
      top: 6.5rem;
      align-self: start;
      max-height: calc(100vh - 7.5rem);
      overflow-y: auto;
      overflow-x: hidden;
    }
  }

  @media (min-width: 1200px) {
    .article-body-surface {
      padding: 1.6rem;
    }
  }

  @media (max-width: 767px) {
    .article-page-shell {
      padding: 0 0.5rem;
    }

    .article-body-surface {
      padding: 1rem;
    }

    .article-content {
      font-size: 0.97rem;
    }
  }
</style>
```

> **注意：** ArticlePager 组件的 `prev`/`next` prop 中 `slug` 字段现在传入完整路径（如 `/columns/deerflow-architecture/01-overview`）。需确认 ArticlePager 内部是否拼接了 `/blogs/` 前缀。如果是，需要修改 ArticlePager 使其接受完整 URL，或为专栏文章创建一个新的分页组件。

- [ ] **Step 2: 检查 ArticlePager 组件的链接逻辑**

查看 `src/components/site/ArticlePager.astro` 第 13 行和第 19 行，当前链接格式为 `/blogs/${prev.slug}`。专栏文章需要不同的前缀。

**修改 `src/components/site/ArticlePager.astro`**，将 `href` 改为直接使用传入的 `slug`（当它是完整路径时）：

将 Props 接口改为接受完整 URL：

```typescript
interface Props {
  prev?: { slug: string; title: string } | undefined;
  next?: { slug: string; title: string } | undefined;
}
```

将第 13 行的 `href={/blogs/${prev.slug}}` 改为：

```astro
href={prev.slug.startsWith('/') ? prev.slug : `/blogs/${prev.slug}`}
```

将第 19 行的 `href={/blogs/${next.slug}}` 改为：

```astro
href={next.slug.startsWith('/') ? next.slug : `/blogs/${next.slug}`}
```

- [ ] **Step 3: 验证文章阅读页**

Run: `cd D:\project\ginlon-site && pnpm dev`
Expected: 访问 `http://localhost:4321/columns/deerflow-architecture/01-overview` 能看到文章阅读页，包含专栏归属提示、侧边栏专栏目录、上下篇导航

- [ ] **Step 4: 提交**

```bash
git add src/pages/columns/ src/components/site/ArticlePager.astro
git commit -m "feat(columns): add column article reading page with sidebar navigation"
```

---

### Task 11: 修改写作页集成专栏

**Files:**
- Modify: `src/pages/writing/index.astro`

- [ ] **Step 1: 在 `writing/index.astro` 中新增专栏区域**

在 frontmatter 中导入专栏数据：

```typescript
import ColumnCard from '../../components/site/ColumnCard.astro';
import { getColumns } from '../../utils/getColumns';

const columns = await getColumns();
```

在 `<SiteLayout>` 内部、`<PageSection>` 中的 `<SectionHeading>` 之后、`<ArticleList>` 之前，插入专栏区域：

```astro
<!-- 专栏区域 -->
{columns.length > 0 && (
  <div class="columns-section">
    <div class="columns-section-header">
      <h3 class="columns-section-title">技术专栏</h3>
      <a href="/columns" class="columns-section-link">查看全部 →</a>
    </div>
    <div class="columns-scroll">
      {columns.map((column) => (
        <div class="columns-scroll-item">
          <ColumnCard column={column} compact={true} />
        </div>
      ))}
    </div>
  </div>
)}
```

在文件底部（`</SiteLayout>` 之后）添加 scoped styles：

```astro
<style>
  .columns-section {
    margin-bottom: 1.5rem;
  }

  .columns-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .columns-section-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-strong);
  }

  .columns-section-link {
    color: var(--accent);
    font-size: 0.85rem;
    text-decoration: none;
    font-weight: 500;
  }

  .columns-section-link:hover {
    text-decoration: underline;
  }

  .columns-scroll {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    -webkit-overflow-scrolling: touch;
  }

  .columns-scroll-item {
    min-width: 15rem;
    flex-shrink: 0;
  }
</style>
```

- [ ] **Step 2: 验证写作页专栏区域**

Run: `cd D:\project\ginlon-site && pnpm dev`
Expected: 访问 `http://localhost:4321/writing` 能看到顶部的专栏横向滚动区域和下方的博客列表

- [ ] **Step 3: 提交**

```bash
git add src/pages/writing/index.astro
git commit -m "feat(columns): integrate column cards into writing page"
```

---

### Task 12: 全流程验证与构建测试

**Files:**
- 无新增/修改

- [ ] **Step 1: 运行完整构建测试**

Run: `cd D:\project\ginlon-site && pnpm build`
Expected: 构建成功，无错误。输出静态文件中包含 `/columns/index.html`、`/columns/deerflow-architecture/index.html`、`/columns/deerflow-architecture/01-overview/index.html`

- [ ] **Step 2: 预览构建结果**

Run: `cd D:\project\ginlon-site && pnpm preview`
Expected: 本地预览服务器启动，所有页面可正常访问

- [ ] **Step 3: 验证以下页面均正常**

| 页面 | URL | 预期 |
|------|-----|------|
| 专栏列表 | `/columns` | 显示专栏卡片网格 |
| 专栏详情 | `/columns/deerflow-architecture` | 显示 Hero + 文章目录 |
| 文章阅读 | `/columns/deerflow-architecture/01-overview` | 显示文章正文 + 侧边栏专栏目录 |
| 写作页 | `/writing` | 顶部专栏区域 + 博客列表 |
| 导航 | 全局 | 导航栏显示"首页"、"写作"、"专栏" |
| 博客详情 | `/blogs/xxx` | 原有功能不受影响 |

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "feat(columns): complete column feature implementation"
```
