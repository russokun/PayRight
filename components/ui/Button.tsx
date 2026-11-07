import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { useTheme } from "@/theme/useTheme";

type Variant = "primary" | "secondary" | "ghost" | "accent";

const VARIANT: Record<Variant, { box: string; text: string; spinner: "primaryInk" | "ink" | "accentInk" }> = {
  primary: { box: "bg-primary active:opacity-80", text: "text-primary-ink", spinner: "primaryInk" },
  secondary: { box: "border border-line bg-surface active:bg-surface-2", text: "text-ink", spinner: "ink" },
  ghost: { box: "bg-transparent active:bg-surface-2", text: "text-ink", spinner: "ink" },
  // La acción principal que "gana" (Ir al más barato): lima con tinta encima, como btnAccent de la web.
  accent: { box: "bg-accent active:opacity-80", text: "text-accent-ink", spinner: "accentInk" },
};

type Props = {
  title: string;
  onPress: () => void;
  /** `accent` se suma a los del contrato: lima + tinta para la acción principal. */
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  accessibilityLabel?: string;
};

/** Botón en píldora de 44 px mínimo. Cargando conserva el título (el ancho no salta) y no responde al toque. */
export function Button({ title, onPress, variant = "primary", loading = false, disabled = false, icon, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const v = VARIANT[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      className={`min-h-11 flex-row items-center justify-center gap-2 rounded-full px-5 py-2.5 ${v.box} ${disabled ? "opacity-50" : ""}`}
    >
      {loading ? <ActivityIndicator size="small" color={colors[v.spinner]} /> : icon}
      <Text className={`font-sans-bold text-base ${v.text}`}>{title}</Text>
    </Pressable>
  );
}
