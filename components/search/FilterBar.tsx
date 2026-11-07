import { ScrollView, View } from "react-native";
import { Chip } from "@/components/ui";
import type { SearchFilters } from "@/lib/api/client";
import { SORT_OPTIONS, activeFilterCount } from "@/lib/search-url";
import type { CategoryDTO, ChainDTO } from "@/types/api";

type Props = {
  filters: SearchFilters;
  chains: ChainDTO[];
  categories: CategoryDTO[];
  onChange: (next: SearchFilters) => void;
  onOpenSheet: () => void;
};

/**
 * Filtros rápidos en una fila que se desliza: "Filtros" abre la hoja completa; "Ofertas" y las cadenas
 * se activan con un toque. Lo que la hoja cambia (orden, departamento) y está activo se ve aquí.
 */
export function FilterBar({ filters, chains, categories, onChange, onOpenSheet }: Props) {
  const count = activeFilterCount(filters);
  const category = categories.find((c) => c.slug === filters.category);
  const sort = SORT_OPTIONS.find((s) => s.key === (filters.sort ?? "relevancia"));
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        accessibilityLabel="Filtros rápidos"
      >
        <Chip label={count > 0 ? `Filtros · ${count}` : "Filtros"} selected={count > 0} onPress={onOpenSheet} />
        <Chip label="Ofertas" selected={!!filters.offers} onPress={() => onChange({ ...filters, offers: filters.offers ? undefined : true })} />
        {category ? (
          <Chip
            label={`${category.emoji} ${category.name} ✕`}
            selected
            onPress={() => onChange({ ...filters, category: undefined, subcategory: undefined })}
          />
        ) : null}
        {filters.sort && sort ? <Chip label={`Orden: ${sort.label}`} selected onPress={onOpenSheet} /> : null}
        {chains.map((c) => (
          <Chip
            key={c.slug}
            label={c.name}
            selected={filters.chain === c.slug}
            onPress={() => onChange({ ...filters, chain: filters.chain === c.slug ? undefined : c.slug })}
          />
        ))}
      </ScrollView>
    </View>
  );
}
