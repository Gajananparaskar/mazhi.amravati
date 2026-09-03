/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Royal Cobalt
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        accent: {
          400: '#f472b6',
          500: '#ec4899',
        },
        saffron: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c', // Indian Saffron
          700: '#c2410c',
        },
        gov: {
          bg:      '#f8fafc',
          surface: '#ffffff',
          border:  '#e2e8f0',
          muted:   '#64748b',
        },
      },
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'Inter', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gov:            '0 1px 3px 0 rgba(37,99,235,0.06), 0 4px 16px 0 rgba(37,99,235,0.04)',
        'gov-lg':       '0 10px 30px -5px rgba(37,99,235,0.12), 0 4px 12px -2px rgba(15,23,42,0.05)',
        'gov-xl':       '0 20px 50px -10px rgba(37,99,235,0.18)',
        'card':         '0 2px 8px 0 rgba(15,23,42,0.04), 0 1px 2px 0 rgba(15,23,42,0.02)',
        'card-lg':      '0 12px 32px 0 rgba(15,23,42,0.08)',
        'float':        '0 14px 34px -4px rgba(15,23,42,0.12), 0 4px 12px 0 rgba(15,23,42,0.04)',
        'glow-saffron': '0 0 20px -2px rgba(249,115,22,0.35)',
        'glow-brand':   '0 0 24px -2px rgba(37,99,235,0.35)',
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
        'gradient-hero':    'linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #1d4ed8 75%, #2563eb 100%)',
        'gradient-saffron': 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
      },
    },
  },
  plugins: [],
};
