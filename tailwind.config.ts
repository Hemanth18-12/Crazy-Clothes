import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FAF9F6', // Warm off-white background
        ink: '#121212', // Soft black for text
        accent: '#A66E5E', // Muted terracotta/clay interactive state
        stone: {
          light: '#F3F2EE', // Subtle backgrounds & hover states
          DEFAULT: '#E2DFD8', // Borders & dividers
          dark: '#7D796F', // Secondary text
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      letterSpacing: {
        eyebrow: '0.2em',
        tightest: '-0.05em',
        wide: '0.05em',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
export default config;
