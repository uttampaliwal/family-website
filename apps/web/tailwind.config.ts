import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import aspectRatio from '@tailwindcss/aspect-ratio';

const withOpacity = (variableName: string) => {
  return ({ opacityValue }: { opacityValue?: number }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
};

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: withOpacity('--color-background'),
        surface: withOpacity('--color-surface'),
        primary: withOpacity('--color-primary'),
        secondary: withOpacity('--color-secondary'),
        accent: withOpacity('--color-accent'),
        'text-base': withOpacity('--color-text-base'),
        'text-muted': withOpacity('--color-text-muted'),
        success: withOpacity('--color-success'),
        warning: withOpacity('--color-warning'),
        error: withOpacity('--color-error'),
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
        'gradient-accent': 'linear-gradient(to right, var(--color-accent), var(--color-primary))',
      },
      fontFamily: {
        sans: ['Inter', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Merriweather', 'serif'], // Example serif font
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      transitionDuration: {
        '2000': '2000ms',
      },
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [
    forms,
    aspectRatio,
  ],
  darkMode: 'class',
};

export default config;
