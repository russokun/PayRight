import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  title: string;
  /** Qué hará esta pantalla (equivalente web), en una frase. */
  description: string;
};

/**
 * Pantalla provisional y honesta: sin datos, sin precios inventados.
 * PRODUCT.md: "La app nunca presenta un dato inventado como real".
 * Se reemplaza bloque a bloque (ver specs/003-mobile-port/plan.md).
 */
export function ComingSoon({ title, description }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF7]" edges={['top']}>
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-3xl font-bold text-[#111410]">{title}</Text>
        <Text className="mt-3 text-center text-base text-[#595E56]">{description}</Text>
        <Text className="mt-6 text-sm font-semibold uppercase tracking-widest text-[#595E56]">
          Próximamente
        </Text>
      </View>
    </SafeAreaView>
  );
}
