/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Default primary color
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'typing': 'typing 1.4s infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        typing: {
          '0%, 60%, 100%': { opacity: '0.3' },
          '30%': { opacity: '1' },
        },
      },
      boxShadow: {
        'widget': '0 10px 40px rgba(0, 0, 0, 0.15)',
        'button': '0 4px 14px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
  // Importante: usar un prefijo para evitar conflictos con estilos del sitio host
  prefix: 'sw-',
  // Importante: deshabilitar preflight para no afectar estilos del sitio host
  corePlugins: {
    preflight: false,
  },
}

