import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, SafeAreaView, Alert, Animated, Easing } from 'react-native';
import { MapPin, DollarSign, Store } from 'lucide-react-native';
import { useProductStore } from '@/store/useProductStore';
import { useUserStore } from '@/store/useUserStore';
import { useToast } from '@/components/ToastProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUPERMARKETS = [
  'Lider','Jumbo','Santa Isabel','Unimarc','Tottus','Acuenta','Montserrat','Express de Lider'
];

export default function ReportScreen() {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [selectedSupermarket, setSelectedSupermarket] = useState<string | null>(null);

  const { addPriceReport } = useProductStore();
  const { addPoints } = useUserStore();
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [fadeAnim]);

  const handleSubmit = () => {
    if (!productName || !price || !selectedSupermarket) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber)) {
      Alert.alert('Error', 'El precio debe ser un número válido');
      return;
    }

    setLoading(true);

    // Simulated async save (swap with real service later)
    setTimeout(() => {
      addPriceReport({
        productName: productName.trim(),
        price: priceNumber,
        supermarket: selectedSupermarket!,
        location: location.trim() || 'Ubicación no especificada',
      });

      addPoints(10);
      setLoading(false);
      showToast('¡Reporte enviado! +10 pts');

      setTimeout(() => {
        setProductName('');
        setPrice('');
        setLocation('');
        setSelectedSupermarket(null);
      }, 400);
    }, 700);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-6 pb-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-extrabold text-red-600 mb-1">Reportar Precio</Text>
        <Text className="text-sm text-gray-500 font-medium">Ayuda a la comunidad compartiendo precios</Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 + (insets.bottom || 0) }}>
        <Animated.View style={{ opacity: fadeAnim, paddingTop: insets.top ? insets.top * 0.3 : 6 }} className="py-5">
          <View>
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-800 mb-2">Nombre del Producto *</Text>
              <TextInput className="border border-gray-300 rounded-xl p-4 bg-white text-base text-gray-800" placeholder="Ej: Leche Lider 1L" value={productName} onChangeText={setProductName} placeholderTextColor="#9CA3AF" />
            </View>

            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-800 mb-2">Precio *</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 bg-white h-14">
                <DollarSign size={20} color="#6B7280" />
                <TextInput className="flex-1 text-base ml-3 text-gray-800" placeholder="0" value={price} onChangeText={setPrice} keyboardType="numeric" placeholderTextColor="#9CA3AF" />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-800 mb-2">Supermercado *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mt-2">
                {SUPERMARKETS.map((market) => (
                  <Pressable key={market} onPress={() => setSelectedSupermarket(market)} android_ripple={{ color: '#00000008' }} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.96 : 1 }], marginRight: 12 })}>
                    <View className={`flex-row items-center px-4 py-3 rounded-full ${selectedSupermarket === market ? 'bg-red-600 border-red-600' : 'bg-gray-100 border border-gray-200'}`}>
                      <Store size={16} color={selectedSupermarket === market ? '#FFFFFF' : '#6B7280'} />
                      <Text className={`text-sm font-semibold ml-2 ${selectedSupermarket === market ? 'text-white' : 'text-gray-600'}`}>{market}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-800 mb-2">Ubicación</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 bg-white h-14">
                <MapPin size={20} color="#6B7280" />
                <TextInput className="flex-1 text-base ml-3 text-gray-800" placeholder="Ej: Las Condes, Santiago" value={location} onChangeText={setLocation} placeholderTextColor="#9CA3AF" />
              </View>
            </View>

            <View className="bg-blue-50 rounded-xl p-4 mb-6 border-l-4 border-blue-500">
              <Text className="text-sm text-blue-800 leading-5">💡 Tip: Los precios reportados ayudan a otros usuarios a encontrar las mejores ofertas. Ganas puntos por cada reporte verificado.</Text>
            </View>

            <Pressable onPress={handleSubmit} disabled={loading} android_ripple={{ color: '#00000010' }} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.99 : 1 }] })} className="mt-2">
              <View className={`rounded-xl p-4 items-center ${loading ? 'bg-red-400' : 'bg-red-600'}`}>
                <Text className="text-white text-base font-extrabold">{loading ? 'Enviando...' : 'Reportar Precio'}</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}