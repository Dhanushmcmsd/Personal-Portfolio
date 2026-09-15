export function subtleHaptic(pattern: number | number[] = 8) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // unsupported
  }
}
