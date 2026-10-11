/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Linear/Vercel/Stripe 2026 SaaS Neutral Slate & Surface Palette
        surface: {
          subtle: '#F7F8FC',
          DEFAULT: '#FFFFFF',
          muted: '#F1F3F9',
          border: '#E6E8EF',
          hover: '#F8F9FD',
        },
        text: {
          primary: '#151827',
          secondary: '#667085',
          muted: '#98A2B3',
        },
        // Refined 2026 Violet Accent Palette
        accent: {
          50: '#F4F2FF',
          100: '#EBE7FE',
          200: '#D8D0FD',
          300: '#B8A8FB',
          400: '#947BF8',
          500: '#6D4AFF',
          600: '#5936E8',
          700: '#4727CB',
          800: '#3A20A7',
          900: '#2A1778',
        },
        // Semantic Indicators
        status: {
          success: '#12B76A',
          'success-bg': '#ECFDF3',
          'success-border': '#A6F4C5',
          warning: '#F79009',
          'warning-bg': '#FFFAEB',
          'warning-border': '#FEDF89',
          error: '#F04438',
          'error-bg': '#FEF3F2',
          'error-border': '#FECDCA',
        },
        brand: {
          50: '#F4F2FF',
          100: '#EBE7FE',
          200: '#D8D0FD',
          300: '#B8A8FB',
          400: '#947BF8',
          500: '#6D4AFF',
          600: '#5936E8',
          700: '#4727CB',
          800: '#3A20A7',
          900: '#2A1778',
          950: '#140A3C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(16, 24, 40, 0.04)',
        'card': '0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)',
        'card-hover': '0 4px 12px rgba(16, 24, 40, 0.08), 0 1px 2px rgba(16, 24, 40, 0.04)',
        'dropdown': '0 10px 30px -4px rgba(16, 24, 40, 0.12), 0 4px 8px -2px rgba(16, 24, 40, 0.06)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      }
    },
  },
  plugins: [],
}
