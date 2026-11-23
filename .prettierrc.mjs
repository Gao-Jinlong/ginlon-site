/** @type {import("prettier").Options} */
const prettierConfig = {
  plugins: ['prettier-plugin-astro'],
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
