/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // modo oscuro controlado por clase en <html>
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta inspirada en el logo (gorila azul)
        brand: {
          DEFAULT: '#1CA3DE',
          50: '#e8f6fd', 100: '#c6e9f9', 200: '#93d6f3', 300: '#5cc0ec',
          400: '#1CA3DE', 500: '#1486bb', 600: '#106a96', 700: '#0e5577',
          800: '#0d4660', 900: '#0b1120',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
