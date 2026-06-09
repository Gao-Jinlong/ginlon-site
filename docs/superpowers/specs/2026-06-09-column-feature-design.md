# 专栏功能设计文档

**日期：** 2026-06-09
**状态：** 已确认

## 概述

为博客站点新增"专栏"功能，支持将多篇关联博客文章组织为一个技术系列，提供有序阅读体验。专栏是博客文章的可选上级分组，独立文章不受影响。

## 需求决策记录

| 决策项 | 选择 |
|--------|------|
| 组织粒度 | 技术专栏，有明确阅读顺序 |
| 与博客关系 | 专栏是博客的可选分组层，一篇文章最多属于一个专栏 |
| 排序方式 | 手动 order 字段覆盖 createdAt，未指定 order 的按时间排序 |
| 专栏元信息 | 封面图、描述/简介、状态（连载中/已完结） |
| 文章导航 | 侧边栏专栏目录，当前文章高亮 |
| 专栏入口 | 独立 `/columns` 页面（导航栏入口）+ `/writing` 页面展示专栏卡片 |
| 博客列表 | 专栏内文章不在 `/writing` 博客列表中单独出现 |
| 数据存储 | 专栏定义与文章在同一目录中 |

## 数据结构

### 目录结构

```
src/content/columns/
  langgraph-learning/
    index.md                    ← 专栏定义（frontmatter 元信息）
    01-introduction/
      index.mdx                 ← 第 1 篇文章
    02-core-concepts/
      index.mdx                 ← 第 2 篇文章
    ...
  rust-from-zero/
    index.md
    01-setup/index.mdx
    ...

src/content/blogs/zh/           ← 独立博客文章（不变）
  CSP内容安全/index.mdx
  websocket入门/index.mdx
  ...
```

### 专栏定义 Schema

文件：`src/content/columns/<slug>/index.md`

```yaml
---
title: 'LangGraph 学习之路'
description: '从零开始学习 LangGraph 框架，构建 AI Agent 应用'
poster: 'https://images.unsplash.com/...'
status: 'ongoing'        # 'ongoing' | 'completed'
draft: false
---
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 专栏标题 |
| description | string | 是 | 专栏描述 |
| poster | string | 否 | 封面图 URL |
| status | 'ongoing' \| 'completed' | 否，默认 'ongoing' | 专栏状态 |
| draft | boolean | 否，默认 false | 草稿，仅开发环境可见 |

### 专栏文章 Schema

文件：`src/content/columns/<slug>/<article-slug>/index.mdx`

```yaml
---
title: 'LangGraph 简介'
subtitle: '认识 AI Agent 框架'
poster: 'https://images.unsplash.com/...'
createdAt: '2026-06-01 10:00:00 +08:00'
tags: ['AI', 'LangGraph']
order: 1
draft: false
---
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 文章标题 |
| subtitle | string | 否 | 副标题 |
| poster | string | 否 | 封面图 URL |
| createdAt | string | 是 | 创建时间 |
| updatedAt | string | 否 | 更新时间 |
| tags | string[] | 否，默认 [] | 文章标签 |
| order | number | 否 | 手动排序序号，未指定则按 createdAt 排序 |
| draft | boolean | 否，默认 false | 草稿 |

### 内容集合配置

在 `src/content.config.ts` 中新增两个集合：

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

### 文章归属逻辑

通过文件路径自动解析文章所属专栏：

- 路径 `columns/langgraph-learning/01-intro/index.mdx`
- 解析：专栏 slug = `langgraph-learning`，文章 slug = `01-intro`
- 文章 URL = `/columns/langgraph-learning/01-intro`

### 排序逻辑

1. 有 `order` 字段的文章按 `order` 升序排列
2. 没有 `order` 的文章按 `createdAt` 升序排列
3. 有 `order` 的排在没 `order` 的前面

## 路由设计

### 新增页面

| 路由 | 文件 | 功能 |
|------|------|------|
| `/columns` | `src/pages/columns/index.astro` | 专栏列表页 |
| `/columns/[slug]` | `src/pages/columns/[slug].astro` | 专栏详情页 |
| `/columns/[slug]/[article]` | `src/pages/columns/[slug]/[article].astro` | 文章阅读页 |

### 页面内容

**`/columns` 专栏列表页：**
- 网格布局展示所有专栏卡片
- 每张卡片：封面图、标题、描述、状态标签（连载中/已完结）、文章数量
- 点击卡片进入 `/columns/[slug]`

**`/columns/[slug]` 专栏详情页：**
- 顶部：专栏封面图 + 标题 + 描述 + 状态
- 主体：有序文章列表（编号 + 标题 + 日期 + 摘要）
- 草稿文章不显示，不参与排序编号

**`/columns/[slug]/[article]` 文章阅读页：**
- 复用 `SiteLayout` 布局
- 文章顶部提示："本文属于专栏《xxx》第 N 篇"
- 右侧侧边栏：专栏目录，当前文章高亮，可点击跳转
- 文章底部：上一篇/下一篇导航

### 现有页面改动

**`/writing` 页面：**
- 在博客列表上方新增"技术专栏"区域
- 横向滚动展示专栏卡片（封面缩略图 + 标题 + 文章数 + 状态）
- 点击跳转 `/columns/[slug]`
- "查看全部"链接跳转 `/columns`
- 专栏内文章不出现在博客列表中

**导航栏：**
- `SiteHeader` 新增"专栏"链接，指向 `/columns`
- 导航顺序：首页 → 写作 → 专栏

## 工具函数

### `src/utils/getColumns.ts`

```typescript
getColumns()                    → Column[]
  // 获取所有专栏，含文章数量统计
  // 生产环境过滤 draft 专栏和 draft 文章

getColumnBySlug(slug)           → ColumnDetail | undefined
  // 获取单个专栏详情 + 排序后的文章列表

getColumnArticle(slug, article) → ColumnArticleDetail | undefined
  // 获取专栏内指定文章 + 上下篇信息（prev/next）
```

### 类型定义

```typescript
interface Column {
  slug: string;
  title: string;
  description: string;
  poster?: string;
  status: 'ongoing' | 'completed';
  articleCount: number;
}

interface ColumnDetail extends Column {
  articles: ColumnArticle[];
}

interface ColumnArticle {
  slug: string;
  fullSlug: string;        // "langgraph-learning/01-intro"
  title: string;
  subtitle?: string;
  createdAt: string;
  tags: string[];
  order?: number;
  summary: string;
}

interface ColumnArticleDetail extends ColumnArticle {
  content: any;             // MDX 渲染内容
  column: Column;           // 所属专栏信息
  prev?: ColumnArticle;     // 上一篇
  next?: ColumnArticle;     // 下一篇
}
```

## 组件清单

### 新增组件

| 组件 | 类型 | 文件 | 用途 |
|------|------|------|------|
| `ColumnCard.astro` | Astro | `src/components/site/ColumnCard.astro` | 专栏卡片（封面+标题+描述+状态+文章数） |
| `ColumnList.vue` | Vue | `src/components/site/ColumnList.vue` | `/writing` 页面的专栏横向滚动区域 |
| `ColumnSidebar.astro` | Astro | `src/components/site/ColumnSidebar.astro` | 文章阅读页的侧边栏专栏目录 |
| `ArticleNav.astro` | Astro | `src/components/site/ArticleNav.astro` | 文章底部上一篇/下一篇导航 |

### 修改的组件

| 组件 | 改动 |
|------|------|
| `SiteHeader.astro` | 导航栏新增"专栏"链接 |
| `writing/index.astro` | 新增专栏区域，引入 ColumnList.vue |
| `i18n/common/zh.json` | 新增专栏相关翻译文案 |

## 边界情况

### 草稿处理

- 专栏 `draft: true` → 仅开发环境可见，不生成详情页和文章页路由
- 文章 `draft: true` → 不显示在专栏目录中，不参与排序编号
- 生产构建时过滤所有草稿内容

### 空状态

- 专栏没有文章 → 详情页显示"即将更新"占位提示，不生成文章路由
- 没有任何专栏 → `/writing` 不显示专栏区域，`/columns` 显示空状态提示
- 导航栏"专栏"链接始终保留

### SEO

- 专栏列表页：独立 title / description / og 标签
- 专栏详情页：使用专栏的 title + description
- 文章阅读页：使用文章的 title，og 标签附加专栏名称

### 现有内容迁移

- 已有的系列文章（如 DeerFlow 架构分析）可手动迁移到 `columns` 目录
- 迁移后删除 `blogs` 中的原文章，避免重复
- 无需自动化迁移工具

## 不做的事（YAGNI）

- ❌ 专栏级别标签系统（已有文章级别标签）
- ❌ 专栏订阅 / RSS
- ❌ 专栏评论功能
- ❌ 多语言专栏（当前只有中文）
