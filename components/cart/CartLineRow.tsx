import { Trash2 } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LabelTile } from '@/components/ui';
import type { CartLine } from '@/lib/cart/cart';
import { useTheme } from '@/theme/useTheme';
import { QtyStepper } from './QtyStepper';

type Props = {
  line: CartLine;
  onOpen: (slug: string) => void;
  onQty: (slug: string, qty: number) => void;
  onRemove: (slug: string) => void;
};

/** Una línea del carrito: foto o etiqueta, nombre, marca · tamaño, selector de cantidad y «Quitar». Se pinta sin red. */
export const CartLineRow = memo(function CartLineRow({ line, onOpen, onQty, onRemove }: Props) {
  const { colors } = useTheme();
  const meta = [line.brand, line.size].filter((x) => x && x !== 'Granel').join(' · ');
  return (
    <View className="gap-2 rounded-2xl border border-line bg-surface p-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${line.name}${meta ? `, ${meta}` : ''}`}
        accessibilityHint="Abre la ficha del producto"
        onPress={() => onOpen(line.slug)}
        className="flex-row items-center gap-3 active:opacity-70"
      >
        <LabelTile
          product={{ name: line.name, brand: line.brand, size: line.size, emoji: line.emoji, category: '' }}
          imageUrl={line.image_url}
          size={56}
        />
        <View className="min-w-0 flex-1 gap-0.5">
          <Text numberOfLines={2} className="font-sans-bold text-base leading-5 text-ink">
            {line.name}
          </Text>
          {!!meta && (
            <Text numberOfLines={1} className="font-sans text-sm text-muted">
              {meta}
            </Text>
          )}
        </View>
      </Pressable>
      <View className="flex-row items-center justify-between">
        <QtyStepper
          qty={line.qty}
          name={line.name}
          onDecrease={() => onQty(line.slug, line.qty - 1)}
          onIncrease={() => onQty(line.slug, line.qty + 1)}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${line.name} del carrito`}
          onPress={() => onRemove(line.slug)}
          className="min-h-11 flex-row items-center gap-1.5 rounded-full px-3 active:bg-surface-2"
        >
          <Trash2 size={16} color={colors.muted} />
          <Text className="font-sans-semibold text-sm text-muted">Quitar</Text>
        </Pressable>
      </View>
    </View>
  );
});
