// COPIA de payright-web/lib/api/v1/dto.ts (fuente de verdad del contrato). No editar a mano:
// al cambiar el contrato, copiar de nuevo (más adelante se generará desde OpenAPI).
// Documentación: payright-web/docs/api-v1.md y specs/003-mobile-port/api-v1.md.

/**
 * The public contract of /api/v1: what a client receives, independent of how the database is laid
 * out. These types are the single source of truth; docs/api-v1.md describes them for humans, and
 * mappers.test.ts pins their exact keys so the two cannot drift silently.
 *
 * Conventions: snake_case keys; money is whole CLP (no decimals); timestamps are ISO 8601 UTC;
 * a product's public key is its `slug` (database ids are never exposed, except `PriceDTO.id`,
 * which later votes refer to).
 */

/**
 * Where a price comes from. `partner` is a chain's web price shared by another source: show it as
 * "Precio web · referencial". Never name the source: the public app does not (see docs/ingenieria-inversa.md).
 */
export type PriceSourceDTO = "community" | "retailer_web" | "partner" | "demo";

export type CheapestDTO = {
  store: string;
  chain: string;
  chain_color: string;
  /** The product's lowest current price (same as `ProductDTO.min_price`). */
  price: number;
  /** The crossed-out price, when the chain shows one. */
  list_price: number | null;
  /** Price per unit of measure (CLP per `ppum_unit`). */
  ppum: number | null;
  ppum_unit: string | null;
  source: PriceSourceDTO;
  /** When this price was last seen; for `partner` it is when PayRight received it (see `PriceDTO.seen_at_exact`). */
  seen_at: string;
  /** False for `partner` prices: say "recibido hace…", not "visto hace…". */
  seen_at_exact: boolean;
  /** At least one person confirmed it. */
  verified: boolean;
};

export type ProductDTO = {
  slug: string;
  name: string;
  brand: string;
  size: string;
  category: string;
  emoji: string;
  /** Canonical pack content: 'g', 'ml' or 'un'. */
  unit: string | null;
  unit_qty: number | null;
  /** A chain's own photo, hot-linked; null when unknown or when retailer content is switched off. */
  image_url: string | null;
  min_price: number | null;
  max_price: number | null;
  /** Chains with a current price. */
  chains: number;
  /** Prices that are on offer. */
  offers: number;
  cheapest: CheapestDTO | null;
};

export type PriceDTO = {
  /** Opaque id of this price report (votes will refer to it). */
  id: number;
  price: number;
  list_price: number | null;
  ppum: number | null;
  ppum_unit: string | null;
  promo_text: string | null;
  source: PriceSourceDTO;
  /** The chain's own page for this product, when the price was read from the web. */
  source_url: string | null;
  /** Absolute URL of the shelf photo a person uploaded. */
  photo_url: string | null;
  confirmations: number;
  disputes: number;
  verified_at: string | null;
  /** When this price was first seen. */
  created_at: string;
  /** When it was last seen; the age every client must show ("visto hace…"). */
  seen_at: string;
  /**
   * False for `partner` prices: their `seen_at` is when PayRight received the price, because the
   * source gives no observation date. Say "recibido hace…" instead of "visto hace…".
   */
  seen_at_exact: boolean;
  /** End of the offer (ISO 8601), when `promo_text` carries it ("Oferta hasta 26 oct"); null when undated. */
  promo_ends_at: string | null;
  /** Display name of the person who reported it; null for automatic web prices. */
  author: string | null;
  /** The chain's own name for the product this price was matched to; null when retailer content is off. */
  listing_name: string | null;
  store: { id: number; name: string; kind: "physical" | "online"; commune: string; lat: number | null; lng: number | null };
  chain: { slug: string; name: string; color: string };
  /** Straight-line km from the requested location (to the nearest branch for a chain's web price). */
  distance_km: number | null;
  /** For a web price: the chain's branch nearest to the location, which `distance_km` refers to. */
  nearest_branch: { name: string; lat: number; lng: number } | null;
};

/** Whether the chains publish the same barcode for a product: the strongest proof they are one product. */
export type BarcodeStateDTO = "same" | "different" | "single" | "none";

export type ProductDetailDTO = {
  product: ProductDTO;
  /** Cheapest first. */
  prices: PriceDTO[];
  /**
   * Honesty about the comparison. `may_differ` is true when the chains' own listings look like different
   * variants (another size, flavour or pack): show "puede no ser idéntico" next to the prices.
   */
  comparison: { barcode: BarcodeStateDTO; gtin: string | null; may_differ: boolean };
  /**
   * When PayRight last confirmed, against the chain's own page, the web prices it reads directly (the oldest
   * of those pages). Chains whose prices arrive from a partner source do not count. Null when never.
   */
  checked_at: string | null;
  /** The location the distances were measured from, named; null when none was sent. */
  location: { lat: number; lng: number; place: string } | null;
};

export type ChainDTO = {
  slug: string;
  name: string;
  color: string;
  branches: number;
  /** PayRight reads this chain's own website. When false its web prices arrive from a partner source ("Precio web · referencial"). */
  reads_web: boolean;
};
export type CategoryDTO = { slug: string; name: string; emoji: string };

export type MetaDTO = {
  api_version: 1;
  chains: ChainDTO[];
  categories: CategoryDTO[];
  /** The database holds demonstration prices: the app must label them "Demostración". */
  is_demo: boolean;
  /** Prices shared by another source exist: the app explains they are "referenciales". */
  has_partner_prices: boolean;
  /** False when retailer photos and names are switched off. */
  retailer_content: boolean;
};

export type PageMeta = { total: number; limit: number; offset: number; has_more: boolean };

/** One block of a chain's product page: ingredients, nutrition table, characteristics… */
export type SectionDTO = {
  title: string;
  facts: { label: string; value: string }[];
  table: { head: string[]; rows: string[][] } | null;
  paragraphs: string[];
};

/** What one chain's own page says about a product (`GET /products/:slug/listings`). Heavy: ask for it lazily. */
export type ListingDTO = {
  chain: { slug: string; name: string; color: string };
  /** The chain's page for this product. */
  url: string;
  /** The chain's name for the product; null when retailer content is off. */
  name: string | null;
  /** description, images, categories, sections, specs, rating and review_count are empty when retailer content is off. */
  description: string | null;
  images: string[];
  categories: string[];
  sections: SectionDTO[];
  specs: Record<string, string>;
  rating: number | null;
  review_count: number | null;
  availability: "in_stock" | "out_of_stock" | "gone" | null;
  /** The barcode the chain's own page publishes (never a partner's). */
  gtin: string | null;
  /** When the page was last read in full. */
  detail_at: string | null;
  /** When the price was last confirmed against the page. */
  checked_at: string | null;
};

export type TrendPointDTO = { week_start: string; min: number; avg: number };
/** `GET /products/:slug/trend`: weekly cheapest and average price, oldest first. */
export type TrendDTO = { points: TrendPointDTO[]; median_price: number | null };

export type AisleDTO = { slug: string; name: string; count: number };
/** `GET /categories[?aisles=true]`: departments with how many products each has. */
export type DepartmentDTO = CategoryDTO & { count: number; aisles?: AisleDTO[] };

// ---------------------------------------------------------------------------------------------
// Cart quote (block 4): the cart lives on the device; the server only prices it, statelessly.
// ---------------------------------------------------------------------------------------------

/** A physical branch (a chain's web store has none). */
export type StoreRefDTO = { id: number; name: string; commune: string; address: string; lat: number; lng: number };

/** `POST /cart/quote` body. At most 60 distinct products, quantity 1–99; coordinates win over `comuna`. */
export type QuoteRequestDTO = {
  items: { slug: string; qty: number }[];
  location?: { lat: number; lng: number } | { comuna: string };
};

export type QuoteItemDTO = {
  slug: string;
  name: string;
  brand: string;
  size: string;
  emoji: string;
  image_url: string | null;
  qty: number;
};

/** One product at one chain. */
export type QuoteCellDTO = {
  /** `unit_price` × the quantity in the cart. */
  price: number;
  unit_price: number;
  source: PriceSourceDTO;
  verified: boolean;
  /** The chain's own page can be opened through `GET /products/:slug/go?chain=`. */
  can_go: boolean;
};

export type QuoteChainDTO = {
  slug: string;
  name: string;
  color: string;
  /** The cheapest single place to buy the whole cart (or what it has of it) at this chain; null for its web store. */
  store: StoreRefDTO | null;
  distance_km: number | null;
  total: number;
  /** How many of the cart's products this chain has a price for. */
  has: number;
  /** It has every product, so its total compares like for like. */
  complete: boolean;
  /** How much more than the winner; null unless both are complete. */
  diff: number | null;
  /** Slugs of the products this chain has no price for. */
  missing: string[];
  /** By product slug. */
  cells: Record<string, QuoteCellDTO>;
  /** The chain's website, when it is a known retailer. */
  site: string | null;
};

/** "The cheapest item anywhere" route: the stops of one shopping trip. */
export type QuoteMixDTO = {
  total: number;
  saving_vs_best: number;
  stops: {
    store: StoreRefDTO | null;
    store_name: string;
    chain_color: string;
    subtotal: number;
    items: { slug: string; qty: number; unit_price: number; source: PriceSourceDTO }[];
  }[];
};

export type QuoteDTO = {
  items: QuoteItemDTO[];
  /** Best first: the whole list before part of it, then the lower total. */
  chains: QuoteChainDTO[];
  /** Chains PayRight lists that have no price for anything in the cart. */
  absent: string[];
  /** The winner has the whole list, so totals compare like for like. */
  comparable: boolean;
  vs_worst: { chain: string; amount: number } | null;
  vs_second: { chain: string; amount: number } | null;
  mix: QuoteMixDTO | null;
  /** Slugs in the request that no longer exist (a stale cart). They are not priced. */
  unknown_slugs: string[];
  location: { lat: number; lng: number; place: string } | null;
  /** The web's shareable list link and the WhatsApp text for it (what the web shares). */
  share: { url: string; message: string };
};

// ---------------------------------------------------------------------------------------------
// Near me and "go to the store" (block 5)
// ---------------------------------------------------------------------------------------------

export type NearbyDTO = {
  product: { slug: string; name: string; brand: string; size: string; emoji: string; category: string; image_url: string | null };
  price: number;
  list_price: number | null;
  ppum: number | null;
  ppum_unit: string | null;
  store_name: string;
  chain: { name: string; color: string };
  distance_km: number;
  /** The price is the chain's web price, attributed to its nearest branch (the web does not say which branch). */
  via_web: boolean;
  verified: boolean;
  source: PriceSourceDTO;
  seen_at: string;
  /** False for `partner` prices: say "recibido hace…". */
  seen_at_exact: boolean;
  /** How much cheaper than the product's priciest price anywhere, in percent. */
  saving_pct: number;
};

/** `meta` of `GET /nearby`. */
export type NearbyMeta = { location: { lat: number; lng: number; place: string }; radius_km: number };

export type StoreDTO = StoreRefDTO & {
  chain: { slug: string; name: string; color: string };
  distance_km: number;
  /** Where the branch comes from: the chain's own locator, `osm` (needs attribution) or the community. */
  source: string;
};

/** `GET /stores`: each chain's nearest branch (every option, however far) and the nearest branches of any chain. */
export type StoresDTO = { per_chain: StoreDTO[]; nearest: StoreDTO[] };

/** `meta` of `GET /stores`. `attribution` is set when any branch comes from OpenStreetMap: the app must show it. */
export type StoresMeta = { location: { lat: number; lng: number; place: string }; attribution: string | null };

export type CommuneDTO = { name: string; /** What `?comuna=` takes: "region-slug|Comuna". */ value: string; lat: number; lng: number };
export type RegionDTO = { slug: string; name: string; communes: CommuneDTO[] };

/** What the check of one chain's page found. */
export type GoStatus = "verified" | "changed" | "gone" | "failed" | "not_checked";

export type GoOptionDTO = {
  chain: { slug: string; name: string; color: string };
  /** The chain's page for this product (https, a known retailer). */
  url: string;
  price: number;
  list_price: number | null;
  /** PayRight reads this chain's page itself; otherwise the price is the reference one a partner shared. */
  live: boolean;
  available: boolean;
  status: GoStatus;
  /** The price before the check, when it `changed`. */
  previous_price: number | null;
  seen_at: string | null;
  checked_at: string | null;
};

/**
 * `GET /products/:slug/go[?chain=]`: re-reads the chains PayRight can read (Jumbo, Santa Isabel) right now and says
 * where to send the person. `target` is the chain slug of the cheapest option with stock, null when no store has it.
 */
export type GoDTO = { target: string | null; options: GoOptionDTO[] };
