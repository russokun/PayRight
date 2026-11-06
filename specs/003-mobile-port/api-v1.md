# API v1 — lo que la app debe saber

La fuente de verdad del contrato vive en **payright-web**: `docs/api-v1.md` (explicación) y `lib/api/v1/dto.ts` (tipos).
`types/api.ts` de esta app es una **copia** de ese `dto.ts`: no se edita a mano, se vuelve a copiar.

## Endpoints (solo lectura, sin cuenta)
Base: `EXPO_PUBLIC_API_URL` (por defecto `http://localhost:3111/api/v1`). Respuesta `{ data, meta? }`; error `{ error: { code, message, details? } }`
con `invalid_request` (400), `not_found` (404), `rate_limited` (429 + `Retry-After`), `internal_error` (500).

| Ruta | Devuelve |
| --- | --- |
| `GET /meta` | `MetaDTO`: cadenas (`reads_web`), departamentos, `is_demo`, `has_partner_prices`, `retailer_content` |
| `GET /search?q&category&subcategory&chain&offers=true&sort=relevancia\|barato\|ahorro&limit&offset` | `ProductDTO[]` + `meta: PageMeta` |
| `GET /products/:slug[?lat&lng \| ?comuna]` | `ProductDetailDTO`: producto, precios (más barato primero), `comparison`, `checked_at`, `location` |
| `GET /products/:slug/listings` **NUEVO** | `ListingDTO[]`: lo que dice la página de cada cadena (descripción, ingredientes, tabla nutricional, rating, disponibilidad). Pesado: pedirlo al abrir "Detalle" |
| `GET /products/:slug/trend` **NUEVO** | `TrendDTO`: mínimo y promedio semanal + mediana |
| `GET /barcode/:ean` | `{ slug }` (404 si no existe) |
| `GET /categories[?aisles=true]` **NUEVO** | `DepartmentDTO[]` con conteos (y pasillos) |

## Reglas de la UI (vienen de PRODUCT.md de la web)
1. Cada precio muestra **origen** (`source`) y **fecha**. Si `seen_at_exact` es `false` (fuente asociada) se dice **«recibido hace X»**, no «visto hace X».
2. `source: "partner"` se rotula **«Precio web · referencial»**. No se nombra ninguna fuente asociada (la API tampoco la entrega).
3. `meta.is_demo` → rotular **«Datos de demostración»**. `meta.retailer_content = false` → imágenes y textos de cadena vienen vacíos: usar `LabelTile`.
4. `comparison.may_differ` → aviso **«Puede no ser idéntico»** junto a los precios. `comparison.barcode === "same"` → «Mismo código de barras en las tiendas».
5. Se compara por **precio por unidad** (`ppum`); la oferta dice hasta cuándo vale (`promo_ends_at`) cuando se sabe; sin fecha solo «Oferta».
6. `checked_at` → «Precios web verificados hace X»; `null` → «Precios web sin verificar en vivo».
7. `chains[].reads_web = false` → sus precios web son referenciales.
8. Ubicación: enviar `lat`+`lng` (o `comuna`) solo si la persona la dio; sin ella no hay distancias.
9. El escáner valida el dígito verificador (`gtinValid`) antes de consultar: una mala lectura casi nunca lo pasa.
