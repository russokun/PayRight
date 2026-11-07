/** @type {import('tailwindcss').Config} */

// Colores = variables de global.css en canales RGB, para que `bg-ink/10` y `border-line` sigan al tema.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        primary: token('primary'),
        'primary-ink': token('primary-ink'),
        field: token('field'),
        'field-ink': token('field-ink'),
        accent: token('accent'),
        'accent-ink': token('accent-ink'),
        highlight: token('highlight'),
        save: token('save'),
        'save-bg': token('save-bg'),
        alert: token('alert'),
        'alert-bg': token('alert-bg'),
        photo: token('photo'),
      },
      // En nativo cada peso es una familia: se elige la clase, no `font-bold`.
      // Los mismos nombres están en theme/fonts.ts (theme/tokens.test.ts los compara).
      fontFamily: {
        sans: ['HankenGrotesk_400Regular'],
        'sans-medium': ['HankenGrotesk_500Medium'],
        'sans-semibold': ['HankenGrotesk_600SemiBold'],
        'sans-bold': ['HankenGrotesk_700Bold'],
        display: ['BricolageGrotesque_700Bold'],
        'display-extrabold': ['BricolageGrotesque_800ExtraBold'],
      },
    },
  },
  plugins: [],
}
