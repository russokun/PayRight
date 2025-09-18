import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, TrendingDown, TrendingUp, MapPin, Calendar } from 'lucide-react-native';
import { useProductStore } from '@/store/useProductStore';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const { getProductById } = useProductStore();
  
  const product = useMemo(() => {
    if (typeof id === 'string') {
      return getProductById(id);
    }
    return null;
  }, [id, getProductById]);

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-lg font-bold text-red-600 mb-4">Producto no encontrado</Text>
          <TouchableOpacity
            className="bg-red-100 px-6 py-2 rounded-xl"
            onPress={() => router.back()}
          >
            <Text className="text-base text-red-700 font-semibold">Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sortedPrices = [...product.prices].sort((a, b) => a.price - b.price);
  const cheapestPrice = sortedPrices[0];
  const avgPrice = sortedPrices.reduce((sum, p) => sum + p.price, 0) / sortedPrices.length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-800">Detalle del Producto</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="mt-6 mb-4">
          <Text className="text-2xl font-extrabold text-gray-900 mb-1">{product.name}</Text>
          <Text className="text-base text-gray-500 font-medium">{product.category}</Text>
        </View>

        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 items-center bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <TrendingDown size={24} color="#10B981" />
            <Text className="text-xs text-gray-500 font-medium mt-2 mb-1">Mejor Precio</Text>
            <Text className="text-xl font-extrabold text-green-600 mb-1">${cheapestPrice.price.toLocaleString()}</Text>
            <Text className="text-xs text-gray-400">{cheapestPrice.supermarket}</Text>
          </View>
          <View className="flex-1 items-center bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <TrendingUp size={24} color="#6B7280" />
            <Text className="text-xs text-gray-500 font-medium mt-2 mb-1">Precio Promedio</Text>
            <Text className="text-xl font-extrabold text-red-600 mb-1">${Math.round(avgPrice).toLocaleString()}</Text>
            <Text className="text-xs text-gray-400">{sortedPrices.length} tiendas</Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">Precios por Supermercado</Text>
          {sortedPrices.map((priceData, index) => {
            const isCheapest = index === 0;
            const difference = priceData.price - cheapestPrice.price;
            return (
              <View
                key={`${priceData.supermarket}-${index}`}
                className={`bg-white rounded-xl p-4 mb-3 border ${isCheapest ? 'border-green-400 bg-green-50' : 'border-gray-100'}`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={`text-lg font-bold ${isCheapest ? 'text-green-600' : 'text-gray-900'}`}>{priceData.supermarket}</Text>
                  {isCheapest && (
                    <View className="bg-green-500 px-2 py-1 rounded-full">
                      <Text className="text-white text-xs font-bold">MEJOR PRECIO</Text>
                    </View>
                  )}
                </View>
                <View className="flex-row items-end gap-2 mb-2">
                  <Text className={`text-xl font-extrabold ${isCheapest ? 'text-green-600' : 'text-gray-900'}`}>${priceData.price.toLocaleString()}</Text>
                  {difference > 0 && (
                    <Text className="text-xs text-red-600 font-semibold">+${difference.toLocaleString()} más caro</Text>
                  )}
                </View>
                <View className="flex-row justify-between items-center mt-1">
                  <View className="flex-row items-center">
                    <MapPin size={14} color="#9CA3AF" />
                    <Text className="text-xs text-gray-400 ml-1">{priceData.location}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Calendar size={14} color="#9CA3AF" />
                    <Text className="text-xs text-gray-400 ml-1">{priceData.date}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">Información del Producto</Text>
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm text-gray-500 mb-2">
              Este producto ha sido reportado por {sortedPrices.length} usuarios en diferentes supermercados. Los precios se actualizan constantemente gracias a la colaboración de la comunidad PayRight.
            </Text>
            <Text className="text-sm text-gray-500">
              💡 ¿Viste un precio diferente? ¡Repórtalo y ayuda a otros usuarios a ahorrar!
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="bg-red-600 rounded-xl p-4 items-center mb-10 shadow-lg"
          onPress={() => router.push('/report')}
        >
          <Text className="text-white text-base font-bold">Reportar Nuevo Precio</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
  