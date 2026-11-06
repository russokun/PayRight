# Contrato del trabajo en paralelo: bloque 2 (UI base) y bloque 3 (datos)

Dos agentes trabajan a la vez, cada uno en su worktree y su rama. Este documento es lo que ambos asumen.
**Las dependencias ya están instaladas** (`@expo-google-fonts/hanken-grotesk`, `@expo-google-fonts/bricolage-grotesque`, `expo-image`, `@expo/ui`,
`@tanstack/react-query`, `tsx`): no editar `package.json` ni `package-lock.json`. Si falta algo, decirlo en el informe final.

## Propiedad de archivos (nadie edita lo del otro)
**Bloque 2 (UI base)** — `global.css`, `tailwind.config.js`, `theme/**`, `components/ui/**`, `components/ComingSoon.tsx`, `lib/format.ts` (+ test),
`app/_layout.tsx` (fuentes, splash, tema), `app/(tabs)/_layout.tsx` (colores de pestañas desde tokens), `app/ui-gallery.tsx` (solo con `EXPO_PUBLIC_UI_GALLERY=1`).
**Bloque 3 (datos)** — `lib/api/**`, `lib/gtin.ts` (+ test), `hooks/**`, `store/**`, `app/(tabs)/index.tsx`, `app/buscar.tsx`, `app/categorias.tsx`,
`app/producto/[slug].tsx`, `app/escanear.tsx`. Bloque 3 **no** toca `app/_layout.tsx`: entrega `lib/api/QueryProvider.tsx` y el integrador lo conecta.
Compartido y ya hecho: `types/api.ts` (copia del contrato; no editar).

## Interfaces de componentes (B los entrega, C los consume). Exportes con nombre desde `components/ui/index.ts`
```ts
import type { PriceDTO, PriceSourceDTO, ProductDTO } from "@/types/api";
Button({ title: string; onPress: () => void; variant?: "primary" | "secondary" | "ghost"; loading?: boolean; disabled?: boolean; icon?: ReactNode; accessibilityLabel?: string })
Chip({ label: string; selected?: boolean; onPress: () => void })
SourceBadge({ source: PriceSourceDTO; seenAt: string; exact: boolean })      // origen + "visto hace X" o "recibido hace X" (exact=false); partner → "Precio web · referencial"
PriceBlock({ price: number; listPrice?: number | null; ppum?: number | null; ppumUnit?: string | null; promoEndsAt?: string | null; size?: "sm" | "lg" })
ChainPill({ name: string; color: string })
LabelTile({ product: Pick<ProductDTO, "name" | "brand" | "size" | "emoji" | "category">; imageUrl: string | null; size?: number })   // foto con expo-image o etiqueta propia
ProductCard({ product: ProductDTO; onPress: () => void })
PriceRow({ entry: PriceDTO; cheapest?: boolean; onPress?: () => void })
SearchField({ value: string; onChangeText: (t: string) => void; onSubmit?: () => void; placeholder?: string; onScanPress?: () => void; autoFocus?: boolean })
Notice({ tone: "info" | "warn" | "demo"; children: ReactNode })               // avisos: demostración, "puede no ser idéntico", sin red
LoadingList({ count?: number }); ErrorState({ message: string; onRetry: () => void }); EmptyState({ title: string; hint?: string })
```
`lib/format.ts` (B): `money(n)` → "$1.090" (CLP sin decimales, punto de miles), `ppumLabel(ppum, unit)` → "$1.090 / L", `timeAgo(iso, now?)` → "hace 2 h",
`endsIn(iso, now?)` → "vence mañana" | null. Tema: `useTheme()` de `theme/useTheme.ts` → `{ scheme: "light" | "dark", colors }`; clases NativeWind
`bg-bg bg-surface text-ink text-muted border-line bg-primary text-primary-ink bg-accent text-save bg-save-bg text-alert bg-alert-bg`.

## Orden de entrega (para que C no espere)
B hace **primero** los componentes y `lib/format.ts` y los commitea cuanto pasen `tsc` (mensaje que empiece con `feat(ui): componentes base`).
C empieza por la capa de datos (cliente, hooks, gtin, tests: no necesitan UI) y, antes de armar pantallas, trae lo de B con
`git merge claude/block2-ui` (esperando hasta ~15 min si aún no está). Mientras tanto C no crea componentes de `components/ui/`.

## Verificación común (no hay simulador)
`npm run typecheck` · `npm test` · `npx expo export --platform ios|android|web` (con `CI=1 EXPO_OFFLINE=1`) · captura con Playwright del export web a 390×844.
Declarar siempre qué NO se pudo verificar en dispositivo (gestos, cámara, háptica, rendimiento).
