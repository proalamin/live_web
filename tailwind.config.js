/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // FIFA brand-adjacent greens / dark
        pitch: {
          900: '#0a1628',
          800: '#0f2040',
          700: '#142952',
          600: '#1a3566',
        },
        accent: {
          DEFAULT: '#00d4aa',
          dark:    '#00a882',
        },
      },
    },
  },
  plugins: [],
}
