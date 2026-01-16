/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        'thunder': ['Oswald', 'sans-serif'],
        'sans': ['Oswald', 'sans-serif'],
      },
      colors: {
        background: '#0a0a0a',
        surface: '#171717',
        border: '#262626',
        primary: '#3b82f6', // Keep blue for now, or make it white/black monochrome
        'primary-hover': '#2563eb',
        text: {
          main: '#ededed',
          muted: '#a3a3a3',
        }
      }
    },
  },
  plugins: [],
}
