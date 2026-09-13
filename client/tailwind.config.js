/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ios: {
          blue: '#007AFF',
          teal: '#30B0C7',
          green: '#34C759',
          indigo: '#5856D6',
          purple: '#AF52DE',
          pink: '#FF2D55',
          orange: '#FF9500',
          yellow: '#FFCC00',
          red: '#FF3B30',
          bgLight: '#F2F2F7',
          bgDark: '#0B0F17',
          cardLight: 'rgba(255, 255, 255, 0.75)',
          cardDark: 'rgba(18, 24, 38, 0.65)',
        },
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'ios-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
        'ios-glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'ios-float': '0 20px 40px -15px rgba(0, 0, 0, 0.12)',
        'ios-float-dark': '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
