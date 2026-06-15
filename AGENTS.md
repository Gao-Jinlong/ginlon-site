# AGENTS.md

此文件为 Codex (Codex.ai/code) 在此代码库中工作时提供指导。

## 项目概述

这是一个使用 Astro 5 构建的个人作品集网站，具有国际化（i18n）支持，主要语言为中文，英文为次要语言。网站展示博客文章、项目和技术栈信息，采用现代化响应式设计。

## 开发命令

### 核心开发
- `pnpm dev` - 启动开发服务器（包含 i18n 同步）
- `pnpm start` - 启动开发服务器（不包含 i18n 同步）
- `pnpm build` - 生产环境构建（包含类型检查）
- `pnpm preview` - 预览生产构建

### 国际化
- `pnpm i18n:sync` - 生成 i18n 页面和类型（开发时自动运行）
- `pnpm i18n:extract` - 提取翻译字符串
- `pnpm i18n:generate:pages` - 生成本地化页面
- `pnpm i18n:generate:types` - 为 i18n 生成 TypeScript 类型

### 包管理
- 使用 `pnpm` 作为包管理器（版本 10.20.0）
- 所有命令都应使用 `pnpm` 而不是 `npm`

## 架构

### 框架技术栈
- **Astro 5** - 采用岛屿架构的静态站点生成器
- **Vue 3** - 通过 Astro Vue 集成用于交互式组件
- **TailwindCSS 4** - 带有自定义配置的样式框架
- **TypeScript** - 整个项目的类型安全

### 国际化
- 主要语言：中文（`zh`）
- 次要语言：英文（`en`）
- 回退语言：中文（`zh`）
- 使用 `astro-i18n` 包进行基于路由的 i18n
- 内容结构：`src/content/blogs/zh/` 和 `src/content/blogs/en/`

### 内容管理
- 博客内容存储在 `src/content/blogs/` 中，按语言分子目录
- 支持 `.mdx` 和 `.md` 文件
- 每篇博客文章都有自己的目录和资源文件
- 博客分类：'tech' 和 'note'
- 草稿博客在生产构建中被排除

### 关键目录
- `src/pages/` - Astro 页面和路由
- `src/components/` - 可重用的 Astro 组件
- `src/content/blogs/` - 按语言组织的博客内容
- `src/utils/` - 工具函数和助手
- `src/middleware/` - Astro 中间件
- `src/plugins/` - 自定义 Astro 插件（remark 插件）

### 博客系统
- 使用 `src/utils/getBlogs.ts` 中的 `getBlogs()` 工具进行动态博客获取
- 从文件系统自动检测最后修改时间
- 支持博客分类和草稿
- 支持复杂组件的 Markdown 内容与 MDX
- 用于修改时间跟踪的自定义 remark 插件

### Vue 集成
- Vue 应用入口点：`src/pages/_app.ts`
- 用于主题切换器、导航等交互式组件
- 采用岛屿架构以获得最佳性能

### 样式
- 带有自定义配置的 TailwindCSS
- 响应式设计模式
- 明暗主题支持
- 博客内容的排版插件

## 重要注意事项

- 添加新页面或路由时始终运行 `pnpm i18n:sync`
- 博客内容应包含必需字段的前置元数据：title、layout、lang、poster、createdAt、category
- 使用 `process.env.NODE_ENV` 区分开发和生产环境
- 网站构建为静态文件用于 Netlify 部署
- 博客内容中的图片与 markdown 文件一起存储