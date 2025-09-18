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
        className="bg-white border border-gray-200 rounded-xl px-4 py-3"
        onPress={() => setOpen(true)}
      >
        <Text>{value || placeholder || 'Seleccionar'}</Text>
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)} transparent>
        <View className="flex-1 justify-end bg-black/30">
          <View className="bg-white p-4 rounded-t-2xl">
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="py-3 border-b border-gray-100"
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                >
                  <Text className="text-base">{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity className="py-3 items-center" onPress={() => setOpen(false)}>
              <Text className="text-red-600 font-bold">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
