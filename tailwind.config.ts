import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        chart: ['Atkinson Hyperlegible', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        stage: {
          ink: '#0b1020',
          panel: '#111827',
          brass: '#d6a11f',
          teal: '#0f766e',
          paper: '#f8fafc'
        }
      }
    }
  },
  plugins: []
} satisfies Config;
