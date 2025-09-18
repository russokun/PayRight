
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TrendingDown, MapPin } from 'lucide-react-native';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const sortedPrices = [...product.prices].sort((a, b) => a.price - b.price);
  const cheapestPrice = sortedPrices[0];
  const priceRange = sortedPrices[sortedPrices.length - 1].price - cheapestPrice.price;

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View className="mb-3">
        <Text className="text-lg font-bold text-gray-900 mb-1">{product.name}</Text>
        <Text className="text-sm text-gray-500 font-medium">{product.category}</Text>
      </View>

      <View className="flex-row items-center justify-between mb-3 py-2 bg-green-50 rounded-lg px-3">
        <View className="flex-row items-center flex-1">
          <TrendingDown size={16} color="#10B981" />
          <Text className="text-xs text-green-600 font-semibold ml-1 mr-2">Mejor precio</Text>
          <Text className="text-lg font-extrabold text-green-600">${cheapestPrice.price.toLocaleString()}</Text>
        </View>
        <Text className="text-sm font-semibold text-green-600">{cheapestPrice.supermarket}</Text>
      </View>

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center flex-1">
          <MapPin size={14} color="#9CA3AF" />
          <Text className="text-xs text-gray-400 ml-1">{cheapestPrice.location}</Text>
        </View>
        <View className="items-end">
          <Text className="text-xs font-semibold text-gray-500 mb-0.5">{product.prices.length} precios</Text>
          {priceRange > 0 && (
            <Text className="text-[11px] text-red-600">Varía hasta ${priceRange.toLocaleString()}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}