# PayRight (app móvil) — guía para agentes

App nativa (Expo SDK 58, expo-router, NativeWind 4, zustand) que porta la experiencia de
**payright-web** (fuente de verdad, repo `russokun/payright-web`). La web hoy es solo PWA.

Plan de trabajo por bloques: [`specs/003-mobile-port/plan.md`](specs/003-mobile-port/plan.md).
Trabajar **un bloque a la vez**, cada uno entregable y verificado.

## Reglas
- **Nunca datos inventados presentados como reales** (PRODUCT.md de la web). Todo precio lleva
  `source` y `seen_at`; lo que no tenga datos reales dice "Próximamente" o "Demostración".
- Los datos vienen de la API `/api/v1/*` de payright-web (bloque 1). El scraping nunca sale del dispositivo.
- Instalar paquetes con `npx expo install <pkg>` (no `npm i`). Español de Chile, CLP sin decimales.
- Antes de dar un bloque por terminado: `npm run typecheck` + `npx expo export --platform ios|android|web`.
  Para render sin simulador: export web + Playwright (ver plan). **Declarar siempre qué NO se verificó en dispositivo.**
- Empezar toda tarea Expo cargando `expo-overview`; la migración sigue `expo-web-to-native`
  (estrangulamiento por pantalla; aquí se rediseña a nativo, no se usan DOM components).

## Skills instaladas: para qué sirve cada una

### Núcleo de la migración (se usan en casi todos los bloques)
| Skill | Para qué | Cuándo |
|---|---|---|
| `expo-overview` | Router de todas las tareas Expo/EAS | Siempre primero |
| `expo-web-to-native` | Método y equivalencias web→nativo (`references/false-friends.md`, `native-patterns.md`) | Al empezar cada bloque de pantallas |
| `expo-router` | Rutas, tabs, stacks, modales, deep links | Bloques 2, 3, 8 |
| `expo-data-fetching` | Fetch, TanStack Query, caché, offline, estados loading/error/vacío | Bloques 3–6, 8 |
| `expo-design-system` | Tokens (color, espaciado, tipografía, radios), convenciones de componentes, auditoría de deriva | Bloque 2 (y auditoría en 7) |
| `expo-native-ui` | Pantallas con sensación nativa (HIG/Material, controles, colores semánticos) | Bloques 2, 3, 5 |
| `expo-ui` | `@expo/ui`: BottomSheet, pickers, menús, listas nativas (SwiftUI/Compose). Primera opción para sheets y filtros | Bloque 3 (FilterSheet, ProductSheet) |
| `expo-animation` | Reanimated, gestos, transiciones, háptica | Bloque 7 |

### Pulido visual
| Skill | Para qué | Cuándo |
|---|---|---|
| `genjutsu` → **`cast`** | Animar/pulir UI que ya existe (módulos `mobile-principles`, `motion-principles`, `tells`, `design-audit`) | Bloque 7 |
| `genjutsu` → `paint` | Crear identidad visual desde cero. **No aplica**: la marca ya existe en la web | Solo si se rehace la identidad |
| `genjutsu` → `bunshin` | Construye un sitio web completo con equipo de agentes (millones de tokens, solo web) | **Nunca en este repo** |

### Distribución y operación (bloque 9)
`eas-workflows` (CI/CD) · `eas-app-stores` (builds, TestFlight, App Store, Play) · `eas-update` /
`eas-update-insights` (OTA y su salud) · `eas-observe` (rendimiento de arranque) ·
`expo-dev-client` (builds de desarrollo, para probar en teléfono real) · `eas-simulator` (simulador remoto en la nube, experimental).

### Marketing y lanzamiento
| Skill | Para qué | Cuándo |
|---|---|---|
| `app-store-screenshots` | Páginas Next.js que exportan screenshots para App Store / Play Store | Bloque 9, con **datos reales**, nunca mocks |
| `brag` / `brag-slim` | Video corto de lanzamiento compartible a partir de la web/proyecto (Hyperframes) | Al lanzar; `brag-slim` si basta un archivo |

### Disponibles pero fuera del camino crítico
`expo-dom` (web dentro de webview; no se usa), `expo-examples` (ejemplos oficiales: consultar para Supabase/Clerk/SQLite/Skia),
`expo-module`, `expo-brownfield`, `expo-app-clip`, `expo-migrate-module`, `expo-project-structure` (solo proyectos nuevos), `expo-upgrade` (ya aplicada 54→58; reusar en próximos SDK).

### MCP (`.mcp.json`)
- `awwwards`: inspiración y análisis de **sitios web** premiados. Solo útil si se rehace la landing/web.
- `responsively`: prueba responsive de **sitios web** en varios viewports; requiere la app de escritorio Responsively
  (no corre en el contenedor de la nube; úsalo en tu máquina). Para la app nativa solo sirve sobre el export web.
