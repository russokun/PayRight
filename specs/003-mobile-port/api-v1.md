# API v1 — lo que la app debe saber

La fuente de verdad del contrato vive en **payright-web**: `docs/api-v1.md` (explicación) y `lib/api/v1/dto.ts` (tipos).
Aquí solo lo que condiciona esta app. Al empezar el bloque 3, copiar `dto.ts` a `types/api.ts` (más adelante: generarlos desde OpenAPI).

## Endpoints (solo lectura, sin cuenta)
`GET /api/v1/meta` · `GET /api/v1/search` · `GET /api/v1/products/:slug` · `GET /api/v1/barcode/:ean`.
Respuesta `{ data, meta? }`; error `{ error: { code, message, details? } }` con `invalid_request` (400), `not_found` (404), `rate_limited` (429 + `Retry-After`), `internal_error` (500).

## Reglas de la UI
1. Cada precio muestra **origen** (`source`) y **fecha** (`seen_at`, calcular "hace X" en el dispositivo). Nunca uno sin ellos.
2. `source: "partner"` se rotula **«Precio web · referencial»**. No se nombra ninguna fuente asociada (la API tampoco la entrega).
3. `meta.is_demo` → rotular **«Demostración»**. `meta.retailer_content = false` → `image_url`/`listing_name` vienen `null`: usar `LabelTile`.
4. Mostrar `ppum` (precio por unidad) y la oferta con su vigencia cuando existan.
5. Ubicación: enviar `lat`+`lng` (o `comuna`) solo si la persona la dio; sin ella no hay distancias.
6. Base URL por entorno (`EXPO_PUBLIC_API_URL`); sin red, mostrar la última ficha guardada con su fecha (bloque 8).
