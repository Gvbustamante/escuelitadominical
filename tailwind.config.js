/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: 'var(--brand-primary, #2952e3)',
          accent: 'var(--brand-secondary, #0ea5a4)',
          50: 'var(--brand-primary-50, #eef2fd)',
          100: 'var(--brand-primary-100, #dbe4fb)',
          600: 'var(--brand-primary-600, #1d3fc0)',
          700: 'var(--brand-primary-700, #17329a)',
        },
        surface: {
          DEFAULT: '#f7f8fa',
          raised: '#ffffff',
          sunken: '#eef0f3',
        },
        ink: {
          DEFAULT: '#0f172a',
          soft: '#475569',
          faint: '#94a3b8',
        },
        success: { 50: '#ecfdf3', 500: '#12b76a', 600: '#0d9754', 700: '#0a7a44' },
        warning: { 50: '#fffaeb', 500: '#f79009', 600: '#dc7009', 700: '#b45409' },
        danger: { 50: '#fef3f2', 500: '#f04438', 600: '#d92d20', 700: '#b42318' },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15, 23, 42, 0.06)',
        card: '0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px -12px rgba(15, 23, 42, 0.12)',
        popover: '0 4px 6px -2px rgba(15, 23, 42, 0.08), 0 12px 32px -8px rgba(15, 23, 42, 0.18)',
      },
    },
  },
  plugins: [],
}
