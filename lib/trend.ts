import type { TrendPointDTO } from "@/types/api";

export type TrendGeometry = {
  width: number;
  height: number;
  minPath: string;
  avgPath: string;
  /** Posición de cada punto del mínimo, para dibujar los círculos. */
  dots: { x: number; y: number; last: boolean }[];
  first: TrendPointDTO;
  last: TrendPointDTO;
  /** Último mínimo menos el primero: negativo = bajó. */
  delta: number;
};

/** Geometría de la tendencia semanal (mínimo y promedio) en un área `width × height`. Con menos de 2 puntos no hay gráfico. */
export function trendGeometry(points: TrendPointDTO[], width = 320, height = 120): TrendGeometry | null {
  if (points.length < 2) return null;
  const padX = 10;
  const padY = 14;
  const values = points.flatMap((p) => [p.min, p.avg]);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(hi - lo, 1);
  const x = (i: number) => padX + (i / (points.length - 1)) * (width - padX * 2);
  const y = (v: number) => padY + (1 - (v - lo) / span) * (height - padY * 2);
  const path = (key: "min" | "avg") =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  return {
    width,
    height,
    minPath: path("min"),
    avgPath: path("avg"),
    dots: points.map((p, i) => ({ x: x(i), y: y(p.min), last: i === points.length - 1 })),
    first,
    last,
    delta: last.min - first.min,
  };
}
