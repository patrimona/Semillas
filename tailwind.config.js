/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#20231f',
        paper: '#f4f2ed',
        acid: '#d9ff43',
        forest: '#214b39',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 24px 70px rgba(32,35,31,.10)',
      },
    },
  },
  plugins: [],
}
