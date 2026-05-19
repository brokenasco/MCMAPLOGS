/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        field: '#f5f2ea',
        ink: '#20251f',
        olive: '#56633f',
        brass: '#b58b46',
        clay: '#9b4f31'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        panel: '0 18px 60px rgba(32, 37, 31, 0.12)'
      }
    }
  },
  plugins: []
};
