import React from 'react';
import { View, Text, Animated } from 'react-native';

type Props = {
  message: string;
  style?: any;
};

export default function GlobalToast({ message, style }: Props) {
  return (
    <View style={[{ backgroundColor: '#111827', padding: 12, borderRadius: 10, maxWidth: '90%' }, style]}>
      <Text style={{ color: '#fff', fontWeight: '600' }}>{message}</Text>
    </View>
  );
}
