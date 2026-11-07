import type { TextStyle } from "react-native";

/**
 * Cifras tabulares: todo precio, total y conteo (PRODUCT.md). Se pasa como `style`, no como clase,
 * porque `tabular-nums` de Tailwind no llega igual a todas las plataformas.
 * Bricolage Grotesque (precios) trae la característica `tnum`; Hanken Grotesk no.
 */
export const tabularNums = { fontVariant: ["tabular-nums"] } satisfies TextStyle;
