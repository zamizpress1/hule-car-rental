/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#f97316', hover: '#ea580c', light: '#fff7ed' },
        telegram: '#229ED9',
        surface: '#FFFFFF',
        background: '#F1F5F9',
        content: '#0F172A',
        muted: '#64748B',
        border: '#E2E8F0',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444'
      },
      fontFamily: { sans: ['Outfit', 'Inter', 'sans-serif'] },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(0,0,0,0.05)',
        'floating': '0 20px 40px -15px rgba(37,99,235,0.25)',
        'nav': '0 -10px 40px -10px rgba(0,0,0,0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
      }
    },
  },
  plugins: [],
}
