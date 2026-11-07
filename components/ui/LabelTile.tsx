import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
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
        <Image
          source={{ uri: imageUrl }}
          contentFit="contain"
          cachePolicy="disk"
          placeholder={PLACEHOLDER}
          transition={reduceMotion ? 0 : 150}
          recyclingKey={imageUrl}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", padding: 4 }}
        />
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
  const pad = Math.max(6, Math.round(size * 0.09));
  // La palabra más larga cabe en una línea: una marca nunca se parte a media palabra ("Miraflor-es").
  const longest = Math.max(...word.split(/\s+/).map((w) => w.length), 1);
  const head = Math.max(10, Math.min(Math.round(size * 0.2), 28, Math.floor((size - 2 * pad) / (longest * 0.62))));

  return (
    <View {...hidden} className="justify-between overflow-hidden" style={[box, { backgroundColor: tint, padding: pad }]}>
      <Text style={{ fontSize: Math.round(size * 0.3), lineHeight: Math.round(size * 0.36) }}>{emoji}</Text>
      <View>
        <Text
          numberOfLines={2}
          className="font-display-extrabold"
          style={{ color: labelInk, fontSize: head, lineHeight: Math.round(head * 1.08) }}
        >
          {word}
        </Text>
        {size >= 72 && !!foot && (
          <Text numberOfLines={1} className="mt-0.5 font-sans-bold" style={{ color: labelInk, fontSize: 11, lineHeight: 13, opacity: 0.75 }}>
            {foot}
          </Text>
        )}
      </View>
    </View>
  );
}
