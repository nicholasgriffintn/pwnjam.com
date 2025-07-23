/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'cyber': {
          bg: '#0f0f23',
          surface: '#1a1a2e',
          'surface-alt': '#16213e',
          border: '#333366',
        },
        'cyber-green': {
          50: '#e6fff2',
          100: '#ccffe6',
          200: '#99ffcc',
          300: '#66ffb3',
          400: '#33ff99',
          500: '#00ff88',
          600: '#00cc6a',
          700: '#00994d',
          800: '#006633',
          900: '#003319',
        },
        'cyber-red': {
          50: '#ffe6e6',
          100: '#ffcccc',
          200: '#ff9999',
          300: '#ff6b6b',
          400: '#ff4444',
          500: '#ff1a1a',
          600: '#cc0000',
          700: '#990000',
          800: '#660000',
          900: '#330000',
        },
        'cyber-cyan': {
          50: '#e6fffe',
          100: '#ccfffc',
          200: '#99fff9',
          300: '#66fff6',
          400: '#33fff3',
          500: '#4ecdc4',
          600: '#3ea39c',
          700: '#2e7a74',
          800: '#1f524d',
          900: '#0f2926',
        },
        'cyber-text': {
          primary: '#e6e6e6',
          secondary: '#a0a0a0',
          muted: '#666666',
        },
        'cyber-gold': {
          50: '#fffdf0',
          100: '#fffbe0',
          200: '#fff7c2',
          300: '#fff3a3',
          400: '#ffef85',
          500: '#ffd93d',
          600: '#ccae31',
          700: '#998225',
          800: '#665718',
          900: '#332b0c',
        }
      }
    },
  },
  plugins: [],
};
