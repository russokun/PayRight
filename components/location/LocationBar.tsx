import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { locationLabel } from '@/lib/location/place';
import { useLocationStore } from '@/store/useLocationStore';
import { useTheme } from '@/theme/useTheme';

/**
 * «Cerca de: Ñuñoa, Metropolitana de Santiago» y «Cambiar», que abre la pantalla de ubicación. Lee la ubicación
 * guardada en el teléfono; sin ella invita a elegir una. `onChange` reemplaza la navegación por defecto.
 */
export function LocationBar({ onChange }: { onChange?: () => void }) {
  const router = useRouter();
  const { colors } = useTheme();
  const location = useLocationStore((s) => s.location);
  const open = onChange ?? (() => router.push('/ubicacion'));
  const label = locationLabel(location);

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface py-2 pl-4 pr-2">
      <MapPin size={20} color={colors.muted} />
      <View
        accessible
        accessibilityLabel={
          location ? `Cerca de ${label}` : 'Sin ubicación elegida'
        }
        className="min-w-0 flex-1"
      >
        <Text className="font-sans-medium text-xs text-muted">
          {location ? 'Cerca de' : 'Ubicación'}
        </Text>
        <Text
          numberOfLines={2}
          className="font-sans-bold text-base leading-5 text-ink"
        >
          {location ? label : 'Elige dónde estás'}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          location ? 'Cambiar la ubicación' : 'Elegir la ubicación'
        }
        onPress={open}
        className="min-h-11 min-w-11 items-center justify-center rounded-full border border-line px-4 active:bg-surface-2"
      >
        <Text className="font-sans-bold text-sm text-ink">
          {location ? 'Cambiar' : 'Elegir'}
        </Text>
      </Pressable>
    </View>
  );
}
