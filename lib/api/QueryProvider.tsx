import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { retryDelay, shouldRetry } from './retry';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay,
        // se vuelve a pedir lo viejo al volver a la app, pero no al cambiar de pantalla
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
      },
    },
  });
}

/**
 * Conecta TanStack Query: un solo cliente por sesión y "foco" = app en primer plano (en nativo no existe
 * `window.focus`). El integrador lo monta una vez en `app/_layout.tsx`.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (state) =>
      focusManager.setFocused(state === 'active'),
    );
    return () => sub.remove();
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
