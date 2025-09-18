import { View, Text, SafeAreaView, Image } from 'react-native';
import { useUserStore } from '@/store/useUserStore';

export default function ProfileScreen() {
  const { user } = useUserStore();
  return (
    <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
      <View className="items-center mb-6">
        <Image
          source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=DC2626&color=fff` }}
          className="w-24 h-24 rounded-full mb-4"
        />
        <Text className="text-2xl font-extrabold text-gray-900 mb-1">{user.name}</Text>
        <Text className="text-base text-gray-500">Usuario colaborador</Text>
      </View>
      <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full max-w-xs items-center">
        <Text className="text-lg font-bold text-red-600 mb-2">Aportes</Text>
        <Text className="text-3xl font-extrabold text-gray-900 mb-1">{user.reportsCount}</Text>
        <Text className="text-base text-gray-500">precios reportados</Text>
      </View>
    </SafeAreaView>
  );
}
