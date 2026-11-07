import React from 'react';
import { View, Text } from 'react-native';

type Props = {
  message: string;
  style?: any;
};

export default function GlobalToast({ message, style }: Props) {
  return (
    <View className="max-w-[90%] rounded-xl bg-field px-3 py-3" style={style}>
      <Text className="font-sans-semibold text-field-ink">{message}</Text>
    </View>
  );
}
