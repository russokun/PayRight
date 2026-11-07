/**
 * Paleta de PayRight en JS, para lo que NO acepta className: StatusBar, barra de pestañas, SVG,
 * ActivityIndicator, placeholderTextColor.
 *
 * Fuente de verdad: payright-web/app/globals.css. Los mismos valores viven en `global.css` como canales
 * RGB (para que funcione `bg-ink/10`); `theme/tokens.test.ts` falla si los dos se separan.
 *
 * Reglas de marca (PRODUCT.md): el lima (`accent`) marca lo que gana y NUNCA lleva texto sobre fondo
 * claro; `save` = buen precio; `alert` = más caro o aviso. Tinta/papel son los dos extremos.
 */

export type Scheme = "light" | "dark";

export type ThemeColors = {
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  muted: string;
  line: string;
  primary: string;
  primaryInk: string;
  field: string;
  fieldInk: string;
  accent: string;
  accentInk: string;
  highlight: string;
  save: string;
  saveBg: string;
  alert: string;
  alertBg: string;
  /** Fondo de las fotos de producto: las de las cadenas vienen sobre blanco, también en oscuro. */
  photo: string;
};

/** Colores de marca que no cambian con el tema. */
export const brand = {
  ink: "#111410",
  paper: "#fafaf7",
  lime: "#d8ff3c",
} as const;

export const colors: Record<Scheme, ThemeColors> = {
  light: {
    bg: "#fafaf7",
    surface: "#ffffff",
    surface2: "#eeefea",
    ink: "#111410",
    muted: "#595e56",
    line: "#e0e2db",
    primary: "#111410",
    primaryInk: "#fafaf7",
    field: "#111410",
    fieldInk: "#fafaf7",
    accent: "#d8ff3c",
    accentInk: "#111410",
    highlight: "#d8ff3c",
    save: "#0c6b4d",
    saveBg: "#ddf3e8",
    alert: "#c23a18",
    alertBg: "#fbe4dc",
    photo: "#ffffff",
  },
  dark: {
    bg: "#111410",
    surface: "#1a1d18",
    surface2: "#24281f",
    ink: "#f2f3ee",
    muted: "#a4a99e",
    line: "#2f332b",
    primary: "#f2f3ee",
    primaryInk: "#111410",
    field: "#252a21",
    fieldInk: "#f2f3ee",
    accent: "#d8ff3c",
    accentInk: "#111410",
    highlight: "#d8ff3c",
    save: "#5fe0b4",
    saveBg: "#123a2c",
    alert: "#ff8a63",
    alertBg: "#3b1d14",
    photo: "#ffffff",
  },
};

/**
 * Color de fondo de la etiqueta de producto (LabelTile) por departamento: mismos tintes que
 * `CATEGORIES` de payright-web (lib/catalog.ts). Son pasteles planos con tinta oscura encima
 * (`labelInk`), iguales en claro y oscuro, como en la web.
 */
export const categoryTints: Record<string, string> = {
  despensa: "#f1d9a0",
  lacteos: "#c3daf0",
  "quesos-fiambres": "#f4e2a1",
  carnes: "#f0bdb1",
  "frutas-verduras": "#c9e4aa",
  panaderia: "#e9c0a0",
  desayuno: "#f3d3b5",
  snacks: "#f5e3a6",
  bebidas: "#aedde0",
  licores: "#e6c3cf",
  congelados: "#cfe6f5",
  "comidas-preparadas": "#e5d9c2",
  aseo: "#d6ccf0",
  cuidado: "#f1c3dd",
  salud: "#cde7dc",
  bebe: "#f6d6e0",
  mascotas: "#e3d4c3",
  hogar: "#d9dde8",
  otros: "#dcdfd6",
};

/** Tinte de respaldo cuando el departamento no se conoce. */
export const defaultCategoryTint = "#e5e8e1";

/** Tinta de texto sobre cualquier tinte de categoría. */
export const labelInk = "#0e1f1a";

/** Nombres de variable CSS (sin `--`) en el mismo orden que `ThemeColors`, para el test de deriva. */
export const cssName = (key: keyof ThemeColors): string => key.replace(/[A-Z0-9]/g, (c) => `-${c.toLowerCase()}`);
