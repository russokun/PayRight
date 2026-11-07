import { Text, View } from "react-native";
import { endsIn, isExpired, money, pct, ppumLabel } from "@/lib/format";
import { tabularNums } from "@/theme/typography";
import { Tag } from "./Tag";

type Props = {
  price: number;
  /** Precio tachado, si la cadena lo muestra. */
  listPrice?: number | null;
  ppum?: number | null;
  ppumUnit?: string | null;
  /** Fin de la oferta (ISO 8601); null si no se sabe. */
  promoEndsAt?: string | null;
  size?: "sm" | "lg";
  /** `right` se suma a los del contrato: precio pegado a la derecha dentro de una fila. */
  align?: "left" | "right";
};

// Bricolage Grotesque ExtraBold. sm = precio de fila (24 px); lg = el de la ficha (48 px), como el brief de la web.
const SCALE = {
  sm: { fontSize: 24, lineHeight: 28, letterSpacing: -0.5 },
  lg: { fontSize: 48, lineHeight: 54, letterSpacing: -1.2 },
};

/** El precio como en una etiqueta de góndola: precio, tachado con su rebaja, precio por unidad y vigencia. */
export function PriceBlock({ price, listPrice, ppum, ppumUnit, promoEndsAt, size = "sm", align = "left" }: Props) {
  const right = align === "right";
  const list = listPrice != null && listPrice > price ? listPrice : null;
  const hasDiscount = list !== null;
  const discount = list !== null ? pct(list, price) : 0;
  const ends = endsIn(promoEndsAt);
  const expired = isExpired(promoEndsAt);
  // La oferta siempre dice hasta cuándo vale si se sabe; sin fecha solo "Oferta"; vencida, se avisa.
  const offer = expired ? "Oferta vencida" : ends ? `Oferta · ${ends}` : hasDiscount ? "Oferta" : null;
  const unit = ppum != null && ppum > 0 ? ppumLabel(ppum, ppumUnit) : null;

  const spoken = [
    money(price),
    list !== null ? `antes ${money(list)}` : null,
    discount >= 1 ? `${discount} por ciento menos` : null,
    unit ? unit.replace(" / ", " por ") : null,
    offer?.replace(" · ", ", "),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <View accessible accessibilityLabel={spoken} className={right ? "items-end" : "items-start"}>
      {/* con el texto del sistema al máximo, una cifra de 48 px no cabría en la pantalla: se limita solo a esta cifra */}
      <Text className="font-display-extrabold text-ink" maxFontSizeMultiplier={1.4} style={[tabularNums, SCALE[size]]}>
        {money(price)}
      </Text>
      {list !== null && (
        <View className="mt-1 flex-row items-center gap-2">
          <Text className="font-sans text-sm text-muted line-through" style={tabularNums}>
            {money(list)}
          </Text>
          {discount >= 1 && <Tag>{`−${discount}%`}</Tag>}
        </View>
      )}
      {right ? (
        <>
          {unit && (
            <Text className="mt-0.5 text-right font-sans-semibold text-[13px] text-muted" style={tabularNums}>
              {unit}
            </Text>
          )}
          {offer && <Text className={`text-right font-sans-semibold text-[13px] ${expired ? "text-alert" : "text-muted"}`}>{offer}</Text>}
        </>
      ) : (
        (unit || offer) && (
          <Text className="mt-0.5 text-[13px]" style={tabularNums}>
            {unit && <Text className="font-sans-semibold text-muted">{unit}</Text>}
            {unit && offer ? <Text className="font-sans text-muted">{" · "}</Text> : null}
            {offer && <Text className={expired ? "font-sans-semibold text-alert" : "font-sans-semibold text-muted"}>{offer}</Text>}
          </Text>
        )
      )}
    </View>
  );
}
