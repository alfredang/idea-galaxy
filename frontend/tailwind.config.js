/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#020204',
        surface: '#0A0A0A',
        card: 'rgba(10, 10, 10, 0.6)',
        accent: {
          primary: '#FF6B00',
          secondary: '#FFA500',
          glow: 'rgba(255, 107, 0, 0.5)',
          beam: 'rgba(255, 165, 0, 0.2)'
        },
        status: {
          spark: '#FFFFFF',
          developing: '#FFD700',
          refined: '#FF6B00',
          completed: '#00E5FF'
        }
      },
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'drift': 'drift 20s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.7s ease-out forwards',
        'scale-in': 'scaleIn 0.7s ease-out forwards'
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(10px, 5px)' }
        },
        glow: {
          '0%': { opacity: '0.5', filter: 'blur(10px)' },
          '100%': { opacity: '1', filter: 'blur(15px)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      },
      backdropBlur: {
        xs: '2px'
      }
    },
  },
  plugins: [],
}
