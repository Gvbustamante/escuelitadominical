/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        body: ['"Nunito"', 'system-ui', 'sans-serif'],
      },
      colors: {
        sunshine: {
          50: '#fffbeb', 100: '#fff3c4', 200: '#ffe685', 300: '#ffd54d',
          400: '#ffc72c', 500: '#f0ad00', 600: '#c98900', 700: '#9c6b00',
        },
        sky: {
          50: '#eaf8ff', 100: '#cdefff', 200: '#99e0fd', 300: '#5cccf7',
          400: '#1cade4', 500: '#0e93c7', 600: '#0b76a0', 700: '#0a5f80',
        },
        grass: {
          50: '#eefcf3', 100: '#d3f8e0', 200: '#a4efc3', 300: '#6fe0a3',
          400: '#2fc46f', 500: '#1ea559', 600: '#188546', 700: '#166b3a',
        },
        coral: {
          50: '#fff3ee', 100: '#ffe0d2', 200: '#ffbb9c', 300: '#ff9163',
          400: '#ff6a35', 500: '#f04e1d', 600: '#ce3a10', 700: '#a62e0c',
        },
        grape: {
          50: '#f7f1ff', 100: '#ebe0ff', 200: '#d5c1ff', 300: '#b998ff',
          400: '#9b5de5', 500: '#8339d6', 600: '#6c25b8', 700: '#571c93',
        },
        cream: '#f4faff',
        ink: '#15202e',
      },
      borderRadius: {
        blob: '2rem',
      },
      boxShadow: {
        soft: '0 8px 24px -4px rgba(58, 47, 69, 0.12)',
        pop: '0 4px 0 0 rgba(58, 47, 69, 0.15)',
      },
    },
  },
  plugins: [],
}
