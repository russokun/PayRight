import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function Onboarding() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Image source={require('../assets/images/icon.png')} className="w-40 h-40 mb-6" />
      <Text className="text-2xl font-extrabold text-red-600 mb-2">Bienvenido a PayRight</Text>
      <Text className="text-base text-gray-600 text-center mb-6">Compara precios, reporta y ahorra con la comunidad.</Text>
      <TouchableOpacity className="bg-red-600 rounded-xl px-8 py-3" onPress={() => router.replace('/welcome')}>
        <Text className="text-white font-bold">Comenzar</Text>
      </TouchableOpacity>
    </View>
  );
}
