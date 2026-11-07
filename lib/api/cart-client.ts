import type { QuoteDTO, QuoteRequestDTO } from '@/types/api';
import { request, type RequestOptions } from './client';

/**
 * Cotiza un carrito sin estado: el servidor recibe `slug` + `qty` (y la ubicación, si la persona la dio) y devuelve la
 * cotización. El carrito en sí vive en el dispositivo. Errores tipados como `ApiClientError` (400 si se pasan los topes,
 * 429 si se piden demasiadas cotizaciones…).
 */
export async function postQuote(
  body: QuoteRequestDTO,
  opts: Omit<RequestOptions, 'method' | 'body'> = {},
): Promise<QuoteDTO> {
  return (
    await request<QuoteDTO>('/cart/quote', undefined, {
      ...opts,
      method: 'POST',
      body,
    })
  ).data;
}
