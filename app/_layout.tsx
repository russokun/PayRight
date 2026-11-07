import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/components/ToastProvider';
import { QueryProvider } from '@/lib/api/QueryProvider';
import { fontAssets } from '@/theme/font-assets';
import { useTheme } from '@/theme/useTheme';
import '../global.css';

// El splash se queda hasta que carguen las fuentes: así no hay un parpadeo de texto con la fuente del sistema.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const { scheme, colors } = useTheme();

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  // Fondo de la ventana nativa (detrás de las pantallas): evita un destello blanco en modo oscuro.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
  }, [colors.bg]);

  // Si las fuentes fallan se sigue con la fuente del sistema (fontError): la app no se queda en blanco.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <QueryProvider>
          <View className="flex-1 bg-bg">
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </View>
        </QueryProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      </ToastProvider>
    </SafeAreaProvider>
  );
}
