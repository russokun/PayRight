import type { UseQueryResult } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { EmptyState, ErrorState } from '@/components/ui';
import { errorMessage } from '@/lib/api/errors';
import type { StoresPage } from '@/lib/api/places-client';
import { openSupermarketsNear } from '@/lib/maps';
import { useTheme } from '@/theme/useTheme';
import { StoreRow } from './StoreRow';

/**
 * «Supermercados cerca»: el más cercano de cada cadena y otros locales a la mano, cada uno con «Cómo llegar»; la
 * atribución de OpenStreetMap cuando algún local viene de ahí; y el enlace a todos los supermercados en Google Maps.
 */
export function StoresSection({
  query,
  at,
}: {
  query: UseQueryResult<StoresPage>;
  at: { lat: number; lng: number };
}) {
  const { colors } = useTheme();
  const { data } = query;
  const perChain = data?.stores.per_chain ?? [];
  const taken = new Set(perChain.map((s) => s.id));
  const others = (data?.stores.nearest ?? []).filter((s) => !taken.has(s.id));
  const attribution = data?.meta.attribution?.trim() || null;

  return (
    <View className="mt-6 gap-3">
      <View className="gap-1">
        <Text
          accessibilityRole="header"
          className="font-display-extrabold text-xl text-ink"
        >
          Supermercados cerca
        </Text>
        <Text className="font-sans text-sm leading-5 text-muted">
          El más cercano de cada cadena y otros locales a la mano. «Cómo llegar»
          abre tu app de mapas.
        </Text>
      </View>

      {!data && query.isError ? (
        <ErrorState
          message={errorMessage(query.error)}
          onRetry={() => query.refetch()}
        />
      ) : !data ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Cargando supermercados"
          className="items-center py-6"
        >
          <ActivityIndicator color={colors.muted} />
        </View>
      ) : perChain.length === 0 && others.length === 0 ? (
        <EmptyState
          title="No encontramos supermercados cerca"
          hint="Prueba con otra ubicación."
        />
      ) : (
        <>
          {perChain.length > 0 && (
            <View className="gap-3">
              <Text
                accessibilityRole="header"
                className="font-sans-bold text-sm text-ink"
              >
                El más cercano de cada cadena
              </Text>
              {perChain.map((s) => (
                <StoreRow key={`c${s.id}`} store={s} />
              ))}
            </View>
          )}
          {others.length > 0 && (
            <View className="gap-3">
              <Text
                accessibilityRole="header"
                className="font-sans-bold text-sm text-ink"
              >
                Otros locales cerca
              </Text>
              {others.map((s) => (
                <StoreRow key={`n${s.id}`} store={s} />
              ))}
            </View>
          )}
        </>
      )}

      {!!attribution && (
        <Text className="font-sans text-xs leading-4 text-muted">
          {attribution}
        </Text>
      )}

      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Ver todos los supermercados en Google Maps"
        accessibilityHint="Abre tu app de mapas"
        onPress={() => void openSupermarketsNear(at)}
        className="min-h-11 flex-row items-center gap-2 py-2 active:opacity-70"
      >
        <ExternalLink size={18} color={colors.ink} />
        <Text className="min-w-0 flex-1 font-sans-bold text-sm leading-5 text-ink underline">
          Ver todos los supermercados en Google Maps
        </Text>
      </Pressable>
    </View>
  );
}
