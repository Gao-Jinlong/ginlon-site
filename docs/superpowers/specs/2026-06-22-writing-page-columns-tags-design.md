# 写作页面优化设计：专栏文章混排与标签侧栏

日期：2026-06-22

## 背景与问题

写作页面（`/writing`）当前存在两个体验问题：

1. **专栏文章不在列表中**：页面顶部有一块独立的"技术专栏"横滑卡片入口，专栏内的文章（`columnArticles`）只能通过该入口进入专栏后查看，不出现在主文章列表里。读者无法在统一的时间线中看到全部内容。
2. **标签栏杂乱**：`ArticleList.vue` 把所有标签以 pill 形式 `flex-wrap` 平铺在列表顶部，标签数量一多就占据大片纵向空间，显得混乱。

## 目标

- 写作页面的文章列表中**混排显示专栏文章**，与普通博客按时间统一倒序排列。
- **移除**写作页顶部的专栏横滑入口（`/columns` 独立页面保留）。
- 标签栏改为**桌面端侧边栏 + 窄屏折叠按钮**的布局，更整洁。

## 非目标

- 不改动 `/columns`、`/columns/[slug]`、`/columns/[slug]/[article]` 等专栏页面本身。
- 不改动专栏文章的内容结构、阅读体验或路由。
- 不涉及英文站（`/en/blogs`）的对应改造。
- 不做标签的搜索框、多选筛选等额外功能（YAGNI）。

## 涉及文件

- `src/pages/writing/index.astro` —— 数据合并、移除专栏入口区块
- `src/components/site/ArticleList.vue` —— 卡片徽章、标签侧栏布局
- 数据来源（只读，不改）：`src/utils/getBlogs.ts`、`src/utils/getColumns.ts`

---

## 第 1 节：数据层 —— 统一文章列表

在 `src/pages/writing/index.astro` 中合并两个数据源，喂给 `ArticleList.vue`。

### 数据结构

`ArticleList.vue` 的 `Article` 接口新增可选字段：

```ts
interface Article {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  tags: string[];
  tagSlugs: string[];
  permalink: string;
  source: 'blog' | 'column';   // 新增
  columnTitle?: string;        // 新增，仅 source==='column'
  columnSlug?: string;         // 新增，仅 source==='column'
}
```

### 数据组装逻辑（writing/index.astro）

1. **普通博客**：`getBlogs('zh')` 的结果映射为列表项，`source: 'blog'`，`permalink: /blogs/${article.data.permalink}`。保持现有 `tagSlugs` 生成逻辑（小写、空格转连字符、去除非字词字符）。
2. **专栏文章**：遍历 `getColumns()` 得到的每个专栏，调用 `getColumnBySlug(column.slug)` 取 `articles`，将每篇文章展开为列表项：
   - `slug`: 专栏文章的 `slug`
   - `title`、`summary`、`tags`: 取自专栏文章
   - `publishedAt`: 专栏文章的 `createdAt`
   - `tagSlugs`: 复用与博客相同的标签 slug 生成逻辑（抽成一个共享函数，避免重复）
   - `permalink`: `/columns/${column.slug}/${article.slug}`
   - `source: 'column'`、`columnTitle: column.title`、`columnSlug: column.slug`
3. **合并 + 排序**：两数组拼接后按 `publishedAt` 倒序排序（`dayjs(b).valueOf() - dayjs(a).valueOf()`），得到完全混排列表。
4. `pageMeta.description` 中"共 N 篇"的计数基于合并后的数组。

### 标签收集

`ArticleList.vue` 现有的 `uniqueTags` computed 会自动把专栏文章的 tags 一并统计，无需特殊改动。

---

## 第 2 节：卡片展示 —— 专栏徽章

在 `ArticleList.vue` 的文章卡片中，为专栏文章增加来源标记。

- 当 `article.source === 'column'` 时，在卡片标题上方显示徽章：`专栏 · {columnTitle}`（例：`专栏 · LangGraph 实战`）。
- 徽章为可点击链接，跳转到该专栏首页 `/columns/{columnSlug}`，方便读者查看整个专栏。
- 徽章样式：小号字、`var(--accent-soft)` 背景、`var(--accent)` 文字、圆角 pill。
- 普通博客（`source === 'blog'`）不显示徽章，外观与当前一致。
- 卡片其余部分（标题、日期、摘要、文章标签）两类共用同一布局，不变。

---

## 第 3 节：标签栏 —— 侧边栏布局 + 移除专栏入口

### 移除专栏入口（writing/index.astro）

删除顶部"技术专栏"横滑卡片整块：

- 模板中 `{columns.length > 0 && (...)}` 的 `.columns-section` 区块。
- 对应的 `.columns-section`、`.columns-section-header`、`.columns-section-title`、`.columns-section-link`、`.columns-scroll`、`.columns-scroll-item` 样式。
- `ColumnCard` 组件 import（若该页不再使用）。
- `getColumns` 的调用改为服务于数据合并（第 1 节），而非渲染入口卡片。

### 布局改造（ArticleList.vue）

将 `.article-list-wrapper` 改为响应式两栏布局：

**桌面端（≥ 768px）：**
- 两栏：左侧固定宽度（约 12–14rem）的标签侧栏，右侧文章列表。
- 侧栏使用 `position: sticky; top: <合适值>` 跟随滚动。
- 侧栏内：标题"标签筛选"，下方纵向排列"全部文章" + 各标签 pill（保留计数）。
- 折叠按钮在桌面端隐藏，标签始终展开。

**窄屏（< 768px）：**
- 侧栏回到列表顶部，单栏布局。
- 标签折叠为一个"标签筛选 ⌄"按钮，默认收起。
- 点击按钮展开/收起标签列表；展开时图标变为 ⌃。
- 当前选中标签显示在按钮上（如"标签筛选：#LangGraph"）；未选中时显示"标签筛选：全部"。

### 交互实现

- 新增 `ref(false)` 状态 `tagsExpanded` 控制窄屏展开/收起。
- 折叠按钮的显隐、侧栏 vs 顶部布局，全部用 CSS 媒体查询控制；JS 仅管理 `tagsExpanded` 状态。
- 桌面端忽略 `tagsExpanded`（标签列表始终 `display`）。
- 现有标签点击筛选逻辑（`handleTagClick`、`currentTag`、URL 同步、`popstate`）保持不变。

---

## 测试与验证

- `pnpm build` 通过类型检查与构建。
- 开发服务器目视检查：
  - 写作页顶部不再有专栏横滑入口。
  - 列表中专栏文章与博客按时间混排，专栏文章带"专栏 · XX"徽章且可点击进专栏。
  - 桌面端标签在左侧 sticky 侧栏纵向排列。
  - 窄屏标签折叠为按钮，点击可展开/收起，选中标签反映在按钮文字上。
  - 点击任意标签可正确筛选（含专栏文章的标签）。

## 风险与注意

- 专栏文章与博客若存在相同 `slug` 不影响，因 Vue `:key` 用 `slug`，需确认混排后 key 唯一；如有冲突，改用 `permalink` 作为 key。
- `tagSlugs` 生成逻辑需在博客与专栏文章间保持一致，抽成共享函数以防止重复与漂移。
