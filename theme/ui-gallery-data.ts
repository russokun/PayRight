/**
 * Datos de DEMOSTRACIÓN para la galería de verificación (app/ui-gallery.tsx). No son precios reales ni cadenas
 * reales: los nombres son genéricos a propósito y la galería los rotula "Demostración". Nada de esto sale a producción
 * (la galería solo se arma con EXPO_PUBLIC_UI_GALLERY=1).
 */
import type { CheapestDTO, PriceDTO, PriceSourceDTO, ProductDTO } from "@/types/api";

/** "Foto" de demostración: un envase dibujado, PNG 96×96 en data URI (no depende de la red). */
export const DEMO_PHOTO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAABLUlEQVR4nO3VsUkFURiE0deMldmSHdiE9RgJJnagoOmKiTszjz0fTH65J/hvn6p2az/g6gEoB6AcgHIAygEoB6DcHMDT88upWwtAOQDlAJQDUA5AOQDlAJQDUA5AOQDlAJSLAZz9sfcKBQDA5lIBALC5VAAAbC4VAACbSwXgKgCvbx93tVQAAGwuFQAAm0sFAMDmUgEAsLlUAABsLhUAAJtLBeCqAA+P71MDAODcABwHAMDGAAA4t78A0gEA8B0AAAAiOcLHAQCwMQAAzg3AcQAA/Oy/AvBLAI4DAABAJEf4OAAANgYAwLkBOA7AVQHWlwoAgM2lAgBgc6kAANhcKgAANpcKAIDNpQIAYHOpAADYXCoAVwHQcQDKASgHoByAcgDKASgHoByAcgDKfQGsU2LDYyLxAwAAAABJRU5ErkJggg==";

const HOUR = 3_600_000;
export const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
export { HOUR };

/** 23:59:59 hora de Santiago, `days` días desde hoy (como las ofertas reales): "vence hoy" = 0, "mañana" = 1. */
export function endOfDayInChile(days: number): string {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" });
  const [y, m, d] = fmt.format(new Date()).split("-").map(Number);
  const day = fmt.format(new Date(Date.UTC(y, m - 1, d + days, 12)));
  for (const offset of [3, 4]) {
    const t = Date.UTC(y, m - 1, d + days, 23, 59, 59) + offset * HOUR;
    // el desfase correcto es el que deja t dentro de ese día y t + 2 s en el siguiente
    if (fmt.format(new Date(t)) === day && fmt.format(new Date(t + 2000)) !== day) return new Date(t).toISOString();
  }
  return new Date(Date.UTC(y, m - 1, d + days, 23 + 3, 59, 59)).toISOString();
}

/** Colores de cadena de ejemplo: claros, oscuros, tonos medios y el propio lima, para probar el contraste del texto. */
export const DEMO_CHAINS = [
  { name: "Cadena Uno", color: "#00a651" },
  { name: "Cadena Dos", color: "#0b3d91" },
  { name: "Cadena Tres", color: "#ffd400" },
  { name: "Cadena Cuatro", color: "#3366ff" },
  { name: "Cadena Cinco", color: "#d8ff3c" },
  { name: "Cadena Seis", color: "#ffffff" },
  { name: "Cadena Siete", color: "#111410" },
  { name: "Color inválido", color: "verde" },
] as const;

const cheapest = (over: Partial<CheapestDTO> = {}): CheapestDTO => ({
  store: "Tienda de demostración",
  chain: "Cadena Uno",
  chain_color: "#00a651",
  price: 990,
  list_price: null,
  ppum: null,
  ppum_unit: null,
  source: "community",
  verified: false,
  ...over,
});

const product = (over: Partial<ProductDTO> & Pick<ProductDTO, "slug" | "name">): ProductDTO => ({
  brand: "Marca Demo",
  size: "1 L",
  category: "lacteos",
  emoji: "🥛",
  unit: "ml",
  unit_qty: 1000,
  image_url: null,
  min_price: 990,
  max_price: 1290,
  chains: 3,
  offers: 0,
  cheapest: cheapest(),
  ...over,
});

export const DEMO_PRODUCTS: { caption: string; product: ProductDTO }[] = [
  {
    caption: "Con foto, oferta, verificado, comunidad",
    product: product({
      slug: "demo-leche",
      name: "Leche entera de demostración",
      image_url: DEMO_PHOTO,
      offers: 1,
      cheapest: cheapest({ list_price: 1290, ppum: 990, ppum_unit: "L", verified: true }),
    }),
  },
  {
    caption: "Sin foto (etiqueta propia), precio web referencial",
    product: product({
      slug: "demo-arroz",
      name: "Arroz grado 1 de demostración",
      brand: "Grano Demo",
      size: "1 kg",
      category: "despensa",
      emoji: "🍚",
      min_price: 1590,
      max_price: 1990,
      chains: 2,
      cheapest: cheapest({ chain: "Cadena Dos", chain_color: "#0b3d91", price: 1590, ppum: 1590, ppum_unit: "kg", source: "partner" }),
    }),
  },
  {
    caption: "Nombre largo, una sola cadena, dato de demostración",
    product: product({
      slug: "demo-aceite",
      name: "Aceite de maravilla de demostración con un nombre muy largo que no cabe en dos líneas",
      brand: "Aceites del Sur Demo",
      size: "900 ml",
      category: "despensa",
      emoji: "🫒",
      min_price: 2490,
      max_price: 2490,
      chains: 1,
      cheapest: cheapest({ chain: "Cadena Tres", chain_color: "#ffd400", price: 2490, source: "demo" }),
    }),
  },
  {
    caption: "A granel, precio web leído",
    product: product({
      slug: "demo-platano",
      name: "Plátano a granel de demostración",
      brand: "Granel",
      size: "1 kg",
      category: "frutas-verduras",
      emoji: "🍌",
      min_price: 1290,
      max_price: 1490,
      chains: 2,
      cheapest: cheapest({ chain: "Cadena Cuatro", chain_color: "#3366ff", price: 1290, ppum: 1290, ppum_unit: "kg", source: "retailer_web" }),
    }),
  },
  {
    caption: "Sin precios todavía",
    product: product({
      slug: "demo-sin-precio",
      name: "Producto de demostración sin precios",
      brand: "Marca Demo",
      size: "500 g",
      category: "otros",
      emoji: "🛒",
      min_price: null,
      max_price: null,
      chains: 0,
      cheapest: null,
    }),
  },
];

const price = (over: Partial<PriceDTO> & Pick<PriceDTO, "id" | "price" | "source">): PriceDTO => ({
  list_price: null,
  ppum: null,
  ppum_unit: null,
  promo_text: null,
  source_url: null,
  photo_url: null,
  confirmations: 0,
  disputes: 0,
  verified_at: null,
  created_at: ago(5 * HOUR),
  seen_at: ago(2 * HOUR),
  seen_at_exact: true,
  promo_ends_at: null,
  author: null,
  listing_name: null,
  store: { id: 1, name: "Sucursal de demostración", kind: "physical", commune: "Providencia", lat: null, lng: null },
  chain: { slug: "uno", name: "Cadena Uno", color: "#00a651" },
  distance_km: null,
  nearest_branch: null,
  ...over,
});

export const DEMO_PRICES: { caption: string; entry: PriceDTO; cheapest?: boolean }[] = [
  {
    caption: "Más barato · comunidad verificada, con foto, oferta que vence mañana, a 850 m",
    cheapest: true,
    entry: price({
      id: 1,
      price: 990,
      source: "community",
      list_price: 1290,
      ppum: 990,
      ppum_unit: "L",
      promo_text: "Oferta hasta mañana",
      promo_ends_at: endOfDayInChile(1),
      confirmations: 4,
      verified_at: ago(HOUR),
      photo_url: DEMO_PHOTO,
      author: "Persona de demostración",
      distance_km: 0.85,
    }),
  },
  {
    caption: "Precio web leído por PayRight, nombre de la cadena, tienda en línea",
    entry: price({
      id: 2,
      price: 1090,
      source: "retailer_web",
      ppum: 1090,
      ppum_unit: "L",
      listing_name: "Leche entera de demostración 1 L caja",
      store: { id: 2, name: "Cadena Dos en línea", kind: "online", commune: "", lat: null, lng: null },
      chain: { slug: "dos", name: "Cadena Dos", color: "#0b3d91" },
    }),
  },
  {
    caption: "Fuente asociada: «recibido hace…», sucursal más cercana, oferta sin fecha",
    entry: price({
      id: 3,
      price: 1190,
      source: "partner",
      list_price: 1390,
      ppum: 1190,
      ppum_unit: "L",
      seen_at: ago(20 * HOUR),
      seen_at_exact: false,
      listing_name: "Leche Marca Demo entera 1 litro",
      store: { id: 3, name: "Cadena Tres en línea", kind: "online", commune: "", lat: null, lng: null },
      chain: { slug: "tres", name: "Cadena Tres", color: "#ffd400" },
      distance_km: 2.34,
      nearest_branch: { name: "Sucursal Ñuñoa de demostración", lat: 0, lng: 0 },
    }),
  },
  {
    caption: "Reporte viejo (más de 7 días) con una persona que lo marca desactualizado",
    entry: price({
      id: 4,
      price: 1290,
      source: "community",
      seen_at: ago(9 * 24 * HOUR),
      confirmations: 1,
      disputes: 1,
      author: "Otra persona de demostración",
      store: { id: 4, name: "Sucursal de demostración con un nombre bastante largo", kind: "physical", commune: "San Miguel", lat: null, lng: null },
      chain: { slug: "cuatro", name: "Cadena Cuatro", color: "#3366ff" },
      distance_km: 12.6,
    }),
  },
  {
    caption: "Dato de demostración, oferta vencida",
    entry: price({
      id: 5,
      price: 1490,
      source: "demo",
      list_price: 1790,
      promo_ends_at: ago(2 * 24 * HOUR),
      chain: { slug: "cinco", name: "Cadena Cinco", color: "#d8ff3c" },
    }),
  },
];

export const ALL_SOURCES: PriceSourceDTO[] = ["community", "retailer_web", "partner", "demo"];
