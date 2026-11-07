import { Redirect } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  ChainPill,
  Chip,
  EmptyState,
  ErrorState,
  LabelTile,
  LoadingList,
  Notice,
  PriceBlock,
  PriceRow,
  ProductCard,
  SearchField,
  SourceBadge,
} from '@/components/ui';
import { useTheme } from '@/theme/useTheme';
import {
  ALL_SOURCES,
  DEMO_CHAINS,
  DEMO_PHOTO,
  DEMO_PRICES,
  DEMO_PRODUCTS,
  HOUR,
  ago,
  endOfDayInChile,
} from '@/theme/ui-gallery-data';

/**
 * Galería de verificación del Bloque 2: todos los componentes en todos sus estados, con datos de DEMOSTRACIÓN.
 * Solo existe con EXPO_PUBLIC_UI_GALLERY=1 (se inlinea al construir); sin ella redirige a "/".
 */
const ENABLED = process.env.EXPO_PUBLIC_UI_GALLERY === '1';

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <View>
        <Text accessibilityRole="header" className="font-display-extrabold text-xl text-ink">
          {title}
        </Text>
        {!!hint && <Text className="mt-0.5 font-sans text-sm text-muted">{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

const Caption = ({ children }: { children: ReactNode }) => (
  <Text className="font-sans text-xs leading-4 text-muted">{children}</Text>
);

const SWATCHES: { name: string; box: string; text: string }[] = [
  { name: 'bg / ink', box: 'bg-bg border border-line', text: 'text-ink' },
  { name: 'surface / ink', box: 'bg-surface border border-line', text: 'text-ink' },
  { name: 'surface-2 / muted', box: 'bg-surface-2', text: 'text-muted' },
  { name: 'primary / primary-ink', box: 'bg-primary', text: 'text-primary-ink' },
  { name: 'field / field-ink', box: 'bg-field', text: 'text-field-ink' },
  { name: 'accent / accent-ink', box: 'bg-accent', text: 'text-accent-ink' },
  { name: 'save-bg / save', box: 'bg-save-bg', text: 'text-save' },
  { name: 'alert-bg / alert', box: 'bg-alert-bg', text: 'text-alert' },
];

function Gallery() {
  const { scheme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filled, setFilled] = useState('Leche entera');
  const [chip, setChip] = useState<string | null>('Más barato');
  const [loading, setLoading] = useState(false);
  const [pressed, setPressed] = useState(0);

  return (
    <ScrollView
      className="flex-1 bg-bg"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-8 px-4 pb-16"
      contentContainerStyle={{ paddingTop: insets.top + 16 }}>
      <View className="gap-3">
        <Text accessibilityRole="header" className="font-display-extrabold text-3xl text-ink">
          Galería de componentes
        </Text>
        <Notice tone="demo">Demostración: ningún precio, cadena ni persona de esta pantalla es real.</Notice>
        <Caption>{`Esquema activo: ${scheme === 'dark' ? 'oscuro' : 'claro'} (sigue al sistema)`}</Caption>
      </View>

      <Section title="Colores" hint="Cada par es fondo / texto; el lima nunca lleva texto sobre claro.">
        <View className="flex-row flex-wrap gap-2">
          {SWATCHES.map((s) => (
            <View key={s.name} className={`h-16 w-[48.5%] justify-end rounded-xl p-2 ${s.box}`}>
              <Text className={`font-sans-bold text-xs ${s.text}`}>{s.name}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Tipografía">
        <View className="gap-1 rounded-2xl border border-line bg-surface p-4">
          <Text className="font-display-extrabold text-3xl text-ink">Bricolage 800 · $1.234.567</Text>
          <Text className="font-display text-2xl text-ink">Bricolage 700 · Ñandú año</Text>
          <Text className="font-sans-bold text-base text-ink">Hanken 700 · ¿Dónde está más barato?</Text>
          <Text className="font-sans-semibold text-base text-ink">Hanken 600 · Precio web referencial</Text>
          <Text className="font-sans-medium text-base text-ink">Hanken 500 · visto hace 2 h</Text>
          <Text className="font-sans text-base text-muted">Hanken 400 · texto secundario y notas</Text>
        </View>
      </Section>

      <Section title="Button" hint="44 px mínimo. Toca los de abajo: el quinto carga 1,5 s.">
        <View className="gap-2">
          <Button title="Primario" onPress={() => setPressed((n) => n + 1)} />
          <Button title="Acento (lo que gana)" variant="accent" onPress={() => setPressed((n) => n + 1)} />
          <Button title="Secundario" variant="secondary" onPress={() => setPressed((n) => n + 1)} />
          <Button title="Fantasma" variant="ghost" onPress={() => setPressed((n) => n + 1)} />
          <Button
            title={loading ? 'Cargando' : 'Cargar'}
            variant="secondary"
            loading={loading}
            onPress={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1500);
            }}
          />
          <Button title="Con ícono" icon={<Search size={18} color={colors.primaryInk} />} onPress={() => setPressed((n) => n + 1)} />
          <Button title="Deshabilitado" disabled onPress={() => {}} />
        </View>
        <Caption>{`Toques registrados: ${pressed}`}</Caption>
      </Section>

      <Section title="Chip">
        <View className="flex-row flex-wrap gap-2">
          {['Más barato', 'Relevancia', 'Mayor ahorro', 'Solo ofertas'].map((label) => (
            <Chip key={label} label={label} selected={chip === label} onPress={() => setChip(chip === label ? null : label)} />
          ))}
        </View>
      </Section>

      <Section title="SourceBadge" hint="Origen + antigüedad. «recibido» cuando la fecha no es exacta; aviso pasado el plazo.">
        <View className="gap-3 rounded-2xl border border-line bg-surface p-4">
          {ALL_SOURCES.map((source) => (
            <View key={source} className="gap-1">
              <Caption>{`source = ${source}`}</Caption>
              <SourceBadge source={source} seenAt={ago(2 * HOUR)} exact={source !== 'partner'} />
            </View>
          ))}
          <View className="gap-1">
            <Caption>partner, exact = false, hace 2 días (vencido el plazo)</Caption>
            <SourceBadge source="partner" seenAt={ago(48 * HOUR)} exact={false} />
          </View>
          <View className="gap-1">
            <Caption>community, hace 9 días</Caption>
            <SourceBadge source="community" seenAt={ago(9 * 24 * HOUR)} exact />
          </View>
        </View>
      </Section>

      <Section title="PriceBlock" hint="Cifras tabulares, CLP sin decimales, oferta con vigencia.">
        <View className="gap-4 rounded-2xl border border-line bg-surface p-4">
          <View className="gap-1">
            <Caption>sm · simple</Caption>
            <PriceBlock price={1090} />
          </View>
          <View className="gap-1">
            <Caption>sm · con precio por unidad</Caption>
            <PriceBlock price={1090} ppum={1090} ppumUnit="L" />
          </View>
          <View className="gap-1">
            <Caption>sm · rebaja, vence hoy a las 23:59</Caption>
            <PriceBlock price={990} listPrice={1290} ppum={990} ppumUnit="L" promoEndsAt={endOfDayInChile(0)} />
          </View>
          <View className="gap-1">
            <Caption>sm · rebaja, vence mañana</Caption>
            <PriceBlock price={990} listPrice={1290} promoEndsAt={endOfDayInChile(1)} />
          </View>
          <View className="gap-1">
            <Caption>sm · rebaja, vence en 5 días</Caption>
            <PriceBlock price={990} listPrice={1290} promoEndsAt={endOfDayInChile(5)} />
          </View>
          <View className="gap-1">
            <Caption>sm · rebaja sin fecha → «Oferta»</Caption>
            <PriceBlock price={990} listPrice={1290} />
          </View>
          <View className="gap-1">
            <Caption>sm · oferta vencida hace 2 días</Caption>
            <PriceBlock price={990} listPrice={1290} promoEndsAt={ago(48 * HOUR)} />
          </View>
          <View className="gap-1">
            <Caption>lg · $1.234.567</Caption>
            <PriceBlock price={1234567} size="lg" />
          </View>
          <View className="gap-1">
            <Caption>lg · con rebaja y unidad</Caption>
            <PriceBlock price={4990} listPrice={5990} ppum={4990} ppumUnit="kg" promoEndsAt={endOfDayInChile(1)} size="lg" />
          </View>
          <View className="items-end gap-1">
            <Caption>sm · alineado a la derecha</Caption>
            <PriceBlock price={990} listPrice={1290} ppum={990} ppumUnit="L" promoEndsAt={endOfDayInChile(1)} align="right" />
          </View>
        </View>
      </Section>

      <Section title="ChainPill" hint="Color de la API; el texto se calcula por luminancia.">
        <View className="flex-row flex-wrap gap-2">
          {DEMO_CHAINS.map((c) => (
            <ChainPill key={c.name} name={c.name} color={c.color} />
          ))}
        </View>
      </Section>

      <Section title="LabelTile" hint="Con foto (data URI de demostración), sin foto y a varios tamaños.">
        <View className="flex-row flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4">
          <LabelTile product={DEMO_PRODUCTS[0].product} imageUrl={DEMO_PHOTO} size={96} />
          <LabelTile product={DEMO_PRODUCTS[0].product} imageUrl={null} size={96} />
          <LabelTile product={DEMO_PRODUCTS[1].product} imageUrl={null} size={84} />
          <LabelTile product={DEMO_PRODUCTS[3].product} imageUrl={null} size={76} />
          <LabelTile product={DEMO_PRODUCTS[2].product} imageUrl={null} size={64} />
          <LabelTile product={DEMO_PRODUCTS[0].product} imageUrl={null} size={44} />
          <LabelTile product={DEMO_PRODUCTS[0].product} imageUrl="data:image/png;base64,no-es-una-imagen" size={96} />
        </View>
        <Caption>La última tiene una foto rota: cae sola a la etiqueta.</Caption>
      </Section>

      <Section title="ProductCard">
        <View className="gap-3">
          {DEMO_PRODUCTS.map(({ caption, product }) => (
            <View key={product.slug} className="gap-1">
              <Caption>{caption}</Caption>
              <ProductCard product={product} onPress={() => setPressed((n) => n + 1)} />
            </View>
          ))}
        </View>
      </Section>

      <Section title="PriceRow">
        <View className="gap-3">
          {DEMO_PRICES.map(({ caption, entry, cheapest }) => (
            <View key={entry.id} className="gap-1">
              <Caption>{caption}</Caption>
              <PriceRow entry={entry} cheapest={cheapest} onPress={entry.id === 2 ? () => setPressed((n) => n + 1) : undefined} />
            </View>
          ))}
        </View>
      </Section>

      <Section title="SearchField">
        <View className="gap-3">
          <SearchField value={query} onChangeText={setQuery} onSubmit={() => setPressed((n) => n + 1)} onScanPress={() => setPressed((n) => n + 1)} />
          <SearchField value={filled} onChangeText={setFilled} onSubmit={() => setPressed((n) => n + 1)} onScanPress={() => setPressed((n) => n + 1)} />
          <SearchField value="" onChangeText={() => {}} placeholder="Solo el campo" />
        </View>
      </Section>

      <Section title="Notice">
        <View className="gap-2">
          <Notice tone="info">Mismo código de barras en las tiendas.</Notice>
          <Notice tone="warn">Puede no ser idéntico: las cadenas describen distinto este producto (otro tamaño o sabor).</Notice>
          <Notice tone="warn">Sin conexión. Lo que ves puede no estar al día hasta que vuelva la señal.</Notice>
          <Notice tone="demo">Datos de demostración: no son precios reales.</Notice>
        </View>
      </Section>

      <Section title="Estados">
        <View className="gap-4">
          <Caption>LoadingList (2)</Caption>
          <LoadingList count={2} />
          <Caption>ErrorState</Caption>
          <ErrorState message="No pudimos cargar los precios. Revisa tu conexión e inténtalo de nuevo." onRetry={() => setPressed((n) => n + 1)} />
          <Caption>EmptyState</Caption>
          <EmptyState title="No encontramos «leche de demostración»" hint="Prueba con otra palabra o escanea el código de barras del producto." />
        </View>
      </Section>
    </ScrollView>
  );
}

export default function UiGalleryScreen() {
  if (!ENABLED) return <Redirect href="/" />;
  return <Gallery />;
}
