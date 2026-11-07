import { Navigation } from 'lucide-react-native';
import { memo } from 'react';
import { Text, View } from 'react-native';
import { Button, ChainPill } from '@/components/ui';
import { km } from '@/lib/format';
import { openDirections } from '@/lib/maps';
import { useTheme } from '@/theme/useTheme';
import type { StoreDTO } from '@/types/api';

/** Un supermercado: su cadena, nombre y dirección, a cuánto está y «Cómo llegar» (abre la app de mapas). */
export const StoreRow = memo(function StoreRow({ store }: { store: StoreDTO }) {
  const { colors } = useTheme();
  const address = [store.address, store.commune].filter(Boolean).join(', ');
  const distance = km(store.distance_km);

  return (
    <View
      accessible={false}
      className="gap-2 rounded-2xl border border-line bg-surface p-3"
    >
      <View className="flex-row items-center justify-between gap-3">
        <ChainPill name={store.chain.name} color={store.chain.color} />
        {!!distance && (
          <Text
            accessibilityLabel={`A ${distance}`}
            className="font-sans-bold text-sm text-ink"
          >
            {`a ${distance}`}
          </Text>
        )}
      </View>
      <View className="gap-0.5">
        <Text
          numberOfLines={2}
          className="font-sans-bold text-base leading-5 text-ink"
        >
          {store.name}
        </Text>
        {!!address && (
          <Text
            numberOfLines={2}
            className="font-sans text-sm leading-5 text-muted"
          >
            {address}
          </Text>
        )}
      </View>
      <View className="self-start pt-1">
        <Button
          title="Cómo llegar"
          variant="secondary"
          accessibilityLabel={`Cómo llegar a ${store.name}`}
          icon={<Navigation size={18} color={colors.ink} />}
          onPress={() =>
            void openDirections({
              lat: store.lat,
              lng: store.lng,
              name: store.name,
            })
          }
        />
      </View>
    </View>
  );
});
