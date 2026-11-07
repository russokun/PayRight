import { Tabs } from 'expo-router';
import { House, MapPin, Plus, ShoppingCart, Trophy } from 'lucide-react-native';
import type { ComponentType } from 'react';
import type { ColorValue } from 'react-native';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

type IconProps = { size?: number; color?: string };

function icon(Icon: ComponentType<IconProps>) {
  // Expo Router entrega `color` como ColorValue; con tabBarActive/InactiveTintColor en hex es siempre string.
  return ({ size, color }: { size: number; color: ColorValue }) => (
    <Icon size={size} color={color as string} />
  );
}

// Mismas 5 secciones que BottomNav de payright-web. Los colores salen de theme/tokens.ts según el esquema.
export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        tabBarLabelStyle: { fontSize: 12, fontFamily: fonts.sansSemibold },
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icon(House) }} />
      <Tabs.Screen name="cerca" options={{ title: 'Cerca', tabBarIcon: icon(MapPin) }} />
      <Tabs.Screen name="subir" options={{ title: 'Subir', tabBarIcon: icon(Plus) }} />
      <Tabs.Screen name="carrito" options={{ title: 'Carrito', tabBarIcon: icon(ShoppingCart) }} />
      <Tabs.Screen name="ranking" options={{ title: 'Ranking', tabBarIcon: icon(Trophy) }} />
    </Tabs>
  );
}
