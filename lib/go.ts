import type { GoDTO, GoOptionDTO } from '../types/api';
import { money, timeAgo } from './format';

/**
 * «Ir a la tienda»: qué le decimos a la persona y a dónde la llevamos según lo que respondió `GET /products/:slug/go`.
 * Lógica pura (sin react-native) para poder probarla; `components/product/GoButton.tsx` la dibuja.
 */

export type GoNoticeTone = 'verified' | 'changed' | 'unverified' | 'none';

export type GoNotice = {
  tone: GoNoticeTone;
  /** Lo principal, en una frase. */
  title: string;
  /** Aclaración: de qué tienda habla, de dónde sale el precio, qué puede haber cambiado. */
  detail?: string;
};

export type GoPlan =
  | {
      kind: 'open';
      /** Página del producto en la cadena (https). */
      url: string;
      chainSlug: string;
      chainName: string;
      price: number;
      notice: GoNotice;
      /** Cuánto se espera, mostrando el aviso, antes de abrir la tienda. */
      delayMs: number;
    }
  | { kind: 'none'; notice: GoNotice };

/** Solo se abren páginas https: la API ya entrega solo cadenas conocidas, esto es un seguro más. */
export function isStoreUrl(url: string): boolean {
  return /^https:\/\/[^\s/]+/i.test(url);
}

/** Cuánto leer el aviso antes de abrir la tienda: un cambio de precio pide más calma que una verificación limpia. */
export const OPEN_DELAY_MS: Record<
  'verified' | 'changed' | 'unverified',
  number
> = {
  verified: 1200,
  changed: 3000,
  unverified: 2500,
};

const LIVE_NOTE =
  'Es el precio de la zona base de la tienda: al elegir tu dirección en su sitio puede variar un poco.';

function noneNotice(go: GoDTO, chain: string | undefined): GoNotice {
  if (chain) {
    const option = go.options.find((o) => o.chain.slug === chain);
    const gone = !option || option.status === 'gone' || !option.available;
    return {
      tone: 'none',
      title:
        gone && option
          ? 'Esa tienda ya no tiene el producto'
          : 'Esa tienda no tiene el producto ahora',
      detail: 'Puedes mirar el precio en las otras cadenas, más arriba.',
    };
  }
  return {
    tone: 'none',
    title: 'Ninguna tienda lo tiene ahora',
    detail:
      'Sin stock o sin una página a la que llevarte. Los precios guardados pueden no estar vigentes.',
  };
}

function openNotice(option: GoOptionDTO, now: number): GoNotice {
  const name = option.chain.name;
  if (option.status === 'verified') {
    return {
      tone: 'verified',
      title: `Precio verificado ahora en ${name}: ${money(option.price)}`,
      detail: LIVE_NOTE,
    };
  }
  if (option.status === 'changed') {
    const before = option.previous_price;
    return {
      tone: 'changed',
      title:
        before != null
          ? `El precio cambió: antes ${money(before)}, ahora ${money(option.price)}`
          : `El precio cambió: ahora ${money(option.price)}`,
      detail: `En ${name}. ${LIVE_NOTE}`,
    };
  }
  // `failed`, `not_checked` (y cualquier estado que no se conozca): se va igual, con el precio de referencia y su antigüedad.
  const seen = option.seen_at
    ? ` (${option.live ? 'visto' : 'recibido'} ${timeAgo(option.seen_at, now)})`
    : '';
  const reads = option.live
    ? ''
    : `PayRight no lee directamente la web de ${name}: su precio es referencial. `;
  return {
    tone: 'unverified',
    title:
      'No pudimos verificarlo; te llevamos igual con el precio de referencia',
    detail: `${name}: ${money(option.price)}${seen}. ${reads}Puede haber cambiado: confírmalo en su sitio.`,
  };
}

/**
 * Decide qué hacer con la respuesta de `/go`. Con `chain` fijo la API solo mira esa cadena. Si hay `target`, se abre
 * la `url` de esa opción (y se dice antes qué se encontró); si no, se explica que no hay tienda a la que ir.
 */
export function planGo(
  go: GoDTO,
  chain?: string,
  now: number = Date.now(),
): GoPlan {
  const option = go.target
    ? go.options.find((o) => o.chain.slug === go.target)
    : undefined;
  if (!go.target) return { kind: 'none', notice: noneNotice(go, chain) };

  if (!option || !option.available || !isStoreUrl(option.url)) {
    return {
      kind: 'none',
      notice: {
        tone: 'none',
        title: 'No tenemos una página de la tienda a la que llevarte',
        detail: 'Revisa los precios guardados en la ficha del producto.',
      },
    };
  }

  const notice = openNotice(option, now);
  return {
    kind: 'open',
    url: option.url,
    chainSlug: option.chain.slug,
    chainName: option.chain.name,
    price: option.price,
    notice,
    delayMs:
      OPEN_DELAY_MS[notice.tone as 'verified' | 'changed' | 'unverified'],
  };
}
