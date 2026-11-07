import React from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <TouchableOpacity
        className="rounded-xl border border-line bg-surface px-4 py-3"
        onPress={() => setOpen(true)}
      >
        <Text className="font-sans text-ink">{value || placeholder || 'Seleccionar'}</Text>
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)} transparent>
        <View className="flex-1 justify-end bg-ink/30">
          <View className="rounded-t-2xl bg-surface p-4">
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="border-b border-line py-3"
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                >
                  <Text className="font-sans text-base text-ink">{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity className="py-3 items-center" onPress={() => setOpen(false)}>
              <Text className="font-sans-bold text-ink">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
