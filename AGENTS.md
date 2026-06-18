# AGENTS.md

此文件为 AI 代码助手（Codex / Claude / 其它 agents）在此代码库中工作时提供指导。读完本文档应能快速进入项目工作。

> 文档事实均依据当前代码库核实（2026-06-18）。修改框架/内容结构后请同步更新本文档，避免再次过时。

## 项目概述

这是一个使用 Astro 5 构建的个人作品集网站，支持中文（主要）与英文（次要镜像）两种路由。网站展示博客文章、专栏、项目和技术栈信息，采用现代化响应式设计，部署为静态文件。

## 开发命令

### 核心开发
- `pnpm dev` - 启动开发服务器（热更新）
- `pnpm start` - 同 `pnpm dev`
- `pnpm build` - 生产环境构建（**含 `astro check` 类型检查 + frontmatter schema 校验**，写完任何内容后都必须运行）
- `pnpm preview` - 预览生产构建
- `pnpm test` / `pnpm test:watch` - 运行 Vitest

### 包管理
- 使用 `pnpm` 作为包管理器（版本 10.20.0）
- 所有命令都应使用 `pnpm` 而不是 `npm`

> ⚠️ 旧版本提到过 `pnpm i18n:sync` 等命令，**这些脚本当前并不存在于 package.json**。本项目只用 Astro 原生 i18n 配置（见下文），不依赖任何 i18n 脚本。新增/修改页面无需手动同步。

## 架构

### 框架技术栈
- **Astro 5** - 采用岛屿架构的静态站点生成器（`output: 'static'`）
- **Vue 3** - 通过 `@astrojs/vue` 用于交互式组件（主题切换、导航等）
- **TailwindCSS 4** - 通过 `@tailwindcss/vite` 集成，带 typography 插件
- **TypeScript** - 整个项目的类型安全
- **KaTeX** - 数学公式渲染（`remark-math` + `rehype-katex`，见"内容写作约定"）
- **Mermaid** - 图表渲染（`astro-mermaid` 集成）

### 国际化（实际状态）
- **实现方式**：Astro 原生 i18n（`astro.config.mjs` 里的 `i18n` 配置块），**不是**第三方 `astro-i18n` 包。
- **语言**：`defaultLocale: 'zh'`，`locales: ['zh']`，`prefixDefaultLocale: false`（中文不带前缀）。
- **英文路由**：存在 `src/pages/en/` 镜像路由（about / blogs / tags / techStack / index），但**内容集合目前只有中文**（`src/content/blogs/zh/`）。
- 英文页面与中文页面在 `src/pages/` 下各自维护，无自动翻译机制。

### 内容集合（关键：`src/content.config.ts`）

所有内容集合都用 Astro 的 `glob` loader 从文件系统加载。集合定义见 `src/content.config.ts`：

| 集合 | 加载路径 | 说明 |
|---|---|---|
| `blogs` | `src/content/blogs/**/*.mdx` | 博客文章，按语言分目录（目前只有 `zh/`） |
| `resume` | `src/content/resume/**/*.mdx` | 简历，纯 markdown，只需 `format` 字段 |
| `columns` | `src/content/columns/**/index.md` | **专栏入口**（每个专栏一个），只描述专栏元信息 |
| `columnArticles` | `src/content/columns/**/*.mdx` | **专栏文章**（注意：会匹配到专栏入口 `index.md` 之外的 mdx） |

**各集合 schema 的必填/可选字段**（写作时 frontmatter 必须符合，否则 `pnpm build` 报错）：

```ts
// blogs：必填 title + permalink + createdAt；category 有默认值
{ lang: 'zh'(固定), title, permalink, createdAt, description?, subtitle?, poster?,
  category?: 'tech'|'note'(默认 tech), draft?, tags?, featured? }

// columns（专栏入口 index.md）：必填 title + description
{ title, description, poster?, status?: 'ongoing'|'completed'(默认 ongoing), draft? }

// columnArticles（专栏文章 index.mdx）：必填 title + createdAt
{ title, createdAt, subtitle?, poster?, updatedAt?, tags?, order?, draft? }
```

> ⚠️ 旧版本说博客必需 `layout/lang/poster/category`，这是**不准确的**：`layout` 不在 schema 里、`lang` 已固定为 `'zh'`、`poster` 与 `category` 是可选（category 有默认）。

### 关键目录
- `src/pages/` - Astro 页面和路由（含 `en/` 英文镜像）
- `src/components/` - 可重用的 Astro 组件
- `src/content/blogs/` - 博客内容，按语言分子目录（`zh/`）
- `src/content/columns/` - **专栏内容**（入口 `index.md` + 文章 `NN-slug/index.mdx`）
- `src/utils/` - 工具函数（含 `getBlogs.ts`）
- `src/plugins/` - 自定义 remark 插件（如 `remark-modified-time`）

> ⚠️ 旧版本列出的 `src/middleware/` 目录**当前不存在**。

### 博客系统
- 使用 `src/utils/getBlogs.ts` 的 `getBlogs()` 动态获取博客
- 修改时间由自定义 remark 插件从文件系统自动检测
- 支持博客分类（`tech` / `note`）和草稿（`draft: true` 在生产构建中排除）
- 支持 `.mdx`（含组件）；博客**只支持 `.mdx`**（schema glob 限定 `**/*.mdx`）
- 图片与 markdown 文件一起存储

### 专栏系统（新增）
- 目录结构：`src/content/columns/<column-name>/`
  - `index.md` — 专栏入口，描述专栏整体（标题、简介、状态）
  - `<NN-slug>/index.mdx` — 单篇专栏文章，`NN` 是两位数字用于排序，`order` 字段决定文章在专栏内的顺序
- 现有专栏示例：`src/content/columns/langgraph-notes/`（含 4 篇文章）
- 专栏文章 frontmatter 字段比博客简单：**没有 `lang`/`category`/`permalink`**，用 `order` 排序
- 专栏页面路由：`src/pages/columns/`

### 样式
- TailwindCSS + typography 插件（处理博客/专栏正文排版）
- 响应式设计，明暗主题支持

## 内容写作约定（重要）

这一节是踩坑总结，**新增/修改内容前务必先读**。

### 数学公式：用 KaTeX，不要用反引号
项目已在 `astro.config.mjs` 配置 `remarkMath` + `rehypeKatex`，**数学公式会被 KaTeX 渲染**。

- ✅ 正确：`$w_i$`、`$\sum_{i=1}^{n} x_i$`、`$$E = mc^2$$`
- ❌ 错误：`` `w_i` ``（反引号行内代码）——会**原样显示成文本 `w_i`**，下标不会渲染，看起来像未渲染的 LaTeX 原文
- 下标 `_`、求和 `\sum`、乘号 `\cdot`、上下标 `^{}`/`_{}` 都按 LaTeX 语法写
- 参考已验证的写法：`src/content/columns/langgraph-notes/04-pregel-bsp/index.mdx`

### Mermaid 图
- 用 ` ```mermaid ` 代码块，已验证可用：`flowchart`、`sequenceDiagram`、`stateDiagram-v2`（含 `note right of` 语法）
- 节点文字含特殊字符或换行时用双引号包裹并用 `<br/>` 换行：`A["① 局部计算<br/>各处理器干活"]`

### 专栏文章风格（沿用 langgraph-notes 专栏已建立的风格）
- **一句话定义**开头（加粗核心定义）
- **心智模型/机制**：配 mermaid 图 + 表格
- **实际应用**：代码示例（伪代码用 ` ```text `，避免高亮报错）
- **设计规则**
- **一句话总结**收尾
- 大量使用：表格、mermaid 图、通俗类比
- frontmatter 沿用专栏统一 poster（`photo-1635070041078-e363dbe005cb`）

## 构建验证约定

写完/改完任何内容（博客、专栏、组件）后：

1. **必须运行 `pnpm build`**——它会做 `astro check`（类型检查）+ frontmatter schema 校验 + 完整静态构建。
2. **验证 mermaid 真渲染**：构建日志会打印 `[astro-mermaid] Remark transformed mermaid block #N in <file>`，确认块数与预期一致。
3. **验证 KaTeX 真渲染**（含公式时）：检查产物 `dist/**/index.html` 是否含 `class="katex"`。
   - 快速命令：在 `dist/` 下搜索 `katex` 出现次数应 > 0。
4. **验证文章被收录**：构建日志的页面列表里应出现该文章的 `/index.html`。

> 不要只凭"构建退出码 0"就认为渲染正确——某些渲染问题（如公式写成反引号）不会让构建失败，但页面是错的。验证要看产物。

## 重要注意事项

- `pnpm build` = `astro check && astro build`，类型/schema 错误会直接 fail。
- frontmatter 必须严格符合 `src/content.config.ts` 里的 schema（见上文"内容集合"表）。
- 博客用 `.mdx`，frontmatter 必填 `title` + `permalink` + `createdAt`。
- 专栏文章用 `.mdx`，frontmatter 必填 `title` + `createdAt`，用 `order` 排序。
- 网站构建为静态文件用于 Netlify 部署。
- 修改框架集成（astro.config.mjs）、内容 schema（content.config.ts）后，**请同步更新本 AGENTS.md**，避免文档再次过时。
