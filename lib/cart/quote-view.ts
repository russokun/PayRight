/**
 * Qué decir de una cotización (lógica pura, probada). La regla de oro de PayRight: no se compara lo que no es comparable.
 * El ahorro solo existe si `comparable` (la cadena ganadora tiene TODA la lista); si ninguna cadena la tiene completa,
 * se dice tal cual y no se calcula ahorro.
 */
import type { QuoteChainDTO, QuoteDTO, QuoteItemDTO } from '@/types/api';
import { money } from '../format';

export type Winner = {
  chain: QuoteChainDTO;
  /** Una cadena que tiene toda la lista; si no, solo «la que más tiene». */
  complete: boolean;
};

/** La primera cadena (la API las entrega de mejor a peor: la lista entera primero, luego el total menor). */
export function winnerOf(quote: QuoteDTO): Winner | null {
  const chain = quote.chains[0];
  if (!chain) return null;
  return { chain, complete: chain.complete };
}

/** ¿Alguna cadena tiene toda la lista? */
export function hasCompleteChain(quote: QuoteDTO): boolean {
  return quote.chains.some((c) => c.complete);
}

/** Cuántas cadenas tienen toda la lista. */
export function completeCount(quote: QuoteDTO): number {
  return quote.chains.filter((c) => c.complete).length;
}

/**
 * Qué lugar ocupa una cadena en la comparación:
 * - `cheapest`: la primera, comparable, y hay otra cadena con toda la lista contra la que ganar.
 * - `only`: la primera y la ÚNICA con toda la lista. Los totales parciales de las demás son menores solo porque les
 *   faltan productos: no se dice «más barato».
 * - `null`: cualquier otra.
 */
export type Standing = 'cheapest' | 'only' | null;

export function standing(quote: QuoteDTO, chain: Pick<QuoteChainDTO, 'complete'>, index: number): Standing {
  if (index !== 0 || !quote.comparable || !chain.complete) return null;
  return completeCount(quote) > 1 ? 'cheapest' : 'only';
}

/** Etiqueta del lugar: «Más barato» o «Única con todo». */
export function standingLabel(s: Standing): string | null {
  if (s === 'cheapest') return 'Más barato';
  if (s === 'only') return 'Única con todo';
  return null;
}

/** «Tiene todo» o «Tiene 2 de 3». */
export function coverageLabel(chain: Pick<QuoteChainDTO, 'complete' | 'has'>, products: number): string {
  if (chain.complete) return 'Tiene todo';
  return `Tiene ${chain.has} de ${products}`;
}

/** Cuántos productos distintos se cotizaron. */
export function productsCount(quote: QuoteDTO): number {
  return quote.items.length;
}

export type Headline = {
  /** Etiqueta pequeña sobre el nombre de la cadena. */
  kicker: string;
  /** Si hay ahorro que decir: «Ahorras $X frente a <cadena>». Solo con `comparable`. */
  saving: string | null;
  /** «$X menos que <segunda>, la segunda». Solo con `comparable` y distinto del peor. */
  second: string | null;
  /** Aviso honesto cuando nadie tiene todo. */
  caveat: string | null;
};

/**
 * El titular del ganador. Sin `comparable` no hay cálculo de ahorro: «Ninguna cadena tiene todos tus productos»
 * y se dice cuántos tiene la que más tiene.
 */
export function headline(quote: QuoteDTO): Headline | null {
  const w = winnerOf(quote);
  if (!w) return null;
  const total = productsCount(quote);

  if (!quote.comparable || !w.complete) {
    return {
      kicker: 'Ninguna cadena tiene todos tus productos',
      saving: null,
      second: null,
      caveat: `${w.chain.name} es la que más tiene: ${w.chain.has} de ${total}. Su total no incluye el resto, así que no se puede comparar con las demás.`,
    };
  }

  const only = completeCount(quote) === 1;
  const worst = quote.vs_worst && quote.vs_worst.amount > 0 ? quote.vs_worst : null;
  const second = quote.vs_second && quote.vs_second.amount > 0 ? quote.vs_second : null;
  return {
    kicker: only ? 'La única con toda tu lista' : 'El más barato es',
    saving: !only && worst ? `Ahorras ${money(worst.amount)} frente a ${worst.chain}` : null,
    second: !only && second && second.chain !== worst?.chain ? `${money(second.amount)} menos que ${second.chain}, la segunda` : null,
    caveat: only && quote.chains.length > 1 ? 'Las demás cadenas no tienen todos tus productos: sus totales son parciales y no se comparan con este.' : null,
  };
}

/**
 * Una línea para la barra del carrito: dónde está más barata la lista. Sin una cadena que tenga todo no dice «más barato»:
 * dice quién tiene más.
 */
export function summaryLine(quote: QuoteDTO): string {
  const w = winnerOf(quote);
  if (!w) return 'Todavía no hay precios para tu lista';
  const st = standing(quote, w.chain, 0);
  if (st === 'cheapest') return `Más barato: ${w.chain.name} · ${money(w.chain.total)}`;
  if (st === 'only') return `Solo ${w.chain.name} tiene todo · ${money(w.chain.total)}`;
  return `Nadie tiene todo · ${w.chain.name} tiene ${w.chain.has} de ${productsCount(quote)}`;
}

/** Texto corto bajo el total de cada cadena: «El más barato», «+$1.200», «Total completo» o «Total parcial». */
export function chainNote(quote: QuoteDTO, chain: QuoteChainDTO, index: number): string {
  const st = standing(quote, chain, index);
  if (st === 'cheapest') return 'El más barato';
  if (st === 'only') return 'Total completo';
  if (chain.diff !== null && chain.diff > 0) return `+${money(chain.diff)}`;
  if (chain.diff !== null) return 'Mismo total';
  return chain.complete ? 'Total completo' : 'Total parcial';
}

/** Nombres de los productos que a esta cadena le faltan (los que ya no están en la cotización se omiten). */
export function missingNames(chain: Pick<QuoteChainDTO, 'missing'>, items: readonly Pick<QuoteItemDTO, 'slug' | 'name'>[]): string[] {
  const byslug = new Map(items.map((i) => [i.slug, i.name]));
  return chain.missing.map((s) => byslug.get(s)).filter((n): n is string => !!n);
}

/** «Le falta 1 producto: Leche entera» / «Le faltan 2 productos: Leche entera, Pan». */
export function missingLabel(names: readonly string[]): string | null {
  if (names.length === 0) return null;
  return names.length === 1
    ? `Le falta 1 producto: ${names[0]}`
    : `Le faltan ${names.length} productos: ${names.join(', ')}`;
}

/** «Jumbo y Líder no tienen precio para ningún producto de tu lista.» */
export function absentLabel(absent: readonly string[]): string | null {
  if (absent.length === 0) return null;
  const list =
    absent.length === 1 ? absent[0] : `${absent.slice(0, -1).join(', ')} y ${absent[absent.length - 1]}`;
  return `${list} ${absent.length === 1 ? 'no tiene' : 'no tienen'} precio para ningún producto de tu lista.`;
}

/** Hay algo que compartir: el mensaje lo arma el servidor (`share.message`); sin cotización no se ofrece. */
export function shareMessage(quote: QuoteDTO | undefined | null): string | null {
  const msg = quote?.share?.message;
  return typeof msg === 'string' && msg.trim() ? msg : null;
}

export type MixSummary = {
  stops: number;
  /** «Ahorras $X más si repartes la compra en 2 paradas». Solo si la cotización es comparable y hay ahorro. */
  saving: string | null;
  /** Lo que se dice cuando no hay ahorro que contar. */
  note: string | null;
};

/**
 * La ruta mixta («lo más barato de cada producto, en varias tiendas»). El ahorro se mide contra la mejor opción de un
 * solo lugar: si esa no tiene toda la lista (`!comparable`) no es una comparación justa y no se afirma ahorro.
 */
export function mixSummary(quote: QuoteDTO): MixSummary | null {
  const mix = quote.mix;
  // con una sola parada es lo mismo que comprar en una cadena: no hay ruta que mostrar
  if (!mix || mix.stops.length < 2) return null;
  const stops = mix.stops.length;
  if (!quote.comparable) {
    return { stops, saving: null, note: 'Es lo más barato de cada producto que tiene precio. No se compara con una sola tienda porque ninguna tiene toda tu lista.' };
  }
  if (mix.saving_vs_best > 0) {
    return { stops, saving: `Ahorras ${money(mix.saving_vs_best)} más si repartes la compra en ${stopsLabel(stops)}`, note: null };
  }
  return { stops, saving: null, note: 'Comprar todo en un solo lugar ya es lo más barato.' };
}

/** «1 parada» / «3 paradas». */
export function stopsLabel(n: number): string {
  return `${n} ${n === 1 ? 'parada' : 'paradas'}`;
}

/** Nombre de un producto del carrito por su slug (para listar los de cada parada). */
export function itemName(items: readonly Pick<QuoteItemDTO, 'slug' | 'name'>[], slug: string): string {
  return items.find((i) => i.slug === slug)?.name ?? slug;
}
