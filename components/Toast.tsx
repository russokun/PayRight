import React, { useEffect } from 'react';
import { Animated, Text, View } from 'react-native';

export default function Toast({ message, onHide }: { message: string; onHide?: () => void }) {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onHide && onHide());
  }, []);

  return (
    <Animated.View style={{ position: 'absolute', bottom: 40, left: 20, right: 20, opacity }}>
      <View className="bg-black/80 px-4 py-3 rounded-xl items-center">
        <Text className="text-white">{message}</Text>
      </View>
    </Animated.View>
  );
}
