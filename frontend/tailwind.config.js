/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body:    ['var(--font-body)',    'sans-serif'],
      },
      colors: {
        ink:   '#0D0D0D',
        paper: '#F5F0E8',
        sage:  { DEFAULT: '#4A7C59', light: '#6B9E7A', dark: '#2E5C3A' },
        amber: { DEFAULT: '#D4A017', light: '#E8C050', dark: '#A07800' },
      },
    },
  },
  plugins: [],
};
