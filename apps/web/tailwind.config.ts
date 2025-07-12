import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6B46C1', // A warm, inviting purple
          light: '#805AD5',
          dark: '#553C9A',
        },
        secondary: {
          DEFAULT: '#F6AD55', // A soft, comforting orange
          light: '#FBD38D',
          dark: '#DD6B20',
        },
        accent: '#48BB78', // A vibrant green for accents
        background: {
          light: '#FDFDFD', // Off-white for light mode background
          dark: '#1A202C',  // Dark gray for dark mode background
        },
        text: {
          light: '#2D3748', // Dark gray for light mode text
          dark: '#E2E8F0',  // Light gray for dark mode text
        },
      },
      fontFamily: {
        sans: ['Inter', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Merriweather', 'serif'], // Example serif font
      },
    },
  },
  plugins: [],
};

export default config;