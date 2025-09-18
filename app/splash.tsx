import React, { useEffect } from 'react';
import { View, Text, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';

export default function Splash() {
  const router = useRouter();
  const scale = new Animated.Value(0.8);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => router.replace('/onboarding'), 1200);
    });
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <Image source={require('../assets/images/icon.png')} className="w-36 h-36" />
      </Animated.View>
      <Text className="text-xl text-gray-700 mt-4">PayRight — Compara precios y ahorra</Text>
    </View>
  );
}
