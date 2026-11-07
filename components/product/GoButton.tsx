import { Check, ExternalLink } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { Button, ErrorState, Notice } from '@/components/ui';
import { errorMessage } from '@/lib/api/errors';
import { useGo } from '@/lib/api/places-queries';
import { planGo, type GoNotice, type GoPlan } from '@/lib/go';
import { openExternal } from '@/lib/open-external';
import { useTheme } from '@/theme/useTheme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent';

type Props = {
  slug: string;
  /** Cadena elegida: va a esa, sin comparar. Sin ella, a la más barata con stock. */
  chain?: string;
  /** Texto del botón; por defecto «Ir a la tienda». */
  label?: string;
  /** Por defecto `accent` (lima): es la acción que «gana». */
  variant?: Variant;
};

type Phase =
  | { kind: 'idle' }
  | { kind: 'verifying' }
  | { kind: 'error'; message: string }
  | {
      kind: 'ready';
      plan: GoPlan;
      /** Mientras es `true` se espera para abrir la tienda; la persona puede quedarse aquí. */
      opening: boolean;
    };

const ICON: Record<Variant, 'primaryInk' | 'accentInk' | 'ink'> = {
  primary: 'primaryInk',
  accent: 'accentInk',
  secondary: 'ink',
  ghost: 'ink',
};

function NoticeView({ notice }: { notice: GoNotice }) {
  const { colors } = useTheme();
  const body = (
    <>
      <Text className="font-sans-bold">{notice.title}</Text>
      {notice.detail ? `\n${notice.detail}` : ''}
    </>
  );
  if (notice.tone === 'verified') {
    return (
      <View
        accessibilityRole="alert"
        className="flex-row items-start gap-3 rounded-xl border border-save/40 bg-save-bg px-4 py-3"
      >
        <View className="pt-0.5">
          <Check size={18} strokeWidth={3} color={colors.save} />
        </View>
        <Text className="min-w-0 flex-1 font-sans-medium text-sm leading-5 text-ink">
          {body}
        </Text>
      </View>
    );
  }
  return <Notice tone="warn">{body}</Notice>;
}

/**
 * «Ir a la tienda»: relee la tienda en vivo (puede tardar ~12 s: se ve «Verificando el precio…» y se puede cancelar),
 * dice qué encontró (verificado, cambió, no se pudo verificar) y abre la página del producto en la cadena. Nada se
 * abre sin avisar: el aviso se lee unos segundos y la persona puede quedarse aquí. Con lector de pantalla no se abre
 * sola: se toca «Abrir».
 */
export function GoButton({ slug, chain, label, variant = 'accent' }: Props) {
  const { colors } = useTheme();
  const { mutate } = useGo();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const abort = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  // al salir de la pantalla: ni se abre la tienda ni queda la consulta colgada
  useEffect(
    () => () => {
      clearTimer();
      abort.current?.abort();
    },
    [clearTimer],
  );

  // otro producto u otra cadena en el mismo botón: se parte de cero
  useEffect(() => {
    clearTimer();
    abort.current?.abort();
    setPhase({ kind: 'idle' });
  }, [slug, chain, clearTimer]);

  const openStore = useCallback(
    (plan: GoPlan) => {
      clearTimer();
      if (plan.kind !== 'open') return;
      setPhase({ kind: 'ready', plan, opening: false });
      void openExternal(plan.url);
    },
    [clearTimer],
  );

  const start = useCallback(() => {
    clearTimer();
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setPhase({ kind: 'verifying' });
    mutate(
      { slug, chain, signal: ctl.signal },
      {
        onSuccess: (data) => {
          if (ctl.signal.aborted) return;
          const plan = planGo(data, chain);
          AccessibilityInfo.announceForAccessibility?.(plan.notice.title);
          if (plan.kind !== 'open') {
            setPhase({ kind: 'ready', plan, opening: false });
            return;
          }
          void AccessibilityInfo.isScreenReaderEnabled()
            .catch(() => false)
            .then((reader) => {
              if (ctl.signal.aborted) return;
              if (reader) {
                setPhase({ kind: 'ready', plan, opening: false });
                return;
              }
              setPhase({ kind: 'ready', plan, opening: true });
              timer.current = setTimeout(() => openStore(plan), plan.delayMs);
            });
        },
        onError: (e) => {
          if (ctl.signal.aborted) return; // la persona canceló: no es un error
          setPhase({ kind: 'error', message: errorMessage(e) });
        },
      },
    );
  }, [slug, chain, mutate, clearTimer, openStore]);

  const cancel = useCallback(() => {
    clearTimer();
    abort.current?.abort();
    setPhase({ kind: 'idle' });
  }, [clearTimer]);

  const verifying = phase.kind === 'verifying';
  const title = verifying ? 'Verificando el precio…' : (label ?? 'Ir a la tienda');
  const ready = phase.kind === 'ready' ? phase : null;
  const plan = ready?.plan.kind === 'open' ? ready.plan : null;

  return (
    <View className="gap-3">
      <Button
        title={title}
        variant={variant}
        loading={verifying}
        onPress={start}
        accessibilityLabel={
          verifying ? 'Verificando el precio en la tienda' : title
        }
        icon={
          verifying ? undefined : (
            <ExternalLink size={18} strokeWidth={2.4} color={colors[ICON[variant]]} />
          )
        }
      />

      {verifying && (
        <>
          <Text
            accessibilityLiveRegion="polite"
            className="text-center font-sans text-sm leading-5 text-muted"
          >
            Leemos la página de la tienda ahora mismo; puede tardar unos
            segundos.
          </Text>
          <Button title="Cancelar" variant="ghost" onPress={cancel} />
        </>
      )}

      {phase.kind === 'error' && (
        <ErrorState message={phase.message} onRetry={start} />
      )}

      {ready && (
        <View accessibilityLiveRegion="polite" className="gap-3">
          <NoticeView notice={ready.plan.notice} />
          {plan && ready.opening && (
            <View className="items-center gap-1">
              <Text className="text-center font-sans-semibold text-sm text-muted">
                {`Te llevamos a ${plan.chainName} en un momento…`}
              </Text>
              <Button
                title="Quedarme aquí"
                variant="ghost"
                onPress={() => {
                  clearTimer();
                  setPhase({ kind: 'ready', plan, opening: false });
                }}
              />
            </View>
          )}
          {plan && !ready.opening && (
            <Button
              title={`Abrir ${plan.chainName}`}
              variant="secondary"
              onPress={() => openStore(plan)}
              icon={<ExternalLink size={18} strokeWidth={2.4} color={colors.ink} />}
            />
          )}
        </View>
      )}
    </View>
  );
}
