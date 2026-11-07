import { useRouter, type Href } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';
import { useApiLocation } from '@/store/useLocationStore';
import { useTheme } from '@/theme/useTheme';

// `/ubicacion` la construye el bloque de Cerca: aquí solo se navega a esa ruta (sin depender de los tipos generados).
const LOCATION_ROUTE = '/ubicacion' as Href;

/** Aviso discreto cuando no hay ubicación elegida: sin ella la cotización no trae distancias. */
export function LocationHint() {
  const router = useRouter();
  const { colors } = useTheme();
  const location = useApiLocation();
  if (location) return null;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Elige tu ubicación para ver distancias"
      onPress={() => router.push(LOCATION_ROUTE)}
      className="min-h-11 flex-row items-center gap-2 self-start rounded-full active:opacity-70"
    >
      <MapPin size={16} color={colors.muted} />
      <Text className="font-sans-semibold text-sm text-muted underline">Elige tu ubicación para ver distancias</Text>
    </Pressable>
  );
}
