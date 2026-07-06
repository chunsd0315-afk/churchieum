/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Primary (Blue) ──────────────────────────── */
        primary: {
          50:  'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        /* ── Secondary (Indigo) ───────────────────────── */
        secondary: {
          50:  'var(--color-secondary-50)',
          100: 'var(--color-secondary-100)',
          200: 'var(--color-secondary-200)',
          300: 'var(--color-secondary-300)',
          400: 'var(--color-secondary-400)',
          500: 'var(--color-secondary-500)',
          600: 'var(--color-secondary-600)',
          700: 'var(--color-secondary-700)',
          800: 'var(--color-secondary-800)',
          900: 'var(--color-secondary-900)',
        },
        /* ── Accent (Amber/Orange) ───────────────────── */
        accent: {
          50:  'var(--color-accent-50)',
          100: 'var(--color-accent-100)',
          200: 'var(--color-accent-200)',
          300: 'var(--color-accent-300)',
          400: 'var(--color-accent-400)',
          500: 'var(--color-accent-500)',
          600: 'var(--color-accent-600)',
          700: 'var(--color-accent-700)',
          800: 'var(--color-accent-800)',
          900: 'var(--color-accent-900)',
        },
        /* ── Semantic ────────────────────────────────── */
        success: {
          50:  'var(--color-success-50)',
          100: 'var(--color-success-100)',
          500: 'var(--color-success-500)',
          600: 'var(--color-success-600)',
          700: 'var(--color-success-700)',
        },
        warning: {
          50:  'var(--color-warning-50)',
          100: 'var(--color-warning-100)',
          500: 'var(--color-warning-500)',
          600: 'var(--color-warning-600)',
          700: 'var(--color-warning-700)',
        },
        error: {
          50:  'var(--color-error-50)',
          100: 'var(--color-error-100)',
          500: 'var(--color-error-500)',
          600: 'var(--color-error-600)',
          700: 'var(--color-error-700)',
        },
        /* ── Surface / Background ────────────────────── */
        surface: 'var(--color-bg-surface)',
        page:    'var(--color-bg-page)',
        sunken:  'var(--color-bg-sunken)',
      },

      fontFamily: {
        sans: ['var(--font-family-brand)', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },

      fontWeight: {
        normal:   'var(--font-regular)',
        medium:   'var(--font-semibold)',
        semibold: 'var(--font-semibold)',
        bold:     'var(--font-bold)',
        extrabold: 'var(--font-bold)',
        black:    'var(--font-bold)',
      },

      fontSize: {
        'xs':   ['var(--text-xs)',   { lineHeight: 'var(--leading-normal)' }],
        'sm':   ['var(--text-sm)',   { lineHeight: 'var(--leading-normal)' }],
        'base': ['var(--text-base)', { lineHeight: 'var(--leading-normal)' }],
        'md':   ['var(--text-md)',   { lineHeight: 'var(--leading-snug)' }],
        'lg':   ['var(--text-lg)',   { lineHeight: 'var(--leading-snug)' }],
        'xl':   ['var(--text-xl)',   { lineHeight: 'var(--leading-tight)' }],
        '2xl':  ['var(--text-2xl)',  { lineHeight: 'var(--leading-tight)' }],
        '3xl':  ['var(--text-3xl)',  { lineHeight: 'var(--leading-tight)' }],
        '4xl':  ['var(--text-4xl)',  { lineHeight: 'var(--leading-tight)' }],
      },

      borderRadius: {
        'xs':    'var(--radius-xs)',
        'sm':    'var(--radius-sm)',
        'md':    'var(--radius-md)',
        'lg':    'var(--radius-lg)',
        'xl':    'var(--radius-xl)',
        '2xl':   'var(--radius-2xl)',
        '3xl':   'var(--radius-3xl)',
        'full':  'var(--radius-full)',
        'card':  'var(--radius-card)',
        'btn':   'var(--radius-btn)',
        'input': 'var(--radius-input)',
        'badge': 'var(--radius-badge)',
      },

      boxShadow: {
        'xs':           'var(--shadow-xs)',
        'sm':           'var(--shadow-sm)',
        'md':           'var(--shadow-md)',
        'lg':           'var(--shadow-lg)',
        'xl':           'var(--shadow-xl)',
        '2xl':          'var(--shadow-2xl)',
        'card':         'var(--shadow-card)',
        'card-md':      'var(--shadow-card-md)',
        'card-hover':   'var(--shadow-card-hover)',
        'btn-primary':  'var(--shadow-btn-primary)',
        'overlay':      'var(--shadow-overlay)',
        'focus':        'var(--shadow-focus)',
        'inset':        'var(--shadow-inset)',
      },

      transitionDuration: {
        'instant':  'var(--duration-instant)',
        'fast':     'var(--duration-fast)',
        'base':     'var(--duration-base)',
        'moderate': 'var(--duration-moderate)',
        'slow':     'var(--duration-slow)',
        'slower':   'var(--duration-slower)',
      },

      transitionTimingFunction: {
        'default':   'var(--ease-default)',
        'in':        'var(--ease-in)',
        'out':       'var(--ease-out)',
        'in-out':    'var(--ease-in-out)',
        'spring':    'var(--ease-spring)',
        'bounce':    'var(--ease-bounce)',
      },

      zIndex: {
        'base':     'var(--z-base)',
        'raised':   'var(--z-raised)',
        'dropdown': 'var(--z-dropdown)',
        'sticky':   'var(--z-sticky)',
        'overlay':  'var(--z-overlay)',
        'modal':    'var(--z-modal)',
        'popover':  'var(--z-popover)',
        'toast':    'var(--z-toast)',
        'tooltip':  'var(--z-tooltip)',
      },

      spacing: {
        '0.5':  'var(--space-0-5)',
        '1':    'var(--space-1)',
        '1.5':  'var(--space-1-5)',
        '2':    'var(--space-2)',
        '2.5':  'var(--space-2-5)',
        '3':    'var(--space-3)',
        '3.5':  'var(--space-3-5)',
        '4':    'var(--space-4)',
        '5':    'var(--space-5)',
        '6':    'var(--space-6)',
        '7':    'var(--space-7)',
        '8':    'var(--space-8)',
        '9':    'var(--space-9)',
        '10':   'var(--space-10)',
        '12':   'var(--space-12)',
        '14':   'var(--space-14)',
        '16':   'var(--space-16)',
        '20':   'var(--space-20)',
        '24':   'var(--space-24)',
        'btn':  'var(--height-btn)',
      },

      animation: {
        'slide-up':   'slideUp   var(--duration-moderate) var(--ease-out)',
        'slide-down': 'slideDown var(--duration-moderate) var(--ease-out)',
        'slide-left': 'slideLeft var(--duration-moderate) var(--ease-out)',
        'fade-in':    'fadeIn    var(--duration-moderate) var(--ease-out)',
        'scale-in':   'scaleIn   var(--duration-moderate) var(--ease-spring)',
      },

      keyframes: {
        slideUp: {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        slideDown: {
          from: { transform: 'translateY(-12px)', opacity: '0' },
          to:   { transform: 'translateY(0)',     opacity: '1' },
        },
        slideLeft: {
          from: { transform: 'translateX(-16px)', opacity: '0' },
          to:   { transform: 'translateX(0)',     opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.94)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
