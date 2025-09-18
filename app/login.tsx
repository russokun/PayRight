import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';

export default function Login() {
  const { login } = useAuthStore();
  const router = useRouter();

  const handleLogin = () => {
    login();
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-extrabold text-red-600 mb-4">Inicia sesión</Text>
      <Text className="text-base text-gray-600 text-center mb-6">Entrar con cuenta (mock)</Text>
      <TouchableOpacity className="bg-red-600 rounded-xl px-8 py-3" onPress={handleLogin}>
        <Text className="text-white font-bold">Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}
