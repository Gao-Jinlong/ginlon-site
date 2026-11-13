import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import vue from '@astrojs/vue';
import mermaid from 'astro-mermaid';
import { remarkModifiedTime } from './src/plugins/remark-modified-time';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://docs.astro.build/en/reference/configuration-reference/

// https://astro.build/config
export default defineConfig({
  site: 'https://www.ginlon.site',
  base: '/',
  trailingSlash: 'never',
  output: 'static',
  // Astro 7 默认的 compressHTML: 'jsx' 会按 JSX 规则裁剪空白，吞掉内联元素之间
  // 以及多行文本首尾的空格（例如 "GitHub 邮箱" 变成 "GitHub邮箱"）。这里关闭
  // JSX 式裁剪，避免升级带来排版回归。
  compressHTML: true,
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    mdx({
      syntaxHighlight: 'shiki',
    }),
    vue({
      appEntrypoint: '/src/pages/_app',
    }),
    mermaid(),
  ],

  image: {
    service: {
      config: {
        limitInputPixels: false,
      },
    },
  },

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['viewerjs'],
    },
  },

  markdown: {
    // Astro 7 默认使用 Sätteri Markdown 处理器；本站依赖 remark/rehype 插件
    // （KaTeX、Mermaid、修改时间），因此显式使用 unified 处理器。
    processor: unified({
      remarkPlugins: [remarkModifiedTime, remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
  },
  devToolbar: {
    enabled: false,
  },
});
