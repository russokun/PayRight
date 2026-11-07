import { Link, Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrada' }} />
      <View className="flex-1 items-center justify-center bg-bg p-5">
        <Text accessibilityRole="header" className="text-center font-display-extrabold text-xl text-ink">
          Esta pantalla no existe.
        </Text>
        <Link href="/" asChild>
          <Pressable accessibilityRole="link" className="mt-4 min-h-11 justify-center px-4">
            <Text className="font-sans-bold text-base text-ink underline">Volver al inicio</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
