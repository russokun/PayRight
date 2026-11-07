import { Stack, useRouter } from 'expo-router';
import { LocateFixed, Lock, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommuneRow } from '@/components/location/CommuneRow';
import { Button, EmptyState, ErrorState, Notice } from '@/components/ui';
import { errorMessage } from '@/lib/api/errors';
import { useCommunes } from '@/lib/api/places-queries';
import { filterCommunes, type CommuneMatch } from '@/lib/location/communes';
import {
  getGpsLocation,
  gpsProblem,
  openLocationSettings,
  type GpsResult,
} from '@/lib/location/gps';
import { locationLabel, sourceLabelOf } from '@/lib/location/place';
import { useLocationStore } from '@/store/useLocationStore';
import { useTheme } from '@/theme/useTheme';

const PRIVACY =
  'Tu ubicación se guarda solo en tu teléfono y se usa para ordenar precios por cercanía. A PayRight solo llegan coordenadas aproximadas (a ~100 m), sin tu nombre ni tu cuenta.';

type GpsState =
  | { kind: 'idle' }
  | { kind: 'locating' }
  | { kind: 'problem'; result: Exclude<GpsResult, { status: 'granted' }> };

/**
 * Elegir la ubicación: «Usar mi ubicación» (GPS, con permiso en primer plano) o una de las 346 comunas. Se abre como
 * modal desde «Cerca» y se cierra al elegir. La lista de comunas es una FlatList virtualizada y la búsqueda ignora
 * tildes y mayúsculas.
 */
export default function LocationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const current = useLocationStore((s) => s.location);
  const communes = useCommunes();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [gps, setGps] = useState<GpsState>({ kind: 'idle' });
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const results = useMemo(
    () => filterCommunes(communes.data ?? [], query),
    [communes.data, query],
  );

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/cerca');
  }, [router]);

  const findMe = useCallback(async () => {
    setGps({ kind: 'locating' });
    const result = await getGpsLocation();
    if (!mounted.current) return;
    if (result.status === 'granted') {
      // el nombre del lugar llega después, en `meta.location.place` de Cerca (ver useAdoptPlace)
      useLocationStore.getState().setLocation({
        lat: result.lat,
        lng: result.lng,
        place: null,
        source: 'gps',
      });
      setGps({ kind: 'idle' });
      close();
      return;
    }
    setGps({ kind: 'problem', result });
  }, [close]);

  const pickCommune = useCallback(
    (c: CommuneMatch) => {
      useLocationStore.getState().setLocation({
        lat: c.lat,
        lng: c.lng,
        place: c.place,
        source: 'comuna',
      });
      close();
    },
    [close],
  );

  const locating = gps.kind === 'locating';
  const problem = gps.kind === 'problem' ? gpsProblem(gps.result) : null;
  const selectedPlace = current?.source === 'comuna' ? current.place : null;

  const header = (
    <View className="gap-4 pb-2">
      <View className="flex-row items-center justify-between gap-3">
        <Text
          accessibilityRole="header"
          className="min-w-0 flex-1 font-display-extrabold text-2xl text-ink"
        >
          Tu ubicación
        </Text>
        <Button
          title="Cerrar"
          variant="ghost"
          onPress={close}
          icon={<X size={18} color={colors.ink} />}
        />
      </View>

      <View className="flex-row items-start gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
        <View className="pt-0.5">
          <Lock size={16} color={colors.muted} />
        </View>
        <Text className="min-w-0 flex-1 font-sans text-sm leading-5 text-ink">
          {PRIVACY}
        </Text>
      </View>

      {current ? (
        <View className="gap-3 rounded-2xl border border-line bg-surface p-4">
          <View className="gap-0.5">
            <Text className="font-sans-medium text-xs text-muted">
              Ubicación actual
            </Text>
            <Text className="font-sans-bold text-base leading-5 text-ink">
              {locationLabel(current)}
            </Text>
            <Text className="font-sans text-sm text-muted">
              {sourceLabelOf(current)}
            </Text>
          </View>
          <View className="self-start">
            <Button
              title="Quitar mi ubicación"
              variant="secondary"
              onPress={() => useLocationStore.getState().clearLocation()}
            />
          </View>
        </View>
      ) : null}

      <Button
        title={locating ? 'Buscando tu ubicación…' : 'Usar mi ubicación'}
        loading={locating}
        onPress={findMe}
        accessibilityLabel={
          locating ? 'Buscando tu ubicación' : 'Usar mi ubicación'
        }
        icon={
          locating ? undefined : (
            <LocateFixed size={20} color={colors.primaryInk} />
          )
        }
      />

      {problem ? (
        <View accessibilityLiveRegion="polite" className="gap-2">
          <Notice tone="warn">
            <Text className="font-sans-bold">{problem.title}</Text>
            {`\n${problem.hint}`}
          </Notice>
          <View className="self-start">
            {problem.action === 'settings' ? (
              <Button
                title="Abrir Ajustes"
                variant="secondary"
                onPress={() => void openLocationSettings()}
              />
            ) : (
              <Button
                title="Intentar de nuevo"
                variant="secondary"
                onPress={findMe}
              />
            )}
          </View>
        </View>
      ) : null}

      <View className="gap-2 pt-2">
        <Text
          accessibilityRole="header"
          className="font-display-extrabold text-lg text-ink"
        >
          O elige tu comuna
        </Text>
        <View
          className={`min-h-14 flex-row items-center rounded-full border bg-surface px-5 ${focused ? 'border-primary' : 'border-line'}`}
        >
          <TextInput
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Escribe tu comuna"
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel="Buscar tu comuna"
            className="min-h-14 flex-1 py-3 font-sans-semibold text-base text-ink"
            // en web el navegador dibuja su propio contorno al enfocar; el borde del contenedor ya lo indica
            style={{ outlineWidth: 0 }}
          />
          {query.length > 0 && (
            <Button
              title="Borrar"
              variant="ghost"
              onPress={() => setQuery('')}
              accessibilityLabel="Borrar búsqueda"
            />
          )}
        </View>
        {communes.data ? (
          <Text className="font-sans text-xs text-muted">
            {query.trim()
              ? `${results.length} ${results.length === 1 ? 'comuna' : 'comunas'}`
              : `${results.length} comunas de todo Chile`}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const empty = communes.isError ? (
    <ErrorState
      message={errorMessage(communes.error)}
      onRetry={() => communes.refetch()}
    />
  ) : communes.isPending ? (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando comunas"
      className="items-center py-8"
    >
      <ActivityIndicator color={colors.muted} />
    </View>
  ) : (
    <EmptyState
      title="No encontramos esa comuna"
      hint="Revisa cómo está escrita. No importan las tildes ni las mayúsculas."
    />
  );

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen options={{ presentation: 'modal', headerShown: false }} />
      <FlatList
        data={results}
        keyExtractor={(c) => c.value}
        renderItem={({ item }) => (
          <CommuneRow
            commune={item}
            selected={selectedPlace === item.place}
            onPress={pickCommune}
          />
        )}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16) + 16,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        initialNumToRender={16}
        windowSize={9}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
      />
    </View>
  );
}
