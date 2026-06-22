# 极简静默前端样式重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `designs/design.pen` 的「极简静默」视觉方向落地为前端代码——重构 3 个核心页面（首页/写作归档/文章详情）+ 全局顶/底栏 + 新设计 token 基座。

**Architecture:** 自底向上分阶段实现——先建立设计 token 基座（`theme.css` + `styles.css` + 字体加载），再重构全局组件（顶栏/页脚/布局），最后逐页重构。每个阶段产出可独立 `pnpm build` 验证的提交。卡片体系退场，改为目录清单 + 发丝线分隔 + 衬线统一全站。

**Tech Stack:** Astro 5（静态生成）、Vue 3（交互组件 `ArticleList.vue`）、TailwindCSS 4、TypeScript。CSS 变量驱动主题（亮/暗）。

**设计稿参考：** `designs/design.pen`。对照画板：
- `UTW5X` 首页-浅色 / `JwRht` 移动端-首页
- `f9v28` 写作归档页-浅色 / `UOUz7` 移动端-写作归档
- `xV2hU` 文章详情页-浅色 / `ibe65` 移动端-文章详情 / `WvwJq` 目录抽屉
- `zQaMS` 顶栏 / `tOurA` 页脚 / `HB2oi` 下拉列表 / `KG7zb` 设计规范画板

**上游 spec：** `docs/superpowers/specs/2026-06-22-quiet-minimal-frontend-refactor-design.md`

---

## 关键背景（执行者必读）

1. **本仓库 shell 是 bash**（即使环境标 `cmd.exe`）。命令用 unix 语法，`cd` 带多个参数会报错——直接在仓库根用相对路径或绝对路径 `D:\projects\ginlon-site`。
2. **验证命令是 `pnpm build`**（= `astro check` 类型检查 + frontmatter schema + 完整静态构建）。每个任务结束都要跑，必须退出码 0。
3. **`tailwind.config.js` 有遗留 base 样式**（body 设 Inter、a hover 变 rose）会与新 token 冲突——Task 2 会清理。文章正文**不用 Tailwind `prose` 类**，正文样式是 `blogs/[slug].astro` 里的手写 scoped CSS。
4. **写作页的标签筛选 + 文章清单都在 `src/components/site/ArticleList.vue` 一个 Vue 组件里**（桌面 sticky 侧栏 + 窄屏折叠按钮）。不存在单独的 `TagFilterBar.astro`。本次就地重构该组件，**必须保留 `<script setup>` 全部数据逻辑**。
5. **`ArticleCard.astro` 仅 `index.astro` 引用**（`columns/index.astro` 用独立的 `ColumnCard`）。首页改清单后删除 `ArticleCard`。
6. **全局顶/底栏替换会影响所有页面**。其他页面（专栏/关于/技术栈等）内容不动，但会继承新顶/底栏——可能出现「新顶栏 + 旧卡片」过渡态，**这是预期、可接受**。
7. **提交信息用中文**（沿用仓库惯例，见 recent commits）。
8. **不写自动化测试**——这是纯样式/呈现重构，验证靠 `pnpm build` + 浏览器对照设计稿（spec 第 7 节）。仓库现有 `pnpm test` 是给 utils 用的，不涉及样式。

---

## Task 1: 建立设计 token 基座（`theme.css`）

把 `design.pen` 的 variables 1:1 落地为 CSS 变量，建立全站基座。

**Files:**
- Modify: `src/styles/theme.css`（完全重写）

- [ ] **Step 1: 重写 `src/styles/theme.css`**

完整内容如下（替换整个文件）：

```css
@layer base {
  :root {
    /* 色彩 token —— 1:1 映射 designs/design.pen variables */
    --accent: #2e8b5e;
    --accent-soft: rgba(46, 139, 94, 0.12);
    --page-bg: #faf8f3;
    --surface: #ffffff;
    --text-strong: #1a1f1c;
    --text-muted: #6b756f;
    --hairline: rgba(26, 31, 28, 0.08);

    /* 字体 token */
    --font-serif:
      "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
    --font-sans:
      "Inter", system-ui, -apple-system, "PingFang SC", "Microsoft YaHei",
      sans-serif;

    /* 容器宽度（收窄聚焦） */
    --shell-width: 1000px;
    --reading-width: 680px;
    --shell-pad: clamp(1.5rem, 5vw, 5rem);

    /* 间距刻度（8px 基准，留白偏大） */
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
    --accent-soft: rgba(127, 208, 166, 0.15);
    --page-bg: #131714;
    --surface: #1a201c;
    --text-strong: #e8ede9;
    --text-muted: #9ca8a1;
    --hairline: rgba(232, 237, 233, 0.1);
  }
}
```

- [ ] **Step 2: 跑构建确认无破坏**

Run: `pnpm build`
Expected: 退出码 0。旧组件引用的 `--surface-bg` / `--surface-border` / `--shadow-soft` / `--radius-m` 等变量暂时**未定义**——CSS 会忽略未定义变量（不会报错），只是那些样式失效。这是预期的过渡态，后续任务会消除这些引用。

- [ ] **Step 3: Commit**

```bash
git add src/styles/theme.css
git commit -m "refactor(styles): 重写 theme.css 为极简静默设计 token 基座

1:1 映射 design.pen variables：暖白 #FAF8F3、绿 #2E8B5E、
发丝线 hairline、衬线/无衬线字体、容器宽度收窄、8px 间距刻度。
卡片体系旧 token（surface-bg/border/shadow/radius）退场。"
```

---

## Task 2: 更新 `styles.css` + 字体加载 + 清理 tailwind base

建立复用容器类（`.shell`/`.reading`/`.hairline`/`.meta`），调整全局字体默认值，加载 Noto Serif SC，清理 `tailwind.config.js` 冲突的遗留 base 样式。

**Files:**
- Modify: `src/styles/styles.css`
- Modify: `src/layouts/SiteLayout.astro`（字体 link）
- Modify: `tailwind.config.js`（清理冲突 base）

- [ ] **Step 1: 更新 `src/styles/styles.css`**

完整内容如下（替换整个文件）：

```css
@import "tailwindcss";
@config "../../tailwind.config.js";
@import "./theme.css";

@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  *::-webkit-scrollbar {
    width: 3px;
    height: 3px;
  }

  *::-webkit-scrollbar-track {
    background: transparent;
  }

  *::-webkit-scrollbar-thumb {
    background-color: rgba(81, 96, 111, 0.45);
    border-radius: 3px;
  }

  *::-webkit-scrollbar-thumb:hover {
    background-color: rgba(81, 96, 111, 0.72);
  }

  html,
  body {
    margin: 0;
    padding: 0;
  }

  body {
    min-height: 100vh;
    background: var(--page-bg);
    color: var(--text-strong);
    font-family: var(--font-serif);
    line-height: 1.8;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* 元信息、表单控件用无衬线 */
  button,
  input,
  textarea,
  select {
    font-family: var(--font-sans);
  }

  a {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 0.16em;
    text-decoration-color: var(--accent-soft);
  }

  ::selection {
    background: var(--accent-soft);
    color: var(--text-strong);
  }
}

@layer components {
  /* 外壳容器：居中 + 响应式左右内边距 */
  .shell {
    max-width: var(--shell-width);
    margin-inline: auto;
    padding-inline: var(--shell-pad);
  }

  /* 阅读区容器：文章正文用 */
  .reading {
    max-width: var(--reading-width);
    margin-inline: auto;
  }

  /* 发丝线分隔（区段间） */
  .hairline {
    height: 1px;
    background: var(--hairline);
    border: 0;
  }

  /* 元信息文字：小字无衬线、宽字距 */
  .meta {
    font-family: var(--font-sans);
    font-size: 13px;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }
}
```

- [ ] **Step 2: 加载 Noto Serif SC（`SiteLayout.astro`）**

在 `src/layouts/SiteLayout.astro` 找到现有的 Google Fonts link（约 47-50 行）：

```html
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
```

替换为（合并 Inter + Noto Serif SC）：

```html
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Noto+Serif+SC:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
```

- [ ] **Step 3: 清理 `tailwind.config.js` 冲突的遗留 base 样式**

`tailwind.config.js` 的第二个插件函数会注入冲突的 base 样式（`body { fontFamily: 'Inter' }`、`a:hover { color: rose }`、一堆 `--grey-*` 变量）。这些是上一代设计的遗留，会覆盖新 token。

把 `tailwind.config.js` 的 `plugins` 数组里**第二个插件函数**（`function ({ addBase, theme }) {...}`）和**第三个插件函数**（`function ({ addComponents, theme }) {...}`）整体删除，只保留 `typography` 插件。

修改后的 `plugins` 应为：

```js
  plugins: [
    typography,
  ],
```

同时删除 `theme.extend.colors` 里那一大块遗留 `primary`/`grey-*`/`rose-accent`/`background-*` 颜色定义（不再使用），`theme.extend` 可留空对象：

```js
  theme: {
    extend: {},
  },
```

`darkMode: 'class'` 和 `content` 字段保留不变。

- [ ] **Step 4: 跑构建**

Run: `pnpm build`
Expected: 退出码 0。

- [ ] **Step 5: 浏览器快速验证**

Run: `pnpm dev`，打开 `http://localhost:4321/`。
确认：
- 背景是暖白 `#FAF8F3`（不再是旧灰白）。
- 正文是衬线（Noto Serif SC）。
- 链接 hover 不再变玫红。

确认后 `Ctrl+C` 停止 dev server。

- [ ] **Step 6: Commit**

```bash
git add src/styles/styles.css src/layouts/SiteLayout.astro tailwind.config.js
git commit -m "refactor(styles): 新增容器工具类 + 加载 Noto Serif SC + 清理 tailwind 遗留 base

- styles.css: 新增 .shell/.reading/.hairline/.meta 工具类，
  body 默认 serif、line-height 1.8，链接改为 accent 色
- SiteLayout: Google Fonts 合并加载 Inter + Noto Serif SC
- tailwind.config: 移除冲突的遗留 base（Inter body/rose hover/grey 变量）"
```

---

## Task 3: 重构全局顶栏 `SiteHeader.astro`

去背景、serif Logo、发丝线分隔。全局生效。

**Files:**
- Modify: `src/components/site/SiteHeader.astro`（完全重写）

- [ ] **Step 1: 重写 `src/components/site/SiteHeader.astro`**

完整内容如下（替换整个文件，frontmatter 的 `navLinks` 保留不变）：

```astro
---
import ThemeToggleButton from './ThemeToggleButton.astro';

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/writing', label: '写作' },
  { href: '/columns', label: '专栏' },
];

const pathname = Astro.url.pathname.replace(/\/+$/, '') || '/';
const isActive = (href: string) => {
  const normalizedHref = href.replace(/\/+$/, '') || '/';
  return normalizedHref === pathname;
};
---

<header class="site-header">
  <div class="site-header-bar shell">
    <a href="/" class="site-logo">Ginlon</a>

    <div class="site-header-right">
      <nav aria-label="主导航">
        <ul class="site-nav-list">
          {
            navLinks.map((item) => (
              <li>
                <a
                  href={item.href}
                  class:list={['site-nav-link', isActive(item.href) && 'site-nav-link-active']}
                >
                  {item.label}
                </a>
              </li>
            ))
          }
        </ul>
      </nav>
      <ThemeToggleButton />
    </div>
  </div>
  <hr class="hairline site-header-divider" />
</header>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--page-bg);
  }

  .site-header-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding-block: 28px;
  }

  .site-logo {
    font-family: var(--font-serif);
    font-size: 20px;
    font-weight: 600;
    color: var(--text-strong);
    text-decoration: none;
  }

  .site-header-right {
    display: flex;
    align-items: center;
    gap: 32px;
  }

  .site-nav-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
  }

  .site-nav-link {
    color: var(--text-muted);
    text-decoration: none;
    font-family: var(--font-sans);
    font-size: 14px;
    transition: color 150ms ease;
  }

  .site-nav-link:hover,
  .site-nav-link-active {
    color: var(--accent);
  }

  .site-header-divider {
    margin: 0;
  }

  @media (max-width: 720px) {
    .site-header-bar {
      flex-wrap: wrap;
      padding-block: 20px;
    }

    .site-header-right {
      gap: 16px;
    }

    .site-nav-list {
      gap: 16px;
    }
  }
</style>
```

- [ ] **Step 2: 跑构建**

Run: `pnpm build`
Expected: 退出码 0。

- [ ] **Step 3: 浏览器验证**

Run: `pnpm dev`，打开首页。
确认：
- 顶栏无背景框、无阴影、无圆角（透明坐在 page-bg 上）。
- Logo「Ginlon」是衬线、无绿底圆徽章。
- 导航是纯文字（hover 变绿，无胶囊背景）。
- 顶栏底部一条发丝线。

`Ctrl+C` 停止。

- [ ] **Step 4: Commit**

```bash
git add src/components/site/SiteHeader.astro
git commit -m "refactor(header): 顶栏改为极简静默样式

去背景框/阴影/圆角，serif Logo，纯文字导航，
底部发丝线分隔。删除绿底白字圆形徽章。"
```

---

## Task 4: 重构全局页脚 `SiteFooter.astro` + 主题切换按钮

页脚改发丝线 + 极简栏；主题按钮去胶囊背景。

**Files:**
- Modify: `src/components/site/SiteFooter.astro`（完全重写）
- Modify: `src/components/site/ThemeToggleButton.astro`（只改 style）

- [ ] **Step 1: 重写 `src/components/site/SiteFooter.astro`**

完整内容如下（替换整个文件）：

```astro
---
import { siteConfig } from '../../data/site';

const year = new Date().getFullYear();
---

<footer class="site-footer">
  <hr class="hairline site-footer-divider" />
  <div class="site-footer-bar shell">
    <p class="site-footer-copy meta">© {year} Ginlon</p>
    <div class="site-footer-links">
      {
        siteConfig.contactLinks.map((link) => (
          <a
            href={link.href}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noreferrer' : undefined}
            class="site-footer-link meta"
          >
            {link.label}
          </a>
        ))
      }
    </div>
  </div>
</footer>

<style>
  .site-footer-divider {
    margin: 0;
  }

  .site-footer-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding-block: 32px;
  }

  .site-footer-copy {
    margin: 0;
  }

  .site-footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
  }

  .site-footer-link {
    text-decoration: none;
    color: var(--text-muted);
    transition: color 150ms ease;
  }

  .site-footer-link:hover {
    color: var(--text-strong);
  }

  @media (max-width: 640px) {
    .site-footer-bar {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
      padding-block: 24px;
    }
  }
</style>
```

- [ ] **Step 2: 更新 `ThemeToggleButton.astro` 的样式**

在 `src/components/site/ThemeToggleButton.astro` 找到 `<style>` 块（约 69-87 行），整块替换为：

```css
<style>
  .theme-toggle {
    border: none;
    background: transparent;
    color: var(--text-muted);
    padding: 0.25rem 0.5rem;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: color 150ms ease;
  }

  .theme-toggle:hover {
    color: var(--accent);
  }
</style>
```

- [ ] **Step 3: 跑构建 + 浏览器验证**

Run: `pnpm build`
Expected: 退出码 0。

Run: `pnpm dev`，确认页脚是发丝线 + 左版权右链接的极简栏；主题按钮无胶囊背景。`Ctrl+C`。

- [ ] **Step 4: Commit**

```bash
git add src/components/site/SiteFooter.astro src/components/site/ThemeToggleButton.astro
git commit -m "refactor(footer): 页脚改发丝线极简栏；主题按钮去胶囊背景

页脚：顶部发丝线 + 左版权右链接（meta 小字无衬线）。
主题按钮：纯文字、无背景框。"
```

---

## Task 5: 调整布局 `SiteLayout.astro`

去掉 main 的内边距（间距交由各页面/区段控制）。

**Files:**
- Modify: `src/layouts/SiteLayout.astro`（只改 style）

- [ ] **Step 1: 调整 `SiteLayout.astro` 的 style**

在 `src/layouts/SiteLayout.astro` 找到 `.editorial-main` 规则（约 144-146 行）：

```css
  .editorial-main {
    padding: 0.9rem 0 2.2rem;
  }
```

替换为：

```css
  .editorial-main {
    padding: 0;
  }
```

- [ ] **Step 2: 跑构建**

Run: `pnpm build`
Expected: 退出码 0。

- [ ] **Step 3: Commit**

```bash
git add src/layouts/SiteLayout.astro
git commit -m "refactor(layout): 去掉 editorial-main 内边距

间距交由各页面/区段的 .shell 容器自行控制，匹配设计稿每段独立 padding。"
```

---

## Task 6: 重构首页 `index.astro`

Hero 去卡片、精选写作改目录清单、当前关注去卡片。删除 `ArticleCard` 引用。

**Files:**
- Modify: `src/pages/index.astro`（完全重写）
- Delete: `src/components/site/ArticleCard.astro`

- [ ] **Step 1: 重写 `src/pages/index.astro`**

完整内容如下（替换整个文件）。注意：不再 import `ArticleCard`/`PageSection`/`SectionHeading`；精选写作改为内联清单行。

```astro
---
import SiteLayout from '../layouts/SiteLayout.astro';
import { getBlogs } from '../utils/getBlogs';
import { dayjs } from '../utils/dayjs';

const articles = await getBlogs('zh');
const featuredArticles = articles.filter((article) => article.featured);
const selectedWriting = featuredArticles.length > 0 ? featuredArticles : articles.slice(0, 3);

const focusList = [
  {
    title: 'Harness Engineering',
    description: '探索在 Agent 优先时代如何有效利用 AI 进行软件工程实践。',
  },
  {
    title: '写作流程系统化',
    description: '通过固定节奏积累选题、草稿和复盘，让写作成为长期实践而非灵感事件。',
  },
  {
    title: '长期主义执行力',
    description: '关注可持续投入，把注意力放在十年后仍然有价值的能力上。',
  },
];

const pageMeta = {
  title: 'Ginlon | 写作与工程实践',
  description: '关于工程、写作与长期主义实践的中文写作站点。',
};
---

<SiteLayout pageMeta={pageMeta}>
  <!-- Hero -->
  <section class="hero shell">
    <img
      src="https://bucket.ginlon.site/avatar_512.png"
      alt="Ginlon"
      class="hero-avatar"
    />
    <div class="hero-text">
      <p class="hero-eyebrow">关于我</p>
      <h1 class="hero-title">Ginlon</h1>
      <p class="hero-tagline">
        全干工程师，写作爱好者。<br />
        相信工程是理解世界的方式，写作是理解自己的方式。
      </p>
    </div>
  </section>

  <hr class="hairline" />

  <!-- 精选写作 -->
  <section class="section shell">
    <h2 class="section-title">精选写作</h2>
    <div class="writing-list">
      <hr class="hairline" />
      {
        selectedWriting.map((article) => (
          <a class="writing-row" href={`/blogs/${article.data.permalink}`}>
            <time class="writing-date meta">
              {dayjs(article.data.createdAt).format('YYYY-MM-DD')}
            </time>
            <div class="writing-main">
              <h3 class="writing-title">{article.data.title}</h3>
              <p class="writing-summary">{article.data.description ?? article.data.subtitle ?? ''}</p>
            </div>
          </a>
        ))
      }
    </div>
  </section>

  <hr class="hairline" />

  <!-- 当前关注 -->
  <section class="section shell">
    <h2 class="section-title">当前关注</h2>
    <ul class="focus-list">
      {
        focusList.map((item) => (
          <li class="focus-item">
            <h3 class="focus-title">{item.title}</h3>
            <p class="focus-desc">{item.description}</p>
          </li>
        ))
      }
    </ul>
  </section>
</SiteLayout>

<style>
  /* Hero */
  .hero {
    display: flex;
    align-items: center;
    gap: 32px;
    padding-block: 80px;
  }

  .hero-avatar {
    width: 144px;
    height: 144px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .hero-text {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    min-width: 0;
  }

  .hero-eyebrow {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: var(--accent);
  }

  .hero-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: clamp(2.5rem, 1.5rem + 3vw, 3.5rem);
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: var(--text-strong);
  }

  .hero-tagline {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 17px;
    line-height: 1.8;
    color: var(--text-muted);
    max-width: 38rem;
  }

  /* 区段通用 */
  .section {
    padding-block: 64px;
  }

  .section-title {
    margin: 0 0 32px;
    font-family: var(--font-serif);
    font-size: 24px;
    font-weight: 600;
    color: var(--text-strong);
  }

  /* 精选写作清单 */
  .writing-list {
    display: block;
  }

  .writing-row {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 32px;
    align-items: baseline;
    padding-block: 28px;
    text-decoration: none;
  }

  .writing-date {
    margin: 0;
    white-space: nowrap;
  }

  .writing-main {
    min-width: 0;
  }

  .writing-title {
    margin: 0 0 8px;
    font-family: var(--font-serif);
    font-size: 20px;
    font-weight: 500;
    line-height: 1.35;
    color: var(--text-strong);
    transition: color 150ms ease;
  }

  .writing-row:hover .writing-title {
    color: var(--accent);
  }

  .writing-summary {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 15px;
    line-height: 1.7;
    color: var(--text-muted);
  }

  /* 当前关注 */
  .focus-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .focus-item {
    display: grid;
    gap: 6px;
  }

  .focus-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 18px;
    font-weight: 600;
    color: var(--text-strong);
  }

  .focus-desc {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 15px;
    line-height: 1.7;
    color: var(--text-muted);
  }

  /* 移动端（对照 JwRht） */
  @media (max-width: 720px) {
    .hero {
      flex-direction: column;
      align-items: flex-start;
      gap: 20px;
      padding-block: 36px;
    }

    .hero-avatar {
      width: 72px;
      height: 72px;
    }

    .section {
      padding-block: 36px;
    }

    .writing-row {
      grid-template-columns: 1fr;
      gap: 8px;
    }
  }
</style>
```

- [ ] **Step 2: 删除不再使用的 `ArticleCard.astro`**

先确认无其他引用：

Run: `grep -rn "ArticleCard" src/`
Expected: 无输出（首页已不再 import）。

如确认无输出，删除文件：

Run: `rm src/components/site/ArticleCard.astro`

- [ ] **Step 3: 跑构建**

Run: `pnpm build`
Expected: 退出码 0。

- [ ] **Step 4: 浏览器对照设计稿**

Run: `pnpm dev`，打开首页。对照 `design.pen` 的 `UTW5X`（首页-浅色）确认：
- Hero 无卡片，头像 144px 无边框，文字横排。
- 精选写作是目录清单行（日期 | 标题+摘要），发丝线分隔，无卡片。
- 当前关注是纯文字列表，无卡片无分隔线。
- 区段间发丝线分隔，超大留白。
- 缩窄到 390px 宽，对照 `JwRht`（移动端-首页）：Hero 纵向、头像 72px、清单堆叠。

`Ctrl+C`。

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro src/components/site/ArticleCard.astro
git commit -m "refactor(home): 首页改为极简静默布局

Hero 去卡片（头像无边框 + serif 大标题）；精选写作从卡片改为
目录清单行（日期|标题+摘要，发丝线分隔）；当前关注去卡片纯文字列表。
删除不再使用的 ArticleCard 组件。"
```

---

## Task 7: 重构写作归档页 `writing/index.astro` + `ArticleList.vue`

页头 + 标签下拉 + 目录清单。这是结构变化最大的一页。`ArticleList.vue` 改 UI 但**保留全部 `<script setup>` 数据逻辑**。

**Files:**
- Modify: `src/pages/writing/index.astro`
- Modify: `src/components/site/ArticleList.vue`

- [ ] **Step 1: 重写 `src/pages/writing/index.astro`**

完整内容如下（替换整个文件）。注意：不再用 `PageSection`/`SectionHeading`，页头内联；`ArticleList` 仍传 `articles` + `initialTag`。

```astro
---
import ArticleList from '../../components/site/ArticleList.vue';
import SiteLayout from '../../layouts/SiteLayout.astro';
import dayjs from 'dayjs';
import { getBlogs } from '../../utils/getBlogs';
import { getColumns, getColumnBySlug } from '../../utils/getColumns';
import { tagToSlug } from '../../utils/getTags';

const blogs = await getBlogs('zh');
const columns = await getColumns();
// 入站 tag 可能是显示名或 slug，统一规范化为 slug
const rawTag = new URL(Astro.url).searchParams.get('tag')?.trim() ?? '';
const selectedTag = rawTag ? tagToSlug(rawTag) : '';

const blogItems = blogs.map((article) => ({
  slug: article.slug,
  title: article.title,
  summary: article.summary,
  publishedAt: article.data.createdAt,
  tags: article.data.tags ?? [],
  tagSlugs: (article.data.tags ?? []).map(tagToSlug),
  permalink: `/blogs/${article.data.permalink}`,
  source: 'blog' as const,
}));

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

<SiteLayout pageMeta={pageMeta}>
  <!-- 页头 -->
  <header class="writing-head shell">
    <p class="eyebrow">写作归档</p>
    <h1 class="writing-title">全部文章</h1>
    <p class="writing-desc">{pageMeta.description}</p>
  </header>

  <ArticleList client:only="vue" articles={articlesData} initialTag={selectedTag} />
</SiteLayout>

<style>
  .writing-head {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 72px 0 40px;
  }

  .eyebrow {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: var(--accent);
  }

  .writing-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 36px;
    font-weight: 600;
    color: var(--text-strong);
  }

  .writing-desc {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 16px;
    line-height: 1.8;
    color: var(--text-muted);
  }

  @media (max-width: 720px) {
    .writing-head {
      padding: 36px 0 20px;
      gap: 10px;
    }

    .eyebrow {
      font-size: 12px;
    }

    .writing-title {
      font-size: 30px;
    }
  }
</style>
```

- [ ] **Step 2: 重写 `src/components/site/ArticleList.vue`**

完整内容如下（替换整个文件）。**关键：`<script setup>` 块完全保留**（只新增 `dropdownOpen` ref + `closeDropdown` 逻辑用于下拉开关），`<template>` 和 `<style scoped>` 全部重写为下拉 + 目录清单。

```vue
<template>
  <div class="writing-archive">
    <!-- 筛选工具栏 -->
    <div class="toolbar shell">
      <p class="count meta">共 {{ filteredArticles.length }} 篇文章</p>

      <div class="tag-select" :class="{ open: dropdownOpen }">
        <button
          type="button"
          class="tag-trigger"
          :aria-expanded="dropdownOpen"
          aria-haspopup="listbox"
          @click="dropdownOpen = !dropdownOpen"
        >
          <span class="tag-trigger-label">{{ currentTagLabel }}</span>
          <ChevronDown :size="15" :stroke-width="2" class="tag-trigger-icon" />
        </button>

        <div v-if="dropdownOpen" class="tag-popup" role="listbox">
          <button
            type="button"
            class="tag-option"
            :class="{ 'tag-option-active': !currentTag }"
            role="option"
            @click="handleTagClick('')"
          >
            <span>全部文章</span>
            <span class="tag-count">{{ articles.length }}</span>
          </button>
          <button
            v-for="tag in uniqueTags"
            :key="tag.slug"
            type="button"
            class="tag-option"
            :class="{ 'tag-option-active': currentTag === tag.slug }"
            role="option"
            @click="handleTagClick(tag.slug)"
          >
            <span>#{{ tag.name }}</span>
            <span class="tag-count">{{ tag.count }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 归档列表 -->
    <div class="archive shell">
      <hr class="hairline" />
      <article v-for="item in filteredArticles" :key="item.permalink" class="archive-row">
        <a :href="item.permalink" class="archive-main">
          <time class="archive-date meta" :datetime="item.publishedAt">
            {{ formatDate(item.publishedAt) }}
          </time>
          <div class="archive-body">
            <h3 class="archive-title">{{ item.title }}</h3>
            <p v-if="item.summary" class="archive-summary">{{ item.summary }}</p>
            <div class="archive-meta">
              <span
                v-if="item.source === 'column' && item.columnSlug"
                class="archive-source"
              >
                <a
                  :href="`/columns/${item.columnSlug}`"
                  @click.stop
                >专栏 · {{ item.columnTitle }}</a>
              </span>
              <span v-if="item.tags.length > 0" class="archive-tags">
                <span v-for="(tag, index) in item.tags" :key="tag" class="archive-tag">
                  #{{ tag }}
                </span>
              </span>
            </div>
          </div>
        </a>
        <hr class="hairline" />
      </article>

      <p v-show="filteredArticles.length === 0" class="empty-state">
        没有匹配的文章，试试切换到"全部文章"。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { ChevronDown } from 'lucide-astro/vue';

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

interface Tag {
  name: string;
  slug: string;
  count: number;
}

interface Props {
  articles: Article[];
  initialTag?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialTag: '',
});

const currentTag = ref(props.initialTag);
const dropdownOpen = ref(false);

const currentTagLabel = computed(() => {
  if (!currentTag.value) return '全部标签';
  const found = uniqueTags.value.find((t) => t.slug === currentTag.value);
  return found ? `#${found.name}` : `#${currentTag.value}`;
});

const uniqueTags = computed<Tag[]>(() => {
  const tagMap = new Map<string, { name: string; slug: string; count: number }>();
  props.articles.forEach((article) => {
    article.tags.forEach((tag, index) => {
      const slug = article.tagSlugs[index];
      const existing = tagMap.get(slug);
      if (existing) {
        existing.count++;
      } else {
        tagMap.set(slug, { name: tag, slug, count: 1 });
      }
    });
  });
  return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
});

const filteredArticles = computed(() => {
  if (!currentTag.value) return props.articles;
  return props.articles.filter((article) => article.tagSlugs.includes(currentTag.value));
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 10);
}

function handleTagClick(tag: string) {
  const newUrl = tag
    ? `${window.location.pathname}?tag=${encodeURIComponent(tag)}`
    : window.location.pathname;
  history.pushState({ tag }, '', newUrl);
  currentTag.value = tag;
  dropdownOpen.value = false;
  updateDescription();
}

function updateDescription() {
  const descriptionEl = document.querySelector('.writing-desc');
  if (descriptionEl) {
    if (currentTag.value) {
      descriptionEl.textContent = `当前标签：${currentTag.value}，共 ${filteredArticles.value.length} 篇。`;
    } else {
      descriptionEl.textContent = '按时间倒序归档的全部文章，可按标签过滤。';
    }
  }
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.tag-select')) {
    dropdownOpen.value = false;
  }
}

function handlePopState() {
  const params = new URLSearchParams(window.location.search);
  currentTag.value = params.get('tag')?.trim() || '';
  updateDescription();
}

onMounted(() => {
  window.addEventListener('popstate', handlePopState);
  document.addEventListener('click', handleClickOutside);
  updateDescription();
});

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.writing-archive {
  display: block;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 28px;
}

.count {
  margin: 0;
}

/* 标签下拉 */
.tag-select {
  position: relative;
  width: 216px;
}

.tag-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid var(--hairline);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text-strong);
  font-family: var(--font-sans);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 150ms ease;
}

.tag-trigger:hover {
  border-color: var(--accent);
}

.tag-trigger-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.tag-popup {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(26, 31, 28, 0.12);
  z-index: 30;
}

.tag-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: background-color 150ms ease, color 150ms ease;
}

.tag-option:hover {
  color: var(--text-strong);
}

.tag-option-active {
  background: var(--accent-soft);
  color: var(--accent);
}

.tag-count {
  font-size: 12px;
  opacity: 0.7;
}

/* 归档列表 */
.archive {
  padding-bottom: 72px;
}

.archive-row {
  display: block;
}

.archive-main {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 32px;
  align-items: baseline;
  padding-block: 28px;
  text-decoration: none;
}

.archive-date {
  margin: 0;
  white-space: nowrap;
}

.archive-body {
  min-width: 0;
}

.archive-title {
  margin: 0 0 8px;
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 500;
  line-height: 1.35;
  color: var(--text-strong);
  transition: color 150ms ease;
}

.archive-main:hover .archive-title {
  color: var(--accent);
}

.archive-summary {
  margin: 0 0 8px;
  font-family: var(--font-serif);
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-muted);
}

.archive-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  font-family: var(--font-sans);
  font-size: 12px;
}

.archive-source a {
  color: var(--accent);
  text-decoration: none;
}

.archive-source a:hover {
  text-decoration: underline;
}

.archive-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.archive-tag {
  color: var(--text-muted);
}

.empty-state {
  margin: 28px 0 0;
  color: var(--text-muted);
  font-family: var(--font-serif);
}

/* 移动端（对照 UOUz7） */
@media (max-width: 720px) {
  .toolbar {
    padding-bottom: 24px;
  }

  .count {
    font-size: 12px;
  }

  .tag-select {
    width: auto;
    flex: 1;
  }

  .archive {
    padding-bottom: 36px;
  }

  .archive-main {
    grid-template-columns: 1fr;
    gap: 8px;
    padding-block: 20px;
  }
}
</style>
```

- [ ] **Step 3: 跑构建**

Run: `pnpm build`
Expected: 退出码 0。如报错关于 `lucide-astro/vue` 导入路径，改用 `import ChevronDown from 'lucide-astro/icons/chevron-down.astro'` 不可行（Vue 组件里），则改为内联 SVG：

如 Step 2 的 `import { ChevronDown } from 'lucide-astro/vue';` 报错，替换该 import 行为空，并把模板里的 `<ChevronDown :size="15" :stroke-width="2" class="tag-trigger-icon" />` 替换为内联 SVG：

```html
<svg
  class="tag-trigger-icon"
  width="15"
  height="15"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <polyline points="6 9 12 15 18 9"></polyline>
</svg>
```

- [ ] **Step 4: 浏览器对照设计稿**

Run: `pnpm dev`，打开 `/writing`。对照 `design.pen` 的 `f9v28`（写作归档页-浅色）确认：
- 页头三行（Eyebrow 绿 / 标题 serif 36 / 描述），无卡片。
- 工具栏：左计数 + 右标签下拉触发器（surface 底 + hairline 边 + chevron 图标）。
- 点击下拉，弹层带阴影，选中项 accent-soft 底。
- 列表是目录清单行（日期 | 标题+摘要+标签+来源），发丝线分隔，无卡片。
- 专栏文章有「专栏 · xxx」来源标记。
- 标签筛选后 URL 变 `?tag=xxx`，描述更新；浏览器前进后退正常；点下拉外部自动关闭。
- 缩窄到 390px，对照 `UOUz7`：下拉整宽、条目纵向堆叠。

`Ctrl+C`。

- [ ] **Step 5: Commit**

```bash
git add src/pages/writing/index.astro src/components/site/ArticleList.vue
git commit -m "refactor(writing): 写作归档页改为极简静默布局

页头去卡片（Eyebrow/标题/描述）；标签筛选从 sticky 侧栏改为下拉
（surface 底+发丝线边+阴影弹层，选中项 accent-soft）；文章清单从
卡片改为目录清单行（日期|标题+摘要+标签+来源，发丝线分隔）。
保留 ArticleList.vue 全部数据逻辑（URL 同步/前进后退/计数）。"
```

---

## Task 8: 重构文章详情页 `blogs/[slug].astro` + 相关组件

双栏布局（正文 + sticky TOC）、纯文字 Hero、翻页两列。这是最复杂的一页。

**Files:**
- Modify: `src/pages/blogs/[slug].astro`（完全重写 layout + style）
- Modify: `src/components/site/ArticleHero.astro`（去卡片）
- Modify: `src/components/site/ArticlePager.astro`（两列去卡片）
- Modify: `src/components/site/ArticleTocRail.astro`（去卡片，sticky）
- Modify: `src/components/site/ArticleTocDrawer.astro`（浮动按钮 + 抽屉）

- [ ] **Step 1: 重写 `src/components/site/ArticleHero.astro`**

完整内容如下（替换整个文件）。去卡片、加 Eyebrow（写作/category）、serif 大标题。

```astro
---
interface Props {
  title: string;
  summary?: string | undefined;
  publishedLabel: string;
  publishedAtIso?: string | undefined;
  lastModifiedLabel?: string | undefined;
  lastModifiedIso?: string | undefined;
  tags?: string[] | undefined;
  poster?: string | undefined;
  posterDescription?: string | undefined;
  categoryLabel?: string | undefined;
}

const {
  title,
  summary,
  publishedLabel,
  publishedAtIso,
  lastModifiedLabel,
  lastModifiedIso,
  tags = [],
  poster,
  posterDescription,
  categoryLabel = '写作',
} = Astro.props;
---

<header class="article-hero shell">
  <div class="hero-content">
    <p class="hero-eyebrow">{categoryLabel}</p>
    <h1 class="hero-title">{title}</h1>
    {summary && <p class="hero-summary">{summary}</p>}
    <div class="hero-meta">
      <time class="meta" datetime={publishedAtIso}>{publishedLabel}</time>
      {tags.length > 0 && (
        <span class="hero-tags">
          {tags.map((tag) => (
            <span class="meta">#{tag}</span>
          ))}
        </span>
      )}
      {lastModifiedLabel && (
        <span class="meta">· 最后更新 <time datetime={lastModifiedIso}>{lastModifiedLabel}</time></span>
      )}
    </div>
  </div>

  {poster && (
    <figure class="hero-cover">
      <img
        src={poster}
        alt={posterDescription ?? title}
        class="hero-cover-image"
        loading="eager"
      />
    </figure>
  )}
</header>

<style>
  .article-hero {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 72px 0 48px;
  }

  .hero-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: var(--reading-width);
  }

  .hero-eyebrow {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: var(--accent);
  }

  .hero-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: clamp(1.9rem, 1.3rem + 2vw, 2.625rem);
    font-weight: 600;
    line-height: 1.3;
    color: var(--text-strong);
  }

  .hero-summary {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 18px;
    line-height: 1.8;
    color: var(--text-muted);
  }

  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  .hero-tags {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .hero-cover {
    margin: 16px 0 0;
  }

  .hero-cover-image {
    display: block;
    width: 100%;
    max-height: 34rem;
    object-fit: cover;
    border-radius: 4px;
  }

  @media (max-width: 720px) {
    .article-hero {
      padding: 36px 0 28px;
      gap: 16px;
    }

    .hero-content {
      gap: 16px;
    }

    .hero-title {
      font-size: 28px;
      line-height: 1.35;
    }

    .hero-summary {
      font-size: 15px;
    }
  }
</style>
```

- [ ] **Step 2: 重写 `src/components/site/ArticlePager.astro`**

完整内容如下（替换整个文件）。两列去卡片。

```astro
---
interface Props {
  prev?: { slug: string; title: string } | undefined;
  next?: { slug: string; title: string } | undefined;
}

const { prev, next } = Astro.props;
---

{(prev || next) && (
  <nav class="article-pager shell" aria-label="文章导航">
    {prev && (
      <a href={prev.slug.startsWith('/') ? prev.slug : `/blogs/${prev.slug}`} class="pager-item pager-prev">
        <span class="pager-direction meta">上一篇</span>
        <span class="pager-title">{prev.title}</span>
      </a>
    )}
    {next && (
      <a href={next.slug.startsWith('/') ? next.slug : `/blogs/${next.slug}`} class="pager-item pager-next">
        <span class="pager-direction meta">下一篇</span>
        <span class="pager-title">{next.title}</span>
      </a>
    )}
  </nav>
)}

<style>
  .article-pager {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    padding-block: 40px;
  }

  .pager-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-decoration: none;
    max-width: 48%;
  }

  .pager-next {
    margin-left: auto;
    text-align: right;
  }

  .pager-direction {
    margin: 0;
  }

  .pager-title {
    font-family: var(--font-serif);
    font-size: 16px;
    font-weight: 500;
    line-height: 1.4;
    color: var(--text-strong);
    transition: color 150ms ease;
  }

  .pager-item:hover .pager-title {
    color: var(--accent);
  }

  @media (max-width: 720px) {
    .article-pager {
      flex-direction: column;
      gap: 20px;
      padding-block: 24px;
    }

    .pager-item {
      max-width: 100%;
    }

    .pager-next {
      margin-left: 0;
      text-align: left;
    }
  }
</style>
```

- [ ] **Step 3: 重写 `src/components/site/ArticleTocRail.astro`**

完整内容如下（替换整个文件）。去卡片，sticky。

```astro
---
interface Heading {
  depth: number;
  slug: string;
  text: string;
}

interface Props {
  headings: Heading[];
}

const { headings } = Astro.props;
const filtered = headings.filter((h) => h.depth >= 2 && h.depth <= 4);
---

{filtered.length > 0 && (
  <nav class="toc-rail" aria-label="文章目录">
    <p class="toc-rail-title meta">目录</p>
    <ul class="toc-rail-list">
      {filtered.map((heading) => (
        <li class:list={['toc-rail-item', `toc-rail-depth-${heading.depth}`]}>
          <a href={`#${heading.slug}`} class="toc-rail-link" data-toc-link>
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  </nav>
)}

<style>
  .toc-rail {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .toc-rail-title {
    margin: 0;
  }

  .toc-rail-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .toc-rail-depth-3 {
    padding-left: 12px;
  }

  .toc-rail-depth-4 {
    padding-left: 24px;
  }

  .toc-rail-link {
    display: block;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.4;
    text-decoration: none;
    border-left: 2px solid transparent;
    padding-left: 10px;
    margin-left: -12px;
    transition: color 150ms ease, border-color 150ms ease;
  }

  .toc-rail-link:hover {
    color: var(--accent);
  }

  .toc-rail-link.is-active {
    color: var(--accent);
    border-left-color: var(--accent);
  }
</style>
```

- [ ] **Step 4: 重写 `src/components/site/ArticleTocDrawer.astro`**

完整内容如下（替换整个文件）。移动端浮动按钮 + 抽屉。保留 script 逻辑，改样式。

```astro
---
interface Heading {
  depth: number;
  slug: string;
  text: string;
}

interface Props {
  headings: Heading[];
  buttonLabel?: string;
}

const { headings, buttonLabel = '目录' } = Astro.props;
const filtered = headings.filter((h) => h.depth >= 2 && h.depth <= 4);
---

{filtered.length > 0 && (
  <div class="toc-drawer-wrapper">
    <button
      class="toc-fab"
      aria-expanded="false"
      aria-controls="article-toc-drawer"
      aria-label={buttonLabel}
      type="button"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
      </svg>
    </button>

    <div id="article-toc-drawer" class="toc-drawer" hidden>
      <div class="toc-drawer-header">
        <span class="meta">目录</span>
        <button class="toc-drawer-close" aria-label="关闭目录" type="button">×</button>
      </div>
      <nav aria-label="文章目录">
        <ul class="toc-drawer-list">
          {filtered.map((heading) => (
            <li class:list={['toc-drawer-item', `toc-drawer-depth-${heading.depth}`]}>
              <a href={`#${heading.slug}`} class="toc-drawer-link" data-toc-link>
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </div>
)}

<script>
  document.addEventListener('astro:page-load', () => {
    const toggle = document.querySelector('.toc-fab') as HTMLButtonElement | null;
    const drawer = document.getElementById('article-toc-drawer');
    const closeBtn = document.querySelector('.toc-drawer-close') as HTMLButtonElement | null;

    if (!toggle || !drawer) return;

    const openDrawer = () => {
      toggle.setAttribute('aria-expanded', 'true');
      drawer.hidden = false;
    };
    const closeDrawer = () => {
      toggle.setAttribute('aria-expanded', 'false');
      drawer.hidden = true;
    };

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      expanded ? closeDrawer() : openDrawer();
    });

    closeBtn?.addEventListener('click', closeDrawer);

    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeDrawer);
    });
  });
</script>

<style>
  .toc-drawer-wrapper {
    display: none;
  }

  .toc-fab {
    position: fixed;
    right: 20px;
    bottom: 20px;
    width: 56px;
    height: 56px;
    border: none;
    border-radius: 28px;
    background: var(--accent);
    color: #ffffff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 18px rgba(26, 31, 28, 0.25);
    z-index: 40;
  }

  .toc-drawer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: 70vh;
    overflow-y: auto;
    padding: 16px 24px 24px;
    background: var(--surface);
    border-top: 1px solid var(--hairline);
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -8px 24px rgba(26, 31, 28, 0.15);
    z-index: 50;
  }

  .toc-drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .toc-drawer-close {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    padding: 4px 8px;
  }

  .toc-drawer-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .toc-drawer-depth-3 {
    padding-left: 12px;
  }

  .toc-drawer-depth-4 {
    padding-left: 24px;
  }

  .toc-drawer-link {
    display: block;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.4;
    text-decoration: none;
  }

  .toc-drawer-link:hover,
  .toc-drawer-link.is-active {
    color: var(--accent);
  }

  @media (min-width: 1024px) {
    .toc-drawer-wrapper {
      display: none !important;
    }
  }
</style>
```

- [ ] **Step 5: 重写 `src/pages/blogs/[slug].astro`**

完整内容如下（替换整个文件）。frontmatter 保留不变（`getStaticPaths`/`render`/meta 逻辑全保留），只改 template + style。新增 TOC 滚动高亮脚本。

```astro
---
import { render } from 'astro:content';
import ArticleHero from '../../components/site/ArticleHero.astro';
import ArticlePager from '../../components/site/ArticlePager.astro';
import ArticleTocDrawer from '../../components/site/ArticleTocDrawer.astro';
import ArticleTocRail from '../../components/site/ArticleTocRail.astro';
import SiteLayout from '../../layouts/SiteLayout.astro';
import { siteConfig } from '../../data/site';
import { dayjs, format } from '../../utils/dayjs';
import type { PageMeta } from '../../types/seo';
import { getBlogs, type Blog } from '../../utils/getBlogs';

function toIsoString(value?: string | Date) {
  if (!value) return undefined;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export async function getStaticPaths() {
  const blogs = await getBlogs('zh');

  return blogs.map((blog, index) => ({
    params: { slug: blog.data.permalink },
    props: {
      article: blog,
      prev: index > 0 ? blogs[index - 1] : undefined,
      next: index < blogs.length - 1 ? blogs[index + 1] : undefined,
    },
  }));
}

const { article, prev, next } = Astro.props as {
  article: Blog;
  prev?: Blog;
  next?: Blog;
};

const { Content, headings } = await render(article);
const filteredHeadings = headings.filter((h: { depth: number }) => h.depth >= 2 && h.depth <= 4);

const summary = article.data.description ?? article.data.subtitle;
const publishedLabel = dayjs(article.data.createdAt).format(format);
const lastModifiedValue =
  typeof article.data.lastModified === 'string'
    ? article.data.lastModified
    : article.data.lastModified
      ? new Date(article.data.lastModified).toISOString()
      : undefined;
const lastModifiedLabel = lastModifiedValue
  ? dayjs(lastModifiedValue).format(format)
  : undefined;

const publishedTime = toIsoString(article.data.createdAt);
const modifiedTime = toIsoString(article.data.lastModified);
const categoryLabel =
  article.data.category === 'note' ? '笔记 · 随笔' : '工程 · 长读';
const pageMeta = {
  title: `${article.data.title} | ${siteConfig.name}`,
  description: summary || siteConfig.zh.description,
  ogType: 'article' as const,
  ogImage: siteConfig.articleOgImage,
  ...(article.data.tags ? { tags: article.data.tags } : {}),
  ...(publishedTime ? { publishedTime } : {}),
  ...(modifiedTime ? { modifiedTime } : {}),
} satisfies Partial<PageMeta>;
---

<SiteLayout pageMeta={pageMeta}>
  <article>
    <ArticleHero
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

    <hr class="hairline shell" />

    <div class="article-layout">
      <div class="article-body reading">
        <Content />

        {lastModifiedLabel && (
          <footer class="article-body-footer">
            <span class="meta">最后更新 <time datetime={lastModifiedValue}>{lastModifiedLabel}</time></span>
          </footer>
        )}
      </div>

      <aside class="article-sidebar">
        <ArticleTocRail headings={filteredHeadings} />
      </aside>
    </div>

    <hr class="hairline shell" />

    <ArticlePager
      prev={prev ? { slug: prev.slug, title: prev.title } : undefined}
      next={next ? { slug: next.slug, title: next.title } : undefined}
    />

    <ArticleTocDrawer headings={filteredHeadings} buttonLabel="目录" />
  </article>
</SiteLayout>

<script>
  // TOC 滚动高亮：观察所有标题，当前可见项加 is-active
  document.addEventListener('astro:page-load', () => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-toc-link]'));
    if (links.length === 0) return;

    const map = new Map<string, HTMLAnchorElement>();
    links.forEach((link) => {
      const id = link.getAttribute('href')?.slice(1);
      if (id) map.set(id, link);
    });

    const headings = Array.from(map.keys())
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;
          const link = map.get(id);
          if (!link) return;
          if (entry.isIntersecting) {
            links.forEach((l) => l.classList.remove('is-active'));
            link.classList.add('is-active');
          }
        });
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    headings.forEach((h) => observer.observe(h));
  });
</script>

<style>
  .article-layout {
    display: grid;
    grid-template-columns: 680px 140px;
    gap: 26px;
    justify-content: center;
    padding-block: 56px 72px;
  }

  .article-body {
    min-width: 0;
    color: var(--text-strong);
    font-size: 17px;
    line-height: 1.8;
  }

  .article-body :global(h2),
  .article-body :global(h3),
  .article-body :global(h4),
  .article-body :global(h5) {
    margin-top: 2.6rem;
    margin-bottom: 0.9rem;
    font-family: var(--font-serif);
    color: var(--text-strong);
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  .article-body :global(h2) {
    font-size: 1.75rem;
    font-weight: 600;
  }

  .article-body :global(h3) {
    font-size: 1.35rem;
    font-weight: 600;
  }

  .article-body :global(h4) {
    font-size: 1.1rem;
    font-weight: 600;
  }

  .article-body :global(p),
  .article-body :global(ul),
  .article-body :global(ol),
  .article-body :global(blockquote),
  .article-body :global(pre),
  .article-body :global(table) {
    margin-block: 1rem;
  }

  .article-body :global(ul),
  .article-body :global(ol) {
    padding-left: 1.4rem;
  }

  .article-body :global(li) {
    margin-block: 0.45rem;
  }

  .article-body :global(a) {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }

  .article-body :global(img) {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: 4px;
  }

  .article-body :global(blockquote) {
    border-left: 3px solid var(--accent);
    margin-inline: 0;
    padding: 0.2rem 0 0.2rem 1rem;
    color: var(--text-muted);
  }

  .article-body :global(code):not(:global(pre code)) {
    background: var(--accent-soft);
    padding: 0.15rem 0.35rem;
    border-radius: 4px;
    font-size: 0.9em;
    font-family: var(--font-sans);
  }

  .article-body :global(pre) {
    overflow-x: auto;
    background: rgba(15, 23, 42, 0.96);
    padding: 1rem;
    border-radius: 6px;
    color: #f8fafc;
    font-family: var(--font-sans);
  }

  .article-body :global(pre.mermaid) {
    background: transparent;
    color: inherit;
    overflow: visible;
  }

  .article-body :global(pre code) {
    display: block;
    min-width: max-content;
    background: transparent;
    padding: 0;
    color: inherit;
  }

  .article-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95em;
  }

  .article-body :global(th),
  .article-body :global(td) {
    border-bottom: 1px solid var(--hairline);
    padding: 0.5rem 0.75rem;
    text-align: left;
  }

  .article-body :global(th) {
    font-family: var(--font-sans);
    font-weight: 600;
    color: var(--text-strong);
  }

  .article-body :global(hr) {
    border: 0;
    border-top: 1px solid var(--hairline);
    margin: 2.5rem 0;
  }

  .article-body-footer {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--hairline);
    text-align: right;
  }

  .article-sidebar {
    display: none;
  }

  @media (min-width: 1024px) {
    .article-sidebar {
      display: block;
      position: sticky;
      top: 100px;
      align-self: start;
      max-height: calc(100vh - 120px);
      overflow-y: auto;
    }
  }

  /* 平板/中等屏：单列，去掉 TOC 列 */
  @media (max-width: 1023px) {
    .article-layout {
      grid-template-columns: 1fr;
      padding-inline: var(--shell-pad);
    }

    .article-body {
      max-width: var(--reading-width);
      margin-inline: auto;
    }
  }

  @media (max-width: 720px) {
    .article-layout {
      padding-block: 28px 36px;
    }

    .article-body {
      font-size: 16px;
      line-height: 1.9;
    }
  }
</style>
```

- [ ] **Step 6: 跑构建**

Run: `pnpm build`
Expected: 退出码 0。如 `article.data.category` 类型报错（schema 里 category 可选），确认 `getBlogs` 返回类型包含 `category`；如缺失，把 `categoryLabel` 改为固定 `'工程 · 长读'`（去掉 category 判断）。

- [ ] **Step 7: 浏览器对照设计稿**

Run: `pnpm dev`，打开任一文章（如 `/blogs/<某篇>`）。对照 `design.pen` 的 `xV2hU`（文章详情页-浅色）确认：
- Hero 纯文字（Eyebrow 绿 / serif 大标题 / 摘要 / 元信息行），无卡片。
- Hero 下发丝线。
- 双栏：正文 680px 居中 + 右侧 140px sticky TOC（≥1024px 宽时）。
- 滚动时 TOC 当前项高亮（accent + 左边线）。
- 正文 serif 17px、行高 1.8；链接 accent；代码块/引用块无阴影。
- 翻页两列（上一篇 | 下一篇），发丝线分隔，无卡片。
- Mermaid 图 / KaTeX 公式正常渲染。
- 缩窄到 <1024px：TOC 侧栏消失；缩窄到 390px：右下角浮动「目录」按钮，点击从底部滑入抽屉（对照 `ibe65` + `WvwJq`）。

`Ctrl+C`。

- [ ] **Step 8: Commit**

```bash
git add src/pages/blogs/[slug].astro src/components/site/ArticleHero.astro src/components/site/ArticlePager.astro src/components/site/ArticleTocRail.astro src/components/site/ArticleTocDrawer.astro
git commit -m "refactor(article): 文章详情页改为极简静默双栏布局

Hero 去卡片（Eyebrow/serif 标题/摘要/元信息）；双栏（正文 680px +
sticky TOC 140px）；TOC 加滚动高亮（IntersectionObserver）；翻页两列
去卡片；移动端 TOC 改浮动按钮 + 底部抽屉。正文样式去阴影、改发丝线。"
```

---

## Task 9: 回归验证 + 深色模式检查

确认全局顶/底栏替换未破坏其他页面，深色模式正常。

- [ ] **Step 1: 跑完整构建**

Run: `pnpm build`
Expected: 退出码 0，无类型错误。构建日志确认所有文章页面 `/index.html` 生成。

- [ ] **Step 2: 回归检查其他页面**

Run: `pnpm dev`，逐一访问并确认顶/底栏正常、功能未坏（内容区允许「新顶栏+旧卡片」过渡态）：
- `/columns`（专栏列表，用 ColumnCard）
- `/columns/<某专栏>`（专栏详情）
- `/about`（关于）
- `/techStack`（技术栈）
- `/tags`（标签云）
- `/resume`（简历）
- `/en/`（英文首页镜像）

每页确认：顶栏发丝线、Logo、导航、主题按钮正常；页脚发丝线、版权、链接正常。**不**要求内容区已重构。

- [ ] **Step 3: 深色模式检查**

在任一页面点击主题切换按钮，确认：
- 背景变 `#131714`（深底）。
- 强调绿变 `#7FD0A6`。
- 发丝线变深色版（可见）。
- 文字 `#E8EDE9` / `#9CA8A1` 对比度足够。
- 标签下拉弹层、移动抽屉在深色下正常。

- [ ] **Step 4: 移动端响应式抽查**

用浏览器 DevTools 切到 390px 宽，抽查首页 / 写作页 / 文章页：
- 顶栏导航不溢出。
- 首页 Hero 纵向、头像 72px。
- 写作页下拉整宽、清单堆叠。
- 文章页 TOC 浮动按钮 + 抽屉。

`Ctrl+C` 停止 dev server。

- [ ] **Step 5: 如发现回归，修复后重新验证**

如某页面因新 token（如缺少 `--surface-bg`）布局错乱严重，**针对性**补一个临时变量到 `theme.css`（如 `--surface-bg: var(--surface);`）作为过渡，不要重构该页面内容（超出范围）。修复后重跑 `pnpm build`。

- [ ] **Step 6: 最终 Commit（如有修复）**

```bash
git add -A
git commit -m "fix(refactor): 补过渡期临时 token 变量，保证未重构页面不严重错乱"
```

如无修复，跳过此步。

---

## Self-Review 结果

**1. Spec coverage:**
- 第 1 节 token 基座 → Task 1（theme.css）+ Task 2（styles.css/字体/tailwind）✅
- 第 2 节 全局组件（顶栏/页脚/布局/主题按钮）→ Task 3（顶栏）+ Task 4（页脚+按钮）+ Task 5（布局）✅
- 第 3 节 首页（Hero/精选写作/当前关注/移动端）→ Task 6 ✅
- 第 4 节 写作归档（页头/工具栏/标签下拉/归档列表/移动端）→ Task 7 ✅
- 第 5 节 文章详情（Hero/双栏/TOC/正文/翻页/移动抽屉）→ Task 8 ✅
- 第 6 节 组件清单 → 全部覆盖（ArticleCard 删除在 Task 6 Step 2；ArticleList 重构在 Task 7；ArticleHero/Pager/TocRail/TocDrawer 在 Task 8；PageSection/SectionHeading 不再被 3 页引用，保留文件供其他页面用，避免破坏）✅
- 第 7 节 验证约定 → Task 9 + 每任务内置验证 ✅
- 第 8 节 风险 → Task 9 Step 5 处理过渡态回归 ✅

**2. Placeholder scan:** 无 TBD/TODO/"add error handling" 等占位。每个代码步骤含完整代码。

**3. Type consistency:** `categoryLabel` 在 Task 8 ArticleHero props 定义并在 `[slug].astro` 传入；`data-toc-link` 属性在 TocRail/TocDrawer 模板与 `[slug].astro` 脚本一致；`handleTagClick`/`handlePopState`/`updateDescription` 在 ArticleList.vue 保持原名；`filteredHeadings` 仍传给 TocRail/TocDrawer。✅

**注意：** spec 第 6 节提到简化 `PageSection.astro`/`SectionHeading.astro`，但本计划**不修改**这两个文件——因为首页和写作页已不再引用它们，而其他页面（如英文镜像、专栏）可能仍在用。修改它们会扩大影响面、增加回归风险。它们会因新 token 自动获得新外观（边框/背景变量失效 = 自然去卡片），无需手动改。如未来要清理，可单独提任务。
