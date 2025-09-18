
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { Search, Filter } from 'lucide-react-native';
import { router } from 'expo-router';
import { useProductStore } from '@/store/useProductStore';
import { ProductCard } from '@/components/ProductCard';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { products, searchProducts } = useProductStore();

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const filteredProducts = searchQuery 
    ? searchProducts(searchQuery)
    : products;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-extrabold text-red-600 mb-1">PayRight</Text>
        <Text className="text-base text-gray-500 font-medium">Compara precios y ahorra</Text>
      </View>

      <View className="flex-row px-5 py-4 gap-3 bg-white">
        <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 h-12">
          <Search size={20} color="#9CA3AF" className="mr-3" />
          <TextInput
            className="flex-1 text-base text-gray-800"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <TouchableOpacity className="w-12 h-12 bg-red-50 rounded-xl items-center justify-center border border-red-200">
          <Filter size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>

  <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="flex-row bg-white rounded-2xl p-5 my-4 shadow-sm">
          <View className="flex-1 items-center">
            <Text className="text-xl font-extrabold text-red-600 mb-1">{products.length}</Text>
            <Text className="text-sm text-gray-500 font-medium">Productos</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-xl font-extrabold text-red-600 mb-1">15</Text>
            <Text className="text-sm text-gray-500 font-medium">Supermercados</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-xl font-extrabold text-red-600 mb-1">1.2K</Text>
            <Text className="text-sm text-gray-500 font-medium">Usuarios</Text>
          </View>
        </View>

        <Text className="text-lg font-bold text-gray-800 mb-4 mt-2">Productos Populares</Text>

        <View className="gap-4 pb-24">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <View key={i}><Text className="mb-3"><Text /></Text></View>)
          ) : (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => router.push(`/products/${product.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}