import React from 'react';
import { View } from 'react-native';

export default function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View className="mb-3 rounded-2xl border border-line bg-surface p-4">
      <View className="mb-3 h-6 w-3/4 rounded bg-surface-2" />
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} className="mb-2 h-3 w-full rounded bg-surface-2" />
      ))}
    </View>
  );
}
