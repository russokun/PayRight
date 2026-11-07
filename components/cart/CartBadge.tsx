import { useCartUnits } from '@/store/useCartStore';
import { fonts } from '@/theme/fonts';
import type { ThemeColors } from '@/theme/tokens';

/** Lo que dice la insignia: nada con el carrito vacío, el número de unidades, o «99+». */
export function badgeLabel(units: number): number | string | undefined {
  if (units <= 0) return undefined;
  return units > 99 ? '99+' : units;
}

/**
 * Insignia de la pestaña Carrito: unidades en total. Se conecta SOLO a esa pestaña (`app/(tabs)/_layout.tsx`):
 * `<Tabs.Screen name="carrito" options={{ ..., ...useCartTabOptions(colors) }} />`.
 * Lima con tinta encima (la marca reserva el rojo para «más caro»).
 */
export function useCartTabOptions(colors: ThemeColors) {
  const units = useCartUnits();
  return {
    tabBarBadge: badgeLabel(units),
    tabBarBadgeStyle: {
      backgroundColor: colors.accent,
      color: colors.accentInk,
      fontFamily: fonts.sansBold,
      fontSize: 11,
    },
    tabBarAccessibilityLabel:
      units > 0 ? `Carrito, ${units} ${units === 1 ? 'unidad' : 'unidades'}` : 'Carrito',
  };
}
