# Ginlon Site Rebuild 开发记录

**开发日期**: 2026-03-27 ~ 2026-03-30
**开发阶段**: Phase A — 全站重建
**提交范围**: `e2e2f81..dbe4c66` (codex/site-rebuild 分支)

---

## 一、开发摘要

### 1.1 完成的功能模块

| 模块 | 状态 | 说明 |
|------|------|------|
| 路由/SEO/国际化基线 | ✅ | 简化 AppLocale 为 zh-only，移除双语 alternates |
| 文章数据标准化 | ✅ | 统一 getBlogs/getTags 返回中文文章标准形状 |
| 编辑站点 Shell | ✅ | SiteLayout + SiteHeader + SiteFooter + 主题系统 |
| 首页重建 | ✅ | 作者落地页：hero + 精选写作 + 当前关注 + 关于预览 |
| 写作归档页 | ✅ | `/writing` 按时间线展示，支持 tag 筛选 |
| 文章阅读页 | ✅ | 居中阅读体验，桌面 TOC 侧栏 + 移动端抽屉 |
| 关于页重建 | ✅ | 作者页风格，非简历展示 |
| 遗留路由重定向 | ✅ | `/en/*`、`/resume`、`/techStack`、`/blogs`、`/tags*` 全部重定向 |
| 死代码清理 | ✅ | 删除 30+ 遗留组件/布局/数据模块 |

### 1.2 统计数据

- **新增文件**: 18 个（组件、页面、测试）
- **删除文件**: 46 个（遗留组件、布局、数据、国际化）
- **净代码变更**: +2,237 行 / -4,384 行（净减 ~2,100 行）
- **测试文件**: 9 个
- **测试用例**: 26 个全部通过
- **构建输出**: 188 页面

---

## 二、架构设计

### 2.1 整体架构

重建采用「新展示层 + 现有内容资产」的策略：

```
┌─────────────────────────────────────────────┐
│                  Pages                       │
│  index.astro / writing / blogs/[slug]        │
│  about.astro / resume → redirect             │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│             SiteLayout                       │
│  (HTML head + Header + <slot/> + Footer)     │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│         Editorial Components                 │
│  ArticleHero / ArticleCard / ArticlePager    │
│  ArticleTocRail / ArticleTocDrawer           │
│  PageSection / SectionHeading / TagFilterBar │
│  RedirectPage                                │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│          Data Layer (复用)                    │
│  getBlogs / getTags / seo / dayjs            │
│  content.config.ts / site.ts                 │
└─────────────────────────────────────────────┘
```

### 2.2 关键架构决策

1. **Inline Head 组件**: 将 Head.astro 的 `<head>` 内容内联到 SiteLayout.astro，避免独立组件的维护负担
2. **AppLocale 单语言**: `type AppLocale = 'zh'`，移除所有英文相关类型和运行时逻辑
3. **CSS Custom Properties 作为设计令牌**: 使用 `--accent`、`--page-bg`、`--reading-width` 等变量而非 Tailwind utility 类
4. **RedirectPage 组件**: 使用 `<meta http-equiv="refresh">` + `<link rel="canonical">` 实现静态重定向，兼容 SSG
5. **content schema 简化**: 移除 `layout` 字段，`category` 改为可选带默认值

### 2.3 路由设计

| 路由 | 类型 | 说明 |
|------|------|------|
| `/` | 页面 | 作者落地页 |
| `/writing` | 页面 | 文章归档（支持 `?tag=` 筛选） |
| `/about` | 页面 | 作者介绍页 |
| `/blogs/[slug]` | 页面 | 文章阅读页 |
| `/blogs` | 重定向 | → `/writing` |
| `/resume` | 重定向 | → `/about` |
| `/techStack` | 重定向 | → `/writing` |
| `/tags` | 重定向 | → `/writing` |
| `/tags/[tag]` | 重定向 | → `/writing?tag=<tag>` |
| `/en/*` | 重定向 | → 对应中文路由 |

---

## 三、核心模块详解

### 3.1 SiteLayout.astro

全站共享布局，包含：
- HTML `<head>` 全部 SEO 元数据（从已删除的 Head.astro 内联而来）
- ClientRouter (Astro View Transitions)
- Google Fonts (Inter)
- Clarity 分析脚本
- SiteHeader（3 项导航：首页/写作/关于）
- `<slot/>` 插入页面内容
- SiteFooter
- 跳到正文的无障碍链接

### 3.2 文章阅读体验

`/blogs/[slug]` 页面结构：
```
article-page-shell
├── ArticleHero（标题、摘要、日期、标签、封面）
└── article-layout
    ├── article-main-column
    │   ├── ArticleTocDrawer（移动端按需打开）
    │   ├── article-body-surface
    │   │   ├── article-content（MDX 渲染内容）
    │   │   └── 最后更新 footer
    │   └── ArticlePager（上/下篇导航）
    └── article-sidebar
        └── ArticleTocRail（桌面端 sticky 目录）
```

### 3.3 RedirectPage.astro

静态重定向组件，用于所有遗留路由：
- `<meta http-equiv="refresh">` 实现客户端重定向
- `<link rel="canonical">` 指向目标页
- `<meta name="robots" content="noindex, nofollow">` 阻止索引
- `lang="zh"` 标记语言

---

## 四、代码审查修复

在完成 8 个实施任务后，进行了代码审查并修复了 5 个问题：

1. **移除遗留死代码** — 删除 Head.astro、Blog.astro、Main.astro 等 30+ 文件
2. **简化 AppLocale** — dayjs、site config、i18n utils 全部移除 en 支持
3. **category 可选化** — content schema 中 `category` 添加 `.default('tech')`
4. **datetime 属性** — `<time>` 元素添加 ISO datetime 属性
5. **RedirectPage lang** — 添加 `lang="zh"` 属性

---

## 五、测试覆盖

| 测试文件 | 测试数 | 覆盖范围 |
|---------|--------|---------|
| getBlogs.test.ts | 4 | 文章排序、草稿排除、摘要回退 |
| getTags.test.ts | 3 | 标签聚合、排序 |
| seo.test.ts | 7 | canonical URL、alternates、metadata 合并 |
| site-shell.test.ts | 1 | 导航仅包含首页/写作/关于 |
| head.test.ts | 1 | en 路由重定向验证 |
| resume.test.ts | 1 | resume 重定向验证 |
| resume-page.test.ts | 2 | redirect page 组件行为 |
| article-toc.test.ts | 3 | TOC 组件渲染和 SiteLayout 集成 |
| home-writing-pages.test.ts | 4 | 首页和写作归档页内容验证 |
