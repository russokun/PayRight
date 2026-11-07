import { ScanBarcode, Search, X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useTheme } from "@/theme/useTheme";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  onScanPress?: () => void;
  autoFocus?: boolean;
};

/**
 * Buscador en píldora de 56 px. Lo que gana (buscar) va en lima a la derecha, al alcance del pulgar; el escáner
 * y el borrar son botones de 44 px. Enter del teclado también busca.
 */
export function SearchField({ value, onChangeText, onSubmit, placeholder = "¿Qué producto buscas?", onScanPress, autoFocus }: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      className={`min-h-14 flex-row items-center rounded-full border bg-surface pl-5 pr-1.5 ${focused ? "border-primary" : "border-line"}`}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus={autoFocus}
        accessibilityLabel="Buscar producto"
        className="min-h-14 flex-1 py-3 font-sans-semibold text-base text-ink"
        // En web el navegador dibuja su propio contorno al enfocar; el borde del contenedor ya lo indica.
        style={{ outlineWidth: 0 }}
      />
      {value.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Borrar búsqueda"
          onPress={() => onChangeText("")}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-surface-2"
        >
          <X size={20} color={colors.muted} />
        </Pressable>
      )}
      {onScanPress && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escanear un código de barras"
          onPress={onScanPress}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-surface-2"
        >
          <ScanBarcode size={24} color={colors.muted} />
        </Pressable>
      )}
      {onSubmit && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar"
          onPress={onSubmit}
          className="h-11 w-11 items-center justify-center rounded-full bg-accent active:opacity-80"
        >
          <Search size={22} strokeWidth={2.4} color={colors.accentInk} />
        </Pressable>
      )}
    </View>
  );
}
