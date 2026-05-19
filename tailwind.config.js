/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        field: '#e8dfc8',
        ink: '#171a16',
        olive: '#4f5d3a',
        brass: '#dfae3b',
        clay: '#8b3f2f',
        coyote: '#b8a16a',
        paper: '#fbfaf5',
        charcoal: '#101412'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        panel: '0 18px 60px rgba(16, 20, 18, 0.16)'
      }
    }
  },
  plugins: []
};
