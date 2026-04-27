/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C45A3F',
          dark: '#E07A5F',
          soft: '#FFE8DF',
          'soft-dark': '#3A1F18',
          fg: '#FFFFFF',
          'fg-dark': '#1A0F0A',
        },
        success: {
          DEFAULT: '#4F8F5C',
          dark: '#7BB97A',
          soft: '#E5F2E4',
          'soft-dark': '#1A2A1C',
        },
        warning: {
          DEFAULT: '#B47A1C',
          dark: '#E5B257',
          soft: '#FBF1D9',
          'soft-dark': '#2B2010',
        },
        error: {
          DEFAULT: '#C24A38',
          dark: '#E97864',
          soft: '#FBE5E0',
          'soft-dark': '#2E1612',
        },
        surface: {
          DEFAULT: '#FAF7F4',
          dark: '#171311',
          elevated: '#FFFFFF',
          'elevated-dark': '#211C19',
          muted: '#F2EDE8',
          'muted-dark': '#2A231F',
        },
        border: {
          DEFAULT: '#E8E0D8',
          dark: '#332A26',
          strong: '#D6CBC0',
          'strong-dark': '#453B36',
        },
        content: {
          DEFAULT: '#1F1815',
          dark: '#F4EDE7',
          muted: '#6B5D54',
          'muted-dark': '#B8ADA5',
          subtle: '#9A8A80',
          'subtle-dark': '#7A6E66',
        },
      },
    },
  },
  plugins: [],
};
