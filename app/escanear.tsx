import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { X, Zap, ZapOff } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { gtinValid } from '@/lib/gtin';
import { cleanCode, resolveScan } from '@/lib/scan';
import { useTheme } from '@/theme/useTheme';

type Phase =
  | { kind: 'scanning' }
  | { kind: 'looking'; code: string }
  | { kind: 'not_found'; code: string }
  | { kind: 'error'; code: string; message: string };

const IS_WEB = process.env.EXPO_OS === 'web';
const PRIVACY =
  'La imagen de la cámara se procesa en tu teléfono: no se envía ni se guarda. Solo el número del código llega a PayRight para buscar el producto.';

const buzz = (f: () => Promise<void>) => void f().catch(() => {});

/**
 * Escáner de códigos de barras (EAN-13, EAN-8, UPC-A). Un código cuenta cuando se lee dos veces seguidas y su dígito
 * verificador es correcto, así una lectura borrosa nunca lleva a otro producto. Se procesa uno a la vez.
 */
export default function ScanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>({ kind: 'scanning' });
  const [torch, setTorch] = useState(false);
  const [manualOpen, setManualOpen] = useState(IS_WEB);
  const [manual, setManual] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  const locked = useRef(false);
  const lastRead = useRef('');
  const ignored = useRef<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const lookup = useCallback(
    async (raw: string) => {
      locked.current = true;
      const code = cleanCode(raw);
      abort.current?.abort();
      const ctl = new AbortController();
      abort.current = ctl;
      setManualError(null);
      setPhase({ kind: 'looking', code });
      buzz(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
      try {
        const r = await resolveScan(raw, undefined, { signal: ctl.signal });
        if (r.kind === 'found') {
          buzz(() =>
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
          );
          router.replace({
            pathname: '/producto/[slug]',
            params: { slug: r.slug },
          });
        } else if (r.kind === 'not_found') {
          buzz(() =>
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
          );
          setPhase({ kind: 'not_found', code });
        } else if (r.kind === 'error') {
          setPhase({ kind: 'error', code, message: r.message });
        } else {
          // solo llega desde la entrada a mano: la cámara ya filtra con gtinValid
          locked.current = false;
          setPhase({ kind: 'scanning' });
          setManualError(
            code.length < 8
              ? 'Faltan números: un código de barras tiene 8, 12 o 13 dígitos.'
              : 'Ese número no parece un código de barras completo. Revisa los dígitos.',
          );
        }
      } catch {
        // cancelado (la pantalla se cerró): nada que mostrar
      }
    },
    [router],
  );

  const onScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (locked.current) return;
      const code = cleanCode(data);
      if (!gtinValid(code)) {
        lastRead.current = '';
        return;
      }
      if (code === ignored.current) return; // el envase que ya no estaba: no se vuelve a leer solo
      if (lastRead.current !== code) {
        lastRead.current = code;
        return;
      }
      void lookup(code);
    },
    [lookup],
  );

  const keepScanning = useCallback(() => {
    if (phase.kind === 'not_found' || phase.kind === 'error')
      ignored.current = phase.code;
    lastRead.current = '';
    locked.current = false;
    setPhase({ kind: 'scanning' });
  }, [phase]);

  const submitManual = () => {
    if (locked.current) return;
    void lookup(manual);
  };

  const cameraGranted = !IS_WEB && permission?.granted === true;
  const asking = !IS_WEB && permission === null;

  const manualEntry = (
    <View className="gap-2">
      <Text className="font-sans-bold text-sm text-ink">
        ¿No lo lee? Escribe los números del código
      </Text>
      <View className="flex-row items-center gap-2">
        <TextInput
          value={manual}
          onChangeText={(t) => {
            setManual(t);
            setManualError(null);
          }}
          onSubmitEditing={submitManual}
          inputMode="numeric"
          keyboardType="number-pad"
          returnKeyType="search"
          maxLength={16}
          autoComplete="off"
          placeholder="7801234567890"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Número del código de barras"
          className="min-h-[48px] flex-1 rounded-xl border border-line bg-surface px-4 font-sans-semibold text-base tracking-wider text-ink"
        />
        <Button
          title="Buscar"
          onPress={submitManual}
          disabled={manual.trim().length === 0}
          accessibilityLabel="Buscar este código de barras"
        />
      </View>
      {manualError ? (
        <Text
          accessibilityRole="alert"
          className="font-sans-semibold text-sm text-alert"
        >
          {manualError}
        </Text>
      ) : null}
    </View>
  );

  let panel;
  if (phase.kind === 'looking') {
    panel = (
      <View
        className="flex-row items-center gap-3 py-2"
        accessibilityLiveRegion="polite"
      >
        <ActivityIndicator color={colors.muted} />
        <Text className="flex-1 font-sans-semibold text-base text-ink">
          Buscando el producto…
        </Text>
      </View>
    );
  } else if (phase.kind === 'not_found') {
    panel = (
      <View className="gap-3">
        <Text
          accessibilityRole="header"
          className="font-display-extrabold text-xl text-ink"
        >
          Ese código de barras aún no está en PayRight
        </Text>
        <Text className="font-sans text-sm text-muted">
          Código <Text className="font-sans-bold text-ink">{phase.code}</Text>.
          Puede que ninguna cadena lo venda en su web o que todavía no esté en
          el catálogo. Puedes seguir escaneando o buscarlo por su nombre.
        </Text>
        <View className="flex-row flex-wrap gap-3">
          <Button title="Seguir escaneando" onPress={keepScanning} />
          <Button
            title="Buscar por nombre"
            variant="secondary"
            onPress={() => router.replace('/buscar')}
          />
        </View>
      </View>
    );
  } else if (phase.kind === 'error') {
    panel = (
      <View className="gap-3">
        <Text
          accessibilityRole="header"
          className="font-display-extrabold text-xl text-ink"
        >
          No pudimos consultar el código
        </Text>
        <Text className="font-sans text-sm text-muted">{phase.message}</Text>
        <View className="flex-row flex-wrap gap-3">
          <Button title="Reintentar" onPress={() => void lookup(phase.code)} />
          <Button
            title="Seguir escaneando"
            variant="secondary"
            onPress={keepScanning}
          />
        </View>
      </View>
    );
  } else if (IS_WEB) {
    panel = (
      <View className="gap-3">
        <Text
          accessibilityRole="header"
          className="font-display-extrabold text-xl text-ink"
        >
          Escanea un código de barras
        </Text>
        <Text className="font-sans text-sm text-muted">
          Aquí no hay cámara para escanear: está en la app del teléfono. Puedes
          escribir los números del código.
        </Text>
        {manualEntry}
      </View>
    );
  } else if (asking) {
    panel = (
      <View
        className="items-center py-4"
        accessibilityLabel="Revisando el permiso de la cámara"
      >
        <ActivityIndicator color={colors.muted} />
      </View>
    );
  } else if (!cameraGranted) {
    const blocked = permission?.canAskAgain === false;
    panel = (
      <View className="gap-3">
        <Text
          accessibilityRole="header"
          className="font-display-extrabold text-xl text-ink"
        >
          {blocked
            ? 'PayRight no tiene permiso para usar la cámara'
            : 'Usa la cámara para escanear'}
        </Text>
        <Text className="font-sans text-sm text-muted">
          {blocked
            ? 'Puedes activarla en los ajustes del teléfono, o escribir los números del código aquí abajo.'
            : 'Apunta al código de barras del envase y te mostramos su precio en cada supermercado.'}{' '}
          {PRIVACY}
        </Text>
        {blocked ? (
          <Button
            title="Abrir ajustes"
            onPress={() => void Linking.openSettings()}
          />
        ) : (
          <Button
            title="Permitir la cámara"
            onPress={() => void requestPermission()}
          />
        )}
        {manualEntry}
      </View>
    );
  } else {
    panel = (
      <View className="gap-3">
        <Text className="font-sans-semibold text-base text-ink">
          Apunta la cámara al código de barras del envase.
        </Text>
        {manualOpen ? (
          manualEntry
        ) : (
          <Pressable
            onPress={() => setManualOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Escribir el código de barras a mano"
            className="min-h-[44px] justify-center"
          >
            <Text className="font-sans-bold text-sm text-ink underline">
              ¿No lo lee? Escribe el código
            </Text>
          </Pressable>
        )}
        <Text className="font-sans text-xs text-muted">{PRIVACY}</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${cameraGranted ? 'bg-black' : 'bg-bg'}`}>
      <Stack.Screen
        options={{ presentation: 'fullScreenModal', headerShown: false }}
      />

      {cameraGranted ? (
        <>
          <CameraView
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
            facing="back"
            enableTorch={torch}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a'],
            }}
            onBarcodeScanned={phase.kind === 'scanning' ? onScanned : undefined}
            accessibilityLabel="Cámara para escanear el código de barras"
          />
          {/* la guía: dónde poner el código */}
          <View
            pointerEvents="none"
            className="absolute inset-x-0 items-center"
            style={{ top: '26%' }}
          >
            <View className="h-44 w-[82%] rounded-3xl border-4 border-accent" />
          </View>
        </>
      ) : null}

      <View
        className="absolute inset-x-0 top-0 flex-row items-center justify-between px-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/')
          }
          accessibilityRole="button"
          accessibilityLabel="Cerrar el escáner"
          className="h-11 w-11 items-center justify-center rounded-full bg-black/60 active:opacity-70"
        >
          <X size={22} color="white" />
        </Pressable>
        {cameraGranted ? (
          <Pressable
            onPress={() => setTorch((t) => !t)}
            accessibilityRole="button"
            accessibilityState={{ selected: torch }}
            accessibilityLabel={
              torch ? 'Apagar la linterna' : 'Encender la linterna'
            }
            className={`h-11 w-11 items-center justify-center rounded-full active:opacity-70 ${torch ? 'bg-accent' : 'bg-black/60'}`}
          >
            {torch ? (
              <Zap size={22} color={colors.accentInk} />
            ) : (
              <ZapOff size={22} color="white" />
            )}
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
        className={`flex-1 ${cameraGranted ? 'justify-end' : 'justify-start'}`}
        style={cameraGranted ? undefined : { paddingTop: insets.top + 72 }}
      >
        {/* con cámara, el panel es una hoja al pie sobre la imagen; sin ella, es la pantalla */}
        <View
          className={cameraGranted ? 'rounded-t-3xl bg-bg px-5 pt-5' : 'px-5'}
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {panel}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
