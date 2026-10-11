/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#141414',
        accent: { DEFAULT: '#16a34a', muted: '#dcfce7' },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'Noto Naskh Arabic', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
