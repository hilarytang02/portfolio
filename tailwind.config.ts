import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens — see PRD §4.1
        bg: '#FAFAF8', // warm off-white
        ink: {
          DEFAULT: '#1A1A1A', // text primary
          secondary: '#6B6B6B', // text secondary
          tertiary: '#A0A0A0', // metadata, filter counts
        },
        rule: '#E5E5E2', // rule / border
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        page: '1600px',
        quote: '44ch',
      },
      spacing: {
        // 4 / 8 / 16 / 24 / 40 / 64 / 96 come free from Tailwind's default scale
        // (1/2/4/6/10/16/24). Add the ones that don't map cleanly.
      },
      transitionTimingFunction: {
        'soft-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
