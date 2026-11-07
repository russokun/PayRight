import { BottomSheet, RNHostView } from "@expo/ui";
import { ScrollView, Text, View } from "react-native";
import { Button, Chip } from "@/components/ui";
import type { SearchFilters } from "@/lib/api/client";
import { SORT_OPTIONS, activeFilterCount } from "@/lib/search-url";
import type { CategoryDTO, ChainDTO, DepartmentDTO } from "@/types/api";

type Props = {
  open: boolean;
  onClose: () => void;
  filters: SearchFilters;
  total: number | null;
  chains: ChainDTO[];
  categories: CategoryDTO[];
  /** Pasillos del departamento elegido (vacío si no hay o aún no cargan). */
  aisles: NonNullable<DepartmentDTO["aisles"]>;
  onChange: (next: SearchFilters) => void;
};

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text accessibilityRole="header" className="font-sans-bold text-sm text-ink">
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

/**
 * "Filtros y orden" como hoja nativa de `@expo/ui` (SwiftUI en iOS, Compose en Android, diálogo en web).
 * Cada toque aplica el filtro al instante, igual que en la web; "Ver N productos" solo cierra la hoja.
 */
export function FilterSheet({ open, onClose, filters, total, chains, categories, aisles, onChange }: Props) {
  const active = activeFilterCount(filters) > 0 || !!filters.sort;
  return (
    <BottomSheet isPresented={open} onDismiss={onClose} snapPoints={["half", "full"]}>
      <RNHostView>
        <View className="flex-1 bg-bg">
          <View className="flex-row items-center justify-between px-4 pb-2">
            <Text accessibilityRole="header" className="font-display-extrabold text-xl text-ink">
              Filtros y orden
            </Text>
            {active ? (
              <Button
                title="Quitar todo"
                variant="ghost"
                onPress={() => onChange({ q: filters.q })}
                accessibilityLabel="Quitar todos los filtros y el orden"
              />
            ) : null}
          </View>
          <ScrollView contentContainerStyle={{ gap: 20, paddingHorizontal: 16, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
            <Group title="Ordenar por">
              {SORT_OPTIONS.map((s) => (
                <Chip
                  key={s.key}
                  label={s.label}
                  selected={(filters.sort ?? "relevancia") === s.key}
                  onPress={() => onChange({ ...filters, sort: s.key === "relevancia" ? undefined : s.key })}
                />
              ))}
            </Group>
            <Group title="Supermercado">
              {chains.map((c) => (
                <Chip
                  key={c.slug}
                  label={c.name}
                  selected={filters.chain === c.slug}
                  onPress={() => onChange({ ...filters, chain: filters.chain === c.slug ? undefined : c.slug })}
                />
              ))}
            </Group>
            <Group title="Ofertas">
              <Chip label="Solo ofertas" selected={!!filters.offers} onPress={() => onChange({ ...filters, offers: filters.offers ? undefined : true })} />
            </Group>
            <Group title="Departamento">
              {categories.map((c) => (
                <Chip
                  key={c.slug}
                  label={`${c.emoji} ${c.name}`}
                  selected={filters.category === c.slug}
                  onPress={() =>
                    onChange({
                      ...filters,
                      category: filters.category === c.slug ? undefined : c.slug,
                      subcategory: undefined,
                    })
                  }
                />
              ))}
            </Group>
            {filters.category && aisles.length > 0 ? (
              <Group title="Pasillo">
                {aisles.map((a) => (
                  <Chip
                    key={a.slug}
                    label={`${a.name} · ${a.count}`}
                    selected={filters.subcategory === a.slug}
                    onPress={() => onChange({ ...filters, subcategory: filters.subcategory === a.slug ? undefined : a.slug })}
                  />
                ))}
              </Group>
            ) : null}
          </ScrollView>
          <View className="px-4 pb-6 pt-2">
            <Button
              title={total === null ? "Ver los productos" : `Ver ${total.toLocaleString("es-CL")} ${total === 1 ? "producto" : "productos"}`}
              onPress={onClose}
            />
          </View>
        </View>
      </RNHostView>
    </BottomSheet>
  );
}
