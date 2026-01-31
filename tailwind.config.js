import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fad7ac',
          300: '#f6ba77',
          400: '#f19340',
          500: '#ed751c',
          600: '#de5b12',
          700: '#b84411',
          800: '#933716',
          900: '#773014',
        },
        neko: {
          bg: '#faf9f7',
          card: '#ffffff',
          text: '#1a1a1a',
          muted: '#6b6b6b',
          border: '#e5e5e5',
        }
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#1a1a1a',
            a: {
              color: '#ed751c',
              '&:hover': {
                color: '#de5b12',
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    typography,
  ],
}
