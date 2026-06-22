# 写作页专栏混排与标签侧栏 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 写作页（`/writing`）将专栏文章与博客按时间混排展示、移除独立专栏入口，并把标签栏改为桌面侧栏 + 窄屏折叠按钮的布局。

**Architecture:** 在 `writing/index.astro` 服务端合并 `getBlogs` 与 `getColumns`/`getColumnBySlug` 两个数据源为统一 `Article[]`，新增 `source/columnTitle/columnSlug` 字段；`ArticleList.vue` 据此渲染专栏徽章，并把标签筛选区改造为响应式两栏布局。

**Tech Stack:** Astro 5、Vue 3（`client:only="vue"`）、TypeScript、原生 CSS（scoped）、vitest。

## Global Constraints

- 包管理器使用 `pnpm`（v10.20.0），所有命令用 `pnpm`。
- 标签 slug 统一使用 `src/utils/getTags.ts` 的 `tagToSlug()`，不得重复实现该逻辑。
- 不改动 `/columns`、`/columns/[slug]`、`/columns/[slug]/[article]` 专栏页面及专栏数据结构。
- 不涉及英文站 `/en/blogs`。
- 主题色变量沿用：`var(--accent)`、`var(--accent-soft)`、`var(--surface-border)`、`var(--text-strong)`、`var(--text-muted)`、`var(--surface-bg-strong)`、`var(--radius-m)`。
- 构建验证命令为 `pnpm build`（含 `astro check` 类型检查）。

---

## File Structure

- `src/pages/writing/index.astro` —— 修改：合并数据源、移除专栏入口区块及样式、复用 `tagToSlug`。
- `src/components/site/ArticleList.vue` —— 修改：`Article` 接口扩展、专栏徽章、标签侧栏/折叠布局、`tagsExpanded` 状态。
- `src/utils/getColumns.ts` —— 只读复用（`getColumns`、`getColumnBySlug`）。
- `src/utils/getTags.ts` —— 只读复用（`tagToSlug`）。

无新增测试文件（改动集中在 Astro 页面数据组装与 Vue 组件 UI，项目现有无对应单测；验证以 `pnpm build` + 目视为准）。

---

### Task 1: 写作页数据层合并专栏文章与博客

**Files:**
- Modify: `src/pages/writing/index.astro:1-58`（frontmatter 数据组装 + 模板专栏区块）
- Read: `src/utils/getColumns.ts`、`src/utils/getTags.ts`、`src/components/site/ArticleList.vue`

**Interfaces:**
- Consumes:
  - `getBlogs(locale: AppLocale)` → `Blog[]`，其中每项含 `slug`、`title`、`summary`、`publishedAt`、`tags: string[]`、`data.permalink`。
  - `getColumns()` → `Column[]`（含 `slug`、`title`）。
  - `getColumnBySlug(slug: string)` → `ColumnDetail | undefined`，其 `articles: ColumnArticle[]`，每项含 `slug`、`title`、`summary`、`createdAt`、`tags: string[]`。
  - `tagToSlug(tag: string)` → `string`（来自 `src/utils/getTags.ts`）。
- Produces: 传给 `<ArticleList>` 的 `articles` 数组，每项形如：
  ```ts
  {
    slug: string;
    title: string;
    summary: string;
    publishedAt: string;
    tags: string[];
    tagSlugs: string[];
    permalink: string;
    source: 'blog' | 'column';
    columnTitle?: string;
    columnSlug?: string;
  }
  ```

- [ ] **Step 1: 改写 frontmatter 数据组装**

将 [src/pages/writing/index.astro](src/pages/writing/index.astro) 顶部 frontmatter（第 1–35 行）替换为：

```astro
---
import PageSection from '../../components/site/PageSection.astro';
import SectionHeading from '../../components/site/SectionHeading.astro';
import ArticleList from '../../components/site/ArticleList.vue';
import SiteLayout from '../../layouts/SiteLayout.astro';
import dayjs from 'dayjs';
import { getBlogs } from '../../utils/getBlogs';
import { getColumns, getColumnBySlug } from '../../utils/getColumns';
import { tagToSlug } from '../../utils/getTags';

const blogs = await getBlogs('zh');
const columns = await getColumns();
const selectedTag = new URL(Astro.url).searchParams.get('tag')?.trim() ?? '';

// 普通博客 → 统一列表项
const blogItems = blogs.map((article) => ({
  slug: article.slug,
  title: article.title,
  summary: article.summary,
  publishedAt: article.publishedAt,
  tags: article.tags ?? [],
  tagSlugs: (article.tags ?? []).map(tagToSlug),
  permalink: `/blogs/${article.data.permalink}`,
  source: 'blog' as const,
}));

// 专栏文章 → 统一列表项（带专栏来源）
const columnItems = (
  await Promise.all(
    columns.map(async (column) => {
      const detail = await getColumnBySlug(column.slug);
      if (!detail) return [];
      return detail.articles.map((article) => ({
        slug: article.slug,
        title: article.title,
        summary: article.summary,
        publishedAt: article.createdAt,
        tags: article.tags ?? [],
        tagSlugs: (article.tags ?? []).map(tagToSlug),
        permalink: `/columns/${column.slug}/${article.slug}`,
        source: 'column' as const,
        columnTitle: column.title,
        columnSlug: column.slug,
      }));
    }),
  )
).flat();

// 合并并按发布时间倒序
const articlesData = [...blogItems, ...columnItems].sort(
  (a, b) => dayjs(b.publishedAt).valueOf() - dayjs(a.publishedAt).valueOf(),
);

const pageMeta = {
  title: '写作归档 | Ginlon',
  description: selectedTag
    ? `当前标签：${selectedTag}，共 ${articlesData.filter((a) => a.tagSlugs.includes(selectedTag)).length} 篇。`
    : '按时间倒序归档的全部文章，可按标签过滤。',
};
---
```

- [ ] **Step 2: 移除模板中的专栏入口区块**

将模板部分（原第 38–58 行）替换为（删除 `.columns-section` 整块，仅保留标题与列表）：

```astro
<SiteLayout pageMeta={pageMeta}>
  <PageSection narrow={false} id="writing-archive">
    <SectionHeading eyebrow="写作归档" title="全部文章" description={pageMeta.description} />
    <ArticleList client:only="vue" articles={articlesData} initialTag={selectedTag} />
  </PageSection>
</SiteLayout>
```

- [ ] **Step 3: 删除专栏入口相关样式**

删除 `<style>` 块中全部规则（`.columns-section`、`.columns-section-header`、`.columns-section-title`、`.columns-section-link`、`.columns-scroll`、`.columns-scroll-item`）。该页 `<style>` 块若清空则整块移除。确认 `ColumnCard` 的 import 已在 Step 1 中删除（不再使用）。

- [ ] **Step 4: 构建验证**

Run: `pnpm build`
Expected: `astro check` 无类型错误，构建成功。若 `ColumnCard`/`getColumns` 等遗留未用 import 报错，按提示删除。

- [ ] **Step 5: 目视验证（开发服务器）**

Run: `pnpm dev`，浏览器打开 `/writing`
Expected:
- 页面顶部不再有"技术专栏"横滑卡片入口。
- 文章列表中专栏文章与博客按时间混排（专栏文章此时尚无徽章，Task 2 处理）。
- 点击专栏文章跳转到 `/columns/<专栏>/<文章>`。

- [ ] **Step 6: Commit**

```bash
git add src/pages/writing/index.astro
git commit -m "feat(writing): 专栏文章混排进写作列表并移除专栏入口"
```

---

### Task 2: ArticleList 专栏徽章 + 接口扩展

**Files:**
- Modify: `src/components/site/ArticleList.vue:26-50`（模板卡片）、`60-90`（`Article` 接口）、`<style>` 末尾追加徽章样式

**Interfaces:**
- Consumes: Task 1 产出的 `articles` 项含 `source`、`columnTitle`、`columnSlug`。
- Produces: 渲染层行为，无对外导出变化。

- [ ] **Step 1: 扩展 `Article` 接口**

在 [src/components/site/ArticleList.vue](src/components/site/ArticleList.vue) 的 `interface Article`（第 63–71 行）末尾追加三个字段：

```ts
interface Article {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  tags: string[];
  tagSlugs: string[];
  permalink: string;
  source: 'blog' | 'column';
  columnTitle?: string;
  columnSlug?: string;
}
```

- [ ] **Step 2: 卡片中添加专栏徽章**

在模板 `<article>` 内、`<a class="article-main-link">` 之前插入徽章（仅专栏文章显示）：

```vue
<a
  v-if="article.source === 'column' && article.columnSlug"
  :href="`/columns/${article.columnSlug}`"
  class="article-column-badge"
>
  专栏 · {{ article.columnTitle }}
</a>
<a :href="article.permalink" class="article-main-link">
  <h3 class="article-card-title">{{ article.title }}</h3>
</a>
```

- [ ] **Step 3: 添加徽章样式**

在 `<style scoped>` 末尾（`.empty-state` 之后）追加：

```css
.article-column-badge {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.18rem 0.6rem;
  font-size: 0.76rem;
  font-weight: 500;
  color: var(--accent);
  background: var(--accent-soft);
  text-decoration: none;
}

.article-column-badge:hover {
  text-decoration: underline;
}
```

- [ ] **Step 4: 修正卡片 key（避免博客与专栏 slug 冲突）**

将文章列表 `v-for` 的 `:key="article.slug"`（第 30 行）改为 `:key="article.permalink"`（permalink 全局唯一）。

- [ ] **Step 5: 构建验证**

Run: `pnpm build`
Expected: 类型检查与构建通过。

- [ ] **Step 6: 目视验证**

Run: `pnpm dev`，打开 `/writing`
Expected: 专栏文章卡片标题上方显示"专栏 · <专栏名>"圆角徽章；点击徽章跳转 `/columns/<专栏>`；博客文章无徽章。

- [ ] **Step 7: Commit**

```bash
git add src/components/site/ArticleList.vue
git commit -m "feat(writing): 专栏文章卡片显示来源徽章"
```

---

### Task 3: 标签栏侧边栏布局 + 窄屏折叠

**Files:**
- Modify: `src/components/site/ArticleList.vue`（模板筛选栏结构、`<script setup>` 新增状态、`<style>` 布局）

**Interfaces:**
- Consumes: 现有 `uniqueTags`、`currentTag`、`handleTagClick`（不变）。
- Produces: 新增响应式状态 `tagsExpanded: Ref<boolean>` 与 computed `currentTagLabel: string`，仅作用于组件内部。

- [ ] **Step 1: 改造筛选栏模板结构**

将模板顶部的 `<nav class="tag-filter-bar">…</nav>`（第 3–22 行）替换为侧栏容器结构：

```vue
<aside class="tag-sidebar">
  <button
    type="button"
    class="tag-toggle"
    :aria-expanded="tagsExpanded"
    @click="tagsExpanded = !tagsExpanded"
  >
    <span>标签筛选：{{ currentTagLabel }}</span>
    <span class="tag-toggle-icon">{{ tagsExpanded ? '⌃' : '⌄' }}</span>
  </button>
  <p class="tag-sidebar-title">标签筛选</p>
  <nav
    class="tag-filter-bar"
    :class="{ 'tag-filter-bar-collapsed': !tagsExpanded }"
    aria-label="文章标签筛选"
  >
    <a
      href="/writing"
      :class="['tag-link', { 'tag-link-active': !currentTag }]"
      @click.prevent="handleTagClick('')"
    >
      全部文章
    </a>
    <a
      v-for="tag in uniqueTags"
      :key="tag.slug"
      :href="`/writing?tag=${encodeURIComponent(tag.slug)}`"
      :class="['tag-link', { 'tag-link-active': currentTag === tag.slug }]"
      @click.prevent="handleTagClick(tag.slug)"
    >
      #{{ tag.name }}
      <span>{{ tag.count }}</span>
    </a>
  </nav>
</aside>
```

- [ ] **Step 2: 把列表包进右侧主区**

将原 `.article-list` 列表与 `.empty-state` 包进一个 `<div class="article-main">`，使根节点 `.article-list-wrapper` 下形成「侧栏 + 主区」两个直接子节点。最终结构：

```vue
<div class="article-list-wrapper">
  <aside class="tag-sidebar"> … </aside>
  <div class="article-main">
    <div class="article-list"> … </div>
    <p v-show="filteredArticles.length === 0" class="empty-state"> … </p>
  </div>
</div>
```

- [ ] **Step 3: 新增脚本状态**

在 `<script setup>` 中 `currentTag` 定义之后添加：

```ts
// 窄屏标签折叠状态（桌面端由 CSS 强制展开）
const tagsExpanded = ref(false);

// 折叠按钮上显示的当前标签文案
const currentTagLabel = computed(() => {
  if (!currentTag.value) return '全部';
  const found = uniqueTags.value.find((t) => t.slug === currentTag.value);
  return found ? `#${found.name}` : '全部';
});
```

（`ref`、`computed` 已在现有 import 中，无需改 import。）

- [ ] **Step 4: 点击标签后窄屏自动收起**

在 `handleTagClick` 函数体末尾追加一行，选完标签自动收起折叠面板：

```ts
function handleTagClick(tag: string) {
  const newUrl = tag
    ? `${window.location.pathname}?tag=${encodeURIComponent(tag)}`
    : window.location.pathname;
  history.pushState({ tag }, '', newUrl);
  currentTag.value = tag;
  updateDescription();
  tagsExpanded.value = false;
}
```

- [ ] **Step 5: 替换布局样式**

将 `<style scoped>` 中 `.article-list-wrapper` 与 `.tag-filter-bar` 相关规则替换为下列布局（其余 `.tag-link*`、`.article-card*` 样式保留）：

```css
.article-list-wrapper {
  display: grid;
  gap: 1.5rem;
}

/* 折叠按钮：默认（窄屏）显示 */
.tag-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.5rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-m);
  background: var(--surface-bg-strong);
  color: var(--text-strong);
  padding: 0.6rem 0.85rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.tag-toggle-icon {
  color: var(--text-muted);
}

/* 侧栏标题：默认（窄屏）隐藏 */
.tag-sidebar-title {
  display: none;
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-strong);
}

.tag-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 0.75rem;
}

/* 窄屏折叠：收起时隐藏标签列表 */
.tag-filter-bar-collapsed {
  display: none;
}

/* 桌面端：两栏 + sticky 侧栏 */
@media (min-width: 768px) {
  .article-list-wrapper {
    grid-template-columns: 13rem 1fr;
    align-items: start;
    gap: 2rem;
  }

  .tag-sidebar {
    position: sticky;
    top: 5rem;
  }

  .tag-toggle {
    display: none;
  }

  .tag-sidebar-title {
    display: block;
  }

  .tag-filter-bar {
    flex-direction: column;
    align-items: flex-start;
    margin-top: 0;
  }

  /* 桌面端始终展开，忽略折叠状态 */
  .tag-filter-bar-collapsed {
    display: flex;
  }
}
```

- [ ] **Step 6: 构建验证**

Run: `pnpm build`
Expected: 类型检查与构建通过。

- [ ] **Step 7: 目视验证（桌面 + 窄屏）**

Run: `pnpm dev`，打开 `/writing`
Expected:
- 桌面端（≥768px）：标签在左侧 sticky 侧栏纵向排列，标题"标签筛选"，无折叠按钮；滚动时侧栏跟随。
- 窄屏（<768px，用浏览器设备模拟）：标签收起为"标签筛选：全部 ⌄"按钮；点击展开标签列表，图标变 ⌃；选中某标签后按钮显示"标签筛选：#xxx"且面板自动收起。
- 标签筛选功能正常（含专栏文章标签），URL 同步、前进/后退正常。

- [ ] **Step 8: Commit**

```bash
git add src/components/site/ArticleList.vue
git commit -m "feat(writing): 标签栏改为桌面侧栏与窄屏折叠布局"
```

---

## Self-Review

**1. Spec coverage:**
- 第 1 节数据层混排 → Task 1 ✅（合并 + 按 `publishedAt` 倒序 + `source` 字段 + 复用 `tagToSlug`）。
- 第 2 节专栏徽章 → Task 2 ✅（`source==='column'` 显示徽章、链接 `/columns/{columnSlug}`、博客无徽章）。
- 第 3 节移除专栏入口 → Task 1 Step 2/3 ✅；侧栏布局 + 窄屏折叠 → Task 3 ✅。
- 风险节"key 唯一" → Task 2 Step 4 ✅（改用 `permalink`）；"tagSlugs 共享函数" → Task 1 复用 `tagToSlug` ✅。

**2. Placeholder scan:** 无 TBD/TODO；所有代码步骤含完整代码。

**3. Type consistency:** `source: 'blog' | 'column'`、`columnTitle`、`columnSlug` 在 Task 1（产出）与 Task 2（接口/消费）一致；`tagsExpanded`、`currentTagLabel` 在 Task 3 内定义并使用一致；`tagToSlug` 签名与 `getTags.ts` 一致。
