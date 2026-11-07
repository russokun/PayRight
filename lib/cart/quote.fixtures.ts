/**
 * Cotizaciones de ejemplo TIPADAS con `types/api.ts` (el contrato congelado), solo para pruebas. No son datos de
 * PayRight: sirven para probar el armado de la pantalla sin servidor. Nunca se importan desde la app.
 */
import type { QuoteChainDTO, QuoteCellDTO, QuoteDTO, QuoteItemDTO, StoreRefDTO } from '@/types/api';

export const ITEMS: QuoteItemDTO[] = [
  { slug: 'leche', name: 'Leche entera', brand: 'Colún', size: '1 L', emoji: '🥛', image_url: null, qty: 2 },
  { slug: 'arroz', name: 'Arroz grado 1', brand: 'Tucapel', size: '1 kg', emoji: '🍚', image_url: null, qty: 1 },
  { slug: 'pan', name: 'Pan de molde', brand: 'Ideal', size: '500 g', emoji: '🍞', image_url: null, qty: 1 },
];

export const STORE: StoreRefDTO = {
  id: 7,
  name: 'Jumbo Costanera',
  commune: 'Providencia',
  address: 'Av. Andrés Bello 2447',
  lat: -33.4172,
  lng: -70.6061,
};

const cell = (unit: number, qty: number, extra: Partial<QuoteCellDTO> = {}): QuoteCellDTO => ({
  price: unit * qty,
  unit_price: unit,
  source: 'retailer_web',
  verified: false,
  can_go: true,
  ...extra,
});

export const JUMBO: QuoteChainDTO = {
  slug: 'jumbo',
  name: 'Jumbo',
  color: '#16a34a',
  store: STORE,
  distance_km: 1.4,
  total: 4300,
  has: 3,
  complete: true,
  diff: null,
  missing: [],
  cells: {
    leche: cell(1000, 2),
    arroz: cell(1500, 1),
    pan: cell(800, 1, { verified: true }),
  },
  site: 'https://www.jumbo.cl',
};

export const LIDER: QuoteChainDTO = {
  slug: 'lider',
  name: 'Líder',
  color: '#0071ce',
  store: null,
  distance_km: null,
  total: 4900,
  has: 3,
  complete: true,
  diff: 600,
  missing: [],
  cells: {
    leche: cell(1100, 2, { source: 'partner', can_go: false }),
    arroz: cell(1600, 1, { source: 'partner', can_go: false }),
    pan: cell(1100, 1, { source: 'partner', can_go: false }),
  },
  site: 'https://www.lider.cl',
};

export const UNIMARC: QuoteChainDTO = {
  slug: 'unimarc',
  name: 'Unimarc',
  color: '#e30613',
  store: null,
  distance_km: null,
  total: 3100,
  has: 2,
  complete: false,
  diff: null,
  missing: ['pan'],
  cells: {
    leche: cell(900, 2, { source: 'community' }),
    arroz: cell(1300, 1, { source: 'community' }),
  },
  site: null,
};

const COMMON = {
  items: ITEMS,
  absent: [] as string[],
  unknown_slugs: [] as string[],
  location: null,
  share: {
    url: 'https://payright.cl/lista?p=1x2-2x1-3x1',
    message: 'Mi lista del súper en PayRight (3 productos):\n• 2 × Leche entera Colún 1 L\nMira dónde te conviene a ti: https://payright.cl/lista?p=1x2-2x1-3x1',
  },
};

/** Dos cadenas con toda la lista (+ una parcial): hay ganador comparable. */
export const QUOTE_COMPARABLE: QuoteDTO = {
  ...COMMON,
  chains: [JUMBO, LIDER, UNIMARC],
  comparable: true,
  vs_worst: { chain: 'Líder', amount: 600 },
  vs_second: { chain: 'Líder', amount: 600 },
  mix: {
    total: 4000,
    saving_vs_best: 300,
    stops: [
      {
        store: STORE,
        store_name: 'Jumbo Costanera',
        chain_color: '#16a34a',
        subtotal: 2800,
        items: [
          { slug: 'leche', qty: 2, unit_price: 1000, source: 'retailer_web' },
          { slug: 'pan', qty: 1, unit_price: 800, source: 'retailer_web' },
        ],
      },
      {
        store: null,
        store_name: 'Unimarc (tienda en línea)',
        chain_color: '#e30613',
        subtotal: 1200,
        items: [{ slug: 'arroz', qty: 1, unit_price: 1200, source: 'community' }],
      },
    ],
  },
};

/** Ninguna cadena tiene toda la lista: no hay ahorro que calcular. */
export const QUOTE_PARTIAL: QuoteDTO = {
  ...COMMON,
  chains: [UNIMARC, { ...JUMBO, has: 1, complete: false, total: 2000, missing: ['arroz', 'pan'], cells: { leche: JUMBO.cells.leche } }],
  comparable: false,
  vs_worst: null,
  vs_second: null,
  mix: null,
  absent: ['Líder', 'Tottus'],
};

/** Una sola cadena tiene toda la lista. */
export const QUOTE_ONLY_ONE: QuoteDTO = {
  ...COMMON,
  chains: [JUMBO],
  comparable: true,
  vs_worst: null,
  vs_second: null,
  mix: null,
};
