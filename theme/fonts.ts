/**
 * Familias tipográficas de la web: Hanken Grotesk (cuerpo) y Bricolage Grotesque (titulares y precios).
 * En nativo cada peso es una familia distinta, por eso hay un nombre por peso. Los mismos nombres están en
 * `tailwind.config.js` (`font-sans`, `font-sans-medium`, `font-display`…); `theme/tokens.test.ts` los compara.
 *
 * Aquí solo van los nombres (importable desde Node). Los archivos .ttf se cargan en `theme/font-assets.ts`.
 */
export const fonts = {
  sans: "HankenGrotesk_400Regular",
  sansMedium: "HankenGrotesk_500Medium",
  sansSemibold: "HankenGrotesk_600SemiBold",
  sansBold: "HankenGrotesk_700Bold",
  display: "BricolageGrotesque_700Bold",
  displayExtrabold: "BricolageGrotesque_800ExtraBold",
} as const;

export type FontKey = keyof typeof fonts;
