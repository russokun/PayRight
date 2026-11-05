# 003 — Portar payright-web a la app móvil nativa

Estado: bloque 0 (0a saneamiento + 0b SDK 58) **terminado**. Siguiente: bloque 1.
Plan elaborado con revisión de arquitectura (Opus) y verificado contra el código de ambos repos.
Reemplaza a `specs/002-*`, cuyo contrato (Supabase + scraper Python) no coincide con la web real
(archivado en `specs/_archivo/`).

## Decisiones
1. **Datos**: se agregan route handlers `app/api/v1/*` en payright-web que reusan `lib/queries.ts`,
   `lib/quote.ts` y `lib/live.ts` (hoy solo existen `api/live` y `api/sugerencias`). Sin backend nuevo ni Supabase.
   Las server actions de la web no se llaman desde la app (usan FormData, cookies y `redirect`).
2. **Auth**: token Bearer sobre la tabla `sessions` existente (`lib/auth.ts` ya guarda `sha256(token)`);
   la app lo guarda en `expo-secure-store`. Carrito anónimo con header `X-Guest-Id`. La app se usa sin cuenta.
   Ubicación por query (`?lat=&lng=` o `?comuna=`), no por la cookie `pr_loc`.
3. **Diseño**: tokens de `app/globals.css` de la web → variables CSS de NativeWind + `theme/tokens.ts` (bloque 2).
   Reglas de marca: el lima nunca lleva texto sobre fondo claro; rojo solo significa "más caro".
4. **SDK 58** (antes 54): Expo Go de las tiendas solo soporta el SDK vigente y `@expo/ui` universal exige 56+.
5. **Nativizar = rediseñar**, no reskin ni webview (`expo-web-to-native`). Sin DOM components.

## Mapa de rutas web → app
| Web | App (expo-router) | Decisión |
|---|---|---|
| `/` | `(tabs)/index` | Portar: buscador primero |
| `/cerca` | `(tabs)/cerca` | Adaptar: `expo-location` + Maps nativo |
| `/subir` | `(tabs)/subir` | Adaptar: cámara/galería, subida multipart |
| `/carrito`, `/carrito/cotizar` | `(tabs)/carrito`, `carrito/cotizar` | Portar |
| `/ranking` | `(tabs)/ranking` | Portar |
| `/buscar`, `/categorias` | `buscar`, `categorias` (stack) | Portar; filtros en BottomSheet de `@expo/ui` |
| `/producto/[slug]` | `producto/[slug]` | Portar (PriceBlock, PriceRow) |
| `/escanear` | `escanear` (modal) | Adaptar: `CameraView` EAN-13/8 + háptica (reemplaza zxing) |
| `/ir/[slug]` | acción | Releer precio en vivo y abrir tienda con `WebBrowser`/`Linking` |
| `/lista?p=` | `lista` + deep link | Universal/App Links + `Share` nativo |
| `/guardados`, `/notificaciones`, `/perfil`, `/entrar`, `/registro` | stack/modal | Portar; push después |
| `/como-funciona` | onboarding 1–3 pantallas | Adaptar |
| `/legal/*` | enlace a `WebBrowser` | Sin pantalla propia |
| `/agentes`, opengraph, manifest, `/uploads` | — | No aplica |

## Bloques
| # | Bloque | Terminado cuando | Skills |
|---|---|---|---|
| 0 | Saneamiento + SDK 58 | tsc limpio, bundles ios/android/web, sin datos inventados ✅ | expo-upgrade |
| 1 | `/api/v1` lectura en payright-web (`search`, `products/:slug`, `barcode/:ean`, `meta`) + `specs/003-mobile-port/api-v1.md` | `curl` devuelve datos reales; test unitario del mapeo; `image_url` null con contenido de cadena apagado | — (leer `node_modules/next/dist/docs`, ver AGENTS.md de la web) |
| 2 | Tokens y componentes base (claro/oscuro, fuentes, PriceBlock, SourceBadge, ProductCard, Button, LabelTile) | cero colores hardcodeados; sigue el tema del sistema | expo-web-to-native (leer una vez), expo-design-system, expo-native-ui |
| 3 | Buscar, ficha y escáner con datos reales | buscar "leche" → ficha con cadenas, origen y fecha; escanear EAN abre la ficha | expo-data-fetching, expo-router, expo-ui |
| 4 | Carrito y cotizar (local primero) | misma cotización que la web para la misma lista | expo-data-fetching |
| 5 | Cerca y "Ir al más barato" | sucursal más cercana por cadena con GPS/comuna | expo-native-ui |
| 6 | Auth Bearer, subir precio con foto, votos, guardados, ranking | foto subida visible en la web | expo-data-fetching |
| 7 | Pulido y movimiento (press 0.97, stagger 45 ms, QuoteReveal, reduce motion, 44 px) | auditoría de deriva limpia | expo-animation, genjutsu `cast`, expo-design-system (audit) |
| 8 | Offline, deep links, push | sin red muestra la última ficha con su fecha; `payright.cl/lista?p=` abre la app | expo-data-fetching, expo-router |
| 9 | Distribución | build en teléfono real, OTA, fichas de tienda | eas-*, app-store-screenshots, brag |

## Riesgos abiertos (decidir con el fundador)
1. **Permiso de AhorroSuper**: según `docs/alcance-mvp.md` de la web, casi todos los precios vienen de esa fuente y el
   permiso no está por escrito. Publicar en tiendas aumenta la exposición. Mostrar "Precio web · referencial".
2. **Prioridad**: la web no está publicada y `alcance-mvp.md` ubica "App en las tiendas" en el puesto 9
   ("solo si la PWA se queda corta"). Confirmar que la app no retrasa publicar la web y el permiso escrito.
3. **Fotos de cadenas**: hotlink sin Referer, respetar `PAYRIGHT_RETAILER_CONTENT=off`, fallback `LabelTile`.
4. **Poca señal**: persistir caché de Query y mostrar la fecha de la copia.
5. Costos: Apple USD 99/año, Google USD 25 único, EAS plan gratuito al inicio.

## Cómo se verifica en este entorno (sin simulador)
`npm run typecheck` → `npx expo export --platform ios|android|web` → servir el export web y recorrerlo con Playwright
a 390×844. **No verifica**: gestos, cámara, ubicación, háptica, rendimiento ni comportamiento en iOS/Android reales;
eso se prueba en teléfono con `expo-dev-client`/Expo Go.
