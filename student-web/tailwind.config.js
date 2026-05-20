/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#c4c6ff',
          300: '#a5a7fc',
          400: '#8b8df7',
          500: '#667eea',
          600: '#5a6cdb',
          700: '#4c5bc7',
          800: '#3f4ba3',
          900: '#2d3561',
        },
        accent: '#764ba2',
      },
    },
  },
  plugins: [],
}
