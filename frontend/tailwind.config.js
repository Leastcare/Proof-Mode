/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base canvas
        'void': '#080808',
        'near-black': '#0D0D0C',
        'charcoal': '#151515',
        'warm-charcoal': '#20201D',
        'surface': '#1A1A18',
        'surface-raised': '#222220',
        // Typography
        'bone': '#F4F1EA',
        'soft-white': '#DDD9D0',
        'muted': '#8B8983',
        'dim': '#55534E',
        'ghost': '#3A3835',
        // Semantic
        'verified': '#4A7C59',
        'verified-dim': '#2D4A36',
        'verified-text': '#7DBF8E',
        'failed': '#8B3A3A',
        'failed-dim': '#4A1F1F',
        'failed-text': '#C97070',
        'attention': '#8B6914',
        'attention-dim': '#4A3A0A',
        'attention-text': '#D4A84B',
        'cant-verify': '#6B5C3A',
        'cant-verify-text': '#B8956A',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        'micro': ['11px', { lineHeight: '1.4', letterSpacing: '0.08em' }],
        'label': ['12px', { lineHeight: '1.4', letterSpacing: '0.06em' }],
        'body-sm': ['14px', { lineHeight: '1.6' }],
        'body': ['16px', { lineHeight: '1.6' }],
        'body-lg': ['18px', { lineHeight: '1.5' }],
        'subhead': ['20px', { lineHeight: '1.4' }],
        'title': ['28px', { lineHeight: '1.2' }],
        'hero-sm': ['48px', { lineHeight: '1.05' }],
        'hero': ['72px', { lineHeight: '1.0' }],
        'hero-lg': ['96px', { lineHeight: '0.95' }],
        'hero-xl': ['128px', { lineHeight: '0.9' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.6s ease forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
