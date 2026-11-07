import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { useReducedMotion } from "@/theme/useReducedMotion";

function Bar({ className }: { className: string }) {
  return <View className={`rounded-md bg-surface-2 ${className}`} />;
}

function SkeletonCard() {
  return (
    <View className="flex-row gap-3 rounded-2xl border border-line bg-surface p-3">
      <View className="h-[84px] w-[84px] rounded-xl bg-surface-2" />
      <View className="flex-1 gap-2 pt-1">
        <Bar className="h-4 w-4/5" />
        <Bar className="h-3.5 w-1/2" />
        <Bar className="mt-2 h-6 w-2/5" />
        <Bar className="h-5 w-3/5" />
      </View>
    </View>
  );
}

/**
 * Esqueleto de la lista de resultados mientras llegan los datos (no un spinner de pantalla completa).
 * Late suave; con "reducir movimiento" queda quieto.
 */
export function LoadingList({ count = 4 }: { count?: number }) {
  const reduceMotion = useReducedMotion();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.5, duration: 800, useNativeDriver: process.env.EXPO_OS !== "web" }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: process.env.EXPO_OS !== "web" }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, pulse]);

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando resultados"
      accessibilityState={{ busy: true }}
      className="gap-3"
      style={{ opacity: pulse }}
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </Animated.View>
  );
}
