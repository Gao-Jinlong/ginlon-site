/** @type {import("prettier").Options} */
const prettierConfig = {
  plugins: ['prettier-plugin-astro', 'prettier-plugin-tailwindcss'],
  overrides: [
    {
      files: '*.{md,mdx}',
      options: {
        parser: 'markdown',
      },
    },
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
  singleQuote: true,
  arrowParens: 'avoid',
};

export default prettierConfig;
