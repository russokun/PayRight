import { CircleAlert, FlaskConical, Info } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";

type Tone = "info" | "warn" | "demo";

// El texto siempre en tinta (contraste alto); el tono lo llevan el fondo y el ícono. `warn` (rojo = aviso) pone el
// ícono en `alert`: en claro `alert` sobre `alert-bg` da 4,4:1, bajo AA para texto corrido.
const TONE: Record<Tone, { box: string; icon: "muted" | "alert"; Icon: typeof Info }> = {
  info: { box: "border-line bg-surface-2", icon: "muted", Icon: Info },
  warn: { box: "border-alert/40 bg-alert-bg", icon: "alert", Icon: CircleAlert },
  demo: { box: "border-dashed border-muted bg-transparent", icon: "muted", Icon: FlaskConical },
};

/**
 * Avisos de honestidad: demostración, "puede no ser idéntico", sin red. `children` es texto (string o <Text>
 * anidados): va dentro de un solo <Text> para que fluya y se lea de corrido.
 */
export function Notice({ tone, children }: { tone: Tone; children: ReactNode }) {
  const { colors } = useTheme();
  const { box, icon, Icon } = TONE[tone];
  return (
    <View accessibilityRole={tone === "warn" ? "alert" : undefined} className={`flex-row items-start gap-3 rounded-xl border px-4 py-3 ${box}`}>
      <View className="pt-0.5">
        <Icon size={18} color={colors[icon]} />
      </View>
      <Text className="min-w-0 flex-1 font-sans-medium text-sm leading-5 text-ink">{children}</Text>
    </View>
  );
}
