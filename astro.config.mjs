import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig(
  {
    integrations: [
      tailwind(),
      mdx({
        syntaxHighlight: 'shiki',
      }),
      vue({ appEntrypoint: '/src/pages/_app' }),
    ],
  }, // your configuration options here...
  // https://docs.astro.build/en/reference/configuration-reference/
);
