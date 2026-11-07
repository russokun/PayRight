import * as Haptics from 'expo-haptics';

/** Toque ligero al agregar o cambiar una cantidad. Nada en web, y si el dispositivo no vibra no pasa nada. */
export function tapHaptic(): void {
  if (process.env.EXPO_OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
