import {
  lookupBarcode,
  isApiClientError,
  type RequestOptions,
} from './api/client';
import { gtinValid } from './gtin';

export type ScanResult =
  | { kind: 'invalid' }
  | { kind: 'found'; slug: string }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string };

export type ScanDeps = {
  lookupBarcode: (
    ean: string,
    opts?: RequestOptions,
  ) => Promise<{ slug: string }>;
};

const defaultDeps: ScanDeps = { lookupBarcode };

/** Deja solo los dígitos (quien escribe a mano puede meter espacios o guiones) y corta en 14. */
export function cleanCode(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 14);
}

/**
 * Valida el dígito verificador y consulta el código en la API. Una cancelación (`signal`) se propaga como
 * `AbortError`: quien cancela ya no espera el resultado.
 */
export async function resolveScan(
  raw: string,
  deps: ScanDeps = defaultDeps,
  opts: RequestOptions = {},
): Promise<ScanResult> {
  const code = cleanCode(raw);
  if (!gtinValid(code)) return { kind: 'invalid' };
  try {
    const { slug } = await deps.lookupBarcode(code, opts);
    return { kind: 'found', slug };
  } catch (e) {
    if (isApiClientError(e)) {
      if (e.code === 'not_found') return { kind: 'not_found' };
      return { kind: 'error', message: e.message };
    }
    if (e instanceof Error && e.name === 'AbortError') throw e;
    return {
      kind: 'error',
      message: 'No pudimos consultar el código. Intenta de nuevo.',
    };
  }
}
