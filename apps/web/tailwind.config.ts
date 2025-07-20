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
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          DEFAULT: '#6B46C1', // Existing primary
        },
        secondary: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          DEFAULT: '#F6AD55', // Existing secondary
        },
        accent: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          DEFAULT: '#48BB78', // Existing accent
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        background: {
          DEFAULT: 'var(--color-bg-default)',
          surface: 'var(--color-bg-surface)',
          light: '#FDFDFD', // Pure white for light mode background
          dark: '#121212',  // Darker background for dark mode
        },
        text: {
          DEFAULT: 'var(--color-text-default)',
          light: '#2D3748', // Dark gray for light mode text
          dark: '#E0E0E0',  // Light gray for dark mode text
        },
        surface: {
          light: '#FFFFFF', // White for cards/components in light mode
          dark: '#1E1E1E',  // Slightly lighter than dark background for cards/components
        },
        onSurface: {
          light: '#2D3748', // Text on light surface
          dark: '#E0E0E0',  // Text on dark surface
        },
        success: '#10B981', // Green
        warning: '#F59E0B', // Orange
        error: '#EF4444',   // Red
      },
      backgroundImage: {
        'gradient-light-header': 'linear-gradient(to right, #a8c0ff, #3f2b96)',
        'gradient-dark-header': 'linear-gradient(to right, #232526, #414345)',
      },
      fontFamily: {
        sans: ['Inter', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Merriweather', 'serif'], // Example serif font
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;