import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import vue from '@astrojs/vue';
import { remarkModifiedTime } from './src/plugins/remark-modified-time';

// https://docs.astro.build/en/reference/configuration-reference/

// https://astro.build/config
export default defineConfig({
  site: 'https://www.ginlon.site',
  base: '/',
  trailingSlash: 'never',
  output: 'static',
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
    remarkPlugins: [remarkModifiedTime],
  },
  devToolbar: {
    enabled: false,
  },
});
