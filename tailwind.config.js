/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable dark mode with class strategy
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'background-light': '#f8fafc',
        'background-dark': '#27272a',
        'grey-100-light': '#f9f9f9',
        'grey-100-dark': '#1c1c1c',
        'grey-200-light': '#222222',
        'grey-200-dark': '#eaeaea',
        'grey-400-light': '#444444',
        'grey-400-dark': '#acacac',
        'grey-600-light': '#333333',
        'grey-600-dark': '#ffffff',
        'grey-900-light': '#111111',
        'grey-900-dark': '#fafafa',
        rose: '#e11d48',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function ({ addBase, theme }) {
      addBase({
        ':root': {
          '--background': theme('colors.background-light'),
          '--bg-grey-100': theme('colors.grey-100-light'),
          '--grey-200': theme('colors.grey-200-light'),
          '--grey-400': theme('colors.grey-400-light'),
          '--grey-600': theme('colors.grey-600-light'),
          '--grey-900': theme('colors.grey-900-light'),
          '--clr-rose': theme('colors.rose'), // Add the rose color variable for dark mode

          '--active-link-bg': theme('colors.grey-200-dark'),
          '--active-link-color': theme('colors.grey-900-light'),
          '--active-link-hover-bg': theme('colors.grey-200-light'),
        },
        '.dark': {
          '--background': theme('colors.background-dark'),
          '--bg-grey-100': theme('colors.grey-100-dark'),
          '--grey-200': theme('colors.grey-200-dark'),
          '--grey-400': theme('colors.grey-400-dark'),
          '--grey-600': theme('colors.grey-600-dark'),
          '--grey-900': theme('colors.grey-900-dark'),
          '--clr-rose': theme('colors.rose'), // Add the rose color variable for dark mode

          '--active-link-bg': theme('colors.grey-900-light'),
          '--active-link-color': theme('colors.grey-200-dark'),
          '--active-link-hover-bg': theme('colors.grey-900-dark'),
        },
        body: {
          fontFamily: "'Inter', sans-serif",
          padding: '0 0.5rem',
          color: 'var(--grey-600)',
          backgroundColor: 'var(--background)',
        },
        main: {
          maxWidth: '65ch',
          margin: '0 auto',
        },
        a: {
          transition: 'all 0.3s ease',
          '&:hover': {
            color: 'var(--clr-rose)',
          },
        },
      });
    },
    function ({ addComponents, theme }) {
      addComponents({
        '.active-link': {
          backgroundColor: 'var(--active-link-bg)',
          color: 'var(--active-link-color)',
          transition: 'all 0.3s ease',
          boxSizing: 'border-box',
          borderWidth: '1px',
          borderColor: 'transparent',
        },
      });
    },
  ],
};
