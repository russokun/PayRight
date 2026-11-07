import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { FilterBar } from '@/components/search/FilterBar';
import { FilterSheet } from '@/components/search/FilterSheet';
import { ResultsList } from '@/components/search/ResultsList';
import { SearchField } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { SearchFilters } from '@/lib/api/client';
import { useCategories, useMeta, useSearch } from '@/lib/api/queries';
import {
  activeFilterCount,
  isUnfiltered,
  parseSearchParams,
  toRouteParamsPatch,
} from '@/lib/search-url';
import { useTheme } from '@/theme/useTheme';

/**
 * Resultados. Todo el estado de búsqueda vive en la URL (`q`, `category`, `subcategory`, `chain`, `offers`,
 * `sort`), así que un enlace profundo, atrás y compartir funcionan solos.
 */
export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const paramsKey = JSON.stringify(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filters = useMemo(() => parseSearchParams(params), [paramsKey]);

  const meta = useMeta();
  const [sheetOpen, setSheetOpen] = useState(false);
  const aisles = useCategories(true, sheetOpen && !!filters.category);
  const search = useSearch(filters);

  // el campo se escribe sin demora; la URL (y por tanto la búsqueda) lo sigue 300 ms después
  const [text, setText] = useState(filters.q ?? '');
  const debounced = useDebouncedValue(text, 300).trim();
  useEffect(() => {
    if (debounced.length === 1 || debounced === (filters.q ?? '')) return;
    router.setParams({ q: debounced || undefined });
    // `filters.q` y `router` no deben relanzarlo: solo lo que la persona escribió
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const change = useCallback(
    (next: SearchFilters) =>
      router.setParams(toRouteParamsPatch({ ...next, q: next.q ?? filters.q })),
    [router, filters.q],
  );
  const clearFilters = useCallback(
    () => router.setParams(toRouteParamsPatch({ q: filters.q })),
    [router, filters.q],
  );
  const openProduct = useCallback(
    (slug: string) =>
      router.push({ pathname: '/producto/[slug]', params: { slug } }),
    [router],
  );

  const chains = meta.data?.chains ?? [];
  const categories = meta.data?.categories ?? [];
  const categoryName = categories.find(
    (c) => c.slug === filters.category,
  )?.name;
  const title = categoryName ?? (filters.q ? `“${filters.q}”` : 'Buscar');
  const department = aisles.data?.find((d) => d.slug === filters.category);

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen
        options={{
          headerShown: true,
          title,
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerTitleStyle: { color: colors.ink },
        }}
      />
      <View className="gap-3 pb-3 pt-2">
        <View className="px-4">
          <SearchField
            value={text}
            onChangeText={setText}
            onSubmit={() => setText((t) => t.trim())}
            onScanPress={() => router.push('/escanear')}
            autoFocus={isUnfiltered(filters)}
          />
        </View>
        <FilterBar
          filters={filters}
          chains={chains}
          categories={categories}
          onChange={change}
          onOpenSheet={() => setSheetOpen(true)}
        />
      </View>
      <ResultsList
        filters={filters}
        onOpenProduct={openProduct}
        onClearFilters={
          activeFilterCount(filters) > 0 ? clearFilters : undefined
        }
      />
      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={filters}
        total={search.data?.total ?? null}
        chains={chains}
        categories={categories}
        aisles={department?.aisles ?? []}
        onChange={change}
      />
    </View>
  );
}
