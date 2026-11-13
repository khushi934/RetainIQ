/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F8FA',
        card: '#FFFFFF',
        sidebar: '#FFFFFF',
        primary: '#20242C',
        secondary: '#697386',
        border: '#E6E8EC',
        accent: {
          DEFAULT: '#315E81',
          hover: '#274b68',
          light: '#F0F5F9',
        },
        teal: {
          DEFAULT: '#438A83',
          hover: '#37736d',
          light: '#F0F7F6',
        },
        warning: {
          DEFAULT: '#D69A37',
          light: '#FDF7EE',
        },
        danger: {
          DEFAULT: '#C75B58',
          light: '#FBF2F2',
        },
        success: {
          DEFAULT: '#3E8B69',
          light: '#F0F7F3',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.03)',
        dropdown: '0 4px 16px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
