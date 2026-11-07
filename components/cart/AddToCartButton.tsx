import { Check, Plus } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { MAX_QTY, capMessage } from '@/lib/cart/cart';
import { useCartActions, useCartIsFull, useCartQty } from '@/store/useCartStore';
import { useTheme } from '@/theme/useTheme';
import type { ProductDTO } from '@/types/api';
import { QtyStepper } from './QtyStepper';
import { tapHaptic } from './haptics';

/** Lo que el carrito guarda del producto para pintarse sin red (un `ProductDTO` sirve tal cual). */
export type AddToCartProduct = Pick<ProductDTO, 'slug' | 'name' | 'brand' | 'size' | 'emoji' | 'image_url'>;

/**
 * «Agregar al carrito». Una vez agregado se convierte en el selector de cantidad (44 px) con «Quitar». Con 60 productos
 * distintos (el máximo) un producto nuevo no entra y el botón lo dice; con 99 unidades el «más» se apaga.
 * La ficha le pasa el producto (`ProductDTO` sirve tal cual): `slug, name, brand, size, emoji, image_url`.
 */
export function AddToCartButton({ product }: { product: AddToCartProduct }) {
  const { colors } = useTheme();
  const qty = useCartQty(product.slug);
  const full = useCartIsFull();
  const { add, setQty, remove } = useCartActions();

  if (qty === 0) {
    if (full) {
      return (
        <View className="gap-2">
          <Button title="Carrito lleno" variant="secondary" disabled onPress={() => {}} />
          <Text className="font-sans text-sm leading-5 text-muted">{capMessage('full')}</Text>
        </View>
      );
    }
    return (
      <Button
        title="Agregar al carrito"
        accessibilityLabel={`Agregar ${product.name} al carrito`}
        icon={<Plus size={18} strokeWidth={2.6} color={colors.primaryInk} />}
        onPress={() => {
          tapHaptic();
          add(product);
        }}
      />
    );
  }

  return (
    <View className="gap-2" accessibilityLiveRegion="polite">
      <View className="flex-row items-center gap-1.5">
        <Check size={16} strokeWidth={3} color={colors.save} />
        <Text className="font-sans-bold text-sm text-save">En tu carrito</Text>
      </View>
      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <QtyStepper
          qty={qty}
          name={product.name}
          onDecrease={() => {
            tapHaptic();
            setQty(product.slug, qty - 1);
          }}
          onIncrease={() => {
            tapHaptic();
            add(product);
          }}
        />
        <Button
          title="Quitar"
          variant="ghost"
          accessibilityLabel={`Quitar ${product.name} del carrito`}
          onPress={() => {
            tapHaptic();
            remove(product.slug);
          }}
        />
      </View>
      {qty >= MAX_QTY && (
        <Text className="font-sans text-sm text-muted">{capMessage('qty_capped')}</Text>
      )}
    </View>
  );
}
