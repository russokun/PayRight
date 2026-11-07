import { useSyncExternalStore } from "react";
import { AccessibilityInfo } from "react-native";

// Un solo oyente para toda la app (cada LabelTile lo consulta): se conecta la primera vez que alguien lo usa.
let reduced = false;
let started = false;
const listeners = new Set<() => void>();

function set(value: boolean) {
  if (value === reduced) return;
  reduced = value;
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  AccessibilityInfo.isReduceMotionEnabled().then(set).catch(() => {});
  AccessibilityInfo.addEventListener("reduceMotionChanged", set);
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** `true` cuando la persona pidió reducir el movimiento en el sistema. Todo lo que se anime debe respetarlo. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => reduced, () => false);
}
