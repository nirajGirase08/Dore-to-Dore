export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Libre Caslon Text"', 'Georgia', 'serif'],
        accent: ['Antonio', 'Impact', 'sans-serif'],
      },
      keyframes: {
        'slide-in': {
          '0%':   { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.25s ease-out',
      },
      colors: {
        primary: {
          50: '#f8f4ec',
          100: '#efe7d6',
          200: '#dccca9',
          300: '#c7ae75',
          400: '#b49346',
          500: '#a1842f',
          600: '#6c5b20',
          700: '#3f3413',
          800: '#241e11',
          900: '#181511',
        },
        vandy: {
          black: '#181511',
          gold: '#a1842f',
          cream: '#f8f4ec',
          sand: '#d8ccbc',
          oak: '#7c6248',
          sage: '#759a90',
          sky: '#7daed3',
          highlight: '#e2aa58',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
    },
  },
  plugins: [],
}
