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
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-1 items-center justify-center px-8">
        <Text accessibilityRole="header" className="font-display-extrabold text-3xl text-ink">
          {title}
        </Text>
        <Text className="mt-3 text-center font-sans text-base leading-6 text-muted">{description}</Text>
        <Text className="mt-6 font-sans-bold text-sm uppercase tracking-widest text-muted">Próximamente</Text>
      </View>
    </SafeAreaView>
  );
}
