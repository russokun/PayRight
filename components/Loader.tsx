import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function Loader({ size = 'large' }: { size?: 'small' | 'large' }) {
  return (
    <View className="absolute inset-0 bg-black/20 items-center justify-center">
      <ActivityIndicator size={size} color="#ef4444" />
    </View>
  );
}
