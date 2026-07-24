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
          50: '#fffaeb', 100: '#fff2c6', 200: '#ffe488', 300: '#ffd24d',
          400: '#ffbe1f', 500: '#ffa500', 600: '#e6810a', 700: '#bf5f0c',
        },
        sky: {
          50: '#eefbff', 100: '#d9f4ff', 200: '#b8eaff', 300: '#86dbff',
          400: '#4dc4ff', 500: '#22a6f2', 600: '#1584cc', 700: '#1568a3',
        },
        grass: {
          50: '#f1fbf0', 100: '#dff7db', 200: '#c0eeb9', 300: '#93e086',
          400: '#63cc53', 500: '#3fb230', 600: '#2f9023', 700: '#28711f',
        },
        coral: {
          50: '#fff1f0', 100: '#ffe0dd', 200: '#ffc6c1', 300: '#ff9d94',
          400: '#ff6e60', 500: '#f9483a', 600: '#e2301f', 700: '#bd2618',
        },
        grape: {
          50: '#f8f2ff', 100: '#eee0ff', 200: '#dcc2ff', 300: '#c398ff',
          400: '#a866ff', 500: '#8f3ffb', 600: '#7a26e0', 700: '#631cb8',
        },
        cream: '#fffdf7',
        ink: '#3a2f45',
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
