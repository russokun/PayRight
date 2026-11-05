import { create } from 'zustand';

/**
 * Estado de sesión. La app se usa SIN cuenta (igual que la web): no hay muro de login.
 * El Bloque 6 lo conecta a la API (token Bearer en expo-secure-store).
 */
interface AuthStore {
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthStore>(() => ({
  isAuthenticated: false,
}));
