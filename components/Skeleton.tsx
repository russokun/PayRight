import React from 'react';
import { View } from 'react-native';

export default function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="h-6 bg-gray-200 rounded mb-3 w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} className="h-3 bg-gray-200 rounded mb-2 w-full" />
      ))}
    </View>
  );
}
