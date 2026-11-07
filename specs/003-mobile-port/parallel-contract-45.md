# Contrato del trabajo en paralelo: bloque 4 (carrito) y bloque 5 (Cerca), más la API que ambos usan

Tres agentes trabajan a la vez: **A** (API en payright-web), **B4** (carrito y cotizar) y **B5** (Cerca, ubicación, «Ir a la tienda»).
Las dependencias nuevas ya están instaladas (`expo-location`, `expo-sqlite`): **no editar `package.json` ni el lockfile**.
`types/api.ts` (contrato congelado, copia de `payright-web/lib/api/v1/dto.ts`) **no se edita**. Los componentes de `components/ui/**` son del bloque 2: no se editan
(si falta algo, crear el componente nuevo en el directorio propio y anotarlo en el informe).

## Ya hecho (compartido)
- `lib/api/client.ts` exporta `request<T, M>(path, query, { method?, body?, signal?, timeoutMs? })` (GET o POST JSON, errores tipados `ApiClientError`). **No se edita**: cada bloque
  escribe su propio cliente encima (`lib/api/cart-client.ts`, `lib/api/places-client.ts`).
- `store/useLocationStore.ts`: `useLocationStore` (persistido en el dispositivo) y `useApiLocation()` → `{lat,lng} | null`. B5 lo usa y puede añadirle acciones sin cambiar lo existente.
- `useProduct(slug, loc?)` ya acepta la ubicación; la ficha pasa `useApiLocation()`.
- Los endpoints y tipos de este bloque están en `types/api.ts` (sección «Cart quote» y «Near me and go to the store»).

## Endpoints nuevos (los implementa A; el servidor de pruebas se reinicia con ellos al terminar A)
| Ruta | Devuelve |
| --- | --- |
| `POST /api/v1/cart/quote` body `QuoteRequestDTO` | `{ data: QuoteDTO }`. Sin estado: el carrito vive en el dispositivo; el servidor solo lo cotiza |
| `GET /api/v1/nearby?lat&lng \| comuna&radius_km=5&limit=24` | `{ data: NearbyDTO[], meta: NearbyMeta }` (exige ubicación) |
| `GET /api/v1/stores?lat&lng \| comuna&limit=8` | `{ data: StoresDTO, meta: StoresMeta }` (exige ubicación; `meta.attribution` si hay locales de OpenStreetMap: mostrarlo) |
| `GET /api/v1/communes` | `{ data: RegionDTO[] }` (346 comunas con coordenadas; estático) |
| `GET /api/v1/products/:slug/go[?chain=]` | `{ data: GoDTO }`: relee en vivo las cadenas que PayRight puede leer y dice a cuál ir |

## Propiedad de archivos (nadie edita lo del otro)
**B4 — carrito**: `store/useCartStore.ts`, `store/useSavedListsStore.ts`, `lib/cart/**` (lógica pura + tests), `lib/api/cart-client.ts`, `lib/api/cart-queries.ts`,
`components/cart/**` (incluye `AddToCartButton`, `CartBadge`), `app/(tabs)/carrito.tsx`, `app/cotizar.tsx`, `app/listas.tsx`, y de `app/(tabs)/_layout.tsx` **solo** la insignia del carrito.
**B5 — Cerca y ubicación**: `lib/api/places-client.ts`, `lib/api/places-queries.ts`, `lib/location/**` (permiso/GPS, búsqueda de comuna, helpers puros + tests), `lib/maps.ts`,
`components/location/**`, `components/product/GoButton.tsx`, `app/(tabs)/cerca.tsx`, `app/ubicacion.tsx`.
**A — API (payright-web)**: `app/api/v1/**`, `lib/api/v1/**`, `lib/queries.ts` (solo lo aditivo que se indica), `docs/api-v1.md`.
**Integrador (yo)**: `app/producto/[slug].tsx` (conecta `AddToCartButton` y `GoButton`), `app/_layout.tsx`, fusión y verificación.

## Interfaces entre B4 y B5 (para no esperarse)
```ts
// B5 → B4 (cotizar y la ruta mixta). Los entrega B5 PRIMERO, en un commit cuyo mensaje empieza con `feat(go):`
GoButton({ slug: string; chain?: string; label?: string; variant?: "primary" | "secondary" | "ghost" })   // components/product/GoButton.tsx
openDirections({ lat: number; lng: number; name?: string }): Promise<void>                                   // lib/maps.ts

// B4 → integrador (ficha)
AddToCartButton({ product: Pick<ProductDTO, "slug" | "name" | "brand" | "size" | "emoji" | "image_url"> })     // components/cart/AddToCartButton.tsx
```
B4 empieza por su lógica pura y su store (no necesitan nada de B5) y, antes de armar `cotizar`, trae lo de B5 con `git merge claude/block5-near` (espera hasta ~15 min si el commit `feat(go):` aún no está).
Ambos esperan a A solo para probar contra el servidor real; mientras tanto trabajan contra los tipos y fixtures tipadas.

## Verificación común (no hay simulador)
`npm run typecheck` · `npm test` · `CI=1 EXPO_OFFLINE=1 npx expo export --platform ios|android|web` · recorrido web con Playwright a 390×844 contra la API real (ver `/tmp/.../scratchpad/b3/e2e.js` para el patrón de servidor estático + `page.route` que añade CORS).
Playwright permite simular GPS (`geolocation` + `permissions`). Declarar siempre qué NO se pudo verificar en dispositivo.
