import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/theme/useTheme';

export default function Loader({ size = 'large' }: { size?: 'small' | 'large' }) {
  const { colors } = useTheme();
  return (
    <View className="absolute inset-0 items-center justify-center bg-ink/20">
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  );
}
