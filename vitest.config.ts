import { getViteConfig } from 'astro/config';
import { defineConfig } from 'vitest/config';

// `getViteConfig()` applies the Astro compiler settings so Vitest can import `.astro` components.
export default defineConfig(
  getViteConfig({
    test: {
      environment: 'node',
    },
  }),
);
