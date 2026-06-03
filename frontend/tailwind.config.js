/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#003D7A',
        secondary: '#0066CC',
        accent: '#FFB81C',
      },
    },
  },
  plugins: [forms],
};
