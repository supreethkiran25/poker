/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        felt: {
          light: '#1b4332',
          DEFAULT: '#0f291e',
          dark: '#081c14',
          border: '#2d6a4f',
        },
        casino: {
          gold: '#d4af37',
          goldLight: '#f3e5ab',
          goldDark: '#997d23',
          red: '#d90429',
          card: '#ffffff',
          dark: '#0d1117',
          surface: '#161b22',
          surfaceLight: '#21262d',
          border: '#30363d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        table: 'inset 0 0 80px rgba(0,0,0,0.8), 0 20px 50px rgba(0,0,0,0.9)',
        card: '0 8px 16px -2px rgba(0,0,0,0.5), 0 2px 4px -2px rgba(0,0,0,0.3)',
        chip: '0 4px 8px rgba(0,0,0,0.4)',
      }
    },
  },
  plugins: [],
}
