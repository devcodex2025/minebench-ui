module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        mining: {
          50: '#f3f7fa',
          100: '#e4edf3',
          200: '#c7d9e4',
          300: '#9fbdd0',
          400: '#6f9cb8',
          500: '#417b9f',
          600: '#285979',
          700: '#1c4058',
          800: '#182F40',
          900: '#0f1f2b',
        }
      },
    },
  },
  plugins: [],
}
