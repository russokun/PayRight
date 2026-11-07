import { Fragment, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Button, ChainPill, ErrorState } from "@/components/ui";
import { errorMessage } from "@/lib/api/errors";
import { useListings } from "@/lib/api/queries";
import { timeAgo } from "@/lib/format";
import { availabilityLabel, extraSpecs, htmlToText, listingHasContent, ratingLabel, sentence } from "@/lib/product-view";
import { openExternal } from "@/lib/open-external";
import { useTheme } from "@/theme/useTheme";
import type { ListingDTO, SectionDTO } from "@/types/api";

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 border-b border-line py-2">
      <Text className="flex-1 font-sans text-sm text-muted">{label}</Text>
      <Text selectable className="flex-1 text-right font-sans-semibold text-sm text-ink">
        {value}
      </Text>
    </View>
  );
}

function Section({ section }: { section: SectionDTO }) {
  return (
    <View className="gap-1">
      <Text accessibilityRole="header" className="font-sans-bold text-sm text-ink">
        {section.title}
      </Text>
      {section.paragraphs.map((p, i) => (
        <Text key={i} selectable className="font-sans text-sm leading-5 text-muted">
          {sentence(p)}
        </Text>
      ))}
      {section.facts.map((f, i) => (
        <FactRow key={`${f.label}-${i}`} label={f.label} value={f.value} />
      ))}
      {section.table ? (
        <View className="mt-1 overflow-hidden rounded-xl border border-line">
          <View className="flex-row bg-surface-2 px-3 py-2">
            {section.table.head.map((h, i) => (
              <Text key={i} className={`flex-1 font-sans-bold text-xs text-muted ${i > 0 ? "text-right" : ""}`}>
                {h}
              </Text>
            ))}
          </View>
          {section.table.rows.map((row, ri) => (
            <View key={ri} className="flex-row border-t border-line px-3 py-2">
              {row.map((cell, ci) => (
                <Text
                  key={ci}
                  className={`flex-1 text-sm ${ci === 0 ? "font-sans-semibold text-ink" : "text-right font-sans text-muted"}`}
                >
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ListingCard({ listing: l, contentOff }: { listing: ListingDTO; contentOff: boolean }) {
  const hasContent = listingHasContent(l);
  const availability = availabilityLabel(l.availability);
  const rating = ratingLabel(l.rating, l.review_count);
  return (
    <View className="gap-3 rounded-2xl border border-line bg-surface p-4">
      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <ChainPill name={l.chain.name} color={l.chain.color} />
        {availability ? <Text className="font-sans-semibold text-sm text-muted">{availability}</Text> : null}
        {rating ? <Text className="font-sans-semibold text-sm text-muted">{rating}</Text> : null}
      </View>

      {hasContent ? (
        <>
          {l.description ? (
            <Text selectable className="font-sans text-sm leading-5 text-muted">
              {htmlToText(l.description)}
            </Text>
          ) : null}
          {l.categories.length > 0 ? (
            <Text className="font-sans text-xs text-muted">{l.categories.map(sentence).join(" › ")}</Text>
          ) : null}
          {extraSpecs(l).map(([k, v]) => (
            <FactRow key={k} label={k} value={v} />
          ))}
          {l.sections.map((s, i) => (
            <Section key={`${s.title}-${i}`} section={s} />
          ))}
          <Text className="font-sans text-xs text-muted">
            Fuente: ficha de {l.chain.name}
            {l.detail_at ? `, leída ${timeAgo(l.detail_at)}` : ""}.
          </Text>
        </>
      ) : (
        <Text className="font-sans text-sm text-muted">
          {contentOff
            ? "PayRight no muestra el contenido de las fichas de las cadenas en esta versión."
            : `${l.chain.name} no publica una ficha que podamos leer para este producto.`}{" "}
          Su precio está en la comparación y su web, a un toque.
        </Text>
      )}

      <View className="items-start">
        <Button
          title={`Abrir en ${l.chain.name}`}
          variant="secondary"
          onPress={() => openExternal(l.url)}
          accessibilityLabel={`Abrir la ficha de ${l.chain.name} en el navegador`}
        />
      </View>
    </View>
  );
}

/**
 * "Detalle por cadena": lo que dice la página de cada cadena. Pesado, así que no se pide hasta que la persona
 * lo abre. Con `retailer_content = false` la API entrega fichas vacías y aquí se dice, no se rellena.
 */
export function ListingDetails({ slug, contentOff }: { slug: string; contentOff: boolean }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const { data, isPending, isError, error, refetch } = useListings(slug, open);

  return (
    <View className="gap-3">
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Detalle por cadena, ${open ? "abierto" : "cerrado"}`}
        className="min-h-[52px] flex-row items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 active:opacity-70"
      >
        <View className="flex-1">
          <Text className="font-display-extrabold text-lg text-ink">Detalle por cadena</Text>
          <Text className="font-sans text-sm text-muted">Descripción, ingredientes y tabla nutricional que publica cada cadena.</Text>
        </View>
        <Text className="font-sans-bold text-xl text-muted">{open ? "⌃" : "⌄"}</Text>
      </Pressable>

      {open ? (
        data ? (
          data.length > 0 ? (
            <Fragment>
              {data.map((l) => (
                <ListingCard key={`${l.chain.slug}-${l.url}`} listing={l} contentOff={contentOff} />
              ))}
            </Fragment>
          ) : (
            <View className="rounded-2xl border border-line bg-surface p-4">
              <Text className="font-sans text-sm text-muted">
                {contentOff
                  ? "PayRight no muestra las fichas de las cadenas en esta versión."
                  : "Ninguna cadena publica una ficha que podamos leer para este producto."}
              </Text>
            </View>
          )
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        ) : isPending ? (
          <View className="items-center py-6" accessibilityLabel="Cargando las fichas de las cadenas">
            <ActivityIndicator color={colors.muted} />
          </View>
        ) : null
      ) : null}
    </View>
  );
}
