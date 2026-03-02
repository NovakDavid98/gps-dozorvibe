/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0F1A',
          card: '#131825',
        },
        primary: '#3B82F6',
        secondary: '#06B6D4',
        status: {
          green: '#22C55E',
          yellow: '#EAB308',
          red: '#EF4444',
        }
      }
    },
  },
  plugins: [],
}
