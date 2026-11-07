import { Check } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { CommuneMatch } from '@/lib/location/communes';
import { useTheme } from '@/theme/useTheme';

/** Una comuna de la lista: nombre y, debajo, su región (distingue comunas de igual nombre). Marca la elegida. */
export const CommuneRow = memo(function CommuneRow({
  commune,
  selected,
  onPress,
}: {
  commune: CommuneMatch;
  selected: boolean;
  onPress: (c: CommuneMatch) => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${commune.name}, ${commune.region}`}
      accessibilityState={{ selected }}
      onPress={() => onPress(commune)}
      className="min-h-14 flex-row items-center gap-3 rounded-xl px-3 py-2 active:bg-surface-2"
    >
      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="font-sans-semibold text-base text-ink"
        >
          {commune.name}
        </Text>
        <Text numberOfLines={1} className="font-sans text-sm text-muted">
          {commune.region}
        </Text>
      </View>
      {selected && <Check size={20} strokeWidth={3} color={colors.save} />}
    </Pressable>
  );
});
