import { Text, View } from "react-native";
import { timeAgo } from "@/lib/format";
import type { PriceSourceDTO } from "@/types/api";

/**
 * De dónde sale cada precio (PRODUCT.md, principio 1): siempre visible, con su fecha. Nunca se nombra la fuente
 * asociada: `partner` es "Precio web · referencial". Una sola tabla para que cambiar un rótulo sea cambiar una línea.
 */
const SOURCE: Record<PriceSourceDTO, { label: string; box: string; text: string }> = {
  // La web distingue "Reporte · N de 3" y "Verificado"; la confirmación la muestra PriceRow, que sí la conoce.
  community: { label: "Reporte de la comunidad", box: "border-line bg-surface-2", text: "text-ink" },
  retailer_web: { label: "Precio web", box: "border-line", text: "text-ink" },
  partner: { label: "Precio web · referencial", box: "border-line", text: "text-ink" },
  demo: { label: "Demostración", box: "border-dashed border-muted", text: "text-muted" },
};

export function sourceLabel(source: PriceSourceDTO): string {
  return SOURCE[source].label;
}

const HOUR = 3_600_000;
/** Un precio web cambia en días; uno de la comunidad, en semanas: pasado este tiempo se avisa que pudo cambiar. */
const STALE_AFTER: Record<PriceSourceDTO, number> = {
  community: 7 * 24 * HOUR,
  retailer_web: 36 * HOUR,
  partner: 36 * HOUR,
  demo: Infinity,
};

/** Solo el rótulo del origen (sin fecha), para listas donde la API aún no entrega cuándo se vio. */
export function SourceTag({ source }: { source: PriceSourceDTO }) {
  const s = SOURCE[source];
  return (
    <View className={`self-start rounded-md border px-1.5 py-0.5 ${s.box}`}>
      <Text className={`font-sans-bold text-xs leading-4 ${s.text}`}>{s.label}</Text>
    </View>
  );
}

/**
 * Origen + antigüedad. `exact=false` (fuente asociada: la fecha es cuando PayRight recibió el precio) dice
 * "recibido hace X" en vez de "visto hace X". Pasado el plazo de cada origen se avisa que pudo cambiar (rojo = aviso).
 */
export function SourceBadge({ source, seenAt, exact }: { source: PriceSourceDTO; seenAt: string; exact: boolean }) {
  const age = Date.now() - Date.parse(seenAt);
  const stale = Number.isFinite(age) && age > STALE_AFTER[source];
  const when = `${exact ? "visto" : "recibido"} ${timeAgo(seenAt)}`;
  const note = stale ? " · puede haber cambiado" : "";
  return (
    <View
      accessible
      accessibilityLabel={`${sourceLabel(source)}, ${when}${note}`}
      className="flex-row flex-wrap items-center gap-x-2 gap-y-1"
    >
      <SourceTag source={source} />
      <Text className={`text-xs ${stale ? "font-sans-semibold text-alert" : "font-sans text-muted"}`}>
        {when}
        {note}
      </Text>
    </View>
  );
}
