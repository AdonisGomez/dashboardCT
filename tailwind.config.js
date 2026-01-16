/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Optimización: solo generar clases usadas
  safelist: [],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f172a',
          surface: '#1e293b',
          surface2: '#334155',
          border: '#475569',
          text: '#f1f5f9',
          text2: '#cbd5e1',
        },
      },
      // Animaciones ultra-rápidas
      animation: {
        'fade-in': 'fadeIn 0.1s ease-out',
        'slide-up': 'slideUp 0.15s ease-out',
        'slide-in': 'slideIn 0.12s ease-out',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'spin-fast': 'spin 0.6s linear infinite',
      },
      // Transiciones más rápidas
      transitionDuration: {
        'fast': '80ms',
        'normal': '120ms',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(6px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          'from': { opacity: '0', transform: 'translateY(4px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      // Spacing optimizado para touch
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      // Touch-friendly minimum sizes
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
  // Optimización de producción
  future: {
    hoverOnlyWhenSupported: true,
  },
}

