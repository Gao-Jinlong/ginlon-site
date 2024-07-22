import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

import vue from '@astrojs/vue';

// https://astro.build/config
// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: 'https://gao-jinlong.github.io/',
  base: '/ginlon-site',
  integrations: [
    tailwind(),
    mdx({
      syntaxHighlight: 'shiki',
    }),
    vue({ appEntrypoint: '/src/pages/_app' }),
  ],
  image: {
    service: {
      config: {
        limitInputPixels: false,
      },
    },
  },
});
