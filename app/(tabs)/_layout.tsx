import { Tabs } from 'expo-router';
import { House, MapPin, Plus, ShoppingCart, Trophy } from 'lucide-react-native';
import type { ComponentType } from 'react';

// Colores provisionales de marca (PRODUCT.md / globals.css de payright-web).
// El Bloque 2 los reemplaza por tokens (theme/tokens.ts).
const INK = '#111410';
const MUTED = '#595E56';
const SURFACE = '#FFFFFF';
const LINE = '#E4E6DF';

type IconProps = { size?: number; color?: string };

function icon(Icon: ComponentType<IconProps>) {
  return ({ size, color }: { size: number; color: string }) => <Icon size={size} color={color} />;
}

// Mismas 5 secciones que BottomNav de payright-web.
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: INK,
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: { backgroundColor: SURFACE, borderTopColor: LINE },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icon(House) }} />
      <Tabs.Screen name="cerca" options={{ title: 'Cerca', tabBarIcon: icon(MapPin) }} />
      <Tabs.Screen name="subir" options={{ title: 'Subir', tabBarIcon: icon(Plus) }} />
      <Tabs.Screen name="carrito" options={{ title: 'Carrito', tabBarIcon: icon(ShoppingCart) }} />
      <Tabs.Screen name="ranking" options={{ title: 'Ranking', tabBarIcon: icon(Trophy) }} />
    </Tabs>
  );
}
