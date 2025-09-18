import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center bg-gradient-to-b from-red-100 to-white px-8">
      <Text className="text-4xl font-extrabold text-red-600 mb-4 tracking-tight">PayRight</Text>
      <Text className="text-lg text-gray-700 text-center mb-8">
        ¡Bienvenido a la app colaborativa para comparar precios de supermercados en Chile!
        Descubre, reporta y ahorra junto a la comunidad.
      </Text>
      <TouchableOpacity
        className="bg-red-600 rounded-xl px-8 py-4 shadow-lg"
        onPress={() => router.replace("/(tabs)")}
        activeOpacity={0.85}
      >
        <Text className="text-white text-lg font-bold">Comenzar</Text>
      </TouchableOpacity>
    </View>
  );
}
