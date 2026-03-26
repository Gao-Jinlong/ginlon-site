import { getViteConfig } from 'astro/config';

// `getViteConfig()` applies the Astro compiler settings so Vitest can import `.astro` components.
export default getViteConfig({
  test: {
    environment: 'node',
  },
});
