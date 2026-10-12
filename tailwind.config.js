/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f5f5f5',
        'canvas-soft': '#fafafa',
        'canvas-deep': '#0c0a09',
        ink: '#0c0a09',
        'ink-warm': '#292524',
        body: '#4e4e4e',
        muted: '#777169',
        'muted-soft': '#a8a29e',
        hairline: '#e7e5e4',
        'hairline-soft': '#f0efed',
        'hairline-strong': '#d6d3d1',
        surface: '#ffffff',
        'surface-strong': '#f0efed',
        'surface-dark': '#0c0a09',
        'surface-dark-elevated': '#1c1917',
        'orb-mint': '#a7e5d3',
        'orb-peach': '#f4c5a8',
        'orb-lavender': '#c8b8e0',
        'orb-sky': '#a8c8e8',
        'orb-rose': '#e8b8c4',
      },
      fontFamily: {
        display: ["'EB Garamond'", 'Georgia', "'Times New Roman'", 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: '9999px',
      },
    },
  },
  plugins: [],
}
