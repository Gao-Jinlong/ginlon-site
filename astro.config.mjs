import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import vue from '@astrojs/vue';

import netlify from '@astrojs/netlify';
import { remarkModifiedTime } from './src/plugins/remark-modified-time';

// https://docs.astro.build/en/reference/configuration-reference/

// https://astro.build/config
export default defineConfig({
  site: 'http://www.ginlon.site',
  base: '/',
  trailingSlash: 'never',
  output: 'static',
  functionPerRoute: false,
  integrations: [
    tailwind(),
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
    ssr: {
      noExternal: ['viewerjs'],
    },
  },

  markdown: {
    remarkPlugins: [remarkModifiedTime],
  },
  adapter: netlify(),
  devToolbar:{
    enabled: false,
  },

});
