import { Minus, Plus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { MAX_QTY } from '@/lib/cart/cart';
import { tabularNums } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

type Props = {
  qty: number;
  /** Nombre del producto, para el lector de pantalla («Una unidad más de Leche entera»). */
  name: string;
  onDecrease: () => void;
  onIncrease: () => void;
};

/**
 * Selector de cantidad: menos, número y más, de 44 px de lado. Con 1 el «menos» no actúa (para quitar el producto está
 * «Quitar», aparte y explícito); con 99 el «más» tampoco.
 */
export function QtyStepper({ qty, name, onDecrease, onIncrease }: Props) {
  const { colors } = useTheme();
  const atMin = qty <= 1;
  const atMax = qty >= MAX_QTY;
  return (
    <View className="flex-row items-center gap-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Una unidad menos de ${name}`}
        accessibilityState={{ disabled: atMin }}
        disabled={atMin}
        onPress={onDecrease}
        className={`h-11 w-11 items-center justify-center rounded-full bg-surface-2 active:opacity-70 ${atMin ? 'opacity-40' : ''}`}
      >
        <Minus size={18} strokeWidth={2.6} color={colors.ink} />
      </Pressable>
      <Text
        accessibilityLabel={`${qty} ${qty === 1 ? 'unidad' : 'unidades'}`}
        className="min-w-9 text-center font-display-extrabold text-lg text-ink"
        style={tabularNums}
      >
        {qty}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Una unidad más de ${name}`}
        accessibilityState={{ disabled: atMax }}
        disabled={atMax}
        onPress={onIncrease}
        className={`h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-70 ${atMax ? 'opacity-40' : ''}`}
      >
        <Plus size={18} strokeWidth={2.6} color={colors.primaryInk} />
      </Pressable>
    </View>
  );
}
