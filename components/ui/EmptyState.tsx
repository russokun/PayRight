import { Text, View } from "react-native";

/** Sin resultados (no se muestra mientras la primera carga sigue en curso: para eso está LoadingList). */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-line px-6 py-10">
      <Text accessibilityRole="header" className="text-center font-display-extrabold text-lg text-ink">
        {title}
      </Text>
      {!!hint && <Text className="mt-2 text-center font-sans text-sm leading-5 text-muted">{hint}</Text>}
    </View>
  );
}
