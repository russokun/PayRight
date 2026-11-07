import { useState } from "react";
import { Text, View, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { money } from "@/lib/format";
import { shortDate } from "@/lib/date-label";
import { trendGeometry } from "@/lib/trend";
import { useTheme } from "@/theme/useTheme";
import type { TrendDTO } from "@/types/api";

const HEIGHT = 120;

/** Mínimo y promedio semanal como líneas simples (`react-native-svg`); el mínimo es la línea gruesa. */
export function TrendChart({ trend }: { trend: TrendDTO }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(320);
  const g = trendGeometry(trend.points, width, HEIGHT);
  if (!g) return null;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0 && w !== width) setWidth(w);
  };
  const change =
    g.delta === 0 ? "Sin cambios en el mínimo" : `${g.delta > 0 ? "Subió" : "Bajó"} ${money(Math.abs(g.delta))} el mínimo`;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Precio mínimo semanal: de ${money(g.first.min)} el ${shortDate(g.first.week_start)} a ${money(g.last.min)} el ${shortDate(g.last.week_start)}. ${change}.`}
    >
      <View onLayout={onLayout}>
        <Svg width={width} height={HEIGHT}>
          <Path d={g.avgPath} fill="none" stroke={colors.muted} strokeWidth={2} strokeDasharray="4 4" />
          <Path d={g.minPath} fill="none" stroke={colors.primary} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          {g.dots.map((d, i) => (
            <Circle key={i} cx={d.x} cy={d.y} r={d.last ? 5 : 3} fill={colors.primary} />
          ))}
        </Svg>
      </View>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="font-sans-semibold text-xs text-muted">
          {shortDate(g.first.week_start)} → {shortDate(g.last.week_start)}
        </Text>
        <Text className={`font-sans-bold text-xs ${g.delta > 0 ? "text-alert" : g.delta < 0 ? "text-save" : "text-muted"}`}>{change}</Text>
      </View>
      <View className="mt-1 flex-row items-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="h-[3px] w-4 rounded-full bg-primary" />
          <Text className="font-sans text-xs text-muted">Mínimo</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-[2px] w-4 rounded-full bg-muted" />
          <Text className="font-sans text-xs text-muted">Promedio</Text>
        </View>
      </View>
    </View>
  );
}
