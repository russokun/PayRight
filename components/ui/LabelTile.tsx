import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { fitLabel } from "@/theme/label-fit";
import { categoryTints, defaultCategoryTint, labelInk } from "@/theme/tokens";
import { useReducedMotion } from "@/theme/useReducedMotion";
import type { ProductDTO } from "@/types/api";

type TileProduct = Pick<ProductDTO, "name" | "brand" | "size" | "emoji" | "category">;

// Placeholder neutro mientras baja la foto (blurhash 1×1 de un gris claro; las fotos van sobre blanco).
const PLACEHOLDER = { blurhash: "00Q]=-" };

/**
 * Foto del producto, o una etiqueta propia cuando no hay foto o no carga: emoji + marca y formato sobre el
 * tinte del departamento. Usa solo datos reales del producto (nunca finge ser una foto) y no depende de las
 * fotos de las cadenas, que pueden estar apagadas (`retailer_content = false`) o caerse. Decorativa: el nombre
 * ya lo dice el texto de al lado.
 */
export function LabelTile({ product, imageUrl, size = 76 }: { product: TileProduct; imageUrl: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const reduceMotion = useReducedMotion();
  useEffect(() => setFailed(false), [imageUrl]);

  const box = { width: size, height: size, borderRadius: Math.min(16, Math.max(8, Math.round(size * 0.16))), borderCurve: "continuous" as const };
  const hidden = { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" as const };

  if (imageUrl && !failed) {
    return (
      <View {...hidden} className="overflow-hidden border border-line bg-photo" style={box}>
        {/* el margen va en un View aparte: expo-image no recorta su contenido con el padding propio */}
        <View className="flex-1 p-1">
          <Image
            source={{ uri: imageUrl }}
            contentFit="contain"
            cachePolicy="disk"
            placeholder={PLACEHOLDER}
            transition={reduceMotion ? 0 : 150}
            recyclingKey={imageUrl}
            onError={() => setFailed(true)}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    );
  }

  const tint = categoryTints[product.category] ?? defaultCategoryTint;
  const emoji = product.emoji || "🛒";

  // Chico (≤ 56): solo el emoji; no cabe una marca legible.
  if (size < 60) {
    return (
      <View {...hidden} className="items-center justify-center" style={[box, { backgroundColor: tint }]}>
        <Text style={{ fontSize: Math.round(size * 0.5), lineHeight: Math.round(size * 0.62) }}>{emoji}</Text>
      </View>
    );
  }

  const loose = !product.brand || product.brand === "Granel";
  const word = (loose ? product.name.split(" ")[0] : product.brand) || product.name;
  const foot = loose ? "a granel" : product.size;
  // La marca se ajusta al recuadro sin partirse a media palabra ("Miraflor-es"); el formato solo si sobra lugar.
  const fit = fitLabel(word, size, size >= 72 && !!foot);

  return (
    <View {...hidden} className="justify-between overflow-hidden" style={[box, { backgroundColor: tint, padding: fit.pad }]}>
      {fit.emoji > 0 ? <Text style={{ fontSize: fit.emoji, lineHeight: Math.round(fit.emoji * 1.2) }}>{emoji}</Text> : <View />}
      <View>
        <Text
          numberOfLines={fit.lines}
          className="font-display-extrabold"
          style={{ color: labelInk, fontSize: fit.head, lineHeight: Math.round(fit.head * 1.08) }}
        >
          {word}
        </Text>
        {fit.foot && (
          <Text numberOfLines={1} className="mt-0.5 font-sans-bold" style={{ color: labelInk, fontSize: 11, lineHeight: 13, opacity: 0.75 }}>
            {foot}
          </Text>
        )}
      </View>
    </View>
  );
}
