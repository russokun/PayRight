import type { ListingDTO, PriceDTO, ProductDetailDTO, SectionDTO } from "@/types/api";

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Algunas cadenas publican la descripción como HTML ("<p>Arroz grado 1…</p>"): se muestra como texto plano. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>|<\/p>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (m, e: string) =>
      e[0] === "#"
        ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1)))
        : (ENTITIES[e.toLowerCase()] ?? m),
    )
    .replace(/\s+/g, " ")
    .trim();
}

export const sentence = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Qué avisos de comparación mostrar junto a los precios (reglas 4 de api-v1.md). */
export function comparisonNotices(c: ProductDetailDTO["comparison"]): {
  mayDiffer: boolean;
  sameBarcode: boolean;
  differentBarcodes: boolean;
  singleGtin: string | null;
} {
  return {
    mayDiffer: c.may_differ,
    sameBarcode: c.barcode === "same",
    differentBarcodes: c.barcode === "different",
    singleGtin: c.barcode === "single" ? c.gtin : null,
  };
}

/** ¿Hay algún precio leído de la web de una cadena (propio o referencial)? Solo entonces tiene sentido hablar de "verificados". */
export function hasWebPrices(prices: PriceDTO[]): boolean {
  return prices.some((p) => p.source === "retailer_web" || p.source === "partner");
}

/** Cuánto más caro es el último que el primero (la lista viene del más barato al más caro). */
export function savings(prices: PriceDTO[]): { amount: number; percent: number; against: PriceDTO } | null {
  if (prices.length < 2) return null;
  const cheapest = prices[0];
  const priciest = prices[prices.length - 1];
  const amount = priciest.price - cheapest.price;
  if (amount <= 0) return null;
  return { amount, percent: Math.round((amount / priciest.price) * 100), against: priciest };
}

export function availabilityLabel(a: ListingDTO["availability"]): string | null {
  if (a === "in_stock") return "Disponible";
  if (a === "out_of_stock") return "Sin stock";
  if (a === "gone") return "Ya no lo publica en su web";
  return null;
}

/** "★ 4,5 · 128 opiniones" */
export function ratingLabel(rating: number | null, reviews: number | null): string | null {
  if (rating === null) return null;
  const stars = `★ ${String(rating).replace(".", ",")}`;
  if (!reviews) return stars;
  return `${stars} · ${reviews.toLocaleString("es-CL")} ${reviews === 1 ? "opinión" : "opiniones"}`;
}

/** ¿La ficha dice algo más que el título? Con el contenido de cadenas apagado llega vacía. */
export function listingHasContent(l: ListingDTO): boolean {
  return !!l.description || l.sections.length > 0 || Object.keys(l.specs).length > 0 || l.rating !== null;
}

/** Las especificaciones que no repite ya una sección (como en la web). */
export function extraSpecs(l: ListingDTO): [string, string][] {
  const known = new Set(l.sections.flatMap((s: SectionDTO) => s.facts.map((f) => f.label)));
  return Object.entries(l.specs).filter(([k]) => !known.has(k));
}
