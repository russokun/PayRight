import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ListingDTO, PriceDTO } from "@/types/api";
import {
  availabilityLabel,
  comparisonNotices,
  extraSpecs,
  hasWebPrices,
  htmlToText,
  listingHasContent,
  ratingLabel,
  savings,
} from "./product-view";
import { trendGeometry } from "./trend";

const price = (over: Partial<PriceDTO>): PriceDTO => ({
  id: 1, price: 1000, list_price: null, ppum: null, ppum_unit: null, promo_text: null, source: "demo", source_url: null,
  photo_url: null, confirmations: 0, disputes: 0, verified_at: null, created_at: "2026-11-05T08:00:00.000Z",
  seen_at: "2026-11-05T08:00:00.000Z", seen_at_exact: true, promo_ends_at: null, author: null, listing_name: null,
  store: { id: 1, name: "Líder Maipú", kind: "physical", commune: "Maipú", lat: null, lng: null },
  chain: { slug: "lider", name: "Líder", color: "#2563eb" }, distance_km: null, nearest_branch: null, ...over,
});

const listing = (over: Partial<ListingDTO>): ListingDTO => ({
  chain: { slug: "jumbo", name: "Jumbo", color: "#16a34a" }, url: "https://example.cl/p", name: null, description: null,
  images: [], categories: [], sections: [], specs: {}, rating: null, review_count: null, availability: null, gtin: null,
  detail_at: null, checked_at: null, ...over,
});

describe("comparisonNotices", () => {
  it("puede no ser idéntico", () => {
    assert.equal(comparisonNotices({ barcode: "different", gtin: null, may_differ: true }).mayDiffer, true);
    assert.equal(comparisonNotices({ barcode: "different", gtin: null, may_differ: true }).differentBarcodes, true);
  });
  it("mismo código de barras", () => {
    const n = comparisonNotices({ barcode: "same", gtin: "4006381333931", may_differ: false });
    assert.equal(n.sameBarcode, true);
    assert.equal(n.mayDiffer, false);
  });
  it("un solo código lo muestra sin afirmar nada", () => {
    assert.equal(comparisonNotices({ barcode: "single", gtin: "4006381333931", may_differ: false }).singleGtin, "4006381333931");
    assert.equal(comparisonNotices({ barcode: "none", gtin: null, may_differ: false }).singleGtin, null);
  });
});

describe("precios", () => {
  it("hasWebPrices distingue web de comunidad y demo", () => {
    assert.equal(hasWebPrices([price({ source: "demo" }), price({ source: "community" })]), false);
    assert.equal(hasWebPrices([price({ source: "partner" })]), true);
    assert.equal(hasWebPrices([price({ source: "retailer_web" })]), true);
  });
  it("savings compara el más barato con el más caro", () => {
    const r = savings([price({ price: 1000 }), price({ price: 1100 }), price({ price: 1250, chain: { slug: "jumbo", name: "Jumbo", color: "#16a34a" } })]);
    assert.equal(r?.amount, 250);
    assert.equal(r?.percent, 20);
    assert.equal(r?.against.chain.name, "Jumbo");
  });
  it("sin diferencia o con un solo precio no hay ahorro", () => {
    assert.equal(savings([price({ price: 1000 })]), null);
    assert.equal(savings([price({ price: 1000 }), price({ price: 1000 })]), null);
  });
});

describe("fichas de cadena", () => {
  it("htmlToText quita etiquetas y entidades", () => {
    assert.equal(htmlToText("<p>Arroz grado 1</p><p>Bolsa&nbsp;de 1&nbsp;kg &amp; m&#225;s</p>"), "Arroz grado 1 Bolsa de 1 kg & más");
  });
  it("ratingLabel", () => {
    assert.equal(ratingLabel(4.5, 128), "★ 4,5 · 128 opiniones");
    assert.equal(ratingLabel(4, 1), "★ 4 · 1 opinión");
    assert.equal(ratingLabel(3.8, null), "★ 3,8");
    assert.equal(ratingLabel(null, 10), null);
  });
  it("availabilityLabel", () => {
    assert.equal(availabilityLabel("in_stock"), "Disponible");
    assert.equal(availabilityLabel("gone"), "Ya no lo publica en su web");
    assert.equal(availabilityLabel(null), null);
  });
  it("una ficha vacía (contenido de cadenas apagado) no tiene contenido", () => {
    assert.equal(listingHasContent(listing({})), false);
    assert.equal(listingHasContent(listing({ description: "Leche entera" })), true);
  });
  it("extraSpecs omite lo que ya dice una sección", () => {
    const l = listing({
      specs: { Marca: "Colún", Origen: "Chile" },
      sections: [{ title: "Características", facts: [{ label: "Marca", value: "Colún" }], table: null, paragraphs: [] }],
    });
    assert.deepEqual(extraSpecs(l), [["Origen", "Chile"]]);
  });
});

describe("trendGeometry", () => {
  const pts = [
    { week_start: "2026-10-01T00:00:00.000Z", min: 960, avg: 1061 },
    { week_start: "2026-10-08T00:00:00.000Z", min: 990, avg: 1049 },
    { week_start: "2026-10-15T00:00:00.000Z", min: 1010, avg: 1098 },
  ];
  it("con menos de dos puntos no hay gráfico", () => {
    assert.equal(trendGeometry([], 320, 120), null);
    assert.equal(trendGeometry(pts.slice(0, 1)), null);
  });
  it("dibuja un punto por semana, el último marcado, y calcula el cambio del mínimo", () => {
    const g = trendGeometry(pts)!;
    assert.equal(g.dots.length, 3);
    assert.equal(g.dots[2].last, true);
    assert.equal(g.delta, 50);
    assert.match(g.minPath, /^M[\d.]+ [\d.]+ L/);
    for (const d of g.dots) assert.ok(d.x >= 0 && d.x <= g.width && d.y >= 0 && d.y <= g.height);
  });
  it("valores iguales no dividen por cero", () => {
    const flat = trendGeometry([{ week_start: "a", min: 1000, avg: 1000 }, { week_start: "b", min: 1000, avg: 1000 }])!;
    assert.equal(flat.delta, 0);
    assert.ok(!flat.minPath.includes("NaN"));
  });
});
